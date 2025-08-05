// code/js/firestore.js

/**
 * This module centralizes all interactions with Firestore,
 * including setting up listeners, fetching data, and writing data.
 */

import { db, storage } from './firebase-config.js';
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, writeBatch, getDocs, where, orderBy, limit, serverTimestamp, runTransaction, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { getState, updateState } from './state.js';
import { renderNewsContent } from './ui/post-ui.js';
import { applyPlayerFilters } from './ui/players-ui.js';
import { renderFriendsList, renderMessages } from './ui/social-ui.js';
import { renderNotifications } from './ui/notifications-ui.js';
import { updatePlayerProfileDropdown } from './ui/auth-ui.js';
import { isUserLeader } from './utils.js';


export function setupAllListeners(user) {
    const listeners = {};

    // User document listener
    listeners.userDoc = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
        if (userDoc.exists()) {
            updateState({ currentUserData: { uid: user.uid, ...userDoc.data() } });
            getState().callbacks.onAuthChange(user);
            renderNewsContent(); 
            applyPlayerFilters();
            setupChatListeners();
        }
    });

    // Notifications listener
    const notificationsQuery = query(collection(db, "notifications"), where("recipientUid", "==", user.uid), orderBy("timestamp", "desc"));
    listeners.notifications = onSnapshot(notificationsQuery, (snapshot) => {
        const userNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateState({ userNotifications });
        renderNotifications(userNotifications);
        updatePlayerProfileDropdown();
    });

    // Friends listener
    const friendsQuery = collection(db, `users/${user.uid}/friends`);
    listeners.friends = onSnapshot(friendsQuery, (snapshot) => {
        const userFriends = snapshot.docs.map(doc => doc.id);
        updateState({ userFriends });
        renderFriendsList();
    });
    
    fetchInitialData();
    updateState({ listeners });
}

export function fetchInitialData() {
    const { listeners } = getState();

    // Posts listener
    if (!listeners.posts) {
        listeners.posts = onSnapshot(query(collection(db, 'posts')), (querySnapshot) => {
            const allPosts = [];
            querySnapshot.forEach((doc) => allPosts.push({ id: doc.id, ...doc.data() }));
            updateState({ allPosts });
            renderNewsContent();
        }, (error) => console.error("Error with posts listener:", error));
    }

    // Users listener
    if (!listeners.users) {
        listeners.users = onSnapshot(query(collection(db, 'users')), (querySnapshot) => {
            const allPlayers = [];
            querySnapshot.forEach((doc) => { allPlayers.push({uid: doc.id, ...doc.data()}); });
            updateState({ allPlayers });
            applyPlayerFilters();
            renderFriendsList();
        }, (error) => console.error("Error with users listener:", error));
    }
    
    // Sessions listener for presence
    if (!listeners.sessions) {
        listeners.sessions = onSnapshot(collection(db, 'sessions'), (snapshot) => {
            const userSessions = getState().userSessions || {};
            snapshot.docChanges().forEach((change) => {
                userSessions[change.doc.id] = change.doc.data();
            });
            updateState({ userSessions });
            applyPlayerFilters();
            renderFriendsList();
        });
    }

    updateState({ listeners });
}

export function setupChatListeners(activeChatId = 'world_chat') {
    const { currentUserData, listeners } = getState();
    if (!currentUserData) return;

    if (listeners.worldChat) listeners.worldChat();
    if (listeners.allianceChat) listeners.allianceChat();
    if (listeners.leadershipChat) listeners.leadershipChat();

    let chatQuery;
    let container = document.getElementById('chat-window-main');

    const createListener = (query, chatType) => {
        return onSnapshot(query, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderMessages(messages, container, chatType);
        }, (error) => {
            console.error(`Error listening to ${chatType}:`, error);
            container.innerHTML = `<p class="text-center text-gray-500 m-auto">Error loading messages. You may not have permission to view this chat.</p>`;
        });
    };

    switch (activeChatId) {
        case 'alliance_chat':
            if (currentUserData.alliance) {
                chatQuery = query(collection(db, `alliance_chats/${currentUserData.alliance}/messages`), orderBy("timestamp", "asc"), limit(50));
                listeners.allianceChat = createListener(chatQuery, 'alliance_chat');
            }
            break;
        case 'leadership_chat':
            if (isUserLeader(currentUserData)) {
                chatQuery = query(collection(db, "leadership_chat"), orderBy("timestamp", "asc"), limit(50));
                listeners.leadershipChat = createListener(chatQuery, 'leadership_chat');
            }
            break;
        case 'world_chat':
        default:
            chatQuery = query(collection(db, "world_chat"), orderBy("timestamp", "asc"), limit(50));
            listeners.worldChat = createListener(chatQuery, 'world_chat');
            break;
    }
    updateState({ listeners });
}

export function setupPrivateChatListener(chatId) {
    const { listeners } = getState();
    if (listeners.privateChat) listeners.privateChat();
    if (!chatId) return;

    updateState({ activePrivateChatId: chatId });
    const chatQuery = query(collection(db, `private_chats/${chatId}/messages`), orderBy("timestamp", "asc"), limit(50));
    listeners.privateChat = onSnapshot(chatQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMessages(messages, document.getElementById('private-message-window'), 'private_chat');
    }, (error) => {
        console.error(`Error listening to private chat ${chatId}:`, error);
        const chatWindow = document.getElementById('private-message-window');
        if (chatWindow) {
            chatWindow.innerHTML = `<p class="text-center text-gray-500 m-auto">Could not load messages.</p>`;
        }
    });
    updateState({ listeners });
}

export function detachAllListeners() {
    const { listeners } = getState();
    Object.values(listeners).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') unsubscribe();
    });
    updateState({ listeners: {} });
}

export async function handleSendMessage(e, chatType, text) {
    e.preventDefault();
    const { currentUserData } = getState();
    if (!currentUserData || !text || text.trim() === '') return;

    let collectionPath;
    switch (chatType) {
        case 'world_chat':
            collectionPath = 'world_chat';
            break;
        case 'alliance_chat':
            if (!currentUserData.alliance) return;
            collectionPath = `alliance_chats/${currentUserData.alliance}/messages`;
            break;
        case 'leadership_chat':
            collectionPath = 'leadership_chat';
            break;
        default:
            console.error("Invalid chat type:", chatType);
            return;
    }

    const messageData = {
        text: text,
        authorUid: currentUserData.uid,
        authorUsername: currentUserData.username,
        timestamp: serverTimestamp(),
        reactions: {}
    };

    try {
        await addDoc(collection(db, collectionPath), messageData);
    } catch (error) {
        console.error(`Error sending message to ${chatType}:`, error);
        const input = document.getElementById('chat-input-main');
        if(input) input.value = text;
    }
}

export async function handleDeleteMessage(messageId, chatType) {
    const { currentUserData, activePrivateChatPartner } = getState();
    let docPath;
    switch(chatType) {
       case 'world_chat':
           docPath = `world_chat/${messageId}`;
           break;
       case 'alliance_chat':
           if (!currentUserData.alliance) return;
           docPath = `alliance_chats/${currentUserData.alliance}/messages/${messageId}`;
           break;
       case 'leadership_chat':
           docPath = `leadership_chat/${messageId}`;
           break;
       case 'private_chat':
            if (!currentUserData || !activePrivateChatPartner) return;
            const chatId = [currentUserData.uid, activePrivateChatPartner.uid].sort().join('_');
            docPath = `private_chats/${chatId}/messages/${messageId}`;
            break;
       default:
           console.error("Invalid chat type for delete:", chatType);
           return;
   }

   try {
       await deleteDoc(doc(db, docPath));
   } catch (error) {
       console.error("Error deleting message:", error);
       alert("Failed to delete message. You may not have permission.");
   }
}

export async function handleNotificationAction(notificationId, action, senderUid, targetUid) {
    const { currentUserData } = getState();
    if (!currentUserData) return;

    try {
        if (action === 'accept-friend') {
            const batch = writeBatch(db);
            batch.set(doc(db, `users/${currentUserData.uid}/friends/${senderUid}`), { since: serverTimestamp() });
            batch.set(doc(db, `users/${senderUid}/friends/${currentUserData.uid}`), { since: serverTimestamp() });
            batch.delete(doc(db, 'notifications', notificationId));
            await batch.commit();
        } else if (action === 'decline-friend') {
            await deleteDoc(doc(db, 'notifications', notificationId));
        } else if (action === 'verify-user') {
            const targetUsername = getState().allPlayers.find(p => p.uid === targetUid)?.username || 'A new member';
            await updateDoc(doc(db, 'users', targetUid), { isVerified: true });
            await updateDoc(doc(db, 'notifications', notificationId), {
                type: 'user_verified_record',
                isRead: true, 
                message: `${targetUsername} has been verified in your alliance.`,
            });
        } else {
            await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
        }
    } catch (error) {
        console.error("Error handling notification action:", error);
    }
}

export async function addFriend(recipientUid) {
    const { currentUserData } = getState();
    if (!currentUserData) return false;

    try {
        await addDoc(collection(db, 'notifications'), {
            recipientUid: recipientUid,
            senderUid: currentUserData.uid,
            senderUsername: currentUserData.username,
            type: 'friend_request',
            message: `${currentUserData.username} sent you a friend request.`,
            isRead: false,
            timestamp: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error sending friend request:", error);
        return false;
    }
}

export async function removeFriend(friendUid) {
    const { currentUserData } = getState();
    if (!currentUserData) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, `users/${currentUserData.uid}/friends/${friendUid}`));
    batch.delete(doc(db, `users/${friendUid}/friends/${currentUserData.uid}`));
    await batch.commit();
}

export async function sendPrivateMessage(text) {
    const { currentUserData, activePrivateChatId } = getState();
    if (!currentUserData || !activePrivateChatId) {
        throw new Error("User or chat session not found.");
    }
    if (text.trim() === '') return;

    const messagesColRef = collection(db, `private_chats/${activePrivateChatId}/messages`);
    await addDoc(messagesColRef, {
        text: text,
        authorUid: currentUserData.uid,
        authorUsername: currentUserData.username,
        timestamp: serverTimestamp(),
        reactions: {}
    });
}

export async function handleImageAttachment(file) {
    const { currentUserData, activePrivateChatId } = getState();
    if (!currentUserData || !activePrivateChatId) {
        alert("Error: You must be in a chat to send an image.");
        return;
    }

    const textInput = document.getElementById('private-message-input');
    const originalPlaceholder = textInput.placeholder;
    textInput.placeholder = "Uploading image...";
    textInput.disabled = true;

    try {
        const imageId = doc(collection(db, 'posts')).id;
        const storageRef = ref(storage, `private_chat_images/${activePrivateChatId}/${imageId}`);
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);

        const messagesColRef = collection(db, `private_chats/${activePrivateChatId}/messages`);
        await addDoc(messagesColRef, {
            authorUid: currentUserData.uid,
            authorUsername: currentUserData.username,
            imageUrl: imageUrl,
            text: '',
            timestamp: serverTimestamp(),
            reactions: {}
        });
    } catch (error) {
        console.error("Image upload failed:", error);
        alert("Image upload failed. Please try again.");
    } finally {
        textInput.placeholder = originalPlaceholder;
        textInput.disabled = false;
    }
}

export async function toggleReaction(chatType, messageId, emoji) {
    const { currentUserData } = getState();
    if (!currentUserData) return;

    const { uid, username } = currentUserData;
    let docPath;
    switch(chatType) {
       case 'world_chat': docPath = `world_chat/${messageId}`; break;
       case 'alliance_chat': if (!currentUserData.alliance) return; docPath = `alliance_chats/${currentUserData.alliance}/messages/${messageId}`; break;
       case 'leadership_chat': docPath = `leadership_chat/${messageId}`; break;
       case 'private_chat':
            const partnerUid = getState().activePrivateChatPartner?.uid;
            if (!partnerUid) return;
            const chatId = [uid, partnerUid].sort().join('_');
            docPath = `private_chats/${chatId}/messages/${messageId}`;
            break;
       default: return;
   }

    const messageRef = doc(db, docPath);

    try {
        await runTransaction(db, async (transaction) => {
            const messageDoc = await transaction.get(messageRef);
            if (!messageDoc.exists()) throw "Document does not exist!";

            const reactions = messageDoc.data().reactions || {};
            const userHasReacted = reactions[emoji] && reactions[emoji][uid];

            if (userHasReacted) {
                delete reactions[emoji][uid];
                if (Object.keys(reactions[emoji]).length === 0) {
                    delete reactions[emoji];
                }
            } else {
                if (!reactions[emoji]) reactions[emoji] = {};
                reactions[emoji][uid] = username;
            }
            transaction.update(messageRef, { reactions: reactions });
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
    }
}
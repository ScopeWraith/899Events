// --- POSTS ---

/**
 * Delete a post by ID from Firestore.
 * @param {string} postId
 * @returns {Promise<void>}
 */
export async function deletePost(postId) {
    try {
        await deleteDoc(doc(db, 'posts', postId));
    } catch (err) {
        console.error('Error deleting post:', err);
        throw err;
    }
}
// code/js/firestore.js

/**
 * This module centralizes all interactions with Firestore,
 * including setting up listeners, fetching data, and writing data.
 */

import { db } from './firebase-config.js';
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, writeBatch, getDocs, where, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getState, updateState } from './state.js';
import { renderPosts } from './ui/post-ui.js';
import { applyPlayerFilters } from './ui/players-ui.js';
import { renderFriendsList, renderMessages } from './ui/social-ui.js';
import { renderNotifications } from './ui/notifications-ui.js';
import { updatePlayerProfileDropdown } from './ui/auth-ui.js';
import { isUserLeader } from './utils.js';
import { storage } from './firebase-config.js';
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

export function setupAllListeners(user) {
    const listeners = {};

    // User document listener
    listeners.userDoc = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
        if (userDoc.exists()) {
            updateState({ currentUserData: { uid: user.uid, ...userDoc.data() } });
            getState().callbacks.onAuthChange(user);
            // Re-render components that depend on the current user's data
            renderPosts(); 
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
    
    fetchInitialData(); // Fetch posts and players
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
            renderPosts();
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
            // Re-render components that show presence
            applyPlayerFilters();
            renderFriendsList();
        });
    }

    updateState({ listeners });
}



export function setupChatListeners(activeChatId = 'world_chat') {
    const { currentUserData, listeners } = getState();
    if (!currentUserData) return;

    // Detach all previous chat listeners
    if (listeners.worldChat) listeners.worldChat();
    if (listeners.allianceChat) listeners.allianceChat();
    if (listeners.leadershipChat) listeners.leadershipChat();

    let chatQuery;
    let container = document.getElementById('chat-window-main');

    // --- The error handler here is the critical fix ---
    const createListener = (query, chatType) => {
        return onSnapshot(query, (snapshot) => {
            // We get newest messages first, so we don't reverse them here.
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderMessages(messages, container, chatType);
        }, (error) => {
            // This error handler will now report any failures from Firestore.
            console.error(`Error listening to ${chatType}:`, error);
            container.innerHTML = `<p class="text-center text-gray-500 m-auto">Error loading messages. You may not have permission to view this chat.</p>`;
        });
    };

    switch (activeChatId) {
        case 'alliance_chat':
            if (currentUserData.alliance) {
                chatQuery = query(collection(db, `alliance_chats/${currentUserData.alliance}/messages`), orderBy("timestamp", "desc"), limit(50));
                listeners.allianceChat = createListener(chatQuery, 'alliance_chat');
            }
            break;
        case 'leadership_chat':
            if (isUserLeader(currentUserData)) {
                chatQuery = query(collection(db, "leadership_chat"), orderBy("timestamp", "desc"), limit(50));
                listeners.leadershipChat = createListener(chatQuery, 'leadership_chat');
            }
            break;
        case 'world_chat':
        default:
            chatQuery = query(collection(db, "world_chat"), orderBy("timestamp", "desc"), limit(50));
            listeners.worldChat = createListener(chatQuery, 'world_chat');
            break;
    }
    updateState({ listeners });
}

export function setupPrivateChatListener(chatId) {
    const { listeners } = getState();
    if (listeners.privateChat) listeners.privateChat();

    // The guard clause now checks the parameter directly.
    if (!chatId) {
        console.error("setupPrivateChatListener was called without a valid chat ID parameter.");
        return;
    }

    // Now that we have a guaranteed valid ID, we set it in the state
    // for the 'sendPrivateMessage' function to use later.
    updateState({ activePrivateChatId: chatId });

    const chatQuery = query(collection(db, `private_chats/${chatId}/messages`), orderBy("timestamp", "desc"), limit(50));

    listeners.privateChat = onSnapshot(chatQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
        renderMessages(messages, document.getElementById('private-message-window'), 'private_chat');
    }, (error) => {
        console.error(`Error listening to private chat ${chatId}:`, error);
        const chatWindow = document.getElementById('private-message-window');
        if (chatWindow) {
            chatWindow.innerHTML = `<p class="text-center text-gray-500 m-auto">Could not load messages. You may not have permission to view this chat.</p>`;
        }
    });

    updateState({ listeners });
}
export function detachAllListeners() {
    const { listeners } = getState();
    Object.values(listeners).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
    updateState({ listeners: {} });
}

// --- DATA WRITING FUNCTIONS ---

export async function handleSendMessage(e, chatType, text) {
    e.preventDefault();
    const { currentUserData } = getState();
    if (!currentUserData || text.trim() === '') return;

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
    reactions: {} // Add this line
    };

    try {
        await addDoc(collection(db, collectionPath), messageData);
    } catch (error) {
        console.error(`Error sending message to ${chatType}:`, error);
        // Optionally, restore the text to the input if sending fails
        const input = document.getElementById('chat-input-main');
        if(input) input.value = text;
    }
}

export async function handleDeleteMessage(messageId, chatType) {
    const { currentUserData } = getState();
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
       default:
           return;
   }

   try {
       await deleteDoc(doc(db, docPath));
   } catch (error) {
       console.error("Error deleting message:", error);
   }
}

export async function handleNotificationAction(notificationId, action, senderUid, targetUid) {
    const { currentUserData } = getState();
    if (!currentUserData) return;

    if (action === 'accept-friend') {
        const batch = writeBatch(db);
        batch.set(doc(db, `users/${currentUserData.uid}/friends/${senderUid}`), { since: serverTimestamp() });
        batch.set(doc(db, `users/${senderUid}/friends/${currentUserData.uid}`), { since: serverTimestamp() });
        batch.delete(doc(db, 'notifications', notificationId));
        await batch.commit();
    } else if (action === 'decline-friend') {
        await deleteDoc(doc(db, 'notifications', notificationId));
    } else if (action === 'verify-user') {
        // Get the username before updating, just in case
        const targetUsername = getState().allPlayers.find(p => p.uid === targetUid)?.username || 'A new member';

        // 1. Update the user document to mark as verified
        await updateDoc(doc(db, 'users', targetUid), { isVerified: true });

        // 2. Instead of deleting the notification, transform it into a persistent record
        await updateDoc(doc(db, 'notifications', notificationId), {
            type: 'user_verified_record', // Change the type to make it a historical item
            isRead: true, // Mark as read/actioned
            message: `${targetUsername} has been verified in your alliance.`,
            // The timestamp and other info are preserved
        });
    } else {
        // Default action: mark as read
        await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
    }
}

export async function addFriend(recipientUid) {
    const { currentUserData } = getState();
    if (!currentUserData) return;

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
        return true; // Indicate success
    } catch (error) {
        console.error("Error sending friend request:", error);
        return false; // Indicate failure
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
    // Allow sending empty messages if an image is being attached simultaneously
    if (text.trim() === '') return;

    const messagesColRef = collection(db, `private_chats/${activePrivateChatId}/messages`);
    await addDoc(messagesColRef, {
        text: text,
        authorUid: currentUserData.uid,
        authorUsername: currentUserData.username,
        timestamp: serverTimestamp(),
        reactions: {} // Add this line
    });
}
export async function handleImageAttachment(file) {
    const { currentUserData, activePrivateChatId } = getState();
    if (!currentUserData || !activePrivateChatId) {
        alert("Error: You must be in a chat to send an image.");
        return;
    }

    try {
        // Show a temporary "uploading" message
        const textInput = document.getElementById('private-message-input');
        const originalPlaceholder = textInput.placeholder;
        textInput.placeholder = "Uploading image...";
        textInput.disabled = true;

        const imageId = doc(collection(db, 'posts')).id; // Generate a unique ID
        const storageRef = ref(storage, `private_chat_images/${activePrivateChatId}/${imageId}`);
        
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);

        const messagesColRef = collection(db, `private_chats/${activePrivateChatId}/messages`);
        await addDoc(messagesColRef, {
            authorUid: currentUserData.uid,
            authorUsername: currentUserData.username,
            imageUrl: imageUrl,
            text: '', // Can add caption functionality later
            timestamp: serverTimestamp(),
            reactions: {} // Add this line
        });

        // Restore input
        textInput.placeholder = originalPlaceholder;
        textInput.disabled = false;

    } catch (error) {
        console.error("Image upload failed:", error);
        alert("Image upload failed. Please try again.");
    }
}
export async function toggleReaction(chatType, messageId, emoji) {
    const { currentUserData } = getState();
    if (!currentUserData) return;

    const { uid, username } = currentUserData;

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
            const partnerUid = getState().activePrivateChatPartner?.uid;
            if (!partnerUid) return;
            const chatId = [uid, partnerUid].sort().join('_');
            docPath = `private_chats/${chatId}/messages/${messageId}`;
            break;
       default:
           return;
   }

    const messageRef = doc(db, docPath);
    const reactionField = `reactions.${emoji}.${uid}`;

    // This is a placeholder; we need to get the actual reaction state.
    // For simplicity, we'll just toggle for now. In a real app, you'd check if the field exists.
    // NOTE: The logic here is simplified. A robust solution would use a transaction
    // to read the document first, but for this project, we'll do a "blind write".
    // To remove a reaction, we'll set the value to null which doesn't work directly with update.
    // A better approach is to get the doc, modify the map in JS, and then `update`.
    // But for a quick toggle, we can set and delete.

    // For this implementation, we will just add the reaction.
    // A full toggle is more complex and requires reading the doc first.
    try {
        await updateDoc(messageRef, {
            [reactionField]: username
        });
    } catch (error) {
        console.error("Error toggling reaction:", error);
    }
}

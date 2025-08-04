// code/js/firestore.js

/**
 * This module centralizes all interactions with Firestore,
 * including setting up listeners, fetching data, and writing data.
 */

import { db } from './firebase-config.js';
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, writeBatch, getDocs, where, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getState, updateState } from './state.js';
import { renderPosts, applyPlayerFilters } from './ui/post-ui.js';
import { renderFriendsList, renderFriendRequests, renderMessages } from './ui/social-ui.js';
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
        renderFriendRequests();
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


export function setupChatListeners() {
    const { currentUserData, listeners } = getState();
    if (!currentUserData) return;

    // Detach old chat listeners if they exist
    if (listeners.worldChat) listeners.worldChat();
    if (listeners.allianceChat) listeners.allianceChat();
    if (listeners.leadershipChat) listeners.leadershipChat();

    // World Chat
    const worldChatQuery = query(collection(db, "world_chat"), orderBy("timestamp", "desc"), limit(50));
    listeners.worldChat = onSnapshot(worldChatQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
        renderMessages(messages, document.getElementById('world-chat-window'), 'world_chat');
    });

    // Alliance Chat
    if (currentUserData.alliance) {
        const allianceChatQuery = query(collection(db, `alliance_chats/${currentUserData.alliance}/messages`), orderBy("timestamp", "desc"), limit(50));
        listeners.allianceChat = onSnapshot(allianceChatQuery, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
            renderMessages(messages, document.getElementById('alliance-chat-window'), 'alliance_chat');
        });
    }

    // Leadership Chat
    if (isUserLeader(currentUserData)) {
        const leadershipChatQuery = query(collection(db, "leadership_chat"), orderBy("timestamp", "desc"), limit(50));
        listeners.leadershipChat = onSnapshot(leadershipChatQuery, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
            renderMessages(messages, document.getElementById('leadership-chat-window'), 'leadership_chat');
        });
    }
    updateState({ listeners });
}

export function setupPrivateChatListener() {
    const { currentUserData, activePrivateChatPartner, listeners } = getState();
    if (!currentUserData || !activePrivateChatPartner) return;
    if (listeners.privateChat) listeners.privateChat();

    const chatId = [currentUserData.uid, activePrivateChatPartner.uid].sort().join('_');
    updateState({ activePrivateChatId: chatId });

    const chatQuery = query(collection(db, `private_chats/${chatId}/messages`), orderBy("timestamp", "desc"), limit(50));
    listeners.privateChat = onSnapshot(chatQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
        renderMessages(messages, document.getElementById('private-message-window'), 'private_chat');
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

export async function handleSendMessage(e, chatType) {
    e.preventDefault();
    const { currentUserData } = getState();
    if (!currentUserData) return;

    let input, collectionPath;
    switch(chatType) {
        case 'world_chat':
            input = document.getElementById('world-chat-input');
            collectionPath = 'world_chat';
            break;
        case 'alliance_chat':
            input = document.getElementById('alliance-chat-input');
            if (!currentUserData.alliance) return;
            collectionPath = `alliance_chats/${currentUserData.alliance}/messages`;
            break;
        case 'leadership_chat':
            input = document.getElementById('leadership-chat-input');
            collectionPath = 'leadership_chat';
            break;
    }

    const text = input.value.trim();
    if (text === '') return;
    input.value = '';

    const messageData = {
        text: text,
        authorUid: currentUserData.uid,
        authorUsername: currentUserData.username,
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(db, collectionPath), messageData);
    } catch (error) {
        console.error(`Error sending message to ${chatType}:`, error);
        input.value = text;
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
        await updateDoc(doc(db, 'users', targetUid), { isVerified: true });
        await deleteDoc(doc(db, 'notifications', notificationId));
    } else {
        // Default action: mark as read
        await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
    }
}

export async function addFriend(recipientUid) {
    const { currentUserData } = getState();
    if (!currentUserData || recipientUid === currentUserData.uid) return;

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
    const { currentUserData, activePrivateChatPartner, activePrivateChatId } = getState();
    if (!currentUserData || !activePrivateChatPartner || !activePrivateChatId) return;

    const chatDocRef = doc(db, 'private_chats', activePrivateChatId);
    const messagesColRef = collection(chatDocRef, 'messages');

    try {
        await setDoc(chatDocRef, { 
            participants: [currentUserData.uid, activePrivateChatPartner.uid] 
        }, { merge: true });

        await addDoc(messagesColRef, {
            text: text,
            authorUid: currentUserData.uid,
            authorUsername: currentUserData.username,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error sending private message:", error);
        throw error; // Re-throw to be handled by the caller
    }
}

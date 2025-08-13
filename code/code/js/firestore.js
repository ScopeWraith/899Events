// code/js/firestore.js

import { db, storage } from './firebase-config.js';
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, writeBatch, getDocs, where, orderBy, limit, serverTimestamp, runTransaction, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { setState, getState } from './state.js';
import { renderNotifications } from './ui/notifications-ui.js';
import { isUserLeader } from './utils.js';

export async function togglePostReaction(postId, reactionType) {
    const { currentUserData } = getState();
    if (!currentUserData || !postId || !['like', 'heart'].includes(reactionType)) return;
    const postRef = doc(db, 'posts', postId);
    const countField = reactionType === 'like' ? 'likes' : 'hearts';
    const arrayField = reactionType === 'like' ? 'likedBy' : 'heartedBy';
    try {
        await runTransaction(db, async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists()) throw "Document does not exist!";
            const currentLikedBy = postDoc.data()[arrayField] || [];
            let newCount = postDoc.data()[countField] || 0;
            let newLikedBy = [...currentLikedBy];
            const userIndex = newLikedBy.indexOf(currentUserData.uid);
            if (userIndex > -1) {
                newLikedBy.splice(userIndex, 1);
                newCount--;
            } else {
                newLikedBy.push(currentUserData.uid);
                newCount++;
            }
            if (newCount < 0) newCount = 0;
            let updateData = {};
            updateData[countField] = newCount;
            updateData[arrayField] = newLikedBy;
            transaction.update(postRef, updateData);
        });
    } catch (e) {
        console.error("Post reaction transaction failed: ", e);
    }
}

export function setupAllListeners(user, onInitialDataLoaded) {
    const listeners = {};
    const requiredLoads = ['userDoc', 'notifications', 'friends', 'alliances', 'users', 'posts', 'sessions'];
    let loadedCount = 0;

    const checkAllLoaded = (source) => {
        if (requiredLoads.includes(source)) {
            loadedCount++;
            requiredLoads.splice(requiredLoads.indexOf(source), 1);
        }
        if (loadedCount >= 7 && onInitialDataLoaded) {
            onInitialDataLoaded();
            onInitialDataLoaded = null;
        }
    };

    listeners.userDoc = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
        if (userDoc.exists()) {
            setState({ currentUserData: { uid: user.uid, ...userDoc.data() } });
        }
        checkAllLoaded('userDoc');
    }, () => checkAllLoaded('userDoc'));

    const notificationsQuery = query(collection(db, "notifications"), where("recipientUid", "==", user.uid), orderBy("timestamp", "desc"));
    listeners.notifications = onSnapshot(notificationsQuery, (snapshot) => {
        const userNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState({ userNotifications });
    }, () => checkAllLoaded('notifications'));

    const friendsQuery = collection(db, `users/${user.uid}/friends`);
    listeners.friends = onSnapshot(friendsQuery, (snapshot) => {
        const userFriends = snapshot.docs.map(doc => doc.id);
        setState({ userFriends });
        checkAllLoaded('friends');
    }, () => checkAllLoaded('friends'));

    listeners.alliances = onSnapshot(query(collection(db, 'alliances')), (querySnapshot) => {
        const allAlliances = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState({ allAlliances });
        checkAllLoaded('alliances');
    }, () => checkAllLoaded('alliances'));

    listeners.users = onSnapshot(query(collection(db, 'users')), (querySnapshot) => {
        const allPlayers = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        setState({ allPlayers });
        checkAllLoaded('users');
    }, () => checkAllLoaded('users'));

    listeners.posts = onSnapshot(query(collection(db, 'posts')), (querySnapshot) => {
        const allPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState({ allPosts });
        checkAllLoaded('posts');
    }, () => checkAllLoaded('posts'));

    listeners.sessions = onSnapshot(collection(db, 'sessions'), (snapshot) => {
        const userSessions = getState().userSessions || {};
        snapshot.docChanges().forEach((change) => {
            userSessions[change.doc.id] = change.doc.data();
        });
        setState({ userSessions });
        checkAllLoaded('sessions');
    }, () => checkAllLoaded('sessions'));

    setState({ listeners });
}

export function fetchInitialData(onPublicDataLoaded) {
    let { listeners } = getState();
    if (!listeners) listeners = {};

    const requiredPublicLoads = ['users', 'posts', 'sessions', 'alliances'];
    let loadedCount = 0;

    const checkPublicLoaded = (source) => {
        if (requiredPublicLoads.includes(source)) {
            loadedCount++;
            requiredPublicLoads.splice(requiredPublicLoads.indexOf(source), 1);
        }
        if (loadedCount >= 4 && onPublicDataLoaded) {
            onPublicDataLoaded();
            onPublicDataLoaded = null;
        }
    };

    if (!listeners.users) {
        listeners.users = onSnapshot(query(collection(db, 'users')), (querySnapshot) => {
            const allPlayers = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
            setState({ allPlayers });
            checkPublicLoaded('users');
        }, () => checkPublicLoaded('users'));
    }
    if (!listeners.posts) {
        listeners.posts = onSnapshot(query(collection(db, 'posts')), (querySnapshot) => {
            const allPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setState({ allPosts });
            checkPublicLoaded('posts');
        }, () => checkPublicLoaded('posts'));
    }
    if (!listeners.sessions) {
        listeners.sessions = onSnapshot(collection(db, 'sessions'), (snapshot) => {
            const userSessions = getState().userSessions || {};
            snapshot.docChanges().forEach((change) => {
                userSessions[change.doc.id] = change.doc.data();
            });
            setState({ userSessions });
            checkPublicLoaded('sessions');
        }, () => checkPublicLoaded('sessions'));
    }
    if (!listeners.alliances) {
        listeners.alliances = onSnapshot(query(collection(db, 'alliances')), (querySnapshot) => {
            const allAlliances = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setState({ allAlliances });
            checkPublicLoaded('alliances');
        }, () => checkPublicLoaded('alliances'));
    }

    setState({ listeners });
}

export function setupChatListeners(activeChatId) {
    const { currentUserData, listeners } = getState();
    if (!currentUserData) return;

    if (listeners.worldChat) listeners.worldChat();
    if (listeners.allianceChat) listeners.allianceChat();
    if (listeners.leadershipChat) listeners.leadershipChat();

    let chatQuery;

    const createListener = (query) => {
        return onSnapshot(query, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setState({ activeChatMessages: messages });
        }, (error) => {
            console.error(`Error listening to chat:`, error);
            setState({ activeChatMessages: [] });
        });
    };

    switch (activeChatId) {
        case 'alliance_chat': if (currentUserData.alliance) { chatQuery = query(collection(db, `alliance_chats/${currentUserData.alliance}/messages`), orderBy("timestamp", "asc"), limit(50)); listeners.allianceChat = createListener(chatQuery); } break;
        case 'leadership_chat': if (isUserLeader(currentUserData)) { chatQuery = query(collection(db, "leadership_chat"), orderBy("timestamp", "asc"), limit(50)); listeners.leadershipChat = createListener(chatQuery); } break;
        case 'world_chat': default: chatQuery = query(collection(db, "world_chat"), orderBy("timestamp", "asc"), limit(50)); listeners.worldChat = createListener(chatQuery); break;
    }
    setState({ listeners });
}

export function setupPrivateChatListener(chatId) {
    const { listeners } = getState();
    if (listeners.privateChat) listeners.privateChat();
    if (!chatId) return;

    setState({ activePrivateChatId: chatId });
    const chatQuery = query(collection(db, `private_chats/${chatId}/messages`), orderBy("timestamp", "asc"), limit(50));

    listeners.privateChat = onSnapshot(chatQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState({ activeChatMessages: messages });
    }, (error) => {
        console.error(`Error listening to private chat ${chatId}:`, error);
        setState({ activeChatMessages: [] });
    });
    setState({ listeners });
}

export function detachAllListeners() {
    const { listeners } = getState();
    if (listeners && typeof listeners === 'object') { // ADDED SAFETY CHECK
        Object.values(listeners).forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') unsubscribe();
        });
    }
    setState({ listeners: {} });
}

export async function handleSendMessage(e, chatType, text) {
    const { currentUserData } = getState();
    if (!currentUserData || !text || text.trim() === '') return;

    let collectionPath;
    switch (chatType) {
        case 'world_chat': collectionPath = 'world_chat'; break;
        case 'alliance_chat': if (!currentUserData.alliance) return; collectionPath = `alliance_chats/${currentUserData.alliance}/messages`; break;
        case 'leadership_chat': collectionPath = 'leadership_chat'; break;
        default: console.error("Invalid chat type:", chatType); return;
    }

    await addDoc(collection(db, collectionPath), { text: text, authorUid: currentUserData.uid, authorUsername: currentUserData.username, timestamp: serverTimestamp(), reactions: {} });
}

export async function handleFullscreenMessageSend(text) {
    const { currentUserData, activePrivateChatId } = getState();
    if (!currentUserData || text.trim() === '') return;

    if (activePrivateChatId) {
        await addDoc(collection(db, `private_chats/${activePrivateChatId}/messages`), { text: text, authorUid: currentUserData.uid, authorUsername: currentUserData.username, timestamp: serverTimestamp(), reactions: {}, isRead: false });
        await updateDoc(doc(db, `private_chats/${activePrivateChatId}`), { lastMessage: { text: text, authorUid: currentUserData.uid, timestamp: serverTimestamp() } });
    } else {
        const activeChatBtn = document.querySelector('#chat-selectors .chat-selector-btn.active');
        if (!activeChatBtn) { console.error("No active public chat channel selected."); return; }
        await handleSendMessage(null, activeChatBtn.dataset.chatType, text);
    }
}

export async function handleDeleteMessage(messageId, chatType) {
    const { currentUserData, activePrivateChatPartner } = getState();
    let docPath;
    switch(chatType) {
       case 'world_chat': docPath = `world_chat/${messageId}`; break;
       case 'alliance_chat': if (!currentUserData.alliance) return; docPath = `alliance_chats/${currentUserData.alliance}/messages/${messageId}`; break;
       case 'leadership_chat': docPath = `leadership_chat/${messageId}`; break;
       case 'private_chat':
            if (!currentUserData || !activePrivateChatPartner) return;
            const chatId = [currentUserData.uid, activePrivateChatPartner.uid].sort().join('_');
            docPath = `private_chats/${chatId}/messages/${messageId}`;
            break;
       default: console.error("Invalid chat type for delete:", chatType); return;
   }
   await deleteDoc(doc(db, docPath));
}

export async function sendVerificationRequest(senderUid, senderUsername, alliance) {
    const leadersQuery = query(collection(db, 'users'), where('alliance', '==', alliance), where('allianceRank', 'in', ['R5', 'R4']));
    const leadersSnapshot = await getDocs(leadersQuery);
    const batch = writeBatch(db);
    leadersSnapshot.forEach(leaderDoc => {
        const notificationRef = doc(collection(db, 'notifications'));
        batch.set(notificationRef, { recipientUid: leaderDoc.id, senderUid: senderUid, senderUsername: senderUsername, type: 'verification_request', message: `${senderUsername} has updated their profile and is awaiting verification.`, isRead: false, timestamp: serverTimestamp() });
    });
    await batch.commit();
    return true;
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
        const targetUsername = getState().allPlayers.find(p => p.uid === targetUid)?.username || 'A new member';
        await updateDoc(doc(db, 'users', targetUid), { isVerified: true, alliance: currentUserData.alliance });
        await updateDoc(doc(db, 'notifications', notificationId), { type: 'user_verified_record', isRead: true, message: `${targetUsername} has been verified in your alliance.` });
    } else {
        await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
    }
}

export async function addFriend(recipientUid) {
    const { currentUserData } = getState();
    if (!currentUserData) return false;
    await addDoc(collection(db, 'notifications'), { recipientUid: recipientUid, senderUid: currentUserData.uid, senderUsername: currentUserData.username, type: 'friend_request', message: `${currentUserData.username} sent you a friend request.`, isRead: false, timestamp: serverTimestamp() });
    return true;
}

export async function removeFriend(friendUid) {
    const { currentUserData } = getState();
    if (!currentUserData) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, `users/${currentUserData.uid}/friends/${friendUid}`));
    batch.delete(doc(db, `users/${friendUid}/friends/${currentUserData.uid}`));
    await batch.commit();
}

export async function handleImageAttachment(file) {
    const { currentUserData, activePrivateChatId } = getState();
    if (!currentUserData || !activePrivateChatId) return;

    const imageId = doc(collection(db, 'posts')).id;
    const storageRef = ref(storage, `private_chat_images/${activePrivateChatId}/${imageId}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    await addDoc(collection(db, `private_chats/${activePrivateChatId}/messages`), { authorUid: currentUserData.uid, authorUsername: currentUserData.username, imageUrl: imageUrl, text: '', timestamp: serverTimestamp(), reactions: {} });
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
    await runTransaction(db, async (transaction) => {
        const messageDoc = await transaction.get(messageRef);
        if (!messageDoc.exists()) throw "Document does not exist!";
        const reactions = messageDoc.data().reactions || {};
        if (reactions[emoji] && reactions[emoji][uid]) {
            delete reactions[emoji][uid];
            if (Object.keys(reactions[emoji]).length === 0) delete reactions[emoji];
        } else {
            if (!reactions[emoji]) reactions[emoji] = {};
            reactions[emoji][uid] = username;
        }
        transaction.update(messageRef, { reactions: reactions });
    });
}

export function setupConversationListListener() {
    const { currentUserData, listeners } = getState();
    if (!currentUserData) return;
    if (listeners.convoList) listeners.convoList();

    const q = query(collection(db, 'private_chats'), where('participants', 'array-contains', currentUserData.uid));
    listeners.convoList = onSnapshot(q, async (snapshot) => {
        const conversationPromises = snapshot.docs.map(async (chatDoc) => {
            const chatData = chatDoc.data();
            const partnerId = chatData.participants.find(p => p !== currentUserData.uid);
            const unreadQuery = query(collection(db, `private_chats/${chatDoc.id}/messages`), where('isRead', '==', false), where('authorUid', '!=', currentUserData.uid));
            const unreadSnapshot = await getDocs(unreadQuery);
            return { chatId: chatDoc.id, partnerId: partnerId, lastMessage: chatData.lastMessage || null, unreadCount: unreadSnapshot.docs.length };
        });
        const conversations = await Promise.all(conversationPromises);
        setState({ conversations: conversations.filter(c => c.lastMessage) });
    });
    setState({ listeners });
}

export function setupUnverifiedPlayersListener(user) {
    const { listeners } = getState();
    if (listeners.unverifiedPlayers) listeners.unverifiedPlayers();
    if (!user || !isUserLeader(user) || user.alliance === 'Pending Alliance') return;

    const unverifiedPlayersQuery = query(collection(db, 'users'), where('alliance', '==', user.alliance), where('isVerified', '==', false));
    listeners.unverifiedPlayers = onSnapshot(unverifiedPlayersQuery, (snapshot) => {
        const unverifiedPlayers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        setState({ unverifiedPlayers });
    });
    setState({ listeners });
}
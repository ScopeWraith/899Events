// code/js/firestore.js

import { db, storage } from './firebase-config.js';
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, writeBatch, getDocs, where, orderBy, limit, serverTimestamp, runTransaction, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { setState, getState } from './state.js';
import { isUserLeader } from './utils.js';

/**
 * Toggles a reaction ('like' or 'heart') on a post for the current user.
 * Uses a Firestore transaction to ensure atomic updates to the reaction count and the list of users who reacted.
 * @param {string} postId The ID of the post to react to.
 * @param {('like'|'heart')} reactionType The type of reaction to toggle.
 * @returns {Promise<void>} A promise that resolves when the transaction is complete.
 */
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

/**
 * Toggles a 'like' on a user's profile for the current user.
 * Uses a Firestore transaction to ensure atomic updates.
 * @param {string} targetUid The UID of the user profile to like.
 * @returns {Promise<boolean>} A promise that resolves to true if the like was added, false if removed.
 */
export async function toggleProfileLike(targetUid) {
    const { currentUserData } = getState();
    if (!currentUserData || !targetUid || currentUserData.uid === targetUid) return;

    const profileRef = doc(db, 'users', targetUid);
    let liked = false;

    try {
        await runTransaction(db, async (transaction) => {
            const profileDoc = await transaction.get(profileRef);
            if (!profileDoc.exists()) throw "User profile does not exist!";

            const likedBy = profileDoc.data().likedBy || [];
            let newLikesCount = profileDoc.data().likes || 0;
            const userIndex = likedBy.indexOf(currentUserData.uid);

            if (userIndex > -1) {
                // User has already liked, so unlike
                likedBy.splice(userIndex, 1);
                newLikesCount--;
                liked = false;
            } else {
                // User has not liked, so like
                likedBy.push(currentUserData.uid);
                newLikesCount++;
                liked = true;
            }

            if (newLikesCount < 0) newLikesCount = 0;

            transaction.update(profileRef, {
                likes: newLikesCount,
                likedBy: likedBy
            });
        });
        return liked;
    } catch (e) {
        console.error("Profile like transaction failed: ", e);
        return false;
    }
}

/**
 * Sets up all necessary real-time listeners for a logged-in user.
 * This includes user data, notifications, friends, alliances, players, posts, and sessions.
 * @param {import("firebase/auth").User} user The authenticated user object from Firebase Auth.
 * @param {Function} onInitialDataLoaded A callback function to execute once the initial data load is complete.
 */
export function setupAllListeners(user, onInitialDataLoaded) {
    const listeners = {};
    const requiredLoads = ['userDoc', 'notifications', 'friends', 'alliances', 'users', 'posts', 'sessions'];
    let loadedCount = 0;

    /**
     * Checks if all initial data has been loaded and calls the callback if so.
     * @param {string} source The name of the listener that just completed its initial load.
     */
    const checkAllLoaded = (source) => {
        if (requiredLoads.includes(source)) {
            const index = requiredLoads.indexOf(source);
            if (index > -1) requiredLoads.splice(index, 1);
            loadedCount++;
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
        checkAllLoaded('notifications');
    }, () => checkAllLoaded('notifications'));

    const friendsQuery = collection(db, `users/${user.uid}/friends`);
    listeners.friends = onSnapshot(friendsQuery, (snapshot) => {
        const userFriends = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})); // Fetch full friend object
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

/**
 * Fetches initial public data required for the app to function for non-authenticated users.
 * @param {Function} onPublicDataLoaded A callback function to execute once public data is loaded.
 */
export function fetchInitialData(onPublicDataLoaded) {
    let { listeners } = getState();
    if (!listeners) listeners = {};
    const requiredPublicLoads = ['users', 'posts', 'sessions', 'alliances'];
    let loadedCount = 0;

    /**
     * Checks if all public data has been loaded and calls the callback.
     * @param {string} source The name of the listener that just completed its initial load.
     */
    const checkPublicLoaded = (source) => {
        if (requiredPublicLoads.includes(source)) {
            const index = requiredPublicLoads.indexOf(source);
            if (index > -1) requiredPublicLoads.splice(index, 1);
            loadedCount++;
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
            checkAllLoaded('alliances');
        }, () => checkAllLoaded('alliances'));
    }

    setState({ listeners });
}

/**
 * Detaches all active Firestore listeners to prevent memory leaks and unnecessary reads,
 * typically called on user logout.
 */
export function detachAllListeners() {
    const { listeners } = getState();
    if (listeners && typeof listeners === 'object') {
        Object.values(listeners).forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') unsubscribe();
        });
    }
    setState({ listeners: {} });
}

/**
 * Sets up listeners for the public chat channels (World, Alliance, Leadership).
 * Detaches previous listeners to ensure only the active channel is being listened to.
 * @param {('world_chat'|'alliance_chat'|'leadership_chat')} activeChatId The ID of the chat channel to listen to.
 */
export function setupChatListeners(activeChatId) {
    const { currentUserData, listeners } = getState();
    if (!currentUserData) return;

    if (listeners.worldChat) listeners.worldChat();
    if (listeners.allianceChat) listeners.allianceChat();
    if (listeners.leadershipChat) listeners.leadershipChat();

    let chatQuery;

    /**
     * Creates a snapshot listener for a given Firestore query.
     * @param {import("firebase/firestore").Query} query The Firestore query to listen to.
     * @returns {Function} The unsubscribe function for the listener.
     */
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

/**
 * Sets up a listener for a specific private chat conversation.
 * @param {string} chatId The ID of the private chat to listen to.
 */
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

/**
 * Sends a message to a public chat channel.
 * @param {Event} e The event object (can be null).
 * @param {('world_chat'|'alliance_chat'|'leadership_chat')} chatType The type of chat to send the message to.
 * @param {string} text The message content.
 * @returns {Promise<void>} A promise that resolves when the message is sent.
 */
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

/**
 * Sends a message from the fullscreen chat modal.
 * Dispatches to the correct handler based on whether a private or public chat is active.
 * @param {string} text The message content to send.
 * @returns {Promise<void>} A promise that resolves when the message is sent.
 */
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

/**
 * Deletes a chat message from a specified channel.
 * @param {string} messageId The ID of the message to delete.
 * @param {('world_chat'|'alliance_chat'|'leadership_chat'|'private_chat')} chatType The channel the message belongs to.
 * @returns {Promise<void>} A promise that resolves when the message is deleted.
 */
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

/**
 * Sends verification request notifications to all R4 and R5 leaders of a specified alliance.
 * @param {string} senderUid The UID of the user requesting verification.
 * @param {string} senderUsername The username of the user requesting verification.
 * @param {string} alliance The alliance tag to send requests to.
 * @returns {Promise<boolean>} A promise that resolves to true upon successful sending.
 */
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

/**
 * Handles actions performed on a notification, such as accepting/declining friend requests or verifying users.
 * @param {string} notificationId The ID of the notification document.
 * @param {('accept-friend'|'decline-friend'|'verify-user'|'read')} action The action to perform.
 * @param {string} senderUid The UID of the user who sent the notification.
 * @param {string} [targetUid] The UID of the user to be acted upon (e.g., for verification).
 * @returns {Promise<void>} A promise that resolves when the action is complete.
 */
export async function handleNotificationAction(notificationId, action, senderUid, targetUid) {
    const { currentUserData } = getState();
    if (!currentUserData) return;

    if (action === 'accept-friend') {
        const batch = writeBatch(db);
        const friendData = { status: 'friends', since: serverTimestamp() };
        batch.set(doc(db, `users/${currentUserData.uid}/friends/${senderUid}`), friendData, { merge: true });
        batch.set(doc(db, `users/${senderUid}/friends/${currentUserData.uid}`), friendData, { merge: true });
        batch.delete(doc(db, 'notifications', notificationId));
        await batch.commit();
    } else if (action === 'decline-friend') {
        await declineFriendRequest(senderUid); // New function call
        await deleteDoc(doc(db, 'notifications', notificationId));
    } else if (action === 'verify-user') {
        const { allPlayers } = getState();
        const targetPlayer = allPlayers.find(p => p.uid === targetUid);
        if (!targetPlayer) return;
        
        const allianceToVerify = targetPlayer.alliance; 
        const targetUsername = targetPlayer.username || 'A new member';

        await updateDoc(doc(db, 'users', targetUid), { isVerified: true, alliance: allianceToVerify });

        if (notificationId.startsWith('verify-')) {
            const q = query(collection(db, 'notifications'), where('senderUid', '==', targetUid), where('type', '==', 'verification_request'));
            const notificationSnapshot = await getDocs(q);
            const batch = writeBatch(db);
            notificationSnapshot.forEach(doc => {
                 batch.update(doc.ref, { type: 'user_verified_record', isRead: true, message: `${targetUsername} has been verified in ${allianceToVerify}.` });
            });
            await batch.commit();
        } else {
            await updateDoc(doc(db, 'notifications', notificationId), { type: 'user_verified_record', isRead: true, message: `${targetUsername} has been verified in ${allianceToVerify}.` });
        }
    } else {
        await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
    }
}

/**
 * Sends a friend request notification to another user.
 * @param {string} recipientUid The UID of the user to send the request to.
 * @returns {Promise<boolean>} A promise that resolves to true upon successful sending.
 */
async function sendFriendRequestNotification(recipientUid) {
    const { currentUserData } = getState();
    if (!currentUserData) return false;

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
}

/**
 * Creates a pending friend request between two users.
 * @param {string} recipientUid The UID of the user to send the request to.
 * @returns {Promise<boolean>} A promise that resolves to true upon successful sending.
 */
export async function addFriend(recipientUid) {
    const { currentUserData } = getState();
    if (!currentUserData || currentUserData.uid === recipientUid) return false;

    const batch = writeBatch(db);
    const requestData = {
        status: 'pending',
        requester: currentUserData.uid,
        createdAt: serverTimestamp()
    };
    
    batch.set(doc(db, `users/${currentUserData.uid}/friends/${recipientUid}`), requestData);
    batch.set(doc(db, `users/${recipientUid}/friends/${currentUserData.uid}`), requestData);

    await batch.commit();
    await sendFriendRequestNotification(recipientUid); // Send notification after creating the pending docs

    return true;
}

/**
 * Declines a friend request.
 * @param {string} senderUid The UID of the user who sent the request.
 * @returns {Promise<void>}
 */
export async function declineFriendRequest(senderUid) {
    const { currentUserData } = getState();
    if (!currentUserData) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, `users/${currentUserData.uid}/friends/${senderUid}`));
    batch.delete(doc(db, `users/${senderUid}/friends/${currentUserData.uid}`));
    await batch.commit();
}

/**
 * Cancels a friend request that was sent.
 * @param {string} recipientUid The UID of the user the request was sent to.
 * @returns {Promise<void>}
 */
export async function cancelFriendRequest(recipientUid) {
    const { currentUserData } = getState();
    if (!currentUserData) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, `users/${currentUserData.uid}/friends/${recipientUid}`));
    batch.delete(doc(db, `users/${recipientUid}/friends/${currentUserData.uid}`));
    await batch.commit();
}


/**
 * Removes a friend from the current user's friend list and vice-versa.
 * @param {string} friendUid The UID of the friend to remove.
 * @returns {Promise<void>} A promise that resolves when the friend is removed.
 */
export async function removeFriend(friendUid) {
    const { currentUserData } = getState();
    if (!currentUserData) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, `users/${currentUserData.uid}/friends/${friendUid}`));
    batch.delete(doc(db, `users/${friendUid}/friends/${currentUserData.uid}`));
    await batch.commit();
}

/**
 * Handles uploading an image attachment to a private chat.
 * @param {File} file The image file to upload.
 * @returns {Promise<void>} A promise that resolves when the image is uploaded and the message is sent.
 */
export async function handleImageAttachment(file) {
    const { currentUserData, activePrivateChatId } = getState();
    if (!currentUserData || !activePrivateChatId) return;

    const imageId = doc(collection(db, 'posts')).id;
    const storageRef = ref(storage, `private_chat_images/${activePrivateChatId}/${imageId}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    await addDoc(collection(db, `private_chats/${activePrivateChatId}/messages`), { authorUid: currentUserData.uid, authorUsername: currentUserData.username, imageUrl: imageUrl, text: '', timestamp: serverTimestamp(), reactions: {} });
}

/**
 * Toggles a reaction emoji on a chat message.
 * @param {string} chatType The type of chat the message is in.
 * @param {string} messageId The ID of the message.
 * @param {string} emoji The emoji to toggle.
 * @returns {Promise<void>} A promise that resolves when the reaction is updated.
 */
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

/**
 * Sets up a listener for the current user's list of private conversations.
 * Fetches conversation metadata including the last message and unread count.
 */
export function setupConversationListListener() {
    const { currentUserData, listeners } = getState();
    if (!currentUserData) return;
    if (listeners.convoList) listeners.convoList();

    const q = query(collection(db, 'private_chats'), where('participants', 'array-contains', currentUserData.uid));
    listeners.convoList = onSnapshot(q, async (snapshot) => {
        let totalUnread = 0; // --- START: MODIFICATION FOR UNREAD COUNT ---
        const conversationPromises = snapshot.docs.map(async (chatDoc) => {
            const chatData = chatDoc.data();
            const partnerId = chatData.participants.find(p => p !== currentUserData.uid);
            const unreadQuery = query(collection(db, `private_chats/${chatDoc.id}/messages`), where('isRead', '==', false), where('authorUid', '!=', currentUserData.uid));
            const unreadSnapshot = await getDocs(unreadQuery);
            const unreadCount = unreadSnapshot.docs.length;
            totalUnread += unreadCount; // Add to total
            return { chatId: chatDoc.id, partnerId: partnerId, lastMessage: chatData.lastMessage || null, unreadCount: unreadCount };
        });
        const conversations = await Promise.all(conversationPromises);
        setState({ conversations: conversations.filter(c => c.lastMessage), unreadMessagesCount: totalUnread }); // Set total in state
        // --- END: MODIFICATION FOR UNREAD COUNT ---
    });
    setState({ listeners });
}

/**
 * Sets up a listener for unverified players.
 * Admins see all unverified players, while leaders see only those in their own alliance.
 * @param {object} user The current user's data object.
 */
export function setupUnverifiedPlayersListener(user) {
    const { listeners } = getState();
    if (listeners.unverifiedPlayers) listeners.unverifiedPlayers();
    if (!user) return;

    let unverifiedPlayersQuery;
    if (user.isAdmin) {
        unverifiedPlayersQuery = query(collection(db, 'users'), where('isVerified', '==', false));
    } else if (isUserLeader(user) && user.alliance !== 'Pending Alliance') {
        unverifiedPlayersQuery = query(collection(db, 'users'), where('alliance', '==', user.alliance), where('isVerified', '==', false));
    } else {
        setState({ unverifiedPlayers: [] });
        return;
    }

    listeners.unverifiedPlayers = onSnapshot(unverifiedPlayersQuery, (snapshot) => {
        const unverifiedPlayers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        setState({ unverifiedPlayers });
    });
    setState({ listeners });
}
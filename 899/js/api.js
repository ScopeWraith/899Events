// js/api.js

import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc, addDoc, serverTimestamp, deleteDoc, writeBatch, limit, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

let db, storage;

export function initApi(firebaseServices) {
    db = firebaseServices.db;
    storage = firebaseServices.storage;
}

// --- Firestore Read/Listen Functions ---

export function listenToPosts(callback) {
    const q = query(collection(db, 'posts'), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
}

export function listenToUsers(callback) {
    const q = query(collection(db, 'users'));
    return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))));
}

export function listenToChat(chatType, allianceId, callback) {
    let collectionPath;
    switch(chatType) {
        case 'world-chat': collectionPath = 'world_chat'; break;
        case 'alliance-chat': if (!allianceId) return () => {}; collectionPath = `alliance_chats/${allianceId}/messages`; break;
        case 'leadership-chat': if (!allianceId) return () => {}; collectionPath = `leadership_chats/${allianceId}/messages`; break;
        default: return () => {};
    }
    const q = query(collection(db, collectionPath), orderBy("timestamp", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
}

export function listenToFriends(userId, callback) {
    const q = query(collection(db, `users/${userId}/friends`));
    return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
}

// --- NEW: Listen for user notifications ---
export function listenToNotifications(userId, callback) {
    const q = query(collection(db, `users/${userId}/notifications`), orderBy("timestamp", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(notifications);
    });
}

// --- Firestore Write Functions ---

export async function updateUserProfile(uid, data) {
    await updateDoc(doc(db, "users", uid), data);
}

export async function sendMessage(chatType, allianceId, messageData) {
    // ... (implementation unchanged)
}

export async function deleteMessage(chatType, allianceId, messageId) {
    // ... (implementation unchanged)
}

// --- MODIFIED: sendFriendRequest now also creates a notification ---
export async function sendFriendRequest(currentUser, targetUser) {
    if (!currentUser || !targetUser || currentUser.uid === targetUser.uid) return;
    
    const batch = writeBatch(db);
    
    // Set friend status for both users
    const myFriendRef = doc(db, `users/${currentUser.uid}/friends/${targetUser.uid}`);
    batch.set(myFriendRef, { status: 'pending_sent', createdAt: serverTimestamp() });
    
    const theirFriendRef = doc(db, `users/${targetUser.uid}/friends/${currentUser.uid}`);
    batch.set(theirFriendRef, { status: 'pending_received', createdAt: serverTimestamp() });

    // Create notification for the target user
    const notificationRef = doc(collection(db, `users/${targetUser.uid}/notifications`));
    batch.set(notificationRef, {
        type: 'friend_request',
        fromUid: currentUser.uid,
        fromUsername: currentUser.username,
        timestamp: serverTimestamp(),
        read: false
    });

    await batch.commit();
}

export async function acceptFriendRequest(currentUserId, friendId) {
    // ... (implementation unchanged)
}

export async function removeOrDeclineFriend(currentUserId, friendId) {
    // ... (implementation unchanged)
}

// --- Storage Functions ---
export async function uploadFileAndGetURL(path, file) {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}

// js/api.js

/**
 * --- FIX ---
 * Imported the 'limit' function from the Firestore SDK.
 * This was causing a ReferenceError in the listenToChat function.
 */
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc, addDoc, serverTimestamp, deleteDoc, writeBatch, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

/**
 * This file handles all communication with Firebase services.
 */

let db, storage;

/**
 * Initializes the API module with the Firebase services.
 * @param {object} firebaseServices - An object containing initialized db and storage.
 */
export function initApi(firebaseServices) {
    db = firebaseServices.db;
    storage = firebaseServices.storage;
}

// --- Firestore Read/Listen Functions ---

export function listenToPosts(callback) {
    const q = query(collection(db, 'posts'), orderBy("createdAt", "desc"));
    return onSnapshot(q, (querySnapshot) => {
        const posts = [];
        querySnapshot.forEach((doc) => posts.push({ id: doc.id, ...doc.data() }));
        callback(posts);
    }, (error) => console.error("Error with posts listener:", error));
}

export function listenToUsers(callback) {
    const q = query(collection(db, 'users'));
    return onSnapshot(q, (querySnapshot) => {
        const players = [];
        querySnapshot.forEach((doc) => players.push({ uid: doc.id, ...doc.data() }));
        callback(players);
    }, (error) => console.error("Error with users listener:", error));
}

export function listenToChat(chatType, allianceId, callback) {
    let collectionPath;
    switch(chatType) {
        case 'world-chat': collectionPath = 'world_chat'; break;
        case 'alliance-chat': collectionPath = `alliance_chats/${allianceId}/messages`; break;
        case 'leadership-chat': collectionPath = `leadership_chats/${allianceId}/messages`; break;
        default: return () => {}; // Return empty unsubscribe function
    }
    const q = query(collection(db, collectionPath), orderBy("timestamp", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(messages);
    }, (error) => console.error(`Error with ${chatType} listener:`, error));
}

export function listenToFriends(userId, callback) {
    const q = query(collection(db, `users/${userId}/friends`));
    return onSnapshot(q, (snapshot) => {
        const friendsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(friendsData);
    }, (error) => console.error("Error with friends listener:", error));
}

// --- Firestore Write Functions ---

export async function sendMessage(chatType, allianceId, messageData) {
    let collectionPath;
    switch(chatType) {
        case 'world-chat': collectionPath = 'world_chat'; break;
        case 'alliance-chat': collectionPath = `alliance_chats/${allianceId}/messages`; break;
        case 'leadership-chat': collectionPath = `leadership_chats/${allianceId}/messages`; break;
        default: throw new Error("Invalid chat type for sending message.");
    }
    await addDoc(collection(db, collectionPath), { ...messageData, timestamp: serverTimestamp() });
}

export async function deleteMessage(chatType, allianceId, messageId) {
    let docPath;
    switch(chatType) {
        case 'world-chat': docPath = `world_chat/${messageId}`; break;
        case 'alliance-chat': docPath = `alliance_chats/${allianceId}/messages/${messageId}`; break;
        case 'leadership-chat': docPath = `leadership_chats/${allianceId}/messages/${messageId}`; break;
        default: throw new Error("Invalid chat type for deleting message.");
    }
    await deleteDoc(doc(db, docPath));
}

export async function sendFriendRequest(currentUserId, targetUserId) {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;
    const batch = writeBatch(db);
    const myFriendRef = doc(db, `users/${currentUserId}/friends/${targetUserId}`);
    const theirFriendRef = doc(db, `users/${targetUserId}/friends/${currentUserId}`);
    batch.set(myFriendRef, { status: 'pending_sent', createdAt: serverTimestamp() });
    batch.set(theirFriendRef, { status: 'pending_received', createdAt: serverTimestamp() });
    await batch.commit();
}

export async function acceptFriendRequest(currentUserId, friendId) {
    if (!currentUserId || !friendId) return;
    const batch = writeBatch(db);
    const myFriendRef = doc(db, `users/${currentUserId}/friends/${friendId}`);
    const theirFriendRef = doc(db, `users/${friendId}/friends/${currentUserId}`);
    batch.update(myFriendRef, { status: 'accepted' });
    batch.update(theirFriendRef, { status: 'accepted' });
    await batch.commit();
}

export async function removeOrDeclineFriend(currentUserId, friendId) {
    if (!currentUserId || !friendId) return;
    const batch = writeBatch(db);
    const myFriendRef = doc(db, `users/${currentUserId}/friends/${friendId}`);
    const theirFriendRef = doc(db, `users/${friendId}/friends/${currentUserId}`);
    batch.delete(myFriendRef);
    batch.delete(theirFriendRef);
    await batch.commit();
}


// --- Storage Functions ---

export async function uploadFileAndGetURL(path, file) {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}

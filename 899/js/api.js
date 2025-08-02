// js/api.js

import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc, addDoc, serverTimestamp, deleteDoc, writeBatch, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

/**
 * This file handles all communication with Firebase services.
 */

let db, storage;

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
        case 'world-chat': 
            collectionPath = 'world_chat'; 
            break;
        /**
         * --- FIX ---
         * Added guards to prevent trying to create a listener if the required
         * allianceId is missing. This stops the API from making an invalid query.
         */
        case 'alliance-chat': 
            if (!allianceId) return () => {}; // Return empty unsubscribe function
            collectionPath = `alliance_chats/${allianceId}/messages`; 
            break;
        case 'leadership-chat': 
            if (!allianceId) return () => {}; // Return empty unsubscribe function
            collectionPath = `leadership_chats/${allianceId}/messages`; 
            break;
        default: 
            return () => {}; // Return empty unsubscribe function for any unknown type
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
    // ... (this function is unchanged)
}

export async function deleteMessage(chatType, allianceId, messageId) {
    // ... (this function is unchanged)
}

export async function sendFriendRequest(currentUserId, targetUserId) {
    // ... (this function is unchanged)
}

export async function acceptFriendRequest(currentUserId, friendId) {
    // ... (this function is unchanged)
}

export async function removeOrDeclineFriend(currentUserId, friendId) {
    // ... (this function is unchanged)
}

// --- Storage Functions ---
export async function uploadFileAndGetURL(path, file) {
    // ... (this function is unchanged)
}

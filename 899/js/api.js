// js/api.js

import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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

/**
 * Sets up a real-time listener for the 'posts' collection.
 * @param {function} callback - The function to call with the posts data when it changes.
 * @returns {function} The unsubscribe function for the listener.
 */
export function listenToPosts(callback) {
    const q = query(collection(db, 'posts'), orderBy("createdAt", "desc"));
    return onSnapshot(q, (querySnapshot) => {
        const posts = [];
        querySnapshot.forEach((doc) => posts.push({ id: doc.id, ...doc.data() }));
        callback(posts);
    }, (error) => console.error("Error with posts listener:", error));
}

/**
 * Sets up a real-time listener for the 'users' collection.
 * @param {function} callback - The function to call with the users data when it changes.
 * @returns {function} The unsubscribe function for the listener.
 */
export function listenToUsers(callback) {
    const q = query(collection(db, 'users'));
    return onSnapshot(q, (querySnapshot) => {
        const players = [];
        querySnapshot.forEach((doc) => players.push({ uid: doc.id, ...doc.data() }));
        callback(players);
    }, (error) => console.error("Error with users listener:", error));
}

/**
 * Fetches a single user's document.
 * @param {string} uid - The user's ID.
 * @returns {Promise<object|null>} The user's data or null if not found.
 */
export async function getUserProfile(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { uid: docSnap.id, ...docSnap.data() } : null;
}

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param {string} path - The path in storage to upload the file to (e.g., `avatars/${uid}`).
 * @param {Blob} file - The file/blob to upload.
 * @returns {Promise<string>} A promise that resolves with the public download URL of the file.
 */
export async function uploadFileAndGetURL(path, file) {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}

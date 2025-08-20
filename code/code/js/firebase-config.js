// code/js/firebase-config.js

/**
 * This file contains the Firebase configuration and initializes the Firebase services.
 * It exports the initialized services for use in other modules.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

/**
 * Firebase configuration object for the web app.
 * @type {object}
 */
const firebaseConfig = {
    apiKey: "AIzaSyA8KKDjjw0Pb_wknZ3TRWuL7-7XMo4VeY0",
    authDomain: "events-ea397.firebaseapp.com",
    databaseURL: "https://events-ea397-default-rtdb.firebaseio.com",
    projectId: "events-ea397",
    storageBucket: "events-ea397.firebasestorage.app",
    messagingSenderId: "51859633788",
    appId: "1:51859633788:web:3653d3e7edb6d3c1c4fbf9",
    measurementId: "G-0ZCMZ86PJD"
};

/**
 * The initialized Firebase app instance.
 * @type {import("firebase/app").FirebaseApp}
 */
const app = initializeApp(firebaseConfig);

/**
 * The Firebase Authentication service instance.
 * @type {import("firebase/auth").Auth}
 */
const auth = getAuth(app);

/**
 * The Cloud Firestore service instance.
 * @type {import("firebase/firestore").Firestore}
 */
const db = getFirestore(app);

/**
 * The Firebase Realtime Database service instance.
 * @type {import("firebase/database").Database}
 */
const rtdb = getDatabase(app);

/**
 * The Cloud Storage for Firebase service instance.
 * @type {import("firebase/storage").FirebaseStorage}
 */
const storage = getStorage(app);

export { app, auth, db, rtdb, storage };
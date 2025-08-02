// js/auth.js
import { onAuthStateChanged as firebaseOnAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { uploadFileAndGetURL } from './api.js';

let auth, db;
let userDocListener = null; // To keep track of the Firestore listener

/**
 * Initializes the Auth module with Firebase services.
 * @param {object} firebaseServices - An object containing initialized auth and db.
 */
export function initAuth(firebaseServices) {
    auth = firebaseServices.auth;
    db = firebaseServices.db;
}

/**
 * This is the core of the session management fix.
 * It wraps the standard Firebase auth listener. When a user logs in,
 * it immediately fetches their profile from Firestore and provides the
 * complete user object (auth + profile data) in the callback.
 * This ensures the rest of the app always has the user's full permissions.
 * @param {function} onLogin - Callback function with the full user profile.
 * @param {function} onLogout - Callback function when a user logs out.
 */
export function onAuthStateChanged(onLogin, onLogout) {
    firebaseOnAuthStateChanged(auth, (user) => {
        if (userDocListener) userDocListener(); // Unsubscribe from any previous profile listener

        if (user) {
            // User is authenticated, now get their profile from Firestore in real-time
            const userDocRef = doc(db, "users", user.uid);
            userDocListener = onSnapshot(userDocRef, (userDoc) => {
                if (userDoc.exists()) {
                    // Combine auth uid with Firestore data for a complete profile
                    const fullUserProfile = { uid: user.uid, ...userDoc.data() };
                    onLogin(fullUserProfile); // Pass the complete profile to the app
                } else {
                    // This can happen if a user is deleted from Firestore but not Auth.
                    // Treat them as logged out.
                    onLogout();
                }
            });
        } else {
            // User is not authenticated
            onLogout();
        }
    });
}

/**
 * Handles user logout.
 */
export function handleLogout() {
    signOut(auth).catch(error => console.error("Logout error:", error));
}

/**
 * Handles user login.
 */
export async function handleLogin(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Handles new user registration.
 */
export async function handleRegistration(formData) {
    const { email, password, username, alliance, allianceRank, power, avatarBlob } = formData;

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let avatarUrl = null;
    if (avatarBlob) {
        avatarUrl = await uploadFileAndGetURL(`avatars/${user.uid}`, avatarBlob);
    }

    const userProfile = {
        username, email, alliance, allianceRank,
        power: parseInt(String(power).replace(/,/g, ''), 10) || 0,
        isVerified: false, 
        avatarUrl,
        isAdmin: false,
        registrationTimestampUTC: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", user.uid), userProfile);
}

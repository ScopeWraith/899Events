// js/auth.js
import { initApi, uploadFileAndGetURL } from './api.js';
import { resizeImage } from './utils.js';

/**
 * This file handles all user authentication logic, including registration,
 * login, logout, and managing the user's session state.
 */

let auth, db;

/**
 * Initializes the Auth module with Firebase services.
 * @param {object} firebaseServices - An object containing initialized auth and db.
 */
export function initAuth(firebaseServices) {
    auth = firebaseServices.auth;
    db = firebaseServices.db;
}

/**
 * Sets up the listener for authentication state changes.
 * @param {function} onLogin - Callback function when a user logs in.
 * @param {function} onLogout - Callback function when a user logs out.
 */
export function onAuthStateChanged(onLogin, onLogout) {
    const { onAuthStateChanged } = window.firebase.auth;
    const { doc, onSnapshot } = window.firebase.firestore;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in. Listen for their profile changes.
            const userDocRef = doc(db, "users", user.uid);
            onSnapshot(userDocRef, (userDoc) => {
                if (userDoc.exists()) {
                    const currentUserData = { uid: user.uid, ...userDoc.data() };
                    onLogin(currentUserData);
                } else {
                    // This case might happen if the user record is deleted but auth state persists.
                    onLogout();
                }
            });
        } else {
            // User is signed out.
            onLogout();
        }
    });
}

/**
 * Handles the user login form submission.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<void>}
 */
export async function handleLogin(email, password) {
    const { signInWithEmailAndPassword } = window.firebase.auth;
    await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Handles user logout.
 */
export function handleLogout() {
    const { signOut } = window.firebase.auth;
    signOut(auth).catch(error => console.error("Logout error:", error));
}

/**
 * Handles the multi-step registration form submission.
 * @param {object} formData - An object containing all registration form data.
 * @returns {Promise<void>}
 */
export async function handleRegistration(formData) {
    const { createUserWithEmailAndPassword } = window.firebase.auth;
    const { setDoc, doc } = window.firebase.firestore;

    const { email, password, username, alliance, allianceRank, power, tankPower, airPower, missilePower, avatarBlob } = formData;

    // 1. Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Upload avatar if it exists
    let avatarUrl = null;
    if (avatarBlob) {
        avatarUrl = await uploadFileAndGetURL(`avatars/${user.uid}`, avatarBlob);
    }

    // 3. Create the user profile document in Firestore
    const userProfile = {
        username, email, alliance, allianceRank, 
        power: parseInt(String(power).replace(/,/g, ''), 10) || 0,
        tankPower: parseInt(String(tankPower).replace(/,/g, ''), 10) || 0,
        airPower: parseInt(String(airPower).replace(/,/g, ''), 10) || 0,
        missilePower: parseInt(String(missilePower).replace(/,/g, ''), 10) || 0,
        likes: 0, 
        allianceRole: '', 
        isVerified: false, 
        avatarUrl,
        isAdmin: email === 'mikestancato@gmail.com', // Example admin check
        registrationTimestampUTC: new Date().toISOString(),
    };
    if (userProfile.isAdmin) {
        userProfile.isVerified = true;
    }

    await setDoc(doc(db, "users", user.uid), userProfile);
}

/**
 * Sends a password reset email.
 * @param {string} email - The user's email address.
 */
export function handleForgotPassword(email) {
    const { sendPasswordResetEmail } = window.firebase.auth;
    sendPasswordResetEmail(auth, email)
        .then(() => alert('Password reset email sent! Please check your inbox.'))
        .catch((error) => alert(error.message));
}

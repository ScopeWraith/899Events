// js/auth.js

import { onAuthStateChanged as firebaseOnAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { uploadFileAndGetURL } from './api.js';

/**
 * This file handles all user authentication logic.
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
    firebaseOnAuthStateChanged(auth, (user) => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            onSnapshot(userDocRef, (userDoc) => {
                if (userDoc.exists()) {
                    const currentUserData = { uid: user.uid, ...userDoc.data() };
                    onLogin(currentUserData);
                } else {
                    onLogout();
                }
            });
        } else {
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
    await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Handles user logout.
 */
export function handleLogout() {
    signOut(auth).catch(error => console.error("Logout error:", error));
}

/**
 * Handles the multi-step registration form submission.
 * @param {object} formData - An object containing all registration form data.
 * @returns {Promise<void>}
 */
export async function handleRegistration(formData) {
    const { email, password, username, alliance, allianceRank, power, tankPower, airPower, missilePower, avatarBlob } = formData;

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let avatarUrl = null;
    if (avatarBlob) {
        avatarUrl = await uploadFileAndGetURL(`avatars/${user.uid}`, avatarBlob);
    }

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
        isAdmin: email === 'mikestancato@gmail.com',
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
    sendPasswordResetEmail(auth, email)
        .then(() => alert('Password reset email sent! Please check your inbox.'))
        .catch((error) => alert(error.message));
}

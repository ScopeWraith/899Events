// js/auth.js
import { onAuthStateChanged as firebaseOnAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { uploadFileAndGetURL } from './api.js';

let auth, db;

export function initAuth(firebaseServices) {
    auth = firebaseServices.auth;
    db = firebaseServices.db;
    // --- FIX: Ensure user stays logged in across sessions ---
    setPersistence(auth, browserLocalPersistence);
}

/**
 * --- OVERHAUL: Robust Session Management ---
 * This function is now the single source of truth for the user's session.
 * It returns a Promise that resolves only when the initial auth check is complete.
 * This prevents the app from running any user-specific logic too early.
 */
export function handleAuthStateChange() {
    return new Promise((resolve) => {
        const unsubscribe = firebaseOnAuthStateChanged(auth, async (user) => {
            unsubscribe(); // We only need the first result to start the app
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const fullUserProfile = { uid: user.uid, ...userDoc.data() };
                    resolve(fullUserProfile); // Resolve with the complete user profile
                } else {
                    resolve(null); // User exists in Auth, but not Firestore
                }
            } else {
                resolve(null); // No user is logged in
            }
        });
    });
}

/**
 * A separate listener for real-time profile updates AFTER the initial load.
 */
export function listenForProfileUpdates(uid, callback) {
    const userDocRef = doc(db, "users", uid);
    return onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
            callback({ uid, ...doc.data() });
        }
    });
}


export function handleLogout() {
    signOut(auth).catch(error => console.error("Logout error:", error));
}

export async function handleLogin(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
}

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
        isVerified: false, 
        avatarUrl,
        isAdmin: email === 'mikestancato@gmail.com', // Example admin check
        registrationTimestampUTC: new Date().toISOString(),
    };
    if (userProfile.isAdmin) userProfile.isVerified = true;

    await setDoc(doc(db, "users", user.uid), userProfile);
}

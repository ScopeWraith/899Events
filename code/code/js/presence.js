// code/js/presence.js

/**
 * This module handles user presence, updating their status to online,
 * offline, or away in both Firestore and the Realtime Database.
 */

import { db, rtdb } from './firebase-config.js';
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref as dbRef, onValue, set, onDisconnect, serverTimestamp as rtdbServerTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
import { getState, setState } from './state.js'; // CHANGED: from updateState

/**
 * Sets up presence management for the currently authenticated user.
 * It uses Firebase Realtime Database's `onDisconnect` to reliably set the user's status to 'offline'.
 * It also tracks user activity to set their status to 'away' after a period of inactivity.
 * @param {import("firebase/auth").User} user The authenticated user object.
 */
export function setupPresenceManagement(user) {
    const userStatusDatabaseRef = dbRef(rtdb, '/status/' + user.uid);
    const userStatusFirestoreRef = doc(db, '/sessions/' + user.uid);

    const isOfflineForRTDB = { status: 'offline', lastSeen: rtdbServerTimestamp() };
    const isOnlineForRTDB = { status: 'online', lastSeen: rtdbServerTimestamp() };

    const isOfflineForFirestore = { status: 'offline', lastSeen: serverTimestamp() };
    const isOnlineForFirestore = { status: 'online', lastSeen: serverTimestamp() };

    onValue(dbRef(rtdb, '.info/connected'), (snapshot) => {
        if (snapshot.val() === false) {
            setDoc(userStatusFirestoreRef, isOfflineForFirestore);
            return;
        }

        onDisconnect(userStatusDatabaseRef).set(isOfflineForRTDB).then(() => {
            set(userStatusDatabaseRef, isOnlineForRTDB);
            setDoc(userStatusFirestoreRef, isOnlineForFirestore);
        });
    });

    /**
     * Resets the timer that marks a user as 'away'. Any user activity
     * will call this function to keep their status 'online'.
     */
    function resetAwayTimer() {
        let { awayTimer, userSessions } = getState();
        if (awayTimer) clearTimeout(awayTimer);

        // Note: This checks the local state, which might have a slight delay.
        if(userSessions && userSessions[user.uid] && userSessions[user.uid].status === 'away') {
             updateUserStatus(user.uid, 'online');
        }

        awayTimer = setTimeout(() => {
            updateUserStatus(user.uid, 'away');
        }, 5 * 60 * 1000); // 5 minutes
        setState({ awayTimer }); // CHANGED: from updateState
    }

    ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetAwayTimer, { passive: true });
    });

    resetAwayTimer();
}

/**
 * Updates a user's status in both Firestore and Realtime Database.
 * @param {string} uid The user's unique ID.
 * @param {('online'|'offline'|'away')} status The new presence status.
 */
function updateUserStatus(uid, status) {
    const userStatusFirestoreRef = doc(db, '/sessions/' + uid);
    const userStatusDatabaseRef = dbRef(rtdb, '/status/' + uid);

    const statusUpdate = { status: status, lastSeen: serverTimestamp() };
    const rtdbStatusUpdate = { status: status, lastSeen: rtdbServerTimestamp() };

    setDoc(userStatusFirestoreRef, statusUpdate, { merge: true });
    set(userStatusDatabaseRef, rtdbStatusUpdate);
}
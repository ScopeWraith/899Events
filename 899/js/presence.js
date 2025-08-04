// code/js/presence.js

/**
 * This module handles user presence, updating their status to online,
 * offline, or away in both Firestore and the Realtime Database.
 */

import { db, rtdb } from './firebase-config.js';
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref as dbRef, onValue, set, onDisconnect, serverTimestamp as rtdbServerTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
import { getState, updateState } from './state.js';

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

    function resetAwayTimer() {
        let { awayTimer, userSessions } = getState();
        if (awayTimer) clearTimeout(awayTimer);
        
        if(userSessions[user.uid] && userSessions[user.uid].status === 'away') {
             updateUserStatus(user.uid, 'online');
        }

        awayTimer = setTimeout(() => {
            updateUserStatus(user.uid, 'away');
        }, 5 * 60 * 1000); // 5 minutes
        updateState({ awayTimer });
    }

    ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetAwayTimer, { passive: true });
    });
    
    resetAwayTimer();
}

function updateUserStatus(uid, status) {
    const userStatusFirestoreRef = doc(db, '/sessions/' + uid);
    const userStatusDatabaseRef = dbRef(rtdb, '/status/' + uid);

    const statusUpdate = { status: status, lastSeen: serverTimestamp() };
    const rtdbStatusUpdate = { status: status, lastSeen: rtdbServerTimestamp() };

    setDoc(userStatusFirestoreRef, statusUpdate, { merge: true });
    set(userStatusDatabaseRef, rtdbStatusUpdate);
}

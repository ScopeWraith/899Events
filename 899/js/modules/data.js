// js/modules/data.js

import { db, rtdb, storage, auth } from '../firebase-config.js';
import {
    doc, onSnapshot, collection, query, orderBy, limit, 
    where, getDocs, writeBatch, deleteDoc, addDoc, serverTimestamp, setDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref as dbRef, onValue, set, onDisconnect, serverTimestamp as rtdbServerTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
import { state } from '../app.js';
import { renderPosts, applyPlayerFilters, renderFriends, updatePlayerProfileDropdown, renderNotifications, renderMessages } from '../app.js';

export function setupAllListeners(user) {
    if (state.userDocListener) state.userDocListener();
    
    state.userDocListener = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
        if (userDoc.exists()) {
            state.currentUserData = { uid: user.uid, ...userDoc.data() };
            updatePlayerProfileDropdown();
            renderPosts();
            applyPlayerFilters();
        }
    });

    setupChatListeners();
    setupNotificationListener(user);
    setupFriendsListener(user);
}

export function detachAllListeners() {
    if (state.worldChatListener) state.worldChatListener();
    if (state.allianceChatListener) state.allianceChatListener();
    if (state.leadershipChatListener) state.leadershipChatListener();
    if (state.notificationListener) state.notificationListener();
    if (state.friendsListener) state.friendsListener();
    if (state.privateChatListener) state.privateChatListener();
}

export function initDataListeners() {
    onSnapshot(query(collection(db, 'posts')), (querySnapshot) => {
        state.allPosts = [];
        querySnapshot.forEach((doc) => state.allPosts.push({ id: doc.id, ...doc.data() }));
        renderPosts();
    });

    onSnapshot(query(collection(db, 'users')), (querySnapshot) => {
        state.allPlayers = [];
        querySnapshot.forEach((doc) => { state.allPlayers.push({uid: doc.id, ...doc.data()}); });
        applyPlayerFilters();
        renderFriends();
    });

    onSnapshot(collection(db, 'sessions'), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            state.userSessions[change.doc.id] = change.doc.data();
        });
        applyPlayerFilters();
        renderFriends();
    });
}

function setupChatListeners() {
    const user = auth.currentUser;
    if (!user) return;

    if (state.worldChatListener) state.worldChatListener();
    const worldChatQuery = query(collection(db, "world_chat"), orderBy("timestamp", "desc"), limit(50));
    state.worldChatListener = onSnapshot(worldChatQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMessages(messages, document.getElementById('world-chat-window'));
    });
}

function setupNotificationListener(user) {
    if (state.notificationListener) state.notificationListener();
    const q = query(collection(db, "notifications"), where("recipientUid", "==", user.uid), orderBy("timestamp", "desc"));
    state.notificationListener = onSnapshot(q, (snapshot) => {
        state.userNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderNotifications();
        updatePlayerProfileDropdown();
    });
}

function setupFriendsListener(user) {
    if (state.friendsListener) state.friendsListener();
    const q = collection(db, `users/${user.uid}/friends`);
    state.friendsListener = onSnapshot(q, (snapshot) => {
        state.userFriends = snapshot.docs.map(doc => doc.id);
        renderFriends();
    });
}

export function setupPresenceManagement(user) {
    const userStatusDatabaseRef = dbRef(rtdb, '/status/' + user.uid);
    const userStatusFirestoreRef = doc(db, '/sessions/' + user.uid);

    const isOfflineForFirestore = { status: 'offline', lastSeen: serverTimestamp() };
    const isOnlineForFirestore = { status: 'online', lastSeen: serverTimestamp() };

    onValue(dbRef(rtdb, '.info/connected'), (snapshot) => {
        if (snapshot.val() === false) {
            setDoc(userStatusFirestoreRef, isOfflineForFirestore);
            return;
        }
        onDisconnect(userStatusDatabaseRef).set({ status: 'offline', lastSeen: rtdbServerTimestamp() }).then(() => {
            set(userStatusDatabaseRef, { status: 'online', lastSeen: rtdbServerTimestamp() });
            setDoc(userStatusFirestoreRef, isOnlineForFirestore);
        });
    });
}
// js/app.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

import { firebaseConfig } from './firebase-config.js';
import { DOMElements, initParticles, renderSkeletons, showPage, renderPosts, updateUIForLoggedInUser, updateUIForLoggedOutUser, renderPlayers, renderMessages, renderFriendsLists } from './ui.js';
import { initApi, listenToPosts, listenToUsers, listenToChat, listenToFriends, sendMessage, deleteMessage, sendFriendRequest, acceptFriendRequest, removeOrDeclineFriend } from './api.js';
import { initAuth, onAuthStateChanged, handleLogout } from './auth.js';

/**
 * Main application entry point.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. INITIALIZATION ---
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    const firebaseServices = { app, auth, db, storage };

    initApi(firebaseServices);
    initAuth(firebaseServices);
    initParticles();
    renderSkeletons();

    // --- 2. STATE MANAGEMENT ---
    let currentUserData = null;
    let allPosts = [];
    let allPlayers = [];
    let friendsData = [];
    let socialListeners = [];

    // --- 3. AUTHENTICATION LISTENER ---
    onAuthStateChanged(
        (user) => {
            currentUserData = user;
            updateUIForLoggedInUser(user);
            renderPosts(allPosts, currentUserData);
            renderPlayers(allPlayers, currentUserData);
            setupSocialListeners();
        },
        () => {
            currentUserData = null;
            updateUIForLoggedOutUser();
            renderPosts(allPosts, null);
            renderPlayers(allPlayers, null);
            detachSocialListeners();
        }
    );

    // --- 4. DATA LISTENERS ---
    listenToPosts((posts) => {
        allPosts = posts;
        renderPosts(allPosts, currentUserData);
    });

    listenToUsers((players) => {
        allPlayers = players;
        renderPlayers(allPlayers, currentUserData);
        renderFriendsLists(friendsData, allPlayers); // Re-render friends with updated player info
    });

    function setupSocialListeners() {
        detachSocialListeners();
        if (!currentUserData) return;

        const worldChatListener = listenToChat('world-chat', null, (messages) => {
            renderMessages(messages, document.getElementById('world-chat-window'), 'world-chat', allPlayers, currentUserData);
        });
        socialListeners.push(worldChatListener);

        if (currentUserData.alliance) {
            const allianceChatListener = listenToChat('alliance-chat', currentUserData.alliance, (messages) => {
                renderMessages(messages, document.getElementById('alliance-chat-window'), 'alliance-chat', allPlayers, currentUserData);
            });
            const leadershipChatListener = listenToChat('leadership-chat', currentUserData.alliance, (messages) => {
                renderMessages(messages, document.getElementById('leadership-chat-window'), 'leadership-chat', allPlayers, currentUserData);
            });
            socialListeners.push(allianceChatListener, leadershipChatListener);
        }
        
        const friendsListener = listenToFriends(currentUserData.uid, (data) => {
            friendsData = data;
            renderFriendsLists(friendsData, allPlayers);
        });
        socialListeners.push(friendsListener);
    }

    function detachSocialListeners() {
        socialListeners.forEach(unsubscribe => unsubscribe());
        socialListeners = [];
    }

    // --- 5. GLOBAL EVENT LISTENERS ---
    DOMElements.mainNav.addEventListener('click', (e) => {
        const navLink = e.target.closest('.nav-link');
        if (navLink && navLink.dataset.mainTarget) {
            showPage(navLink.dataset.mainTarget);
        }
    });

    DOMElements.loginBtn.addEventListener('click', () => {
        // showAuthModal('login'); 
    });
    
    DOMElements.logoutBtn.addEventListener('click', handleLogout);
    
    // Player Page Listeners
    DOMElements.playersPage.addEventListener('input', (e) => {
        if (e.target.matches('#player-search-input, #alliance-filter')) {
            const searchTerm = document.getElementById('player-search-input').value.toLowerCase();
            const allianceFilter = document.getElementById('alliance-filter').value;
            const filtered = allPlayers.filter(p => 
                p.username.toLowerCase().includes(searchTerm) &&
                (!allianceFilter || p.alliance === allianceFilter)
            );
            renderPlayers(filtered, currentUserData);
        }
    });

    DOMElements.playersPage.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('button[data-action="add-friend"]');
        if (actionBtn && currentUserData) {
            sendFriendRequest(currentUserData.uid, actionBtn.dataset.uid);
            actionBtn.innerHTML = '<i class="fas fa-user-clock"></i>';
            actionBtn.disabled = true;
        }
    });

    // Social Page Listeners
    DOMElements.socialPage.addEventListener('click', (e) => {
        // Tab switching
        const tabBtn = e.target.closest('.social-tab-btn');
        if (tabBtn) {
            DOMElements.socialPage.querySelectorAll('.social-tab-btn').forEach(b => b.classList.remove('active'));
            tabBtn.classList.add('active');
            DOMElements.socialPage.querySelectorAll('.social-content-pane').forEach(p => p.classList.remove('active'));
            document.getElementById(`pane-${tabBtn.dataset.tab}`).classList.add('active');
        }

        // Friend actions
        const friendActionBtn = e.target.closest('.friend-action-btn');
        if (friendActionBtn && currentUserData) {
            const targetUid = friendActionBtn.dataset.uid;
            const action = friendActionBtn.dataset.action;
            if (action === 'accept') acceptFriendRequest(currentUserData.uid, targetUid);
            if (action === 'decline' || action === 'cancel' || action === 'remove') removeOrDeclineFriend(currentUserData.uid, targetUid);
        }

        // Delete message
        const deleteBtn = e.target.closest('.delete-message-btn');
        if (deleteBtn && currentUserData) {
            deleteMessage(deleteBtn.dataset.type, currentUserData.alliance, deleteBtn.dataset.id);
        }
    });

    DOMElements.socialPage.addEventListener('submit', (e) => {
        e.preventDefault();
        const formId = e.target.id;
        if (!formId.endsWith('-form') || !currentUserData) return;
        
        const chatType = formId.replace('-form', '');
        const input = document.getElementById(`${chatType}-input`);
        const text = input.value.trim();
        if (text === '') return;

        const messageData = {
            text,
            authorUid: currentUserData.uid,
            authorUsername: currentUserData.username,
            authorAvatarUrl: currentUserData.avatarUrl || null,
            timestamp: new Date() // Using client-side timestamp for simplicity, serverTimestamp is better
        };
        
        sendMessage(chatType, currentUserData.alliance, messageData);
        input.value = '';
    });


    // --- 6. INITIAL PAGE LOAD ---
    showPage('page-events');
});

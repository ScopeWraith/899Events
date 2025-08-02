// js/app.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

import { firebaseConfig } from './firebase-config.js';
import * as ui from './ui.js';
import * as api from './api.js';
import * as auth from './auth.js';
import { isUserLeader, resizeImage } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. INITIALIZATION ---
    const app = initializeApp(firebaseConfig);
    const firebaseServices = {
        app: app,
        auth: getAuth(app),
        db: getFirestore(app),
        storage: getStorage(app)
    };

    api.initApi(firebaseServices);
    auth.initAuth(firebaseServices);
    ui.initParticles();
    ui.renderSkeletons();

    // --- 2. STATE MANAGEMENT ---
    let currentUserData = null;
    let allPosts = [];
    let allPlayers = [];
    let friendsData = [];
    let notifications = [];
    let socialListeners = [];
    let notificationListener = null;

    // --- 3. SESSION MANAGEMENT & AUTH LISTENER ---
    let isAuthReady = false;
    auth.onAuthStateChanged(
        (user) => {
            currentUserData = user;
            ui.updateUIForLoggedInUser(user);
            ui.updateSocialTabPermissions(user);
            renderAllContent();
            setupDataListeners();
            
            if (!isAuthReady) {
                isAuthReady = true;
                ui.hideGlobalLoader();
            }
        },
        () => {
            currentUserData = null;
            ui.updateUIForLoggedOutUser();
            ui.updateSocialTabPermissions(null);
            renderAllContent();
            detachAllListeners();

            if (!isAuthReady) {
                isAuthReady = true;
                ui.hideGlobalLoader();
            }
        }
    );

    function renderAllContent() {
        ui.renderPosts(allPosts, currentUserData);
        ui.renderPlayers(allPlayers, currentUserData);
        ui.renderFriendsLists(friendsData, allPlayers);
        ui.renderFeed(notifications, allPlayers);
    }
    
    function setupDataListeners() {
        detachAllListeners(); // Ensure no duplicate listeners
        
        api.listenToPosts((posts) => { allPosts = posts; ui.renderPosts(allPosts, currentUserData); });
        api.listenToUsers((players) => { allPlayers = players; renderAllContent(); });

        if (currentUserData) {
            socialListeners.push(api.listenToChat('world-chat', null, (messages) => ui.renderMessages(messages, 'world-chat', allPlayers, currentUserData)));
            if (currentUserData.alliance && currentUserData.isVerified) {
                socialListeners.push(api.listenToChat('alliance-chat', currentUserData.alliance, (messages) => ui.renderMessages(messages, 'alliance-chat', allPlayers, currentUserData)));
            }
            if (currentUserData.alliance && isUserLeader(currentUserData)) {
                socialListeners.push(api.listenToChat('leadership-chat', currentUserData.alliance, (messages) => ui.renderMessages(messages, 'leadership-chat', allPlayers, currentUserData)));
            }
            socialListeners.push(api.listenToFriends(currentUserData.uid, (data) => { friendsData = data; ui.renderFriendsLists(friendsData, allPlayers); }));
            
            notificationListener = api.listenToNotifications(currentUserData.uid, (data) => {
                notifications = data;
                ui.renderFeed(notifications, allPlayers);
                ui.updateNotificationBadge(notifications);
            });
        }
    }

    function detachAllListeners() {
        socialListeners.forEach(unsubscribe => unsubscribe());
        socialListeners = [];
        if (notificationListener) notificationListener();
        notificationListener = null;
    }

    // --- 5. GLOBAL EVENT LISTENERS ---
    ui.DOMElements.mainNav.addEventListener('click', (e) => {
        const navLink = e.target.closest('.nav-link');
        if (navLink) ui.showPage(navLink.dataset.mainTarget);
    });
    
    ui.DOMElements.loginBtn.addEventListener('click', () => ui.showAuthModal('login'));
    
    ui.DOMElements.playerCardBtn.addEventListener('click', () => {
        if (currentUserData) {
            ui.renderEditProfileModal(currentUserData);
            document.getElementById('close-edit-modal-btn').addEventListener('click', () => ui.DOMElements.editProfileModalContainer.innerHTML = '');
            document.getElementById('modal-logout-btn').addEventListener('click', auth.handleLogout);
            document.getElementById('modal-upload-avatar-btn').addEventListener('click', () => document.getElementById('modal-avatar-input').click());
            document.getElementById('modal-avatar-input').addEventListener('change', handleModalAvatarChange);
            document.getElementById('edit-profile-form').addEventListener('submit', handleProfileUpdate);
        }
    });
    
    async function handleModalAvatarChange(e) { /* ... implementation ... */ }
    async function handleProfileUpdate(e) { /* ... implementation ... */ }

    // --- Initial Page Load ---
    ui.showPage('page-events');
});

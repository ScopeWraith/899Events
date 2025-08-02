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
    let isInitialLoad = true;

    // --- 3. SESSION MANAGEMENT & AUTH LISTENER ---
    auth.onAuthStateChanged(
        (userProfile) => {
            currentUserData = userProfile;
            ui.updateUIForLoggedInUser(userProfile);
            ui.updateSocialTabPermissions(userProfile);
            renderAllContent();
            setupDataListeners();
            
            if (isInitialLoad) {
                isInitialLoad = false;
                ui.hideGlobalLoader();
            }
        },
        () => { // onLogout callback
            currentUserData = null;
            ui.updateUIForLoggedOutUser();
            ui.updateSocialTabPermissions(null);
            renderAllContent();
            detachAllListeners();

            if (isInitialLoad) {
                isInitialLoad = false;
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
        detachAllListeners(); 
        
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
                ui.updateNotificationBadge(data);
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
    
    /**
     * --- FIX: Simplified Login Button Listener ---
     * This now just calls the self-contained showAuthModal function from the UI module.
     * It passes the actual login function from the auth module as a callback.
     * This is much cleaner and prevents the crash.
     */
    ui.DOMElements.loginBtn.addEventListener('click', () => {
        ui.showAuthModal('login', auth.handleLogin, auth.handleRegistration);
    });
    
    ui.DOMElements.playerCardBtn.addEventListener('click', () => {
        if (currentUserData) {
            ui.renderEditProfileModal(currentUserData);
            document.getElementById('close-edit-modal-btn').addEventListener('click', () => ui.DOMElements.editProfileModalContainer.innerHTML = '');
            document.getElementById('modal-logout-btn').addEventListener('click', auth.handleLogout);
            // ... other edit profile listeners ...
        }
    });

    // --- Initial Page Load ---
    ui.showPage('page-events');
});

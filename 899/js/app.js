// js/app.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

import { firebaseConfig } from './firebase-config.js';
import * as ui from './ui.js';
import * as api from './api.js';
import * as auth from './auth.js';
import { isUserLeader } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. INITIALIZATION ---
    const app = initializeApp(firebaseConfig);
    const firebaseAuth = getAuth(app);
    const firebaseServices = {
        app,
        auth: firebaseAuth,
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
    let dataListeners = [];

    // --- 3. SESSION MANAGEMENT & APP START ---
    // --- OVERHAUL: Wait for the initial auth check to complete ---
    currentUserData = await auth.handleAuthStateChange();
    startApp();

    function startApp() {
        // Now that we know the initial auth state, render everything
        updateUIBasedOnAuth();
        setupDataListeners();
        setupGlobalEventListeners();
        ui.hideGlobalLoader();
        ui.showPage('page-events');
    }
    
    // Listen for subsequent auth changes (login/logout after initial load)
    onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
            const userProfile = await api.getUserProfile(user.uid);
            if (userProfile) {
                currentUserData = userProfile;
            }
        } else {
            currentUserData = null;
        }
        updateUIBasedOnAuth();
        setupDataListeners(); // Re-setup listeners with new permissions
    });

    function updateUIBasedOnAuth() {
        if (currentUserData) {
            ui.updateUIForLoggedInUser(currentUserData);
        } else {
            ui.updateUIForLoggedOutUser();
        }
        ui.updateSocialTabPermissions(currentUserData);
        // Re-render content with correct user context
        ui.renderPosts(allPosts, currentUserData);
        ui.renderPlayers(allPlayers, currentUserData);
    }
    
    function setupDataListeners() {
        // Clear all previous listeners to prevent duplicates
        dataListeners.forEach(unsubscribe => unsubscribe());
        dataListeners = [];

        // Public listeners that run for everyone
        dataListeners.push(api.listenToPosts((posts) => { allPosts = posts; ui.renderPosts(allPosts, currentUserData); }));
        dataListeners.push(api.listenToUsers((players) => { allPlayers = players; ui.renderPlayers(allPlayers, currentUserData); }));

        // User-specific listeners
        if (currentUserData) {
            dataListeners.push(api.listenToChat('world-chat', null, (messages) => ui.renderMessages(messages, 'world-chat', allPlayers, currentUserData)));
            
            if (currentUserData.alliance && currentUserData.isVerified) {
                dataListeners.push(api.listenToChat('alliance-chat', currentUserData.alliance, (messages) => ui.renderMessages(messages, 'alliance-chat', allPlayers, currentUserData)));
            }
            if (currentUserData.alliance && isUserLeader(currentUserData)) {
                dataListeners.push(api.listenToChat('leadership-chat', currentUserData.alliance, (messages) => ui.renderMessages(messages, 'leadership-chat', allPlayers, currentUserData)));
            }
            // ... add other user-specific listeners like friends, notifications etc.
        }
    }

    function setupGlobalEventListeners() {
        ui.DOMElements.mainNav.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) ui.showPage(navLink.dataset.mainTarget);
        });
        
        ui.DOMElements.loginBtn.addEventListener('click', () => {
            ui.showAuthModal('login', auth.handleLogin, auth.handleRegistration);
        });
        
        ui.DOMElements.playerCardBtn.addEventListener('click', () => {
            if (currentUserData) {
                ui.renderEditProfileModal(currentUserData);
                document.getElementById('close-edit-modal-btn').addEventListener('click', () => ui.DOMElements.editProfileModalContainer.innerHTML = '');
                document.getElementById('modal-logout-btn').addEventListener('click', auth.handleLogout);
            }
        });
    }
});

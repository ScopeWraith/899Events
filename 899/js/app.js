// js/app.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

import { firebaseConfig } from './firebase-config.js';
import { DOMElements, initParticles, renderSkeletons, showPage, renderPosts, updateUIForLoggedInUser, updateUIForLoggedOutUser } from './ui.js';
import { initApi, listenToPosts, listenToUsers } from './api.js';
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

    // --- 3. AUTHENTICATION LISTENER ---
    onAuthStateChanged(
        (user) => {
            currentUserData = user;
            updateUIForLoggedInUser(user);
            renderPosts(allPosts, currentUserData);
            // Future task: render players with user context
        },
        () => {
            currentUserData = null;
            updateUIForLoggedOutUser();
            renderPosts(allPosts, null);
             // Future task: render players without user context
        }
    );

    // --- 4. DATA LISTENERS ---
    listenToPosts((posts) => {
        allPosts = posts;
        renderPosts(allPosts, currentUserData);
    });

    listenToUsers((players) => {
        allPlayers = players;
        console.log("Players updated:", allPlayers);
        // Future task: render players
    });

    // --- 5. GLOBAL EVENT LISTENERS ---
    DOMElements.mainNav.addEventListener('click', (e) => {
        const navLink = e.target.closest('.nav-link');
        if (navLink && navLink.dataset.mainTarget) {
            showPage(navLink.dataset.mainTarget);
        }
    });

    DOMElements.loginBtn.addEventListener('click', () => {
        console.log("Login button clicked - modal logic to be implemented");
        // showAuthModal('login'); 
    });
    
    DOMElements.logoutBtn.addEventListener('click', handleLogout);

    document.body.addEventListener('input', (e) => {
        if (e.target.matches('.power-input')) {
            let value = String(e.target.value).replace(/,/g, '');
            if (isNaN(value)) { 
                e.target.value = ''; 
                return; 
            }
            e.target.value = Number(value).toLocaleString('en-US');
        }
    });

    // --- 6. INITIAL PAGE LOAD ---
    showPage('page-events');
});

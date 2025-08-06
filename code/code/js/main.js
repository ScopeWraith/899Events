// code/js/main.js

/**
 * This is the main entry point for the application's JavaScript.
 * It imports all other modules and orchestrates the initial setup,
 * including event listeners and the initial rendering of content.
 */

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { initializeAllEventListeners } from './event-listeners.js';
import { setupInitialUI, showPage, buildMobileNav, updateUIForLoggedInUser, updateUIForLoggedOutUser, renderSkeletons } from './ui/ui-manager.js';
import { setupAllListeners, detachAllListeners, fetchInitialData } from './firestore.js';
import { setupPresenceManagement } from './presence.js';
import { setCallbacks } from './state.js';

// --- INITIALIZATION ---

// Set callbacks to allow other modules to trigger UI updates
setCallbacks({
    onAuthChange: (user) => {
        if (user) {
            updateUIForLoggedInUser();
        } else {
            updateUIForLoggedOutUser();
        }
        buildMobileNav();
    }
});

// Listen for auth state changes to update UI and listeners accordingly
onAuthStateChanged(auth, (user) => {
    detachAllListeners(); // Always detach old listeners on auth change

    if (user) {
        setupPresenceManagement(user);
        setupAllListeners(user);
    } else {
        // For logged-out users, we still want to fetch public data
        fetchInitialData();
    }
    
    // Update the UI based on the new auth state
    if (user) {
        updateUIForLoggedInUser();
    } else {
        updateUIForLoggedOutUser();
    }
    buildMobileNav();

    // Hide preloader after first auth check
    const appPreloader = document.getElementById('app-preloader');
    const appContainer = document.getElementById('app-container');
    appPreloader.style.opacity = '0';
    setTimeout(() => {
        appPreloader.style.display = 'none';
        appContainer.style.display = 'block';
    }, 500);
});

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    renderSkeletons();
    setupInitialUI();
    initializeAllEventListeners();
    showPage('page-news');
    toggleSubNav('news-submenu'); 
});

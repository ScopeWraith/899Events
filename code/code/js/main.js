// code/js/main.js

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { initializeAllEventListeners } from './event-listeners.js';
import { setupInitialUI, buildMobileNav, updateUIForLoggedInUser, updateUIForLoggedOutUser, toggleSubNav, updateSocialNavBadges, navigateTo } from './ui/ui-manager.js';
import { setupAllListeners, detachAllListeners, fetchInitialData } from './firestore.js';
import { setupPresenceManagement } from './presence.js';
import { setCallbacks } from './state.js';

// --- INITIALIZATION ---
setCallbacks({
    onAuthChange: (user) => {
        if (user) {
            updateUIForLoggedInUser();
        } else {
            updateUIForLoggedOutUser();
        }
        buildMobileNav();
    },
    onUnreadMessagesUpdate: (unreadCount) => {
        updateSocialNavBadges({ convoCount: unreadCount });
    },
    onUnreadFriendRequestsUpdate: (requestCount) => {
        updateSocialNavBadges({ friendRequestCount: requestCount });
    }
});

onAuthStateChanged(auth, (user) => {
    detachAllListeners();

    const onDataReady = () => {
        restoreLastViewedPage();
        // Fade in the app content once data is ready
        const appPreloader = document.getElementById('app-preloader');
        const appContainer = document.getElementById('app-container');
        appPreloader.style.opacity = '0';
        setTimeout(() => {
            appPreloader.style.display = 'none';
            appContainer.style.display = 'block';
        }, 500);
    };

    if (user) {
        setupPresenceManagement(user);
        updateUIForLoggedInUser();
        setupAllListeners(user, onDataReady);
    } else {
        updateUIForLoggedOutUser();
        fetchInitialData(onDataReady);
    }
    
    buildMobileNav();
});

function restoreLastViewedPage() {
    const lastPage = localStorage.getItem('lastActivePage') || 'page-news';
    const lastSubPage = localStorage.getItem('lastActiveSubPage');

    // Restore the session using the unified navigation function
    navigateTo({ mainTarget: lastPage, subTarget: lastSubPage });
}

document.addEventListener('DOMContentLoaded', () => {
    setupInitialUI();
    initializeAllEventListeners();
});
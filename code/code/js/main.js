// code/js/main.js

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { initializeAllEventListeners } from './event-listeners.js';
import { setupInitialUI, showPage, buildMobileNav, updateUIForLoggedInUser, updateUIForLoggedOutUser, renderSkeletons, toggleSubNav, updateSocialNavBadges, handleSubNavClick } from './ui/ui-manager.js';
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
        updateUIForLoggedInUser(); // Update UI immediately
        setupAllListeners(user, onDataReady); // Pass callback
        restoreLastViewedPage(); // Restore the view immediately
    } else {
        updateUIForLoggedOutUser(); // Update UI immediately
        fetchInitialData(onDataReady); // Fetch public data and then restore view
        restoreLastViewedPage(); // Restore the view immediately
    }

    buildMobileNav();
});

function restoreLastViewedPage() {
    const lastPage = localStorage.getItem('lastActivePage') || 'page-news';
    const lastSubPage = localStorage.getItem('lastActiveSubPage');

    showPage(lastPage);

    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        const isActive = link.dataset.mainTarget === lastPage;
        link.classList.toggle('active', isActive);
        if (isActive) {
            const submenuId = link.closest('.nav-item').dataset.submenuId;
            toggleSubNav(submenuId);
        }
    });

    // If there's a specific sub-page saved, go there.
    if (lastSubPage) {
        handleSubNavClick(lastSubPage);
    } else {
        // Otherwise, determine the default based on the active main page.
        let defaultSubPage;
        switch (lastPage) {
            case 'page-social':
                defaultSubPage = 'social-chat';
                break;
            case 'page-server':
                defaultSubPage = 'server-alliances';
                break;
            case 'page-news':
            default:
                defaultSubPage = 'news-all';
                break;
        }
        handleSubNavClick(defaultSubPage);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupInitialUI();
    initializeAllEventListeners();
});
// code/js/main.js

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { initializeAllEventListeners } from './event-listeners.js';
import { setupInitialUI, showPage, buildMobileNav, updateUIForLoggedInUser, updateUIForLoggedOutUser, renderSkeletons, toggleSubNav, updateSocialNavBadges } from './ui/ui-manager.js';
import { setupAllListeners, detachAllListeners, fetchInitialData, setupUnverifiedPlayersListener } from './firestore.js';
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
    // NEW: Callback to update the badges on the social sub-nav
    onUnreadMessagesUpdate: (unreadCount) => {
        updateSocialNavBadges({ convoCount: unreadCount });
    },
    onUnreadFriendRequestsUpdate: (requestCount) => {
        updateSocialNavBadges({ friendRequestCount: requestCount });
    }
});

onAuthStateChanged(auth, (user) => {
    detachAllListeners();

    if (user) {
        setupPresenceManagement(user);
        setupAllListeners(user);
    } else {
        fetchInitialData();
    }
    
    if (user) {
        updateUIForLoggedInUser();
    } else {
        updateUIForLoggedOutUser();
    }
    buildMobileNav();

    const appPreloader = document.getElementById('app-preloader');
    const appContainer = document.getElementById('app-container');
    appPreloader.style.opacity = '0';
    setTimeout(() => {
        appPreloader.style.display = 'none';
        appContainer.style.display = 'block';
    }, 500);
});

document.addEventListener('DOMContentLoaded', () => {
    setupInitialUI();
    initializeAllEventListeners();
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

    if (lastSubPage) {
        handleSubNavClick(lastSubPage);
    } else {
        // If there's no saved sub-page, default to the first one in the active menu
        const activeSubmenu = document.querySelector('.sub-nav-content:not(.hidden)');
        if (activeSubmenu) {
            const firstSubNavLink = activeSubmenu.querySelector('.sub-nav-link');
            if (firstSubNavLink) {
                handleSubNavClick(firstSubNavLink.dataset.subTarget);
            }
        }
    }
});
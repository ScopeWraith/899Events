// code/js/app.js

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from './firebase-config.js';
import { subscribe, setState, getState } from './state.js';
import { setupAllListeners, detachAllListeners, fetchInitialData, setupUnverifiedPlayersListener } from './firestore.js';
import { setupPresenceManagement } from './presence.js';
import { 
    setupInitialUI, 
    buildMobileNav, 
    updateSocialNavBadges,
    showPage,
    toggleSubNav,
    handleSubNavClick
} from './ui/ui-manager.js';
import { initializeAllEventListeners } from './event-listeners.js';
import { initializeAuthUI } from './ui/auth-ui.js';
import { initializeSocialUI } from './ui/social-ui.js';
import { initializePostUI } from './ui/post-ui.js';
import { initializePlayersUI } from './ui/players-ui.js';
import { initializeAlliancesUI } from './ui/alliances-ui.js';
import { initializeNotificationsUI } from './ui/notifications-ui.js'; 

function restoreLastViewedPage() {
    const lastPage = localStorage.getItem('lastActivePage') || 'page-news';
    const lastSubPage = localStorage.getItem('lastActiveSubPage');
    showPage(lastPage);

    let activeSubNavContainer = null;
    // Activate the correct main nav link and show its sub-nav
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        const isActive = link.dataset.mainTarget === lastPage;
        link.classList.toggle('active', isActive);
        if (isActive) {
            const submenuId = link.closest('.nav-item').dataset.submenuId;
            toggleSubNav(submenuId);
            if (submenuId) {
                activeSubNavContainer = document.getElementById(submenuId);
            }
        }
    });

    // Validate that the last sub-page belongs to the current main page
    const isSubPageValid = lastSubPage && activeSubNavContainer && activeSubNavContainer.querySelector(`[data-sub-target="${lastSubPage}"]`);

    if (isSubPageValid) {
        handleSubNavClick(lastSubPage);
    } else {
        // If not valid or not set, determine the default for the current page
        let defaultSubTarget;
        switch (lastPage) {
            case 'page-social': defaultSubTarget = 'social-chat'; break;
            case 'page-server': defaultSubTarget = 'server-alliances'; break;
            case 'page-news':
            default:
                defaultSubTarget = 'news-all'; break;
        }
        // Directly call the handler for robustness instead of simulating a click
        if (defaultSubTarget) {
            handleSubNavClick(defaultSubTarget);
        }
    }
}


function showAppContent() {
    const appPreloader = document.getElementById('app-preloader');
    const appContainer = document.getElementById('app-container');
    appPreloader.style.opacity = '0';
    setTimeout(() => {
        appPreloader.style.display = 'none';
        appContainer.style.display = 'block';
    }, 500);
}

export function initializeApp() {
    subscribe((newState, prevState) => {
        if (newState.currentUserData !== prevState.currentUserData) {
            buildMobileNav();
        }
        if (newState.userNotifications !== prevState.userNotifications) {
            const unreadFriendRequests = (newState.userNotifications || []).filter(n => n.type === 'friend_request' && !n.isRead).length;
            updateSocialNavBadges({ friendRequestCount: unreadFriendRequests });
        }
    });

    onAuthStateChanged(auth, (user) => {
        detachAllListeners();
        const onDataReady = () => {
            restoreLastViewedPage();
            showAppContent();
        };
        if (user) {
            setupPresenceManagement(user);
            setupAllListeners(user, () => {
                // Now that the user's data is loaded (including isAdmin status),
                // we can set up the verification listener.
                const { currentUserData } = getState();
                if (currentUserData) {
                    setupUnverifiedPlayersListener(currentUserData);
                }
                onDataReady();
            });
        } else {
            setState({ currentUserData: null, unverifiedPlayers: [] });
            fetchInitialData(onDataReady);
        }
        buildMobileNav();
    });
    
    setupInitialUI();
    initializeAllEventListeners();
    initializeAuthUI();
    initializeAuthEventListeners();
    initializeSocialUI();
    initializePostUI();
    initializePlayersUI();
    initializeAlliancesUI();
    initializeNotificationsUI(); 
}
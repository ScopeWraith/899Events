// code/js/app.js

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from './firebase-config.js';
import { subscribe, setState } from './state.js';
import { setupAllListeners, detachAllListeners, fetchInitialData } from './firestore.js';
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

    // Show the main page first
    showPage(lastPage);

    // If there's a specific sub-page saved, click it.
    // Otherwise, the showPage function will now handle picking the default.
    if (lastSubPage) {
        // We find the link and click it to ensure all related logic runs
        const subNavLink = document.querySelector(`.sub-nav-link[data-sub-target="${lastSubPage}"]`);
        if (subNavLink) {
            subNavLink.click();
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
            setupAllListeners(user, onDataReady);
        } else {
            setState({ currentUserData: null });
            fetchInitialData(onDataReady);
        }
        buildMobileNav();
    });
    
    setupInitialUI();
    initializeAllEventListeners();
    initializeAuthUI();
    initializeSocialUI();
    initializePostUI();
    initializePlayersUI();
    initializeAlliancesUI();
    initializeNotificationsUI();
}
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
    const appPreloader = document.getElementById('app-preloader');
    const appContainer = document.getElementById('app-container');

    // --- ⬇️ NEW LOADING LOGIC ⬇️ ---
    // 1. Show the main app shell and navigation immediately.
    appPreloader.style.opacity = '0';
    setTimeout(() => {
        appPreloader.style.display = 'none';
        appContainer.style.display = 'block';
    }, 500);

    // 2. Render skeleton loaders for content pages.
    renderSkeletons('news');
    renderSkeletons('players');
    renderSkeletons('alliances');
    
    // 3. Setup UI based on authentication state.
    if (user) {
        updateUIForLoggedInUser();
        setupPresenceManagement(user);
        // 4. Fetch all data. Listeners will replace skeletons with real content.
        setupAllListeners(user, () => {
             restoreLastViewedPage(); // Restore page only after all data is loaded
        });
    } else {
        updateUIForLoggedOutUser();
        // 4. Fetch public data. Listeners will replace skeletons.
        fetchInitialData(() => {
            restoreLastViewedPage();
        });
    }
    
    buildMobileNav(); // Build nav for both logged-in and out states
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

    if (lastSubPage) {
        handleSubNavClick(lastSubPage);
    } else {
        // --- THIS IS THE CORRECTED LOGIC ---
        // If no sub-page is saved, determine the default based on the main page.
        let defaultSubTarget;
        switch (lastPage) {
            case 'page-social':
                defaultSubTarget = 'social-chat';
                break;
            case 'page-server':
                defaultSubTarget = 'server-alliances';
                break;
            case 'page-news':
            default:
                defaultSubTarget = 'news-all';
                break;
        }
        
        const defaultSubNavLink = document.querySelector(`.sub-nav-link[data-sub-target="${defaultSubTarget}"]`);
        if (defaultSubNavLink) {
            defaultSubNavLink.click();
        }
        // --- END CORRECTION ---
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupInitialUI();
    initializeAllEventListeners();
});
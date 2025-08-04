// js/app.js

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth, db } from './firebase-config.js';
import { initAuth } from './modules/auth.js';
import { initUI, showPage, renderSkeletons, updateCountdowns, renderAnnouncements, renderEvents, buildFilterControls, applyPlayerFilters as uiApplyPlayerFilters, renderPlayers, buildMobileNav as uiBuildMobileNav, renderNotifications as uiRenderNotifications, renderMessages as uiRenderMessages, updatePlayerProfileDropdown as uiUpdatePlayerProfileDropdown, renderFriends as uiRenderFriends } from './modules/ui.js';
import { initDataListeners, setupAllListeners, detachAllListeners, setupPresenceManagement } from './modules/data.js';

export const state = {
    currentUserData: null,
    allPlayers: [],
    allPosts: [],
    userSessions: {},
    userNotifications: [],
    userFriends: [],
    activeFilter: 'all',
    countdownInterval: null,
    editingPostId: null,
    actionPostId: null,
    activePrivateChatId: null,
    activePrivateChatPartner: null,
    postCreationData: {},
    worldChatListener: null,
    allianceChatListener: null,
    leadershipChatListener: null,
    sessionsListener: null,
    notificationListener: null,
    friendsListener: null,
    privateChatListener: null,
    userDocListener: null,
};

export const constants = {
    ALLIANCES: ["THOR", "fAfO", "HeRA", "pHNx", "TroW", "VaLT", "COLD", "Tone", "DoM", "MINI", "MEGA", "Lat1", "WSKT", "ValT", "BRSL", "TCM1", "BLSD", "REI", "wpg1", "SHRK"],
    ALLIANCE_RANKS: [
        { value: 'R5', text: 'R5 (Leader)'}, { value: 'R4', text: 'R4'}, { value: 'R3', text: 'R3'},
        { value: 'R2', text: 'R2'}, { value: 'R1', text: 'R1 (Member)'},
    ],
    ALLIANCE_ROLES: [
        { value: '', text: 'None'}, { value: 'Warlord', text: 'Warlord'}, { value: 'Recruiter', text: 'Recruiter'},
        { value: 'Muse', text: 'Muse'}, { value: 'Butler', text: 'Butler'},
    ],
    DAYS_OF_WEEK: [
        { value: '0', text: 'Sunday' }, { value: '1', text: 'Monday' }, { value: '2', text: 'Tuesday' },
        { value: '3', text: 'Wednesday' }, { value: '4', text: 'Thursday' }, { value: '5', text: 'Friday' },
        { value: '6', text: 'Saturday' }
    ],
    HOURS_OF_DAY: Array.from({ length: 24 }, (_, i) => ({
        value: i.toString(),
        text: `${i.toString().padStart(2, '0')}:00`
    })),
    REPEAT_TYPES: [
        { value: 'none', text: 'None' },
        { value: 'weekly', text: 'Weekly' }
    ],
    POST_TYPES: {
        server_announcement: { mainType: 'announcement', subType: 'server', text: 'Server Announcement', isAdminOnly: true, visibility: 'public' },
        leadership_announcement: { mainType: 'announcement', subType: 'leadership', text: 'Leadership Announcement', allowedRanks: ['R5'], visibility: 'public' },
        alliance_announcement: { mainType: 'announcement', subType: 'alliance', text: 'Alliance Announcement', allowedRanks: ['R5', 'R4'], visibility: 'alliance' },
        alliance_event: { mainType: 'event', subType: 'alliance', text: 'Alliance Event', allowedRanks: ['R5', 'R4'], isVerifiedRequired: true, visibility: 'alliance' },
        server_event: { mainType: 'event', subType: 'server', text: 'Server Event', isAdminOnly: true, visibility: 'public' },
        seasonal_event: { mainType: 'event', subType: 'seasonal', text: 'Seasonal Event', isAdminOnly: true, visibility: 'public' },
        hot_deals: { mainType: 'event', subType: 'hot_deals', text: 'Hot Deals Event', isAdminOnly: true, visibility: 'public' },
        wanted_boss: { mainType: 'event', subType: 'wanted_boss', text: 'Wanted Boss Event', isAdminOnly: true, visibility: 'public' },
        campaign: { mainType: 'event', subType: 'campaign', text: 'Campaign Event', isAdminOnly: true, visibility: 'public' },
        vs: { mainType: 'event', subType: 'vs', text: 'VS Event', isAdminOnly: true, visibility: 'public' },
    },
    POST_STYLES: {
        server: { color: 'var(--post-color-server)', icon: 'fas fa-server', bgColor: 'rgba(255, 215, 0, 0.1)'},
        seasonal: { color: 'var(--post-color-seasonal)', icon: 'fas fa-snowflake', bgColor: 'rgba(147, 112, 219, 0.1)'},
        leadership: { color: 'var(--post-color-leadership)', icon: 'fas fa-crown', bgColor: 'rgba(192, 192, 192, 0.1)'},
        alliance: { color: 'var(--post-color-alliance)', icon: 'fas fa-shield-alt', bgColor: 'rgba(0, 191, 255, 0.1)'},
        hot_deals: { color: 'var(--post-color-hot_deals)', icon: 'fas fa-fire-alt', bgColor: 'rgba(255, 99, 71, 0.1)'},
        wanted_boss: { color: 'var(--post-color-wanted_boss)', icon: 'fas fa-skull-crossbones', bgColor: 'rgba(220, 20, 60, 0.1)'},
        campaign: { color: 'var(--post-color-campaign)', icon: 'fas fa-map-marked-alt', bgColor: 'rgba(50, 205, 50, 0.1)'},
        vs: { color: 'var(--post-color-vs)', icon: 'fas fa-fist-raised', bgColor: 'rgba(255, 165, 0, 0.1)'},
    },
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    renderSkeletons();
    initUI();
    initAuth();
    initDataListeners();

    onAuthStateChanged(auth, user => {
        detachAllListeners();
        if (user) {
            setupPresenceManagement(user);
            setupAllListeners(user);
            handleUserLoggedIn();
        } else {
            handleUserLoggedOut();
        }
        buildMobileNav();
        renderPosts();
        applyPlayerFilters();
    });
}

function handleUserLoggedIn() {
    // This function will be called when a user is logged in
}

function handleUserLoggedOut() {
    state.currentUserData = null;
    document.getElementById('login-btn').classList.remove('hidden');
    document.getElementById('user-profile-nav-item').classList.add('hidden');
}

export { renderPosts, applyPlayerFilters, buildMobileNav, renderNotifications, renderMessages, updatePlayerProfileDropdown, renderFriends };
// js/ui.js
import { formatTimeAgo, formatEventDateTime, formatDuration, getEventStatus, getRankColor, isUserLeader } from './utils.js';
import { POST_TYPES, POST_STYLES, ALLIANCES, ALLIANCE_RANKS, ALLIANCE_ROLES, DAYS_OF_WEEK, HOURS_OF_DAY, REPEAT_TYPES } from './constants.js';

/**
 * This file handles all direct DOM manipulation and UI rendering.
 */

// --- DOM Element Selectors ---
export const DOMElements = {
    // ... (rest of the selectors are unchanged)
    mainNav: document.getElementById('main-nav'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    eventsPage: document.getElementById('page-events'),
    socialPage: document.getElementById('page-social'),
    playersPage: document.getElementById('page-players'),
};

// ... (state, modal, and page navigation functions are unchanged)

// --- Initial Page Rendering ---
function initializePageHTML() {
    // ... (this function is unchanged)
}

// --- Rendering Functions ---
export function renderSkeletons() {
    // ... (this function is unchanged)
}

// ... (createCard, renderPosts, updateCountdowns, etc. are unchanged)

export function updateUIForLoggedInUser(user) {
    // ... (this function is unchanged)
}

export function updateUIForLoggedOutUser() {
    // ... (this function is unchanged)
}

/**
 * --- NEW FUNCTION ---
 * Visually enables or disables the social tabs based on the user's permissions.
 * This provides immediate feedback and prevents clicks that would cause errors.
 * @param {object | null} currentUserData - The current user's data, or null if logged out.
 */
export function updateSocialTabPermissions(currentUserData) {
    const allianceTab = document.getElementById('alliance-tab-btn');
    const leadershipTab = document.getElementById('leadership-tab-btn');

    if (!allianceTab || !leadershipTab) return;

    // Check for Alliance Tab permissions
    if (!currentUserData || !currentUserData.alliance || !currentUserData.isVerified) {
        allianceTab.disabled = true;
        allianceTab.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        allianceTab.disabled = false;
        allianceTab.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    // Check for Leadership Tab permissions
    if (!currentUserData || !isUserLeader(currentUserData)) {
        leadershipTab.disabled = true;
        leadershipTab.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        leadershipTab.disabled = false;
        leadershipTab.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// --- Player Page Rendering ---
export function renderPlayers(players, currentUserData) {
    // ... (this function is unchanged)
}

// --- Social Page Rendering ---
export function renderChatPane(type) {
    // ... (this function is unchanged)
}

export function renderMessages(messages, container, chatType, allPlayers, currentUserData) {
    // ... (this function is unchanged)
}

export function renderFriendsLists(friendsData, allPlayers) {
    // ... (this function is unchanged)
}

function createFriendHTML(playerData, type) {
    // ... (this function is unchanged)
}

// --- Particle Animation ---
export function initParticles() {
    // ... (this function is unchanged)
}

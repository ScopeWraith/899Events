// js/ui.js
import { formatTimeAgo, getRankColor, isUserLeader } from './utils.js';
import { ALLIANCES, ALLIANCE_RANKS } from './constants.js';

export const DOMElements = {
    mainNav: document.getElementById('main-nav'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    eventsPage: document.getElementById('page-events'),
    socialPage: document.getElementById('page-social'),
    playersPage: document.getElementById('page-players'),
    feedPage: document.getElementById('page-feed'),
    playerCardBtn: document.getElementById('player-card-btn'),
    editProfileModalContainer: document.getElementById('edit-profile-modal-container'),
};

// --- Initial Page Rendering ---
function initializePageHTML() {
    DOMElements.eventsPage.innerHTML = `
        <main id="events-main-container" class="space-y-6">
            <div id="filter-container" class="filter-btn-group"></div>
            <div id="announcements-container" class="space-y-4"></div>
            <div id="events-section-container" class="space-y-4"></div>
        </main>
    `;

    DOMElements.playersPage.innerHTML = `
        <div class="glass-pane section-container">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-white tracking-wider" style="text-shadow: 0 0 10px var(--color-primary);">PLAYERS OF 899</h2>
            </div>
            <div class="flex flex-col md:flex-row gap-4 mb-6">
                <div class="input-group flex-grow">
                    <i class="fas fa-search input-icon"></i>
                    <input type="text" id="player-search-input" placeholder="Search by player name..." class="form-input">
                </div>
                <div class="input-group md:max-w-xs">
                    <i class="fas fa-shield-alt input-icon"></i>
                    <div class="custom-select-container" data-type="alliance-filter">
                        <input type="hidden" id="alliance-filter" name="alliance-filter">
                        <button type="button" class="custom-select-value form-input"><span>All Alliances</span><i class="fas fa-chevron-down text-xs"></i></button>
                        <div class="custom-select-options">
                            <div class="options-list"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="player-list-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
        </div>
    `;

    DOMElements.socialPage.innerHTML = `
        <div class="glass-pane section-container">
            <div class="flex flex-col md:flex-row gap-6">
                <!-- Main Chat Area -->
                <div class="flex-grow md:w-2/3">
                    <div id="social-tabs-container" class="social-tabs flex items-center mb-4">
                        <button class="social-tab-btn active" data-tab="world-chat"><i class="fas fa-globe mr-2"></i>World</button>
                        <button id="alliance-tab-btn" class="social-tab-btn" data-tab="alliance-chat"><i class="fas fa-shield-alt mr-2"></i>Alliance</button>
                        <button id="leadership-tab-btn" class="social-tab-btn" data-tab="leadership-chat"><i class="fas fa-crown mr-2"></i>Leadership</button>
                    </div>
                    <div id="pane-world-chat" class="social-content-pane active"></div>
                    <div id="pane-alliance-chat" class="social-content-pane"></div>
                    <div id="pane-leadership-chat" class="social-content-pane"></div>
                </div>
                <!-- Friends/Side Panel -->
                <div class="md:w-1/3 flex-shrink-0 space-y-4">
                    <div>
                        <h3 class="section-header text-lg font-bold mb-2"><i class="fas fa-user-friends"></i> Friends</h3>
                        <div id="friends-list" class="space-y-2"></div>
                    </div>
                    <div>
                        <h3 class="section-header text-lg font-bold mb-2"><i class="fas fa-inbox"></i> Friend Requests</h3>
                        <div id="friend-requests-list" class="space-y-2"></div>
                    </div>
                    <div>
                        <h3 class="section-header text-lg font-bold mb-2"><i class="fas fa-paper-plane"></i> Sent Requests</h3>
                        <div id="sent-requests-list" class="space-y-2"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    DOMElements.feedPage.innerHTML = `
        <div class="glass-pane section-container">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-white tracking-wider" style="text-shadow: 0 0 10px var(--color-primary);">YOUR FEED</h2>
                <p class="text-gray-400">Recent activity and notifications.</p>
            </div>
            <div id="feed-container" class="space-y-4 max-w-2xl mx-auto">
                <p class="text-center text-gray-500 py-8">Loading your feed...</p>
            </div>
        </div>
    `;
}

// --- Rendering Functions ---
export function renderSkeletons() {
    initializePageHTML();
    // ... skeleton rendering logic ...
}

export function showPage(targetId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = page.id === targetId ? 'block' : 'none';
    });
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.mainTarget === targetId);
    });
}

export function renderPosts(allPosts, currentUserData) {
    // ... implementation ...
}

export function updateUIForLoggedInUser(user) {
    // ... implementation ...
}

export function updateUIForLoggedOutUser() {
    // ... implementation ...
}

export function updateSocialTabPermissions(currentUserData) {
    // ... implementation ...
}

export function renderPlayers(players, currentUserData) {
    // ... implementation ...
}

export function renderChatPane(type) {
    // ... implementation ...
}

export function renderMessages(messages, container, chatType, allPlayers, currentUserData) {
    // ... implementation ...
}

/**
 * --- FIX ---
 * Added the 'export' keyword to this function so it can be imported by app.js.
 */
export function renderFriendsLists(friendsData, allPlayers) {
    const friendsContainer = document.getElementById('friends-list');
    const requestsContainer = document.getElementById('friend-requests-list');
    const sentContainer = document.getElementById('sent-requests-list');

    if (!friendsContainer || !requestsContainer || !sentContainer) return;

    const friends = friendsData.filter(f => f.status === 'accepted');
    const requests = friendsData.filter(f => f.status === 'pending_received');
    const sent = friendsData.filter(f => f.status === 'pending_sent');

    friendsContainer.innerHTML = friends.length > 0 ? friends.map(f => createFriendHTML(allPlayers.find(p => p.uid === f.id), 'friend')).join('') : `<p class="text-xs text-gray-500 text-center">No friends yet.</p>`;
    requestsContainer.innerHTML = requests.length > 0 ? requests.map(f => createFriendHTML(allPlayers.find(p => p.uid === f.id), 'request')).join('') : `<p class="text-xs text-gray-500 text-center">No new requests.</p>`;
    sentContainer.innerHTML = sent.length > 0 ? sent.map(f => createFriendHTML(allPlayers.find(p => p.uid === f.id), 'sent')).join('') : `<p class="text-xs text-gray-500 text-center">No sent requests.</p>`;
}

function createFriendHTML(playerData, type) {
    if (!playerData) return '';
    const avatarUrl = playerData.avatarUrl || `https://placehold.co/40x40/0D1117/FFFFFF?text=${(playerData.username || '?').charAt(0).toUpperCase()}`;
    
    let actionsHTML = '';
    if (type === 'friend') {
        actionsHTML = `<button class="friend-action-btn decline" data-action="remove" data-uid="${playerData.uid}">Remove</button>`;
    } else if (type === 'request') {
        actionsHTML = `<button class="friend-action-btn accept" data-action="accept" data-uid="${playerData.uid}">Accept</button> <button class="friend-action-btn decline" data-action="decline" data-uid="${playerData.uid}">Decline</button>`;
    } else if (type === 'sent') {
        actionsHTML = `<button class="friend-action-btn decline" data-action="cancel" data-uid="${playerData.uid}">Cancel</button>`;
    }

    return `
        <div class="friend-list-item" data-uid="${playerData.uid}">
            <img src="${avatarUrl}" class="w-8 h-8 rounded-full mr-3 object-cover" alt="${playerData.username}">
            <div class="flex-grow">
                <p class="font-semibold text-white text-sm">${playerData.username}</p>
                <p class="text-xs text-gray-400">[${playerData.alliance}]</p>
            </div>
            <div class="flex items-center gap-2">${actionsHTML}</div>
        </div>`;
}

export function renderFeed(notifications, allPlayers) {
    // ... implementation ...
}

export function renderEditProfileModal(user) {
    // ... implementation ...
}

export function initParticles() {
    // ... implementation ...
}

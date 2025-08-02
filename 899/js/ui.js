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
    // ... (events, players, social page initializations are unchanged)

    // NEW: Initialize Feed Page HTML
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
    // ... (rest of skeleton rendering is unchanged)
}

// ... (renderPosts, createCard, etc. are unchanged)

export function updateUIForLoggedInUser(user) {
    // ... (implementation unchanged)
}

export function updateUIForLoggedOutUser() {
    // ... (implementation unchanged)
}

export function updateSocialTabPermissions(currentUserData) {
    // ... (implementation unchanged)
}

// ... (renderPlayers, renderChatPane, renderMessages, renderFriendsLists are unchanged)

// --- NEW: Feed Rendering ---
export function renderFeed(notifications, allPlayers) {
    const container = document.getElementById('feed-container');
    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-8">You have no new notifications.</p>`;
        return;
    }

    container.innerHTML = notifications.map(item => createFeedItemHTML(item, allPlayers)).join('');
}

function createFeedItemHTML(item, allPlayers) {
    const fromUser = allPlayers.find(p => p.uid === item.fromUid);
    const fromUsername = fromUser ? fromUser.username : (item.fromUsername || 'A player');
    const avatarUrl = fromUser?.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${fromUsername.charAt(0).toUpperCase()}`;
    const timestamp = item.timestamp ? formatTimeAgo(item.timestamp.toDate()) : '';

    let icon, message;
    switch (item.type) {
        case 'friend_request':
            icon = 'fa-user-plus text-blue-400';
            message = `<strong class="text-white">${fromUsername}</strong> sent you a friend request.`;
            break;
        // Add more cases here for other notification types
        default:
            icon = 'fa-info-circle text-gray-400';
            message = 'You have a new notification.';
    }

    return `
        <div class="feed-item flex items-center gap-4 p-3 rounded-lg" style="background-color: rgba(33, 38, 45, 0.5);">
            <div class="w-10 text-center"><i class="fas ${icon} fa-lg"></i></div>
            <img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover" alt="${fromUsername}">
            <div class="flex-grow">
                <p class="text-gray-300">${message}</p>
                <p class="text-xs text-gray-500">${timestamp}</p>
            </div>
        </div>
    `;
}

// --- NEW: Edit Profile Modal Rendering ---
export function renderEditProfileModal(user) {
    const container = DOMElements.editProfileModalContainer;
    if (!container) return;

    const joinDate = user.registrationTimestampUTC ? new Date(user.registrationTimestampUTC).toLocaleDateString() : 'N/A';
    const avatarUrl = user.avatarUrl || `https://placehold.co/96x96/161B22/FFFFFF?text=${user.username.charAt(0).toUpperCase()}`;

    container.innerHTML = `
        <div class="glass-pane">
            <div class="modal-content-wrapper !p-0">
                <button id="close-edit-modal-btn" class="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"><i class="fas fa-times fa-lg"></i></button>
                <div class="p-6 bg-black/20 rounded-t-lg">
                    <div class="flex items-center gap-4">
                        <div class="relative group">
                            <img id="edit-avatar-preview" src="${avatarUrl}" class="w-24 h-24 rounded-full object-cover border-4 border-gray-700">
                            <button id="modal-upload-avatar-btn" class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><i class="fas fa-camera fa-2x"></i></button>
                            <input type="file" id="modal-avatar-input" class="hidden" accept="image/*">
                        </div>
                        <div>
                            <h2 id="edit-username-header" class="text-2xl font-bold text-white">${user.username}</h2>
                            <p class="text-sm text-gray-400">${user.email}</p>
                            <p class="text-xs text-gray-500 mt-1">Joined: ${joinDate}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-content-scroll p-6">
                    <form id="edit-profile-form">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="input-group"><i class="fas fa-user input-icon"></i><input type="text" id="edit-username" value="${user.username}" class="form-input" required></div>
                            <div class="input-group"><i class="fas fa-shield-alt input-icon"></i><select id="edit-alliance" class="form-input bg-transparent">${ALLIANCES.map(a => `<option ${a === user.alliance ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
                            <div class="input-group md:col-span-2"><i class="fas fa-star input-icon"></i><select id="edit-alliance-rank" class="form-input bg-transparent">${ALLIANCE_RANKS.map(r => `<option value="${r.value}" ${r.value === user.allianceRank ? 'selected' : ''}>${r.text}</option>`).join('')}</select></div>
                            <div class="input-group"><i class="fas fa-fist-raised input-icon"></i><input type="text" id="edit-power" value="${(user.power || 0).toLocaleString()}" class="power-input form-input" required></div>
                        </div>
                        <p id="edit-profile-error" class="text-red-400 text-center text-sm mt-4 min-h-[20px]"></p>
                        <div class="flex gap-4 mt-6">
                            <button type="button" id="modal-logout-btn" class="w-full p-3 rounded-lg secondary-btn"><i class="fas fa-sign-out-alt mr-2"></i>Logout</button>
                            <button type="submit" id="edit-profile-submit-btn" class="w-full p-3 rounded-lg primary-btn">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

export function initParticles() {
    // ... (implementation unchanged)
}

// js/modules/ui.js

import { POST_TYPES, POST_STYLES, ALLIANCES, ALLIANCE_RANKS, ALLIANCE_ROLES, DAYS_OF_WEEK, HOURS_OF_DAY, REPEAT_TYPES } from '../constants.js';

// This module handles all direct DOM manipulation and UI updates.
// It receives data and renders it, but does not fetch or manage state.

// --- DOM ELEMENT SELECTORS ---
export const elements = {
    appPreloader: document.getElementById('app-preloader'),
    appContainer: document.getElementById('app-container'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    authModalContainer: document.getElementById('auth-modal-container'),
    editProfileModalContainer: document.getElementById('edit-profile-modal-container'),
    playerSettingsModalContainer: document.getElementById('player-settings-modal-container'),
    createPostModalContainer: document.getElementById('create-post-modal-container'),
    confirmationModalContainer: document.getElementById('confirmation-modal-container'),
    postActionsModalContainer: document.getElementById('post-actions-modal-container'),
    privateMessageModalContainer: document.getElementById('private-message-modal-container'),
    loginFormContainer: document.getElementById('login-form-container'),
    registerFormContainer: document.getElementById('register-form-container'),
    loginBtn: document.getElementById('login-btn'),
    userProfileNavItem: document.getElementById('user-profile-nav-item'),
    usernameDisplay: document.getElementById('username-display'),
    userAvatarButton: document.getElementById('user-avatar-button'),
    playerListContainer: document.getElementById('player-list-container'),
    announcementsContainer: document.getElementById('announcements-container'),
    eventsSectionContainer: document.getElementById('events-section-container'),
    filterContainer: document.getElementById('filter-container'),
    feedDropdown: document.getElementById('feed-dropdown'),
    feedPageContainer: document.getElementById('feed-page-container'),
    notificationBadge: document.getElementById('notification-badge'),
    friendsListContainer: document.getElementById('friends-list'),
    mobileNavMenu: document.getElementById('mobile-nav-menu'),
    mobileNavLinksContainer: document.getElementById('mobile-nav-links'),
    pageContainer: document.getElementById('page-container'),
    mainNav: document.getElementById('main-nav'),
    eventsMainContainer: document.getElementById('events-main-container'),
};

// --- UTILITY & FORMATTING ---
export function formatTimeAgo(date) {
    if (!date) return '';
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `${Math.floor(seconds)}s ago`;
}

export function formatEventDateTime(date) {
    if (!date || isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' @ ' +
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatDuration(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.slice(0, 2).join(' ') || '<1m';
}

// --- PAGE AND MODAL VISIBILITY ---
export function showPage(pageId) {
    elements.pageContainer.querySelectorAll('.page-content').forEach(page => {
        page.style.display = page.id === pageId ? 'block' : 'none';
    });
    elements.mainNav.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.mainTarget === pageId);
    });
}

export function showModal(modal) {
    elements.modalBackdrop.classList.add('visible');
    modal.classList.add('visible');
}

export function hideAllModals() {
    elements.modalBackdrop.classList.remove('visible');
    elements.authModalContainer.classList.remove('visible');
    elements.editProfileModalContainer.classList.remove('visible');
    elements.playerSettingsModalContainer.classList.remove('visible');
    elements.createPostModalContainer.classList.remove('visible');
    elements.confirmationModalContainer.classList.remove('visible');
    elements.postActionsModalContainer.classList.remove('visible');
    elements.privateMessageModalContainer.classList.remove('visible');
    elements.mobileNavMenu.classList.remove('open');
}

export function showAuthModal(formToShow) {
    showModal(elements.authModalContainer);
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    if (formToShow === 'register') {
        elements.registerFormContainer.classList.add('active');
    } else {
        elements.loginFormContainer.classList.add('active');
    }
}

export function showConfirmationModal(title, message, onConfirmCallback) {
    document.getElementById('confirmation-title').textContent = title;
    document.getElementById('confirmation-message').textContent = message;

    const confirmBtn = document.getElementById('confirmation-confirm-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', () => {
        onConfirmCallback();
        hideAllModals();
    });

    showModal(elements.confirmationModalContainer);
}

// --- RENDERING FUNCTIONS ---
export function renderSkeletons() {
    function createSkeletonCard() {
        return `
            <div class="post-card skeleton-card">
                <div class="post-card-thumbnail-wrapper"><div class="post-card-thumbnail skeleton-loader"></div></div>
                <div class="post-card-body">
                    <div class="post-card-content">
                        <div class="post-card-header"><div class="skeleton-loader h-5 w-24"></div></div>
                        <div class="skeleton-loader h-8 w-4/5 mt-2"></div>
                        <div class="skeleton-loader h-4 w-full mt-2"></div>
                        <div class="skeleton-loader h-4 w-2/3 mt-1"></div>
                    </div>
                    <div class="post-card-status">
                        <div class="skeleton-loader h-4 w-16 mb-2"></div>
                        <div class="skeleton-loader h-7 w-24"></div>
                    </div>
                </div>
            </div>`;
    }
    elements.announcementsContainer.innerHTML = `<div class="section-header text-xl font-bold mb-4" style="--glow-color: var(--color-highlight);"><i class="fas fa-bullhorn"></i><span class="flex-grow">Announcements</span></div><div class="grid grid-cols-1 gap-4">${createSkeletonCard()}</div>`;
    elements.eventsSectionContainer.innerHTML = `<div class="section-header text-xl font-bold mb-4"><i class="fas fa-calendar-alt"></i><span class="flex-grow">Events</span></div><div class="grid grid-cols-1 gap-4">${createSkeletonCard()}${createSkeletonCard()}</div>`;
}

export function renderPlayers(allPlayers, userSessions, currentUserData) {
    const container = elements.playerListContainer;
    const searchTerm = document.getElementById('player-search-input').value.toLowerCase();
    const allianceFilter = document.getElementById('alliance-filter').value;

    const filteredPlayers = allPlayers.filter(player => {
        const nameMatch = player.username.toLowerCase().includes(searchTerm);
        const allianceMatch = !allianceFilter || player.alliance === allianceFilter;
        return nameMatch && allianceMatch;
    });

    container.innerHTML = '';
    if (filteredPlayers.length === 0) {
        container.innerHTML = `<p class="text-center col-span-full py-8 text-gray-400">No players match the current filters.</p>`;
        return;
    }

    filteredPlayers.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card glass-pane p-4 flex flex-col relative';
        card.dataset.uid = player.uid;

        let gearIconHTML = '';
        if (currentUserData && currentUserData.uid !== player.uid) {
            const canManage = currentUserData.isAdmin || (currentUserData.alliance === player.alliance && ((currentUserData.allianceRank === 'R5' && ['R4', 'R3', 'R2', 'R1'].includes(player.allianceRank)) || (currentUserData.allianceRank === 'R4' && ['R3', 'R2', 'R1'].includes(player.allianceRank))));
            if (canManage) {
                gearIconHTML = `<button class="player-settings-btn absolute top-3 right-3 text-gray-400 hover:text-white transition-colors" data-uid="${player.uid}"><i class="fas fa-cog"></i></button>`;
            }
        }

        const avatarUrl = player.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${player.username.charAt(0).toUpperCase()}`;
        const session = userSessions[player.uid];
        const statusClass = session ? session.status : 'offline';

        card.innerHTML = `
            ${gearIconHTML}
            <div class="flex items-center pb-3 border-b player-card-header" style="border-color: rgba(255,255,255,0.1);">
                <img src="${avatarUrl}" class="w-12 h-12 rounded-full mr-4 border-2 object-cover" style="border-color: rgba(255,255,255,0.2);" alt="${player.username}" onerror="this.src='https://placehold.co/48x48/0D1117/FFFFFF?text=?';">
                <div>
                    <h3 class="font-bold text-lg text-white flex items-center">${player.username} <span class="status-dot ${statusClass} ml-2"></span></h3>
                    <p class="text-sm font-semibold" style="color: var(--color-primary);">[${player.alliance}] - ${player.allianceRank}</p>
                </div>
            </div>
            <div class="flex-grow my-4 space-y-3">
                <div class="flex justify-between items-center text-sm"><span class="text-gray-400 flex items-center"><i class="fas fa-fist-raised w-6 text-center mr-2" style="color: var(--color-primary);"></i>Total Power</span><span class="font-bold text-white">${(player.power || 0).toLocaleString()}</span></div>
                <div class="flex justify-between items-center text-sm"><span class="text-gray-400 flex items-center"><i class="fas fa-truck-monster w-6 text-center mr-2" style="color: var(--color-primary);"></i>Tank Power</span><span class="font-bold text-white">${(player.tankPower || 0).toLocaleString()}</span></div>
                <div class="flex justify-between items-center text-sm"><span class="text-gray-400 flex items-center"><i class="fas fa-fighter-jet w-6 text-center mr-2" style="color: var(--color-primary);"></i>Air Power</span><span class="font-bold text-white">${(player.airPower || 0).toLocaleString()}</span></div>
                <div class="flex justify-between items-center text-sm"><span class="text-gray-400 flex items-center"><i class="fas fa-rocket w-6 text-center mr-2" style="color: var(--color-primary);"></i>Missile Power</span><span class="font-bold text-white">${(player.missilePower || 0).toLocaleString()}</span></div>
            </div>
            <div class="flex justify-around items-center pt-3 border-t border-white/10">
                <button class="message-player-btn text-gray-400 hover:text-white transition-colors !text-lg" data-uid="${player.uid}" title="Message Player"><i class="fas fa-comment-dots"></i></button>
                <button class="add-friend-btn text-gray-400 hover:text-white transition-colors !text-lg" data-uid="${player.uid}" title="Add Friend"><i class="fas fa-user-plus"></i></button>
                <button class="like-profile-btn text-gray-400 hover:text-white transition-colors !text-lg" title="Like Profile"><i class="fas fa-thumbs-up"></i></button>
            </div>
        `;
        container.appendChild(card);
    });
}
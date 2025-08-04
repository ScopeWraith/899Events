// js/modules/ui.js

import { state, constants } from '../app.js';
import { handleNotificationClick, removeFriend, handleDeleteMessage, handleSendMessage, setupPrivateChatListener, getPrivateChatId } from './data.js';
import { handleEditProfileSubmit, handlePlayerSettingsSubmit, handleCreatePostSubmit, deletePost, showEditPostModal } from './auth.js';

// --- DOM ELEMENTS ---
const elements = {
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
    playerListContainer: document.getElementById('player-list-container'),
    userProfileButton: document.getElementById('user-profile-button'),
    mobileNavMenu: document.getElementById('mobile-nav-menu'),
    mobileNavLinksContainer: document.getElementById('mobile-nav-links'),
    playerSearchInput: document.getElementById('player-search-input'),
    allianceFilterInput: document.getElementById('alliance-filter'),
    announcementsContainer: document.getElementById('announcements-container'),
    eventsSectionContainer: document.getElementById('events-section-container'),
    userAvatarButton: document.getElementById('user-avatar-button'),
    avatarUploadInput: document.getElementById('avatar-upload-input'),
    verificationToggleContainer: document.getElementById('verification-toggle-container'),
    eventsMainContainer: document.getElementById('events-main-container'),
    filterContainer: document.getElementById('filter-container'),
    feedDropdown: document.getElementById('feed-dropdown'),
    feedNavItem: document.getElementById('feed-nav-item'),
    notificationBadge: document.getElementById('notification-badge'),
    feedPageContainer: document.getElementById('feed-page-container'),
    friendsListContainer: document.getElementById('friends-list'),
};

// --- MODAL & FORM SWITCHING LOGIC ---
export function showModal(modal) {
    hideAllModals();
    elements.modalBackdrop.classList.add('visible');
    modal.classList.add('visible');
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

export function showConfirmationModal(title, message, onConfirm) {
    document.getElementById('confirmation-title').textContent = title;
    document.getElementById('confirmation-message').textContent = message;

    const confirmBtn = document.getElementById('confirmation-confirm-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', () => {
        onConfirm();
        hideAllModals();
    });

    showModal(elements.confirmationModalContainer);
}

export function showPostActionsModal(postId) {
    state.actionPostId = postId;
    showModal(elements.postActionsModalContainer);
}

export function showPrivateMessageModal(targetPlayer) {
    state.activePrivateChatPartner = targetPlayer;
    document.getElementById('private-message-header').textContent = `Chat with ${targetPlayer.username}`;
    document.getElementById('private-message-window').innerHTML = '<p class="text-center text-gray-500 m-auto">Loading messages...</p>';
    showModal(elements.privateMessageModalContainer);
    setupPrivateChatListener();
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
    state.activePlayerSettingsUID = null;
    state.editingPostId = null;
    state.actionPostId = null;
    state.activePrivateChatId = null;
    state.activePrivateChatPartner = null;
    if (state.privateChatListener) state.privateChatListener();
}

// --- UTILITY & SKELETON FUNCTIONS ---
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

export function createSkeletonCard() {
    return `
        <div class="post-card skeleton-card">
            <div class="post-card-thumbnail-wrapper">
                <div class="post-card-thumbnail skeleton-loader"></div>
            </div>
            <div class="post-card-body">
                <div class="post-card-content">
                    <div class="post-card-header">
                        <div class="skeleton-loader h-5 w-24"></div>
                    </div>
                    <div class="skeleton-loader h-8 w-4/5 mt-2"></div>
                    <div class="skeleton-loader h-4 w-full mt-2"></div>
                    <div class="skeleton-loader h-4 w-2/3 mt-1"></div>
                </div>
                <div class="post-card-status">
                    <div class="skeleton-loader h-4 w-16 mb-2"></div>
                    <div class="skeleton-loader h-7 w-24"></div>
                </div>
            </div>
        </div>
    `;
}

export function renderSkeletons() {
    elements.announcementsContainer.innerHTML = `
        <div class="section-header text-xl font-bold mb-4" style="--glow-color: var(--color-highlight);">
            <i class="fas fa-bullhorn"></i>
            <span class="flex-grow">Announcements</span>
        </div>
        <div class="grid grid-cols-1 gap-4">
            ${createSkeletonCard()}
        </div>
    `;
    elements.eventsSectionContainer.innerHTML = `
        <div class="section-header text-xl font-bold mb-4">
             <i class="fas fa-calendar-alt"></i>
             <span class="flex-grow">Events</span>
        </div>
        <div class="grid grid-cols-1 gap-4">
            ${createSkeletonCard()}
            ${createSkeletonCard()}
            ${createSkeletonCard()}
        </div>
    `;
}

export function getEventStatus(event) {
    const now = new Date();
    let startTime = event.startTime?.toDate();
    let endTime = event.endTime?.toDate();

    if (!startTime || !endTime) {
        return { status: 'ended' };
    }

    if (event.isRecurring) {
        if (endTime < now) {
            const timeDiff = now.getTime() - endTime.getTime();
            const weeksToAdvance = Math.ceil(timeDiff / (7 * 24 * 60 * 60 * 1000));
            startTime.setDate(startTime.getDate() + weeksToAdvance * 7);
            endTime.setDate(endTime.getDate() + weeksToAdvance * 7);
        }
    }

    if (startTime > now) {
        return { status: 'upcoming', timeDiff: startTime - now };
    } else if (startTime <= now && endTime > now) {
        return { status: 'live', timeDiff: endTime - now };
    } else {
        return { status: 'ended', endedDate: endTime };
    }
}

export function updateCountdowns() {
    document.querySelectorAll('.event-card').forEach(el => {
        const postId = el.dataset.postId;
        const post = state.allPosts.find(p => p.id === postId);
        if (!post) return;

        const statusInfo = getEventStatus(post);
        const statusEl = el.querySelector('.status-content-wrapper');
        const dateEl = el.querySelector('.status-date');

        if (!statusEl || !dateEl) return;

        el.classList.remove('live', 'ended', 'upcoming');

        const originalStartTime = post.startTime?.toDate();
        if (originalStartTime) {
            dateEl.textContent = formatEventDateTime(originalStartTime);
        }

        switch(statusInfo.status) {
            case 'upcoming':
                el.classList.add('upcoming');
                statusEl.innerHTML = `<div class="status-label">STARTS IN</div><div class="status-time">${formatDuration(statusInfo.timeDiff)}</div>`;
                break;
            case 'live':
                el.classList.add('live');
                statusEl.innerHTML = `<div class="status-label">ENDS IN</div><div class="status-time">${formatDuration(statusInfo.timeDiff)}</div>`;
                break;
            case 'ended':
                el.classList.add('ended');
                statusEl.innerHTML = `<div class="status-label">ENDED</div><div class="status-time">${statusInfo.endedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>`;
                break;
        }
    });
}

export function setupCustomSelect(container) {
    const type = container.dataset.type;
    const hiddenInput = container.querySelector('input[type="hidden"]');
    const valueButton = container.querySelector('.custom-select-value');
    const optionsContainer = container.querySelector('.custom-select-options');
    const searchInput = container.querySelector('.custom-select-search');
    const optionsList = container.querySelector('.options-list');

    let sourceData = [];
    if (type === 'alliance') sourceData = constants.ALLIANCES.map(a => ({value: a, text: a}));
    else if (type === 'rank') sourceData = constants.ALLIANCE_RANKS;
    else if (type === 'role') sourceData = constants.ALLIANCE_ROLES;
    else if (type === 'alliance-filter') sourceData = [{value: '', text: 'All Alliances'}, ...constants.ALLIANCES.map(a => ({value: a, text: a}))];
    else if (type === 'day-of-week') sourceData = constants.DAYS_OF_WEEK;
    else if (type === 'hour-of-day') sourceData = constants.HOURS_OF_DAY;
    else if (type === 'repeat-type') sourceData = constants.REPEAT_TYPES;

    const isSearchable = searchInput && type === 'alliance';
    if(searchInput && !isSearchable) searchInput.style.display = 'none';

    function renderOptions(data = [], filter = '') {
        optionsList.innerHTML = '';
        const filteredData = data.filter(item => item.text.toLowerCase().includes(filter.toLowerCase()));
        filteredData.forEach(item => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'custom-select-option';
            optionDiv.textContent = item.text;
            optionDiv.dataset.value = item.value;
            optionsList.appendChild(optionDiv);
        });
    }

    valueButton.addEventListener('click', (e) => {
        e.stopPropagation();

        const isOpen = container.classList.contains('open');
        document.querySelectorAll('.custom-select-container').forEach(c => c.classList.remove('open'));
        if (!isOpen) {
            const rect = container.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            optionsContainer.classList.remove('open-up', 'open-down');
            if (spaceBelow < 220 && rect.top > 220) {
                optionsContainer.classList.add('open-up');
            } else {
                optionsContainer.classList.add('open-down');
            }
            container.classList.add('open');
            if (isSearchable) { searchInput.value = ''; searchInput.focus(); }
            renderOptions(sourceData);
        } else {
            container.classList.remove('open');
        }
    });

    if (isSearchable) {
        searchInput.addEventListener('input', () => renderOptions(sourceData, searchInput.value));
    }

    optionsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('custom-select-option')) {
            const value = e.target.dataset.value;
            const text = e.target.textContent;
            setCustomSelectValue(container, value, text);
            container.classList.remove('open');
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
    renderOptions(sourceData);
}

export function setCustomSelectValue(container, value, text) {
    const hiddenInput = container.querySelector('input[type="hidden"]');
    const valueSpan = container.querySelector('.custom-select-value span');
    hiddenInput.value = value;
    valueSpan.textContent = text || value;
}

export function showPage(targetId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = page.id === targetId ? 'block' : 'none';
    });
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        const mainTarget = link.dataset.mainTarget;
        link.classList.toggle('active', mainTarget === targetId);
    });
}
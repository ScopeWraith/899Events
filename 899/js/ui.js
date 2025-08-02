// js/ui.js
import { formatTimeAgo, formatEventDateTime, formatDuration, getEventStatus } from './utils.js';
import { POST_TYPES, POST_STYLES, ALLIANCES, ALLIANCE_RANKS, ALLIANCE_ROLES, DAYS_OF_WEEK, HOURS_OF_DAY, REPEAT_TYPES } from './constants.js';

/**
 * This file handles all direct DOM manipulation and UI rendering.
 * It's responsible for creating HTML elements, updating their content,
 * and managing visibility of different UI components like pages and modals.
 */

// --- DOM Element Selectors ---
export const DOMElements = {
    // Modals & Backdrop
    modalBackdrop: document.getElementById('modal-backdrop'),
    authModalContainer: document.getElementById('auth-modal-container'),
    editProfileModalContainer: document.getElementById('edit-profile-modal-container'),
    playerSettingsModalContainer: document.getElementById('player-settings-modal-container'),
    createPostModalContainer: document.getElementById('create-post-modal-container'),
    confirmationModalContainer: document.getElementById('confirmation-modal-container'),
    postActionsModalContainer: document.getElementById('post-actions-modal-container'),
    
    // Navigation & Header
    mainNav: document.getElementById('main-nav'),
    mobileNavMenu: document.getElementById('mobile-nav-menu'),
    mobileNavLinksContainer: document.getElementById('mobile-nav-links'),
    loginBtn: document.getElementById('login-btn'),
    userProfileContainer: document.getElementById('user-profile-container'),
    usernameDisplay: document.getElementById('username-display'),
    userAvatarButton: document.getElementById('user-avatar-button'),
    playerCardBtn: document.getElementById('player-card-btn'),
    playerCardDropdown: document.getElementById('player-card-dropdown'),
    playerCardInfo: document.getElementById('player-card-info'),
    editProfileBtn: document.getElementById('edit-profile-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Page Containers
    pageContainer: document.getElementById('page-container'),
    eventsPage: document.getElementById('page-events'),
    socialPage: document.getElementById('page-social'),
    playersPage: document.getElementById('page-players'),
    
    // Page Specific Content
    eventsMainContainer: document.getElementById('events-main-container'),
    filterContainer: document.getElementById('filter-container'),
    announcementsContainer: document.getElementById('announcements-container'),
    eventsSectionContainer: document.getElementById('events-section-container'),
    playerListContainer: document.getElementById('player-list-container'),
    playerSearchInput: document.getElementById('player-search-input'),
    allianceFilterInput: document.getElementById('alliance-filter'),
    allianceAnnouncementsList: document.getElementById('alliance-announcements-list'),
    allianceEventsList: document.getElementById('alliance-events-list'),
    friendsList: document.getElementById('friends-list'),
    friendRequestsList: document.getElementById('friend-requests-list'),
    sentRequestsList: document.getElementById('sent-requests-list'),
};

// --- State Variables ---
export let state = {
    activePlayerSettingsUID: null,
    editingPostId: null,
    actionPostId: null,
    countdownInterval: null,
    postCreationData: {},
    resizedThumbnailBlob: null,
    activeFilter: 'all',
};

// --- Modal Management ---
export function showModal(modal) {
    hideAllModals();
    DOMElements.modalBackdrop.classList.add('visible');
    modal.classList.add('visible');
}

export function hideAllModals() {
    DOMElements.modalBackdrop.classList.remove('visible');
    [
        DOMElements.authModalContainer, DOMElements.editProfileModalContainer,
        DOMElements.playerSettingsModalContainer, DOMElements.createPostModalContainer,
        DOMElements.confirmationModalContainer, DOMElements.postActionsModalContainer
    ].forEach(modal => modal.classList.remove('visible'));
    
    state.activePlayerSettingsUID = null;
    state.editingPostId = null;
    state.actionPostId = null;
}

// --- Page Navigation ---
export function showPage(targetId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = page.id === targetId ? 'block' : 'none';
    });
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.mainTarget === targetId);
    });
}

// --- Rendering Functions ---

export function renderSkeletons() {
    const skeletonHTML = `
        <div class="post-card skeleton-card">
            <div class="post-card-thumbnail-wrapper"><div class="post-card-thumbnail skeleton-loader"></div></div>
            <div class="post-card-body">
                <div class="post-card-content">
                    <div class="skeleton-loader h-5 w-24 mb-2"></div>
                    <div class="skeleton-loader h-8 w-4/5"></div>
                    <div class="skeleton-loader h-4 w-full mt-2"></div>
                </div>
                <div class="post-card-status">
                    <div class="skeleton-loader h-4 w-16 mb-2"></div>
                    <div class="skeleton-loader h-7 w-24"></div>
                </div>
            </div>
        </div>`;
    
    DOMElements.eventsPage.innerHTML = `
        <main id="events-main-container" class="space-y-6">
            <div id="filter-container" class="filter-btn-group"></div>
            <div id="announcements-container" class="space-y-4">
                 <div class="section-header text-xl font-bold mb-4" style="--glow-color: var(--color-highlight);"><i class="fas fa-bullhorn"></i><span>Announcements</span></div>
                <div class="grid grid-cols-1 gap-4">${skeletonHTML}</div>
            </div>
            <div id="events-section-container" class="space-y-4">
                <div class="section-header text-xl font-bold mb-4"><i class="fas fa-calendar-alt"></i><span>Events</span></div>
                <div class="grid grid-cols-1 gap-4">${skeletonHTML.repeat(2)}</div>
            </div>
        </main>
    `;
}

export function createCard(post, currentUserData) {
    const style = POST_STYLES[post.subType] || {};
    const isEvent = post.mainType === 'event';
    const color = style.color || 'var(--color-primary)';
    const headerStyle = post.thumbnailUrl ? `background-image: url('${post.thumbnailUrl}')` : `background-color: #101419;`;
    const postDate = post.createdAt?.toDate();
    const timestamp = postDate ? formatTimeAgo(postDate) : '...';
    
    const postTypeText = POST_TYPES[`${post.mainType}_${post.subType}`]?.text || post.subType.replace(/_/g, ' ').toUpperCase();

    let actionsTriggerHTML = '';
    if (currentUserData && (currentUserData.isAdmin || post.authorUid === currentUserData.uid)) {
        actionsTriggerHTML = `<button class="post-card-actions-trigger" data-post-id="${post.id}" title="Post Options"><i class="fas fa-cog"></i></button>`;
    }

    let statusContentHTML = isEvent
        ? `<div class="status-content-wrapper"></div><div class="status-date"></div>`
        : `<div class="status-content-wrapper"><div class="status-label" title="${postDate?.toLocaleString() || ''}">Posted</div><div class="status-time">${timestamp}</div></div><div class="status-date">${postDate ? postDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}</div>`;

    return `
        <div class="post-card ${isEvent ? 'event-card' : 'announcement-card'}" data-post-id="${post.id}" style="--glow-color: ${color};">
            <div class="post-card-thumbnail-wrapper">
                <div class="post-card-thumbnail" style="${headerStyle}"></div>
                ${actionsTriggerHTML}
            </div>
            <div class="post-card-body">
                <div class="post-card-content">
                    <div class="post-card-header"><span class="post-card-category" style="background-color: ${color};">${postTypeText}</span></div>
                    <h3 class="post-card-title">${post.title}</h3>
                    <p class="post-card-details">${post.details}</p>
                </div>
                <div class="post-card-status">${statusContentHTML}</div>
            </div>
        </div>`;
}

export function renderPosts(allPosts, currentUserData) {
    if (state.countdownInterval) clearInterval(state.countdownInterval);

    const announcementsContainer = document.getElementById('announcements-container');
    const eventsSectionContainer = document.getElementById('events-section-container');
    
    let visiblePosts = allPosts.filter(post => {
        if (!currentUserData) return post.visibility === 'public';
        if (post.visibility === 'public') return true;
        if (currentUserData.isAdmin) return true;
        if (post.visibility === 'alliance' && post.alliance === currentUserData.alliance) return true;
        return false;
    });

    if (state.activeFilter !== 'all') {
        visiblePosts = visiblePosts.filter(p => p.subType === state.activeFilter);
    }

    const announcements = visiblePosts.filter(p => p.mainType === 'announcement').sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
    const events = visiblePosts.filter(p => p.mainType === 'event');
    
    announcementsContainer.innerHTML = `<div class="section-header text-xl font-bold mb-4" style="--glow-color: var(--color-highlight);"><i class="fas fa-bullhorn"></i><span>Announcements</span></div>` + 
        (announcements.length > 0 ? `<div class="grid grid-cols-1 gap-4">${announcements.map(p => createCard(p, currentUserData)).join('')}</div>` : `<p class="text-center text-gray-500 py-4">No announcements to display.</p>`);

    const displayableEvents = events.filter(event => {
        const status = getEventStatus(event);
        return status.status === 'live' || status.status === 'upcoming';
    }).sort((a, b) => {
        const statusA = getEventStatus(a);
        const statusB = getEventStatus(b);
        if (statusA.status === 'live' && statusB.status !== 'live') return -1;
        if (statusA.status !== 'live' && statusB.status === 'live') return 1;
        return (statusA.timeDiff || 0) - (statusB.timeDiff || 0);
    });

    eventsSectionContainer.innerHTML = `<div class="section-header text-xl font-bold mb-4"><i class="fas fa-calendar-alt"></i><span>Events</span></div>` +
        (displayableEvents.length > 0 ? `<div class="grid grid-cols-1 gap-4">${displayableEvents.map(p => createCard(p, currentUserData)).join('')}</div>` : `<p class="text-center text-gray-500 py-4">No upcoming events.</p>`);

    state.countdownInterval = setInterval(() => updateCountdowns(allPosts), 1000 * 30);
    updateCountdowns(allPosts);
}

export function updateCountdowns(allPosts) {
    document.querySelectorAll('.event-card').forEach(el => {
        const postId = el.dataset.postId;
        const post = allPosts.find(p => p.id === postId);
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

export function updateUIForLoggedInUser(user) {
    DOMElements.loginBtn.classList.add('hidden');
    DOMElements.userProfileContainer.classList.remove('hidden');
    DOMElements.usernameDisplay.textContent = user.username;
    const avatarUrl = user.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${user.username.charAt(0).toUpperCase()}`;
    DOMElements.userAvatarButton.src = avatarUrl;
    DOMElements.playerCardInfo.innerHTML = `
        <p class="text-sm text-gray-400">Alliance: <strong class="text-white">[${user.alliance}] ${user.allianceRank}</strong></p>
        <p class="text-sm text-gray-400">Power: <strong class="text-white">${(user.power || 0).toLocaleString()}</strong></p>
    `;
}

export function updateUIForLoggedOutUser() {
    DOMElements.loginBtn.classList.remove('hidden');
    DOMElements.userProfileContainer.classList.add('hidden');
}


// --- Particle Animation ---
export function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        let particleCount = (canvas.width * canvas.height) / 10000;
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 1.5 + 0.5,
                color: Math.random() > 0.3 ? 'rgba(0, 191, 255, 0.5)' : 'rgba(248, 113, 113, 0.1)'
            });
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(animateParticles);
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        createParticles();
    });
    resizeCanvas();
    createParticles();
    animateParticles();
}

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
let activePlayerSettingsUID = null;
let editingPostId = null;
let actionPostId = null;
let countdownInterval = null;

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
    
    activePlayerSettingsUID = null;
    editingPostId = null;
    actionPostId = null;
}

// ... Add functions to show specific modals, e.g., showAuthModal, showEditProfileModal ...
// These functions will often fetch HTML templates, populate them, and then call showModal.

// --- Page Navigation ---
export function showPage(targetId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = page.id === targetId ? 'block' : 'none';
    });
    // Update active state on nav links
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.mainTarget === targetId);
    });
}

// --- Rendering Functions ---

/**
 * Renders skeleton loaders for posts and events while data is loading.
 */
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
    
    if (DOMElements.announcementsContainer) {
        DOMElements.announcementsContainer.innerHTML = `
            <div class="section-header text-xl font-bold mb-4" style="--glow-color: var(--color-highlight);"><i class="fas fa-bullhorn"></i><span>Announcements</span></div>
            <div class="grid grid-cols-1 gap-4">${skeletonHTML}</div>`;
    }
    if (DOMElements.eventsSectionContainer) {
        DOMElements.eventsSectionContainer.innerHTML = `
            <div class="section-header text-xl font-bold mb-4"><i class="fas fa-calendar-alt"></i><span>Events</span></div>
            <div class="grid grid-cols-1 gap-4">${skeletonHTML.repeat(2)}</div>`;
    }
}

// ... Add other rendering functions like renderPosts, renderPlayers, renderMessages etc.
// These will take data as input and generate the necessary HTML.

/**
 * Creates the HTML for a single post or event card.
 * @param {object} post - The post data object.
 * @param {object} currentUserData - The currently logged-in user's data.
 * @returns {string} The HTML string for the card.
 */
export function createCard(post, currentUserData) {
    const style = POST_STYLES[post.subType] || {};
    const isEvent = post.mainType === 'event';
    const color = style.color || 'var(--color-primary)';
    const headerStyle = post.thumbnailUrl ? `background-image: url('${post.thumbnailUrl}')` : `background-color: #101419;`;
    const postDate = post.createdAt?.toDate();
    const timestamp = postDate ? formatTimeAgo(postDate) : '...';
    
    const postTypeText = POST_TYPES[`${post.subType}_${post.mainType}`]?.text || post.subType.replace(/_/g, ' ').toUpperCase();

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

// js/ui.js
import { formatTimeAgo, getRankColor, isUserLeader, formatEventDateTime, formatDuration, getEventStatus } from './utils.js';
import { ALLIANCES, ALLIANCE_RANKS, POST_TYPES, POST_STYLES } from './constants.js';

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
    authModalContainer: document.getElementById('auth-modal-container'),
};

// --- Global Loader ---
export function hideGlobalLoader() {
    const loader = document.getElementById('global-loader');
    const content = document.getElementById('main-content');
    if (loader) loader.style.opacity = '0';
    if (content) content.style.opacity = '1';
    setTimeout(() => { if (loader) loader.style.display = 'none'; }, 300);
}

// --- Page & Modal Management ---
export function showPage(targetId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = page.id === targetId ? 'block' : 'none';
    });
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.mainTarget === targetId);
    });
}

export function showAuthModal(formToShow) {
    const container = document.getElementById('auth-modal-container');
    container.innerHTML = getAuthModalHTML();
    
    document.getElementById('modal-backdrop').classList.add('visible');
    container.classList.add('visible');
    
    const loginForm = container.querySelector('#login-form-container');
    const registerForm = container.querySelector('#register-form-container');

    if (formToShow === 'register') {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    } else {
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
    }
}

// --- Initial Page & Modal HTML Rendering ---
function initializePageHTML() {
    DOMElements.eventsPage.innerHTML = `<main id="events-main-container" class="space-y-6"><div id="filter-container" class="filter-btn-group"></div><div id="announcements-container" class="space-y-4"></div><div id="events-section-container" class="space-y-4"></div></main>`;
    DOMElements.playersPage.innerHTML = `<div class="glass-pane section-container"><div class="text-center mb-8"><h2 class="text-3xl font-bold text-white tracking-wider" style="text-shadow: 0 0 10px var(--color-primary);">PLAYERS OF 899</h2></div><div class="flex flex-col md:flex-row gap-4 mb-6"><div class="input-group flex-grow"><i class="fas fa-search input-icon"></i><input type="text" id="player-search-input" placeholder="Search by player name..." class="form-input"></div><div class="input-group md:max-w-xs"><i class="fas fa-shield-alt input-icon"></i><div class="custom-select-container" data-type="alliance-filter"><input type="hidden" id="alliance-filter" name="alliance-filter"><button type="button" class="custom-select-value form-input"><span>All Alliances</span><i class="fas fa-chevron-down text-xs"></i></button><div class="custom-select-options"><div class="options-list"></div></div></div></div></div><div id="player-list-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div></div>`;
    DOMElements.socialPage.innerHTML = `<div class="glass-pane section-container"><div class="flex flex-col md:flex-row gap-6"><div class="flex-grow md:w-2/3"><div id="social-tabs-container" class="social-tabs flex items-center mb-4"><button class="social-tab-btn active" data-tab="world-chat"><i class="fas fa-globe mr-2"></i>World</button><button id="alliance-tab-btn" class="social-tab-btn" data-tab="alliance-chat"><i class="fas fa-shield-alt mr-2"></i>Alliance</button><button id="leadership-tab-btn" class="social-tab-btn" data-tab="leadership-chat"><i class="fas fa-crown mr-2"></i>Leadership</button></div><div id="pane-world-chat" class="social-content-pane active"></div><div id="pane-alliance-chat" class="social-content-pane"></div><div id="pane-leadership-chat" class="social-content-pane"></div></div><div class="md:w-1/3 flex-shrink-0 space-y-4"><div><h3 class="section-header text-lg font-bold mb-2"><i class="fas fa-user-friends"></i> Friends</h3><div id="friends-list" class="space-y-2"></div></div><div><h3 class="section-header text-lg font-bold mb-2"><i class="fas fa-inbox"></i> Friend Requests</h3><div id="friend-requests-list" class="space-y-2"></div></div><div><h3 class="section-header text-lg font-bold mb-2"><i class="fas fa-paper-plane"></i> Sent Requests</h3><div id="sent-requests-list" class="space-y-2"></div></div></div></div></div>`;
    DOMElements.feedPage.innerHTML = `<div class="glass-pane section-container"><div class="text-center mb-8"><h2 class="text-3xl font-bold text-white tracking-wider" style="text-shadow: 0 0 10px var(--color-primary);">YOUR FEED</h2><p class="text-gray-400">Recent activity and notifications.</p></div><div id="feed-container" class="space-y-4 max-w-2xl mx-auto"><p class="text-center text-gray-500 py-8">Loading your feed...</p></div></div>`;
}

function getAuthModalHTML() {
    return `<div class="glass-pane"><div class="modal-content-wrapper"><button id="close-auth-modal-btn" class="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"><i class="fas fa-times fa-lg"></i></button><div class="modal-content-scroll"><div id="login-form-container" class="auth-form"><h2 class="text-2xl font-bold text-white text-center mb-4">Login</h2><form id="login-form"><div class="space-y-4"><div class="input-group"><i class="fas fa-envelope input-icon"></i><input type="email" id="login-email" placeholder="Email" class="form-input" required></div><div class="input-group"><i class="fas fa-lock input-icon"></i><input type="password" id="login-password" placeholder="Password" class="form-input" required></div></div><p id="login-error" class="text-red-400 text-center text-sm mt-4 form-error"></p><button type="submit" id="login-submit-btn" class="w-full p-3 rounded-lg primary-btn mt-2">Login</button><p class="text-center text-sm text-gray-400 mt-4">Don't have an account? <a href="#" id="show-register-link" class="font-semibold hover:text-white" style="color: var(--color-primary);">Register here</a></p></form></div><div id="register-form-container" class="auth-form"></div></div></div></div>`;
}

export function renderEditProfileModal(user) {
    // ... implementation
}

// --- Main Rendering Functions ---
export function renderSkeletons() {
    initializePageHTML();
    // ... skeleton rendering logic ...
}

export function renderPosts(allPosts, currentUserData) {
    // ... implementation ...
}

export function renderPlayers(players, currentUserData) {
    // ... implementation ...
}

export function renderMessages(messages, chatType, allPlayers, currentUserData) {
    const container = document.getElementById(`${chatType}-window`);
    // ... implementation ...
}

export function renderFriendsLists(friendsData, allPlayers) {
    // ... implementation ...
}

export function renderFeed(notifications, allPlayers) {
    // ... implementation ...
}

// --- UI Update Functions ---
export function updateUIForLoggedInUser(user) {
    // ... implementation ...
}

export function updateUIForLoggedOutUser() {
    // ... implementation ...
}

export function updateSocialTabPermissions(currentUserData) {
    // ... implementation ...
}

export function updateNotificationBadge(notifications) {
    // ... implementation ...
}

/**
 * --- FIX ---
 * Added the 'export' keyword to this function. It was defined but not exported,
 * causing the "is not a function" error in app.js.
 */
export function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    function createParticles() {
        particles = []; let particleCount = (canvas.width * canvas.height) / 10000;
        for (let i = 0; i < particleCount; i++) { particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, size: Math.random() * 1.5 + 0.5, color: Math.random() > 0.3 ? 'rgba(0, 191, 255, 0.5)' : 'rgba(248, 113, 113, 0.1)' }); }
    }
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > canvas.width) p.vx *= -1; if (p.y < 0 || p.y > canvas.height) p.vy *= -1; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); });
        requestAnimationFrame(animateParticles);
    }
    window.addEventListener('resize', () => { resizeCanvas(); createParticles(); });
    resizeCanvas(); createParticles(); animateParticles();
}

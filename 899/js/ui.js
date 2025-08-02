// js/ui.js
import { formatTimeAgo, getRankColor, isUserLeader, formatEventDateTime, formatDuration, getEventStatus } from './utils.js';
import { ALLIANCES, ALLIANCE_RANKS, POST_TYPES, POST_STYLES } from './constants.js';

export const DOMElements = {
    mainNav: document.getElementById('main-nav'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    playerCardBtn: document.getElementById('player-card-btn'),
    eventsPage: document.getElementById('page-events'),
    socialPage: document.getElementById('page-social'),
    playersPage: document.getElementById('page-players'),
    feedPage: document.getElementById('page-feed'),
    authModalContainer: document.getElementById('auth-modal-container'),
    editProfileModalContainer: document.getElementById('edit-profile-modal-container'),
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

/**
 * --- FIX: Self-Contained Auth Modal ---
 * This function now handles everything related to the auth modal:
 * 1. Renders the HTML.
 * 2. Attaches all internal event listeners (close, switch form, submit).
 * 3. Accepts the login/register handler functions as arguments to keep logic separate.
 * This prevents the "crash on login" error.
 */
export function showAuthModal(initialForm, loginHandler, registerHandler) {
    const container = DOMElements.authModalContainer;
    container.innerHTML = getAuthModalHTML();
    
    const backdrop = document.getElementById('modal-backdrop');
    const loginFormEl = container.querySelector('#login-form-container');
    const registerFormEl = container.querySelector('#register-form-container');

    const showForm = (formToShow) => {
        loginFormEl.classList.toggle('active', formToShow === 'login');
        registerFormEl.classList.toggle('active', formToShow === 'register');
    };

    const closeModal = () => {
        backdrop.classList.remove('visible');
        container.classList.remove('visible');
        setTimeout(() => container.innerHTML = '', 300);
    };

    // Attach Event Listeners
    container.querySelector('#close-auth-modal-btn').addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
    container.querySelector('#show-register-link').addEventListener('click', (e) => { e.preventDefault(); showForm('register'); });
    container.querySelector('#show-login-link').addEventListener('click', (e) => { e.preventDefault(); showForm('login'); });

    // Login Form Submission
    container.querySelector('#login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = container.querySelector('#login-email').value;
        const password = container.querySelector('#login-password').value;
        const errorEl = container.querySelector('#login-error');
        const submitBtn = container.querySelector('#login-submit-btn');
        
        errorEl.textContent = '';
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging In...';

        try {
            await loginHandler(email, password);
            closeModal(); // Close on success
        } catch (error) {
            errorEl.textContent = "Invalid email or password.";
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Login';
        }
    });
    
    // TODO: Add registration form submission handler here if needed

    // Show the initial state
    showForm(initialForm);
    backdrop.classList.add('visible');
    container.classList.add('visible');
}

// --- Initial Page & Modal HTML Rendering ---
function initializePageHTML() {
    // ... (implementation unchanged)
}

function getAuthModalHTML() {
    return `<div class="glass-pane"><div class="modal-content-wrapper"><button id="close-auth-modal-btn" class="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"><i class="fas fa-times fa-lg"></i></button><div class="modal-content-scroll"><div id="login-form-container" class="auth-form"><h2 class="text-2xl font-bold text-white text-center mb-4">Login</h2><form id="login-form"><div class="space-y-4"><div class="input-group"><i class="fas fa-envelope input-icon"></i><input type="email" id="login-email" placeholder="Email" class="form-input" required></div><div class="input-group"><i class="fas fa-lock input-icon"></i><input type="password" id="login-password" placeholder="Password" class="form-input" required></div></div><p id="login-error" class="text-red-400 text-center text-sm mt-4 form-error"></p><button type="submit" id="login-submit-btn" class="w-full p-3 rounded-lg primary-btn mt-2">Login</button><p class="text-center text-sm text-gray-400 mt-4">Don't have an account? <a href="#" id="show-register-link" class="font-semibold hover:text-white" style="color: var(--color-primary);">Register here</a></p></form></div><div id="register-form-container" class="auth-form"><h2 class="text-2xl font-bold text-white text-center mb-4">Register</h2><p class="text-center">Registration form goes here.</p><p class="text-center text-sm text-gray-400 mt-4">Already have an account? <a href="#" id="show-login-link" class="font-semibold hover:text-white" style="color: var(--color-primary);">Login here</a></p></div></div></div></div>`;
}

export function renderEditProfileModal(user) {
    // ... implementation ...
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

export function initParticles() {
    // ... implementation ...
}

// js/ui.js
import { formatTimeAgo, getRankColor, isUserLeader } from './utils.js';
import { ALLIANCES, ALLIANCE_RANKS } from './constants.js';

export const DOMElements = {
    // ... (selectors)
};

// --- NEW: Global Loader ---
export function hideGlobalLoader() {
    const loader = document.getElementById('global-loader');
    const content = document.getElementById('main-content');
    if (loader) loader.style.opacity = '0';
    if (content) content.style.opacity = '1';
    setTimeout(() => { if (loader) loader.style.display = 'none'; }, 300);
}

// --- Modal Rendering & Management ---
export function showAuthModal(formToShow) {
    const container = document.getElementById('auth-modal-container');
    container.innerHTML = getAuthModalHTML();
    
    // Attach listeners for the newly created modal
    // ...
    
    document.getElementById('modal-backdrop').classList.add('visible');
    container.classList.add('visible');
    // ... logic to show login or register form ...
}

function getAuthModalHTML() {
    return `
    <div class="glass-pane">
        <div class="modal-content-wrapper">
            <button id="close-auth-modal-btn" class="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"><i class="fas fa-times fa-lg"></i></button>
            <div class="modal-content-scroll">
                <!-- Login Form -->
                <div id="login-form-container" class="auth-form">
                    <h2 class="text-2xl font-bold text-white text-center mb-4">Login</h2>
                    <form id="login-form">
                        <div class="space-y-4">
                            <div class="input-group"><i class="fas fa-envelope input-icon"></i><input type="email" id="login-email" placeholder="Email" class="form-input" required></div>
                            <div class="input-group"><i class="fas fa-lock input-icon"></i><input type="password" id="login-password" placeholder="Password" class="form-input" required></div>
                        </div>
                        <p id="login-error" class="text-red-400 text-center text-sm mt-4 form-error"></p>
                        <button type="submit" id="login-submit-btn" class="w-full p-3 rounded-lg primary-btn mt-2">Login</button>
                        <p class="text-center text-sm text-gray-400 mt-4">
                            Don't have an account? <a href="#" id="show-register-link" class="font-semibold hover:text-white" style="color: var(--color-primary);">Register here</a>
                        </p>
                    </form>
                </div>
                <!-- Registration Form -->
                <div id="register-form-container" class="auth-form">
                    <!-- Registration form HTML goes here -->
                </div>
            </div>
        </div>
    </div>
    `;
}

// ... (rest of the UI functions: renderSkeletons, renderPosts, renderPlayers, etc.)

export function updateNotificationBadge(notifications) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    const unreadCount = notifications.filter(n => !n.read).length;
    badge.textContent = unreadCount;
    badge.classList.toggle('hidden', unreadCount === 0);
}

import {
    updatePostsFeed,
    showEditPostModal,
    hideEditPostModal
} from './post-ui.js';
import {
    updatePlayersList
} from './players-ui.js';
import {
    updatePlayerSettingsUI,
    showEditProfileModal,
    hideEditProfileModal
} from './player-settings-ui.js';
import {
    showAuthModal,
    hideAuthModal,
    toggleAuthForms
} from './auth-ui.js';

/**
 * Manages all UI interactions and updates.
 * This class is a central point for manipulating the DOM, showing/hiding elements,
 * and populating data into the UI components.
 */
export class UIManager {
    constructor() {
        this.userInfo = document.getElementById('user-info');
        this.authButton = document.getElementById('sign-in-register-btn');
        this.postsContainer = document.getElementById('posts-feed');
        this.playersList = document.getElementById('players-list');
        this.userAvatar = document.getElementById('user-avatar');
        this.userDisplayName = document.getElementById('user-display-name');
        this.editProfileBtn = document.getElementById('edit-profile-btn');

        // Setup internal event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listener for the main "Edit Profile" button in the header
        if (this.editProfileBtn) {
            this.editProfileBtn.addEventListener('click', () => this.showEditProfileModal());
        }

        // Listeners for switching between sign-in and sign-up forms
        const showSignup = document.getElementById('show-signup');
        const showSignin = document.getElementById('show-signin');
        if (showSignup && showSignin) {
            showSignup.addEventListener('click', (e) => {
                e.preventDefault();
                toggleAuthForms(true);
            });
            showSignin.addEventListener('click', (e) => {
                e.preventDefault();
                toggleAuthForms(false);
            });
        }
    }

    // --- High-Level UI State Changes ---

    showAuthenticatedUI() {
        this.userInfo.classList.remove('hidden');
        this.authButton.classList.add('hidden');
    }

    showSignedOutUI() {
        this.userInfo.classList.add('hidden');
        this.authButton.classList.remove('hidden');
        this.postsContainer.innerHTML = '<p>Please sign in to see posts.</p>';
        this.playersList.innerHTML = '';
    }

    // --- Component Update Methods ---

    updateUserDisplay(user) {
        if (user) {
            this.userAvatar.src = user.photoURL || 'https://placehold.co/40x40/ced4da/212529?text=?';
            this.userDisplayName.textContent = user.displayName || 'Anonymous';
        }
    }

    updatePosts(posts, currentUserId) {
        updatePostsFeed(posts, currentUserId);
    }

    updatePlayersList(players, currentUserId) {
        updatePlayersList(this.playersList, players, currentUserId);
    }

    updatePlayerSettings(player) {
        updatePlayerSettingsUI(player);
        this.updateUserDisplay(player); // Also update the header display
    }

    // --- Modal Management ---

    showAuthModal() {
        showAuthModal();
    }

    hideAuthModal() {
        hideAuthModal();
    }

    showEditProfileModal() {
        showEditProfileModal();
    }

    hideEditProfileModal() {
        hideEditProfileModal();
    }

    showEditPostModal(postId, currentContent) {
        showEditPostModal(postId, currentContent);
    }

    hideEditPostModal() {
        hideEditPostModal();
    }
    
    showPostActionsModal(postId) {
        const modal = document.getElementById('post-actions-modal');
        if (modal) {
            modal.querySelector('#actions-post-id').value = postId;
            modal.classList.remove('hidden');
        }
    }

    hidePostActionsModal() {
        const modal = document.getElementById('post-actions-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
}

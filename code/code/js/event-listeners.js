// code/js/event-listeners.js

/**
 * This module centralizes the setup of all major event listeners
 * for the application, keeping the main.js file cleaner.
 */

import { auth, db } from './firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getState, updateState } from './state.js';
import { showPage, hideAllModals, showAuthModal, showEditProfileModal, showCreatePostModal, showConfirmationModal, showPostActionsModal, showPrivateMessageModal } from './ui/ui-manager.js';
import { handleLoginSubmit, handleForgotPassword, handleRegistrationNext, handleRegistrationBack, handleAvatarSelection, handleRegistrationSubmit, handleEditProfileSubmit, handleAvatarUpload } from './ui/auth-ui.js';
import { handlePlayerSettingsSubmit } from './ui/player-settings-ui.js';
import { handlePostNext, handlePostBack, handleThumbnailSelection, handlePostSubmit, populatePostFormForEdit, renderPosts } from './ui/post-ui.js';
import { applyPlayerFilters } from './ui/players-ui.js';
import { deletePost, handleSendMessage, handleDeleteMessage, handleNotificationAction, addFriend, removeFriend, sendPrivateMessage } from './firestore.js';

export function initializeAllEventListeners() {
    const getElement = (id) => document.getElementById(id);

    // --- Modal Triggers & Closers ---
    getElement('login-btn').addEventListener('click', () => showAuthModal('login'));
    getElement('close-auth-modal-btn').addEventListener('click', hideAllModals);
    getElement('close-edit-modal-btn').addEventListener('click', hideAllModals);
    getElement('close-player-settings-modal-btn').addEventListener('click', hideAllModals);
    getElement('close-create-post-modal-btn').addEventListener('click', hideAllModals);
    getElement('close-private-message-modal-btn').addEventListener('click', hideAllModals);
    getElement('confirmation-cancel-btn').addEventListener('click', hideAllModals);
    getElement('close-post-actions-modal-btn').addEventListener('click', hideAllModals);
    getElement('modal-backdrop').addEventListener('click', (e) => {
        if (e.target === getElement('modal-backdrop')) {
            hideAllModals();
            getElement('mobile-nav-menu').classList.remove('open');
        }
    });

    // --- Auth Forms ---
    getElement('show-register-link').addEventListener('click', (e) => { e.preventDefault(); showAuthModal('register'); });
    getElement('show-login-link').addEventListener('click', (e) => { e.preventDefault(); showAuthModal('login'); });
    getElement('login-form').addEventListener('submit', handleLoginSubmit);
    getElement('forgot-password-link').addEventListener('click', handleForgotPassword);
    
    // --- Registration Stepper ---
    getElement('register-next-btn').addEventListener('click', handleRegistrationNext);
    getElement('register-back-btn').addEventListener('click', handleRegistrationBack);
    getElement('register-avatar-btn').addEventListener('click', () => getElement('register-avatar-input').click());
    getElement('register-avatar-input').addEventListener('change', handleAvatarSelection);
    getElement('register-form').addEventListener('submit', handleRegistrationSubmit);

    // --- User Profile & Actions ---
    getElement('user-profile-button').addEventListener('click', (e) => {
    e.stopPropagation(); // This prevents the window click listener from immediately closing the menu.
    const navItem = getElement('user-profile-nav-item');
    // Close other dropdowns before opening this one
    document.querySelectorAll('.nav-item.open').forEach(item => {
        if (item !== navItem) {
            item.classList.remove('open');
        }
    });
    navItem.classList.toggle('open');
    });
    getElement('profile-dropdown-logout').addEventListener('click', () => signOut(auth));
    getElement('profile-dropdown-edit').addEventListener('click', () => {
        getElement('user-profile-nav-item').classList.remove('open');
        showEditProfileModal();
    });
    getElement('profile-dropdown-friends').addEventListener('click', () => {
        getElement('user-profile-nav-item').classList.remove('open');
        showPage('page-social');
        document.querySelector('.social-tab-btn[data-tab="friends"]').click();
    });
    getElement('profile-dropdown-avatar').addEventListener('click', () => getElement('avatar-upload-input').click());
    getElement('avatar-upload-input').addEventListener('change', handleAvatarUpload);
    getElement('edit-profile-form').addEventListener('submit', handleEditProfileSubmit);

    // --- Player Settings ---
    getElement('player-settings-form').addEventListener('submit', handlePlayerSettingsSubmit);

    // --- Post Creation/Editing ---
    getElement('post-next-btn').addEventListener('click', handlePostNext);
    getElement('post-back-btn').addEventListener('click', handlePostBack);
    getElement('post-thumbnail-btn').addEventListener('click', () => getElement('post-thumbnail-input').click());
    getElement('post-thumbnail-input').addEventListener('change', handleThumbnailSelection);
    getElement('create-post-form').addEventListener('submit', handlePostSubmit);
    getElement('post-repeat-type').addEventListener('change', (e) => {
        getElement('post-repeat-weeks-container').classList.toggle('hidden', e.target.value !== 'weekly');
    });
    // --- Main Navigation & Page Switching ---
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            // The check for a dropdown menu was preventing the Feed page from opening.
            // We remove the if-statement to allow all nav links to trigger a page change.
            if (link.dataset.mainTarget) {
                showPage(link.dataset.mainTarget);
            }
        });
    });
    // --- Mobile Navigation ---
    getElement('open-mobile-menu-btn').addEventListener('click', () => {
        getElement('mobile-nav-menu').classList.add('open');
        getElement('modal-backdrop').classList.add('visible');
    });
    getElement('close-mobile-menu-btn').addEventListener('click', () => {
        getElement('mobile-nav-menu').classList.remove('open');
        getElement('modal-backdrop').classList.remove('visible');
    });

    // --- Filtering ---
    getElement('filter-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            updateState({ activeFilter: e.target.dataset.filter });
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderPosts();
        }
    });
    getElement('player-search-input').addEventListener('input', () => applyPlayerFilters());
    getElement('alliance-filter').addEventListener('change', () => applyPlayerFilters());


    // --- Social Page & Chat ---
    document.querySelectorAll('.social-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.social-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetPaneId = `pane-${btn.dataset.tab}`;
            document.querySelectorAll('.social-content-pane').forEach(pane => {
                pane.classList.toggle('active', pane.id === targetPaneId);
            });
        });
    });
    getElement('world-chat-form').addEventListener('submit', (e) => handleSendMessage(e, 'world_chat'));
    getElement('alliance-chat-form').addEventListener('submit', (e) => handleSendMessage(e, 'alliance_chat'));
    const leadershipForm = getElement('leadership-chat-form');
    if (leadershipForm) {
        leadershipForm.addEventListener('submit', (e) => handleSendMessage(e, 'leadership_chat'));
    }
    const privateMessageForm = getElement('private-message-form');
    if (privateMessageForm) {
        privateMessageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = getElement('private-message-input');
            const text = input.value.trim();
            if (text === '') return;
            input.value = '';
            try {
            await sendPrivateMessage(text);
            } catch (error) {
                console.error("Failed to send private message:", error);
                alert("Error: Could not send message. Please check console for details.");
                input.value = text; // Restore on failure
            }
        });
    }
    const socialPage = getElement('page-social');
    if (socialPage) {
        socialPage.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-message-btn');
            if (deleteBtn) {
                showConfirmationModal('Delete Message?', 'Are you sure you want to permanently delete this message?', () => {
                    handleDeleteMessage(deleteBtn.dataset.id, deleteBtn.dataset.type);
                });
            }
        });
    }

    // --- Notifications ---
    const feedDropdown = getElement('feed-dropdown');
        if (feedDropdown) {
            feedDropdown.addEventListener('click', (e) => handleNotificationClick(e));
        }

        const feedPageContainer = getElement('feed-page-container');
        if (feedPageContainer) {
            feedPageContainer.addEventListener('click', (e) => handleNotificationClick(e));
        }

        async function handleNotificationClick(e) {
            const item = e.target.closest('.notification-item');
            if (!item) return;
            const actionBtn = e.target.closest('.notification-action-btn');
            if (actionBtn) e.stopPropagation();
            
            handleNotificationAction(
                item.dataset.id, 
                actionBtn ? actionBtn.dataset.action : 'read', 
                item.dataset.senderUid, 
                actionBtn ? actionBtn.dataset.targetUid : null
            );
        }

    // --- Player & Friend Actions ---
    getElement('player-list-container').addEventListener('click', async (e) => {
        const addFriendBtn = e.target.closest('.add-friend-btn');
        const messageBtn = e.target.closest('.message-player-btn');
        const settingsBtn = e.target.closest('.player-settings-btn');
        const { currentUserData, allPlayers } = getState();

        if (addFriendBtn && currentUserData) {
            const playerCard = addFriendBtn.closest('.player-card');
            const recipientUid = playerCard.dataset.uid;
            addFriendBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
            const success = await addFriend(recipientUid);
            if (success) {
                addFriendBtn.innerHTML = `<i class="fas fa-check"></i>`;
                addFriendBtn.title = "Request Sent";
                addFriendBtn.disabled = true;
            } else {
                addFriendBtn.innerHTML = `<i class="fas fa-user-plus"></i>`;
            }
        } else if (messageBtn && currentUserData) {
            const playerCard = messageBtn.closest('.player-card');
            const targetPlayer = allPlayers.find(p => p.uid === playerCard.dataset.uid);
            if (targetPlayer) showPrivateMessageModal(targetPlayer);
        } else if (settingsBtn) {
            const { allPlayers } = getState();
            const targetPlayer = allPlayers.find(p => p.uid === settingsBtn.dataset.uid);
            if(targetPlayer) showPlayerSettingsModal(targetPlayer);
        }
    });

    getElement('friends-list').addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-friend-btn');
        const messageBtn = e.target.closest('.message-player-btn');
        
        if (removeBtn) {
            showConfirmationModal('Remove Friend?', 'Are you sure you want to remove this friend?', () => {
                removeFriend(removeBtn.dataset.uid);
            });
        } else if (messageBtn) {
            const { allPlayers } = getState();
            const targetPlayer = allPlayers.find(p => p.uid === messageBtn.dataset.uid);
            if (targetPlayer) showPrivateMessageModal(targetPlayer);
        }
    });
    
    // --- General UI ---
    window.addEventListener('click', (e) => { 
        if (!e.target.closest('.nav-item')) {
            document.querySelectorAll('.nav-item.open').forEach(item => item.classList.remove('open'));
        }
        if (!e.target.closest('#user-profile-nav-item')) {
            getElement('user-profile-nav-item').classList.remove('open');
        }
        if (!e.target.closest('.custom-select-container')) {
            document.querySelectorAll('.custom-select-container').forEach(c => c.classList.remove('open'));
        }
    });

    document.querySelectorAll('.power-input').forEach(input => {
        input.addEventListener('input', (e) => {
            let value = String(e.target.value).replace(/,/g, '');
            if (isNaN(value)) { e.target.value = ''; return; }
            e.target.value = Number(value).toLocaleString('en-US');
        });
    });

    // --- Event/Announcement Creation Triggers ---
    getElement('events-main-container').addEventListener('click', e => {
        const createAnnouncementBtn = e.target.closest('#create-announcement-btn');
        const createEventBtn = e.target.closest('#create-event-btn');
        const actionsBtn = e.target.closest('.post-card-actions-trigger');

        if (createAnnouncementBtn) {
            showCreatePostModal('announcement');
        } else if (createEventBtn) {
            showCreatePostModal('event');
        } else if (actionsBtn) {
            showPostActionsModal(actionsBtn.dataset.postId);
        }
    });
}

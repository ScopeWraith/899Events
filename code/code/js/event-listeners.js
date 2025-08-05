// code/js/event-listeners.js

/**
 * This module centralizes the setup of all major event listeners
 * for the application, keeping the main.js file cleaner.
 */

import { auth } from './firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getState, updateState } from './state.js';
import { showPage, hideAllModals, showAuthModal, showEditProfileModal, showCreatePostModal, showConfirmationModal, showPostActionsModal, showPrivateMessageModal } from './ui/ui-manager.js';
import { handleLoginSubmit, handleForgotPassword, handleRegistrationNext, handleRegistrationBack, handleAvatarSelection, handleRegistrationSubmit, handleEditProfileSubmit, handleAvatarUpload } from './ui/auth-ui.js';
import { handlePlayerSettingsSubmit } from './ui/player-settings-ui.js';
import { handlePostNext, handlePostBack, handleThumbnailSelection, handlePostSubmit, renderPosts } from './ui/post-ui.js';
import { applyPlayerFilters } from './ui/players-ui.js';
import { handleDeleteMessage, handleNotificationAction, addFriend, sendPrivateMessage, setupChatListeners, toggleReaction } from './firestore.js';
import { activateChatChannel } from './ui/social-ui.js'; 
import { positionEmojiPicker } from './utils.js';
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
        e.stopPropagation();
        const navItem = getElement('user-profile-nav-item');
        document.querySelectorAll('.nav-item.open').forEach(item => {
            if (item !== navItem) item.classList.remove('open');
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
        showPage('page-feed');
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
            if (link.dataset.mainTarget) showPage(link.dataset.mainTarget);
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
    const allianceFilter = getElement('alliance-filter');
    if (allianceFilter) {
        allianceFilter.addEventListener('change', () => applyPlayerFilters());
    }

    // --- Social Page & Chat ---
    const socialChatSelector = getElement('social-chat-selector');
    if (socialChatSelector) {
        socialChatSelector.addEventListener('click', (e) => {
            const chatButton = e.target.closest('.chat-selector-btn');
            if (chatButton) {
                const chatId = chatButton.dataset.chatId;
                activateChatChannel(chatId);
                setupChatListeners(chatId);
            }
        });
    }

    // Chat Forms
    getElement('private-message-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = getElement('private-message-input');
        const text = input.value.trim();
        if (text === '') return;
        input.value = '';
        try {
            await sendPrivateMessage(text);
        } catch (error) {
            console.error("Failed to send private message:", error);
            alert("Error: Could not send message.");
            input.value = text;
        }
    });

    // Social Page Click Handler (for main chat window)
    const socialPage = getElement('page-social');
    if (socialPage) {
        socialPage.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-message-btn');
            const messageEl = e.target.closest('.chat-message');
            const bubble = e.target.closest('.chat-message-bubble');

            if (deleteBtn && messageEl) {
                const bubble = messageEl.querySelector('.chat-message-bubble');
                if (bubble) {
                    showConfirmationModal('Delete Message?', 'Are you sure you want to permanently delete this message?', () => {
                        handleDeleteMessage(bubble.dataset.messageId, bubble.dataset.chatType);
                        hideAllModals();
                    });
                }
            } else if (bubble) { // This now correctly handles a click on the bubble itself
                const picker = getElement('reaction-picker-container');
                picker.style.display = 'flex';
                const rect = bubble.getBoundingClientRect();
                picker.style.left = `${rect.left}px`;
                picker.style.top = `${rect.top}px`;
                picker.dataset.messageId = bubble.dataset.messageId;
                picker.dataset.chatType = bubble.dataset.chatType;
            }
        });
    }

    // Private Message Modal Click Handler
    const privateMessageModal = getElement('private-message-modal-container');
    if (privateMessageModal) {
        privateMessageModal.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-message-btn');
            if (deleteBtn) {
                const messageEl = deleteBtn.closest('.chat-message');
                if (messageEl) {
                    const bubble = messageEl.querySelector('.chat-message-bubble');
                    if (bubble) {
                        showConfirmationModal('Delete Message?', 'Are you sure you want to permanently delete this message?', () => {
                            handleDeleteMessage(bubble.dataset.messageId, 'private_chat');
                            hideAllModals();
                        });
                    }
                }
            }
        });
    }

    // --- Collapsible Friends List ---
    const collapseBtn = getElement('collapse-friends-btn');
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            const container = getElement('friends-list-container-social');
            const isCollapsed = container.classList.toggle('collapsed');
            updateState({ isFriendsListCollapsed: isCollapsed });
        });
    }

    // --- Notifications ---
    const feedDropdown = getElement('feed-dropdown');
    if (feedDropdown) {
        feedDropdown.addEventListener('click', (e) => handleNotificationClick(e));
    }
    const feedActionContainer = getElement('feed-action-container');
    if (feedActionContainer) {
        feedActionContainer.addEventListener('click', (e) => handleNotificationClick(e));
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
            addFriendBtn.innerHTML = success ? `<i class="fas fa-check"></i>` : `<i class="fas fa-user-plus"></i>`;
            if(success) addFriendBtn.disabled = true;
        } else if (messageBtn && currentUserData) {
            const playerCard = messageBtn.closest('.player-card');
            const targetPlayer = allPlayers.find(p => p.uid === playerCard.dataset.uid);
            if (targetPlayer) showPrivateMessageModal(targetPlayer);
        } else if (settingsBtn) {
            const targetPlayer = allPlayers.find(p => p.uid === settingsBtn.dataset.uid);
            if(targetPlayer) showPlayerSettingsModal(targetPlayer);
        }
    });
    
    const friendsListSocial = getElement('friends-list-social-page');
    if (friendsListSocial) {
        friendsListSocial.addEventListener('click', (e) => {
            const messageBtn = e.target.closest('.message-player-btn');
            if (messageBtn) {
                const { allPlayers } = getState();
                const targetPlayer = allPlayers.find(p => p.uid === messageBtn.dataset.uid);
                if (targetPlayer) showPrivateMessageModal(targetPlayer);
            }
        });
    }
    
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
        const picker = getElement('reaction-picker-container');
        if (picker && picker.style.display === 'flex' && !e.target.closest('.chat-message-bubble') && !e.target.closest('#reaction-picker-container')) {
             picker.style.display = 'none';
        }
    });

    // --- Event/Announcement Creation Triggers ---
    getElement('events-main-container').addEventListener('click', e => {
        const createAnnouncementBtn = e.target.closest('#create-announcement-btn');
        const createEventBtn = e.target.closest('#create-event-btn');
        const actionsBtn = e.target.closest('.post-card-actions-trigger');

        if (createAnnouncementBtn) showCreatePostModal('announcement');
        else if (createEventBtn) showCreatePostModal('event');
        else if (actionsBtn) showPostActionsModal(actionsBtn.dataset.postId);
    });

    // --- Attachment and Emoji Logic ---
    const attachBtn = getElement('private-message-attach-btn');
    const attachInput = getElement('private-message-attach-input');
    if (attachBtn && attachInput) {
        attachBtn.addEventListener('click', () => attachInput.click());
        attachInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleImageAttachment(file);
        });
    }

    const emojiPickerContainer = getElement('emoji-picker-container');
    const emojiPicker = document.querySelector('emoji-picker');
    let activeEmojiInput = null;

    const setupEmojiButton = (buttonId, inputId) => {
        const button = getElement(buttonId);
        const input = getElement(inputId);
        if (button && input && emojiPickerContainer) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                activeEmojiInput = input;
                positionEmojiPicker(button, emojiPickerContainer);
            });
        }
    };
    setupEmojiButton('main-chat-emoji-btn', 'chat-input-main');
    setupEmojiButton('private-message-emoji-btn', 'private-message-input');

    if (emojiPicker) {
        emojiPicker.addEventListener('emoji-click', event => {
            if (activeEmojiInput) activeEmojiInput.value += event.detail.unicode;
            if (emojiPickerContainer) emojiPickerContainer.style.display = 'none';
        });
    }
    
    // --- Reaction Picker Listener ---
    const reactionPicker = getElement('reaction-picker-container');
    if (reactionPicker) {
        reactionPicker.addEventListener('click', (e) => {
            const emojiOption = e.target.closest('.emoji-option');
            if (emojiOption) {
                const { messageId, chatType } = reactionPicker.dataset;
                const emoji = emojiOption.dataset.emoji;
                toggleReaction(chatType, messageId, emoji);
                reactionPicker.style.display = 'none';
                delete reactionPicker.dataset.messageId;
                delete reactionPicker.dataset.chatType;
            }
        });
    }
}

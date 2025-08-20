// code/js/event-listeners.js

import { auth } from './firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getState, setState } from './state.js';
import {
    setupEmojiButton, showPage, hideAllModals, showAuthModal, showEditProfileModal,
    showCreatePostModal, showPostActionsModal, showFullscreenChatModal, showPlayerSettingsModal,
    handleSubNavClick, toggleSubNav, showViewPostModal, showAccessDeniedModal, showConfirmationModal
} from './ui/ui-manager.js';
import {
    handleLogout, handleLoginSubmit, handleForgotPassword, handleRegistrationNext,
    handleRegistrationBack, handleAvatarSelection, handleRegistrationSubmit,
    handleEditProfileSubmit, handleAvatarUpload
} from './ui/auth-ui.js';
import { handlePlayerSettingsSubmit } from './ui/player-settings-ui.js';
import { handlePostBack, handleThumbnailSelection, handlePostSubmit, populatePostFormForEdit } from './ui/post-ui.js';
import { applyPlayerFilters } from './ui/players-ui.js';
import {
    handleSendMessage, handleDeleteMessage, handleNotificationAction, addFriend,
    removeFriend, toggleReaction, togglePostReaction, handleImageAttachment, handleFullscreenMessageSend,
    declineFriendRequest, cancelFriendRequest
} from './firestore.js';
import {
    showEditAllianceModal, handleAllianceAvatarSelection, handleAllianceEditSubmit,
    showRegisterAllianceModal, handleAllianceRegisterSubmit
} from './ui/alliances-ui.js';

/**
 * Initializes and attaches all event listeners for the application.
 * This function centralizes the setup of UI interactions, from clicks and submits to input changes.
 */
export function initializeAllEventListeners() {
    /**
     * A helper function to get a DOM element by its ID.
     * @param {string} id The ID of the element to retrieve.
     * @returns {HTMLElement|null} The DOM element or null if not found.
     */
    const getElement = (id) => document.getElementById(id);

    /**
     * A helper function to safely add an event listener to an element.
     * @param {string} id The ID of the element to attach the listener to.
     * @param {string} event The name of the event (e.g., 'click', 'submit').
     * @param {Function} handler The function to execute when the event is triggered.
     */
    const addListener = (id, event, handler) => {
        const element = getElement(id);
        if (element) {
            element.addEventListener(event, handler);
        }
    };
    
    // Delegated event listener for the main server page content (`page-server`).
    const serverPage = getElement('page-server');
    if (serverPage) {
        serverPage.addEventListener('click', async (e) => {
            const registerBtn = e.target.closest('#show-register-alliance-modal-btn');
            const editBtn = e.target.closest('.alliance-card-edit-btn');
            const messageBtn = e.target.closest('.leader-action-btn.message-player-btn');
            const addFriendBtn = e.target.closest('.leader-action-btn.add-friend-btn');
            const { allAlliances, allPlayers } = getState();
            const napHeader = e.target.closest('.nap-section-header');

            if (napHeader) {
                const section = napHeader.closest('.nap-section');
                if (section) {
                    section.classList.toggle('open');
                }
            }
            if (registerBtn) {
                showRegisterAllianceModal();
            }
            else if (editBtn) {
                const allianceTag = editBtn.dataset.allianceTag;
                const allianceData = allAlliances.find(a => a.tag === allianceTag);
                if (allianceData) {
                    showEditAllianceModal(allianceData);
                }
            }
            else if (messageBtn) {
                const partnerData = allPlayers.find(p => p.uid === messageBtn.dataset.uid);
                if (partnerData) showFullscreenChatModal({ targetPlayer: partnerData });
            }
            else if (addFriendBtn) {
                const recipientUid = addFriendBtn.dataset.uid;
                addFriendBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
                const success = await addFriend(recipientUid);
                addFriendBtn.innerHTML = success ? `<i class="fas fa-check"></i>` : `<i class="fas fa-user-plus"></i>`;
                if (success) addFriendBtn.disabled = true;
            }
        });
    }

    // Modal and general UI listeners
    addListener('close-access-denied-modal-btn', 'click', hideAllModals);
    addListener('access-denied-login-btn', 'click', () => {
        hideAllModals();
        showAuthModal('login');
    });

    // Alliance management listeners
    addListener('close-register-alliance-modal-btn', 'click', hideAllModals);
    addListener('register-alliance-form', 'submit', handleAllianceRegisterSubmit);
    addListener('close-edit-alliance-modal-btn', 'click', hideAllModals);
    addListener('edit-alliance-avatar-btn', 'click', () => getElement('edit-alliance-avatar-input').click());
    addListener('edit-alliance-avatar-input', 'change', handleAllianceAvatarSelection);
    addListener('edit-alliance-form', 'submit', handleAllianceEditSubmit);

    // Social and chat listeners
    addListener('convo-list', 'click', (e) => {
        const convoItem = e.target.closest('.convo-item');
        if (convoItem) {
            const partnerId = convoItem.dataset.partnerUid;
            const { allPlayers } = getState();
            const partnerData = allPlayers.find(p => p.uid === partnerId);
            if (partnerData) {
                showFullscreenChatModal({ targetPlayer: partnerData });
            }
        }
    });
    addListener('fullscreen-chat-form', 'submit', async (e) => {
        e.preventDefault();
        const input = getElement('fullscreen-chat-input');
        const text = input.value.trim();
        if (text === '') return;
        input.value = '';
        try {
            await handleFullscreenMessageSend(text);
        } catch (error) {
            console.error("Failed to send message:", error);
            alert("Error: Could not send message.");
            input.value = text;
        }
    });

    // Post interaction listeners
    addListener('view-post-modal-container', 'click', (e) => {
        const reactionBtn = e.target.closest('.post-reaction-btn');
        if (reactionBtn) {
            const { actionPostId } = getState();
            const reactionType = reactionBtn.dataset.reaction;
            togglePostReaction(actionPostId, reactionType);
        }
    });

    // Main and sub-navigation listeners
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const { currentUserData } = getState();
            const mainTarget = link.dataset.mainTarget;

            if ((mainTarget === 'page-social' || mainTarget === 'page-feed') && !currentUserData) {
                showAccessDeniedModal();
                return;
            }

            const navItem = link.closest('.nav-item');
            const submenuId = navItem.dataset.submenuId || null;

            showPage(mainTarget);
            toggleSubNav(submenuId);

            document.querySelectorAll('#main-nav .nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
    document.querySelectorAll('.sub-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const subTarget = link.dataset.subTarget;
            handleSubNavClick(subTarget);
        });
    });

    // Mobile-specific navigation and profile listeners
    addListener('mobile-auth-container', 'click', () => {
        showEditProfileModal();
    });
    addListener('user-avatar-mobile' , 'click', () => {
        showEditProfileModal();
    });

    // Edit profile modal tab navigation
    const editProfileModal = getElement('edit-profile-modal-container');
    if (editProfileModal) {
        editProfileModal.addEventListener('click', (e) => {
            const tabBtn = e.target.closest('.modal-tab-btn');
            if (tabBtn) {
                e.preventDefault();
                const tabName = tabBtn.dataset.tab;

                editProfileModal.querySelectorAll('.modal-tab-btn').forEach(btn => btn.classList.remove('active'));
                tabBtn.classList.add('active');

                editProfileModal.querySelectorAll('.modal-tab-pane').forEach(pane => {
                    pane.classList.toggle('active', pane.id === `edit-profile-tab-${tabName}`);
                });
            }

            const skinBtn = e.target.closest('.skin-select-btn');
            if (skinBtn) {
                e.preventDefault();
                const parentContainer = skinBtn.parentElement;
                const targetInputId = parentContainer.id.replace('-selector', '');
                const targetInput = getElement(`edit-${targetInputId}`);

                if (targetInput) {
                    targetInput.value = skinBtn.dataset.value;
                    parentContainer.querySelectorAll('.skin-select-btn').forEach(btn => btn.classList.remove('active'));
                    skinBtn.classList.add('active');
                }
            }
        });
    }

    // Auth and modal close buttons
    addListener('login-btn', 'click', () => showAuthModal('login'));
    addListener('login-btn-mobile', 'click', () => showAuthModal('login'));
    addListener('close-auth-modal-btn', 'click', hideAllModals);
    addListener('close-edit-modal-btn', 'click', hideAllModals);
    addListener('close-view-post-modal-btn', 'click', hideAllModals);
    addListener('close-player-settings-modal-btn', 'click', hideAllModals);
    addListener('close-create-post-modal-btn', 'click', hideAllModals);
    addListener('close-fullscreen-chat-modal-btn', 'click', hideAllModals);
    addListener('confirmation-cancel-btn', 'click', hideAllModals);
    addListener('close-post-actions-modal-btn', 'click', hideAllModals);
    addListener('modal-backdrop', 'click', (e) => {
        if (e.target === getElement('modal-backdrop')) {
            hideAllModals();
            const mobileNav = getElement('mobile-nav-menu');
            if (mobileNav.classList.contains('open')) {
                mobileNav.classList.remove('open');
            }
        }
    });

    // Auth form navigation
    addListener('show-register-link', 'click', (e) => { e.preventDefault(); showAuthModal('register'); });
    addListener('show-login-link', 'click', (e) => { e.preventDefault(); showAuthModal('login'); });
    addListener('login-form', 'submit', handleLoginSubmit);
    addListener('forgot-password-link', 'click', handleForgotPassword);

    // Registration form flow
    addListener('register-next-btn', 'click', handleRegistrationNext);
    addListener('register-back-btn', 'click', handleRegistrationBack);
    addListener('register-avatar-btn', 'click', () => getElement('register-avatar-input').click());
    addListener('register-avatar-input', 'change', handleAvatarSelection);
    addListener('register-form', 'submit', handleRegistrationSubmit);

    // User profile dropdown menu
    addListener('user-profile-button', 'click', (e) => {
        e.stopPropagation();
        const navItem = getElement('user-profile-nav-item');
        document.querySelectorAll('.nav-item.open').forEach(item => {
            if (item !== navItem) item.classList.remove('open');
        });
        if(navItem) navItem.classList.toggle('open');
    });
    addListener('user-avatar-mobile', 'click', (e) => {
        e.stopPropagation();
        const navItem = getElement('user-profile-nav-item');
        const dropdown = getElement('player-profile-dropdown');
        const avatar = getElement('user-avatar-mobile');

        if (navItem && dropdown && avatar) {
            const isOpen = navItem.classList.toggle('open');
            if (isOpen) {
                const avatarRect = avatar.getBoundingClientRect();
                dropdown.style.top = `${avatarRect.bottom + 10}px`;
                dropdown.style.right = '1rem';
                dropdown.style.left = 'auto';
                dropdown.style.transform = 'none';
            }
        }
    });

    // Delegated listener for the player profile dropdown actions
    addListener('player-profile-dropdown', 'click', (e) => {
        const createEventBtn = e.target.closest('#admin-create-event-dropdown-btn');
        const createAnnouncementBtn = e.target.closest('#admin-create-announcement-dropdown-btn');
        const editProfileBtn = e.target.closest('#profile-dropdown-edit');
        const friendsBtn = e.target.closest('#profile-dropdown-friends');
        const avatarBtn = e.target.closest('#profile-dropdown-avatar');
        const logoutBtn = e.target.closest('#profile-dropdown-logout');

        // Close the dropdown after any action
        const userProfileNavItem = getElement('user-profile-nav-item');
        if (userProfileNavItem) {
            userProfileNavItem.classList.remove('open');
        }

        if (createEventBtn) {
            showCreatePostModal('event');
        } else if (createAnnouncementBtn) {
            showCreatePostModal('announcement');
        } else if (editProfileBtn) {
            showEditProfileModal();
        } else if (friendsBtn) {
            showPage('page-feed');
        } else if (avatarBtn) {
            getElement('avatar-upload-input').click();
        } else if (logoutBtn) {
            handleLogout();
        }
    });

    // Profile and settings forms
    addListener('avatar-upload-input', 'change', handleAvatarUpload);
    addListener('edit-profile-form', 'submit', handleEditProfileSubmit);
    addListener('player-settings-form', 'submit', handlePlayerSettingsSubmit);

    // Post creation form listeners
    addListener('post-back-btn', 'click', handlePostBack);
    addListener('post-thumbnail-btn', 'click', () => getElement('post-thumbnail-input').click());
    addListener('post-thumbnail-input', 'change', handleThumbnailSelection);
    addListener('create-post-form', 'submit', handlePostSubmit);
    addListener('post-repeat-type', 'change', (e) => {
        const container = getElement('post-repeat-weeks-container');
        if (container) container.classList.toggle('hidden', e.target.value !== 'weekly');
    });

    // Mobile menu listeners
    addListener('open-mobile-menu-btn', 'click', () => {
        getElement('mobile-nav-menu').classList.add('open');
        getElement('modal-backdrop').classList.add('visible');
    });
    addListener('close-mobile-menu-btn', 'click', () => {
        getElement('mobile-nav-menu').classList.remove('open');
        getElement('modal-backdrop').classList.remove('visible');
    });

    // Player/Alliance filter listeners
    addListener('filter-container', 'click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            setState({ activeFilter: e.target.dataset.filter });
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
        }
    });
    addListener('player-search-input', 'input', () => applyPlayerFilters());
    const allianceFilter = getElement('alliance-filter');
    if (allianceFilter) {
        allianceFilter.closest('.custom-select-container').addEventListener('change', () => applyPlayerFilters());
    }

    // Chat channel selection listener
    addListener('chat-selectors', 'click', (e) => {
        const card = e.target.closest('.chat-channel-card'); 
        if (!card) return;
        showFullscreenChatModal({ chatType: card.dataset.chatType });
    });

    // Delegated listeners for message deletion in chat panes
    const socialPage = getElement('page-social');
    if (socialPage) {
        socialPage.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-message-btn');
            const confirmBtn = e.target.closest('.confirm-delete-btn');

            if (confirmBtn) {
                const messageEl = confirmBtn.closest('.chat-message');
                const bubble = messageEl.querySelector('.chat-message-bubble');
                handleDeleteMessage(messageEl.dataset.messageId, bubble.dataset.chatType);
            } else if (deleteBtn) {
                const messageEl = deleteBtn.closest('.chat-message');
                const confirmDeleteBtn = messageEl.querySelector('.confirm-delete-btn');
                deleteBtn.classList.add('hidden');
                confirmDeleteBtn.classList.remove('hidden');
                setTimeout(() => {
                    deleteBtn.classList.remove('hidden');
                    confirmDeleteBtn.classList.add('hidden');
                }, 3000);
            }
        });
    }
    const fullscreenChatModal = getElement('fullscreen-chat-modal-container');
    if (fullscreenChatModal) {
        fullscreenChatModal.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-message-btn');
            const confirmBtn = e.target.closest('.confirm-delete-btn');
            if (confirmBtn) {
                const messageEl = confirmBtn.closest('.chat-message');
                handleDeleteMessage(messageEl.dataset.messageId, 'private_chat');
            } else if (deleteBtn) {
                const messageEl = deleteBtn.closest('.chat-message');
                if (messageEl) {
                    const confirmDeleteBtn = messageEl.querySelector('.confirm-delete-btn');
                    deleteBtn.classList.add('hidden');
                    confirmDeleteBtn.classList.remove('hidden');
                    setTimeout(() => {
                        deleteBtn.classList.remove('hidden');
                        confirmDeleteBtn.classList.add('hidden');
                    }, 3000);
                }
            }
        });
    }
    addListener('collapse-friends-btn', 'click', () => {
        const container = getElement('friends-list-container-social');
        const isCollapsed = container.classList.toggle('collapsed');
        setState({ isFriendsListCollapsed: isCollapsed });
    });

    // Notification dropdown listeners
    const feedDropdown = getElement('feed-dropdown');
    if (feedDropdown) {
        feedDropdown.addEventListener('click', (e) => handleNotificationClick(e));
    }
    const feedActionContainer = getElement('feed-action-container');
    if (feedActionContainer) {
        feedActionContainer.addEventListener('click', (e) => handleNotificationClick(e));
    }

    /**
     * Handles clicks within notification lists (both dropdown and feed page).
     * It determines if an action button was clicked or the item itself and calls the appropriate handler.
     * @param {Event} e The click event object.
     */
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

    // Delegated listener for player cards on the Players page
    addListener('player-list-container', 'click', async (e) => {
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
            if (success) addFriendBtn.disabled = true;
        } else if (messageBtn && currentUserData) {
            const playerCard = messageBtn.closest('.player-card');
            const targetPlayer = allPlayers.find(p => p.uid === playerCard.dataset.uid);
            if (targetPlayer) showFullscreenChatModal({ targetPlayer });
        } else if (settingsBtn) {
            const targetPlayer = allPlayers.find(p => p.uid === settingsBtn.dataset.uid);
            if(targetPlayer) showPlayerSettingsModal(targetPlayer);
        }
    });

    // Delegated listener for the main friends page
    const friendsPage = getElement('sub-page-social-friends');
    if (friendsPage) {
        friendsPage.addEventListener('click', (e) => {
            const { allPlayers } = getState();
            
            const acceptBtn = e.target.closest('.accept-friend-btn');
            const declineBtn = e.target.closest('.decline-friend-btn');
            const cancelBtn = e.target.closest('.cancel-request-btn');
            const removeBtn = e.target.closest('.remove-friend-btn');

            if (acceptBtn) {
                const senderUid = acceptBtn.dataset.uid;
                // We find the original notification to pass its ID
                const { userNotifications } = getState();
                const notification = userNotifications.find(n => n.senderUid === senderUid && n.type === 'friend_request');
                if (notification) {
                    handleNotificationAction(notification.id, 'accept-friend', senderUid);
                }
            } else if (declineBtn) {
                declineFriendRequest(declineBtn.dataset.uid);
            } else if (cancelBtn) {
                cancelFriendRequest(cancelBtn.dataset.uid);
            } else if (removeBtn) {
                const friendUid = removeBtn.dataset.uid;
                const friendData = allPlayers.find(p => p.uid === friendUid);
                if (friendData) {
                    showConfirmationModal(
                        'Remove Friend?',
                        `Are you sure you want to remove ${friendData.username} from your friends list?`,
                        () => removeFriend(friendUid)
                    );
                }
            }
        });
    }


    // Delegated listener for the friends list on the Social page
    const friendsListSocial = getElement('friends-list-social-page');
    if (friendsListSocial) {
        friendsListSocial.addEventListener('click', (e) => {
            const messageBtn = e.target.closest('.message-player-btn');
            if (messageBtn) {
                const { allPlayers } = getState();
                const targetPlayer = allPlayers.find(p => p.uid === messageBtn.dataset.uid);
                if (targetPlayer) showFullscreenChatModal({ targetPlayer });
            }
        });
    }

    // Global click listener to close open menus (dropdowns, custom selects)
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-item')) {
            document.querySelectorAll('.nav-item.open').forEach(item => item.classList.remove('open'));
        }
        if (!e.target.closest('.custom-select-container')) {
            document.querySelectorAll('.custom-select-container').forEach(c => c.classList.remove('open'));
        }
        const picker = getElement('reaction-picker-container');
        if (picker && picker.style.display === 'flex' && !e.target.closest('.chat-message-bubble') && !e.target.closest('#reaction-picker-container')) {
            picker.style.display = 'none';
        }
    });

    // Delegated listener for post cards on the News page
    addListener('page-news', 'click', e => {
        const actionsBtn = e.target.closest('.post-card-actions-trigger');
        const postCard = e.target.closest('.post-card');

        if (actionsBtn) {
            e.stopPropagation();
            showPostActionsModal(actionsBtn.dataset.postId);
        } else if (postCard) {
            const { allPosts } = getState();
            const post = allPosts.find(p => p.id === postCard.dataset.postId);
            if (post) {
                showViewPostModal(post);
            }
        }
    });

    // Chat attachment listeners
    addListener('fullscreen-chat-attach-btn', 'click', () => {
        const attachInput = getElement('private-message-attach-input');
        if (attachInput) attachInput.click();
    });
    addListener('private-message-attach-input', 'change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageAttachment(file);
    });

    // Emoji and reaction picker listeners
    const emojiPickerContainer = getElement('emoji-picker-container');
    const emojiPicker = document.querySelector('emoji-picker');

    setupEmojiButton('fullscreen-chat-emoji-btn', 'fullscreen-chat-input');

    if (emojiPicker) {
        emojiPicker.addEventListener('emoji-click', event => {
            const { activeEmojiInput } = getState();
            if (activeEmojiInput) activeEmojiInput.value += event.detail.unicode;
            const emojiPickerContainer = getElement('emoji-picker-container');
            if (emojiPickerContainer) emojiPickerContainer.classList.remove('visible');
        });
    }
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
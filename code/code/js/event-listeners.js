// code/js/event-listeners.js

import { auth } from './firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getState, updateState } from './state.js';
import { showPage, hideAllModals, showAuthModal, showEditProfileModal, showCreatePostModal, showConfirmationModal, showPostActionsModal, showPrivateMessageModal, showPlayerSettingsModal, handleSubNavClick, toggleSubNav, showViewPostModal } from './ui/ui-manager.js';
import { handleLoginSubmit, handleForgotPassword, handleRegistrationNext, handleRegistrationBack, handleAvatarSelection, handleRegistrationSubmit, handleEditProfileSubmit, handleAvatarUpload } from './ui/auth-ui.js';
import { handlePlayerSettingsSubmit } from './ui/player-settings-ui.js';
import { handlePostNext, handlePostBack, handleThumbnailSelection, handlePostSubmit, renderPosts } from './ui/post-ui.js';
import { applyPlayerFilters } from './ui/players-ui.js';
import { handleSendMessage, handleDeleteMessage, handleNotificationAction, addFriend, removeFriend, sendPrivateMessage, setupChatListeners, toggleReaction } from './firestore.js';
import { activateChatChannel } from './ui/social-ui.js';
import { positionEmojiPicker } from './utils.js';

export function initializeAllEventListeners() {
    const getElement = (id) => document.getElementById(id);

    const addListener = (id, event, handler) => {
        const element = getElement(id);
        if (element) {
            element.addEventListener(event, handler);
        }
    };

    // --- Main Navigation & Page Switching ---
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const mainTarget = link.dataset.mainTarget;
            const navItem = link.closest('.nav-item');
            const submenuId = navItem.dataset.submenuId || null;

            showPage(mainTarget);
            toggleSubNav(submenuId);

            document.querySelectorAll('#main-nav .nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- Sub Navigation ---
    document.querySelectorAll('.sub-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); 
            const subTarget = link.dataset.subTarget;
            
            if (subTarget) {
                const parentSubNav = link.closest('.sub-nav');
                const parentNavItem = link.closest('.nav-item');

                // Update active state within this sub-menu
                if (parentSubNav) {
                    parentSubNav.querySelectorAll('.sub-nav-link').forEach(l => l.classList.remove('active'));
                }
                link.classList.add('active');
                
                // Handle the content switch
                handleSubNavClick(subTarget);

                // Close the parent pop-out menu after selection
                if (parentNavItem) {
                    parentNavItem.classList.remove('open');
                }
            }
        });
    });
    // --- Mobile Avatar Click to Edit Profile ---
    addListener('mobile-auth-container', 'click', () => {
        showEditProfileModal();
    });
    addListener('user-avatar-mobile' , 'click', () => {
        showEditProfileModal();
    });
    // --- Edit Profile Modal Tabs and Skin Selectors ---
    const editProfileModal = getElement('edit-profile-modal-container');
    if (editProfileModal) {
        editProfileModal.addEventListener('click', (e) => {
            // Tab switching logic
            const tabBtn = e.target.closest('.modal-tab-btn');
            if (tabBtn) {
                e.preventDefault();
                const tabName = tabBtn.dataset.tab;
                
                // Update button active state
                editProfileModal.querySelectorAll('.modal-tab-btn').forEach(btn => btn.classList.remove('active'));
                tabBtn.classList.add('active');

                // Update pane visibility
                editProfileModal.querySelectorAll('.modal-tab-pane').forEach(pane => {
                    pane.classList.toggle('active', pane.id === `edit-profile-tab-${tabName}`);
                });
            }
            
            // Skin/Border selection logic
            const skinBtn = e.target.closest('.skin-select-btn');
            if (skinBtn) {
                e.preventDefault();
                const parentContainer = skinBtn.parentElement;
                const targetInputId = parentContainer.id.replace('-selector', '');
                const targetInput = getElement(`edit-${targetInputId}`);
                
                // Update hidden input and button active state
                if (targetInput) {
                    targetInput.value = skinBtn.dataset.value;
                    parentContainer.querySelectorAll('.skin-select-btn').forEach(btn => btn.classList.remove('active'));
                    skinBtn.classList.add('active');
                }
            }
        });
    }
    // --- Modal Triggers & Closers ---
    addListener('login-btn', 'click', () => showAuthModal('login'));
    addListener('close-auth-modal-btn', 'click', hideAllModals);
    addListener('close-edit-modal-btn', 'click', hideAllModals);
    addListener('close-player-settings-modal-btn', 'click', hideAllModals);
    addListener('close-create-post-modal-btn', 'click', hideAllModals);
    addListener('close-private-message-modal-btn', 'click', hideAllModals);
    addListener('confirmation-cancel-btn', 'click', hideAllModals);
    addListener('close-post-actions-modal-btn', 'click', hideAllModals);
    addListener('modal-backdrop', 'click', (e) => {
        if (e.target === getElement('modal-backdrop')) {
            hideAllModals();
            const mobileNav = getElement('mobile-nav-menu');
            if (mobileNav.classList.contains('open')) {
                mobileNav.classList.remove('open');
                // Change icon back to 'bars'
                const icon = getElement('open-mobile-menu-btn').querySelector('i');
            }
        }
    });

    // --- Auth Forms ---
    addListener('show-register-link', 'click', (e) => { e.preventDefault(); showAuthModal('register'); });
    addListener('show-login-link', 'click', (e) => { e.preventDefault(); showAuthModal('login'); });
    addListener('login-form', 'submit', handleLoginSubmit);
    addListener('forgot-password-link', 'click', handleForgotPassword);
    
    // --- Registration Stepper ---
    addListener('register-next-btn', 'click', handleRegistrationNext);
    addListener('register-back-btn', 'click', handleRegistrationBack);
    addListener('register-avatar-btn', 'click', () => getElement('register-avatar-input').click());
    addListener('register-avatar-input', 'change', handleAvatarSelection);
    addListener('register-form', 'submit', handleRegistrationSubmit);

    // --- User Profile & Actions ---
    addListener('user-profile-button', 'click', (e) => {
        e.stopPropagation();
        const navItem = getElement('user-profile-nav-item');
        document.querySelectorAll('.nav-item.open').forEach(item => {
            if (item !== navItem) item.classList.remove('open');
        });
        if(navItem) navItem.classList.toggle('open');
    });

    // --- Mobile Avatar Dropdown Listener ---
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
    addListener('profile-dropdown-logout', 'click', () => signOut(auth));
    addListener('profile-dropdown-edit', 'click', () => {
        getElement('user-profile-nav-item').classList.remove('open');
        showEditProfileModal();
    });
    addListener('profile-dropdown-friends', 'click', () => {
        getElement('user-profile-nav-item').classList.remove('open');
        showPage('page-feed');
    });
    addListener('profile-dropdown-avatar', 'click', () => getElement('avatar-upload-input').click());
    addListener('avatar-upload-input', 'change', handleAvatarUpload);
    addListener('edit-profile-form', 'submit', handleEditProfileSubmit);

    // --- Player Settings ---
    addListener('player-settings-form', 'submit', handlePlayerSettingsSubmit);

    // --- Post Creation/Editing ---
    addListener('post-next-btn', 'click', handlePostNext);
    addListener('post-back-btn', 'click', handlePostBack);
    addListener('post-thumbnail-btn', 'click', () => getElement('post-thumbnail-input').click());
    addListener('post-thumbnail-input', 'change', handleThumbnailSelection);
    addListener('create-post-form', 'submit', handlePostSubmit);
    addListener('post-repeat-type', 'change', (e) => {
        const container = getElement('post-repeat-weeks-container');
        if (container) container.classList.toggle('hidden', e.target.value !== 'weekly');
    });
    
    // --- Mobile Navigation ---
    addListener('open-mobile-menu-btn', 'click', () => {
        getElement('mobile-nav-menu').classList.add('open');
        getElement('modal-backdrop').classList.add('visible');
        // Change icon to 'X'
        const icon = getElement('open-mobile-menu-btn').querySelector('i');
    });

    addListener('close-mobile-menu-btn', 'click', () => {
        getElement('mobile-nav-menu').classList.remove('open');
        getElement('modal-backdrop').classList.remove('visible');
        // Change icon back to 'bars'
        const icon = getElement('open-mobile-menu-btn').querySelector('i');
    });

    // --- Filtering ---
    addListener('filter-container', 'click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            updateState({ activeFilter: e.target.dataset.filter });
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderPosts();
        }
    });
    addListener('player-search-input', 'input', () => applyPlayerFilters());
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
                alert("Error: Could not send message.");
                input.value = text;
            }
        });
    }

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
            } else if (bubble) {
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
    addListener('collapse-friends-btn', 'click', () => {
        const container = getElement('friends-list-container-social');
        const isCollapsed = container.classList.toggle('collapsed');
        updateState({ isFriendsListCollapsed: isCollapsed });
    });

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
// Add this new listener inside initializeAllEventListeners()

addListener('player-profile-dropdown', 'click', (e) => {
    const createEventBtn = e.target.closest('#admin-create-event-dropdown-btn');
    const createAnnouncementBtn = e.target.closest('#admin-create-announcement-dropdown-btn');

    if (createEventBtn) {
        getElement('user-profile-nav-item').classList.remove('open');
        showCreatePostModal('event');
    } else if (createAnnouncementBtn) {
        getElement('user-profile-nav-item').classList.remove('open');
        showCreatePostModal('announcement');
    }
});
    // --- General UI ---
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

    // --- Event/Announcement Creation Triggers ---
    addListener('page-news', 'click', e => {
        const createAnnouncementBtn = e.target.closest('#create-announcement-btn');
        const createEventBtn = e.target.closest('#create-event-btn');
        const actionsBtn = e.target.closest('.post-card-actions-trigger');
        const announcementCard = e.target.closest('.announcement-card');

        if (createAnnouncementBtn) {
            showCreatePostModal('announcement');
        } else if (createEventBtn) {
            showCreatePostModal('event');
        } else if (actionsBtn) {
            // Prevent card click from firing when clicking the options button
            e.stopPropagation(); 
            showPostActionsModal(actionsBtn.dataset.postId);
        } else if (announcementCard) {
            // This is the logic that opens the modal
            const { allPosts } = getState();
            const post = allPosts.find(p => p.id === announcementCard.dataset.postId);
            if (post) {
                showViewPostModal(post);
            }
        }
    });

    // --- Attachment and Emoji Logic ---
    addListener('private-message-attach-btn', 'click', () => {
        const attachInput = getElement('private-message-attach-input');
        if (attachInput) attachInput.click();
    });
    addListener('private-message-attach-input', 'change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageAttachment(file);
    });

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
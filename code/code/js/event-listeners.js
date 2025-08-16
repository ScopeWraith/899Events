// code/js/event-listeners.js

import { auth } from './firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getState, setState } from './state.js';
import {
    setupEmojiButton, showPage, hideAllModals, showAuthModal, showEditProfileModal,
    showCreatePostModal, showPostActionsModal, showFullscreenChatModal, showPlayerSettingsModal,
    handleSubNavClick, toggleSubNav, showViewPostModal, showBorderEditorModal
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
    removeFriend, toggleReaction, togglePostReaction, handleImageAttachment, handleFullscreenMessageSend
} from './firestore.js';
import {
    showEditAllianceModal, handleAllianceAvatarSelection, handleAllianceEditSubmit,
    showRegisterAllianceModal, handleAllianceRegisterSubmit
} from './ui/alliances-ui.js';
import { applyCustomBorderStyle } from './utils.js';

/**
 * ===================================================================================
 * REVAMPED BORDER PREVIEW UPDATER
 * ===================================================================================
 * This function now correctly handles the complex, multi-layered style object
 * from the revamped `applyCustomBorderStyle` function.
 */
// This function now reads all controls and updates the UI in real-time
const getElement = (id) => document.getElementById(id);
export function updateBorderEditorPreview() {
    const controls = getElement('border-editor-controls');
    if (!controls) return;

    const css = { layers: {} };

    controls.querySelectorAll('.layer-controls').forEach(item => {
        const layerIndex = item.dataset.layer;
        const isEnabled = (layerIndex === '1') || item.querySelector('.layer-enable-toggle')?.checked;
        const content = item.querySelector('.layer-control-content');
        if (content) {
            content.style.opacity = isEnabled ? '1' : '0.4';
            content.style.pointerEvents = isEnabled ? 'auto' : 'none';
        }

        const layerData = {
            enabled: isEnabled,
            thickness: item.querySelector('.control-thickness').value,
            color: item.querySelector('.control-color').value,
            opacity: item.querySelector('.control-opacity').value,
            innerGlow: { enabled: false },
            outerGlow: { enabled: false }
        };

        item.querySelectorAll('.glow-controls-group').forEach(glowGroup => {
            const glowType = glowGroup.querySelector('.glow-enable-toggle').dataset.glowType;
            const glowEnabled = glowGroup.querySelector('.glow-enable-toggle').checked;
            const glowContent = glowGroup.querySelector('.glow-content');
            
            glowContent.classList.toggle('hidden', !glowEnabled);
            
            if (glowEnabled) {
                layerData[`${glowType}Glow`] = {
                    enabled: true,
                    reverse: glowContent.querySelector('.glow-reverse-toggle').checked,
                    color: glowContent.querySelector('.glow-color').value,
                    opacity: glowContent.querySelector('.glow-opacity').value,
                    blur: glowContent.querySelector('.glow-blur').value,
                    spread: glowContent.querySelector('.glow-spread').value
                };
                glowContent.querySelector('.glow-opacity + .value-display').textContent = parseFloat(layerData[`${glowType}Glow`].opacity).toFixed(2);
                glowContent.querySelector('.glow-blur + .value-display').textContent = layerData[`${glowType}Glow`].blur + 'px';
                glowContent.querySelector('.glow-spread + .value-display').textContent = layerData[`${glowType}Glow`].spread + 'px';
            }
        });

        css.layers[layerIndex] = layerData;
        item.querySelector('.control-thickness + .value-display').textContent = layerData.thickness + 'px';
        item.querySelector('.control-opacity + .value-display').textContent = parseFloat(layerData.opacity).toFixed(2);
    });

    const styles = applyCustomBorderStyle(css);
    const previewContainer = getElement('border-editor-live-preview');
    if (previewContainer) {
        for (let i = 1; i <= 3; i++) {
            const layerElement = previewContainer.querySelector(`.border-layer[data-layer-id="${i}"]`);
            const layerStyle = styles[`layer${i}`];
            if (layerElement && layerStyle) {
                layerElement.style.cssText = '';
                Object.assign(layerElement.style, layerStyle);
            }
        }
    }
}

// Add this setup inside your `initializeAllEventListeners` function
const borderEditorControls = getElement('border-editor-controls');
if (borderEditorControls) {
    // A single listener for all real-time updates
    borderEditorControls.addEventListener('input', updateBorderEditorPreview);
    borderEditorControls.addEventListener('change', updateBorderEditorPreview); // For checkboxes and selects

    // Listener for accordion and color enable toggles
    borderEditorControls.addEventListener('click', (e) => {
        // Accordion functionality
        const header = e.target.closest('.editor-accordion-header');
        if (header) {
            header.parentElement.classList.toggle('open');
        }
        // Link color checkbox to its input
        const colorCheckbox = e.target.closest('.control-color-enable');
        if (colorCheckbox) {
            const colorIndex = colorCheckbox.dataset.colorIndex;
            const colorInput = colorCheckbox.closest('.control-group').querySelector(`.control-color[data-color-index="${colorIndex}"]`);
            if (colorInput) {
                colorInput.disabled = !colorCheckbox.checked;
            }
        }
    });
}

export function initializeAllEventListeners() {
    const addListener = (id, event, handler) => {
        const element = getElement(id);
        if (element) {
            element.addEventListener(event, handler);
        }
    };

    // --- BORDER EDITOR EVENT LISTENERS (TAB LAYOUT) ---
    const borderEditorControls = getElement('border-editor-controls');
    if (borderEditorControls) {
        // Listen for any input change in the entire controls area
        borderEditorControls.addEventListener('input', updateBorderEditorPreview);
        borderEditorControls.addEventListener('change', updateBorderEditorPreview);

        // Tab Switching Logic
        const tabs = borderEditorControls.querySelectorAll('.editor-tab-btn');
        const panes = borderEditorControls.querySelectorAll('.editor-tab-pane');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                panes.forEach(pane => {
                    pane.classList.toggle('active', pane.id === `editor-tab-pane-${tab.dataset.tab}`);
                });
            });
        });

        // Initial preview render when the modal is first opened.
        updateBorderEditorPreview();
    }
    
    addListener('close-border-editor-modal-btn', 'click', hideAllModals);

    // --- (The rest of your original event listeners) ---
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

    addListener('close-access-denied-modal-btn', 'click', hideAllModals);
    addListener('access-denied-login-btn', 'click', () => {
        hideAllModals();
        showAuthModal('login');
    });
    addListener('close-register-alliance-modal-btn', 'click', hideAllModals);
    addListener('register-alliance-form', 'submit', handleAllianceRegisterSubmit);
    addListener('close-edit-alliance-modal-btn', 'click', hideAllModals);
    addListener('edit-alliance-avatar-btn', 'click', () => getElement('edit-alliance-avatar-input').click());
    addListener('edit-alliance-avatar-input', 'change', handleAllianceAvatarSelection);
    addListener('edit-alliance-form', 'submit', handleAllianceEditSubmit);
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
    addListener('view-post-modal-container', 'click', (e) => {
    const reactionBtn = e.target.closest('.post-reaction-btn');
    if (reactionBtn) {
        const { actionPostId } = getState();
        const reactionType = reactionBtn.dataset.reaction;
        togglePostReaction(actionPostId, reactionType);
    }
    });
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
    addListener('mobile-auth-container', 'click', () => {
        showEditProfileModal();
    });
    addListener('user-avatar-mobile' , 'click', () => {
        showEditProfileModal();
    });
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
    addListener('show-register-link', 'click', (e) => { e.preventDefault(); showAuthModal('register'); });
    addListener('show-login-link', 'click', (e) => { e.preventDefault(); showAuthModal('login'); });
    addListener('login-form', 'submit', handleLoginSubmit);
    addListener('forgot-password-link', 'click', handleForgotPassword);
    addListener('register-next-btn', 'click', handleRegistrationNext);
    addListener('register-back-btn', 'click', handleRegistrationBack);
    addListener('register-avatar-btn', 'click', () => getElement('register-avatar-input').click());
    addListener('register-avatar-input', 'change', handleAvatarSelection);
    addListener('register-form', 'submit', handleRegistrationSubmit);
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

    // Consolidated event listener for the player profile dropdown
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

    addListener('avatar-upload-input', 'change', handleAvatarUpload);
    addListener('edit-profile-form', 'submit', handleEditProfileSubmit);
    addListener('player-settings-form', 'submit', handlePlayerSettingsSubmit);
    addListener('post-back-btn', 'click', handlePostBack);
    addListener('post-thumbnail-btn', 'click', () => getElement('post-thumbnail-input').click());
    addListener('post-thumbnail-input', 'change', handleThumbnailSelection);
    addListener('create-post-form', 'submit', handlePostSubmit);
    addListener('post-repeat-type', 'change', (e) => {
        const container = getElement('post-repeat-weeks-container');
        if (container) container.classList.toggle('hidden', e.target.value !== 'weekly');
    });
    addListener('open-mobile-menu-btn', 'click', () => {
        getElement('mobile-nav-menu').classList.add('open');
        getElement('modal-backdrop').classList.add('visible');
    });
    addListener('close-mobile-menu-btn', 'click', () => {
        getElement('mobile-nav-menu').classList.remove('open');
        getElement('modal-backdrop').classList.remove('visible');
    });
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
    addListener('chat-selectors', 'click', (e) => {
        const btn = e.target.closest('.chat-selector-btn');
        if (!btn) return;

        document.querySelectorAll('.chat-selector-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        showFullscreenChatModal({ chatType: btn.dataset.chatType });
    });

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
    addListener('fullscreen-chat-attach-btn', 'click', () => {
        const attachInput = getElement('private-message-attach-input');
        if (attachInput) attachInput.click();
    });
    addListener('private-message-attach-input', 'change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageAttachment(file);
    });

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
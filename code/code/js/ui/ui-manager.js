// code/js/ui/ui-manager.js

import { getState, setState } from '../state.js';
import { ALLIANCES, ALLIANCE_RANKS, ALLIANCE_ROLES, DAYS_OF_WEEK, HOURS_OF_DAY, REPEAT_TYPES, ANNOUNCEMENT_EXPIRATION_DAYS, POST_STYLES, POST_TYPES, CHAT_CHANNELS } from '../constants.js';
import { populateEditForm, handleLogout } from './auth-ui.js';
import { populatePlayerSettingsForm } from './player-settings-ui.js';
import { setupPrivateChatListener, setupChatListeners } from '../firestore.js';
import { db } from '../firebase-config.js';
import { doc, deleteDoc, setDoc, getDocs, updateDoc, collection, where, query, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { initializePostStepper, populatePostFormForEdit, renderNews } from './post-ui.js';
import { renderChatChannels, renderConversations, renderFriendsPage } from './social-ui.js';
import { applyPlayerFilters } from './players-ui.js';
import { renderAlliances } from './alliances-ui.js';
import { formatTimeAgo, autoLinkText } from '../utils.js';

/**
 * A helper function to get a DOM element by its ID.
 * @param {string} id The ID of the element to retrieve.
 * @returns {HTMLElement|null} The DOM element or null if not found.
 */
const getElement = (id) => document.getElementById(id);

/**
 * A helper function to query for a single DOM element using a CSS selector.
 * @param {string} selector The CSS selector.
 * @returns {HTMLElement|null} The first matching DOM element or null.
 */
const querySelector = (selector) => document.querySelector(selector);
/**
 * A helper function to query for all DOM elements matching a CSS selector.
 * @param {string} selector The CSS selector.
 * @returns {NodeListOf<HTMLElement>} A NodeList of matching elements.
 */
const querySelectorAll = (selector) => document.querySelectorAll(selector);

/**
 * An object to store the counts for social notification badges.
 * @type {{convoCount: number, friendRequestCount: number}}
 */
let socialBadges = { convoCount: 0, friendRequestCount: 0 };

/**
 * Displays the access denied modal, typically for features requiring login.
 */
export function showAccessDeniedModal() {
    hideAllModals();
    showModal(getElement('access-denied-modal-container'));
}

/**
 * Updates the notification badges on the social sub-navigation tabs.
 * @param {object} counts An object containing the counts for different notification types.
 * @param {number} [counts.convoCount] The number of unread private messages.
 * @param {number} [counts.friendRequestCount] The number of pending friend requests.
 */
export function updateSocialNavBadges({ convoCount, friendRequestCount }) {
    if (convoCount !== undefined) socialBadges.convoCount = convoCount;
    if (friendRequestCount !== undefined) socialBadges.friendRequestCount = friendRequestCount;

    const convoBadge = document.querySelector('.sub-nav-link[data-sub-target="social-convo"] .badge');
    if (convoBadge) {
        convoBadge.textContent = socialBadges.convoCount;
        convoBadge.classList.toggle('hidden', socialBadges.convoCount === 0);
    }

    const friendsBadge = document.querySelector('.sub-nav-link[data-sub-target="social-friends"] .badge');
    if (friendsBadge) {
        friendsBadge.textContent = socialBadges.friendRequestCount;
        friendsBadge.classList.toggle('hidden', socialBadges.friendRequestCount === 0);
    }
}

/**
 * Handles clicks on sub-navigation links, showing the correct sub-page and triggering content rendering.
 * @param {string} subTargetId The `data-sub-target` value of the clicked link.
 */
export function handleSubNavClick(subTargetId) {
    localStorage.setItem('lastActiveSubPage', subTargetId);
    querySelectorAll('.sub-nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.subTarget === subTargetId);
    });
    const activePage = querySelector('.page-content[style*="display: block"]');
    if (activePage) {
        activePage.querySelectorAll('.sub-page').forEach(page => {
            page.style.display = 'none';
        });
    }
    const targetSubPage = getElement(`sub-page-${subTargetId}`);
    if (targetSubPage) {
        targetSubPage.style.display = 'block';
    }

    // --- FIX: Re-introduce render calls on sub-nav click ---
    switch (subTargetId) {
        case 'news-all':
        case 'news-events':
        case 'news-announcements':
            const [, filter] = subTargetId.split('-');
            renderNews(filter, getState());
            break;
        case 'social-chat':
            renderChatChannels(getState().currentUserData);
            break;
        case 'social-convo':
            renderConversations();
            break;
        case 'social-friends':
            const { userFriends, allPlayers } = getState();
            renderFriendsPage(userFriends, allPlayers);
            break;
        case 'server-players':
            applyPlayerFilters();
            break;
        case 'server-alliances':
            renderAlliances(getState());
            break;
    }
}

/**
 * Displays the modal for viewing a single post's full details.
 * @param {object} post The data object for the post to view.
 */
export function showViewPostModal(post) {
    if (!post) return;
    const { allPlayers, currentUserData } = getState();
    setState({ actionPostId: post.id });
    const author = allPlayers.find(p => p.uid === post.authorUid);
    const authorSection = getElement('view-post-author-section');
    if (author) {
        authorSection.style.display = 'flex';
        getElement('view-post-author-avatar').src = author.avatarUrl || `https://placehold.co/64x64/161B22/FFFFFF?text=${author.username.charAt(0).toUpperCase()}`;
        getElement('view-post-author-username').textContent = author.username;
        const timestampText = post.createdAt ? formatTimeAgo(post.createdAt.toDate()) : '';
        getElement('view-post-author-meta').textContent = `Posted ${timestampText}`;
    } else {
        authorSection.style.display = 'none';
    }
    const categoryStyle = POST_STYLES[post.subType] || {};
    const postTypeKey = Object.keys(POST_TYPES).find(key => POST_TYPES[key].subType === post.subType && POST_TYPES[key].mainType === post.mainType);
    const categoryInfo = POST_TYPES[postTypeKey] || {};
    const categoryEl = getElement('view-post-category');
    categoryEl.textContent = categoryInfo.text || 'Post';
    categoryEl.style.backgroundColor = categoryStyle.color || 'var(--color-primary)';
    getElement('view-post-title').textContent = post.title;
    const thumbnailSection = getElement('view-post-thumbnail-section');
    if (post.thumbnailUrl) {
        thumbnailSection.style.display = 'block';
        getElement('view-post-thumbnail').src = post.thumbnailUrl;
    } else {
        thumbnailSection.style.display = 'none';
    }
    getElement('view-post-details').innerHTML = autoLinkText(post.details).replace(/\n/g, '<br />');
    const likeBtn = document.querySelector('.post-reaction-btn[data-reaction="like"]');
    const heartBtn = document.querySelector('.post-reaction-btn[data-reaction="heart"]');
    likeBtn.querySelector('.reaction-count').textContent = post.likes || 0;
    heartBtn.querySelector('.reaction-count').textContent = post.hearts || 0;
    if (currentUserData) {
        likeBtn.classList.toggle('reacted', post.likedBy && post.likedBy.includes(currentUserData.uid));
        heartBtn.classList.toggle('reacted', post.heartedBy && post.heartedBy.includes(currentUserData.uid));
    }
    hideAllModals();
    showModal(getElement('view-post-modal-container'));
}

/**
 * Shows or hides the sub-navigation bar based on the active main navigation item.
 * @param {string|null} activeSubmenuId The ID of the sub-menu to display, or null to hide all.
 */
export function toggleSubNav(activeSubmenuId) {
    const subNavContainer = document.getElementById('sub-nav-container');
    if (!subNavContainer) return;
    subNavContainer.querySelectorAll('.sub-nav-content').forEach(content => {
        content.classList.add('hidden');
    });
    if (activeSubmenuId) {
        const activeContent = document.getElementById(activeSubmenuId);
        if (activeContent) {
            activeContent.classList.remove('hidden');
            subNavContainer.classList.add('open');
        }
    } else {
        subNavContainer.classList.remove('open');
    }
}

/**
 * Displays a specific main content page and hides others.
 * @param {string} targetId The ID of the page-content element to show.
 */
export function showPage(targetId) {
    querySelectorAll('.page-content').forEach(page => {
        page.style.display = page.id === targetId ? 'block' : 'none';
    });

    // Don't set localStorage if we are just restoring the view
    const isRestoring = (new Error()).stack.includes('restoreLastViewedPage');
    if (!isRestoring) {
        localStorage.setItem('lastActivePage', targetId);
        // When a user clicks a main nav link, we should clear the last sub-page
        // to ensure the correct default is selected.
        localStorage.removeItem('lastActiveSubPage');
    }

    const mobileTitleEl = getElement('mobile-page-title');
    const activeNavLink = querySelector(`#main-nav .nav-link[data-main-target="${targetId}"]`);
    if (mobileTitleEl && activeNavLink) {
        const titleText = activeNavLink.querySelector('span').textContent;
        mobileTitleEl.textContent = titleText;
    }
    
    if (!isRestoring) {
        let defaultSubTarget;
        switch (targetId) {
            case 'page-social': defaultSubTarget = 'social-chat'; break;
            case 'page-server': defaultSubTarget = 'server-alliances'; break;
            case 'page-news':
            default:
                defaultSubTarget = 'news-all'; break;
        }
        if (defaultSubTarget) {
            handleSubNavClick(defaultSubTarget);
        }
    }
}

/**
 * Makes a specific modal container visible.
 * @param {HTMLElement} modal The modal container element to show.
 */
export function showModal(modal) {
    getElement('modal-backdrop').classList.add('visible');
    modal.classList.add('visible');
}

/**
 * Hides all modal containers and the backdrop.
 * Also clears any modal-specific state and listeners.
 */
export function hideAllModals() {
    getElement('modal-backdrop').classList.remove('visible');
    querySelectorAll('.modal-container').forEach(modal => modal.classList.remove('visible'));
    const emojiPickerContainer = getElement('emoji-picker-container');
    if (emojiPickerContainer) emojiPickerContainer.classList.remove('visible');
    setState({
        activePlayerSettingsUID: null, editingPostId: null, actionPostId: null,
        activePrivateChatId: null, activePrivateChatPartner: null
    });
    const { listeners } = getState();
    if (listeners && listeners.privateChat) listeners.privateChat();
}

/**
 * Shows the main authentication modal, with either the login or registration form active.
 * @param {('login'|'register')} formToShow The form to display initially.
 */
export function showAuthModal(formToShow) {
    hideAllModals();
    showModal(getElement('auth-modal-container'));
    querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    if (formToShow === 'register') {
        getElement('register-form-container').classList.add('active');
    } else {
        getElement('login-form-container').classList.add('active');
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            getElement('login-email').value = rememberedEmail;
            getElement('remember-email-checkbox').checked = true;
        }
    }
}

/**
 * Displays the "Edit Profile" modal and populates it with the current user's data.
 */
export function showEditProfileModal() {
    hideAllModals();
    showModal(getElement('edit-profile-modal-container'));
    populateEditForm();
}

/**
 * Displays the modal for editing another player's settings (e.g., rank, role).
 * @param {object} player The data object for the player whose settings are to be edited.
 */
export function showPlayerSettingsModal(player) {
    setState({ activePlayerSettingsUID: player.uid });
    hideAllModals();
    showModal(getElement('player-settings-modal-container'));
    populatePlayerSettingsForm(player);
}

/**
 * Displays the modal for creating a new post (event or announcement).
 * @param {('event'|'announcement')} mainType The main type of post to create.
 */
export function showCreatePostModal(mainType) {
    setState({ editingPostId: null });
    getElement('create-post-form').reset();
    getElement('post-nav-container').style.display = 'flex';
    hideAllModals();
    showModal(getElement('create-post-modal-container'));
    initializePostStepper(mainType);
    getElement('post-content-header').textContent = 'Create New Post';
    getElement('post-submit-btn').innerHTML = '<i class="fas fa-check-circle mr-2"></i>Create Post';
}

/**
 * Displays a generic confirmation modal.
 * @param {string} title The title for the confirmation dialog.
 * @param {string} message The confirmation message/question.
 * @param {Function} onConfirm A callback function to execute if the user confirms.
 */
export function showConfirmationModal(title, message, onConfirm) {
    const confirmationModal = getElement('confirmation-modal-container');
    if (!confirmationModal) return;
    getElement('confirmation-title').textContent = title;
    getElement('confirmation-message').textContent = message;
    const confirmBtn = getElement('confirmation-confirm-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => {
        onConfirm();
        hideAllModals();
    });
    showModal(confirmationModal);
}

/**
 * Displays a modal with actions for a specific post (Edit, Delete).
 * @param {string} postId The ID of the post to show actions for.
 */
export function showPostActionsModal(postId) {
    const editBtn = document.getElementById('modal-edit-post-btn');
    const deleteBtn = document.getElementById('modal-delete-post-btn');
    const newEditBtn = editBtn.cloneNode(true);
    const newDeleteBtn = deleteBtn.cloneNode(true);
    editBtn.parentNode.replaceChild(newEditBtn, editBtn);
    deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
    newEditBtn.addEventListener('click', () => {
        hideAllModals();
        populatePostFormForEdit(postId);
    });
    newDeleteBtn.addEventListener('click', () => {
        const { allPosts } = getState();
        const postToDelete = allPosts.find(p => p.id === postId);
        if (postToDelete) {
            hideAllModals();
            showConfirmationModal('Delete Post?', `Are you sure you want to delete "${postToDelete.title}"? This action cannot be undone.`,
                async () => { await deleteDoc(doc(db, 'posts', postId)); }
            );
        }
    });
    hideAllModals();
    showModal(document.getElementById('post-actions-modal-container'));
}

/**
 * Displays the fullscreen chat modal for either a private message or a public channel.
 * @param {object} options Configuration options for the chat modal.
 * @param {object|null} [options.targetPlayer=null] The player object for a private chat.
 * @param {string|null} [options.chatType=null] The ID of the public chat channel.
 */
export async function showFullscreenChatModal({ targetPlayer = null, chatType = null }) {
    const { currentUserData, userSessions } = getState();
    if (!currentUserData) return;

    const header = document.getElementById('fullscreen-chat-header');
    const iconContainer = document.getElementById('chat-header-icon-container');
    const titleEl = document.getElementById('chat-header-title');
    const subtitleEl = document.getElementById('chat-header-subtitle');
    
    // Clear previous content and listeners
    iconContainer.innerHTML = '';
    document.getElementById('fullscreen-chat-window').innerHTML = '';
    const { listeners } = getState();
    if (listeners) {
        if (listeners.privateChat) listeners.privateChat();
        if (listeners.worldChat) listeners.worldChat();
        if (listeners.allianceChat) listeners.allianceChat();
        if (listeners.leadershipChat) listeners.leadershipChat();
    }

    if (targetPlayer) {
        // --- Handle private chat header ---
        const chatId = [currentUserData.uid, targetPlayer.uid].sort().join('_');
        await setDoc(doc(db, 'private_chats', chatId), { participants: [currentUserData.uid, targetPlayer.uid] }, { merge: true });
        
        // Mark messages as read
        const messagesQuery = query(collection(db, `private_chats/${chatId}/messages`), where('authorUid', '!=', currentUserData.uid), where('isRead', '==', false));
        const unreadMessages = await getDocs(messagesQuery);
        if (!unreadMessages.empty) {
            const batch = writeBatch(db);
            unreadMessages.docs.forEach(messageDoc => batch.update(messageDoc.ref, { isRead: true }));
            await batch.commit();
        }

        setState({ activePrivateChatPartner: targetPlayer, activePrivateChatId: chatId });
        
        const session = userSessions ? userSessions[targetPlayer.uid] : null;
        const status = session ? session.status : 'offline';
        const statusColor = status === 'online' ? '#238636' : (status === 'away' ? '#d29922' : '#6e7681');
        const avatarUrl = targetPlayer.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${targetPlayer.username.charAt(0).toUpperCase()}`;

        header.style.setProperty('--channel-color', '#A9B1BD'); // Neutral color for PMs
        iconContainer.innerHTML = `<img src="${avatarUrl}" alt="${targetPlayer.username}" class="chat-header-avatar">`;
        titleEl.textContent = targetPlayer.username;
        subtitleEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        subtitleEl.style.color = statusColor;

        hideAllModals();
        showModal(document.getElementById('fullscreen-chat-modal-container'));
        setupPrivateChatListener(chatId);

    } else if (chatType) {
        // --- Handle channel chat header ---
        const channel = CHAT_CHANNELS[chatType];
        if (!channel) return;

        header.style.setProperty('--channel-color', channel.color);
        iconContainer.innerHTML = `<i id="chat-header-icon" class="${channel.icon}"></i>`;
        titleEl.textContent = `${channel.name} Chat`;
        subtitleEl.textContent = channel.description;
        subtitleEl.style.color = ''; // Reset color

        hideAllModals();
        showModal(document.getElementById('fullscreen-chat-modal-container'));
        setupChatListeners(chatType);
    }
}

/**
 * Sets up initial UI elements that are not dependent on dynamic data,
 * such as custom select dropdowns and the particle background animation.
 */
export function setupInitialUI() {
    setupCustomSelects();
    setupParticleCanvas();
}

/**
 * Sets up the event listener for an emoji picker button.
 * @param {string} buttonId The ID of the button that opens the picker.
 * @param {string} inputId The ID of the input field to which the emoji will be added.
 */
export function setupEmojiButton(buttonId, inputId) {
    const button = getElement(buttonId);
    const input = getElement(inputId);
    const emojiPickerContainer = getElement('emoji-picker-container');
    if (!button || !input || !emojiPickerContainer) return;
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPickerContainer.classList.toggle('visible');
        setState({ activeEmojiInput: input });
    });
}

/**
 * Builds the mobile navigation menu based on the main desktop navigation and user permissions.
 */
export function buildMobileNav() {
    const { currentUserData } = getState();
    const mobileNavLinksContainer = getElement('mobile-nav-links');
    if (!mobileNavLinksContainer) return;

    mobileNavLinksContainer.innerHTML = '';
    const desktopNav = getElement('main-nav');

    desktopNav.querySelectorAll('.nav-item').forEach(item => {
        const link = item.querySelector('.nav-link');
        if (!link) return;
        const newLink = document.createElement('a');
        newLink.href = '#';
        newLink.className = 'mobile-nav-link';
        newLink.innerHTML = `<i class="${link.querySelector('i').className} w-6 text-center mr-3"></i>${link.querySelector('span').textContent}`;
        
        newLink.addEventListener('click', (e) => {
            e.preventDefault();
            const state = getState(); 
            const mainTarget = link.dataset.mainTarget;

            if ((mainTarget === 'page-social' || mainTarget === 'page-feed') && !state.currentUserData) {
                getElement('mobile-nav-menu').classList.remove('open');
                showAccessDeniedModal();
                return;
            }
            
            const parentNavItem = link.closest('.nav-item');
            const submenuId = parentNavItem ? parentNavItem.dataset.submenuId : null;

            showPage(mainTarget);
            toggleSubNav(submenuId);
            
            document.querySelectorAll('#main-nav .nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            getElement('mobile-nav-menu').classList.remove('open');
            getElement('modal-backdrop').classList.remove('visible');
        });
        mobileNavLinksContainer.appendChild(newLink);
    });

    const divider = document.createElement('hr');
    divider.className = 'border-t border-white/10 my-2';
    mobileNavLinksContainer.appendChild(divider);

    // --- FIX: Add check for user permissions before creating mobile admin links ---
    const canCreatePost = currentUserData && (currentUserData.isAdmin || (currentUserData.isVerified && (currentUserData.allianceRank === 'R5' || currentUserData.allianceRank === 'R4')));
    if (canCreatePost) {
        const createEventLink = document.createElement('a');
        createEventLink.href = '#';
        createEventLink.className = 'mobile-nav-link';
        createEventLink.innerHTML = `<i class="fas fa-calendar-plus fa-fw w-6 text-center mr-3"></i>Create Event`;
        createEventLink.onclick = (e) => { 
            e.preventDefault(); 
            getElement('mobile-nav-menu').classList.remove('open');
            getElement('modal-backdrop').classList.remove('visible');
            showCreatePostModal('event'); 
        };
        mobileNavLinksContainer.appendChild(createEventLink);

        const createAnnouncementLink = document.createElement('a');
        createAnnouncementLink.href = '#';
        createAnnouncementLink.className = 'mobile-nav-link';
        createAnnouncementLink.innerHTML = `<i class="fas fa-bullhorn fa-fw w-6 text-center mr-3"></i>Create Announcement`;
        createAnnouncementLink.onclick = (e) => { 
            e.preventDefault(); 
            getElement('mobile-nav-menu').classList.remove('open');
            getElement('modal-backdrop').classList.remove('visible');
            showCreatePostModal('announcement'); 
        };
        mobileNavLinksContainer.appendChild(createAnnouncementLink);

        const adminDivider = document.createElement('hr');
        adminDivider.className = 'border-t border-white/10 my-2';
        mobileNavLinksContainer.appendChild(adminDivider);
    }
    
    if (currentUserData) {
        const editProfileMobile = document.createElement('a');
        editProfileMobile.href = '#';
        editProfileMobile.className = 'mobile-nav-link';
        editProfileMobile.innerHTML = `<i class="fas fa-user-edit w-6 text-center mr-3"></i>Edit Profile`;
        editProfileMobile.onclick = (e) => { e.preventDefault(); getElement('mobile-nav-menu').classList.remove('open'); showEditProfileModal(); };
        mobileNavLinksContainer.appendChild(editProfileMobile);

        const logoutMobile = document.createElement('a');
        logoutMobile.href = '#';
        logoutMobile.className = 'mobile-nav-link';
        logoutMobile.innerHTML = `<i class="fas fa-sign-out-alt w-6 text-center mr-3"></i>Logout`;
        logoutMobile.onclick = (e) => { 
            e.preventDefault(); 
            getElement('mobile-nav-menu').classList.remove('open');
            getElement('modal-backdrop').classList.remove('visible');
            handleLogout(); 
        };
        mobileNavLinksContainer.appendChild(logoutMobile);
    } else {
        const loginMobile = document.createElement('a');
        loginMobile.href = '#';
        loginMobile.className = 'mobile-nav-link';
        loginMobile.innerHTML = `<i class="fas fa-sign-in-alt w-6 text-center mr-3"></i>Login / Register`;
        loginMobile.onclick = (e) => { e.preventDefault(); getElement('mobile-nav-menu').classList.remove('open'); showAuthModal('login'); };
        mobileNavLinksContainer.appendChild(loginMobile);
    }
}

/**
 * Initializes all custom select dropdowns on the page by populating their options from constants.
 */
function setupCustomSelects() {
    document.querySelectorAll('.custom-select-container').forEach(container => {
        const type = container.dataset.type;
        const optionsList = container.querySelector('.options-list');
        if (!optionsList) return;

        let optionsData = [];
        switch (type) {
            case 'alliance':
                optionsData = ALLIANCES.map(name => ({ value: name, text: name }));
                break;
            case 'alliance-filter':
                 optionsData = [{ value: '', text: 'All Alliances' }, ...ALLIANCES.map(name => ({ value: name, text: name }))];
                break;
            case 'rank':
                optionsData = ALLIANCE_RANKS;
                break;
            case 'role':
                optionsData = ALLIANCE_ROLES;
                break;
            case 'day-of-week':
                optionsData = DAYS_OF_WEEK;
                break;
            case 'hour-of-day':
                optionsData = HOURS_OF_DAY;
                break;
            case 'repeat-type':
                optionsData = REPEAT_TYPES;
                break;
            case 'announcement-expiration':
                optionsData = ANNOUNCEMENT_EXPIRATION_DAYS;
                break;
        }

        optionsList.innerHTML = optionsData.map(opt => `<div class="custom-select-option" data-value="${opt.value}">${opt.text}</div>`).join('');
    });

    document.body.addEventListener('click', e => {
        const openSelect = document.querySelector('.custom-select-container.open');
        const container = e.target.closest('.custom-select-container');

        if (openSelect && openSelect !== container) {
            openSelect.classList.remove('open');
        }

        if (container) {
            const valueBtn = container.querySelector('.custom-select-value');
            if (e.target === valueBtn || valueBtn.contains(e.target)) {
                container.classList.toggle('open');
            }

            const option = e.target.closest('.custom-select-option');
            if (option) {
                setCustomSelectValue(container, option.dataset.value, option.textContent);
                container.classList.remove('open');
                const hiddenInput = container.querySelector('input[type="hidden"]');
                if (hiddenInput) {
                    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }
    });
}

/**
 * Sets the value and display text of a custom select dropdown.
 * @param {HTMLElement} container The `.custom-select-container` element.
 * @param {string} value The value to set on the hidden input.
 * @param {string} text The text to display on the dropdown button.
 */
export function setCustomSelectValue(container, value, text) {
    const hiddenInput = container.querySelector('input[type="hidden"]');
    const valueSpan = container.querySelector('.custom-select-value span');
    if(hiddenInput && valueSpan) {
        hiddenInput.value = value;
        valueSpan.textContent = text || value;
    }
}

/**
 * Sets up and starts the animated particle background canvas.
 */
function setupParticleCanvas() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: Math.random() * 0.2 - 0.1,
            vy: Math.random() * 0.2 - 0.1,
            size: Math.random() * 1.5 + 0.5,
            color: 'rgba(0, 191, 255, 0.5)'
        });
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}

/**
 * Creates the HTML string for a skeleton loader card, used while posts are loading.
 * @returns {string} The HTML for a skeleton post card.
 */
export function createSkeletonCard() {
    return `
        <div class="post-card skeleton-card">
            <div class="post-card-thumbnail-wrapper"><div class="post-card-thumbnail skeleton-loader"></div></div>
            <div class="post-card-body"><div class="post-card-content"><div class="post-card-header"><div class="skeleton-loader h-5 w-24"></div></div><div class="skeleton-loader h-8 w-4/5 mt-2"></div><div class="skeleton-loader h-4 w-full mt-2"></div><div class="skeleton-loader h-4 w-2/3 mt-1"></div></div><div class="post-card-status"><div class="skeleton-loader h-4 w-16 mb-2"></div><div class="skeleton-loader h-7 w-24"></div></div></div>
        </div>
    `;
}
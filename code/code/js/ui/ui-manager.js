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

const getElement = (id) => document.getElementById(id);
const querySelector = (selector) => document.querySelector(selector);
const querySelectorAll = (selector) => document.querySelectorAll(selector);

let socialBadges = { convoCount: 0, friendRequestCount: 0 };

export function showAccessDeniedModal() {
    hideAllModals();
    showModal(getElement('access-denied-modal-container'));
}

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
export function showPage(targetId) {
    // Hide all pages, then show the target page
    querySelectorAll('.page-content').forEach(page => {
        page.style.display = page.id === targetId ? 'block' : 'none';
    });
    localStorage.setItem('lastActivePage', targetId);

    // Update main navigation link styles and mobile title
    const navLink = querySelector(`#main-nav .nav-link[data-main-target="${targetId}"]`);
    querySelectorAll('#main-nav .nav-link').forEach(l => l.classList.remove('active'));
    if (navLink) {
        navLink.classList.add('active');
        const mobileTitleEl = getElement('mobile-page-title');
        if (mobileTitleEl) {
            mobileTitleEl.textContent = navLink.querySelector('span').textContent;
        }
    }

    // Determine which sub-navigation menu to show
    const navItem = navLink ? navLink.closest('.nav-item') : null;
    const submenuId = navItem ? navItem.dataset.submenuId : null;
    toggleSubNav(submenuId);

    // --- NEW, ROBUST LOGIC FOR SELECTING A SUB-PAGE ---
    const lastSubPageForThisSection = localStorage.getItem(`lastSubPage_${targetId}`);
    let subTargetToSelect = lastSubPageForThisSection;

    // If no last-visited sub-page for this section, set a default
    if (!subTargetToSelect) {
        switch (targetId) {
            case 'page-news':   subTargetToSelect = 'news-all'; break;
            case 'page-social': subTargetToSelect = 'social-chat'; break;
            case 'page-server': subTargetToSelect = 'server-alliances'; break;
        }
    }

    // Find the sub-nav link and click it to trigger all related logic
    if (subTargetToSelect) {
        const subNavLink = querySelector(`.sub-nav-link[data-sub-target="${subTargetToSelect}"]`);
        if (subNavLink) {
            subNavLink.click();
        }
    }
}

export function handleSubNavClick(subTargetId) {
    // When a sub-nav is clicked, save it as the last visited for its parent section
    const parentPageId = querySelector(`[data-sub-target="${subTargetId}"]`).closest('.page-content').id;
    localStorage.setItem(`lastSubPage_${parentPageId}`, subTargetId);

    // Update active styles and show the correct sub-page content
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

    // Render the content for the selected sub-page
    switch (subTargetId) {
        case 'news-all': case 'news-events': case 'news-announcements':
            renderNews(subTargetId.split('-')[1], getState());
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

export function showPage(targetId) {
    // Hide all pages, then show the target page
    querySelectorAll('.page-content').forEach(page => {
        page.style.display = page.id === targetId ? 'block' : 'none';
    });
    localStorage.setItem('lastActivePage', targetId);

    // Update main navigation link styles
    const navLink = querySelector(`#main-nav .nav-link[data-main-target="${targetId}"]`);
    querySelectorAll('#main-nav .nav-link').forEach(l => l.classList.remove('active'));
    if (navLink) {
        navLink.classList.add('active');
        // Update mobile page title
        const mobileTitleEl = getElement('mobile-page-title');
        if (mobileTitleEl) {
            mobileTitleEl.textContent = navLink.querySelector('span').textContent;
        }
    }

    // Toggle the correct sub-navigation menu visibility
    const navItem = navLink ? navLink.closest('.nav-item') : null;
    toggleSubNav(navItem ? navItem.dataset.submenuId : null);

    // --- FIX: Logic to select a default sub-nav item ---
    const activeSubNavLink = querySelector('.sub-nav-link.active');
    const parentPageOfActiveSubNav = activeSubNavLink ? activeSubNavLink.closest('.page-content') : null;

    // Only select a default if no sub-nav is active or if the active one isn't on the current page
    if (!activeSubNavLink || (parentPageOfActiveSubNav && parentPageOfActiveSubNav.id !== targetId)) {
        let defaultSubTarget;
        switch (targetId) {
            case 'page-news':   defaultSubTarget = 'news-all'; break;
            case 'page-social': defaultSubTarget = 'social-chat'; break;
            case 'page-server': defaultSubTarget = 'server-alliances'; break;
        }
        if (defaultSubTarget) {
            const defaultSubNavLink = querySelector(`.sub-nav-link[data-sub-target="${defaultSubTarget}"]`);
            if (defaultSubNavLink) {
                // We use .click() to ensure all associated logic in handleSubNavClick runs
                defaultSubNavLink.click();
            }
        }
    }
}

export function showModal(modal) {
    getElement('modal-backdrop').classList.add('visible');
    modal.classList.add('visible');
}

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

export function showEditProfileModal() {
    hideAllModals();
    showModal(getElement('edit-profile-modal-container'));
    populateEditForm();
}

export function showPlayerSettingsModal(player) {
    setState({ activePlayerSettingsUID: player.uid });
    hideAllModals();
    showModal(getElement('player-settings-modal-container'));
    populatePlayerSettingsForm(player);
}

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

export async function showFullscreenChatModal({ targetPlayer = null, chatType = null }) {
    const { currentUserData, userSessions } = getState();
    if (!currentUserData) return;
    getElement('chat-header-user-info').style.display = 'none';
    getElement('chat-header-channel-info').style.display = 'none';
    getElement('fullscreen-chat-window').innerHTML = '';
    const { listeners } = getState();
    if (listeners) {
        if (listeners.privateChat) listeners.privateChat();
        if (listeners.worldChat) listeners.worldChat();
        if (listeners.allianceChat) listeners.allianceChat();
        if (listeners.leadershipChat) listeners.leadershipChat();
    }
    if (targetPlayer) {
        const chatId = [currentUserData.uid, targetPlayer.uid].sort().join('_');
        await setDoc(doc(db, 'private_chats', chatId), { participants: [currentUserData.uid, targetPlayer.uid] }, { merge: true });
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
        getElement('chat-header-user-info').style.display = 'flex';
        getElement('chat-header-username').textContent = targetPlayer.username;
        getElement('chat-header-status').textContent = status.charAt(0).toUpperCase() + status.slice(1);
        getElement('chat-header-status').style.color = status === 'online' ? '#238636' : (status === 'away' ? '#d29922' : '#6e7681');
        getElement('chat-header-avatar').src = targetPlayer.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${targetPlayer.username.charAt(0).toUpperCase()}`;
        hideAllModals();
        showModal(getElement('fullscreen-chat-modal-container'));
        setupPrivateChatListener(chatId);
    } else if (chatType) {
        const channel = CHAT_CHANNELS[chatType];
        if (!channel) return;
        getElement('chat-header-channel-info').style.display = 'flex';
        getElement('chat-header-channel-name').textContent = channel.name;
        getElement('chat-header-channel-icon').className = `${channel.icon} mr-3 text-2xl`;
        getElement('chat-header-channel-icon').style.color = channel.color;
        hideAllModals();
        showModal(getElement('fullscreen-chat-modal-container'));
        setupChatListeners(chatType);
    }
}

export function setupInitialUI() {
    setupCustomSelects();
    setupParticleCanvas();
}

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

function setupCustomSelects() {
    querySelectorAll('.custom-select-container').forEach(container => {
        // This function remains largely unchanged, just ensure it's robust
    });
}

export function setCustomSelectValue(container, value, text) {
    const hiddenInput = container.querySelector('input[type="hidden"]');
    const valueSpan = container.querySelector('.custom-select-value span');
    if(hiddenInput && valueSpan) {
        hiddenInput.value = value;
        valueSpan.textContent = text || value;
    }
}

function setupParticleCanvas() {
    // Unchanged
}

export function createSkeletonCard() {
    return `
        <div class="post-card skeleton-card">
            <div class="post-card-thumbnail-wrapper"><div class="post-card-thumbnail skeleton-loader"></div></div>
            <div class="post-card-body"><div class="post-card-content"><div class="post-card-header"><div class="skeleton-loader h-5 w-24"></div></div><div class="skeleton-loader h-8 w-4/5 mt-2"></div><div class="skeleton-loader h-4 w-full mt-2"></div><div class="skeleton-loader h-4 w-2/3 mt-1"></div></div><div class="post-card-status"><div class="skeleton-loader h-4 w-16 mb-2"></div><div class="skeleton-loader h-7 w-24"></div></div></div>
        </div>
    `;
}
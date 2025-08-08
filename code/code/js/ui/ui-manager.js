// code/js/ui/ui-manager.js

/**
 * This module is the central hub for managing the user interface.
 * It handles showing/hiding pages and modals, updating navigation,
 * and rendering major UI components like skeletons and dropdowns.
 */

import { getState, updateState } from '../state.js';
import { AVATAR_BORDERS, CHAT_BUBBLE_BORDERS, ALLIANCES, ALLIANCE_RANKS, ALLIANCE_ROLES, DAYS_OF_WEEK, HOURS_OF_DAY, REPEAT_TYPES, ANNOUNCEMENT_EXPIRATION_DAYS, POST_STYLES, POST_TYPES } from '../constants.js';
import { populateEditForm, updateAvatarDisplay, updatePlayerProfileDropdown } from './auth-ui.js';
import { populatePlayerSettingsForm } from './player-settings-ui.js';
import { setupPrivateChatListener, setupChatListeners } from '../firestore.js';
import { db } from '../firebase-config.js';
import { doc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { initializePostStepper, populatePostFormForEdit, renderFeedActivity, renderNews } from './post-ui.js';
import { renderChatSelectors, renderFriendsList, activateChatChannel, renderConversations, renderFriendsPage } from './social-ui.js';
import { formatTimeAgo, autoLinkText, getRankBorderClass,  formatEventDateTime, formatPostTimestamp, canDeletePost } from '../utils.js';


// --- DOM ELEMENT GETTERS ---
const getElement = (id) => document.getElementById(id);
const querySelector = (selector) => document.querySelector(selector);
const querySelectorAll = (selector) => document.querySelectorAll(selector);

// --- PAGE & MODAL MANAGEMENT ---
export function handleSubNavClick(subTargetId) {
    const allSubNavLinks = querySelectorAll('.sub-nav-link');
    allSubNavLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.subTarget === subTargetId);
    });

    // Hide all sub-pages within the active main page
    const activePage = querySelector('.page-content[style*="display: block"]');
    if (activePage) {
        activePage.querySelectorAll('.sub-page').forEach(page => {
            page.style.display = 'none';
        });
    }

    // Show the target sub-page
    const targetSubPage = getElement(`sub-page-${subTargetId}`);
    if (targetSubPage) {
        targetSubPage.style.display = 'block';
    } else {
        console.warn(`Sub-page with id "sub-page-${subTargetId}" not found.`);
    }

    // Handle specific rendering logic for each sub-page
    const [page, filter] = subTargetId.split('-');
    
    switch (page) {
        case 'news':
            renderNews(filter);
            break;
        case 'social':
            if (filter === 'chat') {
                renderChatSelectors();
                renderFriendsList();
                activateChatChannel('world_chat');
                setupChatListeners('world_chat');
            } else if (filter === 'convo') {
                renderConversations();
            } else if (filter === 'friends') {
                renderFriendsPage();
            }
            break;
    }
}
export function showViewPostModal(post) {
    if (!post) return;
    const { allPlayers, currentUserData } = getState();
    updateState({ actionPostId: post.id }); // Keep track of the open post's ID

    // --- Populate Header ---
    const author = allPlayers.find(p => p.uid === post.authorUid);
    const authorSection = getElement('view-post-author-section');
    if (author) {
        authorSection.style.display = 'flex';
        const rankBorder = getRankBorderClass(author);
        getElement('view-post-author-avatar').src = author.avatarUrl || `https://placehold.co/64x64/161B22/FFFFFF?text=${author.username.charAt(0).toUpperCase()}`;
        getElement('view-post-author-avatar').className = `w-12 h-12 rounded-full object-cover ${rankBorder}`;
        getElement('view-post-author-username').textContent = author.username;
        const timestampText = post.createdAt ? formatTimeAgo(post.createdAt.toDate()) : '';
        getElement('view-post-author-meta').textContent = `Posted ${timestampText}`;
    } else {
        authorSection.style.display = 'none';
    }

    // --- Populate Content ---
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

    // --- Populate Footer & Reactions ---
    const likeBtn = document.querySelector('.post-reaction-btn[data-reaction="like"]');
    const heartBtn = document.querySelector('.post-reaction-btn[data-reaction="heart"]');
    
    likeBtn.querySelector('.reaction-count').textContent = post.likes || 0;
    heartBtn.querySelector('.reaction-count').textContent = post.hearts || 0;
    
    if (currentUserData) {
        likeBtn.classList.toggle('reacted', post.likedBy && post.likedBy.includes(currentUserData.uid));
        heartBtn.classList.toggle('reacted', post.heartedBy && post.heartedBy.includes(currentUserData.uid));
    }

    showModal(getElement('view-post-modal-container'));
}
// NEW function to control the slide-out sub-menu
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

// REVISED showPage function
export function showPage(targetId) {
    // This part remains the same: show/hide main page content
    querySelectorAll('.page-content').forEach(page => {
        page.style.display = page.id === targetId ? 'block' : 'none';
    });

    // NEW: Update mobile page title
    const mobileTitleEl = getElement('mobile-page-title');
    const activeNavLink = querySelector(`#main-nav .nav-link[data-main-target="${targetId}"]`);
    if (mobileTitleEl && activeNavLink) {
        const titleText = activeNavLink.querySelector('span').textContent;
        mobileTitleEl.textContent = titleText;
    }
    
    // This logic still correctly renders the default content for each page
    if (targetId === 'page-news') {
        renderNews('all');
    } else if (targetId === 'page-feed') {
        const { currentUserData } = getState();
        const welcomeContainer = getElement('feed-welcome-message');
        
        if (currentUserData && welcomeContainer) {
            welcomeContainer.innerHTML = `
                <h2 class="text-3xl font-bold text-white tracking-wider">Welcome Back, <span style="color: var(--color-primary);">${currentUserData.username}</span>!</h2>
                <p class="text-gray-400 mt-1">Here's what's happening in the community.</p>
            `;
        }
        renderFeedActivity();
    } else if (targetId === 'page-social') {
        renderChatSelectors();
        renderFriendsList();
        activateChatChannel('world_chat');
        setupChatListeners('world_chat');
    }
}

export function showModal(modal) {
    hideAllModals();
    getElement('modal-backdrop').classList.add('visible');
    modal.classList.add('visible');
}

export function hideAllModals() {
    getElement('modal-backdrop').classList.remove('visible');
    querySelectorAll('.modal-container').forEach(modal => modal.classList.remove('visible'));
    updateState({ 
        activePlayerSettingsUID: null, 
        editingPostId: null,
        actionPostId: null,
        activePrivateChatId: null,
        activePrivateChatPartner: null 
    });
    // Detach private chat listener if it exists
    const { listeners } = getState();
    if (listeners.privateChat) listeners.privateChat();
}

export function showAuthModal(formToShow) {
    showModal(getElement('auth-modal-container'));
    querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    if (formToShow === 'register') {
        getElement('register-form-container').classList.add('active');
        // initializeRegistrationStepper(); // This will be handled in auth-ui.js
    } else {
        getElement('login-form-container').classList.add('active');
    }
}

export function showEditProfileModal() {
    showModal(getElement('edit-profile-modal-container'));
    populateEditForm();
}

export function showPlayerSettingsModal(player) {
    updateState({ activePlayerSettingsUID: player.uid });
    showModal(getElement('player-settings-modal-container'));
    populatePlayerSettingsForm(player);
}

export function showCreatePostModal(mainType) {
    updateState({ editingPostId: null });
    getElement('create-post-form').reset();
    getElement('post-nav-container').style.display = 'flex';
    showModal(getElement('create-post-modal-container'));
    initializePostStepper(mainType);
    getElement('post-content-header').textContent = 'Create New Post';
    getElement('post-submit-btn').innerHTML = '<i class="fas fa-check-circle mr-2"></i>Create Post';
}

export function showConfirmationModal(title, message, onConfirm) {
    getElement('confirmation-title').textContent = title;
    getElement('confirmation-message').textContent = message;

    const confirmBtn = getElement('confirmation-confirm-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', onConfirm);;

    showModal(getElement('confirmation-modal-container'));
}

export function showPostActionsModal(postId) {
    const editBtn = document.getElementById('modal-edit-post-btn');
    const deleteBtn = document.getElementById('modal-delete-post-btn');

    // Clone and replace buttons to remove old event listeners
    const newEditBtn = editBtn.cloneNode(true);
    const newDeleteBtn = deleteBtn.cloneNode(true);
    editBtn.parentNode.replaceChild(newEditBtn, editBtn);
    deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

    // Add new listener for the EDIT button
    newEditBtn.addEventListener('click', () => {
        hideAllModals();
        // We are importing a function from post-ui.js that is not yet exported.
        // We will add this export in the next step.
        populatePostFormForEdit(postId); 
    });

    // Add new listener for the DELETE button
    newDeleteBtn.addEventListener('click', () => {
        const { allPosts } = getState();
        const postToDelete = allPosts.find(p => p.id === postId);
        if (postToDelete) {
            hideAllModals();
            showConfirmationModal(
                'Delete Post?',
                `Are you sure you want to delete "${postToDelete.title}"? This action cannot be undone.`,
                async () => {
                    try {
                        await deleteDoc(doc(db, 'posts', postId));
                    } catch (err) {
                        console.error("Error deleting post: ", err);
                        alert("Error: Could not delete post.");
                    }
                    hideAllModals(); // Add this line
                }
            );
        }
    });

    showModal(document.getElementById('post-actions-modal-container'));
}

// Add async here
// Add async to the function definition
export async function showPrivateMessageModal(targetPlayer) {
    const { currentUserData, userSessions } = getState();
    if (!currentUserData) return;

    try {
        // 1. Calculate the ID and ensure the chat document exists.
        const chatId = [currentUserData.uid, targetPlayer.uid].sort().join('_');
        const chatDocRef = doc(db, 'private_chats', chatId);
        await setDoc(chatDocRef, {
            participants: [currentUserData.uid, targetPlayer.uid]
        }, { merge: true });

        // 2. Update the state with BOTH the partner info and the calculated ID.
        updateState({
            activePrivateChatPartner: targetPlayer,
            activePrivateChatId: chatId // This is the critical fix
        });

        // 3. Populate the UI header.
        const session = userSessions[targetPlayer.uid];
        const status = session ? session.status : 'offline';
        getElement('private-message-username').textContent = targetPlayer.username;
        getElement('private-message-status').textContent = status.charAt(0).toUpperCase() + status.slice(1);
        getElement('private-message-status').style.color = status === 'online' ? '#238636' : (status === 'away' ? '#d29922' : '#6e7681');
        getElement('private-message-avatar').src = targetPlayer.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${targetPlayer.username.charAt(0).toUpperCase()}`;
        getElement('private-message-window').innerHTML = '';

        // 4. Show the modal.
        showModal(getElement('private-message-modal-container'));

        // 5. Call the listener and PASS THE CHAT ID DIRECTLY as an argument.
        setupPrivateChatListener(chatId);

    } catch (error) {
        console.error("Failed to open private chat:", error);
        alert("Could not open the chat window. Please check the console for errors.");
    }
}
// --- UI INITIALIZATION & UPDATES ---

export function setupInitialUI() {
    setupCustomSelects();
    setupParticleCanvas();
}

export function updateUIForLoggedInUser() {
    const { currentUserData } = getState();
    if (!currentUserData) return;

    getElement('username-display').textContent = currentUserData.username;
    updateAvatarDisplay(currentUserData);
    updatePlayerProfileDropdown();
    getElement('login-btn').classList.add('hidden');
    getElement('user-profile-nav-item').classList.remove('hidden');
    getElement('mobile-auth-container').classList.add('logged-in');

    const adminActionsContainer = getElement('admin-actions-container');
    if (adminActionsContainer) {
        if (currentUserData.isAdmin) {
            // This is the key change:
            // We ensure it's displayed as a flex container on medium screens and up.
            adminActionsContainer.classList.remove('hidden');
            adminActionsContainer.classList.add('md:flex');
        } else {
            adminActionsContainer.classList.add('hidden');
            adminActionsContainer.classList.remove('md:flex');
        }
    }
}

export function updateUIForLoggedOutUser() {
    getElement('login-btn').classList.remove('hidden');
    const userProfileNavItem = getElement('user-profile-nav-item');
    userProfileNavItem.classList.add('hidden');
    userProfileNavItem.classList.remove('open');
    getElement('mobile-auth-container').classList.remove('logged-in');
}

export function buildMobileNav() {
    const { currentUserData } = getState();
    const mobileNavLinksContainer = getElement('mobile-nav-links');
    mobileNavLinksContainer.innerHTML = '';
    const desktopNav = getElement('main-nav');

    // --- Main Page Links ---
    desktopNav.querySelectorAll('.nav-item').forEach(item => {
        const link = item.querySelector('.nav-link');
        const newLink = document.createElement('a');
        newLink.href = '#';
        newLink.className = 'mobile-nav-link';
        newLink.innerHTML = `<i class="${link.querySelector('i').className} w-6 text-center mr-3"></i>${link.querySelector('span').textContent}`;
        
        newLink.addEventListener('click', (e) => {
            e.preventDefault();
            const mainTarget = link.dataset.mainTarget;
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

    // --- Admin Links ---
    if (currentUserData && currentUserData.isAdmin) {
        const createEventLink = document.createElement('a');
        createEventLink.href = '#';
        createEventLink.className = 'mobile-nav-link';
        createEventLink.innerHTML = `<i class="fas fa-calendar-plus fa-fw w-6 text-center mr-3"></i>Create Event`;
        createEventLink.onclick = (e) => { e.preventDefault(); getElement('mobile-nav-menu').classList.remove('open'); showCreatePostModal('event'); };
        mobileNavLinksContainer.appendChild(createEventLink);

        const createAnnouncementLink = document.createElement('a');
        createAnnouncementLink.href = '#';
        createAnnouncementLink.className = 'mobile-nav-link';
        createAnnouncementLink.innerHTML = `<i class="fas fa-bullhorn fa-fw w-6 text-center mr-3"></i>Create Announcement`;
        createAnnouncementLink.onclick = (e) => { e.preventDefault(); getElement('mobile-nav-menu').classList.remove('open'); showCreatePostModal('announcement'); };
        mobileNavLinksContainer.appendChild(createAnnouncementLink);

        const adminDivider = document.createElement('hr');
        adminDivider.className = 'border-t border-white/10 my-2';
        mobileNavLinksContainer.appendChild(adminDivider);
    }
    
    // --- User-Specific Links ---
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
        logoutMobile.onclick = (e) => { e.preventDefault(); auth.signOut(); }; // Assuming auth is available here
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
        const type = container.dataset.type;
        const hiddenInput = container.querySelector('input[type="hidden"]');
        const valueButton = container.querySelector('.custom-select-value');
        const optionsContainer = container.querySelector('.custom-select-options');
        const searchInput = container.querySelector('.custom-select-search');
        const optionsList = container.querySelector('.options-list');
        
        let sourceData = [];
        if (type === 'alliance') sourceData = ALLIANCES.map(a => ({value: a, text: a}));
        else if (type === 'avatar-border') sourceData = AVATAR_BORDERS;
        else if (type === 'chat-bubble-border') sourceData = CHAT_BUBBLE_BORDERS;
        else if (type === 'rank') sourceData = ALLIANCE_RANKS;
        else if (type === 'role') sourceData = ALLIANCE_ROLES;
        else if (type === 'alliance-filter') sourceData = [{value: '', text: 'All Alliances'}, ...ALLIANCES.map(a => ({value: a, text: a}))];
        else if (type === 'day-of-week') sourceData = DAYS_OF_WEEK;
        else if (type === 'hour-of-day') sourceData = HOURS_OF_DAY;
        else if (type === 'repeat-type') sourceData = REPEAT_TYPES;
        else if (type === 'announcement-expiration') sourceData = ANNOUNCEMENT_EXPIRATION_DAYS;

        const isSearchable = searchInput && type === 'alliance';
        if(searchInput && !isSearchable) searchInput.style.display = 'none';

        function renderOptions(data = [], filter = '') {
            optionsList.innerHTML = '';
            const filteredData = data.filter(item => item.text.toLowerCase().includes(filter.toLowerCase()));
            filteredData.forEach(item => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'custom-select-option';
                optionDiv.textContent = item.text;
                optionDiv.dataset.value = item.value;
                optionsList.appendChild(optionDiv);
            });
        }

        valueButton.addEventListener('click', (e) => {
            e.stopPropagation();

            const isOpen = container.classList.contains('open');
            querySelectorAll('.custom-select-container').forEach(c => c.classList.remove('open'));
            if (!isOpen) {
                const rect = container.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                optionsContainer.classList.remove('open-up', 'open-down');
                if (spaceBelow < 220 && rect.top > 220) { 
                    optionsContainer.classList.add('open-up');
                } else {
                    optionsContainer.classList.add('open-down');
                }
                container.classList.add('open');
                if (isSearchable) { searchInput.value = ''; searchInput.focus(); }
                renderOptions(sourceData);
            } else {
                container.classList.remove('open');
            }
        });

        if (isSearchable) {
            searchInput.addEventListener('input', () => renderOptions(sourceData, searchInput.value));
        }

        optionsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('custom-select-option')) {
                const value = e.target.dataset.value;
                const text = e.target.textContent;
                setCustomSelectValue(container, value, text);
                container.classList.remove('open');
                hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        renderOptions(sourceData);
    });
}

export function setCustomSelectValue(container, value, text) {
    const hiddenInput = container.querySelector('input[type="hidden"]');
    const valueSpan = container.querySelector('.custom-select-value span');
    hiddenInput.value = value;
    valueSpan.textContent = text || value;
}

function setupParticleCanvas() {
    const canvas = getElement('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    function createParticles() {
        particles = []; let particleCount = (canvas.width * canvas.height) / 10000;
        for (let i = 0; i < particleCount; i++) { particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, size: Math.random() * 1.5 + 0.5, color: Math.random() > 0.3 ? 'rgba(0, 191, 255, 0.5)' : 'rgba(248, 113, 113, 0.1)' }); }
    }
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > canvas.width) p.vx *= -1; if (p.y < 0 || p.y > canvas.height) p.vy *= -1; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); });
        requestAnimationFrame(animateParticles);
    }
    window.addEventListener('resize', () => { resizeCanvas(); createParticles(); });
    resizeCanvas(); createParticles(); animateParticles();
}

export function createSkeletonCard() {
    return `
        <div class="post-card skeleton-card">
            <div class="post-card-thumbnail-wrapper">
                <div class="post-card-thumbnail skeleton-loader"></div>
            </div>
            <div class="post-card-body">
                <div class="post-card-content">
                    <div class="post-card-header">
                        <div class="skeleton-loader h-5 w-24"></div>
                    </div>
                    <div class="skeleton-loader h-8 w-4/5 mt-2"></div>
                    <div class="skeleton-loader h-4 w-full mt-2"></div>
                    <div class="skeleton-loader h-4 w-2/3 mt-1"></div>
                </div>
                <div class="post-card-status">
                    <div class="skeleton-loader h-4 w-16 mb-2"></div>
                    <div class="skeleton-loader h-7 w-24"></div>
                </div>
            </div>
        </div>
    `;
}

export function renderSkeletons() {
    // The new container for our default news/events view
    const newsContainer = getElement('sub-page-news-all');
    if (!newsContainer) return; // Exit if the container isn't there

    // We'll create a combined skeleton view for the new layout
    newsContainer.innerHTML = `
        <div class="mb-8">
            <h2 class="section-header text-2xl font-bold mb-4" style="--glow-color: var(--color-highlight);">
                <i class="fas fa-bullhorn"></i><span>Announcements</span>
            </h2>
            <div class="grid grid-cols-1 gap-4">
                ${createSkeletonCard()}
            </div>
        </div>
        <div>
            <h2 class="section-header text-2xl font-bold mb-4" style="--glow-color: var(--color-primary);">
                <i class="fas fa-calendar-alt"></i><span>Events</span>
            </h2>
            <div class="grid grid-cols-1 gap-4">
                ${createSkeletonCard()}
                ${createSkeletonCard()}
            </div>
        </div>
    `;
}



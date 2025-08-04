// code/js/ui/ui-manager.js

/**
 * This module is the central hub for managing the user interface.
 * It handles showing/hiding pages and modals, updating navigation,
 * and rendering major UI components like skeletons and dropdowns.
 */

import { getState, updateState } from '../state.js';
import { ALLIANCES, ALLIANCE_RANKS, ALLIANCE_ROLES, DAYS_OF_WEEK, HOURS_OF_DAY, REPEAT_TYPES } from '../constants.js';
import { populateEditForm, updateAvatarDisplay, updatePlayerProfileDropdown } from './auth-ui.js';
import { populatePlayerSettingsForm } from './player-settings-ui.js';
import { initializePostStepper, populatePostFormForEdit } from './post-ui.js';
import { setupPrivateChatListener } from '../firestore.js';

// --- DOM ELEMENT GETTERS ---
const getElement = (id) => document.getElementById(id);
const querySelector = (selector) => document.querySelector(selector);
const querySelectorAll = (selector) => document.querySelectorAll(selector);

// --- PAGE & MODAL MANAGEMENT ---

export function showPage(targetId) {
    querySelectorAll('.page-content').forEach(page => {
        page.style.display = page.id === targetId ? 'block' : 'none';
    });
    querySelectorAll('#main-nav .nav-link').forEach(link => {
        const mainTarget = link.dataset.mainTarget;
        link.classList.toggle('active', mainTarget === targetId);
    });
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

    newConfirmBtn.addEventListener('click', () => {
        onConfirm();
        hideAllModals();
    });

    showModal(getElement('confirmation-modal-container'));
}

export function showPostActionsModal(postId) {
    updateState({ actionPostId: postId });
    showModal(getElement('post-actions-modal-container'));
}

export function showPrivateMessageModal(targetPlayer) {
    updateState({ activePrivateChatPartner: targetPlayer });
    getElement('private-message-header').textContent = `Chat with ${targetPlayer.username}`;
    getElement('private-message-window').innerHTML = '<p class="text-center text-gray-500 m-auto">Loading messages...</p>';
    showModal(getElement('private-message-modal-container'));
    setupPrivateChatListener();
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
}

export function updateUIForLoggedOutUser() {
    getElement('login-btn').classList.remove('hidden');
    const userProfileNavItem = getElement('user-profile-nav-item');
    userProfileNavItem.classList.add('hidden');
    userProfileNavItem.classList.remove('open');
}

export function buildMobileNav() {
    const { currentUserData } = getState();
    const mobileNavLinksContainer = getElement('mobile-nav-links');
    mobileNavLinksContainer.innerHTML = '';
    const desktopNav = getElement('main-nav');

    desktopNav.querySelectorAll('.nav-item').forEach(item => {
        const link = item.querySelector('.nav-link');
        const newLink = document.createElement('a');
        newLink.href = '#';
        newLink.className = 'mobile-nav-link';
        newLink.innerHTML = `<i class="${link.querySelector('i').className} w-6 text-center mr-3"></i>${link.querySelector('span').textContent}`;
        
        const dropdown = item.querySelector('.dropdown-menu');
        if (dropdown) {
            newLink.addEventListener('click', (e) => {
                e.preventDefault();
                const subMenu = newLink.nextElementSibling;
                if (subMenu) {
                    subMenu.style.display = subMenu.style.display === 'block' ? 'none' : 'block';
                }
            });
            mobileNavLinksContainer.appendChild(newLink);

            const subMenuContainer = document.createElement('div');
            subMenuContainer.style.display = 'none';
            subMenuContainer.className = 'ml-8';
            const dropdownLinks = dropdown.querySelectorAll('.dropdown-link');
            if (dropdownLinks.length > 0) {
                dropdownLinks.forEach(ddLink => {
                    const newDdLink = document.createElement('a');
                    newDdLink.href = '#';
                    newDdLink.className = 'mobile-nav-link !py-2 !text-base';
                    newDdLink.textContent = ddLink.textContent;
                    newDdLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        showPage(ddLink.dataset.target);
                        getElement('mobile-nav-menu').classList.remove('open');
                        getElement('modal-backdrop').classList.remove('visible');
                    });
                    subMenuContainer.appendChild(newDdLink);
                });
                mobileNavLinksContainer.appendChild(subMenuContainer);
            }

        } else {
             newLink.addEventListener('click', (e) => {
                e.preventDefault();
                showPage(link.dataset.mainTarget);
                getElement('mobile-nav-menu').classList.remove('open');
                getElement('modal-backdrop').classList.remove('visible');
            });
            mobileNavLinksContainer.appendChild(newLink);
        }
    });

    const divider = document.createElement('hr');
    divider.className = 'border-t border-white/10 my-4';
    mobileNavLinksContainer.appendChild(divider);

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
        logoutMobile.onclick = (e) => { e.preventDefault(); auth.signOut(); };
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
        else if (type === 'rank') sourceData = ALLIANCE_RANKS;
        else if (type === 'role') sourceData = ALLIANCE_ROLES;
        else if (type === 'alliance-filter') sourceData = [{value: '', text: 'All Alliances'}, ...ALLIANCES.map(a => ({value: a, text: a}))];
        else if (type === 'day-of-week') sourceData = DAYS_OF_WEEK;
        else if (type === 'hour-of-day') sourceData = HOURS_OF_DAY;
        else if (type === 'repeat-type') sourceData = REPEAT_TYPES;
        
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
    const announcementsContainer = getElement('announcements-container');
    const eventsSectionContainer = getElement('events-section-container');
    announcementsContainer.innerHTML = `
        <div class="section-header text-xl font-bold mb-4" style="--glow-color: var(--color-highlight);">
            <i class="fas fa-bullhorn"></i>
            <span class="flex-grow">Announcements</span>
        </div>
        <div class="grid grid-cols-1 gap-4">
            ${createSkeletonCard()}
        </div>
    `;
    eventsSectionContainer.innerHTML = `
        <div class="section-header text-xl font-bold mb-4">
             <i class="fas fa-calendar-alt"></i>
             <span class="flex-grow">Events</span>
        </div>
        <div class="grid grid-cols-1 gap-4">
            ${createSkeletonCard()}
            ${createSkeletonCard()}
            ${createSkeletonCard()}
        </div>
    `;
}

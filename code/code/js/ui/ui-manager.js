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

/**
 * Displays the access denied modal for features that require authentication.
 */
export function showAccessDeniedModal() {
    hideAllModals();
    showModal(getElement('access-denied-modal-container'));
}

/**
 * Updates the notification badges on the social sub-navigation tabs.
 * @param {{convoCount?: number, friendRequestCount?: number}} counts - An object with the counts for different notification types.
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
 * Handles clicks on sub-navigation links, showing the correct sub-page and re-rendering content.
 * @param {string} subTargetId - The `data-sub-target` value of the clicked link.
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
 * Displays the modal for viewing a single post's details.
 * @param {Object} post - The post object from Firestore to display.
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
 * @param {string | null} activeSubmenuId - The ID of the sub-menu to show, or null to hide all.
 */
export function toggleSubNav(activeSubmenuId) {
    // ... function logic
}

/**
 * Displays the specified main page and hides all others.
 * @param {string} targetId - The ID of the page element to display.
 */
export function showPage(targetId) {
    // ... function logic
}

/**
 * Makes a specific modal and the backdrop visible.
 * @param {HTMLElement} modal - The modal container element to show.
 */
export function showModal(modal) {
    getElement('modal-backdrop').classList.add('visible');
    modal.classList.add('visible');
}

/**
 * Hides all modals and the backdrop, and clears related state.
 */
export function hideAllModals() {
    // ... function logic
}

/**
 * Shows the authentication modal.
 * @param {'login' | 'register'} formToShow - Which form to display initially.
 */
export function showAuthModal(formToShow) {
    // ... function logic
}

/**
 * Shows the modal for editing the current user's profile.
 */
export function showEditProfileModal() {
    hideAllModals();
    showModal(getElement('edit-profile-modal-container'));
    populateEditForm();
}

/**
 * Shows the modal for a leader to edit another player's settings.
 * @param {UserData} player - The player object whose settings will be edited.
 */
export function showPlayerSettingsModal(player) {
    // ... function logic
}

/**
 * Shows the modal for creating a new post.
 * @param {'event' | 'announcement'} mainType - The main type of post to create.
 */
export function showCreatePostModal(mainType) {
    // ... function logic
}

/**
 * Displays a confirmation modal for a destructive action.
 * @param {string} title - The title of the confirmation modal.
 * @param {string} message - The descriptive message for the action.
 * @param {() => void} onConfirm - The callback function to execute when the user confirms.
 */
export function showConfirmationModal(title, message, onConfirm) {
    // ... function logic
}

/**
 * Shows the actions modal (edit/delete) for a specific post.
 * @param {string} postId - The ID of the post to perform actions on.
 */
export function showPostActionsModal(postId) {
    // ... function logic
}

/**
 * @typedef {Object} ChatModalOptions
 * @property {UserData} [targetPlayer] - The user to start a private chat with.
 * @property {string} [chatType] - The type of public channel to open (e.g., 'world_chat').
 */

/**
 * Shows the full-screen chat modal for either a private message or a public channel.
 * @param {ChatModalOptions} options - The options for which chat to open.
 */
export async function showFullscreenChatModal({ targetPlayer = null, chatType = null }) {
    // ... function logic
}

/**
 * Sets up event listeners for custom select dropdowns and populates them with initial data.
 */
function setupCustomSelects() {
    // ... function logic
}

/**
 * Sets the value and displayed text of a custom select dropdown.
 * @param {HTMLElement} container - The `.custom-select-container` element.
 * @param {string} value - The value to set on the hidden input.
 * @param {string} text - The text to display in the dropdown button.
 */
export function setCustomSelectValue(container, value, text) {
    // ... function logic
}

/**
 * Initializes and animates the particle background effect on the canvas.
 */
function setupParticleCanvas() {
    // ... function logic
}

/**
 * Generates the HTML for a single skeleton loader card for posts.
 * @returns {string} The HTML string for the skeleton card.
 */
export function createSkeletonCard() {
    return `
        <div class="post-card skeleton-card">
            <div class="post-card-thumbnail-wrapper"><div class="post-card-thumbnail skeleton-loader"></div></div>
            <div class="post-card-body"><div class="post-card-content"><div class="post-card-header"><div class="skeleton-loader h-5 w-24"></div></div><div class="skeleton-loader h-8 w-4/5 mt-2"></div><div class="skeleton-loader h-4 w-full mt-2"></div><div class="skeleton-loader h-4 w-2/3 mt-1"></div></div><div class="post-card-status"><div class="skeleton-loader h-4 w-16 mb-2"></div><div class="skeleton-loader h-7 w-24"></div></div></div>
        </div>
    `;
}
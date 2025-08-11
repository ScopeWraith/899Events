// code/js/ui/notifications-ui.js

/**
 * This module is responsible for rendering notifications in the dropdown
 * and on the main feed page.
 */

import { formatTimeAgo } from '../utils.js';

export function renderNotifications(notifications) {
    const feedDropdown = document.getElementById('feed-dropdown');
    const feedActionContainer = document.getElementById('feed-action-container');
    const notificationBadge = document.getElementById('notification-badge');

    // FIX: Add null checks to prevent errors if the DOM is not ready.
    if (!feedDropdown || !notificationBadge) {
        console.warn("Notification UI elements not found, skipping render. This may be a timing issue on initial load.");
        return;
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.classList.add('visible');
    } else {
        notificationBadge.classList.remove('visible');
    }

    // --- Dropdown Rendering (up to 5 notifications) ---
    if (notifications.length === 0) {
        feedDropdown.innerHTML = '<p class="text-center text-gray-500 p-4">No new notifications.</p>';
    } else {
        feedDropdown.innerHTML = notifications.slice(0, 5).map(n => createNotificationHTML(n)).join('');
    }

    // --- Full Feed Page Rendering (Actionable items only) ---
    const actionableNotifications = notifications.filter(n => 
        n.type === 'friend_request' || n.type === 'verification_request'
    );

    // The feedActionContainer is only on the 'Feed' page, so this check is also important.
    if (feedActionContainer) {
        if (actionableNotifications.length === 0) {
            feedActionContainer.innerHTML = '<p class="text-center text-gray-500 p-4">No pending actions.</p>';
        } else {
            feedActionContainer.innerHTML = actionableNotifications.map(n => createNotificationHTML(n)).join('');
        }
    }
}

function createNotificationHTML(notification) {
    const timeAgo = notification.timestamp ? formatTimeAgo(notification.timestamp.toDate()) : '';
    const isReadClass = notification.isRead ? '' : 'is-read';
    
    let iconHTML = '';
    let actionsHTML = '';

    switch(notification.type) {
        case 'friend_request':
            iconHTML = `<div class="notification-icon bg-blue-500/20 text-blue-400"><i class="fas fa-user-plus"></i></div>`;
            if (!notification.isRead) {
                actionsHTML = `
                    <div class="notification-actions">
                        <button class="notification-action-btn primary-btn" data-action="accept-friend" data-sender-uid="${notification.senderUid}">Accept</button>
                        <button class="notification-action-btn secondary-btn" data-action="decline-friend" data-sender-uid="${notification.senderUid}">Decline</button>
                    </div>
                `;
            }
            break;
        case 'verification_request':
             iconHTML = `<div class="notification-icon bg-yellow-500/20 text-yellow-400"><i class="fas fa-user-check"></i></div>`;
             if (!notification.isRead) {
                 actionsHTML = `
                    <div class="notification-actions">
                         <button class="notification-action-btn primary-btn" data-action="verify-user" data-target-uid="${notification.senderUid}">Verify User</button>
                    </div>
                 `;
             }
            break;
        case 'alliance_announcement':
            iconHTML = `<div class="notification-icon bg-red-500/20 text-red-400"><i class="fas fa-bullhorn"></i></div>`;
            break;
        default:
            iconHTML = `<div class="notification-icon bg-gray-500/20 text-gray-400"><i class="fas fa-bell"></i></div>`;
    }

    return `
        <div class="notification-item ${isReadClass}" data-id="${notification.id}" data-type="${notification.type}" data-sender-uid="${notification.senderUid}">
            ${iconHTML}
            <div class="notification-content">
                <p class="notification-text">${notification.message}</p>
                <p class="notification-time">${timeAgo}</p>
                ${actionsHTML}
            </div>
        </div>
    `;
}
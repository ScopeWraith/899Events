// code/js/ui/notifications-ui.js

import { subscribe, getState } from '../state.js';
import { formatTimeAgo } from '../utils.js';

function renderNotificationsUI(newState, prevState) {
    // Re-render if notifications OR unverified players have changed.
    if (newState.userNotifications === prevState.userNotifications && newState.unverifiedPlayers === prevState.unverifiedPlayers) return;
    
    renderNotifications(newState.userNotifications || [], newState.unverifiedPlayers || []);
}

export function initializeNotificationsUI() {
    subscribe(renderNotificationsUI);
}

function renderNotifications(notifications, unverifiedPlayers) {
    const feedDropdown = document.getElementById('feed-dropdown');
    const feedActionContainer = document.getElementById('feed-action-container');
    const notificationBadge = document.getElementById('notification-badge');

    if (!feedDropdown || !notificationBadge || !feedActionContainer) {
        return;
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.classList.add('visible');
    } else {
        notificationBadge.classList.remove('visible');
    }

    if (notifications.length === 0) {
        feedDropdown.innerHTML = '<p class="text-center text-gray-500 p-4">No new notifications.</p>';
    } else {
        feedDropdown.innerHTML = notifications.slice(0, 5).map(n => createNotificationHTML(n)).join('');
    }

    // Combine friend requests from notifications and verification requests from unverifiedPlayers
    const friendRequests = notifications.filter(n => n.type === 'friend_request');
    
    // Convert unverified players into a notification-like format for display
    const verificationRequests = unverifiedPlayers.map(player => ({
        id: `verify-${player.uid}`,
        type: 'verification_request',
        message: `${player.username} [${player.alliance}] is awaiting verification.`,
        senderUid: player.uid,
        isRead: false, // Treat all as actionable
        timestamp: player.registrationTimestampUTC ? new Date(player.registrationTimestampUTC) : new Date()
    }));

    const actionableNotifications = [...friendRequests, ...verificationRequests]
        .sort((a, b) => (b.timestamp?.toDate ? b.timestamp.toDate() : b.timestamp) - (a.timestamp?.toDate ? a.timestamp.toDate() : a.timestamp));

    if (actionableNotifications.length === 0) {
        feedActionContainer.innerHTML = '<p class="text-center text-gray-500 p-4">No pending actions.</p>';
    } else {
        feedActionContainer.innerHTML = actionableNotifications.map(n => createNotificationHTML(n)).join('');
    }
}

function createNotificationHTML(notification) {
    const timeAgo = notification.timestamp ? formatTimeAgo(notification.timestamp.toDate ? notification.timestamp.toDate() : notification.timestamp) : '';
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
             actionsHTML = `
                <div class="notification-actions">
                     <button class="notification-action-btn primary-btn" data-action="verify-user" data-target-uid="${notification.senderUid}">Verify User</button>
                </div>
             `;
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
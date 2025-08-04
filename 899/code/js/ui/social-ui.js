// code/js/ui/social-ui.js

/**
 * This module handles UI updates for the "Social" page, including
 * rendering chat messages, friend lists, and managing tab switching.
 */

import { getState } from '../state.js';

export function renderMessages(messages, container, chatType) {
    const { currentUserData, allPlayers, userSessions } = getState();
    if (!currentUserData) return;

    container.innerHTML = ''; // Clear previous messages
    if (messages.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 m-auto">No messages yet. Be the first to say something!</p>`;
        return;
    }
    messages.forEach(msg => {
        const isSelf = msg.authorUid === currentUserData.uid;
        const canDelete = currentUserData.isAdmin || (chatType === 'alliance_chat' && (currentUserData.allianceRank === 'R5' || currentUserData.allianceRank === 'R4'));
        
        const authorData = allPlayers.find(p => p.uid === msg.authorUid);
        const avatarUrl = authorData?.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${msg.authorUsername.charAt(0).toUpperCase()}`;
        const session = userSessions[msg.authorUid];
        const statusClass = session ? session.status : 'offline';

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${isSelf ? 'self' : ''}`;
        messageEl.innerHTML = `
            <img src="${avatarUrl}" class="w-8 h-8 rounded-full flex-shrink-0" alt="${msg.authorUsername}">
            <div class="chat-message-bubble">
                <p class="chat-message-author">${msg.authorUsername} <span class="status-dot ${statusClass}"></span></p>
                <p class="text-sm">${msg.text}</p>
            </div>
            ${canDelete ? `<button class="delete-message-btn" data-id="${msg.id}" data-type="${chatType}"><i class="fas fa-times"></i></button>` : ''}
        `;
        container.appendChild(messageEl);
    });
}

export function renderFriendsList() {
    const { currentUserData, userFriends, allPlayers, userSessions } = getState();
    const friendsListContainer = document.getElementById('friends-list');

    if (!currentUserData) {
        friendsListContainer.innerHTML = '<p class="text-gray-400 text-center p-4">You must be logged in to see friends.</p>';
        return;
    }
    if (userFriends.length === 0) {
        friendsListContainer.innerHTML = '<p class="text-gray-400 text-center p-4">You haven\'t added any friends yet.</p>';
        return;
    }

    friendsListContainer.innerHTML = '';
    userFriends.forEach(friendId => {
        const friendData = allPlayers.find(p => p.uid === friendId);
        if (!friendData) return;

        const session = userSessions[friendId];
        const statusClass = session ? session.status : 'offline';
        const avatarUrl = friendData.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${friendData.username.charAt(0).toUpperCase()}`;

        const friendEl = document.createElement('div');
        friendEl.className = 'friend-list-item';
        friendEl.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="relative">
                    <img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover">
                    <span class="status-dot ${statusClass} absolute bottom-0 right-0 border-2 border-gray-800"></span>
                </div>
                <div>
                    <p class="font-bold text-white">${friendData.username}</p>
                    <p class="text-xs text-gray-400">[${friendData.alliance}] - ${friendData.allianceRank}</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <button class="message-player-btn text-gray-400 hover:text-white" data-uid="${friendId}" title="Message"><i class="fas fa-comment-dots"></i></button>
                <button class="remove-friend-btn" data-uid="${friendId}" title="Remove Friend"><i class="fas fa-user-minus"></i></button>
            </div>
        `;
        friendsListContainer.appendChild(friendEl);
    });
}

export function renderFriendRequests() {
    const { userNotifications } = getState();
    const friendRequests = userNotifications.filter(n => n.type === 'friend_request');
    const friendRequestsList = document.getElementById('friend-requests-list');
    
    if (friendRequests.length === 0) {
        friendRequestsList.innerHTML = '<p class="text-gray-400 text-center p-4">No pending requests.</p>';
        return;
    }
    // This part can be expanded to show the requests UI
    friendRequestsList.innerHTML = '<p class="text-gray-400 text-center p-4">You have pending friend requests! Check your notifications.</p>';
}

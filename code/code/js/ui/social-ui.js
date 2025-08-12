// code/js/ui/social-ui.js

import { getState, updateState } from '../state.js';
import { isUserLeader } from '../utils.js';
import { handleSendMessage, fetchConversations, addFriend, setupChatListeners, handleImageAttachment, setupConversationListListener } from '../firestore.js';
import { formatMessageTimestamp, autoLinkText, formatTimeAgo, getAvatarSkinClass, getRankBorderClass } from '../utils.js';
import { canDeleteMessage } from '../utils.js';
import { showFullscreenChatModal, showPage } from './ui-manager.js';
import { CHAT_CHANNELS } from '../constants.js';

export function renderChatChannels() {
    const container = document.getElementById('chat-selectors');
    if (!container) return;
    const { currentUserData } = getState();

    container.innerHTML = Object.values(CHAT_CHANNELS).map(channel => {
        let isVisible = true;
        if (channel.requiresAuth && !currentUserData) isVisible = false;
        if (channel.requiresAlliance && (!currentUserData || !currentUserData.alliance)) isVisible = false;
        if (channel.requiresLeader && !isUserLeader(currentUserData)) isVisible = false;

        if (!isVisible) return '';

        return `
            <button class="chat-selector-btn" style="--glow-color: ${channel.color};" data-chat-type="${channel.id}">
                <i class="${channel.icon} fa-fw w-6 text-center"></i>
                <span>${channel.name} Chat</span>
            </button>
        `;
    }).join('');
}

export function renderFriendsList() {
    const container = document.getElementById('friends-list-social-page');
    const { currentUserData, userFriends, allPlayers, userSessions, isFriendsListCollapsed } = getState();

    const friendsContainer = document.getElementById('friends-list-container-social');
    if (friendsContainer) {
        friendsContainer.classList.toggle('collapsed', isFriendsListCollapsed);
    }

    if (!container) return;
    if (!currentUserData) { /* ... */ return; }
    if (userFriends.length === 0) { /* ... */ return; }

    container.innerHTML = '';
    userFriends.forEach(friendId => {
        const friendData = allPlayers.find(p => p.uid === friendId);
        if (!friendData) return;

        const session = userSessions[friendId];
        const statusClass = session ? session.status : 'offline';
        const avatarUrl = friendData.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${friendData.username.charAt(0).toUpperCase()}`;
        const rankBorder = getRankBorderClass(friendData);

        const friendEl = document.createElement('div');
        friendEl.className = 'friend-list-item';
        friendEl.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="relative">
                    <img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover ${rankBorder}">
                    <span class="status-dot ${statusClass} absolute bottom-0 right-0 border-2 border-gray-800"></span>
                </div>
                <div>
                    <p class="font-bold text-white">${friendData.username}</p>
                    <p class="text-xs text-gray-400">[${friendData.alliance}] - ${friendData.allianceRank}</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <button class="message-player-btn text-gray-400 hover:text-white" data-uid="${friendId}" title="Message"><i class="fas fa-comment-dots"></i></button>
            </div>
        `;
        container.appendChild(friendEl);
    });
}

export function renderMessages(messages, container, chatType) {
    const { currentUserData, allPlayers } = getState();
    if (!currentUserData || !container) return;

    const getRankBorderClass = (player) => {
        if (player?.isAdmin) return 'rank-border-admin';
        const rank = player?.allianceRank;
        return `rank-border-${rank?.toLowerCase() || 'r1'}`;
    };

    container.innerHTML = ''; 
    if (messages.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 m-auto">No messages yet. Be the first to say something!</p>`;
        return;
    }

    messages.forEach(msg => {
        const isSelf = msg.authorUid === currentUserData.uid;
        const authorData = allPlayers.find(p => p.uid === msg.authorUid);
        const authorUsername = authorData?.username || 'Unknown User';
        const avatarUrl = authorData?.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${authorUsername.charAt(0).toUpperCase()}`;
        const timestamp = msg.timestamp ? formatMessageTimestamp(msg.timestamp.toDate()) : '';
        const rankBorder = getRankBorderClass(authorData);
    
        const canDelete = canDeleteMessage(currentUserData, authorData);
        let messageActionsHTML = '';
        if (canDelete) {
            messageActionsHTML = `
                <div class="message-actions">
                    <button class="message-action-btn delete-message-btn" title="Delete"><i class="fas fa-times"></i></button>
                    <button class="message-action-btn confirm-delete-btn hidden" title="Confirm Delete"><i class="fas fa-check"></i></button>
                </div>
            `;
        }

        const reactions = msg.reactions || {};
        const reactionPillsHTML = Object.entries(reactions)
            .map(([emoji, userMap]) => {
                const count = Object.keys(userMap).length;
                if (count === 0) return '';
                const hasReacted = currentUserData.uid in userMap;
                const tooltipText = Object.values(userMap).join(', ');
                return `<div class="reaction-pill ${hasReacted ? 'reacted' : ''}" data-emoji="${emoji}" data-tooltip="${tooltipText}"><span class="emoji">${emoji}</span><span class="count">${count}</span><div class="reaction-tooltip">${tooltipText}</div></div>`;
            }).join('');

        let messageContent = `<p class="chat-message-author">${authorUsername}</p>`;
        if (msg.text) messageContent += `<p>${autoLinkText(msg.text)}</p>`;
        if (msg.imageUrl) messageContent += `<img src="${msg.imageUrl}" class="chat-message-image" alt="User uploaded image">`;

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${isSelf ? 'self' : ''}`;
        messageEl.innerHTML = `
            <div class="chat-message-identity">
                <div class="avatar-container">
                    <img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover ${rankBorder}" alt="${authorUsername}">
                    <div class="player-badge">[${authorData?.alliance || '?'}] ${authorData?.allianceRank || '?'}</div>                
                </div>
                <p class="chat-message-timestamp">${timestamp}</p>
                ${messageActionsHTML}
            </div>
            <div class="chat-message-main">
                <div class="chat-message-bubble ${rankBorder}" data-message-id="${msg.id}" data-chat-type="${chatType}">
                    ${messageContent}
                </div>
                <div class="chat-reactions-container">${reactionPillsHTML}</div>
            </div>
        `;
        container.appendChild(messageEl);
    });
    
    container.scrollTop = container.scrollHeight;
}


// Entry point function called from ui-manager
export function renderConversations() {
    setupConversationListListener();
}

// Actual rendering function called by the real-time listener
export function renderConversationsList(conversations) {
    const container = document.getElementById('sub-page-social-convo');
    if (!container) return;

    const { allPlayers, userSessions } = getState();
    const listContainer = document.getElementById('convo-list');
    
    conversations.sort((a, b) => {
        const timeA = a.lastMessage?.timestamp?.toDate() || new Date(0);
        const timeB = b.lastMessage?.timestamp?.toDate() || new Date(0);
        return timeB - timeA;
    });

    if (conversations.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-gray-400 py-8">No recent conversations. Start one from the Players page!</p>`;
        return;
    }

    const filteredConversations = conversations.filter(convo => 
        allPlayers.find(p => p.uid === convo.partnerId)
    );

    listContainer.innerHTML = filteredConversations.map(convo => {
        const partnerData = allPlayers.find(p => p.uid === convo.partnerId);
        if (!partnerData) return '';

        const session = userSessions[convo.partnerId];
        const statusClass = session ? session.status : 'offline';
        const avatarUrl = partnerData.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${partnerData.username.charAt(0).toUpperCase()}`;

        let lastMessageText = convo.lastMessage?.text || '';
        if (convo.lastMessage?.imageUrl && !lastMessageText) {
            lastMessageText = '<i>[Image]</i>';
        }
        
        const unreadClass = convo.unreadCount > 0 ? 'unread-convo' : '';
        const unreadBadge = convo.unreadCount > 0 ? `<span class="badge">${convo.unreadCount}</span>` : '';

        return `
            <div class="convo-item glass-pane p-4 flex items-center justify-between hover:bg-white/5 transition-colors duration-200 cursor-pointer rounded-lg ${unreadClass}" data-partner-uid="${partnerData.uid}" data-chat-id="${convo.chatId}">
                <div class="flex items-center gap-4 overflow-hidden">
                    <div class="relative flex-shrink-0">
                        <img src="${avatarUrl}" class="w-12 h-12 rounded-full object-cover">
                        <span class="status-dot ${statusClass} absolute bottom-0 right-0 border-2 border-gray-800"></span>
                    </div>
                    <div class="overflow-hidden">
                        <h4 class="font-bold text-lg text-white">${partnerData.username}</h4>
                        <p class="text-sm text-gray-400 truncate">${lastMessageText}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4 flex-shrink-0">
                    <span class="text-xs text-gray-500">${formatTimeAgo(convo.lastMessage?.timestamp?.toDate())}</span>
                    ${unreadBadge}
                    <button class="text-gray-500 hover:text-yellow-400 transition-colors" title="Pin Conversation (coming soon)">
                        <i class="fas fa-thumbtack"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ** MODIFIED FUNCTION **
export function renderFriendsPage() {
    const container = document.getElementById('sub-page-social-friends');
    if (!container) return;

    const { userFriends, allPlayers } = getState();

    // The data might not be ready, so we check.
    if (!userFriends || !allPlayers) {
        container.innerHTML = '<div class="spinner mx-auto mt-8"></div>'; // Show a spinner
        return;
    }

    const friendsData = userFriends
        .map(friendId => allPlayers.find(p => p.uid === friendId))
        .filter(Boolean)
        .sort((a, b) => a.username.localeCompare(b.username));

    const friendsListHTML = friendsData.length > 0 ? friendsData.map(friend => {
        const avatarUrl = friend.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${friend.username.charAt(0).toUpperCase()}`;
        return `
            <div class="glass-pane p-4 flex items-center justify-between rounded-lg">
                <div class="flex items-center gap-4">
                    <img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover">
                    <div>
                        <p class="font-bold text-white">${friend.username}</p>
                        <p class="text-xs text-gray-400">[${friend.alliance}] - ${friend.allianceRank}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                     <button class="message-player-btn text-gray-400 hover:text-white" data-uid="${friend.uid}" title="Message"><i class="fas fa-comment-dots"></i></button>
                </div>
            </div>
        `
    }).join('') : `<p class="text-center text-gray-500 py-8 col-span-full">Your friends list is empty. Add friends from the Players page.</p>`;

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-bold text-white tracking-wider" style="text-shadow: 0 0 10px var(--color-primary);">Friends</h2>
            <button id="add-friend-main-btn" class="primary-btn rounded-lg px-4 py-2 flex items-center gap-2">
                <i class="fas fa-user-plus"></i><span>Add Friend</span>
            </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="friends-page-list">
            ${friendsListHTML}
        </div>
    `;

    // Re-attach listeners since we overwrite the HTML
    document.getElementById('add-friend-main-btn').addEventListener('click', () => {
        showPage('page-server');
        handleSubNavClick('server-players'); // Directly navigate to players sub-page
    });
    
    document.getElementById('friends-page-list').addEventListener('click', (e) => {
        const messageBtn = e.target.closest('.message-player-btn');
        if(messageBtn) {
            const partnerData = allPlayers.find(p => p.uid === messageBtn.dataset.uid);
            if(partnerData) showFullscreenChatModal({ targetPlayer: partnerData });
        }
    });
}
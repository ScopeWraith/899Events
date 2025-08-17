// code/js/ui/social-ui.js

import { subscribe, setState, getState } from '../state.js';
import { isUserLeader, formatMessageTimestamp, autoLinkText, formatTimeAgo, getAvatarBorderClass, canDeleteMessage } from '../utils.js';
import { setupConversationListListener } from '../firestore.js';
import { showFullscreenChatModal, showPage } from './ui-manager.js';
import { CHAT_CHANNELS } from '../constants.js';

// --- STATE & RENDER FUNCTIONS ---

function renderSocialUI(newState, prevState) {
    const { currentUserData, userFriends, allPlayers, userSessions, isFriendsListCollapsed, activeChatMessages, conversations, allAlliances } = newState;

    if (currentUserData !== prevState.currentUserData) {
        renderChatChannels(currentUserData);
    }

    if (currentUserData !== prevState.currentUserData || userFriends !== prevState.userFriends || allPlayers !== prevState.allPlayers || userSessions !== prevState.userSessions || isFriendsListCollapsed !== prevState.isFriendsListCollapsed) {
        renderFriendsList(currentUserData, userFriends, allPlayers, userSessions, isFriendsListCollapsed, allAlliances);
        renderFriendsPage(userFriends, allPlayers);
    }
    
    if (activeChatMessages !== prevState.activeChatMessages) {
        const chatWindow = document.getElementById('fullscreen-chat-window');
        const activeChatType = document.querySelector('#chat-selectors .chat-selector-btn.active')?.dataset.chatType || 'private_chat';
        renderMessages(activeChatMessages, chatWindow, activeChatType);
    }

    if (conversations !== prevState.conversations) {
        renderConversationsList(conversations);
    }
}

export function initializeSocialUI() {
    subscribe(renderSocialUI);
}


// --- UI HELPER & RENDERING FUNCTIONS ---

export function renderChatChannels(currentUserData) {
    const container = document.getElementById('chat-selectors');
    if (!container) return;

    // Replace the existing map with this new one
    container.innerHTML = Object.values(CHAT_CHANNELS).map(channel => {
        let isVisible = true;
        if (channel.requiresAuth && !currentUserData) isVisible = false;
        if (channel.requiresAlliance && (!currentUserData || !currentUserData.alliance)) isVisible = false;
        if (channel.requiresLeader && !isUserLeader(currentUserData)) isVisible = false;
        
        if (!isVisible) return '';

        // New HTML structure for the card
        return `
            <button class="chat-channel-card" style="--channel-color: ${channel.color};" data-chat-type="${channel.id}">
                <div class="chat-channel-icon">
                    <i class="${channel.icon}"></i>
                </div>
                <div class="chat-channel-info">
                    <h3 class="chat-channel-name">${channel.name} Chat</h3>
                    <p class="chat-channel-desc">${channel.description}</p>
                </div>
                <div class="chat-channel-arrow">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </button>
        `;
    }).join('');
}

export function renderFriendsList(currentUserData, userFriends, allPlayers, userSessions, isFriendsListCollapsed, allAlliances) {
    const container = document.getElementById('friends-list-social-page');
    const friendsContainer = document.getElementById('friends-list-container-social');
    if (friendsContainer) friendsContainer.classList.toggle('collapsed', isFriendsListCollapsed);
    if (!container || !currentUserData || !userFriends || userFriends.length === 0) {
        if (container) container.innerHTML = '<p class="text-xs text-center text-gray-500 p-4">Add friends from the Players page.</p>';
        return;
    }
    container.innerHTML = '';
    userFriends.forEach(friendId => {
        if (!allPlayers) return;
        const friendData = allPlayers.find(p => p.uid === friendId);
        if (!friendData) return;
        const session = userSessions ? userSessions[friendId] : null;
        const statusClass = session ? session.status : 'offline';
        const avatarUrl = friendData.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${friendData.username.charAt(0).toUpperCase()}`;
        const allianceData = allAlliances ? allAlliances.find(a => a.tag === friendData.alliance) : null;
        const rankBorder = getAvatarBorderClass(friendData, allianceData);
        const friendEl = document.createElement('div');
        friendEl.className = 'friend-list-item';
        friendEl.innerHTML = `<div class="flex items-center gap-3"><div class="relative"><img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover ${rankBorder.className}" style="${rankBorder.style}"><span class="status-dot ${statusClass} absolute bottom-0 right-0 border-2 border-gray-800"></span></div><div><p class="font-bold text-white">${friendData.username}</p><p class="text-xs text-gray-400">[${friendData.alliance}] - ${friendData.allianceRank}</p></div></div><div class="flex items-center gap-4"><button class="message-player-btn text-gray-400 hover:text-white" data-uid="${friendId}" title="Message"><i class="fas fa-comment-dots"></i></button></div>`;
        container.appendChild(friendEl);
    });
}

export function renderMessages(messages, container, chatType) {
    const { currentUserData, allPlayers, allAlliances } = getState();
    if (!currentUserData || !container || !allPlayers) return;
    container.innerHTML = '';
    if (!messages || messages.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 m-auto">No messages yet. Be the first to say something!</p>`;
        return;
    }
    messages.forEach(msg => {
        const isSelf = msg.authorUid === currentUserData.uid;
        const authorData = allPlayers.find(p => p.uid === msg.authorUid);
        const authorUsername = authorData?.username || 'Unknown User';
        const avatarUrl = authorData?.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${authorUsername.charAt(0).toUpperCase()}`;
        const timestamp = msg.timestamp ? formatMessageTimestamp(msg.timestamp.toDate()) : '';
        const allianceData = allAlliances ? allAlliances.find(a => a.tag === authorData.alliance) : null;
        const rankBorder = getAvatarBorderClass(authorData, allianceData);
        const canDelete = canDeleteMessage(currentUserData, authorData);
        const messageActionsHTML = canDelete ? `<div class="message-actions"><button class="message-action-btn delete-message-btn" title="Delete"><i class="fas fa-times"></i></button><button class="message-action-btn confirm-delete-btn hidden" title="Confirm Delete"><i class="fas fa-check"></i></button></div>` : '';
        const reactions = msg.reactions || {};
        const reactionPillsHTML = Object.entries(reactions).map(([emoji, userMap]) => {
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
        messageEl.dataset.messageId = msg.id;
        messageEl.innerHTML = `<div class="chat-message-identity"><div class="avatar-container"><img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover ${rankBorder.className}" style="${rankBorder.style}" alt="${authorUsername}"><div class="player-badge">[${authorData?.alliance || '?'}] ${authorData?.allianceRank || '?'}</div></div><p class="chat-message-timestamp">${timestamp}</p>${messageActionsHTML}</div><div class="chat-message-main"><div class="chat-message-bubble" data-chat-type="${chatType}">${messageContent}</div><div class="chat-reactions-container">${reactionPillsHTML}</div></div>`;
        container.appendChild(messageEl);
    });
    container.scrollTop = container.scrollHeight;
}

export function renderConversations() {
    setupConversationListListener();
}

function createConvoPreloader() {
    let loaderHTML = '';
    for (let i = 0; i < 3; i++) {
        loaderHTML += `
            <div class="convo-card-loader">
                <div class="convo-card-loader-avatar"></div>
                <div class="convo-card-loader-text">
                    <div class="convo-card-loader-line title"></div>
                    <div class="convo-card-loader-line subtitle"></div>
                </div>
            </div>
        `;
    }
    return loaderHTML;
}

export function renderConversationsList(conversations) {
    const container = document.getElementById('sub-page-social-convo');
    if (!container) return;
    const { allPlayers, userSessions } = getState();
    const listContainer = document.getElementById('convo-list');
    
    // Show preloader if data is not ready
    if (!allPlayers || !conversations) {
        listContainer.innerHTML = createConvoPreloader();
        return;
    }

    conversations.sort((a, b) => (b.lastMessage?.timestamp?.toDate() || 0) - (a.lastMessage?.timestamp?.toDate() || 0));
    
    if (conversations.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-gray-400 py-8">No recent conversations. Start one from the Players page!</p>`;
        return;
    }
    
    const filteredConversations = conversations.filter(convo => allPlayers.find(p => p.uid === convo.partnerId));
    
    if (filteredConversations.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-gray-400 py-8">No recent conversations. Start one from the Players page!</p>`;
        return;
    }

    listContainer.innerHTML = filteredConversations.map(convo => {
        const partnerData = allPlayers.find(p => p.uid === convo.partnerId);
        if (!partnerData) return '';
        
        const session = userSessions ? userSessions[convo.partnerId] : null;
        const statusClass = session ? session.status : 'offline';
        const avatarUrl = partnerData.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${partnerData.username.charAt(0).toUpperCase()}`;
        
        let lastMessageText = convo.lastMessage?.text || '';
        if (convo.lastMessage?.imageUrl && !lastMessageText) lastMessageText = '<i>[Image]</i>';
        
        const unreadClass = convo.unreadCount > 0 ? 'unread' : '';
        const unreadDot = convo.unreadCount > 0 ? `<div class="unread-dot" title="${convo.unreadCount} unread message(s)"></div>` : '';

        return `
            <div class="convo-card ${unreadClass}" data-partner-uid="${partnerData.uid}" data-chat-id="${convo.chatId}">
                <div class="convo-card-avatar-wrapper">
                    <img src="${avatarUrl}" class="convo-card-avatar">
                    <span class="status-dot ${statusClass}"></span>
                </div>
                <div class="convo-card-main">
                    <div class="convo-card-header">
                        <h4 class="convo-card-username">${partnerData.username}</h4>
                        <span class="convo-card-timestamp">${formatTimeAgo(convo.lastMessage?.timestamp?.toDate())}</span>
                    </div>
                    <div class="convo-card-body">
                        <p class="convo-card-message">${lastMessageText}</p>
                        ${unreadDot}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


export function renderFriendsPage(userFriends, allPlayers) {
    const container = document.getElementById('sub-page-social-friends');
    if (!container) return;
    if (!userFriends || !allPlayers) {
        container.innerHTML = '<div class="spinner mx-auto mt-8"></div>';
        return;
    }
    const friendsData = userFriends.map(friendId => allPlayers.find(p => p.uid === friendId)).filter(Boolean).sort((a, b) => a.username.localeCompare(b.username));
    const friendsListHTML = friendsData.length > 0 ? friendsData.map(friend => {
        const avatarUrl = friend.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${friend.username.charAt(0).toUpperCase()}`;
        return `<div class="glass-pane p-4 flex items-center justify-between rounded-lg"><div class="flex items-center gap-4"><img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover"><div><p class="font-bold text-white">${friend.username}</p><p class="text-xs text-gray-400">[${friend.alliance}] - ${friend.allianceRank}</p></div></div><div class="flex items-center gap-4"><button class="message-player-btn text-gray-400 hover:text-white" data-uid="${friend.uid}" title="Message"><i class="fas fa-comment-dots"></i></button></div></div>`;
    }).join('') : `<p class="text-center text-gray-500 py-8 col-span-full">Your friends list is empty. Add friends from the Players page.</p>`;
    container.innerHTML = `<div class="flex justify-between items-center mb-6"><h2 class="text-3xl font-bold text-white tracking-wider" style="text-shadow: 0 0 10px var(--color-primary);">Friends</h2><button id="add-friend-main-btn" class="primary-btn rounded-lg px-4 py-2 flex items-center gap-2"><i class="fas fa-user-plus"></i><span>Add Friend</span></button></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="friends-page-list">${friendsListHTML}</div>`;
    document.getElementById('add-friend-main-btn').addEventListener('click', () => {
        showPage('page-server');
        document.querySelector('.sub-nav-link[data-sub-target="server-players"]').click();
    });
    document.getElementById('friends-page-list').addEventListener('click', (e) => {
        const messageBtn = e.target.closest('.message-player-btn');
        if(messageBtn) {
            const { allPlayers } = getState();
            const partnerData = allPlayers.find(p => p.uid === messageBtn.dataset.uid);
            if(partnerData) showFullscreenChatModal({ targetPlayer: partnerData });
        }
    });
}
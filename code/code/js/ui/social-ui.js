// code/js/ui/social-ui.js

import { subscribe, setState, getState } from '../state.js';
import { isUserLeader, formatMessageTimestamp, autoLinkText, formatTimeAgo, getAvatarBorderClass, canDeleteMessage, getChatBubbleBorderClass } from '../utils.js';
import { setupConversationListListener } from '../firestore.js';
import { showFullscreenChatModal, showPage } from './ui-manager.js';
import { CHAT_CHANNELS } from '../constants.js';

// --- STATE & RENDER FUNCTIONS ---

/**
 * Renders the social UI components whenever relevant state changes occur.
 * This function is subscribed to the central state and will re-render
 * social components if user, friend, player, message, or conversation data is updated.
 * @param {object} newState The new, updated state object.
 * @param {object} prevState The previous state object.
 */
function renderSocialUI(newState, prevState) {
    const { currentUserData, userFriends, allPlayers, userSessions, isFriendsListCollapsed, activeChatMessages, conversations, allAlliances } = newState;

    if (currentUserData !== prevState.currentUserData) {
        renderChatChannels(currentUserData);
    }

    if (currentUserData !== prevState.currentUserData || userFriends !== prevState.userFriends || allPlayers !== prevState.allPlayers || userSessions !== prevState.userSessions || isFriendsListCollapsed !== prevState.isFriendsListCollapsed) {
        renderFriendsList(currentUserData, userFriends, allPlayers, userSessions, isFriendsListCollapsed, allAlliances);
        renderFriendsPage(currentUserData, userFriends, allPlayers, userSessions); // Pass currentUserData and userSessions
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

/**
 * Initializes the social UI module by subscribing its render function to the application state.
 */
export function initializeSocialUI() {
    subscribe(renderSocialUI);
}


// --- UI HELPER & RENDERING FUNCTIONS ---

/**
 * Renders the available chat channel selection cards based on the current user's permissions.
 * @param {object|null} currentUserData The data for the currently logged-in user.
 */
export function renderChatChannels(currentUserData) {
    const container = document.getElementById('chat-selectors');
    if (!container) return;

    container.innerHTML = Object.values(CHAT_CHANNELS).map(channel => {
        let isVisible = true;
        if (channel.requiresAuth && !currentUserData) isVisible = false;
        if (channel.requiresAlliance && (!currentUserData || !currentUserData.alliance)) isVisible = false;
        if (channel.requiresLeader && !isUserLeader(currentUserData)) isVisible = false;
        
        if (!isVisible) return '';

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

/**
 * Renders the collapsible friends list on the main social chat page.
 * @param {object} currentUserData The data for the currently logged-in user.
 * @param {Array<object>} userFriends An array of friend objects from the subcollection.
 * @param {Array<object>} allPlayers An array of all player data objects.
 * @param {object} userSessions An object mapping UIDs to session status.
 * @param {boolean} isFriendsListCollapsed The current collapsed state of the list.
 * @param {Array<object>} allAlliances An array of all alliance data objects.
 */
export function renderFriendsList(currentUserData, userFriends, allPlayers, userSessions, isFriendsListCollapsed, allAlliances) {
    const container = document.getElementById('friends-list-social-page');
    const friendsContainer = document.getElementById('friends-list-container-social');
    if (friendsContainer) friendsContainer.classList.toggle('collapsed', isFriendsListCollapsed);
    if (!container || !currentUserData || !userFriends) {
        if(container) container.innerHTML = '<p class="text-xs text-center text-gray-500 p-4">Add friends to get started.</p>';
        return;
    }

    const acceptedFriends = userFriends.filter(f => f.status === 'friends');

    if (acceptedFriends.length === 0) {
        container.innerHTML = '<p class="text-xs text-center text-gray-500 p-4">No friends to display.</p>';
        return;
    }
    
    container.innerHTML = '';
    acceptedFriends.forEach(friend => {
        if (!allPlayers) return;
        const friendData = allPlayers.find(p => p.uid === friend.id);
        if (!friendData) return;
        const session = userSessions ? userSessions[friend.id] : null;
        const statusClass = session ? session.status : 'offline';
        const avatarUrl = friendData.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${friendData.username.charAt(0).toUpperCase()}`;
        const allianceData = allAlliances ? allAlliances.find(a => a.tag === friendData.alliance) : null;
        const rankBorder = getAvatarBorderClass(friendData, allianceData);
        const friendEl = document.createElement('div');
        friendEl.className = 'friend-list-item';
        friendEl.innerHTML = `<div class="flex items-center gap-3"><div class="relative"><img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover ${rankBorder.className}" style="${rankBorder.style}"><span class="status-dot ${statusClass} absolute bottom-0 right-0 border-2 border-gray-800"></span></div><div><p class="font-bold text-white">${friendData.username}</p><p class="text-xs text-gray-400">[${friendData.alliance}] - ${friendData.allianceRank}</p></div></div><div class="flex items-center gap-4"><button class="message-player-btn text-gray-400 hover:text-white" data-uid="${friend.id}" title="Message"><i class="fas fa-comment-dots"></i></button></div>`;
        container.appendChild(friendEl);
    });
}

/**
 * Renders messages into a specified chat window container.
 * @param {Array<object>} messages An array of message objects to render.
 * @param {HTMLElement} container The DOM element to render the messages into.
 * @param {string} chatType The type of chat the messages belong to.
 */
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
        const chatBubbleBorder = getChatBubbleBorderClass(authorData, allianceData);
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
        messageEl.innerHTML = `<div class="chat-message-identity"><div class="avatar-container"><img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover ${rankBorder.className}" style="${rankBorder.style}" alt="${authorUsername}"><div class="player-badge">[${authorData?.alliance || '?'}] ${authorData?.allianceRank || '?'}</div></div><p class="chat-message-timestamp">${timestamp}</p>${messageActionsHTML}</div><div class="chat-message-main"><div class="chat-message-bubble ${chatBubbleBorder.className}" style="${chatBubbleBorder.style}" data-chat-type="${chatType}">${messageContent}</div><div class="chat-reactions-container">${reactionPillsHTML}</div></div>`;
        container.appendChild(messageEl);
    });
    container.scrollTop = container.scrollHeight;
}

/**
 * Initiates the process of rendering the list of private conversations by setting up the necessary listener.
 */
export function renderConversations() {
    setupConversationListListener();
}

/**
 * Renders the list of private conversations on the "Private" social tab.
 * @param {Array<object>} conversations An array of conversation metadata objects.
 */
export function renderConversationsList(conversations) {
    const container = document.getElementById('sub-page-social-convo');
    if (!container) return;
    const { allPlayers, userSessions } = getState();
    if (!allPlayers || !conversations) return;
    const listContainer = document.getElementById('convo-list');
    conversations.sort((a, b) => (b.lastMessage?.timestamp?.toDate() || 0) - (a.lastMessage?.timestamp?.toDate() || 0));
    if (conversations.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-gray-400 py-8">No recent conversations. Start one from the Players page!</p>`;
        return;
    }
    const filteredConversations = conversations.filter(convo => allPlayers.find(p => p.uid === convo.partnerId));
    listContainer.innerHTML = filteredConversations.map(convo => {
        const partnerData = allPlayers.find(p => p.uid === convo.partnerId);
        if (!partnerData) return '';
        const session = userSessions ? userSessions[convo.partnerId] : null;
        const statusClass = session ? session.status : 'offline';
        const avatarUrl = partnerData.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${partnerData.username.charAt(0).toUpperCase()}`;
        let lastMessageText = convo.lastMessage?.text || '';
        if (convo.lastMessage?.imageUrl && !lastMessageText) lastMessageText = '<i>[Image]</i>';
        const unreadClass = convo.unreadCount > 0 ? 'unread-convo' : '';
        const unreadBadge = convo.unreadCount > 0 ? `<span class="badge">${convo.unreadCount}</span>` : '';
        return `<div class="convo-item glass-pane p-4 flex items-center justify-between hover:bg-white/5 transition-colors duration-200 cursor-pointer rounded-lg ${unreadClass}" data-partner-uid="${partnerData.uid}" data-chat-id="${convo.chatId}"><div class="flex items-center gap-4 overflow-hidden"><div class="relative flex-shrink-0"><img src="${avatarUrl}" class="w-12 h-12 rounded-full object-cover"><span class="status-dot ${statusClass} absolute bottom-0 right-0 border-2 border-gray-800"></span></div><div class="overflow-hidden"><h4 class="font-bold text-lg text-white">${partnerData.username}</h4><p class="text-sm text-gray-400 truncate">${lastMessageText}</p></div></div><div class="flex items-center gap-4 flex-shrink-0"><span class="text-xs text-gray-500">${formatTimeAgo(convo.lastMessage?.timestamp?.toDate())}</span>${unreadBadge}<button class="text-gray-500 hover:text-yellow-400 transition-colors" title="Pin Conversation (coming soon)"><i class="fas fa-thumbtack"></i></button></div></div>`;
    }).join('');
}

/**
 * Renders the dedicated "Friends" page with a tabbed interface.
 * @param {object} currentUserData The data for the currently logged-in user.
 * @param {Array<object>} userFriends An array of friend objects from the subcollection.
 * @param {Array<object>} allPlayers An array of all player data objects.
 * @param {object} userSessions An object mapping UIDs to session status.
 */
export function renderFriendsPage(currentUserData, userFriends, allPlayers, userSessions) {
    const container = document.getElementById('sub-page-social-friends');
    if (!container || !currentUserData) return;

    if (!userFriends || !allPlayers || !userSessions) {
        container.innerHTML = '<div class="spinner mx-auto mt-8"></div>';
        return;
    }
    
    // 1. Filter friends into categories
    const friends = userFriends.filter(f => f.status === 'friends').map(f => allPlayers.find(p => p.uid === f.id)).filter(Boolean);
    const pendingReceived = userFriends.filter(f => f.status === 'pending' && f.requester !== currentUserData.uid).map(f => allPlayers.find(p => p.uid === f.id)).filter(Boolean);
    const pendingSent = userFriends.filter(f => f.status === 'pending' && f.requester === currentUserData.uid).map(f => allPlayers.find(p => p.uid === f.id)).filter(Boolean);
    const onlineFriends = friends.filter(friend => userSessions[friend.uid]?.status === 'online');

    const pendingCount = pendingReceived.length;
    
    // 2. Build the main HTML structure with tabs and counts
    container.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
            <h2 class="text-3xl font-bold text-white tracking-wider" style="text-shadow: 0 0 10px var(--color-primary);">Friends</h2>
            <div class="filter-btn-group" id="friends-filter-tabs">
                <button class="filter-btn active" data-filter="all">All (${friends.length})</button>
                <button class="filter-btn" data-filter="online">Online (${onlineFriends.length})</button>
                <button class="filter-btn" data-filter="pending">Pending <span class="badge ml-1 ${pendingCount > 0 ? '' : 'hidden'}">${pendingCount}</span></button>
                <button class="primary-btn !rounded-lg !px-4 !py-2 flex items-center gap-2" id="add-friend-main-btn"><i class="fas fa-user-plus"></i><span>Add Friend</span></button>
            </div>
        </div>
        <div id="friends-page-content">
             </div>
    `;

    // 3. Render the initial content (All tab)
    const lists = { all: friends, online: onlineFriends, pending: { received: pendingReceived, sent: pendingSent } };
    renderFriendListContent('all', lists);

    // 4. Add event listeners for the tabs
    document.getElementById('friends-filter-tabs').addEventListener('click', (e) => {
        const filterBtn = e.target.closest('.filter-btn');
        if (filterBtn) {
            document.querySelectorAll('#friends-filter-tabs .filter-btn').forEach(btn => btn.classList.remove('active'));
            filterBtn.classList.add('active');
            renderFriendListContent(filterBtn.dataset.filter, lists);
        }
    });
    
    document.getElementById('add-friend-main-btn').addEventListener('click', () => {
        showPage('page-server');
        const playersSubNavLink = document.querySelector('.sub-nav-link[data-sub-target="server-players"]');
        if(playersSubNavLink) playersSubNavLink.click();
    });
}

/**
 * Renders the content of the friends list based on the active tab.
 * @param {string} filter The active filter ('all', 'online', 'pending').
 * @param {object} lists An object containing pre-filtered lists of friends.
 */
function renderFriendListContent(filter, lists) {
    const contentContainer = document.getElementById('friends-page-content');
    if (!contentContainer) return;

    let listToRender;
    let listHTML;

    if (filter === 'pending') {
        const receivedHTML = lists.pending.received.length > 0 ? `
            <h3 class="col-span-full section-header text-lg font-bold my-4"><i class="fas fa-inbox"></i><span>Received Requests</span></h3>
            ${lists.pending.received.map(user => createFriendCard(user, 'received')).join('')}
        ` : '';
        const sentHTML = lists.pending.sent.length > 0 ? `
            <h3 class="col-span-full section-header text-lg font-bold my-4"><i class="fas fa-paper-plane"></i><span>Sent Requests</span></h3>
            ${lists.pending.sent.map(user => createFriendCard(user, 'sent')).join('')}
        ` : '';

        listHTML = receivedHTML + sentHTML;
        if (!listHTML) {
            listHTML = `<p class="text-center text-gray-500 py-8 col-span-full">No pending requests.</p>`;
        }
    } else {
        listToRender = filter === 'online' ? lists.online : lists.all;
        if (listToRender.length > 0) {
            listHTML = listToRender.map(friend => createFriendCard(friend, 'friends')).join('');
        } else {
            listHTML = `<p class="text-center text-gray-500 py-8 col-span-full">No friends to display in this category.</p>`;
        }
    }
    
    contentContainer.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${listHTML}</div>`;

    // Event listeners are re-attached in the event-listeners module using delegation.
}

/**
 * Creates the HTML string for a single friend card with appropriate actions.
 * @param {object} user The user's data object.
 * @param {('friends'|'received'|'sent')} type The type of relationship to render.
 * @returns {string} The HTML for the friend card.
 */
function createFriendCard(user, type) {
    const avatarUrl = user.avatarUrl || `https://placehold.co/64x64/0D1117/FFFFFF?text=${user.username.charAt(0).toUpperCase()}`;
    const { allAlliances } = getState();
    const allianceData = allAlliances.find(a => a.tag === user.alliance);
    const border = getAvatarBorderClass(user, allianceData);

    let actionsHTML = '';
    switch(type) {
        case 'friends':
            actionsHTML = `
                <button class="message-player-btn friend-action-btn" data-uid="${user.uid}" title="Message"><i class="fas fa-comment-dots"></i></button>
                <button class="remove-friend-btn friend-action-btn remove" data-uid="${user.uid}" title="Remove Friend"><i class="fas fa-user-minus"></i></button>
            `;
            break;
        case 'received':
            actionsHTML = `
                <button class="accept-friend-btn friend-action-btn accept" data-uid="${user.uid}" title="Accept"><i class="fas fa-check"></i></button>
                <button class="decline-friend-btn friend-action-btn remove" data-uid="${user.uid}" title="Decline"><i class="fas fa-times"></i></button>
            `;
            break;
        case 'sent':
            actionsHTML = `
                <button class="cancel-request-btn friend-action-btn" data-uid="${user.uid}" title="Cancel Request"><i class="fas fa-user-clock mr-2"></i>Cancel</button>
            `;
            break;
    }

    return `
        <div class="player-card glass-pane p-4 flex flex-col relative" data-uid="${user.uid}">
            <div class="flex items-center pb-3 border-b player-card-header" style="border-color: rgba(255,255,255,0.1);">
                <div class="avatar-container mr-4">
                    <img src="${avatarUrl}" class="w-12 h-12 rounded-full object-cover ${border.className}" style="${border.style}" alt="${user.username}">
                     <div class="player-badge">[${user.alliance}] ${user.allianceRank}</div>
                </div>
                <div>
                    <h3 class="font-bold text-lg text-white">${user.username}</h3>
                    <p class="text-sm font-semibold" style="color: var(--color-primary);">${(user.power || 0).toLocaleString()} Power</p>
                </div>
            </div>
            <div class="flex-grow my-4">
                 <p class="text-xs text-gray-400">${type === 'sent' ? 'Request Sent' : (type === 'received' ? 'Request Received' : `Friends since...`)}</p>
            </div>
            <div class="flex justify-around items-center pt-3 border-t border-white/10">
                ${actionsHTML}
            </div>
        </div>
    `;
}
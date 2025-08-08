import { getState, updateState } from '../state.js';
import { isUserLeader } from '../utils.js';
import { handleSendMessage, fetchConversations, addFriend } from '../firestore.js'; // Modified import
import { formatMessageTimestamp, autoLinkText, formatTimeAgo, getAvatarSkinClass } from '../utils.js'; // Modified import
import { canDeleteMessage } from '../utils.js';
import { showPrivateMessageModal } from './ui-manager.js'; // Added import
let currentSubmitHandler = null; // To manage the form's event listener
// --- NEW CHAT MANAGEMENT SYSTEM ---

// An object to define our chat channels
const CHAT_CHANNELS = {
    world_chat: {
        id: 'world_chat',
        name: 'World Chat',
        icon: 'fas fa-globe',
        color: 'var(--color-primary)',
        requiresAuth: true
    },
    alliance_chat: {
        id: 'alliance_chat',
        name: 'Alliance',
        icon: 'fas fa-shield-alt',
        color: 'var(--post-color-alliance)',
        requiresAlliance: true
    },
    leadership_chat: {
        id: 'leadership_chat',
        name: 'Leadership',
        icon: 'fas fa-crown',
        color: 'var(--post-color-leadership)',
        requiresLeader: true
    }
};

// Function to build the chat selection list
export function renderChatSelectors() {
    const { currentUserData } = getState();
    const selectorContainer = document.getElementById('social-chat-selector');
    if (!selectorContainer) return;

    selectorContainer.innerHTML = ''; // Clear old selectors
    let availableChannels = [];

    // Determine which channels the user can see
    for (const channelKey in CHAT_CHANNELS) {
        const channel = CHAT_CHANNELS[channelKey];
        if (!currentUserData && channel.requiresAuth) continue;
        if (channel.requiresAlliance && !currentUserData?.alliance) continue;
        if (channel.requiresLeader && !isUserLeader(currentUserData)) continue;
        availableChannels.push(channel);
    }

    // Render the buttons
    availableChannels.forEach(channel => {
        const button = document.createElement('button');
        button.className = 'chat-selector-btn';
        button.dataset.chatId = channel.id;
        button.style.setProperty('--glow-color', channel.color);
        button.innerHTML = `<i class="${channel.icon} fa-fw"></i><span>${channel.name}</span>`;
        selectorContainer.appendChild(button);
    });
}

// Function to activate a specific chat
// Function to activate a specific chat
export function activateChatChannel(chatId) {
    const chatWindow = document.getElementById('chat-window-main');
    const chatInputForm = document.getElementById('chat-input-form');
    const chatInput = document.getElementById('chat-input-main');

    if (!chatWindow || !chatInputForm || !chatInput) {
        console.error("Could not find all necessary chat elements in the DOM.");
        return;
    }

    document.querySelectorAll('.chat-selector-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.chatId === chatId);
    });

    chatWindow.innerHTML = `<p class="text-center text-gray-500 m-auto">Loading messages for ${chatId.replace(/_/g, ' ')}...</p>`;
    chatInputForm.style.display = 'flex';
    chatInput.placeholder = `Type a message in ${chatId.replace('_chat', '')}...`;

    // FIX: Remove the old event listener and add the new one to prevent duplicate IDs from cloneNode
    if (currentSubmitHandler) {
        chatInputForm.removeEventListener('submit', currentSubmitHandler);
    }

    // Define the new handler for the current chat channel
    currentSubmitHandler = function(e) {
        const text = chatInput.value;
        handleSendMessage(e, chatId, text); // Pass the text to the handler
        chatInput.value = ''; // Clear the input for the next message
    };

    // Add the new, specific event listener
    chatInputForm.addEventListener('submit', currentSubmitHandler);
}

// --- EXISTING FUNCTIONS (Modified) ---

export function renderFriendsList() {
    // This now specifically targets the new sidebar on the social page
    const container = document.getElementById('friends-list-social-page');
    const { currentUserData, userFriends, allPlayers, userSessions, isFriendsListCollapsed } = getState();

    // Add this block to handle the initial collapsed state
    const friendsContainer = document.getElementById('friends-list-container-social');
    if (friendsContainer) {
        friendsContainer.classList.toggle('collapsed', isFriendsListCollapsed);
    }

    if (!container) return;

    if (!currentUserData) {
        container.innerHTML = '<p class="text-gray-400 text-center p-4">You must be logged in to see friends.</p>';
        return;
    }
    if (userFriends.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center p-4">You haven\'t added any friends yet.</p>';
        return;
    }

    container.innerHTML = '';
    userFriends.forEach(friendId => {
        const friendData = allPlayers.find(p => p.uid === friendId);
        if (!friendData) return;

        const session = userSessions[friendId];
        const statusClass = session ? session.status : 'offline';
        const avatarUrl = friendData.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${friendData.username.charAt(0).toUpperCase()}`;

        const friendEl = document.createElement('div');
        friendEl.className = 'friend-list-item'; // You already have styles for this
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
            </div>
        `;
        container.appendChild(friendEl);
    });
}

// Keep renderMessages, but we will no longer use renderFriendRequests or updateSocialUITabs
export function renderMessages(messages, container, chatType) {
    const { currentUserData, allPlayers } = getState();
    if (!currentUserData || !container) return;

    // A helper to get the right CSS class for the border
    const getRankBorderClass = (player) => {
        if (player?.isAdmin) return 'rank-border-admin';
        const rank = player?.allianceRank;
        return `rank-border-${rank?.toLowerCase() || 'r1'}`;
    };

    container.innerHTML = ''; // Clear previous messages
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
        const borderClass = getRankBorderClass(authorData);
        const avatarBorder = authorData?.avatarBorder || 'avatar-border-common';
        const chatBubbleBorder = authorData?.chatBubbleBorder || 'chat-bubble-border-common';
        const avatarSkin = getAvatarSkinClass(authorData);
    
        // --- Determine which action buttons to show ---
        const canEdit = isSelf;
        const canDelete = canDeleteMessage(currentUserData, authorData);
        let messageActionsHTML = '';
        if (canEdit || canDelete) {
            messageActionsHTML = `
                <div class="message-actions">
                    ${canDelete ? `<button class="message-action-btn delete-message-btn" title="Delete"><i class="fas fa-times"></i></button>` : ''}
                </div>
            `;
        }

        // --- REACTION LOGIC ---
        const reactions = msg.reactions || {};
        const reactionPillsHTML = Object.entries(reactions)
            .map(([emoji, userMap]) => {
                const count = Object.keys(userMap).length;
                if (count === 0) return '';
                const hasReacted = currentUserData.uid in userMap;
                const tooltipText = Object.values(userMap).join(', ');
                return `<div class="reaction-pill ${hasReacted ? 'reacted' : ''}" data-emoji="${emoji}" data-tooltip="${tooltipText}"><span class="emoji">${emoji}</span><span class="count">${count}</span><div class="reaction-tooltip">${tooltipText}</div></div>`;
            }).join('');

        // --- MESSAGE CONTENT ---
        let messageContent = `<p class="chat-message-author">${authorUsername}</p>`;
        if (msg.text) messageContent += `<p>${autoLinkText(msg.text)}</p>`;
        if (msg.imageUrl) messageContent += `<img src="${msg.imageUrl}" class="chat-message-image" alt="User uploaded image">`;

        // --- FINAL ASSEMBLY ---
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${isSelf ? 'self' : ''}`;
        messageEl.innerHTML = `
        <div class="chat-message-identity">
             <div class="avatar-container">
                <div class="w-10 h-10 rounded-full ${avatarSkin} ${avatarBorder} p-0.5">
                    <img src="${avatarUrl}" class="w-full h-full rounded-full object-cover" alt="${authorUsername}">
                </div>
                <div class="player-badge">[${authorData?.alliance || '?'}] ${authorData?.allianceRank || '?'}</div>                
            </div>
                <p class="chat-message-timestamp">${timestamp}</p>
                ${messageActionsHTML}
            </div>
            <div class="chat-message-main">
                <div class="chat-message-bubble ${borderClass} ${chatBubbleBorder}" data-message-id="${msg.id}" data-chat-type="${chatType}">
                    ${messageContent}
                </div>
                <div class="chat-reactions-container">${reactionPillsHTML}</div>
            </div>
        `;
        container.appendChild(messageEl);
    });
    
    // Scroll to the bottom of the chat window
    container.scrollTop = container.scrollHeight;
}
export async function renderConversations() {
    const container = document.getElementById('sub-page-social-convo');
    if (!container) return;

    // Add a header and a container for the list
    container.innerHTML = `<h2 class="text-3xl font-bold text-white tracking-wider text-center mb-6" style="text-shadow: 0 0 10px var(--color-primary);">Recent Interactions</h2><div id="convo-list" class="space-y-3 max-w-4xl mx-auto"></div>`;
    const listContainer = document.getElementById('convo-list');
    listContainer.innerHTML = `<p class="text-center text-gray-400 py-8">Loading conversations...</p>`;

    const conversations = await fetchConversations();
    const { allPlayers, userSessions } = getState();

    if (conversations.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-gray-400 py-8">No recent conversations. Start one from the Players page!</p>`;
        return;
    }
    
    // Sort by the timestamp of the last message
    conversations.sort((a, b) => b.lastMessage.timestamp.toDate() - a.lastMessage.timestamp.toDate());

    listContainer.innerHTML = conversations.map(convo => {
        const partnerData = allPlayers.find(p => p.uid === convo.partnerId);
        if (!partnerData) return ''; // Skip if partner data isn't loaded yet

        const session = userSessions[convo.partnerId];
        const statusClass = session ? session.status : 'offline';
        const avatarUrl = partnerData.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${partnerData.username.charAt(0).toUpperCase()}`;

        let lastMessageText = convo.lastMessage.text;
        if (convo.lastMessage.imageUrl && !lastMessageText) {
            lastMessageText = '<i>[Image]</i>';
        }
        
        return `
            <div class="convo-item glass-pane p-4 flex items-center justify-between hover:bg-white/5 transition-colors duration-200 cursor-pointer rounded-lg" data-partner-uid="${partnerData.uid}">
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
                    <span class="text-xs text-gray-500">${formatTimeAgo(convo.lastMessage.timestamp.toDate())}</span>
                    <button class="text-gray-500 hover:text-yellow-400 transition-colors" title="Pin Conversation (coming soon)">
                        <i class="fas fa-thumbtack"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners to open the chat modal when an item is clicked
    listContainer.querySelectorAll('.convo-item').forEach(el => {
        el.addEventListener('click', () => {
            const partnerId = el.dataset.partnerUid;
            const partnerData = allPlayers.find(p => p.uid === partnerId);
            if(partnerData) {
                showPrivateMessageModal(partnerData);
            }
        });
    });
}

// NEW: Renders the dedicated Friends page
export function renderFriendsPage() {
    const container = document.getElementById('sub-page-social-friends');
    if (!container) return;

    const { userFriends, allPlayers } = getState();

    // Alphabetical sort
    const friendsData = userFriends
        .map(friendId => allPlayers.find(p => p.uid === friendId))
        .filter(Boolean) // Remove any undefined friends
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

    // Add listener for the main "Add Friend" button to navigate to the players page
    document.getElementById('add-friend-main-btn').addEventListener('click', () => {
        showPage('page-players');
    });
    
    // Add listeners for the message buttons
    document.getElementById('friends-page-list').addEventListener('click', (e) => {
        const messageBtn = e.target.closest('.message-player-btn');
        if(messageBtn) {
            const partnerData = allPlayers.find(p => p.uid === messageBtn.dataset.uid);
            if(partnerData) showPrivateMessageModal(partnerData);
        }
    });
}
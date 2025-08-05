import { getState, updateState } from '../state.js';
import { isUserLeader } from '../utils.js';
import { handleSendMessage } from '../firestore.js';
import { formatMessageTimestamp, autoLinkText } from '../utils.js';
import { positionEmojiPicker } from '../utils.js';
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

    const newForm = chatInputForm.cloneNode(true);
    chatInputForm.parentNode.replaceChild(newForm, chatInputForm);
    newForm.addEventListener('submit', (e) => {
        // Find the input within the newly cloned form
        const input = newForm.querySelector('#chat-input-main');
        const text = input.value;

        // Pass the text to the handler
        handleSendMessage(e, chatId, text);

        // Clear the input for the next message
        input.value = '';
    });
}

// --- EXISTING FUNCTIONS (Modified) ---

export function renderFriendsList() {
    // This now specifically targets the new sidebar on the social page
    const container = document.getElementById('friends-list-social-page');
    const { currentUserData, userFriends, allPlayers, userSessions } = getState();

    if (!container) return; // Only run if we are on the social page

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

    container.innerHTML = ''; // Clear previous messages
    if (messages.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 m-auto">No messages yet. Be the first to say something!</p>`;
        return;
    }

    // CRITICAL FIX: The query returns newest messages first. We MUST reverse this
    // to get oldest-first before rendering. The CSS will then display it correctly.
    const orderedMessages = messages.reverse();

   orderedMessages.forEach(msg => {
    const isSelf = msg.authorUid === currentUserData.uid;
    const authorUsername = msg.authorUsername || '?';
    const authorData = allPlayers.find(p => p.uid === msg.authorUid);
    const avatarUrl = authorData?.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${authorUsername.charAt(0).toUpperCase()}`;
    const timestamp = msg.timestamp ? formatMessageTimestamp(msg.timestamp.toDate()) : '';

    // --- REACTION LOGIC ---
    const reactions = msg.reactions || {};
    const reactionPillsHTML = Object.entries(reactions)
        .map(([emoji, userMap]) => {
            const userList = Object.values(userMap);
            const count = userList.length;
            if (count === 0) return '';

            const hasReacted = currentUserData.uid in userMap;
            const tooltipText = userList.join(', ');

            return `
                <div class="reaction-pill ${hasReacted ? 'reacted' : ''}" data-emoji="${emoji}" data-tooltip="${tooltipText}">
                    <span class="emoji">${emoji}</span>
                    <span class="count">${count}</span>
                    <div class="reaction-tooltip">${tooltipText}</div>
                </div>
            `;
        })
        .join('');

    // --- MESSAGE CONTENT ---
    let messageContent = '';
    if (msg.text) {
        messageContent += `<p>${autoLinkText(msg.text)}</p>`;
    }
    if (msg.imageUrl) {
        messageContent += `<img src="${msg.imageUrl}" class="chat-message-image" alt="User uploaded image">`;
    }

    const messageActionsHTML = isSelf ? `
            <div class="message-actions">
                <button class="message-action-btn edit-message-btn" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                <button class="message-action-btn delete-message-btn" title="Delete"><i class="fas fa-times"></i></button>
            </div>
        ` : '';

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${isSelf ? 'self' : ''}`;
        messageEl.dataset.id = msg.id; // Add message ID for reactions
        messageEl.dataset.type = chatType; // Add chat type for reactions

        messageEl.innerHTML = `
            <div class="chat-message-identity">
                 <img src="${avatarUrl}" class="w-10 h-10 rounded-full flex-shrink-0" alt="${authorUsername}">
                 <p class="chat-message-timestamp">${timestamp}</p>
            </div>
            <div class="chat-message-main">
                ${messageActionsHTML}
                <div class="chat-message-bubble">
    `;
    container.appendChild(messageEl);
});
}
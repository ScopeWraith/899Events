// js/ui.js
import { formatTimeAgo, formatEventDateTime, formatDuration, getEventStatus, getRankColor, isUserLeader } from './utils.js';
import { POST_TYPES, POST_STYLES, ALLIANCES, ALLIANCE_RANKS, ALLIANCE_ROLES, DAYS_OF_WEEK, HOURS_OF_DAY, REPEAT_TYPES } from './constants.js';

/**
 * This file handles all direct DOM manipulation and UI rendering.
 */

// --- DOM Element Selectors ---
export const DOMElements = {
    mainNav: document.getElementById('main-nav'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    eventsPage: document.getElementById('page-events'),
    socialPage: document.getElementById('page-social'),
    playersPage: document.getElementById('page-players'),
    // Add other elements as needed
};

// --- State and Modal functions (assumed to be correct and unchanged) ---
export function showPage(targetId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = page.id === targetId ? 'block' : 'none';
    });
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.mainTarget === targetId);
    });
}


// --- Initial Page Rendering ---
function initializePageHTML() {
    DOMElements.eventsPage.innerHTML = `
        <main id="events-main-container" class="space-y-6">
            <div id="filter-container" class="filter-btn-group"></div>
            <div id="announcements-container" class="space-y-4"></div>
            <div id="events-section-container" class="space-y-4"></div>
        </main>
    `;

    DOMElements.playersPage.innerHTML = `
        <div class="glass-pane section-container">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-white tracking-wider" style="text-shadow: 0 0 10px var(--color-primary);">PLAYERS OF 899</h2>
            </div>
            <div class="flex flex-col md:flex-row gap-4 mb-6">
                <div class="input-group flex-grow">
                    <i class="fas fa-search input-icon"></i>
                    <input type="text" id="player-search-input" placeholder="Search by player name..." class="form-input">
                </div>
                <div class="input-group md:max-w-xs">
                    <i class="fas fa-shield-alt input-icon"></i>
                    <div class="custom-select-container" data-type="alliance-filter">
                        <input type="hidden" id="alliance-filter" name="alliance-filter">
                        <button type="button" class="custom-select-value form-input"><span>All Alliances</span><i class="fas fa-chevron-down text-xs"></i></button>
                        <div class="custom-select-options">
                            <div class="options-list"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="player-list-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
        </div>
    `;

    DOMElements.socialPage.innerHTML = `
        <div class="glass-pane section-container">
            <div class="flex flex-col md:flex-row gap-6">
                <!-- Main Chat Area -->
                <div class="flex-grow md:w-2/3">
                    <div id="social-tabs-container" class="social-tabs flex items-center mb-4">
                        <button class="social-tab-btn active" data-tab="world-chat"><i class="fas fa-globe mr-2"></i>World</button>
                        <button id="alliance-tab-btn" class="social-tab-btn" data-tab="alliance-chat"><i class="fas fa-shield-alt mr-2"></i>Alliance</button>
                        <button id="leadership-tab-btn" class="social-tab-btn" data-tab="leadership-chat"><i class="fas fa-crown mr-2"></i>Leadership</button>
                    </div>
                    <div id="pane-world-chat" class="social-content-pane active"></div>
                    <div id="pane-alliance-chat" class="social-content-pane"></div>
                    <div id="pane-leadership-chat" class="social-content-pane"></div>
                </div>
                <!-- Friends/Side Panel -->
                <div class="md:w-1/3 flex-shrink-0 space-y-4">
                    <div>
                        <h3 class="section-header text-lg font-bold mb-2"><i class="fas fa-user-friends"></i> Friends</h3>
                        <div id="friends-list" class="space-y-2"></div>
                    </div>
                    <div>
                        <h3 class="section-header text-lg font-bold mb-2"><i class="fas fa-inbox"></i> Friend Requests</h3>
                        <div id="friend-requests-list" class="space-y-2"></div>
                    </div>
                    <div>
                        <h3 class="section-header text-lg font-bold mb-2"><i class="fas fa-paper-plane"></i> Sent Requests</h3>
                        <div id="sent-requests-list" class="space-y-2"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- Rendering Functions ---
export function renderSkeletons() {
    initializePageHTML();
    const skeletonHTML = `
        <div class="post-card skeleton-card">
            <div class="post-card-thumbnail-wrapper"><div class="post-card-thumbnail skeleton-loader"></div></div>
            <div class="post-card-body">
                <div class="post-card-content">
                    <div class="skeleton-loader h-5 w-24 mb-2"></div>
                    <div class="skeleton-loader h-8 w-4/5"></div>
                    <div class="skeleton-loader h-4 w-full mt-2"></div>
                </div>
                <div class="post-card-status">
                    <div class="skeleton-loader h-4 w-16 mb-2"></div>
                    <div class="skeleton-loader h-7 w-24"></div>
                </div>
            </div>
        </div>`;
    
    document.getElementById('announcements-container').innerHTML = `
        <div class="section-header text-xl font-bold mb-4" style="--glow-color: var(--color-highlight);"><i class="fas fa-bullhorn"></i><span>Announcements</span></div>
        <div class="grid grid-cols-1 gap-4">${skeletonHTML}</div>`;
    
    document.getElementById('events-section-container').innerHTML = `
        <div class="section-header text-xl font-bold mb-4"><i class="fas fa-calendar-alt"></i><span>Events</span></div>
        <div class="grid grid-cols-1 gap-4">${skeletonHTML.repeat(2)}</div>`;

    document.getElementById('player-list-container').innerHTML = `<p class="text-center col-span-full py-8 text-gray-400">Loading players...</p>`;
    
    document.getElementById('pane-world-chat').innerHTML = renderChatPane('world-chat');
    document.getElementById('pane-alliance-chat').innerHTML = renderChatPane('alliance-chat');
    document.getElementById('pane-leadership-chat').innerHTML = renderChatPane('leadership-chat');
}

/**
 * --- FIX ---
 * Added the 'export' keyword to renderPosts and other key rendering functions.
 * This makes them available for import in app.js and resolves the error.
 */
export function renderPosts(allPosts, currentUserData) {
    const announcementsContainer = document.getElementById('announcements-container');
    const eventsSectionContainer = document.getElementById('events-section-container');

    if (!announcementsContainer || !eventsSectionContainer) return;
    
    let visiblePosts = allPosts.filter(post => {
        if (!currentUserData) return post.visibility === 'public';
        if (post.visibility === 'public') return true;
        if (currentUserData.isAdmin) return true;
        if (post.visibility === 'alliance' && post.alliance === currentUserData.alliance) return true;
        return false;
    });

    const announcements = visiblePosts.filter(p => p.mainType === 'announcement');
    const events = visiblePosts.filter(p => p.mainType === 'event');

    announcementsContainer.innerHTML = `<div class="section-header text-xl font-bold mb-4" style="--glow-color: var(--color-highlight);"><i class="fas fa-bullhorn"></i><span>Announcements</span></div>` + 
        (announcements.length > 0 ? `<div class="grid grid-cols-1 gap-4">${announcements.map(p => createCard(p, currentUserData)).join('')}</div>` : `<p class="text-center text-gray-500 py-4">No announcements.</p>`);

    eventsSectionContainer.innerHTML = `<div class="section-header text-xl font-bold mb-4"><i class="fas fa-calendar-alt"></i><span>Events</span></div>` +
        (events.length > 0 ? `<div class="grid grid-cols-1 gap-4">${events.map(p => createCard(p, currentUserData)).join('')}</div>` : `<p class="text-center text-gray-500 py-4">No events.</p>`);
}

function createCard(post, currentUserData) {
    // ... (implementation unchanged)
    const style = POST_STYLES[post.subType] || {};
    const isEvent = post.mainType === 'event';
    const color = style.color || 'var(--color-primary)';
    const headerStyle = post.thumbnailUrl ? `background-image: url('${post.thumbnailUrl}')` : `background-color: #101419;`;
    const postDate = post.createdAt?.toDate();
    const timestamp = postDate ? formatTimeAgo(postDate) : '...';
    
    const postTypeText = POST_TYPES[`${post.mainType}_${post.subType}`]?.text || post.subType.replace(/_/g, ' ').toUpperCase();

    let actionsTriggerHTML = '';
    if (currentUserData && (currentUserData.isAdmin || post.authorUid === currentUserData.uid)) {
        actionsTriggerHTML = `<button class="post-card-actions-trigger" data-post-id="${post.id}" title="Post Options"><i class="fas fa-cog"></i></button>`;
    }

    let statusContentHTML = isEvent
        ? `<div class="status-content-wrapper"></div><div class="status-date"></div>`
        : `<div class="status-content-wrapper"><div class="status-label" title="${postDate?.toLocaleString() || ''}">Posted</div><div class="status-time">${timestamp}</div></div><div class="status-date">${postDate ? postDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}</div>`;

    return `
        <div class="post-card ${isEvent ? 'event-card' : 'announcement-card'}" data-post-id="${post.id}" style="--glow-color: ${color};">
            <div class="post-card-thumbnail-wrapper">
                <div class="post-card-thumbnail" style="${headerStyle}"></div>
                ${actionsTriggerHTML}
            </div>
            <div class="post-card-body">
                <div class="post-card-content">
                    <div class="post-card-header"><span class="post-card-category" style="background-color: ${color};">${postTypeText}</span></div>
                    <h3 class="post-card-title">${post.title}</h3>
                    <p class="post-card-details">${post.details}</p>
                </div>
                <div class="post-card-status">${statusContentHTML}</div>
            </div>
        </div>`;
}

export function updateUIForLoggedInUser(user) {
    const usernameDisplay = document.getElementById('username-display');
    const userAvatarButton = document.getElementById('user-avatar-button');
    const playerCardInfo = document.getElementById('player-card-info');
    
    DOMElements.loginBtn.classList.add('hidden');
    document.getElementById('user-profile-container').classList.remove('hidden');
    if(usernameDisplay) usernameDisplay.textContent = user.username;
    if(userAvatarButton) userAvatarButton.src = user.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${user.username.charAt(0).toUpperCase()}`;
    if(playerCardInfo) playerCardInfo.innerHTML = `
        <p class="text-sm text-gray-400">Alliance: <strong class="text-white">[${user.alliance}] ${user.allianceRank}</strong></p>
        <p class="text-sm text-gray-400">Power: <strong class="text-white">${(user.power || 0).toLocaleString()}</strong></p>
    `;
}

export function updateUIForLoggedOutUser() {
    DOMElements.loginBtn.classList.remove('hidden');
    document.getElementById('user-profile-container').classList.add('hidden');
}

export function updateSocialTabPermissions(currentUserData) {
    const allianceTab = document.getElementById('alliance-tab-btn');
    const leadershipTab = document.getElementById('leadership-tab-btn');

    if (!allianceTab || !leadershipTab) return;

    if (!currentUserData || !currentUserData.alliance || !currentUserData.isVerified) {
        allianceTab.disabled = true;
        allianceTab.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        allianceTab.disabled = false;
        allianceTab.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    if (!currentUserData || !isUserLeader(currentUserData)) {
        leadershipTab.disabled = true;
        leadershipTab.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        leadershipTab.disabled = false;
        leadershipTab.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

export function renderPlayers(players, currentUserData) {
    const container = document.getElementById('player-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    if (players.length === 0) {
        container.innerHTML = `<p class="text-center col-span-full py-8 text-gray-400">No players found.</p>`;
        return;
    }
    players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card glass-pane p-4 flex flex-col relative';
        card.dataset.uid = player.uid;

        let gearIconHTML = '';
        if (currentUserData && currentUserData.uid !== player.uid && (currentUserData.isAdmin || (currentUserData.alliance === player.alliance && (currentUserData.allianceRank === 'R5' || currentUserData.allianceRank === 'R4')))) {
            gearIconHTML = `<button class="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors player-settings-btn" data-uid="${player.uid}"><i class="fas fa-cog"></i></button>`;
        }
        
        const avatarUrl = player.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${player.username.charAt(0).toUpperCase()}`;

        card.innerHTML = `
            ${gearIconHTML}
            <div class="flex items-center pb-3 border-b" style="border-color: rgba(255,255,255,0.1);">
                <img src="${avatarUrl}" class="w-12 h-12 rounded-full mr-4 border-2 object-cover" style="border-color: rgba(255,255,255,0.2);" alt="${player.username}" onerror="this.src='https://placehold.co/48x48/0D1117/FFFFFF?text=?';">
                <div>
                    <h3 class="font-bold text-lg text-white">${player.username}</h3>
                    <p class="text-sm font-semibold" style="color: var(--color-primary);">[${player.alliance}] - ${player.allianceRank}</p>
                </div>
            </div>
            <div class="flex-grow my-4 space-y-3">
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-400 flex items-center"><i class="fas fa-fist-raised w-6 text-center mr-2" style="color: var(--color-primary);"></i>Total Power</span>
                    <span class="font-bold text-white">${(player.power || 0).toLocaleString()}</span>
                </div>
            </div>
            <div class="flex justify-around items-center pt-3 border-t border-white/10">
                <button class="text-gray-400 hover:text-white transition-colors !text-lg" title="Message Player" data-action="message" data-uid="${player.uid}"><i class="fas fa-comment-dots"></i></button>
                <button class="text-gray-400 hover:text-white transition-colors !text-lg" title="Add Friend" data-action="add-friend" data-uid="${player.uid}"><i class="fas fa-user-plus"></i></button>
            </div>
        `;
        container.appendChild(card);
    });
}

export function renderChatPane(type) {
    return `
        <div id="${type}-window" class="chat-window p-2">
            <p class="text-center text-gray-500 m-auto">Loading messages...</p>
        </div>
        <form id="${type}-form" class="mt-4">
            <div class="input-group">
                <input type="text" id="${type}-input" class="form-input" placeholder="Type a message...">
                <button type="submit" class="p-3 text-white" style="background-color: var(--color-primary);"><i class="fas fa-paper-plane"></i></button>
            </div>
        </form>
    `;
}

export function renderMessages(messages, container, chatType, allPlayers, currentUserData) {
    if (!container) return;
    container.innerHTML = '';
    if (messages.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 m-auto">No messages yet.</p>`;
        return;
    }
    messages.forEach(msg => {
        const isSelf = msg.authorUid === currentUserData.uid;
        const canDelete = currentUserData.isAdmin || (isSelf);
        
        const author = allPlayers.find(p => p.uid === msg.authorUid);
        const rankColor = author ? getRankColor(author.allianceRank, author.isAdmin) : 'transparent';
        const avatarUrl = msg.authorAvatarUrl || `https://placehold.co/40x40/0D1117/FFFFFF?text=${(msg.authorUsername || '?').charAt(0).toUpperCase()}`;
        const timestamp = msg.timestamp?.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit'}) || '';

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${isSelf ? 'self' : ''}`;
        messageEl.innerHTML = `
            <img src="${avatarUrl}" class="w-8 h-8 rounded-full flex-shrink-0 object-cover self-end mb-4" alt="${msg.authorUsername}">
            <div class="chat-message-content">
                <div class="chat-message-bubble" style="border: 1px solid ${rankColor};">
                    <div class="chat-message-header">
                        <span class="chat-message-author">${msg.authorUsername}</span>
                        <span class="chat-message-timestamp">${timestamp}</span>
                    </div>
                    <p class="text-sm">${msg.text}</p>
                </div>
            </div>
            ${canDelete ? `<button class="delete-message-btn" data-id="${msg.id}" data-type="${chatType}"><i class="fas fa-times"></i></button>` : ''}
        `;
        container.appendChild(messageEl);
    });
}

export function renderFriendsLists(friendsData, allPlayers) {
    const friendsContainer = document.getElementById('friends-list');
    const requestsContainer = document.getElementById('friend-requests-list');
    const sentContainer = document.getElementById('sent-requests-list');

    if (!friendsContainer || !requestsContainer || !sentContainer) return;

    const friends = friendsData.filter(f => f.status === 'accepted');
    const requests = friendsData.filter(f => f.status === 'pending_received');
    const sent = friendsData.filter(f => f.status === 'pending_sent');

    friendsContainer.innerHTML = friends.length > 0 ? friends.map(f => createFriendHTML(allPlayers.find(p => p.uid === f.id), 'friend')).join('') : `<p class="text-xs text-gray-500 text-center">No friends yet.</p>`;
    requestsContainer.innerHTML = requests.length > 0 ? requests.map(f => createFriendHTML(allPlayers.find(p => p.uid === f.id), 'request')).join('') : `<p class="text-xs text-gray-500 text-center">No new requests.</p>`;
    sentContainer.innerHTML = sent.length > 0 ? sent.map(f => createFriendHTML(allPlayers.find(p => p.uid === f.id), 'sent')).join('') : `<p class="text-xs text-gray-500 text-center">No sent requests.</p>`;
}

function createFriendHTML(playerData, type) {
    if (!playerData) return '';
    const avatarUrl = playerData.avatarUrl || `https://placehold.co/40x40/0D1117/FFFFFF?text=${(playerData.username || '?').charAt(0).toUpperCase()}`;
    
    let actionsHTML = '';
    if (type === 'friend') {
        actionsHTML = `<button class="friend-action-btn decline" data-action="remove" data-uid="${playerData.uid}">Remove</button>`;
    } else if (type === 'request') {
        actionsHTML = `<button class="friend-action-btn accept" data-action="accept" data-uid="${playerData.uid}">Accept</button> <button class="friend-action-btn decline" data-action="decline" data-uid="${playerData.uid}">Decline</button>`;
    } else if (type === 'sent') {
        actionsHTML = `<button class="friend-action-btn decline" data-action="cancel" data-uid="${playerData.uid}">Cancel</button>`;
    }

    return `
        <div class="friend-list-item" data-uid="${playerData.uid}">
            <img src="${avatarUrl}" class="w-8 h-8 rounded-full mr-3 object-cover" alt="${playerData.username}">
            <div class="flex-grow">
                <p class="font-semibold text-white text-sm">${playerData.username}</p>
                <p class="text-xs text-gray-400">[${playerData.alliance}]</p>
            </div>
            <div class="flex items-center gap-2">${actionsHTML}</div>
        </div>`;
}

export function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
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

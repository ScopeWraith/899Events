// code/js/ui/players-ui.js

import { subscribe, getState } from '../state.js';
import { canManageUser, getAvatarBorderClass} from '../utils.js';

// --- STATE & RENDER FUNCTIONS ---

/**
 * Renders the players UI when the list of players or the current user's data changes.
 * @param {object} newState The new, updated state object.
 * @param {object} prevState The previous state object.
 */
function renderPlayersUI(newState, prevState) {
    // Re-render the player list if the list of players or the current user changes.
    if (newState.allPlayers !== prevState.allPlayers || newState.currentUserData !== prevState.currentUserData) {
        applyPlayerFilters();
    }
}

/**
 * Initializes the players UI module by subscribing its render function to the application state.
 */
export function initializePlayersUI() {
    subscribe(renderPlayersUI);
}

// --- UI HELPER & RENDERING FUNCTIONS ---

/**
 * Applies the current search and filter criteria to the list of all players and triggers a re-render.
 */
export function applyPlayerFilters() {
    const playerListContainer = document.getElementById('player-list-container');
    if (!playerListContainer) {
        return;
    }

    const { allPlayers } = getState();
    // --- FIX: ADD THIS GUARD CLAUSE ---
    if (!allPlayers) {
        // If players aren't loaded yet, we can render skeletons or just exit.
        renderPlayers(null); // Passing null will trigger the skeleton loader
        return;
    }

    const searchTermInput = document.getElementById('player-search-input');
    const allianceFilterInput = document.getElementById('alliance-filter');

    const searchTerm = searchTermInput ? searchTermInput.value.toLowerCase() : '';
    const allianceFilter = allianceFilterInput ? allianceFilterInput.value : '';

    const filteredPlayers = allPlayers.filter(player => {
        if (!player.username) return false;
        const nameMatch = player.username.toLowerCase().includes(searchTerm);
        const allianceMatch = !allianceFilter || player.alliance === allianceFilter;
        return nameMatch && allianceMatch;
    });
    renderPlayers(filteredPlayers);
}

/**
 * Creates the HTML string for a single player card skeleton loader.
 * @returns {string} The HTML for a skeleton card.
 */
function createPlayerSkeletonCard() {
    return `
        <div class="player-card glass-pane p-4 flex flex-col opacity-50">
            <div class="flex items-center pb-3 border-b" style="border-color: rgba(255,255,255,0.1);">
                <div class="w-12 h-12 rounded-full skeleton-loader mr-4"></div>
                <div class="w-full">
                    <div class="h-5 w-3/5 skeleton-loader mb-2"></div>
                    <div class="h-4 w-2/5 skeleton-loader"></div>
                </div>
            </div>
            <div class="flex-grow my-4 space-y-3">
                <div class="h-5 w-full skeleton-loader"></div>
                <div class="h-5 w-full skeleton-loader"></div>
                <div class="h-5 w-full skeleton-loader"></div>
                <div class="h-5 w-full skeleton-loader"></div>
            </div>
        </div>
    `;
}

/**
 * Renders a list of player cards into the DOM.
 * If the `players` argument is null, it renders skeleton loaders instead.
 * @param {Array<object>|null} players An array of player data objects, or null to show loaders.
 */
export function renderPlayers(players) {
    const playerListContainer = document.getElementById('player-list-container');
    if (!playerListContainer) return;

    const { currentUserData, userSessions, allAlliances } = getState();
    playerListContainer.innerHTML = '';

    if (players === null) { // Data is loading, show skeletons
        let skeletonHTML = '';
        for (let i = 0; i < 8; i++) {
            skeletonHTML += createPlayerSkeletonCard();
        }
        playerListContainer.innerHTML = skeletonHTML;
        return;
    }
    if (players.length === 0) {
        playerListContainer.innerHTML = `<p class="text-center col-span-full py-8 text-gray-400">No players match the current filters.</p>`;
        return;
    }

    players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card glass-pane p-4 flex flex-col relative';
        card.dataset.rank = player.allianceRank;
        card.dataset.uid = player.uid;

        let gearIconHTML = '';
        if (currentUserData && currentUserData.uid !== player.uid) {
            if (canManageUser(currentUserData, player)) {
                gearIconHTML = `<button class="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors player-settings-btn" data-uid="${player.uid}"><i class="fas fa-cog"></i></button>`;
            }
        }

        const avatarUrl = player.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${player.username.charAt(0).toUpperCase()}`;
        const session = userSessions ? userSessions[player.uid] : null;
        const statusClass = session ? session.status : 'offline';
        const allianceData = allAlliances ? allAlliances.find(a => a.tag === player.alliance) : null;
        const border = getAvatarBorderClass(player, allianceData);
        const unverifiedClass = player.isVerified ? '' : 'unverified-player-text';

        // --- START: LOGIC FOR PROFILE LIKES ---
        const hasLiked = currentUserData && player.likedBy && player.likedBy.includes(currentUserData.uid);
        const likeBtnDisabled = !currentUserData || currentUserData.uid === player.uid;
        const likeBtnClass = hasLiked ? 'text-blue-400' : 'text-gray-400';
        const likeCount = player.likes || 0;
        // --- END: LOGIC FOR PROFILE LIKES ---

        card.innerHTML = `
            ${gearIconHTML}
            <div class="flex items-center pb-3 border-b player-card-header" style="border-color: rgba(255,255,255,0.1);">
                <div class="avatar-container mr-4">
                    <img src="${avatarUrl}" class="w-12 h-12 rounded-full object-cover ${border.className}" style="${border.style}" alt="${player.username}" onerror="this.src='https://placehold.co/48x48/0D1117/FFFFFF?text=?';">
                    <div class="player-badge ${unverifiedClass}">[${player.alliance}] ${player.allianceRank}</div>
                </div>
                <div>
                    <h3 class="font-bold text-lg text-white flex items-center">${player.username} <span class="status-dot ${statusClass} ml-2"></span></h3>
                    <p class="text-sm font-semibold ${unverifiedClass}" style="color: var(--color-primary);">[${player.alliance}] - ${player.allianceRank}</p>
                </div>
            </div>
            <div class="flex-grow my-4 space-y-3">
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-400 flex items-center"><i class="fas fa-fist-raised w-6 text-center mr-2" style="color: var(--color-primary);"></i>Total Power</span>
                    <span class="font-bold text-white">${(player.power || 0).toLocaleString()}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-400 flex items-center"><i class="fas fa-truck-monster w-6 text-center mr-2" style="color: var(--color-primary);"></i>Tank Power</span>
                    <span class="font-bold text-white">${(player.tankPower || 0).toLocaleString()}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-400 flex items-center"><i class="fas fa-fighter-jet w-6 text-center mr-2" style="color: var(--color-primary);"></i>Air Power</span>
                    <span class="font-bold text-white">${(player.airPower || 0).toLocaleString()}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-400 flex items-center"><i class="fas fa-rocket w-6 text-center mr-2" style="color: var(--color-primary);"></i>Missile Power</span>
                    <span class="font-bold text-white">${(player.missilePower || 0).toLocaleString()}</span>
                </div>
            </div>
            <div class="flex justify-around items-center pt-3 border-t border-white/10">
                <button class="message-player-btn text-gray-400 hover:text-white transition-colors !text-lg" title="Message Player"><i class="fas fa-comment-dots"></i></button>
                <button class="add-friend-btn text-gray-400 hover:text-white transition-colors !text-lg" title="Add Friend"><i class="fas fa-user-plus"></i></button>
                <button class="like-profile-btn ${likeBtnClass} hover:text-white transition-colors !text-lg flex items-center gap-2" title="Like Profile" ${likeBtnDisabled ? 'disabled' : ''}>
                    <i class="fas fa-thumbs-up"></i>
                    <span class="font-bold text-sm">${likeCount}</span>
                </button>
                </div>
        `;
        playerListContainer.appendChild(card);
    });
}
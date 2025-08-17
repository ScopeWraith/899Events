// code/js/ui/players-ui.js

import { subscribe, getState } from '../state.js';
import { canManageUser, getAvatarBorderClass} from '../utils.js';

// --- STATE & RENDER FUNCTIONS ---

function renderPlayersUI(newState, prevState) {
    // Re-render the player list if the list of players or the current user changes.
    if (newState.allPlayers !== prevState.allPlayers || newState.currentUserData !== prevState.currentUserData) {
        applyPlayerFilters();
    }
}

export function initializePlayersUI() {
    subscribe(renderPlayersUI);
}

// --- UI HELPER & RENDERING FUNCTIONS ---

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

function createPlayerSkeletonCard() {
    // Updated skeleton to match the new compact layout
    return `
        <div class="player-card is-loading">
            <div class="player-card-main-content">
                <div class="player-card-avatar-loader"></div>
                <div class="player-card-info-loader">
                    <div class="skeleton-loader w-3/4 h-5 mb-2"></div>
                    <div class="skeleton-loader w-1/2 h-4 mb-3"></div>
                    <div class="skeleton-loader w-1/3 h-6"></div>
                </div>
            </div>
        </div>
    `;
}

export function renderPlayers(players) {
    const playerListContainer = document.getElementById('player-list-container');
    if (!playerListContainer) return;

    const { currentUserData, userSessions, allAlliances } = getState();
    playerListContainer.innerHTML = '';

    if (players === null) { // Data is loading, show skeletons
        let skeletonHTML = '';
        for (let i = 0; i < 12; i++) { // Increased skeleton count for smaller cards
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
        card.className = 'player-card';
        card.dataset.rank = player.allianceRank;
        card.dataset.uid = player.uid;

        let gearIconHTML = '';
        if (currentUserData && currentUserData.uid !== player.uid) {
            if (canManageUser(currentUserData, player)) {
                gearIconHTML = `<button class="player-card-settings-btn" data-uid="${player.uid}"><i class="fas fa-cog"></i></button>`;
            }
        }

        const avatarUrl = player.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${player.username.charAt(0).toUpperCase()}`;
        const session = userSessions ? userSessions[player.uid] : null;
        const statusClass = session ? session.status : 'offline';
        const allianceData = allAlliances ? allAlliances.find(a => a.tag === player.alliance) : null;
        const border = getAvatarBorderClass(player, allianceData);
        const unverifiedClass = player.isVerified ? '' : 'unverified';

        card.innerHTML = `
            ${gearIconHTML}
            <div class="player-card-main-content">
                <div class="player-card-avatar-wrapper">
                    <img src="${avatarUrl}" class="player-card-avatar ${border.className}" style="${border.style}" alt="${player.username}" onerror="this.src='https://placehold.co/48x48/0D1117/FFFFFF?text=?';">
                    <span class="status-dot ${statusClass}"></span>
                </div>
                <div class="player-card-info">
                    <div class="player-card-identity">
                        <h3 class="player-card-username">${player.username}</h3>
                        <p class="player-card-meta ${unverifiedClass}">[${player.alliance}] - ${player.allianceRank}</p>
                    </div>
                    <div class="player-card-power">
                        <span class="power-value">${(player.power || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            <div class="player-card-footer">
                <button class="player-card-action-btn message-player-btn" title="Message Player">
                    <i class="fas fa-comment-dots"></i>
                </button>
                <button class="player-card-action-btn add-friend-btn" title="Add Friend">
                    <i class="fas fa-user-plus"></i>
                </button>
            </div>
        `;
        playerListContainer.appendChild(card);
    });
}
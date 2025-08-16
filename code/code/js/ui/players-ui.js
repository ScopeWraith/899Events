// code/js/ui/players-ui.js

import { subscribe, getState } from '../state.js';
import { canManageUser, getAvatarBorderClass} from '../utils.js';

// --- STATE & RENDER FUNCTIONS ---

function renderPlayersUI(newState, prevState) {
    if (
        newState.allPlayers !== prevState.allPlayers ||
        newState.currentUserData !== prevState.currentUserData ||
        newState.customBorders !== prevState.customBorders
    ) {
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
    if (!allPlayers) {
        renderPlayers(null);
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

export function renderPlayers(players) {
    // ... (function is the same up to the forEach loop) ...

    players.forEach(player => {
        // ... (card creation is the same) ...
        
        const allianceData = allAlliances ? allAlliances.find(a => a.tag === player.alliance) : null;
        const borderHTML = getAvatarBorderHTML(player, allianceData, customBorders);
        const unverifiedClass = player.isVerified ? '' : 'unverified-player-text';

        card.innerHTML = `
            ${gearIconHTML}
            <div class="flex items-center pb-3 border-b player-card-header" style="border-color: rgba(255,255,255,0.1);">
                <div class="avatar-wrapper w-12 h-12 mr-4">
                    ${borderHTML}
                    <img src="${avatarUrl}" class="w-full h-full rounded-full object-cover" alt="${player.username}" onerror="this.src='https://placehold.co/48x48/0D1117/FFFFFF?text=?';">
                </div>
                <div>
                    <h3 class="font-bold text-lg text-white flex items-center">${player.username} <span class="status-dot ${statusClass} ml-2"></span></h3>
                    <p class="text-sm font-semibold ${unverifiedClass}" style="color: var(--color-primary);">[${player.alliance}] - ${player.allianceRank}</p>
                </div>
            </div>
            // ... (rest of the card HTML is the same) ...
        `;
        playerListContainer.appendChild(card);
    });
}
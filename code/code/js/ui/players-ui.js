// code/js/ui/players-ui.js

/**
 * This module handles all UI logic related to the Players page,
 * including filtering the player list and rendering player cards.
 */

import { getState } from '../state.js';
import { canManageUser } from '../utils.js';

export function applyPlayerFilters() {
    const { allPlayers } = getState();
    const searchTerm = document.getElementById('player-search-input').value.toLowerCase();
    const allianceFilter = document.getElementById('alliance-filter').value;

    const filteredPlayers = allPlayers.filter(player => {
        if (!player.username) return false;
        const nameMatch = player.username.toLowerCase().includes(searchTerm);
        const allianceMatch = !allianceFilter || player.alliance === allianceFilter;
        return nameMatch && allianceMatch;
    });
    renderPlayers(filteredPlayers);
}

export function renderPlayers(players) {
    const playerListContainer = document.getElementById('player-list-container');
    const { currentUserData, userSessions } = getState();

    playerListContainer.innerHTML = '';
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
            if(canManageUser(currentUserData, player)) {
                gearIconHTML = `<button class="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors player-settings-btn" data-uid="${player.uid}"><i class="fas fa-cog"></i></button>`;
            }
        }

        const avatarUrl = player.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${player.username.charAt(0).toUpperCase()}`;
        const session = userSessions[player.uid];
        const statusClass = session ? session.status : 'offline';

        card.innerHTML = `
            ${gearIconHTML}
            <div class="flex items-center pb-3 border-b player-card-header" style="border-color: rgba(255,255,255,0.1);">
                <div class="avatar-container mr-4">
                    <img src="${avatarUrl}" class="w-12 h-12 rounded-full border-2 object-cover" style="border-color: rgba(255,255,255,0.2);" alt="${player.username}" onerror="this.src='https://placehold.co/48x48/0D1117/FFFFFF?text=?';">
                    ${!player.isAdmin ? `<div class="player-badge">[${player.alliance}] ${player.allianceRank}</div>` : ''}
                </div>                
                <div>
                    <h3 class="font-bold text-lg text-white flex items-center">${player.username} <span class="status-dot ${statusClass} ml-2"></span></h3>
                    <p class="text-sm font-semibold" style="color: var(--color-primary);">[${player.alliance}] - ${player.allianceRank}</p>
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
                <button class="text-gray-400 hover:text-white transition-colors !text-lg" title="Like Profile"><i class="fas fa-thumbs-up"></i></button>
            </div>
        `;
        playerListContainer.appendChild(card);
    });
}

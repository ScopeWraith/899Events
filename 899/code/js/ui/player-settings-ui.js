// code/js/ui/player-settings-ui.js

/**
 * This module handles the UI logic for the Player Settings modal,
 * allowing admins and alliance leaders to manage player roles and verification.
 */

import { db } from '../firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getState } from '../state.js';
import { canManageUser } from '../utils.js';
import { hideAllModals, setCustomSelectValue } from './ui-manager.js';
import { ALLIANCE_RANKS, ALLIANCE_ROLES } from '../constants.js';

export function populatePlayerSettingsForm(player) {
    const { currentUserData } = getState();
    document.getElementById('player-settings-username').textContent = player.username;
    const rankSelect = document.getElementById('setting-alliance-rank').closest('.custom-select-container');
    const roleSelect = document.getElementById('setting-alliance-role').closest('.custom-select-container');
    const verifiedCheckbox = document.getElementById('setting-verified');
    
    setCustomSelectValue(rankSelect, player.allianceRank, ALLIANCE_RANKS.find(r => r.value === player.allianceRank)?.text);
    setCustomSelectValue(roleSelect, player.allianceRole, ALLIANCE_ROLES.find(r => r.value === player.allianceRole)?.text);
    verifiedCheckbox.checked = player.isVerified || false;

    const canVerify = canManageUser(currentUserData, player);
    document.getElementById('verification-toggle-container').style.display = canVerify ? 'flex' : 'none';
}

export async function handlePlayerSettingsSubmit(e) {
    e.preventDefault();
    const { activePlayerSettingsUID, currentUserData, allPlayers } = getState();
    if (!activePlayerSettingsUID || !currentUserData) return;

    const targetPlayer = allPlayers.find(p => p.uid === activePlayerSettingsUID);
    if (!targetPlayer) return;

    const errorElement = document.getElementById('player-settings-error');
    errorElement.textContent = '';

    const updatedData = {
        allianceRank: document.getElementById('setting-alliance-rank').value,
        allianceRole: document.getElementById('setting-alliance-role').value,
    };

    if (canManageUser(currentUserData, targetPlayer)) {
        updatedData.isVerified = document.getElementById('setting-verified').checked;
    }

    try {
        await updateDoc(doc(db, "users", activePlayerSettingsUID), updatedData);
        hideAllModals();
    } catch (error) {
        console.error("Error updating player settings:", error);
        errorElement.textContent = "Failed to save settings.";
    }
}

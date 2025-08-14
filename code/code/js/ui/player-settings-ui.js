import { db } from '../firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getState } from '../state.js';
import { canManageUser } from '../utils.js';
import { hideAllModals, setCustomSelectValue } from './ui-manager.js';
import { ALLIANCE_RANKS, ALLIANCE_ROLES } from '../constants.js';
import { sendVerificationRequest } from '../firestore.js'; // New Import

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

    const newAllianceRank = document.getElementById('setting-alliance-rank').value;
    const newAllianceRole = document.getElementById('setting-alliance-role').value;
    const isVerifiedChecked = document.getElementById('setting-verified').checked;

    const updatedData = {
        allianceRank: newAllianceRank,
        allianceRole: newAllianceRole,
    };
    
    // Check if rank or verification status has changed
    const rankHasChanged = newAllianceRank !== targetPlayer.allianceRank;
    const verificationHasChanged = isVerifiedChecked !== targetPlayer.isVerified;

    if (canManageUser(currentUserData, targetPlayer) || currentUserData.isAdmin) {
        if (rankHasChanged) {
            updatedData.isVerified = false;
        } else {
            updatedData.isVerified = isVerifiedChecked;
        }
    }
    
    try {
        await updateDoc(doc(db, "users", activePlayerSettingsUID), updatedData);
        hideAllModals();

        // If the rank has changed, send a verification request
        if (rankHasChanged) {
            await sendVerificationRequest(targetPlayer.uid, targetPlayer.username, targetPlayer.alliance);
        }
    } catch (error) {
        console.error("Error updating player settings:", error);
        errorElement.textContent = "Failed to save settings.";
    }
}
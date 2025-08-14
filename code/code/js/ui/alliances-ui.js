// code/js/ui/alliances-ui.js

import { subscribe, getState } from '../state.js';
import { db, storage } from '../firebase-config.js';
import { doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { showModal, hideAllModals, setCustomSelectValue } from './ui-manager.js';
import { resizeImage, getRankBorderClass } from '../utils.js';

let resizedAllianceAvatarBlob = null;

// --- STATE & RENDER FUNCTIONS ---

function renderAlliancesUI(newState, prevState) {
    // Re-render alliances if any of this data changes
    if (
        newState.allAlliances !== prevState.allAlliances ||
        newState.currentUserData !== prevState.currentUserData ||
        newState.allPlayers !== prevState.allPlayers ||
        newState.userFriends !== prevState.userFriends
    ) {
        // Pass the entire state to the render function to ensure it has all necessary data
        renderAlliances(newState);
    }
}

export function initializeAlliancesUI() {
    subscribe(renderAlliancesUI);
}


// --- UI HELPER & RENDERING FUNCTIONS ---

export function renderAlliances(state) {
    const { allAlliances, currentUserData } = state;
    const container = document.getElementById('alliances-list-container');
    const pageHeader = document.querySelector('#sub-page-server-alliances h2');

    // GUARD CLAUSE: Exit if the container or essential data isn't ready.
    if (!container || !pageHeader || !allAlliances) {
        return;
    }

    let headerActionHTML = '';
    // Check if allAlliances exists before calling .some()
    if (
        currentUserData &&
        currentUserData.isVerified &&
        currentUserData.allianceRank === 'R5' &&
        currentUserData.alliance &&
        !allAlliances.some(a => a.tag === currentUserData.alliance)
    ) {
        headerActionHTML = `
            <div class="text-center mb-6">
                <button id="show-register-alliance-modal-btn" class="primary-btn px-6 py-3 rounded-lg text-lg">
                    <i class="fas fa-plus-circle mr-2"></i> Register Your Alliance
                </button>
            </div>
        `;
    }

    const actionContainer = document.getElementById('alliance-action-container') || document.createElement('div');
    if (!actionContainer.id) {
        actionContainer.id = 'alliance-action-container';
        pageHeader.after(actionContainer);
    }
    actionContainer.innerHTML = headerActionHTML;

    if (allAlliances.length === 0) {
        container.innerHTML = `<p class="text-center col-span-full py-8 text-gray-400">No alliances have been registered yet.</p>`;
    } else {
        container.innerHTML = allAlliances.map(alliance => createAllianceCard(alliance, state)).join('');
    }
}

function createAllianceCard(alliance, state) {
    const { currentUserData, allPlayers, userFriends } = state;

    // GUARD CLAUSE: Don't render a card if we don't have player data yet
    if (!allPlayers) return '';

    const primaryColor = alliance.primaryColor || 'var(--color-primary)';
    const secondaryColor = alliance.secondaryColor || 'var(--color-highlight)';
    const canEdit = currentUserData?.isVerified && currentUserData.allianceRank === 'R5' && currentUserData.alliance === alliance.tag;
    const editButtonHTML = canEdit ? `<button class="alliance-card-edit-btn" data-alliance-tag="${alliance.tag}"><i class="fas fa-cog"></i></button>` : '';

    const getRoleMember = (username) => allPlayers.find(p => p.username === username);

    const r5Data = getRoleMember(alliance.r5Name);
    const leaderAvatarUrl = r5Data?.avatarUrl || 'https://placehold.co/48x48/161B22/FFFFFF?text=?';
    const leaderRankBorder = r5Data ? getRankBorderClass(r5Data) : 'rank-border-r5';
    const isSelf = currentUserData && r5Data && currentUserData.uid === r5Data.uid;
    const isFriend = r5Data && userFriends && userFriends.includes(r5Data.uid);
    const showLeaderActionButtons = currentUserData && r5Data;

    const coreMembers = [
        { role: 'Warlord', username: alliance.warlord },
        { role: 'Recruiter', username: alliance.recruiter },
        { role: 'Muse', username: alliance.muse },
        { role: 'Butler', username: alliance.butler }
    ].filter(member => member.username && member.username.trim() !== '');

    const coreMembersHTML = coreMembers.map(member => {
        const memberData = getRoleMember(member.username);
        const avatarUrl = memberData?.avatarUrl || 'https://placehold.co/64x64/161B22/FFFFFF?text=?';
        const rankBorder = memberData ? getRankBorderClass(memberData) : 'rank-border-r1';
        return `
            <div class="core-member">
                <img src="${avatarUrl}" class="core-member-avatar" style="border: 2px solid var(--primary-color);" alt="${member.role}">
                <p class="core-member-role">${member.role}</p>
                <p class="core-member-name">${member.username}</p>
            </div>
        `;
    }).join('');

    return `
        <div class="alliance-card" style="--primary-color: ${primaryColor}; --secondary-color: ${secondaryColor};">
            ${editButtonHTML}
            <div class="alliance-card-header">
                <div class="alliance-card-avatar-wrapper">
                    <img src="${alliance.avatarUrl || 'https://placehold.co/128x128/161B22/FFFFFF?text=?'}" class="alliance-card-avatar"  alt="${alliance.name} Avatar">
                </div>
                <div class="alliance-card-title-section">
                    <p class="alliance-card-tag">[${alliance.tag}]</p>
                    <h2 class="alliance-card-name">${alliance.name || 'Alliance Name'}</h2>
                </div>
            </div>
            <div class="alliance-card-body">
                <div class="alliance-card-leader-section">
                    <div class="leader-identity">
                        <img src="${leaderAvatarUrl}" class="leader-avatar ${leaderRankBorder}" style="border: 2px solid var(--primary-color);" alt="Leader">
                        <div class="leader-info">
                            <span class="leader-title">LEADER (R5)</span>
                            <span class="leader-name">${alliance.r5Name || 'N/A'}</span>
                        </div>
                    </div>
                    ${showLeaderActionButtons ? `
                        <div class="leader-actions">
                            <button class="leader-action-btn message-player-btn" data-uid="${r5Data.uid}" title="${isSelf ? 'Cannot message yourself' : 'Message Leader'}" ${isSelf ? 'disabled' : ''}>
                                <i class="fas fa-comment-dots"></i>
                            </button>
                            <button class="leader-action-btn add-friend-btn" data-uid="${r5Data.uid}" title="${isSelf ? 'Cannot add yourself' : (isFriend ? 'Already Friends' : 'Add Friend')}" ${isSelf || isFriend ? 'disabled' : ''}>
                                <i class="fas ${isFriend ? 'fa-user-check' : 'fa-user-plus'}"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
                ${coreMembers.length > 0 ? `<div class="alliance-card-core-members">${coreMembersHTML}</div>` : ''}
                <div class="alliance-card-details">
                    <h4>Details</h4>
                    <p>${alliance.details || 'No details provided.'}</p>
                </div>
            </div>
            <div class="alliance-card-footer">
                <h4>Recruitment Requirements</h4>
                <p>${alliance.recruitmentInfo || 'Contact leadership for details.'}</p>
            </div>
        </div>
    `;
}

export function showEditAllianceModal(alliance) {
    const { allPlayers, currentUserData } = getState();
    if (!alliance) return;
    document.getElementById('edit-alliance-form').dataset.editingTag = alliance.tag;
    resizedAllianceAvatarBlob = null;
    document.getElementById('edit-alliance-name').value = alliance.name || '';
    document.getElementById('edit-alliance-details').value = alliance.details || '';
    document.getElementById('edit-alliance-recruitment').value = alliance.recruitmentInfo || '';
    document.getElementById('edit-alliance-avatar-preview').src = alliance.avatarUrl || 'https://placehold.co/128x128/161B22/FFFFFF?text=Avatar';
    document.getElementById('edit-alliance-primary-color').value = alliance.primaryColor || '#00BFFF';
    document.getElementById('edit-alliance-secondary-color').value = alliance.secondaryColor || '#F87171';
    const allianceMembers = allPlayers.filter(p => p.alliance === currentUserData.alliance);
    const memberOptions = allianceMembers.map(m => ({ value: m.username, text: m.username }));
    populateRoleSelect('edit-alliance-warlord', memberOptions, alliance.warlord);
    populateRoleSelect('edit-alliance-recruiter', memberOptions, alliance.recruiter);
    populateRoleSelect('edit-alliance-muse', memberOptions, alliance.muse);
    populateRoleSelect('edit-alliance-butler', memberOptions, alliance.butler);
    hideAllModals();
    showModal(document.getElementById('edit-alliance-modal-container'));
}

function populateRoleSelect(selectId, members, selectedValue) {
    const container = document.getElementById(selectId).closest('.custom-select-container');
    const optionsList = container.querySelector('.options-list');
    const allOptions = [{ value: '', text: 'None' }, ...members];
    optionsList.innerHTML = allOptions.map(opt => `<div class="custom-select-option" data-value="${opt.value}">${opt.text}</div>`).join('');
    const selectedText = (allOptions.find(o => o.value === selectedValue) || {}).text || 'None';
    setCustomSelectValue(container, selectedValue || '', selectedText);
}

export async function handleAllianceAvatarSelection(e) {
    const file = e.target.files[0];
    if (!file) return;
    resizedAllianceAvatarBlob = await resizeImage(file, { maxWidth: 512, maxHeight: 512 });
    document.getElementById('edit-alliance-avatar-preview').src = URL.createObjectURL(resizedAllianceAvatarBlob);
}

export function showRegisterAllianceModal() {
    const { currentUserData } = getState();
    if (!currentUserData) return;
    document.getElementById('register-alliance-tag-display').textContent = `[${currentUserData.alliance}]`;
    document.getElementById('register-alliance-form').reset();
    document.getElementById('register-alliance-error').textContent = '';
    hideAllModals();
    showModal(document.getElementById('register-alliance-modal-container'));
}

export async function handleAllianceRegisterSubmit(e) {
    e.preventDefault();
    const { currentUserData } = getState();
    const errorElement = document.getElementById('register-alliance-error');
    errorElement.textContent = '';
    if (!currentUserData || !currentUserData.isVerified || currentUserData.allianceRank !== 'R5') {
        errorElement.textContent = "You do not have permission to register an alliance.";
        return;
    }
    const allianceTag = currentUserData.alliance;
    const allianceName = document.getElementById('register-alliance-name').value;
    const allianceDetails = document.getElementById('register-alliance-details').value;
    if (!allianceName || !allianceDetails) {
        errorElement.textContent = "Please fill out all fields.";
        return;
    }
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Registering...';
    const allianceDocRef = doc(db, "alliances", allianceTag);
    const newAllianceData = {
        tag: allianceTag, name: allianceName, details: allianceDetails, r5Name: currentUserData.username,
        warlord: '', recruiter: '', muse: '', butler: '',
        recruitmentInfo: 'Contact leadership for details.', avatarUrl: '',
        primaryColor: '#00BFFF', secondaryColor: '#F87171'
    };
    try {
        await setDoc(allianceDocRef, newAllianceData);
        hideAllModals();
    } catch (error) {
        console.error("Error registering alliance:", error);
        errorElement.textContent = "An error occurred during registration. Please try again.";
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Complete Registration';
    }
}

export async function handleAllianceEditSubmit(e) {
    e.preventDefault();
    const errorElement = document.getElementById('edit-alliance-error');
    errorElement.textContent = '';
    const allianceTag = e.target.dataset.editingTag;
    if (!allianceTag) {
        errorElement.textContent = "Could not identify the alliance. Please try again.";
        return;
    }
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
    const allianceDocRef = doc(db, "alliances", allianceTag);
    try {
        if (resizedAllianceAvatarBlob) {
            const avatarRef = ref(storage, `alliance_avatars/${allianceTag}`);
            await uploadBytes(avatarRef, resizedAllianceAvatarBlob);
            const downloadURL = await getDownloadURL(avatarRef);
            await updateDoc(allianceDocRef, { avatarUrl: downloadURL });
        }
        const updatedData = {
            name: document.getElementById('edit-alliance-name').value,
            details: document.getElementById('edit-alliance-details').value,
            recruitmentInfo: document.getElementById('edit-alliance-recruitment').value,
            warlord: document.getElementById('edit-alliance-warlord').value,
            recruiter: document.getElementById('edit-alliance-recruiter').value,
            muse: document.getElementById('edit-alliance-muse').value,
            butler: document.getElementById('edit-alliance-butler').value,
            primaryColor: document.getElementById('edit-alliance-primary-color').value,
            secondaryColor: document.getElementById('edit-alliance-secondary-color').value,
        };
        await updateDoc(allianceDocRef, updatedData);
        hideAllModals();
    } catch (error) {
        console.error("Error updating alliance profile:", error);
        errorElement.textContent = "An error occurred while saving. Please try again.";
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Changes';
    }
}
// code/js/ui/alliances-ui.js
import { getState } from '../state.js';
import { db, storage } from '../firebase-config.js';
import { doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { showModal, hideAllModals, setCustomSelectValue } from './ui-manager.js';
import { resizeImage } from '../utils.js';
import { getRankBorderClass } from '../utils.js';

let resizedAllianceAvatarBlob = null;

export function renderAlliances(alliances) {
    const container = document.getElementById('alliances-list-container');
    const pageHeader = document.querySelector('#sub-page-server-alliances h2'); // Get the header
    if (!container || !pageHeader) return;

    // --- NEW: Add a container for the button ---
    let headerActionHTML = '';
    const { currentUserData } = getState();

    // Check if the user is a verified R5 and if their alliance is NOT in the rendered list
    if (currentUserData &&
        currentUserData.isVerified &&
        currentUserData.allianceRank === 'R5' &&
        currentUserData.alliance &&
        !alliances.some(a => a.tag === currentUserData.alliance))
    {
        headerActionHTML = `
            <div class="text-center mb-6">
                <button id="show-register-alliance-modal-btn" class="primary-btn px-6 py-3 rounded-lg text-lg">
                    <i class="fas fa-plus-circle mr-2"></i> Register Your Alliance
                </button>
            </div>
        `;
    }
    
    // Inject the button container right after the main page header
    if (pageHeader.nextSibling?.id !== 'alliance-action-container') {
         pageHeader.insertAdjacentHTML('afterend', `<div id="alliance-action-container">${headerActionHTML}</div>`);
    } else {
        document.getElementById('alliance-action-container').innerHTML = headerActionHTML;
    }
    // --- END NEW ---

    if (alliances.length === 0) {
        container.innerHTML = `<p class="text-center col-span-full py-8 text-gray-400">No alliances have been registered yet.</p>`;
        return;
    }

    container.innerHTML = alliances.map(alliance => createAllianceCard(alliance)).join('');
}


function createAllianceCard(alliance) {
    // We now need allPlayers to find avatar info for the roles
    const { currentUserData, allPlayers } = getState();

    // Default colors if none are set
    const primaryColor = alliance.primaryColor || 'var(--color-primary)';
    const secondaryColor = alliance.secondaryColor || 'var(--color-highlight)';
    
    const canEdit = currentUserData?.isVerified && currentUserData.allianceRank === 'R5' && currentUserData.alliance === alliance.tag;
    const editButtonHTML = canEdit ? `<button class="alliance-card-edit-btn" data-alliance-tag="${alliance.tag}"><i class="fas fa-cog"></i></button>` : '';

    // --- NEW: Helper functions to get member data and create role HTML ---
    const getRoleMember = (username) => allPlayers.find(p => p.username === username);
    
    const r5Data = getRoleMember(alliance.r5Name);

    const createCoreMemberHTML = (memberUsername, roleName) => {
        const memberData = getRoleMember(memberUsername);
        const avatarUrl = memberData?.avatarUrl || 'https://placehold.co/64x64/161B22/FFFFFF?text=?';
        const rankBorder = memberData ? getRankBorderClass(memberData) : 'rank-border-r1';
        const username = memberData?.username || 'N/A';

        return `
            <div class="core-member">
                <img src="${avatarUrl}" class="core-member-avatar ${rankBorder}" alt="${roleName}">
                <p class="core-member-role">${roleName}</p>
                <p class="core-member-name">${username}</p>
            </div>
        `;
    };

    // --- REVISED CARD STRUCTURE ---
    return `
        <div class="alliance-card" style="--primary-color: ${primaryColor}; --secondary-color: ${secondaryColor};">
            ${editButtonHTML}
            <div class="alliance-card-header">
                <div class="alliance-card-avatar-wrapper">
                    <img src="${alliance.avatarUrl || 'https://placehold.co/128x128/161B22/FFFFFF?text=?'}" class="alliance-card-avatar" alt="${alliance.name} Avatar">
                </div>
                <div class="alliance-card-title-section">
                    <h2 class="alliance-card-name">${alliance.name}</h2>
                    <p class="alliance-card-tag">[${alliance.tag}]</p>
                </div>
            </div>
            <div class="alliance-card-body">
                <div class="alliance-card-leader-section">
                    <p class="leader-title">LEADER (R5)</p>
                    <div class="leader-info">
                        <img src="${r5Data?.avatarUrl || 'https://placehold.co/48x48/161B22/FFFFFF?text=?'}" class="leader-avatar ${r5Data ? getRankBorderClass(r5Data) : 'rank-border-r5'}" alt="Leader">
                        <span class="leader-name">${alliance.r5Name || 'N/A'}</span>
                    </div>
                </div>
                <div class="alliance-card-core-members">
                    ${createCoreMemberHTML(alliance.warlord, 'Warlord')}
                    ${createCoreMemberHTML(alliance.recruiter, 'Recruiter')}
                    ${createCoreMemberHTML(alliance.muse, 'Muse')}
                    ${createCoreMemberHTML(alliance.butler, 'Butler')}
                </div>
                <div class="alliance-card-details">
                    <h4>Details</h4>
                    <p>${alliance.details || 'Coming soon...'}</p>
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

    // Pre-fill the alliance tag display
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
        tag: allianceTag,
        name: allianceName,
        details: allianceDetails,
        r5Name: currentUserData.username,
        // Set other fields to null or empty strings initially
        warlord: '',
        recruiter: '',
        muse: '',
        butler: '',
        recruitmentInfo: 'Contact leadership for details.',
        avatarUrl: '',
        primaryColor: '#00BFFF', // Default color
        secondaryColor: '#F87171' // Default color
    };

    try {
        await setDoc(allianceDocRef, newAllianceData);
        hideAllModals();
        // The real-time listener will automatically re-render the alliances page
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
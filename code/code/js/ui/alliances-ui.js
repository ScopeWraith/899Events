// code/js/ui/alliances-ui.js

import { getState } from '../state.js';

let resizedAllianceAvatarBlob = null;

export function showEditAllianceModal(alliance) {
    const { allPlayers, currentUserData } = getState();
    if (!alliance) return;

    // Store the tag of the alliance being edited
    document.getElementById('edit-alliance-form').dataset.editingTag = alliance.tag;
    
    // Reset the avatar blob
    resizedAllianceAvatarBlob = null;

    // Populate standard fields
    document.getElementById('edit-alliance-name').value = alliance.name || '';
    document.getElementById('edit-alliance-details').value = alliance.details || '';
    document.getElementById('edit-alliance-recruitment').value = alliance.recruitmentInfo || '';
    document.getElementById('edit-alliance-avatar-preview').src = alliance.avatarUrl || 'https://placehold.co/128x128/161B22/FFFFFF?text=Avatar';
    document.getElementById('edit-alliance-primary-color').value = alliance.primaryColor || '#00BFFF';
    document.getElementById('edit-alliance-secondary-color').value = alliance.secondaryColor || '#F87171';

    // Get members of the current user's alliance
    const allianceMembers = allPlayers.filter(p => p.alliance === currentUserData.alliance);
    const memberOptions = allianceMembers.map(m => ({ value: m.username, text: m.username }));

    // Populate role dropdowns
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
    
    // Add a "None" option
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
        // Handle avatar upload if a new one was selected
        if (resizedAllianceAvatarBlob) {
            const avatarRef = ref(storage, `alliance_avatars/${allianceTag}`);
            await uploadBytes(avatarRef, resizedAllianceAvatarBlob);
            const downloadURL = await getDownloadURL(avatarRef);
            await updateDoc(allianceDocRef, { avatarUrl: downloadURL });
        }

        // Update the rest of the data
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
export function renderAlliances(alliances) {
    const container = document.getElementById('alliances-list-container');
    if (!container) return;

    if (alliances.length === 0) {
        container.innerHTML = `<p class="text-center col-span-full py-8 text-gray-400">No alliances have been registered yet.</p>`;
        return;
    }

    container.innerHTML = alliances.map(alliance => createAllianceCard(alliance)).join('');
}

function createAllianceCard(alliance) {
    const { currentUserData } = getState();

    // Default colors if none are set
    const primaryColor = alliance.primaryColor || 'var(--color-primary)';
    const secondaryColor = alliance.secondaryColor || 'var(--color-highlight)';

    const canEdit = currentUserData && currentUserData.isVerified && currentUserData.allianceRank === 'R5' && currentUserData.alliance === alliance.tag;

    let editButtonHTML = '';
    if (canEdit) {
        editButtonHTML = `<button class="alliance-card-edit-btn" data-alliance-tag="${alliance.tag}"><i class="fas fa-cog"></i></button>`;
    }

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
                <div class="alliance-card-details">
                    <p>${alliance.details || 'No details provided.'}</p>
                </div>
                <div class="alliance-card-roles">
                    <div class="role-item">
                        <span class="role-title">Leader (R5)</span>
                        <span class="role-name">${alliance.r5Name || 'N/A'}</span>
                    </div>
                    <div class="role-item">
                        <span class="role-title">Warlord</span>
                        <span class="role-name">${alliance.warlord || 'N/A'}</span>
                    </div>
                    <div class="role-item">
                        <span class="role-title">Recruiter</span>
                        <span class="role-name">${alliance.recruiter || 'N/A'}</span>
                    </div>
                    <div class="role-item">
                        <span class="role-title">Muse</span>
                        <span class="role-name">${alliance.muse || 'N/A'}</span>
                    </div>
                    <div class="role-item">
                        <span class="role-title">Butler</span>
                        <span class="role-name">${alliance.butler || 'N/A'}</span>
                    </div>
                </div>
            </div>
            <div class="alliance-card-footer">
                <h4 class="recruitment-title">Recruitment Requirements</h4>
                <p class="recruitment-info">${alliance.recruitmentInfo || 'Contact the alliance leadership for details.'}</p>
            </div>
        </div>
    `;
}
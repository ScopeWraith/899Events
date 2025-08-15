// code/js/ui/skin-ui.js

import { getState } from '../state.js';
import { getAvatarBorderClass } from '../utils.js';

export function initializeSkinUI() {
    const editProfileModal = document.getElementById('edit-profile-modal-container');
    if (editProfileModal) {
        editProfileModal.addEventListener('click', (e) => {
            const skinBtn = e.target.closest('.skin-select-btn');
            if (skinBtn) {
                const skinId = skinBtn.dataset.value;
                document.getElementById('avatar-border-skin-input').value = skinId;
                updateSkinSelection('avatar-border-selector', skinId);
                updateAvatarBorderPreview();
            }
        });
    }
}

export function buildAvatarBorderSkins() {
    const container = document.getElementById('avatar-border-selector');
    if (!container) return;

    const { currentUserData, allAlliances } = getState();
    const allianceData = allAlliances.find(a => a.tag === currentUserData.alliance);
    
    const skins = [
        { id: 'rank', label: 'Rank' },
        { id: 'alliance', label: 'Alliance' }
    ];

    container.innerHTML = skins.map(skin => {
        const previewData = { ...currentUserData, avatarBorderSkin: skin.id };
        const borderClass = getAvatarBorderClass(previewData, allianceData);
        
        let style = '';
        if (skin.id === 'alliance' && allianceData) {
            style = `border-color: ${allianceData.primaryColor}; box-shadow: 0 0 10px -2px ${allianceData.primaryColor};`;
        }

        return `
            <button type="button" class="skin-select-btn" data-value="${skin.id}">
                <div class="preview">
                    <div class="preview-icon"></div>
                    <div class="preview-border ${borderClass}" style="${style}"></div>
                </div>
                <span class="label">${skin.label}</span>
            </button>
        `;
    }).join('');
}

function updateSkinSelection(containerId, selectedValue) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.skin-select-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === selectedValue);
    });
}

function updateAvatarBorderPreview() {
    const { currentUserData, allAlliances } = getState();
    const selectedSkin = document.getElementById('avatar-border-skin-input').value;
    const previewData = { ...currentUserData, avatarBorderSkin: selectedSkin };
    const allianceData = allAlliances.find(a => a.tag === previewData.alliance);
    
    const previewElement = document.getElementById('edit-avatar-border-preview');
    previewElement.className = `w-32 h-32 absolute top-0 left-0 rounded-full pointer-events-none ${getAvatarBorderClass(previewData, allianceData)}`;

    if (selectedSkin === 'alliance' && allianceData) {
        previewElement.style.borderColor = allianceData.primaryColor;
        previewElement.style.boxShadow = `0 0 10px -2px ${allianceData.primaryColor}`;
    } else {
        previewElement.style.borderColor = '';
        previewElement.style.boxShadow = '';
    }
}
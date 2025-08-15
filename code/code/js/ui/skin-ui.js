// code/js/ui/skin-ui.js

import { getState } from '../state.js';
import { getAvatarBorderClass } from '../utils.js';
import { showBorderEditorModal } from './ui-manager.js';

export function initializeSkinUI() {
    const editProfileModal = document.getElementById('edit-profile-modal-container');
    if (editProfileModal) {
        editProfileModal.addEventListener('click', (e) => {
            const skinBtn = e.target.closest('.skin-select-btn');
            if (skinBtn) {
                if (skinBtn.id === 'add-new-border-btn') {
                    showBorderEditorModal();
                    return;
                }
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

    if (currentUserData.isAdmin) {
        skins.push({ id: 'admin', label: 'Admin' });
    }

    let skinsHTML = skins.map(skin => {
        const previewData = { ...currentUserData, avatarBorderSkin: skin.id };
        const border = getAvatarBorderClass(previewData, allianceData);

        return `
            <button type="button" class="skin-select-btn" data-value="${skin.id}">
                <div class="preview">
                    <div class="preview-icon"></div>
                    <div class="preview-border ${border.className}" style="${border.style}"></div>
                </div>
                <span class="label">${skin.label}</span>
            </button>
        `;
    }).join('');

    if (currentUserData.isAdmin) {
        skinsHTML += `
            <button type="button" id="add-new-border-btn" class="skin-select-btn">
                <div class="preview !bg-transparent">
                    <i class="fas fa-plus text-2xl text-gray-500"></i>
                </div>
                <span class="label">New...</span>
            </button>
        `;
    }

    container.innerHTML = skinsHTML;
}

export function updateSkinSelection(containerId, selectedValue) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.skin-select-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === selectedValue);
    });
}

export function updateAvatarBorderPreview() {
    const { currentUserData, allAlliances } = getState();
    const selectedSkin = document.getElementById('avatar-border-skin-input').value;
    const previewData = { ...currentUserData, avatarBorderSkin: selectedSkin };
    const allianceData = allAlliances.find(a => a.tag === previewData.alliance);
    
    const previewElement = document.getElementById('edit-avatar-border-preview');
    const border = getAvatarBorderClass(previewData, allianceData);
    
    previewElement.className = `w-32 h-32 absolute top-0 left-0 rounded-full pointer-events-none ${border.className}`;
    previewElement.style.cssText = border.style;
}
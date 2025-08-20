// code/js/ui/skin-ui.js

import { getState } from '../state.js';
import { getAvatarBorderClass, getChatBubbleBorderClass } from '../utils.js';

/**
 * Initializes the skin selection UI within the "Edit Profile" modal.
 * It attaches a single event listener to the modal to handle clicks on any skin selection button.
 */
export function initializeSkinUI() {
    const editProfileModal = document.getElementById('edit-profile-modal-container');
    if (editProfileModal) {
        editProfileModal.addEventListener('click', (e) => {
            const skinBtn = e.target.closest('.skin-select-btn');
            if (skinBtn) {
                const skinId = skinBtn.dataset.value;
                const containerId = skinBtn.closest('.skin-select-container').id;

                if (containerId === 'avatar-border-selector') {
                    document.getElementById('avatar-border-skin-input').value = skinId;
                    updateSkinSelection('avatar-border-selector', skinId);
                    updateAvatarBorderPreview();
                } else if (containerId === 'chat-bubble-border-selector') {
                    document.getElementById('chat-bubble-border-skin-input').value = skinId;
                    updateSkinSelection('chat-bubble-border-selector', skinId);
                }
            }
        });
    }
}

/**
 * Builds and renders the available avatar border skin options in the "Edit Profile" modal.
 * The available options are determined by the user's current data (e.g., if they are an admin).
 */
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

    container.innerHTML = skins.map(skin => {
        let previewData;
        if (skin.id === 'rank') {
            previewData = { ...currentUserData, avatarBorderSkin: skin.id, isAdmin: false };
        } else {
            previewData = { ...currentUserData, avatarBorderSkin: skin.id };
        }
        
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
}

/**
 * Builds and renders the available chat bubble border skin options in the "Edit Profile" modal.
 * The available options are determined by the user's current data.
 */
export function buildChatBubbleBorderSkins() {
    const container = document.getElementById('chat-bubble-border-selector');
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

    container.innerHTML = skins.map(skin => {
        let previewData;
        if (skin.id === 'rank') {
            previewData = { ...currentUserData, chatBubbleBorderSkin: skin.id, isAdmin: false };
        } else {
            previewData = { ...currentUserData, chatBubbleBorderSkin: skin.id };
        }
        
        const border = getChatBubbleBorderClass(previewData, allianceData);

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
}

/**
 * Updates the visual state of the skin selection buttons to highlight the active skin.
 * @param {string} containerId The ID of the container holding the skin buttons ('avatar-border-selector' or 'chat-bubble-border-selector').
 * @param {string} selectedValue The value of the currently selected skin.
 */
export function updateSkinSelection(containerId, selectedValue) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.skin-select-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === selectedValue);
    });
}

/**
 * Updates the avatar border preview in the "Edit Profile" modal to reflect the currently selected skin.
 */
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
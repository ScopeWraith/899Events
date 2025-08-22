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
            if (skinBtn && !skinBtn.disabled) {
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

    const { currentUserData, allAlliances, userFriends, allPlayers } = getState();
    const allianceData = allAlliances.find(a => a.tag === currentUserData.alliance);
    
    const friendCount = userFriends.filter(f => f.status === 'friends').length;
    const likesGivenCount = allPlayers.filter(p => p.likedBy && p.likedBy.includes(currentUserData.uid)).length;
    const hasCustomAvatar = currentUserData.avatarUrl && !currentUserData.avatarUrl.includes('placehold.co');

    const skins = [
        // Default Skins
        { id: 'rank', label: 'Rank', unlocked: true },
        { id: 'alliance', label: 'Alliance', unlocked: true },
        { id: 'admin', label: 'Admin', unlocked: currentUserData.isAdmin },
        
        // General Skins (Unlocked by default)
        { id: 'sentinel', label: 'Sentinel', unlocked: true },
        { id: 'cobalt', label: 'Cobalt', unlocked: true },
        { id: 'solar', label: 'Solar', unlocked: true },
        { id: 'amethyst', label: 'Amethyst', unlocked: true },
        { id: 'cyber', label: 'Cyber', unlocked: true },
        { id: 'crimson', label: 'Crimson', unlocked: true },
        { id: 'glacial', label: 'Glacial', unlocked: true },
        { id: 'venom', label: 'Venom', unlocked: true },
        { id: 'ares', label: 'Ares', unlocked: true },
        { id: 'nebula', label: 'Nebula', unlocked: true },
        { id: 'chroma', label: 'Chroma', unlocked: true },

        // Achievement Skins
        { id: 'friend-1', label: 'Socialite', unlocked: friendCount >= 10, tooltip: 'Add 10 Friends' },
        { id: 'friend-2', label: 'Networker', unlocked: friendCount >= 50, tooltip: 'Add 50 Friends' },
        { id: 'friend-3', label: 'Superstar', unlocked: friendCount >= 100, tooltip: 'Add 100 Friends' },
        { id: 'avatar-1', label: 'Identified', unlocked: hasCustomAvatar, tooltip: 'Upload a custom avatar' },
        { id: 'like-1', label: 'Appreciator', unlocked: likesGivenCount >= 25, tooltip: 'Like 25 player profiles' },
        { id: 'like-2', label: 'Admirer', unlocked: likesGivenCount >= 50, tooltip: 'Like 50 player profiles' },
        { id: 'like-3', label: 'Idolizer', unlocked: likesGivenCount >= 100, tooltip: 'Like 100 player profiles' },
        { id: 'celestial', label: 'Celestial', unlocked: likesGivenCount >= 250, tooltip: 'Like 250 player profiles' },
    ].filter(skin => skin.unlocked || (skin.tooltip && skin.id !== 'admin'));

    container.innerHTML = skins.map(skin => {
        const previewData = { ...currentUserData, avatarBorderSkin: skin.id, isAdmin: skin.id === 'admin' };
        const border = getAvatarBorderClass(previewData, allianceData);
        const isDisabled = !skin.unlocked;
        const disabledAttr = isDisabled ? 'disabled' : '';
        const tooltipAttr = isDisabled ? `data-tooltip="${skin.tooltip}"` : '';
        const lockIcon = isDisabled ? `<div class="lock-overlay"><i class="fas fa-lock"></i></div>` : '';

        return `
            <button type="button" class="skin-select-btn" data-value="${skin.id}" ${disabledAttr} ${tooltipAttr}>
                <div class="preview">
                    ${lockIcon}
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

    const { currentUserData, allAlliances, userFriends, allPlayers } = getState();
    const allianceData = allAlliances.find(a => a.tag === currentUserData.alliance);

    const friendCount = userFriends.filter(f => f.status === 'friends').length;
    const likesGivenCount = allPlayers.filter(p => p.likedBy && p.likedBy.includes(currentUserData.uid)).length;
    const hasCustomAvatar = currentUserData.avatarUrl && !currentUserData.avatarUrl.includes('placehold.co');

    const skins = [
        // Default Skins
        { id: 'rank', label: 'Rank', unlocked: true },
        { id: 'alliance', label: 'Alliance', unlocked: true },
        { id: 'admin', label: 'Admin', unlocked: currentUserData.isAdmin },

        // General Skins (Unlocked by default)
        { id: 'sentinel', label: 'Sentinel', unlocked: true },
        { id: 'cobalt', label: 'Cobalt', unlocked: true },
        { id: 'solar', label: 'Solar', unlocked: true },
        { id: 'amethyst', label: 'Amethyst', unlocked: true },
        { id: 'cyber', label: 'Cyber', unlocked: true },
        { id: 'crimson', label: 'Crimson', unlocked: true },
        { id: 'glacial', label: 'Glacial', unlocked: true },
        { id: 'venom', label: 'Venom', unlocked: true },
        { id: 'ares', label: 'Ares', unlocked: true },
        { id: 'nebula', label: 'Nebula', unlocked: true },
        { id: 'chroma', label: 'Chroma', unlocked: true },

        // Achievement Skins
        { id: 'friend-1', label: 'Socialite', unlocked: friendCount >= 10, tooltip: 'Add 10 Friends' },
        { id: 'friend-2', label: 'Networker', unlocked: friendCount >= 50, tooltip: 'Add 50 Friends' },
        { id: 'friend-3', label: 'Superstar', unlocked: friendCount >= 100, tooltip: 'Add 100 Friends' },
        { id: 'avatar-1', label: 'Identified', unlocked: hasCustomAvatar, tooltip: 'Upload a custom avatar' },
        { id: 'like-1', label: 'Appreciator', unlocked: likesGivenCount >= 25, tooltip: 'Like 25 player profiles' },
        { id: 'like-2', label: 'Admirer', unlocked: likesGivenCount >= 50, tooltip: 'Like 50 player profiles' },
        { id: 'like-3', label: 'Idolizer', unlocked: likesGivenCount >= 100, tooltip: 'Like 100 player profiles' },
        { id: 'celestial', label: 'Celestial', unlocked: likesGivenCount >= 250, tooltip: 'Like 250 player profiles' },
    ].filter(skin => skin.unlocked || (skin.tooltip && skin.id !== 'admin'));

    container.innerHTML = skins.map(skin => {
        const previewData = { ...currentUserData, chatBubbleBorderSkin: skin.id, isAdmin: skin.id === 'admin' };
        const border = getChatBubbleBorderClass(previewData, allianceData);
        const isDisabled = !skin.unlocked;
        const disabledAttr = isDisabled ? 'disabled' : '';
        const tooltipAttr = isDisabled ? `data-tooltip="${skin.tooltip}"` : '';
        const lockIcon = isDisabled ? `<div class="lock-overlay"><i class="fas fa-lock"></i></div>` : '';

        return `
            <button type="button" class="skin-select-btn" data-value="${skin.id}" ${disabledAttr} ${tooltipAttr}>
                <div class="preview">
                    ${lockIcon}
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
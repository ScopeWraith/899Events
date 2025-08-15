// code/js/ui/skin-ui.js

import { getState } from '../state.js';
import { getAvatarBorderClass, applyCustomBorderStyle } from '../utils.js';
import { showBorderEditorModal, hideAllModals } from './ui-manager.js';
import { db } from '../firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

    const saveBorderBtn = document.getElementById('save-border-btn');
    if (saveBorderBtn) {
        saveBorderBtn.addEventListener('click', handleSaveBorder);
    }
}

export function buildAvatarBorderSkins() {
    const container = document.getElementById('avatar-border-selector');
    if (!container) return;

    const { currentUserData, allAlliances, customBorders } = getState();
    const allianceData = allAlliances.find(a => a.tag === currentUserData.alliance);
    
    const skins = [
        { id: 'rank', label: 'Rank' },
        { id: 'alliance', label: 'Alliance' }
    ];

    if (currentUserData.isAdmin) {
        skins.push({ id: 'admin', label: 'Admin' });
        // Add custom borders for admins
        if (customBorders) {
            customBorders.forEach(border => {
                skins.push({ id: border.id, label: border.name, isCustom: true, css: border.css });
            });
        }
    }

    let skinsHTML = skins.map(skin => {
        let border;
        if (skin.isCustom) {
            border = { className: 'custom-border', style: applyCustomBorderStyle(skin.css) };
        } else {
            const previewData = { ...currentUserData, avatarBorderSkin: skin.id };
            border = getAvatarBorderClass(previewData, allianceData);
        }

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
    const { currentUserData, allAlliances, customBorders } = getState();
    if (!currentUserData) return;

    const selectedSkinId = document.getElementById('avatar-border-skin-input').value;
    const previewElement = document.getElementById('edit-avatar-border-preview');

    const customBorder = customBorders && customBorders.find(b => b.id === selectedSkinId);

    if (customBorder) {
        previewElement.className = `avatar-border custom-border`;
        previewElement.style.cssText = applyCustomBorderStyle(customBorder.css);
    } else {
        const previewData = { ...currentUserData, avatarBorderSkin: selectedSkinId };
        const allianceData = allAlliances.find(a => a.tag === previewData.alliance);
        const border = getAvatarBorderClass(previewData, allianceData);
        
        previewElement.className = `avatar-border ${border.className}`;
        previewElement.style.cssText = border.style;
    }
}

async function handleSaveBorder() {
    const name = document.getElementById('border-name-input').value.trim();
    if (!name) {
        alert('Please enter a name for the border.');
        return;
    }

    const css = {
        borderSize: document.getElementById('border-size-slider').value,
        borderStyle: document.getElementById('border-style-select').value,
        borderWidth: document.getElementById('border-width-slider').value,
        borderColor1: document.getElementById('border-color-1').value,
        borderColor2: document.getElementById('border-color-2').value,
        gradientAngle: document.getElementById('gradient-angle-slider').value,
        boxShadowBlur: document.getElementById('box-shadow-blur-slider').value,
        boxShadowSpread: document.getElementById('box-shadow-spread-slider').value,
        boxShadowColor: document.getElementById('box-shadow-color-picker').value,
        animationName: document.getElementById('animation-select').value,
        animationDuration: document.getElementById('animation-duration-slider').value,
        animationDirection: document.getElementById('animation-direction-select').value,
    };

    try {
        await addDoc(collection(db, "customBorders"), {
            name: name,
            css: css,
            createdBy: getState().currentUserData.uid,
            createdAt: serverTimestamp()
        });
        alert('Border saved successfully!');
        hideAllModals();
    } catch (error) {
        console.error("Error saving border:", error);
        alert('Failed to save border. Please check the console for errors.');
    }
}
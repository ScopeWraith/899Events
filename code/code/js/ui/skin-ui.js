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
    // Link checkboxes to their color inputs
    ['3', '4', '5'].forEach(num => {
        const checkbox = document.getElementById(`enable-color-${num}`);
        const colorInput = document.getElementById(`border-color-${num}`);
        if (checkbox && colorInput) {
            checkbox.addEventListener('change', () => {
                colorInput.disabled = !checkbox.checked;
            });
        }
    });

    // Save button listener
    const saveBorderBtn = document.getElementById('save-border-btn');
    if (saveBorderBtn) {
        saveBorderBtn.addEventListener('click', handleSaveBorder);
    }

    // Tab functionality for the editor
    const borderEditor = document.getElementById('border-editor-modal-container');
    if (borderEditor) {
        const tabs = borderEditor.querySelectorAll('.modal-tab-btn');
        const panes = borderEditor.querySelectorAll('.modal-tab-pane');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const targetPaneId = `editor-tab-${tab.dataset.tab}`;
                panes.forEach(p => p.classList.toggle('active', p.id === targetPaneId));
            });
        });
    }
}


export function buildAvatarBorderSkins() {
    const container = document.getElementById('avatar-border-selector');
    if (!container) return;

    const { currentUserData, allAlliances, customBorders } = getState();
    if (!currentUserData || !allAlliances) return; // Guard clause
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
        let borderResult;
        if (skin.isCustom && skin.css) {
            borderResult = applyCustomBorderStyle(skin.css);
        } else {
            const previewData = { ...currentUserData, avatarBorderSkin: skin.id };
            const legacyStyles = getAvatarBorderClass(previewData, allianceData, []); // Pass empty customBorders to get legacy style
            borderResult = { main: { style: legacyStyles.style }, before: {}, after: {} };
        }

        const borderClass = skin.isCustom ? 'custom-border' : getAvatarBorderClass({ ...currentUserData, avatarBorderSkin: skin.id }, allianceData, []).className;

        return `
            <button type="button" class="skin-select-btn" data-value="${skin.id}">
                <div class="preview">
                    <div class="preview-icon"></div>
                    <div class="preview-border ${borderClass}" style="${borderResult.main.style}"></div>
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

    // Clear previous dynamic styles
    const dynamicStyleTag = document.getElementById('border-editor-dynamic-styles');
    if (dynamicStyleTag) dynamicStyleTag.innerHTML = '';
    
    let borderResult;

    if (customBorder) {
        borderResult = applyCustomBorderStyle(customBorder.css);
        previewElement.className = 'avatar-border custom-border';
    } else {
        const allianceData = allAlliances.find(a => a.tag === currentUserData.alliance);
        const legacyStyles = getAvatarBorderClass({ ...currentUserData, avatarBorderSkin: selectedSkinId }, allianceData, []);
        previewElement.className = `avatar-border ${legacyStyles.className}`;
        borderResult = { main: { style: legacyStyles.style }, before: {}, after: {} };
    }

    previewElement.style.cssText = borderResult.main.style;
    if (dynamicStyleTag) {
         dynamicStyleTag.innerHTML = `
            #border-editor-live-preview::before { ${borderResult.before.style} }
            #border-editor-live-preview::after { ${borderResult.after.style} }
        `;
    }
}

async function handleSaveBorder() {
    const name = document.getElementById('border-name-input').value.trim();
    if (!name) {
        alert('Please enter a name for the border.');
        return;
    }

    // Gather all values from the new, revamped editor
    const css = {
        // Shape & Color
        borderSize: document.getElementById('border-size-slider').value,
        borderStyle: document.getElementById('border-style-select').value,
        borderWidth: document.getElementById('border-width-slider').value,
        gradientMode: document.getElementById('gradient-mode-select').value,
        borderColor1: document.getElementById('border-color-1').value,
        borderColor2: document.getElementById('border-color-2').value,
        borderColor3: document.getElementById('border-color-3').value,
        borderColor4: document.getElementById('border-color-4').value,
        borderColor5: document.getElementById('border-color-5').value,
        enableColor3: document.getElementById('enable-color-3').checked,
        enableColor4: document.getElementById('enable-color-4').checked,
        enableColor5: document.getElementById('enable-color-5').checked,
        gradientAngle: document.getElementById('gradient-angle-slider').value,
        
        // Glow & Shadow
        boxShadowBlur: document.getElementById('box-shadow-blur-slider').value,
        boxShadowSpread: document.getElementById('box-shadow-spread-slider').value,
        boxShadowColor: document.getElementById('box-shadow-color-picker').value,
        boxShadowColor2: document.getElementById('box-shadow-color-picker-2').value,
        glowAngle: document.getElementById('glow-angle-slider').value,
        innerGlowColor: document.getElementById('inner-glow-color-picker').value,

        // Animation & FX
        animationName: document.getElementById('animation-select').value,
        animationDuration: document.getElementById('animation-duration-slider').value,
        animationDirection: document.getElementById('animation-direction-select').value,
        animateGradient: document.getElementById('animate-gradient-toggle').checked,
        borderTexture: document.getElementById('border-texture-select').value,
        textEffect: document.getElementById('text-effect-select').value
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
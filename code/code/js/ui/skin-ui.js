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
    const editor = document.getElementById('border-editor-modal-container');
    if (editor) {
        editor.querySelectorAll('.control-color-enable').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const colorIndex = checkbox.dataset.colorIndex;
                const colorInput = checkbox.closest('.editor-group-content').querySelector(`.control-color[data-color-index="${colorIndex}"]`);
                if (colorInput) {
                    colorInput.disabled = !checkbox.checked;
                }
            });
        });
    }
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
    if (!currentUserData || !allAlliances) return;
    const allianceData = allAlliances.find(a => a.tag === currentUserData.alliance);
    
    const skins = [
        { id: 'rank', label: 'Rank' },
        { id: 'alliance', label: 'Alliance' }
    ];

    if (currentUserData.isAdmin) {
        skins.push({ id: 'admin', label: 'Admin' });
    }
    if (customBorders) {
        customBorders.forEach(border => {
            skins.push({ id: border.id, label: border.name, isCustom: true, css: border.css });
        });
    }

    let skinsHTML = skins.map(skin => {
        const legacyStyles = getAvatarBorderClass({ ...currentUserData, avatarBorderSkin: skin.id }, allianceData, customBorders);
        
        return `
            <button type="button" class="skin-select-btn" data-value="${skin.id}">
                <div class="preview">
                    <div class="preview-icon"></div>
                    <div class="preview-border ${legacyStyles.className}" style="${legacyStyles.style}"></div>
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

    const controls = document.getElementById('border-editor-controls');
    const css = { layers: {} };

    controls.querySelectorAll('.layer-controls').forEach(item => {
        const layerIndex = item.dataset.layer;
        const isEnabled = (layerIndex === '1') || item.querySelector('.layer-enable-toggle')?.checked;

        const layerData = {
            enabled: isEnabled,
            thickness: item.querySelector('.control-thickness').value,
            color: item.querySelector('.control-color').value,
            opacity: item.querySelector('.control-opacity').value,
            innerGlow: { enabled: false },
            outerGlow: { enabled: false }
        };

        item.querySelectorAll('.glow-controls-group').forEach(glowGroup => {
            const glowType = glowGroup.querySelector('.glow-enable-toggle').dataset.glowType;
            if (glowGroup.querySelector('.glow-enable-toggle').checked) {
                const glowContent = glowGroup.querySelector('.glow-content');
                layerData[`${glowType}Glow`] = {
                    enabled: true,
                    color: glowContent.querySelector('.glow-color').value,
                    opacity: glowContent.querySelector('.glow-opacity').value,
                    blur: glowContent.querySelector('.glow-blur').value,
                    spread: glowContent.querySelector('.glow-spread').value
                };
            }
        });
        css.layers[layerIndex] = layerData;
    });

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
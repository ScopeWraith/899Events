import { initializeApp } from './app.js';
import { initializeSkinUI } from './ui/skin-ui.js';
import { updateBorderEditorPreview } from './event-listeners.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeSkinUI();

    Coloris({
        el: '.coloris',
        themeMode: 'dark',
        format: 'rgba',
        alpha: true,
        formatToggle: false, // This line disables the format switcher, fixing the bug.
        onChange: () => updateBorderEditorPreview(),
        swatches: [
          '#0D1117',
          '#F87171',
          '#00BFFF',
          '#FFFFFF',
          '#FFD700',
          '#9370DB',
          '#7CFC00'
        ]
    });
});
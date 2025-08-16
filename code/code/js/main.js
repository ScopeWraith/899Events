import { initializeApp } from './app.js';
import { initializeSkinUI } from './ui/skin-ui.js';
// NEW: Import the preview function
import { updateBorderEditorPreview } from './event-listeners.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeSkinUI();

    // UPDATED: Configure Coloris with the onChange callback
    Coloris({
        el: '.coloris',
        themeMode: 'dark',
        format: 'rgba',
        alpha: true,
        // This callback ensures the preview updates when the color changes
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
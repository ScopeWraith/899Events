// code/js/main.js
import { initializeApp } from './app.js';
import { initializeSkinUI } from './ui/skin-ui.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeSkinUI();
});
document.addEventListener('DOMContentLoaded', () => {
    // Your existing initializeApp() and initializeSkinUI() calls remain here
    initializeApp();
    initializeSkinUI();

    // NEW: Add this to configure the Coloris color picker
    Coloris({
        el: '.coloris',
        themeMode: 'dark',
        format: 'rgba',
        alpha: true,
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
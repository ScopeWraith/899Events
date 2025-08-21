// code/js/main.js
import { initializeApp } from './app.js';
import { initializeSkinUI } from './ui/skin-ui.js';

/**
 * Main entry point for the application.
 * This script waits for the DOM to be fully loaded before initializing the application
 * and its various UI components.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Register the service worker for PWA functionality
    if ('serviceWorker' in navigator) {
        // Corrected the path to the service worker file
        navigator.serviceWorker.register('code/sw.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }

    initializeApp();
    initializeSkinUI();
});
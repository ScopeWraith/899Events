// code/js/main.js
import { initializeApp } from './app.js';
import { initializeSkinUI } from './ui/skin-ui.js';

/**
 * Main entry point for the application.
 * This script waits for the DOM to be fully loaded before initializing the application
 * and its various UI components.
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeSkinUI();
});
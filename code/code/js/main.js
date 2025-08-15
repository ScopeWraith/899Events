// code/js/main.js
import { initializeApp } from './app.js';
import { initializeSkinUI } from './ui/skin-ui.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeSkinUI();
});
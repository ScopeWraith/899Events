// js/app.js

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from './firebase-config.js';
import { initAuth, handleUserLoggedIn, handleUserLoggedOut } from './modules/auth.js';
import { initUI, showPage, renderSkeletons } from './modules/ui.js';
import { initData } from './modules/data.js';

document.addEventListener('DOMContentLoaded', () => {
    renderSkeletons();
    initUI();
    initAuth();

    let isFirstAuth = true;

    onAuthStateChanged(auth, user => {
        if (user) {
            handleUserLoggedIn(user);
        } else {
            handleUserLoggedOut();
        }

        if (isFirstAuth) {
            const appPreloader = document.getElementById('app-preloader');
            const appContainer = document.getElementById('app-container');
            
            appPreloader.style.opacity = '0';
            setTimeout(() => {
                appPreloader.style.display = 'none';
                appContainer.style.display = 'block';
            }, 500);

            showPage('page-events');
            initData();
            isFirstAuth = false;
        }
    });
});
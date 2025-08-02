// js/app.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

import { firebaseConfig } from './firebase-config.js';
import { DOMElements, initParticles, renderSkeletons, showPage, renderPosts, updateUIForLoggedInUser, updateUIForLoggedOutUser, renderPlayers, renderMessages, renderFriendsLists, updateSocialTabPermissions, renderEditProfileModal, renderFeed } from './ui.js';
import { initApi, listenToPosts, listenToUsers, listenToChat, listenToFriends, listenToNotifications, updateUserProfile, uploadFileAndGetURL, sendFriendRequest, acceptFriendRequest, removeOrDeclineFriend } from './api.js';
import { initAuth, onAuthStateChanged, handleLogout } from './auth.js';
import { isUserLeader, resizeImage } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. INITIALIZATION ---
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    const firebaseServices = { app, auth, db, storage };

    initApi(firebaseServices);
    initAuth(firebaseServices);
    initParticles();
    renderSkeletons();

    // --- 2. STATE MANAGEMENT ---
    let currentUserData = null;
    let allPosts = [];
    let allPlayers = [];
    let friendsData = [];
    let notifications = [];
    let socialListeners = [];
    let notificationListener = null;

    // --- 3. AUTHENTICATION LISTENER ---
    onAuthStateChanged(
        (user) => {
            currentUserData = user;
            updateUIForLoggedInUser(user);
            updateSocialTabPermissions(user);
            renderPosts(allPosts, currentUserData);
            renderPlayers(allPlayers, currentUserData);
            setupSocialListeners();
            setupNotificationListener();
        },
        () => {
            currentUserData = null;
            updateUIForLoggedOutUser();
            updateSocialTabPermissions(null);
            renderPosts(allPosts, null);
            renderPlayers(allPlayers, null);
            detachSocialListeners();
            if (notificationListener) notificationListener();
        }
    );

    // --- 4. DATA LISTENERS ---
    listenToPosts((posts) => { allPosts = posts; renderPosts(allPosts, currentUserData); });
    listenToUsers((players) => { allPlayers = players; renderPlayers(allPlayers, currentUserData); renderFriendsLists(friendsData, allPlayers); renderFeed(notifications, allPlayers); });

    function setupSocialListeners() {
        // ... (implementation unchanged)
    }

    function setupNotificationListener() {
        if (notificationListener) notificationListener(); // Unsubscribe from old listener
        if (currentUserData) {
            notificationListener = listenToNotifications(currentUserData.uid, (data) => {
                notifications = data;
                renderFeed(notifications, allPlayers);
                const unreadCount = notifications.filter(n => !n.read).length;
                const badge = document.getElementById('notification-badge');
                if (badge) {
                    badge.textContent = unreadCount;
                    badge.classList.toggle('hidden', unreadCount === 0);
                }
            });
        }
    }

    function detachSocialListeners() {
        socialListeners.forEach(unsubscribe => unsubscribe());
        socialListeners = [];
    }

    // --- 5. GLOBAL EVENT LISTENERS ---
    DOMElements.mainNav.addEventListener('click', (e) => {
        const navLink = e.target.closest('.nav-link');
        if (navLink && navLink.dataset.mainTarget) {
            showPage(navLink.dataset.mainTarget);
        }
    });
    
    // Player Card & Edit Profile Logic
    DOMElements.playerCardBtn.addEventListener('click', () => {
        if (currentUserData) {
            renderEditProfileModal(currentUserData);
            // Attach listeners after modal is rendered
            document.getElementById('close-edit-modal-btn').addEventListener('click', () => DOMElements.editProfileModalContainer.innerHTML = '');
            document.getElementById('modal-logout-btn').addEventListener('click', handleLogout);
            document.getElementById('modal-upload-avatar-btn').addEventListener('click', () => document.getElementById('modal-avatar-input').click());
            document.getElementById('modal-avatar-input').addEventListener('change', handleModalAvatarChange);
            document.getElementById('edit-profile-form').addEventListener('submit', handleProfileUpdate);
        }
    });
    
    async function handleModalAvatarChange(e) {
        const file = e.target.files[0];
        if (!file || !currentUserData) return;
        const preview = document.getElementById('edit-avatar-preview');
        preview.style.opacity = '0.5';
        try {
            const resizedBlob = await resizeImage(file, { maxWidth: 256, maxHeight: 256 });
            const avatarUrl = await uploadFileAndGetURL(`avatars/${currentUserData.uid}`, resizedBlob);
            await updateUserProfile(currentUserData.uid, { avatarUrl });
            // The onAuthStateChanged listener will automatically update the UI
        } catch (error) {
            console.error("Avatar upload error:", error);
        } finally {
            preview.style.opacity = '1';
        }
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();
        if (!currentUserData) return;

        const submitBtn = document.getElementById('edit-profile-submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const updatedData = {
            username: document.getElementById('edit-username').value,
            alliance: document.getElementById('edit-alliance').value,
            allianceRank: document.getElementById('edit-alliance-rank').value,
            power: parseInt(String(document.getElementById('edit-power').value).replace(/,/g, ''), 10) || 0,
        };

        try {
            await updateUserProfile(currentUserData.uid, updatedData);
            DOMElements.editProfileModalContainer.innerHTML = ''; // Close modal on success
        } catch (error) {
            document.getElementById('edit-profile-error').textContent = 'Failed to save.';
            console.error("Profile update error:", error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes';
        }
    }

    // Player Page Listeners
    DOMElements.playersPage.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('button[data-action="add-friend"]');
        if (actionBtn && currentUserData) {
            const targetPlayer = allPlayers.find(p => p.uid === actionBtn.dataset.uid);
            if (targetPlayer) {
                sendFriendRequest(currentUserData, targetPlayer);
                actionBtn.innerHTML = '<i class="fas fa-user-clock"></i>';
                actionBtn.disabled = true;
            }
        }
    });
    
    // ... (Other listeners like social page, etc. are unchanged)

    // --- 6. INITIAL PAGE LOAD ---
    showPage('page-events');
    updateSocialTabPermissions(null);
});

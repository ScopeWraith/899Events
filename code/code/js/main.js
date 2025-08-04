import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from './firebase-config.js';
import { state, addUnsubscribeListener } from './state.js';
import { initializeAppEventListeners } from './event-listeners.js';
import { listenToUserProfile, listenToAllUsers, listenToPosts } from './firestore.js';
import { setupPresence } from './presence.js';
import { UIManager } from './ui/ui-manager.js';

// Instantiate the UI Manager to handle all UI updates
export const uiManager = new UIManager();
window.uiManager = uiManager; // Make it globally accessible for inline event handlers in index.html

/**
 * Initializes the application, sets up authentication state listeners,
 * and fetches initial data.
 */
function initializeApp() {
    // Set up all the event listeners for the app
    initializeAppEventListeners();

    // Listen for authentication state changes
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in
            console.log("User is signed in:", user);
            uiManager.showAuthenticatedUI();

            // Store basic user info in state immediately
            state.currentUser = { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL };

            // Set up real-time presence tracking for the current user
            setupPresence(user.uid);

            // Listen for changes to the current user's profile for real-time updates
            const unsubscribeProfile = listenToUserProfile(user.uid, (profile) => {
                // Merge profile data with existing auth data
                state.currentUser = { ...state.currentUser, ...profile };
                uiManager.updatePlayerSettings(state.currentUser);
            });
            addUnsubscribeListener(unsubscribeProfile);


            // Listen for changes to all users to update the player list
            const unsubscribeUsers = listenToAllUsers((users) => {
                state.players = users;
                uiManager.updatePlayersList(state.players, state.currentUser.uid);
            });
            addUnsubscribeListener(unsubscribeUsers);

            // Listen for new posts and updates
            const unsubscribePosts = listenToPosts((posts) => {
                state.posts = posts;
                uiManager.updatePosts(state.posts, state.currentUser.uid);
            });
            addUnsubscribeListener(unsubscribePosts);


        } else {
            // User is signed out
            console.log("User is signed out");
            // Clean up listeners and state
            state.unsubscribeAll();
            state.currentUser = null;
            state.players = [];
            state.posts = [];
            uiManager.showSignedOutUI();
        }
    });
}

// Initialize the application when the script loads
initializeApp();

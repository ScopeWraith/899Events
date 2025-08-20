// code/js/state.js

/**
 * @typedef {Object} UserData - The user profile data stored in Firestore.
 * @property {string} uid - The user's unique ID.
 * @property {string} username - The user's in-game name.
 * @property {string} email - The user's email address.
 * @property {string} alliance - The tag of the user's alliance.
 * @property {string} allianceRank - The user's rank (R1, R2, etc.).
 * @property {number} power - The user's total power.
 * @property {boolean} isVerified - Whether the user has been verified by a leader.
 * @property {boolean} isAdmin - Whether the user has admin privileges.
 * @property {string} [avatarUrl] - The URL for the user's avatar image.
 * @property {string} [avatarBorderSkin] - The selected skin for the avatar border.
 * @property {string} [chatBubbleBorderSkin] - The selected skin for the chat bubble border.
 */

/**
 * @typedef {Object} AppState - Defines the complete shape of the application's global state.
 * @property {import("firebase/auth").User | null} user - The raw Firebase Auth user object.
 * @property {boolean} isLoggedIn - A flag indicating if a user is currently authenticated.
 * @property {UserData | null} currentUserData - The profile data for the logged-in user.
 * @property {Array<UserData>} allPlayers - An array containing all players' profile data.
 * @property {Array<Object>} allAlliances - An array of all registered alliances.
 * @property {Array<Object>} allPosts - An array of all event and announcement posts.
 * @property {Object<string, Function>} listeners - A map of active Firestore listeners to their unsubscribe functions.
 * @property {Array<Object>} userNotifications - Notifications for the current user.
 * @property {Array<string>} userFriends - A list of UIDs for the current user's friends.
 * @property {Object<string, {status: string, lastSeen: any}>} userSessions - Real-time presence status for all users.
 * @property {Array<Object>} activeChatMessages - The messages for the currently viewed chat channel.
 * @property {string | null} activePrivateChatId - The ID of the currently active private chat.
 * @property {UserData | null} activePrivateChatPartner - The user object of the private chat partner.
 * @property {Array<Object>} conversations - A list of the current user's private conversations.
 * @property {Array<UserData>} unverifiedPlayers - A list of players awaiting verification, visible to leaders.
 * @property {string | null} actionPostId - The ID of the post being viewed in the modal.
 * @property {string | null} editingPostId - The ID of the post currently being edited.
 * @property {string | null} activePlayerSettingsUID - The UID of the player whose settings are being edited.
 * @property {HTMLElement | null} activeEmojiInput - The input field that the emoji picker should target.
 */

/** @type {AppState} */
let currentState = {
    user: null,
    isLoggedIn: false,
    unreadMessagesCount: 0,
    unreadFriendRequestsCount: 0,
    listeners: {}
};

const listeners = [];

/**
 * Gets a read-only copy of the current application state.
 * @returns {Readonly<AppState>} The current state.
 */
export function getState() {
    return Object.freeze({ ...currentState });
}

/**
 * Subscribes a callback function to state changes.
 * @param {(newState: AppState, prevState: AppState) => void} callback - The function to call when the state changes. It receives the new and previous state.
 * @returns {() => void} A function that, when called, unsubscribes the callback.
 */
export function subscribe(callback) {
    listeners.push(callback);
    return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
}

/**
 * Merges a partial state update into the current state and notifies all subscribers.
 * @param {Partial<AppState>} newState - An object containing the state properties to update.
 */
export function setState(newState) {
    const prevState = { ...currentState };
    currentState = { ...currentState, ...newState };

    // Notify all listeners of the change
    listeners.forEach(callback => {
        callback(currentState, prevState);
    });
}
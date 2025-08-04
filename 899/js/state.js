// code/js/state.js

/**
 * This module manages the global state of the application.
 * It holds references to the current user, all players, posts, etc.
 * It also provides a simple callback mechanism to notify other modules of state changes.
 */

let state = {
    currentUserData: null,
    allPlayers: [],
    allPosts: [],
    userSessions: {},
    userNotifications: [],
    userFriends: [],
    activeFilter: 'all',
    countdownInterval: null,
    editingPostId: null,
    actionPostId: null,
    activePrivateChatId: null,
    activePrivateChatPartner: null,
    listeners: {}, // To hold unsubscribe functions for Firestore listeners
    awayTimer: null,
    callbacks: {} // For simple pub/sub
};

export function getState() {
    return state;
}

export function updateState(newState) {
    state = { ...state, ...newState };
}

export function setCallbacks(callbacks) {
    state.callbacks = callbacks;
}

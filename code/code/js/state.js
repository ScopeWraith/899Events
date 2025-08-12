// code/js/state.js

let state = {
    currentUserData: null,
    allPlayers: [],
    allPosts: [],
    allAlliances: [],
    userSessions: {},
    userNotifications: [],
    userFriends: [],
    activeFilter: 'all',
    countdownInterval: null,
    editingPostId: null,
    actionPostId: null,
    activePrivateChatId: null,
    activePrivateChatPartner: null,
    isFriendsListCollapsed: false,
    listeners: {}, // To hold unsubscribe functions for Firestore listeners
    awayTimer: null,
    callbacks: {}, // For simple pub/sub
    activeEmojiInput: null, // NEW: Tracks the current input field for the emoji picker
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
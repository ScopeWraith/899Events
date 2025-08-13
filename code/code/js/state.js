// code/js/state.js - Refactored version

let currentState = {
    user: null,
    isLoggedIn: false,
    unreadMessagesCount: 0,
    unreadFriendRequestsCount: 0
};

const listeners = [];

export function getState() {
    return Object.freeze({ ...currentState });
}

export function subscribe(callback) {
    listeners.push(callback);
    return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
}

export function setState(newState) {
    const prevState = { ...currentState };
    currentState = { ...currentState, ...newState };

    // Notify all listeners of the change
    listeners.forEach(callback => {
        callback(currentState, prevState);
    });
}
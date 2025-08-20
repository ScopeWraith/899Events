// code/js/state.js - Corrected version

/**
 * The central state object for the application.
 * @type {object}
 */
let currentState = {
    user: null,
    isLoggedIn: false,
    unreadMessagesCount: 0,
    unreadFriendRequestsCount: 0,
    listeners: {} // This ensures listeners is never undefined
};

/**
 * An array of callback functions to be called when the state changes.
 * @type {Function[]}
 */
const listeners = [];

/**
 * Gets a read-only copy of the current application state.
 * @returns {object} A frozen object representing the current state.
 */
export function getState() {
    return Object.freeze({ ...currentState });
}

/**
 * Subscribes a callback function to state changes.
 * @param {Function} callback The function to call when the state updates. It receives `newState` and `prevState` as arguments.
 * @returns {Function} An unsubscribe function to remove the listener.
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
 * Updates the application state and notifies all subscribers.
 * @param {object} newState An object containing the new state values to merge into the current state.
 */
export function setState(newState) {
    const prevState = { ...currentState };
    currentState = { ...currentState, ...newState };

    // Notify all listeners of the change
    listeners.forEach(callback => {
        callback(currentState, prevState);
    });
}
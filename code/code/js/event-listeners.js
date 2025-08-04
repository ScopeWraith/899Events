import {
    auth
} from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    state
} from './state.js';
import {
    createUserProfile,
    updateUserProfile,
    createPost,
    updatePost,
    deletePost
} from './firestore.js';
import {
    uiManager
} from './ui/ui-manager.js';
import {
    showNotification
} from './ui/notifications-ui.js';

/**
 * Handles user sign-up.
 * @param {Event} event - The form submission event.
 */
async function handleSignUp(event) {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;
    const displayName = event.target.displayName.value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create a user profile in Firestore
        await createUserProfile(user.uid, {
            displayName: displayName,
            email: user.email,
            photoURL: '', // Default or placeholder photo
            bio: '',
            createdAt: new Date()
        });

        showNotification('Sign up successful!');
        uiManager.hideAuthModal();

    } catch (error) {
        console.error("Error signing up:", error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

/**
 * Handles user sign-in.
 * @param {Event} event - The form submission event.
 */
async function handleSignIn(event) {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showNotification('Signed in successfully!');
        uiManager.hideAuthModal();
    } catch (error) {
        console.error("Error signing in:", error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

/**
 * Handles user sign-out.
 */
async function handleSignOut() {
    try {
        await signOut(auth);
        showNotification('Signed out.');
    } catch (error) {
        console.error("Error signing out:", error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

/**
 * Handles new post creation.
 * @param {Event} event - The form submission event.
 */
async function handlePostCreate(event) {
    event.preventDefault();
    const content = event.target.content.value;
    if (!content.trim()) {
        showNotification('Post cannot be empty.', 'error');
        return;
    }

    if (state.currentUser) {
        try {
            await createPost({
                content: content,
                uid: state.currentUser.uid,
                displayName: state.currentUser.displayName,
                photoURL: state.currentUser.photoURL,
            });
            event.target.reset(); // Clear the form
        } catch (error) {
            console.error("Error creating post:", error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    } else {
        showNotification('You must be signed in to post.', 'error');
    }
}

/**
 * Handles the submission of the profile edit form.
 * @param {Event} event - The form submission event.
 */
async function handleProfileUpdate(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const displayName = formData.get('displayName');
    const photoURL = formData.get('photoURL');
    const bio = formData.get('bio');

    const dataToUpdate = {
        displayName,
        photoURL,
        bio
    };

    if (state.currentUser && state.currentUser.uid) {
        try {
            await updateUserProfile(state.currentUser.uid, dataToUpdate);
            showNotification('Profile updated successfully!');
            uiManager.hideEditProfileModal();
        } catch (error)
        {
            console.error("Error updating profile: ", error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    } else {
        console.error("Cannot update profile. No current user found in state.");
        showNotification('Could not find user to update.', 'error');
    }
}

/**
 * Handles the submission of the post edit form.
 * @param {Event} event - The form submission event.
 */
async function handlePostUpdate(event) {
    event.preventDefault();
    const form = event.target;
    const postId = form.querySelector('#edit-post-id').value;
    const newContent = form.querySelector('#edit-post-content').value;

    if (postId && newContent) {
        try {
            await updatePost(postId, {
                content: newContent
            });
            showNotification('Post updated!');
            uiManager.hideEditPostModal();
        } catch (error) {
            console.error("Error updating post: ", error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    }
}

/**
 * Shows the modal to edit a post.
 * This function is exported to be used in post-ui.js
 * @param {string} postId - The ID of the post to edit.
 * @param {string} currentContent - The current text content of the post.
 */
export function handlePostEdit(postId, currentContent) {
    uiManager.showEditPostModal(postId, currentContent);
}

/**
 * Handles the deletion of a post.
 * This function is exported to be used in post-ui.js
 * @param {string} postId - The ID of the post to delete.
 */
export async function handlePostDelete(postId) {
    // A custom modal would be better than window.confirm for a polished UX
    if (window.confirm('Are you sure you want to delete this post?')) {
        try {
            await deletePost(postId);
            showNotification('Post deleted.');
        } catch (error) {
            console.error("Error deleting post: ", error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    }
}


/**
 * Initializes all the application's event listeners.
 */
export function initializeAppEventListeners() {
    // Auth form listeners
    document.getElementById('signup-form').addEventListener('submit', handleSignUp);
    document.getElementById('signin-form').addEventListener('submit', handleSignIn);

    // Button listeners
    document.getElementById('sign-out-btn').addEventListener('click', handleSignOut);
    document.getElementById('sign-in-register-btn').addEventListener('click', () => uiManager.showAuthModal());

    // Post creation listener
    document.getElementById('create-post-form').addEventListener('submit', handlePostCreate);

    // Modal-specific form listeners
    document.getElementById('edit-profile-form').addEventListener('submit', handleProfileUpdate);
    document.getElementById('edit-post-form').addEventListener('submit', handlePostUpdate);
}

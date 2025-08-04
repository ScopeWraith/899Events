// js/modules/auth.js

import { auth, storage, db } from '../firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    sendPasswordResetEmail,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    doc, setDoc, updateDoc, addDoc, serverTimestamp, 
    collection, query, where, getDocs, writeBatch, deleteDoc 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { showModal, hideAllModals, showAuthModal, showConfirmationModal, setCustomSelectValue } from './ui.js';
import { state, constants, detachAllListeners, setupAllListeners, renderPosts, applyPlayerFilters, buildMobileNav } from '../app.js';

export function initAuth() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegistration);
    document.getElementById('profile-dropdown-logout').addEventListener('click', () => signOut(auth));
    document.getElementById('forgot-password-link').addEventListener('click', handleForgotPassword);
    document.getElementById('show-register-link').addEventListener('click', (e) => { e.preventDefault(); showAuthModal('register'); });
    document.getElementById('show-login-link').addEventListener('click', (e) => { e.preventDefault(); showAuthModal('login'); });
    document.getElementById('edit-profile-form').addEventListener('submit', handleEditProfileSubmit);
    document.getElementById('player-settings-form').addEventListener('submit', handlePlayerSettingsSubmit);
    document.getElementById('create-post-form').addEventListener('submit', handleCreatePostSubmit);
    document.getElementById('modal-delete-post-btn').addEventListener('click', () => {
        if (state.actionPostId) {
            deletePost(state.actionPostId);
        }
    });
    document.getElementById('modal-edit-post-btn').addEventListener('click', () => {
        if (state.actionPostId) {
            hideAllModals();
            showEditPostModal(state.actionPostId);
        }
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit-btn');
    errorElement.textContent = '';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging In...';

    try {
        await signInWithEmailAndPassword(auth, email, password);
        hideAllModals();
    } catch (error) {
        console.error("Login Error:", error);
        errorElement.textContent = (error.code === 'auth/invalid-credential') 
            ? "Invalid email or password." 
            : "An unknown error occurred.";
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
}

async function handleRegistration(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('register-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Registering...';
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const alliance = document.getElementById('register-alliance').value;
    const allianceRank = document.getElementById('register-alliance-rank').value;
    const parsePower = (str) => parseInt(String(str).replace(/,/g, ''), 10) || 0;
    const power = parsePower(document.getElementById('register-power').value);
    const tankPower = parsePower(document.getElementById('register-tank-power').value);
    const airPower = parsePower(document.getElementById('register-air-power').value);
    const missilePower = parsePower(document.getElementById('register-missile-power').value);
    const registerError = document.getElementById('register-error');

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userProfile = {
            username, email, alliance, allianceRank, power, tankPower, airPower, missilePower,
            likes: 0, allianceRole: '', isVerified: false, avatarUrl: null,
            isAdmin: email === 'mikestancato@gmail.com',
            registrationTimestampUTC: new Date().toISOString(),
        };
        if (userProfile.isAdmin) userProfile.isVerified = true;

        await setDoc(doc(db, "users", user.uid), userProfile);
        
        hideAllModals();

    } catch (error) {
        console.error("Registration Error:", error);
        registerError.textContent = error.code === 'auth/email-already-in-use' ? 'This email is already registered.' : 'An error occurred.';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Register';
    }
}

function handleForgotPassword(e) {
    e.preventDefault();
    const email = prompt("Please enter your email address to receive a password reset link:");
    if (!email) return;

    sendPasswordResetEmail(auth, email)
        .then(() => alert('Password reset email sent! Please check your inbox.'))
        .catch((error) => alert(error.message));
}

export async function handleEditProfileSubmit(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    
    const errorElement = document.getElementById('edit-profile-error');
    errorElement.textContent = '';
    
    const parsePower = (str) => parseInt(String(str).replace(/,/g, ''), 10) || 0;

    const updatedData = {
        username: document.getElementById('edit-username').value,
        alliance: document.getElementById('edit-alliance').value,
        allianceRank: document.getElementById('edit-alliance-rank').value,
        power: parsePower(document.getElementById('edit-power').value),
        tankPower: parsePower(document.getElementById('edit-tank-power').value),
        airPower: parsePower(document.getElementById('edit-air-power').value),
        missilePower: parsePower(document.getElementById('edit-missile-power').value),
    };

    try {
        await updateDoc(doc(db, "users", user.uid), updatedData);
        hideAllModals();
    } catch (error) {
        console.error("Update profile error:", error);
        errorElement.textContent = "Failed to update profile.";
    }
}

export async function handlePlayerSettingsSubmit(e) {
    e.preventDefault();
    if (!state.activePlayerSettingsUID || !state.currentUserData) return;

    const errorElement = document.getElementById('player-settings-error');
    errorElement.textContent = '';

    const updatedData = {
        allianceRank: document.getElementById('setting-alliance-rank').value,
        allianceRole: document.getElementById('setting-alliance-role').value,
        isVerified: document.getElementById('setting-verified').checked,
    };

    try {
        await updateDoc(doc(db, "users", state.activePlayerSettingsUID), updatedData);
        hideAllModals();
    } catch (error) {
        console.error("Error updating player settings:", error);
        errorElement.textContent = "Failed to save settings.";
    }
}

export async function handleCreatePostSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('post-submit-btn');
    if (!state.currentUserData) {
        document.getElementById('create-post-error').textContent = 'You must be logged in to post.';
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
    
    const finalPostData = {
        mainType: state.postCreationData.mainType,
        subType: state.postCreationData.subType,
        title: document.getElementById('post-title').value,
        details: document.getElementById('post-details').value,
        authorUid: state.currentUserData.uid,
        authorUsername: state.currentUserData.username,
        visibility: state.postCreationData.visibility,
    };

    try {
        let postDocRef;
        if (state.editingPostId) {
            postDocRef = doc(db, 'posts', state.editingPostId);
            await updateDoc(postDocRef, finalPostData);
        } else {
            finalPostData.createdAt = serverTimestamp();
            postDocRef = await addDoc(collection(db, 'posts'), finalPostData);
        }
        hideAllModals();
    } catch (error) {
        console.error("Error saving post: ", error);
        document.getElementById('create-post-error').textContent = 'Failed to save post.';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = state.editingPostId ? '<i class="fas fa-save mr-2"></i>Save Changes' : '<i class="fas fa-check-circle mr-2"></i>Create Post';
    }
}

export function deletePost(postId) {
    const postToDelete = state.allPosts.find(p => p.id === postId);
    showConfirmationModal('Delete Post?', `Are you sure you want to delete "${postToDelete.title}"? This action cannot be undone.`, async () => {
        try {
           await deleteDoc(doc(db, 'posts', postId));
        } catch (err) {
           console.error("Error deleting post: ", err);
           alert("Error: Could not delete post.");
        }
    });
}
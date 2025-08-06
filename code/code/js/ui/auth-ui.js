// code/js/ui/auth-ui.js

/**
 * This module handles all UI logic related to authentication,
 * including registration steps, login form, profile editing, and avatar updates.
 */

import { auth, db, storage } from '../firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, setDoc, updateDoc, writeBatch, collection, query, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { getState, updateState } from '../state.js';
import { resizeImage } from '../utils.js';
import { hideAllModals, setCustomSelectValue } from './ui-manager.js';
import { ALLIANCE_RANKS } from '../constants.js';

let currentRegStep = 1;
let resizedAvatarBlob = null;

export function initializeRegistrationStepper() {
    currentRegStep = 1;
    resizedAvatarBlob = null;
    document.getElementById('register-avatar-preview').src = 'https://placehold.co/128x128/161B22/FFFFFF?text=Avatar';
    showRegStep(currentRegStep);
    document.getElementById('registration-flow').style.display = 'block';
    document.getElementById('registration-success').style.display = 'none';
}

function showRegStep(stepIndex) {
    const registrationFlow = document.getElementById('registration-flow');
    const regFormSlides = registrationFlow.querySelectorAll('.form-slide');
    const regProgressSteps = registrationFlow.querySelectorAll('.progress-step');
    const regProgressBarLine = registrationFlow.querySelector('.progress-bar .line');
    const regBackBtn = document.getElementById('register-back-btn');
    const regNextBtn = document.getElementById('register-next-btn');
    const regSubmitBtn = document.getElementById('register-submit-btn');

    regFormSlides.forEach((slide) => slide.classList.remove('active'));
    const currentSlide = registrationFlow.querySelector(`.form-slide[data-slide="${stepIndex}"]`);
    if(currentSlide) currentSlide.classList.add('active');

    regProgressSteps.forEach((step, index) => step.classList.toggle('active', index < stepIndex));
    regProgressBarLine.style.width = `${((stepIndex - 1) / (regFormSlides.length - 1)) * 100}%`;
    regBackBtn.style.visibility = stepIndex === 1 ? 'hidden' : 'visible';
    regNextBtn.classList.toggle('hidden', stepIndex === regFormSlides.length);
    regSubmitBtn.classList.toggle('hidden', stepIndex !== regFormSlides.length);
}

function validateRegStep(stepIndex) {
    const registerError = document.getElementById('register-error');
    registerError.textContent = '';
    const slide = document.querySelector(`.form-slide[data-slide="${stepIndex}"]`);
    if (stepIndex === 1) {
        const username = slide.querySelector('#register-username').value;
        const email = slide.querySelector('#register-email').value;
        const password = slide.querySelector('#register-password').value;
        const passwordVerify = slide.querySelector('#register-password-verify').value;
        if (!username || !email || !password || !passwordVerify) { registerError.textContent = 'Please fill out all account fields.'; return false; }
        if (password.length < 6) { registerError.textContent = 'Password must be at least 6 characters long.'; return false; }
        if (password !== passwordVerify) { registerError.textContent = 'Passwords do not match.'; return false; }
    } else if (stepIndex === 2) {
        if (!slide.querySelector('#register-alliance').value || !slide.querySelector('#register-alliance-rank').value) { registerError.textContent = 'Please select your alliance and rank.'; return false; }
    } else if (stepIndex === 3) {
        if (!slide.querySelector('#register-power').value) { registerError.textContent = 'Please enter your total power.'; return false; }
    }
    return true;
}

export function handleRegistrationNext() {
    if (validateRegStep(currentRegStep)) {
        currentRegStep++;
        showRegStep(currentRegStep);
    }
}

export function handleRegistrationBack() {
    currentRegStep--;
    showRegStep(currentRegStep);
}

export async function handleAvatarSelection(e) {
    const file = e.target.files[0];
    if (!file) return;
    resizedAvatarBlob = await resizeImage(file, { maxWidth: 1024, maxHeight: 1024 });
    document.getElementById('register-avatar-preview').src = URL.createObjectURL(resizedAvatarBlob);
}

export async function handleRegistrationSubmit(e) {
    e.preventDefault();
    if (!validateRegStep(currentRegStep)) return;
    
    const regSubmitBtn = document.getElementById('register-submit-btn');
    const registerError = document.getElementById('register-error');

    regSubmitBtn.disabled = true;
    regSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Registering...';
    
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

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        let avatarUrl = null;
        if (resizedAvatarBlob) {
            const avatarRef = ref(storage, `avatars/${user.uid}`);
            await uploadBytes(avatarRef, resizedAvatarBlob);
            avatarUrl = await getDownloadURL(avatarRef);
        }

        const userProfile = {
            username, email, alliance, allianceRank, power, tankPower, airPower, missilePower,
            likes: 0, allianceRole: '', isVerified: false, avatarUrl,
            isAdmin: email === 'mikestancato@gmail.com',
            registrationTimestampUTC: new Date().toISOString(),
        };
        if (userProfile.isAdmin) {
            userProfile.isVerified = true;
        }

        await setDoc(doc(db, "users", user.uid), userProfile);
        
        // Create verification notifications for leaders
        const leadersQuery = query(collection(db, 'users'), where('alliance', '==', alliance), where('allianceRank', 'in', ['R5', 'R4']));
        const leadersSnapshot = await getDocs(leadersQuery);
        const batch = writeBatch(db);
        leadersSnapshot.forEach(leaderDoc => {
            const notificationRef = doc(collection(db, 'notifications'));
            batch.set(notificationRef, {
                recipientUid: leaderDoc.id,
                senderUid: user.uid,
                senderUsername: username,
                type: 'verification_request',
                message: `${username} has joined your alliance and is awaiting verification.`,
                isRead: false,
                timestamp: serverTimestamp()
            });
        });
        await batch.commit();

        document.getElementById('registration-flow').style.display = 'none';
        document.getElementById('registration-success').style.display = 'block';
        setTimeout(hideAllModals, 3000);
    } catch (error) {
        console.error("Registration Error:", error);
        registerError.textContent = error.code === 'auth/email-already-in-use' ? 'This email is already registered.' : 'An error occurred.';
    } finally {
        regSubmitBtn.disabled = false;
        regSubmitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Register';
    }
}

export function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit-btn');
    errorElement.textContent = '';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging In...';

    signInWithEmailAndPassword(auth, email, password).catch((error) => {
        console.error("Login Error:", error);
        errorElement.textContent = (error.code === 'auth/invalid-credential') 
            ? "Invalid email or password." 
            : "An unknown error occurred.";
    }).finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    });
}

export function handleForgotPassword(e) {
    e.preventDefault();
    const email = prompt("Please enter your email address to receive a password reset link:");
    if (!email) return;

    sendPasswordResetEmail(auth, email)
        .then(() => alert('Password reset email sent! Please check your inbox.'))
        .catch((error) => alert(error.message));
}

export function populateEditForm() {
    const { currentUserData } = getState();
    if (!currentUserData) return;
    document.getElementById('edit-username').value = currentUserData.username;
    
    const editAllianceSelect = document.getElementById('edit-alliance').closest('.custom-select-container');
    const editRankSelect = document.getElementById('edit-alliance-rank').closest('.custom-select-container');
    
    setCustomSelectValue(editAllianceSelect, currentUserData.alliance);
    const rankData = ALLIANCE_RANKS.find(r => r.value === currentUserData.allianceRank);
    setCustomSelectValue(editRankSelect, currentUserData.allianceRank, rankData ? rankData.text : currentUserData.allianceRank);
    
    document.getElementById('edit-power').value = (currentUserData.power || 0).toLocaleString();
    document.getElementById('edit-tank-power').value = (currentUserData.tankPower || 0).toLocaleString();
    document.getElementById('edit-air-power').value = (currentUserData.airPower || 0).toLocaleString();
    document.getElementById('edit-missile-power').value = (currentUserData.missilePower || 0).toLocaleString();
}

export async function handleEditProfileSubmit(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    
    const { currentUserData } = getState();
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

    if (currentUserData && updatedData.alliance !== currentUserData.alliance) {
        updatedData.isVerified = false;
    }

    try {
        await updateDoc(doc(db, "users", user.uid), updatedData);
        hideAllModals();
    } catch (error) {
        console.error("Update profile error:", error);
        errorElement.textContent = "Failed to update profile.";
    }
}

export async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    const user = auth.currentUser;
    if (!file || !user) return;

    const userAvatarButton = document.getElementById('user-avatar-button');
    userAvatarButton.style.opacity = '0.5';
    try {
        const resizedBlob = await resizeImage(file, { maxWidth: 1024, maxHeight: 1024 });
        const avatarRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(avatarRef, resizedBlob);
        const downloadURL = await getDownloadURL(avatarRef);
        await updateDoc(doc(db, "users", user.uid), { avatarUrl: downloadURL });
    } catch (error) {
        console.error("Avatar upload error:", error);
        alert("Failed to upload avatar. Please try again.");
    } finally {
        userAvatarButton.style.opacity = '1';
    }
}

export function updateAvatarDisplay(data) {
    const avatarUrl = data.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${data.username.charAt(0).toUpperCase()}`;
    document.getElementById('user-avatar-button').src = avatarUrl;
    document.getElementById('user-avatar-mobile').src = avatarUrl;
    // Add this line
    document.getElementById('mobile-avatar-badge').textContent = `[${data.alliance}] ${data.allianceRank}`;
}

export function updatePlayerProfileDropdown() {
    const { currentUserData, userNotifications } = getState();
    if (!currentUserData) return;

    document.getElementById('profile-dropdown-power').textContent = (currentUserData.power || 0).toLocaleString();
     
    const friendRequests = userNotifications.filter(n => n.type === 'friend_request' && !n.isRead);
    const friendReqBtn = document.getElementById('profile-dropdown-friends');
    const friendReqBadge = friendReqBtn.querySelector('.badge');
     
    if (friendRequests.length > 0) {
        friendReqBadge.textContent = friendRequests.length;
        friendReqBadge.classList.remove('hidden');
        friendReqBtn.disabled = false;
    } else {
        friendReqBadge.classList.add('hidden');
        friendReqBtn.disabled = true;
    }
     
    // This is correctly a placeholder for now
    const messagesBtn = document.getElementById('profile-dropdown-messages');
    messagesBtn.disabled = true;
}
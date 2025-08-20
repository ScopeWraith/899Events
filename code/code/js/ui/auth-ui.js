// code/js/ui/auth-ui.js

import { auth, db, storage } from '../firebase-config.js';
import { signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, setDoc, updateDoc, writeBatch, collection, query, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { subscribe, setState, getState } from '../state.js';
import { resizeImage , getAvatarBorderClass} from '../utils.js';
import { hideAllModals, setCustomSelectValue, buildMobileNav } from './ui-manager.js';
import { RANK_STYLES, ALLIANCE_RANKS, AVATAR_BORDERS, CHAT_BUBBLE_BORDERS } from '../constants.js';
import { sendVerificationRequest } from '../firestore.js';
import { buildAvatarBorderSkins, updateSkinSelection, updateAvatarBorderPreview, buildChatBubbleBorderSkins } from './skin-ui.js';

// --- STATE & RENDER FUNCTIONS ---

/**
 * Renders UI components related to authentication and user profile display.
 * Subscribed to the main state, it updates the UI when user data changes.
 * @param {object} newState The new, updated state object.
 * @param {object} prevState The previous state object.
 */
function renderAuthUI(newState, prevState) {
    if (newState.currentUserData !== prevState.currentUserData || newState.allAlliances !== prevState.allAlliances) {
        updateAvatarDisplay(newState.currentUserData);
        buildMobileNav(); 
    }

    if (newState.userNotifications !== prevState.userNotifications) {
        updatePlayerProfileDropdown(newState.currentUserData, newState.userNotifications);
    }
}

/**
 * Initializes the authentication UI components.
 * Subscribes the render function to state changes and sets up input formatters.
 */
export function initializeAuthUI() {
    subscribe(renderAuthUI);
    document.querySelectorAll('.power-input').forEach(input => {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/,/g, '');
            if (isNaN(value) || value === '') {
                e.target.value = '';
            } else {
                e.target.value = parseInt(value, 10).toLocaleString('en-US');
            }
        });
    });
}

// --- UI HELPER FUNCTIONS ---

/**
 * Updates the user avatar and profile information in the main navigation header.
 * Toggles visibility of login buttons vs. profile dropdowns based on auth state.
 * @param {object|null} data The current user's data object, or null if logged out.
 */
export function updateAvatarDisplay(data) {
    const { allAlliances } = getState();
    const loginBtn = document.getElementById('login-btn');
    const userProfileNavItem = document.getElementById('user-profile-nav-item');
    const mobileAuthContainer = document.getElementById('mobile-auth-container');
    const loginBtnMobile = document.getElementById('login-btn-mobile');

    if (data) {
        loginBtn.classList.add('hidden');
        userProfileNavItem.classList.remove('hidden');
        mobileAuthContainer.classList.add('logged-in');
        loginBtnMobile.classList.add('hidden');

        document.getElementById('username-display').textContent = data.username;
        
        const allianceData = allAlliances ? allAlliances.find(a => a.tag === data.alliance) : null;
        const avatarUrl = data.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${data.username.charAt(0).toUpperCase()}`;
        const border = getAvatarBorderClass(data, allianceData);

        const userAvatarButton = document.getElementById('user-avatar-button');
        userAvatarButton.src = avatarUrl;
        userAvatarButton.className = `w-6 h-6 rounded-full mr-2 object-cover ${border.className}`;
        userAvatarButton.style.cssText = border.style;

        const userAvatarMobile = document.getElementById('user-avatar-mobile');
        userAvatarMobile.src = avatarUrl;
        userAvatarMobile.className = `w-8 h-8 rounded-full object-cover ${border.className}`;
        userAvatarMobile.style.cssText = border.style;
        
        const mobileAlliance = document.getElementById('mobile-avatar-alliance');
        const mobileRank = document.getElementById('mobile-avatar-rank');
        mobileAlliance.textContent = `[${data.alliance}]`;
        mobileRank.textContent = data.allianceRank;
        
        mobileAlliance.classList.toggle('unverified-player-text', !data.isVerified);
        mobileRank.classList.toggle('unverified-player-text', !data.isVerified);

    } else {
        loginBtn.classList.remove('hidden');
        userProfileNavItem.classList.add('hidden');
        userProfileNavItem.classList.remove('open');
        mobileAuthContainer.classList.remove('logged-in');
        loginBtnMobile.classList.remove('hidden');
    }
}

/**
 * Updates the content of the player profile dropdown menu.
 * Shows/hides admin-specific buttons and updates notification badges.
 * @param {object} currentUserData The current user's data.
 * @param {Array<object>} userNotifications The user's notifications.
 */
export function updatePlayerProfileDropdown(currentUserData, userNotifications) {
    if (!currentUserData) return;
    const dropdownContainer = document.getElementById('player-profile-dropdown');
    if (!dropdownContainer) return;
    const canCreatePost = currentUserData.isAdmin || (currentUserData.isVerified && (currentUserData.allianceRank === 'R5' || currentUserData.allianceRank === 'R4'));
    let postButtonsHTML = '';
    if (canCreatePost) {
        postButtonsHTML = `
            <button id="admin-create-event-dropdown-btn" class="dropdown-link profile-menu-link"><span><i class="fas fa-calendar-plus fa-fw w-6 text-center mr-2"></i>Create Event</span></button>
            <button id="admin-create-announcement-dropdown-btn" class="dropdown-link profile-menu-link"><span><i class="fas fa-bullhorn fa-fw w-6 text-center mr-2"></i>Create Announcement</span></button>
            <div class="p-1"><hr class="border-t border-white/10"></div>
        `;
    }
    dropdownContainer.innerHTML = `
        <div class="p-2 mb-2 border-b border-white/10"><p class="text-sm text-gray-400">Total Power</p><p id="profile-dropdown-power" class="text-lg font-bold text-white">${(currentUserData.power || 0).toLocaleString()}</p></div>
        ${postButtonsHTML}
        <button id="profile-dropdown-friends" class="dropdown-link profile-menu-link"><span><i class="fas fa-user-plus fa-fw w-6 text-center mr-2"></i>Friend Requests</span><span class="badge hidden">0</span></button>
        <button id="profile-dropdown-messages" class="dropdown-link profile-menu-link"><span><i class="fas fa-envelope fa-fw w-6 text-center mr-2"></i>Private Messages</span><span class="badge hidden">0</span></button>
        <button id="profile-dropdown-edit" class="dropdown-link profile-menu-link"><span><i class="fas fa-edit fa-fw w-6 text-center mr-2"></i>Edit Profile</span></button>
        <button id="profile-dropdown-avatar" class="dropdown-link profile-menu-link"><span><i class="fas fa-camera fa-fw w-6 text-center mr-2"></i>Change Avatar</span></button>
        <input type="file" id="avatar-upload-input" class="hidden" accept="image/*">
        <div class="p-1"><hr class="border-t border-white/10"></div>
        <button id="profile-dropdown-logout" class="dropdown-link profile-menu-link w-full text-left"><span><i class="fas fa-sign-out-alt fa-fw w-6 text-center mr-2"></i>Log Out</span></button>
    `;
    const friendReqBtn = document.getElementById('profile-dropdown-friends');
    if (friendReqBtn && userNotifications) {
        const friendRequests = userNotifications.filter(n => n.type === 'friend_request' && !n.isRead);
        const friendReqBadge = friendReqBtn.querySelector('.badge');
        if (friendRequests.length > 0) {
            friendReqBadge.textContent = friendRequests.length;
            friendReqBadge.classList.remove('hidden');
            friendReqBtn.disabled = false;
        } else {
            friendReqBadge.classList.add('hidden');
            friendReqBtn.disabled = true;
        }
    }
    const messagesBtn = document.getElementById('profile-dropdown-messages');
    if (messagesBtn) messagesBtn.disabled = true;
}

/** The current step in the multi-step registration form. @type {number} */
let currentRegStep = 1;
/** A Blob containing the resized user avatar from registration, ready for upload. @type {Blob|null} */
let resizedAvatarBlob = null;

/**
 * Handles the user logout process by signing out from Firebase and reloading the page.
 */
export function handleLogout() {
    signOut(auth).then(() => {
        localStorage.removeItem('lastActivePage');
        localStorage.removeItem('lastActiveSubPage');
        window.location.reload(true);
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
}

/**
 * Initializes the registration form to its first step.
 */
export function initializeRegistrationStepper() {
    currentRegStep = 1;
    resizedAvatarBlob = null;
    document.getElementById('register-avatar-preview').src = 'https://placehold.co/128x128/161B22/FFFFFF?text=Avatar';
    showRegStep(currentRegStep);
    document.getElementById('registration-flow').style.display = 'block';
    document.getElementById('registration-success').style.display = 'none';
}

/**
 * Shows a specific step in the registration form UI.
 * @param {number} stepIndex The index of the step to display.
 */
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

    regProgressSteps.forEach((step, index) => {
        step.classList.toggle('active', (index + 1) <= stepIndex);
    });
    
    regProgressBarLine.style.width = `${((stepIndex - 1) / (regFormSlides.length - 1)) * 100}%`;
    regBackBtn.style.visibility = stepIndex === 1 ? 'hidden' : 'visible';
    regNextBtn.classList.toggle('hidden', stepIndex === regFormSlides.length);
    regSubmitBtn.classList.toggle('hidden', stepIndex !== regFormSlides.length);
}

/**
 * Validates the input fields for the current step of the registration form.
 * @param {number} stepIndex The index of the step to validate.
 * @returns {boolean} True if the step is valid, otherwise false.
 */
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

/**
 * Handles the "Next" button click in the registration form, validating the current step before proceeding.
 */
export function handleRegistrationNext() {
    if (validateRegStep(currentRegStep)) {
        currentRegStep++;
        showRegStep(currentRegStep);
    }
}

/**
 * Handles the "Back" button click in the registration form.
 */
export function handleRegistrationBack() {
    currentRegStep--;
    showRegStep(currentRegStep);
}

/**
 * Handles the selection of a user avatar image, resizes it, and updates the preview.
 * @param {Event} e The change event from the file input.
 */
export async function handleAvatarSelection(e) {
    const file = e.target.files[0];
    if (!file) return;
    resizedAvatarBlob = await resizeImage(file, { maxWidth: 1024, maxHeight: 1024 });
    document.getElementById('register-avatar-preview').src = URL.createObjectURL(resizedAvatarBlob);
}

/**
 * Handles the final submission of the registration form.
 * It creates the user in Firebase Auth, uploads their avatar, creates their user document in Firestore,
 * and sends a verification request.
 * @param {Event} e The form submission event.
 */
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

        let userProfile = {
            username, email, alliance, allianceRank, power, tankPower, airPower, missilePower,
            likes: 0, allianceRole: '', isVerified: false, avatarUrl, avatarBorderSkin: 'rank',
            isAdmin: email === 'mikestancato@gmail.com',
            registrationTimestampUTC: new Date().toISOString(),
        };
        
        await setDoc(doc(db, "users", user.uid), userProfile);
        
        await sendVerificationRequest(user.uid, username, alliance);

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

/**
 * Handles the login form submission.
 * @param {Event} e The form submission event.
 */
export function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-email-checkbox').checked;
    const errorElement = document.getElementById('login-error');
    const successMessage = document.getElementById('login-success-message');
    const submitBtn = document.getElementById('login-submit-btn');

    errorElement.textContent = '';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging In...';

    if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
    } else {
        localStorage.removeItem('rememberedEmail');
    }

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            successMessage.classList.remove('hidden');
            setTimeout(() => {
                hideAllModals();
                successMessage.classList.add('hidden');
            }, 1000);
        })
        .catch((error) => {
            console.error("Login Error:", error);
            errorElement.textContent = 'Invalid email or password.';
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        });
}

/**
 * Handles the "Forgot Password" link click, prompting the user for their email
 * and sending a password reset link via Firebase Auth.
 * @param {Event} e The click event.
 */
export function handleForgotPassword(e) {
    e.preventDefault();
    const email = prompt("Please enter your email address to receive a password reset link:");
    if (!email) return;

    sendPasswordResetEmail(auth, email)
        .then(() => alert('Password reset email sent! Please check your inbox.'))
        .catch((error) => alert(error.message));
}

/**
 * Populates the "Edit Profile" modal with the current user's data.
 */
export function populateEditForm() {
    const { currentUserData, allAlliances } = getState();
    if (!currentUserData) return;

    const allianceData = allAlliances.find(a => a.tag === currentUserData.alliance);
    const primaryColor = allianceData?.primaryColor || 'var(--color-primary)';
    document.getElementById('edit-profile-bg').style.backgroundImage = `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`;

    document.getElementById('edit-username').value = currentUserData.username;
    document.getElementById('edit-avatar-preview').src = currentUserData.avatarUrl || `https://placehold.co/128x128/161B22/FFFFFF?text=${currentUserData.username.charAt(0).toUpperCase()}`;
    
    document.getElementById('edit-alliance-avatar').src = allianceData?.avatarUrl || 'https://placehold.co/64x64/161B22/FFFFFF?text=?';
    const editAllianceSelect = document.getElementById('edit-alliance').closest('.custom-select-container');
    const editRankSelect = document.getElementById('edit-alliance-rank').closest('.custom-select-container');
    setCustomSelectValue(editAllianceSelect, currentUserData.alliance, currentUserData.alliance);
    const rankData = ALLIANCE_RANKS.find(r => r.value === currentUserData.allianceRank);
    setCustomSelectValue(editRankSelect, currentUserData.allianceRank, rankData ? rankData.text : currentUserData.allianceRank);
    
    const verificationIndicator = document.getElementById('verification-status-indicator');
    const icon = verificationIndicator.querySelector('i');
    const text = verificationIndicator.querySelector('span');
    verificationIndicator.className = 'p-3 rounded-lg flex items-center gap-3';
    if (currentUserData.isVerified) {
        verificationIndicator.classList.add('verified');
        icon.className = 'fas fa-check-circle';
        text.textContent = 'Verified Member';
    } else {
        verificationIndicator.classList.add('unverified');
        icon.className = 'fas fa-exclamation-triangle';
        text.textContent = 'Unverified Member';
    }

    document.getElementById('edit-power').value = (currentUserData.power || 0).toLocaleString();
    document.getElementById('edit-tank-power').value = (currentUserData.tankPower || 0).toLocaleString();
    document.getElementById('edit-air-power').value = (currentUserData.airPower || 0).toLocaleString();
    document.getElementById('edit-missile-power').value = (currentUserData.missilePower || 0).toLocaleString();

    buildAvatarBorderSkins();
    const currentAvatarSkin = currentUserData.avatarBorderSkin || 'rank';
    document.getElementById('avatar-border-skin-input').value = currentAvatarSkin;
    updateSkinSelection('avatar-border-selector', currentAvatarSkin);
    updateAvatarBorderPreview();
    
    buildChatBubbleBorderSkins();
    const currentChatBubbleSkin = currentUserData.chatBubbleBorderSkin || 'rank';
    document.getElementById('chat-bubble-border-skin-input').value = currentChatBubbleSkin;
    updateSkinSelection('chat-bubble-border-selector', currentChatBubbleSkin);
}

/**
 * Handles the submission of the "Edit Profile" form.
 * Updates the user's document in Firestore. If alliance or rank is changed,
 * it marks the user as unverified and triggers a new verification request.
 * @param {Event} e The form submission event.
 */
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
        avatarBorderSkin: document.getElementById('avatar-border-skin-input').value,
        chatBubbleBorderSkin: document.getElementById('chat-bubble-border-skin-input').value,
    };

    let needsReverification = false;
    let oldAlliance = currentUserData.alliance;
    let newAlliance = updatedData.alliance;

    if (currentUserData && (newAlliance !== oldAlliance || updatedData.allianceRank !== currentUserData.allianceRank)) {
        updatedData.isVerified = false;
        needsReverification = true;
    }

    try {
        await updateDoc(doc(db, "users", user.uid), updatedData);
        hideAllModals();

        if (needsReverification) {
            await sendVerificationRequest(user.uid, updatedData.username, newAlliance);
            alert("Profile updated! You have been marked as unverified and will need to be approved by a leader in your new alliance to access all features.");
        }
    } catch (error) {
        console.error("Update profile error:", error);
        errorElement.textContent = "Failed to update profile.";
    }
}

/**
 * Handles the direct upload of a new avatar from the user profile dropdown.
 * @param {Event} e The change event from the hidden file input.
 */
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
// code/js/ui/auth-ui.js

import { auth, db, storage } from '../firebase-config.js';
import { signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, setDoc, updateDoc, writeBatch, collection, query, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { subscribe, setState, getState } from '../state.js';
import { resizeImage , getAvatarSkinClass, getRankBorderClass} from '../utils.js';
import { hideAllModals, setCustomSelectValue } from './ui-manager.js';
import { RANK_STYLES, ALLIANCE_RANKS, AVATAR_BORDERS, CHAT_BUBBLE_BORDERS } from '../constants.js';
import { sendVerificationRequest } from '../firestore.js';

// --- STATE & RENDER FUNCTIONS ---

function renderAuthUI(newState, prevState) {
    if (newState.currentUserData === prevState.currentUserData && newState.userNotifications === prevState.userNotifications) return;
    const { currentUserData, userNotifications } = newState;
    if (currentUserData) {
        document.getElementById('username-display').textContent = currentUserData.username;
        updateAvatarDisplay(currentUserData);
        updatePlayerProfileDropdown(currentUserData, userNotifications);
        document.getElementById('login-btn').classList.add('hidden');
        document.getElementById('user-profile-nav-item').classList.remove('hidden');
        document.getElementById('mobile-auth-container').classList.add('logged-in');
        document.getElementById('login-btn-mobile').classList.add('hidden');
    } else {
        document.getElementById('login-btn').classList.remove('hidden');
        const userProfileNavItem = document.getElementById('user-profile-nav-item');
        userProfileNavItem.classList.add('hidden');
        userProfileNavItem.classList.remove('open');
        document.getElementById('mobile-auth-container').classList.remove('logged-in');
    }
}

export function initializeAuthUI() {
    subscribe(renderAuthUI);
    // Add event listeners for power input formatting
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

export function updateAvatarDisplay(data) {
    if (!data) return;
    const avatarUrl = data.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${data.username.charAt(0).toUpperCase()}`;
    const rankBorder = getRankBorderClass(data);
    const userAvatarButton = document.getElementById('user-avatar-button');
    userAvatarButton.src = avatarUrl;
    userAvatarButton.className = `w-6 h-6 rounded-full object-cover ${rankBorder}`;
    const userAvatarMobile = document.getElementById('user-avatar-mobile');
    userAvatarMobile.src = avatarUrl;
    userAvatarMobile.className = `w-8 h-8 rounded-full object-cover ${rankBorder}`;
    
    const mobileAlliance = document.getElementById('mobile-avatar-alliance');
    const mobileRank = document.getElementById('mobile-avatar-rank');
    mobileAlliance.textContent = `[${data.alliance}]`;
    mobileRank.textContent = data.allianceRank;
    
    // Apply unverified style if necessary
    mobileAlliance.classList.toggle('unverified-player-text', !data.isVerified);
    mobileRank.classList.toggle('unverified-player-text', !data.isVerified);
}


export function updatePlayerProfileDropdown(currentUserData, userNotifications) { // FIX: Removed default empty array
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
    if (friendReqBtn && userNotifications) { // FIX: Added guard for userNotifications
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


// --- EVENT HANDLERS (All other functions from original file remain here) ---
// handleLogout, initializeRegistrationStepper, handleRegistrationSubmit, etc.
// ... (The rest of the functions from the original auth-ui.js file) ...
let currentRegStep = 1;
let resizedAvatarBlob = null;

export function handleLogout() {
    signOut(auth).then(() => {
        localStorage.removeItem('lastActivePage');
        localStorage.removeItem('lastActiveSubPage');
        window.location.reload(true);
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
}

export function initializeRegistrationStepper() {
    currentRegStep = 1;
    resizedAvatarBlob = null;
    document.getElementById('register-avatar-preview').src = 'https://placehold.co/128x128/161B22/FFFFFF?text=Avatar';
    showRegStep(currentRegStep);
    document.getElementById('registration-flow').style.display = 'block';
    document.getElementById('registration-success').style.display = 'none';
}

// ... (and so on for all the other functions)
function buildSkinSelectors() {
    const rankLegend = document.getElementById('rank-color-legend');
    if(rankLegend) {
        rankLegend.innerHTML = Object.entries(RANK_STYLES).map(([rank, style]) => `
            <div class="rank-legend-item">
                <div class="rank-legend-color" style="background-color: ${style.color};"></div>
                <span class="font-semibold text-white">${rank}</span>
            </div>
        `).join('');
    }
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

    regProgressSteps.forEach((step, index) => {
        step.classList.toggle('active', (index + 1) <= stepIndex);
    });
    
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

        let userProfile = {
            username, email, alliance, allianceRank, power, tankPower, airPower, missilePower,
            likes: 0, allianceRole: '', isVerified: false, avatarUrl,
            isAdmin: email === 'mikestancato@gmail.com',
            registrationTimestampUTC: new Date().toISOString(),
        };
        
        // Removed the logic that sets alliance to 'Pending Alliance'

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

export function handleForgotPassword(e) {
    e.preventDefault();
    const email = prompt("Please enter your email address to receive a password reset link:");
    if (!email) return;

    sendPasswordResetEmail(auth, email)
        .then(() => alert('Password reset email sent! Please check your inbox.'))
        .catch((error) => alert(error.message));
}

export function populateEditForm() {
    const { currentUserData, allAlliances } = getState();
    if (!currentUserData) return;

    // Set dynamic background
    const allianceData = allAlliances.find(a => a.tag === currentUserData.alliance);
    const primaryColor = allianceData?.primaryColor || 'var(--color-primary)';
    document.getElementById('edit-profile-bg').style.backgroundImage = `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`;

    // Account Tab
    document.getElementById('edit-username').value = currentUserData.username;
    document.getElementById('edit-avatar-preview').src = currentUserData.avatarUrl || `https://placehold.co/128x128/161B22/FFFFFF?text=${currentUserData.username.charAt(0).toUpperCase()}`;
    document.getElementById('edit-avatar-border-preview').className = `w-32 h-32 absolute top-0 left-0 rounded-full pointer-events-none ${getRankBorderClass(currentUserData)}`;

    // Alliance Tab
    document.getElementById('edit-alliance-avatar').src = allianceData?.avatarUrl || 'https://placehold.co/64x64/161B22/FFFFFF?text=?';
    const editAllianceSelect = document.getElementById('edit-alliance').closest('.custom-select-container');
    const editRankSelect = document.getElementById('edit-alliance-rank').closest('.custom-select-container');
    setCustomSelectValue(editAllianceSelect, currentUserData.alliance, currentUserData.alliance);
    const rankData = ALLIANCE_RANKS.find(r => r.value === currentUserData.allianceRank);
    setCustomSelectValue(editRankSelect, currentUserData.allianceRank, rankData ? rankData.text : currentUserData.allianceRank);
    
    // Verification Status
    const verificationIndicator = document.getElementById('verification-status-indicator');
    const icon = verificationIndicator.querySelector('i');
    const text = verificationIndicator.querySelector('span');
    verificationIndicator.className = 'p-3 rounded-lg flex items-center gap-3'; // Reset classes
    if (currentUserData.isVerified) {
        verificationIndicator.classList.add('verified');
        icon.className = 'fas fa-check-circle';
        text.textContent = 'Verified Member';
    } else {
        verificationIndicator.classList.add('unverified');
        icon.className = 'fas fa-exclamation-triangle';
        text.textContent = 'Unverified Member';
    }

    // Power Tab
    document.getElementById('edit-power').value = (currentUserData.power || 0).toLocaleString();
    document.getElementById('edit-tank-power').value = (currentUserData.tankPower || 0).toLocaleString();
    document.getElementById('edit-air-power').value = (currentUserData.airPower || 0).toLocaleString();
    document.getElementById('edit-missile-power').value = (currentUserData.missilePower || 0).toLocaleString();

    // Skin Tab (Placeholder)
    // Future logic to populate skins will go here
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

    let needsReverification = false;
    let oldAlliance = currentUserData.alliance;
    let newAlliance = updatedData.alliance;

    // If alliance or rank changes, user needs to be reverified.
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
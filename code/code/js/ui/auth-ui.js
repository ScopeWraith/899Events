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
    // Only re-render if the user's authentication status has changed
    if (newState.currentUserData === prevState.currentUserData && newState.userNotifications === prevState.userNotifications) return;

    const { currentUserData, userNotifications } = newState;

    if (currentUserData) {
        // User is logged in
        document.getElementById('username-display').textContent = currentUserData.username;
        updateAvatarDisplay(currentUserData);
        updatePlayerProfileDropdown(currentUserData, userNotifications);
        document.getElementById('login-btn').classList.add('hidden');
        document.getElementById('user-profile-nav-item').classList.remove('hidden');
        document.getElementById('mobile-auth-container').classList.add('logged-in');
        document.getElementById('login-btn-mobile').classList.add('hidden');
    } else {
        // User is logged out
        document.getElementById('login-btn').classList.remove('hidden');
        const userProfileNavItem = document.getElementById('user-profile-nav-item');
        userProfileNavItem.classList.add('hidden');
        userProfileNavItem.classList.remove('open'); // Close dropdown on logout
        document.getElementById('mobile-auth-container').classList.remove('logged-in');
    }
}

export function initializeAuthUI() {
    // Subscribe to state changes to automatically update the UI
    subscribe(renderAuthUI);
}


// --- UI HELPER FUNCTIONS (Most of these are from the original file) ---

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

    document.getElementById('mobile-avatar-alliance').textContent = `[${data.alliance}]`;
    document.getElementById('mobile-avatar-rank').textContent = data.allianceRank;
}

export function updatePlayerProfileDropdown(currentUserData, userNotifications = []) {
    if (!currentUserData) return;

    const dropdownContainer = document.getElementById('player-profile-dropdown');
    if (!dropdownContainer) return;

    const canCreatePost = currentUserData.isAdmin || (currentUserData.isVerified && (currentUserData.allianceRank === 'R5' || currentUserData.allianceRank === 'R4'));

    let postButtonsHTML = '';
    if (canCreatePost) {
        postButtonsHTML = `
            <button id="admin-create-event-dropdown-btn" class="dropdown-link profile-menu-link">
                <span><i class="fas fa-calendar-plus fa-fw w-6 text-center mr-2"></i>Create Event</span>
            </button>
            <button id="admin-create-announcement-dropdown-btn" class="dropdown-link profile-menu-link">
                <span><i class="fas fa-bullhorn fa-fw w-6 text-center mr-2"></i>Create Announcement</span>
            </button>
            <div class="p-1"><hr class="border-t border-white/10"></div>
        `;
    }

    dropdownContainer.innerHTML = `
        <div class="p-2 mb-2 border-b border-white/10">
            <p class="text-sm text-gray-400">Total Power</p>
            <p id="profile-dropdown-power" class="text-lg font-bold text-white">${(currentUserData.power || 0).toLocaleString()}</p>
        </div>
        ${postButtonsHTML}
        <button id="profile-dropdown-friends" class="dropdown-link profile-menu-link">
            <span><i class="fas fa-user-plus fa-fw w-6 text-center mr-2"></i>Friend Requests</span>
            <span class="badge hidden">0</span>
        </button>
        <button id="profile-dropdown-messages" class="dropdown-link profile-menu-link">
            <span><i class="fas fa-envelope fa-fw w-6 text-center mr-2"></i>Private Messages</span>
            <span class="badge hidden">0</span>
        </button>
        <button id="profile-dropdown-edit" class="dropdown-link profile-menu-link">
            <span><i class="fas fa-edit fa-fw w-6 text-center mr-2"></i>Edit Profile</span>
        </button>
        <button id="profile-dropdown-avatar" class="dropdown-link profile-menu-link">
            <span><i class="fas fa-camera fa-fw w-6 text-center mr-2"></i>Change Avatar</span>
        </button>
        <input type="file" id="avatar-upload-input" class="hidden" accept="image/*">
        <div class="p-1"><hr class="border-t border-white/10"></div>
        <button id="profile-dropdown-logout" class="dropdown-link profile-menu-link w-full text-left">
            <span><i class="fas fa-sign-out-alt fa-fw w-6 text-center mr-2"></i>Log Out</span>
        </button>
    `;

    // This part remains the same, handling the dynamic badge updates
    const friendReqBtn = document.getElementById('profile-dropdown-friends');
    if (friendReqBtn) {
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
    if (messagesBtn) {
        // Logic for private message notifications will go here
        messagesBtn.disabled = true; // For now
    }
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

    regProgressSteps.forEach((index, step) => step.classList.toggle('active', index < stepIndex));
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

        if (!userProfile.isAdmin) {
            userProfile.alliance = 'Pending Alliance';
            userProfile.isVerified = false;
        }

        await setDoc(doc(db, "users", user.uid), userProfile);

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
    const { currentUserData } = getState();
    if (!currentUserData) return;

    buildSkinSelectors();

    document.getElementById('edit-username').value = currentUserData.username;
    const editAllianceSelect = document.getElementById('edit-alliance').closest('.custom-select-container');
    const editRankSelect = document.getElementById('edit-alliance-rank').closest('.custom-select-container');
    setCustomSelectValue(editAllianceSelect, currentUserData.alliance, currentUserData.alliance);
    const rankData = ALLIANCE_RANKS.find(r => r.value === currentUserData.allianceRank);
    setCustomSelectValue(editRankSelect, currentUserData.allianceRank, rankData ? rankData.text : currentUserData.allianceRank);
    document.getElementById('edit-power').value = (currentUserData.power || 0).toLocaleString();
    document.getElementById('edit-tank-power').value = (currentUserData.tankPower || 0).toLocaleString();
    document.getElementById('edit-air-power').value = (currentUserData.airPower || 0).toLocaleString();
    document.getElementById('edit-missile-power').value = (currentUserData.missilePower || 0).toLocaleString();

    const setActiveSkin = (containerId, inputId, value, defaultValue) => {
        const finalValue = value || defaultValue;
        const container = document.getElementById(containerId);
        const input = document.getElementById(inputId);
        if (container && input) {
            input.value = finalValue;
            container.querySelectorAll('.skin-select-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === finalValue);
            });
        }
    };

    setActiveSkin('avatar-border-selector', 'edit-avatar-border', currentUserData.avatarBorder, 'avatar-border-none');
    setActiveSkin('chat-bubble-border-selector', 'edit-chat-bubble-border', currentUserData.chatBubbleBorder, 'chat-bubble-border-none');
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

    if (currentUserData && (newAlliance !== oldAlliance || updatedData.allianceRank !== currentUserData.allianceRank)) {
        updatedData.isVerified = false;
        needsReverification = true;
        if (newAlliance !== oldAlliance) {
             updatedData.alliance = 'Pending Alliance';
        }
    }

    try {
        await updateDoc(doc(db, "users", user.uid), updatedData);
        hideAllModals();

        if (needsReverification) {
            await sendVerificationRequest(user.uid, updatedData.username, newAlliance);
            alert("Profile updated! You have been un-verified and will need to be approved by a leader in your alliance to access all features.");
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
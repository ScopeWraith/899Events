// code/js/ui/post-ui.js

/**
 * This module manages the UI for creating, editing, and displaying posts.
 * It includes the multi-step post creation form and renders the post cards.
 */

import { db, storage } from '../firebase-config.js';
import { doc, addDoc, updateDoc, collection, serverTimestamp, writeBatch, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { getState, updateState } from '../state.js';
import { POST_TYPES, POST_STYLES, DAYS_OF_WEEK, HOURS_OF_DAY, REPEAT_TYPES } from '../constants.js';
import { formatTimeAgo, formatEventDateTime, getEventStatus, formatDuration, calculateNextDateTime, resizeImage } from '../utils.js';
import { hideAllModals, showModal, setCustomSelectValue } from './ui-manager.js';

let currentPostStep = 1;
let postCreationData = {};
let resizedThumbnailBlob = null;

// --- RENDERING POSTS ---
export function renderNews(filter = 'all') {
    let { allPosts, currentUserData, countdownInterval } = getState();
    const now = new Date();

    if (countdownInterval) clearInterval(countdownInterval);

    // 1. Filter posts by user visibility
    let visiblePosts = allPosts.filter(post => {
        if (!currentUserData) return post.visibility === 'public';
        if (post.visibility === 'public') return true;
        if (currentUserData.isAdmin) return true;
        if (post.visibility === 'alliance' && post.alliance === currentUserData.alliance) return true; //
        return false;
    });

    let announcements = [];
    let events = [];
    let container;

    // 2. Filter posts by the selected sub-nav filter and date ranges
    switch (filter) {
        case 'events':
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            events = visiblePosts.filter(post => {
                if (post.mainType !== 'event') return false;
                const status = getEventStatus(post);
                const prospectiveStartTime = post.isRecurring ? getEventStatus(post).startTime : post.startTime?.toDate();
                return status.status === 'live' || (status.status === 'upcoming' && (prospectiveStartTime || post.startTime?.toDate()) <= thirtyDaysFromNow); //
            });
            container = document.getElementById('sub-page-news-events');
            break;

        case 'announcements':
            announcements = visiblePosts.filter(post => {
                if (post.mainType !== 'announcement') return false;
                const postDate = post.createdAt?.toDate();
                if (!postDate) return false;
                const expirationDays = post.expirationDays || 1;
                const expirationDate = new Date(postDate.getTime() + expirationDays * 24 * 60 * 60 * 1000);
                return expirationDate > now;
            });
            container = document.getElementById('sub-page-news-announcements');
            break;

        case 'all':
        default:
            const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            events = visiblePosts.filter(post => {
                if (post.mainType !== 'event') return false;
                const status = getEventStatus(post);
                const prospectiveStartTime = post.isRecurring ? getEventStatus(post).startTime : post.startTime?.toDate();
                return status.status === 'live' || (status.status === 'upcoming' && (prospectiveStartTime || post.startTime?.toDate()) <= sevenDaysFromNow); //
            });

            announcements = visiblePosts.filter(post => {
                if (post.mainType !== 'announcement') return false;
                const postDate = post.createdAt?.toDate();
                if (!postDate) return false;
                const expirationDays = post.expirationDays || 1;
                const expirationDate = new Date(postDate.getTime() + expirationDays * 24 * 60 * 60 * 1000);
                return expirationDate > now;
            });
            container = document.getElementById('sub-page-news-all');
            break;
    }

    if (!container) return;

    // 3. Sort and Render Content
    announcements.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
    
    // Replace the existing events.sort with this more detailed logic
    events.sort((a, b) => {
        const statusA = getEventStatus(a);
        const statusB = getEventStatus(b);

        // Rule 1: Live events come before upcoming events
        if (statusA.status === 'live' && statusB.status !== 'live') return -1;
        if (statusA.status !== 'live' && statusB.status === 'live') return 1;

        // Rule 2: If both are live, sort by the one ending soonest
        if (statusA.status === 'live' && statusB.status === 'live') {
            return statusA.timeDiff - statusB.timeDiff;
        }

        // Rule 3: If both are upcoming, sort by the one starting soonest
        if (statusA.status === 'upcoming' && statusB.status === 'upcoming') {
            return statusA.timeDiff - statusB.timeDiff;
        }
        
        return 0; // Default case
    });
    let contentHTML = '';
    if (announcements.length > 0) {
        contentHTML += `
            <div class="mb-4">
                <div class="grid grid-cols-1 gap-4">${announcements.map(createCard).join('')}</div>
            </div>`;
    }
    if (events.length > 0) {
        contentHTML += `
            <div>
                <div class="grid grid-cols-1 gap-4">${events.map(createCard).join('')}</div>
            </div>`;
    }

    container.innerHTML = contentHTML || `<p class="text-center text-gray-400 py-8">No items to display.</p>`;

    // 4. Restart countdown timer
    countdownInterval = setInterval(updateCountdowns, 1000 * 30);
    updateState({ countdownInterval });
    updateCountdowns();
}

// Keep the old renderPosts function for now, but we will phase it out.
// It is called by firestore.js and we don't want to break the initial load yet.
export function renderPosts() {
    const { activeFilter } = getState();
    const newsPage = document.getElementById('page-news');

    // FIX: Check if the newsPage element exists before accessing its style property.
    if (newsPage && newsPage.style.display === 'block') {
        renderNews(activeFilter === 'all' ? 'all' : activeFilter);
    }
}
function createCard(post) {
    const { currentUserData, allPlayers } = getState();
    const style = POST_STYLES[post.subType] || {};
    const isEvent = post.mainType === 'event';
    const color = style.color || 'var(--color-primary)';

    const postTypeInfo = Object.values(POST_TYPES).find(pt => pt.subType === post.subType && pt.mainType === post.mainType) || {};
    const categoryText = postTypeInfo.text || post.subType.replace(/_/g, ' ');

    let actionsTriggerHTML = '';
    if (currentUserData && (currentUserData.isAdmin || post.authorUid === currentUserData.uid)) {
        actionsTriggerHTML = `
            <button class="post-card-actions-trigger" data-post-id="${post.id}" title="Post Options">
                <i class="fas fa-cog"></i>
            </button>
        `;
    }

    if (isEvent) {
    const backgroundStyle = post.thumbnailUrl ? `background-image: url('${post.thumbnailUrl}');-webkit-mask-image: linear-gradient(90deg, black, transparent);
  mask-image: linear-gradient(90deg, black, transparent);` : '';

    return `
        <div class="post-card event-card" data-post-id="${post.id}" style="--glow-color: ${color}; border-top-color: ${color};">
            <div class="event-card-background" style="${backgroundStyle}"></div>

            <div class="post-card-content">
                <span class="post-card-category" style="background-color: ${color};">${categoryText}</span>
                <h3 class="post-card-title">${post.title}</h3>
                <p class="post-card-details">${post.details}</p>
            </div>

            <div class="post-card-status" style="padding-top: 0px;">
                <div class="status-content-wrapper"></div>
                <div class="status-date"></div>
            </div>
            ${actionsTriggerHTML}
        </div>
    `;
} else { // Announcement
    const authorData = allPlayers.find(p => p.uid === post.authorUid);
    const avatarUrl = authorData?.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${(authorData?.username || '?').charAt(0).toUpperCase()}`;
    const postDate = post.createdAt?.toDate();

    // --- START: NEW Thumbnail Logic ---
    const hasThumbnail = !!post.thumbnailUrl;
    const thumbnailHTML = hasThumbnail ? `<img src="${post.thumbnailUrl}" class="post-card-thumbnail" alt="Announcement Image">` : '';
    const hasThumbnailClass = hasThumbnail ? 'has-thumbnail' : '';
    // --- END: NEW Thumbnail Logic ---

    return `
        <div class="post-card announcement-card ${hasThumbnailClass}" data-post-id="${post.id}" style="--glow-color: ${color}; border-top-color: ${color};">
            ${thumbnailHTML} 
            <div class="post-card-body">
                <div class="post-card-header">
                    <img src="${avatarUrl}" class="author-avatar" alt="${authorData?.username || 'Unknown'}">
                    <div class="author-info">
                        <p class="author-name">${authorData?.username || 'Unknown'}</p>
                        <p class="author-meta">
                            [${authorData?.alliance || 'N/A'}] ${authorData?.allianceRank || ''} &bull; 
                            ${postDate ? formatTimeAgo(postDate) : ''}
                        </p>
                    </div>
                </div>
                <span class="post-card-category mb-2" style="background-color: ${color};">${categoryText}</span>
                <h3 class="post-card-title !mb-2">${post.title}</h3>
                <p class="post-card-details">${post.details}</p>
            </div>
            ${actionsTriggerHTML}
        </div>
    `;
}
}

function renderAnnouncements(announcements) {
    const { currentUserData } = getState();
    const announcementsContainer = document.getElementById('announcements-container');
    let createBtnHTML = '';
    if (currentUserData && getAvailablePostTypes('announcement').length > 0) {
        createBtnHTML = `<button id="create-announcement-btn" class="ml-4 primary-btn !p-0 w-5 h-5 rounded-full flex items-center justify-center text-xl" title="Create New Announcement"><i class="fas fa-plus" style="font-size:.6rem"></i></button>`;
    }

    const contentHTML = announcements.length > 0
        ? `<div class="grid grid-cols-1 gap-4">${announcements.map(createCard).join('')}</div>`
        : `<p class="text-center text-gray-500 py-4">No announcements to display.</p>`;

    announcementsContainer.innerHTML = `
        <div class="section-header text-xl font-bold mb-4" style="--glow-color: var(--color-highlight);">
            <i class="fas fa-bullhorn"></i>
            <span class="flex-grow">Announcements</span>
            ${createBtnHTML}
        </div>
        ${contentHTML}
    `;
}

function renderEvents(events) {
    const { currentUserData } = getState();
    const eventsSectionContainer = document.getElementById('events-section-container');
    const announcementsContainer = document.getElementById('announcements-container');
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let displayableEvents = events.filter(event => {
        const status = getEventStatus(event);
        const prospectiveStartTime = event.isRecurring ? getEventStatus(event).startTime : event.startTime?.toDate();
        return status.status === 'live' || (status.status === 'upcoming' && (prospectiveStartTime || event.startTime?.toDate()) <= sevenDaysFromNow);
    });

    displayableEvents.sort((a, b) => {
        const statusA = getEventStatus(a);
        const statusB = getEventStatus(b);
        if (statusA.status === 'live' && statusB.status !== 'live') return -1;
        if (statusA.status !== 'live' && statusB.status === 'live') return 1;
        if (statusA.status === 'live' && statusB.status === 'live') {
            return statusA.timeDiff - statusB.timeDiff;
        }
        if (statusA.status === 'upcoming' && statusB.status === 'upcoming') {
            if (statusA.timeDiff !== statusB.timeDiff) {
                return statusA.timeDiff - statusB.timeDiff;
            }
            return a.title.localeCompare(b.title);
        }
        return 0;
    });
    
    let createBtnHTML = '';
    if (currentUserData && getAvailablePostTypes('event').length > 0) {
        createBtnHTML = `<button id="create-event-btn" class="ml-4 primary-btn !p-0 w-5 h-5 rounded-full flex items-center justify-center text-xl" title="Create New Event"><i class="fas fa-plus" style="font-size:.6rem"></i></button>`;
    }

    const headerHTML = announcementsContainer.innerHTML.trim() === '' ? '' : '<div></div>';
    
    const contentHTML = displayableEvents.length > 0
        ? `<div class="grid grid-cols-1 gap-4">${displayableEvents.map(createCard).join('')}</div>`
        : `<p class="text-center text-gray-500 py-4">No upcoming events in the next 7 days.</p>`;

    eventsSectionContainer.innerHTML = `
        ${headerHTML}
        <div class="section-header text-xl font-bold mb-4">
            <i class="fas fa-calendar-alt"></i>
            <span class="flex-grow">Events</span>
            ${createBtnHTML}
        </div>
        ${contentHTML}
    `;
}

function updateCountdowns() {
    const { allPosts } = getState();
    document.querySelectorAll('.event-card').forEach(el => {
        const postId = el.dataset.postId;
        const post = allPosts.find(p => p.id === postId);
        if (!post) return;

        const statusInfo = getEventStatus(post);
        const statusEl = el.querySelector('.status-content-wrapper');
        const dateEl = el.querySelector('.status-date'); 

        if (!statusEl || !dateEl) return;

        el.classList.remove('live', 'ended', 'upcoming');
        
        // Use the corrected startTime from the statusInfo object
         if (statusInfo.status === 'live' && statusInfo.endTime) {
            // For live events, show the end time
            dateEl.textContent = formatEventDateTime(statusInfo.endTime);
        } else if (statusInfo.startTime) {
            // For upcoming and ended events, show the start time
            dateEl.textContent = formatEventDateTime(statusInfo.startTime);
        } else {
            // Fallback for events without a valid date
            dateEl.textContent = '';
        }

        switch(statusInfo.status) {
            case 'upcoming':
                el.classList.add('upcoming');
                statusEl.innerHTML = `<div class="status-label">STARTS IN</div><div class="status-time">${formatDuration(statusInfo.timeDiff)}</div>`;
                break;
            case 'live':
                el.classList.add('live');
                statusEl.innerHTML = `<div class="status-label">ENDS IN</div><div class="status-time">${formatDuration(statusInfo.timeDiff)}</div>`;
                break;
            case 'ended':
                el.classList.add('ended');
                statusEl.innerHTML = `<div class="status-label">ENDED</div><div class="status-time">${statusInfo.endedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>`;
                break;
        }
    });
}

function buildFilterControls(visiblePosts) {
    const filterContainer = document.getElementById('filter-container');
    const availableSubTypes = [...new Set(visiblePosts.map(p => p.subType))];
    
    filterContainer.innerHTML = ''; // Clear previous buttons
    
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.textContent = 'All';
    allBtn.dataset.filter = 'all';
    allBtn.style.setProperty('--glow-color', 'var(--color-primary)');
    allBtn.style.setProperty('--glow-color-bg', 'rgba(0, 191, 255, 0.1)');
    filterContainer.appendChild(allBtn);

    availableSubTypes.forEach(subType => {
        const style = POST_STYLES[subType] || {};
        const postTypeInfo = Object.values(POST_TYPES).find(pt => pt.subType === subType);
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = postTypeInfo ? postTypeInfo.text : subType.replace('_', ' ');
        btn.dataset.filter = subType;
        btn.style.setProperty('--glow-color', style.color || 'var(--color-primary)');
        btn.style.setProperty('--glow-color-bg', style.bgColor || 'rgba(0, 191, 255, 0.1)');
        filterContainer.appendChild(btn);
    });
}

// --- POST CREATION & EDITING ---

export function initializePostStepper(mainType) {
    document.getElementById('create-post-form').reset();
    postCreationData = {};
    resizedThumbnailBlob = null;
    document.getElementById('post-thumbnail-preview').src = 'https://placehold.co/100x100/161B22/444444?text=PREVIEW';
    
    postCreationData.mainType = mainType;
    currentPostStep = 2; // Start at sub-type selection
    populateSubTypeSelection();
    showPostStep(currentPostStep);
    
    document.getElementById('post-back-btn').classList.remove('hidden');
    document.getElementById('post-next-btn').classList.remove('hidden');
}

function getAvailablePostTypes(mainType) {
    const { currentUserData } = getState();
    return Object.entries(POST_TYPES).filter(([key, type]) => {
        if (type.mainType !== mainType) return false;
        if (!currentUserData) return false;
        if (type.isAdminOnly) return currentUserData.isAdmin;
        if (type.isVerifiedRequired && !currentUserData.isVerified) return false;
        if (type.allowedRanks) return type.allowedRanks.includes(currentUserData.allianceRank);
        return true;
    });
}

function populateSubTypeSelection() {
    const container = document.getElementById('post-subtype-selection-container');
    const header = document.getElementById('post-subtype-header');
    header.textContent = `Select ${postCreationData.mainType.charAt(0).toUpperCase() + postCreationData.mainType.slice(1)} Type`;
    container.innerHTML = '';
    
    const availableSubTypes = getAvailablePostTypes(postCreationData.mainType);

    availableSubTypes.forEach(([key, type]) => {
        const style = POST_STYLES[type.subType];
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.key = key;
        button.className = 'type-selection-card w-full p-4 rounded-lg text-left flex items-center gap-4';
        button.innerHTML = `
            <i class="${style.icon} fa-2x w-10 text-center" style="color: ${style.color};"></i>
            <div>
                <h3 class="font-bold text-lg text-white">${type.text}</h3>
                <p class="text-sm text-gray-500">Create a new ${type.subType.replace('_', ' ')} ${type.mainType}.</p>
            </div>
        `;
        button.addEventListener('click', () => {
            Object.assign(postCreationData, type);
            currentPostStep++;
            showPostStep(currentPostStep);
        });
        container.appendChild(button);
    });
}

function showPostStep(stepIndex) {
    const postFlow = document.getElementById('post-creation-flow');
    const postFormSlides = postFlow.querySelectorAll('.form-slide');
    const postBackBtn = document.getElementById('post-back-btn');
    const postNextBtn = document.getElementById('post-next-btn');
    const postSubmitBtn = document.getElementById('post-submit-btn');
    const { editingPostId } = getState();

    postFormSlides.forEach(slide => slide.classList.remove('active'));
    const currentSlide = postFlow.querySelector(`.form-slide[data-slide="${stepIndex}"]`);
    if(currentSlide) currentSlide.classList.add('active');
    
    const isEvent = postCreationData.mainType === 'event';
    const totalSteps = isEvent ? 4 : 3;

    postBackBtn.style.visibility = stepIndex === 2 ? 'hidden' : 'visible'; // Hide on first selection step
    postNextBtn.classList.toggle('hidden', stepIndex >= totalSteps);
    postSubmitBtn.classList.toggle('hidden', stepIndex !== totalSteps);
    
    if(stepIndex === 3) {
        const header = document.getElementById('post-content-header');
        header.textContent = editingPostId ? `Edit ${postCreationData.text}` : `New ${postCreationData.text}`;
        const allianceGroup = document.getElementById('post-alliance-group');
        const { currentUserData } = getState();
        if(currentUserData.isAdmin && (postCreationData.visibility === 'alliance' || postCreationData.visibility === 'leadership')) {
            allianceGroup.classList.remove('hidden');
        } else {
            allianceGroup.classList.add('hidden');
        }
        const expirationGroup = document.getElementById('post-expiration-group');
        const isAnnouncement = postCreationData.mainType === 'announcement';
        expirationGroup.classList.toggle('hidden', !isAnnouncement);
    }
}

function validatePostStep(stepIndex) {
    const createPostError = document.getElementById('create-post-error');
    createPostError.textContent = '';
    if (stepIndex === 3) {
         if (!document.getElementById('post-title').value || !document.getElementById('post-details').value) {
            createPostError.textContent = 'Title and details are required.';
            return false;
        }
    } else if (stepIndex === 4 && postCreationData.mainType === 'event') {
        if (!document.getElementById('post-start-day').value || !document.getElementById('post-start-hour').value ||
            !document.getElementById('post-end-day').value || !document.getElementById('post-end-hour').value) {
            createPostError.textContent = 'Please select a start/end day and hour for the event.';
            return false;
        }
    }
    return true;
}

export function handlePostNext() {
    if (validatePostStep(currentPostStep)) {
        currentPostStep++;
        showPostStep(currentPostStep);
    }
}

export function handlePostBack() {
    if (currentPostStep === 2) {
        hideAllModals();
        return;
    }
    currentPostStep--;
    showPostStep(currentPostStep);
}

export async function handleThumbnailSelection(e) {
    const file = e.target.files[0];
    if (!file) return;
    resizedThumbnailBlob = await resizeImage(file, { maxWidth: 1024, maxHeight: 1024 });
    document.getElementById('post-thumbnail-preview').src = URL.createObjectURL(resizedThumbnailBlob);
}

export async function handlePostSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('post-submit-btn');
    const createPostError = document.getElementById('create-post-error');
    const { currentUserData, editingPostId } = getState();

    if (!currentUserData) {
        createPostError.textContent = 'You must be logged in to post.';
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';

    let alliance = (postCreationData.visibility === 'alliance' || postCreationData.visibility === 'leadership') 
        ? (currentUserData.isAdmin ? document.getElementById('post-alliance').value : currentUserData.alliance)
        : null;
    
    const finalPostData = {
        mainType: postCreationData.mainType,
        subType: postCreationData.subType,
        title: document.getElementById('post-title').value,
        details: document.getElementById('post-details').value,
        authorUid: currentUserData.uid,
        authorUsername: currentUserData.username,
        alliance: alliance,
        visibility: postCreationData.visibility,
    };

    if (postCreationData.mainType === 'event') {
        finalPostData.isRecurring = document.getElementById('post-repeat-type').value === 'weekly';
        const startDay = document.getElementById('post-start-day').value;
        const startHour = document.getElementById('post-start-hour').value;
        const endDay = document.getElementById('post-end-day').value;
        const endHour = document.getElementById('post-end-hour').value;

        finalPostData.startTime = calculateNextDateTime(startDay, startHour);
        finalPostData.endTime = calculateNextDateTime(endDay, endHour);

        if (finalPostData.endTime < finalPostData.startTime) {
            finalPostData.endTime.setDate(finalPostData.endTime.getDate() + 7);
        }
        
        if (finalPostData.isRecurring) {
            finalPostData.repeatWeeks = parseInt(document.getElementById('post-repeat-weeks').value, 10) || 1;
        }
    } else { // Announcement
        finalPostData.expirationDays = parseInt(document.getElementById('post-expiration-days').value, 10) || 1;
    }
    
    try {
        let postDocRef;
        if (editingPostId) {
            postDocRef = doc(db, 'posts', editingPostId);
            if (resizedThumbnailBlob) {
                const thumbnailRef = ref(storage, `post_thumbnails/${editingPostId}`);
                await uploadBytes(thumbnailRef, resizedThumbnailBlob);
                finalPostData.thumbnailUrl = await getDownloadURL(thumbnailRef);
            }
            await updateDoc(postDocRef, finalPostData);
        } else {
            finalPostData.createdAt = serverTimestamp();
            postDocRef = await addDoc(collection(db, 'posts'), finalPostData);
            if (resizedThumbnailBlob) {
                const thumbnailRef = ref(storage, `post_thumbnails/${postDocRef.id}`);
                await uploadBytes(thumbnailRef, resizedThumbnailBlob);
                const downloadURL = await getDownloadURL(thumbnailRef);
                await updateDoc(postDocRef, { thumbnailUrl: downloadURL });
            }
        }
        
        if (finalPostData.subType === 'alliance' && finalPostData.mainType === 'announcement' && !editingPostId) {
            const membersQuery = query(collection(db, 'users'), where('alliance', '==', finalPostData.alliance));
            const membersSnapshot = await getDocs(membersQuery);
            const batch = writeBatch(db);
            membersSnapshot.forEach(memberDoc => {
                if (memberDoc.id === currentUserData.uid) return;
                const notificationRef = doc(collection(db, 'notifications'));
                batch.set(notificationRef, {
                    recipientUid: memberDoc.id,
                    senderUid: currentUserData.uid,
                    senderUsername: currentUserData.username,
                    type: 'alliance_announcement',
                    message: `New announcement in your alliance: "${finalPostData.title}"`,
                    relatedId: postDocRef.id,
                    isRead: false,
                    timestamp: serverTimestamp()
                });
            });
            await batch.commit();
        }

        hideAllModals();
    } catch (error) {
        console.error("Error saving post: ", error);
         // Provide a more descriptive error message
        createPostError.textContent = `Failed to save post: ${error.message}`; 
    } finally {
        submitBtn.disabled = false;
        // Reset button text based on context
        submitBtn.innerHTML = editingPostId 
            ? '<i class="fas fa-save mr-2"></i>Save Changes' 
            : '<i class="fas fa-check-circle mr-2"></i>Create Post';
    }
}

export async function populatePostFormForEdit(postId) {
    const { allPosts } = getState();
    const post = allPosts.find(p => p.id === postId);
    if (!post) {
        console.error("Post not found for editing:", postId);
        return;
    }

    updateState({ editingPostId: postId });
    const postTypeKey = Object.keys(POST_TYPES).find(key => POST_TYPES[key].subType === post.subType && POST_TYPES[key].mainType === post.mainType);
    postCreationData = { ...POST_TYPES[postTypeKey] };

    document.getElementById('create-post-form').reset();
    
    document.getElementById('post-content-header').textContent = `Edit ${postCreationData.text}`;
    const submitBtn = document.getElementById('post-submit-btn');
    submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Changes';

    document.getElementById('post-nav-container').style.display = 'none';
    document.querySelectorAll('.form-slide').forEach(s => s.classList.remove('active'));
    document.querySelector('.form-slide[data-slide="3"]').classList.add('active');
    if (post.mainType === 'event') {
        document.querySelector('.form-slide[data-slide="4"]').classList.add('active');
    }
    
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-details').value = post.details;
    document.getElementById('post-thumbnail-preview').src = post.thumbnailUrl || 'https://placehold.co/100x100/161B22/444444?text=PREVIEW';
    
    if (post.mainType === 'event' && post.startTime) {
        const startDate = post.startTime.toDate();
        const endDate = post.endTime.toDate();

        setCustomSelectValue(document.querySelector('#post-start-day').closest('.custom-select-container'), startDate.getDay().toString(), DAYS_OF_WEEK[startDate.getDay()].text);
        setCustomSelectValue(document.querySelector('#post-start-hour').closest('.custom-select-container'), startDate.getHours().toString(), HOURS_OF_DAY[startDate.getHours()].text);
        setCustomSelectValue(document.querySelector('#post-end-day').closest('.custom-select-container'), endDate.getDay().toString(), DAYS_OF_WEEK[endDate.getDay()].text);
        setCustomSelectValue(document.querySelector('#post-end-hour').closest('.custom-select-container'), endDate.getHours().toString(), HOURS_OF_DAY[endDate.getHours()].text);
        
        const repeatType = post.isRecurring ? 'weekly' : 'none';
        setCustomSelectValue(document.querySelector('#post-repeat-type').closest('.custom-select-container'), repeatType, REPEAT_TYPES.find(rt => rt.value === repeatType).text);
        document.getElementById('post-repeat-weeks-container').classList.toggle('hidden', !post.isRecurring);
        if (post.isRecurring) {
            document.getElementById('post-repeat-weeks').value = post.repeatWeeks || 1;
        }
    }
    
    showModal(document.getElementById('create-post-modal-container'));
    submitBtn.classList.remove('hidden');
}
export function renderTodaysAllianceActivity() {
    const { allPosts, currentUserData } = getState();
    const container = document.getElementById('feed-alliance-activity-container');
    
    if (!container || !currentUserData || !currentUserData.alliance) {
        if (container) container.innerHTML = '<p class="text-center text-gray-500 py-4">Join an alliance to see its activity.</p>';
        return;
    }

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    const todaysAlliancePosts = allPosts.filter(post => {
        const postDate = post.createdAt?.toDate();
        return post.alliance === currentUserData.alliance &&
               post.visibility === 'alliance' &&
               postDate >= todayStart;
    });

    if (todaysAlliancePosts.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">No alliance activity today.</p>';
    } else {
        container.innerHTML = `<div class="grid grid-cols-1 gap-4">${todaysAlliancePosts.map(createCard).join('')}</div>`;
        updateCountdowns(); // We need to call this to make sure event timers are updated
    }
}
// --- NEW FUNCTION for the redesigned Feed Page ---
export function renderFeedActivity() {
    const { allPosts, userNotifications, currentUserData } = getState();
    const container = document.getElementById('feed-activity-container');

    if (!container) return;

    // Step 1: Get Admin Announcements (server-wide)
    const adminAnnouncements = allPosts
        .filter(post => post.subType === 'server' && post.mainType === 'announcement')
        .map(post => {
            const style = POST_STYLES[post.subType] || {};
            return {
                date: post.createdAt?.toDate() || new Date(0),
                style: style,
                icon: style.icon || 'fas fa-bullhorn',
                title: post.title,
                text: `New Server Announcement`
            };
        });

    // Step 2: Get the user's specific Alliance Announcements and Events
    const allianceActivity = currentUserData ? allPosts
        .filter(post => post.alliance === currentUserData.alliance && (post.subType === 'alliance' || post.subType === 'leadership'))
        .map(post => {
            const style = POST_STYLES[post.subType] || {};
            return {
                date: post.createdAt?.toDate() || new Date(0),
                style: style,
                icon: style.icon || 'fas fa-shield-alt',
                title: post.title,
                text: `New ${post.mainType === 'event' ? 'Alliance Event' : 'Alliance Announcement'}`
            };
        }) : [];

    // Step 3: Get verification records for the user's alliance
    const verificationActivities = currentUserData ? userNotifications
        .filter(n => n.type === 'user_verified_record' && n.alliance === currentUserData.alliance)
        .map(n => {
            return {
                date: n.timestamp?.toDate() || new Date(0),
                style: { color: 'var(--post-color-alliance)' },
                icon: 'fas fa-user-check',
                title: 'Alliance Member Verified',
                text: n.message
            };
        }) : [];

    // Step 4: Combine, sort, and get the most recent items
    const feedItems = [...adminAnnouncements, ...allianceActivity, ...verificationActivities];
    feedItems.sort((a, b) => b.date - a.date);
    const recentFeedItems = feedItems.slice(0, 20); // Show up to 20 recent items

    if (recentFeedItems.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">No recent activity.</p>';
        return;
    }

    // Step 5: Render the combined list
    container.innerHTML = recentFeedItems.map(item => {
        const timeAgo = formatTimeAgo(item.date);
        return `
            <div class="feed-item-compact" style="--glow-color: ${item.style.color || 'var(--color-primary)'};">
                <div class="feed-item-icon">
                    <i class="${item.icon}"></i>
                </div>
                <div class="feed-item-content">
                    <h4>${item.title}</h4>
                    <p>${item.text} &bull; ${timeAgo}</p>
                </div>
            </div>
        `;
    }).join('');
}
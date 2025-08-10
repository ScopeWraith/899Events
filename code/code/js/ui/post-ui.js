import { db, storage } from '../firebase-config.js';
import { doc, addDoc, updateDoc, collection, serverTimestamp, writeBatch, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { getState, updateState } from '../state.js';
import { POST_TYPES, POST_STYLES, DAYS_OF_WEEK, HOURS_OF_DAY, REPEAT_TYPES } from '../constants.js';
import { formatTimeAgo, formatEventDateTime, getEventStatus, formatDuration, calculateNextDateTime, resizeImage, getRankBorderClass } from '../utils.js';
import { hideAllModals, showModal, setCustomSelectValue } from './ui-manager.js';

let currentPostStep = 1;
let postCreationData = {};
let resizedThumbnailBlob = null;

// --- RENDERING POSTS (Existing code, unchanged) ---
export function renderNews(filter = 'all') {
    let { allPosts, currentUserData, countdownInterval } = getState();
    const now = new Date();

    if (countdownInterval) clearInterval(countdownInterval);

    let visiblePosts = allPosts.filter(post => {
        if (!currentUserData) return post.visibility === 'public';
        if (currentUserData.isAdmin) return true;
        if (post.visibility === 'alliance' && post.alliance === currentUserData.alliance) return true;
        if (post.visibility === 'public') return true;
        return false;
    });

    let announcements = [];
    let events = [];
    let container;
    let timeWindow;

    switch (filter) {
        case 'events':
            timeWindow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            container = document.getElementById('sub-page-news-events');
            break;
        case 'announcements':
            container = document.getElementById('sub-page-news-announcements');
            break;
        case 'all':
        default:
            timeWindow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            container = document.getElementById('sub-page-news-all');
            break;
    }

    if (filter === 'announcements' || filter === 'all') {
        announcements = visiblePosts.filter(post => {
            if (post.mainType !== 'announcement') return false;
            const postDate = post.createdAt?.toDate();
            if (!postDate) return false;
            const expirationDays = post.expirationDays || 1;
            const expirationDate = new Date(postDate.getTime() + expirationDays * 24 * 60 * 60 * 1000);
            return expirationDate > now;
        });
    }

    if (filter === 'events' || filter === 'all') {
        events = visiblePosts.filter(post => {
            if (post.mainType !== 'event') return false;
            const statusInfo = getEventStatus(post);
            if (statusInfo.status === 'live') return true;
            if (statusInfo.status === 'upcoming' && statusInfo.startTime <= timeWindow) return true;
            return false;
        });
    }

    if (!container) return;

    announcements.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
    events.sort((a, b) => {
        const statusA = getEventStatus(a);
        const statusB = getEventStatus(b);
        if (statusA.status === 'live' && statusB.status !== 'live') return -1;
        if (statusA.status !== 'live' && statusB.status === 'live') return 1;
        return (statusA.startTime?.getTime() || 0) - (statusB.startTime?.getTime() || 0);
    });

    let contentHTML = '';
    if (filter === 'all') {
         contentHTML = `
            <div class="mb-2 ${announcements.length === 0 ? 'hidden' : ''}">
                <h2 class="section-header text-1xl font-bold">
                    <i class="fas fa-bullhorn"></i><span>Announcements</span>
                </h2>
                <div class="grid grid-cols-1 gap-4">${announcements.map(createCard).join('')}</div>
            </div>
            <div class="${events.length === 0 ? 'hidden' : ''}">
                <h2 class="section-header text-1xl font-bold">
                    <i class="fas fa-calendar-alt"></i><span>Events</span>
                </h2>
                <div class="grid grid-cols-1 gap-4">${events.map(createCard).join('')}</div>
            </div>
        `;
        if (announcements.length === 0 && events.length === 0) {
            contentHTML = `<p class="text-center text-gray-400 py-8">No news or events to display.</p>`;
        }
    } else {
         const items = filter === 'events' ? events : announcements;
         if (items.length > 0) {
             contentHTML = `<div class="grid grid-cols-1 gap-4">${items.map(createCard).join('')}</div>`;
         } else {
             contentHTML = `<p class="text-center text-gray-400 py-8">No ${filter} to display.</p>`;
         }
    }

    container.innerHTML = contentHTML;

    countdownInterval = setInterval(updateCountdowns, 1000 * 30);
    updateState({ countdownInterval });
    updateCountdowns();
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
        actionsTriggerHTML = `<button class="post-card-actions-trigger" data-post-id="${post.id}" title="Post Options"><i class="fas fa-cog"></i></button>`;
    }

    if (isEvent) {
        const backgroundStyle = post.thumbnailUrl ? `background-image: url('${post.thumbnailUrl}');` : '';
        return `
            <div class="post-card event-card cursor-pointer" data-post-id="${post.id}" style="--glow-color: ${color}; border-top-color: ${color};">
                <div class="event-card-background" style="${backgroundStyle}"></div>
                <div class="post-card-content">
                    <span class="post-card-category" style="background-color: ${color};">${categoryText}</span>
                    <h3 class="post-card-title">${post.title}</h3>
                    <p class="post-card-details">${post.details}</p>
                </div>
                <div class="post-card-status">
                    <div class="status-content-wrapper"></div>
                    <div class="status-date"></div>
                </div>
                ${actionsTriggerHTML}
            </div>
        `;
    } else {
        const authorData = allPosts.find(p => p.uid === post.authorUid);
        const rankBorder = getRankBorderClass(authorData);
        const avatarUrl = authorData?.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${(authorData?.username || '?').charAt(0).toUpperCase()}`;
        const postDate = post.createdAt?.toDate();
        // The key change is adding the 'has-thumbnail' class conditionally
        const hasThumbnailClass = post.thumbnailUrl ? 'has-thumbnail' : '';
        return `
            <div class="post-card announcement-card cursor-pointer ${hasThumbnailClass}" data-post-id="${post.id}" style="--glow-color: ${color}; border-top-color: ${color};">
                ${post.thumbnailUrl ? `<div class="announcement-card-thumbnail" style="background-image: url('${post.thumbnailUrl}')"></div>` : ''}
                <div class="post-card-body">
                    <span class="post-card-category mb-2" style="background-color: ${color};">${categoryText}</span>
                    <h3 class="post-card-title !mb-2">${post.title}</h3>
                    <p class="post-card-details">${post.details}</p>
                    <div class="post-card-header mt-3">
                        <img src="${avatarUrl}" class="author-avatar ${rankBorder}" alt="${authorData?.username || 'Unknown'}">
                        <div class="author-info">
                            <p class="author-name">${authorData?.username || 'Unknown'}</p>
                            <p class="author-meta">Posted ${postDate ? formatTimeAgo(postDate) : ''}</p>
                        </div>
                    </div>
                </div>
                ${actionsTriggerHTML}
            </div>
        `;
    }
}

function updateCountdowns() {
    document.querySelectorAll('.event-card').forEach(el => {
        const postId = el.dataset.postId;
        const post = getState().allPosts.find(p => p.id === postId);
        if (!post) return;

        const statusInfo = getEventStatus(post);
        const statusEl = el.querySelector('.status-content-wrapper');
        const dateEl = el.querySelector('.status-date');
        if (!statusEl || !dateEl) return;

        el.classList.remove('live', 'ended', 'upcoming');
        dateEl.textContent = formatEventDateTime(statusInfo.startTime);

        switch(statusInfo.status) {
            case 'upcoming':
                el.classList.add('upcoming');
                statusEl.innerHTML = `<div class="status-label">STARTS IN</div><div class="status-time">${formatDuration(statusInfo.timeDiff)}</div>`;
                break;
            case 'live':
                el.classList.add('live');
                statusEl.innerHTML = `<div class="status-label">ENDS IN</div><div class="status-time">${formatDuration(statusInfo.timeDiff)}</div>`;
                dateEl.textContent = `Ends: ${formatEventDateTime(statusInfo.endTime)}`;
                break;
            case 'ended':
                el.classList.add('ended');
                statusEl.innerHTML = `<div class="status-label">ENDED</div><div class="status-time">${statusInfo.endedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>`;
                break;
        }
    });
}

// --- NEW POST CREATION & EDITING ---

export function initializePostStepper(mainType) {
    document.getElementById('create-post-form').reset();
    postCreationData = {};
    resizedThumbnailBlob = null;
    document.getElementById('post-thumbnail-preview').src = 'https://placehold.co/100x100/161B22/444444?text=PREVIEW';

    postCreationData.mainType = mainType;
    currentPostStep = 1;
    populateSubTypeSelection();
    showPostStep(currentPostStep);
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
    header.textContent = `Select ${postCreationData.mainType} Type`;
    container.innerHTML = '';

    const availableSubTypes = getAvailablePostTypes(postCreationData.mainType);

    availableSubTypes.forEach(([key, type]) => {
        const style = POST_STYLES[type.subType];
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.key = key;
        button.className = 'type-selection-card w-full p-8 rounded-lg text-left flex items-center gap-4';
        button.style.setProperty('--card-color', style.color);
        button.innerHTML = `
            <i class="${style.icon} fa-2x w-10 text-center" style="color: ${style.color};"></i>
            <div>
                <h3 class="font-bold text-lg text-white">${type.text}</h3>
                <p class="text-sm text-gray-500">${type.description || `Create a new ${type.text}.`}</p>
            </div>
        `;
        button.addEventListener('click', () => {
            Object.assign(postCreationData, type);
            currentPostStep = 2;
            showPostStep(currentPostStep);
        });
        container.appendChild(button);
    });

    if (availableSubTypes.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400 col-span-full">You do not have permission to create any ${postCreationData.mainType}s.</p>`;
    }
}

function showPostStep(stepIndex) {
    const postFlow = document.getElementById('post-creation-flow');
    postFlow.querySelectorAll('.form-slide').forEach(slide => slide.classList.remove('active'));
    const currentSlide = postFlow.querySelector(`.form-slide[data-slide="${stepIndex}"]`);
    if(currentSlide) currentSlide.classList.add('active');

    const postBackBtn = document.getElementById('post-back-btn');
    const postSubmitBtn = document.getElementById('post-submit-btn');

    postBackBtn.style.visibility = stepIndex === 1 ? 'hidden' : 'visible';
    postSubmitBtn.classList.toggle('hidden', stepIndex !== 2);

    if(stepIndex === 2) {
        const isEvent = postCreationData.mainType === 'event';
        const { currentUserData } = getState();

        document.getElementById('post-content-header').textContent = `New ${postCreationData.text}`;
        document.getElementById('post-content-subheader').textContent = postCreationData.description || `Provide the details for your post.`;

        document.getElementById('post-expiration-group').classList.toggle('hidden', isEvent);
        document.getElementById('post-timing-group').classList.toggle('hidden', !isEvent);

        const allianceGroup = document.getElementById('post-alliance-group');
        const canSpecifyAlliance = currentUserData.isAdmin && (postCreationData.visibility === 'alliance' || postCreationData.visibility === 'leadership');
        allianceGroup.classList.toggle('hidden', !canSpecifyAlliance);
    }
}

function validatePostStep(stepIndex) {
    const createPostError = document.getElementById('create-post-error');
    createPostError.textContent = '';
    if (stepIndex === 2) {
         if (!document.getElementById('post-title').value || !document.getElementById('post-details').value) {
            createPostError.textContent = 'Title and details are required.';
            return false;
        }
         if (postCreationData.mainType === 'event') {
            if (!document.getElementById('post-start-day').value || !document.getElementById('post-start-hour').value ||
                !document.getElementById('post-end-day').value || !document.getElementById('post-end-hour').value) {
                createPostError.textContent = 'Please select a start and end day/hour for the event.';
                return false;
            }
        }
    }
    return true;
}

export function handlePostBack() {
    currentPostStep = 1;
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
    if (!validatePostStep(currentPostStep)) return;

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
        finalPostData.startTime = calculateNextDateTime(document.getElementById('post-start-day').value, document.getElementById('post-start-hour').value);
        finalPostData.endTime = calculateNextDateTime(document.getElementById('post-end-day').value, document.getElementById('post-end-hour').value);
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
            // Editing logic to be added later
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

        hideAllModals();
    } catch (error) {
        console.error("Error saving post: ", error);
        createPostError.textContent = `Failed to save post: ${error.message}`; 
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Create Post';
    }
}

export async function populatePostFormForEdit(postId) {
    // This will need to be completely rewritten for the new flow.
    // For now, we are focusing on creation.
    console.log("Editing function not yet implemented for new flow.");
}

export function renderFeedActivity() {
    const { allPosts, currentUserData } = getState();
    const container = document.getElementById('feed-activity-container');

    if (!container || !currentUserData) {
        if(container) container.innerHTML = `<p class="text-center text-gray-400 py-4">Log in to see your activity feed.</p>`;
        return;
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const feedItems = allPosts
        .filter(post => {
            const isRecent = post.createdAt?.toDate() > oneWeekAgo;
            const isAdminPost = post.visibility === 'public';
            const isAlliancePost = post.visibility === 'alliance' && post.alliance === currentUserData.alliance;
            return isRecent && (isAdminPost || isAlliancePost);
        })
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .slice(0, 20)
        .map(post => {
            const style = POST_STYLES[post.subType] || {};
            const postTypeInfo = Object.values(POST_TYPES).find(pt => pt.subType === post.subType && pt.mainType === post.mainType) || {};
            return `
                <div class="feed-item-compact" style="--glow-color: ${style.color || 'var(--color-primary)'};">
                    <div class="feed-item-icon"><i class="${style.icon}"></i></div>
                    <div class="feed-item-content">
                        <h4>${post.title}</h4>
                        <p>${postTypeInfo.text || 'New Post'} &bull; ${formatTimeAgo(post.createdAt.toDate())}</p>
                    </div>
                </div>
            `;
        }).join('');

    if (feedItems) {
        container.innerHTML = feedItems;
    } else {
        container.innerHTML = `<p class="text-center text-gray-400 py-4">No recent activity.</p>`;
    }
}
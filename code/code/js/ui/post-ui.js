// code/js/ui/post-ui.js

import { db, storage } from '../firebase-config.js';
import { doc, addDoc, updateDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { subscribe, setState, getState } from '../state.js';
import { POST_TYPES, POST_STYLES, DAYS_OF_WEEK, HOURS_OF_DAY, REPEAT_TYPES, ANNOUNCEMENT_EXPIRATION_DAYS } from '../constants.js';
import { formatTimeAgo, formatEventDateTime, getEventStatus, formatDuration, calculateNextDateTime, resizeImage, getRankBorderClass } from '../utils.js';
import { hideAllModals, showModal, setCustomSelectValue, createSkeletonCard, showCreatePostModal } from './ui-manager.js';

// --- FIX: Moved module-scoped variables to the top ---
let countdownInterval = null;
let currentPostStep = 1;
let postCreationData = {};
let resizedThumbnailBlob = null;

// --- STATE & RENDER FUNCTIONS ---

function renderPostsUI(newState, prevState) {
    if (newState.allPosts && (newState.allPosts !== prevState.allPosts || newState.allPlayers !== prevState.allPlayers || newState.currentUserData !== prevState.currentUserData)) {
        const activeSubNav = document.querySelector('#news-submenu .sub-nav-link.active');
        const filter = activeSubNav ? activeSubNav.dataset.subTarget.split('-')[1] : 'all';
        renderNews(filter, newState);
    }
    if (newState.allPosts && (newState.allPosts !== prevState.allPosts || newState.currentUserData !== prevState.currentUserData || newState.unverifiedPlayers !== prevState.unverifiedPlayers)) {
        renderFeedActivity(newState);
    }
}

export function initializePostUI() {
    subscribe(renderPostsUI);
}

// --- UI HELPER & RENDERING FUNCTIONS ---

export function renderNews(filter = 'all', state) {
    const { allPlayers, allPosts, currentUserData } = state;
    if (!allPosts || !allPlayers) {
        const container = document.getElementById(`sub-page-news-${filter}`);
        if (container && !container.querySelector('.skeleton-card')) {
             container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">${createSkeletonCard()}${createSkeletonCard()}${createSkeletonCard()}${createSkeletonCard()}</div>`;
        }
        return;
    }
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
        case 'events': timeWindow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); container = document.getElementById('sub-page-news-events'); break;
        case 'announcements': container = document.getElementById('sub-page-news-announcements'); break;
        default: timeWindow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); container = document.getElementById('sub-page-news-all'); break;
    }
    if (!container) return;
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
            return statusInfo.status === 'live' || (statusInfo.status === 'upcoming' && statusInfo.startTime <= timeWindow);
        });
    }
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
         contentHTML = `<div class="mb-2 ${announcements.length === 0 ? 'hidden' : ''}"><h2 class="section-header text-1xl font-bold"><i class="fas fa-bullhorn"></i><span>Announcements</span></h2><div class="grid grid-cols-1 gap-4">${announcements.map(post => createCard(post, allPlayers, currentUserData)).join('')}</div></div><div class="${events.length === 0 ? 'hidden' : ''}"><h2 class="section-header text-1xl font-bold"><i class="fas fa-calendar-alt"></i><span>Events</span></h2><div class="grid grid-cols-1 gap-4">${events.map(post => createCard(post, allPlayers, currentUserData)).join('')}</div></div>`;
        if (announcements.length === 0 && events.length === 0) contentHTML = `<p class="text-center text-gray-400 py-8">No news or events to display.</p>`;
    } else {
         const items = filter === 'events' ? events : announcements;
         contentHTML = items.length > 0 ? `<div class="grid grid-cols-1 gap-4">${items.map(post => createCard(post, allPlayers, currentUserData)).join('')}</div>` : `<p class="text-center text-gray-400 py-8">No ${filter} to display.</p>`;
    }
    container.innerHTML = contentHTML;
    countdownInterval = setInterval(updateCountdowns, 1000 * 30);
    updateCountdowns();
}

function createCard(post, allPlayers, currentUserData) {
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
        return `<div class="post-card event-card cursor-pointer" data-post-id="${post.id}" style="--glow-color: ${color}; border-top-color: ${color};"><div class="event-card-background" style="${backgroundStyle}"></div><div class="post-card-content"><span class="post-card-category" style="background-color: ${color};">${categoryText}</span><h3 class="post-card-title">${post.title}</h3><p class="post-card-details">${post.details}</p></div><div class="post-card-status"><div class="status-content-wrapper"></div><div class="status-date"></div></div>${actionsTriggerHTML}</div>`;
    } else {
        const authorData = allPlayers.find(p => p.uid === post.authorUid);
        const rankBorder = getRankBorderClass(authorData);
        const avatarUrl = authorData?.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${(authorData?.username || '?').charAt(0).toUpperCase()}`;
        const postDate = post.createdAt?.toDate();
        const hasThumbnailClass = post.thumbnailUrl ? 'has-thumbnail' : '';
        return `<div class="post-card announcement-card cursor-pointer ${hasThumbnailClass}" data-post-id="${post.id}" style="--glow-color: ${color}; border-top-color: ${color};">${post.thumbnailUrl ? `<div class="announcement-card-thumbnail" style="background-image: url('${post.thumbnailUrl}')"></div>` : ''}<div class="post-card-body"><span class="post-card-category mb-2" style="background-color: ${color};">${categoryText}</span><div class="post-card-header mb-3"><img src="${avatarUrl}" class="author-avatar ${rankBorder}" alt="${authorData?.username || 'Unknown'}" loading="lazy"><div class="author-info"><p class="author-name">${authorData?.username || 'Unknown'}</p><p class="author-meta">Posted ${postDate ? formatTimeAgo(postDate) : ''}</p></div></div><h3 class="post-card-title !mb-2">${post.title}</h3><p class="post-card-details">${post.details}</p></div>${actionsTriggerHTML}</div>`;
    }
}

function updateCountdowns() {
    document.querySelectorAll('.event-card').forEach(el => {
        const postId = el.dataset.postId;
        const post = getState().allPosts?.find(p => p.id === postId);
        if (!post) return;
        const statusInfo = getEventStatus(post);
        const statusEl = el.querySelector('.status-content-wrapper');
        const dateEl = el.querySelector('.status-date');
        if (!statusEl || !dateEl) return;
        el.classList.remove('live', 'ended', 'upcoming');
        dateEl.textContent = formatEventDateTime(statusInfo.startTime);
        switch(statusInfo.status) {
            case 'upcoming': el.classList.add('upcoming'); statusEl.innerHTML = `<div class="status-label">STARTS IN</div><div class="status-time">${formatDuration(statusInfo.timeDiff)}</div>`; break;
            case 'live': el.classList.add('live'); statusEl.innerHTML = `<div class="status-label">ENDS IN</div><div class="status-time">${formatDuration(statusInfo.timeDiff)}</div>`; dateEl.textContent = `Ends: ${formatEventDateTime(statusInfo.endTime)}`; break;
            case 'ended': el.classList.add('ended'); statusEl.innerHTML = `<div class="status-label">ENDED</div><div class="status-time">${statusInfo.endedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>`; break;
        }
    });
}

export function renderFeedActivity(state) {
    const { allPosts, currentUserData, unverifiedPlayers } = state;
    const container = document.getElementById('feed-activity-container');
    if (!container || !currentUserData) {
        if(container) container.innerHTML = `<p class="text-center text-gray-400 py-4">Log in to see your activity feed.</p>`;
        return;
    }
    if (!allPosts) return;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const feedItems = allPosts.filter(post => {
        const isRecent = post.createdAt?.toDate() > oneWeekAgo;
        const isAdminPost = post.visibility === 'public';
        const isAlliancePost = post.visibility === 'alliance' && post.alliance === currentUserData.alliance;
        return isRecent && (isAdminPost || isAlliancePost);
    }).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).slice(0, 20).map(post => {
        const style = POST_STYLES[post.subType] || {};
        const postTypeInfo = Object.values(POST_TYPES).find(pt => pt.subType === post.subType && pt.mainType === post.mainType) || {};
        return `<div class="feed-item-compact" style="--glow-color: ${style.color || 'var(--color-primary)'};"><div class="feed-item-icon"><i class="${style.icon}"></i></div><div class="feed-item-content"><h4>${post.title}</h4><p>${postTypeInfo.text || 'New Post'} &bull; ${formatTimeAgo(post.createdAt.toDate())}</p></div></div>`;
    });
    const unverifiedItems = (unverifiedPlayers || []).map(player => `<div class="feed-item-compact" style="--glow-color: var(--color-highlight);"><div class="feed-item-icon"><i class="fas fa-exclamation-circle"></i></div><div class="feed-item-content"><h4>${player.username} has joined your alliance.</h4><p>Awaiting verification &bull; Unverified Player</p></div></div>`);
    const allFeedItems = [...unverifiedItems, ...feedItems].join('');
    container.innerHTML = allFeedItems || `<p class="text-center text-gray-400 py-4">No recent activity.</p>`;
}

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

function populateSubTypeSelection() {
    const { currentUserData } = getState();
    const container = document.getElementById('post-subtype-selection-container');
    if (!container) return;
    const subTypes = Object.entries(POST_TYPES).filter(([key, type]) => {
        if (type.mainType !== postCreationData.mainType) return false;
        if (!currentUserData) return false;
        if (currentUserData.isAdmin) return true;
        if (type.isAdminOnly) return false;
        if (type.allowedRanks && type.allowedRanks.includes(currentUserData.allianceRank) && currentUserData.isVerified) return true;
        return false;
    });
    document.getElementById('post-subtype-header').textContent = `Create New ${postCreationData.mainType}`;
    container.innerHTML = subTypes.map(([key, type]) => {
        const style = POST_STYLES[type.subType] || {};
        return `<div class="type-selection-card flex items-center p-4 gap-4" data-subtype="${type.subType}" style="--card-color: ${style.color || '#fff'};"><div class="text-3xl" style="color: ${style.color || '#fff'};"><i class="${style.icon || 'fas fa-question-circle'}"></i></div><div><h3 class="font-bold text-white text-lg">${type.text}</h3><p class="text-sm text-gray-400">A short description of what this post type is for.</p></div></div>`;
    }).join('');
    container.querySelectorAll('.type-selection-card').forEach(card => {
        card.addEventListener('click', () => {
            postCreationData.subType = card.dataset.subtype;
            currentPostStep = 2;
            showPostStep(currentPostStep);
            updatePostFormVisibility();
        });
    });
}

function showPostStep(step) {
    document.querySelectorAll('#post-creation-flow .form-slide').forEach(slide => {
        slide.classList.toggle('active', parseInt(slide.dataset.slide) === step);
    });
    document.getElementById('post-submit-btn').classList.toggle('hidden', step !== 2);
}

export function handlePostBack() {
    if (currentPostStep > 1) {
        currentPostStep--;
        showPostStep(currentPostStep);
    }
}

function updatePostFormVisibility() {
    const typeInfo = Object.values(POST_TYPES).find(t => t.subType === postCreationData.subType && t.mainType === postCreationData.mainType);
    if (!typeInfo) return;
    document.getElementById('post-content-header').textContent = `Create: ${typeInfo.text}`;
    document.getElementById('post-timing-group').classList.toggle('hidden', postCreationData.mainType !== 'event');
    document.getElementById('post-expiration-group').classList.toggle('hidden', postCreationData.mainType !== 'announcement' || typeInfo.subType !== 'server');
    document.getElementById('post-alliance-group').classList.toggle('hidden', typeInfo.visibility !== 'alliance');
    if (typeInfo.visibility === 'alliance') {
        const { currentUserData } = getState();
        const container = document.getElementById('post-alliance').closest('.custom-select-container');
        setCustomSelectValue(container, currentUserData.alliance, currentUserData.alliance);
    }
}

export async function handleThumbnailSelection(e) {
    const file = e.target.files[0];
    if (!file) return;
    resizedThumbnailBlob = await resizeImage(file, { maxWidth: 1280, maxHeight: 720 });
    document.getElementById('post-thumbnail-preview').src = URL.createObjectURL(resizedThumbnailBlob);
}

export async function handlePostSubmit(e) {
    e.preventDefault();
    const { currentUserData, editingPostId } = getState();
    if (!currentUserData) return;
    const errorEl = document.getElementById('create-post-error');
    errorEl.textContent = '';
    const submitBtn = document.getElementById('post-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = editingPostId ? '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...' : '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...';
    const typeInfo = Object.values(POST_TYPES).find(t => t.subType === postCreationData.subType && t.mainType === postCreationData.mainType);
    try {
        let thumbnailUrl = document.getElementById('post-thumbnail-preview').src;
        if (resizedThumbnailBlob) {
            const docId = editingPostId || doc(collection(db, 'posts')).id;
            const storageRef = ref(storage, `post_thumbnails/${docId}`);
            await uploadBytes(storageRef, resizedThumbnailBlob);
            thumbnailUrl = await getDownloadURL(storageRef);
        }
        const finalPostData = {
            ...postCreationData,
            title: document.getElementById('post-title').value,
            details: document.getElementById('post-details').value,
            authorUid: currentUserData.uid,
            visibility: typeInfo.visibility,
            alliance: typeInfo.visibility === 'alliance' ? currentUserData.alliance : null,
            thumbnailUrl: thumbnailUrl.startsWith('http') ? thumbnailUrl : null,
            expirationDays: postCreationData.mainType === 'announcement' ? parseInt(document.getElementById('post-expiration-days').value) : null,
        };
        if (postCreationData.mainType === 'event') {
            const startDay = document.getElementById('post-start-day').value;
            const startHour = document.getElementById('post-start-hour').value;
            const endDay = document.getElementById('post-end-day').value;
            const endHour = document.getElementById('post-end-hour').value;
            if (!startDay || !startHour || !endDay || !endHour) {
                throw new Error("Please select start and end times for the event.");
            }
            finalPostData.startTime = calculateNextDateTime(startDay, startHour);
            finalPostData.endTime = calculateNextDateTime(endDay, endHour);
            if (finalPostData.endTime <= finalPostData.startTime) {
                 finalPostData.endTime.setDate(finalPostData.endTime.getDate() + 7);
            }
            finalPostData.isRecurring = document.getElementById('post-repeat-type').value === 'weekly';
            finalPostData.repeatWeeks = finalPostData.isRecurring ? parseInt(document.getElementById('post-repeat-weeks').value) : null;
        }
        if (editingPostId) {
            await updateDoc(doc(db, 'posts', editingPostId), finalPostData);
        } else {
            finalPostData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'posts'), finalPostData);
        }
        hideAllModals();
    } catch (error) {
        console.error("Post submission error:", error);
        errorEl.textContent = error.message || "An error occurred. Please try again.";
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = editingPostId ? '<i class="fas fa-save mr-2"></i>Save Changes' : '<i class="fas fa-check-circle mr-2"></i>Create Post';
    }
}

export function populatePostFormForEdit(postId) {
    const { allPosts } = getState();
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;
    setState({ editingPostId: postId });
    showCreatePostModal(post.mainType);
    currentPostStep = 2;
    postCreationData.subType = post.subType;
    showPostStep(currentPostStep);
    updatePostFormVisibility();
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-details').value = post.details;
    document.getElementById('post-thumbnail-preview').src = post.thumbnailUrl || 'https://placehold.co/100x100/161B22/444444?text=PREVIEW';
    if (post.mainType === 'announcement') {
        const expContainer = document.getElementById('post-expiration-days').closest('.custom-select-container');
        const expValue = post.expirationDays || '1';
        const expText = ANNOUNCEMENT_EXPIRATION_DAYS.find(d => d.value === expValue)?.text || '1 Day';
        setCustomSelectValue(expContainer, expValue, expText);
    }
    if (post.mainType === 'event') {
        const setDateTime = (type, date) => {
            if (!date) return;
            const day = date.getDay().toString();
            const hour = date.getHours().toString();
            const dayContainer = document.getElementById(`post-${type}-day`).closest('.custom-select-container');
            const hourContainer = document.getElementById(`post-${type}-hour`).closest('.custom-select-container');
            setCustomSelectValue(dayContainer, day, DAYS_OF_WEEK.find(d=>d.value === day).text);
            setCustomSelectValue(hourContainer, hour, HOURS_OF_DAY.find(h=>h.value === hour).text);
        };
        setDateTime('start', post.startTime?.toDate());
        setDateTime('end', post.endTime?.toDate());
        const repeatContainer = document.getElementById('post-repeat-type').closest('.custom-select-container');
        const repeatValue = post.isRecurring ? 'weekly' : 'none';
        setCustomSelectValue(repeatContainer, repeatValue, REPEAT_TYPES.find(r=>r.value === repeatValue).text);
        document.getElementById('post-repeat-weeks-container').classList.toggle('hidden', !post.isRecurring);
        document.getElementById('post-repeat-weeks').value = post.repeatWeeks || 1;
    }
    document.getElementById('post-content-header').textContent = 'Edit Post';
    document.getElementById('post-submit-btn').innerHTML = '<i class="fas fa-save mr-2"></i>Save Changes';
}
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
import { formatTimeAgo, formatEventDateTime, getEventStatus, formatDuration, calculateNextDateTime, resizeImage, getRankBorderClass, formatPostTimestamp } from '../utils.js';
import { hideAllModals, showModal, setCustomSelectValue } from './ui-manager.js';

let currentPostStep = 1;
let postCreationData = {};
let resizedThumbnailBlob = null;

// --- RENDERING POSTS ---
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
            return statusInfo.status === 'live' || (statusInfo.status === 'upcoming' && statusInfo.startTime <= timeWindow);
        });
    }
    
    if (!container) return;

    announcements.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
    events.sort((a, b) => {
        const statusA = getEventStatus(a);
        const statusB = getEventStatus(b);
        if (statusA.status === 'live' && statusB.status !== 'live') return -1;
        if (statusA.status !== 'live' && statusB.status === 'live') return 1;
        if (statusA.status === 'live' && statusB.status === 'live') return statusA.timeDiff - statusB.timeDiff;
        if (statusA.status === 'upcoming' && statusB.status === 'upcoming') return statusA.timeDiff - statusB.timeDiff;
        return 0;
    });

    let contentHTML = '';
    if (announcements.length > 0) {
        contentHTML += `<div class="grid grid-cols-1 gap-4">${announcements.map(createCard).join('')}</div>`;
    }
    if (events.length > 0) {
        if (announcements.length > 0) {
            contentHTML += `<hr class="border-t border-white/10 my-6">`;
        }
        contentHTML += `<div class="grid grid-cols-1 gap-4">${events.map(createCard).join('')}</div>`;
    }

    container.innerHTML = contentHTML || `<p class="text-center text-gray-400 py-8">No items to display.</p>`;

    countdownInterval = setInterval(updateCountdowns, 1000 * 30);
    updateState({ countdownInterval });
    updateCountdowns();
}

export function renderPosts() {
    const { activeFilter } = getState();
    const newsPage = document.getElementById('page-news');
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
        actionsTriggerHTML = `<button class="post-card-actions-trigger" data-post-id="${post.id}" title="Post Options"><i class="fas fa-cog"></i></button>`;
    }

    if (isEvent) {
        const backgroundStyle = post.thumbnailUrl ? `background-image: url('${post.thumbnailUrl}');` : '';
        return `
            <div class="post-card event-card" data-post-id="${post.id}" style="--glow-color: ${color}; border-top-color: ${color};">
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
    } else { // Announcement
            const authorData = allPlayers.find(p => p.uid === post.authorUid);
            const rankBorder = getRankBorderClass(authorData);
            const avatarUrl = authorData?.avatarUrl || `https://placehold.co/48x48/0D1117/FFFFFF?text=${(authorData?.username || '?').charAt(0).toUpperCase()}`;
            const postDate = post.createdAt?.toDate();
            const hasThumbnail = !!post.thumbnailUrl;
            const thumbnailHTML = hasThumbnail ? `<img src="${post.thumbnailUrl}" class="announcement-thumbnail" alt="Announcement Image">` : '';

            let rankAndAllianceHTML = '';
            if (authorData) {
                const rankText = authorData.isAdmin ? '(ADMIN)' : `(${authorData.allianceRank || 'N/A'})`;
                const allianceText = `[${authorData.alliance || 'N/A'}]`;
                rankAndAllianceHTML = `<p class="author-rank-alliance">${rankText} ${allianceText}</p>`;
            }

            return `
                <div class="post-card announcement-card cursor-pointer" data-post-id="${post.id}" style="--glow-color: ${color}; border-top-color: ${color};">
                    <div class="post-card-body">
                        <div class="announcement-top-section">
                            <div class="announcement-author-content">
                                <div class="post-card-header">
                                    <img src="${avatarUrl}" class="author-avatar ${rankBorder}" alt="${authorData?.username || 'Unknown'}">
                                    <div class="author-info">
                                        ${rankAndAllianceHTML}
                                        <p class="author-name">${authorData?.username || 'Unknown'}</p>
                                        <p class="author-meta">${formatTimeAgo(postDate)}</p>
                                    </div>
                                </div>
                                <span class="post-card-category" style="background-color: ${color};">${categoryText}</span>
                            </div>
                            ${thumbnailHTML}
                        </div>

                        <div class="announcement-main-content">
                            <h3 class="post-card-title">${post.title}</h3>
                            <p class="post-card-details">${post.details}</p>
                        </div>
                    </div>
                    <div class="post-card-footer">
                        <p class="post-card-timestamp-footer">${formatPostTimestamp(postDate)}</p>
                    </div>
                    ${actionsTriggerHTML}
                </div>
            `;
        }
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
        
        if (statusInfo.status === 'live') {
            dateEl.textContent = formatEventDateTime(statusInfo.endTime);
        } else {
            dateEl.textContent = formatEventDateTime(statusInfo.startTime);
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

export function initializePostStepper(mainType) {
    document.getElementById('create-post-form').reset();
    postCreationData = {};
    resizedThumbnailBlob = null;
    
    const dropzone = document.getElementById('post-thumbnail-dropzone');
    if (dropzone) {
        dropzone.classList.remove('has-thumbnail');
        dropzone.style.backgroundImage = 'none';
    }
    
    postCreationData.mainType = mainType;
    currentPostStep = 2; // Start at sub-type selection
    populateSubTypeSelection();
    showPostStep(currentPostStep);
    
    const backBtn = document.getElementById('post-back-btn');
    const nextBtn = document.getElementById('post-next-btn');
    if (backBtn) backBtn.classList.remove('hidden');
    if (nextBtn) nextBtn.classList.remove('hidden');
}

function populateSubTypeSelection() {
    const container = document.getElementById('post-subtype-selection-container');
    const header = document.getElementById('post-subtype-header');
    
    if (!container || !header) return;

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
    if (!postFlow) return;

    const postFormSlides = postFlow.querySelectorAll('.form-slide');
    const postBackBtn = document.getElementById('post-back-btn');
    const postNextBtn = document.getElementById('post-next-btn');
    const postSubmitBtn = document.getElementById('post-submit-btn');
    const { editingPostId } = getState();

    postFormSlides.forEach(slide => slide.classList.remove('active'));
    const currentSlide = postFlow.querySelector(`.form-slide[data-slide="${stepIndex}"]`);
    if (currentSlide) currentSlide.classList.add('active');
    
    const isEvent = postCreationData.mainType === 'event';
    const totalSteps = isEvent ? 4 : 3;

    if (postBackBtn) postBackBtn.style.visibility = stepIndex === 2 ? 'hidden' : 'visible';
    if (postNextBtn) postNextBtn.classList.toggle('hidden', stepIndex >= totalSteps);
    if (postSubmitBtn) postSubmitBtn.classList.toggle('hidden', stepIndex !== totalSteps);
    
    if (stepIndex === 3) {
        const header = document.getElementById('post-content-header');
        if (header) header.textContent = editingPostId ? `Edit ${postCreationData.text}` : `New ${postCreationData.text}`;
        
        const allianceGroup = document.getElementById('post-alliance-group');
        const { currentUserData } = getState();
        if (allianceGroup && currentUserData) {
            if (currentUserData.isAdmin && (postCreationData.visibility === 'alliance' || postCreationData.visibility === 'leadership')) {
                allianceGroup.classList.remove('hidden');
            } else {
                allianceGroup.classList.add('hidden');
            }
        }
        
        const expirationGroup = document.getElementById('post-expiration-group');
        if (expirationGroup) {
            const isAnnouncement = postCreationData.mainType === 'announcement';
            expirationGroup.classList.toggle('hidden', !isAnnouncement);
        }
    }
}


function validatePostStep(stepIndex) {
    const createPostError = document.getElementById('create-post-error');
    if (createPostError) createPostError.textContent = '';
    
    if (stepIndex === 3) {
         if (!document.getElementById('post-title').value || !document.getElementById('post-details').value) {
            if (createPostError) createPostError.textContent = 'Title and details are required.';
            return false;
        }
    } else if (stepIndex === 4 && postCreationData.mainType === 'event') {
        if (!document.getElementById('post-start-day').value || !document.getElementById('post-start-hour').value ||
            !document.getElementById('post-end-day').value || !document.getElementById('post-end-hour').value) {
            if (createPostError) createPostError.textContent = 'Please select a start/end day and hour for the event.';
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
    
    const dropzone = document.getElementById('post-thumbnail-dropzone');
    if (dropzone) {
        dropzone.style.backgroundImage = `url('${URL.createObjectURL(resizedThumbnailBlob)}')`;
        dropzone.classList.add('has-thumbnail');
    }
}

export async function handlePostSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('post-submit-btn');
    const createPostError = document.getElementById('create-post-error');
    const { currentUserData, editingPostId } = getState();

    if (!currentUserData) {
        if (createPostError) createPostError.textContent = 'You must be logged in to post.';
        return;
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
    }

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
    } else {
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
        if (createPostError) createPostError.textContent = `Failed to save post: ${error.message}`; 
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = editingPostId 
                ? '<i class="fas fa-save mr-2"></i>Save Changes' 
                : '<i class="fas fa-check-circle mr-2"></i>Create Post';
        }
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
    const dropzone = document.getElementById('post-thumbnail-dropzone');
    if (post.thumbnailUrl) {
        dropzone.style.backgroundImage = `url('${post.thumbnailUrl}')`;
        dropzone.classList.add('has-thumbnail');
    } else {
        dropzone.style.backgroundImage = 'none';
        dropzone.classList.remove('has-thumbnail');
    }
    
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
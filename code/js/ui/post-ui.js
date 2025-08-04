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
import { formatTimeAgo, formatEventDateTime, getEventStatus, calculateNextDateTime, resizeImage } from '../utils.js';
import { hideAllModals, showModal, setCustomSelectValue, createSkeletonCard } from './ui-manager.js';

let currentPostStep = 1;
let postCreationData = {};
let resizedThumbnailBlob = null;

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
        return true; // Changed from false to allow non-restricted posts
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
        isRecurring: document.getElementById('post-repeat-type').value === 'weekly',
    };

    if (postCreationData.mainType === 'event') {
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
        createPostError.textContent = 'Failed to save post.';
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

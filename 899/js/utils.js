// js/utils.js

/**
 * This file contains pure utility functions that handle data formatting,
 * calculations, and other reusable logic that doesn't depend on the DOM or Firebase.
 */

/**
 * Formats a date object into a "time ago" string (e.g., "5m ago").
 * @param {Date} date - The date to format.
 * @returns {string} The formatted time ago string.
 */
export function formatTimeAgo(date) {
    if (!date) return '';
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `${Math.floor(seconds)}s ago`;
}

/**
 * Formats a date for display on event cards (e.g., "Jul 31 @ 1:30 PM").
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date-time string.
 */
export function formatEventDateTime(date) {
    if (!date || isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' @ ' +
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Formats a duration in milliseconds into a compact string (e.g., "2d 4h").
 * @param {number} ms - The duration in milliseconds.
 * @returns {string} The formatted duration string.
 */
export function formatDuration(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.slice(0, 2).join(' ') || '<1m';
}

/**
 * Determines the current status of an event (upcoming, live, or ended).
 * @param {object} event - The event object from Firestore.
 * @returns {object} An object containing the status and time difference.
 */
export function getEventStatus(event) {
    const now = new Date();
    let startTime = event.startTime?.toDate();
    let endTime = event.endTime?.toDate();

    if (!startTime || !endTime) {
        return { status: 'ended' }; 
    }

    if (event.isRecurring) {
        if (endTime < now) {
            const timeDiff = now.getTime() - endTime.getTime();
            const weeksToAdvance = Math.ceil(timeDiff / (7 * 24 * 60 * 60 * 1000));
            startTime.setDate(startTime.getDate() + weeksToAdvance * 7);
            endTime.setDate(endTime.getDate() + weeksToAdvance * 7);
        }
    }

    if (startTime > now) {
        return { status: 'upcoming', timeDiff: startTime - now };
    } else if (startTime <= now && endTime > now) {
        return { status: 'live', timeDiff: endTime - now };
    } else {
        return { status: 'ended', endedDate: endTime };
    }
}

/**
 * Calculates the next occurrence of a given day of the week and hour.
 * @param {string} dayOfWeek - The target day of the week (0-6).
 * @param {string} hour - The target hour (0-23).
 * @returns {Date} The calculated date object.
 */
export function calculateNextDateTime(dayOfWeek, hour) {
    const targetDay = parseInt(dayOfWeek, 10);
    const targetHour = parseInt(hour, 10);
    const now = new Date();
    
    let resultDate = new Date();
    resultDate.setDate(now.getDate() + (targetDay - now.getDay() + 7) % 7);
    resultDate.setHours(targetHour, 0, 0, 0);

    if (resultDate < now) {
        resultDate.setDate(resultDate.getDate() + 7);
    }
    
    return resultDate;
}

/**
 * Resizes an image file to a maximum width and height while maintaining aspect ratio.
 * @param {File} file - The image file to resize.
 * @param {object} options - Options object with maxWidth and maxHeight.
 * @returns {Promise<Blob>} A promise that resolves with the resized image as a Blob.
 */
export function resizeImage(file, options) {
    const { maxWidth, maxHeight } = options;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round(width * (maxHeight / height));
                        height = maxHeight;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) { resolve(blob); } 
                    else { reject(new Error('Canvas to Blob conversion failed')); }
                }, 'image/jpeg', 0.9);
            };
            img.onerror = (err) => reject(err);
            img.src = event.target.result;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

/**
 * Checks if a user has leadership rank (R4/R5).
 * @param {object} user - The user data object.
 * @returns {boolean} True if the user is a leader.
 */
export function isUserLeader(user) {
    if (!user) return false;
    return user.isAdmin || (user.isVerified && (user.allianceRank === 'R5' || user.allianceRank === 'R4'));
}

/**
 * Checks if a manager user has permission to manage a target user.
 * @param {object} manager - The user performing the action.
 * @param {object} targetUser - The user being managed.
 * @returns {boolean} True if the manager has permission.
 */
export function canManageUser(manager, targetUser) {
    if (!manager || !targetUser) return false;
    if (manager.isAdmin) return true;
    if (manager.alliance !== targetUser.alliance) return false;
    if (manager.allianceRank === 'R5' && ['R4', 'R3', 'R2', 'R1'].includes(targetUser.allianceRank)) return true;
    if (manager.allianceRank === 'R4' && ['R3', 'R2', 'R1'].includes(targetUser.allianceRank)) return true;
    return false;
}

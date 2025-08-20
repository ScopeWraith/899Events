// code/js/utils.js

/**
 * This module contains utility functions used across the application,
 * such as date formatting, image resizing, and calculating event statuses.
 * This keeps the main logic files cleaner and more focused.
 */

/**
 * Determines if the current user has permission to delete a specific message.
 * @param {object} currentUser The data object for the currently logged-in user.
 * @param {object} messageAuthor The data object for the author of the message.
 * @returns {boolean} True if the user can delete the message, otherwise false.
 */
export function canDeleteMessage(currentUser, messageAuthor) {
    if (!currentUser || !messageAuthor) return false;
    // An admin can delete any message.
    if (currentUser.isAdmin) return true;
    // A user can delete their own message.
    if (currentUser.uid === messageAuthor.uid) return true;
    // A leader can delete a message from someone in their own alliance.
    if (isUserLeader(currentUser) && currentUser.alliance === messageAuthor.alliance) return true;
    return false;
}

/**
 * Formats a JavaScript Date object into a human-readable "time ago" string (e.g., "5m ago").
 * @param {Date} date The date to format.
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
 * Formats a Date object into a more detailed date and time string.
 * Example format: "Thu, Jul 31 @ 1:30 PM"
 * @param {Date} date The date to format.
 * @returns {string} The formatted date-time string.
 */
export function formatEventDateTime(date) {
    if (!date || isNaN(date.getTime())) return 'N/A';
    // Format: Thu, Jul 31 @ 1:30 PM
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' @ ' +
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Formats a duration in milliseconds into a compact string (e.g., "2d 4h", "15m").
 * @param {number} ms The duration in milliseconds.
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
 * @typedef {Object} EventStatus
 * @property {('upcoming'|'live'|'ended')} status - The current status of the event.
 * @property {number} [timeDiff] - The time difference in ms until the event starts or ends.
 * @property {Date} startTime - The calculated start time of the event.
 * @property {Date} [endTime] - The calculated end time of the event (if live).
 * @property {Date} [endedDate] - The date the event ended (if ended).
 */

/**
 * Calculates the current status of an event (upcoming, live, or ended).
 * Handles recurring events by advancing their dates to the next occurrence if they are in the past.
 * @param {object} event The event object from Firestore.
 * @returns {EventStatus} An object describing the event's current status.
 */
export function getEventStatus(event) {
    const now = new Date();
    let startTime = event.startTime?.toDate();
    let endTime = event.endTime?.toDate();

    if (!startTime || !endTime) {
        return { status: 'ended', startTime: null }; 
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
        return { status: 'upcoming', timeDiff: startTime - now, startTime: startTime };
    } else if (startTime <= now && endTime > now) {
        return { status: 'live', timeDiff: endTime - now, startTime: startTime, endTime: endTime };
    } else {
        return { status: 'ended', endedDate: endTime, startTime: startTime };
    }
}

/**
 * Calculates the next occurrence of a specific day and hour from the current time.
 * @param {string} dayOfWeek The target day of the week (0=Sunday, 6=Saturday).
 * @param {string} hour The target hour of the day (0-23).
 * @returns {Date} The calculated Date object for the next occurrence.
 */
export function calculateNextDateTime(dayOfWeek, hour) {
    const targetDay = parseInt(dayOfWeek, 10);
    const targetHour = parseInt(hour, 10);
    const now = new Date();
    
    let resultDate = new Date();
    
    // Set the time for the target day
    resultDate.setHours(targetHour, 0, 0, 0);

    // --- START: NEW LOGIC ---
    const currentDay = now.getDay();
    let dayDifference = targetDay - currentDay;

    // If the target day is in the past (e.g., today is Thurs[4] and target is Tues[2]),
    // this will be negative. Add 7 to move to next week.
    if (dayDifference < 0) {
        dayDifference += 7;
    } 
    // If it's the same day, but the target hour is in the past, also move to next week.
    else if (dayDifference === 0 && targetHour < now.getHours()) {
        dayDifference += 7;
    }
    
    resultDate.setDate(now.getDate() + dayDifference);
    // --- END: NEW LOGIC ---

    return resultDate;
}

/**
 * Resizes an image file to fit within specified maximum dimensions while maintaining aspect ratio.
 * @param {File} file The image file to resize.
 * @param {object} options An object with resizing options.
 * @param {number} options.maxWidth The maximum width of the resized image.
 * @param {number} options.maxHeight The maximum height of the resized image.
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
 * Checks if a 'manager' user has permission to manage a 'targetUser'.
 * @param {object} manager The user data object for the potential manager.
 * @param {object} targetUser The user data object for the user to be managed.
 * @returns {boolean} True if the manager has permission, otherwise false.
 */
export function canManageUser(manager, targetUser) {
    if (!manager || !targetUser) return false;
    // Admins can manage any user, regardless of alliance or rank
    if (manager.isAdmin) return true;
    // User cannot manage themselves
    if (manager.uid === targetUser.uid) return false;
    // Ranks R5 and R4 can manage lower ranks in their own alliance
    if (manager.alliance !== targetUser.alliance) return false;
    if (manager.allianceRank === 'R5' && ['R4', 'R3', 'R2', 'R1'].includes(targetUser.allianceRank)) return true;
    if (manager.allianceRank === 'R4' && ['R3', 'R2', 'R1'].includes(targetUser.allianceRank)) return true;
    return false;
}

/**
 * Checks if a user is considered a "leader" (Admin, R5, or R4).
 * @param {object} user The user data object.
 * @returns {boolean} True if the user is a leader, otherwise false.
 */
export function isUserLeader(user) {
    if (!user) return false;
    return user.isAdmin || (user.isVerified && (user.allianceRank === 'R5' || user.allianceRank === 'R4'));
}

/**
 * Formats a Date object into a simple time string (e.g., "1:30 PM").
 * @param {Date} date The date to format.
 * @returns {string} The formatted time string.
 */
export function formatMessageTimestamp(date) {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Scans a string of text for URLs and wraps them in anchor `<a>` tags.
 * @param {string} text The text to process.
 * @returns {string} The text with URLs converted to clickable links.
 */
export function autoLinkText(text) {
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function(url) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${url}</a>`;
    });
}

/**
 * @typedef {Object} BorderStyle
 * @property {string} className - The CSS class(es) to apply for the border.
 * @property {string} style - The inline CSS style string to apply.
 */

/**
 * Determines the appropriate CSS class and inline style for a player's avatar border.
 * The border style depends on the player's chosen skin, rank, or alliance.
 * @param {object} player The player's data object.
 * @param {object} allianceData The data object for the player's alliance.
 * @returns {BorderStyle} An object containing the className and style for the border.
 */
export function getAvatarBorderClass(player, allianceData) {
    if (!player) {
        return { className: 'rank-border-r1', style: '' };
    }

    const skinType = player.avatarBorderSkin || 'rank';

    // --- Priority 1: Handle explicit skin selections ---
    if (skinType === 'alliance') {
        if (allianceData?.primaryColor) {
            return {
                className: 'alliance-border',
                style: `border-color: ${allianceData.primaryColor}; box-shadow: 0 0 10px -2px ${allianceData.primaryColor};`
            };
        }
    } else if (skinType === 'admin') {
        if (player.isAdmin) {
            return { className: 'rank-border-admin', style: '' };
        }
    }

    // --- Priority 2 (Fallback / 'rank' skin): Apply the default rank-based system ---
    // The incorrect isAdmin check has been removed from here.
    
    const rank = player.allianceRank ? player.allianceRank.toLowerCase() : 'r1';
    return { className: `rank-border-${rank}`, style: '' };
}

/**
 * Determines the appropriate CSS class and inline style for a player's chat bubble border.
 * The border style depends on the player's chosen skin, rank, or alliance.
 * @param {object} player The player's data object.
 * @param {object} allianceData The data object for the player's alliance.
 * @returns {BorderStyle} An object containing the className and style for the border.
 */
export function getChatBubbleBorderClass(player, allianceData) {
    if (!player) {
        return { className: 'chat-bubble-border-r1', style: '' };
    }

    const skinType = player.chatBubbleBorderSkin || 'rank';

    // --- Priority 1: Handle explicit skin selections ---
    if (skinType === 'alliance') {
        if (allianceData?.primaryColor) {
            return {
                className: 'chat-bubble-border-alliance',
                style: `border-color: ${allianceData.primaryColor};`
            };
        }
    } else if (skinType === 'admin') {
        if (player.isAdmin) {
            return { className: 'chat-bubble-border-admin', style: '' };
        }
    }

    // --- Priority 2 (Fallback / 'rank' skin): Apply the default rank-based system ---
    // The incorrect isAdmin check has been removed from here.
    
    const rank = player.allianceRank ? player.allianceRank.toLowerCase() : 'r1';
    return { className: `chat-bubble-border-${rank}`, style: '' };
}
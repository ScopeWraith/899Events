// code/js/utils.js

/**
 * This module contains utility functions used across the application,
 * such as date formatting, image resizing, and calculating event statuses.
 * This keeps the main logic files cleaner and more focused.
 */

/**
 * Formats a JavaScript Date object into a human-readable "time ago" string.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted string (e.g., "5m ago", "2d ago").
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
 * Formats a Date object into a string for event display (e.g., "Jul 31 @ 1:30 PM").
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date and time string, or 'N/A' if the date is invalid.
 */
export function formatEventDateTime(date) {
    if (!date || isNaN(date.getTime())) return 'N/A';
    // Format: Thu, Jul 31 @ 1:30 PM
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' @ ' +
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Converts milliseconds into a compact duration string (e.g., "2d 4h", "15m").
 * @param {number} ms - The duration in milliseconds.
 * @returns {string} The formatted duration string. Returns '<1m' for durations less than a minute.
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
 * @property {'upcoming' | 'live' | 'ended'} status - The current status of the event.
 * @property {number} [timeDiff] - The time difference in ms to the start/end of the event.
 * @property {Date | null} startTime - The calculated start time of the event.
 * @property {Date} [endTime] - The calculated end time (if live).
 * @property {Date} [endedDate] - The date the event ended (if ended).
 */

/**
 * Calculates the current status of an event, accounting for recurring events.
 * If an event is recurring, its start/end times are projected into the future.
 * @param {Object} event - The event post object from Firestore. It should have `startTime`, `endTime`, and `isRecurring` properties.
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
 * Calculates the next occurrence of a specific day and hour from the current moment.
 * @param {string} dayOfWeek - The target day of the week (0=Sunday, 6=Saturday).
 * @param {string} hour - The target hour of the day (0-23).
 * @returns {Date} The calculated Date object for the next occurrence.
 */
export function calculateNextDateTime(dayOfWeek, hour) {
    const targetDay = parseInt(dayOfWeek, 10);
    const targetHour = parseInt(hour, 10);
    const now = new Date();

    let resultDate = new Date();

    resultDate.setHours(targetHour, 0, 0, 0);

    const currentDay = now.getDay();
    let dayDifference = targetDay - currentDay;

    if (dayDifference < 0) {
        dayDifference += 7;
    }
    else if (dayDifference === 0 && targetHour < now.getHours()) {
        dayDifference += 7;
    }

    resultDate.setDate(now.getDate() + dayDifference);

    return resultDate;
}

/**
 * Resizes an image file to a maximum width and height while maintaining aspect ratio, returning a Blob.
 * @param {File} file - The image file to resize.
 * @param {{maxWidth: number, maxHeight: number}} options - The maximum dimensions for the output image.
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
 * Checks if a user has the authority to manage another user based on rank and alliance.
 * @param {Object} manager - The user object of the person performing the action.
 * @param {Object} targetUser - The user object of the person being managed.
 * @returns {boolean} True if the manager can manage the target user.
 */
export function canManageUser(manager, targetUser) {
    if (!manager || !targetUser) return false;
    if (manager.isAdmin) return true;
    if (manager.uid === targetUser.uid) return false;
    if (manager.alliance !== targetUser.alliance) return false;
    if (manager.allianceRank === 'R5' && ['R4', 'R3', 'R2', 'R1'].includes(targetUser.allianceRank)) return true;
    if (manager.allianceRank === 'R4' && ['R3', 'R2', 'R1'].includes(targetUser.allianceRank)) return true;
    return false;
}

/**
 * Checks if a user is considered a 'leader' (Admin, R5, or R4).
 * @param {Object} user - The user object to check.
 * @returns {boolean} True if the user is a leader.
 */
export function isUserLeader(user) {
    if (!user) return false;
    return user.isAdmin || (user.isVerified && (user.allianceRank === 'R5' || user.allianceRank === 'R4'));
}

/**
 * Formats a Date object into a simple time string (e.g., "1:30 PM").
 * @param {Date} date - The date to format.
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
 * Scans a string for URLs and wraps them in HTML anchor tags.
 * @param {string} text - The input text.
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
 * @property {string} className - The CSS class for the border.
 * @property {string} style - The inline CSS style string, if any.
 */

/**
 * Determines the appropriate CSS class and style for a player's avatar border based on their selected skin and rank.
 * @param {Object} player - The player data object.
 * @param {Object | null} allianceData - The data for the player's alliance, if available.
 * @returns {BorderStyle} An object containing the className and inline style for the border.
 */
export function getAvatarBorderClass(player, allianceData) {
    if (!player) {
        return { className: 'rank-border-r1', style: '' };
    }

    const skinType = player.avatarBorderSkin || 'rank';

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

    const rank = player.allianceRank ? player.allianceRank.toLowerCase() : 'r1';
    return { className: `rank-border-${rank}`, style: '' };
}

/**
 * Determines the appropriate CSS class and style for a player's chat bubble border based on their selected skin and rank.
 * @param {Object} player - The player data object.
 * @param {Object | null} allianceData - The data for the player's alliance, if available.
 * @returns {BorderStyle} An object containing the className and inline style for the border.
 */
export function getChatBubbleBorderClass(player, allianceData) {
    if (!player) {
        return { className: 'chat-bubble-border-r1', style: '' };
    }

    const skinType = player.chatBubbleBorderSkin || 'rank';

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

    const rank = player.allianceRank ? player.allianceRank.toLowerCase() : 'r1';
    return { className: `chat-bubble-border-${rank}`, style: '' };
}

/**
 * Checks if a user is allowed to delete a specific chat message.
 * @param {Object} currentUser - The user attempting the deletion.
 * @param {Object} messageAuthor - The author of the message.
 * @returns {boolean} True if the user can delete the message.
 */
export function canDeleteMessage(currentUser, messageAuthor) {
    if (!currentUser || !messageAuthor) return false;
    // Admins can delete any message
    if (currentUser.isAdmin) return true;
    // Users can delete their own messages
    if (currentUser.uid === messageAuthor.uid) return true;
    // Alliance leaders (R5, R4) can delete messages from members of their own alliance
    if (isUserLeader(currentUser) && currentUser.alliance === messageAuthor.alliance) {
        return true;
    }
    return false;
}
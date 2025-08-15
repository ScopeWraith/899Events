// code/js/utils.js

/**
 * This module contains utility functions used across the application,
 * such as date formatting, image resizing, and calculating event statuses.
 * This keeps the main logic files cleaner and more focused.
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

export function formatEventDateTime(date) {
    if (!date || isNaN(date.getTime())) return 'N/A';
    // Format: Thu, Jul 31 @ 1:30 PM
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' @ ' +
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

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

export function isUserLeader(user) {
    if (!user) return false;
    return user.isAdmin || (user.isVerified && (user.allianceRank === 'R5' || user.allianceRank === 'R4'));
}

export function formatMessageTimestamp(date) {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

export function autoLinkText(text) {
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function(url) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${url}</a>`;
    });
}

export function getAvatarBorderClass(player, allianceData, customBorders) {
    if (!player) return { className: 'rank-border-r1', style: '' };

    const skinId = player.avatarBorderSkin || 'rank';

    const customBorder = customBorders && customBorders.find(b => b.id === skinId);
    if (customBorder) {
        return { className: 'custom-border', style: applyCustomBorderStyle(customBorder.css) };
    }
    
    if (skinId === 'alliance' && allianceData?.primaryColor) {
        return {
            className: 'alliance-border',
            style: `background: ${allianceData.primaryColor}; box-shadow: 0 0 10px -2px ${allianceData.primaryColor};`
        };
    }
    
    if (skinId === 'admin' && player.isAdmin) {
        return { className: 'rank-border-admin', style: '' };
    }
    
    // Default to rank-based border
    if (player.isAdmin && skinId === 'rank') {
        return { className: 'rank-border-admin', style: '' };
    }
    
    const rank = player.allianceRank ? player.allianceRank.toLowerCase() : 'r1';
    return { className: `rank-border-${rank}`, style: '' };
}


// code/js/utils.js

export function applyCustomBorderStyle(css) {
    if (!css) return '';

    // --- MAIN BORDER STYLES (for the element itself) ---
    const colors = [css.borderColor1, css.borderColor2, css.borderColor3, css.borderColor4, css.borderColor5].filter((c, i) => i < 2 || css[`enableColor${i + 1}`]);
    const gradientMode = css.gradientMode || 'linear-gradient';
    let gradientString;
    if (gradientMode === 'radial-gradient') {
        gradientString = `radial-gradient(circle, ${colors.join(', ')})`;
    } else {
        gradientString = `${gradientMode}(from ${css.gradientAngle}deg, ${colors.join(', ')})`;
    }

    let borderStyle = css.borderStyle === 'marching-ants' ? 'dashed' : css.borderStyle;
    
    let mainAnimationStyle = '';
    if (css.animationName && css.animationName !== 'none' && css.animationName !== 'shimmer' && css.animationName !== 'glow') {
        mainAnimationStyle = `animation: ${css.animationName} ${css.animationDuration}s infinite ${css.animationDirection};`;
    }
     if (css.borderStyle === 'marching-ants') {
        mainAnimationStyle += ` animation: marching-ants 10s linear infinite;`;
    }
    if (css.animateGradient) {
        mainAnimationStyle += ' animation: gradient-shift 5s ease infinite; background-size: 200% 200%;';
    }

    // --- GLOW STYLES (for the ::before pseudo-element) ---
    // Use a conic-gradient for the border glow image
    const glowGradient = `conic-gradient(from ${css.glowAngle}deg, ${css.boxShadowColor}, ${css.boxShadowColor2}, ${css.boxShadowColor})`;
    let glowAnimationStyle = '';
    if (css.animationName === 'glow') {
         glowAnimationStyle = `animation: glow ${css.animationDuration}s infinite alternate;`;
    } else if (css.animationName === 'shimmer') {
        glowAnimationStyle = `animation: shimmer-spin 4s linear infinite;`;
    }


    // Combine all styles into a single string for the style attribute
    return `
        --border-width: ${css.borderWidth}px;
        --border-style: ${borderStyle};
        --border-image: ${gradientString};
        --scale: ${css.borderSize};
        --main-animation: ${mainAnimationStyle};
        
        --glow-image: ${glowGradient};
        --glow-blur: ${css.boxShadowBlur}px;
        --glow-animation: ${glowAnimationStyle};
    `;
}
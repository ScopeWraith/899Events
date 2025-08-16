// code/js/utils.js

/**
 * This module contains utility functions used across the application.
 */

// ... (other functions like formatTimeAgo, canManageUser, etc. remain unchanged)
export function canDeleteMessage(currentUser, messageAuthor) {
    if (!currentUser || !messageAuthor) return false;
    if (currentUser.isAdmin) return true;
    if (currentUser.uid === messageAuthor.uid) return true;
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
    resultDate.setHours(targetHour, 0, 0, 0);

    const currentDay = now.getDay();
    let dayDifference = targetDay - currentDay;

    if (dayDifference < 0 || (dayDifference === 0 && targetHour < now.getHours())) {
        dayDifference += 7;
    }
    
    resultDate.setDate(now.getDate() + dayDifference);
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
    if (manager.isAdmin) return true;
    if (manager.uid === targetUser.uid) return false;
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
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function autoLinkText(text) {
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${url}</a>`);
}

export function getAvatarBorderClass(player, allianceData, customBorders) {
    if (!player) return { className: 'rank-border-r1', style: '' };
    const skinId = player.avatarBorderSkin || 'rank';
    const customBorder = customBorders && customBorders.find(b => b.id === skinId);
    if (customBorder) {
        const styles = applyCustomBorderStyle(customBorder.css);
        return { className: 'custom-border', style: styles.main.style };
    }
    if (skinId === 'alliance' && allianceData?.primaryColor) {
        return { className: 'alliance-border', style: `background: ${allianceData.primaryColor}; box-shadow: 0 0 10px -2px ${allianceData.primaryColor};` };
    }
    if (skinId === 'admin' && player.isAdmin) {
        return { className: 'rank-border-admin', style: '' };
    }
    if (player.isAdmin && skinId === 'rank') {
        return { className: 'rank-border-admin', style: '' };
    }
    const rank = player.allianceRank ? player.allianceRank.toLowerCase() : 'r1';
    return { className: `rank-border-${rank}`, style: '' };
}

/**
 * ===================================================================================
 * BORDER STYLE GENERATOR - FINAL VERSION
 * ===================================================================================
 */
export function applyCustomBorderStyle(css) {
    if (!css) return { main: { style: '' }, before: { style: '' }, after: { style: '' } };

    // Parse widths, providing a default of 0 if not present
    const width1 = parseInt(css.borderWidth1 || 0, 10);
    const width2 = parseInt(css.borderWidth2 || 0, 10);
    const width3 = parseInt(css.borderWidth3 || 0, 10);

    // Calculate the total spread for each shadow
    const spread1 = width1;
    const spread2 = width1 + width2;
    const spread3 = width1 + width2 + width3;

    const shadows = [];
    if (spread1 > 0) shadows.push(`0 0 0 ${spread1}px ${css.borderColor1 || '#00BFFF'}`);
    if (spread2 > spread1) shadows.push(`0 0 0 ${spread2}px ${css.borderColor2 || '#FFFFFF'}`);
    if (spread3 > spread2) shadows.push(`0 0 0 ${spread3}px ${css.borderColor3 || '#F87171'}`);

    const mainStyles = {
        '--scale': '1.15',
        'background': 'transparent', // The background is no longer needed
        'border': 'none', // We use box-shadows instead of a real border
        'box-shadow': shadows.join(', ')
    };
    
    const toCssText = (styleObj) => Object.entries(styleObj).map(([key, value]) => `${key}: ${value};`).join(' ');

    return {
        main: { style: toCssText(mainStyles) },
        before: { style: '' },
        after: { style: '' }
    };
}
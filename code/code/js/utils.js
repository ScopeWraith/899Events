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

    // If it's a custom border, generate a simplified style for it
    if (customBorder && customBorder.css?.layers) {
        const layer1 = customBorder.css.layers['1'];
        if (layer1 && layer1.enabled && parseInt(layer1.thickness, 10) > 0) {
            const thickness = parseInt(layer1.thickness, 10);
            const scale = 1 + (thickness * 2 * 0.01); // Same scale logic as editor
            return { 
                className: 'custom-border', 
                style: `background: ${layer1.color}; transform: scale(${scale});` 
            };
        }
    }

    // Fallback to original rank/alliance borders
    if (skinId === 'alliance' && allianceData?.primaryColor) {
        return { className: 'alliance-border', style: `background: ${allianceData.primaryColor}; box-shadow: 0 0 10px -2px ${allianceData.primaryColor};` };
    }
    if (player.isAdmin && (skinId === 'admin' || skinId === 'rank')) {
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
function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function applyCustomBorderStyle(css) {
    if (!css || !css.layers) return {};

    const styles = {};
    const BASE_SCALE_INCREMENT = 0.01;

    const t1 = css.layers['1']?.enabled ? parseInt(css.layers['1'].thickness, 10) : 0;
    const t2 = css.layers['2']?.enabled ? parseInt(css.layers['2'].thickness, 10) : 0;
    const t3 = css.layers['3']?.enabled ? parseInt(css.layers['3'].thickness, 10) : 0;

    // Layer 1
    if (t1 > 0) {
        const scale1 = 1 + (t1 * 2 * BASE_SCALE_INCREMENT);
        styles.layer1 = {
            'background': hexToRgba(css.layers['1'].color, css.layers['1'].opacity),
            'transform': `scale(${scale1}) translateZ(0)`,
            'z-index': 3
        };
    } else {
        styles.layer1 = { 'transform': 'scale(0) translateZ(0)' };
    }

    // Layer 2
    if (t2 > 0) {
        const totalThickness2 = t1 + t2;
        const scale2 = 1 + (totalThickness2 * 2 * BASE_SCALE_INCREMENT);
        styles.layer2 = {
            'background': hexToRgba(css.layers['2'].color, css.layers['2'].opacity),
            'transform': `scale(${scale2}) translateZ(0)`,
            'z-index': 2
        };
    } else {
        styles.layer2 = { 'transform': 'scale(0) translateZ(0)' };
    }

    // Layer 3
    if (t3 > 0) {
        const totalThickness3 = t1 + t2 + t3;
        const scale3 = 1 + (totalThickness3 * 2 * BASE_SCALE_INCREMENT);
        styles.layer3 = {
            'background': hexToRgba(css.layers['3'].color, css.layers['3'].opacity),
            'transform': `scale(${scale3}) translateZ(0)`,
            'z-index': 1
        };
    } else {
        styles.layer3 = { 'transform': 'scale(0) translateZ(0)' };
    }

    return styles;
}
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

export function getAvatarBorderHTML(player, allianceData, customBorders) {
    if (!player) return `<div class="avatar-border rank-border-r1"></div>`;
    
    const skinId = player.avatarBorderSkin || 'rank';
    const customBorder = customBorders && customBorders.find(b => b.id === skinId);

    // --- RENDER NEW CUSTOM BORDERS ---
    if (customBorder && customBorder.css?.layers) {
        const styles = applyCustomBorderStyle(customBorder.css);
        let layersHTML = '';
        for (let i = 3; i >= 1; i--) { // Render in reverse order for correct stacking in the DOM
            const layerStyle = styles[`layer${i}`];
            if (layerStyle && layerStyle.transform !== 'scale(0) translateZ(0)') {
                const styleString = Object.entries(layerStyle).map(([k, v]) => `${k}:${v};`).join('');
                layersHTML += `<div class="border-layer" style="${styleString}"></div>`;
            }
        }
        return layersHTML;
    }

    // --- RENDER LEGACY BORDERS (Fallback) ---
    let borderClass = '', borderStyle = '';
    if (skinId === 'alliance' && allianceData?.primaryColor) {
        borderClass = 'alliance-border';
        borderStyle = `background: ${allianceData.primaryColor}; box-shadow: 0 0 10px -2px ${allianceData.primaryColor};`;
    } else if (player.isAdmin && (skinId === 'admin' || skinId === 'rank')) {
        borderClass = 'rank-border-admin';
    } else {
        const rank = player.allianceRank ? player.allianceRank.toLowerCase() : 'r1';
        borderClass = `rank-border-${rank}`;
    }
    return `<div class="avatar-border ${borderClass}" style="${borderStyle}"></div>`;
}

/**
 * ===================================================================================
 * BORDER STYLE GENERATOR - FINAL VERSION
 * ===================================================================================
 */
// Helper function to convert HEX color and alpha to RGBA string
function hexToRgba(hex, alpha = 1) {
    if (!hex) return `rgba(0,0,0,${alpha})`;
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

    for (let i = 1; i <= 3; i++) {
        const layerData = css.layers[String(i)];
        const key = `layer${i}`;
        
        let thickness = (i === 1) ? t1 : ((i === 2) ? t1 + t2 : t1 + t2 + t3);

        if (layerData?.enabled && parseInt(layerData.thickness, 10) > 0) {
            const scale = 1 + (thickness * 2 * BASE_SCALE_INCREMENT);
            const shadows = [];

            // Inner Glow
            if (layerData.innerGlow?.enabled) {
                const ig = layerData.innerGlow;
                const color = hexToRgba(ig.color, ig.opacity);
                const inset = ig.reverse ? '' : 'inset';
                shadows.push(`${inset} 0 0 ${ig.blur}px ${ig.spread}px ${color}`);
            }
            // Outer Glow
            if (layerData.outerGlow?.enabled) {
                const og = layerData.outerGlow;
                const color = hexToRgba(og.color, og.opacity);
                const inset = og.reverse ? 'inset' : '';
                shadows.push(`${inset} 0 0 ${og.blur}px ${og.spread}px ${color}`);
            }

            styles[key] = {
                'background': hexToRgba(layerData.color, layerData.opacity),
                'transform': `scale(${scale}) translateZ(0)`,
                'z-index': 3 - (i - 1),
                'box-shadow': shadows.join(', ')
            };
        } else {
            styles[key] = { 'transform': 'scale(0) translateZ(0)' };
        }
    }
    return styles;
}
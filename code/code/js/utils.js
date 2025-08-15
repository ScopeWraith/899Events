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
        const styles = applyCustomBorderStyle(customBorder.css);
        // For legacy usage, we just return the main style block
        return { 
            className: `custom-border ${styles.textureClass}`, 
            style: styles.main.style // Use the main style block
        };
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


/**
 * ===================================================================================
 * REVAMPED BORDER STYLE GENERATOR
 * ===================================================================================
 * This function is the new engine for creating complex, multi-layered border styles.
 * It returns an object with separate style blocks for the main element, and its
 * ::before and ::after pseudo-elements, allowing for sophisticated visual effects.
 */
export function applyCustomBorderStyle(css) {
    if (!css) return { main: { style: '' }, before: { style: '' }, after: { style: '' }, particles: [], textEffect: 'none' };

    const mainStyles = {};
    const beforeStyles = {};
    const afterStyles = {};
    let particles = [];

    // --- Sizing & Core Shape ---
    mainStyles['--scale'] = css.borderSize;
    mainStyles['--border-width'] = `${css.borderWidth}px`;
    mainStyles['border-style'] = css.borderStyle === 'marching-ants' ? 'dashed' : css.borderStyle;

    // --- Main Gradient Fill ---
    const colors = [css.borderColor1, css.borderColor2, css.borderColor3, css.borderColor4, css.borderColor5]
                   .filter((c, i) => i < 2 || css[`enableColor${i + 1}`]);
    const gradientMode = css.gradientMode || 'linear-gradient';
    let gradientString = `${gradientMode}(${gradientMode === 'conic-gradient' ? `from ${css.gradientAngle}deg, ` : ''}${colors.join(', ')})`;
    if (gradientMode === 'radial-gradient') {
        gradientString = `radial-gradient(circle, ${colors.join(', ')})`;
    }
    mainStyles['background'] = gradientString;
    mainStyles['background-size'] = css.animateGradient ? '200% 200%' : 'auto';

    // --- Animations ---
    let mainAnimation = [];
    if (css.animateGradient) {
        mainAnimation.push(`gradient-shift 5s ease infinite`);
    }

    // --- Inner Shadow ---
    mainStyles['box-shadow'] = `inset 0 0 10px 2px ${css.innerGlowColor || 'transparent'}`;

    // --- TEXTURE (uses ::after pseudo-element) ---
    if (css.borderTexture !== 'none') {
        afterStyles['content'] = "''";
        afterStyles['position'] = 'absolute';
        afterStyles['inset'] = '0';
        afterStyles['border-radius'] = '50%';
        afterStyles['background-size'] = 'cover';
        afterStyles['mix-blend-mode'] = 'overlay';
        afterStyles['pointer-events'] = 'none';
        afterStyles['z-index'] = '1';
        switch(css.borderTexture) {
            case 'electric': 
                afterStyles['background-image'] = `url('https://www.transparenttextures.com/patterns/simple-dashed.png')`;
                afterStyles['opacity'] = '0.1';
                break;
            case 'cracks': 
                afterStyles['background-image'] = `url('https://www.transparenttextures.com/patterns/worn-dots.png')`;
                afterStyles['opacity'] = '0.2';
                break;
            case 'lines':
                afterStyles['background-image'] = `url('https://www.transparenttextures.com/patterns/vertical-lines.png')`;
                afterStyles['opacity'] = '0.05';
                break;
        }
    }

    // --- COMPLEX ANIMATIONS & GLOW (uses ::before pseudo-element) ---
    const glowGradient = `conic-gradient(from ${css.glowAngle}deg, ${css.boxShadowColor}, ${css.boxShadowColor2}, ${css.boxShadowColor})`;

    beforeStyles['content'] = "''";
    beforeStyles['position'] = 'absolute';
    beforeStyles['z-index'] = '-1';
    beforeStyles['border-radius'] = '50%';

    let beforeAnimation = [];
    
    switch (css.animationName) {
        case 'glow':
            beforeStyles['inset'] = `-${css.boxShadowSpread}px`;
            beforeStyles['background'] = glowGradient;
            beforeStyles['filter'] = `blur(${css.boxShadowBlur}px)`;
            beforeAnimation.push(`pulse ${css.animationDuration}s infinite alternate`);
            break;
        case 'shimmer':
            beforeStyles['inset'] = '0';
            beforeStyles['background'] = glowGradient;
            beforeStyles['background-size'] = '200% 200%';
            beforeAnimation.push(`shimmer-spin ${css.animationDuration}s linear infinite`);
            break;
        case 'cosmic':
             beforeStyles['inset'] = `-${css.boxShadowSpread}px`;
             beforeStyles['background'] = glowGradient;
             beforeAnimation.push(`cosmic-glow ${css.animationDuration}s infinite`);
            break;
        case 'particles':
            // Particles are handled separately below, not with pseudo-elements
            for (let i = 0; i < 20; i++) {
                const duration = 2 + Math.random() * 3;
                const delay = Math.random() * 5;
                const size = 1 + Math.random() * 2;
                const radius = `calc(50% + ${css.borderWidth / 2}px)`;
                particles.push({
                    style: `
                        width: ${size}px;
                        height: ${size}px;
                        --radius: ${radius};
                        animation: particle-flow ${duration}s linear ${delay}s infinite;
                    `
                });
            }
            break;
        default:
             if (css.animationName !== 'none') {
                mainAnimation.push(`${css.animationName} ${css.animationDuration}s infinite ${css.animationDirection}`);
            }
    }

    mainStyles['animation'] = mainAnimation.join(', ') || 'none';
    beforeStyles['animation'] = beforeAnimation.join(', ') || 'none';
    
    // Convert style objects to CSS text
    const toCssText = (styleObj) => Object.entries(styleObj).map(([key, value]) => `${key}: ${value};`).join(' ');

    return {
        main: { style: toCssText(mainStyles) },
        before: { style: toCssText(beforeStyles) },
        after: { style: toCssText(afterStyles) },
        particles: particles,
        textEffect: css.textEffect || 'none'
    };
}
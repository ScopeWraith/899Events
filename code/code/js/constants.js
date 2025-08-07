// code/js/constants.js

/**
 * This file exports constants used throughout the application,
 * such as alliance names, ranks, post types, and styling information.
 * This centralization makes it easy to update these values in one place.
 */
export const RANK_STYLES = {
    ADMIN: { color: '#F87171', shadow: 'rgba(248, 113, 113, 0.5)' },
    R5:    { color: '#FFD700', shadow: 'rgba(255, 215, 0, 0.5)' },
    R4:    { color: '#9370DB', shadow: 'rgba(147, 112, 219, 0.5)' },
    R3:    { color: '#00BFFF', shadow: 'rgba(0, 191, 255, 0.5)' },
    R2:    { color: '#FFFFFF', shadow: 'rgba(255, 255, 255, 0.5)' },
    R1:    { color: '#8b949e', shadow: 'rgba(139, 148, 158, 0.4)' }
};
export const ALLIANCES = ["THOR", "fAfO", "HeRA", "pHNx", "TroW", "VaLT", "COLD", "Tone", "DoM", "MINI", "MEGA", "Lat1", "WSKT", "ValT", "BRSL", "TCM1", "BLSD", "REI", "wpg1", "SHRK"];

export const ALLIANCE_RANKS = [
    { value: 'R5', text: 'R5 (Leader)'}, { value: 'R4', text: 'R4'}, { value: 'R3', text: 'R3'},
    { value: 'R2', text: 'R2'}, { value: 'R1', text: 'R1 (Member)'},
];

export const ALLIANCE_ROLES = [
    { value: '', text: 'None'}, { value: 'Warlord', text: 'Warlord'}, { value: 'Recruiter', text: 'Recruiter'},
    { value: 'Muse', text: 'Muse'}, { value: 'Butler', text: 'Butler'},
];

export const DAYS_OF_WEEK = [
    { value: '0', text: 'Sunday' }, { value: '1', text: 'Monday' }, { value: '2', text: 'Tuesday' },
    { value: '3', text: 'Wednesday' }, { value: '4', text: 'Thursday' }, { value: '5', text: 'Friday' },
    { value: '6', text: 'Saturday' }
];

export const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => ({
    value: i.toString(),
    text: `${i.toString().padStart(2, '0')}:00`
}));

export const REPEAT_TYPES = [
    { value: 'none', text: 'None' },
    { value: 'weekly', text: 'Weekly' }
];

export const POST_TYPES = {
    // Announcements
    server_announcement: { mainType: 'announcement', subType: 'server', text: 'Server Announcement', isAdminOnly: true, visibility: 'public' },
    leadership_announcement: { mainType: 'announcement', subType: 'leadership', text: 'Leadership Announcement', allowedRanks: ['R5'], visibility: 'public' },
    alliance_announcement: { mainType: 'announcement', subType: 'alliance', text: 'Alliance Announcement', allowedRanks: ['R5', 'R4'], visibility: 'alliance' },
    // Events
    alliance_event: { mainType: 'event', subType: 'alliance', text: 'Alliance Event', allowedRanks: ['R5', 'R4'], isVerifiedRequired: true, visibility: 'alliance' },
    server_event: { mainType: 'event', subType: 'server', text: 'Server Event', isAdminOnly: true, visibility: 'public' },
    seasonal_event: { mainType: 'event', subType: 'seasonal', text: 'Seasonal Event', isAdminOnly: true, visibility: 'public' },
    hot_deals: { mainType: 'event', subType: 'hot_deals', text: 'Hot Deals Event', isAdminOnly: true, visibility: 'public' },
    wanted_boss: { mainType: 'event', subType: 'wanted_boss', text: 'Wanted Boss Event', isAdminOnly: true, visibility: 'public' },
    campaign: { mainType: 'event', subType: 'campaign', text: 'Campaign Event', isAdminOnly: true, visibility: 'public' },
    vs: { mainType: 'event', subType: 'vs', text: 'VS Event', isAdminOnly: true, visibility: 'public' },
};

export const POST_STYLES = {
    server: { color: 'var(--post-color-server)', icon: 'fas fa-server', bgColor: 'rgba(255, 215, 0, 0.1)'},
    seasonal: { color: 'var(--post-color-seasonal)', icon: 'fas fa-snowflake', bgColor: 'rgba(147, 112, 219, 0.1)'},
    leadership: { color: 'var(--post-color-leadership)', icon: 'fas fa-crown', bgColor: 'rgba(192, 192, 192, 0.1)'},
    alliance: { color: 'var(--post-color-alliance)', icon: 'fas fa-shield-alt', bgColor: 'rgba(0, 191, 255, 0.1)'},
    hot_deals: { color: 'var(--post-color-hot_deals)', icon: 'fas fa-fire-alt', bgColor: 'rgba(255, 99, 71, 0.1)'},
    wanted_boss: { color: 'var(--post-color-wanted_boss)', icon: 'fas fa-skull-crossbones', bgColor: 'rgba(220, 20, 60, 0.1)'},
    campaign: { color: 'var(--post-color-campaign)', icon: 'fas fa-map-marked-alt', bgColor: 'rgba(50, 205, 50, 0.1)'},
    vs: { color: 'var(--post-color-vs)', icon: 'fas fa-fist-raised', bgColor: 'rgba(255, 165, 0, 0.1)'},
};

export const ANNOUNCEMENT_EXPIRATION_DAYS = [
    { value: '1', text: '1 Day' },
    { value: '2', text: '2 Days' },
    { value: '3', text: '3 Days' }
];

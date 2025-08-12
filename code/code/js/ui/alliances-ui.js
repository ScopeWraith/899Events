// code/js/ui/alliances-ui.js

import { getState } from '../state.js';

export function renderAlliances(alliances) {
    const container = document.getElementById('alliances-list-container');
    if (!container) return;

    if (alliances.length === 0) {
        container.innerHTML = `<p class="text-center col-span-full py-8 text-gray-400">No alliances have been registered yet.</p>`;
        return;
    }

    container.innerHTML = alliances.map(alliance => createAllianceCard(alliance)).join('');
}

function createAllianceCard(alliance) {
    const { currentUserData } = getState();

    // Default colors if none are set
    const primaryColor = alliance.primaryColor || 'var(--color-primary)';
    const secondaryColor = alliance.secondaryColor || 'var(--color-highlight)';

    const canEdit = currentUserData && currentUserData.isVerified && currentUserData.allianceRank === 'R5' && currentUserData.alliance === alliance.tag;

    let editButtonHTML = '';
    if (canEdit) {
        editButtonHTML = `<button class="alliance-card-edit-btn" data-alliance-tag="${alliance.tag}"><i class="fas fa-cog"></i></button>`;
    }

    return `
        <div class="alliance-card" style="--primary-color: ${primaryColor}; --secondary-color: ${secondaryColor};">
            ${editButtonHTML}
            <div class="alliance-card-header">
                <div class="alliance-card-avatar-wrapper">
                    <img src="${alliance.avatarUrl || 'https://placehold.co/128x128/161B22/FFFFFF?text=?'}" class="alliance-card-avatar" alt="${alliance.name} Avatar">
                </div>
                <div class="alliance-card-title-section">
                    <h2 class="alliance-card-name">${alliance.name}</h2>
                    <p class="alliance-card-tag">[${alliance.tag}]</p>
                </div>
            </div>
            <div class="alliance-card-body">
                <div class="alliance-card-details">
                    <p>${alliance.details || 'No details provided.'}</p>
                </div>
                <div class="alliance-card-roles">
                    <div class="role-item">
                        <span class="role-title">Leader (R5)</span>
                        <span class="role-name">${alliance.r5Name || 'N/A'}</span>
                    </div>
                    <div class="role-item">
                        <span class="role-title">Warlord</span>
                        <span class="role-name">${alliance.warlord || 'N/A'}</span>
                    </div>
                    <div class="role-item">
                        <span class="role-title">Recruiter</span>
                        <span class="role-name">${alliance.recruiter || 'N/A'}</span>
                    </div>
                    <div class="role-item">
                        <span class="role-title">Muse</span>
                        <span class="role-name">${alliance.muse || 'N/A'}</span>
                    </div>
                    <div class="role-item">
                        <span class="role-title">Butler</span>
                        <span class="role-name">${alliance.butler || 'N/A'}</span>
                    </div>
                </div>
            </div>
            <div class="alliance-card-footer">
                <h4 class="recruitment-title">Recruitment Requirements</h4>
                <p class="recruitment-info">${alliance.recruitmentInfo || 'Contact the alliance leadership for details.'}</p>
            </div>
        </div>
    `;
}
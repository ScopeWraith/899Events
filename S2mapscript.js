document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & Data ---

    const alliances = {
        THOR: { name: 'THOR', color: 'rgba(0, 123, 255, 0.7)', cssClass: 'alliance-thor', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {} },
        COLD: { name: 'COLD', color: 'rgba(23, 162, 184, 0.7)', cssClass: 'alliance-cold', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {} },
        ADHD: { name: 'ADHD', color: 'rgba(232, 62, 140, 0.7)', cssClass: 'alliance-adhd', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {} },
        FAFO: { name: 'FAFO', color: 'rgba(220, 53, 69, 0.7)', cssClass: 'alliance-fafo', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {} },
        NEWJ: { name: 'NEWJ', color: 'rgba(255, 193, 7, 0.7)', cssClass: 'alliance-newj', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {} },
        BRSL: { name: 'BRSL', color: 'rgba(40, 167, 69, 0.7)', cssClass: 'alliance-brsl', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {} },
        VALT: { name: 'VALT', color: 'rgba(108, 117, 125, 0.7)', cssClass: 'alliance-valt', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {} },
        HPCE: { name: 'HPCE', color: 'rgba(102, 16, 242, 0.7)', cssClass: 'alliance-hpce', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {} },
    };

    // Define the master list of all possible buff types for consistent display order
    const ALL_BUFF_TYPES = [
        'Coin', 'Food', 'Iron', // Resources first
        'Gathering', 'March Speed', // Speed buffs
        'Construction', 'Research', 'Training', // Building/Unit buffs
        'Healing' // Other buffs
    ];

    // Define segments with fixed assignments that cannot be changed
    const FIXED_ASSIGNMENTS = {
        'G6': 'THOR',
        'F7': 'COLD',
        'G8': 'FAFO',
        'H7': 'ADHD'
    };

    const landDataInput = [
        // (Land data input remains the same as previous versions)
        // Row A
        "A1: Level 1 Dig Site 2% Coin", "A2: Level 1 Village 5% Iron", "A3: Level 1 Dig Site 2% Food", "A4: Level 1 Village 5% Food", "A5: Level 1 Dig Site 2% Iron", "A6: Level 1 Village 5% Iron", "A7: Level 1 Dig Site 2% Coin", "A8: Level 1 Village 5% Food", "A9: Level 1 Dig Site 2% Food", "A10: Level 1 Village 5% Iron", "A11: Level 1 Dig Site 2% Iron", "A12: Level 1 Village 5% Food", "A13: Level 1 Dig Site 2% Coin",
        // Row B
        "B1: Level 1 Village 5% Iron", "B2: Level 2 Dig Site 3% Coin", "B3: Level 2 Town 5% Gathering", "B4: Level 2 Dig Site 3% Food", "B5: Level 2 Town 5% Coin", "B6: Level 2 Dig Site 3% Iron", "B7: Level 2 Town 5% Gathering", "B8: Level 2 Dig Site 3% Coin", "B9: Level 2 Town 5% Coin", "B10: Level 2 Dig Site 3% Food", "B11: Level 2 Town 5% Gathering", "B12: Level 2 Dig Site 3% Iron", "B13: Level 1 Village 5% Food",
        // Row C
        "C1: Level 1 Dig Site 2% Food", "C2: Level 2 Town 5% Gathering", "C3: Level 3 Dig Site 4% Coin", "C4: Level 3 Factory 10% Food", "C5: Level 3 Dig Site 4% Food", "C6: Level 3 Factory 10% Iron", "C7: Level 3 Dig Site 4% Iron", "C8: Level 3 Factory 10% Coin", "C9: Level 3 Dig Site 4% Coin", "C10: Level 3 Factory 10% Food", "C11: Level 3 Dig Site 4% Food", "C12: Level 2 Town 5% Coin", "C13: Level 1 Dig Site 2% Iron",
        // Row D
        "D1: Level 1 Village 5% Iron", "D2: Level 2 Dig Site 3% Food", "D3: Level 3 Factory 10% Iron", "D4: Level 4 Dig Site 6% Coin", "D5: Level 4 Train Station 15% Gathering", "D6: Level 4 Dig Site 6% Food", "D7: Level 4 Train Station 15% Iron", "D8: Level 4 Dig Site 6% Iron", "D9: Level 4 Train Station 15% Coin", "D10: Level 4 Dig Site 6% Coin", "D11: Level 3 Factory 10% Coin", "D12: Level 2 Dig Site 3% Iron", "D13: Level 1 Village 5% Food",
        // Row E
        "E1: Level 1 Dig Site 2% Iron", "E2: Level 2 Town 5% Gathering", "E3: Level 3 Dig Site 4% Food", "E4: Level 4 Train Station 15% Coin", "E5: Level 5 Dig Site 8% Coin", "E6: Level 5 Launch Site 20% Coin", "E7: Level 5 Dig Site 8% Food", "E8: Level 5 Launch Site 20% Gathering", "E9: Level 5 Dig Site 8% Iron", "E10: Level 4 Train Station 15% Food", "E11: Level 3 Dig Site 4% Iron", "E12: Level 2 Town 5% Coin", "E13: Level 1 Dig Site 2% Coin",
        // Row F
        "F1: Level 1 Village 5% Iron", "F2: Level 2 Dig Site 3% Iron", "F3: Level 3 Factory 10% Coin", "F4: Level 4 Dig Site 6% Food", "F5: Level 5 Launch Site 20% Iron", "F6: Level 6 Dig Site 10% Iron", "F7: Level 6 War Palace 10% Healing", "F8: Level 6 Dig Site 10% Coin", "F9: Level 5 Launch Site 20% Food", "F10: Level 4 Dig Site 6% Iron", "F11: Level 3 Factory 10% Food", "F12: Level 2 Dig Site 3% Coin", "F13: Level 1 Village 5% Food",
        // Row G
        "G1: Level 1 Dig Site 2% Coin", "G2: Level 2 Town 5% Gathering", "G3: Level 3 Dig Site 4% Iron", "G4: Level 4 Train Station 15% Food", "G5: Level 5 Dig Site 8% Food", "G6: Level 6 War Palace 20% Construction", "G7: Capitol 10% March Speed", "G8: Level 6 War Palace 5% Training", "G9: Level 5 Dig Site 8% Iron", "G10: Level 4 Train Station 15% Iron", "G11: Level 3 Dig Site 4% Coin", "G12: Level 2 Town 5% Coin", "G13: Level 1 Dig Site 2% Food",
        // Row H
        "H1: Level 1 Village 5% Iron", "H2: Level 2 Dig Site 3% Coin", "H3: Level 3 Factory 10% Food", "H4: Level 4 Dig Site 6% Iron", "H5: Level 5 Launch Site 20% Coin", "H6: Level 6 Dig Site 10% Food", "H7: Level 6 War Palace 20% Research", "H8: Level 6 Dig Site 10% Coin", "H9: Level 5 Launch Site 20% Gathering", "H10: Level 4 Dig Site 6% Coin", "H11: Level 3 Factory 10% Iron", "H12: Level 2 Dig Site 3% Food", "H13: Level 1 Village 5% Food",
        // Row I
        "I1: Level 1 Dig Site 2% Food", "I2: Level 2 Town 5% Gathering", "I3: Level 3 Dig Site 4% Coin", "I4: Level 4 Train Station 15% Iron", "I5: Level 5 Dig Site 8% Food", "I6: Level 5 Launch Site 20% Iron", "I7: Level 5 Dig Site 8% Iron", "I8: Level 5 Launch Site 20% Food", "I9: Level 5 Dig Site 8% Coin", "I10: Level 4 Train Station 15% Coin", "I11: Level 3 Dig Site 4% Food", "I12: Level 2 Town 5% Coin", "I13: Level 1 Dig Site 2% Iron",
        // Row J
        "J1: Level 1 Village 5% Iron", "J2: Level 2 Dig Site 3% Food", "J3: Level 3 Factory 10% Iron", "J4: Level 4 Dig Site 6% Food", "J5: Level 4 Train Station 15% Food", "J6: Level 4 Dig Site 6% Iron", "J7: Level 4 Train Station 15% Gathering", "J8: Level 4 Dig Site 6% Coin", "J9: Level 4 Train Station 15% Gathering", "J10: Level 4 Dig Site 6% Food", "J11: Level 3 Factory 10% Coin", "J12: Level 2 Dig Site 3% Iron", "J13: Level 1 Village 5% Food",
        // Row K
        "K1: Level 1 Dig Site 2% Iron", "K2: Level 2 Town 5% Gathering", "K3: Level 3 Dig Site 4% Food", "K4: Level 3 Factory 10% Food", "K5: Level 3 Dig Site 4% Iron", "K6: Level 3 Factory 10% Iron", "K7: Level 3 Dig Site 4% Coin", "K8: Level 3 Factory 10% Coin", "K9: Level 3 Dig Site 4% Food", "K10: Level 3 Factory 10% Food", "K11: Level 3 Dig Site 4% Iron", "K12: Level 2 Town 5% Coin", "K13: Level 1 Dig Site 2% Coin",
        // Row L
        "L1: Level 1 Village 5% Iron", "L2: Level 2 Dig Site 3% Food", "L3: Level 2 Town 5% Coin", "L4: Level 2 Dig Site 3% Iron", "L5: Level 2 Town 5% Gathering", "L6: Level 2 Dig Site 3% Coin", "L7: Level 2 Town 5% Coin", "L8: Level 2 Dig Site 3% Food", "L9: Level 2 Town 5% Gathering", "L10: Level 2 Dig Site 3% Iron", "L11: Level 2 Town 5% Coin", "L12: Level 2 Dig Site 3% Coin", "L13: Level 1 Village 5% Food",
        // Row M
        "M1: Level 1 Dig Site 2% Food", "M2: Level 1 Village 5% Iron", "M3: Level 1 Dig Site 2% Iron", "M4: Level 1 Village 5% Food", "M5: Level 1 Dig Site 2% Coin", "M6: Level 1 Village 5% Iron", "M7: Level 1 Dig Site 2% Food", "M8: Level 1 Village 5% Food", "M9: Level 1 Dig Site 2% Iron", "M10: Level 1 Village 5% Iron", "M11: Level 1 Dig Site 2% Coin", "M12: Level 1 Village 5% Food", "M13: Level 1 Dig Site 2% Food",
    ];

    const landData = {}; // Use an object keyed by segment ID for easy lookup
    const cityTypes = ['Village', 'Town', 'Factory', 'Train Station', 'Launch Site', 'War Palace', 'Capitol'];

    // *** UPDATED ICON MAPPING ***
    function getIconClass(buffType) {
        switch (buffType.toLowerCase()) {
            case 'coin': return 'fa-solid fa-coins';
            case 'iron': return 'fa-solid fa-mound'; // Changed from industry
            case 'food': return 'fa-solid fa-bread-slice'; // Changed from carrot
            case 'gathering': return 'fa-solid fa-tractor'; // Changed from truck-fast
            case 'healing': return 'fa-solid fa-bandage'; // Changed from heart-pulse
            case 'construction': return 'fa-solid fa-hammer'; // Changed from hammer
            case 'march speed': return 'fa-solid fa-truck-fast'; // Changed from person-running
            case 'training': return 'fa-solid fa-shield-halved'; // Changed from dumbbell
            case 'research': return 'fa-solid fa-flask-vial'; // Changed from flask
            default: return 'fa-solid fa-question-circle';
        }
    }
    // *** END UPDATED ICON MAPPING ***

    // Parse the input strings into structured data
    landDataInput.forEach(item => {
        const parts = item.split(': '); const id = parts[0]; const details = parts[1];
        let level = 0, name = '', buffValue = 0, buffType = '', type = 'Dig Site';
        if (id === 'G7') {
            level = 'N/A'; name = 'Capitol';
            const buffMatch = details.match(/(\d+)% (.*)/); if (buffMatch) { buffValue = parseInt(buffMatch[1], 10); buffType = buffMatch[2]; }
        } else {
            const levelMatch = details.match(/Level (\d+)/); if (levelMatch) level = parseInt(levelMatch[1], 10);
            const nameMatch = details.match(/Level \d+ ([\w\s]+?) (\d+%|\d+$)/) || details.match(/Level \d+ ([\w\s]+)/); if (nameMatch) name = nameMatch[1].trim();
            const buffMatch = details.match(/(\d+)% (.*)/); if (buffMatch) { buffValue = parseInt(buffMatch[1], 10); buffType = buffMatch[2]; }
        }
        if (cityTypes.some(city => name.includes(city))) type = 'City';
        // Add isFixed property
        const isFixed = FIXED_ASSIGNMENTS.hasOwnProperty(id);
        landData[id] = { id, level, name, type, buffValue, buffType, iconClass: getIconClass(buffType), owner: null, isFixed: isFixed };
    });

    // --- DOM Elements ---
    const mapGrid = document.getElementById('map-grid');
    const mapContainer = document.getElementById('map-container');
    const allianceSummaryDiv = document.getElementById('alliance-summary');
    const modalElement = document.getElementById('allianceSelectModal');
    const allianceSelectModal = new bootstrap.Modal(modalElement);
    const modalSegmentIdSpan = document.getElementById('modalSegmentId');
    const modalSegmentNameSpan = document.getElementById('modalSegmentName');
    const modalSegmentTypeSpan = document.getElementById('modalSegmentType');
    const modalSegmentLevelSpan = document.getElementById('modalSegmentLevel');
    const modalSegmentBuffSpan = document.getElementById('modalSegmentBuff');
    const modalSegmentIcon = document.getElementById('modalSegmentIcon');
    const allianceButtonsDiv = document.getElementById('alliance-buttons');
    const clearAllianceButton = document.getElementById('clear-alliance-button');
    let currentSegmentId = null;

    // --- Map Generation ---
    const rows = 'ABCDEFGHIJKLM';
    for (let r = 0; r < 13; r++) {
        for (let c = 1; c <= 13; c++) {
            const segmentId = rows[r] + c; const segmentData = landData[segmentId]; if (!segmentData) continue;
            const segmentDiv = document.createElement('div'); segmentDiv.classList.add('map-segment'); segmentDiv.dataset.id = segmentId;
            const centerRow = 6, centerCol = 6; const ringLevel = Math.max(Math.abs(r - centerRow), Math.abs(c - 1 - centerCol));
            if (ringLevel > 0) segmentDiv.classList.add(`ring-${ringLevel}`);
            if (segmentData.type === 'City') segmentDiv.classList.add('city');
            if (segmentData.isFixed) segmentDiv.classList.add('fixed-assignment'); // Add class for fixed segments
            segmentDiv.innerHTML = `<span class="segment-label">${segmentId}</span><span class="segment-level">Level ${segmentData.level}</span><div class="segment-content"><span class="segment-name">${segmentData.name}</span><i class="segment-icon ${segmentData.iconClass}"></i><span class="segment-buff">${segmentData.buffValue}% ${segmentData.buffType}</span></div>`;
            segmentDiv.addEventListener('click', () => handleSegmentClick(segmentId)); // Click listener still needed
            mapGrid.appendChild(segmentDiv);
        }
    }

    // --- Panzoom Initialization ---
    const panzoom = Panzoom(mapGrid, { maxScale: 5, minScale: 0.3, contain: 'outside', canvas: true, cursor: 'grab', step: 0.3 });
    mapContainer.addEventListener('wheel', panzoom.zoomWithWheel);
    function centerOnG7() {
        const g7Element = mapGrid.querySelector('[data-id="G7"]'); if (!g7Element) return;
        const mapRect = mapContainer.getBoundingClientRect();
        const elementWidth = g7Element.offsetWidth; const elementHeight = g7Element.offsetHeight;
        const initialZoom = 0.8; panzoom.zoom(initialZoom, { animate: false });
        const zoomedElementWidth = elementWidth * initialZoom; const zoomedElementHeight = elementHeight * initialZoom;
        const zoomedG7CenterX = (g7Element.offsetLeft * initialZoom) + zoomedElementWidth / 2; const zoomedG7CenterY = (g7Element.offsetTop * initialZoom) + zoomedElementHeight / 2;
        const finalPanX = (mapRect.width / 2) - zoomedG7CenterX; const finalPanY = (mapRect.height / 2) - zoomedG7CenterY;
        panzoom.pan(finalPanX, finalPanY, { animate: false, force: true });
    }
    setTimeout(centerOnG7, 150);

    // --- Event Handlers & Logic ---

    function handleSegmentClick(segmentId) {
        const segmentData = landData[segmentId];
        // *** PREVENT MODAL FOR FIXED SEGMENTS ***
        if (segmentData.isFixed) {
            // Optional: show a temporary message?
            // e.g., console.log(`${segmentId} is permanently assigned to ${segmentData.owner}.`);
            return; // Do not proceed to show modal
        }
        // *** END PREVENT MODAL ***

        currentSegmentId = segmentId;
        modalSegmentIdSpan.textContent = segmentId; modalSegmentNameSpan.textContent = segmentData.name; modalSegmentTypeSpan.textContent = segmentData.type; modalSegmentLevelSpan.textContent = segmentData.level; modalSegmentBuffSpan.textContent = `${segmentData.buffValue}% ${segmentData.buffType}`; modalSegmentIcon.className = `segment-icon ${segmentData.iconClass}`;
        allianceButtonsDiv.innerHTML = '';
        Object.entries(alliances).forEach(([code, data]) => {
            const button = document.createElement('button'); button.type = 'button'; button.classList.add('btn', 'btn-sm', 'w-100'); button.style.backgroundColor = data.color; button.style.color = '#fff'; button.textContent = `Assign to ${data.name}`; button.dataset.allianceCode = code;
            let disabledReason = null;
            if (segmentData.owner === code) disabledReason = ` (Already Owned)`;
            else if (segmentData.type === 'City' && data.cityCount >= data.cityLimit) disabledReason = ` (Limit: ${data.cityCount}/${data.cityLimit} Cities)`;
            else if (segmentData.type === 'Dig Site' && data.digSiteCount >= data.digSiteLimit) disabledReason = ` (Limit: ${data.digSiteCount}/${data.digSiteLimit} Digs)`;

            if (disabledReason) { button.disabled = true; button.textContent += disabledReason; button.style.opacity = '0.65'; button.style.cursor = 'not-allowed'; }
            else { button.addEventListener('click', () => handleAllianceSelection(code)); }
            allianceButtonsDiv.appendChild(button);
        });

        // Ensure clear button is also handled correctly
        clearAllianceButton.onclick = () => handleAllianceSelection(null); // Reassign listener

        allianceSelectModal.show();
    }

    function handleAllianceSelection(allianceCode) {
        if (!currentSegmentId || landData[currentSegmentId].isFixed) return; // Should not happen due to click handler, but double-check

        const segmentData = landData[currentSegmentId];
        const segmentElement = mapGrid.querySelector(`[data-id="${currentSegmentId}"]`);
        const previousOwner = segmentData.owner;

        // Limit checks before making changes
        if (allianceCode) {
            const alliance = alliances[allianceCode];
            if (segmentData.type === 'City' && alliance.cityCount >= alliance.cityLimit && previousOwner !== allianceCode) { alert(`${alliance.name} City limit reached.`); return; }
            if (segmentData.type === 'Dig Site' && alliance.digSiteCount >= alliance.digSiteLimit && previousOwner !== allianceCode) { alert(`${alliance.name} Dig Site limit reached.`); return; }
        }

        // Update State
        if (previousOwner && previousOwner !== allianceCode) {
            if (segmentData.type === 'City') alliances[previousOwner].cityCount--;
            else alliances[previousOwner].digSiteCount--;
            segmentElement.classList.remove(alliances[previousOwner].cssClass);
        }

        if (allianceCode && allianceCode !== previousOwner) {
            segmentData.owner = allianceCode;
            if (segmentData.type === 'City') alliances[allianceCode].cityCount++;
            else alliances[allianceCode].digSiteCount++;
            segmentElement.classList.add(alliances[allianceCode].cssClass);
        } else if (allianceCode === null && previousOwner !== null) { // Clearing the assignment
            segmentData.owner = null;
            // Counts were decremented above if previousOwner existed
        } else {
             allianceSelectModal.hide(); return; // No change or trying to assign same owner
        }

        updateAllianceSummary();
        allianceSelectModal.hide();
        saveState(); // Save changes for non-fixed segments
        currentSegmentId = null;
    }

    function calculateAllianceBuffs() {
        for (const code in alliances) { alliances[code].buffs = {}; } // Reset buffs
        // Counts are handled by initialization and selection logic, not reset here

        for (const segmentId in landData) {
            const segment = landData[segmentId];
            if (segment.owner) { // Check if owner exists after initialization/updates
                const alliance = alliances[segment.owner];
                if(alliance) { // Ensure alliance exists
                    const buffType = segment.buffType; const buffValue = segment.buffValue;
                    if (!alliance.buffs[buffType]) alliance.buffs[buffType] = 0;
                    alliance.buffs[buffType] += buffValue;
                } else {
                    console.warn(`Owner ${segment.owner} not found in alliances for segment ${segmentId}`);
                    segment.owner = null; // Clear invalid owner
                }
            }
        }
    }

    function updateAllianceSummary() {
        calculateAllianceBuffs(); // Calculate current buffs based on owners
        allianceSummaryDiv.innerHTML = '';

        Object.entries(alliances).forEach(([code, data]) => {
            const itemDiv = document.createElement('div'); itemDiv.classList.add('summary-item');
            const headerDiv = document.createElement('div'); headerDiv.classList.add('summary-header');
            headerDiv.innerHTML = `<span class="summary-color-dot" style="background-color: ${data.color};"></span><span class="summary-alliance-name">${data.name}</span>`;
            const countsDiv = document.createElement('div'); countsDiv.classList.add('summary-counts');
            countsDiv.innerHTML = `Cities: ${data.cityCount}/${data.cityLimit} | Digs: ${data.digSiteCount}/${data.digSiteLimit}`;
            const buffsUl = document.createElement('ul'); buffsUl.classList.add('summary-buffs-list');

            ALL_BUFF_TYPES.forEach(buffType => {
                const buffValue = data.buffs[buffType] || 0;
                if (buffValue > 0) { // Only show buffs > 0%
                    const iconClass = getIconClass(buffType);
                    const buffLi = document.createElement('li');
                    buffLi.innerHTML = `
                        <i class="${iconClass}"></i>
                        <span class="buff-name">${buffType}</span>
                        <span class="buff-value">${buffValue}%</span>
                    `;
                    buffsUl.appendChild(buffLi);
                }
            });

            itemDiv.appendChild(headerDiv); itemDiv.appendChild(countsDiv); itemDiv.appendChild(buffsUl);
            allianceSummaryDiv.appendChild(itemDiv);
        });
    }

    // Save only non-fixed assignments
    function saveState() {
        const stateToSave = {};
        for (const segmentId in landData) {
            // Only save if it has an owner AND is NOT fixed
            if (landData[segmentId].owner && !landData[segmentId].isFixed) {
                stateToSave[segmentId] = landData[segmentId].owner;
            }
        }
        localStorage.setItem('allianceMapState_v2', JSON.stringify(stateToSave));
    }

    // *** REVISED INITIALIZATION FUNCTION ***
    function initializeMapState() {
        // 1. Reset all owners and counts
        for (const segmentId in landData) { landData[segmentId].owner = null; }
        for (const code in alliances) { alliances[code].cityCount = 0; alliances[code].digSiteCount = 0; alliances[code].buffs = {}; }

        // 2. Load state from localStorage for non-fixed segments
        const savedState = localStorage.getItem('allianceMapState_v2');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            for (const segmentId in parsedState) {
                // ONLY load if the segment exists, the alliance exists, AND it's NOT a fixed segment
                if (landData[segmentId] && alliances[parsedState[segmentId]] && !FIXED_ASSIGNMENTS.hasOwnProperty(segmentId)) {
                    // Tentatively assign owner - counts/limits checked later
                    landData[segmentId].owner = parsedState[segmentId];
                }
            }
        }

        // 3. Apply fixed assignments (overwrites any loaded state for these specific segments)
        for (const segmentId in FIXED_ASSIGNMENTS) {
            if (landData[segmentId]) {
                landData[segmentId].owner = FIXED_ASSIGNMENTS[segmentId];
            }
        }

        // 4. Recalculate counts and apply visuals based on the final owner assignments
        for (const segmentId in landData) {
            const segment = landData[segmentId];
            const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`); // Get element ref

            // Clear any previous visual classes first
             if (segmentElement) {
                Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));
             }

            if (segment.owner) {
                 const alliance = alliances[segment.owner];
                 if (!alliance) { // Safety check if owner is somehow invalid
                    segment.owner = null;
                    continue;
                 }

                 // Check limits before incrementing count
                 let canAssign = false;
                 if (segment.type === 'City') {
                     if (alliance.cityCount < alliance.cityLimit) {
                         alliance.cityCount++;
                         canAssign = true;
                     }
                 } else { // Dig Site
                     if (alliance.digSiteCount < alliance.digSiteLimit) {
                         alliance.digSiteCount++;
                         canAssign = true;
                     }
                 }

                // If assignment is valid (within limits), apply visual class
                if(canAssign) {
                    if (segmentElement) {
                        segmentElement.classList.add(alliance.cssClass);
                    }
                } else {
                    // If limit was hit (by fixed + loaded), revert this segment's owner in the data model
                    console.warn(`Initialization conflict: Limit reached for ${segment.owner} at ${segmentId}. Reverting ownership.`);
                    segment.owner = null;
                    // Visual class was already cleared above
                }

            }
            // If segment.owner is null (either initially or reverted due to limits), ensure no alliance class is present (already handled by clearing step)
        }

        // 5. Update the summary display
        updateAllianceSummary();
    }
    // *** END REVISED INITIALIZATION FUNCTION ***


    // --- Initial Load ---
    initializeMapState(); // Use the new initialization function

}); // End DOMContentLoaded
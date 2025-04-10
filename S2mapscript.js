document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & Data ---
    const alliances = {
        THOR: { name: 'THOR', color: 'rgba(0, 123, 255, 0.7)', cssClass: 'alliance-thor', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0 },
        COLD: { name: 'COLD', color: 'rgba(23, 162, 184, 0.7)', cssClass: 'alliance-cold', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0 },
        ADHD: { name: 'ADHD', color: 'rgba(232, 62, 140, 0.7)', cssClass: 'alliance-adhd', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0 },
        FAFO: { name: 'FAFO', color: 'rgba(220, 53, 69, 0.7)', cssClass: 'alliance-fafo', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0 },
        NEWJ: { name: 'NEWJ', color: 'rgba(255, 193, 7, 0.7)', cssClass: 'alliance-newj', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0 },
        BRSL: { name: 'BRSL', color: 'rgba(40, 167, 69, 0.7)', cssClass: 'alliance-brsl', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0 },
        VALT: { name: 'VALT', color: 'rgba(108, 117, 125, 0.7)', cssClass: 'alliance-valt', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0 },
        HPCE: { name: 'HPCE', color: 'rgba(102, 16, 242, 0.7)', cssClass: 'alliance-hpce', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0 },
    };
    const digSiteProduction = { 1: { coal: 2736, soil: 100 }, 2: { coal: 2880, soil: 110 }, 3: { coal: 3024, soil: 120 }, 4: { coal: 3168, soil: 130 }, 5: { coal: 3312, soil: 140 }, 6: { coal: 3456, soil: 150 } };
    const citySoilProduction = 350;
    const ALL_BUFF_TYPES = ['Coin', 'Food', 'Iron', 'Gathering', 'March Speed', 'Construction', 'Research', 'Training', 'Healing'];
    const FIXED_ASSIGNMENTS = { 'G6': 'THOR', 'F7': 'COLD', 'G8': 'FAFO', 'H7': 'ADHD' };
    const landDataInput = [ /* ... Same land data input array ... */
        "A1: Level 1 Dig Site 2% Coin", "A2: Level 1 Village 5% Iron", "A3: Level 1 Dig Site 2% Food", "A4: Level 1 Village 5% Food", "A5: Level 1 Dig Site 2% Iron", "A6: Level 1 Village 5% Iron", "A7: Level 1 Dig Site 2% Coin", "A8: Level 1 Village 5% Food", "A9: Level 1 Dig Site 2% Food", "A10: Level 1 Village 5% Iron", "A11: Level 1 Dig Site 2% Iron", "A12: Level 1 Village 5% Food", "A13: Level 1 Dig Site 2% Coin",
        "B1: Level 1 Village 5% Iron", "B2: Level 2 Dig Site 3% Coin", "B3: Level 2 Town 5% Gathering", "B4: Level 2 Dig Site 3% Food", "B5: Level 2 Town 5% Coin", "B6: Level 2 Dig Site 3% Iron", "B7: Level 2 Town 5% Gathering", "B8: Level 2 Dig Site 3% Coin", "B9: Level 2 Town 5% Coin", "B10: Level 2 Dig Site 3% Food", "B11: Level 2 Town 5% Gathering", "B12: Level 2 Dig Site 3% Iron", "B13: Level 1 Village 5% Food",
        "C1: Level 1 Dig Site 2% Food", "C2: Level 2 Town 5% Gathering", "C3: Level 3 Dig Site 4% Coin", "C4: Level 3 Factory 10% Food", "C5: Level 3 Dig Site 4% Food", "C6: Level 3 Factory 10% Iron", "C7: Level 3 Dig Site 4% Iron", "C8: Level 3 Factory 10% Coin", "C9: Level 3 Dig Site 4% Coin", "C10: Level 3 Factory 10% Food", "C11: Level 3 Dig Site 4% Food", "C12: Level 2 Town 5% Coin", "C13: Level 1 Dig Site 2% Iron",
        "D1: Level 1 Village 5% Iron", "D2: Level 2 Dig Site 3% Food", "D3: Level 3 Factory 10% Iron", "D4: Level 4 Dig Site 6% Coin", "D5: Level 4 Train Station 15% Gathering", "D6: Level 4 Dig Site 6% Food", "D7: Level 4 Train Station 15% Iron", "D8: Level 4 Dig Site 6% Iron", "D9: Level 4 Train Station 15% Coin", "D10: Level 4 Dig Site 6% Coin", "D11: Level 3 Factory 10% Coin", "D12: Level 2 Dig Site 3% Iron", "D13: Level 1 Village 5% Food",
        "E1: Level 1 Dig Site 2% Iron", "E2: Level 2 Town 5% Gathering", "E3: Level 3 Dig Site 4% Food", "E4: Level 4 Train Station 15% Coin", "E5: Level 5 Dig Site 8% Coin", "E6: Level 5 Launch Site 20% Coin", "E7: Level 5 Dig Site 8% Food", "E8: Level 5 Launch Site 20% Gathering", "E9: Level 5 Dig Site 8% Iron", "E10: Level 4 Train Station 15% Food", "E11: Level 3 Dig Site 4% Iron", "E12: Level 2 Town 5% Coin", "E13: Level 1 Dig Site 2% Coin",
        "F1: Level 1 Village 5% Iron", "F2: Level 2 Dig Site 3% Iron", "F3: Level 3 Factory 10% Coin", "F4: Level 4 Dig Site 6% Food", "F5: Level 5 Launch Site 20% Iron", "F6: Level 6 Dig Site 10% Iron", "F7: Level 6 War Palace 10% Healing", "F8: Level 6 Dig Site 10% Coin", "F9: Level 5 Launch Site 20% Food", "F10: Level 4 Dig Site 6% Iron", "F11: Level 3 Factory 10% Food", "F12: Level 2 Dig Site 3% Coin", "F13: Level 1 Village 5% Food",
        "G1: Level 1 Dig Site 2% Coin", "G2: Level 2 Town 5% Gathering", "G3: Level 3 Dig Site 4% Iron", "G4: Level 4 Train Station 15% Food", "G5: Level 5 Dig Site 8% Food", "G6: Level 6 War Palace 20% Construction", "G7: Capitol 10% March Speed", "G8: Level 6 War Palace 5% Training", "G9: Level 5 Dig Site 8% Iron", "G10: Level 4 Train Station 15% Iron", "G11: Level 3 Dig Site 4% Coin", "G12: Level 2 Town 5% Coin", "G13: Level 1 Dig Site 2% Food",
        "H1: Level 1 Village 5% Iron", "H2: Level 2 Dig Site 3% Coin", "H3: Level 3 Factory 10% Food", "H4: Level 4 Dig Site 6% Iron", "H5: Level 5 Launch Site 20% Coin", "H6: Level 6 Dig Site 10% Food", "H7: Level 6 War Palace 20% Research", "H8: Level 6 Dig Site 10% Coin", "H9: Level 5 Launch Site 20% Gathering", "H10: Level 4 Dig Site 6% Coin", "H11: Level 3 Factory 10% Iron", "H12: Level 2 Dig Site 3% Food", "H13: Level 1 Village 5% Food",
        "I1: Level 1 Dig Site 2% Food", "I2: Level 2 Town 5% Gathering", "I3: Level 3 Dig Site 4% Coin", "I4: Level 4 Train Station 15% Iron", "I5: Level 5 Dig Site 8% Food", "I6: Level 5 Launch Site 20% Iron", "I7: Level 5 Dig Site 8% Iron", "I8: Level 5 Launch Site 20% Food", "I9: Level 5 Dig Site 8% Coin", "I10: Level 4 Train Station 15% Coin", "I11: Level 3 Dig Site 4% Food", "I12: Level 2 Town 5% Coin", "I13: Level 1 Dig Site 2% Iron",
        "J1: Level 1 Village 5% Iron", "J2: Level 2 Dig Site 3% Food", "J3: Level 3 Factory 10% Iron", "J4: Level 4 Dig Site 6% Food", "J5: Level 4 Train Station 15% Food", "J6: Level 4 Dig Site 6% Iron", "J7: Level 4 Train Station 15% Gathering", "J8: Level 4 Dig Site 6% Coin", "J9: Level 4 Train Station 15% Gathering", "J10: Level 4 Dig Site 6% Food", "J11: Level 3 Factory 10% Coin", "J12: Level 2 Dig Site 3% Iron", "J13: Level 1 Village 5% Food",
        "K1: Level 1 Dig Site 2% Iron", "K2: Level 2 Town 5% Gathering", "K3: Level 3 Dig Site 4% Food", "K4: Level 3 Factory 10% Food", "K5: Level 3 Dig Site 4% Iron", "K6: Level 3 Factory 10% Iron", "K7: Level 3 Dig Site 4% Coin", "K8: Level 3 Factory 10% Coin", "K9: Level 3 Dig Site 4% Food", "K10: Level 3 Factory 10% Food", "K11: Level 3 Dig Site 4% Iron", "K12: Level 2 Town 5% Coin", "K13: Level 1 Dig Site 2% Coin",
        "L1: Level 1 Village 5% Iron", "L2: Level 2 Dig Site 3% Food", "L3: Level 2 Town 5% Coin", "L4: Level 2 Dig Site 3% Iron", "L5: Level 2 Town 5% Gathering", "L6: Level 2 Dig Site 3% Coin", "L7: Level 2 Town 5% Coin", "L8: Level 2 Dig Site 3% Food", "L9: Level 2 Town 5% Gathering", "L10: Level 2 Dig Site 3% Iron", "L11: Level 2 Town 5% Coin", "L12: Level 2 Dig Site 3% Coin", "L13: Level 1 Village 5% Food",
        "M1: Level 1 Dig Site 2% Food", "M2: Level 1 Village 5% Iron", "M3: Level 1 Dig Site 2% Iron", "M4: Level 1 Village 5% Food", "M5: Level 1 Dig Site 2% Coin", "M6: Level 1 Village 5% Iron", "M7: Level 1 Dig Site 2% Food", "M8: Level 1 Village 5% Food", "M9: Level 1 Dig Site 2% Iron", "M10: Level 1 Village 5% Iron", "M11: Level 1 Dig Site 2% Coin", "M12: Level 1 Village 5% Food", "M13: Level 1 Dig Site 2% Food",
    ];
    const landData = {};
    const cityTypes = ['Village', 'Town', 'Factory', 'Train Station', 'Launch Site', 'War Palace', 'Capitol'];

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

    // Parse data
    landDataInput.forEach(item => {
        const parts = item.split(': '); const id = parts[0]; const details = parts[1];
        let level = 0, name = '', buffValue = 0, buffType = '', type = 'Dig Site'; let coalPerHour = 0, rareSoilPerHour = 0;
        if (id === 'G7') { level = 'N/A'; name = 'Capitol'; type = 'City'; const bm = details.match(/(\d+)% (.*)/); if (bm) { buffValue = parseInt(bm[1], 10); buffType = bm[2]; } rareSoilPerHour = citySoilProduction; }
        else { const lm = details.match(/Level (\d+)/); if (lm) level = parseInt(lm[1], 10); const nm = details.match(/Level \d+ ([\w\s]+?) (\d+%|\d+$)/) || details.match(/Level \d+ ([\w\s]+)/); if (nm) name = nm[1].trim(); const bm = details.match(/(\d+)% (.*)/); if (bm) { buffValue = parseInt(bm[1], 10); buffType = bm[2]; } if (cityTypes.some(city => name.includes(city))) type = 'City';
            if (type === 'Dig Site' && digSiteProduction[level]) { coalPerHour = digSiteProduction[level].coal; rareSoilPerHour = digSiteProduction[level].soil; } else if (type === 'City' && level >= 1 && level <= 6) { rareSoilPerHour = citySoilProduction; }
        }
        const isFixed = FIXED_ASSIGNMENTS.hasOwnProperty(id);
        landData[id] = { id, level, name, type, buffValue, buffType, iconClass: getIconClass(buffType), owner: null, isFixed, coalPerHour, rareSoilPerHour };
    });

    // --- DOM Elements ---
    const mapGrid = document.getElementById('map-grid');
    const mapContainer = document.getElementById('map-container');
    const allianceSummaryDiv = document.getElementById('alliance-summary');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle'); // Toggle button
    const sidebarToggleText = sidebarToggleBtn.querySelector('.toggle-text');
    const bodyElement = document.body; // Reference to body
    const modalElement = document.getElementById('allianceSelectModal');
    const allianceSelectModal = new bootstrap.Modal(modalElement);
    const modalSegmentIdSpan = document.getElementById('modalSegmentId');
    const modalSegmentNameSpan = document.getElementById('modalSegmentName');
    const modalSegmentLevelSpan = document.getElementById('modalSegmentLevel');
    const modalSegmentBuffSpan = document.getElementById('modalSegmentBuff');
    const modalSegmentProdSpan = document.getElementById('modalSegmentProd');
    const allianceButtonsDiv = document.getElementById('alliance-buttons');
    const clearAllianceButton = document.getElementById('clear-alliance-button');
    const clearAllButton = document.getElementById('clear-all-button'); // NEW: Clear All button

    let currentSegmentId = null;
    let popoverTriggerList = []; // To manage popovers

    // --- Map Generation ---
    const rows = 'ABCDEFGHIJKLM';
    for (let r = 0; r < 13; r++) {
        for (let c = 1; c <= 13; c++) {
            const segmentId = rows[r] + c; const segmentData = landData[segmentId]; if (!segmentData) continue;
            const segmentDiv = document.createElement('div'); segmentDiv.classList.add('map-segment'); segmentDiv.dataset.id = segmentId;
            const centerRow = 6, centerCol = 6; const ringLevel = Math.max(Math.abs(r - centerRow), Math.abs(c - 1 - centerCol));
            if (ringLevel > 0) segmentDiv.classList.add(`ring-${ringLevel}`);
            if (segmentData.type === 'City') segmentDiv.classList.add('city');
            if (segmentData.isFixed) segmentDiv.classList.add('fixed-assignment');
            segmentDiv.innerHTML = `<span class="segment-label">${segmentId}</span><span class="segment-level">Level ${segmentData.level}</span><div class="segment-content"><span class="segment-name">${segmentData.name}</span><i class="segment-icon ${segmentData.iconClass}"></i><span class="segment-buff">${segmentData.buffValue > 0 ? segmentData.buffValue + '% ' + segmentData.buffType : ''}</span></div>`; // Only show buff if > 0
            segmentDiv.addEventListener('click', () => handleSegmentClick(segmentId));
            mapGrid.appendChild(segmentDiv);
        }
    }

    // --- Panzoom Initialization ---
    const panzoom = Panzoom(mapGrid, { maxScale: 5, minScale: 0.3, contain: 'outside', canvas: true, cursor: 'grab', step: 0.3 });
    mapContainer.addEventListener('wheel', panzoom.zoomWithWheel);

    function centerOnG7() {
        const g7Element = mapGrid.querySelector('[data-id="G7"]'); if (!g7Element) return; const mapRect = mapContainer.getBoundingClientRect(); const elementWidth = g7Element.offsetWidth; const elementHeight = g7Element.offsetHeight; const initialZoom = 0.8; panzoom.zoom(initialZoom, { animate: false }); const zoomedElementWidth = elementWidth * initialZoom; const zoomedElementHeight = elementHeight * initialZoom; const zoomedG7CenterX = (g7Element.offsetLeft * initialZoom) + zoomedElementWidth / 2; const zoomedG7CenterY = (g7Element.offsetTop * initialZoom) + zoomedElementHeight / 2; const finalPanX = (mapRect.width / 2) - zoomedG7CenterX; const finalPanY = (mapRect.height / 2) - zoomedG7CenterY; panzoom.pan(finalPanX, finalPanY, { animate: false, force: true });
    }
    setTimeout(centerOnG7, 150);

    // --- Event Handlers & Logic ---

    function handleSegmentClick(segmentId) {
        const segmentData = landData[segmentId];
        if (segmentData.isFixed) return; // Cannot modify fixed assignments

        currentSegmentId = segmentId;
        modalSegmentIdSpan.textContent = segmentId; modalSegmentNameSpan.textContent = segmentData.name; modalSegmentLevelSpan.textContent = segmentData.level; modalSegmentBuffSpan.textContent = `${segmentData.buffValue > 0 ? segmentData.buffValue + '% ' + segmentData.buffType : 'None'}`;
        let prodText = '';
        if (segmentData.coalPerHour > 0) prodText += `<span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Coal Per Hour" data-bs-content="${segmentData.coalPerHour}"><br>Coal Per Hour: </span><span class="resource-value">${segmentData.coalPerHour}</span> `;
        if (segmentData.rareSoilPerHour > 0) prodText += `<span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Rare Soil Per Hour" data-bs-content="${segmentData.rareSoilPerHour}"><br>Rare Soil Per Hour: </span><span class="resource-value">${segmentData.rareSoilPerHour}</span>`;
        if (prodText === '') prodText = 'None';
        modalSegmentProdSpan.innerHTML = prodText;

        // Initialize popovers within the modal *after* content is set
        const modalPopoverTriggerList = modalElement.querySelectorAll('[data-bs-toggle="popover"]');
        modalPopoverTriggerList.forEach(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));


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

        clearAllianceButton.onclick = () => handleAllianceSelection(null);
        allianceSelectModal.show();
    }

    function handleAllianceSelection(allianceCode) {
        if (!currentSegmentId || landData[currentSegmentId].isFixed) return; // Double check fixed status
        const segmentData = landData[currentSegmentId];
        const segmentElement = mapGrid.querySelector(`[data-id="${currentSegmentId}"]`);
        const previousOwner = segmentData.owner;

        // Check limits only if assigning to a *new* alliance
        if (allianceCode && allianceCode !== previousOwner) {
             const alliance = alliances[allianceCode];
             if (segmentData.type === 'City' && alliance.cityCount >= alliance.cityLimit) {
                 alert(`${alliance.name} City limit reached.`); return;
             }
             if (segmentData.type === 'Dig Site' && alliance.digSiteCount >= alliance.digSiteLimit) {
                 alert(`${alliance.name} Dig Site limit reached.`); return;
             }
        }

        // Decrement count for the previous owner if there was one and it's changing
        if (previousOwner && previousOwner !== allianceCode) {
            if (segmentData.type === 'City') alliances[previousOwner].cityCount--;
            else if (segmentData.type === 'Dig Site') alliances[previousOwner].digSiteCount--;
            segmentElement.classList.remove(alliances[previousOwner].cssClass);
        }

        // Increment count for the new owner if assigning and it's different from previous
        if (allianceCode && allianceCode !== previousOwner) {
            segmentData.owner = allianceCode;
            if (segmentData.type === 'City') alliances[allianceCode].cityCount++;
            else if (segmentData.type === 'Dig Site') alliances[allianceCode].digSiteCount++;
            segmentElement.classList.add(alliances[allianceCode].cssClass);
        } else if (allianceCode === null && previousOwner !== null) {
            // Clearing assignment
            segmentData.owner = null;
        } else {
            // No change (e.g., clicking the same alliance again or clearing an empty segment)
            allianceSelectModal.hide();
            return;
        }

        updateAllianceSummary();
        allianceSelectModal.hide();
        saveState();
        currentSegmentId = null;
    }

    // --- MODIFIED: Clear All Assignments Function ---
    function clearAllAssignments() {
        if (!confirm("Are you sure you want to clear ALL user-assigned segments? Fixed assignments will remain.")) {
            return; // Abort if user cancels confirmation
        }

        // --- MODIFICATION START ---
        // 1. Reset ALL alliance counts (city and dig site) to zero initially.
        for (const code in alliances) {
            alliances[code].cityCount = 0;
            alliances[code].digSiteCount = 0;
        }

        // 2. Iterate through all land segments
        for (const segmentId in landData) {
            const segmentData = landData[segmentId];
            const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);

            // If the segment has an owner AND is NOT fixed, clear it.
            if (segmentData.owner && !segmentData.isFixed) {
                const alliance = alliances[segmentData.owner];
                if(alliance && segmentElement) {
                     segmentElement.classList.remove(alliance.cssClass);
                }
                segmentData.owner = null; // Clear the owner
            }
            // --- This part handles RE-COUNTING fixed assignments ---
            // If the segment IS fixed and has an owner (it should always have one based on FIXED_ASSIGNMENTS)
            else if (segmentData.isFixed && segmentData.owner) {
                 const alliance = alliances[segmentData.owner];
                 if (alliance) {
                     // Increment the count for the fixed assignment's owner
                     if (segmentData.type === 'City') {
                         alliance.cityCount++;
                     } else if (segmentData.type === 'Dig Site') {
                         // Although current fixed assignments are cities, handle dig sites just in case
                         alliance.digSiteCount++;
                     }
                     // Ensure CSS class is present (it should be, but double-check)
                     if(segmentElement && !segmentElement.classList.contains(alliance.cssClass)) {
                          segmentElement.classList.add(alliance.cssClass);
                     }
                 }
            }
            // --- END OF RE-COUNTING fixed assignments ---
        }
        // --- MODIFICATION END ---

        updateAllianceSummary(); // Recalculate buffs and update display based on new counts
        saveState(); // Save the cleared state (fixed assignments remain, others are gone)
        console.log("All non-fixed assignments cleared. Fixed assignment counts reset.");
    }
    // Add event listener to the new button
    clearAllButton.addEventListener('click', clearAllAssignments);
    // --- END MODIFIED ---

    function calculateAllianceBuffs() {
        for (const code in alliances) { alliances[code].buffs = {}; }
        for (const segmentId in landData) { const segment = landData[segmentId]; if (segment.owner && alliances[segment.owner]) { const alliance = alliances[segment.owner]; const buffType = segment.buffType; const buffValue = segment.buffValue; if (buffValue > 0) { if (!alliance.buffs[buffType]) alliance.buffs[buffType] = 0; alliance.buffs[buffType] += buffValue; } } }
    }
    function calculateAllianceResources() {
        for (const code in alliances) { alliances[code].totalCPH = 0; alliances[code].totalRSPH = 0; }
        for (const segmentId in landData) { const segment = landData[segmentId]; if (segment.owner && alliances[segment.owner]) { alliances[segment.owner].totalCPH += segment.coalPerHour || 0; alliances[segment.owner].totalRSPH += segment.rareSoilPerHour || 0; } }
    }

    // Function to initialize popovers
    function initializePopovers() {
        popoverTriggerList.forEach(p => p.dispose());
        const newPopoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
        popoverTriggerList = [...newPopoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
    }

    function updateAllianceSummary() {
        calculateAllianceBuffs();
        calculateAllianceResources();
        allianceSummaryDiv.innerHTML = '';

        Object.entries(alliances).forEach(([code, data]) => {
            const itemDiv = document.createElement('div'); itemDiv.classList.add('summary-item');
            const headerDiv = document.createElement('div'); headerDiv.classList.add('summary-header');
            headerDiv.innerHTML = `<span class="summary-color-dot" style="background-color: ${data.color};"></span><span class="summary-alliance-name">${data.name}</span>`;

            const resourcesDiv = document.createElement('div');
            resourcesDiv.classList.add('summary-resources');
            resourcesDiv.innerHTML = `
                <span>
                  <span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Coal Per Hour">Cph</span>
                  <span class="resource-value">${data.totalCPH || 0}</span>
                </span> |
                <span>
                  <span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Rare Soil Per Hour">RSph</span>
                  <span class="resource-value">${data.totalRSPH || 0}</span>
                </span>
            `;

            const countsDiv = document.createElement('div'); countsDiv.classList.add('summary-counts');
            countsDiv.innerHTML = `Cities: ${data.cityCount}/${data.cityLimit} | Digs: ${data.digSiteCount}/${data.digSiteLimit}`;
            const buffsUl = document.createElement('ul'); buffsUl.classList.add('summary-buffs-list');

            ALL_BUFF_TYPES.forEach(buffType => {
                const buffValue = data.buffs[buffType] || 0;
                if (buffValue > 0) {
                    const iconClass = getIconClass(buffType);
                    const buffLi = document.createElement('li');
                    buffLi.innerHTML = `<i class="${iconClass}"></i><span class="buff-name">${buffType}</span><span class="buff-value">${buffValue}%</span>`;
                    buffsUl.appendChild(buffLi);
                }
            });

            itemDiv.appendChild(headerDiv); itemDiv.appendChild(resourcesDiv); itemDiv.appendChild(countsDiv); itemDiv.appendChild(buffsUl);
            allianceSummaryDiv.appendChild(itemDiv);
        });

        initializePopovers();
    }

    function saveState() {
        const stateToSave = {};
        for (const segmentId in landData) {
            // Only save owner if it exists AND the segment is not fixed
            if (landData[segmentId].owner && !landData[segmentId].isFixed) {
                 stateToSave[segmentId] = landData[segmentId].owner;
            }
        }
        localStorage.setItem('allianceMapState_v2', JSON.stringify(stateToSave));
    }

    function initializeMapState() {
        // 1. Reset all counts and non-fixed owners
        for (const segmentId in landData) {
            landData[segmentId].owner = null; // Clear owner first
            const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);
            if (segmentElement) {
                 Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));
            }
        }
        for (const code in alliances) {
            alliances[code].cityCount = 0;
            alliances[code].digSiteCount = 0;
            alliances[code].buffs = {};
            alliances[code].totalCPH = 0;
            alliances[code].totalRSPH = 0;
        }

        // 2. Apply fixed assignments AND increment their counts
        for (const segmentId in FIXED_ASSIGNMENTS) {
             if (landData[segmentId]) {
                 const segmentData = landData[segmentId];
                 const allianceCode = FIXED_ASSIGNMENTS[segmentId];
                 const alliance = alliances[allianceCode];
                 const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);

                 segmentData.owner = allianceCode; // Assign owner
                 if(segmentElement && alliance) { // Apply CSS
                      segmentElement.classList.add(alliance.cssClass);
                 }
                 // Increment count for fixed assignments
                 if (alliance) {
                     if (segmentData.type === 'City') {
                         alliance.cityCount++;
                     } else if (segmentData.type === 'Dig Site') {
                         alliance.digSiteCount++;
                     }
                 }
             }
        }

        // 3. Load saved state for non-fixed assignments
        const savedState = localStorage.getItem('allianceMapState_v2');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            for (const segmentId in parsedState) {
                // Ensure segment exists, is NOT fixed, and alliance exists
                if (landData[segmentId] && !landData[segmentId].isFixed && alliances[parsedState[segmentId]]) {
                     const segmentData = landData[segmentId];
                     const allianceCode = parsedState[segmentId];
                     const alliance = alliances[allianceCode];
                     const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);

                     // Check limits *before* assigning from save state
                     let canAssign = false;
                     if (segmentData.type === 'City') {
                         if (alliance.cityCount < alliance.cityLimit) {
                             alliance.cityCount++;
                             canAssign = true;
                         }
                     } else if (segmentData.type === 'Dig Site') {
                         if (alliance.digSiteCount < alliance.digSiteLimit) {
                             alliance.digSiteCount++;
                             canAssign = true;
                         }
                     }

                     if (canAssign) {
                         segmentData.owner = allianceCode;
                         if (segmentElement) {
                              segmentElement.classList.add(alliance.cssClass);
                         }
                     } else {
                         console.warn(`Load conflict: Limit for ${allianceCode} at ${segmentId}. Saved assignment ignored.`);
                         // Do not assign owner, counts already not incremented
                     }
                }
            }
        }

        // 4. Final summary update reflects all assignments (fixed and loaded)
        updateAllianceSummary();
    }


    // --- Sidebar Toggle Logic ---
    function setSidebarState(isActive) {
        if(isActive) {
            bodyElement.classList.add('sidebar-active');
            allianceSummaryDiv.classList.remove('sidebar-collapsed');
            sidebarToggleText.textContent = "Hide";
            sidebarToggleBtn.title = "Hide Alliance Summary";
        } else {
            bodyElement.classList.remove('sidebar-active');
            allianceSummaryDiv.classList.add('sidebar-collapsed');
            sidebarToggleText.textContent = "Show";
            sidebarToggleBtn.title = "Show Alliance Summary";
        }
        requestAnimationFrame(() => {
             setTimeout(() => {
                 panzoom.resize();
             }, 350);
        });
    }

    sidebarToggleBtn.addEventListener('click', () => {
        const currentlyActive = bodyElement.classList.contains('sidebar-active');
        setSidebarState(!currentlyActive);
        if (!currentlyActive) {
             bodyElement.classList.add('sidebar-force-active');
        } else {
             bodyElement.classList.remove('sidebar-force-active');
        }
    });

    const mediaQuery = window.matchMedia('(max-width: 992px)');
    function handleMobileChange(e) {
        if (e.matches && !bodyElement.classList.contains('sidebar-force-active')) {
            setSidebarState(false);
        } else if (!e.matches && !bodyElement.classList.contains('sidebar-force-active')) {
             setSidebarState(true);
        }
    }
    mediaQuery.addEventListener('change', handleMobileChange);
    handleMobileChange(mediaQuery);
    if (!mediaQuery.matches && !bodyElement.classList.contains('sidebar-force-active')) { // Added check for force-active
         setSidebarState(true); // Ensure desktop starts open if not forced closed
     } else if (mediaQuery.matches && !bodyElement.classList.contains('sidebar-force-active')) {
         setSidebarState(false); // Ensure mobile starts closed if not forced open
     }
     // If forced, the current state set by user interaction is maintained


    // --- Initial Load ---
    initializeMapState(); // Initializes data, applies fixed/saved states, counts, visuals, and calls updateAllianceSummary

}); // End DOMContentLoaded
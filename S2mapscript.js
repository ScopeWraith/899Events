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
    const FIXED_ASSIGNMENTS = { 'G6': 'THOR', 'F7': 'COLD', 'G8': 'FAFO', 'H7': 'ADHD' }; // Keep this constant
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
    let fixedAlliancesActive = true; // **** NEW: State variable for the toggle ****

    function getIconClass(buffType) {
        switch (buffType.toLowerCase()) {
            case 'coin': return 'fa-solid fa-coins';
            case 'iron': return 'fa-solid fa-mound';
            case 'food': return 'fa-solid fa-bread-slice';
            case 'gathering': return 'fa-solid fa-tractor';
            case 'healing': return 'fa-solid fa-bandage';
            case 'construction': return 'fa-solid fa-hammer';
            case 'march speed': return 'fa-solid fa-truck-fast';
            case 'training': return 'fa-solid fa-shield-halved';
            case 'research': return 'fa-solid fa-flask-vial';
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
        // *** isFixed is determined ONLY by the constant FIXED_ASSIGNMENTS ***
        const isFixed = FIXED_ASSIGNMENTS.hasOwnProperty(id);
        // *** owner is initialized later based on fixedAlliancesActive state ***
        landData[id] = { id, level, name, type, buffValue, buffType, iconClass: getIconClass(buffType), owner: null, isFixed, coalPerHour, rareSoilPerHour };
    });

    // --- DOM Elements ---
    const mapGrid = document.getElementById('map-grid');
    const mapContainer = document.getElementById('map-container');
    const allianceSummaryDiv = document.getElementById('alliance-summary');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const sidebarToggleText = sidebarToggleBtn.querySelector('.toggle-text');
    const bodyElement = document.body;
    const modalElement = document.getElementById('allianceSelectModal');
    const allianceSelectModal = new bootstrap.Modal(modalElement);
    const modalSegmentIdSpan = document.getElementById('modalSegmentId');
    const modalSegmentNameSpan = document.getElementById('modalSegmentName');
    const modalSegmentLevelSpan = document.getElementById('modalSegmentLevel');
    const modalSegmentBuffSpan = document.getElementById('modalSegmentBuff');
    const modalSegmentProdSpan = document.getElementById('modalSegmentProd');
    const allianceButtonsDiv = document.getElementById('alliance-buttons');
    const clearAllianceButton = document.getElementById('clear-alliance-button');
    const clearAllButton = document.getElementById('clear-all-button');
    const fixedAllianceToggle = document.getElementById('fixed-alliance-toggle'); // **** NEW: Toggle Switch Element ****
    const summaryItemContainer = document.createElement('div'); // **** NEW: Container for actual summary items ****
    summaryItemContainer.classList.add('summary-item-container'); // **** NEW ****
    allianceSummaryDiv.appendChild(summaryItemContainer); // **** NEW ****

    let currentSegmentId = null;
    let popoverTriggerList = [];

    // --- Map Generation ---
    const rows = 'ABCDEFGHIJKLM';
    for (let r = 0; r < 13; r++) {
        for (let c = 1; c <= 13; c++) {
            const segmentId = rows[r] + c; const segmentData = landData[segmentId]; if (!segmentData) continue;
            const segmentDiv = document.createElement('div'); segmentDiv.classList.add('map-segment'); segmentDiv.dataset.id = segmentId;
            const centerRow = 6, centerCol = 6; const ringLevel = Math.max(Math.abs(r - centerRow), Math.abs(c - 1 - centerCol));
            if (ringLevel > 0) segmentDiv.classList.add(`ring-${ringLevel}`);
            if (segmentData.type === 'City') segmentDiv.classList.add('city');
            // Add fixed-assignment class based on the constant, regardless of toggle state
            if (segmentData.isFixed) segmentDiv.classList.add('fixed-assignment');
            segmentDiv.innerHTML = `<span class="segment-label">${segmentId}</span><span class="segment-level">Level ${segmentData.level}</span><div class="segment-content"><span class="segment-name">${segmentData.name}</span><i class="segment-icon ${segmentData.iconClass}"></i><span class="segment-buff">${segmentData.buffValue > 0 ? segmentData.buffValue + '% ' + segmentData.buffType : ''}</span></div>`;
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
        // Prevent clicking fixed segments EVEN IF the toggle is off (they are definitionally fixed)
        if (segmentData.isFixed) return;

        currentSegmentId = segmentId;
        modalSegmentIdSpan.textContent = segmentId; modalSegmentNameSpan.textContent = segmentData.name; modalSegmentLevelSpan.textContent = segmentData.level; modalSegmentBuffSpan.textContent = `${segmentData.buffValue > 0 ? segmentData.buffValue + '% ' + segmentData.buffType : 'None'}`;
        let prodText = '';
        if (segmentData.coalPerHour > 0) prodText += `<span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Coal Per Hour" data-bs-content="${segmentData.coalPerHour}"><br>Coal Per Hour: </span><span class="resource-value">${segmentData.coalPerHour}</span> `;
        if (segmentData.rareSoilPerHour > 0) prodText += `<span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Rare Soil Per Hour" data-bs-content="${segmentData.rareSoilPerHour}"><br>Rare Soil Per Hour: </span><span class="resource-value">${segmentData.rareSoilPerHour}</span>`;
        if (prodText === '') prodText = 'None';
        modalSegmentProdSpan.innerHTML = prodText;

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
        // No change needed here - it already prevents assigning to fixed, and correctly updates counts/owner for non-fixed.
        if (!currentSegmentId || landData[currentSegmentId].isFixed) return;
        const segmentData = landData[currentSegmentId];
        const segmentElement = mapGrid.querySelector(`[data-id="${currentSegmentId}"]`);
        const previousOwner = segmentData.owner;

        if (allianceCode && allianceCode !== previousOwner) {
             const alliance = alliances[allianceCode];
             if (segmentData.type === 'City' && alliance.cityCount >= alliance.cityLimit) {
                 alert(`${alliance.name} City limit reached.`); return;
             }
             if (segmentData.type === 'Dig Site' && alliance.digSiteCount >= alliance.digSiteLimit) {
                 alert(`${alliance.name} Dig Site limit reached.`); return;
             }
        }

        if (previousOwner && previousOwner !== allianceCode) {
            if (segmentData.type === 'City') alliances[previousOwner].cityCount--;
            else if (segmentData.type === 'Dig Site') alliances[previousOwner].digSiteCount--;
            if (segmentElement) segmentElement.classList.remove(alliances[previousOwner].cssClass);
        }

        if (allianceCode && allianceCode !== previousOwner) {
            segmentData.owner = allianceCode;
            if (segmentData.type === 'City') alliances[allianceCode].cityCount++;
            else if (segmentData.type === 'Dig Site') alliances[allianceCode].digSiteCount++;
            if (segmentElement) segmentElement.classList.add(alliances[allianceCode].cssClass);
        } else if (allianceCode === null && previousOwner !== null) {
            segmentData.owner = null; // owner already cleared and count decremented above
        } else {
            allianceSelectModal.hide();
            return;
        }

        updateAllianceSummary();
        allianceSelectModal.hide();
        saveState();
        currentSegmentId = null;
    }

    // --- Clear All Assignments Function ---
    // No change needed here - previous logic correctly resets counts and re-evaluates fixed assignments based on their *current* owner status (which is handled by the new toggle function).
    function clearAllAssignments() {
        if (!confirm("Are you sure you want to clear ALL user-assigned segments? Fixed assignments might be cleared if the toggle is off.")) {
             return;
        }

        for (const code in alliances) {
            alliances[code].cityCount = 0;
            alliances[code].digSiteCount = 0;
        }

        for (const segmentId in landData) {
            const segmentData = landData[segmentId];
            const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);

            if (segmentData.owner && !segmentData.isFixed) { // Clear non-fixed
                const alliance = alliances[segmentData.owner];
                if(alliance && segmentElement) {
                     segmentElement.classList.remove(alliance.cssClass);
                }
                segmentData.owner = null;
            }
            else if (segmentData.isFixed && segmentData.owner) { // Recount fixed IF they have an owner
                 const alliance = alliances[segmentData.owner];
                 if (alliance) {
                     if (segmentData.type === 'City') alliance.cityCount++;
                     else if (segmentData.type === 'Dig Site') alliance.digSiteCount++;

                     if(segmentElement && !segmentElement.classList.contains(alliance.cssClass)) {
                          segmentElement.classList.add(alliance.cssClass);
                     }
                 }
            }
             else if (segmentData.isFixed && !segmentData.owner) { // Ensure fixed segments without owner have no alliance class
                 if (segmentElement) {
                      Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));
                 }
             }
        }

        updateAllianceSummary();
        saveState();
        console.log("User assignments cleared. Fixed assignments recounted based on toggle state.");
    }
    clearAllButton.addEventListener('click', clearAllAssignments);

    // --- **** NEW: Toggle Fixed Alliances Function **** ---
    function toggleFixedAlliances(isActive) {
        fixedAlliancesActive = isActive; // Update global state

        for (const segmentId in FIXED_ASSIGNMENTS) {
            if (landData[segmentId]) {
                const segmentData = landData[segmentId];
                const allianceCode = FIXED_ASSIGNMENTS[segmentId];
                const alliance = alliances[allianceCode];
                const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);

                if (isActive) {
                    // Activate: Assign owner, add class, increment count (if not already maxed - unlikely for fixed)
                    if (segmentData.owner !== allianceCode) { // Prevent double counting if already active somehow
                         segmentData.owner = allianceCode;
                         if (alliance) {
                              if (segmentData.type === 'City' && alliance.cityCount < alliance.cityLimit) {
                                   alliance.cityCount++;
                              } else if (segmentData.type === 'Dig Site' && alliance.digSiteCount < alliance.digSiteLimit) {
                                  alliance.digSiteCount++;
                              }
                              if (segmentElement) segmentElement.classList.add(alliance.cssClass);
                         }
                    }
                } else {
                    // Deactivate: Remove owner, remove class, decrement count
                     if (segmentData.owner === allianceCode) { // Only decrement if it was the owner
                         segmentData.owner = null;
                         if (alliance) {
                             if (segmentData.type === 'City') {
                                 alliance.cityCount--;
                             } else if (segmentData.type === 'Dig Site') {
                                 alliance.digSiteCount--;
                             }
                             if (segmentElement) segmentElement.classList.remove(alliance.cssClass);
                         }
                     }
                 }
            }
        }

        updateAllianceSummary(); // Update sidebar
        saveState(); // Save the new toggle state
    }
    // Add event listener to the toggle
    fixedAllianceToggle.addEventListener('change', (event) => {
        toggleFixedAlliances(event.target.checked);
    });
    // --- **** END NEW TOGGLE FUNCTION **** ---


    function calculateAllianceBuffs() {
        // No change needed: It calculates based on current segment.owner
        for (const code in alliances) { alliances[code].buffs = {}; }
        for (const segmentId in landData) {
            const segment = landData[segmentId];
            if (segment.owner && alliances[segment.owner]) {
                const alliance = alliances[segment.owner];
                const buffType = segment.buffType;
                const buffValue = segment.buffValue;
                if (buffValue > 0 && buffType) { // Ensure buffType is valid
                    if (!alliance.buffs[buffType]) alliance.buffs[buffType] = 0;
                    alliance.buffs[buffType] += buffValue;
                }
            }
        }
    }
    function calculateAllianceResources() {
        // No change needed: It calculates based on current segment.owner
        for (const code in alliances) { alliances[code].totalCPH = 0; alliances[code].totalRSPH = 0; }
        for (const segmentId in landData) {
            const segment = landData[segmentId];
            if (segment.owner && alliances[segment.owner]) {
                alliances[segment.owner].totalCPH += segment.coalPerHour || 0;
                alliances[segment.owner].totalRSPH += segment.rareSoilPerHour || 0;
            }
        }
    }

    function initializePopovers() {
        popoverTriggerList.forEach(p => p.dispose());
        // *** IMPORTANT: Scope popover initialization to the summary container ***
        const newPopoverTriggerList = summaryItemContainer.querySelectorAll('[data-bs-toggle="popover"]');
        popoverTriggerList = [...newPopoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
    }

    function updateAllianceSummary() {
        calculateAllianceBuffs();
        calculateAllianceResources();
        summaryItemContainer.innerHTML = ''; // **** NEW: Clear the container, not the whole sidebar ****

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
            summaryItemContainer.appendChild(itemDiv); // **** NEW: Append to container ****
        });

        initializePopovers();
    }

    function saveState() {
        const stateToSave = {
             assignments: {},
             fixedActive: fixedAlliancesActive // **** NEW: Save toggle state ****
        };
        for (const segmentId in landData) {
            // Only save owner if it exists AND the segment is not fixed
            if (landData[segmentId].owner && !landData[segmentId].isFixed) {
                 stateToSave.assignments[segmentId] = landData[segmentId].owner;
            }
        }
        localStorage.setItem('allianceMapState_v3', JSON.stringify(stateToSave)); // Use v3 for new structure
    }

    function initializeMapState() {
         // 1. Load Saved State (including toggle state)
         const savedStateRaw = localStorage.getItem('allianceMapState_v3'); // Use v3
         let parsedState = { assignments: {}, fixedActive: true }; // Default state
         if (savedStateRaw) {
              try {
                   const loaded = JSON.parse(savedStateRaw);
                   // Basic validation
                   if (loaded && typeof loaded.assignments === 'object' && typeof loaded.fixedActive === 'boolean') {
                        parsedState = loaded;
                   } else {
                       console.warn("Invalid saved state structure found, using defaults.");
                   }
              } catch (e) {
                   console.error("Failed to parse saved state, using defaults.", e);
              }
         }
         fixedAlliancesActive = parsedState.fixedActive; // Set global state from saved
         fixedAllianceToggle.checked = fixedAlliancesActive; // Set toggle element state


        // 2. Reset all counts and owners IN MEMORY first
        for (const code in alliances) {
            alliances[code].cityCount = 0;
            alliances[code].digSiteCount = 0;
            alliances[code].buffs = {};
            alliances[code].totalCPH = 0;
            alliances[code].totalRSPH = 0;
        }
         for (const segmentId in landData) {
              landData[segmentId].owner = null;
              const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);
              if (segmentElement) {
                   Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));
              }
         }


        // 3. Apply fixed assignments IF ACTIVE
        if (fixedAlliancesActive) {
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
                          if (segmentData.type === 'City') alliance.cityCount++;
                          else if (segmentData.type === 'Dig Site') alliance.digSiteCount++;
                      }
                 }
            }
        }
        // Else: Fixed assignments remain ownerless, counts are 0

        // 4. Load saved USER assignments (non-fixed)
        for (const segmentId in parsedState.assignments) {
            // Ensure segment exists, is NOT fixed, and alliance exists
            if (landData[segmentId] && !landData[segmentId].isFixed && alliances[parsedState.assignments[segmentId]]) {
                 const segmentData = landData[segmentId];
                 const allianceCode = parsedState.assignments[segmentId];
                 const alliance = alliances[allianceCode];
                 const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);

                 // Check limits *before* assigning from save state
                 let canAssign = false;
                 if (segmentData.type === 'City') {
                     if (alliance.cityCount < alliance.cityLimit) {
                         alliance.cityCount++; canAssign = true;
                     }
                 } else if (segmentData.type === 'Dig Site') {
                     if (alliance.digSiteCount < alliance.digSiteLimit) {
                         alliance.digSiteCount++; canAssign = true;
                     }
                 }

                 if (canAssign) {
                     segmentData.owner = allianceCode;
                     if (segmentElement) {
                          segmentElement.classList.add(alliance.cssClass);
                     }
                 } else {
                     console.warn(`Load conflict: Limit for ${allianceCode} at ${segmentId}. Saved assignment ignored.`);
                 }
            }
        }

        // 5. Final summary update reflects all assignments based on current state
        updateAllianceSummary();
    }


    // --- Sidebar Toggle Logic (No changes needed) ---
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
    if (!mediaQuery.matches && !bodyElement.classList.contains('sidebar-force-active')) {
         setSidebarState(true);
     } else if (mediaQuery.matches && !bodyElement.classList.contains('sidebar-force-active')) {
         setSidebarState(false);
     }

    // --- Initial Load ---
    initializeMapState(); // Initializes data, applies states based on toggle, counts, visuals, and calls updateAllianceSummary

}); // End DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & Data ---
    // Add per-alliance counters and assignment lists
    const alliances = {
        THOR: { name: 'THOR', color: 'rgba(0, 123, 255, 0.7)', cssClass: 'alliance-thor', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [] },
        COLD: { name: 'COLD', color: 'rgba(23, 162, 184, 0.7)', cssClass: 'alliance-cold', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [] },
        ADHD: { name: 'ADHD', color: 'rgba(232, 62, 140, 0.7)', cssClass: 'alliance-adhd', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [] },
        FAFO: { name: 'FAFO', color: 'rgba(220, 53, 69, 0.7)', cssClass: 'alliance-fafo', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [] },
        NEWJ: { name: 'NEWJ', color: 'rgba(255, 193, 7, 0.7)', cssClass: 'alliance-newj', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [] },
        BRSL: { name: 'BRSL', color: 'rgba(40, 167, 69, 0.7)', cssClass: 'alliance-brsl', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [] },
        VALT: { name: 'VALT', color: 'rgba(108, 117, 125, 0.7)', cssClass: 'alliance-valt', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [] },
        HPCE: { name: 'HPCE', color: 'rgba(102, 16, 242, 0.7)', cssClass: 'alliance-hpce', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [] },
    };
    const digSiteProduction = { 1: { coal: 2736, soil: 100 }, 2: { coal: 2880, soil: 110 }, 3: { coal: 3024, soil: 120 }, 4: { coal: 3168, soil: 130 }, 5: { coal: 3312, soil: 140 }, 6: { coal: 3456, soil: 150 } };
    const citySoilProduction = 350;
    const digSiteResistance = { 1: 3500, 2: 6000, 3: 8000, 4: 9500, 5: 10000, 6: 10500 };
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
    const SAVE_KEY = 'allianceMapState_v5'; // Increment save key version

    // --- State Variables ---
    let fixedAlliancesActive = true;
    let assignmentOrderActive = false;
    // Global assignment counter removed

    function getIconClass(buffType) { /* ... no changes ... */
        switch (buffType.toLowerCase()) {
            case 'coin': return 'fa-solid fa-coins'; case 'iron': return 'fa-solid fa-mound'; case 'food': return 'fa-solid fa-bread-slice'; case 'gathering': return 'fa-solid fa-tractor'; case 'healing': return 'fa-solid fa-bandage'; case 'construction': return 'fa-solid fa-hammer'; case 'march speed': return 'fa-solid fa-truck-fast'; case 'training': return 'fa-solid fa-shield-halved'; case 'research': return 'fa-solid fa-flask-vial'; default: return 'fa-solid fa-question-circle';
        }
    }

    // Parse data
    landDataInput.forEach(item => { /* ... no changes needed in parsing logic ... */
        const parts = item.split(': '); const id = parts[0]; const details = parts[1];
        let level = 0, name = '', buffValue = 0, buffType = '', type = 'Other'; let coalPerHour = 0, rareSoilPerHour = 0, resistance = null;
        if (id === 'G7') { level = 'N/A'; name = 'Capitol'; type = 'City'; const bm = details.match(/(\d+)% (.*)/); if (bm) { buffValue = parseInt(bm[1], 10); buffType = bm[2]; } rareSoilPerHour = citySoilProduction; }
        else { const lm = details.match(/Level (\d+)/); if (lm) level = parseInt(lm[1], 10); const nameMatch = details.match(/Level \d+ ([\w\s]+?)(?: \d+%|\s*$)/); if (nameMatch) name = nameMatch[1].trim(); else name = 'Unknown'; const bm = details.match(/(\d+)% (.*)/); if (bm) { buffValue = parseInt(bm[1], 10); buffType = bm[2]; } if (name.includes('Dig Site')) type = 'Dig Site'; else if (cityTypes.some(city => name.includes(city))) type = 'City'; else type = 'Other'; if (type === 'Dig Site' && digSiteProduction[level]) { coalPerHour = digSiteProduction[level].coal; rareSoilPerHour = digSiteProduction[level].soil; resistance = digSiteResistance[level] || null; } else if (type === 'City' && level >= 1 && level <= 6) { rareSoilPerHour = citySoilProduction; } }
        const isFixed = FIXED_ASSIGNMENTS.hasOwnProperty(id);
        landData[id] = { id, level, name, type, buffValue, buffType, iconClass: getIconClass(buffType), owner: null, isFixed, coalPerHour, rareSoilPerHour, resistance, assignmentOrder: null };
    });


    // --- DOM Elements ---
    const mapGrid = document.getElementById('map-grid');
    const mapContainer = document.getElementById('map-container');
    const allianceSummaryDiv = document.getElementById('alliance-summary');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const bodyElement = document.body;
    const modalElement = document.getElementById('allianceSelectModal');
    const allianceSelectModal = new bootstrap.Modal(modalElement);
    const modalSegmentIdSpan = document.getElementById('modalSegmentId');
    const modalSegmentNameSpan = document.getElementById('modalSegmentName');
    const modalSegmentLevelSpan = document.getElementById('modalSegmentLevel');
    const modalSegmentBuffSpan = document.getElementById('modalSegmentBuff');
    const modalSegmentProdSpan = document.getElementById('modalSegmentProd');
    const modalSegmentResistanceSpan = document.getElementById('modalSegmentResistance');
    const allianceButtonsDiv = document.getElementById('alliance-buttons');
    const clearAllianceButton = document.getElementById('clear-alliance-button');
    const clearAllButton = document.getElementById('clear-all-button');
    const fixedAllianceToggle = document.getElementById('fixed-alliance-toggle');
    const assignmentOrderToggle = document.getElementById('assignment-order-toggle');
    const summaryItemContainer = allianceSummaryDiv.querySelector('.summary-item-container') || document.createElement('div');
    if (!summaryItemContainer.classList.contains('summary-item-container')) {
         summaryItemContainer.classList.add('summary-item-container');
         const lastToggle = allianceSummaryDiv.querySelector('.fixed-toggle-container:last-of-type');
         if (lastToggle) lastToggle.parentNode.insertBefore(summaryItemContainer, lastToggle.nextSibling);
         else allianceSummaryDiv.appendChild(summaryItemContainer);
    }

    let currentSegmentId = null;
    let popoverTriggerList = [];

    // --- Map Generation ---
    const rows = 'ABCDEFGHIJKLM';
    for (let r = 0; r < 13; r++) {
        for (let c = 1; c <= 13; c++) { /* ... no changes needed in map generation loop ... */
            const segmentId = rows[r] + c; const segmentData = landData[segmentId]; if (!segmentData) continue;
            const segmentDiv = document.createElement('div'); segmentDiv.classList.add('map-segment'); segmentDiv.dataset.id = segmentId; const centerRow = 6, centerCol = 6; const ringLevel = Math.max(Math.abs(r - centerRow), Math.abs(c - 1 - centerCol)); if (ringLevel > 0) segmentDiv.classList.add(`ring-${ringLevel}`); if (segmentData.type === 'City') segmentDiv.classList.add('city'); if (segmentData.isFixed) segmentDiv.classList.add('fixed-assignment'); let resistanceHTML = ''; if (segmentData.type === 'Dig Site' && segmentData.resistance) { resistanceHTML = `<span class="segment-resistance">Res: ${segmentData.resistance.toLocaleString()}</span>`; }
            segmentDiv.innerHTML = `<span class="segment-label">${segmentId}</span><span class="segment-level">Level ${segmentData.level}</span><div class="segment-content"><span class="segment-name">${segmentData.name}</span><i class="segment-icon ${segmentData.iconClass}"></i><span class="segment-buff">${segmentData.buffValue > 0 ? segmentData.buffValue + '% ' + segmentData.buffType : ''}</span><span class="segment-assignment-order" style="font-size:3rem;margin-top:-6px;margin-bottom:5px;"></span>${resistanceHTML}</div>`; segmentDiv.addEventListener('click', () => handleSegmentClick(segmentId)); mapGrid.appendChild(segmentDiv);
        }
    }

    // --- Panzoom Initialization ---
    const panzoom = Panzoom(mapGrid, { maxScale: 5, minScale: 0.3, contain: 'outside', canvas: true, cursor: 'grab', step: 0.3 });
    mapContainer.addEventListener('wheel', panzoom.zoomWithWheel);
    function centerOnG7() { /* ... no changes ... */
        const g7Element = mapGrid.querySelector('[data-id="G7"]'); if (!g7Element) return; const mapRect = mapContainer.getBoundingClientRect(); const elementWidth = g7Element.offsetWidth; const elementHeight = g7Element.offsetHeight; const initialZoom = 0.8; panzoom.zoom(initialZoom, { animate: false }); const zoomedElementWidth = elementWidth * initialZoom; const zoomedElementHeight = elementHeight * initialZoom; const zoomedG7CenterX = (g7Element.offsetLeft * initialZoom) + zoomedElementWidth / 2; const zoomedG7CenterY = (g7Element.offsetTop * initialZoom) + zoomedElementHeight / 2; const finalPanX = (mapRect.width / 2) - zoomedG7CenterX; const finalPanY = (mapRect.height / 2) - zoomedG7CenterY; panzoom.pan(finalPanX, finalPanY, { animate: false, force: true });
    }
    setTimeout(centerOnG7, 150);

    // --- Event Handlers & Logic ---

    function updateSegmentOrderDisplay(segmentId, orderNumber) { /* ... no changes ... */
        const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"] .segment-assignment-order`);
        if (segmentElement) segmentElement.textContent = orderNumber !== null ? orderNumber : '';
    }

    // Helper to recalculate an alliance's counter based on its orderedAssignments list
    function recalculateAllianceCounter(allianceCode) {
        if (!alliances[allianceCode]) return;
        const alliance = alliances[allianceCode];
        if (alliance.orderedAssignments.length === 0) {
            alliance.assignmentCounter = 0;
        } else {
            // Find the maximum order number currently in the list
            const maxOrder = Math.max(...alliance.orderedAssignments.map(item => item.order));
            alliance.assignmentCounter = maxOrder;
        }
    }

    function handleSegmentClick(segmentId) { /* ... no changes needed in modal setup ... */
        const segmentData = landData[segmentId]; if (segmentData.isFixed) return; currentSegmentId = segmentId; modalSegmentIdSpan.textContent = segmentId; modalSegmentNameSpan.textContent = segmentData.name; modalSegmentLevelSpan.textContent = segmentData.level; modalSegmentBuffSpan.textContent = `${segmentData.buffValue > 0 ? segmentData.buffValue + '% ' + segmentData.buffType : 'None'}`; let prodText = ''; if (segmentData.coalPerHour > 0) prodText += `<span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Coal Per Hour">CPH: </span><span class="resource-value">${segmentData.coalPerHour.toLocaleString()}</span> `; if (segmentData.rareSoilPerHour > 0) prodText += `<span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Rare Soil Per Hour">RSPH: </span><span class="resource-value">${segmentData.rareSoilPerHour.toLocaleString()}</span>`; modalSegmentProdSpan.innerHTML = prodText || 'None'; if (segmentData.type === 'Dig Site' && segmentData.resistance) { modalSegmentResistanceSpan.textContent = segmentData.resistance.toLocaleString(); modalSegmentResistanceSpan.closest('p').style.display = 'block'; } else { modalSegmentResistanceSpan.textContent = 'N/A'; modalSegmentResistanceSpan.closest('p').style.display = 'none'; } const modalPopoverTriggerList = modalElement.querySelectorAll('[data-bs-toggle="popover"]'); modalPopoverTriggerList.forEach(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl)); allianceButtonsDiv.innerHTML = ''; Object.entries(alliances).forEach(([code, data]) => { const button = document.createElement('button'); button.type = 'button'; button.classList.add('btn', 'btn-sm', 'w-100'); button.style.backgroundColor = data.color; button.style.color = '#fff'; button.textContent = `Assign to ${data.name}`; button.dataset.allianceCode = code; let disabledReason = null; if (segmentData.owner === code) disabledReason = ` (Already Owned)`; else if (segmentData.type === 'City' && data.cityCount >= data.cityLimit) disabledReason = ` (Limit: ${data.cityCount}/${data.cityLimit} Cities)`; else if (segmentData.type === 'Dig Site' && data.digSiteCount >= data.digSiteLimit) disabledReason = ` (Limit: ${data.digSiteCount}/${data.digSiteLimit} Digs)`; if (disabledReason) { button.disabled = true; button.textContent += disabledReason; button.style.opacity = '0.65'; button.style.cursor = 'not-allowed'; } else { button.addEventListener('click', () => handleAllianceSelection(code)); } allianceButtonsDiv.appendChild(button); }); clearAllianceButton.onclick = () => handleAllianceSelection(null); allianceSelectModal.show();
    }

    function handleAllianceSelection(allianceCode) {
        if (!currentSegmentId || landData[currentSegmentId].isFixed) return;
        const segmentData = landData[currentSegmentId];
        const segmentElement = mapGrid.querySelector(`[data-id="${currentSegmentId}"]`);
        const previousOwner = segmentData.owner;
        const previousOrder = segmentData.assignmentOrder; // Store previous order
        let assignmentChanged = false;

        // Check limits if assigning a new alliance
        if (allianceCode && allianceCode !== previousOwner) {
             const alliance = alliances[allianceCode];
             if (segmentData.type === 'City' && alliance.cityCount >= alliance.cityLimit) { alert(`${alliance.name} City limit reached.`); return; }
             if (segmentData.type === 'Dig Site' && alliance.digSiteCount >= alliance.digSiteLimit) { alert(`${alliance.name} Dig Site limit reached.`); return; }
        }

        // --- Handle Previous Owner ---
        if (previousOwner && previousOwner !== allianceCode) {
            const prevAlliance = alliances[previousOwner];
            // Decrement building counts
            if (segmentData.type === 'City') prevAlliance.cityCount--;
            else if (segmentData.type === 'Dig Site') prevAlliance.digSiteCount--;
            // Remove CSS class
            if (segmentElement) segmentElement.classList.remove(prevAlliance.cssClass);

            // Remove from previous alliance's ordered list and update its counter
            if (previousOrder !== null) {
                 const assignmentIndex = prevAlliance.orderedAssignments.findIndex(item => item.segmentId === currentSegmentId);
                 if (assignmentIndex > -1) {
                     prevAlliance.orderedAssignments.splice(assignmentIndex, 1);
                 }
                 recalculateAllianceCounter(previousOwner); // Recalculate counter for previous owner
            }
            assignmentChanged = true;
        }

        // --- Handle New Owner ---
        if (allianceCode && allianceCode !== previousOwner) {
            const newAlliance = alliances[allianceCode];
            segmentData.owner = allianceCode;
            // Increment building counts
            if (segmentData.type === 'City') newAlliance.cityCount++;
            else if (segmentData.type === 'Dig Site') newAlliance.digSiteCount++;
            // Add CSS class
            if (segmentElement) segmentElement.classList.add(newAlliance.cssClass);

            // Assign new sequence number from the specific alliance's counter
            newAlliance.assignmentCounter++;
            const newOrder = newAlliance.assignmentCounter;
            segmentData.assignmentOrder = newOrder;
            // Add to new alliance's ordered list
            newAlliance.orderedAssignments.push({ segmentId: currentSegmentId, order: newOrder });
            // Sort the list (optional, but helps if needed later)
            // newAlliance.orderedAssignments.sort((a, b) => a.order - b.order);

            updateSegmentOrderDisplay(currentSegmentId, newOrder);
            assignmentChanged = true;

        } else if (allianceCode === null && previousOwner !== null) {
            // Clearing assignment
            segmentData.owner = null;
            segmentData.assignmentOrder = null; // Order already removed during previous owner handling
            updateSegmentOrderDisplay(currentSegmentId, null);
            // assignmentChanged is already true
        }

        // Only update summary and save state if an actual change occurred
        if (assignmentChanged) {
            updateAllianceSummary();
            saveState();
        }

        allianceSelectModal.hide();
        currentSegmentId = null;
    }

    // --- Clear All Assignments Function ---
    function clearAllAssignments() {
        if (!confirm("Are you sure you want to clear ALL user-assigned segments? Fixed assignments might be cleared if the toggle is off.")) {
             return;
        }

        // Reset ALL per-alliance counters and lists
        for (const code in alliances) {
            alliances[code].cityCount = 0;
            alliances[code].digSiteCount = 0;
            alliances[code].assignmentCounter = 0; // Reset counter
            alliances[code].orderedAssignments = []; // Clear list
        }

        // Iterate through segments
        for (const segmentId in landData) {
            const segmentData = landData[segmentId];
            const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);

            // Clear assignment order display and data
            segmentData.assignmentOrder = null;
            updateSegmentOrderDisplay(segmentId, null);

            // Handle non-fixed segments: clear owner and class
            if (segmentData.owner && !segmentData.isFixed) {
                const alliance = alliances[segmentData.owner];
                if(alliance && segmentElement) segmentElement.classList.remove(alliance.cssClass);
                segmentData.owner = null;
            }
            // Handle fixed segments
            else if (segmentData.isFixed) {
                 if (fixedAlliancesActive && FIXED_ASSIGNMENTS[segmentId]) {
                     const fixedOwnerCode = FIXED_ASSIGNMENTS[segmentId];
                     const alliance = alliances[fixedOwnerCode];
                     if (alliance) {
                         segmentData.owner = fixedOwnerCode;
                         if (segmentData.type === 'City') alliance.cityCount++;
                         else if (segmentData.type === 'Dig Site') alliance.digSiteCount++;
                         if(segmentElement && !segmentElement.classList.contains(alliance.cssClass)) segmentElement.classList.add(alliance.cssClass);
                     }
                 } else {
                     if (segmentData.owner && segmentElement) Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));
                     segmentData.owner = null;
                 }
            }
             else { // Segment has no owner and is not fixed
                   if(segmentElement) Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));
                   segmentData.owner = null;
             }
        }

        updateAllianceSummary();
        saveState();
        console.log("All assignments cleared. Per-alliance order reset.");
    }
    clearAllButton.addEventListener('click', clearAllAssignments);


    // --- Toggle Fixed Alliances Function ---
    function toggleFixedAlliances(isActive) {
        fixedAlliancesActive = isActive;

        for (const segmentId in FIXED_ASSIGNMENTS) {
            if (landData[segmentId]) {
                const segmentData = landData[segmentId];
                const allianceCode = FIXED_ASSIGNMENTS[segmentId]; // The intended fixed owner
                const alliance = alliances[allianceCode];
                const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);
                const previousOwner = segmentData.owner; // Current owner before toggle
                const previousOrder = segmentData.assignmentOrder;

                if (isActive) {
                    // If activating fixed and segment is unowned OR owned by someone else
                    if (previousOwner !== allianceCode) {
                        // If previously owned by a user alliance, remove that assignment properly
                        if(previousOwner && alliances[previousOwner] && !segmentData.isFixed) { // Check it wasn't already fixed
                             const prevAlliance = alliances[previousOwner];
                             if (segmentData.type === 'City') prevAlliance.cityCount--;
                             else if (segmentData.type === 'Dig Site') prevAlliance.digSiteCount--;
                             if (segmentElement) segmentElement.classList.remove(prevAlliance.cssClass);

                             // Remove from previous alliance's ordered list and update its counter
                             if (previousOrder !== null) {
                                  const assignmentIndex = prevAlliance.orderedAssignments.findIndex(item => item.segmentId === segmentId);
                                  if (assignmentIndex > -1) prevAlliance.orderedAssignments.splice(assignmentIndex, 1);
                                  recalculateAllianceCounter(previousOwner);
                             }
                             segmentData.assignmentOrder = null; // Clear order data
                             updateSegmentOrderDisplay(segmentId, null); // Clear order display
                        }
                        // Assign fixed owner
                        segmentData.owner = allianceCode;
                        if (alliance) {
                             if (segmentData.type === 'City') alliance.cityCount++;
                             else if (segmentData.type === 'Dig Site') alliance.digSiteCount++;
                             if (segmentElement) segmentElement.classList.add(alliance.cssClass);
                        }
                    }
                } else {
                    // Deactivating fixed: Only remove if it IS the fixed owner
                     if (previousOwner === allianceCode) {
                         segmentData.owner = null;
                         if (alliance) {
                             if (segmentData.type === 'City') alliance.cityCount--;
                             else if (segmentData.type === 'Dig Site') alliance.digSiteCount--;
                             if (segmentElement) segmentElement.classList.remove(alliance.cssClass);
                         }
                     }
                 }
            }
        }
        updateAllianceSummary();
        saveState();
    }
    fixedAllianceToggle.addEventListener('change', (event) => toggleFixedAlliances(event.target.checked));

    // --- Toggle Assignment Order View Function ---
    function toggleAssignmentOrderView(isActive) { /* ... no changes ... */
        assignmentOrderActive = isActive;
        if (isActive) bodyElement.classList.add('assignment-order-active');
        else bodyElement.classList.remove('assignment-order-active');
        saveState();
    }
    assignmentOrderToggle.addEventListener('change', (event) => toggleAssignmentOrderView(event.target.checked));


    function calculateAllianceBuffs() { /* ... no changes ... */
        for (const code in alliances) { alliances[code].buffs = {}; }
        for (const segmentId in landData) { const segment = landData[segmentId]; if (segment.owner && alliances[segment.owner]) { const alliance = alliances[segment.owner]; const buffType = segment.buffType; const buffValue = segment.buffValue; if (buffValue > 0 && buffType) { if (!alliance.buffs[buffType]) alliance.buffs[buffType] = 0; alliance.buffs[buffType] += buffValue; } } }
    }
    function calculateAllianceResources() { /* ... no changes ... */
        for (const code in alliances) { alliances[code].totalCPH = 0; alliances[code].totalRSPH = 0; }
        for (const segmentId in landData) { const segment = landData[segmentId]; if (segment.owner && alliances[segment.owner]) { alliances[segment.owner].totalCPH += segment.coalPerHour || 0; alliances[segment.owner].totalRSPH += segment.rareSoilPerHour || 0; } }
    }
    function initializePopovers() { /* ... no changes ... */
        popoverTriggerList.forEach(p => p.dispose()); const newPopoverTriggerList = summaryItemContainer.querySelectorAll('[data-bs-toggle="popover"]'); popoverTriggerList = [...newPopoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
    }
    function updateAllianceSummary() { /* ... no changes ... */
        calculateAllianceBuffs(); calculateAllianceResources(); summaryItemContainer.innerHTML = ''; Object.entries(alliances).forEach(([code, data]) => { const itemDiv = document.createElement('div'); itemDiv.classList.add('summary-item'); const headerDiv = document.createElement('div'); headerDiv.classList.add('summary-header'); headerDiv.innerHTML = `<span class="summary-color-dot" style="background-color: ${data.color};"></span><span class="summary-alliance-name">${data.name}</span>`; const resourcesDiv = document.createElement('div'); resourcesDiv.classList.add('summary-resources'); resourcesDiv.innerHTML = `<span><span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Coal Per Hour">Cph</span><span class="resource-value">${data.totalCPH.toLocaleString() || 0}</span></span> | <span><span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Rare Soil Per Hour">RSph</span><span class="resource-value">${data.totalRSPH.toLocaleString() || 0}</span></span>`; const countsDiv = document.createElement('div'); countsDiv.classList.add('summary-counts'); countsDiv.innerHTML = `Cities: ${data.cityCount}/${data.cityLimit} | Digs: ${data.digSiteCount}/${data.digSiteLimit}`; const buffsUl = document.createElement('ul'); buffsUl.classList.add('summary-buffs-list'); const sortedBuffTypes = ALL_BUFF_TYPES.filter(buffType => data.buffs[buffType] > 0); sortedBuffTypes.forEach(buffType => { const buffValue = data.buffs[buffType] || 0; const iconClass = getIconClass(buffType); const buffLi = document.createElement('li'); buffLi.innerHTML = `<i class="${iconClass}"></i><span class="buff-name">${buffType}</span><span class="buff-value">${buffValue}%</span>`; buffsUl.appendChild(buffLi); }); itemDiv.appendChild(headerDiv); itemDiv.appendChild(resourcesDiv); itemDiv.appendChild(countsDiv); itemDiv.appendChild(buffsUl); summaryItemContainer.appendChild(itemDiv); }); initializePopovers();
    }

    // --- UPDATED Save State ---
    function saveState() {
        const stateToSave = {
             assignments: {},
             fixedActive: fixedAlliancesActive,
             assignmentOrderViewActive: assignmentOrderActive,
             // No need to save per-alliance counters, reconstruct from assignments
        };
        // Save assignments with owner and order
        for (const segmentId in landData) {
            if (landData[segmentId].owner && !landData[segmentId].isFixed && landData[segmentId].assignmentOrder !== null) {
                 stateToSave.assignments[segmentId] = {
                      owner: landData[segmentId].owner,
                      order: landData[segmentId].assignmentOrder
                 };
            }
        }
        localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
    }

    // --- UPDATED Initialize Map State ---
     function initializeMapState() {
         // 1. Load Saved State
         const savedStateRaw = localStorage.getItem(SAVE_KEY);
         let parsedState = { assignments: {}, fixedActive: true, assignmentOrderViewActive: false }; // Default structure

         if (savedStateRaw) {
              try {
                   const loaded = JSON.parse(savedStateRaw);
                   // Validate structure
                   if (loaded && typeof loaded.assignments === 'object' &&
                       typeof loaded.fixedActive === 'boolean' &&
                       typeof loaded.assignmentOrderViewActive === 'boolean') {
                        parsedState = loaded;
                   } else { console.warn("Invalid saved state structure v5, using defaults."); localStorage.removeItem(SAVE_KEY); }
              } catch (e) { console.error("Failed to parse saved state v5, using defaults.", e); localStorage.removeItem(SAVE_KEY); }
         }

         // Set toggle states
         fixedAlliancesActive = parsedState.fixedActive;
         fixedAllianceToggle.checked = fixedAlliancesActive;
         assignmentOrderActive = parsedState.assignmentOrderViewActive;
         assignmentOrderToggle.checked = assignmentOrderActive;
         if (assignmentOrderActive) bodyElement.classList.add('assignment-order-active');
         else bodyElement.classList.remove('assignment-order-active');

         // 2. Reset runtime states (counts, per-alliance lists/counters)
         for (const code in alliances) {
             alliances[code].cityCount = 0; alliances[code].digSiteCount = 0; alliances[code].buffs = {}; alliances[code].totalCPH = 0; alliances[code].totalRSPH = 0;
             alliances[code].assignmentCounter = 0; // Reset counter
             alliances[code].orderedAssignments = []; // Reset list
         }
         for (const segmentId in landData) { // Reset segment data
              landData[segmentId].owner = null;
              landData[segmentId].assignmentOrder = null;
              updateSegmentOrderDisplay(segmentId, null); // Clear display
              const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);
              if (segmentElement) Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));
         }

        // 3. Apply fixed assignments IF ACTIVE
        if (fixedAlliancesActive) {
            for (const segmentId in FIXED_ASSIGNMENTS) { /* ... apply fixed assignments ... */
                 if (landData[segmentId]) { const segmentData = landData[segmentId]; const allianceCode = FIXED_ASSIGNMENTS[segmentId]; const alliance = alliances[allianceCode]; const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`); let canAssignFixed = false; if (segmentData.type === 'City') { if (alliance.cityCount < alliance.cityLimit) { alliance.cityCount++; canAssignFixed = true; } } else if (segmentData.type === 'Dig Site') { if (alliance.digSiteCount < alliance.digSiteLimit) { alliance.digSiteCount++; canAssignFixed = true; } } if(canAssignFixed) { segmentData.owner = allianceCode; if(segmentElement && alliance) segmentElement.classList.add(alliance.cssClass); } else { console.warn(`Init conflict: Limit fixed ${allianceCode} at ${segmentId}.`); } }
            }
        }

        // 4. Load saved USER assignments & reconstruct per-alliance state
        const maxOrderPerAlliance = {}; // Track max order found for each alliance during load

        // Sort saved assignments by order before processing
        const sortedAssignments = Object.entries(parsedState.assignments)
            .filter(([id, data]) => data && typeof data.order === 'number' && data.owner) // Ensure valid data
            .sort(([, a], [, b]) => a.order - b.order);

        sortedAssignments.forEach(([segmentId, assignmentData]) => {
            if (landData[segmentId] && !landData[segmentId].isFixed && alliances[assignmentData.owner]) {
                 const segmentData = landData[segmentId];
                 const allianceCode = assignmentData.owner;
                 const alliance = alliances[allianceCode];
                 const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);
                 const order = assignmentData.order;

                 // Check limits
                 let canAssignUser = false;
                 if (segmentData.type === 'City') { if (alliance.cityCount < alliance.cityLimit) { alliance.cityCount++; canAssignUser = true; } }
                 else if (segmentData.type === 'Dig Site') { if (alliance.digSiteCount < alliance.digSiteLimit) { alliance.digSiteCount++; canAssignUser = true; } }

                 if (canAssignUser) {
                     segmentData.owner = allianceCode;
                     segmentData.assignmentOrder = order;
                     updateSegmentOrderDisplay(segmentId, order); // Update display
                     if (segmentElement) segmentElement.classList.add(alliance.cssClass);

                     // Reconstruct per-alliance list
                     alliance.orderedAssignments.push({ segmentId: segmentId, order: order });

                     // Track max order for this alliance
                     if (!maxOrderPerAlliance[allianceCode] || order > maxOrderPerAlliance[allianceCode]) {
                         maxOrderPerAlliance[allianceCode] = order;
                     }
                 } else { /* ... handle load conflict ... */
                      console.warn(`Load conflict: Limit ${allianceCode} at ${segmentId}. Saved ignored.`); segmentData.owner = null; segmentData.assignmentOrder = null; updateSegmentOrderDisplay(segmentId, null); if(segmentElement) Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));
                 }
            }
        });

        // Set final per-alliance counters after loading all assignments
        for (const code in alliances) {
            alliances[code].assignmentCounter = maxOrderPerAlliance[code] || 0;
            // Optional: Sort the reconstructed lists if order matters internally
            // alliances[code].orderedAssignments.sort((a, b) => a.order - b.order);
        }

        // 5. Final summary update
        updateAllianceSummary();
    }


    // --- Sidebar Toggle Logic ---
    function setSidebarState(isActive) { /* ... no changes ... */
        if(isActive) { bodyElement.classList.add('sidebar-active'); allianceSummaryDiv.classList.remove('sidebar-collapsed'); sidebarToggleBtn.title = "Hide Alliance Summary"; } else { bodyElement.classList.remove('sidebar-active'); allianceSummaryDiv.classList.add('sidebar-collapsed'); sidebarToggleBtn.title = "Show Alliance Summary"; } requestAnimationFrame(() => { setTimeout(() => { panzoom.resize(); }, 350); });
    }
    sidebarToggleBtn.addEventListener('click', () => { /* ... no changes ... */
        const currentlyActive = bodyElement.classList.contains('sidebar-active'); setSidebarState(!currentlyActive); if (window.matchMedia('(max-width: 992px)').matches) { if (!currentlyActive) { bodyElement.classList.add('sidebar-force-active'); } else { bodyElement.classList.remove('sidebar-force-active'); } }
    });
    const mediaQuery = window.matchMedia('(max-width: 992px)');
    function handleMobileChange(e) { /* ... no changes ... */
        if (!bodyElement.classList.contains('sidebar-force-active')) { setSidebarState(!e.matches); }
    }
    mediaQuery.addEventListener('change', handleMobileChange);

    // --- Initial Load ---
    initializeMapState();
    if (!bodyElement.classList.contains('sidebar-force-active')) { handleMobileChange(mediaQuery); }


}); // End DOMContentLoaded
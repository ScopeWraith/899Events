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

    // *** Boss Type Mapping ***
    const bossTypeMapping = {
        A1: 'Missile', A3: 'Tank', A5: 'Air', A7: 'Missile', A9: 'Tank', A11: 'Air', A13: 'Missile',
        B2: 'Tank', B4: 'Air', B6: 'Missile', B8: 'Tank', B10: 'Air', B12: 'Missile',
        C1: 'Air', C3: 'Missile', C5: 'Tank', C7: 'Air', C9: 'Missile', C11: 'Tank', C13: 'Air',
        D2: 'Missile', D4: 'Tank', D6: 'Air', D8: 'Missile', D10: 'Tank', D12: 'Air',
        E1: 'Tank', E3: 'Air', E5: 'Missile', E7: 'Tank', E9: 'Air', E11: 'Missile', E13: 'Tank',
        F2: 'Air', F4: 'Missile', F6: 'Tank', F8: 'Air', F10: 'Missile', F12: 'Tank',
        G1: 'Missile', G3: 'Tank', G5: 'Air', /* G7: 'Missile', */ G9: 'Tank', G11: 'Air', G13: 'Missile', // Commented out G7 as it's Capitol
        H2: 'Tank', H4: 'Air', H6: 'Missile', H8: 'Tank', H10: 'Air', H12: 'Missile',
        I1: 'Air', I3: 'Missile', I5: 'Tank', I7: 'Air', I9: 'Missile', I11: 'Tank', I13: 'Air',
        J2: 'Missile', J4: 'Tank', J6: 'Air', J8: 'Missile', J10: 'Tank', J12: 'Air',
        K1: 'Tank', K3: 'Air', K5: 'Missile', K7: 'Tank', K9: 'Air', K11: 'Missile', K13: 'Tank',
        L2: 'Air', L4: 'Missile', L6: 'Tank', L8: 'Air', L10: 'Missile', L12: 'Tank',
        M1: 'Missile', M3: 'Tank', M5: 'Air', M7: 'Missile', M9: 'Tank', M11: 'Air', M13: 'Missile'
    };

    const SAVE_KEY = 'allianceMapState_v5'; // Keep save key consistent unless structure changes drastically

    // --- State Variables ---
    let fixedAlliancesActive = true;
    let assignmentOrderActive = false;

    function getIconClass(buffType) {
        switch (buffType.toLowerCase()) {
            case 'coin': return 'fa-solid fa-coins'; case 'iron': return 'fa-solid fa-mound'; case 'food': return 'fa-solid fa-bread-slice'; case 'gathering': return 'fa-solid fa-tractor'; case 'healing': return 'fa-solid fa-bandage'; case 'construction': return 'fa-solid fa-hammer'; case 'march speed': return 'fa-solid fa-truck-fast'; case 'training': return 'fa-solid fa-shield-halved'; case 'research': return 'fa-solid fa-flask-vial'; default: return 'fa-solid fa-question-circle';
        }
    }

    // Parse data
    landDataInput.forEach(item => {
        const parts = item.split(': '); const id = parts[0]; const details = parts[1];
        let level = 0, name = '', buffValue = 0, buffType = '', type = 'Other'; let coalPerHour = 0, rareSoilPerHour = 0, resistance = null;
        let bossType = null, bossIcon = null; // *** Initialize boss variables ***

        if (id === 'G7') { level = 'N/A'; name = 'Capitol'; type = 'City'; const bm = details.match(/(\d+)% (.*)/); if (bm) { buffValue = parseInt(bm[1], 10); buffType = bm[2]; } rareSoilPerHour = citySoilProduction; }
        else { const lm = details.match(/Level (\d+)/); if (lm) level = parseInt(lm[1], 10); const nameMatch = details.match(/Level \d+ ([\w\s]+?)(?: \d+%|\s*$)/); if (nameMatch) name = nameMatch[1].trim(); else name = 'Unknown'; const bm = details.match(/(\d+)% (.*)/); if (bm) { buffValue = parseInt(bm[1], 10); buffType = bm[2]; } if (name.includes('Dig Site')) type = 'Dig Site'; else if (cityTypes.some(city => name.includes(city))) type = 'City'; else type = 'Other'; if (type === 'Dig Site' && digSiteProduction[level]) { coalPerHour = digSiteProduction[level].coal; rareSoilPerHour = digSiteProduction[level].soil; resistance = digSiteResistance[level] || null; } else if (type === 'City' && level >= 1 && level <= 6) { rareSoilPerHour = citySoilProduction; } }

        // *** Check for boss type if it's a Dig Site ***
        if (type === 'Dig Site' && bossTypeMapping[id]) {
            bossType = bossTypeMapping[id];
            // Assuming icons are named like 'S2Map.missile.png', 'S2Map.tank.png', etc.
            bossIcon = `S2Map.${bossType.toLowerCase()}.png`; // Construct icon filename
        }

        const isFixed = FIXED_ASSIGNMENTS.hasOwnProperty(id);
        landData[id] = { id, level, name, type, buffValue, buffType, iconClass: getIconClass(buffType), owner: null, isFixed, coalPerHour, rareSoilPerHour, resistance, assignmentOrder: null, bossType, bossIcon }; // *** Added bossType and bossIcon ***
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
    const modalSegmentBossSpan = document.getElementById('modalSegmentBoss'); // <-- Get Boss Span
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
        for (let c = 1; c <= 13; c++) {
            const segmentId = rows[r] + c;
            const segmentData = landData[segmentId];
            if (!segmentData) continue;

            const segmentDiv = document.createElement('div');
            segmentDiv.classList.add('map-segment');
            segmentDiv.dataset.id = segmentId;

            const centerRow = 6, centerCol = 6;
            const ringLevel = Math.max(Math.abs(r - centerRow), Math.abs(c - 1 - centerCol));
            if (ringLevel > 0) segmentDiv.classList.add(`ring-${ringLevel}`);
            if (segmentData.type === 'City') segmentDiv.classList.add('city');
            if (segmentData.isFixed) segmentDiv.classList.add('fixed-assignment');

            let resistanceHTML = '';
            if (segmentData.type === 'Dig Site' && segmentData.resistance) {
                resistanceHTML = `<span class="segment-resistance">Res: ${segmentData.resistance.toLocaleString()}</span>`;
            }

            // Generate base inner HTML
            segmentDiv.innerHTML = `
                <span class="segment-label">${segmentId}</span>
                <span class="segment-level">Level ${segmentData.level}</span>
                <div class="segment-content">
                    <span class="segment-name">${segmentData.name}</span>
                    <i class="segment-icon ${segmentData.iconClass}"></i>
                    <span class="segment-buff">${segmentData.buffValue > 0 ? segmentData.buffValue + '% ' + segmentData.buffType : ''}</span>
                    <span class="segment-assignment-order" style="font-size:3rem; margin-top:-4px;margin-bottom:3px;"></span>
                    ${resistanceHTML}
                </div>
            `;

            // *** Add Boss Icon if applicable ***
            if (segmentData.bossIcon) {
                const bossIconImg = document.createElement('img');
                bossIconImg.src = segmentData.bossIcon;
                bossIconImg.alt = segmentData.bossType ? `${segmentData.bossType} Boss` : 'Boss Icon';
                bossIconImg.classList.add('segment-boss-icon');
                bossIconImg.setAttribute('title', `${segmentData.bossType} Boss`); // Add tooltip
                segmentDiv.appendChild(bossIconImg); // Append the icon to the segment div
            }

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

    function updateSegmentOrderDisplay(segmentId, orderNumber) {
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
            // Find the maximum order number currently assigned within this alliance
            const maxOrder = Math.max(0, ...alliance.orderedAssignments.map(item => item.order)); // Use 0 if empty
            alliance.assignmentCounter = maxOrder;
        }
    }


    function handleSegmentClick(segmentId) {
        const segmentData = landData[segmentId]; if (segmentData.isFixed && fixedAlliancesActive) return; // Prevent modal for fixed if toggle is on

        currentSegmentId = segmentId;
        modalSegmentIdSpan.textContent = segmentId;
        modalSegmentNameSpan.textContent = segmentData.name;
        modalSegmentLevelSpan.textContent = segmentData.level;
        modalSegmentBuffSpan.textContent = `${segmentData.buffValue > 0 ? segmentData.buffValue + '% ' + segmentData.buffType : 'None'}`;

        let prodText = '';
        if (segmentData.coalPerHour > 0) prodText += `<span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Coal Per Hour">CPH: </span><span class="resource-value">${segmentData.coalPerHour.toLocaleString()}</span> `;
        if (segmentData.rareSoilPerHour > 0) prodText += `<span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Rare Soil Per Hour">RSPH: </span><span class="resource-value">${segmentData.rareSoilPerHour.toLocaleString()}</span>`;
        modalSegmentProdSpan.innerHTML = prodText || 'None';

        if (segmentData.type === 'Dig Site' && segmentData.resistance) {
            modalSegmentResistanceSpan.textContent = segmentData.resistance.toLocaleString();
            modalSegmentResistanceSpan.closest('p').style.display = 'block';
        } else {
            modalSegmentResistanceSpan.textContent = 'N/A';
            modalSegmentResistanceSpan.closest('p').style.display = 'none';
        }

        // --- Populate Boss Info ---
        const bossInfoP = modalSegmentBossSpan.closest('p'); // Get the parent <p>
        if (segmentData.bossType && segmentData.type === 'Dig Site') { // Check if it's a Dig Site with a boss
            let bossHtml = '';
            if (segmentData.bossIcon) {
                // Display a small icon in the modal
                bossHtml += `<img src="${segmentData.bossIcon}" alt="${segmentData.bossType} Boss" style="width: 18px; height: 18px; vertical-align: text-bottom; margin-right: 5px;">`;
            }
            bossHtml += segmentData.bossType; // Add the text name
            modalSegmentBossSpan.innerHTML = bossHtml;
            bossInfoP.style.display = 'block'; // Show the paragraph
        } else {
            modalSegmentBossSpan.innerHTML = 'N/A'; // Set default text
            bossInfoP.style.display = 'none'; // Hide the paragraph if no boss
        }
        // --- End Boss Info ---


        // Initialize popovers within the modal content just added
        const modalPopoverTriggerList = modalElement.querySelectorAll('[data-bs-toggle="popover"]');
        modalPopoverTriggerList.forEach(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));

        // Populate alliance buttons
        allianceButtonsDiv.innerHTML = '';
        Object.entries(alliances).forEach(([code, data]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.classList.add('btn', 'btn-sm', 'w-100');
            button.style.backgroundColor = data.color;
            button.style.color = '#fff'; // Ensure text visibility
            button.textContent = `Assign to ${data.name}`;
            button.dataset.allianceCode = code;

            let disabledReason = null;
            if (segmentData.owner === code) {
                disabledReason = ` (Already Owned)`;
            } else if (segmentData.type === 'City' && data.cityCount >= data.cityLimit) {
                disabledReason = ` (Limit: ${data.cityCount}/${data.cityLimit} Cities)`;
            } else if (segmentData.type === 'Dig Site' && data.digSiteCount >= data.digSiteLimit) {
                disabledReason = ` (Limit: ${data.digSiteCount}/${data.digSiteLimit} Digs)`;
            }

            if (disabledReason) {
                button.disabled = true;
                button.textContent += disabledReason;
                button.style.opacity = '0.65';
                button.style.cursor = 'not-allowed';
            } else {
                button.addEventListener('click', () => handleAllianceSelection(code));
            }
            allianceButtonsDiv.appendChild(button);
        });

        clearAllianceButton.onclick = () => handleAllianceSelection(null);

        allianceSelectModal.show();
    }


    function handleAllianceSelection(allianceCode) {
        if (!currentSegmentId) return;
        const segmentData = landData[currentSegmentId];

        // Prevent changing fixed assignments if the toggle is active
        if (segmentData.isFixed && fixedAlliancesActive) return;

        const segmentElement = mapGrid.querySelector(`[data-id="${currentSegmentId}"]`);
        const previousOwner = segmentData.owner;
        const previousOrder = segmentData.assignmentOrder; // Store previous order for removal logic
        let assignmentChanged = false;

        // Check limits before assigning a *new* alliance
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

            // Remove from previous alliance's ordered list
            if (previousOrder !== null) {
                 const assignmentIndex = prevAlliance.orderedAssignments.findIndex(item => item.segmentId === currentSegmentId);
                 if (assignmentIndex > -1) {
                     prevAlliance.orderedAssignments.splice(assignmentIndex, 1);
                     // DO NOT recalculate counter here yet, wait until all changes are done
                 }
            }
            assignmentChanged = true; // Indicate a change occurred
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
            // Update display
            updateSegmentOrderDisplay(currentSegmentId, newOrder);
            assignmentChanged = true; // Indicate a change occurred

        } else if (allianceCode === null && previousOwner !== null) {
            // Clearing assignment - previous owner logic already handled counts and list removal
            segmentData.owner = null;
            segmentData.assignmentOrder = null;
            updateSegmentOrderDisplay(currentSegmentId, null);
            assignmentChanged = true; // Indicate a change occurred
        }

        // Recalculate counters AFTER all potential owner changes and list modifications are done
        if (previousOwner && previousOwner !== allianceCode) {
            recalculateAllianceCounter(previousOwner);
        }
        if (allianceCode && allianceCode !== previousOwner) {
            // No need to recalculate the new one here, it was just incremented correctly
        } else if (allianceCode === null && previousOwner !== null) {
            // Counter for previous owner already recalculated if needed
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
        const confirmationMessage = fixedAlliancesActive
            ? "Are you sure you want to clear ALL user-assigned segments? Designated War Palace assignments will remain."
            : "Are you sure you want to clear ALL assigned segments? Designated War Palace assignments will ALSO be cleared as the toggle is OFF.";

        if (!confirm(confirmationMessage)) {
             return;
        }

        // Reset alliance counters and lists
        for (const code in alliances) {
            alliances[code].cityCount = 0;
            alliances[code].digSiteCount = 0;
            alliances[code].assignmentCounter = 0;
            alliances[code].orderedAssignments = [];
            // Note: buffs, CPH, RSPH will be recalculated by updateAllianceSummary
        }

        // Process each segment
        for (const segmentId in landData) {
            const segmentData = landData[segmentId];
            const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);
            segmentData.assignmentOrder = null;
            updateSegmentOrderDisplay(segmentId, null);

            // Clear existing owner class regardless of type
            if (segmentData.owner && segmentElement) {
                Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));
            }

            // Reset owner based on fixed status and toggle state
            if (segmentData.isFixed && fixedAlliancesActive && FIXED_ASSIGNMENTS[segmentId]) {
                 // Re-apply fixed assignment if toggle is ON
                 const fixedOwnerCode = FIXED_ASSIGNMENTS[segmentId];
                 const alliance = alliances[fixedOwnerCode];
                 if (alliance) {
                    segmentData.owner = fixedOwnerCode;
                     // Recalculate counts for fixed assignments
                    if (segmentData.type === 'City' && alliance.cityCount < alliance.cityLimit) alliance.cityCount++;
                    else if (segmentData.type === 'Dig Site' && alliance.digSiteCount < alliance.digSiteLimit) alliance.digSiteCount++;
                    else console.warn(`Clear conflict: Limit for fixed ${fixedOwnerCode} at ${segmentId}.`);

                    if(segmentElement) segmentElement.classList.add(alliance.cssClass);
                 } else {
                    segmentData.owner = null; // Should not happen if FIXED_ASSIGNMENTS is correct
                 }
            } else {
                // Clear owner if it's not fixed OR if it is fixed but the toggle is OFF
                segmentData.owner = null;
            }
        }

        // Recalculate counters for any remaining fixed assignments
        Object.keys(alliances).forEach(recalculateAllianceCounter);

        updateAllianceSummary();
        saveState();
        console.log("Assignments cleared based on fixed toggle state.");
    }
    clearAllButton.addEventListener('click', clearAllAssignments);


    // --- Toggle Fixed Alliances Function ---
    function toggleFixedAlliances(isActive) {
        fixedAlliancesActive = isActive;

        for (const segmentId in FIXED_ASSIGNMENTS) {
            if (landData[segmentId]) {
                const segmentData = landData[segmentId];
                const allianceCode = FIXED_ASSIGNMENTS[segmentId]; // The designated fixed owner
                const alliance = alliances[allianceCode];
                const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);
                const currentOwner = segmentData.owner;
                const currentOrder = segmentData.assignmentOrder;

                if (isActive) {
                    // --- Turning Fixed ON ---
                    // If it's not currently owned by the correct fixed alliance
                    if (currentOwner !== allianceCode) {
                        // 1. Remove from previous owner if it had one (and it wasn't the fixed one)
                        if (currentOwner && alliances[currentOwner]) {
                            const prevAlliance = alliances[currentOwner];
                            if (segmentData.type === 'City') prevAlliance.cityCount--;
                            else if (segmentData.type === 'Dig Site') prevAlliance.digSiteCount--;
                            if (segmentElement) segmentElement.classList.remove(prevAlliance.cssClass);

                            // Remove from previous owner's ordered list if it had an order
                            if (currentOrder !== null) {
                                const assignmentIndex = prevAlliance.orderedAssignments.findIndex(item => item.segmentId === segmentId);
                                if (assignmentIndex > -1) prevAlliance.orderedAssignments.splice(assignmentIndex, 1);
                                recalculateAllianceCounter(currentOwner); // Recalculate for the one it left
                            }
                            segmentData.assignmentOrder = null; // Fixed assignments don't get user order numbers
                            updateSegmentOrderDisplay(segmentId, null);
                        }

                        // 2. Assign to the correct fixed alliance (check limits)
                        segmentData.owner = allianceCode;
                        if (alliance) {
                             let canAssignFixed = false;
                             if (segmentData.type === 'City') { if (alliance.cityCount < alliance.cityLimit) { alliance.cityCount++; canAssignFixed = true; } }
                             else if (segmentData.type === 'Dig Site') { if (alliance.digSiteCount < alliance.digSiteLimit) { alliance.digSiteCount++; canAssignFixed = true; } }

                             if (canAssignFixed) {
                                if (segmentElement) segmentElement.classList.add(alliance.cssClass);
                             } else {
                                console.warn(`Toggle ON conflict: Limit for fixed ${allianceCode} at ${segmentId}.`);
                                segmentData.owner = null; // Cannot assign due to limit
                                if(segmentElement) segmentElement.classList.remove(alliance.cssClass); // Ensure class is removed if assignment failed
                             }
                        } else {
                             segmentData.owner = null; // Should not happen
                        }
                    }
                     // Ensure it loses any user-assigned order number if it had one
                    if (segmentData.assignmentOrder !== null) {
                         segmentData.assignmentOrder = null;
                         updateSegmentOrderDisplay(segmentId, null);
                         // The list removal should have happened above if the owner changed
                    }


                } else {
                    // --- Turning Fixed OFF ---
                    // If it's currently owned by the fixed alliance, release it
                    if (currentOwner === allianceCode) {
                        segmentData.owner = null;
                        // Decrement count for the alliance it's leaving
                        if (alliance) {
                            if (segmentData.type === 'City') alliance.cityCount--;
                            else if (segmentData.type === 'Dig Site') alliance.digSiteCount--;
                            if (segmentElement) segmentElement.classList.remove(alliance.cssClass);
                            // Fixed assignments don't have order numbers, so no list removal needed here
                            recalculateAllianceCounter(allianceCode); // Recalculate for the one it left
                        }
                    }
                    // If owned by someone else, or no one, do nothing (it's already user-controlled)
                }
            }
        }
        updateAllianceSummary(); // Recalculate everything after all changes
        saveState();
    }
    fixedAllianceToggle.addEventListener('change', (event) => toggleFixedAlliances(event.target.checked));


    // --- Toggle Assignment Order View Function ---
    function toggleAssignmentOrderView(isActive) {
        assignmentOrderActive = isActive;
        if (isActive) {
            bodyElement.classList.add('assignment-order-active');
        } else {
            bodyElement.classList.remove('assignment-order-active');
        }
        saveState(); // Save the view state preference
    }
    assignmentOrderToggle.addEventListener('change', (event) => toggleAssignmentOrderView(event.target.checked));


    function calculateAllianceBuffs() {
        for (const code in alliances) { alliances[code].buffs = {}; }
        for (const segmentId in landData) { const segment = landData[segmentId]; if (segment.owner && alliances[segment.owner]) { const alliance = alliances[segment.owner]; const buffType = segment.buffType; const buffValue = segment.buffValue; if (buffValue > 0 && buffType) { if (!alliance.buffs[buffType]) alliance.buffs[buffType] = 0; alliance.buffs[buffType] += buffValue; } } }
    }
    function calculateAllianceResources() {
        for (const code in alliances) { alliances[code].totalCPH = 0; alliances[code].totalRSPH = 0; }
        for (const segmentId in landData) { const segment = landData[segmentId]; if (segment.owner && alliances[segment.owner]) { alliances[segment.owner].totalCPH += segment.coalPerHour || 0; alliances[segment.owner].totalRSPH += segment.rareSoilPerHour || 0; } }
    }
    function initializePopovers() {
        // Dispose existing popovers first to avoid memory leaks
        popoverTriggerList.forEach(p => p.dispose());
        // Find new popover triggers in the dynamically generated summary
        const newPopoverTriggerList = summaryItemContainer.querySelectorAll('[data-bs-toggle="popover"]');
        // Initialize new ones
        popoverTriggerList = [...newPopoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
    }
    function updateAllianceSummary() {
        calculateAllianceBuffs();
        calculateAllianceResources();
        summaryItemContainer.innerHTML = ''; // Clear previous summary

        Object.entries(alliances).forEach(([code, data]) => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('summary-item');

            const headerDiv = document.createElement('div');
            headerDiv.classList.add('summary-header');
            headerDiv.innerHTML = `<span class="summary-color-dot" style="background-color: ${data.color};"></span><span class="summary-alliance-name">${data.name}</span>`;

            const resourcesDiv = document.createElement('div');
            resourcesDiv.classList.add('summary-resources');
            resourcesDiv.innerHTML = `<span><span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Coal Per Hour">Cph</span><span class="resource-value">${data.totalCPH.toLocaleString() || 0}</span></span> | <span><span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Rare Soil Per Hour">RSph</span><span class="resource-value">${data.totalRSPH.toLocaleString() || 0}</span></span>`;

            const countsDiv = document.createElement('div');
            countsDiv.classList.add('summary-counts');
            countsDiv.innerHTML = `Cities: ${data.cityCount}/${data.cityLimit} | Digs: ${data.digSiteCount}/${data.digSiteLimit}`;

            const buffsUl = document.createElement('ul');
            buffsUl.classList.add('summary-buffs-list');
            // Filter and sort buffs that the alliance actually has
             const sortedBuffTypes = ALL_BUFF_TYPES.filter(buffType => data.buffs[buffType] > 0);

            sortedBuffTypes.forEach(buffType => {
                const buffValue = data.buffs[buffType] || 0;
                const iconClass = getIconClass(buffType);
                const buffLi = document.createElement('li');
                buffLi.innerHTML = `<i class="${iconClass}"></i><span class="buff-name">${buffType}</span><span class="buff-value">${buffValue}%</span>`;
                buffsUl.appendChild(buffLi);
            });


            itemDiv.appendChild(headerDiv);
            itemDiv.appendChild(resourcesDiv);
            itemDiv.appendChild(countsDiv);
            itemDiv.appendChild(buffsUl);
            summaryItemContainer.appendChild(itemDiv);
        });
        initializePopovers(); // Re-initialize popovers for the new content
    }

    // --- Save State ---
    function saveState() {
        const stateToSave = {
            assignments: {}, // Only save USER assignments (not fixed ones)
            fixedActive: fixedAlliancesActive,
            assignmentOrderViewActive: assignmentOrderActive, // Save view preference
        };

        for (const segmentId in landData) {
            const segmentData = landData[segmentId];
            // Save only if it has an owner, is NOT fixed, AND has an assignment order number
            if (segmentData.owner && !segmentData.isFixed && segmentData.assignmentOrder !== null) {
                stateToSave.assignments[segmentId] = {
                    owner: segmentData.owner,
                    order: segmentData.assignmentOrder
                };
            }
        }
        localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
    }

    // --- Initialize Map State (Load) ---
     function initializeMapState() {
         const savedStateRaw = localStorage.getItem(SAVE_KEY);
         let parsedState = {
             assignments: {},
             fixedActive: true, // Default to true
             assignmentOrderViewActive: false // Default to false
         };

         // Try to parse saved state
         if (savedStateRaw) {
             try {
                 const loaded = JSON.parse(savedStateRaw);
                 // Basic validation of loaded state structure
                 if (loaded && typeof loaded.assignments === 'object' &&
                     typeof loaded.fixedActive === 'boolean' &&
                     typeof loaded.assignmentOrderViewActive === 'boolean') {
                     parsedState = loaded;
                 } else {
                     console.warn(`Invalid saved state structure (v5: ${SAVE_KEY}), using defaults.`);
                     localStorage.removeItem(SAVE_KEY); // Clear invalid state
                 }
             } catch (e) {
                 console.error(`Failed to parse saved state (v5: ${SAVE_KEY}), using defaults.`, e);
                 localStorage.removeItem(SAVE_KEY); // Clear corrupted state
             }
         }

         // Apply loaded/default toggle states
         fixedAlliancesActive = parsedState.fixedActive;
         fixedAllianceToggle.checked = fixedAlliancesActive;
         assignmentOrderActive = parsedState.assignmentOrderViewActive;
         assignmentOrderToggle.checked = assignmentOrderActive;
         if (assignmentOrderActive) bodyElement.classList.add('assignment-order-active');
         else bodyElement.classList.remove('assignment-order-active');


         // --- Reset Counts and Map State ---
         for (const code in alliances) {
             alliances[code].cityCount = 0;
             alliances[code].digSiteCount = 0;
             alliances[code].buffs = {}; // Will be recalculated
             alliances[code].totalCPH = 0; // Will be recalculated
             alliances[code].totalRSPH = 0; // Will be recalculated
             alliances[code].assignmentCounter = 0; // Will be set based on loaded assignments
             alliances[code].orderedAssignments = []; // Will be repopulated
         }
         // Clear visual state from map elements
         for (const segmentId in landData) {
             landData[segmentId].owner = null;
             landData[segmentId].assignmentOrder = null;
             updateSegmentOrderDisplay(segmentId, null);
             const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);
             if (segmentElement) {
                 Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));
             }
         }

         // --- Apply Fixed Assignments (if toggle is active) ---
         if (fixedAlliancesActive) {
             for (const segmentId in FIXED_ASSIGNMENTS) {
                 if (landData[segmentId]) {
                     const segmentData = landData[segmentId];
                     const allianceCode = FIXED_ASSIGNMENTS[segmentId];
                     const alliance = alliances[allianceCode];
                     const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);

                     if (alliance) {
                          let canAssignFixed = false;
                         if (segmentData.type === 'City') { if (alliance.cityCount < alliance.cityLimit) { alliance.cityCount++; canAssignFixed = true; } }
                         else if (segmentData.type === 'Dig Site') { if (alliance.digSiteCount < alliance.digSiteLimit) { alliance.digSiteCount++; canAssignFixed = true; } }

                         if (canAssignFixed) {
                             segmentData.owner = allianceCode;
                             if(segmentElement) segmentElement.classList.add(alliance.cssClass);
                         } else {
                              console.warn(`Init conflict: Limit for fixed ${allianceCode} at ${segmentId}.`);
                         }
                     }
                 }
             }
         }

        // --- Apply Saved User Assignments ---
        const maxOrderPerAlliance = {}; // Track max order number per alliance
        // Sort saved assignments by order number to process them sequentially
        const sortedAssignments = Object.entries(parsedState.assignments)
            .filter(([id, data]) => data && typeof data.order === 'number' && data.owner && landData[id] && !landData[id].isFixed) // Ensure it's a valid, non-fixed assignment
            .sort(([, a], [, b]) => a.order - b.order);

        sortedAssignments.forEach(([segmentId, assignmentData]) => {
             const segmentData = landData[segmentId]; // Already checked it exists
             const allianceCode = assignmentData.owner;
             const alliance = alliances[allianceCode];
             const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);
             const order = assignmentData.order;

             if (alliance && !segmentData.owner) { // Ensure alliance exists and segment isn't already taken (e.g., by a fixed assignment)
                 let canAssignUser = false;
                 if (segmentData.type === 'City') { if (alliance.cityCount < alliance.cityLimit) { alliance.cityCount++; canAssignUser = true; } }
                 else if (segmentData.type === 'Dig Site') { if (alliance.digSiteCount < alliance.digSiteLimit) { alliance.digSiteCount++; canAssignUser = true; } }

                 if (canAssignUser) {
                     segmentData.owner = allianceCode;
                     segmentData.assignmentOrder = order;
                     updateSegmentOrderDisplay(segmentId, order);
                     if (segmentElement) segmentElement.classList.add(alliance.cssClass);
                     // Add to the alliance's ordered list
                     alliance.orderedAssignments.push({ segmentId: segmentId, order: order });
                     // Track the highest order number seen for this alliance
                     if (!maxOrderPerAlliance[allianceCode] || order > maxOrderPerAlliance[allianceCode]) {
                         maxOrderPerAlliance[allianceCode] = order;
                     }
                 } else {
                     console.warn(`Load conflict: Limit reached for ${allianceCode} at ${segmentId}. Saved assignment ignored.`);
                     // Ensure state is clean if assignment failed
                     segmentData.owner = null;
                     segmentData.assignmentOrder = null;
                     updateSegmentOrderDisplay(segmentId, null);
                     if(segmentElement) Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));
                 }
             } else if (alliance && segmentData.owner && segmentData.owner !== allianceCode) {
                 console.warn(`Load conflict: Segment ${segmentId} already owned by ${segmentData.owner} (likely fixed). Saved assignment for ${allianceCode} ignored.`);
             } else if (!alliance) {
                 console.warn(`Load warning: Unknown alliance code "${allianceCode}" found for ${segmentId}. Saved assignment ignored.`);
             }
         });

         // --- Set Alliance Counters ---
         // Set each alliance's counter to the highest order number loaded for it
         for (const code in alliances) {
             alliances[code].assignmentCounter = maxOrderPerAlliance[code] || 0;
         }

         // --- Final Update ---
         updateAllianceSummary(); // Calculate buffs/resources and display summary
         console.log("Map state initialized from saved data (or defaults).");
    }


    // --- Sidebar Toggle Logic ---
    function setSidebarState(isActive) {
        if(isActive) {
            bodyElement.classList.add('sidebar-active');
            allianceSummaryDiv.classList.remove('sidebar-collapsed');
            sidebarToggleBtn.title = "Hide Alliance Summary";
            sidebarToggleBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>'; // Icon indicating collapse
        } else {
            bodyElement.classList.remove('sidebar-active');
            allianceSummaryDiv.classList.add('sidebar-collapsed');
            sidebarToggleBtn.title = "Show Alliance Summary";
            sidebarToggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>'; // Icon indicating expand
        }
        // Allow transition to finish before resizing panzoom
        requestAnimationFrame(() => {
            setTimeout(() => {
                panzoom.resize();
                // Optionally re-center slightly if needed after resize
                // centerOnG7(); // Uncomment if centering is desired after sidebar toggle
            }, 350); // Match transition duration + small buffer
        });
    }
    sidebarToggleBtn.addEventListener('click', () => {
        const currentlyActive = bodyElement.classList.contains('sidebar-active');
        setSidebarState(!currentlyActive);
        // Special handling for mobile overlay behavior
        if (window.matchMedia('(max-width: 992px)').matches) {
            if (!currentlyActive) {
                // If sidebar was just opened on mobile, add force class
                bodyElement.classList.add('sidebar-force-active');
            } else {
                // If sidebar was just closed on mobile, remove force class
                 bodyElement.classList.remove('sidebar-force-active');
            }
        }
    });
    const mediaQuery = window.matchMedia('(max-width: 992px)');
    function handleMobileChange(e) {
        // If the sidebar wasn't forced open by a click on mobile
        if (!bodyElement.classList.contains('sidebar-force-active')) {
            // Automatically hide on mobile, show on desktop
            setSidebarState(!e.matches);
        }
         // If it WAS forced open, leave it open even if screen resizes above threshold temporarily
    }
    mediaQuery.addEventListener('change', handleMobileChange);

    // --- Initial Load ---
    initializeMapState(); // Load saved data and set initial state
    // Set initial sidebar state based on screen size (unless forced open on mobile during load)
    if (!bodyElement.classList.contains('sidebar-force-active')) {
        handleMobileChange(mediaQuery);
    } else {
        // Ensure button icon is correct if forced open on load
         setSidebarState(true);
    }


}); // End DOMContentLoaded
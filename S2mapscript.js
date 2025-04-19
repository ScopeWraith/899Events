/*
 * S2mapscript.js (Modified to adjust initial zoom for mobile vertical visibility)
 *
 * Changes:
 * - Modified the centerOnG7 function to calculate initialZoom based on window.innerHeight.
 * - Updated handleSegmentClick to populate the revamped modal structure.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & Data ---

    // UPDATED: Alliance configuration with new names, cases, colors, and order
    const alliances = {
        aDhD: { name: 'aDhD', color: 'rgba(232, 62, 140, 0.7)', cssClass: 'alliance-adhd-pink', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [], isPinned: false, isCollapsed: false }, // Added state props
        THOR: { name: 'THOR', color: 'rgba(0, 123, 255, 0.7)', cssClass: 'alliance-thor', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [], isPinned: false, isCollapsed: false },
        fAfO: { name: 'fAfO', color: 'rgba(220, 53, 69, 0.7)', cssClass: 'alliance-fafo', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [], isPinned: false, isCollapsed: false },
        HeRa: { name: 'HeRa', color: 'rgba(255, 193, 7, 0.7)', cssClass: 'alliance-hera', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [], isPinned: false, isCollapsed: false },
        COLD: { name: 'COLD', color: 'rgba(23, 162, 184, 0.7)', cssClass: 'alliance-cold', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [], isPinned: false, isCollapsed: false },
        VaLT: { name: 'VaLT', color: 'rgba(108, 117, 125, 0.7)', cssClass: 'alliance-valt', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [], isPinned: false, isCollapsed: false },
        adHD: { name: 'adHD', color: 'rgba(102, 16, 242, 0.7)', cssClass: 'alliance-adhd-purple', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [], isPinned: false, isCollapsed: false },
        BRSL: { name: 'BRSL', color: 'rgba(40, 167, 69, 0.7)', cssClass: 'alliance-brsl', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [], isPinned: false, isCollapsed: false },
        Tone: { name: 'Tone', color: 'rgba(253, 126, 20, 0.7)', cssClass: 'alliance-tone', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [], isPinned: false, isCollapsed: false },
        MINI: { name: 'MINI', color: 'rgba(0, 210, 180, 0.7)', cssClass: 'alliance-mini', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [], isPinned: false, isCollapsed: false },
        yi6r: { name: 'yi6r', color: 'rgba(200, 200, 200, 0.7)', cssClass: 'alliance-yi6r', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [], isPinned: false, isCollapsed: false },
    };

    // NEW: Define the desired display order for the summary
    const allianceDisplayOrder = ['aDhD', 'THOR', 'fAfO', 'HeRa', 'COLD', 'VaLT', 'adHD', 'BRSL', 'Tone', 'MINI', 'yi6r'];
    const digSiteProduction = { 1: { coal: 2736, soil: 100 }, 2: { coal: 2880, soil: 110 }, 3: { coal: 3024, soil: 120 }, 4: { coal: 3168, soil: 130 }, 5: { coal: 3312, soil: 140 }, 6: { coal: 3456, soil: 150 } };
    const citySoilProduction = 350;
    const digSiteResistance = { 1: 3500, 2: 6000, 3: 8000, 4: 9500, 5: 10000, 6: 10500 };
    const ALL_BUFF_TYPES = ['Coin', 'Food', 'Iron', 'Gathering', 'March Speed', 'Construction', 'Research', 'Training', 'Healing'];

    // UPDATED: Fixed assignments with correct alliance casing
    const FIXED_ASSIGNMENTS = { 'G6': 'THOR', 'F7': 'COLD', 'G8': 'fAfO', 'H7': 'aDhD' };

    const landDataInput = [ /* ... Same land data input array ... */ // Shortened for brevity
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
    const bossTypeMapping = { /* ... Same boss mapping ... */ // Shortened for brevity
        A1: 'Missile', A3: 'Tank', A5: 'Air', A7: 'Missile', A9: 'Tank', A11: 'Air', A13: 'Missile',
        B2: 'Tank', B4: 'Air', B6: 'Missile', B8: 'Tank', B10: 'Air', B12: 'Missile',
        C1: 'Air', C3: 'Missile', C5: 'Tank', C7: 'Air', C9: 'Missile', C11: 'Tank', C13: 'Air',
        D2: 'Missile', D4: 'Tank', D6: 'Air', D8: 'Missile', D10: 'Tank', D12: 'Air',
        E1: 'Tank', E3: 'Air', E5: 'Missile', E7: 'Tank', E9: 'Air', E11: 'Missile', E13: 'Tank',
        F2: 'Air', F4: 'Missile', F6: 'Tank', F8: 'Air', F10: 'Missile', F12: 'Tank',
        G1: 'Missile', G3: 'Tank', G5: 'Air', /* G7: 'Missile', */ G9: 'Tank', G11: 'Air', G13: 'Missile',
        H2: 'Tank', H4: 'Air', H6: 'Missile', H8: 'Tank', H10: 'Air', H12: 'Missile',
        I1: 'Air', I3: 'Missile', I5: 'Tank', I7: 'Air', I9: 'Missile', I11: 'Tank', I13: 'Air',
        J2: 'Missile', J4: 'Tank', J6: 'Air', J8: 'Missile', J10: 'Tank', J12: 'Air',
        K1: 'Tank', K3: 'Air', K5: 'Missile', K7: 'Tank', K9: 'Air', K11: 'Missile', K13: 'Tank',
        L2: 'Air', L4: 'Missile', L6: 'Tank', L8: 'Air', L10: 'Missile', L12: 'Tank',
        M1: 'Missile', M3: 'Tank', M5: 'Air', M7: 'Missile', M9: 'Tank', M11: 'Air', M13: 'Missile'
     };

    const SAVE_KEY = 'allianceMapState_v8'; // Increment version if state structure changes significantly

    // --- State Variables ---
    let fixedAlliancesActive = true;
    let assignmentOrderActive = false;
    let labelsVisible = true; // NEW state for label visibility

    function getIconClass(buffType) {
        switch (buffType.toLowerCase()) {
            case 'coin': return 'fa-solid fa-coins'; case 'iron': return 'fa-solid fa-mound'; case 'food': return 'fa-solid fa-bread-slice'; case 'gathering': return 'fa-solid fa-tractor'; case 'healing': return 'fa-solid fa-bandage'; case 'construction': return 'fa-solid fa-hammer'; case 'march speed': return 'fa-solid fa-truck-fast'; case 'training': return 'fa-solid fa-shield-halved'; case 'research': return 'fa-solid fa-flask-vial'; default: return 'fa-solid fa-question-circle'; // Added default return
        }
    }


    // Parse data
    landDataInput.forEach(item => {
        const parts = item.split(': '); const id = parts[0]; const details = parts[1];
        let level = 0, name = '', buffValue = 0, buffType = '', type = 'Other'; let coalPerHour = 0, rareSoilPerHour = 0, resistance = null;
        let bossType = null, bossIcon = null;

        if (id === 'G7') { level = 'N/A'; name = 'Capitol'; type = 'City'; const bm = details.match(/(\d+)% (.*)/); if (bm) { buffValue = parseInt(bm[1], 10); buffType = bm[2]; } rareSoilPerHour = citySoilProduction; }
        else { const lm = details.match(/Level (\d+)/); if (lm) level = parseInt(lm[1], 10); const nameMatch = details.match(/Level \d+ ([\w\s]+?)(?: \d+%|\s*$)/); if (nameMatch) name = nameMatch[1].trim(); else name = 'Unknown'; const bm = details.match(/(\d+)% (.*)/); if (bm) { buffValue = parseInt(bm[1], 10); buffType = bm[2]; } if (name.includes('Dig Site')) type = 'Dig Site'; else if (cityTypes.some(city => name.includes(city))) type = 'City'; else type = 'Other'; if (type === 'Dig Site' && digSiteProduction[level]) { coalPerHour = digSiteProduction[level].coal; rareSoilPerHour = digSiteProduction[level].soil; resistance = digSiteResistance[level] || null; } else if (type === 'City' && level >= 1 && level <= 6) { rareSoilPerHour = citySoilProduction; } }

        if (type === 'Dig Site' && bossTypeMapping[id]) {
            bossType = bossTypeMapping[id];
            bossIcon = `S2Map.${bossType.toLowerCase()}.png`;
        }

        const isFixed = FIXED_ASSIGNMENTS.hasOwnProperty(id);
        // NEW: Add state properties for conflict and drop status
        landData[id] = {
            id, level, name, type, buffValue, buffType, iconClass: getIconClass(buffType),
            owner: null, isFixed, coalPerHour, rareSoilPerHour, resistance, assignmentOrder: null,
            bossType, bossIcon,
            isConflict: false, // NEW
            conflictAlliances: [], // NEW
            isDropped: false // NEW
        };
    });


    // --- DOM Elements ---
    const mapGrid = document.getElementById('map-grid');
    const mapContainer = document.getElementById('map-container');
    const allianceSummaryDiv = document.getElementById('alliance-summary');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const bodyElement = document.body;
    const modalElement = document.getElementById('allianceSelectModal');
    const allianceSelectModal = new bootstrap.Modal(modalElement);
    // Modal Elements (Updated)
    const modalSegmentIdSpan = document.getElementById('modalSegmentId');
    const modalSegmentNameSpan = document.getElementById('modalSegmentName');
    const modalSegmentLevelSpan = document.getElementById('modalSegmentLevel');
    const modalSegmentBuffSpan = document.getElementById('modalSegmentBuff');
    const modalSegmentProdSpan = document.getElementById('modalSegmentProd');
    const modalSegmentResistanceSpan = document.getElementById('modalSegmentResistance');
    const modalSegmentBossSpan = document.getElementById('modalSegmentBoss');
    const modalBossInfoContainer = document.getElementById('modalBossInfoContainer');
    const modalProdInfoContainer = document.getElementById('modalProdInfoContainer');
    const modalResistanceInfoContainer = document.getElementById('modalResistanceInfoContainer');
    const allianceButtonsDiv = document.getElementById('alliance-buttons');
    const clearAllianceButton = document.getElementById('clear-alliance-button');
    // End Updated Modal Elements
    const clearAllButton = document.getElementById('clear-all-button');
    const fixedAllianceToggle = document.getElementById('fixed-alliance-toggle');
    const assignmentOrderToggle = document.getElementById('assignment-order-toggle');
    const labelVisibilityToggle = document.getElementById('label-visibility-toggle'); // NEW
    const summaryItemContainer = allianceSummaryDiv.querySelector('.summary-item-container'); // Use existing container
    const loadCurrentStateButton = document.getElementById('load-current-state-button'); // Assuming this exists

    // NEW: Modal Action Buttons
    const markConflictButton = document.getElementById('mark-conflict-button');
    const markDropButton = document.getElementById('mark-drop-button');
    const clearMarksButton = document.getElementById('clear-marks-button');

    // NEW: Info Modal Elements
    const infoButton = document.getElementById('info-button'); // Added in HTML
    const infoModalElement = document.getElementById('infoModal');
    const infoModal = new bootstrap.Modal(infoModalElement);


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

            // Generate base inner HTML - Store original content separately
            segmentData.originalHTMLContent = `
                <span class="segment-name">${segmentData.name}</span>
                <i class="segment-icon ${segmentData.iconClass}"></i>
                <span class="segment-buff">${segmentData.buffValue > 0 ? segmentData.buffValue + '% ' + segmentData.buffType : ''}</span>
                <span class="segment-assignment-order"></span>
                ${resistanceHTML}
            `;

            segmentDiv.innerHTML = `
                <span class="segment-label">${segmentId}</span>
                <span class="segment-level">Level ${segmentData.level}</span>
                <div class="segment-content">
                    ${segmentData.originalHTMLContent}
                </div>
            `;

            if (segmentData.bossIcon) {
                const bossIconImg = document.createElement('img');
                bossIconImg.src = segmentData.bossIcon;
                bossIconImg.alt = segmentData.bossType ? `${segmentData.bossType} Boss` : 'Boss Icon';
                bossIconImg.classList.add('segment-boss-icon');
                bossIconImg.setAttribute('title', `${segmentData.bossType} Boss`);
                segmentDiv.appendChild(bossIconImg);
            }

            segmentDiv.addEventListener('click', () => handleSegmentClick(segmentId));
            mapGrid.appendChild(segmentDiv);
        }
    }

    // --- Panzoom Initialization ---
    const panzoom = Panzoom(mapGrid, { maxScale: 5, minScale: 0.3, contain: 'outside', canvas: true, cursor: 'grab', step: 0.3 });
    mapContainer.addEventListener('wheel', panzoom.zoomWithWheel);

    // --- MODIFIED centerOnG7 Function ---
    function centerOnG7() {
        const g7Element = mapGrid.querySelector('[data-id="G7"]');
        if (!g7Element) return;

        const mapRect = mapContainer.getBoundingClientRect();
        const elementWidth = g7Element.offsetWidth;
        const elementHeight = g7Element.offsetHeight;

        // --- Start Modification ---
        // Calculate initial zoom based on viewport height to try and fit the map
        const viewportHeight = window.innerHeight;
        const baseHeightForDefaultZoom = 800; // Adjust this value based on testing - height where default zoom looks good
        const defaultInitialZoom = 0.8; // Your original default zoom
        const minAllowedScale = panzoom.getOptions().minScale || 0.3; // Get minScale from panzoom options

        // Calculate a scaling factor based on height, capped between 0 and 1
        // Smaller heights will result in a smaller factor
        const heightFactor = Math.max(0, Math.min(1, viewportHeight / baseHeightForDefaultZoom));

        // Adjust the default zoom level by the height factor
        // We might want a non-linear relationship, but linear is simpler start
        // Let's make it less sensitive: scale factor affects zoom proportionally less
        let calculatedZoom = defaultInitialZoom * (1 - (1 - heightFactor) * 0.5); // Reduce zoom by half the difference factor

        // Ensure the calculated zoom isn't lower than the minimum allowed scale
        const initialZoom = Math.max(minAllowedScale, calculatedZoom);
        // console.log(`Viewport H: ${viewportHeight}, Factor: ${heightFactor.toFixed(2)}, Calc Zoom: ${calculatedZoom.toFixed(2)}, Final Initial Zoom: ${initialZoom.toFixed(2)}`); // Debugging line
        // --- End Modification ---

        panzoom.zoom(initialZoom, { animate: false });

        // Recalculate centers and pan after applying the dynamic zoom
        const zoomedElementWidth = elementWidth * initialZoom;
        const zoomedElementHeight = elementHeight * initialZoom;
        const zoomedG7CenterX = (g7Element.offsetLeft * initialZoom) + zoomedElementWidth / 2;
        const zoomedG7CenterY = (g7Element.offsetTop * initialZoom) + zoomedElementHeight / 2;
        const finalPanX = (mapRect.width / 2) - zoomedG7CenterX;
        const finalPanY = (mapRect.height / 2) - zoomedG7CenterY; // Adjust vertical pan slightly more if needed? Maybe center slightly higher than pure center?
                                                                  // Example: const finalPanY = (mapRect.height * 0.45) - zoomedG7CenterY; // Center slightly above middle

        panzoom.pan(finalPanX, finalPanY, { animate: false, force: true });
    }
    // Center after a short delay to allow layout calculations
    setTimeout(centerOnG7, 150);

    // --- Event Handlers & Logic ---

    // --- NEW: Helper function to update segment visual state (Conflict/Drop/Normal) ---
    function updateSegmentVisualState(segmentId) {
        const segmentData = landData[segmentId];
        const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);
        const segmentContentElement = segmentElement?.querySelector('.segment-content');
        if (!segmentData || !segmentElement || !segmentContentElement) return;

        // Remove status classes first
        segmentElement.classList.remove('conflict', 'dropped');
        segmentContentElement.classList.remove('conflict-text', 'dropped-text'); // Use classes for content styling
         // Remove all potential alliance classes first
        Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));


        if (segmentData.isConflict) {
            segmentElement.classList.add('conflict');
            segmentContentElement.classList.add('conflict-text');
            segmentContentElement.innerHTML = `<span class="conflict-indicator">${segmentData.conflictAlliances.join(' vs. ') || 'Conflict'}</span>`;
        } else if (segmentData.isDropped) {
            segmentElement.classList.add('dropped');
            segmentContentElement.classList.add('dropped-text');
            segmentContentElement.innerHTML = `<span class="dropped-indicator">X</span>`;
             // Ensure alliance owner/stats are cleared if marked as dropped (clearAssignmentForSegment handles stats)
            if (segmentData.owner) {
                 clearAssignmentForSegment(segmentId, false); // Clear without closing modal or saving yet
            }
        } else {
            // Restore original content (including assignment order if active)
            segmentContentElement.innerHTML = segmentData.originalHTMLContent;
            updateSegmentOrderDisplay(segmentId, segmentData.assignmentOrder); // Re-apply order number if applicable

            // Re-apply owner class if not dropped/conflict
             if (segmentData.owner && alliances[segmentData.owner]) {
                segmentElement.classList.add(alliances[segmentData.owner].cssClass);
             }
        }
    }

    // --- NEW: Modal Action Button Handlers ---
    markConflictButton.addEventListener('click', () => {
        if (!currentSegmentId) return;
        const segmentData = landData[currentSegmentId];

        // Prompt for alliances
        const alliance1 = prompt(`Enter the first alliance for conflict at ${currentSegmentId}:`);
        const alliance2 = prompt(`Enter the second alliance for conflict at ${currentSegmentId}:`);

        if (alliance1 && alliance2) {
             // Clear existing owner first if marking conflict
            if (segmentData.owner) {
                clearAssignmentForSegment(currentSegmentId, false); // Clear stats, don't save yet
            }

            segmentData.isConflict = true;
            segmentData.conflictAlliances = [alliance1.trim().toUpperCase(), alliance2.trim().toUpperCase()]; // Store names
            segmentData.isDropped = false; // Conflict overrides drop

            updateSegmentVisualState(currentSegmentId);
            updateAllianceSummary(); // Update summary after clearing potential owner
            saveState();
            allianceSelectModal.hide();
        } else {
            alert("Both alliance names are required to mark conflict.");
        }
    });

    markDropButton.addEventListener('click', () => {
        if (!currentSegmentId) return;
        const segmentData = landData[currentSegmentId];

         // Clear existing owner first if marking as dropped (handled by updateSegmentVisualState calling clearAssignmentForSegment)
         // if (segmentData.owner) {
         //     clearAssignmentForSegment(currentSegmentId, false); // Clear stats, don't save yet
         // }

        segmentData.isDropped = true;
        segmentData.isConflict = false; // Drop overrides conflict
        segmentData.conflictAlliances = [];

        updateSegmentVisualState(currentSegmentId); // This will also trigger clearing the assignment internally
        updateAllianceSummary(); // Update summary after clearing potential owner
        saveState();
        allianceSelectModal.hide();
    });

    clearMarksButton.addEventListener('click', () => {
        if (!currentSegmentId) return;
        const segmentData = landData[currentSegmentId];

        segmentData.isConflict = false;
        segmentData.conflictAlliances = [];
        segmentData.isDropped = false;

        updateSegmentVisualState(currentSegmentId); // Restore normal view
        // No need to update summary unless owner changed, which it doesn't here
        saveState();
        allianceSelectModal.hide(); // Keep modal open if needed? For now, close.
        // Note: This does NOT reassign a previous owner automatically.
    });


    function updateSegmentOrderDisplay(segmentId, orderNumber) {
        const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"] .segment-assignment-order`);
        if (segmentElement) segmentElement.textContent = orderNumber !== null ? `#${orderNumber}` : ''; // Added '#' prefix
    }


    function recalculateAllianceCounter(allianceCode) {
        if (!alliances[allianceCode]) return;
        const alliance = alliances[allianceCode];
        if (alliance.orderedAssignments.length === 0) {
            alliance.assignmentCounter = 0;
        } else {
            // Ensure orders are numbers and find the max
            const validOrders = alliance.orderedAssignments
                                    .map(item => item.order)
                                    .filter(order => typeof order === 'number' && !isNaN(order));
            const maxOrder = validOrders.length > 0 ? Math.max(0, ...validOrders) : 0;
            alliance.assignmentCounter = maxOrder;
        }
    }



    // --- UPDATED: handleSegmentClick ---
    function handleSegmentClick(segmentId) {
        const segmentData = landData[segmentId];
        if (!segmentData) return; // Exit if no data

        currentSegmentId = segmentId;
        modalSegmentIdSpan.textContent = segmentId;
        modalSegmentNameSpan.textContent = segmentData.name;
        modalSegmentLevelSpan.textContent = segmentData.level !== 'N/A' ? segmentData.level : 'N/A';
        modalSegmentBuffSpan.textContent = `${segmentData.buffValue > 0 ? segmentData.buffValue + '% ' + segmentData.buffType : 'None'}`;

        // Production Info
        let prodText = '';
        if (segmentData.coalPerHour > 0) prodText += `<span class="resource-value">${segmentData.coalPerHour.toLocaleString()}</span> CPH `;
        if (segmentData.rareSoilPerHour > 0) prodText += `<span class="resource-value">${segmentData.rareSoilPerHour.toLocaleString()}</span> RSPH`;
        if (prodText) {
            modalSegmentProdSpan.innerHTML = prodText.trim();
            modalProdInfoContainer.style.display = 'block';
        } else {
            modalSegmentProdSpan.innerHTML = 'None';
            modalProdInfoContainer.style.display = 'block'; // Keep container visible even if None
        }

        // Resistance Info
        if (segmentData.type === 'Dig Site' && segmentData.resistance) {
            modalSegmentResistanceSpan.textContent = segmentData.resistance.toLocaleString();
            modalResistanceInfoContainer.style.display = 'block';
        } else {
            modalSegmentResistanceSpan.textContent = 'N/A';
            modalResistanceInfoContainer.style.display = 'block'; // Keep container visible even if N/A
        }

        // Boss Info
        if (segmentData.bossType && segmentData.type === 'Dig Site') {
            let bossHtml = '';
            if (segmentData.bossIcon) {
                bossHtml += `<img src="${segmentData.bossIcon}" alt="${segmentData.bossType} Boss" class="modal-boss-icon me-1">`;
            }
            bossHtml += segmentData.bossType;
            modalSegmentBossSpan.innerHTML = bossHtml;
            modalBossInfoContainer.style.display = 'block';
        } else {
            modalSegmentBossSpan.innerHTML = 'N/A';
            modalBossInfoContainer.style.display = 'block'; // Keep container visible even if N/A
        }


        // Initialize popovers within the modal content just added
        const modalPopoverTriggerList = modalElement.querySelectorAll('[data-bs-toggle="popover"]');
        modalPopoverTriggerList.forEach(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));

        // Populate alliance buttons
        allianceButtonsDiv.innerHTML = '';
        // Use allianceDisplayOrder to ensure buttons match sidebar order
        allianceDisplayOrder.forEach(code => {
            const data = alliances[code];
            if (!data) return; // Skip if alliance code isn't found

            const button = document.createElement('button');
            button.type = 'button';
            button.classList.add('btn', 'btn-sm', 'w-100', 'alliance-assign-button'); // Added class for styling
            // Apply background color directly for now, could use classes
            button.style.backgroundColor = data.color;
            button.style.borderColor = data.color; // Match border
            button.style.color = '#fff'; // Ensure text contrast
            button.textContent = `${data.name}`; // Keep it concise
            button.dataset.allianceCode = code;

             // Disable assigning if fixed & toggle active OR if segment is marked conflict/dropped
             let disabledReason = null;
             let limitReached = false;
             if (segmentData.type === 'City' && data.cityCount >= data.cityLimit) {
                 disabledReason = ` (Limit: ${data.cityCount}/${data.cityLimit} Cities)`;
                 limitReached = true;
             } else if (segmentData.type === 'Dig Site' && data.digSiteCount >= data.digSiteLimit) {
                 disabledReason = ` (Limit: ${data.digSiteCount}/${data.digSiteLimit} Digs)`;
                 limitReached = true;
             }

             if (segmentData.isFixed && fixedAlliancesActive) {
                 disabledReason = ` (Fixed: ${FIXED_ASSIGNMENTS[segmentId]})`;
             } else if (segmentData.isConflict) {
                 disabledReason = ` (Conflict)`;
             } else if (segmentData.isDropped) {
                  disabledReason = ` (Dropped)`;
             } else if (segmentData.owner === code) {
                disabledReason = ` (Assigned)`;
             }

            if (disabledReason) {
                button.disabled = true;
                button.textContent += disabledReason;
                button.style.opacity = '0.65';
                button.style.cursor = 'not-allowed';
            } else {
                 button.addEventListener('click', () => handleAllianceSelection(code));
                 // Optionally add limit counts even if not disabled yet
                 if(segmentData.type === 'City') button.textContent += ` (${data.cityCount}/${data.cityLimit})`;
                 else if(segmentData.type === 'Dig Site') button.textContent += ` (${data.digSiteCount}/${data.digSiteLimit})`;
            }
            allianceButtonsDiv.appendChild(button);
        });


        // Disable clear button if fixed & active OR if no current owner OR if conflict/dropped
        clearAllianceButton.disabled = (segmentData.isFixed && fixedAlliancesActive) || !segmentData.owner || segmentData.isConflict || segmentData.isDropped;
        clearAllianceButton.onclick = () => handleAllianceSelection(null);

         // Enable/Disable modal action buttons based on state
         markConflictButton.disabled = (segmentData.isFixed && fixedAlliancesActive);
         markDropButton.disabled = (segmentData.isFixed && fixedAlliancesActive);
         clearMarksButton.disabled = !segmentData.isConflict && !segmentData.isDropped; // Only enable if marked


        allianceSelectModal.show();
    }

    // --- Helper Function to clear assignment for a segment ---
    function clearAssignmentForSegment(segmentId, updateSummaryAndSave = true) {
         const segmentData = landData[segmentId];
         const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);
         const previousOwner = segmentData.owner;
         const previousOrder = segmentData.assignmentOrder;

         if (previousOwner) {
            const prevAlliance = alliances[previousOwner];
            if (prevAlliance) {
                // Decrement counts
                if (segmentData.type === 'City') prevAlliance.cityCount = Math.max(0, prevAlliance.cityCount - 1);
                else if (segmentData.type === 'Dig Site') prevAlliance.digSiteCount = Math.max(0, prevAlliance.digSiteCount - 1);
                // Remove CSS class
                if (segmentElement) segmentElement.classList.remove(prevAlliance.cssClass);

                // Remove from ordered list
                if (previousOrder !== null) {
                    const assignmentIndex = prevAlliance.orderedAssignments.findIndex(item => item.segmentId === segmentId);
                    if (assignmentIndex > -1) {
                        prevAlliance.orderedAssignments.splice(assignmentIndex, 1);
                    }
                    // Recalculate counter only if updating summary (avoid redundant calcs when called internally)
                    if (updateSummaryAndSave) {
                        recalculateAllianceCounter(previousOwner);
                    }
                }
            }
         }


         segmentData.owner = null;
         segmentData.assignmentOrder = null;
         updateSegmentOrderDisplay(segmentId, null); // Clear order display

         // Update summary and save state if requested (usually true unless called internally by drop/conflict)
         if (updateSummaryAndSave) {
             updateAllianceSummary(); // This will recalculate buffs/resources
             saveState();
         }
         return true; // Indicate success
    }


    function handleAllianceSelection(allianceCode) {
        if (!currentSegmentId) return;
        const segmentData = landData[currentSegmentId];
        const segmentElement = mapGrid.querySelector(`[data-id="${currentSegmentId}"]`);
        let assignmentChanged = false;
        const previousOwner = segmentData.owner; // Store owner before changes

        // Prevent changing if fixed assignments active, or if marked as conflict/dropped
        if ((segmentData.isFixed && fixedAlliancesActive) || segmentData.isConflict || segmentData.isDropped) {
            console.warn("Assignment blocked: Segment is fixed, conflict, or dropped.");
            return;
        }

        // --- Handle Clearing Assignment ---
        if (allianceCode === null) {
             if (clearAssignmentForSegment(currentSegmentId, true)) { // Use helper, update summary & save
                 assignmentChanged = true;
             }
        }
        // --- Handle Assigning New Alliance ---
        else {
             const newAlliance = alliances[allianceCode];
             if (!newAlliance) return; // Should not happen

             // Check limits
             if (segmentData.type === 'City' && newAlliance.cityCount >= newAlliance.cityLimit) { alert(`${newAlliance.name} City limit reached.`); return; }
             if (segmentData.type === 'Dig Site' && newAlliance.digSiteCount >= newAlliance.digSiteLimit) { alert(`${newAlliance.name} Dig Site limit reached.`); return; }

             // Clear previous owner first (if any) using the helper, but DON'T save/update summary yet
             if (segmentData.owner) {
                 clearAssignmentForSegment(currentSegmentId, false);
             }

            // Assign to new owner
            segmentData.owner = allianceCode;
            segmentData.isConflict = false; // Assigning clears conflict/drop
            segmentData.isDropped = false;
            segmentData.conflictAlliances = [];

            // Increment counts
            if (segmentData.type === 'City') newAlliance.cityCount++;
            else if (segmentData.type === 'Dig Site') newAlliance.digSiteCount++;
            // Add CSS class
            if (segmentElement) segmentElement.classList.add(newAlliance.cssClass);

            // Assign new sequence number
            newAlliance.assignmentCounter++;
            const newOrder = newAlliance.assignmentCounter;
            segmentData.assignmentOrder = newOrder;
            newAlliance.orderedAssignments.push({ segmentId: currentSegmentId, order: newOrder });
            // Sort the ordered list after adding
            newAlliance.orderedAssignments.sort((a, b) => a.order - b.order);

            updateSegmentOrderDisplay(currentSegmentId, newOrder);
            updateSegmentVisualState(currentSegmentId); // Ensure content is restored if it was conflict/drop
            assignmentChanged = true;
        }

        // --- Final Actions ---
        if (assignmentChanged) {
             // Recalculate counters for affected alliances AFTER changes
             if (previousOwner && previousOwner !== allianceCode) recalculateAllianceCounter(previousOwner); // Recalc previous owner if different
             if (allianceCode) recalculateAllianceCounter(allianceCode); // Recalc new owner (or the cleared owner if code is null)

            updateAllianceSummary(); // Recalculate buffs/resources and update display
            saveState();
        }


        allianceSelectModal.hide();
        currentSegmentId = null;
    }


    // --- Clear All Assignments Function ---
    function clearAllAssignments() {
        const confirmationMessage = fixedAlliancesActive
            ? "Are you sure you want to clear ALL user-assigned segments? Designated War Palace assignments and Conflict/Drop marks will REMAIN." // Clarified marks remain
            : "Are you sure you want to clear ALL assigned segments (including fixed) and Conflict/Drop marks? Fixed toggle is OFF."; // Clarified marks cleared too

        if (!confirm(confirmationMessage)) {
             return;
        }

        // Reset alliance counters and lists
        for (const code in alliances) {
            alliances[code].cityCount = 0;
            alliances[code].digSiteCount = 0;
            alliances[code].assignmentCounter = 0;
            alliances[code].orderedAssignments = [];
            // Do NOT reset pinned/collapsed status here
        }

        // Process each segment
        for (const segmentId in landData) {
            const segmentData = landData[segmentId];
            const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);
            segmentData.assignmentOrder = null; // Clear order number

            // Clear existing owner class regardless of type
            if (segmentData.owner && segmentElement) {
                Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));
            }

             // Handle Conflict/Drop marks based on toggle
             if (!fixedAlliancesActive) { // Clear marks only if toggle is OFF
                 segmentData.isConflict = false;
                 segmentData.conflictAlliances = [];
                 segmentData.isDropped = false;
             }

            // Reset owner based on fixed status and toggle state
            if (segmentData.isFixed && fixedAlliancesActive && FIXED_ASSIGNMENTS[segmentId]) {
                 // Re-apply fixed assignment if toggle is ON
                 const fixedOwnerCode = FIXED_ASSIGNMENTS[segmentId];
                 const alliance = alliances[fixedOwnerCode];
                 if (alliance) {
                     segmentData.owner = fixedOwnerCode;
                     // Recalculate counts for fixed assignments
                     let canAssignFixed = false;
                      if (segmentData.type === 'City') { if (alliance.cityCount < alliance.cityLimit) { alliance.cityCount++; canAssignFixed = true; } }
                      else if (segmentData.type === 'Dig Site') { if (alliance.digSiteCount < alliance.digSiteLimit) { alliance.digSiteCount++; canAssignFixed = true; } }
                      else { canAssignFixed = true; } // Other types like capitol

                      if(canAssignFixed) {
                          if(segmentElement) segmentElement.classList.add(alliance.cssClass);
                      } else {
                          console.warn(`Clear All: Limit for fixed ${fixedOwnerCode} at ${segmentId}. Cannot assign.`);
                          segmentData.owner = null; // Reset if limit reached
                      }

                 } else {
                    segmentData.owner = null;
                 }
            } else {
                // Clear owner if it's not fixed OR if it is fixed but the toggle is OFF
                segmentData.owner = null;
            }


            // Update visual state AFTER owner/marks are set
             updateSegmentVisualState(segmentId);
        }

        // Recalculate counters for any remaining fixed assignments
        Object.keys(alliances).forEach(recalculateAllianceCounter);

        updateAllianceSummary(); // Update display with cleared assignments but retaining pin/collapse status
        saveState();
        console.log("Assignments cleared based on fixed toggle state.");
    }
    clearAllButton.addEventListener('click', clearAllAssignments);


    // --- Toggle Fixed Alliances Function ---
    function toggleFixedAlliances(isActive) {
        fixedAlliancesActive = isActive;

        // Store current owners before potentially changing them
        const ownersBeforeToggle = {};
        Object.keys(landData).forEach(id => ownersBeforeToggle[id] = landData[id].owner);

        for (const segmentId in FIXED_ASSIGNMENTS) {
            if (landData[segmentId]) {
                const segmentData = landData[segmentId];
                const fixedAllianceCode = FIXED_ASSIGNMENTS[segmentId];
                const alliance = alliances[fixedAllianceCode];
                const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);
                const currentOwner = ownersBeforeToggle[segmentId]; // Use owner before this loop started

                if (isActive) {
                    // --- Turning Fixed ON ---
                    // Clear conflict/drop status for the fixed segment
                    segmentData.isConflict = false;
                    segmentData.conflictAlliances = [];
                    segmentData.isDropped = false;

                    // If it's not currently owned by the correct fixed alliance
                    if (currentOwner !== fixedAllianceCode) {
                        // 1. Remove from previous owner if it had one (stats only)
                        if (currentOwner && alliances[currentOwner]) {
                            const prevAlliance = alliances[currentOwner];
                            if (segmentData.type === 'City') prevAlliance.cityCount = Math.max(0, prevAlliance.cityCount - 1);
                            else if (segmentData.type === 'Dig Site') prevAlliance.digSiteCount = Math.max(0, prevAlliance.digSiteCount - 1);
                             // Remove from ordered list if it had an order number
                            if (segmentData.assignmentOrder !== null) {
                                 const assignmentIndex = prevAlliance.orderedAssignments.findIndex(item => item.segmentId === segmentId);
                                 if (assignmentIndex > -1) {
                                     prevAlliance.orderedAssignments.splice(assignmentIndex, 1);
                                 }
                            }
                             // Recalculate counter for the PREVIOUS owner immediately after removal
                            recalculateAllianceCounter(currentOwner);
                        }


                        // 2. Assign to the correct fixed alliance (check limits)
                        segmentData.owner = fixedAllianceCode;
                        if (alliance) {
                             let canAssignFixed = false;
                             if (segmentData.type === 'City') { if (alliance.cityCount < alliance.cityLimit) { alliance.cityCount++; canAssignFixed = true; } }
                             else if (segmentData.type === 'Dig Site') { if (alliance.digSiteCount < alliance.digSiteLimit) { alliance.digSiteCount++; canAssignFixed = true; } }
                             else { canAssignFixed = true; } // Allow other types

                             if (canAssignFixed) {
                                if (segmentElement) {
                                     Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass)); // Clear old colors
                                     segmentElement.classList.add(alliance.cssClass);
                                }
                             } else {
                                console.warn(`Toggle ON conflict: Limit for fixed ${fixedAllianceCode} at ${segmentId}. Cannot assign.`);
                                segmentData.owner = null; // Cannot assign due to limit
                                if(segmentElement) Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));
                             }
                        } else {
                             segmentData.owner = null;
                        }
                    }
                     // Ensure it loses any user-assigned order number if it had one (even if owner didn't change)
                    segmentData.assignmentOrder = null;


                } else {
                    // --- Turning Fixed OFF ---
                    // If it's currently owned by the fixed alliance, release it (make it user assignable)
                    if (currentOwner === fixedAllianceCode) {
                        if(alliance) {
                             if (segmentData.type === 'City') alliance.cityCount = Math.max(0, alliance.cityCount - 1);
                             else if (segmentData.type === 'Dig Site') alliance.digSiteCount = Math.max(0, alliance.digSiteCount - 1);
                             if(segmentElement) segmentElement.classList.remove(alliance.cssClass);
                              // Recalculate counter for the fixed alliance being released
                             recalculateAllianceCounter(fixedAllianceCode);
                        }
                        segmentData.owner = null;
                        segmentData.assignmentOrder = null; // Ensure no order
                    }
                    // If owned by someone else, or no one, do nothing (it's already user-controlled)
                }
                 updateSegmentVisualState(segmentId); // Update visuals after potential changes
            }
        }
        // Recalculate all counters after processing all fixed assignments just in case
         // Object.keys(alliances).forEach(recalculateAllianceCounter); // Might be needed if limits caused issues
        updateAllianceSummary(); // Recalculate buffs/resources and update display
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
        // Don't save view state preference, let it reset on load maybe? Or save if desired.
        // saveState(); // Optional: Save view state preference
    }
    assignmentOrderToggle.addEventListener('change', (event) => toggleAssignmentOrderView(event.target.checked));

    // --- NEW: Toggle Label Visibility Function ---
    function toggleLabelVisibility(isVisible) {
        labelsVisible = isVisible;
        if (isVisible) {
            bodyElement.classList.remove('labels-hidden');
        } else {
            bodyElement.classList.add('labels-hidden');
        }
         saveState(); // Save the label visibility state
    }
    labelVisibilityToggle.addEventListener('change', (event) => toggleLabelVisibility(event.target.checked));


    function calculateAllianceBuffs() {
        for (const code in alliances) { alliances[code].buffs = {}; }
        for (const segmentId in landData) {
            const segment = landData[segmentId];
            // Only count buffs if segment is owned AND not dropped/conflict
            if (segment.owner && alliances[segment.owner] && !segment.isConflict && !segment.isDropped) {
                const alliance = alliances[segment.owner];
                const buffType = segment.buffType;
                const buffValue = segment.buffValue;
                if (buffValue > 0 && buffType) {
                    if (!alliance.buffs[buffType]) alliance.buffs[buffType] = 0;
                    alliance.buffs[buffType] += buffValue;
                }
            }
        }
    }
    function calculateAllianceResources() {
        for (const code in alliances) { alliances[code].totalCPH = 0; alliances[code].totalRSPH = 0; }
        for (const segmentId in landData) {
            const segment = landData[segmentId];
             // Only count resources if segment is owned AND not dropped/conflict
             if (segment.owner && alliances[segment.owner] && !segment.isConflict && !segment.isDropped) {
                alliances[segment.owner].totalCPH += segment.coalPerHour || 0;
                alliances[segment.owner].totalRSPH += segment.rareSoilPerHour || 0;
            }
        }
    }
    function initializePopovers() {
        // Dispose existing popovers first
        if (popoverTriggerList && popoverTriggerList.length > 0) {
            popoverTriggerList.forEach(p => p.dispose());
        }
        // Re-initialize for elements currently in the DOM
        const newPopoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
        popoverTriggerList = [...newPopoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl, {
            trigger: 'hover focus', // Ensure trigger is set correctly
            html: true // Allow HTML in popovers if needed
        }));
    }


    // --- NEW: Toggle Pin Status ---
    function toggleAlliancePin(allianceCode) {
        if (alliances[allianceCode]) {
            alliances[allianceCode].isPinned = !alliances[allianceCode].isPinned;
            updateAllianceSummary(); // Re-render the summary to reflect pinning order
            saveState();
        }
    }

    // --- NEW: Toggle Collapse Status ---
    function toggleAllianceCollapse(allianceCode) {
        if (alliances[allianceCode]) {
            alliances[allianceCode].isCollapsed = !alliances[allianceCode].isCollapsed;
            // Find the specific summary item and toggle its class
            const summaryItem = summaryItemContainer.querySelector(`.summary-item[data-alliance-code="${allianceCode}"]`);
            const collapseIcon = summaryItem?.querySelector('.summary-collapse-toggle i');
            if (summaryItem && collapseIcon) {
                summaryItem.classList.toggle('collapsed', alliances[allianceCode].isCollapsed);
                collapseIcon.classList.toggle('fa-chevron-down', !alliances[allianceCode].isCollapsed);
                collapseIcon.classList.toggle('fa-chevron-up', alliances[allianceCode].isCollapsed);
            }
            saveState();
        }
    }

    function updateAllianceSummary() {
        calculateAllianceBuffs();
        calculateAllianceResources();
        summaryItemContainer.innerHTML = ''; // Clear previous summary

        // Separate pinned and unpinned alliances based on the display order
        const pinnedAlliances = allianceDisplayOrder.filter(code => alliances[code]?.isPinned);
        const unpinnedAlliances = allianceDisplayOrder.filter(code => !alliances[code]?.isPinned);

        // Combine, putting pinned first, then unpinned
        const displayOrder = [...pinnedAlliances, ...unpinnedAlliances];

        displayOrder.forEach(code => {
            const data = alliances[code];
            if (!data) return; // Skip if alliance code isn't found

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('summary-item');
            itemDiv.dataset.allianceCode = code; // Add data attribute for easier selection
            itemDiv.classList.toggle('pinned', data.isPinned); // Apply pinned class
            itemDiv.classList.toggle('collapsed', data.isCollapsed); // Apply collapsed class

            const headerDiv = document.createElement('div');
            headerDiv.classList.add('summary-header');
            headerDiv.innerHTML = `
                <span class="summary-color-dot" style="background-color: ${data.color};"></span>
                <span class="summary-alliance-name">${data.name}</span>
                <div class="summary-controls">
                     <button type="button" class="btn btn-sm btn-outline-secondary summary-pin-toggle" title="${data.isPinned ? 'Unpin' : 'Pin'} Alliance">
                         <i class="fas fa-thumbtack ${data.isPinned ? 'active' : ''}"></i>
                     </button>
                     <button type="button" class="btn btn-sm btn-outline-secondary summary-collapse-toggle" title="${data.isCollapsed ? 'Expand' : 'Collapse'} Alliance">
                         <i class="fas ${data.isCollapsed ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
                     </button>
                </div>
            `;

            const resourcesDiv = document.createElement('div');
            resourcesDiv.classList.add('summary-resources');
            resourcesDiv.innerHTML = `<span><span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Coal Per Hour">Cph</span><span class="resource-value">${data.totalCPH.toLocaleString() || 0}</span></span> | <span><span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Rare Soil Per Hour">RSph</span><span class="resource-value">${data.totalRSPH.toLocaleString() || 0}</span></span>`;

            const countsDiv = document.createElement('div');
            countsDiv.classList.add('summary-counts');
            countsDiv.innerHTML = `Cities: ${data.cityCount}/${data.cityLimit} | Digs: ${data.digSiteCount}/${data.digSiteLimit}`;

            const buffsUl = document.createElement('ul');
            buffsUl.classList.add('summary-buffs-list');
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

            // Add event listeners for the new buttons within this item
            const pinButton = itemDiv.querySelector('.summary-pin-toggle');
            const collapseButton = itemDiv.querySelector('.summary-collapse-toggle');

            if (pinButton) {
                pinButton.addEventListener('click', (e) => {
                     e.stopPropagation(); // Prevent triggering other clicks if needed
                     toggleAlliancePin(code);
                });
            }
             if (collapseButton) {
                collapseButton.addEventListener('click', (e) => {
                     e.stopPropagation();
                     toggleAllianceCollapse(code);
                });
            }

        });
        initializePopovers(); // Re-initialize popovers for the new content
    }

    // --- Save State ---
    function saveState() {
        const stateToSave = {
            assignments: {},
            markers: {},
            fixedActive: fixedAlliancesActive,
            assignmentOrderViewActive: assignmentOrderActive, // Keep saving this? Or remove if reset on load desired.
            labelsVisible: labelsVisible,
            // NEW: Save summary item states
            summaryStates: {}
        };

        for (const segmentId in landData) {
            const segmentData = landData[segmentId];
            // Save user assignment if owner exists, NOT fixed, AND has order number
            if (segmentData.owner && !segmentData.isFixed && segmentData.assignmentOrder !== null) {
                stateToSave.assignments[segmentId] = {
                    owner: segmentData.owner,
                    order: segmentData.assignmentOrder
                };
            }
            // Save conflict/drop markers
            if (segmentData.isConflict || segmentData.isDropped) {
                 stateToSave.markers[segmentId] = {
                     isConflict: segmentData.isConflict,
                     conflictAlliances: segmentData.conflictAlliances,
                     isDropped: segmentData.isDropped
                 };
            }
        }

        // NEW: Save pin/collapse status for each alliance
        for (const code in alliances) {
             stateToSave.summaryStates[code] = {
                 isPinned: alliances[code].isPinned,
                 isCollapsed: alliances[code].isCollapsed
             };
        }

        localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
         // console.log("State Saved:", stateToSave); // For debugging
    }

     // --- NEW: Helper Function for applying fixed assignments on load ---
     function applyFixedAssignmentsOnLoad() {
         if (fixedAlliancesActive) {
             for (const segmentId in FIXED_ASSIGNMENTS) {
                 if (landData[segmentId]) {
                     const segmentData = landData[segmentId];
                     const allianceCode = FIXED_ASSIGNMENTS[segmentId];
                     const alliance = alliances[allianceCode];

                     // Check if not already owned (might have been loaded from save state before toggle check)
                     if (alliance && !segmentData.owner) {
                          let canAssignFixed = false;
                         if (segmentData.type === 'City') { if (alliance.cityCount < alliance.cityLimit) { alliance.cityCount++; canAssignFixed = true; } }
                         else if (segmentData.type === 'Dig Site') { if (alliance.digSiteCount < alliance.digSiteLimit) { alliance.digSiteCount++; canAssignFixed = true; } }
                         else { canAssignFixed = true; } // Allow assigning other types like Capitol

                         if (canAssignFixed) {
                             segmentData.owner = allianceCode;
                             // Visual update will happen later in initializeMapState
                         } else {
                              console.warn(`Init conflict: Limit for fixed ${allianceCode} at ${segmentId}.`);
                         }
                     } else if(segmentData.owner && segmentData.owner !== allianceCode) {
                         // If it was loaded with a different owner from save state, overwrite it with fixed
                         console.warn(`Init conflict: Overwriting saved owner ${segmentData.owner} with fixed ${allianceCode} for ${segmentId}`);
                         // Correct stats for previous owner
                         const prevAlliance = alliances[segmentData.owner];
                         if(prevAlliance) {
                             if (segmentData.type === 'City') prevAlliance.cityCount = Math.max(0, prevAlliance.cityCount - 1);
                             else if (segmentData.type === 'Dig Site') prevAlliance.digSiteCount = Math.max(0, prevAlliance.digSiteCount - 1);
                             // Remove from ordered list if applicable
                             const assignmentIndex = prevAlliance.orderedAssignments.findIndex(item => item.segmentId === segmentId);
                             if (assignmentIndex > -1) prevAlliance.orderedAssignments.splice(assignmentIndex, 1);
                             recalculateAllianceCounter(segmentData.owner); // Recalculate previous owner
                         }

                         // Now assign to fixed owner (checking limits again)
                         let canAssignFixed = false;
                         if (segmentData.type === 'City') { if (alliance.cityCount < alliance.cityLimit) { alliance.cityCount++; canAssignFixed = true; } }
                         else if (segmentData.type === 'Dig Site') { if (alliance.digSiteCount < alliance.digSiteLimit) { alliance.digSiteCount++; canAssignFixed = true; } }
                         else { canAssignFixed = true; }

                          if (canAssignFixed) {
                             segmentData.owner = allianceCode;
                             segmentData.assignmentOrder = null; // Fixed assignments have no order number
                         } else {
                              console.warn(`Init conflict: Limit for fixed ${allianceCode} at ${segmentId} after overwrite attempt.`);
                              segmentData.owner = null; // Can't assign due to limit
                         }
                     }
                 }
             }
         }
     }


    // --- Initialize Map State (Load) ---
     function initializeMapState() {
         const savedStateRaw = localStorage.getItem(SAVE_KEY);
         let parsedState = {
             assignments: {},
             markers: {},
             fixedActive: true,
             assignmentOrderViewActive: false,
             labelsVisible: true,
             summaryStates: {} // NEW default
         };

         // Try to parse saved state
         if (savedStateRaw) {
             try {
                 const loaded = JSON.parse(savedStateRaw);
                 // Basic validation - ensure all expected top-level keys exist
                 if (loaded && typeof loaded.assignments === 'object' && loaded.assignments !== null &&
                     typeof loaded.markers === 'object' && loaded.markers !== null &&
                     typeof loaded.fixedActive === 'boolean' &&
                     typeof loaded.assignmentOrderViewActive === 'boolean' &&
                     typeof loaded.labelsVisible === 'boolean' &&
                     typeof loaded.summaryStates === 'object' && loaded.summaryStates !== null) { // Validate new structure
                     parsedState = loaded;
                 } else {
                     console.warn(`Invalid saved state structure (v8: ${SAVE_KEY}), using defaults.`);
                     localStorage.removeItem(SAVE_KEY);
                 }
             } catch (e) {
                 console.error(`Failed to parse saved state (v8: ${SAVE_KEY}), using defaults.`, e);
                 localStorage.removeItem(SAVE_KEY);
             }
         }


         // Apply loaded/default toggle states FIRST
         fixedAlliancesActive = parsedState.fixedActive;
         fixedAllianceToggle.checked = fixedAlliancesActive;
         assignmentOrderActive = parsedState.assignmentOrderViewActive; // Apply saved view state
         assignmentOrderToggle.checked = assignmentOrderActive;
         labelsVisible = parsedState.labelsVisible; // Apply saved label visibility
         labelVisibilityToggle.checked = labelsVisible;

         // Apply body classes based on loaded state immediately
         toggleAssignmentOrderView(assignmentOrderActive); // Set initial class
         toggleLabelVisibility(labelsVisible); // Set initial class


         // --- Reset Counts and Map State FIRST ---
         for (const code in alliances) {
             alliances[code].cityCount = 0;
             alliances[code].digSiteCount = 0;
             alliances[code].buffs = {};
             alliances[code].totalCPH = 0;
             alliances[code].totalRSPH = 0;
             alliances[code].assignmentCounter = 0;
             alliances[code].orderedAssignments = [];
             // Apply saved pin/collapse state here
             if (parsedState.summaryStates && parsedState.summaryStates[code]) {
                 alliances[code].isPinned = !!parsedState.summaryStates[code].isPinned;
                 alliances[code].isCollapsed = !!parsedState.summaryStates[code].isCollapsed;
             } else {
                 alliances[code].isPinned = false;
                 alliances[code].isCollapsed = false;
             }
         }

         // Clear visual state and internal data state from map elements
         for (const segmentId in landData) {
             landData[segmentId].owner = null;
             landData[segmentId].assignmentOrder = null;
             landData[segmentId].isConflict = false; // Reset markers
             landData[segmentId].conflictAlliances = [];
             landData[segmentId].isDropped = false;
         }


         // --- Apply Saved User Assignments FIRST (before fixed, to allow fixed to override) ---
         const maxOrderPerAlliance = {};
         // Ensure assignments have owner and order before sorting/processing
         const validAssignments = Object.entries(parsedState.assignments)
             .filter(([id, data]) => data && data.owner && typeof data.order === 'number' && landData[id]);

         // Don't sort globally yet, process per alliance later if needed for counter
         // const sortedAssignments = validAssignments.sort(([, a], [, b]) => a.order - b.order);


         validAssignments.forEach(([segmentId, assignmentData]) => {
              const segmentData = landData[segmentId];
              const allianceCode = assignmentData.owner;
              const alliance = alliances[allianceCode];

              // Load assignment regardless of fixed toggle state initially.
              // The applyFixedAssignmentsOnLoad function will handle overwriting if the toggle is ON.
              if (alliance && !segmentData.isFixed) { // Only load for non-fixed segments here
                 // Also ensure it wasn't already assigned (e.g., by fixed assignment logic above)
                  if (!segmentData.owner) {
                      let canAssignUser = false;
                      if (segmentData.type === 'City') { if (alliance.cityCount < alliance.cityLimit) { alliance.cityCount++; canAssignUser = true; } }
                      else if (segmentData.type === 'Dig Site') { if (alliance.digSiteCount < alliance.digSiteLimit) { alliance.digSiteCount++; canAssignUser = true; } }
                       else { canAssignUser = true; } // Allow other types

                      if (canAssignUser) {
                          segmentData.owner = allianceCode;
                          segmentData.assignmentOrder = assignmentData.order;
                          alliance.orderedAssignments.push({ segmentId: segmentId, order: assignmentData.order });
                          // Don't directly update maxOrder here, do it after processing all
                      } else {
                          console.warn(`Load conflict: Limit reached for ${allianceCode} at ${segmentId}. Saved assignment ignored.`);
                      }
                  } else {
                       console.warn(`Load conflict: Segment ${segmentId} already owned by ${segmentData.owner}. Saved assignment for ${allianceCode} ignored.`);
                  }

              } else if (!alliance) {
                  console.warn(`Load warning: Unknown alliance code "${allianceCode}" found for ${segmentId}. Saved assignment ignored.`);
              } else if (segmentData.isFixed) {
                   // We specifically ignore loading saved assignments for fixed segments here,
                   // they will be handled by applyFixedAssignmentsOnLoad if the toggle is ON.
                   // console.log(`Skipping saved assignment for fixed segment ${segmentId}, will be handled by toggle.`);
              }
          });


         // --- Apply Fixed Assignments (potentially overwriting saved user assignments if toggle is active) ---
         applyFixedAssignmentsOnLoad();


         // --- Sort ordered assignments within each alliance and find max order ---
         for (const code in alliances) {
             alliances[code].orderedAssignments.sort((a, b) => a.order - b.order);
             recalculateAllianceCounter(code); // Recalculate based on loaded assignments
         }


         // --- Apply Saved Markers (Conflict/Drop) ---
         for (const segmentId in parsedState.markers) {
             if (landData[segmentId]) {
                 const segmentData = landData[segmentId];
                 const markerData = parsedState.markers[segmentId];
                 // Apply marker state ONLY if the segment isn't currently a fixed assignment (when toggle is ON)
                  // AND only if it doesn't currently have an owner assigned by the fixed toggle logic
                 if (!segmentData.owner || !segmentData.isFixed || !fixedAlliancesActive) {
                      // If applying drop or conflict marker, ensure owner/stats are cleared FIRST
                     if ((markerData.isDropped || markerData.isConflict) && segmentData.owner) {
                          console.warn(`Load: Clearing owner ${segmentData.owner} from ${segmentId} due to saved drop/conflict marker.`);
                          clearAssignmentForSegment(segmentId, false); // Clear internally without saving/updating summary yet
                     }

                     segmentData.isConflict = markerData.isConflict || false;
                     segmentData.conflictAlliances = markerData.conflictAlliances || [];
                     segmentData.isDropped = markerData.isDropped || false;

                 } else {
                      console.warn(`Load Conflict/Drop marker ignored for ${segmentId} because it's a fixed assignment or already owned by fixed.`);
                 }
             }
         }

         // --- Final Update and Visual Sync ---
          // Now update all segment visuals based on the loaded owner and marker data
          Object.keys(landData).forEach(segmentId => {
              updateSegmentVisualState(segmentId); // Updates color, content based on owner/conflict/drop
             // updateSegmentOrderDisplay(segmentId, landData[segmentId].assignmentOrder); // Order display handled within updateSegmentVisualState restoration
          });


         updateAllianceSummary(); // Calculate buffs/resources and display summary including pin/collapse states
         console.log("Map state initialized.");
    }


    // --- NEW: Load Current State from Google Sheet ---
    // Function definition remains the same...
    async function loadCurrentStateFromSheet() {
        alert("Connecting to Google Sheet to load current state..."); // Placeholder feedback

        // --- Google Sheets API Integration Placeholder ---
        const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your actual Sheet ID
        const RANGE = 'Sheet1!A:B'; // Example: Column A = Segment ID, Column B = Alliance Tag (Adjust if needed)
        const API_KEY = 'YOUR_API_KEY'; // Replace with your API Key (if using for public sheet)

        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                 let errorBody = await response.text();
                 try { errorBody = JSON.parse(errorBody).error.message; } catch(e) { /* Ignore */ }
                throw new Error(`Google Sheets API Error: ${response.status} ${response.statusText}. ${errorBody}`);
            }
            const data = await response.json();

            if (!data.values || data.values.length <= 1) {
                alert("No data found in the specified Google Sheet range (or only header row).");
                return;
            }

            // Reset current state before applying sheet data
            for (const code in alliances) {
                 alliances[code].cityCount = 0;
                 alliances[code].digSiteCount = 0;
                 alliances[code].assignmentCounter = 0;
                 alliances[code].orderedAssignments = [];
                 alliances[code].buffs = {};
                 alliances[code].totalCPH = 0;
                 alliances[code].totalRSPH = 0;
            }
            for (const segmentId in landData) {
                 const segmentData = landData[segmentId];
                 segmentData.owner = null;
                 segmentData.assignmentOrder = null;
                 segmentData.isConflict = false;
                 segmentData.conflictAlliances = [];
                 segmentData.isDropped = false;
            }

             applyFixedAssignmentsOnLoad(); // Re-apply fixed assignments after clearing

            let assignedCount = 0;
            const sheetAssignments = {};
            for (let i = 1; i < data.values.length; i++) { // Skip header
                const row = data.values[i];
                if (row && row[0]) {
                    const segmentId = row[0].trim().toUpperCase();
                    const allianceCode = row[1] ? row[1].trim().toUpperCase() : null;
                    if (landData[segmentId]) {
                         if(landData[segmentId].owner) {
                              console.warn(`Sheet Load: Segment ${segmentId} already assigned to ${landData[segmentId].owner} (likely fixed). Ignoring sheet value ${allianceCode}.`);
                         } else if (allianceCode === null) {
                             sheetAssignments[segmentId] = null; // Explicitly unassigned
                         } else if (alliances[allianceCode]) {
                              sheetAssignments[segmentId] = allianceCode;
                         } else {
                              console.warn(`Skipping sheet row ${i + 1}: Invalid alliance code '${row[1]}' for segment '${segmentId}'`);
                         }
                    } else {
                         console.warn(`Skipping sheet row ${i + 1}: Invalid segment ID '${segmentId}'`);
                    }
                }
            }

            // Apply assignments from sheet
            for (const segmentId in sheetAssignments) {
                 const allianceCode = sheetAssignments[segmentId];
                 const segmentData = landData[segmentId];
                 const alliance = allianceCode ? alliances[allianceCode] : null;

                 if(segmentData.owner) continue; // Skip if already owned (fixed)

                 if (allianceCode === null) {
                      segmentData.owner = null;
                 } else if (alliance) {
                      let canAssign = false;
                      if (segmentData.type === 'City' && alliance.cityCount < alliance.cityLimit) { alliance.cityCount++; canAssign = true; }
                      else if (segmentData.type === 'Dig Site' && alliance.digSiteCount < alliance.digSiteLimit) { alliance.digSiteCount++; canAssign = true; }
                      else if (segmentData.type !== 'City' && segmentData.type !== 'Dig Site') { canAssign = true; }

                      if (canAssign) {
                          segmentData.owner = allianceCode;
                          assignedCount++;
                      } else {
                          console.warn(`Sheet Load: Limit reached for ${allianceCode} at ${segmentId}. Assignment ignored.`);
                      }
                 }
            }

            Object.keys(landData).forEach(updateSegmentVisualState);
            updateAllianceSummary();
            // saveState(); // Optional: save loaded state

            alert(`Loaded state for ${assignedCount} segments from Google Sheet (Fixed assignments maintained).`);

        } catch (error) {
            console.error("Error loading data from Google Sheet:", error);
            alert(`Failed to load data from Google Sheet. Check console for details. Error: ${error.message}`);
        }
    }


    // --- Sidebar Toggle Logic ---
    function setSidebarState(isActive) {
        const sidebarIcon = sidebarToggleBtn.querySelector('i');
        if(isActive) {
            bodyElement.classList.add('sidebar-active');
            allianceSummaryDiv.classList.remove('sidebar-collapsed');
            sidebarToggleBtn.title = "Hide Alliance Summary";
            if (sidebarIcon) sidebarIcon.className = 'fa-solid fa-chevron-right';
        } else {
            bodyElement.classList.remove('sidebar-active');
            allianceSummaryDiv.classList.add('sidebar-collapsed');
            sidebarToggleBtn.title = "Show Alliance Summary";
            if (sidebarIcon) sidebarIcon.className = 'fa-solid fa-bars';
        }
        // Update panzoom after sidebar animation might finish
        requestAnimationFrame(() => {
            setTimeout(() => {
                // Panzoom should auto-detect container resize with CSS.
                // Re-center map slightly if needed after sidebar state change
                 // centerOnG7(); // Optional: re-center after toggle
            }, 350); // Delay to wait for CSS transition
        });
    }
    sidebarToggleBtn.addEventListener('click', () => {
        const currentlyActive = bodyElement.classList.contains('sidebar-active');
        setSidebarState(!currentlyActive);
    });


    // --- Initial Load ---
    initializeMapState(); // Load saved state first
    // Set initial sidebar state based on whether 'sidebar-active' class exists AFTER load
    setSidebarState(bodyElement.classList.contains('sidebar-active'));
    // Initialize popovers globally after everything is loaded
    initializePopovers();

    // --- Add Event Listener for Load Button ---
    // Ensure the button exists before adding the listener
    if (loadCurrentStateButton) {
         loadCurrentStateButton.addEventListener('click', loadCurrentStateFromSheet);
    } else {
         console.warn("Element with ID 'load-current-state-button' not found.");
    }


}); // End DOMContentLoaded
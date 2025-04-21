/*
 * S2mapscript.js
 * Features:
 * - Interactive S2 map with alliance assignments.
 * - Conflict/Drop marking.
 * - Fixed War Palace assignments (toggleable).
 * - Label visibility (toggleable).
 * - Alliance summary sidebar with resource/buff calculation.
 * - Pin/Collapse alliance summaries.
 * - Import/Export map state via Base64 code.
 * - LIVE map import from internal constant variable.
 * - Automatic local storage saving.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & Data ---

    // !!! IMPORTANT: Manually update this constant with the Base64 encoded JSON string for the LIVE map data !!!
    const LIVE_MAP_DATA_B64 = "eyJhc3NpZ25tZW50cyI6eyJBMiI6eyJvd25lciI6IkhlUmEiLCJvcmRlciI6MX0sIkE0Ijp7Im93bmVyIjoiSGVSYSIsIm9yZGVyIjo2fSwiQTUiOnsib3duZXIiOiJIZVJhIiwib3JkZXIiOjd9LCJBNiI6eyJvd25lciI6IkhlUmEiLCJvcmRlciI6OH0sIkE4Ijp7Im93bmVyIjoiQ09MRCIsIm9yZGVyIjozfSwiQTEwIjp7Im93bmVyIjoiQ09MRCIsIm9yZGVyIjo2fSwiQTExIjp7Im93bmVyIjoieWk2ciIsIm9yZGVyIjoxfSwiQTEyIjp7Im93bmVyIjoieWk2ciIsIm9yZGVyIjoyfSwiQTEzIjp7Im93bmVyIjoieWk2ciIsIm9yZGVyIjozfSwiQjEiOnsib3duZXIiOiJhZEhEIiwib3JkZXIiOjF9LCJCMiI6eyJvd25lciI6IkhlUmEiLCJvcmRlciI6Mn0sIkIzIjp7Im93bmVyIjoiSGVSYSIsIm9yZGVyIjozfSwiQjQiOnsib3duZXIiOiJIZVJhIiwib3JkZXIiOjR9LCJCNSI6eyJvd25lciI6IkhlUmEiLCJvcmRlciI6NX0sIkI2Ijp7Im93bmVyIjoiSGVSYSIsIm9yZGVyIjo5fSwiQjciOnsib3duZXIiOiJDT0xEIiwib3JkZXIiOjF9LCJCOCI6eyJvd25lciI6IkNPTEQiLCJvcmRlciI6Mn0sIkI5Ijp7Im93bmVyIjoiQ09MRCIsIm9yZGVyIjo0fSwiQjEwIjp7Im93bmVyIjoiQ09MRCIsIm9yZGVyIjo1fSwiQjExIjp7Im93bmVyIjoiQ09MRCIsIm9yZGVyIjo3fSwiQjEyIjp7Im93bmVyIjoiQ09MRCIsIm9yZGVyIjo4fSwiQjEzIjp7Im93bmVyIjoiZkFmTyIsIm9yZGVyIjoxfSwiQzEiOnsib3duZXIiOiJhZEhEIiwib3JkZXIiOjJ9LCJDMiI6eyJvd25lciI6IlRIT1IiLCJvcmRlciI6OX0sIkMzIjp7Im93bmVyIjoiVEhPUiIsIm9yZGVyIjoxMH0sIkMxMSI6eyJvd25lciI6IkNPTEQiLCJvcmRlciI6OX0sIkMxMiI6eyJvd25lciI6ImZBZk8iLCJvcmRlciI6Mn0sIkMxMyI6eyJvd25lciI6IkJSU0wiLCJvcmRlciI6NH0sIkQxIjp7Im93bmVyIjoiYWRIRCIsIm9yZGVyIjozfSwiRDIiOnsib3duZXIiOiJhZEhEIiwib3JkZXIiOjZ9LCJEMTIiOnsib3duZXIiOiJCUlNMIiwib3JkZXIiOjN9LCJEMTMiOnsib3duZXIiOiJmQWZPIiwib3JkZXIiOjR9LCJFMSI6eyJvd25lciI6ImFkSEQiLCJvcmRlciI6NH0sIkUyIjp7Im93bmVyIjoiVEhPUiIsIm9yZGVyIjo3fSwiRTMiOnsib3duZXIiOiJUSE9SIiwib3JkZXIiOjh9LCJFMTIiOnsib3duZXIiOiJCUlNMIiwib3JkZXIiOjF9LCJFMTMiOnsib3duZXIiOiJCUlNMIiwib3JkZXIiOjJ9LCJGMiI6eyJvd25lciI6ImFkSEQiLCJvcmRlciI6NX0sIkYxMiI6eyJvd25lciI6ImZBZk8iLCJvcmRlciI6NX0sIkYxMyI6eyJvd25lciI6ImZBZk8iLCJvcmRlciI6Nn0sIkcyIjp7Im93bmVyIjoiVEhPUiIsIm9yZGVyIjo1fSwiRzMiOnsib3duZXIiOiJUSE9SIiwib3JkZXIiOjZ9LCJHMTIiOnsib3duZXIiOiJmQWZPIiwib3JkZXIiOjd9LCJIMSI6eyJvd25lciI6IlRIT1IiLCJvcmRlciI6NH0sIkgxMiI6eyJvd25lciI6ImZBZk8iLCJvcmRlciI6OH0sIkkxIjp7Im93bmVyIjoiVG9uZSIsIm9yZGVyIjozfSwiSTIiOnsib3duZXIiOiJUSE9SIiwib3JkZXIiOjJ9LCJJMyI6eyJvd25lciI6IlRIT1IiLCJvcmRlciI6M30sIkkxMiI6eyJvd25lciI6ImZBZk8iLCJvcmRlciI6OX0sIkkxMyI6eyJvd25lciI6Ik1JTkkiLCJvcmRlciI6Mn0sIkoxIjp7Im93bmVyIjoiVEhPUiIsIm9yZGVyIjoxfSwiSjIiOnsib3duZXIiOiJUb25lIiwib3JkZXIiOjJ9LCJKNCI6eyJvd25lciI6ImFEaEQiLCJvcmRlciI6OH0sIko2Ijp7Im93bmVyIjoiYURoRCIsIm9yZGVyIjo3fSwiSjEyIjp7Im93bmVyIjoiZkFmTyIsIm9yZGVyIjoxMH0sIkoxMyI6eyJvd25lciI6Ik1JTkkiLCJvcmRlciI6M30sIksxIjp7Im93bmVyIjoiVG9uZSIsIm9yZGVyIjoxfSwiSzIiOnsib3duZXIiOiJhRGhEIiwib3JkZXIiOjEwfSwiSzUiOnsib3duZXIiOiJhRGhEIiwib3JkZXIiOjZ9LCJLOSI6eyJvd25lciI6ImFEaEQiLCJvcmRlciI6Mn0sIksxMiI6eyJvd25lciI6IlZhTFQiLCJvcmRlciI6OX0sIksxMyI6eyJvd25lciI6Ik1JTkkiLCJvcmRlciI6NH0sIkwzIjp7Im93bmVyIjoiYURoRCIsIm9yZGVyIjo5fSwiTDUiOnsib3duZXIiOiJhRGhEIiwib3JkZXIiOjV9LCJMNyI6eyJvd25lciI6ImFEaEQiLCJvcmRlciI6M30sIkw5Ijp7Im93bmVyIjoiYURoRCIsIm9yZGVyIjoxfSwiTDEwIjp7Im93bmVyIjoiVmFMVCIsIm9yZGVyIjoxMn0sIkwxMSI6eyJvd25lciI6IlZhTFQiLCJvcmRlciI6MTF9LCJMMTIiOnsib3duZXIiOiJNSU5JIiwib3JkZXIiOjZ9LCJMMTMiOnsib3duZXIiOiJNSU5JIiwib3JkZXIiOjd9LCJNNiI6eyJvd25lciI6ImFEaEQiLCJvcmRlciI6NH0sIk03Ijp7Im93bmVyIjoiVmFMVCIsIm9yZGVyIjoxNn0sIk04Ijp7Im93bmVyIjoiVmFMVCIsIm9yZGVyIjoxNX0sIk05Ijp7Im93bmVyIjoiVmFMVCIsIm9yZGVyIjoxNH0sIk0xMCI6eyJvd25lciI6IlZhTFQiLCJvcmRlciI6MTN9LCJNMTEiOnsib3duZXIiOiJWYUxUIiwib3JkZXIiOjEwfSwiTTEyIjp7Im93bmVyIjoiTUlOSSIsIm9yZGVyIjo5fSwiTTEzIjp7Im93bmVyIjoiTUlOSSIsIm9yZGVyIjo4fX0sIm1hcmtlcnMiOnt9LCJmaXhlZEFjdGl2ZSI6ZmFsc2UsImxhYmVsc1Zpc2libGUiOnRydWUsInN1bW1hcnlTdGF0ZXMiOnsiYURoRCI6eyJpc1Bpbm5lZCI6ZmFsc2UsImlzQ29sbGFwc2VkIjpmYWxzZX0sIlRIT1IiOnsiaXNQaW5uZWQiOmZhbHNlLCJpc0NvbGxhcHNlZCI6ZmFsc2V9LCJmQWZPIjp7ImlzUGlubmVkIjpmYWxzZSwiaXNDb2xsYXBzZWQiOmZhbHNlfSwiSGVSYSI6eyJpc1Bpbm5lZCI6ZmFsc2UsImlzQ29sbGFwc2VkIjpmYWxzZX0sIkNPTEQiOnsiaXNQaW5uZWQiOmZhbHNlLCJpc0NvbGxhcHNlZCI6ZmFsc2V9LCJWYUxUIjp7ImlzUGlubmVkIjpmYWxzZSwiaXNDb2xsYXBzZWQiOmZhbHNlfSwiYWRIRCI6eyJpc1Bpbm5lZCI6ZmFsc2UsImlzQ29sbGFwc2VkIjpmYWxzZX0sIkJSU0wiOnsiaXNQaW5uZWQiOmZhbHNlLCJpc0NvbGxhcHNlZCI6ZmFsc2V9LCJUb25lIjp7ImlzUGlubmVkIjpmYWxzZSwiaXNDb2xsYXBzZWQiOmZhbHNlfSwiTUlOSSI6eyJpc1Bpbm5lZCI6ZmFsc2UsImlzQ29sbGFwc2VkIjpmYWxzZX0sInlpNnIiOnsiaXNQaW5uZWQiOmZhbHNlLCJpc0NvbGxhcHNlZCI6ZmFsc2V9fX0="
    // The above example assigns A1 to THOR and marks A2 as dropped. Replace with your actual data.

    const alliances = {
        aDhD: { name: 'aDhD', color: 'rgba(232, 62, 140, 0.7)', cssClass: 'alliance-adhd-pink', cityLimit: 6, digSiteLimit: 4, cityCount: 0, digSiteCount: 0, buffs: {}, totalCPH: 0, totalRSPH: 0, assignmentCounter: 0, orderedAssignments: [], isPinned: false, isCollapsed: false },
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
    const allianceDisplayOrder = ['aDhD', 'THOR', 'fAfO', 'HeRa', 'COLD', 'VaLT', 'adHD', 'BRSL', 'Tone', 'MINI', 'yi6r'];
    const digSiteProduction = { 1: { coal: 2736, soil: 100 }, 2: { coal: 2880, soil: 110 }, 3: { coal: 3024, soil: 120 }, 4: { coal: 3168, soil: 130 }, 5: { coal: 3312, soil: 140 }, 6: { coal: 3456, soil: 150 } };
    const citySoilProduction = 350;
    const digSiteResistance = { 1: 3500, 2: 6000, 3: 8000, 4: 9500, 5: 10000, 6: 10500 };
    const ALL_BUFF_TYPES = ['Coin', 'Food', 'Iron', 'Gathering', 'March Speed', 'Construction', 'Research', 'Training', 'Healing'];
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
    const SAVE_KEY = 'allianceMapState_v12_autosave'; // Keep version key consistent unless schema changes

    // --- State Variables ---
    let fixedAlliancesActive = true;
    // let assignmentOrderActive = false; // Removed
    let labelsVisible = true;
    let currentSegmentId = null;
    let isInConflictSelectionMode = false;
    let conflictSelection = [];
    let liveMapLoaded = false; // Track if LIVE map was the last load action
    let mapStateDirtyAfterLiveLoad = false; // Track changes *after* LIVE load

    // --- Helper Functions ---
    function getIconClass(buffType) {
        switch (buffType?.toLowerCase()) {
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

    // --- Parse Land Data ---
    landDataInput.forEach(item => {
        const parts = item.split(': '); const id = parts[0]; const details = parts[1];
        let level = 0, name = '', buffValue = 0, buffType = '', type = 'Other';
        let coalPerHour = 0, rareSoilPerHour = 0, resistance = null;
        let bossType = null, bossIcon = null;

        if (id === 'G7') {
            level = 'N/A'; name = 'Capitol'; type = 'City';
            const bm = details.match(/(\d+)% (.*)/);
            if (bm) { buffValue = parseInt(bm[1], 10); buffType = bm[2]; }
            rareSoilPerHour = citySoilProduction;
        } else {
            const lm = details.match(/Level (\d+)/); if (lm) level = parseInt(lm[1], 10);
            const nameMatch = details.match(/Level \d+ ([\w\s]+?)(?: \d+%|\s*$)/);
            if (nameMatch) name = nameMatch[1].trim(); else name = 'Unknown';
            const bm = details.match(/(\d+)% (.*)/);
            if (bm) { buffValue = parseInt(bm[1], 10); buffType = bm[2]; }

            if (name.includes('Dig Site')) type = 'Dig Site';
            else if (cityTypes.some(city => name.includes(city))) type = 'City';
            else type = 'Other';

            if (type === 'Dig Site' && digSiteProduction[level]) {
                coalPerHour = digSiteProduction[level].coal;
                rareSoilPerHour = digSiteProduction[level].soil;
                resistance = digSiteResistance[level] || null;
            } else if (type === 'City' && level >= 1 && level <= 6) {
                rareSoilPerHour = citySoilProduction;
            }
        }

        if (type === 'Dig Site' && bossTypeMapping[id]) {
            bossType = bossTypeMapping[id];
            bossIcon = `S2Map.${bossType.toLowerCase()}.png`;
        }

        const isFixed = FIXED_ASSIGNMENTS.hasOwnProperty(id);
        landData[id] = {
            id, level, name, type, buffValue, buffType, iconClass: getIconClass(buffType),
            owner: null, isFixed, coalPerHour, rareSoilPerHour, resistance, assignmentOrder: null,
            bossType, bossIcon,
            isConflict: false, conflictAlliances: [], isDropped: false,
            originalHTMLContent: '' // Will be set during map generation
        };
    });

    // --- DOM Elements ---
    const mapGrid = document.getElementById('map-grid');
    const mapContainer = document.getElementById('map-container');
    const allianceSummaryDiv = document.getElementById('alliance-summary');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const bodyElement = document.body;
    const modalElement = document.getElementById('allianceSelectModal');
    const allianceSelectModalInstance = new bootstrap.Modal(modalElement);
    const modalBody = modalElement.querySelector('.modal-body'); // Cache modal body
    const modalTitle = document.getElementById('allianceSelectModalLabel');
    const modalDynamicTitleSpan = document.getElementById('modalDynamicTitle');

    // Modal Info Elements
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

    // Modal Button Elements
    const allianceButtonsDiv = document.getElementById('alliance-buttons');
    const clearAllianceButton = document.getElementById('clear-alliance-button');
    const markConflictButton = document.getElementById('mark-conflict-button');
    const markDropButton = document.getElementById('mark-drop-button');
    const clearMarksButton = document.getElementById('clear-marks-button');
    const cancelConflictSelectionButton = document.getElementById('cancel-conflict-selection-button');

    // Other Buttons/Toggles
    const clearAllButton = document.getElementById('clear-all-button');
    const fixedAllianceToggle = document.getElementById('fixed-alliance-toggle');
    // const assignmentOrderToggle = document.getElementById('assignment-order-toggle'); // Removed
    const labelVisibilityToggle = document.getElementById('label-visibility-toggle');
    const summaryItemContainer = allianceSummaryDiv.querySelector('.summary-item-container');
    const infoButton = document.getElementById('info-button');
    const infoModalElement = document.getElementById('infoModal');
    // const infoModal = new bootstrap.Modal(infoModalElement);

    // Import/Export/Live Elements
    const importMapButton = document.getElementById('import-map-button');
    const exportMapButton = document.getElementById('export-map-button');
    const liveMapButton = document.getElementById('live-map-button'); // Added LIVE button
    const codeModalElement = document.getElementById('codeModal');
    const codeModalInstance = new bootstrap.Modal(codeModalElement);
    const codeModalLabel = document.getElementById('codeModalLabel');
    const codeModalInstructions = document.getElementById('codeModalInstructions');
    const codeModalTextarea = document.getElementById('codeModalTextarea');
    const copyCodeButton = document.getElementById('copyCodeButton');
    const copyFeedbackElement = document.getElementById('copyFeedback'); // Get feedback element


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
            } else {
                 resistanceHTML = `<span class="segment-resistance"></span>`;
            }

            // Removed segment-assignment-order span from originalHTMLContent
            segmentData.originalHTMLContent = `
                <span class="segment-name">${segmentData.name}</span>
                <i class="segment-icon ${segmentData.iconClass}"></i>
                <span class="segment-buff">${segmentData.buffValue > 0 ? segmentData.buffValue + '%' + segmentData.buffType : ''}</span>
                ${resistanceHTML}
                <span class="segment-owner-name"></span> `; // Removed assignment order span

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

    // --- Center Map Function ---
    function centerOnG7() {
        const g7Element = mapGrid.querySelector('[data-id="G7"]');
        if (!g7Element) return;
        const mapRect = mapContainer.getBoundingClientRect();
        const elementWidth = g7Element.offsetWidth;
        const elementHeight = g7Element.offsetHeight;
        const viewportHeight = window.innerHeight;
        const baseHeightForDefaultZoom = 800;
        const defaultInitialZoom = 0.8;
        const minAllowedScale = panzoom.getOptions().minScale || 0.3;
        const heightFactor = Math.max(0, Math.min(1, viewportHeight / baseHeightForDefaultZoom));
        let calculatedZoom = defaultInitialZoom * (1 - (1 - heightFactor) * 0.5);
        const initialZoom = Math.max(minAllowedScale, calculatedZoom);
        panzoom.zoom(initialZoom, { animate: false });
        const zoomedElementWidth = elementWidth * initialZoom;
        const zoomedElementHeight = elementHeight * initialZoom;
        const zoomedG7CenterX = (g7Element.offsetLeft * initialZoom) + zoomedElementWidth / 2;
        const zoomedG7CenterY = (g7Element.offsetTop * initialZoom) + zoomedElementHeight / 2;
        const finalPanX = (mapRect.width / 2) - zoomedG7CenterX;
        const finalPanY = (mapRect.height / 2) - zoomedG7CenterY;
        panzoom.pan(finalPanX, finalPanY, { animate: false, force: true });
    }
    setTimeout(centerOnG7, 150); // Allow layout calculations

    // --- Event Handlers & Logic ---

    // --- Update Segment Visual State ---
    function updateSegmentVisualState(segmentId) {
        const segmentData = landData[segmentId];
        const segmentElement = mapGrid.querySelector(`[data-id="${segmentId}"]`);
        const segmentContentElement = segmentElement?.querySelector('.segment-content');

        if (!segmentData || !segmentElement || !segmentContentElement) return;

        segmentElement.classList.remove('conflict', 'dropped');
        Object.values(alliances).forEach(a => segmentElement.classList.remove(a.cssClass));

        if (segmentData.isConflict) {
            segmentElement.classList.add('conflict');
            segmentContentElement.innerHTML = `<span class="conflict-indicator">${segmentData.conflictAlliances.map(code => alliances[code]?.name || code).join(' vs ') || 'Conflict'}</span>`;
        } else if (segmentData.isDropped) {
            segmentElement.classList.add('dropped');
            segmentContentElement.innerHTML = `<span class="dropped-indicator">X</span>`;
        } else {
            segmentContentElement.innerHTML = segmentData.originalHTMLContent;
            // updateSegmentOrderDisplay(segmentId, segmentData.assignmentOrder); // Removed call

            if (segmentData.owner && alliances[segmentData.owner]) {
                segmentElement.classList.add(alliances[segmentData.owner].cssClass);
                const ownerNameSpan = segmentContentElement.querySelector('.segment-owner-name');
                if (ownerNameSpan) {
                    ownerNameSpan.textContent = alliances[segmentData.owner].name;
                }
            } else {
                 const ownerNameSpan = segmentContentElement.querySelector('.segment-owner-name');
                 if(ownerNameSpan) ownerNameSpan.textContent = '';
            }
        }
        bodyElement.classList.toggle('labels-hidden', !labelsVisible);
    }

    // --- Conflict Mode Handling ---
    // ... (Conflict mode functions remain the same) ...
        function enterConflictSelectionMode() {
        if (!currentSegmentId) return;
        const segmentData = landData[currentSegmentId];
        if (segmentData.isFixed && fixedAlliancesActive) {
            alert("Cannot mark conflict on a fixed segment while 'Designated War Palace' is active.");
            return;
        }

        isInConflictSelectionMode = true;
        conflictSelection = [];
        modalBody.classList.add('conflict-selection-active');
        modalDynamicTitleSpan.textContent = "Select TWO Alliances for Conflict";
        markConflictButton.style.display = 'none';
        markDropButton.style.display = 'none';
        clearMarksButton.style.display = 'none';
        cancelConflictSelectionButton.style.display = 'inline-flex';

        populateAllianceButtons(currentSegmentId);
        clearAllianceButton.disabled = true;
    }

    function exitConflictSelectionMode(processConflict = false) {
        isInConflictSelectionMode = false;
        modalBody.classList.remove('conflict-selection-active');
        modalDynamicTitleSpan.textContent = "Details & Assignment";
        markConflictButton.style.display = 'inline-flex';
        markDropButton.style.display = 'inline-flex';
        clearMarksButton.style.display = 'inline-flex';
        cancelConflictSelectionButton.style.display = 'none';


        if (processConflict && conflictSelection.length === 2) {
            const segmentData = landData[currentSegmentId];
            if (segmentData.owner) {
                clearAssignmentForSegment(currentSegmentId, false);
            }

            segmentData.isConflict = true;
            segmentData.conflictAlliances = [...conflictSelection];
            segmentData.isDropped = false;

            updateSegmentVisualState(currentSegmentId);
            updateAllianceSummary();
            saveState();
            allianceSelectModalInstance.hide();
        } else {
            populateAllianceButtons(currentSegmentId);
            const segmentData = landData[currentSegmentId];
            if (!processConflict && segmentData) {
                 clearAllianceButton.disabled = (segmentData.isFixed && fixedAlliancesActive) || !segmentData.owner || segmentData.isConflict || segmentData.isDropped;
            }
        }
        conflictSelection = [];
    }

    function handleConflictAllianceSelection(allianceCode) {
        if (!isInConflictSelectionMode || conflictSelection.length >= 2) return;

        if (!conflictSelection.includes(allianceCode)) {
            conflictSelection.push(allianceCode);
            populateAllianceButtons(currentSegmentId);
        }

        if (conflictSelection.length === 2) {
             modalDynamicTitleSpan.textContent = `Mark Conflict: ${alliances[conflictSelection[0]].name} vs ${alliances[conflictSelection[1]].name}?`;
             setTimeout(() => exitConflictSelectionMode(true), 200);
        }
    }

    markConflictButton.addEventListener('click', enterConflictSelectionMode);
    cancelConflictSelectionButton.addEventListener('click', () => exitConflictSelectionMode(false));

    // --- Other Action Button Handlers ---
    markDropButton.addEventListener('click', () => {
        if (!currentSegmentId) return;
        const segmentData = landData[currentSegmentId];
        if (segmentData.isFixed && fixedAlliancesActive) {
             alert("Cannot mark drop on a fixed segment while 'Designated War Palace' is active.");
             return;
        }
        if (segmentData.owner) {
            clearAssignmentForSegment(currentSegmentId, false);
        }
        segmentData.isDropped = true;
        segmentData.isConflict = false;
        segmentData.conflictAlliances = [];
        updateSegmentVisualState(currentSegmentId);
        updateAllianceSummary();
        saveState(); // This will now also trigger mapStateDirtyAfterLiveLoad if needed
        allianceSelectModalInstance.hide();
    });

    clearMarksButton.addEventListener('click', () => {
        if (!currentSegmentId) return;
        const segmentData = landData[currentSegmentId];
        segmentData.isConflict = false;
        segmentData.conflictAlliances = [];
        segmentData.isDropped = false;
        updateSegmentVisualState(currentSegmentId);
        saveState(); // This will now also trigger mapStateDirtyAfterLiveLoad if needed
        populateAllianceButtons(currentSegmentId);
    });

    // --- Update Order Display (Removed) ---
    // function updateSegmentOrderDisplay(segmentId, orderNumber) { ... }

    // --- Recalculate Alliance Counter ---
    // No change needed here, but assignmentOrder is now less critical for display
    function recalculateAllianceCounter(allianceCode) {
        if (!alliances[allianceCode]) return;
        const alliance = alliances[allianceCode];
        // Count non-null, unique, numeric orders
        const validOrders = [...new Set(alliance.orderedAssignments
            .map(item => item.order)
            .filter(order => typeof order === 'number' && !isNaN(order)))];
        alliance.assignmentCounter = validOrders.length > 0 ? Math.max(0, ...validOrders) : 0;
    }

    // --- Populate Alliance Buttons in Modal ---
    function populateAllianceButtons(segmentId) {
        const segmentData = landData[segmentId];
        allianceButtonsDiv.innerHTML = '';

        allianceDisplayOrder.forEach(code => {
            const data = alliances[code];
            if (!data) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.classList.add('btn', 'btn-sm', 'w-100', 'alliance-assign-button');
            button.style.backgroundColor = data.color;
            button.style.borderColor = data.color;
            button.style.color = '#fff';
            button.textContent = data.name;
            button.dataset.allianceCode = code;

            let isDisabled = false;
            let disabledReason = null;

            if (isInConflictSelectionMode) {
                button.onclick = () => handleConflictAllianceSelection(code);
                if (conflictSelection.includes(code)) {
                    button.classList.add('selected-for-conflict');
                    button.disabled = true;
                    disabledReason = ` (Selected)`;
                } else if (conflictSelection.length >= 2) {
                     isDisabled = true;
                     disabledReason = ` (Max 2)`;
                }
            } else {
                button.onclick = () => handleAllianceSelection(code);
                if (segmentData.isFixed && fixedAlliancesActive) {
                    isDisabled = true; disabledReason = ` (Fixed: ${FIXED_ASSIGNMENTS[segmentId]})`;
                } else if (segmentData.isConflict) {
                    isDisabled = true; disabledReason = ` (Conflict)`;
                } else if (segmentData.isDropped) {
                    isDisabled = true; disabledReason = ` (Dropped)`;
                } else if (segmentData.owner === code) {
                     isDisabled = true; disabledReason = ` (Assigned)`;
                } else {
                     if (segmentData.type === 'City' && data.cityCount >= data.cityLimit) {
                         isDisabled = true; disabledReason = ` (Limit: ${data.cityCount}/${data.cityLimit} Cities)`;
                     } else if (segmentData.type === 'Dig Site' && data.digSiteCount >= data.digSiteLimit) {
                         isDisabled = true; disabledReason = ` (Limit: ${data.digSiteCount}/${data.digSiteLimit} Digs)`;
                     }
                }
                 if (!isDisabled) {
                     if(segmentData.type === 'City') button.textContent += ` (${data.cityCount}/${data.cityLimit})`;
                     else if(segmentData.type === 'Dig Site') button.textContent += ` (${data.digSiteCount}/${data.digSiteLimit})`;
                 }
            }

            if (isDisabled || disabledReason) {
                 button.disabled = true;
                 if(disabledReason) button.textContent += disabledReason;
                 button.style.opacity = '0.65';
                 button.style.cursor = 'not-allowed';
            }
            allianceButtonsDiv.appendChild(button);
        });
    }

    // --- Handle Segment Click ---
    // ... (handleSegmentClick function remains largely the same, no assignment order logic needed) ...
    function handleSegmentClick(segmentId) {
        const segmentData = landData[segmentId];
        if (!segmentData) return;
        if (isInConflictSelectionMode) {
             exitConflictSelectionMode(false);
        }

        currentSegmentId = segmentId;
        modalSegmentIdSpan.textContent = segmentId;
        modalSegmentNameSpan.textContent = segmentData.name;
        modalSegmentLevelSpan.textContent = segmentData.level !== 'N/A' ? segmentData.level : 'N/A';
        modalSegmentBuffSpan.textContent = `${segmentData.buffValue > 0 ? segmentData.buffValue + '% ' + segmentData.buffType : 'None'}`;

        let prodText = '';
        if (segmentData.coalPerHour > 0) prodText += `<span class="resource-value">${segmentData.coalPerHour.toLocaleString()}</span> CPH `;
        if (segmentData.rareSoilPerHour > 0) prodText += `<span class="resource-value">${segmentData.rareSoilPerHour.toLocaleString()}</span> RSPH`;
        if (prodText) {
            modalSegmentProdSpan.innerHTML = prodText.trim();
            modalProdInfoContainer.style.display = 'block';
        } else {
            modalSegmentProdSpan.innerHTML = 'None';
            modalProdInfoContainer.style.display = 'block';
        }

        if (segmentData.type === 'Dig Site' && segmentData.resistance) {
            modalSegmentResistanceSpan.textContent = segmentData.resistance.toLocaleString();
            modalResistanceInfoContainer.style.display = 'block';
        } else {
            modalSegmentResistanceSpan.textContent = 'N/A';
            modalResistanceInfoContainer.style.display = 'block';
        }

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
            modalBossInfoContainer.style.display = 'block';
        }

        const modalPopoverTriggerList = modalElement.querySelectorAll('[data-bs-toggle="popover"]');
        modalPopoverTriggerList.forEach(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));

        populateAllianceButtons(segmentId);

        markConflictButton.disabled = (segmentData.isFixed && fixedAlliancesActive) || segmentData.isConflict || segmentData.isDropped;
        markDropButton.disabled = (segmentData.isFixed && fixedAlliancesActive) || segmentData.isConflict || segmentData.isDropped;
        clearMarksButton.disabled = (!segmentData.isConflict && !segmentData.isDropped) || (segmentData.isFixed && fixedAlliancesActive);

        clearAllianceButton.disabled = (segmentData.isFixed && fixedAlliancesActive) || !segmentData.owner || segmentData.isConflict || segmentData.isDropped;
        clearAllianceButton.onclick = () => handleAllianceSelection(null);

        allianceSelectModalInstance.show();
    }

    // --- Clear Assignment Helper ---
    function clearAssignmentForSegment(segmentId, updateSummaryAndSave = true) {
         const segmentData = landData[segmentId];
         const previousOwner = segmentData.owner;
         const previousOrder = segmentData.assignmentOrder; // Keep track of order for recalc

         if (!previousOwner) return false;

         const prevAlliance = alliances[previousOwner];
         if (prevAlliance) {
             if (segmentData.type === 'City') prevAlliance.cityCount = Math.max(0, prevAlliance.cityCount - 1);
             else if (segmentData.type === 'Dig Site') prevAlliance.digSiteCount = Math.max(0, prevAlliance.digSiteCount - 1);

             // Remove from orderedAssignments even if order display is off
             if (previousOrder !== null) {
                 const assignmentIndex = prevAlliance.orderedAssignments.findIndex(item => item.segmentId === segmentId);
                 if (assignmentIndex > -1) {
                     prevAlliance.orderedAssignments.splice(assignmentIndex, 1);
                     // Recalculate counter only if saving, otherwise parent function handles it
                     // if (updateSummaryAndSave) recalculateAllianceCounter(previousOwner); // Moved recalc after all changes
                 } else {
                     // If not found by segmentId, might be an inconsistent state, try to find by order if unique
                     const orderIndex = prevAlliance.orderedAssignments.findIndex(item => item.order === previousOrder);
                      if (orderIndex > -1 && prevAlliance.orderedAssignments.filter(item => item.order === previousOrder).length === 1) {
                         prevAlliance.orderedAssignments.splice(orderIndex, 1);
                         // if (updateSummaryAndSave) recalculateAllianceCounter(previousOwner); // Moved recalc after all changes
                     }
                 }
             }
         }
         segmentData.owner = null;
         segmentData.assignmentOrder = null; // Clear internal order
         if (updateSummaryAndSave) {
             // Recalculate here if called independently with save=true
              if (previousOwner) recalculateAllianceCounter(previousOwner);
             updateAllianceSummary();
             saveState(); // This will now also trigger mapStateDirtyAfterLiveLoad if needed
         }
         return true;
    }

    // --- Handle Alliance Selection (Assignment/Clearing) ---
    function handleAllianceSelection(allianceCode) {
        if (!currentSegmentId || isInConflictSelectionMode) return;
        const segmentData = landData[currentSegmentId];
        let assignmentChanged = false;
        const previousOwner = segmentData.owner;

        if ((segmentData.isFixed && fixedAlliancesActive) || segmentData.isConflict || segmentData.isDropped) {
            console.warn("Assignment blocked: Segment is fixed, conflict, or dropped.");
            return;
        }

        if (allianceCode === null) { // Clearing
            if (clearAssignmentForSegment(currentSegmentId, false)) { // Pass false, recalc/save later
                 assignmentChanged = true;
            }
        } else { // Assigning
            const newAlliance = alliances[allianceCode];
            if (!newAlliance) return;

            if (segmentData.type === 'City' && newAlliance.cityCount >= newAlliance.cityLimit) { alert(`${newAlliance.name} City limit reached.`); return; }
            if (segmentData.type === 'Dig Site' && newAlliance.digSiteCount >= newAlliance.digSiteLimit) { alert(`${newAlliance.name} Dig Site limit reached.`); return; }

            // Clear previous owner if exists, but don't save/update yet
            if (segmentData.owner) {
                clearAssignmentForSegment(currentSegmentId, false); // Pass false
            }

            segmentData.owner = allianceCode;
            segmentData.isConflict = false;
            segmentData.isDropped = false;
            segmentData.conflictAlliances = [];

            if (segmentData.type === 'City') newAlliance.cityCount++;
            else if (segmentData.type === 'Dig Site') newAlliance.digSiteCount++;

            // Increment counter and assign order internally
            newAlliance.assignmentCounter++;
            const newOrder = newAlliance.assignmentCounter;
            segmentData.assignmentOrder = newOrder;
            newAlliance.orderedAssignments.push({ segmentId: currentSegmentId, order: newOrder });
            newAlliance.orderedAssignments.sort((a, b) => a.order - b.order); // Keep sorted internally
            assignmentChanged = true;
        }

        if (assignmentChanged) {
            // Recalculate counters *after* all changes for the affected alliances
            if (previousOwner && previousOwner !== allianceCode) recalculateAllianceCounter(previousOwner);
            if (allianceCode) recalculateAllianceCounter(allianceCode);

            updateAllianceSummary(); // Update summary display
            updateSegmentVisualState(currentSegmentId); // Update segment display
            saveState(); // Save the new state (will trigger dirty flag if live map was loaded)
        }
        allianceSelectModalInstance.hide();
        currentSegmentId = null;
    }

    // --- Clear All Assignments ---
        function clearAllAssignments() {
        const confirmationMessage = fixedAlliancesActive
            ? "Are you sure you want to clear ALL user-assigned segments? Designated War Palace assignments and Conflict/Drop marks will REMAIN."
            : "Are you sure you want to clear ALL assigned segments (including fixed) and Conflict/Drop marks? Fixed toggle is OFF.";

        if (!confirm(confirmationMessage)) return;

        // Reset alliance counts and internal order tracking
        for (const code in alliances) {
            alliances[code].cityCount = 0; alliances[code].digSiteCount = 0;
            alliances[code].assignmentCounter = 0; alliances[code].orderedAssignments = [];
        }

        // Process each segment
        for (const segmentId in landData) {
            const segmentData = landData[segmentId];
            segmentData.assignmentOrder = null; // Clear internal order

            // Handle markers based on fixed toggle
             if (!fixedAlliancesActive) {
                 segmentData.isConflict = false; segmentData.conflictAlliances = [];
                 segmentData.isDropped = false;
             } else {
                 // If fixed is active, clear markers only if the segment is *not* fixed
                 if (!segmentData.isFixed) {
                     segmentData.isConflict = false; segmentData.conflictAlliances = [];
                     segmentData.isDropped = false;
                 }
             }

            // Handle ownership based on fixed toggle
            if (segmentData.isFixed && fixedAlliancesActive && FIXED_ASSIGNMENTS[segmentId]) {
                 const fixedOwnerCode = FIXED_ASSIGNMENTS[segmentId];
                 const alliance = alliances[fixedOwnerCode];
                 if (alliance) {
                     segmentData.owner = fixedOwnerCode; // Assign fixed owner
                     // Increment fixed owner's count (check limits - though less critical here as we reset at start)
                     let canAssignFixed = false;
                      if (segmentData.type === 'City') { if (alliance.cityCount < alliance.cityLimit) { alliance.cityCount++; canAssignFixed = true; } }
                      else if (segmentData.type === 'Dig Site') { if (alliance.digSiteCount < alliance.digSiteLimit) { alliance.digSiteCount++; canAssignFixed = true; } }
                      else { canAssignFixed = true; }
                      if (!canAssignFixed) { console.warn(`Clear All: Limit for fixed ${fixedOwnerCode} at ${segmentId}. Cannot assign.`); segmentData.owner = null; }
                      else {
                           // If assigning fixed, ensure markers are cleared
                           segmentData.isConflict = false; segmentData.conflictAlliances = []; segmentData.isDropped = false;
                      }
                 } else { segmentData.owner = null; } // Invalid fixed alliance code?
            } else {
                // If not fixed or fixed is off, clear the owner
                segmentData.owner = null;
            }
            updateSegmentVisualState(segmentId); // Update visual immediately
        }

        // Recalculate all counters based on final state (mainly for fixed assignments)
        Object.keys(alliances).forEach(recalculateAllianceCounter);
        updateAllianceSummary();
        saveState(); // Save the cleared state (will trigger dirty flag if live map was loaded)
        console.log("Assignments cleared based on fixed toggle state.");
    }
    clearAllButton.addEventListener('click', clearAllAssignments);

    // --- Toggle Fixed Alliances ---
    function toggleFixedAlliances(isActive) {
        fixedAlliancesActive = isActive;
        const originalAssignments = {}; // Store owner and order
        const originalMarkers = {}; // Store conflict/drop state

        // Store current state before making changes
        for (const segmentId in landData) {
             originalAssignments[segmentId] = { owner: landData[segmentId].owner, order: landData[segmentId].assignmentOrder };
             originalMarkers[segmentId] = { isConflict: landData[segmentId].isConflict, conflictAlliances: [...landData[segmentId].conflictAlliances], isDropped: landData[segmentId].isDropped };
        }

        // Reset counts and internal lists before reapplying based on new toggle state
        for (const code in alliances) {
             alliances[code].cityCount = 0; alliances[code].digSiteCount = 0; alliances[code].assignmentCounter = 0; alliances[code].orderedAssignments = [];
        }

        // --- Iterate and apply new state based on toggle ---
        for (const segmentId in landData) {
            const segmentData = landData[segmentId];
            const originalState = originalAssignments[segmentId];
            const originalMarkerState = originalMarkers[segmentId];

            if (segmentData.isFixed && FIXED_ASSIGNMENTS[segmentId]) {
                // --- Handling Fixed Segments ---
                const fixedAllianceCode = FIXED_ASSIGNMENTS[segmentId];
                const fixedAlliance = alliances[fixedAllianceCode];

                if (isActive) { // Turning Fixed ON
                     segmentData.owner = fixedAllianceCode; // Assign fixed owner
                     segmentData.assignmentOrder = null; // Fixed have no user order
                     segmentData.isConflict = false; segmentData.conflictAlliances = []; segmentData.isDropped = false; // Clear markers

                     // Increment count for the fixed alliance (check limits)
                     if (fixedAlliance) {
                         let canAssignFixed = false;
                         if (segmentData.type === 'City') { if (fixedAlliance.cityCount < fixedAlliance.cityLimit) { fixedAlliance.cityCount++; canAssignFixed = true; } }
                         else if (segmentData.type === 'Dig Site') { if (fixedAlliance.digSiteCount < fixedAlliance.digSiteLimit) { fixedAlliance.digSiteCount++; canAssignFixed = true; } }
                         else { canAssignFixed = true; }
                         if (!canAssignFixed) { console.warn(`Toggle ON: Limit for fixed ${fixedAllianceCode} at ${segmentId}. Cannot assign.`); segmentData.owner = null; }
                     } else { segmentData.owner = null; } // Invalid fixed alliance?

                } else { // Turning Fixed OFF
                     // Revert to the state it had *before* the toggle action
                     segmentData.owner = originalState.owner;
                     segmentData.assignmentOrder = originalState.order;
                     // Restore markers only if it wasn't the fixed alliance owning it before toggle
                     if (originalState.owner !== fixedAllianceCode) {
                         segmentData.isConflict = originalMarkerState.isConflict;
                         segmentData.conflictAlliances = [...originalMarkerState.conflictAlliances];
                         segmentData.isDropped = originalMarkerState.isDropped;
                     } else {
                        // If it *was* the fixed owner, ensure markers are clear after toggle OFF
                        segmentData.isConflict = false; segmentData.conflictAlliances = []; segmentData.isDropped = false;
                     }
                      // Recount owners below
                }
            } else {
                // --- Handling Non-Fixed Segments ---
                 // Owner, order, and markers remain unchanged by the fixed toggle itself
                 segmentData.owner = originalState.owner;
                 segmentData.assignmentOrder = originalState.order;
                 segmentData.isConflict = originalMarkerState.isConflict;
                 segmentData.conflictAlliances = [...originalMarkerState.conflictAlliances];
                 segmentData.isDropped = originalMarkerState.isDropped;
                 // Recount owners below
            }
        }

        // --- Recount ALL assignments and rebuild ordered lists based on the NEW state ---
         for (const segmentId in landData) {
             const segmentData = landData[segmentId];
             if (segmentData.owner && (!segmentData.isFixed || !fixedAlliancesActive)) { // Count only non-fixed owners (or all if toggle is OFF)
                 const currentOwner = segmentData.owner;
                 const alliance = alliances[currentOwner];
                 if (alliance) {
                    // Increment counts for the current owner
                    if (segmentData.type === 'City') alliance.cityCount++;
                    else if (segmentData.type === 'Dig Site') alliance.digSiteCount++;

                     // Re-add to ordered assignments if it has an order number
                     if (segmentData.assignmentOrder !== null) {
                         alliance.orderedAssignments.push({ segmentId: segmentId, order: segmentData.assignmentOrder });
                     }
                 }
             }
              // Update visual state for all segments reflecting the new state
             updateSegmentVisualState(segmentId);
         }

         // Sort ordered assignments and recalculate counters for all alliances
         for (const code in alliances) {
             alliances[code].orderedAssignments.sort((a, b) => a.order - b.order);
             recalculateAllianceCounter(code);
         }

        updateAllianceSummary();
        saveState(); // Save the state after toggle (will trigger dirty flag if live map was loaded)
    }
    fixedAllianceToggle.addEventListener('change', (event) => toggleFixedAlliances(event.target.checked));

    // --- Toggle Assignment Order View (Removed) ---
    // function toggleAssignmentOrderView(isActive) { ... }
    // assignmentOrderToggle.addEventListener('change', ...);

    // --- Toggle Label Visibility ---
    function toggleLabelVisibility(isVisible) {
        labelsVisible = isVisible;
        bodyElement.classList.toggle('labels-hidden', !isVisible);
        saveState(); // Save view preference immediately
    }
    labelVisibilityToggle.addEventListener('change', (event) => {
        toggleLabelVisibility(event.target.checked);
        // saveState(); // Called within toggleLabelVisibility now
    });

    // --- Calculate Alliance Stats ---
     function calculateAllianceBuffs() {
        for (const code in alliances) { alliances[code].buffs = {}; }
        for (const segmentId in landData) {
            const segment = landData[segmentId];
            if (segment.owner && alliances[segment.owner] && !segment.isConflict && !segment.isDropped) {
                const alliance = alliances[segment.owner];
                if (segment.buffValue > 0 && segment.buffType) {
                    if (!alliance.buffs[segment.buffType]) alliance.buffs[segment.buffType] = 0;
                    alliance.buffs[segment.buffType] += segment.buffValue;
                }
            }
        }
    }
    function calculateAllianceResources() {
        for (const code in alliances) { alliances[code].totalCPH = 0; alliances[code].totalRSPH = 0; }
        for (const segmentId in landData) {
            const segment = landData[segmentId];
             if (segment.owner && alliances[segment.owner] && !segment.isConflict && !segment.isDropped) {
                alliances[segment.owner].totalCPH += segment.coalPerHour || 0;
                alliances[segment.owner].totalRSPH += segment.rareSoilPerHour || 0;
            }
        }
    }


    // --- Initialize Popovers ---
     function initializePopovers() {
        const existingPopovers = document.querySelectorAll('[data-bs-toggle="popover"]');
        existingPopovers.forEach(el => {
             const instance = bootstrap.Popover.getInstance(el);
             if (instance) instance.dispose();
        });
        const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
        [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl, {
             trigger: 'hover focus', html: true
        }));
    }

    // --- Summary Pin/Collapse Toggles ---
    function toggleAlliancePin(allianceCode) {
        if (alliances[allianceCode]) {
            alliances[allianceCode].isPinned = !alliances[allianceCode].isPinned;
            updateAllianceSummary();
            saveState(); // Save change (no map change, so doesn't affect dirty flag)
        }
    }
    function toggleAllianceCollapse(allianceCode) {
        if (alliances[allianceCode]) {
            alliances[allianceCode].isCollapsed = !alliances[allianceCode].isCollapsed;
            const summaryItem = summaryItemContainer.querySelector(`.summary-item[data-alliance-code="${allianceCode}"]`);
            const collapseIcon = summaryItem?.querySelector('.summary-collapse-toggle i');
            if (summaryItem && collapseIcon) {
                summaryItem.classList.toggle('collapsed', alliances[allianceCode].isCollapsed);
                collapseIcon.classList.toggle('fa-chevron-down', !alliances[allianceCode].isCollapsed);
                collapseIcon.classList.toggle('fa-chevron-up', alliances[allianceCode].isCollapsed);
            }
            saveState(); // Save change (no map change, so doesn't affect dirty flag)
        }
    }

    // --- Update LIVE Button State ---
    function updateLiveButtonState() {
        if (liveMapLoaded && !mapStateDirtyAfterLiveLoad) {
            liveMapButton.classList.add('live-map-active');
            liveMapButton.title = "Live map loaded (Unchanged)";
        } else {
            liveMapButton.classList.remove('live-map-active');
            liveMapButton.title = "Import Live Map Data";
            if (liveMapLoaded && mapStateDirtyAfterLiveLoad) {
                 liveMapButton.title = "Live map loaded (Changed)";
            }
        }
    }

    // --- Update Alliance Summary Display ---
    function updateAllianceSummary() {
        calculateAllianceBuffs();
        calculateAllianceResources();
        summaryItemContainer.innerHTML = '';

        const pinnedAlliances = allianceDisplayOrder.filter(code => alliances[code]?.isPinned);
        const unpinnedAlliances = allianceDisplayOrder.filter(code => !alliances[code]?.isPinned);
        const displayOrder = [...pinnedAlliances, ...unpinnedAlliances];

        displayOrder.forEach(code => {
            const data = alliances[code];
            if (!data) return;

            const itemDiv = document.createElement('div');
            itemDiv.className = `summary-item ${data.isPinned ? 'pinned' : ''} ${data.isCollapsed ? 'collapsed' : ''}`;
            itemDiv.dataset.allianceCode = code;

            const headerDiv = document.createElement('div');
            headerDiv.className = 'summary-header';
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
            resourcesDiv.className = 'summary-resources';
            resourcesDiv.innerHTML = `<span><span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Coal Per Hour">Cph</span><span class="resource-value">${data.totalCPH.toLocaleString() || 0}</span></span> | <span><span class="resource-label" data-bs-toggle="popover" data-bs-trigger="hover focus" title="Rare Soil Per Hour">RSph</span><span class="resource-value">${data.totalRSPH.toLocaleString() || 0}</span></span>`;

            const countsDiv = document.createElement('div');
            countsDiv.className = 'summary-counts';
            countsDiv.innerHTML = `Cities: ${data.cityCount}/${data.cityLimit} | Digs: ${data.digSiteCount}/${data.digSiteLimit}`;

            const buffsUl = document.createElement('ul');
            buffsUl.className = 'summary-buffs-list';
            const sortedBuffTypes = ALL_BUFF_TYPES.filter(buffType => data.buffs[buffType] > 0);
            sortedBuffTypes.forEach(buffType => {
                const buffLi = document.createElement('li');
                buffLi.innerHTML = `<i class="${getIconClass(buffType)}"></i><span class="buff-name">${buffType}</span><span class="buff-value">${data.buffs[buffType] || 0}%</span>`;
                buffsUl.appendChild(buffLi);
            });
            if (sortedBuffTypes.length === 0) {
                buffsUl.innerHTML = '<li class="no-buffs">No active buffs</li>';
            }

            itemDiv.appendChild(headerDiv);
            itemDiv.appendChild(resourcesDiv);
            itemDiv.appendChild(countsDiv);
            itemDiv.appendChild(buffsUl);
            summaryItemContainer.appendChild(itemDiv);

            itemDiv.querySelector('.summary-pin-toggle')?.addEventListener('click', (e) => { e.stopPropagation(); toggleAlliancePin(code); });
            itemDiv.querySelector('.summary-collapse-toggle')?.addEventListener('click', (e) => { e.stopPropagation(); toggleAllianceCollapse(code); });
        });
        updateLiveButtonState(); // Update LIVE button state whenever summary refreshes
        initializePopovers(); // Re-initialize popovers after summary update
    }

    // --- Save State (Auto-save) ---
    function saveState() {
        // If live map was previously loaded (and maybe now dirty), mark as dirty.
        // Don't reset liveMapLoaded here, only when LIVE is clicked again.
        if (liveMapLoaded) {
            mapStateDirtyAfterLiveLoad = true;
            // liveMapLoaded = false; // Resetting flag moved to handleLiveMapImport
            console.log("Map state changed after LIVE load, marking as dirty.");
        }

        const stateToSave = {
            assignments: {}, markers: {}, fixedActive: fixedAlliancesActive,
            // assignmentOrderViewActive: false, // Removed
            labelsVisible: labelsVisible,
            summaryStates: {}
        };

        for (const segmentId in landData) {
            const segmentData = landData[segmentId];
            // Save assignments only if they are NOT fixed OR if fixed toggle is OFF
             if (segmentData.owner && (!segmentData.isFixed || !fixedAlliancesActive)) {
                // Also ensure there's an assignment order (even if not displayed)
                 if (segmentData.assignmentOrder !== null) {
                    stateToSave.assignments[segmentId] = { owner: segmentData.owner, order: segmentData.assignmentOrder };
                 } else {
                     // Handle cases where owner exists but order is null (shouldn't happen with current logic, but good safeguard)
                     console.warn(`Segment ${segmentId} owned by ${segmentData.owner} but has null order during save.`);
                 }
            }
            // Save markers only if they are NOT fixed OR if fixed toggle is OFF
             if ((segmentData.isConflict || segmentData.isDropped) && (!segmentData.isFixed || !fixedAlliancesActive)) {
                 stateToSave.markers[segmentId] = { isConflict: segmentData.isConflict, conflictAlliances: segmentData.conflictAlliances, isDropped: segmentData.isDropped };
             }
        }
        for (const code in alliances) {
             stateToSave.summaryStates[code] = { isPinned: alliances[code].isPinned, isCollapsed: alliances[code].isCollapsed };
        }

        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
            // console.log(`Map state auto-saved to key: ${SAVE_KEY}`);
        } catch (e) {
            console.error("Error auto-saving state to localStorage:", e);
        }
         // Update the Live button state immediately after saving/state change
         updateLiveButtonState();
    }

    // --- Apply Fixed Assignments on Load ---
    function applyFixedAssignmentsOnLoad() {
        if (fixedAlliancesActive) {
            for (const segmentId in FIXED_ASSIGNMENTS) {
                if (landData[segmentId]) {
                    const segmentData = landData[segmentId];
                    const allianceCode = FIXED_ASSIGNMENTS[segmentId];
                    const alliance = alliances[allianceCode];
                    // Only apply if the segment isn't already owned by the correct fixed alliance
                    if (alliance && (!segmentData.owner || segmentData.owner !== allianceCode)) {
                        // If it was owned by someone else, clear that first (without saving)
                        if(segmentData.owner && segmentData.owner !== allianceCode) {
                             console.warn(`Init/Load: Overwriting saved/current owner ${segmentData.owner} with fixed ${allianceCode} for ${segmentId}`);
                             clearAssignmentForSegment(segmentId, false); // Don't trigger save/update here
                        }
                        // Check limits before assigning
                        let canAssignFixed = false;
                        if (segmentData.type === 'City') { if (alliance.cityCount < alliance.cityLimit) { alliance.cityCount++; canAssignFixed = true; } }
                        else if (segmentData.type === 'Dig Site') { if (alliance.digSiteCount < alliance.digSiteLimit) { alliance.digSiteCount++; canAssignFixed = true; } }
                        else { canAssignFixed = true; }

                        if (canAssignFixed) {
                            segmentData.owner = allianceCode;
                            segmentData.assignmentOrder = null; // Fixed assignments have no user order
                            segmentData.isConflict = false; segmentData.isDropped = false; segmentData.conflictAlliances = []; // Clear markers
                        } else {
                             console.warn(`Init/Load: Limit for fixed ${allianceCode} at ${segmentId}. Cannot assign.`);
                             segmentData.owner = null; // Ensure it's unowned if limit reached
                        }
                    } else if (segmentData.owner === allianceCode) {
                         // If already owned by the correct fixed alliance, just ensure markers/order are cleared
                         segmentData.isConflict = false; segmentData.isDropped = false; segmentData.conflictAlliances = [];
                         segmentData.assignmentOrder = null;
                    }
                }
            }
        }
         // Note: Recalculation of counters and summary update happens after all assignments are processed in the calling function (initializeMapState, handleImportMap, etc.)
    }


    // --- Initialize/Load Map State (Auto-load) ---
    function initializeMapState() {
        const savedStateRaw = localStorage.getItem(SAVE_KEY);
        // Default structure, removed assignmentOrderViewActive
        let parsedState = { assignments: {}, markers: {}, fixedActive: true, labelsVisible: true, summaryStates: {} };

        console.log(`Initializing map state internally from key: ${SAVE_KEY}`);

        if (savedStateRaw) {
            try {
                const loaded = JSON.parse(savedStateRaw);
                 // Validate structure, remove assignmentOrderViewActive check
                if (loaded && typeof loaded.assignments === 'object' && loaded.assignments !== null &&
                    typeof loaded.markers === 'object' && loaded.markers !== null &&
                    typeof loaded.fixedActive === 'boolean' &&
                    typeof loaded.labelsVisible === 'boolean' && // Keep this check
                    typeof loaded.summaryStates === 'object' && loaded.summaryStates !== null) {
                    parsedState = loaded;
                    // parsedState.assignmentOrderViewActive = false; // No longer needed
                    parsedState.labelsVisible = loaded.labelsVisible; // Keep loading labelsVisible
                } else {
                    console.warn(`Invalid saved state structure (Key: ${SAVE_KEY}), using defaults.`);
                    localStorage.removeItem(SAVE_KEY);
                }
            } catch (e) {
                console.error(`Failed to parse saved state (Key: ${SAVE_KEY}), using defaults.`, e);
                localStorage.removeItem(SAVE_KEY);
            }
        }

        // Apply toggle states FIRST
        fixedAlliancesActive = parsedState.fixedActive; fixedAllianceToggle.checked = fixedAlliancesActive;
        // assignmentOrderActive = false; assignmentOrderToggle.checked = false; // Removed
        labelsVisible = parsedState.labelsVisible; labelVisibilityToggle.checked = labelsVisible;
        // bodyElement.classList.remove('assignment-order-active'); // Ensure class is removed
        bodyElement.classList.toggle('labels-hidden', !labelsVisible);

        // Reset Counts and Map State
        resetMapState();

        // Apply Saved User Assignments (Non-Fixed)
        applyUserAssignments(parsedState.assignments);

        // Apply Fixed Assignments (based on the loaded fixedActive state)
        applyFixedAssignmentsOnLoad();

        // Sort orders and recalc counters for all alliances
        for (const code in alliances) {
            alliances[code].orderedAssignments.sort((a, b) => a.order - b.order);
            recalculateAllianceCounter(code);
        }

        // Apply Saved Markers (respecting fixed toggle state)
        applyMarkers(parsedState.markers);

        // Apply saved Summary States
        applySummaryStates(parsedState.summaryStates);

        // Reset LIVE map flags on initial load
        liveMapLoaded = false;
        mapStateDirtyAfterLiveLoad = false;

        console.log(`Map state initialized internally. Visual refresh needed.`);
    }

    // --- Helper: Reset Map State ---
    function resetMapState() {
         for (const code in alliances) {
             alliances[code].cityCount = 0; alliances[code].digSiteCount = 0; alliances[code].buffs = {};
             alliances[code].totalCPH = 0; alliances[code].totalRSPH = 0; alliances[code].assignmentCounter = 0; alliances[code].orderedAssignments = [];
             // Keep pin/collapse state unless explicitly reset by import/load
         }
         for (const segmentId in landData) {
             landData[segmentId].owner = null; landData[segmentId].assignmentOrder = null;
             landData[segmentId].isConflict = false; landData[segmentId].conflictAlliances = []; landData[segmentId].isDropped = false;
         }
         console.log("Internal map state reset (assignments/markers/counts).");
    }

    // --- Helper: Apply User Assignments ---
    function applyUserAssignments(assignments) {
        const validAssignments = Object.entries(assignments || {})
            // Ensure segment exists and data includes owner and a valid order number
            .filter(([id, data]) => data && data.owner && typeof data.order === 'number' && landData[id]);

        validAssignments.forEach(([segmentId, assignmentData]) => {
            const segmentData = landData[segmentId];
            const allianceCode = assignmentData.owner;
            const alliance = alliances[allianceCode];

            // Only apply if the segment is NOT fixed OR if the fixed toggle is currently OFF
            if (alliance && (!segmentData.isFixed || !fixedAlliancesActive)) {
                let canAssignUser = false;
                if (segmentData.type === 'City') { if (alliance.cityCount < alliance.cityLimit) { alliance.cityCount++; canAssignUser = true; } }
                else if (segmentData.type === 'Dig Site') { if (alliance.digSiteCount < alliance.digSiteLimit) { alliance.digSiteCount++; canAssignUser = true; } }
                else { canAssignUser = true; } // Allow assigning non-city/dig sites

                if (canAssignUser) {
                    segmentData.owner = allianceCode;
                    segmentData.assignmentOrder = assignmentData.order; // Restore the saved order
                    alliance.orderedAssignments.push({ segmentId: segmentId, order: assignmentData.order });
                } else { console.warn(`Load/Import: Limit reached for ${allianceCode} at ${segmentId}. Assignment ignored.`); }
            } else if (!alliance) {
                 console.warn(`Load/Import: Unknown alliance code "${allianceCode}" found for ${segmentId}. Assignment ignored.`);
            } else if (segmentData.isFixed && fixedAlliancesActive) {
                // Log if we are skipping a saved assignment because it's now fixed
                 console.log(`Load/Import: Skipping saved assignment for ${segmentId} (${allianceCode}) because it is currently a fixed assignment.`);
            }
        });
        console.log(`Attempted to apply ${validAssignments.length} user assignments (respecting fixed toggle).`);
        // Note: Recalculation of counters and summary update happens after all assignments are processed.
    }

     // --- Helper: Apply Markers ---
    function applyMarkers(markers) {
         let appliedCount = 0;
         for (const segmentId in markers || {}) {
            if (landData[segmentId]) {
                const segmentData = landData[segmentId];
                const markerData = markers[segmentId];

                // Apply markers only if the segment is NOT fixed OR fixed toggle is OFF
                if (!segmentData.isFixed || !fixedAlliancesActive) {
                     // If applying a marker, ensure the segment is not currently owned (markers override owners)
                     if ((markerData.isDropped || markerData.isConflict) && segmentData.owner) {
                         console.warn(`Load/Import: Clearing owner ${segmentData.owner} from ${segmentId} due to drop/conflict marker.`);
                         clearAssignmentForSegment(segmentId, false); // Clear assignment without saving yet
                     }
                     segmentData.isConflict = markerData.isConflict || false;
                     segmentData.conflictAlliances = markerData.conflictAlliances || [];
                     segmentData.isDropped = markerData.isDropped || false;
                     appliedCount++;
                } else { console.warn(`Load/Import: Conflict/Drop marker ignored for fixed segment ${segmentId}.`); }
            }
        }
        console.log(`Applied ${appliedCount} markers (respecting fixed toggle).`);
    }

    // --- Helper: Apply Summary States ---
    function applySummaryStates(summaryStates) {
         for (const code in alliances) {
             if (summaryStates && summaryStates[code]) {
                 alliances[code].isPinned = !!summaryStates[code].isPinned;
                 alliances[code].isCollapsed = !!summaryStates[code].isCollapsed;
             } else {
                 // Default if not found in saved state
                 alliances[code].isPinned = false;
                 alliances[code].isCollapsed = false;
             }
         }
        console.log("Applied summary pin/collapse states.");
    }

    // --- Helper: Update All Segments Visual State ---
    function updateAllSegmentsVisualState() {
        console.log("Updating all segment visuals...");
        Object.keys(landData).forEach(updateSegmentVisualState);
        console.log("Finished updating all segment visuals.");
    }


    // --- Load from Google Sheet (Placeholder - requires setup) ---
    // ... (loadCurrentStateFromSheet function remains the same - placeholder) ...

    // --- Sidebar Toggle Logic ---
        function setSidebarState(isActive) {
        const sidebarIcon = sidebarToggleBtn.querySelector('i');
        bodyElement.classList.toggle('sidebar-active', isActive);
        allianceSummaryDiv.classList.toggle('sidebar-collapsed', !isActive);
        sidebarToggleBtn.title = isActive ? "Hide Alliance Summary" : "Show Alliance Summary";
        if (sidebarIcon) sidebarIcon.className = isActive ? 'fa-solid fa-chevron-right' : 'fa-solid fa-bars';
    }
    sidebarToggleBtn.addEventListener('click', () => setSidebarState(!bodyElement.classList.contains('sidebar-active')));

    // --- Import/Export Logic ---
    function generateMapCode() {
        const stateToExport = {
             assignments: {}, markers: {},
             fixedActive: fixedAlliancesActive,
             // assignmentOrderViewActive: false, // No longer needed
             labelsVisible: labelsVisible,
             summaryStates: {}
        };

        for (const segmentId in landData) {
            const segmentData = landData[segmentId];
            // Export assignments only if they are NOT fixed OR if fixed toggle is OFF
             if (segmentData.owner && (!segmentData.isFixed || !fixedAlliancesActive) && segmentData.assignmentOrder !== null) {
                stateToExport.assignments[segmentId] = { owner: segmentData.owner, order: segmentData.assignmentOrder };
            }
            // Export markers only if they are NOT fixed OR if fixed toggle is OFF
             if ((segmentData.isConflict || segmentData.isDropped) && (!segmentData.isFixed || !fixedAlliancesActive)) {
                 stateToExport.markers[segmentId] = { isConflict: segmentData.isConflict, conflictAlliances: segmentData.conflictAlliances, isDropped: segmentData.isDropped };
             }
        }
         for (const code in alliances) {
             stateToExport.summaryStates[code] = { isPinned: alliances[code].isPinned, isCollapsed: alliances[code].isCollapsed };
        }

        try {
            const jsonString = JSON.stringify(stateToExport);
            return btoa(jsonString); // Encode to Base64
        } catch (e) {
            console.error("Error generating export code:", e);
            alert("Failed to generate export code.");
            return null;
        }
    }

    function handleExportMap() {
        const code = generateMapCode();
        if (code) {
            codeModalLabel.textContent = "Export Map Code";
            // Updated instructions
            codeModalInstructions.textContent = "Copy the code below to share or save your current map state (including non-fixed assignments, markers, view toggles, and sidebar pin/collapse states).";
            codeModalTextarea.value = code;
            codeModalTextarea.readOnly = true;
            copyFeedbackElement.style.display = 'none';
            copyCodeButton.innerHTML = '<i class="fa-regular fa-copy me-1"></i>Copy Code';
            codeModalInstance.show();
        }
    }

    function applyImportedState(importedState, isLiveImport = false) {
        // --- Apply imported state directly ---
        console.log(`Applying state from ${isLiveImport ? 'LIVE source' : 'Import Code'}...`);

        // Apply toggle states FIRST from imported data (unless it's LIVE import)
        if (!isLiveImport) {
            fixedAlliancesActive = importedState.fixedActive; fixedAllianceToggle.checked = fixedAlliancesActive;
            // assignmentOrderActive = false; assignmentOrderToggle.checked = false; // Removed
            labelsVisible = importedState.labelsVisible; labelVisibilityToggle.checked = labelsVisible;
            // bodyElement.classList.remove('assignment-order-active');
            bodyElement.classList.toggle('labels-hidden', !labelsVisible);
        } else {
             // For LIVE import, keep current view settings (fixed, labels)
             console.log("LIVE import: Keeping current view settings.");
        }

        // Reset internal counts/assignments
        resetMapState();

        // Apply imported user assignments (respects *current* fixedAlliancesActive state)
        applyUserAssignments(importedState.assignments);

        // Apply fixed assignments (based on the *current* fixedAlliancesActive state)
        applyFixedAssignmentsOnLoad();

        // Recalculate counters and sort orders
        for (const code in alliances) {
            alliances[code].orderedAssignments.sort((a, b) => a.order - b.order);
            recalculateAllianceCounter(code);
        }

        // Apply imported markers (respects *current* fixedAlliancesActive state)
        applyMarkers(importedState.markers);

        // Apply imported summary states (unless it's LIVE import)
        if (!isLiveImport) {
            applySummaryStates(importedState.summaryStates);
        } else {
             console.log("LIVE import: Keeping current summary pin/collapse states.");
        }


        // --- Explicitly refresh visuals AFTER applying state ---
        console.log("Queueing visual refresh after state application...");
         setTimeout(() => {
             console.log(`Executing delayed visual refresh after ${isLiveImport ? 'LIVE' : 'Import'}...`);
             updateAllSegmentsVisualState();
             updateAllianceSummary(); // Uses current pin/collapse states
             initializePopovers();

             if (isLiveImport) {
                liveMapLoaded = true; // Set flag indicating LIVE map was just loaded
                mapStateDirtyAfterLiveLoad = false; // Reset dirty flag
                console.log("LIVE map loaded successfully. Flags set.");
                 updateLiveButtonState(); // Update button immediately
             } else {
                 // Reset LIVE flags if importing regular code
                 liveMapLoaded = false;
                 mapStateDirtyAfterLiveLoad = false;
                 saveState(); // Save the successfully imported state as the new auto-save
                 console.log("Regular import complete. Saved to auto-save. LIVE flags reset.");
                 alert("Map state imported successfully!");
             }
         }, 0); // 0ms delay ensures it runs after current execution context
    }


    function handleImportMap() {
        const code = prompt("Paste the map code here to load a saved state:");
        if (code === null || code.trim() === "") {
            return; // User cancelled or entered nothing
        }

        try {
            const jsonString = atob(code.trim()); // Decode Base64
            const importedState = JSON.parse(jsonString);

            // Validate imported structure (removed assignmentOrderViewActive)
            if (!importedState || typeof importedState.assignments !== 'object' ||
                typeof importedState.markers !== 'object' || typeof importedState.fixedActive !== 'boolean' ||
                typeof importedState.labelsVisible !== 'boolean' || // Keep this
                typeof importedState.summaryStates !== 'object') {
                throw new Error("Invalid or incomplete code structure.");
            }

            if (!confirm("Importing this code will overwrite your current map state, including view settings. Continue?")) {
                return;
            }

            applyImportedState(importedState, false); // Apply as regular import

        } catch (e) {
            console.error("Error importing map code:", e);
            alert(`Failed to import map code. ${e.message}. Please ensure the code is valid and complete.`);
        }
    }

     // --- Get LIVE map data from the constant variable ---
    function getLiveMapData() {
        console.log("Getting LIVE map data from internal constant.");
        // Simply return the value of the constant defined at the top
        return LIVE_MAP_DATA_B64;
    }

    // --- Handle LIVE Map Import ---
    function handleLiveMapImport() { // No longer async
        // Reset the dirty flag first, before attempting load
        mapStateDirtyAfterLiveLoad = false;
        liveMapLoaded = false; // Assume failure until success
        updateLiveButtonState(); // Show button as normal

        try {
            // Get the code from the internal constant
            const code = getLiveMapData();

            if (code === null || code.trim() === "") {
                 // Throw error if the constant is empty
                 throw new Error("LIVE_MAP_DATA_B64 constant is empty. Please update it in the script.");
            }

            const jsonString = atob(code.trim()); // Decode Base64
            const liveState = JSON.parse(jsonString);

            // Basic validation of the structure expected from live map
            // Typically just assignments and markers
             if (!liveState || typeof liveState.assignments !== 'object' ||
                typeof liveState.markers !== 'object') {
                 throw new Error("Invalid structure in LIVE_MAP_DATA_B64 constant. Expected assignments and markers objects.");
            }

             // No confirmation needed for LIVE update
            console.log("Applying LIVE map state from constant...");
            applyImportedState(liveState, true); // Apply as LIVE import

        } catch (e) {
            console.error("Error importing LIVE map from constant:", e);
            // Display a more specific error message to the user
            alert(`Failed to import LIVE map: ${e.message}`);
             mapStateDirtyAfterLiveLoad = false; // Ensure flags are reset on error
             liveMapLoaded = false;
             updateLiveButtonState(); // Reset button visuals on error
        }
    }


    // Add event listeners for Import/Export/Live buttons
    exportMapButton.addEventListener('click', handleExportMap);
    importMapButton.addEventListener('click', handleImportMap);
    liveMapButton.addEventListener('click', handleLiveMapImport); // Listener remains the same

    // Improved Copy Button Logic
    copyCodeButton.addEventListener('click', () => {
        const codeToCopy = codeModalTextarea.value;
        if (!codeToCopy) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(codeToCopy).then(() => {
                copyFeedbackElement.style.display = 'block'; // Show feedback
                copyCodeButton.innerHTML = '<i class="fa-solid fa-check me-1"></i>Copied!';
                setTimeout(() => {
                     copyFeedbackElement.style.display = 'none';
                     copyCodeButton.innerHTML = '<i class="fa-regular fa-copy me-1"></i>Copy Code';
                }, 2000); // Hide feedback after 2 seconds
            }).catch(err => {
                console.error('Clipboard API copy failed:', err);
                alert("Could not copy code automatically. Please copy manually.");
            });
        } else {
             // Fallback for older browsers (less reliable)
            try {
                codeModalTextarea.select();
                document.execCommand('copy');
                copyFeedbackElement.style.display = 'block';
                copyCodeButton.innerHTML = '<i class="fa-solid fa-check me-1"></i>Copied!';
                setTimeout(() => {
                     copyFeedbackElement.style.display = 'none';
                     copyCodeButton.innerHTML = '<i class="fa-regular fa-copy me-1"></i>Copy Code';
                 }, 2000);
            } catch (e) {
                console.error('Fallback copy failed:', e);
                alert("Could not copy code automatically. Please copy manually.");
            }
        }
    });


    // --- Initial Load ---
    initializeMapState(); // Load default auto-save state first
     setTimeout(() => { // Use setTimeout for initial render consistency
        console.log("Executing initial visual refresh...");
        updateAllSegmentsVisualState();
        updateAllianceSummary(); // Includes initial LIVE button state update
        initializePopovers();
        console.log("Initial visual refresh complete.");
     }, 0);
    setSidebarState(bodyElement.classList.contains('sidebar-active'));

}); // End DOMContentLoaded
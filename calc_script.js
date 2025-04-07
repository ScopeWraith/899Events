// Helper function to safely get integer value from input
function getIntValue(id) {
    const element = document.getElementById(id);
    return element ? parseInt(element.value, 10) || 0 : 0;
}

// Helper function to safely get float value from input
function getFloatValue(id) {
    const element = document.getElementById(id);
    return element ? parseFloat(element.value) || 0 : 0;
}

// Main calculation function
function calculatePoints(dayId) {
    let totalPoints = 0;

    switch (dayId) {
        case 'day1': // Radar Training
            totalPoints += getIntValue('day1-radar-tasks') * 30000;
            totalPoints += Math.floor(getIntValue('day1-hero-xp') / 660) * 2.5; // Points per 660 XP
            totalPoints += getIntValue('day1-drone-data') * 7.5;
            totalPoints += getIntValue('day1-drone-parts') * 6250;
            totalPoints += getIntValue('day1-chip-chests') * 2812.5;
            totalPoints += getIntValue('day1-stamina') * 375;
            totalPoints += getIntValue('day1-diamonds') * 30;
            break;

        case 'day2': // Base Expansion
            totalPoints += getIntValue('day2-ur-truck') * 300000;
            totalPoints += getIntValue('day2-legendary-task') * 225000;
            totalPoints += getIntValue('day2-building-power') * 30;
            totalPoints += getIntValue('day2-construction-speedup') * 150;
            // Note: Building Power listed twice in reqs, only counting once. Add again if needed.
            totalPoints += getIntValue('day2-survivor-recruits') * 4500;
            totalPoints += getIntValue('day2-diamonds') * 30;
            break;

        case 'day3': // Age of Science
            totalPoints += getIntValue('day3-radar-tasks') * 30000;
            totalPoints += getIntValue('day3-research-speedup') * 150;
            totalPoints += getIntValue('day3-tech-power') * 30;
            totalPoints += getIntValue('day3-valor-badges') * 750;
            totalPoints += getIntValue('day3-drone-chest-1') * 2750;
            totalPoints += getIntValue('day3-drone-chest-2') * 8250;
            totalPoints += getIntValue('day3-drone-chest-3') * 25000;
            totalPoints += getIntValue('day3-drone-chest-4') * 75000;
            totalPoints += getIntValue('day3-drone-chest-5') * 225000;
            totalPoints += getIntValue('day3-drone-chest-6') * 675000;
            totalPoints += getIntValue('day3-drone-chest-7') * 2025000;
            totalPoints += getIntValue('day3-diamonds') * 30;
            break;

        case 'day4': // Train Heroes
            totalPoints += getIntValue('day4-elite-recruit') * 4500;
            totalPoints += Math.floor(getIntValue('day4-hero-xp') / 660) * 2.5; // Points per 660 XP
            totalPoints += getIntValue('day4-legendary-shard') * 25000;
            totalPoints += getIntValue('day4-epic-shard') * 8750;
            totalPoints += getIntValue('day4-rare-shard') * 2500; // Corrected from 2,5000
            totalPoints += getIntValue('day4-skill-medal') * 25;
            totalPoints += getIntValue('day4-weapon-shard') * 25000;
            totalPoints += getIntValue('day4-diamonds') * 30;
            break;

        case 'day5': // Total Mobilization
            totalPoints += getIntValue('day5-radar-tasks') * 30000;
            totalPoints += getIntValue('day5-construction-speedup') * 150;
            totalPoints += getIntValue('day5-building-power') * 30;
            totalPoints += getIntValue('day5-research-speedup') * 150;
            // Note: Building Power listed twice in reqs, only counting once. Add again if needed.
            totalPoints += getIntValue('day5-training-speedup') * 150;
            totalPoints += getIntValue('day5-unit-1') * 60;
            totalPoints += getIntValue('day5-unit-2') * 90;
            totalPoints += getIntValue('day5-unit-3') * 120;
            totalPoints += getIntValue('day5-unit-4') * 150;
            totalPoints += getIntValue('day5-unit-5') * 180;
            totalPoints += getIntValue('day5-unit-6') * 210;
            totalPoints += getIntValue('day5-unit-7') * 240;
            totalPoints += getIntValue('day5-unit-8') * 270;
            totalPoints += getIntValue('day5-unit-9') * 300;
            totalPoints += getIntValue('day5-unit-10') * 330;
            totalPoints += getIntValue('day5-diamonds') * 30;
            break;

        case 'day6': // Enemy Buster
            totalPoints += getIntValue('day6-ur-truck') * 300000;
            totalPoints += getIntValue('day6-legendary-task') * 225000;
            totalPoints += getIntValue('day6-construction-speedup') * 150;
            totalPoints += getIntValue('day6-research-speedup') * 150;
            totalPoints += getIntValue('day6-training-speedup') * 150;
            totalPoints += getIntValue('day6-healing-speedup') * 150;
            totalPoints += getIntValue('day6-diamonds') * 30;
            break;

        default:
            console.error("Unknown dayId:", dayId);
            return; // Exit if dayId is not recognized
    }

    // Update the total points display for the specific day
    const totalPointsElement = document.getElementById(`total-points-${dayId}`);
    if (totalPointsElement) {
        // Format with commas and handle potential decimals
        totalPointsElement.textContent = totalPoints.toLocaleString(undefined, {
            minimumFractionDigits: 0, // Adjust if you need to show decimals like 2.5 or 2812.5 precisely
            maximumFractionDigits: 1 // Shows .5 if present, otherwise whole number
        });
    }
}

// Function to reset all inputs in a specific day's form
function resetForm(dayId) {
    const formContainer = document.getElementById(`${dayId}-tab-pane`);
    if (formContainer) {
        const inputs = formContainer.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.value = '0';
        });
        // Recalculate points after resetting (should be 0)
        calculatePoints(dayId);
    }
}

// Optional: Initial calculation for all tabs on page load
document.addEventListener('DOMContentLoaded', () => {
    const dayIds = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6'];
    dayIds.forEach(id => calculatePoints(id));
});
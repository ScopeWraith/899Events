document.addEventListener('DOMContentLoaded', () => {
    const productionRates = {
        1: 720, 2: 1440, 3: 2160, 4: 2880, 5: 3600,
        6: 4320, 7: 5040, 8: 5760, 9: 6480, 10: 7200,
        11: 7920, 12: 8640, 13: 9360, 14: 10080, 15: 10800,
        16: 11520, 17: 12240, 18: 12960, 19: 13680, 20: 14400,
        21: 15120, 22: 15840, 23: 16560, 24: 17280, 25: 18000,
        26: 18720, 27: 19440, 28: 20160, 29: 20880, 30: 21600
    };

    const factoryLevelSelectors = document.querySelectorAll('.factory-level');
    // Updated Input Selectors
    const neededForLevelInput = document.getElementById('titaniumNeededForLevel');
    const currentlyHaveInput = document.getElementById('titaniumCurrentlyHave');
    // Output Selectors
    const totalProductionSpan = document.getElementById('totalProductionPerHour');
    const actualAmountRequiredSpan = document.getElementById('actualAmountRequiredDisplay'); // New span for actual amount
    const timeRequiredSpan = document.getElementById('timeRequired');

    // Populate level dropdowns
    factoryLevelSelectors.forEach(select => {
        for (let level = 1; level <= 30; level++) {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = `Level ${level}`;
            select.appendChild(option);
        }
        // Add event listener after populating
        select.addEventListener('change', calculateAndUpdate);
    });

    // Add event listeners for the new input fields
    neededForLevelInput.addEventListener('input', calculateAndUpdate);
    currentlyHaveInput.addEventListener('input', calculateAndUpdate);

    // Initial calculation on load (defaults to Level 1 for all)
    calculateAndUpdate();

    function calculateAndUpdate() {
        let totalHourlyProduction = 0;

        // Calculate total production from all factories
        factoryLevelSelectors.forEach(select => {
            const level = parseInt(select.value, 10) || 1; // Default to level 1 if somehow invalid
            totalHourlyProduction += productionRates[level] || 0;
        });

        // Update total production display
        totalProductionSpan.textContent = totalHourlyProduction.toLocaleString();

        // Calculate the actual amount required
        const neededForLevel = parseInt(neededForLevelInput.value, 10) || 0;
        const currentlyHave = parseInt(currentlyHaveInput.value, 10) || 0;
        const actualAmountRequired = Math.max(0, neededForLevel - currentlyHave); // Ensure it's not negative

        // Update actual amount required display
        actualAmountRequiredSpan.textContent = actualAmountRequired.toLocaleString();

        // Calculate time required based on the actual amount needed
        let timeText = '--';

        if (actualAmountRequired > 0 && totalHourlyProduction > 0) {
            const hoursTotal = actualAmountRequired / totalHourlyProduction;
            const hours = Math.floor(hoursTotal);
            const minutes = Math.round((hoursTotal - hours) * 60);

            if (hours > 0) {
                timeText = `${hours.toLocaleString()} hour${hours > 1 ? 's' : ''}`;
                if (minutes > 0) {
                    timeText += `, ${minutes} minute${minutes > 1 ? 's' : ''}`;
                }
            } else if (minutes > 0) {
                 timeText = `${minutes} minute${minutes > 1 ? 's' : ''}`;
            } else {
                // If less than a minute but still needed
                timeText = "Less than a minute";
            }
        } else if (actualAmountRequired > 0 && totalHourlyProduction === 0) {
             timeText = "Infinite (no production)";
        } else if (actualAmountRequired <= 0) {
            timeText = "Requirement met"; // Handle case where needed amount is zero or less
        }


        // Update time required display
        timeRequiredSpan.textContent = timeText;
    }
});
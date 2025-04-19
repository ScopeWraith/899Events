document.addEventListener('DOMContentLoaded', () => {
    // --- Production Data ---
    const productionRates = [
        720, 1440, 2160, 2880, 3600, 4320, 5040, 5760, 6480, 7200,
        7920, 8640, 9360, 10080, 10800, 11520, 12240, 12960, 13680, 14400,
        15120, 15840, 16560, 17280, 18000, 18720, 19440, 20160, 20880, 21600
    ];
    const MAX_LEVEL = 30;

    // --- Image Filenames ---
    const factoryEnabledImg = "TACalc.factory.png";
    const factoryDisabledImg = "TACalc.factory.disabled.png"; // Make sure you have this image

    // --- DOM Element References ---
    const factorySelects = [];
    for (let i = 1; i <= 5; i++) {
        factorySelects.push(document.getElementById(`factoryLevel${i}`));
    }
    const factory5Toggle = document.getElementById('factory5Toggle');
    const currentAlloyInput = document.getElementById('currentAlloy');
    const neededAlloyInput = document.getElementById('neededAlloy');
    const totalOutputDisplay = document.getElementById('totalOutput');
    const timeNeededDisplay = document.getElementById('timeNeeded');
    const completionTimeDisplay = document.getElementById('completionTime'); // Added for completion time
    const factory5Image = document.getElementById('factory5Image');
    const factory5Label = document.getElementById('factory5Label');

    // --- Function to Populate Level Dropdowns ---
    function populateDropdowns() {
        factorySelects.forEach(select => {
            if (!select) return;
            select.innerHTML = ''; // Clear existing options
            // Add a "Level 0" or "Off" option? Optional.
            // const offOption = document.createElement('option');
            // offOption.value = 0;
            // offOption.textContent = `Off`;
            // select.appendChild(offOption);
            for (let level = 1; level <= MAX_LEVEL; level++) {
                const option = document.createElement('option');
                option.value = level;
                option.textContent = `Lvl ${level}`;
                select.appendChild(option);
            }
             // Set default to Level 1 if no saved state
            if (!localStorage.getItem(select.id)) {
                 select.value = "1";
            }
        });
    }

    // --- Function to Update Factory 5 Visuals (Image & Label) ---
    function updateFactory5Visuals() {
        if (!factory5Toggle || !factory5Image || !factory5Label) return;

        const isEnabled = factory5Toggle.checked;
        const factoryCard = factory5Image.closest('.factory-card'); // Get parent card

        factory5Image.src = isEnabled ? factoryEnabledImg : factoryDisabledImg;
        factory5Image.alt = isEnabled ? "Titanium Alloy Factory 5 (Enabled)" : "Titanium Alloy Factory 5 (Disabled)";
        factory5Label.textContent = "Factory 5"; // Keep label static, maybe change color/opacity

        if (isEnabled) {
            factory5Label.classList.remove('disabled-label');
            if (factoryCard) factoryCard.classList.remove('disabled');
             // Make sure select is enabled
             if (factorySelects[4]) factorySelects[4].disabled = false;
        } else {
            factory5Label.classList.add('disabled-label');
            if (factoryCard) factoryCard.classList.add('disabled'); // Add a class to dim the card via CSS if needed
            // Disable select when factory is off
             if (factorySelects[4]) factorySelects[4].disabled = true;
        }
    }


    // --- Calculation Functions ---
    function calculateTotalOutput() {
        let totalProduction = 0;
        const factory5Enabled = factory5Toggle ? factory5Toggle.checked : false;

        factorySelects.forEach((select, index) => {
            if (!select) return;
            // If factory 5 is disabled, skip its production calculation
            if (index === 4 && !factory5Enabled) {
                 return;
            }

            const level = parseInt(select.value, 10) || 0;

            if (level > 0 && level <= productionRates.length) {
                totalProduction += productionRates[level - 1];
            }
        });
        if (totalOutputDisplay) {
             totalOutputDisplay.textContent = totalProduction.toLocaleString();
        }
        return totalProduction;
    }

    function formatDuration(totalHours) {
        if (totalHours <= 0 || !isFinite(totalHours)) return null; // Return null for invalid input

        const totalSeconds = Math.ceil(totalHours * 3600);
        if (totalSeconds === 0) return "Instantly";

        const days = Math.floor(totalSeconds / (3600 * 24));
        const remainingSecondsAfterDays = totalSeconds % (3600 * 24);
        const hours = Math.floor(remainingSecondsAfterDays / 3600);
        const remainingSecondsAfterHours = remainingSecondsAfterDays % 3600;
        const minutes = Math.floor(remainingSecondsAfterHours / 60);
        const seconds = remainingSecondsAfterHours % 60; // Keep seconds for accuracy near zero

        let parts = [];
        if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`); // Abbreviate hr
        // Show minutes only if days/hours exist or if it's the largest unit
        if (minutes > 0 && (days > 0 || hours > 0 || (days === 0 && hours === 0))) {
             parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
        }
         // Only show seconds if duration is less than a minute
        if (days === 0 && hours === 0 && minutes === 0 && seconds > 0) {
             parts.push(`${seconds} sec${seconds > 1 ? 's' : ''}`);
        }
        // Handle very short durations resulting in 0 seconds after ceil
        if (parts.length === 0 && totalSeconds > 0) {
            return "Less than 1 min";
        }
        if (parts.length === 0 && totalSeconds <= 0) { // Should not happen with initial checks, but safeguard
             return "Instantly";
        }

        return parts.join(', ');
    }

     function calculateTimeNeeded() {
        if (!currentAlloyInput || !neededAlloyInput || !timeNeededDisplay || !completionTimeDisplay) return;

        const totalProduction = calculateTotalOutput();
        const currentAlloy = parseInt(currentAlloyInput.value, 10) || 0;
        const neededAlloy = parseInt(neededAlloyInput.value, 10) || 0;

        // Clear previous results
        timeNeededDisplay.textContent = '---';
        completionTimeDisplay.textContent = '';

        if (neededAlloy <= 0 || neededAlloy <= currentAlloy) {
            timeNeededDisplay.textContent = neededAlloy <= currentAlloy && neededAlloy > 0 ? "Requirement met!" : "Enter amount needed";
            completionTimeDisplay.textContent = ''; // Clear completion time
            return;
        }

        const alloyRequired = neededAlloy - currentAlloy;

        if (totalProduction <= 0) {
            timeNeededDisplay.textContent = "Zero production";
            completionTimeDisplay.textContent = 'Cannot calculate completion';
            return;
        }

        const hoursNeeded = alloyRequired / totalProduction;
        const formattedDuration = formatDuration(hoursNeeded);

        if (formattedDuration) {
            timeNeededDisplay.textContent = formattedDuration;

            // Calculate and display completion time
            try {
                const now = new Date();
                // Add buffer to ensure completion time is slightly in the future if duration is tiny
                const completionMillis = now.getTime() + Math.max(hoursNeeded * 3600 * 1000, 500); // Min 500ms buffer
                const completionDate = new Date(completionMillis);

                // Format using user's locale for date and time
                const completionTimeString = completionDate.toLocaleString(undefined, {
                    month: 'numeric', // Shorter month
                    day: 'numeric',
                    // year: 'numeric', // Optional: Add year if needed
                    hour: 'numeric',
                    minute: 'numeric',
                     // timeZoneName: 'short' // Optional: Show timezone abbr.
                });
                completionTimeDisplay.textContent = `(Est. ${completionTimeString})`;
            } catch (e) {
                 console.error("Error calculating completion date:", e);
                 completionTimeDisplay.textContent = "(Completion time error)";
            }

        } else {
             timeNeededDisplay.textContent = "Calculation error";
             completionTimeDisplay.textContent = '';
        }
    }


    // --- Persistence (localStorage) ---
    function saveState() {
        try {
            factorySelects.forEach((select, index) => {
                if (select) localStorage.setItem(`factoryLevel${index + 1}`, select.value);
            });
            if (factory5Toggle) localStorage.setItem('factory5Toggle', factory5Toggle.checked);
            if (currentAlloyInput) localStorage.setItem('currentAlloy', currentAlloyInput.value);
            if (neededAlloyInput) localStorage.setItem('neededAlloy', neededAlloyInput.value);
        } catch (e) {
            console.warn("Could not save state to localStorage:", e); // Use warn instead of error
        }
    }

    function loadState() {
        try {
            factorySelects.forEach((select, index) => {
                if (select) {
                    const savedLevel = localStorage.getItem(`factoryLevel${index + 1}`);
                    // Ensure the saved value exists as an option before setting it
                    if (savedLevel !== null && savedLevel !== undefined) {
                         const optionExists = Array.from(select.options).some(opt => opt.value === savedLevel);
                         select.value = optionExists ? savedLevel : "1"; // Default to Lvl 1 if saved is invalid
                    } else {
                         select.value = "1"; // Default to Lvl 1 if nothing saved
                    }
                }
            });

            if (factory5Toggle) {
                const savedToggle = localStorage.getItem('factory5Toggle');
                 // Default to 'true' (checked) if nothing is saved
                factory5Toggle.checked = savedToggle === null ? true : (savedToggle === 'true');
            }

            if (currentAlloyInput) currentAlloyInput.value = localStorage.getItem('currentAlloy') || '';
            if (neededAlloyInput) neededAlloyInput.value = localStorage.getItem('neededAlloy') || '';

        } catch (e) {
            console.error("Could not load state from localStorage:", e);
             // Reset to defaults on error
             factorySelects.forEach(select => { if(select) select.value = "1"; });
             if (factory5Toggle) factory5Toggle.checked = true;
             if (currentAlloyInput) currentAlloyInput.value = '';
             if (neededAlloyInput) neededAlloyInput.value = '';
        }
         // Update Factory 5 visuals AFTER loading its state
         updateFactory5Visuals();
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        factorySelects.forEach(select => {
            if(select) {
                select.addEventListener('change', () => {
                    calculateTimeNeeded();
                    saveState();
                });
            }
        });

        if (factory5Toggle) {
            factory5Toggle.addEventListener('change', () => {
                updateFactory5Visuals(); // Update visuals first
                calculateTimeNeeded(); // Then recalculate
                saveState();
            });
        }

        // Use 'input' event for immediate feedback as user types
        if (currentAlloyInput) {
            currentAlloyInput.addEventListener('input', () => {
                calculateTimeNeeded();
                saveState();
            });
        }
        if (neededAlloyInput) {
            neededAlloyInput.addEventListener('input', () => {
                calculateTimeNeeded();
                saveState();
            });
        }
    }

    // --- Initialization ---
    populateDropdowns(); // Populate first
    loadState(); // Load saved state (includes F5 visual update)
    setupEventListeners(); // Setup listeners
    calculateTimeNeeded(); // Initial calculation based on loaded state

}); // End DOMContentLoaded
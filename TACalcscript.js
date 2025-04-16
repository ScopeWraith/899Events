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
    const factoryDisabledImg = "TACalc.factory.disabled.png";

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
    const factory5Image = document.getElementById('factory5Image');
    // *** Added reference for Factory 5 Label ***
    const factory5Label = document.getElementById('factory5Label');

    // --- Function to Populate Level Dropdowns ---
    function populateDropdowns() {
        factorySelects.forEach(select => {
            if (!select) return;
            select.innerHTML = '';
            for (let level = 1; level <= MAX_LEVEL; level++) {
                const option = document.createElement('option');
                option.value = level;
                option.textContent = `Lvl ${level}`;
                select.appendChild(option);
            }
        });
    }

    // --- Function to Update Factory 5 Visuals (Image & Label) ---
    function updateFactory5Visuals() {
        // Safety checks
        if (!factory5Toggle || !factory5Image || !factory5Label) return;

        const isEnabled = factory5Toggle.checked;

        // Update Image
        factory5Image.src = isEnabled ? factoryEnabledImg : factoryDisabledImg;
        factory5Image.alt = isEnabled ? "Titanium Alloy Factory 5 (Enabled)" : "Titanium Alloy Factory 5 (Disabled)";

        // Update Label Text and Class
        factory5Label.textContent = isEnabled ? "Factory 5" : "DISABLED";
        if (isEnabled) {
            factory5Label.classList.remove('disabled-label');
        } else {
            factory5Label.classList.add('disabled-label');
        }
    }


    // --- Calculation Functions ---
    function calculateTotalOutput() {
        let totalProduction = 0;
        const factory5Enabled = factory5Toggle ? factory5Toggle.checked : false;

        factorySelects.forEach((select, index) => {
            if (!select) return;
            const level = parseInt(select.value, 10) || 0;
            const isFactory5 = index === 4;

            if (level > 0 && level <= productionRates.length) {
                 if (!isFactory5 || (isFactory5 && factory5Enabled)) {
                    totalProduction += productionRates[level - 1];
                 }
            }
        });
        if (totalOutputDisplay) {
             totalOutputDisplay.textContent = totalProduction.toLocaleString();
        }
        return totalProduction;
    }

    function formatDuration(totalHours) {
        if (totalHours <= 0 || !isFinite(totalHours)) return "N/A";
        const totalMinutes = Math.ceil(totalHours * 60);
        if (totalMinutes === 0 && totalHours > 0) return "Less than 1 minute";
        if (totalMinutes === 0) return "Instantly";

        const days = Math.floor(totalMinutes / (60 * 24));
        const remainingMinutesAfterDays = totalMinutes % (60 * 24);
        const hours = Math.floor(remainingMinutesAfterDays / 60);
        const minutes = remainingMinutesAfterDays % 60;

        let parts = [];
        if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
        if (minutes > 0 || (parts.length === 0 && totalMinutes > 0)) {
             parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
        }
        if (parts.length === 0) return "Calculation Error";
        return parts.join(', ');
    }

    function calculateTimeNeeded() {
        if (!currentAlloyInput || !neededAlloyInput || !timeNeededDisplay) return;
        const totalProduction = calculateTotalOutput();
        const currentAlloy = parseInt(currentAlloyInput.value, 10) || 0;
        const neededAlloy = parseInt(neededAlloyInput.value, 10) || 0;

        if (neededAlloy <= 0) {
            timeNeededDisplay.textContent = "Enter amount needed";
            return;
        }
        const alloyRequired = neededAlloy - currentAlloy;
        if (alloyRequired <= 0) {
            timeNeededDisplay.textContent = "Requirement already met!";
            return;
        }
        if (totalProduction <= 0) {
            timeNeededDisplay.textContent = "Cannot calculate with zero production."; // Shortened msg
            return;
        }
        const hoursNeeded = alloyRequired / totalProduction;
        timeNeededDisplay.textContent = formatDuration(hoursNeeded);
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
            console.error("Could not save state to localStorage:", e);
        }
    }

    function loadState() {
        try {
            factorySelects.forEach((select, index) => {
                if (select) {
                    const savedLevel = localStorage.getItem(`factoryLevel${index + 1}`);
                    if (savedLevel !== null && savedLevel !== undefined) {
                        const optionExists = Array.from(select.options).some(opt => opt.value === savedLevel);
                         select.value = optionExists ? savedLevel : "1";
                    } else {
                        select.value = "1";
                    }
                }
            });

            if (factory5Toggle) {
                const savedToggle = localStorage.getItem('factory5Toggle');
                factory5Toggle.checked = savedToggle === null ? true : (savedToggle === 'true');
            }

            if (currentAlloyInput) currentAlloyInput.value = localStorage.getItem('currentAlloy') || '';
            if (neededAlloyInput) neededAlloyInput.value = localStorage.getItem('neededAlloy') || '';

        } catch (e) {
            console.error("Could not load state from localStorage:", e);
             factorySelects.forEach(select => { if(select) select.value = "1"; });
             if (factory5Toggle) factory5Toggle.checked = true;
             if (currentAlloyInput) currentAlloyInput.value = '';
             if (neededAlloyInput) neededAlloyInput.value = '';
        }
        // *** Update Factory 5 visuals based on loaded state ***
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
                // *** Update visuals (image and label) on toggle change ***
                updateFactory5Visuals();
                calculateTimeNeeded();
                saveState();
            });
        }

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
    populateDropdowns();
    loadState(); // Includes initial call to updateFactory5Visuals
    setupEventListeners();
    calculateTimeNeeded();

}); // End DOMContentLoaded
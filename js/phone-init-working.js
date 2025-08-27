// Phone field initialization for Cellionyx - Based on working Equstech version
(function() {
    'use strict';
    
    console.log('Phone init - Equstech-based version');
    
    // Function to initialize a phone input field
    function initializePhoneField(phoneInput) {
        if (!phoneInput || !window.intlTelInput) return;
        
        // The destroy() method removes the 'iti__input' class, so we can re-initialize safely.
        // Let's add an extra check to be sure.
        if (phoneInput.hasAttribute('data-iti-id')) {
             console.log('Skipping re-init, instance seems to still exist:', phoneInput.id);
             return;
        }
        
        // Mark as being initialized
        phoneInput.setAttribute('data-iti-init', 'true');
        
        // Initialize intl-tel-input with v18
        const iti = window.intlTelInput(phoneInput, {
            initialCountry: "us",
            preferredCountries: ["us", "ca", "gb", "au"],
            separateDialCode: true,
            formatOnDisplay: true,
            nationalMode: false,
            autoPlaceholder: "aggressive",
            allowDropdown: true,
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
        });
        
        // Store instance on element
        phoneInput.itiInstance = iti;
        window.phoneItiInstance = iti;
        
        // Auto-sync with country dropdown
        iti.promise.then(() => {
            phoneInput.addEventListener('countrychange', () => {
                const countryData = iti.getSelectedCountryData();
                const countrySelect = phoneInput.closest('form')?.querySelector('select#country');
                if (countrySelect && countryData.iso2) {
                    // FINAL, CORRECTED MAPPING LOGIC
                    const countryNameFromPlugin = countryData.name.replace(/\s*\(.*?\).*/g, '').trim();
                    let valueToSet = null;

                    // This is the correct mapping based on the HTML <option> values
                    const countryValueMap = {
                        "United States": "USA",
                        "United Kingdom": "United Kingdom",
                        "Canada": "Canada",
                        // Add all other countries here, mapping Name to Value
                        "Anguilla": "Anguilla",
                        "Argentina": "Argentina",
                        "Australia": "Australia",
                        "Austria": "Austria",
                        "Bahrain": "Bahrain",
                        "Bangladesh": "Bangladesh",
                        "Belgium": "Belgium",
                        "Belize": "Belize",
                        "Bolivia": "Bolivia",
                        "Brazil": "Brazil",
                        "Cape Verde": "Cape Verde",
                        "Chile": "Chile",
                        "China": "China",
                        "Colombia": "Colombia",
                        "Costa Rica": "Costa Rica",
                        "Cuba": "Cuba",
                        "Czech Republic": "Czech Republic",
                        "Denmark": "Denmark",
                        "Dominican Republic": "Dominican Republic",
                        "Ecuador": "Ecuador",
                        "Egypt": "Egypt",
                        "Finland": "Finland",
                        "France": "France",
                        "Germany": "Germany",
                        "Greece": "Greece",
                        "Haiti": "Haiti",
                        "Hong Kong": "Hong Kong",
                        "Hungary": "Hungary",
                        "India": "India",
                        "Indonesia": "Indonesia",
                        "Ireland": "Ireland",
                        "Israel": "Israel",
                        "Italy": "Italy",
                        "Jamaica": "Jamaica",
                        "Japan": "Japan",
                        "Kenya": "Kenya",
                        "Malaysia": "Malaysia",
                        "Morocco": "Morocco",
                        "Mexico": "Mexico",
                        "Netherlands": "Netherlands",
                        "New Zealand": "New Zealand",
                        "Nigeria": "Nigeria",
                        "Norway": "Norway",
                        "Oman": "Oman",
                        "Panama": "Panama",
                        "Paraguay": "Paraguay",
                        "Peru": "Peru",
                        "Philippines": "Philippines",
                        "Poland": "Poland",
                        "Portugal": "Portugal",
                        "Puerto Rico": "Puerto Rico",
                        "Romania": "Romania",
                        "Russia": "Russia",
                        "Saudi Arabia": "Saudi Arabia",
                        "Singapore": "Singapore",
                        "South Africa": "South Africa",
                        "South Korea": "South Korea",
                        "Spain": "Spain",
                        "Sweden": "Sweden",
                        "Switzerland": "Switzerland",
                        "Taiwan": "Taiwan",
                        "Thailand": "Thailand",
                        "Turkey": "Turkey",
                        "Ukraine": "Ukraine",
                        "United Arab Emirates": "United Arab Emirates",
                        "Uruguay": "Uruguay",
                        "Venezuela": "Venezuela",
                        "Vietnam": "Vietnam"
                        // Any country not in this list will be matched by name
                    };
                    
                    if (countryValueMap[countryNameFromPlugin]) {
                        valueToSet = countryValueMap[countryNameFromPlugin];
                    } else {
                        // Fallback for any country not in the map
                        valueToSet = countryNameFromPlugin;
                    }

                    // Final check to see if the option exists
                    let optionExists = false;
                    for (const option of countrySelect.options) {
                        if (option.value === valueToSet) {
                            optionExists = true;
                            break;
                        }
                    }

                    if (optionExists) {
                        countrySelect.value = valueToSet;
                        console.log(`SUCCESS: Matched "${countryNameFromPlugin}" to dropdown value "${valueToSet}"`);
                    } else {
                        console.warn(`Could not find a match for "${countryNameFromPlugin}" (mapped to "${valueToSet}") in the country dropdown.`);
                    }
                }
            });
        });
        
        // Handle form submission
        const form = phoneInput.closest('form');
        if (form && !form.hasAttribute('data-iti-handler')) {
            form.setAttribute('data-iti-handler', 'true');
            form.addEventListener('submit', function(e) {
                if (iti && iti.isValidNumber()) {
                    phoneInput.value = iti.getNumber();
                }
            });
        }
        
        console.log('Phone field initialized:', phoneInput.id || phoneInput.name || 'unnamed');
    }
    
    // Function to initialize all phone fields on page
    function initializeAllPhoneFields() {
        // Find all phone inputs that haven't been initialized
        const phoneInputs = document.querySelectorAll('input[type="tel"]:not([data-iti-init]), input#phone:not([data-iti-init]), input#phone-main:not([data-iti-init])');
        
        phoneInputs.forEach(input => {
            initializePhoneField(input);
        });
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initializeAllPhoneFields, 100);
        });
    } else {
        setTimeout(initializeAllPhoneFields, 100);
    }
    
    // Re-initialize when modals open or content changes - FIXED TO PREVENT LOOPS
    let observerTimeout;
    const observer = new MutationObserver(function(mutations) {
        // Clear any pending timeout
        clearTimeout(observerTimeout);
        
        // Set a new timeout to batch mutations
        observerTimeout = setTimeout(function() {
            let shouldReinit = false;
            
            mutations.forEach(function(mutation) {
                // Check for modal visibility changes
                if (mutation.target.id === 'ctaModal' || 
                    mutation.target.classList && (
                        mutation.target.classList.contains('modal') ||
                        mutation.target.classList.contains('panel')
                    )) {
                    shouldReinit = true;
                }
                
                // Check for new nodes that might contain phone inputs
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.querySelector) { // Element node
                            const phoneInputs = node.querySelectorAll('input[type="tel"], input#phone');
                            if (phoneInputs.length > 0) {
                                shouldReinit = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldReinit) {
                initializeAllPhoneFields();
            }
        }, 100); // Batch mutations within 100ms
    });
    
    // Start observing with less aggressive settings
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
        attributeOldValue: false,
        characterData: false
    });
    
    // Also reinitialize on any panel or modal open events
    document.addEventListener('click', function(e) {
        if (e.target.matches('.cta-button, .btn-primary, [data-action="demo"], button[class*="cta"]')) {
            setTimeout(initializeAllPhoneFields, 300);
        }
    });
    
    // Export for global use
    window.initializePhoneField = initializePhoneField;
    window.initializeAllPhoneFields = initializeAllPhoneFields;
    /* The reset logic is now handled directly in main-v12.min.js
    window.resetPhoneField = function() {
        const phoneInput = document.querySelector('#ctaModal input#phone');
        if (phoneInput && phoneInput.itiInstance) {
            phoneInput.value = '';
            phoneInput.itiInstance.setCountry('us');
            
            // Also reset country dropdown
            const countrySelect = phoneInput.closest('form')?.querySelector('select#country');
            if (countrySelect) {
                countrySelect.value = 'USA';
            }
            console.log('Phone field reset to US');
        }
    };
    */
})();
// Single initialization for phone fields - NO DUPLICATES
(function() {
    'use strict';
    
    console.log('Phone init SINGLE - preventing ALL duplicates');
    
    // Global flag to prevent any duplicate initialization
    if (window.phoneFieldsInitialized) {
        console.log('Phone fields already initialized globally, skipping');
        return;
    }
    window.phoneFieldsInitialized = true;
    
    // Wait for intl-tel-input
    function waitForITI(callback) {
        if (window.intlTelInput) {
            callback();
        } else {
            setTimeout(() => waitForITI(callback), 100);
        }
    }
    
    // Initialize a single phone field
    function initOnePhoneField(input) {
        if (!input) return;
        
        // Multiple checks to prevent duplicates
        if (input.hasAttribute('data-phone-initialized')) {
            console.log('Field already initialized (data attribute):', input.id);
            return;
        }
        
        if (input.classList.contains('iti__input')) {
            console.log('Field already initialized (iti class):', input.id);
            return;
        }
        
        const parent = input.parentElement;
        if (parent && parent.classList.contains('iti')) {
            console.log('Field already initialized (parent iti):', input.id);
            return;
        }
        
        // Check if there's already an iti container
        const existingIti = input.closest('.iti');
        if (existingIti) {
            console.log('Field already has iti container:', input.id);
            return;
        }
        
        console.log('Initializing phone field:', input.id);
        
        // Mark as initialized BEFORE creating
        input.setAttribute('data-phone-initialized', 'true');
        
        try {
            const iti = window.intlTelInput(input, {
                initialCountry: "us",
                preferredCountries: ["us", "ca", "gb", "au"],
                separateDialCode: true,
                formatOnDisplay: true,
                nationalMode: false,
                autoPlaceholder: "aggressive",
                allowDropdown: true,
                utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
            });
            
            input.itiInstance = iti;
            console.log('✅ Successfully initialized:', input.id);
            
            return iti;
        } catch (error) {
            console.error('Error initializing phone field:', error);
            input.removeAttribute('data-phone-initialized');
        }
    }
    
    // Initialize all phone fields ONCE
    function initAllPhoneFieldsOnce() {
        console.log('Initializing phone fields ONCE...');
        
        const phoneFields = [
            document.getElementById('newProspectPhone'),
            document.getElementById('editProspectPhone'),
            document.getElementById('newPhone'),
            document.getElementById('editPhone')
        ];
        
        phoneFields.forEach(field => {
            if (field) {
                initOnePhoneField(field);
            }
        });
    }
    
    // Start initialization
    waitForITI(() => {
        console.log('intl-tel-input ready');
        
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(initAllPhoneFieldsOnce, 500);
            });
        } else {
            setTimeout(initAllPhoneFieldsOnce, 500);
        }
        
        // Re-check when panels open, but only init if not already done
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="openAddProspectPanel"], [onclick*="editProspect"], [onclick*="addUser"], [onclick*="editUser"]')) {
                setTimeout(() => {
                    const phoneFields = [
                        document.getElementById('newProspectPhone'),
                        document.getElementById('editProspectPhone'),
                        document.getElementById('newPhone'),
                        document.getElementById('editPhone')
                    ];
                    
                    phoneFields.forEach(field => {
                        if (field && !field.hasAttribute('data-phone-initialized')) {
                            initOnePhoneField(field);
                        }
                    });
                }, 300);
            }
        });
    });
})();

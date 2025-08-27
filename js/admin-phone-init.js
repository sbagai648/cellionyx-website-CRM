// Admin Portal Phone Initialization Fix
(function() {
    'use strict';
    
    console.log('Admin phone init script loading...');
    
    // Wait for intl-tel-input library
    function waitForLibrary(callback) {
        if (window.intlTelInput) {
            callback();
        } else {
            setTimeout(() => waitForLibrary(callback), 100);
        }
    }
    
    // Initialize a phone field with intl-tel-input
    function initPhoneField(selector) {
        const input = document.querySelector(selector);
        if (!input) {
            console.log(`Phone field ${selector} not found`);
            return;
        }
        
        // Check if already initialized
        if (input.classList.contains('iti__input')) {
            console.log(`Phone field ${selector} already initialized`);
            return;
        }
        
        console.log(`Initializing phone field: ${selector}`);
        
        // Initialize with intl-tel-input
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
        
        // Store instance on element
        input.itiInstance = iti;
        
        console.log(`Phone field ${selector} initialized successfully`);
        return iti;
    }
    
    // Initialize all phone fields
    function initAllPhoneFields() {
        console.log('Initializing all phone fields...');
        
        // Add Prospect phone
        initPhoneField('#newProspectPhone');
        
        // Edit Prospect phone
        initPhoneField('#editProspectPhone');
        
        // Add User phone
        initPhoneField('#newPhone');
        
        // Edit User phone
        initPhoneField('#editPhone');
    }
    
    // Watch for panel opens
    function watchPanels() {
        // Watch for style changes on panels
        const panels = document.querySelectorAll('.prospect-detail-panel, #prospectAddPanel, #prospectDetailPanel, #userAddPanel, #userEditPanel');
        
        panels.forEach(panel => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (panel.classList.contains('active')) {
                            console.log('Panel opened, initializing phone fields...');
                            setTimeout(initAllPhoneFields, 100);
                        }
                    }
                });
            });
            
            observer.observe(panel, {
                attributes: true,
                attributeFilter: ['class']
            });
        });
    }
    
    // Format phone for display with flag
    window.formatPhoneWithFlag = function(phone) {
        if (!phone || phone === '-') return phone;
        
        const flags = {
            '+1': '🇺🇸',
            '+44': '🇬🇧',
            '+61': '🇦🇺',
            '+33': '🇫🇷',
            '+49': '🇩🇪',
            '+39': '🇮🇹',
            '+34': '🇪🇸',
            '+91': '🇮🇳',
            '+86': '🇨🇳',
            '+81': '🇯🇵',
            '+82': '🇰🇷',
            '+7': '🇷🇺',
            '+55': '🇧🇷',
            '+52': '🇲🇽'
        };
        
        // Check for country code
        for (const [code, flag] of Object.entries(flags)) {
            if (phone.startsWith(code)) {
                return `${flag} ${phone}`;
            }
        }
        
        // Default to US if no country code
        if (!phone.startsWith('+')) {
            return `🇺🇸 +1 ${phone}`;
        }
        
        return phone;
    };
    
    // Override save functions to get phone correctly
    function overrideSaveFunctions() {
        // Store original functions
        const originalCreateProspect = window.createNewProspect;
        const originalSaveProspect = window.saveProspectChanges;
        const originalCreateUser = window.createNewUser;
        const originalSaveUser = window.saveUserChanges;
        
        // Override createNewProspect
        if (originalCreateProspect) {
            window.createNewProspect = async function() {
                // Get phone from intl-tel-input
                const phoneInput = document.querySelector('#newProspectPhone');
                if (phoneInput && phoneInput.itiInstance) {
                    const fullNumber = phoneInput.itiInstance.getNumber();
                    if (fullNumber) {
                        phoneInput.value = fullNumber;
                    }
                }
                // Call original function
                return originalCreateProspect.apply(this, arguments);
            };
        }
        
        // Override saveProspectChanges
        if (originalSaveProspect) {
            window.saveProspectChanges = async function() {
                // Get phone from intl-tel-input
                const phoneInput = document.querySelector('#editProspectPhone');
                if (phoneInput && phoneInput.itiInstance) {
                    const fullNumber = phoneInput.itiInstance.getNumber();
                    if (fullNumber) {
                        phoneInput.value = fullNumber;
                    }
                }
                // Call original function
                return originalSaveProspect.apply(this, arguments);
            };
        }
        
        // Override createNewUser
        if (originalCreateUser) {
            window.createNewUser = async function() {
                // Get phone from intl-tel-input
                const phoneInput = document.querySelector('#newPhone');
                if (phoneInput && phoneInput.itiInstance) {
                    const fullNumber = phoneInput.itiInstance.getNumber();
                    if (fullNumber) {
                        phoneInput.value = fullNumber;
                    }
                }
                // Call original function
                return originalCreateUser.apply(this, arguments);
            };
        }
        
        // Override saveUserChanges
        if (originalSaveUser) {
            window.saveUserChanges = async function() {
                // Get phone from intl-tel-input
                const phoneInput = document.querySelector('#editPhone');
                if (phoneInput && phoneInput.itiInstance) {
                    const fullNumber = phoneInput.itiInstance.getNumber();
                    if (fullNumber) {
                        phoneInput.value = fullNumber;
                    }
                }
                // Call original function
                return originalSaveUser.apply(this, arguments);
            };
        }
    }
    
    // Initialize on DOM ready
    waitForLibrary(() => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOM loaded, initializing admin phone fields...');
                initAllPhoneFields();
                watchPanels();
                setTimeout(overrideSaveFunctions, 500);
            });
        } else {
            console.log('DOM already loaded, initializing admin phone fields...');
            initAllPhoneFields();
            watchPanels();
            setTimeout(overrideSaveFunctions, 500);
        }
    });
    
    // Also initialize when panels open
    document.addEventListener('click', (e) => {
        if (e.target.matches('[onclick*="openAdd"], [onclick*="edit"], .edit-btn, .add-btn, [onclick*="addUser"], [onclick*="editUser"], [onclick*="editProspect"]')) {
            setTimeout(initAllPhoneFields, 200);
        }
    }, true);
})();
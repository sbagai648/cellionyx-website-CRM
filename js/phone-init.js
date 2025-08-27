// Universal phone field initialization for Cellionyx
(function() {
    'use strict';
    
    // Function to initialize a phone input field
    function initializePhoneField(phoneInput) {
        if (!phoneInput || !window.intlTelInput) return;
        
        // Check if already initialized - CRITICAL FIX
        if (phoneInput.classList.contains('iti__input') || phoneInput.parentElement.classList.contains('iti')) {
            return; // Already initialized, skip
        }
        
        // Mark as being initialized
        phoneInput.setAttribute('data-iti-init', 'true');
        
        // Initialize intl-tel-input
        const iti = window.intlTelInput(phoneInput, {
            initialCountry: "us",
            preferredCountries: ["us", "ca", "gb", "au"],
            separateDialCode: true,
            formatOnDisplay: true,
            nationalMode: false,
            autoPlaceholder: "aggressive",
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
        });
        
        // Store instance on element
        phoneInput.itiInstance = iti;
        
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
        const phoneInputs = document.querySelectorAll('input[type="tel"]:not([data-iti-init]), input#phone:not([data-iti-init]), input#newPhone:not([data-iti-init]), input#editPhone:not([data-iti-init]), input#newProspectPhone:not([data-iti-init]), input#editProspectPhone:not([data-iti-init]), input[name="phone"]:not([data-iti-init])');
        
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
                            const phoneInputs = node.querySelectorAll('input[type="tel"], input#phone, input[name="phone"]');
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
        
        if (e.target.matches('[onclick*="openAdd"], [onclick*="edit"], .edit-btn, .add-btn')) {
            setTimeout(initializeAllPhoneFields, 300);
        }
    }, true);
    
    // Export for global use
    window.initializePhoneField = initializePhoneField;
    window.initializeAllPhoneFields = initializeAllPhoneFields;
})();
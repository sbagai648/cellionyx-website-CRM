// Complete phone field reset - destroy and recreate
(function() {
    'use strict';
    
    console.log('Phone complete reset loading...');
    
    // Store original phone field HTML
    let originalPhoneFieldHTML = null;
    
    // Function to completely destroy and recreate phone field
    function completePhoneReset() {
        console.log('Performing complete phone field reset');
        
        const modal = document.getElementById('ctaModal');
        if (!modal) return;
        
        const phoneInput = modal.querySelector('input#phone');
        if (!phoneInput) return;
        
        // Get the parent container
        const parent = phoneInput.parentElement;
        
        // Store original HTML if not already stored
        if (!originalPhoneFieldHTML) {
            // Check if it's already wrapped in iti
            if (parent.classList.contains('iti')) {
                // Get the grandparent and store the original input only
                originalPhoneFieldHTML = '<input type="tel" id="phone" name="phone" placeholder="Phone Number" class="form-input">';
            } else {
                originalPhoneFieldHTML = phoneInput.outerHTML;
            }
        }
        
        // Destroy any existing iti instance
        if (phoneInput.itiInstance) {
            try {
                phoneInput.itiInstance.destroy();
            } catch (e) {
                console.log('Error destroying instance:', e);
            }
            phoneInput.itiInstance = null;
        }
        
        if (window.phoneItiInstance) {
            try {
                window.phoneItiInstance.destroy();
            } catch (e) {
                console.log('Error destroying global instance:', e);
            }
            window.phoneItiInstance = null;
        }
        
        // Remove any iti containers
        const itiContainer = phoneInput.closest('.iti');
        if (itiContainer) {
            const grandParent = itiContainer.parentElement;
            // Replace entire iti container with fresh input
            itiContainer.outerHTML = originalPhoneFieldHTML;
        } else {
            // Just replace the input
            phoneInput.outerHTML = originalPhoneFieldHTML;
        }
        
        // Clean up any leftover dropdowns
        document.querySelectorAll('.iti__country-list').forEach(el => el.remove());
        document.querySelectorAll('.iti__country-list-clone').forEach(el => el.remove());
        
        // Get the new input element
        const newPhoneInput = modal.querySelector('input#phone');
        if (newPhoneInput) {
            // Remove any initialization markers
            newPhoneInput.removeAttribute('data-iti-init');
            newPhoneInput.removeAttribute('data-phone-initialized');
            newPhoneInput.classList.remove('iti__input');
            
            // Re-initialize after a short delay
            setTimeout(() => {
                if (window.intlTelInput) {
                    console.log('Re-initializing phone field fresh');
                    const iti = window.intlTelInput(newPhoneInput, {
                        initialCountry: "us",
                        preferredCountries: ["us", "ca", "gb", "au"],
                        separateDialCode: true,
                        formatOnDisplay: true,
                        nationalMode: false,
                        autoPlaceholder: "aggressive",
                        allowDropdown: true,
                        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
                    });
                    
                    newPhoneInput.itiInstance = iti;
                    window.phoneItiInstance = iti;
                    
                    console.log('Phone field re-initialized successfully');
                }
            }, 100);
        }
        
        // Also reset country dropdown
        const countrySelect = modal.querySelector('select#country');
        if (countrySelect) {
            countrySelect.value = 'USA';
        }
    }
    
    // Override openCTAModal
    const originalOpenCTA = window.openCTAModal;
    if (originalOpenCTA) {
        window.openCTAModal = function(type) {
            console.log('Opening CTA modal with complete reset');
            
            // Call original
            const result = originalOpenCTA.apply(this, arguments);
            
            // Complete reset after modal opens
            setTimeout(completePhoneReset, 250);
            
            return result;
        };
    }
    
    // Also reset on button clicks as backup
    document.addEventListener('click', function(e) {
        if (e.target.matches('.cta-button, .btn-primary, [data-action="demo"]')) {
            setTimeout(completePhoneReset, 350);
        }
    });
    
    // Fix for stuck dropdown - force close on any outside click
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.iti')) {
            // Force close all dropdowns
            document.querySelectorAll('.iti__country-list').forEach(dropdown => {
                dropdown.classList.add('iti__hide');
                dropdown.style.display = 'none';
                dropdown.style.visibility = 'hidden';
            });
        }
    }, true);
    
    console.log('Phone complete reset ready');
})();

// Fix phone field reset and stuck country issue
(function() {
    'use strict';
    
    console.log('Phone reset fix loading...');
    
    // Store the last opened modal to detect changes
    let lastModalOpened = null;
    
    // Function to completely reset phone field
    function resetPhoneField() {
        const phoneInput = document.querySelector('#ctaModal input#phone');
        if (!phoneInput) return;
        
        console.log('Resetting phone field completely');
        
        // Clear the value
        phoneInput.value = '';
        
        // Get the iti instance
        let iti = phoneInput.itiInstance || window.phoneItiInstance;
        
        if (iti) {
            // Reset to US
            iti.setCountry('us');
            iti.setNumber('');
            
            // Force close any open dropdown
            const dropdown = document.querySelector('.iti__country-list');
            if (dropdown) {
                dropdown.classList.add('iti__hide');
                dropdown.style.display = 'none';
                dropdown.style.visibility = 'hidden';
            }
            
            // Clean up any cloned dropdowns
            const clonedDropdowns = document.querySelectorAll('.iti__country-list-clone');
            clonedDropdowns.forEach(clone => clone.remove());
            
            // Force UI update
            const container = phoneInput.closest('.iti');
            if (container) {
                const flag = container.querySelector('.iti__flag');
                const dialCode = container.querySelector('.iti__selected-dial-code');
                const selectedFlag = container.querySelector('.iti__selected-flag');
                
                if (flag) {
                    flag.className = 'iti__flag iti__us';
                }
                if (dialCode) {
                    dialCode.textContent = '+1';
                }
                if (selectedFlag) {
                    selectedFlag.setAttribute('title', 'United States: +1');
                }
            }
        }
        
        // Also reset country dropdown if present
        const countrySelect = document.querySelector('#ctaModal select#country');
        if (countrySelect) {
            countrySelect.value = 'USA';
        }
    }
    
    // Watch for modal opens
    const originalOpen = window.openCTAModal;
    if (originalOpen) {
        window.openCTAModal = function(type) {
            console.log('Modal opening, will reset phone field');
            
            // Call original function
            const result = originalOpen.apply(this, arguments);
            
            // Reset phone field after modal opens
            setTimeout(resetPhoneField, 200);
            
            return result;
        };
    }
    
    // Also watch for CTA button clicks
    document.addEventListener('click', function(e) {
        if (e.target.matches('.cta-button, .btn-primary, [data-action="demo"], button[onclick*="openCTAModal"]')) {
            console.log('CTA button clicked, will reset phone field');
            setTimeout(resetPhoneField, 300);
        }
    }, true);
    
    // Fix stuck dropdown issue
    document.addEventListener('click', function(e) {
        // If clicking anywhere outside the phone field and dropdown, close dropdown
        if (!e.target.closest('.iti__selected-flag') && 
            !e.target.closest('.iti__country-list') &&
            !e.target.closest('.iti__country')) {
            
            const dropdown = document.querySelector('.iti__country-list');
            if (dropdown && !dropdown.classList.contains('iti__hide')) {
                console.log('Closing dropdown - clicked outside');
                dropdown.classList.add('iti__hide');
                dropdown.style.display = 'none';
            }
        }
    });
    
    console.log('Phone reset fix ready');
})();

// Phone field initialization for Cellionyx - FIXED VERSION
(function() {
    'use strict';
    
    // Function to initialize a phone input field
    function initializePhoneField(phoneInput) {
        if (!phoneInput || !window.intlTelInput) return;
        
        // Check if already initialized
        if (phoneInput.classList.contains('iti__input') || phoneInput.parentElement.classList.contains('iti')) {
            return; // Already initialized
        }
        
        // Mark as being initialized
        phoneInput.setAttribute('data-iti-init', 'true');
        
        // Initialize intl-tel-input with US as default
        const iti = window.intlTelInput(phoneInput, {
            initialCountry: "us",
            preferredCountries: ["us", "ca", "gb"],
            separateDialCode: true,
            formatOnDisplay: true,
            nationalMode: false,
            autoPlaceholder: "aggressive",
            dropdownContainer: document.body,
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
        });
        
        // Force set to US after initialization
        setTimeout(() => {
            if (iti && iti.setCountry) {
                iti.setCountry("us");
            }
        }, 50);
        
        // Store instance on element
        phoneInput.itiInstance = iti;
        
        // Handle form submission
        const form = phoneInput.closest('form');
        if (form && !form.hasAttribute('data-iti-handler')) {
            form.setAttribute('data-iti-handler', 'true');
            form.addEventListener('submit', function(e) {
                if (iti && iti.isValidNumber) {
                    phoneInput.value = iti.getNumber();
                }
            });
        }
        
        console.log('Phone field initialized:', phoneInput.id || phoneInput.name);
    }
    
    // Initialize all phone fields
    function initializeAllPhoneFields() {
        const phoneInputs = document.querySelectorAll('input[type="tel"]:not([data-iti-init]), input#phone:not([data-iti-init])');
        phoneInputs.forEach(input => {
            initializePhoneField(input);
        });
    }
    
    // Wait for modal to be fully visible before initializing
    function initializeModalPhone() {
        const modal = document.getElementById('ctaModal');
        if (modal && modal.style.display === 'block') {
            setTimeout(() => {
                const phoneInput = modal.querySelector('#phone');
                if (phoneInput) {
                    initializePhoneField(phoneInput);
                }
            }, 200); // Wait for modal animation
        }
    }
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Don't initialize modal phone fields on page load
        const nonModalPhones = document.querySelectorAll('input[type="tel"]:not(#ctaModal input)');
        nonModalPhones.forEach(input => {
            initializePhoneField(input);
        });
    });
    
    // Initialize when CTA buttons are clicked
    document.addEventListener('click', function(e) {
        if (e.target.matches('.cta-button, .btn-primary, [data-action="demo"], a.btn, button.btn')) {
            setTimeout(initializeModalPhone, 300);
        }
        if (e.target.textContent && e.target.textContent.includes('Request a Demo')) {
            setTimeout(initializeModalPhone, 300);
        }
    }, true);
    
    // Watch for modal visibility changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'ctaModal' && mutation.target.style.display === 'block') {
                setTimeout(initializeModalPhone, 200);
            }
        });
    });
    
    if (document.getElementById('ctaModal')) {
        observer.observe(document.getElementById('ctaModal'), {
            attributes: true,
            attributeFilter: ['style']
        });
    }
    
    // Export for global use
    window.initializePhoneField = initializePhoneField;
    window.initializeAllPhoneFields = initializeAllPhoneFields;
})();

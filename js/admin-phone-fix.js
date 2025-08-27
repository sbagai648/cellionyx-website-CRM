// Admin Portal Phone Field Fix for Cellionyx
(function() {
    'use strict';
    
    // Wait for intl-tel-input to be loaded
    function waitForITI(callback) {
        if (window.intlTelInput) {
            callback();
        } else {
            setTimeout(() => waitForITI(callback), 100);
        }
    }
    
    // Initialize phone field with intl-tel-input
    function initializePhoneField(inputId) {
        const phoneInput = document.getElementById(inputId);
        if (!phoneInput || phoneInput.hasAttribute('data-iti-initialized')) {
            return;
        }
        
        // Mark as initialized
        phoneInput.setAttribute('data-iti-initialized', 'true');
        
        // Initialize intl-tel-input
        const iti = window.intlTelInput(phoneInput, {
            initialCountry: "us",
            preferredCountries: ["us", "ca", "gb", "au"],
            separateDialCode: true,
            formatOnDisplay: true,
            nationalMode: false,
            autoPlaceholder: "aggressive",
            utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js"
        });
        
        // Store instance
        phoneInput.itiInstance = iti;
        
        console.log(`Phone field initialized: ${inputId}`);
        return iti;
    }
    
    // Format phone display with flag
    function formatPhoneDisplay(phone) {
        if (!phone) return '';
        
        // Extract country code
        let countryCode = 'us'; // default
        let displayPhone = phone;
        
        // Map common country codes to flags
        const countryFlags = {
            '+1': '🇺🇸',
            '+44': '🇬🇧',
            '+61': '🇦🇺',
            '+33': '🇫🇷',
            '+49': '🇩🇪',
            '+39': '🇮🇹',
            '+34': '🇪🇸',
            '+31': '🇳🇱',
            '+32': '🇧🇪',
            '+41': '🇨🇭',
            '+43': '🇦🇹',
            '+46': '🇸🇪',
            '+47': '🇳🇴',
            '+45': '🇩🇰',
            '+358': '🇫🇮',
            '+64': '🇳🇿',
            '+81': '🇯🇵',
            '+86': '🇨🇳',
            '+91': '🇮🇳',
            '+55': '🇧🇷',
            '+52': '🇲🇽',
            '+82': '🇰🇷',
            '+65': '🇸🇬',
            '+972': '🇮🇱',
            '+971': '🇦🇪',
            '+27': '🇿🇦'
        };
        
        // Find matching country code
        for (const [code, flag] of Object.entries(countryFlags)) {
            if (phone.startsWith(code)) {
                return `${flag} ${phone}`;
            }
        }
        
        // Default to US if no + sign
        if (!phone.startsWith('+')) {
            return `🇺🇸 +1 ${phone}`;
        }
        
        return phone;
    }
    
    // Initialize all phone fields
    function initializeAllPhoneFields() {
        // Add/Edit Prospect phone fields
        initializePhoneField('newProspectPhone');
        initializePhoneField('editProspectPhone');
        
        // Add/Edit User phone fields
        initializePhoneField('newUserPhone');
        initializePhoneField('editUserPhone');
    }
    
    // Update phone displays in tables
    function updatePhoneDisplays() {
        // Update prospect table
        document.querySelectorAll('#prospectsTableBody td[data-phone]').forEach(td => {
            const phone = td.getAttribute('data-phone');
            if (phone && !td.innerHTML.includes('🇺🇸') && !td.innerHTML.includes('🇬🇧')) {
                td.innerHTML = formatPhoneDisplay(phone);
            }
        });
        
        // Update user table
        document.querySelectorAll('#usersTableBody td[data-phone]').forEach(td => {
            const phone = td.getAttribute('data-phone');
            if (phone && !td.innerHTML.includes('🇺🇸') && !td.innerHTML.includes('🇬🇧')) {
                td.innerHTML = formatPhoneDisplay(phone);
            }
        });
    }
    
    // Override the loadProspects function to add phone formatting
    const originalLoadProspects = window.loadProspects;
    if (originalLoadProspects) {
        window.loadProspects = async function() {
            await originalLoadProspects.apply(this, arguments);
            setTimeout(updatePhoneDisplays, 100);
        };
    }
    
    // Override the loadUsers function to add phone formatting
    const originalLoadUsers = window.loadUsers;
    if (originalLoadUsers) {
        window.loadUsers = async function() {
            await originalLoadUsers.apply(this, arguments);
            setTimeout(updatePhoneDisplays, 100);
        };
    }
    
    // Watch for modal opens to reinitialize phone fields
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.classList.contains('detail-panel') && target.style.display !== 'none') {
                    setTimeout(initializeAllPhoneFields, 100);
                }
            }
        });
    });
    
    // Start observing
    document.querySelectorAll('.detail-panel').forEach(panel => {
        observer.observe(panel, { attributes: true });
    });
    
    // Initialize on DOM ready
    waitForITI(() => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initializeAllPhoneFields();
                updatePhoneDisplays();
            });
        } else {
            initializeAllPhoneFields();
            updatePhoneDisplays();
        }
        
        // Also reinitialize after a delay
        setTimeout(() => {
            initializeAllPhoneFields();
            updatePhoneDisplays();
        }, 1000);
        
        // Set up periodic updates for displays
        setInterval(updatePhoneDisplays, 5000);
    });
})();

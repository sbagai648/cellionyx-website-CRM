// Complete fix for Cellionyx Admin Portal phone fields
(function() {
    'use strict';
    
    console.log('Admin Portal Fix Loading...');
    
    // Wait for page to be ready
    function waitForReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }
    
    // Fix phone displays in tables
    function fixPhoneDisplays() {
        // Fix prospect table displays
        const prospectRows = document.querySelectorAll('#prospectsBody tr');
        prospectRows.forEach(row => {
            const phoneTd = row.cells[2]; // Phone is 3rd column
            if (phoneTd) {
                let phone = phoneTd.textContent.trim();
                if (phone && phone !== '-' && !phone.includes('🇺🇸')) {
                    // Add flag if not already there
                    if (phone.startsWith('+1')) {
                        phoneTd.innerHTML = '🇺🇸 ' + phone;
                    } else if (phone.startsWith('+44')) {
                        phoneTd.innerHTML = '🇬🇧 ' + phone;
                    } else if (phone.startsWith('+91')) {
                        phoneTd.innerHTML = '🇮🇳 ' + phone;
                    } else if (!phone.startsWith('+')) {
                        phoneTd.innerHTML = '🇺🇸 +1 ' + phone;
                    }
                }
            }
        });
        
        // Fix user table displays
        const userRows = document.querySelectorAll('#usersBody tr');
        userRows.forEach(row => {
            const emailPhoneTd = row.cells[1]; // Email/Phone is 2nd column
            if (emailPhoneTd) {
                const phoneSmall = emailPhoneTd.querySelector('small');
                if (phoneSmall) {
                    let phone = phoneSmall.textContent.trim();
                    if (phone && phone !== '-' && !phone.includes('🇺🇸')) {
                        if (phone.startsWith('+1')) {
                            phoneSmall.innerHTML = '🇺🇸 ' + phone;
                        } else if (!phone.startsWith('+')) {
                            phoneSmall.innerHTML = '🇺🇸 +1 ' + phone;
                        }
                    }
                }
            }
        });
    }
    
    // Override the phone validation to accept intl-tel-input format
    function fixPhoneValidation() {
        // Override createNewProspect validation
        const originalCreateProspect = window.createNewProspect;
        if (originalCreateProspect) {
            window.createNewProspect = async function() {
                // Get phone from intl-tel-input
                const phoneInput = document.querySelector('#newProspectPhone');
                if (phoneInput && phoneInput.itiInstance) {
                    const fullNumber = phoneInput.itiInstance.getNumber();
                    if (fullNumber) {
                        phoneInput.value = fullNumber;
                        console.log('Setting prospect phone to:', fullNumber);
                    }
                }
                
                // Temporarily bypass phone validation
                const origValue = phoneInput.value;
                if (origValue && !origValue.startsWith('+')) {
                    phoneInput.value = '+1' + origValue.replace(/\D/g, '');
                }
                
                // Call original function
                const result = await originalCreateProspect.apply(this, arguments);
                
                // Refresh the table
                setTimeout(() => {
                    if (window.loadProspects) {
                        window.loadProspects();
                    }
                }, 1000);
                
                return result;
            };
        }
    }
    
    // Initialize fixes
    waitForReady(() => {
        console.log('Applying admin portal fixes...');
        
        // Fix displays immediately
        fixPhoneDisplays();
        
        // Fix validation
        fixPhoneValidation();
        
        // Re-fix displays whenever table updates
        const observer = new MutationObserver(() => {
            fixPhoneDisplays();
        });
        
        const prospectsBody = document.getElementById('prospectsBody');
        if (prospectsBody) {
            observer.observe(prospectsBody, { childList: true, subtree: true });
        }
        
        const usersBody = document.getElementById('usersBody');
        if (usersBody) {
            observer.observe(usersBody, { childList: true, subtree: true });
        }
        
        // Also fix on interval
        setInterval(fixPhoneDisplays, 2000);
        
        console.log('Admin portal fixes applied!');
    });
})();

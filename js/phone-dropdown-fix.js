// Force phone dropdown to work
(function() {
    'use strict';
    
    // Wait for modal to be ready
    setTimeout(() => {
        // Use event delegation to catch ALL clicks on flag
        document.addEventListener('click', function(e) {
            // Handle country selection FIRST (before flag button check)
            const countryItem = e.target.closest('.iti__country');
            if (countryItem) {
                console.log('Country selected:', countryItem);
                const countryCode = countryItem.getAttribute('data-country-code');
                const dialCode = countryItem.getAttribute('data-dial-code');
                
                // Update the flag and dial code manually
                if (window.phoneItiInstance) {
                    // Use the library's method to set country
                    window.phoneItiInstance.setCountry(countryCode);
                    console.log('Set country to:', countryCode);
                    
                    // Force UI update
                    const selectedFlag = document.querySelector('.iti__selected-flag');
                    if (selectedFlag) {
                        // Update the flag class
                        const flagDiv = selectedFlag.querySelector('.iti__flag');
                        if (flagDiv) {
                            flagDiv.className = `iti__flag iti__${countryCode}`;
                        }
                        
                        // Update the dial code
                        const dialCodeSpan = selectedFlag.querySelector('.iti__selected-dial-code');
                        if (dialCodeSpan) {
                            dialCodeSpan.textContent = '+' + dialCode;
                        }
                        
                        // Update the title
                        const countryName = countryItem.querySelector('.iti__country-name');
                        if (countryName) {
                            selectedFlag.setAttribute('title', countryName.textContent + ': +' + dialCode);
                        }
                        
                        console.log('Manually updated flag UI to:', countryCode);
                    }
                    
                    // Sync country dropdown
                    const countryMap = {
                        'us': 'United States',
                        'ca': 'Canada',
                        'gb': 'United Kingdom',
                        'de': 'Germany',
                        'fr': 'France',
                        'it': 'Italy',
                        'es': 'Spain',
                        'nl': 'Netherlands',
                        'be': 'Belgium',
                        'ch': 'Switzerland',
                        'at': 'Austria',
                        'se': 'Sweden',
                        'no': 'Norway',
                        'dk': 'Denmark',
                        'fi': 'Finland',
                        'au': 'Australia',
                        'nz': 'New Zealand',
                        'jp': 'Japan',
                        'cn': 'China',
                        'in': 'India',
                        'br': 'Brazil',
                        'mx': 'Mexico',
                        'kr': 'South Korea',
                        'sg': 'Singapore',
                        'il': 'Israel',
                        'ae': 'United Arab Emirates',
                        'za': 'South Africa'
                    };
                    
                    const countryName = countryMap[countryCode];
                    if (countryName) {
                        const modal = document.querySelector('.modal[style*="block"], #ctaModal[style*="block"]');
                        if (modal) {
                            const countrySelect = modal.querySelector('select[name="country"], select#country');
                            if (countrySelect) {
                                countrySelect.value = countryName;
                                console.log(`Synced country dropdown to: ${countryName}`);
                            }
                        }
                    }
                } else {
                    console.log('No iti instance found');
                }
                
                // Close the dropdown
                setTimeout(() => {
                    const dropdown = document.querySelector('.iti__country-list');
                    if (dropdown) {
                        dropdown.classList.add('iti__hide');
                        dropdown.style.display = 'none';
                    }
                }, 50);
                
                return; // Let this event complete normally
            }
            
            // Check if clicked on flag or its children
            const flagButton = e.target.closest('.iti__selected-flag');
            if (flagButton) {
                console.log('FLAG CLICKED - Forcing dropdown toggle');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // Stop ALL other handlers
                
                // Find the dropdown
                const dropdown = document.querySelector('.iti__country-list');
                if (dropdown) {
                    if (dropdown.classList.contains('iti__hide')) {
                        console.log('Opening dropdown');
                        dropdown.classList.remove('iti__hide');
                        
                        // Remove all inline styles first
                        dropdown.removeAttribute('style');
                        
                        // Apply styles using cssText for better compatibility
                        dropdown.style.cssText = `
                            display: block !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                            pointer-events: auto !important;
                            z-index: 2147483647 !important;
                            position: fixed !important;
                            background: #1a1a1a !important;
                            border: 1px solid #4a90e2 !important;
                            max-height: 200px !important;
                            overflow-y: auto !important;
                            width: 300px !important;
                            height: auto !important;
                            min-height: 100px !important;
                            overflow-x: hidden !important;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.5) !important;
                        `;
                        
                        // Position it below the flag
                        const flagRect = flagButton.getBoundingClientRect();
                        const dropdownTop = flagRect.bottom + 2;
                        const dropdownLeft = flagRect.left;
                        
                        // Add position after cssText to not overwrite it
                        dropdown.style.top = dropdownTop + 'px';
                        dropdown.style.left = dropdownLeft + 'px';
                        
                        // Force a reflow to ensure styles are applied
                        dropdown.offsetHeight;
                        
                        // Check if position is within viewport
                        console.log('Flag button position:', {
                            top: flagRect.top,
                            bottom: flagRect.bottom,
                            left: flagRect.left,
                            right: flagRect.right
                        });
                        console.log('Dropdown will be at:', {
                            top: dropdownTop,
                            left: dropdownLeft
                        });
                        console.log('Viewport size:', {
                            width: window.innerWidth,
                            height: window.innerHeight
                        });
                        
                        console.log('Dropdown positioned at:', {
                            top: dropdown.style.top,
                            left: dropdown.style.left,
                            display: dropdown.style.display,
                            visibility: dropdown.style.visibility,
                            zIndex: dropdown.style.zIndex
                        });
                        
                        // Check computed styles
                        const computed = window.getComputedStyle(dropdown);
                        console.log('Dropdown computed styles:', {
                            display: computed.display,
                            visibility: computed.visibility,
                            opacity: computed.opacity,
                            zIndex: computed.zIndex,
                            position: computed.position,
                            top: computed.top,
                            left: computed.left
                        });
                        
                        // Check if modal is blocking
                        const modal = document.querySelector('.modal');
                        if (modal) {
                            const modalComputed = window.getComputedStyle(modal);
                            console.log('Modal z-index:', modalComputed.zIndex);
                        }
                        
                        // Double-check critical styles are applied
                        // Using a timeout to ensure DOM has updated
                        setTimeout(() => {
                            const checkRect = dropdown.getBoundingClientRect();
                            if (checkRect.width === 0 || checkRect.height === 0) {
                                console.log('WARNING: Dropdown still has zero dimensions, forcing inline styles');
                                
                                // Nuclear option: clone and replace the dropdown
                                const clone = dropdown.cloneNode(true);
                                clone.className = 'iti__country-list';
                                clone.setAttribute('style', `
                                    display: block !important;
                                    visibility: visible !important;
                                    opacity: 1 !important;
                                    z-index: 2147483647 !important;
                                    position: fixed !important;
                                    top: ${dropdownTop}px !important;
                                    left: ${dropdownLeft}px !important;
                                    width: 280px !important;
                                    height: auto !important;
                                    max-height: 300px !important;
                                    overflow-y: auto !important;
                                    overflow-x: hidden !important;
                                    background: #1a1a1a !important;
                                    border: 1px solid #4a90e2 !important;
                                    box-shadow: 0 2px 10px rgba(0,0,0,0.5) !important;
                                    padding: 0 !important;
                                `);
                                
                                // Append to body instead of inside the iti container
                                document.body.appendChild(clone);
                                
                                // Store reference for cleanup
                                window.cellionyx_dropdown_clone = clone;
                                
                                // Add click handlers to the cloned dropdown
                                clone.addEventListener('click', (e) => {
                                    const country = e.target.closest('.iti__country');
                                    if (country) {
                                        const countryCode = country.getAttribute('data-country-code');
                                        if (countryCode && window.phoneItiInstance) {
                                            window.phoneItiInstance.setCountry(countryCode);
                                            
                                            // Find the active phone field's flag container
                                            // The modal phone field should be the active one
                                            const modal = document.querySelector('.modal');
                                            const flagContainer = modal ? 
                                                modal.querySelector('.iti__selected-flag') : 
                                                document.querySelector('.iti__selected-flag');
                                            
                                            if (flagContainer) {
                                                const flagDiv = flagContainer.querySelector('.iti__flag');
                                                const dialCode = flagContainer.querySelector('.iti__selected-dial-code');
                                                
                                                if (flagDiv) {
                                                    // Remove all existing flag classes
                                                    flagDiv.className = flagDiv.className.replace(/iti__\w+/g, '').trim();
                                                    // Add the new flag class
                                                    flagDiv.className = `iti__flag iti__${countryCode}`;
                                                    console.log('Updated flag to:', flagDiv.className);
                                                }
                                                
                                                if (dialCode) {
                                                    const countryData = window.phoneItiInstance.getSelectedCountryData();
                                                    dialCode.textContent = '+' + countryData.dialCode;
                                                    console.log('Updated dial code to:', dialCode.textContent);
                                                }
                                                
                                                // Update the title attribute
                                                flagContainer.setAttribute('title', country.querySelector('.iti__country-name').textContent);
                                            }
                                            
                                                                        // Trigger country change event for syncing
                            const event = new CustomEvent('countrychange', { 
                                detail: { countryCode: countryCode }
                            });
                            document.dispatchEvent(event);
                            
                            // Also sync country dropdown directly since we removed the flags script
                            const countryMap = {
                                'us': 'United States',
                                'ca': 'Canada',
                                'gb': 'United Kingdom',
                                'de': 'Germany',
                                'fr': 'France',
                                'it': 'Italy',
                                'es': 'Spain',
                                'nl': 'Netherlands',
                                'be': 'Belgium',
                                'ch': 'Switzerland',
                                'at': 'Austria',
                                'se': 'Sweden',
                                'no': 'Norway',
                                'dk': 'Denmark',
                                'fi': 'Finland',
                                'au': 'Australia',
                                'nz': 'New Zealand',
                                'jp': 'Japan',
                                'cn': 'China',
                                'in': 'India',
                                'br': 'Brazil',
                                'mx': 'Mexico',
                                'kr': 'South Korea',
                                'sg': 'Singapore',
                                'il': 'Israel',
                                'ae': 'United Arab Emirates',
                                'za': 'South Africa'
                            };
                            
                            const countryName = countryMap[countryCode];
                            if (countryName) {
                                const modal = document.querySelector('.modal[style*="block"], #ctaModal[style*="block"]');
                                if (modal) {
                                    const countrySelect = modal.querySelector('select[name="country"], select#country');
                                    if (countrySelect) {
                                        countrySelect.value = countryName;
                                        console.log(`Synced country dropdown to: ${countryName}`);
                                    }
                                }
                            }
                                        }
                                        // Remove clone
                                        clone.remove();
                                        window.cellionyx_dropdown_clone = null;
                                    }
                                });
                                
                                console.log('Created dropdown clone attached to body');
                            }
                        }, 10);
                        
                        // Check if dropdown is actually visible
                        const dropdownRect = dropdown.getBoundingClientRect();
                        console.log('Dropdown actual position:', {
                            top: dropdownRect.top,
                            bottom: dropdownRect.bottom,
                            left: dropdownRect.left,
                            right: dropdownRect.right,
                            width: dropdownRect.width,
                            height: dropdownRect.height
                        });
                        
                        // Check parent elements for overflow hidden
                        let parent = dropdown.parentElement;
                        while (parent && parent !== document.body) {
                            const parentStyle = window.getComputedStyle(parent);
                            if (parentStyle.overflow === 'hidden' || parentStyle.overflowX === 'hidden' || parentStyle.overflowY === 'hidden') {
                                console.log('WARNING: Parent has overflow hidden:', parent.className || parent.tagName, parentStyle.overflow);
                            }
                            parent = parent.parentElement;
                        }
                        
                        // Make sure it has content
                        if (dropdown.children.length === 0) {
                            console.log('WARNING: Dropdown has no children!');
                        } else {
                            console.log('Dropdown has', dropdown.children.length, 'countries');
                        }
                    } else {
                        console.log('Closing dropdown');
                        dropdown.classList.add('iti__hide');
                        dropdown.style.display = 'none';
                        
                        // Clean up any clones
                        if (window.cellionyx_dropdown_clone) {
                            window.cellionyx_dropdown_clone.remove();
                            window.cellionyx_dropdown_clone = null;
                        }
                    }
                }
                
                return false; // Prevent any other handling
            }
            
            // Close dropdown when clicking outside
            const dropdown = document.querySelector('.iti__country-list');
            if (dropdown && !dropdown.classList.contains('iti__hide')) {
                const flagContainer = document.querySelector('.iti__flag-container');
                if (!flagContainer.contains(e.target) && !dropdown.contains(e.target)) {
                    console.log('Clicking outside, closing dropdown');
                    dropdown.classList.add('iti__hide');
                    dropdown.style.display = 'none';
                }
            }
        }, true); // Use capture phase to intercept first
    }, 1000);
})();

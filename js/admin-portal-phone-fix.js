    //
    // CELLIONYX ADMIN PORTAL - MASTER PHONE SCRIPT (v3.0 - Final)
    // This single script handles all phone number formatting and initialization in the admin portal.
    //
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Admin Portal Master Phone Script Loaded (v3.0 - Final)');

        /**
         * Takes a phone number string and returns a promise that resolves with a formatted number including a flag.
         * @param {string} phoneNumber - The phone number to format.
         * @returns {Promise<string>} A promise that resolves to the formatted phone number string.
         */
        window.getFormattedPhoneNumber = function(phoneNumber) {
            return new Promise(resolve => {
                if (!phoneNumber || !window.intlTelInput) {
                    resolve(phoneNumber || '-');
                    return;
                }
                const tempInput = document.createElement('input');
                tempInput.type = 'tel';
                tempInput.style.display = 'none';
                document.body.appendChild(tempInput);
                const iti = window.intlTelInput(tempInput, {
                    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
                });
                iti.setNumber(phoneNumber);
                iti.promise.then(() => {
                    const countryData = iti.getSelectedCountryData();
                    const flag = countryData.iso2 ? `<span class="iti__flag iti__${countryData.iso2}"></span>` : '🌐';
                    const formattedNumber = iti.getNumber(intlTelInputUtils.numberFormat.INTERNATIONAL);
                    iti.destroy();
                    tempInput.remove();
                    resolve(`${flag} ${formattedNumber || phoneNumber}`);
                }).catch(() => {
                    iti.destroy();
                    tempInput.remove();
                    resolve(phoneNumber || '-');
                });
            });
        }

        /**
         * Initializes intl-tel-input on a specific phone field.
         * @param {HTMLElement} phoneInput - The input element to initialize.
         */
        function initializePhoneFormField(phoneInput) {
            if (!phoneInput || !window.intlTelInput || phoneInput.classList.contains('iti__input')) {
                return; // Do not re-initialize
            }
            console.log(`Initializing form phone field: #${phoneInput.id}`);
            const itiInstance = window.intlTelInput(phoneInput, {
                initialCountry: "us",
                preferredCountries: ["us", "ca", "gb", "au"],
                separateDialCode: true,
                utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
            });
            phoneInput.itiInstance = itiInstance;
        }

        // Use a MutationObserver to reliably initialize phone fields when panels open.
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const targetPanel = mutation.target;
                    if (targetPanel.classList.contains('active')) {
                        const phoneInputs = targetPanel.querySelectorAll('#newProspectPhone, #editProspectPhone, #newPhone, #editPhone');
                        phoneInputs.forEach(initializePhoneFormField);
                    }
                }
            }
        });

        const panelsToObserve = ['prospectAddPanel', 'prospectDetailPanel', 'userAddPanel', 'userEditPanel'];
        panelsToObserve.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                observer.observe(panel, { attributes: true });
            }
        });
    });
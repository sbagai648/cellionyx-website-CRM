// Run this in the browser console after opening the modal

console.log('=== DEBUGGING FORM SUBMISSION ===');

// Check if form exists
const form = document.getElementById('ctaForm');
console.log('Form found:', form ? 'YES' : 'NO');

if (form) {
    console.log('Form ID:', form.id);
    console.log('Form action:', form.action);
    console.log('Form method:', form.method);
    
    // Check submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    console.log('Submit button found:', submitBtn ? 'YES' : 'NO');
    
    if (submitBtn) {
        console.log('Submit button text:', submitBtn.textContent);
        console.log('Submit button disabled:', submitBtn.disabled);
    }
    
    // Check if there are any submit handlers
    const handlers = getEventListeners ? getEventListeners(form) : null;
    if (handlers) {
        console.log('Event listeners on form:', handlers);
    }
    
    // Try to manually attach a handler
    console.log('\nManually attaching submit handler...');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('>>> FORM SUBMITTED! <<<');
        console.log('Form data:');
        
        const formData = new FormData(form);
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        // Now try the actual submission
        console.log('\nCalling the real submission function...');
        
        // Collect the data
        const userTypeSelect = form.querySelector('#userType');
        const areaOfInterestSelect = form.querySelector('#areaOfInterest');
        const intendedUseSelect = form.querySelector('#intendedUse');
        
        const data = {
            firstName: form.querySelector('#firstName')?.value?.trim() || '',
            lastName: form.querySelector('#lastName')?.value?.trim() || '',
            email: form.querySelector('#email')?.value?.trim() || '',
            phone: form.querySelector('#phone')?.value?.trim() || '',
            country: form.querySelector('#country')?.value || '',
            state: form.querySelector('#state')?.value?.trim() || '',
            city: form.querySelector('#city')?.value?.trim() || '',
            userType: userTypeSelect?.value || '',
            userTypeLabel: userTypeSelect?.options[userTypeSelect?.selectedIndex]?.text || '',
            organization: form.querySelector('#organization')?.value?.trim() || '',
            areaOfInterest: areaOfInterestSelect?.value || '',
            areaOfInterestLabel: areaOfInterestSelect?.options[areaOfInterestSelect?.selectedIndex]?.text || '',
            intendedUse: intendedUseSelect?.value || '',
            intendedUseLabel: intendedUseSelect?.options[intendedUseSelect?.selectedIndex]?.text || '',
            additionalInfo: form.querySelector('#additionalInfo')?.value?.trim() || '',
            notes: form.querySelector('#notes')?.value?.trim() || '',
            consent: form.querySelector('#consent')?.checked || false
        };
        
        console.log('Data to submit:', data);
        
        // Check for notes field
        if (data.notes) {
            console.log('%c>>> NOTES FIELD HAS VALUE: ' + data.notes, 'color: green; font-weight: bold');
        } else {
            console.log('%c>>> NOTES FIELD IS EMPTY OR MISSING', 'color: orange');
        }
        
        // Submit to API
        fetch('https://us-central1-cellionyx-crm.cloudfunctions.net/api/public/submit-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            console.log('%c>>> SUBMISSION SUCCESS!', 'color: green; font-size: 16px');
            console.log('Response:', result);
            alert('Form submitted successfully! Check console for details.');
        })
        .catch(error => {
            console.error('%c>>> SUBMISSION ERROR!', 'color: red; font-size: 16px');
            console.error('Error:', error);
        });
    });
    
    console.log('✓ Handler attached. Now click the submit button!');
    
} else {
    console.log('ERROR: Form not found! Make sure the modal is open.');
    
    // List all forms on the page
    const allForms = document.querySelectorAll('form');
    console.log('All forms on page:', allForms.length);
    allForms.forEach((f, i) => {
        console.log(`  Form ${i}: id="${f.id}", class="${f.className}"`);
    });
}

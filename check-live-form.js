// Copy and paste this entire script into the browser console on https://cellionyx-crm.web.app

console.log('%c=== CHECKING CELLIONYX FORM ===', 'color: blue; font-size: 16px; font-weight: bold');

// Step 1: Open the modal
console.log('Step 1: Opening modal...');
const buttons = document.querySelectorAll('button, .btn');
let ctaButton = null;
buttons.forEach(btn => {
    if (btn.textContent.includes('Request') || btn.textContent.includes('Demo')) {
        ctaButton = btn;
    }
});

if (ctaButton) {
    ctaButton.click();
    console.log('✓ Modal opened');
} else {
    console.log('✗ Could not find CTA button');
}

// Step 2: Check for fields
setTimeout(() => {
    console.log('\nStep 2: Checking form fields...');
    
    const fields = {
        'First Name': document.getElementById('firstName'),
        'Last Name': document.getElementById('lastName'),
        'Email': document.getElementById('email'),
        'Phone': document.getElementById('phone'),
        'User Type': document.getElementById('userType'),
        'Area of Interest': document.getElementById('areaOfInterest'),
        'Notes': document.getElementById('notes'),
        'Consent': document.getElementById('consent')
    };
    
    for (const [name, element] of Object.entries(fields)) {
        if (element) {
            console.log(`✓ ${name} field found`);
            if (name === 'Notes') {
                console.log('%c  >>> NOTES FIELD EXISTS! <<<', 'color: green; font-weight: bold');
            }
        } else {
            console.log(`✗ ${name} field MISSING`);
            if (name === 'Notes') {
                console.log('%c  >>> NOTES FIELD IS MISSING! <<<', 'color: red; font-weight: bold');
            }
        }
    }
    
    // Step 3: Check JavaScript
    console.log('\nStep 3: Checking JavaScript...');
    
    // Check if the form has a submit handler
    const form = document.getElementById('ctaForm');
    if (form) {
        console.log('✓ Form found');
        
        // Fill test data
        console.log('\nStep 4: Filling test data...');
        if (fields['First Name']) fields['First Name'].value = 'Test';
        if (fields['Last Name']) fields['Last Name'].value = 'User';
        if (fields['Email']) fields['Email'].value = 'test' + Date.now() + '@example.com';
        if (fields['Phone']) fields['Phone'].value = '555-1234';
        if (fields['User Type']) fields['User Type'].value = fields['User Type'].options[1].value;
        if (fields['Area of Interest']) fields['Area of Interest'].value = fields['Area of Interest'].options[1].value;
        if (fields['Notes']) {
            fields['Notes'].value = 'Test note from console check';
            console.log('%c  >>> FILLED NOTES FIELD <<<', 'color: green; font-weight: bold');
        }
        if (fields['Consent']) fields['Consent'].checked = true;
        
        console.log('✓ Test data filled');
        console.log('\n%cYou can now:', 'color: blue; font-weight: bold');
        console.log('1. Click Submit to test the form');
        console.log('2. Check the Network tab to see what data is sent');
        console.log('3. Look for userTypeLabel, areaOfInterestLabel, and notes in the request');
    } else {
        console.log('✗ Form not found');
    }
    
}, 2000);

console.log('\n%cWait 2 seconds for the checks to complete...', 'color: gray');

#!/bin/bash

echo "Testing Cellionyx form submission with all new fields..."

curl -X POST https://us-central1-cellionyx-crm.cloudfunctions.net/api/public/submit-form \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test'$(date +%s)'@example.com",
    "phone": "555-1234",
    "country": "United States",
    "state": "California",
    "city": "Los Angeles",
    "userType": "physical-therapist",
    "userTypeLabel": "Physical Therapist",
    "organization": "Test Clinic",
    "areaOfInterest": "injury-recovery",
    "areaOfInterestLabel": "Injury Recovery",
    "intendedUse": "clinical-practice",
    "intendedUseLabel": "Clinical Practice",
    "additionalInfo": "Testing form",
    "notes": "This is a test note to verify notes field is working",
    "functionRole": "physical-therapist",
    "functionLabel": "Physical Therapist",
    "discipline": "injury-recovery",
    "disciplineLabel": "Injury Recovery",
    "ctaType": "demo",
    "page": "test.html",
    "consent": true
  }'

echo ""
echo "Check if response includes success message and prospect ID"

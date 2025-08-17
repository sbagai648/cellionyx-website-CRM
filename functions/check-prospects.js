const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

async function checkProspects() {
  console.log('🔍 Checking all prospects in Cellionyx CRM...\n');
  
  try {
    // Get all prospects
    const prospectsSnapshot = await db.collection('prospects').orderBy('createdAt', 'desc').limit(10).get();
    
    if (prospectsSnapshot.empty) {
      console.log('❌ No prospects found in the database.');
      return;
    }
    
    console.log(`✅ Found ${prospectsSnapshot.size} prospects (showing last 10):\n`);
    
    prospectsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`--- Prospect ${index + 1} ---`);
      console.log(`ID: ${doc.id}`);
      console.log(`Name: ${data.firstName} ${data.lastName}`);
      console.log(`Email: ${data.email}`);
      console.log(`Organization: ${data.organization || 'N/A'}`);
      console.log(`Lead Status: ${data.leadStatus || 'MISSING!'}`);
      console.log(`Priority: ${data.priority || 'MISSING!'}`);
      console.log(`Status: ${data.status || 'N/A'}`);
      console.log(`Assigned Rep: ${data.assignedRepName || 'Unassigned'}`);
      console.log(`Created: ${data.createdAt ? data.createdAt.toDate() : 'N/A'}`);
      console.log('');
    });
    
    // Count prospects without leadStatus field
    const allProspectsSnapshot = await db.collection('prospects').get();
    let missingLeadStatus = 0;
    let missingPriority = 0;
    
    allProspectsSnapshot.forEach(doc => {
      const data = doc.data();
      if (!data.leadStatus) missingLeadStatus++;
      if (!data.priority) missingPriority++;
    });
    
    console.log(`📊 Summary:`);
    console.log(`  Total prospects: ${allProspectsSnapshot.size}`);
    console.log(`  Missing leadStatus: ${missingLeadStatus}`);
    console.log(`  Missing priority: ${missingPriority}`);
    
    if (missingLeadStatus > 0) {
      console.log('\n⚠️ Prospects without leadStatus field will not show up in admin dashboard!');
      console.log('Run fix-prospects.js to add missing fields.');
    }
    
  } catch (error) {
    console.error('Error checking prospects:', error);
  }
  
  process.exit(0);
}

checkProspects();

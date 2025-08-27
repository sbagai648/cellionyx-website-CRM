const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
// Stripe configuration (optional)
let stripe = null;
try {
  let stripeKey = null;
  try {
    stripeKey = process.env.STRIPE_SECRET_KEY || (functions.config().stripe && functions.config().stripe.secret) || null;
  } catch (e) {
    stripeKey = process.env.STRIPE_SECRET_KEY || null;
  }
  if (stripeKey) {
    stripe = require('stripe')(stripeKey);
    console.log('✅ Stripe configured for payment processing');
  } else {
    console.log('⚠️ Stripe not configured - payment features disabled');
  }
} catch (error) {
  console.log('⚠️ Stripe configuration error - payment features disabled');
}
// Email configuration (optional - system works without it)
let sgMail = null;
let sendGridKey = null;

try {
  sgMail = require('@sendgrid/mail');
  // Try to get SendGrid key from config or environment
  try {
    sendGridKey = process.env.SENDGRID_API_KEY || (functions.config().sendgrid && functions.config().sendgrid.key) || null;
  } catch (e) {
    sendGridKey = process.env.SENDGRID_API_KEY || null;
  }
  if (sendGridKey) {
    sgMail.setApiKey(sendGridKey);
    console.log('✅ SendGrid configured for email notifications');
  } else {
    console.log('⚠️ SendGrid not configured - email notifications disabled');
  }
} catch (error) {
  console.log('⚠️ SendGrid module not available - email notifications disabled');
}

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Express app for API endpoints
const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// ===== AUTHENTICATION & USER MANAGEMENT =====

/**
 * Create a new user with custom claims (role-based access)
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  // Only admins can create users
  if (!context.auth || !context.auth.token.role || context.auth.token.role !== 'Admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can create users');
  }

  const { email, password, role, firstName, lastName, additionalData } = data;

  try {
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Set custom claims for role-based access
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      role,
      firstName,
      lastName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
      isActive: true,
      ...additionalData,
    });

    // Create role-specific documents
    if (role === 'Sales Rep' || role === 'Country Head') {
      await db.collection('salesReps').doc(userRecord.uid).set({
        userId: userRecord.uid,
        firstName,
        lastName,
        isCountryHead: role === 'Country Head',
        assignedProspects: [],
        performance: {
          totalProspects: 0,
          convertedCustomers: 0,
          conversionRate: 0,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { success: true, userId: userRecord.uid };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create user');
  }
});

/**
 * Update user role and custom claims
 */
exports.updateUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.role || context.auth.token.role !== 'Admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can update user roles');
  }

  const { userId, newRole } = data;

  try {
    await admin.auth().setCustomUserClaims(userId, { role: newRole });
    await db.collection('users').doc(userId).update({
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update user role');
  }
});

// ===== PROSPECT & CRM MANAGEMENT =====

/**
 * Create prospect from website form submissions
 */
exports.createProspect = functions.https.onCall(async (data, context) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    organization,
    function: userFunction,
    discipline,
    ctaType,
    page,
  } = data;

  try {
    // Auto-assign to available sales rep (simple round-robin)
    const salesRepsSnapshot = await db.collection('salesReps')
      .where('isActive', '==', true)
      .orderBy('assignedProspects')
      .limit(1)
      .get();

    let assignedRepId = null;
    if (!salesRepsSnapshot.empty) {
      assignedRepId = salesRepsSnapshot.docs[0].id;
    }

    // Create prospect document
    const prospectData = {
      firstName,
      lastName,
      email,
      phone,
      organization,
      function: userFunction,
      discipline,
      ctaType,
      sourcePage: page,
      status: 'New',
      assignedRepId,
      leadScore: calculateLeadScore(data),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastContactedAt: null,
      nextFollowUpAt: null,
      activities: [],
    };

    const prospectRef = await db.collection('prospects').add(prospectData);

    // Update assigned rep's prospect count
    if (assignedRepId) {
      await db.collection('salesReps').doc(assignedRepId).update({
        assignedProspects: admin.firestore.FieldValue.arrayUnion(prospectRef.id),
      });
    }

    // Log activity
    await logActivity(prospectRef.id, assignedRepId, 'prospect_created', {
      source: 'website_form',
      ctaType,
      page,
    });

    // Send notification to sales rep
    if (assignedRepId) {
      await sendNewProspectNotification(assignedRepId, prospectRef.id);
    }

    return { success: true, prospectId: prospectRef.id };
  } catch (error) {
    console.error('Error creating prospect:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create prospect');
  }
});

/**
 * Update prospect status and information
 */
exports.updateProspect = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { prospectId, updates } = data;
  const userId = context.auth.uid;

  try {
    // Verify user can edit this prospect
    const prospectDoc = await db.collection('prospects').doc(prospectId).get();
    const prospect = prospectDoc.data();

    if (!prospect) {
      throw new functions.https.HttpsError('not-found', 'Prospect not found');
    }

    // Check permissions
    const userRole = context.auth.token.role;
    const canEdit = userRole === 'Admin' || 
                   (userRole === 'Sales Rep' && prospect.assignedRepId === userId) ||
                   (userRole === 'Country Head');

    if (!canEdit) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot edit this prospect');
    }

    // Update prospect
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('prospects').doc(prospectId).update(updateData);

    // Log activity
    await logActivity(prospectId, userId, 'prospect_updated', updates);

    return { success: true };
  } catch (error) {
    console.error('Error updating prospect:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update prospect');
  }
});

/**
 * Log activity for prospect
 */
async function logActivity(prospectId, repId, activityType, details) {
  await db.collection('activities').add({
    prospectId,
    repId,
    type: activityType,
    details,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Calculate lead score based on prospect data
 */
function calculateLeadScore(data) {
  let score = 0;
  
  // Organization type scoring - updated for regenerative medicine context
  if (data.function === 'Research Institution') score += 35;
  if (data.function === 'Hospital') score += 30;
  if (data.function === 'Medical Practice') score += 25;
  if (data.function === 'Veterinary Clinic') score += 20;
  
  // Discipline scoring (higher value disciplines for Cellionyx)
  const highValueDisciplines = ['Regenerative Medicine', 'Sports Medicine', 'Orthopedics', 'Physical Therapy'];
  if (highValueDisciplines.includes(data.discipline)) score += 25;
  
  // CTA type scoring
  if (data.ctaType === 'Request a Clinical Demo') score += 40;
  if (data.ctaType === 'Join the Waiting List') score += 20;
  
  return Math.min(score, 100); // Cap at 100
}

// ===== APPOINTMENT SCHEDULING =====

/**
 * Schedule appointment
 */
exports.scheduleAppointment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { prospectId, appointmentTime, appointmentType, notes } = data;
  const repId = context.auth.uid;

  try {
    // Create appointment
    const appointmentData = {
      prospectId,
      repId,
      appointmentTime: new Date(appointmentTime),
      appointmentType,
      notes,
      status: 'Scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const appointmentRef = await db.collection('appointments').add(appointmentData);

    // Update prospect
    await db.collection('prospects').doc(prospectId).update({
      status: 'Demo Scheduled',
      nextFollowUpAt: new Date(appointmentTime),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log activity
    await logActivity(prospectId, repId, 'appointment_scheduled', {
      appointmentId: appointmentRef.id,
      appointmentTime,
      appointmentType,
    });

    return { success: true, appointmentId: appointmentRef.id };
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    throw new functions.https.HttpsError('internal', 'Failed to schedule appointment');
  }
});

// ===== CUSTOMER & DEVICE MANAGEMENT =====

/**
 * Convert prospect to customer
 */
exports.convertToCustomer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { prospectId, deviceSerialNumber, billingAddress, shippingAddress } = data;

  try {
    // Get prospect data
    const prospectDoc = await db.collection('prospects').doc(prospectId).get();
    const prospect = prospectDoc.data();

    if (!prospect) {
      throw new functions.https.HttpsError('not-found', 'Prospect not found');
    }

    // Create Firebase Auth user for customer
    const customerUser = await admin.auth().createUser({
      email: prospect.email,
      displayName: `${prospect.firstName} ${prospect.lastName}`,
    });

    // Set customer role
    await admin.auth().setCustomUserClaims(customerUser.uid, { role: 'Customer' });

    // Create customer document
    const customerData = {
      userId: customerUser.uid,
      prospectId,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      email: prospect.email,
      phone: prospect.phone,
      organization: prospect.organization,
      billingAddress,
      shippingAddress,
      stripeCustomerId: null, // Will be set when first payment is made
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const customerRef = await db.collection('customers').add(customerData);

    // Create device document
    await db.collection('devices').add({
      customerId: customerRef.id,
      deviceSerialNumber,
      creditsRemaining: 0, // Customer needs to purchase credits
      totalCreditsUsed: 0,
      lastUsedAt: null,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update prospect status
    await db.collection('prospects').doc(prospectId).update({
      status: 'Converted',
      convertedAt: admin.firestore.FieldValue.serverTimestamp(),
      customerId: customerRef.id,
    });

    // Update sales rep performance
    if (prospect.assignedRepId) {
      await db.collection('salesReps').doc(prospect.assignedRepId).update({
        'performance.convertedCustomers': admin.firestore.FieldValue.increment(1),
      });
    }

    return { success: true, customerId: customerRef.id, userId: customerUser.uid };
  } catch (error) {
    console.error('Error converting to customer:', error);
    throw new functions.https.HttpsError('internal', 'Failed to convert to customer');
  }
});

// ===== PAYMENT PROCESSING =====

/**
 * Purchase treatment credits
 */
exports.purchaseCredits = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'Customer') {
    throw new functions.https.HttpsError('permission-denied', 'Only customers can purchase credits');
  }

  if (!stripe) {
    throw new functions.https.HttpsError('unavailable', 'Payment processing is not configured');
  }

  const { packageId, paymentMethodId } = data;
  const userId = context.auth.uid;

  try {
    // Get customer data
    const customerSnapshot = await db.collection('customers')
      .where('userId', '==', userId)
      .get();

    if (customerSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'Customer not found');
    }

    const customerDoc = customerSnapshot.docs[0];
    const customer = customerDoc.data();

    // Credit packages - updated for Cellionyx
    const packages = {
      starter: { credits: 50, price: 9900, name: 'Starter Package' },
      standard: { credits: 100, price: 17900, name: 'Standard Package' },
      professional: { credits: 200, price: 32900, name: 'Professional Package' },
      enterprise: { credits: 500, price: 74900, name: 'Enterprise Package' },
    };

    const selectedPackage = packages[packageId];
    if (!selectedPackage) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid package selected');
    }

    // Create or get Stripe customer
    let stripeCustomerId = customer.stripeCustomerId;
    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: `${customer.firstName} ${customer.lastName}`,
        metadata: { customerId: customerDoc.id },
      });
      stripeCustomerId = stripeCustomer.id;

      // Update customer with Stripe ID
      await customerDoc.ref.update({ stripeCustomerId });
    }

    // Process payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: selectedPackage.price,
      currency: 'usd',
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: true,
      description: `Cellionyx Therapy Credits - ${selectedPackage.name}`,
      metadata: {
        customerId: customerDoc.id,
        packageId,
        credits: selectedPackage.credits.toString(),
      },
    });

    if (paymentIntent.status === 'succeeded') {
      // Add credits to customer's device
      const deviceSnapshot = await db.collection('devices')
        .where('customerId', '==', customerDoc.id)
        .get();

      if (!deviceSnapshot.empty) {
        const deviceDoc = deviceSnapshot.docs[0];
        await deviceDoc.ref.update({
          creditsRemaining: admin.firestore.FieldValue.increment(selectedPackage.credits),
        });
      }

      // Record purchase
      await db.collection('purchases').add({
        customerId: customerDoc.id,
        packageId,
        packageName: selectedPackage.name,
        credits: selectedPackage.credits,
        amount: selectedPackage.price,
        stripePaymentId: paymentIntent.id,
        status: 'completed',
        purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, credits: selectedPackage.credits };
    } else {
      throw new functions.https.HttpsError('payment-failed', 'Payment was not successful');
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    if (error.type === 'StripeCardError') {
      throw new functions.https.HttpsError('payment-failed', error.message);
    }
    throw new functions.https.HttpsError('internal', 'Failed to process payment');
  }
});

// ===== DEVICE MANAGEMENT =====

/**
 * Use treatment credits from device
 */
exports.useCredits = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'Customer') {
    throw new functions.https.HttpsError('permission-denied', 'Only customers can use credits');
  }

  const { creditsToUse, treatmentType, treatmentDuration } = data;
  const userId = context.auth.uid;

  try {
    // Get customer and device
    const customerSnapshot = await db.collection('customers')
      .where('userId', '==', userId)
      .get();

    if (customerSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'Customer not found');
    }

    const customerDoc = customerSnapshot.docs[0];
    const deviceSnapshot = await db.collection('devices')
      .where('customerId', '==', customerDoc.id)
      .get();

    if (deviceSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'Device not found');
    }

    const deviceDoc = deviceSnapshot.docs[0];
    const device = deviceDoc.data();

    // Check if enough credits available
    if (device.creditsRemaining < creditsToUse) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient credits');
    }

    // Deduct credits
    await deviceDoc.ref.update({
      creditsRemaining: admin.firestore.FieldValue.increment(-creditsToUse),
      totalCreditsUsed: admin.firestore.FieldValue.increment(creditsToUse),
      lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log usage
    await db.collection('treatmentLogs').add({
      customerId: customerDoc.id,
      deviceId: deviceDoc.id,
      creditsUsed: creditsToUse,
      treatmentType,
      treatmentDuration,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { 
      success: true, 
      remainingCredits: device.creditsRemaining - creditsToUse 
    };
  } catch (error) {
    console.error('Error using credits:', error);
    throw new functions.https.HttpsError('internal', 'Failed to use credits');
  }
});

// ===== NOTIFICATIONS =====

/**
 * Send notification to sales rep about new prospect
 */
async function sendNewProspectNotification(repId, prospectId) {
  // This would integrate with email/SMS service
  // For now, we'll create a notification document
  await db.collection('notifications').add({
    userId: repId,
    type: 'new_prospect',
    title: 'New Prospect Assigned',
    message: 'A new prospect has been assigned to you.',
    prospectId,
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ===== API ENDPOINTS =====

/**
 * RESTful API for external integrations
 */

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.get('origin') || 'unknown origin'}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ===== PUBLIC FORM SUBMISSION ENDPOINTS =====

// Handle demo request and waitlist form submissions
app.post('/public/submit-form', async (req, res) => {
  console.log('Form submission received:', {
    origin: req.get('origin'),
    contentType: req.get('content-type'),
    bodyKeys: Object.keys(req.body || {})
  });
  
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      country,
      state,
      city,
      userType,
      organization,
      areaOfInterest,
      intendedUse,
      functionRole, // backwards compatibility
      discipline, // backwards compatibility
      ctaType = 'demo',
      page = 'unknown',
      consent = false
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      console.log('Missing required fields:', { firstName, lastName, email });
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'First name, last name, and email are required' 
      });
    }

    console.log('Processing form for:', email);

    // Check if prospect already exists
    const existingProspect = await db.collection('prospects')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    let prospectId;
    let isNewProspect = true;
    
    if (!existingProspect.empty) {
      // Update existing prospect
      prospectId = existingProspect.docs[0].id;
      isNewProspect = false;
      console.log('Updating existing prospect:', prospectId);
      
      await db.collection('prospects').doc(prospectId).update({
        lastContactDate: admin.firestore.FieldValue.serverTimestamp(),
        formSubmissions: admin.firestore.FieldValue.arrayUnion({
          type: ctaType,
          page: page,
          submittedAt: new Date().toISOString()
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Create new prospect
      const prospectRef = await db.collection('prospects').add({
        // Basic Info
        firstName,
        lastName,
        email,
        phone: phone || null,
        organization: organization || null,
        
        // Location
        country: country || null,
        state: state || null,
        city: city || null,
        
        // Role & Discipline
        userType: userType || null,
        functionRole: functionRole || userType || null, // backwards compatibility
        discipline: discipline || areaOfInterest || null, // backwards compatibility
        areaOfInterest: areaOfInterest || null,
        intendedUse: intendedUse || null,
        
        // Additional Info
        
        // Lead Info
        leadSource: ctaType === 'waitlist' ? 'Waitlist' : 'Demo Request',
        
        // Tracking
        formSubmissions: [{
          type: ctaType,
          page: page,
          submittedAt: new Date().toISOString()
        }],
        
        // Consent & Compliance
        marketingConsent: consent,
        
        // Metadata
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastContactDate: admin.firestore.FieldValue.serverTimestamp(),
        
        // Assignment (to be handled by admin)
        assignedRepId: null,
        assignedRepName: null,
        
        // Status (single set of status fields)
        status: 'Active',
        leadStatus: 'New',
        stage: 'Lead',
        priority: ctaType === 'demo' ? 'High' : 'Medium',
        
        // Notes
        notes: []
      });
      
      prospectId = prospectRef.id;
      console.log('✅ New prospect created with ID:', prospectId);
    }

    // Send email notification to sales team (if configured)
    if (sendGridKey && sgMail) {
      const emailSubject = ctaType === 'demo' 
        ? `🔥 New Demo Request: ${firstName} ${lastName} from ${organization || 'Unknown Organization'}`
        : `📋 New Waitlist Signup: ${firstName} ${lastName}`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #00C9FF 0%, #0066CC 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">${ctaType === 'demo' ? 'New Demo Request' : 'New Waitlist Signup'}</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; border-top: none;">
            <h2 style="color: #333; margin-top: 0;">Contact Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Name:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${firstName} ${lastName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Email:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Phone:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${phone}</td>
              </tr>
              ` : ''}
              ${organization ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Organization:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${organization}</td>
              </tr>
              ` : ''}
              ${functionRole ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Function:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${functionRole}</td>
              </tr>
              ` : ''}
              ${discipline ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Discipline:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${discipline}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Source Page:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${page}</td>
              </tr>
              <tr>
                <td style="padding: 10px;"><strong>Status:</strong></td>
                <td style="padding: 10px;"><span style="background: ${isNewProspect ? '#28a745' : '#ffc107'}; color: white; padding: 4px 8px; border-radius: 4px;">${isNewProspect ? 'NEW PROSPECT' : 'RETURNING PROSPECT'}</span></td>
              </tr>
            </table>
            
            <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 8px;">
              <h3 style="color: #0066CC; margin-top: 0;">Next Steps</h3>
              <ol style="color: #666;">
                <li>Log into the CRM at <a href="https://cellionyx-crm.web.app/login.html">https://cellionyx-crm.web.app</a></li>
                <li>Navigate to the Prospects tab</li>
                <li>Find and assign this prospect to a sales representative</li>
                <li>Schedule a follow-up within 24 hours</li>
              </ol>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #999;">
              <small>This is an automated notification from the Cellionyx CRM System</small>
            </div>
          </div>
        </div>
      `;
      
      try {
        await sgMail.send({
          to: 'sales@cellionyx.com',
          from: 'noreply@cellionyx.com', // You'll need to verify this sender in SendGrid
          subject: emailSubject,
          html: emailHtml
        });
        console.log('✅ Email notification sent to sales@cellionyx.com');
      } catch (emailError) {
        console.error('⚠️ Email send failed:', emailError);
        // Don't fail the request if email fails - prospect is already saved
      }
    } else {
      console.log('⚠️ SendGrid not configured - skipping email notification');
    }

    // Return success response
    res.json({
      success: true,
      message: isNewProspect ? 'Thank you! We\'ll be in touch shortly.' : 'Welcome back! We\'ve updated your information.',
      prospectId: prospectId
    });

  } catch (error) {
    console.error('❌ Form submission error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to process form submission',
      details: error.message 
    });
  }
});

// Handle career application form submissions
app.post('/public/submit-career', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      introduction,
      interest,
      position,
      resumeUrl = null
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !introduction || !interest || !position) {
      return res.status(400).json({ 
        error: 'Missing required fields'
      });
    }

    // Create career application in Firestore
    const applicationRef = await db.collection('career_applications').add({
      firstName,
      lastName,
      email,
      phone: phone || null,
      introduction,
      interest,
      position,
      resumeUrl,
      status: 'New',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null
    });

    // Send email notification to HR (if configured)
    if (sendGridKey && sgMail) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #00C9FF 0%, #0066CC 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">New Career Application</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; border-top: none;">
            <h2 style="color: #333; margin-top: 0;">Applicant Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Name:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${firstName} ${lastName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Email:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Position:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${position}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px;">
              <h3 style="color: #0066CC; margin-top: 0;">Introduction</h3>
              <p style="color: #666;">${introduction}</p>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px;">
              <h3 style="color: #0066CC; margin-top: 0;">Interest in Cellionyx</h3>
              <p style="color: #666;">${interest}</p>
            </div>
          </div>
        </div>
      `;
      
      try {
        await sgMail.send({
          to: 'jobs@cellionyx.com',
          cc: 'sales@cellionyx.com',
          from: 'noreply@cellionyx.com',
          subject: `📋 New Career Application: ${firstName} ${lastName} - ${position}`,
          html: emailHtml
        });
      } catch (emailError) {
        console.error('⚠️ Email send failed:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Thank you for your interest in Cellionyx! We\'ll review your application and get back to you soon.',
      applicationId: applicationRef.id
    });

  } catch (error) {
    console.error('❌ Career form submission error:', error);
    res.status(500).json({ 
      error: 'Failed to process application',
      details: error.message 
    });
  }
});

// ===== AUTHENTICATION ENDPOINTS =====

// Authentication endpoints
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'Customer' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Set custom claims for role-based access
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      role,
      firstName,
      lastName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
      isActive: true,
    });

    console.log(`✅ User created: ${email} with role: ${role}`);
    
    res.status(201).json({ 
      message: 'User created successfully', 
      uid: userRecord.uid,
      email: userRecord.email,
      role 
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create user: ' + error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password, idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token required' });
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Get user document from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Update last login
    await userDoc.ref.update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      message: 'Login successful',
      user: {
        uid: decodedToken.uid,
        email: userData.email,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ===== SALES REP ENDPOINTS =====

// Middleware to verify authenticated user (sales rep or admin)
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Get user from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    req.user = { uid: decodedToken.uid, ...userData };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get prospects for sales rep
app.get('/reps/my-prospects', requireAuth, async (req, res) => {
  try {
    const { status, priority, limit = 50 } = req.query;
    
    // Query prospects based on user role
    let query = db.collection('prospects');
    
    // Admin sees all prospects, sales reps see only their assigned prospects
    if (req.user.role !== 'Admin') {
      query = query.where('assignedRepId', '==', req.user.uid);
    }
    
    console.log(`User ${req.user.email} (${req.user.role}) requesting prospects`);
    
    if (status) {
      query = query.where('leadStatus', '==', status);
    }
    
    if (priority) {
      query = query.where('priority', '==', priority);
    }
    
    // Remove limit temporarily to see ALL prospects
    // const queryLimit = 100; // parseInt(limit);
    // query = query.limit(queryLimit);
    
    console.log('Query: No limit applied, fetching all prospects');
    
    const snapshot = await query.get();
    const prospects = [];
    
    console.log(`Found ${snapshot.size} prospects for user ${req.user.email}`);
    
    // Debug: Also get ALL prospects without any filters
    const allProspectsSnapshot = await db.collection('prospects').limit(20).get();
    console.log(`Total prospects in database: ${allProspectsSnapshot.size}`);
    const allEmails = [];
    allProspectsSnapshot.forEach(doc => {
      allEmails.push(doc.data().email);
    });
    console.log('All prospect emails:', allEmails);
    
    // Log all prospect IDs for debugging
    const prospectIds = [];
    snapshot.forEach(doc => {
      prospectIds.push(doc.id);
      const data = doc.data();
      prospects.push({
        prospect_id: doc.id,
        first_name: data.firstName || '',
        last_name: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        organization: data.organization || '',
        status: data.leadStatus || 'New',
        priority: data.priority || 'Medium',
        created_at: data.createdAt?.toDate?.() || new Date(),
        assigned_rep: data.assignedRepName || null,
        function_role: data.functionRole || '',
        discipline: data.discipline || '',
        notes: data.notes || []
      });
    });
    
    console.log('Returning prospect IDs:', prospectIds);
    
    res.json(prospects);
  } catch (error) {
    console.error('Error fetching prospects:', error);
    res.status(500).json({ error: 'Failed to fetch prospects' });
  }
});

// Log activity for a prospect
app.post('/reps/log-activity', requireAuth, async (req, res) => {
  try {
    const { prospectId, activityType, notes } = req.body;
    
    // Verify the rep has access to this prospect
    const prospectDoc = await db.collection('prospects').doc(prospectId).get();
    if (!prospectDoc.exists) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    const prospect = prospectDoc.data();
    if (req.user.role !== 'Admin' && prospect.assignedRepId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Add activity log
    const activity = {
      prospectId,
      repId: req.user.uid,
      repName: `${req.user.firstName} ${req.user.lastName}`,
      type: activityType,
      notes,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('activities').add(activity);
    
    // Update prospect's last contact date
    await db.collection('prospects').doc(prospectId).update({
      lastContactDate: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true, message: 'Activity logged successfully' });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// Get appointments for sales rep
app.get('/reps/my-appointments', requireAuth, async (req, res) => {
  try {
    let query = db.collection('appointments');
    
    // Admin sees all appointments, sales reps see only their appointments
    if (req.user.role !== 'Admin') {
      query = query.where('repId', '==', req.user.uid);
    }
    
    query = query.orderBy('appointmentDate', 'asc');
    
    const snapshot = await query.get();
    const appointments = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      appointments.push({
        appointment_id: doc.id,
        prospect_name: data.prospectName || '',
        appointment_date: data.appointmentDate?.toDate?.() || new Date(),
        appointment_type: data.appointmentType || '',
        status: data.status || 'Scheduled',
        notes: data.notes || ''
      });
    });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Schedule an appointment
app.post('/reps/schedule-appointment', requireAuth, async (req, res) => {
  try {
    const { prospectId, appointmentDate, appointmentType, notes } = req.body;
    
    // Get prospect details
    const prospectDoc = await db.collection('prospects').doc(prospectId).get();
    if (!prospectDoc.exists) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    const prospect = prospectDoc.data();
    
    // Create appointment
    const appointment = {
      prospectId,
      prospectName: `${prospect.firstName} ${prospect.lastName}`,
      repId: req.user.uid,
      repName: `${req.user.firstName} ${req.user.lastName}`,
      appointmentDate: admin.firestore.Timestamp.fromDate(new Date(appointmentDate)),
      appointmentType,
      notes: notes || '',
      status: 'Scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const appointmentRef = await db.collection('appointments').add(appointment);
    
    res.json({ 
      success: true, 
      appointmentId: appointmentRef.id,
      message: 'Appointment scheduled successfully' 
    });
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    res.status(500).json({ error: 'Failed to schedule appointment' });
  }
});

// ===== ADMIN ENDPOINTS =====

// Middleware to verify admin role
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Get user from Firestore to check role
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    if (userData.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = { uid: decodedToken.uid, ...userData };
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all users (Admin only)
app.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user status (Admin only)
app.patch('/admin/users/:userId/status', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    await db.collection('users').doc(userId).update({
      isActive,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true, message: 'User status updated' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get platform analytics (Admin only)
app.get('/admin/analytics', requireAdmin, async (req, res) => {
  try {
    // Get all prospects
    const prospectsSnapshot = await db.collection('prospects').get();
    const totalProspects = prospectsSnapshot.size;
    
    // Get all customers
    const customersSnapshot = await db.collection('users').where('role', '==', 'Customer').get();
    const totalCustomers = customersSnapshot.size;
    
    // Calculate conversion rate
    const conversionRate = totalProspects > 0 ? ((totalCustomers / totalProspects) * 100).toFixed(2) : 0;
    
    // Get sales team performance
    const salesRepsSnapshot = await db.collection('users').where('role', '==', 'Sales Rep').get();
    const teamPerformance = [];
    
    for (const repDoc of salesRepsSnapshot.docs) {
      const repData = repDoc.data();
      const repId = repDoc.id;
      
      // Get prospects assigned to this rep
      const repProspects = await db.collection('prospects').where('assignedRepId', '==', repId).get();
      
      // Get appointments for this rep
      const repAppointments = await db.collection('appointments').where('repId', '==', repId).get();
      
      // Count conversions (prospects that became customers)
      const conversions = await db.collection('prospects')
        .where('assignedRepId', '==', repId)
        .where('status', '==', 'Converted')
        .get();
      
      teamPerformance.push({
        name: `${repData.firstName} ${repData.lastName}`,
        prospects: repProspects.size,
        appointments: repAppointments.size,
        conversions: conversions.size,
        revenue: conversions.size * 50000 // Placeholder revenue calculation
      });
    }
    
    // Calculate totals
    const totalRevenue = teamPerformance.reduce((sum, rep) => sum + rep.revenue, 0);
    const avgDealSize = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    
    res.json({
      totalProspects,
      totalCustomers,
      conversionRate,
      totalRevenue,
      avgDealSize,
      teamPerformance
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Create new user (Admin only)
app.post('/admin/users', requireAdmin, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    
    // Create Firestore document
    await db.collection('users').doc(userRecord.uid).set({
      email,
      role,
      firstName,
      lastName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: userRecord.uid
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the API
exports.api = functions.https.onRequest(app);

// ===== SCHEDULED FUNCTIONS =====

// Temporarily disabled for deployment - will re-enable after fixing compatibility
/* 
exports.dailyMaintenance = functions.pubsub.schedule('0 2 * * *').onRun(async (context) => {
    console.log('Running daily maintenance...');
    
    // Clean up old activities (older than 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const oldActivities = await db.collection('activities')
      .where('timestamp', '<', oneYearAgo)
      .get();
    
    const batch = db.batch();
    oldActivities.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Cleaned up ${oldActivities.size} old activities`);
    
    return null;
  });

exports.updatePerformanceMetrics = functions.pubsub.schedule('0 1 * * *').onRun(async (context) => {
    console.log('Updating performance metrics...');
    
    const salesReps = await db.collection('salesReps').get();
    
    for (const repDoc of salesReps.docs) {
      const repId = repDoc.id;
      
      // Count total prospects
      const prospectsSnapshot = await db.collection('prospects')
        .where('assignedRepId', '==', repId)
        .get();
      
      // Count converted customers
      const convertedSnapshot = await db.collection('prospects')
        .where('assignedRepId', '==', repId)
        .where('status', '==', 'Converted')
        .get();
      
      const totalProspects = prospectsSnapshot.size;
      const convertedCustomers = convertedSnapshot.size;
      const conversionRate = totalProspects > 0 ? (convertedCustomers / totalProspects) * 100 : 0;
      
      await repDoc.ref.update({
        'performance.totalProspects': totalProspects,
        'performance.convertedCustomers': convertedCustomers,
        'performance.conversionRate': conversionRate,
        'performance.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    console.log(`Updated performance metrics for ${salesReps.size} sales reps`);
    return null;
  });
*/
// Force deployment Thu, Aug 14, 2025  1:40:00 PM

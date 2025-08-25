// Firebase Admin SDK Setup for Creating Admin User
// Run this script with Node.js to create the admin user

const admin = require('firebase-admin');

// Your Firebase Admin SDK config (get from Firebase Console > Project Settings > Service Accounts)
const serviceAccount = {
  // Download the service account key from Firebase Console
  // and paste the contents here or use require('./path-to-service-account-key.json')
};

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'store-management-system-a45d1'
});

async function createAdminUser() {
  try {
    // Create admin user
    const userRecord = await admin.auth().createUser({
      email: 'admin@store.com',
      password: 'admin123', // Change this to a secure password
      displayName: 'System Administrator',
      emailVerified: true
    });
    
    // Set custom claims to mark as admin
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true,
      role: 'administrator'
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('UID:', userRecord.uid);
    console.log('Email:', userRecord.email);
    
    // Create admin document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: 'admin@store.com',
      displayName: 'System Administrator',
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isAdmin: true
    });
    
    console.log('✅ Admin document created in Firestore!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

// Run the function
createAdminUser().then(() => {
  console.log('Script completed');
  process.exit(0);
});

// To run this script:
// 1. npm init -y
// 2. npm install firebase-admin
// 3. Download service account key from Firebase Console
// 4. Update serviceAccount object above
// 5. node create-admin.js

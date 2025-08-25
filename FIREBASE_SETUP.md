# 🔥 Firebase Setup Guide for Store Management System

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `store-management-system`
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Click "Save"

## Step 3: Enable Firestore Database

1. Click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for now)
4. Select a location (choose closest to your users)
5. Click "Done"

## Step 4: Get Firebase Configuration

1. Click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>`
5. Enter app nickname: `store-management-web`
6. Check "Also set up Firebase Hosting" (optional)
7. Click "Register app"
8. Copy the Firebase config object

## Step 5: Update Security Rules (IMPORTANT!)

After authentication is working, update Firestore rules for security:

1. Go to **Firestore Database** → **Rules** tab
2. Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write only their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow subcollections under user documents  
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

3. Click **"Publish"**

These rules ensure:
- ✅ Only authenticated users can access data
- ✅ Users can only access their own data
- ✅ Complete privacy and security
- ✅ Support for subcollections if needed

## Step 6: Replace Config in auth.js

After getting your config from Firebase Console, replace the config object in `auth.js` with your actual values.

## 🚀 Features Implemented

- ✅ User Registration
- ✅ User Login
- ✅ Password Reset
- ✅ Email Verification
- ✅ Secure User Sessions
- ✅ User-specific Data Storage
- ✅ Logout Functionality
- ✅ Profile Management

## 🔒 Security Features

- All user data is private and isolated
- Secure authentication with Firebase
- Real-time data synchronization
- Automatic session management
- Password reset via email
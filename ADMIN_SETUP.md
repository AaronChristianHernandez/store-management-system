# 🔑 Firebase Admin User Setup Guide

## Quick Setup Options

### Option 1: Create Admin User via Firebase Console (Recommended)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `store-management-system-a45d1`
3. **Navigate**: Authentication → Users
4. **Add User**:
   - Email: `admin@store.com`
   - Password: `admin123` (change in production!)
   - Click "Add user"

### Option 2: Use Existing User (For Testing)

If you already have a user account:

1. **Check existing users**: Firebase Console → Authentication → Users
2. **Copy any existing email** 
3. **Update admin-dashboard.js**:
   ```javascript
   const ADMIN_EMAIL = 'your-existing-email@example.com';
   const ADMIN_PASSWORD = 'your-existing-password';
   ```

### Option 3: Register Admin Through Main App

1. **Go to your main app**: https://aaronchristianhernandez.github.io/store-management-system/
2. **Register new account**:
   - Email: `admin@store.com`
   - Password: `admin123`
   - Name: `System Administrator`
3. **Use these credentials** in the admin dashboard

## Firebase Security Rules Update

After creating the admin user, update your Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin access
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.email == 'admin@store.com';
    }
    
    // Regular user access
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || 
         request.auth.token.email == 'admin@store.com');
    }
  }
}
```

## Testing the Admin Dashboard

1. **Access**: https://aaronchristianhernandez.github.io/store-management-system/admin-dashboard.html
2. **Login**: Use the admin credentials you created
3. **Check Console**: Open browser DevTools (F12) to see any error messages

## Troubleshooting

### "Invalid admin credentials" error:
- Verify the admin user exists in Firebase Authentication
- Check that email/password match exactly
- Ensure Firebase project is correct

### Dashboard shows no data:
- Check Firebase Security Rules allow admin access
- Verify there are users in your system (register some test accounts)
- Check browser console for JavaScript errors

### Demo Mode:
- If Firebase authentication fails, the dashboard falls back to demo mode
- Demo mode shows sample data for testing the interface
- Look for "demo mode" message after login

## Production Security

For production deployment:

1. **Change default password**: Use a strong, unique password
2. **Enable 2FA**: Set up two-factor authentication
3. **Use custom claims**: Implement proper role-based access
4. **Environment variables**: Store credentials securely
5. **Audit logging**: Track all admin actions

## Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Verify your Firebase project settings
3. Test with a simple user account first
4. Review the Firebase Authentication documentation

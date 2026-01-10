# Firestore Security Rules Setup

## Quick Fix for "Missing or insufficient permissions" Error

If you're getting permission errors, you need to update your Firestore security rules.

## Steps to Fix:

1. **Open Firebase Console**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `clearviewcounselling-a3ac5`

2. **Navigate to Firestore Rules**:
   - Click on **"Firestore Database"** in the left sidebar
   - Click on the **"Rules"** tab

3. **Copy and Paste the Rules**:
   - Open the `firestore.rules` file in your project root
   - Copy all the contents
   - Paste into the Firestore Rules editor in Firebase Console

4. **Publish the Rules**:
   - Click **"Publish"** button
   - Wait a few seconds for rules to propagate

5. **Test**:
   - Try signing in again
   - The permission errors should be resolved

## What These Rules Allow:

### Users Collection:
- ✅ Users can **read** their own document (needed for admin check)
- ✅ Users can **create** their own document when signing in for the first time
- ✅ Users can **update** their own document (but cannot change role to admin)
- ✅ Admins can **read** all user documents
- ✅ Admins can **update** any user document (to promote to admin)

### Clients Collection:
- ✅ Users can **read/write/create** their own client document
- ✅ Admins can **read** all client documents
- ✅ Only admins can **delete** client documents

## Important Notes:

- Rules take a few seconds to propagate after publishing
- If you still get errors after updating rules, wait 10-15 seconds and try again
- Make sure you're signed in with a user that exists in Authentication
- The rules allow users to create their own Firestore document on first sign-in

## Troubleshooting:

**Still getting permission errors?**
1. Make sure you clicked "Publish" after pasting the rules
2. Wait 10-15 seconds for rules to propagate
3. Clear your browser cache and try again
4. Check that the user exists in Firebase Authentication
5. Verify the rules were saved correctly in Firebase Console


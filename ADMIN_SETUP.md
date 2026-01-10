# How to Create an Admin Account

## Understanding Firebase Structure

Firebase has **two separate sections**:

1. **Authentication** - Handles user sign-up, sign-in, passwords, etc.
   - When users sign up, they appear in: Firebase Console → Authentication → Users
   - This section shows email, UID, and authentication status
   - **You cannot store custom fields (like "role") here**
   - **Note:** Users can be created directly in Firebase Console → Authentication, but they won't automatically have a Firestore document until they sign in

2. **Firestore Database** - Stores your application data
   - User metadata (including `role`) is stored in the `users` collection
   - This is where you set the admin role
   - **Auto-creation:** If a user exists in Authentication but not in Firestore, a document will be automatically created when they sign in (with default `role: "user"`)

## Method: Create Your First Admin

### Step 1: Sign Up a User Account

1. Go to your app's signup page (`/signup`)
2. Fill in the form and create an account
3. Note the email address you used

### Step 2: View the User in Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `clearviewcounselling-a3ac5`
3. Click **"Authentication"** in the left sidebar
4. Click the **"Users"** tab
5. You should see your newly created user listed here with their email and UID
6. **Note the UID** (User ID) - you'll need this to find the user in Firestore

### Step 3: Set Admin Role in Firestore Database

1. Still in Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click on the **`users`** collection (if it doesn't exist, the user might not have completed signup yet)
3. Look for a document with the **same UID** you noted from the Authentication section
   - OR search by the email address if the document has an email field
4. Click on the document to open it
5. You should see fields like:
   - `email`: user's email address
   - `firstName`: first name
   - `lastName`: last name
   - `role`: currently set to `"user"`
   - `createdAt`: timestamp
6. **Edit the `role` field**:
   - Click on the `role` field
   - Change the value from `"user"` to `"admin"`
   - Click "Update" or press Enter

### Step 4: Verify Admin Access

1. In your app, **sign out** (if you're logged in)
2. **Sign back in** with the same email/password
3. You should now see:
   - "Admin" link in the navbar
   - Ability to access `/admin` route
   - Admin portal showing client data

## Alternative: Use the Admin Setup Tool

Once you have **at least one admin account**, you can use the built-in admin setup tool:

1. Sign in as an admin user
2. Go to `/admin-setup` in your app
3. Enter the email of a user you want to promote
4. Click "Promote to Admin"
5. That user needs to sign out and sign back in for changes to take effect

## Creating Users Directly in Firebase Authentication

If you create a user directly in **Firebase Console → Authentication → Add user**:

1. The user will exist in Authentication but **not** in Firestore initially
2. When that user **signs in** for the first time, the app will automatically create their Firestore document in the `users` collection
3. The document will be created with:
   - `email`: Their email address
   - `displayName`: From their Auth profile (if set)
   - `firstName` and `lastName`: Parsed from displayName
   - `role`: Defaults to `"user"`
   - `createdAt`: Timestamp
4. You can then edit the document in Firestore to change `role` to `"admin"`

**This is the recommended way to create your first admin:**
1. Create the user in Firebase Console → Authentication
2. Have them sign in (or you sign in as them) - this creates the Firestore document
3. Go to Firestore → `users` collection → find the user → change `role` to `"admin"`
4. Sign in again to activate admin privileges

## Troubleshooting

**Q: I don't see a `users` collection in Firestore**
- If the user was created directly in Authentication, they need to sign in first
- The `users` document is automatically created on first sign-in
- If the user signed up through the app, the document should exist immediately

**Q: I created a user in Authentication but they don't have a Firestore document yet**
- This is normal! The document is created automatically when they sign in for the first time
- After they sign in, check Firestore → `users` collection

**Q: I see the user in Authentication but not in Firestore**
- Wait a moment - there might be a slight delay
- Try signing in with that account in your app
- Check the browser console for any errors

**Q: How do I find a user by UID?**
- In Firestore, the document ID in the `users` collection IS the UID
- You can also search by the `email` field if it exists

**Q: Can I set admin in the Authentication section?**
- No, Firebase Authentication doesn't support custom fields
- You must use Firestore to store the `role` field

## Security Notes

- Only set trusted users as admin
- Admin users can view all client data in the admin portal
- You can remove admin access by changing `role` back to `"user"` in Firestore
- In production, consider adding additional security measures


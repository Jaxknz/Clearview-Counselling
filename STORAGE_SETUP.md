# Firebase Storage Setup

## Storage Rules Configuration

To enable profile photo uploads, you need to configure Firebase Storage rules.

### Steps:

1. **Go to Firebase Console**:
   - Navigate to [Firebase Console](https://console.firebase.google.com/)
   - Select your project

2. **Open Storage Rules**:
   - Click on **Storage** in the left sidebar
   - Click on the **Rules** tab

3. **Copy and Paste Storage Rules**:
   - Open the `storage.rules` file in your project root
   - Copy all the contents
   - Paste into the Storage Rules editor in Firebase Console

4. **Publish the Rules**:
   - Click **"Publish"** button
   - Wait a few seconds for rules to propagate

### What These Rules Allow:

- ✅ Users can upload their own profile photos (max 5MB, images only)
- ✅ Users can read their own profile photos
- ✅ Users can delete their own profile photos
- ✅ Admins can read any profile photos (for viewing client profiles)
- ✅ Admins can delete any profile photos (for moderation)

### Storage Structure:

Profile photos are stored in the following path:
```
profile-photos/{userId}/{timestamp}_{filename}
```

This ensures:
- Each user's photos are organized by their user ID
- Unique filenames prevent conflicts
- Easy cleanup if needed

### Security:

- Only authenticated users can upload photos
- Users can only upload to their own folder
- File type validation (images only)
- File size limit (5MB max)
- Photos are automatically deleted when a user removes their profile photo


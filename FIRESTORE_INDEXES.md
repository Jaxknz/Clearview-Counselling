# Firestore Indexes Setup

## Required Composite Indexes

If you get an error about missing indexes when viewing appointments, you'll need to create a composite index in Firebase Console.

### Appointments Index

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `clearviewcounselling-a3ac5`
3. Go to **Firestore Database** → **Indexes** tab
4. Click **"Create Index"**
5. Set up the index:
   - **Collection ID**: `appointments`
   - **Fields to index**:
     - `clientId`: Ascending
     - `date`: Ascending
   - **Query scope**: Collection
6. Click **"Create"**

**Note:** The app will work without this index (it will filter client-side), but it's more efficient with the index. Firebase may automatically prompt you to create the index if you encounter the error in the app.

## Alternative: Auto-create Index

If you get an error message in the browser console with a link to create the index, you can click that link and Firebase will automatically create it for you.


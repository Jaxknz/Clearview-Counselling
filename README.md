# Clearview Counselling Web App

A modern React TypeScript web application for Clearview Counselling, featuring sign-up, intake questionnaire, and payment processing.

## Features

- **Sign Up Section**: User registration with three plan options:
  - Free 15 min Discovery Call
  - Mentorship Program
  - Zoom Calls
- **Intake Questionnaire**: Multi-step questionnaire to gather client information
- **Payment Processing**: Integration with PayPal and Wise payment methods

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up PayPal Client ID:
   - Get your PayPal Client ID from the [PayPal Developer Dashboard](https://developer.paypal.com/)
   - Replace `YOUR_PAYPAL_CLIENT_ID` in `src/pages/Payment.tsx` with your actual Client ID

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── pages/
│   ├── SignUp.tsx              # Sign up page with plan selection
│   ├── SignUp.css
│   ├── IntakeQuestionnaire.tsx # Multi-step intake form
│   ├── IntakeQuestionnaire.css
│   ├── Payment.tsx             # Payment page with PayPal/Wise
│   └── Payment.css
├── App.tsx                     # Main app component with routing
├── App.css
├── main.tsx                    # Entry point
└── index.css                   # Global styles
```

## Payment Integration

### PayPal
- Uses `@paypal/react-paypal-js` for PayPal integration
- Requires a PayPal Client ID (sandbox or production)
- Currently configured for USD currency

### Wise
- Form-based integration for bank transfer details
- In production, you'll need to integrate with Wise API or redirect to Wise payment page
- Currently collects bank account information for processing

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Netlify Deployment

This app is configured for Netlify deployment. To deploy:

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Connect to Netlify**:
   - Go to [Netlify](https://www.netlify.com/)
   - Click "New site from Git"
   - Connect your repository

3. **Configure Build Settings** (should auto-detect from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Set Environment Variables**:
   - Go to Site settings → Environment variables
   - Add `VITE_PAYPAL_CLIENT_ID` with your PayPal Client ID
   - Add any other environment variables you need

5. **Deploy**: Netlify will automatically build and deploy your site

The `netlify.toml` file is already configured with:
- Build command and publish directory
- SPA redirect rules for React Router
- Node.js version (18)

## Firebase Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication with Email/Password provider
   - Create a Firestore database

2. **Get Firebase Configuration**:
   - Go to Project Settings → General
   - Scroll down to "Your apps" and click the web icon (</>)
   - Copy your Firebase configuration

3. **Set Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Set Up Firestore Rules**:
   
   **Option 1: Copy from file (recommended)**
   - A `firestore.rules` file has been created in your project root
   - Copy the contents of `firestore.rules` file
   - In Firebase Console → Firestore Database → Rules tab
   - Paste the rules and click "Publish"
   
   See `FIRESTORE_SETUP.md` for detailed instructions.

5. **Set Up Firebase Storage** (for profile photos):
   
   **Enable Storage**:
   - In Firebase Console, click on **Storage** in the left sidebar
   - Click **"Get started"** if Storage is not yet enabled
   - Choose "Start in production mode" (rules will be configured next)
   
   **Configure Storage Rules**:
   - A `storage.rules` file has been created in your project root
   - Copy the contents of `storage.rules` file
   - In Firebase Console → Storage → Rules tab
   - Paste the rules and click "Publish"
   
   See `STORAGE_SETUP.md` for detailed instructions.
   
   **Option 2: Manual setup**
   In Firebase Console → Firestore Database → Rules, use:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Helper function to check if user is authenticated
       function isAuthenticated() {
         return request.auth != null;
       }
       
       // Helper function to check if user is admin
       function isAdmin() {
         return isAuthenticated() && 
                exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }
       
       // Users collection - users can read and create their own document
       match /users/{userId} {
         // Users can read their own document
         allow read: if isAuthenticated() && request.auth.uid == userId;
         
         // Users can create their own document (for first-time sign-in)
         allow create: if isAuthenticated() && 
                          request.auth.uid == userId &&
                          request.resource.data.role == 'user' &&
                          request.resource.data.email == request.auth.token.email;
         
         // Users can update their own document (but not change role to admin)
         allow update: if isAuthenticated() && 
                          request.auth.uid == userId &&
                          (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']) ||
                           request.resource.data.role == resource.data.role);
         
         // Admins can read all user documents
         allow read: if isAdmin();
         
         // Admins can update any user document
         allow update: if isAdmin();
       }
       
       // Clients collection - users can write their own, admins can read all
       match /clients/{clientId} {
         // Users can read and write their own client document
         allow read, create, update: if isAuthenticated() && 
                                        request.auth.uid == clientId;
         
         // Admins can read all client documents
         allow read: if isAdmin();
         
         // Users cannot delete (only admins can if needed)
         allow delete: if isAdmin();
       }
     }
   }
   ```
   
   **Important:** After updating rules, click "Publish" to apply them. Rules may take a few seconds to propagate.

5. **Create Admin User**:
   - Sign up a user through the app
   - In Firebase Console → Firestore Database
   - Find the user document in the `users` collection
   - Edit the document and set `role: "admin"`

## Environment Variables

For production, add these in Netlify's environment variables:
- `VITE_PAYPAL_CLIENT_ID`: Your PayPal Client ID
- `VITE_FIREBASE_API_KEY`: Your Firebase API Key
- `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase Auth Domain
- `VITE_FIREBASE_PROJECT_ID`: Your Firebase Project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase Storage Bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase Messaging Sender ID
- `VITE_FIREBASE_APP_ID`: Your Firebase App ID
- `VITE_WISE_API_KEY`: Your Wise API key (if using Wise API)

## Authentication

- **User Sign Up**: Users create accounts during signup with email/password
- **User Sign In**: Users can sign in with their email and password
- **Admin Portal**: Only users with `role: "admin"` in Firestore can access the admin portal
- **Protected Routes**: Intake questionnaire and payment pages require authentication

## Notes

- User authentication is handled by Firebase Authentication
- Client data is stored in Firestore database
- Admin users must have their `role` field set to `"admin"` in the Firestore `users` collection
- Payment processing should be handled securely through your backend
- The Wise integration currently collects bank details; implement proper API integration for production use

## License

Private - Clearview Counselling


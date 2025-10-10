# Firebase Social Media Authentication Setup

## Overview
This guide explains how to set up Firebase for social media authentication (Google and Apple) for students only.

## Prerequisites
1. Firebase project created
2. Google and Apple authentication providers enabled
3. Environment variables configured

## Frontend Environment Variables

Add these to your `.env.local` file:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Optional: Use Firebase emulator in development
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=false

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Backend Environment Variables

Add these to your backend `.env` file:

```bash
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
```

## Firebase Console Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: "TCF-TEF Platform"
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" provider
5. Enable "Apple" provider
6. Configure OAuth consent screen

### 3. Configure Google Provider
1. Click on "Google" provider
2. Enable the provider
3. Add your domain to authorized domains:
   - `localhost` (for development)
   - `your-domain.com` (for production)
4. Save configuration

### 4. Configure Apple Provider
1. Click on "Apple" provider
2. Enable the provider
3. You'll need:
   - Apple Developer Account
   - Service ID
   - Apple Team ID
   - Apple Key ID
   - Apple Private Key
4. Follow Apple's setup guide

### 5. Get Firebase Config
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web app
4. Register app with nickname
5. Copy the config object

### 6. Generate Service Account Key
1. Go to Project Settings → Service accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the values for backend environment variables

## Database Migration

Run the database migration to add social authentication fields:

```bash
cd /home/gotti/Desktop/backend
npx prisma db push
```

## Testing

### 1. Start the servers
```bash
# Frontend
cd /home/gotti/Desktop/frontend
npm run dev

# Backend
cd /home/gotti/Desktop/backend
npm run dev
```

### 2. Test social authentication
1. Go to `http://localhost:3000/connexion`
2. Click Google or Apple login button
3. Complete OAuth flow
4. Verify user is created with STUDENT role
5. Check JWT tokens are generated

## Security Notes

1. **Role Restriction**: Social auth is only available for STUDENT role
2. **Admin/Manager**: Must use traditional JWT authentication
3. **Token Exchange**: Firebase tokens are exchanged for JWT tokens
4. **Session Management**: Uses existing secure session management

## Troubleshooting

### Common Issues

1. **Firebase not initialized**
   - Check environment variables
   - Verify Firebase project configuration

2. **CORS errors**
   - Add your domain to Firebase authorized domains
   - Check backend CORS configuration

3. **Token verification failed**
   - Verify Firebase Admin SDK configuration
   - Check service account permissions

4. **User creation failed**
   - Check database connection
   - Verify Prisma schema migration

### Debug Mode

Enable debug logging:

```bash
# Frontend
NEXT_PUBLIC_DEBUG=true npm run dev

# Backend
DEBUG=* npm run dev
```

## Production Deployment

1. Update environment variables with production values
2. Configure production domains in Firebase
3. Set up proper CORS policies
4. Enable security rules
5. Monitor authentication logs

## Support

For issues with this implementation, check:
1. Firebase Console logs
2. Backend server logs
3. Browser console errors
4. Network tab for API calls

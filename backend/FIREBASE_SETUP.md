# Firebase Setup Guide for Render

## 🔥 Setting Up Firebase Credentials in Render

To enable Google authentication, you need to set Firebase credentials as environment variables in Render.

### Option 1: Individual Environment Variables (Recommended)

1. **Go to Firebase Console**:
   - Visit: https://console.firebase.google.com/
   - Select your project (or create a new one)
   - Go to **Project Settings** → **Service Accounts**
   - Click **Generate New Private Key**
   - Download the JSON file

2. **Extract Values from JSON**:
   Open the downloaded JSON file and extract:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

3. **Set in Render Dashboard**:
   - Go to your Render service → **Environment** tab
   - Add these environment variables:
     ```
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
     FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
     ```
   - **Important**: For `FIREBASE_PRIVATE_KEY`, keep the entire key including `\n` characters
   - Wrap the private key in quotes if it contains special characters

### Option 2: Base64 Encoded JSON (Alternative)

1. **Encode the JSON file**:
   ```bash
   # On your local machine
   base64 -i path/to/firebase-service-account.json
   ```

2. **Set in Render**:
   - Add environment variable:
     ```
     FIREBASE_SERVICE_ACCOUNT_JSON=<base64-encoded-json>
     ```

### Example: Setting Private Key Correctly

The private key should look like this in Render:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**Important Notes**:
- Keep the `\n` characters in the private key
- Wrap the entire value in double quotes
- The private key should be on a single line with `\n` characters

### Verification

After setting the environment variables:
1. **Redeploy** your service in Render
2. **Check logs** for:
   - ✅ `Firebase Admin SDK initialized with environment variables`
   - ❌ NOT: `Firebase credentials not found`

### Troubleshooting

**If you see "Firebase credentials not found"**:
1. Check that all 3 environment variables are set:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`

2. Verify the private key format:
   - Should start with `-----BEGIN PRIVATE KEY-----`
   - Should end with `-----END PRIVATE KEY-----`
   - Should contain `\n` characters (not actual newlines)

3. Check for extra spaces or quotes in Render dashboard

**If you see "Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON"**:
- Verify the base64 encoding is correct
- Make sure there are no extra spaces or line breaks

### Security Notes

- ✅ Never commit Firebase credentials to Git
- ✅ Use environment variables in production
- ✅ Keep your service account keys secure
- ✅ Rotate keys periodically


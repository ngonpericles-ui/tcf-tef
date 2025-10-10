# 🎥 AGORA.IO COMPLETE SETUP GUIDE

## 📋 **STEP 1: CREATE AGORA ACCOUNT & PROJECT**

### 1.1 Sign Up
1. Go to [console.agora.io](https://console.agora.io)
2. Sign up with your email
3. Verify your email address

### 1.2 Create Project
1. Click **"Create New Project"**
2. Enter project name: `TCF-TEF Learning Platform`
3. **IMPORTANT**: Select **"APP ID + APP Certificate + Token"** (not just APP ID)
4. Click **"Submit"**

## 🔑 **STEP 2: GET YOUR CREDENTIALS**

### 2.1 APP ID (Required)
- Go to your project dashboard
- Copy the **App ID**
- Format: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **Status**: Public (can be used in frontend)

### 2.2 APP CERTIFICATE (Required)
- Click the **pencil icon** next to your project name
- Copy the **"Primary Certificate"**
- Format: `z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4`
- **Status**: Private (backend only)

### 2.3 CUSTOMER ID & SECRET (For Cloud Recording)
- Go to **Project Management** → **Usage** → **Cloud Recording**
- Find your **Customer ID** and **Customer Secret**
- Customer ID Format: `12345678-1234-1234-1234-123456789012`
- Customer Secret Format: `abcdef1234567890abcdef1234567890`

## 🔧 **STEP 3: UPDATE YOUR .ENV FILE**

Replace these values in your `.env` file:

```env
# Agora Live Sessions Configuration
AGORA_APP_ID=YOUR_ACTUAL_APP_ID_HERE
AGORA_APP_CERTIFICATE=YOUR_ACTUAL_APP_CERTIFICATE_HERE
AGORA_CUSTOMER_ID=YOUR_ACTUAL_CUSTOMER_ID_HERE
AGORA_CUSTOMER_SECRET=YOUR_ACTUAL_CUSTOMER_SECRET_HERE
AGORA_TOKEN_EXPIRY=3600
AGORA_RECORDING_REGION=us-west-1
AGORA_RECORDING_BUCKET=tcf-tef-recordings
AGORA_RECORDING_ACCESS_KEY=your_aws_s3_access_key
AGORA_RECORDING_SECRET_KEY=your_aws_s3_secret_key
```

## 📦 **STEP 4: PACKAGES ALREADY INSTALLED**

✅ The following packages are already installed:
- `agora-token` - For token generation
- `axios` - For API calls

## 🚀 **STEP 5: AVAILABLE ENDPOINTS**

### Authentication & Configuration
- `GET /api/agora/config` - Get Agora config for frontend
- `GET /api/agora/health` - Health check

### Token Generation
- `POST /api/agora/rtc/token` - Generate video/audio token
- `POST /api/agora/rtm/token` - Generate messaging token

### Cloud Recording
- `POST /api/agora/recording/start` - Start recording
- `POST /api/agora/recording/stop` - Stop recording
- `GET /api/agora/recording/{resourceId}/{sid}/status` - Get recording status

## 🧪 **STEP 6: TEST YOUR SETUP**

### 6.1 Health Check
```bash
curl http://localhost:3001/api/agora/health
```

### 6.2 Get Configuration
```bash
curl http://localhost:3001/api/agora/config
```

### 6.3 Generate RTC Token (requires authentication)
```bash
curl -X POST http://localhost:3001/api/agora/rtc/token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channelName": "test-channel",
    "uid": "12345",
    "role": "publisher"
  }'
```

## 🎯 **STEP 7: FRONTEND INTEGRATION**

### 7.1 Install Frontend Package
```bash
npm install agora-rtc-sdk-ng
```

### 7.2 Basic Frontend Usage
```javascript
import AgoraRTC from 'agora-rtc-sdk-ng';

// Get config from backend
const config = await fetch('/api/agora/config').then(r => r.json());

// Create client
const client = AgoraRTC.createClient({ 
  mode: 'rtc', 
  codec: 'vp8' 
});

// Get token from backend
const tokenResponse = await fetch('/api/agora/rtc/token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    channelName: 'my-channel',
    uid: userId,
    role: 'publisher'
  })
});

const { token } = await tokenResponse.json();

// Join channel
await client.join(config.data.appId, 'my-channel', token, userId);
```

## 🔒 **STEP 8: SECURITY CONSIDERATIONS**

### 8.1 Token Security
- ✅ Tokens are generated server-side only
- ✅ App Certificate never exposed to frontend
- ✅ Tokens have expiration time (default 1 hour)
- ✅ Role-based access control implemented

### 8.2 Recording Security
- ✅ Only managers can start/stop recordings
- ✅ Recording requires authentication
- ✅ Secure cloud storage integration

## 💰 **STEP 9: PRICING INFORMATION**

### Agora Pricing (as of 2024)
- **Video Calling**: ~$0.99 per 1,000 minutes
- **Voice Calling**: ~$0.99 per 1,000 minutes  
- **Real-time Messaging**: ~$1.99 per 1,000 monthly active users
- **Cloud Recording**: ~$1.49 per 1,000 minutes

### Free Tier
- 10,000 minutes per month free
- Perfect for testing and small deployments

## 🛠️ **STEP 10: TROUBLESHOOTING**

### Common Issues

#### 1. "App ID not configured"
- Check your `.env` file
- Restart your server after updating `.env`

#### 2. "Token generation failed"
- Verify App Certificate is correct
- Check that App Certificate is enabled in Agora console

#### 3. "Recording failed"
- Verify Customer ID and Secret
- Check cloud storage configuration
- Ensure recording is enabled in Agora console

#### 4. "Channel join failed"
- Verify token is not expired
- Check channel name format (no special characters)
- Ensure UID is unique in the channel

## 📞 **STEP 11: SUPPORT**

### Agora Support
- Documentation: [docs.agora.io](https://docs.agora.io)
- Community: [agora.io/community](https://agora.io/community)
- Support: Available in Agora console

### Your Implementation
- Health check: `GET /api/agora/health`
- Configuration validation built-in
- Comprehensive error handling
- Detailed logging for debugging

---

## ✅ **SETUP CHECKLIST**

- [ ] Created Agora account
- [ ] Created project with App Certificate enabled
- [ ] Copied App ID to `.env`
- [ ] Copied App Certificate to `.env`
- [ ] Copied Customer ID to `.env` (for recording)
- [ ] Copied Customer Secret to `.env` (for recording)
- [ ] Tested health check endpoint
- [ ] Tested token generation
- [ ] Configured cloud storage (optional)
- [ ] Tested frontend integration

**Once you complete these steps, your live sessions system will be fully functional!** 🎉

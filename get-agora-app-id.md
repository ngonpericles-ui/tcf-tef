# 🎯 How to Get Your Agora App ID

## Quick Steps:

### 1. **Go to Agora Console**
- Open: https://console.agora.io/
- Click **"Sign Up"** (if you don't have an account)
- Or **"Sign In"** (if you already have an account)

### 2. **Create Account** (if new)
- Email: your-email@example.com
- Password: create a strong password
- Company: your company name
- **Verify your email** (check inbox)

### 3. **Create New Project**
- Click **"Create Project"** (big blue button)
- Project Name: **"Live Session Platform"**
- Use Case: Select **"Video Call"**
- Authentication: **"App ID"** (default)
- Click **"Submit"**

### 4. **Copy Your App ID**
- You'll see your **App ID** (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
- **Copy this App ID**

### 5. **Update Your Environment**
Replace `your-real-app-id-here` in `.env.local` with your actual App ID:

```bash
NEXT_PUBLIC_AGORA_APP_ID=your-actual-app-id-here
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 6. **Restart Frontend Server**
```bash
# Kill current server
pkill -f "next dev"

# Restart with new App ID
cd /home/gotti/Desktop/frontend
npm run dev
```

## 🧪 **Test Your Live Session**

1. **Open Browser**: http://localhost:3000
2. **Login**: Use your admin credentials
3. **Go to**: `/admin/live-sessions`
4. **Create Session**: 
   - Title: "Test Session"
   - Date: Tomorrow
   - Duration: 60 minutes
5. **Click "Rejoindre"** to join
6. **Expected Results**:
   - ✅ Camera should start automatically
   - ✅ Microphone should start automatically
   - ✅ No "invalid appid" error
   - ✅ Video preview should show your camera

## 🔧 **Troubleshooting**

### ❌ Still getting "invalid appid" error?
- Make sure you copied the App ID correctly
- Restart the frontend server after updating .env.local
- Check that .env.local has the correct App ID

### ❌ Camera/microphone not starting?
- Check browser permissions (allow camera/mic access)
- Make sure devices aren't being used by other apps
- Try refreshing the page

### ❌ Screen sharing not working?
- Check browser permissions for screen sharing
- Try different browsers (Chrome, Firefox, Edge)

## 🎉 **Success Indicators**
- ✅ No "invalid appid" error in console
- ✅ Camera preview shows your video
- ✅ Microphone icon is green (not muted)
- ✅ Screen sharing works
- ✅ Chat messages appear
- ✅ Whiteboard allows drawing

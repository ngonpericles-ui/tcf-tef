# 🎯 Agora Setup Guide

## Quick Steps to Get Your Agora App ID

### 1. Create Agora Account
1. Go to [https://console.agora.io/](https://console.agora.io/)
2. Sign up for a free account
3. Verify your email

### 2. Create a New Project
1. Click "Create Project"
2. Enter project name: "Live Session Platform"
3. Select "Video Call" as the use case
4. Click "Submit"

### 3. Get Your App ID
1. In your project dashboard, you'll see your **App ID**
2. Copy the App ID (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 4. Update Your Environment
1. Open `.env.local` in your project root
2. Replace `your-agora-app-id-here` with your real App ID:
   ```
   NEXT_PUBLIC_AGORA_APP_ID=your-real-app-id-here
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

### 5. Restart Your Frontend Server
```bash
# Kill the current frontend server
pkill -f "next dev"

# Restart with the new App ID
cd /home/gotti/Desktop/frontend
npm run dev
```

## 🧪 Testing Your Live Session

### Manual Testing Steps:
1. **Open Browser**: Go to `http://localhost:3000`
2. **Login**: Use your admin credentials
3. **Navigate**: Go to `/admin/live-sessions`
4. **Create Session**: 
   - Title: "Test Session"
   - Date: Tomorrow
   - Duration: 60 minutes
   - Max Participants: 50
5. **Join Session**: Click "Rejoindre"

### Expected Features to Test:
- ✅ **Camera Toggle**: Should show/hide your video
- ✅ **Microphone Toggle**: Should mute/unmute your audio
- ✅ **Screen Sharing**: Should capture and display your screen
- ✅ **Chat**: Should send/receive messages
- ✅ **Whiteboard**: Should allow drawing
- ✅ **Participants Panel**: Should show all participants
- ✅ **Recording**: Should start/stop recording
- ✅ **Raise Hand**: Should work for students

### Console Messages to Look For:
```
✅ "Initializing Agora RTC..."
✅ "Joining Agora channel: [sessionId]"
✅ "Agora client joined and published tracks successfully"
✅ "Remote user published: [userId] video/audio"
```

### Troubleshooting:

#### ❌ "invalid appid" Error:
- Make sure you've updated `.env.local` with your real App ID
- Restart the frontend server after updating the App ID

#### ❌ "window is not defined" Error:
- This is normal during server-side rendering
- Should work fine in the browser

#### ❌ "Requested device not found" Error:
- Check camera/microphone permissions in your browser
- Make sure devices aren't being used by other applications

#### ❌ Screen Sharing Not Working:
- Check browser permissions for screen sharing
- Try different browsers (Chrome, Firefox, Edge)

## 🎉 Success Indicators:
- Video preview shows your camera feed
- Microphone icon changes when toggled
- Screen sharing shows your screen
- Chat messages appear in the panel
- Whiteboard allows drawing
- Participants appear in the panel
- Recording button changes state
- Raise hand button works for students

## 📞 Need Help?
If you encounter any issues:
1. Check the browser console for error messages
2. Ensure both backend and frontend servers are running
3. Verify your Agora App ID is correct
4. Check browser permissions for camera, microphone, and screen sharing

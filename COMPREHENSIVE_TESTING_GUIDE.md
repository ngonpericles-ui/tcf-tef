# AURA.CA Comprehensive Testing Guide

## 🎯 Overview

This guide covers all testing procedures for the AURA.CA platform, including:
- Backend health checks
- Authentication and authorization
- Role-based access control
- Content upload and retrieval
- Test interface with media support
- End-to-end functionality

## 🚀 Quick Start

### 1. Start Backend
```bash
cd /home/gotti/Desktop/frontend/backend
./start-backend.sh
```

### 2. Start Frontend (in another terminal)
```bash
cd /home/gotti/Desktop/frontend
PORT=3000 npm run dev
```

### 3. Run Tests
```bash
cd /home/gotti/Desktop/frontend/backend
./e2e-test.sh
```

## 📋 Test Credentials

### Admin
- Email: `admin@aura.ca`
- Password: `Admin@123`
- Access: `/admin/*`

### Student
- Email: `student@aura.ca`
- Password: `Student@123`
- Access: `/home`, `/cours`, `/tests`, etc.

### Manager
- Email: `manager@aura.ca`
- Password: `Manager@123`
- Access: `/manager/*`

## ✅ Test Checklist

### 1. Backend Health
- [ ] Backend starts successfully
- [ ] Health check endpoint responds
- [ ] Database connection works
- [ ] All services are running

### 2. Authentication
- [ ] Admin can login
- [ ] Student can login
- [ ] Manager can login
- [ ] Invalid credentials rejected
- [ ] Tokens are generated correctly

### 3. Role-Based Access Control
- [ ] Admin cannot access student pages
- [ ] Student cannot access admin pages
- [ ] Manager cannot access student pages
- [ ] Proper redirects on unauthorized access
- [ ] Middleware blocks cross-role access

### 4. Content Upload
- [ ] Course upload works
- [ ] Video upload works
- [ ] Simulation paper upload works
- [ ] Test corrections upload works
- [ ] Files stored in Cloudinary
- [ ] Proper error handling

### 5. Content Display
- [ ] PDF files display with PDF viewer
- [ ] Audio files display with audio player
- [ ] Video files display with video player
- [ ] Images display correctly
- [ ] Documents don't open in media player

### 6. Test Interface
- [ ] Test page loads correctly
- [ ] Questions display properly
- [ ] Media content displays inline
- [ ] Timer works correctly
- [ ] Navigation between questions works
- [ ] Answers are saved

### 7. Question Types
- [ ] Multiple choice questions work
- [ ] Short answer questions work
- [ ] Written expression questions work
- [ ] Oral comprehension questions work
- [ ] Written comprehension questions work
- [ ] Oral expression recording works

### 8. Media Support
- [ ] Audio player controls work
- [ ] Video player controls work
- [ ] PDF zoom/rotate works
- [ ] Audio recording works
- [ ] Playback works correctly

### 9. Exam Mode
- [ ] Exam mode indicator shows
- [ ] Restrictions are enforced
- [ ] Time limits work
- [ ] No pause/rewind when disabled

### 10. Student Pages
- [ ] `/home` loads correctly
- [ ] `/cours` displays courses
- [ ] `/tests` displays tests
- [ ] `/tests/corrections` displays corrections
- [ ] `/tcf-tef-simulation` displays simulations
- [ ] Content is properly filtered by subscription

## 🧪 Manual Testing Procedures

### Test 1: Admin Content Upload

1. Login as admin at `http://localhost:3000/connexion`
2. Go to `/admin/content/upload?type=course`
3. Upload a PDF file
4. Set levels: A1, A2, B1
5. Set subscriptions: Gratuit, Essentiel
6. Click "Continue"
7. Verify file appears in Cloudinary
8. Verify student can see it in `/cours`

### Test 2: Student Test Taking

1. Login as student
2. Go to `/tests`
3. Select a test
4. Click "Start Test"
5. Answer questions
6. For oral questions, record audio
7. Submit test
8. Verify results page shows

### Test 3: Role-Based Access Control

1. Login as admin
2. Try to access `/home` (should redirect to `/admin`)
3. Logout
4. Login as student
5. Try to access `/admin` (should redirect to `/connexion`)
6. Logout
7. Login as manager
8. Try to access `/home` (should redirect to `/manager`)

### Test 4: Content Type Detection

1. Upload different file types:
   - PDF file → should use PDF viewer
   - MP3 file → should use audio player
   - MP4 file → should use video player
   - PNG file → should display as image
2. Verify each displays correctly

### Test 5: Simulation Paper Upload

1. Go to `/admin/content/upload?type=simulation-paper`
2. Upload exam papers
3. Set levels and subscriptions
4. Go to `/tcf-tef-simulation` as student
5. Verify papers appear

### Test 6: Test Corrections Upload

1. Go to `/admin/content/upload?type=test-corrections`
2. Upload correction documents
3. Set levels and subscriptions
4. Go to `/tests/corrections` as student
5. Verify corrections appear

## 🔍 Debugging

### Check Backend Logs
```bash
tail -f /home/gotti/Desktop/frontend/backend/backend.log
```

### Check Database
```bash
cd /home/gotti/Desktop/frontend/backend
npx prisma studio
```

### Test API Endpoint
```bash
curl -X GET http://localhost:3001/health
```

### Check Cloudinary Upload
```bash
# Login to Cloudinary dashboard
# Verify files are in correct folders
```

## 📊 Performance Testing

### Load Testing
```bash
# Use Apache Bench or similar tool
ab -n 100 -c 10 http://localhost:3001/health
```

### Database Query Performance
```bash
# Check slow queries in logs
grep "slow" /home/gotti/Desktop/frontend/backend/backend.log
```

## 🐛 Common Issues

### Backend Won't Start
```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9
# Try again
./start-backend.sh
```

### Tests Fail
```bash
# Ensure backend is running
curl http://localhost:3001/health
# Check test credentials
# Run tests again
./e2e-test.sh
```

### Content Upload Fails
```bash
# Check Cloudinary credentials in .env
# Verify file size limits
# Check file type is allowed
```

### Role-Based Access Control Not Working
```bash
# Check middleware.ts
# Verify cookies are set correctly
# Check browser console for errors
```

## 📈 Success Criteria

All tests should pass:
- ✅ Backend health check
- ✅ All authentication tests
- ✅ All RBAC tests
- ✅ All content upload tests
- ✅ All content display tests
- ✅ All test interface tests
- ✅ All media support tests
- ✅ All exam mode tests

## 🎉 Deployment Checklist

Before deploying to production:
- [ ] All tests pass
- [ ] No console errors
- [ ] No database errors
- [ ] Performance is acceptable
- [ ] Security checks pass
- [ ] Backup is created
- [ ] Rollback plan is ready

## 📞 Support

For issues or questions:
1. Check logs: `tail -100 backend.log`
2. Run health check: `curl http://localhost:3001/health`
3. Run tests: `./e2e-test.sh`
4. Check database: `npx prisma studio`


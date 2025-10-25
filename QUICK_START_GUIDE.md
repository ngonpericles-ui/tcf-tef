# AURA.CA Quick Start Guide

## 🚀 Starting the Platform

### Step 1: Start Backend
```bash
cd /home/gotti/Desktop/frontend/backend
./start-backend.sh
```

**What it does:**
- ✅ Checks Node.js and npm
- ✅ Kills existing processes
- ✅ Frees up port 3001
- ✅ Installs dependencies
- ✅ Starts backend server
- ✅ Verifies health
- ✅ Monitors process

**Expected Output:**
```
========================================
AURA.CA Backend Startup
========================================
✅ Node.js found: v18.x.x
✅ npm found: 9.x.x
✅ .env file found
✅ Backend process started with PID xxxxx
✅ Backend is healthy!
========================================
Backend Ready
========================================
✅ Backend is running on http://localhost:3001
✅ API Documentation: http://localhost:3001/api-docs
✅ Health Check: http://localhost:3001/health
```

### Step 2: Start Frontend (in another terminal)
```bash
cd /home/gotti/Desktop/frontend
PORT=3000 npm run dev
```

**Expected Output:**
```
> next dev
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local
```

### Step 3: Access the Platform
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **API Docs**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 🧪 Testing the Platform

### Run Comprehensive Tests
```bash
cd /home/gotti/Desktop/frontend/backend
./test-backend.sh
```

**What it tests:**
- ✅ Backend health
- ✅ Admin login
- ✅ Student login
- ✅ Manager login
- ✅ Role-based access control
- ✅ Content upload
- ✅ API endpoints

## 👤 Test Credentials

### Admin
```
Email: admin@aura.ca
Password: Admin@123
```

### Student
```
Email: student@aura.ca
Password: Student@123
```

### Manager
```
Email: manager@aura.ca
Password: Manager@123
```

## 🔐 Role-Based Access Control

### Admin Access
- ✅ Can access: /admin/*
- ❌ Cannot access: /home, /cours, /student pages
- Redirects to: /admin if trying to access student pages

### Student Access
- ✅ Can access: /home, /cours, /profil, /tests, etc.
- ❌ Cannot access: /admin/*, /manager/*
- Redirects to: /connexion if trying to access admin pages

### Manager Access
- ✅ Can access: /manager/*, /senior-manager/*, /junior-manager/*
- ❌ Cannot access: /admin/*, /home, /student pages
- Redirects to: /manager if trying to access student pages

## 📋 Common Tasks

### Upload Content
1. Login as admin
2. Go to /admin/content/upload
3. Select content type (course, video, simulation-paper, test-corrections)
4. Upload file
5. Set levels and subscriptions
6. Click "Continue"

### Generate Questions from File
1. Login as admin/manager
2. Go to /admin/content/questionnaire or /manager/content/audio-simulator
3. Upload PDF/TXT file
4. Questions are generated automatically

### View Course Content
1. Login as student
2. Go to /cours
3. Select a course
4. Content displays with proper viewer:
   - PDF files → PDF viewer
   - Audio files → Audio player
   - Video files → Video player
   - Images → Image viewer

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port is in use
lsof -i :3001

# Kill existing process
lsof -ti:3001 | xargs kill -9

# Try again
./start-backend.sh
```

### Health Check Fails
```bash
# Check logs
tail -100 backend.log

# Verify database
npx prisma studio

# Run migrations
npx prisma migrate deploy
```

### Tests Fail
```bash
# Ensure backend is running
curl http://localhost:3001/health

# Check test credentials
# Edit test-backend.sh if needed

# Run tests again
./test-backend.sh
```

### Frontend Won't Start
```bash
# Check if port is in use
lsof -i :3000

# Kill existing process
lsof -ti:3000 | xargs kill -9

# Try again
PORT=3000 npm run dev
```

## 📊 Monitoring

### Check Backend Health
```bash
curl http://localhost:3001/health
```

### View Detailed Health
```bash
curl http://localhost:3001/health/detailed
```

### Monitor Logs
```bash
tail -f backend.log
```

### Check Database
```bash
npx prisma studio
```

## 🔧 Development Workflow

1. **Start Backend**
   ```bash
   ./start-backend.sh
   ```

2. **Start Frontend**
   ```bash
   PORT=3000 npm run dev
   ```

3. **Make Changes**
   - Edit source files
   - Backend auto-reloads with nodemon
   - Frontend auto-reloads with Next.js

4. **Test Changes**
   ```bash
   ./test-backend.sh
   ```

5. **Monitor Logs**
   ```bash
   tail -f backend.log
   ```

## 📚 Documentation

- **Backend Setup**: `/backend/BACKEND_SETUP_GUIDE.md`
- **Session Summary**: `/SESSION_CRITICAL_FIXES_SUMMARY.md`
- **API Docs**: http://localhost:3001/api-docs

## 🎯 Key Features

### Content Management
- ✅ Upload courses, videos, documents
- ✅ Upload simulation papers
- ✅ Upload test corrections
- ✅ Cloudinary integration

### AI Features
- ✅ Generate questions from text
- ✅ Generate questions from files
- ✅ Multiple question types
- ✅ Gemini API integration

### Content Display
- ✅ PDF viewer with zoom/rotate
- ✅ Audio player with controls
- ✅ Video player
- ✅ Automatic content type detection

### Security
- ✅ Strict role-based access control
- ✅ JWT authentication
- ✅ Password hashing
- ✅ Rate limiting

## 🚀 Next Steps

1. Test all content upload types
2. Implement test interface with media support
3. Implement oral test recording
4. Run comprehensive end-to-end tests
5. Deploy to production

## 📞 Support

For issues:
1. Check logs: `tail -100 backend.log`
2. Run health check: `curl http://localhost:3001/health`
3. Run tests: `./test-backend.sh`
4. Check database: `npx prisma studio`

## ✅ Verification Checklist

- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] Can login as admin
- [ ] Can login as student
- [ ] Can login as manager
- [ ] Admin cannot access student pages
- [ ] Student cannot access admin pages
- [ ] Content upload works
- [ ] File upload to questionnaire works
- [ ] Content displays with proper viewer

Once all items are checked, the platform is ready for use!


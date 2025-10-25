# Aura.ca Platform - Quick Reference Guide

## 🚀 Quick Start

### For Understanding the Platform
1. Start with `EXECUTIVE_SUMMARY.md` (5 min read)
2. Read `COMPREHENSIVE_PLATFORM_UNDERSTANDING.md` (15 min read)
3. Review specific section deep dives as needed

### For Integration Work
1. Check `FRONTEND_BACKEND_INTEGRATION_GUIDE.md`
2. Reference `INTEGRATION_POINTS_MAPPING.md`
3. Follow the priority matrix

---

## 📍 Platform Structure at a Glance

```
AURA.CA PLATFORM
├── STUDENT SECTION (16 pages)
│   ├── Home Dashboard
│   ├── Course Catalog & Details
│   ├── Test Taking Interface
│   ├── Live Sessions
│   ├── AI Chat
│   ├── Voice Simulation
│   ├── Immigration Simulation
│   ├── Profile & Settings
│   └── Favorites, Notifications, Messages
│
├── MANAGER SECTION (27 pages)
│   ├── JUNIOR MANAGER (12 pages)
│   │   ├── Dashboard
│   │   ├── Content Creation (A1-B1)
│   │   ├── Live Sessions
│   │   ├── Student Management
│   │   └── Feed & Notifications
│   │
│   └── SENIOR MANAGER (15 pages)
│       ├── Dashboard
│       ├── Advanced Analytics
│       ├── Content Management (All levels)
│       ├── Team Management
│       ├── Moderation
│       └── Advanced Features
│
└── ADMIN SECTION (15 pages)
    ├── Dashboard
    ├── User Management
    ├── Content Management
    ├── Analytics & Reporting
    ├── Manager Management
    ├── Live Session Oversight
    ├── Moderation
    └── Settings & Configuration
```

---

## 🎯 65+ Features Quick List

### By Role

**STUDENT** (30+ features)
- Course enrollment & progress
- Test taking & results
- Live session participation
- AI chat & tutoring
- Voice practice
- Immigration interview practice
- Profile management
- Favorites & bookmarks
- Notifications & messages
- Achievements & certificates

**JUNIOR_MANAGER** (25+ features)
- Create courses (A1-B1)
- Create tests (A1-B1)
- Create simulations
- Manage live sessions
- View student progress
- Basic analytics
- Feed management
- Content moderation

**SENIOR_MANAGER** (40+ features)
- All junior manager features +
- Create courses (all levels)
- Create tests (all levels)
- Advanced analytics
- Team management
- Revenue tracking
- User management
- Advanced moderation
- Report generation

**ADMIN** (50+ features)
- All senior manager features +
- System administration
- User account management
- Platform configuration
- Security settings
- Backup & recovery
- System monitoring
- Audit logs
- Advanced reporting

---

## 🔌 API Endpoints Quick Reference

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
```

### Courses
```
GET    /api/courses
GET    /api/courses/:id
POST   /api/courses
PUT    /api/courses/:id
DELETE /api/courses/:id
POST   /api/courses/:id/enroll
```

### Tests
```
GET    /api/tests
GET    /api/tests/:id
POST   /api/tests/:id/start
POST   /api/tests/submit
GET    /api/tests/:id/results
```

### AI Features
```
POST   /api/ai-chat/send-message
POST   /api/voice-simulation/book
POST   /api/immigration-simulation/create
POST   /api/floating-ai-assistant/help
```

### Admin
```
GET    /api/admin/dashboard
GET    /api/admin/analytics
GET    /api/admin/users
POST   /api/admin/users
```

### Manager
```
GET    /api/manager/dashboard
GET    /api/manager/analytics
GET    /api/manager/content
POST   /api/manager/content
```

---

## 📊 Database Models Quick Reference

### Core Models
- **User** - All users (students, managers, admins)
- **Course** - Learning content
- **Test** - Assessments
- **TestAttempt** - User test submissions
- **LiveSession** - Instructor-led sessions
- **Post** - Community content
- **Comment** - Discussions
- **Message** - User messaging
- **Subscription** - User subscriptions
- **Payment** - Transactions
- **Certificate** - Achievements
- **ChatSession/ChatMessage** - AI chat history
- **VoiceSimulation** - Voice practice
- **ImmigrationSimulation** - Immigration practice
- **SimulationResult** - Test results
- **AIFeedback** - AI-generated feedback

---

## 🎓 User Roles & Permissions

### STUDENT
- ✅ View courses
- ✅ Enroll in courses
- ✅ Take tests
- ✅ Join live sessions
- ✅ Use AI features
- ❌ Create content
- ❌ Manage users
- ❌ View analytics

### JUNIOR_MANAGER
- ✅ Create courses (A1-B1)
- ✅ Create tests (A1-B1)
- ✅ Create simulations
- ✅ Manage live sessions
- ✅ View student progress
- ✅ Basic analytics
- ❌ Manage other managers
- ❌ Advanced analytics
- ❌ System settings

### SENIOR_MANAGER
- ✅ All junior manager features
- ✅ Create courses (all levels)
- ✅ Create tests (all levels)
- ✅ Advanced analytics
- ✅ Manage junior managers
- ✅ User management
- ✅ Moderation
- ❌ System settings
- ❌ Admin functions

### ADMIN
- ✅ All features
- ✅ System administration
- ✅ User management
- ✅ Platform configuration
- ✅ Security settings
- ✅ Audit logs

---

## 🔐 Authentication Flow

```
1. User enters credentials
2. POST /api/auth/login
3. Backend validates & returns JWT
4. Frontend stores JWT
5. JWT included in all requests
6. Backend validates JWT
7. Request processed
8. Response returned
```

---

## 📱 Frontend Pages Quick Map

### Student Pages
- `/` - Home
- `/home` - Dashboard
- `/cours` - Courses
- `/tests` - Tests
- `/live` - Live sessions
- `/ai-chat` - AI chat
- `/simulation-vocale` - Voice practice
- `/immigration-simulations` - Immigration practice
- `/profil` - Profile
- `/settings` - Settings
- `/favoris` - Favorites
- `/notifications` - Notifications
- `/messages` - Messages

### Manager Pages
- `/manager` - Dashboard
- `/manager/content` - Content management
- `/manager/analytics` - Analytics
- `/manager/students` - Student management
- `/manager/sessions` - Live sessions
- `/manager/feed` - Feed management
- `/manager/moderation` - Moderation
- `/senior-manager` - Senior dashboard
- `/junior-manager` - Junior dashboard

### Admin Pages
- `/admin` - Dashboard
- `/admin/users` - User management
- `/admin/content` - Content management
- `/admin/analytics` - Analytics
- `/admin/managers` - Manager management
- `/admin/live-sessions` - Session oversight
- `/admin/moderation` - Moderation
- `/admin/settings` - Settings

---

## 🎯 Integration Priority

### CRITICAL (Do First)
1. Authentication
2. Home dashboard
3. Course catalog
4. Test interface
5. User profile

### HIGH (Do Next)
6. Admin dashboard
7. Manager dashboards
8. Live sessions
9. AI chat
10. Payments

### MEDIUM (Do After)
11. Voice simulation
12. Immigration simulation
13. Analytics
14. Notifications
15. File upload

### LOW (Nice to Have)
16. Marketplace
17. Moderation
18. Advanced analytics

---

## 📚 Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| EXECUTIVE_SUMMARY.md | High-level overview | 5 min |
| COMPREHENSIVE_PLATFORM_UNDERSTANDING.md | Complete overview | 15 min |
| ADMIN_SECTION_DEEP_DIVE.md | Admin features | 10 min |
| MANAGER_SECTIONS_DEEP_DIVE.md | Manager features | 10 min |
| STUDENT_SECTION_DEEP_DIVE.md | Student features | 10 min |
| AI_FUNCTIONALITIES_DEEP_DIVE.md | AI features | 10 min |
| FRONTEND_BACKEND_INTEGRATION_GUIDE.md | Integration steps | 15 min |
| INTEGRATION_POINTS_MAPPING.md | All integration points | 20 min |
| QUICK_REFERENCE_GUIDE.md | This file | 5 min |

---

## 💻 Key Technologies

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Express.js, Prisma, PostgreSQL
- **AI**: Gemini AI, OpenAI, VAPI
- **Auth**: JWT, Firebase
- **Payments**: Stripe
- **Real-time**: WebSocket, Socket.io
- **File Upload**: Cloudinary
- **Deployment**: Vercel, Docker, AWS

---

## 🚀 Getting Started

1. **Understand**: Read EXECUTIVE_SUMMARY.md
2. **Deep Dive**: Read relevant section deep dives
3. **Plan**: Review FRONTEND_BACKEND_INTEGRATION_GUIDE.md
4. **Reference**: Use INTEGRATION_POINTS_MAPPING.md
5. **Implement**: Start with Phase 1 (Authentication)
6. **Test**: Write tests for each integration
7. **Deploy**: Follow deployment procedures

---

## ✅ Checklist for Success

- [ ] Read all documentation
- [ ] Understand platform architecture
- [ ] Map all integration points
- [ ] Setup development environment
- [ ] Implement authentication
- [ ] Connect core APIs
- [ ] Connect admin/manager APIs
- [ ] Connect AI features
- [ ] Write comprehensive tests
- [ ] Optimize performance
- [ ] Deploy to production

---

**Status**: ✅ QUICK REFERENCE COMPLETE  
**Last Updated**: 2025-10-20  
**Platform**: Aura.ca - TCF/TEF Learning Platform


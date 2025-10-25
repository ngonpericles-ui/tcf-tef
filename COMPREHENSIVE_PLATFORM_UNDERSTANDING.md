# AURA.CA Platform - Comprehensive Understanding Document

## 🎯 Executive Summary

**Aura.ca** is a sophisticated, multi-role French language learning platform (TCF/TEF preparation) with 65+ functionalities. The platform is **fully backend-implemented** with comprehensive API routes and services. The primary task is to **connect frontend to backend** and adjust frontend components.

---

## 🏗️ Platform Architecture

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Express.js, Prisma ORM, PostgreSQL
- **Authentication**: JWT-based with role-based access control
- **Real-time**: WebSocket (Socket.io), VAPI for voice
- **AI Integration**: Gemini AI, OpenAI APIs
- **File Management**: Cloudinary, file upload services
- **Payments**: Stripe integration
- **Deployment**: Vercel (frontend), Docker/AWS (backend)

### Core Roles & Sections
1. **STUDENT** - Learning interface
2. **JUNIOR_MANAGER** - Content creation (A1-B1 levels, Free/Essential tiers)
3. **SENIOR_MANAGER** - Advanced management, analytics, team oversight
4. **ADMIN** - Full platform control, system administration

---

## 📊 65+ Core Functionalities

### 1. **Authentication & User Management** (8 features)
- User registration/login with JWT
- Social authentication (Firebase)
- Role-based access control (RBAC)
- Profile management
- Password management
- Email verification
- Session management
- Temporary token service

### 2. **Course Management** (10 features)
- Course creation/editing
- Multi-level courses (A1-C2)
- Course enrollment
- Progress tracking
- Course content management (PDF/Video)
- Course filtering & search
- Course ratings & reviews
- Favorites system
- Course analytics
- Bulk course operations

### 3. **Testing System** (12 features)
- TCF/TEF simulations
- Practice tests
- Diagnostic assessments
- Multiple question types (MCQ, fill-blank, listening, writing)
- Real-time scoring
- Test attempts tracking
- Test corrections
- Question bank management
- Test analytics
- Certificate generation
- Level assessment
- Test management

### 4. **AI-Powered Features** (15 features)
- **AI Chat**: Conversational AI tutor with context awareness
- **Voice Simulation**: VAPI-powered oral interview practice
- **Immigration Simulation**: AI-generated interview scenarios
- **Floating AI Assistant**: Context-aware help on any page
- **AI Feedback**: Automated assessment feedback
- **AI Teacher Feedback**: Personalized learning recommendations
- **AI Tutor Service**: Study plan generation
- **AI Content Suggestions**: Personalized content recommendations
- **Real-time Speech Service**: Speech recognition & analysis
- **AI-powered test generation**: Dynamic question creation
- **AI Session Insights**: Learning analytics
- **Gemini Integration**: Advanced AI capabilities
- **Conversation History**: Chat memory management
- **Question Bank Integration**: AI uses question bank for context
- **Personalized Greetings**: AI-generated motivational messages

### 5. **Live Sessions** (8 features)
- Session scheduling
- Instructor management
- Participant tracking
- Real-time video (Agora integration)
- Session recording
- Session notifications
- Session analytics
- Co-instructor support

### 6. **Community & Social** (10 features)
- Post creation/editing
- Comments system (threaded)
- Like functionality
- Share functionality
- Feed management
- Content moderation
- Community guidelines
- User mentions
- Hashtag support
- Social analytics

### 7. **Subscription & Payments** (8 features)
- Subscription tiers (FREE, ESSENTIAL, PREMIUM, PRO)
- Payment processing (Stripe)
- Invoice management
- Subscription management
- Payment history
- Refund handling
- Billing analytics
- Currency support

### 8. **Analytics & Reporting** (7 features)
- User analytics
- Course analytics
- Test performance analytics
- Revenue analytics
- Engagement metrics
- Custom reports
- Export capabilities (PDF, CSV, Excel)

### 9. **Content Management** (6 features)
- Content creation workflow
- Approval system
- Version control
- Media management
- Content distribution
- Content performance tracking

### 10. **File Management** (5 features)
- File upload (Cloudinary)
- File browser
- File sharing
- File versioning
- File tagging

### 11. **Notifications** (4 features)
- Email notifications
- In-app notifications
- Push notifications
- Notification preferences

### 12. **Search & Discovery** (3 features)
- Full-text search
- Advanced filtering
- Search analytics

---

## 🗄️ Database Schema (Key Models)

### Core Entities
- **User**: Students, managers, admins with roles
- **Course**: Learning content with levels (A1-C2)
- **Test**: Assessments with questions
- **TestAttempt**: User test submissions
- **LiveSession**: Instructor-led sessions
- **Post**: Community content
- **Comment**: Threaded discussions
- **Message**: User-to-user messaging
- **Subscription**: User subscription plans
- **Payment**: Transaction records
- **Certificate**: Achievement certificates
- **ChatSession/ChatMessage**: AI chat history
- **VoiceSimulation**: Oral practice sessions
- **ImmigrationSimulation**: Immigration interview practice
- **SimulationResult**: Test/simulation results
- **AIFeedback**: AI-generated feedback
- **QuestionBank**: Reusable question sets

---

## 🔌 Backend API Routes (40+ endpoints)

### Main Route Groups
- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/courses` - Course operations
- `/api/tests` - Test management
- `/api/live-sessions` - Live session management
- `/api/admin` - Admin operations
- `/api/manager` - Manager operations
- `/api/posts` - Community posts
- `/api/ai-chat` - AI chat service
- `/api/voice-simulation` - Voice practice
- `/api/immigration-simulation` - Immigration practice
- `/api/floating-ai-assistant` - Context-aware AI help
- `/api/analytics` - Analytics data
- `/api/payments` - Payment processing
- `/api/notifications` - Notification service
- `/api/messages` - Messaging system
- `/api/search` - Search functionality
- `/api/marketplace` - Content marketplace
- `/api/file-management` - File operations
- `/api/achievements` - Achievement tracking
- `/api/challenges` - Learning challenges

---

## 🎨 Frontend Structure

### Main Sections
- `/` - Home/Landing
- `/home` - Student dashboard
- `/cours` - Course catalog
- `/tests` - Test interface
- `/live` - Live sessions
- `/ai-chat` - AI chat interface
- `/voice-simulation` - Voice practice
- `/immigration-simulations` - Immigration practice
- `/admin` - Admin dashboard (15+ pages)
- `/manager` - Manager dashboard (15+ pages)
- `/senior-manager` - Senior manager dashboard
- `/junior-manager` - Junior manager dashboard
- `/profil` - User profile
- `/settings` - User settings
- `/messages` - Messaging
- `/notifications` - Notifications
- `/favoris` - Favorites
- `/posts` - Community feed
- `/marketplace` - Content marketplace

---

## 🔑 Key Integration Points (Frontend ↔ Backend)

### Priority Connections Needed
1. **Dashboard APIs** - Connect home page to analytics
2. **Course APIs** - Link course catalog to backend
3. **Test APIs** - Connect test interface to test engine
4. **AI Chat APIs** - Link chat UI to AI service
5. **Voice Simulation APIs** - Connect voice UI to VAPI
6. **Admin/Manager APIs** - Connect dashboards to backend
7. **Payment APIs** - Link payment UI to Stripe
8. **Authentication** - Ensure JWT flow works
9. **Real-time Updates** - WebSocket connections
10. **File Upload** - Cloudinary integration

---

## ✅ Status Summary

- ✅ **Backend**: 95% complete with all services implemented
- ✅ **Database**: Fully designed with 30+ models
- ✅ **API Routes**: All 40+ routes implemented
- ⏳ **Frontend**: UI components exist but need API integration
- ⏳ **Integration**: Main task - connect frontend to backend
- ⏳ **Testing**: Need comprehensive testing

---

## 📝 Next Steps

1. **Audit Frontend Components** - Identify which components need API integration
2. **Map API Calls** - Document all frontend-to-backend connections needed
3. **Implement API Clients** - Create/update API client functions
4. **Connect Components** - Wire up frontend components to backend APIs
5. **Test Integration** - Comprehensive testing of all features
6. **Optimize Performance** - Caching, pagination, lazy loading
7. **Deploy** - Production deployment

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-20  
**Status**: ✅ COMPREHENSIVE UNDERSTANDING COMPLETE


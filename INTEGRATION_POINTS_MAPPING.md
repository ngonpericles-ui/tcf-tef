# Frontend-Backend Integration Points Mapping

## 🎯 Complete Integration Points Reference

This document maps every frontend component/page to its required backend API endpoints.

---

## 🔐 AUTHENTICATION LAYER

### Login Flow
**Frontend**: `app/connexion/page.tsx`
**Backend**: `POST /api/auth/login`
**Data Flow**:
```
User Input → Validate → POST /api/auth/login → JWT Token → Store Token → Redirect
```
**Integration Points**:
- Email/password validation
- JWT token storage (localStorage/sessionStorage)
- Token refresh mechanism
- Error handling

### Registration Flow
**Frontend**: `app/inscription/page.tsx`
**Backend**: `POST /api/auth/register`
**Data Flow**:
```
User Input → Validate → POST /api/auth/register → Confirmation Email → Verify Email
```

### JWT Token Management
**Frontend**: `lib/tokenValidator.ts`, `lib/simpleTokenStorage.ts`
**Backend**: `POST /api/auth/refresh`
**Integration Points**:
- Token storage
- Token expiration handling
- Automatic token refresh
- Logout cleanup

---

## 👤 USER PROFILE & SETTINGS

### Profile Page
**Frontend**: `app/profil/page.tsx`
**Backend APIs**:
- `GET /api/users/:id` - Fetch profile
- `PUT /api/users/:id` - Update profile
- `POST /api/users/:id/avatar` - Upload avatar

**Integration Points**:
- Load user data on mount
- Display profile information
- Handle avatar upload
- Save profile changes

### Settings Page
**Frontend**: `app/settings/page.tsx`
**Backend APIs**:
- `GET /api/settings` - Fetch settings
- `PUT /api/settings` - Update settings
- `POST /api/auth/change-password` - Change password

---

## 📚 COURSE MANAGEMENT

### Course Catalog
**Frontend**: `app/cours/page.tsx`
**Backend APIs**:
- `GET /api/courses` - List all courses
- `GET /api/courses?level=A1&category=grammar` - Filtered courses
- `GET /api/home/recommendations` - Recommended courses

**Integration Points**:
- Fetch courses on mount
- Implement filtering (level, category, tier)
- Implement search
- Pagination
- Display course cards

### Course Details
**Frontend**: `app/cours/[id]/page.tsx`
**Backend APIs**:
- `GET /api/courses/:id` - Course details
- `GET /api/course-content/:id` - Course content
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/:id/progress` - User progress
- `GET /api/comments?courseId=:id` - Comments
- `POST /api/comments` - Add comment
- `POST /api/likes` - Like course

**Integration Points**:
- Load course data
- Display video/PDF content
- Show progress bar
- Handle enrollment
- Display comments
- Like functionality

### Course Creation (Manager)
**Frontend**: `app/manager/content/create/page.tsx`
**Backend APIs**:
- `POST /api/courses` - Create course
- `POST /api/upload` - Upload content
- `PUT /api/courses/:id` - Update course

**Integration Points**:
- Form validation
- File upload
- Content preview
- Save to database

---

## 📝 TEST MANAGEMENT

### Test Catalog
**Frontend**: `app/tests/page.tsx`
**Backend APIs**:
- `GET /api/tests` - List tests
- `GET /api/tests?level=B1&type=TCF` - Filtered tests
- `GET /api/favorites` - Favorite tests

**Integration Points**:
- Fetch tests
- Filter by level, type, tier
- Display test cards
- Show favorites

### Test Taking
**Frontend**: `app/tests/take/[id]/page.tsx`
**Backend APIs**:
- `POST /api/tests/:id/start` - Start test
- `POST /api/tests/submit` - Submit answers
- `GET /api/tests/:id/questions` - Get questions

**Integration Points**:
- Initialize test session
- Display questions
- Handle timer
- Save answers
- Submit test
- Calculate score

### Test Results
**Frontend**: `app/tests/results/[id]/page.tsx`
**Backend APIs**:
- `GET /api/tests/:id/results` - Test results
- `GET /api/certificates/:id` - Certificate
- `GET /api/tests/:id/corrections` - Corrections

**Integration Points**:
- Display score
- Show performance breakdown
- Display certificate
- Show corrections

---

## 🎥 LIVE SESSIONS

### Session List
**Frontend**: `app/live/page.tsx`
**Backend APIs**:
- `GET /api/live-sessions` - List sessions
- `GET /api/live-sessions?date=2025-10-20` - Filtered sessions

**Integration Points**:
- Fetch sessions
- Display calendar
- Show session cards

### Session Details & Registration
**Frontend**: `app/live/[id]/page.tsx`
**Backend APIs**:
- `GET /api/live-sessions/:id` - Session details
- `POST /api/live-sessions/:id/register` - Register
- `GET /api/live-sessions/:id/participants` - Participants

**Integration Points**:
- Load session details
- Handle registration
- Show participant count
- Join session button

---

## 🤖 AI FEATURES

### AI Chat
**Frontend**: `app/ai-chat/page.tsx`
**Backend APIs**:
- `POST /api/ai-chat/send-message` - Send message
- `GET /api/ai-chat/history` - Chat history
- `GET /api/ai-chat/suggestions` - Quick suggestions

**Integration Points**:
- Send user message
- Display AI response
- Show suggestions
- Maintain conversation history

### Voice Simulation
**Frontend**: `app/simulation-vocale/page.tsx`
**Backend APIs**:
- `POST /api/voice-simulation/book` - Book session
- `POST /api/voice-simulation/start` - Start session
- `GET /api/voice-simulation/results/:id` - Results

**Integration Points**:
- Book simulation
- Initialize VAPI call
- Display voice interface
- Show results

### Immigration Simulation
**Frontend**: `app/immigration-simulations/page.tsx`
**Backend APIs**:
- `POST /api/immigration-simulation/create` - Create session
- `POST /api/immigration-simulation/submit-response` - Submit response
- `GET /api/immigration-simulation/report/:id` - Report

**Integration Points**:
- Create simulation
- Display questions
- Submit responses
- Show analysis

---

## 📊 ADMIN DASHBOARD

### Admin Home
**Frontend**: `app/admin/page.tsx`
**Backend APIs**:
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/admin/system/health` - System health
- `GET /api/admin/metrics/business` - Business metrics

**Integration Points**:
- Load dashboard metrics
- Display KPIs
- Show recent activity

### User Management
**Frontend**: `app/admin/users/page.tsx`
**Backend APIs**:
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

**Integration Points**:
- Fetch user list
- Implement CRUD
- Handle pagination
- Filter/search

### Analytics
**Frontend**: `app/admin/analytics/page.tsx`
**Backend APIs**:
- `GET /api/admin/analytics` - Analytics data
- `GET /api/admin/analytics/revenue` - Revenue
- `GET /api/admin/analytics/users` - User analytics

**Integration Points**:
- Fetch analytics
- Display charts
- Export reports

---

## 👨‍💼 MANAGER DASHBOARD

### Manager Home
**Frontend**: `app/manager/dashboard/page.tsx`
**Backend APIs**:
- `GET /api/manager/dashboard` - Dashboard data
- `GET /api/manager/metrics` - Metrics

**Integration Points**:
- Load manager stats
- Display KPIs

### Content Management
**Frontend**: `app/manager/content/page.tsx`
**Backend APIs**:
- `GET /api/manager/content` - List content
- `POST /api/manager/content` - Create content
- `PUT /api/manager/content/:id` - Update content
- `DELETE /api/manager/content/:id` - Delete content

**Integration Points**:
- Fetch content
- CRUD operations
- Bulk operations

### Manager Analytics
**Frontend**: `app/manager/analytics/page.tsx`
**Backend APIs**:
- `GET /api/manager/analytics` - Analytics data
- `GET /api/manager/analytics/courses` - Course analytics
- `GET /api/manager/analytics/tests` - Test analytics

---

## 💳 PAYMENTS & SUBSCRIPTIONS

### Payment Page
**Frontend**: `app/payment/page.tsx`
**Backend APIs**:
- `POST /api/payments/create-intent` - Create payment
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Payment history

**Integration Points**:
- Create payment intent
- Handle Stripe integration
- Confirm payment
- Show confirmation

### Subscription Management
**Frontend**: `app/abonnement/page.tsx`
**Backend APIs**:
- `GET /api/subscriptions` - List subscriptions
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/:id` - Update subscription

---

## 🔔 NOTIFICATIONS & MESSAGES

### Notifications
**Frontend**: `app/notifications/page.tsx`
**Backend APIs**:
- `GET /api/notifications` - List notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete

### Messages
**Frontend**: `app/messages/page.tsx`
**Backend APIs**:
- `GET /api/messages` - List messages
- `POST /api/messages` - Send message
- `GET /api/messages/:id` - Message thread

---

## ⭐ FAVORITES

### Favorites Page
**Frontend**: `app/favoris/page.tsx`
**Backend APIs**:
- `GET /api/favorites` - List favorites
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites/:id` - Remove favorite

**Integration Points**:
- Fetch favorites
- Add/remove from favorites
- Display favorite items

---

## 🔍 SEARCH

### Search Page
**Frontend**: `app/search/page.tsx`
**Backend APIs**:
- `GET /api/search?q=query` - Search results
- `GET /api/search/suggestions` - Search suggestions

---

## 📋 SUMMARY

**Total Integration Points**: 100+
**Critical APIs**: 20+
**High Priority APIs**: 30+
**Medium Priority APIs**: 30+
**Low Priority APIs**: 20+

**Status**: ✅ ALL INTEGRATION POINTS MAPPED


# Frontend-Backend Integration Guide

## 🎯 Overview
This guide maps all frontend components to their corresponding backend APIs and identifies integration points.

---

## 📋 Integration Priority Matrix

### CRITICAL (Must Complete First)
1. Authentication flow (JWT, login, register)
2. Home dashboard APIs
3. Course catalog APIs
4. Test taking APIs
5. User profile APIs

### HIGH (Complete Next)
6. Admin dashboard APIs
7. Manager dashboard APIs
8. Live session APIs
9. AI chat APIs
10. Payment APIs

### MEDIUM (Complete After)
11. Voice simulation APIs
12. Immigration simulation APIs
13. Analytics APIs
14. Notification APIs
15. File upload APIs

### LOW (Nice to Have)
16. Marketplace APIs
17. Moderation APIs
18. Advanced analytics

---

## 🔌 API Integration Checklist

### Authentication (`/api/auth`)
- [ ] POST `/api/auth/register` - User registration
- [ ] POST `/api/auth/login` - User login
- [ ] POST `/api/auth/logout` - User logout
- [ ] POST `/api/auth/refresh` - Refresh JWT token
- [ ] POST `/api/auth/verify-email` - Email verification
- [ ] POST `/api/auth/forgot-password` - Password reset
- [ ] POST `/api/auth/reset-password` - Reset password

**Frontend Files to Update**:
- `contexts/AuthContext.tsx`
- `hooks/useAuth.ts`
- `app/connexion/page.tsx`
- `app/inscription/page.tsx`

---

### User Management (`/api/users`)
- [ ] GET `/api/users/:id` - Get user profile
- [ ] PUT `/api/users/:id` - Update profile
- [ ] GET `/api/users/:id/progress` - User progress
- [ ] GET `/api/users/:id/enrollments` - User enrollments
- [ ] POST `/api/users/:id/avatar` - Upload avatar
- [ ] GET `/api/users/:id/activity` - User activity

**Frontend Files to Update**:
- `app/profil/page.tsx`
- `app/settings/page.tsx`
- `components/profile-card.tsx`

---

### Courses (`/api/courses`)
- [ ] GET `/api/courses` - List courses
- [ ] GET `/api/courses/:id` - Get course details
- [ ] POST `/api/courses` - Create course (manager)
- [ ] PUT `/api/courses/:id` - Update course (manager)
- [ ] DELETE `/api/courses/:id` - Delete course (manager)
- [ ] POST `/api/courses/:id/enroll` - Enroll in course
- [ ] GET `/api/courses/:id/content` - Get course content
- [ ] GET `/api/courses/:id/progress` - Get progress

**Frontend Files to Update**:
- `app/cours/page.tsx`
- `app/cours/[id]/page.tsx`
- `components/course-explorer.tsx`
- `components/course-card.tsx`

---

### Tests (`/api/tests`)
- [ ] GET `/api/tests` - List tests
- [ ] GET `/api/tests/:id` - Get test details
- [ ] POST `/api/tests/:id/start` - Start test
- [ ] POST `/api/tests/submit` - Submit test answers
- [ ] GET `/api/tests/:id/results` - Get test results
- [ ] GET `/api/tests/:id/corrections` - Get corrections

**Frontend Files to Update**:
- `app/tests/page.tsx`
- `app/tests/take/[id]/page.tsx`
- `app/tests/results/[id]/page.tsx`
- `components/test-interface.tsx`

---

### Live Sessions (`/api/live-sessions`)
- [ ] GET `/api/live-sessions` - List sessions
- [ ] GET `/api/live-sessions/:id` - Get session details
- [ ] POST `/api/live-sessions` - Create session (manager)
- [ ] PUT `/api/live-sessions/:id` - Update session (manager)
- [ ] POST `/api/live-sessions/:id/register` - Register for session
- [ ] GET `/api/live-sessions/:id/participants` - Get participants

**Frontend Files to Update**:
- `app/live/page.tsx`
- `app/live/[id]/page.tsx`
- `components/live-session-card.tsx`

---

### AI Chat (`/api/ai-chat`)
- [ ] POST `/api/ai-chat/send-message` - Send chat message
- [ ] GET `/api/ai-chat/history` - Get chat history
- [ ] GET `/api/ai-chat/suggestions` - Get quick suggestions
- [ ] POST `/api/ai-chat/clear-history` - Clear chat history

**Frontend Files to Update**:
- `app/ai-chat/page.tsx`
- `components/ai-chat-assistant.tsx`
- `lib/services/aiChatService.ts`

---

### Voice Simulation (`/api/voice-simulation`)
- [ ] POST `/api/voice-simulation/book` - Book simulation
- [ ] POST `/api/voice-simulation/start` - Start session
- [ ] POST `/api/voice-simulation/end` - End session
- [ ] GET `/api/voice-simulation/results/:id` - Get results

**Frontend Files to Update**:
- `app/simulation-vocale/page.tsx`
- `app/simulation-vocale/booking/page.tsx`
- `app/simulation-vocale/results/page.tsx`

---

### Immigration Simulation (`/api/immigration-simulation`)
- [ ] POST `/api/immigration-simulation/create` - Create session
- [ ] POST `/api/immigration-simulation/submit-response` - Submit response
- [ ] GET `/api/immigration-simulation/report/:id` - Get report

**Frontend Files to Update**:
- `app/immigration-simulations/page.tsx`
- `app/immigration-simulations/questions/page.tsx`

---

### Admin APIs (`/api/admin`)
- [ ] GET `/api/admin/dashboard` - Dashboard data
- [ ] GET `/api/admin/analytics` - Analytics data
- [ ] GET `/api/admin/users` - List users
- [ ] POST `/api/admin/users` - Create user
- [ ] PUT `/api/admin/users/:id` - Update user
- [ ] DELETE `/api/admin/users/:id` - Delete user
- [ ] GET `/api/admin/content` - List content
- [ ] GET `/api/admin/managers` - List managers

**Frontend Files to Update**:
- `app/admin/page.tsx`
- `app/admin/analytics/page.tsx`
- `app/admin/users/page.tsx`
- `app/admin/content/page.tsx`

---

### Manager APIs (`/api/manager`)
- [ ] GET `/api/manager/dashboard` - Dashboard data
- [ ] GET `/api/manager/analytics` - Analytics data
- [ ] GET `/api/manager/content` - List content
- [ ] POST `/api/manager/content` - Create content
- [ ] GET `/api/manager/students` - List students

**Frontend Files to Update**:
- `app/manager/dashboard/page.tsx`
- `app/manager/analytics/page.tsx`
- `app/manager/content/page.tsx`

---

### Payments (`/api/payments`)
- [ ] POST `/api/payments/create-intent` - Create payment intent
- [ ] POST `/api/payments/confirm` - Confirm payment
- [ ] GET `/api/payments/history` - Payment history
- [ ] GET `/api/subscriptions` - Get subscriptions

**Frontend Files to Update**:
- `app/payment/page.tsx`
- `app/abonnement/page.tsx`

---

### Favorites (`/api/favorites`)
- [ ] GET `/api/favorites` - List favorites
- [ ] POST `/api/favorites` - Add favorite
- [ ] DELETE `/api/favorites/:id` - Remove favorite

**Frontend Files to Update**:
- `app/favoris/page.tsx`
- `components/like-button.tsx`

---

### Notifications (`/api/notifications`)
- [ ] GET `/api/notifications` - List notifications
- [ ] PUT `/api/notifications/:id/read` - Mark as read
- [ ] DELETE `/api/notifications/:id` - Delete notification

**Frontend Files to Update**:
- `app/notifications/page.tsx`
- `components/notification-bell.tsx`

---

### Messages (`/api/messages`)
- [ ] GET `/api/messages` - List messages
- [ ] POST `/api/messages` - Send message
- [ ] GET `/api/messages/:id` - Get message thread
- [ ] PUT `/api/messages/:id/read` - Mark as read

**Frontend Files to Update**:
- `app/messages/page.tsx`
- `components/message-box.tsx`

---

## 🛠️ Implementation Steps

### Step 1: Setup API Client
- Verify `lib/api-client.ts` has all endpoints
- Add missing endpoints
- Test API connectivity

### Step 2: Update Auth Context
- Implement JWT token storage
- Add login/logout logic
- Add role-based routing

### Step 3: Connect Dashboard
- Fetch dashboard data on mount
- Display metrics
- Add real-time updates

### Step 4: Connect Course Pages
- Fetch course list
- Implement filtering
- Add enrollment flow

### Step 5: Connect Test Pages
- Fetch test list
- Implement test taking
- Display results

### Step 6: Connect Admin/Manager
- Fetch dashboard data
- Implement CRUD operations
- Add analytics

### Step 7: Connect AI Features
- Implement chat interface
- Connect voice simulation
- Connect immigration simulation

### Step 8: Testing & Optimization
- Test all endpoints
- Add error handling
- Optimize performance

---

## 📊 API Response Format

All APIs follow this format:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

**Status**: ✅ INTEGRATION GUIDE COMPLETE


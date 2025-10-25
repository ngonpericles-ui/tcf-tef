# Student Section - Deep Dive Analysis

## 🎯 Overview
The Student Section is the **primary learning interface** for students preparing for TCF/TEF exams. It provides comprehensive learning tools, progress tracking, and personalized assistance.

---

## 📍 Student Pages & Features

### 1. **Home/Dashboard** (`/home`)
**Purpose**: Personalized learning dashboard

**Features**:
- Personalized greeting (AI-generated)
- Learning progress snapshot
- Course explorer
- Recommended courses
- Live session banner
- Quick access to tests
- AI assistant
- Motivational messages

**Components**:
- `PersonalizedGreeting` - AI-generated greeting
- `SmartDashboard` - Analytics overview
- `EnhancedHero` - Call-to-action section
- `Snapshot` - Progress summary
- `CourseExplorer` - Course recommendations
- `TestsPanel` - Available tests
- `LiveSessions` - Upcoming sessions
- `Upsell` - Premium features

**Backend Integration**:
- `GET /api/home/dashboard` - Dashboard data
- `GET /api/home/recommendations` - Course recommendations
- `GET /api/home/progress` - Learning progress
- `GET /api/ai/greeting` - AI greeting
- `GET /api/ai/motivation` - Motivational message

---

### 2. **Course Catalog** (`/cours`)
**Purpose**: Browse and enroll in courses

**Features**:
- Course grid/list view
- Filtering (category, level, duration, tier)
- Search functionality
- Course preview
- Enrollment button
- Progress indicator
- Rating display
- Favorites system

**Filters Available**:
- Level (A1, A2, B1, B2, C1, C2)
- Category (Grammar, Vocabulary, Listening, Speaking, etc.)
- Duration (5 min, 10 min, 20 min, etc.)
- Subscription tier (FREE, ESSENTIAL, PREMIUM, PRO)
- Rating (1-5 stars)

**Backend Integration**:
- `GET /api/courses` - List courses
- `GET /api/courses/:id` - Course details
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/:id/content` - Course content
- `GET /api/favorites` - Favorite courses

---

### 3. **Course Details** (`/cours/[id]`)
**Purpose**: View course content and progress

**Features**:
- Course overview
- Video/PDF content viewer
- Progress tracking
- Lesson list
- Comments section
- Like/share functionality
- Related courses
- Enrollment status

**Content Types**:
- Video lessons
- PDF materials
- Interactive exercises
- Downloadable resources

**Backend Integration**:
- `GET /api/courses/:id` - Course details
- `GET /api/course-content/:id` - Content
- `GET /api/comments?courseId=:id` - Comments
- `POST /api/comments` - Add comment
- `POST /api/likes` - Like course

---

### 4. **Tests** (`/tests`)
**Purpose**: Take and manage tests

**Features**:
- Test catalog
- Test filtering
- Test history
- Results tracking
- Performance analytics
- Certificate download
- Test retake

**Test Types**:
- TCF simulations
- TEF simulations
- Practice tests
- Diagnostic assessments
- Level assessments

**Backend Integration**:
- `GET /api/tests` - List tests
- `GET /api/tests/:id` - Test details
- `POST /api/tests/:id/start` - Start test
- `POST /api/tests/submit` - Submit answers
- `GET /api/tests/:id/results` - Test results

---

### 5. **Test Taking** (`/tests/take/[id]`)
**Purpose**: Interactive test interface

**Features**:
- Two-panel layout (questions + answers)
- Timer
- Progress indicator
- Question navigation
- Answer review
- Submit button
- Auto-save

**Question Types**:
- Multiple choice
- Fill-in-the-blank
- Listening comprehension
- Writing exercises
- Matching

**Backend Integration**:
- `POST /api/tests/:id/start` - Initialize test
- `POST /api/tests/submit` - Submit answers
- `GET /api/tests/:id/questions` - Get questions

---

### 6. **Test Results** (`/tests/results/[id]`)
**Purpose**: View test performance

**Features**:
- Score display
- Performance breakdown
- Correct/incorrect answers
- Time analysis
- Recommendations
- Certificate (if passed)
- Retake option

**Metrics Shown**:
- Overall score
- Percentage
- Time spent
- Correct answers count
- Incorrect answers count
- Skipped questions
- Performance by section

**Backend Integration**:
- `GET /api/tests/:id/results` - Test results
- `GET /api/certificates/:id` - Certificate

---

### 7. **Live Sessions** (`/live`)
**Purpose**: Join live instructor sessions

**Features**:
- Session calendar
- Session details
- Registration
- Join button
- Participant list
- Chat during session
- Recording access

**Backend Integration**:
- `GET /api/live-sessions` - List sessions
- `GET /api/live-sessions/:id` - Session details
- `POST /api/live-sessions/:id/register` - Register
- `GET /api/live-sessions/:id/participants` - Participants

---

### 8. **AI Chat** (`/ai-chat`)
**Purpose**: Chat with AI tutor

**Features**:
- Real-time chat
- Conversation history
- Quick suggestions
- Multi-language support
- Context awareness
- Source attribution

**Backend Integration**:
- `POST /api/ai-chat/send-message` - Send message
- `GET /api/ai-chat/history` - Chat history
- `GET /api/ai-chat/suggestions` - Quick suggestions

---

### 9. **Voice Simulation** (`/simulation-vocale`)
**Purpose**: Practice oral interviews

**Features**:
- Voice preference selection
- Booking system
- Voice session
- Performance scoring
- Detailed feedback
- Results tracking

**Backend Integration**:
- `POST /api/voice-simulation/book` - Book session
- `POST /api/voice-simulation/start` - Start session
- `GET /api/voice-simulation/results/:id` - Results

---

### 10. **Immigration Simulation** (`/immigration-simulations`)
**Purpose**: Practice immigration interviews

**Features**:
- Country selection
- Immigration type selection
- Personal info input
- AI-generated questions
- Response submission
- Analysis and feedback
- Report generation

**Backend Integration**:
- `POST /api/immigration-simulation/create` - Create session
- `POST /api/immigration-simulation/submit-response` - Submit response
- `GET /api/immigration-simulation/report/:id` - Get report

---

### 11. **TCF/TEF Simulation** (`/tcf-tef-simulation`)
**Purpose**: Full exam simulation

**Features**:
- Complete exam experience
- Real timing
- All question types
- Realistic conditions
- Detailed results
- Performance analysis

**Backend Integration**:
- `POST /api/simulations` - Create simulation
- `POST /api/simulations/:id/submit` - Submit simulation
- `GET /api/simulations/:id/results` - Results

---

### 12. **Profile** (`/profil`)
**Purpose**: Manage user profile

**Features**:
- Personal information
- Avatar upload
- Preferences
- Learning goals
- Privacy settings
- Account security

**Backend Integration**:
- `GET /api/users/:id` - User profile
- `PUT /api/users/:id` - Update profile
- `POST /api/users/:id/avatar` - Upload avatar

---

### 13. **Favorites** (`/favoris`)
**Purpose**: Manage favorite courses/tests

**Features**:
- Favorite list
- Quick access
- Remove from favorites
- Filter favorites

**Backend Integration**:
- `GET /api/favorites` - List favorites
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites/:id` - Remove favorite

---

### 14. **Notifications** (`/notifications`)
**Purpose**: View notifications

**Features**:
- Notification list
- Mark as read
- Delete notifications
- Notification preferences

**Backend Integration**:
- `GET /api/notifications` - List notifications
- `PUT /api/notifications/:id/read` - Mark as read

---

### 15. **Messages** (`/messages`)
**Purpose**: User messaging

**Features**:
- Message inbox
- Send messages
- Message threads
- Attachments

**Backend Integration**:
- `GET /api/messages` - List messages
- `POST /api/messages` - Send message
- `GET /api/messages/:id` - Message thread

---

### 16. **Settings** (`/settings`)
**Purpose**: User settings

**Features**:
- Account settings
- Notification preferences
- Privacy settings
- Language preference
- Theme preference

**Backend Integration**:
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

---

## 📊 Student Dashboard Metrics

- Total courses enrolled
- Courses completed
- Tests taken
- Average test score
- Current level
- Learning streak
- Achievements unlocked
- Time spent learning

---

## 🔌 Key Student API Endpoints

```
GET    /api/home/dashboard
GET    /api/courses
GET    /api/courses/:id
POST   /api/courses/:id/enroll
GET    /api/tests
POST   /api/tests/:id/start
POST   /api/tests/submit
GET    /api/tests/:id/results
GET    /api/live-sessions
POST   /api/live-sessions/:id/register
POST   /api/ai-chat/send-message
GET    /api/favorites
POST   /api/favorites
GET    /api/notifications
GET    /api/messages
POST   /api/messages
```

---

**Status**: ✅ STUDENT SECTION FULLY DOCUMENTED


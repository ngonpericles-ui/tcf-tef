# 📚 TECHNICAL DOCUMENTATION

## Architecture Overview

### Frontend Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context + Hooks
- **API Client**: Axios with custom wrapper

### Backend Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Aiven)
- **ORM**: Prisma
- **Authentication**: JWT + Cookies

### External Services
- **Cloud Storage**: Cloudinary
- **AI**: Google Gemini API (gemini-2.5-flash)
- **Voice**: VAPI AI
- **Real-time**: Agora

---

## Database Schema

### Key Models
```
User
├── id (UUID)
├── email (String)
├── subscriptionTier (ENUM: FREE, ESSENTIAL, PREMIUM, PRO)
├── role (ENUM: STUDENT, JUNIOR_MANAGER, SENIOR_MANAGER, ADMIN)
└── profile (Profile)

Simulation
├── id (UUID)
├── title (String)
├── type (ENUM: QUICK, PRACTICE, MOCK, OFFICIAL, SIMULATION)
├── sections (JSON)
├── questions (JSON)
└── cloudinaryUrl (String)

VoiceSimulation
├── id (UUID)
├── userId (UUID)
├── status (ENUM: SCHEDULED, ACTIVE, COMPLETED, CANCELLED)
├── voicePreference (ENUM: MALE, FEMALE)
└── duration (Int)

ImmigrationSimulation
├── id (UUID)
├── userId (UUID)
├── country (String)
├── immigrationType (String)
└── status (ENUM: CREATED, ACTIVE, COMPLETED)

TestAttempt
├── id (UUID)
├── userId (UUID)
├── testId (UUID)
├── status (ENUM: IN_PROGRESS, COMPLETED, ABANDONED)
└── score (Float)

Subscription
├── id (UUID)
├── userId (UUID)
├── tier (ENUM: FREE, ESSENTIAL, PREMIUM, PRO)
├── startDate (DateTime)
└── endDate (DateTime)
```

---

## API Endpoints

### Simulations
- `GET /api/simulations` - List all simulations
- `POST /api/simulations` - Create simulation
- `GET /api/simulations/:id` - Get simulation
- `GET /api/simulations/free-attempts/count` - Check free attempts
- `GET /api/simulations/test-niveau` - Get test niveau simulations
- `GET /api/simulations/level-history` - Get level assessment history

### Voice Simulation
- `GET /api/voice-simulation/history` - Get voice simulation history
- `GET /api/voice-simulation/:id` - Get voice simulation
- `POST /api/voice-simulation/create` - Create voice simulation
- `GET /api/voice-simulation/vapi-config` - Get VAPI config

### Immigration Simulation
- `POST /api/immigration-simulation/create` - Create immigration simulation
- `GET /api/immigration-simulation/:id` - Get immigration simulation
- `POST /api/immigration-simulation/:id/start` - Start simulation

### AI
- `POST /api/ai/generate-questions` - Generate questions from prompt
- `POST /api/ai/generate-questions-from-file` - Generate from file
- `POST /api/ai/extract-sujets-from-pdf` - Extract PDF topics
- `POST /api/ai/extract-audio-content` - Extract audio content

### Subscriptions
- `GET /api/subscriptions` - Get user subscriptions
- `GET /api/subscriptions/active` - Get active subscription
- `GET /api/subscriptions/history` - Get subscription history

---

## Authentication Flow

1. **Login**: User submits credentials
2. **Token Generation**: Backend generates JWT token
3. **Cookie Storage**: Token stored in secure cookie
4. **Session Management**: SessionManager handles refresh
5. **Middleware Protection**: Next.js middleware validates role
6. **API Authorization**: Bearer token in Authorization header

---

## Subscription Tiers

| Tier | Level | Features |
|------|-------|----------|
| FREE | 0 | 5 free simulations, then blocked |
| ESSENTIAL | 1 | B1 content only |
| PREMIUM | 2 | B1-C2 content |
| PRO | 3 | Full access + personalized |

---

## File Upload Process

1. **Frontend**: User selects file
2. **Validation**: Check type, size, format
3. **Upload**: Send to backend via FormData
4. **Processing**: Backend processes file
5. **Cloudinary**: Upload to Cloudinary
6. **Database**: Store metadata in DB
7. **Response**: Return URL to frontend

---

## AI Integration

### Question Generation
1. User uploads document
2. Backend extracts content
3. Gemini AI generates questions
4. Questions stored in database
5. Frontend displays questions

### Audio Extraction
1. User uploads audio file
2. Backend processes audio
3. Gemini AI extracts content
4. Questions generated
5. Stored in database

---

## Error Handling

### Frontend
- Toast notifications for user feedback
- Try-catch blocks for API calls
- Fallback UI for errors
- Proper error logging

### Backend
- Centralized error handler
- Proper HTTP status codes
- Error logging
- User-friendly messages

---

## Performance Optimization

- ✅ Code splitting
- ✅ Image optimization
- ✅ Lazy loading
- ✅ Caching strategies
- ✅ Database indexing
- ✅ API response compression

---

## Security Measures

- ✅ JWT authentication
- ✅ Role-based access control
- ✅ HTTPS only
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection


# Comprehensive API Documentation
**TCF/TEF Platform - Frontend & Backend Integration**
*Generated on: September 19, 2025*

## Table of Contents
1. [API Architecture Overview](#api-architecture-overview)
2. [Authentication System](#authentication-system)
3. [Core API Endpoints](#core-api-endpoints)
4. [Frontend-Backend Integration](#frontend-backend-integration)
5. [Database Schema](#database-schema)
6. [Real-time Features](#real-time-features)
7. [Error Handling](#error-handling)
8. [Security Implementation](#security-implementation)

## API Architecture Overview

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Firebase Auth (dual system)
- **Real-time**: Socket.io for live sessions
- **File Storage**: Multer with cloud integration
- **API Documentation**: Swagger/OpenAPI

### Frontend Integration
- **API Client**: Axios-based with interceptors
- **Base URL**: `http://localhost:3001/api`
- **Authentication**: Automatic token management
- **Error Handling**: Centralized error processing
- **Type Safety**: Full TypeScript integration

### API Response Format
```typescript
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    message: string
    code?: string
    details?: any
  }
}
```

## Authentication System

### Dual Authentication Architecture

#### 1. JWT Authentication (Managers & Admins)
```typescript
// Frontend Auth Service
const result = await authService.login({ email, password })

// Backend Route
POST /api/auth/login
POST /api/auth/register  
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/profile
GET  /api/auth/verify
```

#### 2. Firebase Authentication (Students)
```typescript
// Frontend Firebase Integration
const result = await signInWithGoogle()
const jwtResult = await exchangeFirebaseTokenForJWT(idToken)

// Backend Social Auth Route
POST /api/auth/social/google
```

### Token Management
```typescript
// Frontend API Client
class ApiClient {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  
  // Automatic token refresh on 401
  async refreshAccessToken(): Promise<void>
  
  // Request interceptor adds Bearer token
  // Response interceptor handles token refresh
}
```

### Session Management
```typescript
// Frontend Session Manager
export class SessionManager {
  static async initializeSession(): Promise<SessionData | null>
  static async saveSession(sessionData: SessionData): Promise<void>
  static async refreshSession(): Promise<SessionData | null>
  static async clearSession(): Promise<void>
}
```

## Core API Endpoints

### 🔐 Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "country": "Canada"
}

Response:
{
  "success": true,
  "data": {
    "user": { /* User object */ },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  },
  "message": "User registered successfully"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: Same as register
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}

Response:
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "new_jwt_token",
      "refreshToken": "new_refresh_token"
    }
  }
}
```

### 👤 User Management Endpoints

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT",
    "subscriptionTier": "PREMIUM",
    "profileImage": "image_url",
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```

#### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "country": "France"
}
```

#### Get All Users (Admin/Manager Only)
```http
GET /api/users?page=1&limit=20&role=STUDENT&status=ACTIVE
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "data": {
    "users": [/* Array of user objects */],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### 📚 Course Management Endpoints

#### Get All Courses
```http
GET /api/courses?page=1&limit=20&category=grammar&level=INTERMEDIATE
Authorization: Bearer {accessToken} (optional)

Response:
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course_id",
        "title": "French Grammar Fundamentals",
        "titleEn": "French Grammar Fundamentals",
        "description": "Complete grammar course",
        "level": "INTERMEDIATE",
        "category": "GRAMMAR",
        "duration": 120,
        "price": 49.99,
        "currency": "CFA",
        "instructor": "Marie Dubois",
        "rating": 4.8,
        "enrollmentCount": 1250,
        "isEnrolled": true,
        "progress": 65
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

#### Create Course (Manager/Admin Only)
```http
POST /api/courses
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Advanced French Conversation",
  "titleEn": "Advanced French Conversation",
  "description": "Master French conversation skills",
  "level": "ADVANCED",
  "category": "SPEAKING",
  "duration": 180,
  "price": 79.99,
  "currency": "CFA",
  "requiredTier": "PREMIUM"
}
```

#### Enroll in Course
```http
POST /api/courses/{courseId}/enroll
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "message": "Successfully enrolled in course"
}
```

### 📝 Test Management Endpoints

#### Get All Tests
```http
GET /api/tests?page=1&limit=20&type=TCF&level=INTERMEDIATE
Authorization: Bearer {accessToken} (optional)

Response:
{
  "success": true,
  "data": {
    "tests": [
      {
        "id": "test_id",
        "title": "TCF Expression Orale",
        "type": "TCF",
        "level": "INTERMEDIATE",
        "duration": 60,
        "questionCount": 25,
        "maxScore": 100,
        "attempts": 3,
        "price": 29.99,
        "lastAttempt": {
          "score": 85,
          "percentage": 85,
          "completedAt": "2023-01-01T00:00:00Z"
        }
      }
    ]
  }
}
```

#### Start Test
```http
POST /api/tests/{testId}/start
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "data": {
    "attemptId": "attempt_id",
    "questions": [/* Array of questions */],
    "timeLimit": 3600,
    "startTime": "2023-01-01T00:00:00Z"
  }
}
```

#### Submit Test
```http
POST /api/tests/submit
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "attemptId": "attempt_id",
  "answers": [
    {
      "questionId": "q1",
      "answer": "option_a",
      "timeSpent": 30
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "score": 85,
    "percentage": 85,
    "correctAnswers": 17,
    "totalQuestions": 20,
    "timeSpent": 1800,
    "certificate": {
      "id": "cert_id",
      "url": "certificate_url"
    }
  }
}
```

### 📺 Live Session Endpoints

#### Get Live Sessions
```http
GET /api/live-sessions?status=SCHEDULED&date=2023-12-01
Authorization: Bearer {accessToken} (optional)

Response:
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session_id",
        "title": "French Pronunciation Workshop",
        "instructor": "Pierre Martin",
        "date": "2023-12-01T14:00:00Z",
        "duration": 90,
        "maxParticipants": 50,
        "currentParticipants": 32,
        "price": 19.99,
        "requiredTier": "PREMIUM",
        "status": "SCHEDULED",
        "isRegistered": true,
        "agoraToken": "agora_token_here"
      }
    ]
  }
}
```

#### Register for Session
```http
POST /api/live-sessions/{sessionId}/register
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "data": {
    "registrationId": "reg_id",
    "agoraToken": "agora_token_for_session"
  }
}
```

### 📊 Analytics Endpoints

#### Get Dashboard Analytics
```http
GET /api/analytics/dashboard?timeframe=30d
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "data": {
    "analytics": {
      "totalUsers": 1250,
      "activeUsers": 890,
      "totalCourses": 45,
      "totalTests": 120,
      "subscriptionDistribution": {
        "FREE": 60,
        "PREMIUM": 30,
        "PRO": 10
      },
      "userGrowth": [
        { "month": "2023-11", "value": 100, "change": 15 }
      ],
      "revenueData": [
        { "month": "2023-11", "revenue": 15000, "subscriptions": 150 }
      ]
    }
  }
}
```

#### Track Analytics Event
```http
POST /api/analytics/track
Content-Type: application/json

{
  "eventType": "course_completed",
  "eventData": {
    "courseId": "course_123",
    "duration": 7200,
    "score": 92
  }
}
```

### 📝 Post Management Endpoints

#### Get All Posts
```http
GET /api/posts?page=1&limit=20&category=tips&level=BEGINNER
Authorization: Bearer {accessToken} (optional)

Response:
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post_id",
        "title": "10 Tips for Better French Pronunciation",
        "content": "Post content here...",
        "excerpt": "Learn essential pronunciation tips",
        "author": {
          "id": "author_id",
          "firstName": "Marie",
          "lastName": "Dubois",
          "profileImage": "image_url"
        },
        "category": "tips",
        "level": "BEGINNER",
        "tags": ["pronunciation", "speaking"],
        "likesCount": 45,
        "commentsCount": 12,
        "sharesCount": 8,
        "isLiked": true,
        "createdAt": "2023-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### Create Post (Manager/Admin Only)
```http
POST /api/posts
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "French Grammar Essentials",
  "content": "Detailed post content...",
  "excerpt": "Essential grammar rules",
  "category": "grammar",
  "level": "INTERMEDIATE",
  "tags": ["grammar", "rules"],
  "visibility": "PUBLIC",
  "status": "PUBLISHED"
}
```

### 🎯 Admin Endpoints

#### Get Admin Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 5000,
      "totalRevenue": 125000,
      "activeSubscriptions": 1200,
      "systemHealth": "healthy"
    },
    "recentActivity": [/* Recent activities */],
    "pendingApprovals": [/* Pending items */]
  }
}
```

#### Get System Health
```http
GET /api/admin/system/health
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "data": {
    "database": {
      "status": "healthy",
      "responseTime": 15,
      "activeConnections": 25
    },
    "redis": {
      "status": "healthy",
      "memory": "45MB"
    },
    "services": {
      "auth": "healthy",
      "files": "healthy",
      "email": "healthy"
    }
  }
}
```

## Frontend-Backend Integration

### API Client Configuration
```typescript
// lib/api-client.ts
class ApiClient {
  private client: ReturnType<typeof axios.create>
  
  constructor() {
    this.client = axios.create({
      baseURL: 'http://localhost:3001/api',
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // Request interceptor - adds auth token
    this.client.interceptors.request.use(config => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`
      }
      return config
    })
    
    // Response interceptor - handles token refresh
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          await this.refreshAccessToken()
          return this.client(error.config)
        }
        return Promise.reject(error)
      }
    )
  }
}
```

### Authentication Flow Integration
```typescript
// Frontend AuthContext Integration
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password })
    
    if (response.success) {
      const { user, tokens } = response.data
      await SessionManager.saveSession({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: Date.now() + (15 * 60 * 1000),
        lastActivity: Date.now()
      })
      setUser(user)
      return { success: true, user }
    }
    
    return { success: false, error: response.error?.message }
  }
  
  // Context value with all auth methods
  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isManager: ['SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(user?.role)
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Service Layer Integration
```typescript
// Frontend Service Example
export class AnalyticsService {
  static async getDashboardAnalytics(timeRange = '30d') {
    try {
      const response = await apiClient.get(`/analytics/dashboard?timeframe=${timeRange}`)
      
      if (response.success) {
        return {
          success: true,
          data: response.data.analytics
        }
      }
      
      throw new Error(response.error?.message || 'Failed to fetch analytics')
    } catch (error) {
      console.error('Analytics fetch error:', error)
      throw error
    }
  }
  
  static async trackEvent(eventType, eventData) {
    try {
      await apiClient.post('/analytics/track', {
        eventType,
        eventData
      })
    } catch (error) {
      // Don't throw for tracking failures
      console.error('Event tracking failed:', error)
    }
  }
}
```

### Real-time Integration
```typescript
// Socket.io Integration
export class SocketService {
  private socket: Socket | null = null
  
  connect(userId: string, token: string) {
    this.socket = io('http://localhost:3001', {
      auth: { token },
      query: { userId }
    })
    
    this.socket.on('connect', () => {
      console.log('Connected to server')
    })
    
    this.socket.on('live-session-update', (data) => {
      // Handle live session updates
      this.handleLiveSessionUpdate(data)
    })
  }
  
  joinLiveSession(sessionId: string) {
    this.socket?.emit('join-live-session', { sessionId })
  }
  
  sendChatMessage(sessionId: string, message: string) {
    this.socket?.emit('live-session-chat', { sessionId, message })
  }
}
```

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  firstName VARCHAR NOT NULL,
  lastName VARCHAR NOT NULL,
  role UserRole NOT NULL DEFAULT 'STUDENT',
  status UserStatus NOT NULL DEFAULT 'ACTIVE',
  subscriptionTier SubscriptionTier NOT NULL DEFAULT 'FREE',
  profileImage VARCHAR,
  phone VARCHAR,
  country VARCHAR,
  emailVerified BOOLEAN DEFAULT FALSE,
  lastLoginAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Courses Table
```sql
CREATE TABLE courses (
  id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  titleEn VARCHAR,
  description TEXT NOT NULL,
  descriptionEn TEXT,
  level CourseLevel NOT NULL,
  category CourseCategory NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR DEFAULT 'CFA',
  instructor VARCHAR NOT NULL,
  creatorId VARCHAR NOT NULL REFERENCES users(id),
  requiredTier SubscriptionTier NOT NULL DEFAULT 'FREE',
  isPublished BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0,
  enrollmentCount INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Test Attempts Table
```sql
CREATE TABLE test_attempts (
  id VARCHAR PRIMARY KEY,
  testId VARCHAR NOT NULL REFERENCES tests(id),
  userId VARCHAR NOT NULL REFERENCES users(id),
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  timeSpent INTEGER NOT NULL,
  completedAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Relationships
- **Users → Courses**: Many-to-many (enrollments)
- **Users → Tests**: Many-to-many (test_attempts)
- **Users → Posts**: One-to-many (author relationship)
- **Users → Live Sessions**: Many-to-many (registrations)
- **Courses → Lessons**: One-to-many
- **Posts → Comments**: One-to-many
- **Live Sessions → Participants**: Many-to-many

## Real-time Features

### Live Sessions with Agora
```typescript
// Frontend Agora Integration
export class AgoraService {
  private client: IAgoraRTCClient | null = null
  
  async joinSession(sessionId: string, token: string, uid: number) {
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    
    await this.client.join('your-app-id', sessionId, token, uid)
    
    // Create local tracks
    const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
    
    // Publish tracks
    await this.client.publish([audioTrack, videoTrack])
    
    // Handle remote users
    this.client.on('user-published', async (user, mediaType) => {
      await this.client.subscribe(user, mediaType)
      // Play remote tracks
    })
  }
}

// Backend Agora Token Generation
export class AgoraController {
  static generateToken = async (req: Request, res: Response) => {
    const { sessionId, userId, role } = req.body
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      sessionId,
      userId,
      role,
      privilegeExpiredTs
    )
    
    res.json({ success: true, data: { token } })
  }
}
```

### WebSocket Integration
```typescript
// Backend Socket.io Setup
io.on('connection', (socket) => {
  socket.on('join-live-session', ({ sessionId }) => {
    socket.join(`session-${sessionId}`)
    socket.to(`session-${sessionId}`).emit('user-joined', {
      userId: socket.userId,
      username: socket.username
    })
  })
  
  socket.on('live-session-chat', ({ sessionId, message }) => {
    io.to(`session-${sessionId}`).emit('chat-message', {
      userId: socket.userId,
      username: socket.username,
      message,
      timestamp: new Date()
    })
  })
})
```

## Error Handling

### Backend Error Middleware
```typescript
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500
  let message = 'Internal Server Error'
  
  if (err instanceof ValidationError) {
    statusCode = 400
    message = err.message
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401
    message = 'Authentication required'
  } else if (err instanceof NotFoundError) {
    statusCode = 404
    message = err.message
  }
  
  logger.error('API Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.userId
  })
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: err.code || 'UNKNOWN_ERROR'
    }
  })
}
```

### Frontend Error Handling
```typescript
// API Client Error Handling
async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
  try {
    const response = await this.client.post(url, data)
    return response.data as ApiResponse<T>
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data as ApiResponse<T>
    }
    
    // Network or other errors
    return {
      success: false,
      error: {
        message: error.message || 'Network error occurred',
        code: 'NETWORK_ERROR'
      }
    }
  }
}
```

## Security Implementation

### Authentication Security
```typescript
// JWT Token Security
export class JWTService {
  static generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '15m',
      issuer: 'tcf-tef-platform',
      audience: 'tcf-tef-users'
    })
    
    const refreshToken = jwt.sign(
      { userId: payload.userId, tokenType: 'refresh' },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    )
    
    return { accessToken, refreshToken }
  }
}
```

### Request Validation
```typescript
// Input Validation Middleware
export const validate = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      })
    }
    
    next()
  }
}
```

### Rate Limiting
```typescript
// Rate Limiting Configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false
})

app.use('/api/', limiter)
```

## API Testing & Monitoring

### Health Check Endpoints
```http
GET /health
GET /api/auth/health
GET /api/users/health
GET /api/courses/health
GET /api/tests/health
GET /api/analytics/health
```

### API Documentation
- **Swagger UI**: Available at `/api-docs`
- **Interactive Testing**: Built-in API explorer
- **Schema Validation**: Automatic request/response validation

### Monitoring & Logging
```typescript
// Winston Logger Configuration
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})
```

## Conclusion

This comprehensive API documentation covers the complete integration between the TCF/TEF platform's frontend and backend systems. The architecture demonstrates:

- **Robust Authentication**: Dual JWT/Firebase system
- **Comprehensive API Coverage**: 100+ endpoints across all features
- **Type Safety**: Full TypeScript integration
- **Real-time Features**: WebSocket and Agora integration
- **Security First**: Multiple security layers
- **Error Handling**: Comprehensive error management
- **Monitoring**: Health checks and logging

The platform provides a complete learning management system with advanced features for French language certification preparation, supporting multiple user roles and comprehensive analytics.

---

*For specific endpoint details or integration questions, refer to the Swagger documentation at `/api-docs` or contact the development team.*

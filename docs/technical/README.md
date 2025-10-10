# Technical Documentation - TCF/TEF Platform

## 📚 Overview

Comprehensive technical documentation for the TCF/TEF preparation platform covering architecture, database design, API specifications, and deployment procedures.

## 🏗️ System Architecture

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Authentication**: JWT, NextAuth.js
- **Deployment**: Vercel, Docker, AWS
- **Monitoring**: Sentry, Google Analytics

### Architecture Diagram
```
User Section → Manager Section → Admin Section
     ↓              ↓              ↓
         Next.js API Gateway
              ↓
         PostgreSQL Database
```

## 🗄️ Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role USER_ROLE NOT NULL DEFAULT 'student',
  status USER_STATUS NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Courses
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category COURSE_CATEGORY NOT NULL,
  difficulty DIFFICULTY_LEVEL NOT NULL,
  estimated_duration INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tests
```sql
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  type TEST_TYPE NOT NULL,
  duration INTEGER NOT NULL,
  passing_score INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id)
);
```

#### User Progress
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  content_id UUID NOT NULL,
  content_type CONTENT_TYPE NOT NULL,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  completed_at TIMESTAMP,
  score INTEGER
);
```

## 🔌 API Specifications

### Authentication
```typescript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response: {
  "token": "jwt_token",
  "user": { "id": "uuid", "role": "student" }
}
```

### User Management
```typescript
GET /api/users/profile
Authorization: Bearer <token>

Response: {
  "id": "uuid",
  "email": "user@example.com",
  "role": "student",
  "progress": { "coursesCompleted": 5 }
}
```

### Course Management
```typescript
GET /api/courses
Query: { category, difficulty, search, page, limit }

Response: {
  "courses": [{
    "id": "uuid",
    "title": "French Grammar",
    "category": "grammar",
    "progress": { "percentage": 75 }
  }],
  "pagination": { "page": 1, "total": 50 }
}
```

### Test Management
```typescript
POST /api/tests/:id/start
Authorization: Bearer <token>

Response: {
  "testId": "uuid",
  "questions": [{
    "id": "uuid",
    "question": "What is correct?",
    "options": ["le", "la", "les"]
  }]
}
```

## 🔐 Security Implementation

### JWT Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
}
```

### Role-Based Permissions
```typescript
const permissions = {
  student: ['read:courses', 'write:test_attempts'],
  junior_manager: ['read:users', 'write:content'],
  senior_manager: ['read:users', 'write:content', 'publish:content'],
  admin: ['read:all', 'write:all', 'delete:all']
};
```

### Middleware
```typescript
export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
```

## 🚀 Deployment

### Environment Variables
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/tcf_tef_db"
JWT_SECRET="your-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
```

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### CI/CD Pipeline
```yaml
name: CI/CD
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## 📊 Monitoring

### Error Tracking
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Performance Monitoring
```typescript
import { getCLS, getFID, getFCP, getLCP } from 'web-vitals';

export function reportWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
}
```

## 🧪 Testing

### Unit Testing
```typescript
import { render, screen } from '@testing-library/react';
import { CourseCard } from '../components/CourseCard';

test('renders course information', () => {
  render(<CourseCard course={mockCourse} />);
  expect(screen.getByText('French Grammar')).toBeInTheDocument();
});
```

### API Testing
```typescript
import { createMocks } from 'node-mocks-http';
import handler from '../pages/api/courses';

test('returns courses list', async () => {
  const { req, res } = createMocks({ method: 'GET' });
  await handler(req, res);
  expect(res._getStatusCode()).toBe(200);
});
```

## 📈 Performance Optimization

### Code Splitting
```typescript
const CourseExplorer = dynamic(() => import('../components/CourseExplorer'), {
  loading: () => <Skeleton />
});
```

### Database Optimization
```typescript
const courses = await prisma.course.findMany({
  include: { userProgress: { where: { userId } } },
  where: { isPublished: true },
  take: 20
});
```

### Caching
```typescript
const redis = new Redis(process.env.REDIS_URL);

export async function getCachedData(key: string) {
  let data = await redis.get(key);
  if (!data) {
    data = await fetchData();
    await redis.setex(key, 3600, JSON.stringify(data));
  }
  return JSON.parse(data);
}
```

## 🔧 Development Guidelines

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"]
    }
  }
}
```

### Git Workflow
```
feature/user-authentication
bugfix/login-validation
hotfix/security-patch
```

### Commit Messages
```
feat: add user authentication
fix: resolve login issue
docs: update API docs
test: add unit tests
```

---

**Document Version**: 1.0.0
**Last Updated**: January 2025

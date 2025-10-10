# Development Guide - TCF/TEF Platform

## 📚 Overview

Complete development guide for setting up, developing, testing, and contributing to the TCF/TEF preparation platform.

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 18.0.0+
- **pnpm**: 8.0.0+ (or npm 9.0.0+)
- **PostgreSQL**: 15.0+
- **Git**: 2.30.0+

### Installation

1. **Clone repository**
```bash
git clone https://github.com/your-org/tcf-tef-platform.git
cd tcf-tef-platform
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Setup environment**
```bash
cp .env.example .env.local
# Configure your environment variables
```

4. **Setup database**
```bash
pnpm db:migrate
pnpm db:seed
```

5. **Start development**
```bash
pnpm dev
```

6. **Open browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
tcf-tef-platform/
├── app/                    # Next.js 13+ app directory
│   ├── admin/             # Admin section
│   ├── manager/           # Manager section
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── forms/            # Form components
├── lib/                  # Utility functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript definitions
├── prisma/               # Database schema
└── docs/                 # Documentation
```

## 🔧 Development Workflow

### Code Style

#### TypeScript
```typescript
interface ComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export function Component({ title, description, onAction }: ComponentProps) {
  return (
    <div className="component">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {onAction && <button onClick={onAction}>Action</button>}
    </div>
  );
}
```

#### API Routes
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await fetchData();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);
```

### Git Workflow

#### Branch Naming
```
feature/user-authentication
bugfix/login-validation
hotfix/security-patch
```

#### Commit Messages
```
feat(auth): add user authentication system
fix(api): resolve login validation issue
docs(readme): update installation instructions
test(components): add unit tests for CourseCard
```

## 🧪 Testing

### Running Tests
```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e
```

### Writing Tests

#### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseCard } from '../components/CourseCard';

describe('CourseCard', () => {
  const mockCourse = {
    id: '1',
    title: 'French Grammar',
    category: 'grammar'
  };

  it('renders course information', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('French Grammar')).toBeInTheDocument();
  });

  it('handles enrollment click', () => {
    const mockEnroll = jest.fn();
    render(<CourseCard course={mockCourse} onEnroll={mockEnroll} />);
    
    fireEvent.click(screen.getByText('Enroll'));
    expect(mockEnroll).toHaveBeenCalledWith('1');
  });
});
```

#### API Testing
```typescript
import { createMocks } from 'node-mocks-http';
import handler from '../pages/api/courses';

describe('/api/courses', () => {
  it('returns courses list', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
  });
});
```

## 🗄️ Database Management

### Prisma Setup

#### Schema Example
```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  firstName String
  lastName  String
  role      UserRole @default(STUDENT)
  createdAt DateTime @default(now())
}

enum UserRole {
  STUDENT
  JUNIOR_MANAGER
  SENIOR_MANAGER
  ADMIN
}
```

#### Database Commands
```bash
# Generate client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Reset database
pnpm prisma migrate reset

# Open Prisma Studio
pnpm prisma studio
```

## 🔐 Authentication

### NextAuth.js Setup
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Your authentication logic
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (token) session.user.role = token.role;
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

## 🎨 Styling

### Tailwind CSS
```typescript
// Component with Tailwind classes
export function Button({ children, variant = 'default' }: ButtonProps) {
  return (
    <button className={cn(
      "px-4 py-2 rounded-md font-medium transition-colors",
      variant === 'default' && "bg-blue-600 text-white hover:bg-blue-700",
      variant === 'secondary' && "bg-gray-200 text-gray-900 hover:bg-gray-300"
    )}>
      {children}
    </button>
  );
}
```

## 📦 Scripts

### Available Commands
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  }
}
```

## 🚀 Deployment

### Environment Variables
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/database"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
```

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main

### Docker Deployment
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

## 🐛 Debugging

### Common Issues

#### Database Connection
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Reset Prisma
pnpm prisma generate
```

#### Build Issues
```bash
# Clear cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

#### Authentication Issues
- Check environment variables
- Clear browser cookies
- Check network tab for errors

### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

## 📚 Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)

### Tools
- [VS Code](https://code.visualstudio.com)
- [Postman](https://www.postman.com)
- [Prisma Studio](https://www.prisma.io/studio)
- [Playwright](https://playwright.dev)

---

**Document Version**: 1.0.0
**Last Updated**: January 2025

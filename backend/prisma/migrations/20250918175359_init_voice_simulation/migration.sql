-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'ESSENTIAL', 'PREMIUM', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "CourseCategory" AS ENUM ('GRAMMAR', 'LISTENING', 'READING', 'VOCABULARY', 'WRITING', 'ORAL', 'TCF_TEF');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('QUICK', 'PRACTICE', 'MOCK', 'OFFICIAL', 'SIMULATION');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TestAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LiveSessionStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VoiceType" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "VoiceSimulationStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('MANUAL', 'AUTO');

-- CreateEnum
CREATE TYPE "TestLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('GENERAL', 'IMMIGRATION', 'WORK', 'DAILY_LIFE', 'ACADEMIC', 'BUSINESS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR', 'REMINDER');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('COURSE', 'TEST', 'LIVE_SESSION', 'DOCUMENT', 'VIDEO', 'AUDIO', 'POST');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'SUBSCRIBERS_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "ApprovalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "profileImage" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "country" TEXT,
    "city" TEXT,
    "bio" TEXT,
    "preferences" JSONB,
    "lastLoginAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "emailVerifiedAt" TIMESTAMP(3),
    "socialAuthProvider" TEXT,
    "socialAuthId" TEXT,
    "profilePicture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "paymentMethod" TEXT,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "description" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "level" "CourseLevel" NOT NULL,
    "category" "CourseCategory" NOT NULL,
    "requiredTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "duration" INTEGER NOT NULL,
    "lessons" INTEGER NOT NULL DEFAULT 0,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "image" TEXT,
    "price" DOUBLE PRECISION DEFAULT 0,
    "thumbnail" TEXT,
    "tags" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "enrolledCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_lessons" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "videoUrl" TEXT,
    "materials" TEXT,
    "resources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAccessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "description" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "type" "TestType" NOT NULL,
    "level" "CourseLevel" NOT NULL,
    "category" "CourseCategory" NOT NULL,
    "requiredTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "duration" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "passingScore" INTEGER NOT NULL DEFAULT 60,
    "maxAttempts" INTEGER,
    "tags" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "status" "TestStatus" NOT NULL DEFAULT 'DRAFT',
    "aiPowered" BOOLEAN NOT NULL DEFAULT false,
    "hasAIFeedback" BOOLEAN NOT NULL DEFAULT false,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completionCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_questions" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionTextEn" TEXT,
    "type" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" JSONB NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "explanation" TEXT,
    "explanationEn" TEXT,
    "order" INTEGER NOT NULL,
    "level" "CourseLevel" NOT NULL,
    "category" "CourseCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "status" "TestAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "timeSpent" INTEGER,
    "answers" JSONB,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_question_answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_question_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "description" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "instructor" TEXT NOT NULL,
    "coInstructors" TEXT[],
    "date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CFA',
    "requiredTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "status" "LiveSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "meetingUrl" TEXT,
    "recordingUrl" TEXT,
    "image" TEXT,
    "tags" TEXT[],
    "level" "CourseLevel",
    "category" "CourseCategory",
    "notifyFollowers" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_session_participants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "liveSessionId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attended" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "live_session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "message" TEXT NOT NULL,
    "messageEn" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT,
    "actionUrl" TEXT,
    "imageUrl" TEXT,
    "data" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "progressPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "lastAccessAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "badgeColor" TEXT NOT NULL DEFAULT 'blue',
    "requirements" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "maxProgress" INTEGER NOT NULL DEFAULT 100,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "folder" TEXT,
    "tags" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CFA',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL,
    "transactionId" TEXT,
    "paymentGateway" TEXT,
    "stripePaymentIntentId" TEXT,
    "type" TEXT,
    "metadata" JSONB,
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "media" TEXT,
    "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "PostStatus" NOT NULL DEFAULT 'PUBLISHED',
    "authorId" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT[],
    "objectives" TEXT[],
    "keyPoints" TEXT[],
    "level" "CourseLevel",
    "targetTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shares" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentSection" TEXT,
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "questions" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "timeRemaining" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "score" INTEGER,
    "percentage" DOUBLE PRECISION,
    "levelAchieved" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "immigration_simulations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "immigrationType" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "personalInfo" TEXT NOT NULL,
    "questions" TEXT NOT NULL,
    "responses" TEXT NOT NULL,
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL,
    "finalScore" INTEGER,
    "finalReport" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "immigration_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "questions" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "timeRemaining" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "score" INTEGER,
    "percentage" DOUBLE PRECISION,
    "levelAchieved" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "test_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "duration" INTEGER,
    "videoUrl" TEXT,
    "materials" TEXT,
    "resources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speech_analysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "transcription" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "teacherResponse" TEXT,
    "analysisData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speech_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_simulations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "voicePreference" "VoiceType" NOT NULL DEFAULT 'FEMALE',
    "status" "VoiceSimulationStatus" NOT NULL DEFAULT 'SCHEDULED',
    "vapiSessionId" TEXT,
    "questionsData" JSONB,
    "resultsData" JSONB,
    "overallScore" DOUBLE PRECISION,
    "fluencyScore" DOUBLE PRECISION,
    "grammarScore" DOUBLE PRECISION,
    "vocabularyScore" DOUBLE PRECISION,
    "pronunciationScore" DOUBLE PRECISION,
    "coherenceScore" DOUBLE PRECISION,
    "feedback" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 420,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingType" "BookingType" NOT NULL DEFAULT 'MANUAL',
    "preferredDates" JSONB,
    "assignedDate" TIMESTAMP(3),
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulation_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_banks" (
    "id" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pdfUrl" TEXT,
    "extractedQuestions" JSONB,
    "level" "TestLevel" NOT NULL DEFAULT 'B1',
    "category" "QuestionCategory" NOT NULL DEFAULT 'GENERAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "testId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT,
    "score" INTEGER,
    "percentage" DOUBLE PRECISION,
    "courseName" TEXT,
    "testName" TEXT,
    "instructorName" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "certificateUrl" TEXT,
    "verificationCode" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAccessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "category" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_comments" (
    "id" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "ApprovalPriority" NOT NULL DEFAULT 'MEDIUM',
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blacklisted_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "blacklistedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blacklisted_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_status_role_subscriptionTier_createdAt_idx" ON "users"("status", "role", "subscriptionTier", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "courses_createdAt_idx" ON "courses"("createdAt");

-- CreateIndex
CREATE INDEX "courses_isPublished_createdAt_idx" ON "courses"("isPublished", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_userId_courseId_key" ON "course_enrollments"("userId", "courseId");

-- CreateIndex
CREATE INDEX "tests_isPublished_createdAt_idx" ON "tests"("isPublished", "createdAt");

-- CreateIndex
CREATE INDEX "tests_status_createdAt_idx" ON "tests"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "test_question_answers_attemptId_questionId_key" ON "test_question_answers"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "live_session_participants_userId_liveSessionId_key" ON "live_session_participants"("userId", "liveSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_notifications_userId_notificationId_key" ON "user_notifications"("userId", "notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_userId_contentId_contentType_key" ON "user_progress"("userId", "contentId", "contentType");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_contentId_contentType_key" ON "favorites"("userId", "contentId", "contentType");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "payments"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_postId_key" ON "likes"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_commentId_key" ON "likes"("userId", "commentId");

-- CreateIndex
CREATE INDEX "simulations_createdAt_idx" ON "simulations"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_userId_lessonId_key" ON "lesson_progress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verificationCode_key" ON "certificates"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_userId_courseId_key" ON "enrollments"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_completions_userId_lessonId_key" ON "lesson_completions"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "files_createdAt_idx" ON "files"("createdAt");

-- CreateIndex
CREATE INDEX "files_mimeType_createdAt_idx" ON "files"("mimeType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "blacklisted_tokens_token_key" ON "blacklisted_tokens"("token");

-- CreateIndex
CREATE INDEX "blacklisted_tokens_expiresAt_idx" ON "blacklisted_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "blacklisted_tokens_userId_expiresAt_idx" ON "blacklisted_tokens"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_question_answers" ADD CONSTRAINT "test_question_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_question_answers" ADD CONSTRAINT "test_question_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "test_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_participants" ADD CONSTRAINT "live_session_participants_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_participants" ADD CONSTRAINT "live_session_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_course_fkey" FOREIGN KEY ("contentId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_lesson_fkey" FOREIGN KEY ("contentId") REFERENCES "course_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_course_fkey" FOREIGN KEY ("contentId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_session_fkey" FOREIGN KEY ("contentId") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_post_fkey" FOREIGN KEY ("contentId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_test_fkey" FOREIGN KEY ("contentId") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "immigration_simulations" ADD CONSTRAINT "immigration_simulations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_sessions" ADD CONSTRAINT "test_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speech_analysis" ADD CONSTRAINT "speech_analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_simulations" ADD CONSTRAINT "voice_simulations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_bookings" ADD CONSTRAINT "simulation_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_comments" ADD CONSTRAINT "approval_comments_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "approvals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_comments" ADD CONSTRAINT "approval_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklisted_tokens" ADD CONSTRAINT "blacklisted_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

import { prisma } from '@/database/connection';
import { 
  NotFoundError, 
  ValidationError, 
  ConflictError,
  AuthorizationError 
} from '@/middleware/errorHandler';
import { 
  TestWithDetails,
  CreateTestRequest,
  StartTestResponse,
  SubmitTestRequest,
  TestQuestion,
  PaginationParams,
  FilterParams
} from '@/types';
import { UserRole, SubscriptionTier, TestAttemptStatus, TestStatus } from '@prisma/client';
import { logger } from '@/utils/logger';

export class TestService {
  /**
   * Create a new test (Manager/Admin only)
   */
  static async createTest(
    testData: CreateTestRequest,
    createdById: string,
    creatorRole: UserRole
  ): Promise<TestWithDetails> {
    try {
      // Check authorization
      if (![UserRole.ADMIN, UserRole.SENIOR_MANAGER, UserRole.JUNIOR_MANAGER].includes(creatorRole as any)) {
        throw new AuthorizationError('Access denied. Manager role required.');
      }

      // Create test
      const test = await prisma.test.create({
        data: {
          ...testData,
          createdById,
          status: TestStatus.DRAFT
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          questions: true,
          attempts: true
        }
      });

      logger.info('Test created successfully', { 
        testId: test.id, 
        title: test.title,
        createdById 
      });

      return test;
    } catch (error) {
      logger.error('Failed to create test', { testData, createdById, error });
      throw error;
    }
  }

  /**
   * Get test by ID
   */
  static async getTestById(
    testId: string, 
    userId?: string
  ): Promise<TestWithDetails> {
    try {
      const test = await prisma.test.findUnique({
        where: { id: testId },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          },
          questions: {
            orderBy: { order: 'asc' }
          },
          attempts: userId ? {
            where: { userId },
            orderBy: { createdAt: 'desc' }
          } : undefined
        }
      });

      if (!test) {
        throw new NotFoundError('Test not found');
      }

      // Check if user has access to this test
      if (test.requiredTier !== SubscriptionTier.FREE && userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { subscriptionTier: true }
        });

        if (user && !this.hasAccessToTier(user.subscriptionTier, test.requiredTier)) {
          throw new AuthorizationError('Subscription upgrade required to access this test');
        }
      }

      // Calculate user-specific data
      let bestScore = 0;
      let attemptsCount = 0;

      if (test.attempts && test.attempts.length > 0) {
        attemptsCount = test.attempts.length;
        const completedAttempts = test.attempts.filter(a => a.status === TestAttemptStatus.COMPLETED && a.score !== null);
        if (completedAttempts.length > 0) {
          bestScore = Math.max(...completedAttempts.map(a => a.score!));
        }
      }

      // Add computed fields
      const testWithDetails: TestWithDetails = {
        ...test,
        isFavorited: false, // Will be calculated separately if needed
        bestScore,
        attemptsCount
      };

      return testWithDetails;
    } catch (error) {
      logger.error('Failed to get test by ID', { testId, userId, error });
      throw error;
    }
  }

  /**
   * Get all tests with pagination and filtering
   */
  static async getAllTests(
    pagination: PaginationParams,
    filters: FilterParams,
    userId?: string
  ): Promise<{
    tests: TestWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const { search, level, category, tier, type } = filters;

      // Build where clause
      const where: any = {
        status: TestStatus.PUBLISHED // Only show published tests to regular users
      };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { titleEn: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }
        ];
      }

      if (level) {
        where.level = level;
      }

      if (category) {
        where.category = category;
      }

      if (tier) {
        where.requiredTier = tier;
      }

      if (type) {
        where.type = type;
      }

      // Get total count
      const total = await prisma.test.count({ where });

      // Get tests
      const tests = await prisma.test.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          },
          attempts: userId ? {
            where: { userId },
            orderBy: { createdAt: 'desc' }
          } : undefined
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      });

      const totalPages = Math.ceil(total / limit);

      // Add computed fields
      const testsWithDetails: TestWithDetails[] = tests.map(test => {
        let bestScore = 0;
        let attemptsCount = 0;

        if (test.attempts && test.attempts.length > 0) {
          attemptsCount = test.attempts.length;
          const completedAttempts = test.attempts.filter(a => a.status === TestAttemptStatus.COMPLETED && a.score !== null);
          if (completedAttempts.length > 0) {
            bestScore = Math.max(...completedAttempts.map(a => a.score!));
          }
        }

        return {
          ...test,
          isFavorited: false, // Will be calculated separately if needed
          bestScore,
          attemptsCount
        };
      });

      return {
        tests: testsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Failed to get all tests', { error });
      throw error;
    }
  }

  /**
   * Start a test attempt
   */
  static async startTest(testId: string, userId: string): Promise<StartTestResponse> {
    try {
      // Get test
      const test = await prisma.test.findUnique({
        where: { id: testId },
        include: {
          questions: {
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!test) {
        throw new NotFoundError('Test not found');
      }

      if (test.status !== TestStatus.PUBLISHED) {
        throw new ValidationError('Test is not published');
      }

      // Check user subscription tier
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (!this.hasAccessToTier(user.subscriptionTier, test.requiredTier)) {
        throw new AuthorizationError('Subscription upgrade required to take this test');
      }

      // Check max attempts
      if (test.maxAttempts) {
        const attemptCount = await prisma.testAttempt.count({
          where: {
            userId,
            testId,
            status: TestAttemptStatus.COMPLETED
          }
        });

        if (attemptCount >= test.maxAttempts) {
          throw new ValidationError(`Maximum attempts (${test.maxAttempts}) reached for this test`);
        }
      }

      // Check for existing in-progress attempt
      const existingAttempt = await prisma.testAttempt.findFirst({
        where: {
          userId,
          testId,
          status: TestAttemptStatus.IN_PROGRESS
        }
      });

      if (existingAttempt) {
        // Return existing attempt
        const questions = test.questions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          questionTextEn: q.questionTextEn,
          type: q.type,
          options: q.options,
          points: q.points,
          order: q.order,
          level: q.level,
          category: q.category
        }));

        return {
          attemptId: existingAttempt.id,
          questions: questions as any,
          timeLimit: test.duration * 60 // Convert minutes to seconds
        };
      }

      // Create new attempt
      const attempt = await prisma.testAttempt.create({
        data: {
          userId,
          testId,
          status: TestAttemptStatus.IN_PROGRESS,
          startedAt: new Date()
        }
      });

      // Prepare questions (without correct answers)
      const questions = test.questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        questionTextEn: q.questionTextEn,
        type: q.type,
        options: q.options,
        points: q.points,
        order: q.order,
        level: q.level,
        category: q.category
      }));

      logger.info('Test attempt started', { testId, userId, attemptId: attempt.id });

      return {
        attemptId: attempt.id,
        questions: questions as any,
        timeLimit: test.duration * 60 // Convert minutes to seconds
      };
    } catch (error) {
      logger.error('Failed to start test', { testId, userId, error });
      throw error;
    }
  }

  /**
   * Submit test answers
   */
  static async submitTest(submitData: SubmitTestRequest, userId: string): Promise<{
    score: number;
    totalPoints: number;
    passed: boolean;
    feedback?: string;
  }> {
    try {
      const { attemptId, answers } = submitData;

      // Get attempt
      const attempt = await prisma.testAttempt.findUnique({
        where: { id: attemptId },
        include: {
          test: {
            include: {
              questions: true
            }
          }
        }
      });

      if (!attempt) {
        throw new NotFoundError('Test attempt not found');
      }

      if (attempt.userId !== userId) {
        throw new AuthorizationError('Access denied');
      }

      if (attempt.status !== TestAttemptStatus.IN_PROGRESS) {
        throw new ValidationError('Test attempt is not in progress');
      }

      // Calculate score
      let totalScore = 0;
      let totalPoints = 0;
      const questionAnswers = [];

      for (const question of attempt.test.questions) {
        const userAnswer = answers.find(a => a.questionId === question.id);
        totalPoints += question.points;

        if (userAnswer) {
          const isCorrect = this.checkAnswer(question.correctAnswer, userAnswer.answer, question.type);
          const pointsEarned = isCorrect ? question.points : 0;
          totalScore += pointsEarned;

          // Create question answer record
          questionAnswers.push({
            attemptId,
            questionId: question.id,
            answer: userAnswer.answer,
            isCorrect,
            pointsEarned,
            timeSpent: userAnswer.timeSpent || 0
          });
        } else {
          // No answer provided
          questionAnswers.push({
            attemptId,
            questionId: question.id,
            answer: null,
            isCorrect: false,
            pointsEarned: 0,
            timeSpent: 0
          });
        }
      }

      const scorePercentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
      const passed = scorePercentage >= attempt.test.passingScore;

      // Update attempt
      await prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          status: TestAttemptStatus.COMPLETED,
          completedAt: new Date(),
          score: scorePercentage,
          timeSpent: Math.floor((new Date().getTime() - attempt.startedAt.getTime()) / 1000),
          answers: answers
        }
      });

      // Create question answers
      await prisma.testQuestionAnswer.createMany({
        data: questionAnswers
      });

      // Update test completion count
      await prisma.test.update({
        where: { id: attempt.testId },
        data: {
          completionCount: {
            increment: 1
          },
          averageScore: {
            // This would need a more complex calculation in a real scenario
            set: scorePercentage
          }
        }
      });

      logger.info('Test submitted successfully', { 
        testId: attempt.testId, 
        userId, 
        attemptId, 
        score: scorePercentage 
      });

      return {
        score: scorePercentage,
        totalPoints,
        passed,
        feedback: attempt.test.hasAIFeedback ? 'AI feedback would be generated here' : undefined
      };
    } catch (error) {
      logger.error('Failed to submit test', { submitData, userId, error });
      throw error;
    }
  }

  /**
   * Get user's test attempts
   */
  static async getUserTestAttempts(
    userId: string,
    pagination: PaginationParams
  ): Promise<{
    attempts: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      // Get total count
      const total = await prisma.testAttempt.count({
        where: { userId }
      });

      // Get attempts
      const attempts = await prisma.testAttempt.findMany({
        where: { userId },
        include: {
          test: {
            select: {
              id: true,
              title: true,
              type: true,
              level: true,
              category: true,
              passingScore: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      });

      const totalPages = Math.ceil(total / limit);

      return {
        attempts,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Failed to get user test attempts', { userId, error });
      throw error;
    }
  }

  /**
   * Check if answer is correct
   */
  private static checkAnswer(correctAnswer: any, userAnswer: any, questionType: string): boolean {
    switch (questionType) {
      case 'multiple-choice':
        return correctAnswer === userAnswer;
      case 'true-false':
        return correctAnswer === userAnswer;
      case 'fill-blank':
        if (typeof correctAnswer === 'string' && typeof userAnswer === 'string') {
          return correctAnswer.toLowerCase().trim() === userAnswer.toLowerCase().trim();
        }
        return correctAnswer === userAnswer;
      case 'essay':
        // For essay questions, manual grading would be required
        // For now, return false (needs manual review)
        return false;
      default:
        return false;
    }
  }

  /**
   * Add questions to a test
   */
  static async addQuestionsToTest(testId: string, questions: any[], userId: string) {
    try {
      // Verify test exists and user has permission
      const test = await prisma.test.findUnique({
        where: { id: testId },
        include: { createdBy: true }
      });

      if (!test) {
        throw new NotFoundError('Test not found');
      }

      if (test.createdById !== userId) {
        throw new AuthorizationError('Access denied. You can only add questions to your own tests.');
      }

      // Add questions
      const createdQuestions = await Promise.all(
        questions.map((question, index) =>
          prisma.testQuestion.create({
            data: {
              testId,
              questionText: question.questionText,
              questionTextEn: question.questionTextEn,
              type: question.type,
              options: question.options,
              correctAnswer: question.correctAnswer,
              points: question.points || 1,
              explanation: question.explanation,
              explanationEn: question.explanationEn,
              order: question.order || index + 1,
              level: question.level || test.level,
              category: question.category || test.category
            }
          })
        )
      );

      return { questions: createdQuestions };
    } catch (error) {
      logger.error('Error adding questions to test', { error, testId, userId });
      throw error;
    }
  }

  /**
   * Get questions for a test
   */
  static async getTestQuestions(testId: string, userId: string) {
    try {
      // Verify test exists and user has permission
      const test = await prisma.test.findUnique({
        where: { id: testId },
        include: { createdBy: true }
      });

      if (!test) {
        throw new NotFoundError('Test not found');
      }

      if (test.createdById !== userId) {
        throw new AuthorizationError('Access denied. You can only view questions for your own tests.');
      }

      const questions = await prisma.testQuestion.findMany({
        where: { testId },
        orderBy: { order: 'asc' }
      });

      return questions;
    } catch (error) {
      logger.error('Error getting test questions', { error, testId, userId });
      throw error;
    }
  }

  /**
   * Update a test question
   */
  static async updateTestQuestion(testId: string, questionId: string, questionData: any, userId: string) {
    try {
      // Verify test exists and user has permission
      const test = await prisma.test.findUnique({
        where: { id: testId },
        include: { createdBy: true }
      });

      if (!test) {
        throw new NotFoundError('Test not found');
      }

      if (test.createdById !== userId) {
        throw new AuthorizationError('Access denied. You can only update questions for your own tests.');
      }

      // Update question
      const question = await prisma.testQuestion.update({
        where: { id: questionId, testId },
        data: questionData
      });

      return question;
    } catch (error) {
      logger.error('Error updating test question', { error, testId, questionId, userId });
      throw error;
    }
  }

  /**
   * Delete a test question
   */
  static async deleteTestQuestion(testId: string, questionId: string, userId: string) {
    try {
      // Verify test exists and user has permission
      const test = await prisma.test.findUnique({
        where: { id: testId },
        include: { createdBy: true }
      });

      if (!test) {
        throw new NotFoundError('Test not found');
      }

      if (test.createdById !== userId) {
        throw new AuthorizationError('Access denied. You can only delete questions from your own tests.');
      }

      // Delete question
      await prisma.testQuestion.delete({
        where: { id: questionId, testId }
      });

      return true;
    } catch (error) {
      logger.error('Error deleting test question', { error, testId, questionId, userId });
      throw error;
    }
  }

  /**
   * Check if user has access to subscription tier
   */
  private static hasAccessToTier(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
    const tierHierarchy = {
      [SubscriptionTier.FREE]: 0,
      [SubscriptionTier.ESSENTIAL]: 1,
      [SubscriptionTier.PREMIUM]: 2,
      [SubscriptionTier.PRO]: 3
    };

    return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
  }
}

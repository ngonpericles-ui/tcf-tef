"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestService = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class TestService {
    static async createTest(testData, createdById, creatorRole) {
        try {
            if (![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(creatorRole)) {
                throw new errorHandler_1.AuthorizationError('Access denied. Manager role required.');
            }
            const test = await connection_1.prisma.test.create({
                data: {
                    ...testData,
                    createdById,
                    status: client_1.TestStatus.DRAFT
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
            logger_1.logger.info('Test created successfully', {
                testId: test.id,
                title: test.title,
                createdById
            });
            return test;
        }
        catch (error) {
            logger_1.logger.error('Failed to create test', { testData, createdById, error });
            throw error;
        }
    }
    static async getTestById(testId, userId) {
        try {
            const test = await connection_1.prisma.test.findUnique({
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
                throw new errorHandler_1.NotFoundError('Test not found');
            }
            if (test.requiredTier !== client_1.SubscriptionTier.FREE && userId) {
                const user = await connection_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: { subscriptionTier: true }
                });
                if (user && !this.hasAccessToTier(user.subscriptionTier, test.requiredTier)) {
                    throw new errorHandler_1.AuthorizationError('Subscription upgrade required to access this test');
                }
            }
            let bestScore = 0;
            let attemptsCount = 0;
            if (test.attempts && test.attempts.length > 0) {
                attemptsCount = test.attempts.length;
                const completedAttempts = test.attempts.filter(a => a.status === client_1.TestAttemptStatus.COMPLETED && a.score !== null);
                if (completedAttempts.length > 0) {
                    bestScore = Math.max(...completedAttempts.map(a => a.score));
                }
            }
            const testWithDetails = {
                ...test,
                isFavorited: false,
                bestScore,
                attemptsCount
            };
            return testWithDetails;
        }
        catch (error) {
            logger_1.logger.error('Failed to get test by ID', { testId, userId, error });
            throw error;
        }
    }
    static async getAllTests(pagination, filters, userId) {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
            const { search, level, category, tier, type } = filters;
            const where = {
                status: client_1.TestStatus.PUBLISHED
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
            const total = await connection_1.prisma.test.count({ where });
            const tests = await connection_1.prisma.test.findMany({
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
            const testsWithDetails = tests.map(test => {
                let bestScore = 0;
                let attemptsCount = 0;
                if (test.attempts && test.attempts.length > 0) {
                    attemptsCount = test.attempts.length;
                    const completedAttempts = test.attempts.filter(a => a.status === client_1.TestAttemptStatus.COMPLETED && a.score !== null);
                    if (completedAttempts.length > 0) {
                        bestScore = Math.max(...completedAttempts.map(a => a.score));
                    }
                }
                return {
                    ...test,
                    isFavorited: false,
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get all tests', { error });
            throw error;
        }
    }
    static async startTest(testId, userId) {
        try {
            const test = await connection_1.prisma.test.findUnique({
                where: { id: testId },
                include: {
                    questions: {
                        orderBy: { order: 'asc' }
                    }
                }
            });
            if (!test) {
                throw new errorHandler_1.NotFoundError('Test not found');
            }
            if (test.status !== client_1.TestStatus.PUBLISHED) {
                throw new errorHandler_1.ValidationError('Test is not published');
            }
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId },
                select: { subscriptionTier: true }
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            if (!this.hasAccessToTier(user.subscriptionTier, test.requiredTier)) {
                throw new errorHandler_1.AuthorizationError('Subscription upgrade required to take this test');
            }
            if (test.maxAttempts) {
                const attemptCount = await connection_1.prisma.testAttempt.count({
                    where: {
                        userId,
                        testId,
                        status: client_1.TestAttemptStatus.COMPLETED
                    }
                });
                if (attemptCount >= test.maxAttempts) {
                    throw new errorHandler_1.ValidationError(`Maximum attempts (${test.maxAttempts}) reached for this test`);
                }
            }
            const existingAttempt = await connection_1.prisma.testAttempt.findFirst({
                where: {
                    userId,
                    testId,
                    status: client_1.TestAttemptStatus.IN_PROGRESS
                }
            });
            if (existingAttempt) {
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
                    questions: questions,
                    timeLimit: test.duration * 60
                };
            }
            const attempt = await connection_1.prisma.testAttempt.create({
                data: {
                    userId,
                    testId,
                    status: client_1.TestAttemptStatus.IN_PROGRESS,
                    startedAt: new Date()
                }
            });
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
            logger_1.logger.info('Test attempt started', { testId, userId, attemptId: attempt.id });
            return {
                attemptId: attempt.id,
                questions: questions,
                timeLimit: test.duration * 60
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to start test', { testId, userId, error });
            throw error;
        }
    }
    static async submitTest(submitData, userId) {
        try {
            const { attemptId, answers } = submitData;
            const attempt = await connection_1.prisma.testAttempt.findUnique({
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
                throw new errorHandler_1.NotFoundError('Test attempt not found');
            }
            if (attempt.userId !== userId) {
                throw new errorHandler_1.AuthorizationError('Access denied');
            }
            if (attempt.status !== client_1.TestAttemptStatus.IN_PROGRESS) {
                throw new errorHandler_1.ValidationError('Test attempt is not in progress');
            }
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
                    questionAnswers.push({
                        attemptId,
                        questionId: question.id,
                        answer: userAnswer.answer,
                        isCorrect,
                        pointsEarned,
                        timeSpent: userAnswer.timeSpent || 0
                    });
                }
                else {
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
            await connection_1.prisma.testAttempt.update({
                where: { id: attemptId },
                data: {
                    status: client_1.TestAttemptStatus.COMPLETED,
                    completedAt: new Date(),
                    score: scorePercentage,
                    timeSpent: Math.floor((new Date().getTime() - attempt.startedAt.getTime()) / 1000),
                    answers: answers
                }
            });
            await connection_1.prisma.testQuestionAnswer.createMany({
                data: questionAnswers
            });
            await connection_1.prisma.test.update({
                where: { id: attempt.testId },
                data: {
                    completionCount: {
                        increment: 1
                    },
                    averageScore: {
                        set: scorePercentage
                    }
                }
            });
            logger_1.logger.info('Test submitted successfully', {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to submit test', { submitData, userId, error });
            throw error;
        }
    }
    static async getUserTestAttempts(userId, pagination) {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
            const total = await connection_1.prisma.testAttempt.count({
                where: { userId }
            });
            const attempts = await connection_1.prisma.testAttempt.findMany({
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get user test attempts', { userId, error });
            throw error;
        }
    }
    static checkAnswer(correctAnswer, userAnswer, questionType) {
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
                return false;
            default:
                return false;
        }
    }
    static async addQuestionsToTest(testId, questions, userId) {
        try {
            const test = await connection_1.prisma.test.findUnique({
                where: { id: testId },
                include: { createdBy: true }
            });
            if (!test) {
                throw new errorHandler_1.NotFoundError('Test not found');
            }
            if (test.createdById !== userId) {
                throw new errorHandler_1.AuthorizationError('Access denied. You can only add questions to your own tests.');
            }
            const createdQuestions = await Promise.all(questions.map((question, index) => connection_1.prisma.testQuestion.create({
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
            })));
            return { questions: createdQuestions };
        }
        catch (error) {
            logger_1.logger.error('Error adding questions to test', { error, testId, userId });
            throw error;
        }
    }
    static async getTestQuestions(testId, userId) {
        try {
            const test = await connection_1.prisma.test.findUnique({
                where: { id: testId },
                include: { createdBy: true }
            });
            if (!test) {
                throw new errorHandler_1.NotFoundError('Test not found');
            }
            if (test.createdById !== userId) {
                throw new errorHandler_1.AuthorizationError('Access denied. You can only view questions for your own tests.');
            }
            const questions = await connection_1.prisma.testQuestion.findMany({
                where: { testId },
                orderBy: { order: 'asc' }
            });
            return questions;
        }
        catch (error) {
            logger_1.logger.error('Error getting test questions', { error, testId, userId });
            throw error;
        }
    }
    static async updateTestQuestion(testId, questionId, questionData, userId) {
        try {
            const test = await connection_1.prisma.test.findUnique({
                where: { id: testId },
                include: { createdBy: true }
            });
            if (!test) {
                throw new errorHandler_1.NotFoundError('Test not found');
            }
            if (test.createdById !== userId) {
                throw new errorHandler_1.AuthorizationError('Access denied. You can only update questions for your own tests.');
            }
            const question = await connection_1.prisma.testQuestion.update({
                where: { id: questionId, testId },
                data: questionData
            });
            return question;
        }
        catch (error) {
            logger_1.logger.error('Error updating test question', { error, testId, questionId, userId });
            throw error;
        }
    }
    static async deleteTestQuestion(testId, questionId, userId) {
        try {
            const test = await connection_1.prisma.test.findUnique({
                where: { id: testId },
                include: { createdBy: true }
            });
            if (!test) {
                throw new errorHandler_1.NotFoundError('Test not found');
            }
            if (test.createdById !== userId) {
                throw new errorHandler_1.AuthorizationError('Access denied. You can only delete questions from your own tests.');
            }
            await connection_1.prisma.testQuestion.delete({
                where: { id: questionId, testId }
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error deleting test question', { error, testId, questionId, userId });
            throw error;
        }
    }
    static hasAccessToTier(userTier, requiredTier) {
        const tierHierarchy = {
            [client_1.SubscriptionTier.FREE]: 0,
            [client_1.SubscriptionTier.ESSENTIAL]: 1,
            [client_1.SubscriptionTier.PREMIUM]: 2,
            [client_1.SubscriptionTier.PRO]: 3
        };
        return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
    }
}
exports.TestService = TestService;
//# sourceMappingURL=testService.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestService = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const aiService_1 = require("./aiService");
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
    static async createTestWithQuestions(testData, questionsData, createdById, creatorRole) {
        try {
            if (![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(creatorRole)) {
                throw new errorHandler_1.AuthorizationError('Access denied. Manager role required.');
            }
            const result = await connection_1.prisma.$transaction(async (tx) => {
                const testDataWithFileUrl = testData;
                const fileUrl = testDataWithFileUrl.fileUrl;
                const tags = testData.tags || [];
                const test = await tx.test.create({
                    data: {
                        title: testData.title,
                        description: testData.description,
                        type: testData.type,
                        level: testData.level,
                        category: testData.category,
                        requiredTier: testData.requiredTier,
                        duration: testData.duration,
                        questionCount: testData.questionCount,
                        difficulty: testData.difficulty,
                        passingScore: testData.passingScore,
                        tags: tags,
                        ...(fileUrl ? { fileUrl } : {}),
                        aiPowered: testData.aiPowered || false,
                        hasAIFeedback: testData.hasAIFeedback || false,
                        isOfficial: testData.isOfficial || false,
                        createdById,
                        status: client_1.TestStatus.PUBLISHED,
                        isPublished: true
                    }
                });
                if (questionsData && questionsData.length > 0) {
                    logger_1.logger.info('Creating questions', {
                        testId: test.id,
                        questionCount: questionsData.length,
                        firstQuestion: questionsData[0]
                    });
                    const questionsToCreate = questionsData.map((question, index) => {
                        let optionsJson = null;
                        if (question.options) {
                            if (Array.isArray(question.options)) {
                                optionsJson = question.options;
                            }
                            else if (typeof question.options === 'object') {
                                optionsJson = question.options;
                            }
                            else {
                                logger_1.logger.warn('Invalid options format', { questionIndex: index, options: question.options });
                                optionsJson = null;
                            }
                        }
                        let correctAnswerJson;
                        if (question.correctAnswer !== undefined && question.correctAnswer !== null) {
                            correctAnswerJson = question.correctAnswer;
                        }
                        else {
                            logger_1.logger.warn('Missing correctAnswer', { questionIndex: index });
                            correctAnswerJson = question.type === 'multiple-choice' ? 0 : question.type === 'true-false' ? true : '';
                        }
                        const category = question.category || testData.category;
                        const level = question.level || testData.level;
                        logger_1.logger.info('Question data prepared', {
                            index,
                            questionText: question.questionText?.substring(0, 50),
                            type: question.type,
                            optionsIsArray: Array.isArray(optionsJson),
                            correctAnswerType: typeof correctAnswerJson,
                            category,
                            level
                        });
                        return {
                            testId: test.id,
                            questionText: question.questionText,
                            type: question.type,
                            options: optionsJson,
                            correctAnswer: correctAnswerJson,
                            points: question.points || 1,
                            explanation: question.explanation || null,
                            passage: question.passage || null,
                            fileUrl: question.fileUrl || null,
                            minWords: question.minWords || null,
                            maxWords: question.maxWords || null,
                            writingType: question.writingType || null,
                            order: question.order || index + 1,
                            level: level,
                            category: category
                        };
                    });
                    await tx.testQuestion.createMany({
                        data: questionsToCreate
                    });
                    logger_1.logger.info('Questions created successfully', {
                        testId: test.id,
                        questionCount: questionsToCreate.length
                    });
                }
                const levels = testData.levels || [testData.level];
                const subscriptions = testData.subscriptions || [testData.requiredTier];
                if (levels.length > 1 || subscriptions.length > 1) {
                    const variants = [];
                    for (const level of levels) {
                        for (const subscription of subscriptions) {
                            if (level === testData.level && subscription === testData.requiredTier) {
                                continue;
                            }
                            variants.push({
                                title: testData.title,
                                description: testData.description,
                                type: testData.type,
                                level: level,
                                category: testData.category,
                                requiredTier: subscription,
                                duration: testData.duration,
                                questionCount: testData.questionCount,
                                difficulty: testData.difficulty,
                                passingScore: testData.passingScore,
                                tags: testData.tags,
                                aiPowered: testData.aiPowered || false,
                                hasAIFeedback: testData.hasAIFeedback || false,
                                isOfficial: testData.isOfficial || false,
                                createdById,
                                status: client_1.TestStatus.PUBLISHED,
                                isPublished: true
                            });
                        }
                    }
                    if (variants.length > 0) {
                        const createdVariants = await Promise.all(variants.map(variant => tx.test.create({ data: variant })));
                        for (const variant of createdVariants) {
                            await tx.testQuestion.createMany({
                                data: questionsData.map((question, index) => ({
                                    testId: variant.id,
                                    questionText: question.questionText,
                                    type: question.type,
                                    options: question.options,
                                    correctAnswer: question.correctAnswer,
                                    points: question.points,
                                    explanation: question.explanation,
                                    passage: question.passage || null,
                                    fileUrl: question.fileUrl || null,
                                    minWords: question.minWords || null,
                                    maxWords: question.maxWords || null,
                                    writingType: question.writingType || null,
                                    order: question.order,
                                    level: variant.level,
                                    category: variant.category
                                }))
                            });
                        }
                    }
                }
                return await tx.test.findUnique({
                    where: { id: test.id },
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        },
                        questions: {
                            orderBy: { order: 'asc' }
                        },
                        attempts: true
                    }
                });
            }, {
                timeout: 30000,
            });
            if (!result) {
                throw new Error('Failed to create test');
            }
            logger_1.logger.info('Test with questions created successfully', {
                testId: result.id,
                title: result.title,
                questionCount: questionsData.length,
                createdById
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to create test with questions', {
                testData: {
                    title: testData.title,
                    category: testData.category,
                    level: testData.level,
                    type: testData.type
                },
                questionsDataCount: questionsData?.length,
                firstQuestion: questionsData?.[0],
                createdById,
                error: {
                    message: error.message,
                    code: error.code,
                    meta: error.meta,
                    stack: error.stack
                }
            });
            if (error.code === 'P2002') {
                throw new errorHandler_1.ValidationError('A test with this title already exists');
            }
            else if (error.code === 'P2003') {
                throw new errorHandler_1.ValidationError('Invalid reference: The test or related data is invalid');
            }
            else if (error.message?.includes('Invalid enum value')) {
                throw new errorHandler_1.ValidationError(`Invalid enum value: ${error.message}. Please check category and level values.`);
            }
            else if (error.message?.includes('required')) {
                throw new errorHandler_1.ValidationError(`Missing required field: ${error.message}`);
            }
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
            const transformedQuestions = test.questions.map((q) => {
                const question = {
                    id: q.id,
                    text: q.questionText,
                    questionText: q.questionText,
                    questionTextEn: q.questionTextEn,
                    type: q.type,
                    correctAnswer: q.correctAnswer,
                    allowPause: true,
                    allowRewind: true,
                    timeLimit: undefined,
                    points: q.points,
                    explanation: q.explanation,
                    passage: q.passage || null,
                    fileUrl: q.fileUrl || null,
                    minWords: q.minWords || null,
                    maxWords: q.maxWords || null,
                    writingType: q.writingType || null
                };
                let options = q.options;
                if (typeof options === 'string') {
                    try {
                        options = JSON.parse(options);
                    }
                    catch (e) {
                        options = [];
                    }
                }
                if (Array.isArray(options)) {
                    question.options = options;
                }
                else if (options && typeof options === 'object') {
                    if (options.choices && Array.isArray(options.choices)) {
                        question.options = options.choices;
                    }
                    else if (Array.isArray(options)) {
                        question.options = options;
                    }
                    else {
                        question.options = [];
                    }
                    if (options.audioUrl) {
                        question.audioUrl = options.audioUrl;
                    }
                    if (options.videoUrl) {
                        question.videoUrl = options.videoUrl;
                    }
                    if (options.imageUrl) {
                        question.imageUrl = options.imageUrl;
                    }
                }
                else {
                    question.options = [];
                }
                return question;
            });
            const testWithDetails = {
                ...test,
                questions: transformedQuestions,
                fileUrl: test.fileUrl || undefined,
                category: test.category,
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
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    } : {
                        take: 0
                    }
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
                let fileUrl = undefined;
                const fileUrlTag = test.tags.find(tag => tag.startsWith('fileUrl:'));
                if (fileUrlTag) {
                    fileUrl = fileUrlTag.replace('fileUrl:', '');
                }
                return {
                    ...test,
                    fileUrl: fileUrl,
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
                console.log('🔍 Processing question:', {
                    questionId: question.id,
                    questionText: question.questionText,
                    correctAnswer: question.correctAnswer,
                    questionType: question.type,
                    userAnswer: userAnswer?.answer,
                    hasUserAnswer: !!userAnswer
                });
                if (userAnswer) {
                    const isCorrect = this.checkAnswer(question.correctAnswer, userAnswer.answer, question.type);
                    const pointsEarned = isCorrect ? question.points : 0;
                    totalScore += pointsEarned;
                    console.log('🔍 Answer evaluation result:', {
                        questionId: question.id,
                        isCorrect,
                        pointsEarned,
                        totalScore
                    });
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
                    console.log('🔍 No answer provided for question:', question.id);
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
            let aiFeedback = undefined;
            if (attempt.test.hasAIFeedback) {
                try {
                    aiFeedback = await this.generateAIFeedback(attempt, answers);
                }
                catch (aiError) {
                    logger_1.logger.warn('Failed to generate AI feedback', { attemptId, error: aiError });
                }
            }
            await connection_1.prisma.testAttempt.update({
                where: { id: attemptId },
                data: {
                    status: client_1.TestAttemptStatus.COMPLETED,
                    completedAt: new Date(),
                    score: scorePercentage,
                    timeSpent: Math.floor((new Date().getTime() - attempt.startedAt.getTime()) / 1000),
                    answers: answers,
                    feedback: aiFeedback
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
                feedback: aiFeedback
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to submit test', { submitData, userId, error });
            throw error;
        }
    }
    static async generateAIFeedback(attempt, answers) {
        try {
            const questionsContext = attempt.test.questions.map((q) => ({
                id: q.id,
                text: q.questionText,
                type: q.type,
                correctAnswer: q.correctAnswer
            }));
            const userAnswersContext = answers.map((a) => ({
                questionId: a.questionId,
                answer: a.answer
            }));
            const prompt = `
Tu es un professeur de français expérimenté et bienveillant. Analyse les réponses d'un étudiant à un test et fournis un retour constructif et encourageant.

Test: ${attempt.test.title}
Niveau: ${attempt.test.level}
Catégorie: ${attempt.test.category}

Questions et réponses:
${questionsContext.map((q, idx) => {
                const userAnswer = userAnswersContext.find((a) => a.questionId === q.id);
                return `Q${idx + 1}: ${q.text}
Réponse de l'étudiant: ${userAnswer?.answer || 'Pas de réponse'}
Réponse correcte: ${q.correctAnswer}`;
            }).join('\n\n')}

Fournis un retour constructif qui:
1. Félicite l'étudiant pour ses efforts
2. Identifie les points forts
3. Suggère les domaines à améliorer
4. Donne des conseils pratiques pour progresser
5. Encourage l'étudiant à continuer

Réponds en français, de manière bienveillante et motivante.
      `;
            const feedback = await aiService_1.AIService.generateContent(prompt);
            return feedback;
        }
        catch (error) {
            logger_1.logger.error('Error generating AI feedback', { error });
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
        console.log('🔍 Checking answer:', { correctAnswer, userAnswer, questionType, correctAnswerType: typeof correctAnswer, userAnswerType: typeof userAnswer });
        switch (questionType) {
            case 'multiple-choice':
                const correctNum = typeof correctAnswer === 'string' ? parseInt(correctAnswer) : correctAnswer;
                const userNum = typeof userAnswer === 'string' ? parseInt(userAnswer) : userAnswer;
                const correctStr = String(correctAnswer);
                const userStr = String(userAnswer);
                console.log('🔍 Multiple choice comparison:', { correctNum, userNum, correctStr, userStr });
                return correctNum === userNum || correctStr === userStr;
            case 'true-false':
                const correctBool = typeof correctAnswer === 'string' ? correctAnswer.toLowerCase() === 'true' : correctAnswer;
                const userBool = typeof userAnswer === 'string' ? userAnswer.toLowerCase() === 'true' : userAnswer;
                const correctBoolStr = String(correctAnswer).toLowerCase();
                const userBoolStr = String(userAnswer).toLowerCase();
                console.log('🔍 True-false comparison:', { correctBool, userBool, correctBoolStr, userBoolStr });
                return correctBool === userBool || correctBoolStr === userBoolStr;
            case 'fill-blank':
                if (typeof correctAnswer === 'string' && typeof userAnswer === 'string') {
                    return correctAnswer.toLowerCase().trim() === userAnswer.toLowerCase().trim();
                }
                return correctAnswer === userAnswer;
            case 'essay':
                return false;
            default:
                console.log('🔍 Unknown question type:', questionType);
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
    static async getTestResults(testId, userId) {
        try {
            const attempt = await connection_1.prisma.testAttempt.findFirst({
                where: {
                    testId,
                    userId,
                    status: client_1.TestAttemptStatus.COMPLETED
                },
                include: {
                    test: {
                        include: {
                            questions: {
                                orderBy: { order: 'asc' }
                            }
                        }
                    },
                    questions: {
                        include: {
                            question: true
                        }
                    }
                },
                orderBy: { completedAt: 'desc' }
            });
            if (!attempt) {
                throw new errorHandler_1.NotFoundError('No completed test attempt found');
            }
            const questions = attempt.test.questions.map(question => {
                const userAnswer = attempt.questions.find(a => a.questionId === question.id);
                return {
                    id: question.id,
                    questionText: question.questionText,
                    type: question.type,
                    options: question.options,
                    correctAnswer: question.correctAnswer,
                    userAnswer: userAnswer?.answer || null,
                    isCorrect: userAnswer?.isCorrect || false,
                    points: question.points,
                    explanation: question.explanation
                };
            });
            return {
                id: attempt.id,
                testId: attempt.testId,
                testTitle: attempt.test.title,
                testDescription: attempt.test.description || '',
                score: attempt.score || 0,
                maxScore: attempt.test.questions.reduce((sum, q) => sum + q.points, 0),
                percentage: attempt.score || 0,
                status: attempt.status,
                startedAt: attempt.startedAt.toISOString(),
                completedAt: attempt.completedAt?.toISOString() || '',
                duration: attempt.timeSpent || 0,
                correctAnswers: questions.filter(q => q.isCorrect).length,
                totalQuestions: questions.length,
                questions
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get test results', { testId, userId, error });
            throw error;
        }
    }
}
exports.TestService = TestService;
//# sourceMappingURL=testService.js.map
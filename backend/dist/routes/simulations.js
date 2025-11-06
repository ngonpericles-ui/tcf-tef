"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const levelAssessmentService_1 = require("../services/levelAssessmentService");
const aiTeacherFeedbackService_1 = require("../services/aiTeacherFeedbackService");
const logger_1 = require("../utils/logger");
const simulationLimitService_1 = require("../services/simulationLimitService");
const router = express_1.default.Router();
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const simulations = await database_1.prisma.test.findMany({
            where: {
                isPublished: true
            },
            include: {
                questions: {
                    select: {
                        id: true,
                        type: true,
                        category: true,
                        level: true,
                        points: true
                    }
                },
                _count: {
                    select: {
                        questions: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        const transformedSimulations = simulations.map(simulation => ({
            id: simulation.id,
            title: simulation.title,
            description: simulation.description,
            type: simulation.type,
            level: simulation.level,
            duration: simulation.duration,
            totalQuestions: simulation._count.questions,
            sections: [...new Set(simulation.questions.map(q => q.category))].length,
            difficulty: simulation.difficulty || 3,
            requiredTier: simulation.requiredTier?.toLowerCase() || 'free',
            category: simulation.category,
            language: 'fr',
            createdAt: simulation.createdAt
        }));
        res.json({
            success: true,
            data: {
                simulations: transformedSimulations,
                total: transformedSimulations.length
            }
        });
    }
    catch (error) {
        console.error('Error fetching simulations:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch simulations' }
        });
    }
});
router.get('/questions', auth_1.authenticate, async (req, res, next) => {
    try {
        const questions = await database_1.prisma.testQuestion.findMany({
            include: {
                test: {
                    select: {
                        title: true,
                        type: true,
                        level: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            success: true,
            data: {
                questions: questions.map(q => ({
                    id: q.id,
                    questionText: q.questionText,
                    type: q.type,
                    category: q.category,
                    level: q.level,
                    testTitle: q.test?.title,
                    testType: q.test?.type
                })),
                total: questions.length
            }
        });
    }
    catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch questions' }
        });
    }
});
router.post('/:id/start', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const limitCheck = await (0, simulationLimitService_1.checkSimulationLimit)(userId);
        if (!limitCheck.canCreate) {
            return res.status(403).json({
                success: false,
                error: {
                    message: limitCheck.error || 'Simulation limit reached for this billing period. Please upgrade your subscription or wait for the next billing cycle.',
                    limitReached: true,
                    remaining: limitCheck.remaining,
                    maxSimulations: limitCheck.maxSimulations,
                    periodEndDate: limitCheck.periodEndDate.toISOString()
                }
            });
        }
        const simulation = await database_1.prisma.test.findUnique({
            where: { id },
            include: {
                questions: {
                    orderBy: { order: 'asc' }
                }
            }
        });
        if (!simulation) {
            return res.status(404).json({
                success: false,
                error: { message: 'Simulation not found' }
            });
        }
        const session = await database_1.prisma.testAttempt.create({
            data: {
                userId,
                testId: id,
                status: 'IN_PROGRESS',
                startedAt: new Date(),
                answers: {
                    timeRemaining: simulation.duration * 60,
                    progress: {}
                },
            }
        });
        const sessionData = {
            id: session.id,
            simulationId: id,
            title: simulation.title,
            duration: simulation.duration,
            sections: [
                {
                    name: 'Compréhension écrite',
                    duration: Math.floor(simulation.duration * 0.4),
                    questions: simulation.questions.filter(q => q.category === 'READING').map(q => ({
                        id: q.id,
                        type: q.type,
                        questionText: q.questionText,
                        options: q.options,
                        correctAnswer: q.correctAnswer,
                        points: q.points,
                        section: q.category,
                        order: q.order,
                        audioUrl: null,
                        imageUrl: null
                    }))
                },
                {
                    name: 'Compréhension orale',
                    duration: Math.floor(simulation.duration * 0.3),
                    questions: simulation.questions.filter(q => q.category === 'LISTENING').map(q => ({
                        id: q.id,
                        type: q.type,
                        questionText: q.questionText,
                        options: q.options,
                        correctAnswer: q.correctAnswer,
                        points: q.points,
                        section: q.category,
                        order: q.order,
                        audioUrl: null,
                        imageUrl: null
                    }))
                },
                {
                    name: 'Expression écrite',
                    duration: Math.floor(simulation.duration * 0.2),
                    questions: simulation.questions.filter(q => q.category === 'WRITING').map(q => ({
                        id: q.id,
                        type: q.type,
                        questionText: q.questionText,
                        options: q.options,
                        correctAnswer: q.correctAnswer,
                        points: q.points,
                        section: q.category,
                        order: q.order,
                        audioUrl: null,
                        imageUrl: null
                    }))
                },
                {
                    name: 'Expression orale',
                    duration: Math.floor(simulation.duration * 0.1),
                    questions: simulation.questions.filter(q => q.category === 'ORAL').map(q => ({
                        id: q.id,
                        type: q.type,
                        questionText: q.questionText,
                        options: q.options,
                        correctAnswer: q.correctAnswer,
                        points: q.points,
                        section: q.category,
                        order: q.order,
                        audioUrl: null,
                        imageUrl: null
                    }))
                }
            ].filter(section => section.questions.length > 0),
            timeRemaining: simulation.duration * 60,
            currentSection: 0,
            currentQuestion: 0,
            answers: {},
            isFullscreen: true,
            autoSave: true
        };
        res.json({
            success: true,
            data: {
                sessionId: session.id,
                ...sessionData
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/sessions/:id/progress', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { answers, currentSection, currentQuestion, timeRemaining } = req.body;
        const userId = req.user.userId;
        const session = await database_1.prisma.testAttempt.findFirst({
            where: {
                id,
                userId
            }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                error: { message: 'Session not found' }
            });
        }
        const updatedAnswers = {
            ...(typeof answers === 'object' ? answers : {}),
            timeRemaining,
            currentSection,
            currentQuestion,
            lastSaved: new Date().toISOString()
        };
        await database_1.prisma.testAttempt.update({
            where: { id },
            data: {
                answers: updatedAnswers
            }
        });
        res.json({
            success: true,
            message: 'Progress saved'
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/sessions/:id/submit', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { answers, timeSpent } = req.body;
        const userId = req.user.userId;
        const session = await database_1.prisma.testAttempt.findFirst({
            where: {
                id,
                userId
            },
            include: {
                test: {
                    include: {
                        questions: true
                    }
                }
            }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                error: { message: 'Session not found' }
            });
        }
        let totalScore = 0;
        let maxScore = 0;
        let correctAnswers = 0;
        const questionResults = session.test.questions.map(question => {
            const userAnswer = answers[question.id] || '';
            const correctAnswer = typeof question.correctAnswer === 'string' ? question.correctAnswer : JSON.stringify(question.correctAnswer);
            const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
            maxScore += question.points;
            if (isCorrect) {
                totalScore += question.points;
                correctAnswers++;
            }
            return {
                questionId: question.id,
                userAnswer,
                isCorrect,
                points: isCorrect ? question.points : 0
            };
        });
        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
        const grade = getGradeFromPercentage(percentage);
        const detailedResults = {
            maxScore,
            percentage,
            correctAnswers,
            grade,
            level: session.test.level,
            sections: generateSectionResults(session.test.questions, answers),
            overallFeedback: generateOverallFeedback(percentage),
            strengths: generateStrengths(questionResults),
            weaknesses: generateWeaknesses(questionResults),
            recommendations: generateRecommendations(percentage, session.test.level),
            questionResults
        };
        const completedSession = await database_1.prisma.testAttempt.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                score: totalScore,
                timeSpent,
                answers: answers,
                feedback: JSON.stringify(detailedResults)
            }
        });
        res.json({
            success: true,
            data: {
                resultId: completedSession.id,
                score: totalScore,
                maxScore,
                percentage,
                grade,
                correctAnswers,
                totalQuestions: session.test.questions.length,
                timeSpent
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/results', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const attempts = await database_1.prisma.testAttempt.findMany({
            where: {
                userId,
                status: 'COMPLETED'
            },
            include: {
                test: {
                    select: {
                        id: true,
                        title: true,
                        titleEn: true,
                        level: true,
                        type: true,
                        category: true
                    }
                }
            },
            orderBy: { completedAt: 'desc' }
        });
        const results = attempts.map(attempt => {
            let feedbackData = {};
            if (attempt.feedback) {
                try {
                    feedbackData = JSON.parse(attempt.feedback);
                }
                catch (e) {
                }
            }
            const maxScore = feedbackData.maxScore || 100;
            const percentage = feedbackData.percentage || (attempt.score && maxScore > 0
                ? Math.round((attempt.score / maxScore) * 100)
                : 0);
            return {
                id: attempt.id,
                userId: attempt.userId,
                testAttemptId: attempt.id,
                simulationTitle: attempt.test.title,
                totalScore: attempt.score || 0,
                maxScore,
                percentage,
                grade: feedbackData.grade || getGradeFromPercentage(percentage),
                level: attempt.test.level || feedbackData.level,
                timeSpent: attempt.timeSpent || 0,
                sections: feedbackData.sections || [],
                overallFeedback: feedbackData.overallFeedback || '',
                strengths: feedbackData.strengths || [],
                weaknesses: feedbackData.weaknesses || [],
                recommendations: feedbackData.recommendations || [],
                createdAt: attempt.completedAt || attempt.createdAt,
                test: attempt.test
            };
        });
        res.json({
            success: true,
            data: results,
            message: 'Simulation results retrieved successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/results/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const attempt = await database_1.prisma.testAttempt.findFirst({
            where: {
                id,
                userId,
                status: 'COMPLETED'
            },
            include: {
                test: {
                    select: {
                        id: true,
                        title: true,
                        titleEn: true,
                        level: true,
                        type: true,
                        category: true
                    }
                }
            }
        });
        if (!attempt) {
            return res.status(404).json({
                success: false,
                error: { message: 'Results not found' }
            });
        }
        let feedbackData = {};
        if (attempt.feedback) {
            try {
                feedbackData = JSON.parse(attempt.feedback);
            }
            catch (e) {
            }
        }
        const maxScore = feedbackData.maxScore || 100;
        const percentage = feedbackData.percentage || (attempt.score && maxScore > 0
            ? Math.round((attempt.score / maxScore) * 100)
            : 0);
        const result = {
            id: attempt.id,
            userId: attempt.userId,
            testAttemptId: attempt.id,
            simulationTitle: attempt.test.title,
            totalScore: attempt.score || 0,
            maxScore,
            percentage,
            grade: feedbackData.grade || getGradeFromPercentage(percentage),
            level: attempt.test.level || feedbackData.level,
            timeSpent: attempt.timeSpent || 0,
            sections: feedbackData.sections || [],
            overallFeedback: feedbackData.overallFeedback || '',
            strengths: feedbackData.strengths || [],
            weaknesses: feedbackData.weaknesses || [],
            recommendations: feedbackData.recommendations || [],
            questionResults: feedbackData.questionResults || [],
            createdAt: attempt.completedAt || attempt.createdAt,
            test: attempt.test
        };
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
function getGradeFromPercentage(percentage) {
    if (percentage >= 90)
        return 'A+';
    if (percentage >= 80)
        return 'A';
    if (percentage >= 70)
        return 'B+';
    if (percentage >= 60)
        return 'B';
    if (percentage >= 50)
        return 'C+';
    if (percentage >= 40)
        return 'C';
    return 'D';
}
function generateSectionResults(questions, answers) {
    const sections = ['READING', 'LISTENING', 'WRITING', 'SPEAKING'];
    return sections.map(sectionName => {
        const sectionQuestions = questions.filter(q => q.section === sectionName);
        if (sectionQuestions.length === 0)
            return null;
        let sectionScore = 0;
        let sectionMaxScore = 0;
        const questionResults = sectionQuestions.map(q => {
            const userAnswer = answers[q.id] || '';
            const isCorrect = userAnswer.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();
            sectionMaxScore += q.points;
            if (isCorrect) {
                sectionScore += q.points;
            }
            return {
                id: q.id,
                questionText: q.questionText,
                userAnswer,
                correctAnswer: q.correctAnswer,
                isCorrect,
                points: q.points,
                section: q.section,
                explanation: q.explanation || ''
            };
        });
        const percentage = sectionMaxScore > 0 ? Math.round((sectionScore / sectionMaxScore) * 100) : 0;
        return {
            name: getSectionDisplayName(sectionName),
            score: sectionScore,
            maxScore: sectionMaxScore,
            percentage,
            timeSpent: 0,
            questions: questionResults
        };
    }).filter(Boolean);
}
function getSectionDisplayName(section) {
    const names = {
        'READING': 'Compréhension écrite',
        'LISTENING': 'Compréhension orale',
        'WRITING': 'Expression écrite',
        'SPEAKING': 'Expression orale'
    };
    return names[section] || section;
}
function generateOverallFeedback(percentage) {
    if (percentage >= 80) {
        return "Excellent travail ! Vous maîtrisez très bien le français et êtes prêt pour les examens officiels.";
    }
    else if (percentage >= 60) {
        return "Bon niveau ! Vous avez une bonne maîtrise du français avec quelques points à améliorer.";
    }
    else if (percentage >= 40) {
        return "Niveau correct. Continuez à pratiquer pour améliorer vos compétences en français.";
    }
    else {
        return "Il y a encore du travail à faire. Concentrez-vous sur les bases et pratiquez régulièrement.";
    }
}
function generateStrengths(results) {
    const strengths = [];
    const correctPercentage = (results.filter(r => r.isCorrect).length / results.length) * 100;
    if (correctPercentage >= 80) {
        strengths.push("Excellente compréhension générale");
    }
    if (correctPercentage >= 60) {
        strengths.push("Bonne capacité d'analyse");
    }
    strengths.push("Participation active à l'examen");
    return strengths;
}
function generateWeaknesses(results) {
    const weaknesses = [];
    const incorrectPercentage = (results.filter(r => !r.isCorrect).length / results.length) * 100;
    if (incorrectPercentage >= 40) {
        weaknesses.push("Attention aux détails à améliorer");
    }
    if (incorrectPercentage >= 60) {
        weaknesses.push("Compréhension des consignes à renforcer");
    }
    return weaknesses;
}
function generateRecommendations(percentage, level) {
    const recommendations = [];
    if (percentage < 60) {
        recommendations.push("Pratiquez davantage les exercices de base");
        recommendations.push("Révisez la grammaire française fondamentale");
    }
    recommendations.push("Continuez à pratiquer régulièrement");
    recommendations.push(`Concentrez-vous sur les exercices de niveau ${level}`);
    return recommendations;
}
router.post('/assess-level', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'Authentication required' }
            });
        }
        const { simulationId, testLevel, score, totalQuestions, correctAnswers, timeSpent, answers, sectionScores } = req.body;
        logger_1.logger.info('Level assessment request body:', {
            simulationId,
            testLevel,
            score,
            totalQuestions,
            correctAnswers,
            timeSpent,
            hasAnswers: !!answers,
            hasSectionScores: !!sectionScores
        });
        if (!testLevel || score === undefined || !totalQuestions || correctAnswers === undefined) {
            logger_1.logger.error('Missing required fields:', {
                testLevel: !!testLevel,
                score: score !== undefined,
                totalQuestions: !!totalQuestions,
                correctAnswers: correctAnswers !== undefined
            });
            return res.status(400).json({
                success: false,
                error: { message: 'Missing required fields for level assessment' }
            });
        }
        const assessment = await levelAssessmentService_1.LevelAssessmentService.assessLevel(userId, {
            simulationId,
            testLevel,
            score,
            totalQuestions,
            correctAnswers,
            timeSpent: timeSpent || 0,
            answers: answers || [],
            sectionScores: sectionScores || {}
        });
        res.json({
            success: true,
            data: {
                assessment,
                message: 'Level assessment completed successfully'
            }
        });
    }
    catch (error) {
        console.error('Error in level assessment:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to assess level' }
        });
    }
});
router.get('/level-history', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'Authentication required' }
            });
        }
        const history = await levelAssessmentService_1.LevelAssessmentService.getLevelHistory(userId);
        res.json({
            success: true,
            data: {
                history,
                currentLevel: await levelAssessmentService_1.LevelAssessmentService.getCurrentLevel(userId)
            }
        });
    }
    catch (error) {
        console.error('Error fetching level history:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch level history' }
        });
    }
});
router.post('/:id/start', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const simulation = await database_1.prisma.test.findFirst({
            where: {
                id: id,
                isPublished: true
            },
            include: {
                questions: {
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        });
        if (!simulation) {
            return res.status(404).json({
                success: false,
                error: { message: 'Simulation not found' }
            });
        }
        const examSession = {
            id: `session_${Date.now()}_${userId}`,
            simulationId: simulation.id,
            title: simulation.title,
            duration: simulation.duration || 60,
            sections: groupQuestionsBySection(simulation.questions),
            timeRemaining: (simulation.duration || 60) * 60,
            currentSection: 0,
            currentQuestion: 0,
            answers: {},
            isFullscreen: true,
            autoSave: true
        };
        res.json({
            success: true,
            data: examSession
        });
    }
    catch (error) {
        console.error('Error starting simulation:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to start simulation' }
        });
    }
});
router.post('/sessions/:sessionId/submit', auth_1.authenticate, async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { answers, timeSpent } = req.body;
        const userId = req.user.userId;
        const simulationId = sessionId.split('_')[2] || sessionId;
        const simulation = await database_1.prisma.test.findFirst({
            where: {
                id: simulationId,
                isPublished: true
            },
            include: {
                questions: {
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        });
        if (!simulation) {
            return res.status(404).json({
                success: false,
                error: { message: 'Simulation not found' }
            });
        }
        const teacherFeedbackRequest = {
            userId,
            simulationId: simulation.id,
            simulationTitle: simulation.title,
            answers,
            questions: simulation.questions.map(q => ({
                id: q.id,
                type: q.type,
                questionText: q.questionText,
                correctAnswer: q.correctAnswer,
                options: q.options,
                points: q.points || 1,
                section: q.category || 'General'
            })),
            timeSpent: timeSpent || 0,
            totalDuration: (simulation.duration || 60) * 60
        };
        const teacherFeedback = await aiTeacherFeedbackService_1.AITeacherFeedbackService.generateTeacherFeedback(teacherFeedbackRequest);
        const simulationResult = {
            id: `result_${Date.now()}_${userId}`,
            simulationId: simulation.id,
            userId,
            score: teacherFeedback.overallScore,
            maxScore: teacherFeedback.maxScore,
            percentage: Math.round((teacherFeedback.overallScore / teacherFeedback.maxScore) * 100),
            timeSpent,
            answers,
            teacherFeedbackId: teacherFeedback.id,
            completedAt: new Date()
        };
        res.json({
            success: true,
            data: {
                resultId: simulationResult.id,
                score: simulationResult.score,
                maxScore: simulationResult.maxScore,
                percentage: simulationResult.percentage,
                teacherFeedbackId: teacherFeedback.id,
                message: 'Simulation completed successfully with AI teacher feedback'
            }
        });
    }
    catch (error) {
        console.error('Error submitting simulation:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to submit simulation' }
        });
    }
});
router.get('/free-attempts/count', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const limitInfo = await (0, simulationLimitService_1.checkSimulationLimit)(userId);
        const [testAttempts, voiceSimulations, immigrationSimulations] = await Promise.all([
            database_1.prisma.testAttempt.count({
                where: {
                    userId,
                    createdAt: { gte: limitInfo.periodStartDate }
                }
            }),
            database_1.prisma.voiceSimulation.count({
                where: {
                    userId,
                    createdAt: { gte: limitInfo.periodStartDate }
                }
            }),
            database_1.prisma.immigrationSimulation.count({
                where: {
                    userId,
                    createdAt: { gte: limitInfo.periodStartDate }
                }
            })
        ]);
        const totalSimulationsUsed = testAttempts + voiceSimulations + immigrationSimulations;
        const now = new Date();
        const daysRemaining = Math.max(0, Math.ceil((limitInfo.periodEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        res.json({
            success: true,
            data: {
                totalSimulationsUsed,
                remainingSimulations: limitInfo.remaining,
                maxSimulations: limitInfo.maxSimulations,
                subscriptionTier: limitInfo.subscriptionTier,
                isBlocked: !limitInfo.canCreate,
                canAccessPaid: limitInfo.subscriptionTier !== 'FREE',
                periodStartDate: limitInfo.periodStartDate.toISOString(),
                periodEndDate: limitInfo.periodEndDate.toISOString(),
                daysRemaining,
                freeAttemptsUsed: limitInfo.subscriptionTier === 'FREE' ? totalSimulationsUsed : 0,
                remainingFreeAttempts: limitInfo.subscriptionTier === 'FREE' ? limitInfo.remaining : 0,
                breakdown: {
                    testAttempts,
                    voiceSimulations,
                    immigrationSimulations
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting simulation attempts count:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get simulation attempts count' }
        });
    }
});
router.get('/test-niveau', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { level, tier } = req.query;
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { subscriptionTier: true }
        });
        const userTier = user?.subscriptionTier || 'FREE';
        const freeAttempts = await database_1.prisma.testAttempt.count({
            where: { userId }
        });
        const isBlocked = freeAttempts >= 5 && userTier === 'FREE';
        let whereClause = {
            isPublished: true,
            type: 'SIMULATION'
        };
        if (level) {
            whereClause.level = level;
        }
        if (tier === 'essentiel') {
            whereClause.level = { in: ['B1', 'B2'] };
            whereClause.requiredTier = { in: ['FREE', 'ESSENTIAL'] };
        }
        else if (tier === 'premium' || tier === 'pro') {
            whereClause.level = { in: ['B1', 'B2', 'C1', 'C2'] };
            whereClause.requiredTier = { in: ['FREE', 'ESSENTIAL', 'PREMIUM', 'PRO'] };
        }
        const simulations = await database_1.prisma.test.findMany({
            where: whereClause,
            include: {
                questions: {
                    select: {
                        id: true,
                        type: true,
                        category: true,
                        level: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json({
            success: true,
            data: {
                simulations: simulations.map(sim => ({
                    id: sim.id,
                    title: sim.title,
                    description: sim.description,
                    level: sim.level,
                    duration: sim.duration,
                    totalQuestions: sim.questions.length,
                    requiredTier: sim.requiredTier,
                    category: sim.category
                })),
                accessInfo: {
                    freeAttemptsUsed: freeAttempts,
                    remainingFreeAttempts: Math.max(0, 5 - freeAttempts),
                    isBlocked,
                    userTier
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching test-niveau simulations:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch simulations' }
        });
    }
});
function groupQuestionsBySection(questions) {
    const sections = {};
    questions.forEach(question => {
        const sectionName = question.category || 'General';
        if (!sections[sectionName]) {
            sections[sectionName] = {
                name: sectionName,
                duration: 20,
                questions: []
            };
        }
        sections[sectionName].questions.push({
            id: question.id,
            type: question.type,
            questionText: question.questionText,
            options: question.options,
            correctAnswer: question.correctAnswer,
            points: question.points || 1,
            section: sectionName,
            order: question.order,
            audioUrl: question.audioUrl,
            imageUrl: question.imageUrl
        });
    });
    return Object.values(sections);
}
exports.default = router;
//# sourceMappingURL=simulations.js.map
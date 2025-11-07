"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestController = void 0;
const testService_1 = require("../services/testService");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class TestController {
}
exports.TestController = TestController;
_a = TestController;
TestController.createTest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const testData = req.body;
    const createdById = req.user?.userId;
    const creatorRole = req.user?.role;
    if (!createdById || !creatorRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const test = await testService_1.TestService.createTest(testData, createdById, creatorRole);
    const response = {
        success: true,
        data: { test },
        message: 'Test created successfully'
    };
    logger_1.logger.info('Test created', { testId: test.id, createdById });
    res.status(201).json(response);
});
TestController.getTestById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { testId } = req.params;
    const userId = req.user?.userId;
    const test = await testService_1.TestService.getTestById(testId, userId);
    const response = {
        success: true,
        data: { test },
        message: 'Test retrieved successfully'
    };
    res.status(200).json(response);
});
TestController.getAllTests = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
    };
    const filters = {
        search: req.query.search,
        level: req.query.level,
        category: req.query.category,
        tier: req.query.tier,
        type: req.query.type
    };
    const result = await testService_1.TestService.getAllTests(pagination, filters, userId);
    const response = {
        success: true,
        data: result.tests,
        pagination: result.pagination,
        message: 'Tests retrieved successfully'
    };
    res.status(200).json(response);
});
TestController.startTest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { testId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const result = await testService_1.TestService.startTest(testId, userId);
    const response = {
        success: true,
        data: result,
        message: 'Test started successfully'
    };
    logger_1.logger.info('Test started', { testId, userId, attemptId: result.attemptId });
    res.status(200).json(response);
});
TestController.submitTest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const submitData = req.body;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const result = await testService_1.TestService.submitTest(submitData, userId);
    const response = {
        success: true,
        data: result,
        message: 'Test submitted successfully'
    };
    logger_1.logger.info('Test submitted', {
        attemptId: submitData.attemptId,
        userId,
        score: result.score
    });
    res.status(200).json(response);
});
TestController.getUserTestAttempts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
    };
    const result = await testService_1.TestService.getUserTestAttempts(userId, pagination);
    const response = {
        success: true,
        data: result.attempts,
        pagination: result.pagination,
        message: 'Test attempts retrieved successfully'
    };
    res.status(200).json(response);
});
TestController.getUserCreatedTests = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    if (![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(userRole)) {
        res.status(403).json({
            success: false,
            error: { message: 'Access denied. Manager role required.' }
        });
        return;
    }
    const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
    };
    const filters = {
        search: req.query.search,
        level: req.query.level,
        category: req.query.category,
        tier: req.query.tier,
        type: req.query.type
    };
    const extendedFilters = {
        ...filters,
        createdById: userId
    };
    const result = await testService_1.TestService.getAllTests(pagination, extendedFilters, userId);
    const response = {
        success: true,
        data: result.tests,
        pagination: result.pagination,
        message: 'Created tests retrieved successfully'
    };
    res.status(200).json(response);
});
TestController.getTestAttemptDetails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { attemptId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../database/connection')));
    const attempt = await prisma.testAttempt.findUnique({
        where: { id: attemptId },
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
            },
            questions: {
                include: {
                    question: {
                        select: {
                            id: true,
                            questionText: true,
                            questionTextEn: true,
                            type: true,
                            options: true,
                            correctAnswer: true,
                            explanation: true,
                            explanationEn: true,
                            points: true
                        }
                    }
                }
            }
        }
    });
    if (!attempt) {
        res.status(404).json({
            success: false,
            error: { message: 'Test attempt not found' }
        });
        return;
    }
    if (attempt.userId !== userId) {
        res.status(403).json({
            success: false,
            error: { message: 'Access denied' }
        });
        return;
    }
    const response = {
        success: true,
        data: { attempt },
        message: 'Test attempt details retrieved successfully'
    };
    res.status(200).json(response);
});
TestController.addQuestionsToTest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { testId } = req.params;
    const questions = req.body.questions;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const result = await testService_1.TestService.addQuestionsToTest(testId, questions, userId);
    const response = {
        success: true,
        data: result,
        message: 'Questions added to test successfully'
    };
    res.status(201).json(response);
});
TestController.getTestQuestions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { testId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const questions = await testService_1.TestService.getTestQuestions(testId, userId);
    const response = {
        success: true,
        data: { questions },
        message: 'Test questions retrieved successfully'
    };
    res.status(200).json(response);
});
TestController.updateTestQuestion = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { testId, questionId } = req.params;
    const questionData = req.body;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const question = await testService_1.TestService.updateTestQuestion(testId, questionId, questionData, userId);
    const response = {
        success: true,
        data: { question },
        message: 'Test question updated successfully'
    };
    res.status(200).json(response);
});
TestController.deleteTestQuestion = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { testId, questionId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await testService_1.TestService.deleteTestQuestion(testId, questionId, userId);
    const response = {
        success: true,
        data: null,
        message: 'Test question deleted successfully'
    };
    res.status(200).json(response);
});
TestController.uploadTestFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { testId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const response = {
        success: true,
        data: { message: 'Test file upload functionality will be implemented' },
        message: 'Test file upload endpoint ready'
    };
    res.status(200).json(response);
});
TestController.healthCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const response = {
        success: true,
        data: {
            service: 'test',
            status: 'healthy',
            timestamp: new Date().toISOString()
        },
        message: 'Test service is healthy'
    };
    res.status(200).json(response);
});
//# sourceMappingURL=testController.js.map
"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeController = void 0;
const homeService_1 = require("../services/homeService");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class HomeController {
}
exports.HomeController = HomeController;
_a = HomeController;
HomeController.getDashboardData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'AUTHENTICATION_ERROR' }
            });
            return;
        }
        const dashboardData = await homeService_1.HomeService.getDashboardData(userId);
        res.status(200).json({
            success: true,
            data: dashboardData
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch dashboard data', code: 'INTERNAL_ERROR' }
        });
    }
});
HomeController.getAIMessages = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'AUTHENTICATION_ERROR' }
            });
            return;
        }
        const aiMessages = await homeService_1.HomeService.getAIMessages(userId);
        res.status(200).json({
            success: true,
            data: aiMessages
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching AI messages:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch AI messages', code: 'INTERNAL_ERROR' }
        });
    }
});
HomeController.getStudySession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'AUTHENTICATION_ERROR' }
            });
            return;
        }
        const studySession = await homeService_1.HomeService.getStudySessionData(userId);
        res.status(200).json({
            success: true,
            data: studySession
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching study session:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch study session', code: 'INTERNAL_ERROR' }
        });
    }
});
HomeController.startStudySession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'AUTHENTICATION_ERROR' }
            });
            return;
        }
        const { targetTime } = req.body;
        const result = await homeService_1.HomeService.startStudySession(userId, targetTime);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Study session started successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error starting study session:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to start study session', code: 'INTERNAL_ERROR' }
        });
    }
});
HomeController.stopStudySession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'AUTHENTICATION_ERROR' }
            });
            return;
        }
        const result = await homeService_1.HomeService.stopStudySession(userId);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Study session stopped successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error stopping study session:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to stop study session', code: 'INTERNAL_ERROR' }
        });
    }
});
HomeController.resetStudySession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'AUTHENTICATION_ERROR' }
            });
            return;
        }
        const result = await homeService_1.HomeService.resetStudySession(userId);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Study session reset successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error resetting study session:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to reset study session', code: 'INTERNAL_ERROR' }
        });
    }
});
HomeController.getDaysOnPlatform = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'AUTHENTICATION_ERROR' }
            });
            return;
        }
        const daysOnPlatform = await homeService_1.HomeService.getDaysOnPlatform(userId);
        res.status(200).json({
            success: true,
            data: { daysOnPlatform }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching days on platform:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch days on platform', code: 'INTERNAL_ERROR' }
        });
    }
});
HomeController.getRegionalTime = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'AUTHENTICATION_ERROR' }
            });
            return;
        }
        const regionalTime = await homeService_1.HomeService.getRegionalTimeData(userId);
        res.status(200).json({
            success: true,
            data: regionalTime
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching regional time:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch regional time', code: 'INTERNAL_ERROR' }
        });
    }
});
//# sourceMappingURL=homeController.js.map
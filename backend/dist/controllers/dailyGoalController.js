"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyGoalController = void 0;
const errorHandler_1 = require("@/middleware/errorHandler");
const dailyGoalService_1 = require("../services/dailyGoalService");
const logger_1 = require("@/utils/logger");
class DailyGoalController {
}
exports.DailyGoalController = DailyGoalController;
_a = DailyGoalController;
DailyGoalController.getTodayGoal = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    try {
        const goal = await dailyGoalService_1.DailyGoalService.getTodayGoal(userId);
        res.status(200).json({
            success: true,
            data: goal || null,
            message: goal ? 'Daily goal retrieved successfully' : 'No daily goal set for today'
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting today goal:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get daily goal' }
        });
    }
});
DailyGoalController.setDailyGoal = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const { title, description, targetValue, unit, xpReward } = req.body;
    if (!title || !targetValue) {
        res.status(400).json({
            success: false,
            error: { message: 'Title and targetValue are required' }
        });
        return;
    }
    try {
        const goal = await dailyGoalService_1.DailyGoalService.setDailyGoal(userId, {
            title,
            description,
            targetValue: parseInt(targetValue),
            unit,
            xpReward: xpReward ? parseInt(xpReward) : undefined
        });
        res.status(200).json({
            success: true,
            data: goal,
            message: 'Daily goal set successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error setting daily goal:', error);
        res.status(500).json({
            success: false,
            error: { message: error.message || 'Failed to set daily goal' }
        });
    }
});
DailyGoalController.updateProgress = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const { progressValue } = req.body;
    if (progressValue === undefined || progressValue < 0) {
        res.status(400).json({
            success: false,
            error: { message: 'Valid progressValue is required' }
        });
        return;
    }
    try {
        const goal = await dailyGoalService_1.DailyGoalService.updateProgress(userId, parseFloat(progressValue));
        if (!goal) {
            res.status(404).json({
                success: false,
                error: { message: 'No daily goal found for today' }
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: goal,
            message: 'Progress updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating progress:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update progress' }
        });
    }
});
DailyGoalController.completeGoal = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    try {
        const goal = await dailyGoalService_1.DailyGoalService.completeGoal(userId);
        res.status(200).json({
            success: true,
            data: goal,
            message: 'Daily goal completed! XP awarded.'
        });
    }
    catch (error) {
        logger_1.logger.error('Error completing goal:', error);
        res.status(500).json({
            success: false,
            error: { message: error.message || 'Failed to complete goal' }
        });
    }
});
//# sourceMappingURL=dailyGoalController.js.map
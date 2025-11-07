"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const achievementService_1 = require("../services/achievementService");
const logger_1 = require("../utils/logger");
class AchievementController {
}
exports.AchievementController = AchievementController;
_a = AchievementController;
AchievementController.getRecentAchievements = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.userId;
        const achievements = await achievementService_1.AchievementService.getRecentAchievements(userId);
        res.status(200).json({
            success: true,
            data: achievements || [],
            message: 'Recent achievements fetched successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching recent achievements:', error);
        res.status(200).json({
            success: true,
            data: [],
            message: 'Recent achievements fetched successfully'
        });
    }
});
AchievementController.getAllAchievements = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.userId;
        const achievements = await achievementService_1.AchievementService.getAllAchievements(userId);
        res.status(200).json({
            success: true,
            data: achievements,
            message: 'All achievements fetched successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching all achievements:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch achievements', code: 'INTERNAL_ERROR' }
        });
    }
});
AchievementController.getAchievementProgress = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.userId;
        const progress = await achievementService_1.AchievementService.getAchievementProgress(userId);
        res.status(200).json({
            success: true,
            data: progress,
            message: 'Achievement progress fetched successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching achievement progress:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch achievement progress', code: 'INTERNAL_ERROR' }
        });
    }
});
//# sourceMappingURL=achievementController.js.map
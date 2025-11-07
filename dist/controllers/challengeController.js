"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengeController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const challengeService_1 = require("../services/challengeService");
const logger_1 = require("../utils/logger");
class ChallengeController {
}
exports.ChallengeController = ChallengeController;
_a = ChallengeController;
ChallengeController.getDailyChallenges = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const challenges = await challengeService_1.ChallengeService.getDailyChallenges();
        res.status(200).json({
            success: true,
            data: challenges,
            message: 'Daily challenges retrieved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting daily challenges:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get daily challenges', code: 'INTERNAL_ERROR' }
        });
    }
});
ChallengeController.getUserProgress = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'AUTHENTICATION_ERROR' }
            });
            return;
        }
        const progress = await challengeService_1.ChallengeService.getUserProgress(userId);
        res.status(200).json({
            success: true,
            data: progress,
            message: 'User progress retrieved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting user progress:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get user progress', code: 'INTERNAL_ERROR' }
        });
    }
});
ChallengeController.startChallenge = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user?.id;
        const { challengeId } = req.params;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'AUTHENTICATION_ERROR' }
            });
            return;
        }
        const result = await challengeService_1.ChallengeService.startChallenge(userId, challengeId);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Challenge started successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error starting challenge:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to start challenge', code: 'INTERNAL_ERROR' }
        });
    }
});
ChallengeController.completeChallenge = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user?.id;
        const { challengeId } = req.params;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'AUTHENTICATION_ERROR' }
            });
            return;
        }
        const result = await challengeService_1.ChallengeService.completeChallenge(userId, challengeId);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Challenge completed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error completing challenge:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to complete challenge', code: 'INTERNAL_ERROR' }
        });
    }
});
//# sourceMappingURL=challengeController.js.map
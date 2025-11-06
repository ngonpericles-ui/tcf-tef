"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyGoalService = void 0;
const connection_1 = require("@/database/connection");
const logger_1 = require("@/utils/logger");
const errorHandler_1 = require("@/middleware/errorHandler");
class DailyGoalService {
    static async getTodayGoal(userId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const goal = await connection_1.prisma.userDailyGoal.findUnique({
                where: {
                    userId_targetDate: {
                        userId,
                        targetDate: today
                    }
                }
            });
            if (!goal) {
                return null;
            }
            const progress = goal.targetValue > 0
                ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
                : 0;
            return {
                ...goal,
                progress
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting today goal:', error);
            throw error;
        }
    }
    static async setDailyGoal(userId, data) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (data.targetValue <= 0) {
                throw new errorHandler_1.ValidationError('Target value must be greater than 0');
            }
            const goal = await connection_1.prisma.userDailyGoal.upsert({
                where: {
                    userId_targetDate: {
                        userId,
                        targetDate: today
                    }
                },
                create: {
                    userId,
                    title: data.title,
                    description: data.description,
                    targetValue: data.targetValue,
                    unit: data.unit || 'minutes',
                    xpReward: data.xpReward || 30,
                    targetDate: today,
                    currentValue: 0,
                    isCompleted: false
                },
                update: {
                    title: data.title,
                    description: data.description,
                    targetValue: data.targetValue,
                    unit: data.unit || 'minutes',
                    xpReward: data.xpReward || 30,
                    currentValue: 0,
                    isCompleted: false
                }
            });
            const progress = goal.targetValue > 0
                ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
                : 0;
            logger_1.logger.info('Daily goal created/updated', { userId, goalId: goal.id });
            return {
                ...goal,
                progress
            };
        }
        catch (error) {
            logger_1.logger.error('Error setting daily goal:', error);
            throw error;
        }
    }
    static async updateProgress(userId, progressValue) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const goal = await connection_1.prisma.userDailyGoal.findUnique({
                where: {
                    userId_targetDate: {
                        userId,
                        targetDate: today
                    }
                }
            });
            if (!goal) {
                return null;
            }
            const newCurrentValue = Math.max(0, progressValue);
            const isCompleted = newCurrentValue >= goal.targetValue && !goal.isCompleted;
            const updatedGoal = await connection_1.prisma.userDailyGoal.update({
                where: { id: goal.id },
                data: {
                    currentValue: newCurrentValue,
                    isCompleted: isCompleted || goal.isCompleted,
                    completedAt: isCompleted && !goal.completedAt ? new Date() : goal.completedAt
                }
            });
            if (isCompleted) {
                await this.awardXP(userId, goal.xpReward, `Completed daily goal: ${goal.title}`);
            }
            const progress = updatedGoal.targetValue > 0
                ? Math.min(100, Math.round((updatedGoal.currentValue / updatedGoal.targetValue) * 100))
                : 0;
            return {
                ...updatedGoal,
                progress
            };
        }
        catch (error) {
            logger_1.logger.error('Error updating goal progress:', error);
            throw error;
        }
    }
    static async awardXP(userId, xpAmount, reason) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId },
                select: { preferences: true }
            });
            const currentXP = user?.preferences?.totalXP || 0;
            const newXP = currentXP + xpAmount;
            await connection_1.prisma.user.update({
                where: { id: userId },
                data: {
                    preferences: {
                        ...(user?.preferences || {}),
                        totalXP: newXP,
                        xpHistory: [
                            ...(user?.preferences?.xpHistory || []),
                            {
                                amount: xpAmount,
                                reason,
                                timestamp: new Date().toISOString()
                            }
                        ]
                    }
                }
            });
            logger_1.logger.info('XP awarded', { userId, xpAmount, reason, newXP });
        }
        catch (error) {
            logger_1.logger.error('Error awarding XP:', error);
        }
    }
    static async completeGoal(userId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const goal = await connection_1.prisma.userDailyGoal.findUnique({
                where: {
                    userId_targetDate: {
                        userId,
                        targetDate: today
                    }
                }
            });
            if (!goal) {
                throw new errorHandler_1.NotFoundError('No daily goal found for today');
            }
            if (goal.isCompleted) {
                return {
                    ...goal,
                    progress: 100
                };
            }
            const updatedGoal = await connection_1.prisma.userDailyGoal.update({
                where: { id: goal.id },
                data: {
                    currentValue: goal.targetValue,
                    isCompleted: true,
                    completedAt: new Date()
                }
            });
            await this.awardXP(userId, goal.xpReward, `Completed daily goal: ${goal.title}`);
            return {
                ...updatedGoal,
                progress: 100
            };
        }
        catch (error) {
            logger_1.logger.error('Error completing goal:', error);
            throw error;
        }
    }
}
exports.DailyGoalService = DailyGoalService;
//# sourceMappingURL=dailyGoalService.js.map
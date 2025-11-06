"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementService = void 0;
const prisma_1 = require("@/lib/prisma");
const logger_1 = require("@/utils/logger");
class AchievementService {
    static async getRecentAchievements(userId) {
        try {
            const recentAchievements = await prisma_1.prisma.userAchievement.findMany({
                where: {
                    userId: userId,
                    isUnlocked: true,
                    unlockedAt: { not: null }
                },
                include: {
                    achievement: true
                },
                orderBy: {
                    unlockedAt: 'desc'
                },
                take: 5
            });
            if (!recentAchievements || recentAchievements.length === 0) {
                return [];
            }
            return recentAchievements.map(ua => ({
                id: ua.id,
                title: ua.achievement.name,
                description: ua.achievement.description,
                icon: ua.achievement.icon,
                category: ua.achievement.category,
                points: ua.achievement.points,
                earnedAt: ua.unlockedAt,
                progress: ua.progress,
                isCompleted: ua.isUnlocked
            }));
        }
        catch (error) {
            if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database')) {
                logger_1.logger.warn('Database connection error, returning empty achievements array:', error.message);
                return [];
            }
            logger_1.logger.error('Error getting recent achievements:', error);
            return [];
        }
    }
    static async getAllAchievements(userId) {
        try {
            const userAchievements = await prisma_1.prisma.userAchievement.findMany({
                where: {
                    userId: userId
                },
                include: {
                    achievement: true
                },
                orderBy: [
                    { isUnlocked: 'desc' },
                    { unlockedAt: 'desc' }
                ]
            });
            return userAchievements.map(ua => ({
                id: ua.id,
                title: ua.achievement.name,
                description: ua.achievement.description,
                icon: ua.achievement.icon,
                category: ua.achievement.category,
                points: ua.achievement.points,
                earnedAt: ua.unlockedAt,
                progress: ua.progress,
                isCompleted: ua.isUnlocked
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting all achievements:', error);
            throw error;
        }
    }
    static async getAchievementProgress(userId) {
        try {
            const totalAchievements = await prisma_1.prisma.achievement.count();
            const completedAchievements = await prisma_1.prisma.userAchievement.count({
                where: {
                    userId: userId,
                    isUnlocked: true
                }
            });
            const totalPoints = await prisma_1.prisma.userAchievement.aggregate({
                where: {
                    userId: userId,
                    isUnlocked: true
                },
                _sum: {
                    progress: true
                }
            });
            return {
                totalAchievements,
                completedAchievements,
                totalPoints: totalPoints._sum.progress || 0,
                completionPercentage: totalAchievements > 0 ? (completedAchievements / totalAchievements) * 100 : 0
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting achievement progress:', error);
            throw error;
        }
    }
    static async getAchievementSummary(userId) {
        try {
            const recentAchievements = await this.getRecentAchievements(userId);
            const progress = await this.getAchievementProgress(userId);
            return {
                recentAchievements,
                progress,
                totalPoints: progress.totalPoints,
                completionRate: progress.completionPercentage
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting achievement summary:', error);
            throw error;
        }
    }
}
exports.AchievementService = AchievementService;
//# sourceMappingURL=achievementService.js.map
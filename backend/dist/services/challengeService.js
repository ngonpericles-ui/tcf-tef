"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengeService = void 0;
const connection_1 = require("@/database/connection");
const logger_1 = require("@/utils/logger");
class ChallengeService {
    static async getDailyChallenges() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const challenges = await connection_1.prisma.challenge.findMany({
                where: {
                    isActive: true,
                    isDaily: true,
                    OR: [
                        { availableDate: null },
                        {
                            availableDate: {
                                gte: today,
                                lt: tomorrow
                            }
                        }
                    ]
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 10
            });
            const dailyChallenges = challenges.map(challenge => ({
                id: challenge.id,
                title: {
                    fr: challenge.titleFr,
                    en: challenge.titleEn
                },
                description: {
                    fr: challenge.descriptionFr,
                    en: challenge.descriptionEn
                },
                reward: {
                    fr: challenge.rewardFr,
                    en: challenge.rewardEn
                },
                difficulty: challenge.difficulty,
                duration: challenge.duration,
                xpReward: challenge.xpReward,
                badgeReward: challenge.badgeReward || undefined,
                isActive: challenge.isActive,
                category: challenge.category
            }));
            logger_1.logger.info(`Retrieved ${dailyChallenges.length} daily challenges from database`);
            return dailyChallenges;
        }
        catch (error) {
            logger_1.logger.error('Error getting daily challenges from database:', error);
            return [];
        }
    }
    static async getUserProgress(userId) {
        try {
            const progress = {
                completedChallenges: 0,
                totalXp: 0,
                badges: [],
                streak: 0
            };
            return progress;
        }
        catch (error) {
            logger_1.logger.error('Error getting user progress:', error);
            throw error;
        }
    }
    static async startChallenge(userId, challengeId) {
        try {
            return {
                challengeId,
                startedAt: new Date().toISOString(),
                message: 'Challenge started successfully'
            };
        }
        catch (error) {
            logger_1.logger.error('Error starting challenge:', error);
            throw error;
        }
    }
    static async completeChallenge(userId, challengeId) {
        try {
            return {
                challengeId,
                completedAt: new Date().toISOString(),
                xpEarned: 50,
                badgeEarned: 'vocabulary',
                message: 'Challenge completed successfully'
            };
        }
        catch (error) {
            logger_1.logger.error('Error completing challenge:', error);
            throw error;
        }
    }
}
exports.ChallengeService = ChallengeService;
//# sourceMappingURL=challengeService.js.map
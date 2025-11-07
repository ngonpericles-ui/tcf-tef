"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengeService = void 0;
const logger_1 = require("../utils/logger");
class ChallengeService {
    static async getDailyChallenges() {
        try {
            const challenges = [
                {
                    id: 'vocab-express',
                    title: {
                        fr: "Défi Vocabulaire Express",
                        en: "Express Vocabulary Challenge"
                    },
                    description: {
                        fr: "Apprenez 10 nouveaux mots en 5 minutes",
                        en: "Learn 10 new words in 5 minutes"
                    },
                    reward: {
                        fr: "50 XP + Badge Vocabulaire",
                        en: "50 XP + Vocabulary Badge"
                    },
                    difficulty: "Facile",
                    duration: "5 min",
                    xpReward: 50,
                    badgeReward: "vocabulary",
                    isActive: true,
                    category: "vocabulary"
                },
                {
                    id: 'ecoute-active',
                    title: {
                        fr: "Écoute Active",
                        en: "Active Listening"
                    },
                    description: {
                        fr: "Compréhension orale avec audio natif",
                        en: "Listening comprehension with native audio"
                    },
                    reward: {
                        fr: "75 XP + Badge Écoute",
                        en: "75 XP + Listening Badge"
                    },
                    difficulty: "Moyen",
                    duration: "10 min",
                    xpReward: 75,
                    badgeReward: "listening",
                    isActive: true,
                    category: "listening"
                },
                {
                    id: 'expression-rapide',
                    title: {
                        fr: "Expression Rapide",
                        en: "Quick Expression"
                    },
                    description: {
                        fr: "Construisez 5 phrases complexes",
                        en: "Build 5 complex sentences"
                    },
                    reward: {
                        fr: "100 XP + Badge Expression",
                        en: "100 XP + Expression Badge"
                    },
                    difficulty: "Difficile",
                    duration: "15 min",
                    xpReward: 100,
                    badgeReward: "expression",
                    isActive: true,
                    category: "expression"
                }
            ];
            return challenges;
        }
        catch (error) {
            logger_1.logger.error('Error getting daily challenges:', error);
            throw error;
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
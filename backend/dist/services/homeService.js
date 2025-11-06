"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeService = void 0;
const connection_1 = require("@/database/connection");
const logger_1 = require("../utils/logger");
const aiService_1 = require("./aiService");
class HomeService {
    static async getDashboardData(userId) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    subscriptionTier: true,
                    profileImage: true,
                    createdAt: true,
                    country: true
                }
            });
            if (!user) {
                throw new Error('User not found');
            }
            const [analytics, studySession, daysOnPlatform, regionalTime] = await Promise.all([
                this.getAnalyticsDataOptimized(userId),
                this.getStudySessionDataOptimized(userId),
                this.getDaysOnPlatform(userId),
                this.getRegionalTimeDataOptimized(user?.country || 'Canada')
            ]);
            return {
                user: {
                    ...user,
                    createdAt: user.createdAt.toISOString()
                },
                analytics,
                studySession,
                daysOnPlatform,
                regionalTime
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting dashboard data:', error);
            throw error;
        }
    }
    static async getAIMessages(userId) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId },
                select: { firstName: true, lastName: true, country: true }
            });
            if (!user) {
                throw new Error('User not found');
            }
            const greeting = await aiService_1.AIService.generateGreeting(user.firstName, user.lastName);
            const motivation = await aiService_1.AIService.generateMotivation(user.firstName);
            const weather = await aiService_1.AIService.generateWeatherMessage(user.country || 'Canada');
            return {
                greeting,
                motivation,
                weather
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting AI messages:', error);
            return {
                greeting: `Bonjour Apprenant!`,
                motivation: 'Chaque mot appris vous rapproche de vos rêves.',
                weather: 'Bonne journée pour apprendre le français!'
            };
        }
    }
    static async getStudySessionDataOptimized(userId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const sessions = await connection_1.prisma.studySession.findMany({
                where: {
                    userId,
                    startTime: { gte: today }
                },
                select: {
                    startTime: true,
                    endTime: true,
                    targetTime: true
                },
                orderBy: { startTime: 'desc' }
            });
            const totalTimeToday = sessions.reduce((total, session) => {
                if (session.endTime) {
                    return total + (session.endTime.getTime() - session.startTime.getTime());
                }
                return total;
            }, 0);
            const activeSession = sessions.find(session => !session.endTime);
            const dailyGoal = 15 * 60 * 1000;
            return {
                isActive: !!activeSession,
                startTime: activeSession?.startTime.toISOString(),
                currentDuration: activeSession ? Date.now() - activeSession.startTime.getTime() : 0,
                dailyGoal,
                progress: Math.min((totalTimeToday / dailyGoal) * 100, 100),
                totalTimeToday,
                targetTime: activeSession?.targetTime || 900
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting study session data:', error);
            return {
                isActive: false,
                currentDuration: 0,
                dailyGoal: 15 * 60 * 1000,
                progress: 0,
                totalTimeToday: 0,
                targetTime: 900
            };
        }
    }
    static async getStudySessionData(userId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const sessions = await connection_1.prisma.studySession.findMany({
                where: {
                    userId,
                    startTime: {
                        gte: today
                    }
                },
                orderBy: { startTime: 'desc' }
            });
            const totalTimeToday = sessions.reduce((total, session) => {
                if (session.endTime) {
                    return total + (session.endTime.getTime() - session.startTime.getTime());
                }
                return total;
            }, 0);
            const activeSession = sessions.find(session => !session.endTime);
            const dailyGoal = 15 * 60 * 1000;
            return {
                isActive: !!activeSession,
                startTime: activeSession?.startTime.toISOString(),
                currentDuration: activeSession ? Date.now() - activeSession.startTime.getTime() : 0,
                dailyGoal,
                progress: Math.min((totalTimeToday / dailyGoal) * 100, 100),
                totalTimeToday,
                targetTime: activeSession?.targetTime || 900
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting study session data:', error);
            throw error;
        }
    }
    static async startStudySession(userId, targetTime) {
        try {
            const activeSession = await connection_1.prisma.studySession.findFirst({
                where: {
                    userId,
                    endTime: null
                }
            });
            if (activeSession) {
                return {
                    isActive: true,
                    startTime: activeSession.startTime.toISOString(),
                    targetTime: activeSession.targetTime || 900,
                    message: 'Study session already active'
                };
            }
            const session = await connection_1.prisma.studySession.create({
                data: {
                    userId,
                    startTime: new Date(),
                    targetTime: targetTime || 900
                }
            });
            return {
                isActive: true,
                startTime: session.startTime.toISOString(),
                targetTime: session.targetTime,
                message: 'Study session started successfully'
            };
        }
        catch (error) {
            logger_1.logger.error('Error starting study session:', error);
            throw error;
        }
    }
    static async stopStudySession(userId) {
        try {
            const activeSession = await connection_1.prisma.studySession.findFirst({
                where: {
                    userId,
                    endTime: null
                }
            });
            if (!activeSession) {
                return {
                    isActive: false,
                    message: 'No active study session found'
                };
            }
            await connection_1.prisma.studySession.update({
                where: { id: activeSession.id },
                data: { endTime: new Date() }
            });
            return {
                isActive: false,
                message: 'Study session stopped successfully'
            };
        }
        catch (error) {
            logger_1.logger.error('Error stopping study session:', error);
            throw error;
        }
    }
    static async resetStudySession(userId) {
        try {
            await connection_1.prisma.studySession.updateMany({
                where: {
                    userId,
                    endTime: null
                },
                data: { endTime: new Date() }
            });
            return {
                isActive: false,
                message: 'Study session reset successfully'
            };
        }
        catch (error) {
            logger_1.logger.error('Error resetting study session:', error);
            throw error;
        }
    }
    static async getDaysOnPlatform(userId) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId },
                select: { createdAt: true }
            });
            if (!user) {
                return 0;
            }
            const now = new Date();
            const diffTime = now.getTime() - user.createdAt.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return Math.max(1, diffDays);
        }
        catch (error) {
            logger_1.logger.error('Error getting days on platform:', error);
            return 1;
        }
    }
    static async getRegionalTimeDataOptimized(country) {
        try {
            const timezone = this.getTimezoneFromCountry(country);
            const now = new Date();
            return {
                time: now.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZone: timezone
                }),
                date: now.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: timezone
                }),
                timezone
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting regional time:', error);
            const now = new Date();
            return {
                time: now.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                date: now.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                timezone: 'America/Toronto'
            };
        }
    }
    static async getRegionalTimeData(userId) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId },
                select: { country: true }
            });
            const timezone = this.getTimezoneFromCountry(user?.country || 'Canada');
            const now = new Date();
            const regionalTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
            return {
                time: regionalTime.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                date: regionalTime.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                timezone
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting regional time:', error);
            const now = new Date();
            return {
                time: now.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                date: now.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                timezone: 'America/Toronto'
            };
        }
    }
    static async getAnalyticsDataOptimized(userId) {
        try {
            const [testResults, weeklySessions] = await Promise.all([
                connection_1.prisma.testAttempt.findMany({
                    where: {
                        userId,
                        status: 'COMPLETED'
                    },
                    orderBy: { completedAt: 'desc' },
                    take: 5
                }),
                connection_1.prisma.studySession.findMany({
                    where: {
                        userId,
                        startTime: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                    },
                    select: {
                        startTime: true,
                        endTime: true
                    }
                })
            ]);
            const completedTests = testResults.length;
            const averageScore = testResults.length > 0
                ? Math.round(testResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / testResults.length)
                : 0;
            const totalStudyTime = weeklySessions.reduce((total, session) => {
                if (session.endTime) {
                    return total + (session.endTime.getTime() - session.startTime.getTime());
                }
                return total;
            }, 0);
            const timeStudied = this.formatDuration(totalStudyTime);
            const weeklyProgress = Math.min(Math.round((totalStudyTime / (7 * 15 * 60 * 1000)) * 100), 100);
            return {
                weeklyProgress,
                improvementRate: 0,
                studyStreak: 0,
                completedTests,
                averageScore,
                timeStudied,
                weakAreas: [],
                strongAreas: [],
                nextRecommendations: []
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting analytics data:', error);
            return {
                weeklyProgress: 0,
                improvementRate: 0,
                studyStreak: 0,
                completedTests: 0,
                averageScore: 0,
                timeStudied: '0h 0m',
                weakAreas: [],
                strongAreas: [],
                nextRecommendations: []
            };
        }
    }
    static async getAnalyticsData(userId) {
        try {
            const testResults = await connection_1.prisma.testAttempt.findMany({
                where: {
                    userId,
                    status: 'COMPLETED'
                },
                orderBy: { completedAt: 'desc' },
                take: 10
            });
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weeklySessions = await connection_1.prisma.studySession.findMany({
                where: {
                    userId,
                    startTime: { gte: weekAgo }
                }
            });
            const completedTests = testResults.length;
            const averageScore = testResults.length > 0
                ? testResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / testResults.length
                : 0;
            const totalStudyTime = weeklySessions.reduce((total, session) => {
                if (session.endTime) {
                    return total + (session.endTime.getTime() - session.startTime.getTime());
                }
                return total;
            }, 0);
            const timeStudied = this.formatDuration(totalStudyTime);
            const studyStreak = await this.calculateStudyStreak(userId);
            const weeklyProgress = Math.min((totalStudyTime / (7 * 15 * 60 * 1000)) * 100, 100);
            const improvementRate = testResults.length > 1
                ? Math.max(0, (testResults[0]?.percentage || 0) - (testResults[testResults.length - 1]?.percentage || 0))
                : 0;
            return {
                weeklyProgress: Math.round(weeklyProgress),
                improvementRate: Math.round(improvementRate),
                studyStreak,
                completedTests,
                averageScore: Math.round(averageScore),
                timeStudied,
                weakAreas: ['Grammaire', 'Vocabulaire'],
                strongAreas: ['Compréhension orale'],
                nextRecommendations: []
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting analytics data:', error);
            return {
                weeklyProgress: 0,
                improvementRate: 0,
                studyStreak: 0,
                completedTests: 0,
                averageScore: 0,
                timeStudied: '0h 0m',
                weakAreas: [],
                strongAreas: [],
                nextRecommendations: []
            };
        }
    }
    static async calculateStudyStreak(userId) {
        try {
            const sessions = await connection_1.prisma.studySession.findMany({
                where: { userId },
                orderBy: { startTime: 'desc' }
            });
            let streak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            for (let i = 0; i < 30; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                const hasSession = sessions.some(session => {
                    const sessionDate = new Date(session.startTime);
                    sessionDate.setHours(0, 0, 0, 0);
                    return sessionDate.getTime() === checkDate.getTime();
                });
                if (hasSession) {
                    streak++;
                }
                else if (i > 0) {
                    break;
                }
            }
            return streak;
        }
        catch (error) {
            logger_1.logger.error('Error calculating study streak:', error);
            return 0;
        }
    }
    static formatDuration(milliseconds) {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        }
        return `${minutes}min`;
    }
    static getTimezoneFromCountry(country) {
        const timezoneMap = {
            'Canada': 'America/Toronto',
            'France': 'Europe/Paris',
            'Belgium': 'Europe/Brussels',
            'Switzerland': 'Europe/Zurich',
            'United States': 'America/New_York',
            'United Kingdom': 'Europe/London',
            'Germany': 'Europe/Berlin',
            'Spain': 'Europe/Madrid',
            'Italy': 'Europe/Rome'
        };
        return timezoneMap[country] || 'America/Toronto';
    }
}
exports.HomeService = HomeService;
//# sourceMappingURL=homeService.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class AnalyticsService {
    static async getDashboardAnalytics(userRole) {
        try {
            if (![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(userRole)) {
                throw new errorHandler_1.AuthorizationError('Access denied. Manager role required.');
            }
            const [totalUsers, activeUsers, totalCourses, totalTests, totalLiveSessions, subscriptionDistribution, userGrowthData, courseCompletions, testScores, revenueData] = await Promise.all([
                connection_1.prisma.user.count(),
                connection_1.prisma.user.count({
                    where: {
                        lastLoginAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    }
                }),
                connection_1.prisma.course.count(),
                connection_1.prisma.test.count(),
                connection_1.prisma.liveSession.count(),
                connection_1.prisma.user.groupBy({
                    by: ['subscriptionTier'],
                    _count: { subscriptionTier: true }
                }),
                this.getUserGrowthData(),
                this.getCourseCompletionData(),
                this.getTestScoreData(),
                this.getRevenueData()
            ]);
            const subscriptionDist = subscriptionDistribution.reduce((acc, item) => {
                acc[item.subscriptionTier] = item._count.subscriptionTier;
                return acc;
            }, {});
            const analytics = {
                totalUsers,
                activeUsers,
                totalCourses,
                totalTests,
                totalLiveSessions,
                subscriptionDistribution: subscriptionDist,
                userGrowth: userGrowthData,
                courseCompletions,
                testScores,
                revenueData
            };
            logger_1.logger.info('Dashboard analytics retrieved', { userRole });
            return analytics;
        }
        catch (error) {
            logger_1.logger.error('Failed to get dashboard analytics', { userRole, error });
            throw error;
        }
    }
    static async trackEvent(eventType, eventData, userId, sessionId, userAgent, ipAddress) {
        try {
            await connection_1.prisma.analyticsEvent.create({
                data: {
                    userId,
                    eventType,
                    eventData,
                    sessionId,
                    userAgent,
                    ipAddress
                }
            });
            logger_1.logger.debug('Analytics event tracked', { eventType, userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to track analytics event', { eventType, userId, error });
        }
    }
    static async getUserGrowthData() {
        try {
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
            const userGrowth = await connection_1.prisma.user.groupBy({
                by: ['createdAt'],
                where: {
                    createdAt: {
                        gte: twelveMonthsAgo
                    }
                },
                _count: { id: true },
                orderBy: { createdAt: 'asc' }
            });
            const monthlyData = new Map();
            userGrowth.forEach(item => {
                const monthKey = item.createdAt.toISOString().substring(0, 7);
                monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + item._count.id);
            });
            return Array.from(monthlyData.entries()).map(([date, count]) => ({
                date,
                count
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get user growth data', { error });
            return [];
        }
    }
    static async getCourseCompletionData() {
        try {
            const completions = await connection_1.prisma.courseEnrollment.groupBy({
                by: ['courseId'],
                where: {
                    completedAt: { not: null }
                },
                _count: { courseId: true },
                orderBy: { _count: { courseId: 'desc' } },
                take: 10
            });
            const courseIds = completions.map(c => c.courseId);
            const courses = await connection_1.prisma.course.findMany({
                where: { id: { in: courseIds } },
                select: { id: true, title: true }
            });
            const courseMap = new Map(courses.map(c => [c.id, c.title]));
            return completions.map(completion => ({
                courseId: completion.courseId,
                title: courseMap.get(completion.courseId) || 'Unknown Course',
                completions: completion._count.courseId
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get course completion data', { error });
            return [];
        }
    }
    static async getTestScoreData() {
        try {
            const testScores = await connection_1.prisma.testAttempt.groupBy({
                by: ['testId'],
                where: {
                    status: 'COMPLETED',
                    score: { not: null }
                },
                _avg: { score: true },
                _count: { testId: true },
                having: {
                    testId: { _count: { gte: 5 } }
                },
                orderBy: { _avg: { score: 'desc' } },
                take: 10
            });
            const testIds = testScores.map(t => t.testId);
            const tests = await connection_1.prisma.test.findMany({
                where: { id: { in: testIds } },
                select: { id: true, title: true }
            });
            const testMap = new Map(tests.map(t => [t.id, t.title]));
            return testScores.map(score => ({
                testId: score.testId,
                title: testMap.get(score.testId) || 'Unknown Test',
                averageScore: score._avg.score || 0
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get test score data', { error });
            return [];
        }
    }
    static async getRevenueData() {
        try {
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
            const payments = await connection_1.prisma.payment.findMany({
                where: {
                    status: 'COMPLETED',
                    processedAt: {
                        gte: twelveMonthsAgo
                    }
                },
                select: {
                    amount: true,
                    processedAt: true
                },
                orderBy: { processedAt: 'asc' }
            });
            const monthlyRevenue = new Map();
            payments.forEach(payment => {
                if (payment.processedAt) {
                    const monthKey = payment.processedAt.toISOString().substring(0, 7);
                    monthlyRevenue.set(monthKey, (monthlyRevenue.get(monthKey) || 0) + payment.amount);
                }
            });
            return Array.from(monthlyRevenue.entries()).map(([date, amount]) => ({
                date,
                amount
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get revenue data', { error });
            return [];
        }
    }
    static async getUserActivityAnalytics(userId, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const [courseProgress, testAttempts, liveSessionParticipation, totalTimeSpent] = await Promise.all([
                connection_1.prisma.userProgress.findMany({
                    where: {
                        userId,
                        lastAccessAt: { gte: startDate },
                        contentType: 'COURSE'
                    },
                    include: {
                        course: {
                            select: { title: true }
                        }
                    },
                    orderBy: { lastAccessAt: 'desc' }
                }),
                connection_1.prisma.testAttempt.findMany({
                    where: {
                        userId,
                        createdAt: { gte: startDate }
                    },
                    include: {
                        test: {
                            select: { title: true, type: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                connection_1.prisma.liveSessionParticipant.findMany({
                    where: {
                        userId,
                        joinedAt: { gte: startDate }
                    },
                    include: {
                        liveSession: {
                            select: { title: true, date: true }
                        }
                    },
                    orderBy: { joinedAt: 'desc' }
                }),
                connection_1.prisma.userProgress.aggregate({
                    where: {
                        userId,
                        lastAccessAt: { gte: startDate }
                    },
                    _sum: { timeSpent: true }
                })
            ]);
            return {
                courseProgress,
                testAttempts,
                liveSessionParticipation,
                totalTimeSpent: totalTimeSpent._sum.timeSpent || 0,
                period: `${days} days`
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user activity analytics', { userId, error });
            throw error;
        }
    }
    static async getSystemMetrics(userRole) {
        try {
            if (userRole !== client_1.UserRole.ADMIN) {
                throw new errorHandler_1.AuthorizationError('Access denied. Admin role required.');
            }
            const [databaseSize, activeConnections, recentErrors, systemLoad] = await Promise.all([
                connection_1.prisma.$queryRaw `SELECT pg_size_pretty(pg_database_size(current_database())) as size`,
                connection_1.prisma.$queryRaw `SELECT count(*) as connections FROM pg_stat_activity WHERE state = 'active'`,
                connection_1.prisma.analyticsEvent.count({
                    where: {
                        eventType: 'error',
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                        }
                    }
                }),
                {
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                    cpuUsage: process.cpuUsage()
                }
            ]);
            return {
                database: {
                    size: databaseSize,
                    activeConnections
                },
                errors: {
                    last24Hours: recentErrors
                },
                system: systemLoad
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get system metrics', { userRole, error });
            throw error;
        }
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analyticsService.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const connection_1 = require("../database/connection");
const client_1 = require("@prisma/client");
const password_1 = require("../utils/password");
const logger_1 = require("../utils/logger");
class AdminService {
    static async getDashboardData(timeframe, metrics) {
        const now = new Date();
        const startDate = this.getStartDate(timeframe);
        const [totalUsers, activeUsers, totalCourses, totalTests, totalRevenue, recentUsers, systemHealth, successRate, recentPayments] = await Promise.all([
            connection_1.prisma.user.count(),
            connection_1.prisma.user.count({
                where: {
                    lastLoginAt: {
                        gte: startDate
                    }
                }
            }),
            connection_1.prisma.course.count({
                where: { isPublished: true }
            }),
            connection_1.prisma.test.count({
                where: { isPublished: true }
            }),
            connection_1.prisma.payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: {
                        gte: startDate
                    }
                },
                _sum: {
                    amount: true
                }
            }),
            connection_1.prisma.user.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    lastLoginAt: true
                }
            }),
            this.getSystemHealth(),
            this.calculateSuccessRate(startDate),
            connection_1.prisma.payment.findMany({
                take: 10,
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            })
        ]);
        const userGrowth = await this.getUserGrowthData(timeframe);
        const subscriptionStats = await connection_1.prisma.user.groupBy({
            by: ['subscriptionTier'],
            _count: {
                subscriptionTier: true
            }
        });
        const recentActivities = await this.getEnhancedRecentActivities(startDate);
        return {
            stats: {
                totalUsers,
                activeUsers,
                totalCourses,
                totalTests,
                totalRevenue: totalRevenue._sum.amount || 0,
                successRate,
                userGrowthRate: this.calculateGrowthRate(userGrowth),
                systemStatus: systemHealth.status
            },
            charts: {
                userGrowth,
                subscriptionDistribution: subscriptionStats.map(stat => ({
                    tier: stat.subscriptionTier,
                    count: stat._count.subscriptionTier
                }))
            },
            recentUsers,
            recentActivities,
            recentPayments,
            systemHealth
        };
    }
    static async calculateSuccessRate(startDate) {
        try {
            const completedAttempts = await connection_1.prisma.testAttempt.findMany({
                where: {
                    status: 'COMPLETED',
                    completedAt: {
                        gte: startDate
                    },
                    score: {
                        not: null
                    }
                },
                select: {
                    score: true,
                    maxScore: true
                }
            });
            if (completedAttempts.length === 0) {
                return 0;
            }
            const passedAttempts = completedAttempts.filter(attempt => {
                const maxScore = attempt.maxScore || 100;
                const percentage = ((attempt.score || 0) / maxScore) * 100;
                return percentage >= 60;
            });
            const successRate = (passedAttempts.length / completedAttempts.length) * 100;
            return Math.round(successRate);
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate success rate', error);
            return 0;
        }
    }
    static async getEnhancedRecentActivities(startDate) {
        try {
            const activities = [];
            const recentRegistrations = await connection_1.prisma.user.findMany({
                where: {
                    createdAt: { gte: startDate }
                },
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    createdAt: true
                }
            });
            recentRegistrations.forEach(user => {
                const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                let roleLabel = 'utilisateur';
                if (user.role === 'ADMIN')
                    roleLabel = 'administrateur';
                else if (user.role === 'SENIOR_MANAGER')
                    roleLabel = 'tuteur senior';
                else if (user.role === 'JUNIOR_MANAGER')
                    roleLabel = 'tuteur junior';
                else
                    roleLabel = 'élève';
                activities.push({
                    type: 'registration',
                    userId: user.id,
                    userName,
                    action: `s'est inscrit comme ${roleLabel}`,
                    timestamp: user.createdAt,
                    status: 'success'
                });
            });
            const recentLogins = await connection_1.prisma.user.findMany({
                where: {
                    lastLoginAt: {
                        gte: startDate,
                        not: null
                    }
                },
                take: 15,
                orderBy: { lastLoginAt: 'desc' },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    lastLoginAt: true
                }
            });
            recentLogins.forEach(user => {
                const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                activities.push({
                    type: 'login',
                    userId: user.id,
                    userName,
                    action: 's\'est connecté',
                    timestamp: user.lastLoginAt,
                    status: 'info'
                });
            });
            const recentPayments = await connection_1.prisma.payment.findMany({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });
            recentPayments.forEach(payment => {
                const userName = payment.user
                    ? `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim() || payment.user.email
                    : 'Utilisateur inconnu';
                activities.push({
                    type: 'payment',
                    userId: payment.userId,
                    userName,
                    action: `a effectué un paiement de ${payment.amount} ${payment.currency || 'XAF'}`,
                    timestamp: payment.createdAt,
                    status: 'success'
                });
            });
            const analyticsEvents = await connection_1.prisma.analyticsEvent.findMany({
                where: {
                    createdAt: { gte: startDate },
                    eventType: {
                        in: ['user_login', 'user_logout', 'user_registered', 'course_enrolled', 'test_completed']
                    }
                },
                take: 10,
                orderBy: { createdAt: 'desc' }
            });
            analyticsEvents.forEach(event => {
                let action = event.eventType;
                if (event.eventType === 'course_enrolled')
                    action = 'inscrit à un cours';
                if (event.eventType === 'test_completed')
                    action = 'a terminé un test';
                activities.push({
                    type: event.eventType,
                    userId: event.userId,
                    userName: 'Utilisateur',
                    action,
                    timestamp: event.createdAt,
                    status: 'info'
                });
            });
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return activities.slice(0, 20);
        }
        catch (error) {
            logger_1.logger.error('Failed to get enhanced recent activities', error);
            return [];
        }
    }
    static async getSystemHealth() {
        try {
            await connection_1.prisma.$queryRaw `SELECT 1`;
            const [dbSize, activeConnections, errorCount, avgResponseTime] = await Promise.all([
                Promise.resolve('2.5GB'),
                Promise.resolve(45),
                connection_1.prisma.analyticsEvent.count({
                    where: {
                        eventType: 'error',
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                        }
                    }
                }),
                Promise.resolve(120)
            ]);
            return {
                status: 'healthy',
                database: {
                    status: 'connected',
                    size: dbSize,
                    activeConnections
                },
                performance: {
                    avgResponseTime,
                    errorCount,
                    uptime: process.uptime()
                },
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('System health check failed', error);
            return {
                status: 'unhealthy',
                error: 'Database connection failed'
            };
        }
    }
    static async getBusinessMetrics(period, category) {
        const startDate = this.getStartDate(period);
        const [revenue, subscriptions, userEngagement, contentStats] = await Promise.all([
            connection_1.prisma.payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                },
                _sum: { amount: true },
                _count: true
            }),
            connection_1.prisma.subscription.groupBy({
                by: ['tier', 'status'],
                _count: true,
                where: {
                    createdAt: { gte: startDate }
                }
            }),
            connection_1.prisma.analyticsEvent.groupBy({
                by: ['eventType'],
                _count: true,
                where: {
                    createdAt: { gte: startDate }
                }
            }),
            {
                courses: await connection_1.prisma.course.count({ where: { isPublished: true } }),
                tests: await connection_1.prisma.test.count({ where: { isPublished: true } }),
                liveSessions: await connection_1.prisma.liveSession.count()
            }
        ]);
        return {
            revenue: {
                total: revenue._sum.amount || 0,
                transactions: revenue._count,
                averageTransaction: revenue._count > 0 ? (revenue._sum.amount || 0) / revenue._count : 0
            },
            subscriptions,
            userEngagement,
            contentStats
        };
    }
    static async getTechnicalMetrics() {
        const systemHealth = await this.getSystemHealth();
        return {
            ...systemHealth,
            api: {
                totalEndpoints: 50,
                averageResponseTime: 120,
                errorRate: 0.02
            },
            security: {
                activeTokens: await connection_1.prisma.refreshToken.count(),
                failedLogins: 5,
                lastSecurityScan: new Date()
            }
        };
    }
    static async getAllUsers(pagination, filters) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } }
            ];
        }
        if (filters.role && filters.role !== 'all') {
            const roleMap = {
                'USER': 'STUDENT',
                'STUDENT': 'STUDENT',
                'ADMIN': 'ADMIN',
                'JUNIOR_MANAGER': 'JUNIOR_MANAGER',
                'SENIOR_MANAGER': 'SENIOR_MANAGER'
            };
            const mappedRole = roleMap[filters.role] || filters.role;
            where.role = mappedRole;
        }
        if (filters.status && filters.status !== 'all') {
            where.status = filters.status;
        }
        if (filters.subscription && filters.subscription !== 'all') {
            where.subscriptionTier = filters.subscription;
        }
        const [users, total] = await Promise.all([
            connection_1.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    status: true,
                    subscriptionTier: true,
                    createdAt: true,
                    lastLoginAt: true,
                    _count: {
                        select: {
                            courseEnrollments: true,
                            testAttempts: true
                        }
                    }
                }
            }),
            connection_1.prisma.user.count({ where })
        ]);
        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    static async getUserAnalytics(userId, period) {
        const startDate = this.getStartDate(period);
        const [user, courseProgress, testResults, activityLog] = await Promise.all([
            connection_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    subscriptions: true,
                    _count: {
                        select: {
                            courseEnrollments: true,
                            testAttempts: true,
                            posts: true,
                            comments: true
                        }
                    }
                }
            }),
            connection_1.prisma.courseEnrollment.findMany({
                where: {
                    userId,
                    enrolledAt: { gte: startDate }
                },
                include: {
                    course: {
                        select: { title: true, level: true, category: true }
                    }
                }
            }),
            connection_1.prisma.testAttempt.findMany({
                where: {
                    userId,
                    startedAt: { gte: startDate }
                },
                include: {
                    test: {
                        select: { title: true, level: true, category: true }
                    }
                }
            }),
            connection_1.prisma.analyticsEvent.findMany({
                where: {
                    userId,
                    createdAt: { gte: startDate }
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            })
        ]);
        return {
            user,
            courseProgress,
            testResults,
            activityLog,
            summary: {
                totalCourses: courseProgress.length,
                totalTests: testResults.length,
                averageScore: testResults.length > 0
                    ? testResults.reduce((sum, test) => sum + (test.score || 0), 0) / testResults.length
                    : 0,
                totalActivity: activityLog.length
            }
        };
    }
    static getStartDate(timeframe) {
        const now = new Date();
        switch (timeframe) {
            case '7d':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case '30d':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case '90d':
                return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            case '1y':
                return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
    }
    static async getUserGrowthData(timeframe) {
        return [
            { date: '2024-01-01', users: 100 },
            { date: '2024-01-15', users: 150 },
            { date: '2024-02-01', users: 200 },
            { date: '2024-02-15', users: 280 }
        ];
    }
    static calculateGrowthRate(growthDataOrPrevious, current) {
        if (typeof growthDataOrPrevious === 'number' && typeof current === 'number') {
            if (growthDataOrPrevious === 0)
                return current > 0 ? 100 : 0;
            return Math.round(((current - growthDataOrPrevious) / growthDataOrPrevious) * 100);
        }
        else if (Array.isArray(growthDataOrPrevious)) {
            if (growthDataOrPrevious.length < 2)
                return 0;
            const first = growthDataOrPrevious[0].users;
            const last = growthDataOrPrevious[growthDataOrPrevious.length - 1].users;
            return ((last - first) / first) * 100;
        }
        return 0;
    }
    static async getManagers(filters) {
        const where = {
            role: {
                in: [client_1.UserRole.JUNIOR_MANAGER, client_1.UserRole.SENIOR_MANAGER]
            }
        };
        if (filters.role) {
            where.role = filters.role;
        }
        const managers = await connection_1.prisma.user.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                lastLoginAt: true,
                _count: {
                    select: {
                        createdCourses: true,
                        createdTests: true,
                        createdLiveSessions: true,
                        posts: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return managers;
    }
    static async createManager(managerData, createdById) {
        const hashedPassword = await password_1.PasswordService.hashPassword(managerData.password);
        const manager = await connection_1.prisma.user.create({
            data: {
                email: managerData.email,
                passwordHash: hashedPassword,
                firstName: managerData.firstName,
                lastName: managerData.lastName,
                role: managerData.role,
                status: 'ACTIVE',
                subscriptionTier: 'FREE'
            }
        });
        await connection_1.prisma.auditLog.create({
            data: {
                userId: createdById,
                action: 'CREATE',
                resource: 'users',
                resourceId: manager.id,
                newValues: {
                    email: manager.email,
                    role: manager.role,
                    firstName: manager.firstName,
                    lastName: manager.lastName
                }
            }
        });
        return manager;
    }
    static async updateManager(managerId, updateData, updatedById) {
        const oldManager = await connection_1.prisma.user.findUnique({
            where: { id: managerId }
        });
        if (!oldManager) {
            throw new Error('Manager not found');
        }
        const manager = await connection_1.prisma.user.update({
            where: { id: managerId },
            data: updateData
        });
        await connection_1.prisma.auditLog.create({
            data: {
                userId: updatedById,
                action: 'UPDATE',
                resource: 'users',
                resourceId: managerId,
                oldValues: oldManager,
                newValues: updateData
            }
        });
        return manager;
    }
    static async getManagerPerformance(managerId, period) {
        const startDate = this.getStartDate(period);
        const [contentCreated, userEngagement, performanceMetrics] = await Promise.all([
            {
                courses: await connection_1.prisma.course.count({
                    where: {
                        createdById: managerId,
                        createdAt: { gte: startDate }
                    }
                }),
                tests: await connection_1.prisma.test.count({
                    where: {
                        createdById: managerId,
                        createdAt: { gte: startDate }
                    }
                }),
                liveSessions: await connection_1.prisma.liveSession.count({
                    where: {
                        createdById: managerId,
                        createdAt: { gte: startDate }
                    }
                }),
                posts: await connection_1.prisma.post.count({
                    where: {
                        authorId: managerId,
                        createdAt: { gte: startDate }
                    }
                })
            },
            connection_1.prisma.courseEnrollment.count({
                where: {
                    course: {
                        createdById: managerId
                    },
                    enrolledAt: { gte: startDate }
                }
            }),
            {
                averageRating: 4.5,
                totalViews: 1250,
                completionRate: 85
            }
        ]);
        return {
            contentCreated,
            userEngagement,
            performanceMetrics,
            period
        };
    }
    static async getAnalytics(category, timeframe = '30d', filters) {
        const startDate = this.getStartDate(timeframe);
        const endDate = new Date();
        try {
            const totalUsers = await connection_1.prisma.user.count();
            const newUsers = await connection_1.prisma.user.count({
                where: { createdAt: { gte: startDate } }
            });
            const activeUsers = await connection_1.prisma.user.count({
                where: {
                    lastActivityAt: { gte: startDate },
                    status: 'ACTIVE'
                }
            });
            const subscriptionDistribution = await connection_1.prisma.user.groupBy({
                by: ['subscriptionTier'],
                _count: true
            });
            const payments = await connection_1.prisma.payment.findMany({
                where: {
                    createdAt: { gte: startDate }
                },
                orderBy: { createdAt: 'desc' }
            });
            const paymentUserIds = payments.map(p => p.userId);
            const users = await connection_1.prisma.user.findMany({
                where: {
                    id: { in: paymentUserIds }
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    country: true,
                    subscriptionTier: true
                }
            });
            const userMap = new Map(users.map(user => [user.id, user]));
            const revenueData = await connection_1.prisma.payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                },
                _sum: { amount: true },
                _count: true
            });
            const totalRevenue = revenueData._sum.amount || 0;
            const totalTransactions = revenueData._count;
            const monthlyRevenueData = await connection_1.prisma.payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                },
                _sum: { amount: true }
            });
            const monthlyRevenue = monthlyRevenueData._sum.amount || 0;
            const successfulPayments = await connection_1.prisma.payment.count({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                }
            });
            const failedPayments = await connection_1.prisma.payment.count({
                where: {
                    status: 'FAILED',
                    createdAt: { gte: startDate }
                }
            });
            const averageOrderValue = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;
            const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
            const previousUsers = await connection_1.prisma.user.count({
                where: { createdAt: { gte: previousPeriodStart, lt: startDate } }
            });
            const userGrowth = previousUsers > 0 ? ((newUsers - previousUsers) / previousUsers) * 100 : 0;
            const previousRevenueData = await connection_1.prisma.payment.aggregate({
                where: {
                    createdAt: { gte: previousPeriodStart, lt: startDate },
                    status: 'COMPLETED'
                },
                _sum: { amount: true }
            });
            const previousRevenue = previousRevenueData._sum.amount || 0;
            const revenueGrowth = previousRevenue > 0 ?
                ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
            const paymentsByMethod = await connection_1.prisma.payment.groupBy({
                by: ['paymentMethod'],
                _count: true,
                where: {
                    createdAt: { gte: startDate },
                    status: 'COMPLETED'
                }
            });
            const totalCompletedPayments = paymentsByMethod.reduce((sum, method) => sum + method._count, 0);
            const paymentMethodStats = paymentsByMethod.map(method => ({
                method: method.paymentMethod === 'STRIPE' ? 'Carte bancaire' :
                    method.paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' :
                        method.paymentMethod === 'ORANGE_MONEY' ? 'Orange Money' :
                            method.paymentMethod === 'PAYPAL' ? 'PayPal' : method.paymentMethod,
                count: method._count,
                percentage: totalCompletedPayments > 0 ? (method._count / totalCompletedPayments) * 100 : 0
            }));
            const geographicDistribution = await connection_1.prisma.user.groupBy({
                by: ['country'],
                _count: true,
                where: {
                    country: { not: null },
                    createdAt: { gte: startDate }
                }
            });
            const geoStats = await Promise.all(geographicDistribution.map(async (geo) => {
                const countryUsers = await connection_1.prisma.user.findMany({
                    where: { country: geo.country },
                    select: { id: true }
                });
                const countryUserIds = countryUsers.map(u => u.id);
                const revenueData = await connection_1.prisma.payment.aggregate({
                    where: {
                        userId: { in: countryUserIds },
                        status: 'COMPLETED',
                        createdAt: { gte: startDate }
                    },
                    _sum: { amount: true }
                });
                return {
                    country: geo.country || 'Unknown',
                    count: geo._count,
                    revenue: revenueData._sum.amount || 0
                };
            }));
            const revenueByTier = await Promise.all(subscriptionDistribution.map(async (tier) => {
                const tierUsers = await connection_1.prisma.user.findMany({
                    where: { subscriptionTier: tier.subscriptionTier },
                    select: { id: true }
                });
                const tierUserIds = tierUsers.map(u => u.id);
                const tierRevenue = await connection_1.prisma.payment.aggregate({
                    where: {
                        userId: { in: tierUserIds },
                        status: 'COMPLETED',
                        createdAt: { gte: startDate }
                    },
                    _sum: { amount: true }
                });
                return {
                    tier: tier.subscriptionTier,
                    count: tier._count,
                    revenue: tierRevenue._sum.amount || 0
                };
            }));
            const totalVisitors = await connection_1.prisma.analyticsEvent.count({
                where: {
                    eventType: 'PAGE_VIEW',
                    createdAt: { gte: startDate }
                }
            });
            const conversionRate = totalVisitors > 0 ? (newUsers / totalVisitors) * 100 : 0;
            const churnedUsers = await connection_1.prisma.user.count({
                where: {
                    status: 'INACTIVE',
                    updatedAt: { gte: startDate }
                }
            });
            const churnRate = totalUsers > 0 ? (churnedUsers / totalUsers) * 100 : 0;
            const revenueByPeriod = await connection_1.prisma.payment.groupBy({
                by: ['createdAt'],
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                },
                _sum: { amount: true },
                orderBy: { createdAt: 'asc' }
            });
            const formattedRevenueByPeriod = revenueByPeriod.map(item => ({
                date: item.createdAt.toISOString().split('T')[0],
                revenue: item._sum.amount || 0
            }));
            return {
                totalRevenue,
                monthlyRevenue,
                totalTransactions,
                successfulPayments,
                failedPayments,
                averageOrderValue,
                revenueGrowth,
                userGrowth,
                conversionRate,
                churnRate,
                payments: payments.map(p => {
                    const user = userMap.get(p.userId);
                    return {
                        id: p.id,
                        amount: p.amount,
                        currency: p.currency,
                        status: p.status.toLowerCase(),
                        method: p.paymentMethod.toLowerCase(),
                        customerEmail: user?.email || 'Unknown',
                        customerName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                        createdAt: p.createdAt.toISOString(),
                        subscriptionTier: user?.subscriptionTier || 'FREE',
                        country: user?.country || 'Unknown',
                        paymentProvider: p.paymentMethod.toLowerCase()
                    };
                }),
                revenueByPeriod: formattedRevenueByPeriod,
                paymentsByMethod: paymentMethodStats,
                subscriptionDistribution: revenueByTier,
                geographicDistribution: geoStats,
                userStats: {
                    totalUsers,
                    newUsers,
                    activeUsers,
                    subscriptionDistribution
                },
                timeframe,
                category,
                filters
            };
        }
        catch (error) {
            console.error('Error fetching analytics:', error);
            throw error;
        }
    }
    static async generateReport(reportConfig, generatedById) {
        const report = {
            id: `report_${Date.now()}`,
            type: reportConfig.type,
            generatedAt: new Date(),
            generatedById,
            data: {
                summary: 'Report generated successfully',
                metrics: {
                    totalUsers: await connection_1.prisma.user.count(),
                    totalCourses: await connection_1.prisma.course.count(),
                    totalTests: await connection_1.prisma.test.count()
                }
            }
        };
        return report;
    }
    static async exportData(format, filters, exportedById) {
        try {
            const [users, courses, tests, payments, sessions] = await Promise.all([
                connection_1.prisma.user.findMany({
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        status: true,
                        subscriptionTier: true,
                        createdAt: true,
                        lastLoginAt: true
                    }
                }),
                connection_1.prisma.course.findMany({
                    select: {
                        id: true,
                        title: true,
                        level: true,
                        isPublished: true,
                        createdAt: true,
                        _count: {
                            select: {
                                enrollments: true
                            }
                        }
                    }
                }),
                connection_1.prisma.test.findMany({
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        level: true,
                        isPublished: true,
                        createdAt: true,
                        _count: {
                            select: {
                                attempts: true
                            }
                        }
                    }
                }),
                connection_1.prisma.payment.findMany({
                    where: {
                        status: 'COMPLETED'
                    },
                    select: {
                        id: true,
                        amount: true,
                        currency: true,
                        subscriptionId: true,
                        createdAt: true,
                        userId: true
                    }
                }),
                connection_1.prisma.liveSession.findMany({
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        date: true,
                        duration: true,
                        maxParticipants: true,
                        _count: {
                            select: {
                                participants: true
                            }
                        }
                    }
                })
            ]);
            const exportData = {
                users,
                courses,
                tests,
                payments,
                sessions,
                exportedAt: new Date(),
                exportedById
            };
            const filename = `admin_export_${Date.now()}.${format}`;
            return {
                format,
                filename,
                url: `/exports/${filename}`,
                data: exportData,
                generatedAt: new Date(),
                exportedById,
                recordCount: {
                    users: users.length,
                    courses: courses.length,
                    tests: tests.length,
                    payments: payments.length,
                    sessions: sessions.length
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to export admin data', error);
            throw error;
        }
    }
    static async getReviewRequests(userId, userRole) {
        try {
            const reviewRequests = await connection_1.prisma.reviewRequest.findMany({
                where: {
                    OR: [
                        { tutorId: userId },
                        ...(userRole === 'ADMIN' ? [{ status: 'PENDING' }] : [])
                    ]
                },
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            profileImage: true
                        }
                    },
                    tutor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    feedback: {
                        select: {
                            id: true,
                            submissionType: true,
                            aiScore: true,
                            maxScore: true,
                            aiConfidence: true,
                            overallFeedback: true,
                            strengths: true,
                            weaknesses: true,
                            recommendations: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return reviewRequests;
        }
        catch (error) {
            logger_1.logger.error('Failed to get review requests', error);
            throw error;
        }
    }
    static async handleReviewRequest(requestId, action, data) {
        try {
            const { tutorId, response, humanFeedback, humanScore } = data;
            const updatedRequest = await connection_1.prisma.reviewRequest.update({
                where: { id: requestId },
                data: {
                    status: action.toUpperCase(),
                    response: response,
                    updatedAt: new Date()
                },
                include: {
                    feedback: true,
                    student: true
                }
            });
            if (action === 'complete' && updatedRequest.feedback) {
                await connection_1.prisma.aIFeedback.update({
                    where: { id: updatedRequest.feedbackId },
                    data: {
                        status: 'HUMAN_COMPLETED',
                        humanReviewerId: tutorId,
                        humanFeedback: humanFeedback,
                        humanScore: humanScore,
                        humanReviewDate: new Date()
                    }
                });
            }
            return updatedRequest;
        }
        catch (error) {
            logger_1.logger.error('Failed to handle review request', error);
            throw error;
        }
    }
    static async createSubscriptionPlan(planData) {
        try {
            const plan = await connection_1.prisma.subscriptionPlan.create({
                data: {
                    name: planData.name,
                    nameEn: planData.nameEn,
                    description: planData.description,
                    descriptionEn: planData.descriptionEn,
                    tier: planData.tier,
                    price: planData.price,
                    currency: planData.currency || 'FCFA',
                    billingCycle: planData.billingCycle || 'monthly',
                    features: planData.features || [],
                    featuresEn: planData.featuresEn || [],
                    maxSimulations: planData.maxSimulations,
                    maxLiveSessions: planData.maxLiveSessions,
                    maxCourses: planData.maxCourses,
                    maxTests: planData.maxTests,
                    isActive: planData.isActive !== undefined ? planData.isActive : true,
                    isPopular: planData.isPopular || false,
                    sortOrder: planData.sortOrder || 0,
                    stripePriceId: planData.stripePriceId
                }
            });
            logger_1.logger.info('Subscription plan created successfully', { planId: plan.id });
            return plan;
        }
        catch (error) {
            logger_1.logger.error('Failed to create subscription plan', { planData, error });
            throw error;
        }
    }
    static async getSubscriptionPlans() {
        try {
            const plans = await connection_1.prisma.subscriptionPlan.findMany({
                orderBy: [
                    { sortOrder: 'asc' },
                    { createdAt: 'desc' }
                ]
            });
            return plans;
        }
        catch (error) {
            logger_1.logger.error('Failed to get subscription plans', { error });
            throw error;
        }
    }
    static async getSubscriptionPlanById(id) {
        try {
            const plan = await connection_1.prisma.subscriptionPlan.findUnique({
                where: { id }
            });
            if (!plan) {
                throw new Error('Subscription plan not found');
            }
            return plan;
        }
        catch (error) {
            logger_1.logger.error('Failed to get subscription plan by ID', { id, error });
            throw error;
        }
    }
    static async updateSubscriptionPlan(id, updateData) {
        try {
            const plan = await connection_1.prisma.subscriptionPlan.update({
                where: { id },
                data: {
                    ...updateData,
                    updatedAt: new Date()
                }
            });
            logger_1.logger.info('Subscription plan updated successfully', { planId: id });
            return plan;
        }
        catch (error) {
            logger_1.logger.error('Failed to update subscription plan', { id, updateData, error });
            throw error;
        }
    }
    static async deleteSubscriptionPlan(id) {
        try {
            await connection_1.prisma.subscriptionPlan.delete({
                where: { id }
            });
            logger_1.logger.info('Subscription plan deleted successfully', { planId: id });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete subscription plan', { id, error });
            throw error;
        }
    }
    static async getSubscriptionAnalytics() {
        try {
            const [totalSubscriptions, activeSubscriptions, totalRevenue, plansCount] = await Promise.all([
                connection_1.prisma.subscription.count(),
                connection_1.prisma.subscription.count({
                    where: { status: 'ACTIVE' }
                }),
                connection_1.prisma.payment.aggregate({
                    where: { status: 'COMPLETED' },
                    _sum: { amount: true }
                }),
                connection_1.prisma.subscriptionPlan.count()
            ]);
            return {
                totalSubscriptions,
                activeSubscriptions,
                totalRevenue: totalRevenue._sum.amount || 0,
                plansCount,
                monthlyGrowth: 0,
                churnRate: 0
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get subscription analytics', { error });
            throw error;
        }
    }
    static async getAudioSimulations(filters) {
        try {
            const { page, limit, status, level, search } = filters;
            const skip = (page - 1) * limit;
            const where = {};
            if (status)
                where.status = status;
            if (level)
                where.level = level;
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } }
                ];
            }
            const [simulations, total] = await Promise.all([
                connection_1.prisma.voiceSimulation.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                connection_1.prisma.voiceSimulation.count({ where })
            ]);
            return {
                simulations,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get audio simulations', { error });
            throw error;
        }
    }
    static async getAudioSimulation(id) {
        try {
            const simulation = await connection_1.prisma.voiceSimulation.findUnique({
                where: { id }
            });
            if (!simulation) {
                throw new Error('Audio simulation not found');
            }
            return simulation;
        }
        catch (error) {
            logger_1.logger.error('Failed to get audio simulation', { error });
            throw error;
        }
    }
    static async createAudioSimulation(data) {
        try {
            const simulation = await connection_1.prisma.voiceSimulation.create({
                data: {
                    userId: 'system',
                    scheduledDate: new Date(),
                    status: 'SCHEDULED',
                    questionsData: data,
                    duration: data.duration || 420,
                    voicePreference: data.voicePreference || 'france_female_1'
                }
            });
            return simulation;
        }
        catch (error) {
            logger_1.logger.error('Failed to create audio simulation', { error });
            throw error;
        }
    }
    static async updateAudioSimulation(id, data) {
        try {
            const simulation = await connection_1.prisma.voiceSimulation.update({
                where: { id },
                data: {
                    questionsData: data,
                    duration: data.duration,
                    voicePreference: data.voicePreference
                }
            });
            return simulation;
        }
        catch (error) {
            logger_1.logger.error('Failed to update audio simulation', { error });
            throw error;
        }
    }
    static async deleteAudioSimulation(id) {
        try {
            await connection_1.prisma.voiceSimulation.delete({
                where: { id }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete audio simulation', { error });
            throw error;
        }
    }
    static async getImmigrationSimulations(filters) {
        try {
            const { page, limit, status, country, immigrationType, level, search } = filters;
            const skip = (page - 1) * limit;
            const where = {};
            if (status)
                where.status = status;
            if (country)
                where.country = { contains: country, mode: 'insensitive' };
            if (immigrationType)
                where.immigrationType = immigrationType;
            if (level)
                where.level = level;
            if (search) {
                where.OR = [
                    { country: { contains: search, mode: 'insensitive' } },
                    { immigrationType: { contains: search, mode: 'insensitive' } }
                ];
            }
            const [simulations, total] = await Promise.all([
                connection_1.prisma.immigrationSimulation.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                connection_1.prisma.immigrationSimulation.count({ where })
            ]);
            return {
                simulations,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get immigration simulations', { error });
            throw error;
        }
    }
    static async getImmigrationSimulation(id) {
        try {
            const simulation = await connection_1.prisma.immigrationSimulation.findUnique({
                where: { id }
            });
            if (!simulation) {
                throw new Error('Immigration simulation not found');
            }
            return simulation;
        }
        catch (error) {
            logger_1.logger.error('Failed to get immigration simulation', { error });
            throw error;
        }
    }
    static async createImmigrationSimulation(data) {
        try {
            const simulation = await connection_1.prisma.immigrationSimulation.create({
                data: {
                    userId: 'system',
                    country: data.country,
                    immigrationType: data.immigrationType,
                    level: data.level,
                    status: 'draft',
                    personalInfo: JSON.stringify(data),
                    questions: JSON.stringify(data.questions),
                    responses: '{}',
                    duration: data.duration || 900,
                    voicePreference: data.voicePreference || 'france_female_1'
                }
            });
            return simulation;
        }
        catch (error) {
            logger_1.logger.error('Failed to create immigration simulation', { error });
            throw error;
        }
    }
    static async updateImmigrationSimulation(id, data) {
        try {
            const simulation = await connection_1.prisma.immigrationSimulation.update({
                where: { id },
                data: {
                    country: data.country,
                    immigrationType: data.immigrationType,
                    level: data.level,
                    personalInfo: JSON.stringify(data),
                    questions: JSON.stringify(data.questions),
                    duration: data.duration,
                    voicePreference: data.voicePreference
                }
            });
            return simulation;
        }
        catch (error) {
            logger_1.logger.error('Failed to update immigration simulation', { error });
            throw error;
        }
    }
    static async deleteImmigrationSimulation(id) {
        try {
            await connection_1.prisma.immigrationSimulation.delete({
                where: { id }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete immigration simulation', { error });
            throw error;
        }
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=adminService.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerService = void 0;
const connection_1 = require("../database/connection");
const client_1 = require("@prisma/client");
const notificationService_1 = require("../services/notificationService");
const logger_1 = require("../utils/logger");
class ManagerService {
    static async getDashboardData(managerId, timeframe, team) {
        const startDate = this.getStartDate(timeframe);
        const [contentStats, userStats, performanceMetrics, recentActivity] = await Promise.all([
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
            {
                totalEnrollments: await connection_1.prisma.courseEnrollment.count({
                    where: {
                        course: {
                            createdById: managerId
                        },
                        enrolledAt: { gte: startDate }
                    }
                }),
                totalTestAttempts: await connection_1.prisma.testAttempt.count({
                    where: {
                        test: {
                            createdById: managerId
                        },
                        startedAt: { gte: startDate }
                    }
                }),
                averageScore: await this.getAverageScore(managerId, startDate)
            },
            {
                contentViews: 1250,
                userSatisfaction: 4.7,
                completionRate: 85
            },
            await this.getRecentActivity(managerId, 10)
        ]);
        return {
            stats: {
                ...contentStats,
                ...userStats,
                ...performanceMetrics
            },
            recentActivity,
            timeframe
        };
    }
    static async getMetrics(managerId, period, category) {
        const startDate = this.getStartDate(period);
        const metrics = await Promise.all([
            connection_1.prisma.course.findMany({
                where: {
                    createdById: managerId,
                    createdAt: { gte: startDate }
                },
                include: {
                    _count: {
                        select: {
                            enrollments: true
                        }
                    }
                }
            }),
            connection_1.prisma.test.findMany({
                where: {
                    createdById: managerId,
                    createdAt: { gte: startDate }
                },
                include: {
                    _count: {
                        select: {
                            attempts: true
                        }
                    }
                }
            }),
            connection_1.prisma.analyticsEvent.groupBy({
                by: ['eventType'],
                _count: true,
                where: {
                    createdAt: { gte: startDate }
                }
            })
        ]);
        return {
            contentPerformance: metrics[0],
            testPerformance: metrics[1],
            userEngagement: metrics[2],
            period,
            category
        };
    }
    static async getActivity(managerId, limit, type) {
        const activities = await connection_1.prisma.analyticsEvent.findMany({
            where: {
                userId: managerId,
                ...(type && { eventType: type })
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        return activities;
    }
    static async getAnalytics(managerId, timeframe, category, filters) {
        const startDate = this.getStartDate(timeframe);
        const analytics = await connection_1.prisma.analyticsEvent.groupBy({
            by: ['eventType'],
            _count: true,
            where: {
                userId: managerId,
                createdAt: { gte: startDate }
            }
        });
        return {
            analytics,
            timeframe,
            category,
            filters
        };
    }
    static async generateReport(managerId, reportConfig) {
        const report = {
            id: `manager_report_${Date.now()}`,
            type: reportConfig.type,
            managerId,
            generatedAt: new Date(),
            data: {
                summary: 'Manager report generated successfully',
                metrics: await this.getMetrics(managerId, reportConfig.timeframe || '30d')
            }
        };
        return report;
    }
    static async exportData(managerId, format, filters) {
        return {
            format,
            url: `/exports/manager_${managerId}_${Date.now()}.${format}`,
            generatedAt: new Date(),
            managerId
        };
    }
    static async getManagedUsers(managerId, managerRole, pagination, filters) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const where = {};
        if (managerRole === client_1.UserRole.JUNIOR_MANAGER) {
            where.role = client_1.UserRole.STUDENT;
        }
        else if (managerRole === client_1.UserRole.SENIOR_MANAGER) {
            where.role = {
                in: [client_1.UserRole.STUDENT, client_1.UserRole.JUNIOR_MANAGER]
            };
        }
        if (filters.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } }
            ];
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
    static async getUserAnalytics(userId, managerId, managerRole) {
        const user = await connection_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        if (managerRole === client_1.UserRole.JUNIOR_MANAGER && user.role !== client_1.UserRole.STUDENT) {
            throw new Error('Access denied');
        }
        const startDate = this.getStartDate('30d');
        const [courseProgress, testResults, activityLog] = await Promise.all([
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
                take: 20
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
                    : 0
            }
        };
    }
    static async sendMessageToUser(userId, managerId, title, message, type = 'INFO') {
        await notificationService_1.NotificationService.sendSystemNotification(userId, title, message, type, { fromManager: managerId });
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
    static async getAverageScore(managerId, startDate) {
        const result = await connection_1.prisma.testAttempt.aggregate({
            where: {
                test: {
                    createdById: managerId
                },
                startedAt: { gte: startDate },
                score: { not: null }
            },
            _avg: {
                score: true
            }
        });
        return result._avg.score || 0;
    }
    static async getRecentActivity(managerId, limit) {
        return await connection_1.prisma.analyticsEvent.findMany({
            where: {
                userId: managerId
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
    static async getContentLibrary(managerId, filters) {
        const where = {};
        if (filters.type) {
            if (filters.type === 'courses') {
                const courses = await connection_1.prisma.course.findMany({
                    where: {
                        createdById: managerId,
                        ...(filters.status && { isPublished: filters.status === 'published' })
                    },
                    orderBy: { createdAt: 'desc' }
                });
                return { type: 'courses', content: courses };
            }
            else if (filters.type === 'tests') {
                const tests = await connection_1.prisma.test.findMany({
                    where: {
                        createdById: managerId,
                        ...(filters.status && { isPublished: filters.status === 'published' })
                    },
                    orderBy: { createdAt: 'desc' }
                });
                return { type: 'tests', content: tests };
            }
            else if (filters.type === 'posts') {
                const posts = await connection_1.prisma.post.findMany({
                    where: {
                        authorId: managerId,
                        ...(filters.status && { status: filters.status.toUpperCase() })
                    },
                    orderBy: { createdAt: 'desc' }
                });
                return { type: 'posts', content: posts };
            }
        }
        const [courses, tests, posts, liveSessions] = await Promise.all([
            connection_1.prisma.course.findMany({
                where: { createdById: managerId },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),
            connection_1.prisma.test.findMany({
                where: { createdById: managerId },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),
            connection_1.prisma.post.findMany({
                where: { authorId: managerId },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),
            connection_1.prisma.liveSession.findMany({
                where: { createdById: managerId },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
        ]);
        return {
            courses,
            tests,
            posts,
            liveSessions
        };
    }
    static async createContent(managerId, contentData) {
        const { type, ...data } = contentData;
        switch (type) {
            case 'post':
                return await connection_1.prisma.post.create({
                    data: {
                        ...data,
                        authorId: managerId,
                        status: 'DRAFT'
                    }
                });
            case 'course':
                return await connection_1.prisma.course.create({
                    data: {
                        ...data,
                        createdById: managerId,
                        isPublished: false
                    }
                });
            case 'test':
                return await connection_1.prisma.test.create({
                    data: {
                        ...data,
                        createdById: managerId,
                        isPublished: false
                    }
                });
            default:
                throw new Error('Invalid content type');
        }
    }
    static async updateContent(contentId, managerId, updateData) {
        const { type, ...data } = updateData;
        let content;
        switch (type) {
            case 'post':
                content = await connection_1.prisma.post.findFirst({
                    where: { id: contentId, authorId: managerId }
                });
                if (!content)
                    throw new Error('Post not found or access denied');
                return await connection_1.prisma.post.update({
                    where: { id: contentId },
                    data
                });
            case 'course':
                content = await connection_1.prisma.course.findFirst({
                    where: { id: contentId, createdById: managerId }
                });
                if (!content)
                    throw new Error('Course not found or access denied');
                return await connection_1.prisma.course.update({
                    where: { id: contentId },
                    data
                });
            case 'test':
                content = await connection_1.prisma.test.findFirst({
                    where: { id: contentId, createdById: managerId }
                });
                if (!content)
                    throw new Error('Test not found or access denied');
                return await connection_1.prisma.test.update({
                    where: { id: contentId },
                    data
                });
            default:
                throw new Error('Invalid content type');
        }
    }
    static async publishContent(contentId, managerId) {
        const [post, course, test] = await Promise.all([
            connection_1.prisma.post.findFirst({
                where: { id: contentId, authorId: managerId }
            }),
            connection_1.prisma.course.findFirst({
                where: { id: contentId, createdById: managerId }
            }),
            connection_1.prisma.test.findFirst({
                where: { id: contentId, createdById: managerId }
            })
        ]);
        if (post) {
            return await connection_1.prisma.post.update({
                where: { id: contentId },
                data: {
                    status: 'PUBLISHED',
                    publishedAt: new Date()
                }
            });
        }
        else if (course) {
            return await connection_1.prisma.course.update({
                where: { id: contentId },
                data: { isPublished: true }
            });
        }
        else if (test) {
            return await connection_1.prisma.test.update({
                where: { id: contentId },
                data: { isPublished: true }
            });
        }
        else {
            throw new Error('Content not found or access denied');
        }
    }
    static async getContentAnalytics(contentId, managerId) {
        try {
            const [courseAnalytics, testAnalytics, sessionAnalytics] = await Promise.all([
                connection_1.prisma.course.findFirst({
                    where: {
                        id: contentId,
                        createdById: managerId
                    },
                    select: {
                        id: true,
                        title: true,
                        _count: {
                            select: {
                                enrollments: true,
                                lessons_data: true
                            }
                        },
                        enrollments: {
                            select: {
                                progress: true,
                                completedAt: true,
                                user: {
                                    select: {
                                        id: true
                                    }
                                }
                            }
                        }
                    }
                }),
                connection_1.prisma.test.findFirst({
                    where: {
                        id: contentId,
                        createdById: managerId
                    },
                    select: {
                        id: true,
                        title: true,
                        _count: {
                            select: {
                                attempts: true
                            }
                        },
                        attempts: {
                            select: {
                                score: true,
                                completedAt: true,
                                user: {
                                    select: {
                                        id: true
                                    }
                                }
                            }
                        }
                    }
                }),
                connection_1.prisma.liveSession.findFirst({
                    where: {
                        id: contentId,
                        createdById: managerId
                    },
                    select: {
                        id: true,
                        title: true,
                        _count: {
                            select: {
                                participants: true
                            }
                        },
                        participants: {
                            select: {
                                attended: true,
                                engagementScore: true,
                                user: {
                                    select: {
                                        id: true
                                    }
                                }
                            }
                        }
                    }
                })
            ]);
            if (courseAnalytics) {
                const completions = courseAnalytics.enrollments.filter(e => e.completedAt).length;
                const averageProgress = courseAnalytics.enrollments.reduce((sum, e) => sum + e.progress, 0) / courseAnalytics.enrollments.length || 0;
                return {
                    contentId,
                    type: 'course',
                    title: courseAnalytics.title,
                    enrollments: courseAnalytics._count.enrollments,
                    completions,
                    completionRate: courseAnalytics._count.enrollments > 0 ? (completions / courseAnalytics._count.enrollments) * 100 : 0,
                    averageProgress: Math.round(averageProgress),
                    totalLessons: courseAnalytics._count.lessons_data
                };
            }
            if (testAnalytics) {
                const averageScore = testAnalytics.attempts.reduce((sum, a) => sum + (a.score || 0), 0) / testAnalytics.attempts.length || 0;
                const completions = testAnalytics.attempts.filter(a => a.completedAt).length;
                return {
                    contentId,
                    type: 'test',
                    title: testAnalytics.title,
                    attempts: testAnalytics._count.attempts,
                    completions,
                    completionRate: testAnalytics._count.attempts > 0 ? (completions / testAnalytics._count.attempts) * 100 : 0,
                    averageScore: Math.round(averageScore)
                };
            }
            if (sessionAnalytics) {
                const attendanceRate = sessionAnalytics.participants.filter(p => p.attended).length / sessionAnalytics._count.participants || 0;
                const averageEngagement = sessionAnalytics.participants.reduce((sum, p) => sum + p.engagementScore, 0) / sessionAnalytics.participants.length || 0;
                return {
                    contentId,
                    type: 'session',
                    title: sessionAnalytics.title,
                    participants: sessionAnalytics._count.participants,
                    attendanceRate: Math.round(attendanceRate * 100),
                    averageEngagement: Math.round(averageEngagement)
                };
            }
            return {
                contentId,
                error: 'Content not found or access denied'
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get content analytics', error);
            throw error;
        }
    }
}
exports.ManagerService = ManagerService;
//# sourceMappingURL=managerService.js.map
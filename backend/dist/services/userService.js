"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const connection_1 = require("../database/connection");
const password_1 = require("../utils/password");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class UserService {
    static async calculateUserAchievements(userId) {
        try {
            const testAttempts = await connection_1.prisma.testAttempt.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
            const totalTests = testAttempts.length;
            const successfulTests = testAttempts.filter(attempt => attempt.score && attempt.score >= 60).length;
            const completionPercentage = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;
            const totalPoints = testAttempts.reduce((sum, attempt) => {
                return sum + (attempt.score || 0);
            }, 0);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const weeklyTests = testAttempts.filter(attempt => attempt.createdAt >= weekAgo);
            const weeklyPoints = weeklyTests.reduce((sum, attempt) => {
                return sum + (attempt.score || 0);
            }, 0);
            const cefrLevel = this.calculateCEFRLevel(totalPoints);
            const skillLevels = {
                grammar: { level: cefrLevel.level, subLevel: cefrLevel.subLevel, progress: Math.min(100, (totalPoints / 10)) },
                vocabulary: { level: cefrLevel.level, subLevel: cefrLevel.subLevel, progress: Math.min(100, (totalPoints / 10)) },
                listening: { level: cefrLevel.level, subLevel: cefrLevel.subLevel, progress: Math.min(100, (totalPoints / 10)) },
                reading: { level: cefrLevel.level, subLevel: cefrLevel.subLevel, progress: Math.min(100, (totalPoints / 10)) },
                speaking: { level: cefrLevel.level, subLevel: cefrLevel.subLevel, progress: Math.min(100, (totalPoints / 10)) },
                writing: { level: cefrLevel.level, subLevel: cefrLevel.subLevel, progress: Math.min(100, (totalPoints / 10)) }
            };
            return {
                totalPoints,
                successfulTests,
                totalTests,
                completionPercentage,
                weeklyPoints,
                currentCEFRLevel: cefrLevel.level,
                cefrSubLevel: cefrLevel.subLevel,
                skillLevels,
                recentTests: testAttempts.slice(0, 5)
            };
        }
        catch (error) {
            console.error('Error calculating user achievements:', error);
            return {
                totalPoints: 0,
                successfulTests: 0,
                totalTests: 0,
                completionPercentage: 0,
                weeklyPoints: 0,
                currentCEFRLevel: "A1",
                cefrSubLevel: 1,
                skillLevels: {
                    grammar: { level: "A1", subLevel: 1, progress: 0 },
                    vocabulary: { level: "A1", subLevel: 1, progress: 0 },
                    listening: { level: "A1", subLevel: 1, progress: 0 },
                    reading: { level: "A1", subLevel: 1, progress: 0 },
                    speaking: { level: "A1", subLevel: 1, progress: 0 },
                    writing: { level: "A1", subLevel: 1, progress: 0 }
                },
                recentTests: []
            };
        }
    }
    static calculateCEFRLevel(points) {
        if (points >= 5000)
            return { level: "C2", subLevel: 2 };
        if (points >= 4500)
            return { level: "C2", subLevel: 1 };
        if (points >= 4000)
            return { level: "C1", subLevel: 2 };
        if (points >= 3500)
            return { level: "C1", subLevel: 1 };
        if (points >= 3000)
            return { level: "B2", subLevel: 2 };
        if (points >= 2500)
            return { level: "B2", subLevel: 1 };
        if (points >= 2000)
            return { level: "B1", subLevel: 2 };
        if (points >= 1500)
            return { level: "B1", subLevel: 1 };
        if (points >= 1000)
            return { level: "A2", subLevel: 2 };
        if (points >= 500)
            return { level: "A2", subLevel: 1 };
        if (points >= 100)
            return { level: "A1", subLevel: 2 };
        return { level: "A1", subLevel: 1 };
    }
    static async getUserById(userId) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    subscriptions: {
                        where: { status: 'ACTIVE' },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    courseEnrollments: {
                        include: {
                            course: {
                                select: {
                                    id: true,
                                    title: true,
                                    level: true,
                                    category: true
                                }
                            }
                        }
                    },
                    testAttempts: {
                        include: {
                            test: {
                                select: {
                                    id: true,
                                    title: true,
                                    type: true,
                                    level: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    }
                }
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            const stats = await this.calculateUserStats(userId);
            const { passwordHash, ...userProfile } = user;
            return {
                ...userProfile,
                stats
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user by ID', { userId, error });
            throw error;
        }
    }
    static async updateUserProfile(userId, updateData) {
        try {
            const existingUser = await connection_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!existingUser) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            const updatedUser = await connection_1.prisma.user.update({
                where: { id: userId },
                data: {
                    ...updateData,
                    updatedAt: new Date()
                },
                include: {
                    subscriptions: {
                        where: { status: 'ACTIVE' },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });
            const stats = await this.calculateUserStats(userId);
            const { passwordHash, ...userProfile } = updatedUser;
            logger_1.logger.info('User profile updated successfully', { userId });
            return {
                ...userProfile,
                stats
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update user profile', { userId, error });
            throw error;
        }
    }
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            const isCurrentPasswordValid = await password_1.PasswordService.verifyPassword(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                throw new errorHandler_1.ValidationError('Current password is incorrect');
            }
            const passwordValidation = password_1.PasswordService.validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                throw new errorHandler_1.ValidationError(`New password validation failed: ${passwordValidation.errors.join(', ')}`);
            }
            const newPasswordHash = await password_1.PasswordService.hashPassword(newPassword);
            await connection_1.prisma.user.update({
                where: { id: userId },
                data: {
                    passwordHash: newPasswordHash,
                    updatedAt: new Date()
                }
            });
            await connection_1.prisma.refreshToken.deleteMany({
                where: { userId }
            });
            logger_1.logger.info('User password changed successfully', { userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to change user password', { userId, error });
            throw error;
        }
    }
    static async getAllUsers(pagination, filters, requestingUserRole) {
        try {
            if (![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(requestingUserRole)) {
                throw new errorHandler_1.AuthorizationError('Access denied. Manager role required.');
            }
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
            const { search, status, tier, role } = filters;
            const where = {};
            if (search) {
                where.OR = [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ];
            }
            if (status) {
                where.status = status;
            }
            if (tier) {
                where.subscriptionTier = tier;
            }
            if (role) {
                where.role = role;
            }
            const total = await connection_1.prisma.user.count({ where });
            const users = await connection_1.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    subscriptionTier: true,
                    profileImage: true,
                    phone: true,
                    dateOfBirth: true,
                    country: true,
                    city: true,
                    bio: true,
                    preferences: true,
                    emailVerifiedAt: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                    subscriptions: {
                        where: { status: 'ACTIVE' },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit
            });
            const totalPages = Math.ceil(total / limit);
            logger_1.logger.info('Users retrieved successfully', {
                total,
                page,
                limit,
                requestingUserRole
            });
            return {
                users: users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get all users', { error });
            throw error;
        }
    }
    static async updateUserRole(userId, newRole, requestingUserRole) {
        try {
            if (requestingUserRole !== client_1.UserRole.ADMIN) {
                throw new errorHandler_1.AuthorizationError('Access denied. Admin role required.');
            }
            const existingUser = await connection_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!existingUser) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            const updatedUser = await connection_1.prisma.user.update({
                where: { id: userId },
                data: {
                    role: newRole,
                    updatedAt: new Date()
                },
                include: {
                    subscriptions: {
                        where: { status: 'ACTIVE' },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });
            const stats = await this.calculateUserStats(userId);
            const { passwordHash, ...userProfile } = updatedUser;
            logger_1.logger.info('User role updated successfully', {
                userId,
                oldRole: existingUser.role,
                newRole
            });
            return {
                ...userProfile,
                stats
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update user role', { userId, newRole, error });
            throw error;
        }
    }
    static async updateUserStatus(userId, newStatus, requestingUserRole) {
        try {
            if (![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER].includes(requestingUserRole)) {
                throw new errorHandler_1.AuthorizationError('Access denied. Senior Manager or Admin role required.');
            }
            const existingUser = await connection_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!existingUser) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            const updatedUser = await connection_1.prisma.user.update({
                where: { id: userId },
                data: {
                    status: newStatus,
                    updatedAt: new Date()
                },
                include: {
                    subscriptions: {
                        where: { status: 'ACTIVE' },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });
            if (newStatus === client_1.UserStatus.SUSPENDED || newStatus === client_1.UserStatus.INACTIVE) {
                await connection_1.prisma.refreshToken.deleteMany({
                    where: { userId }
                });
            }
            const stats = await this.calculateUserStats(userId);
            const { passwordHash, ...userProfile } = updatedUser;
            logger_1.logger.info('User status updated successfully', {
                userId,
                oldStatus: existingUser.status,
                newStatus
            });
            return {
                ...userProfile,
                stats
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update user status', { userId, newStatus, error });
            throw error;
        }
    }
    static async deleteUser(userId, requestingUserRole) {
        try {
            if (requestingUserRole !== client_1.UserRole.ADMIN) {
                throw new errorHandler_1.AuthorizationError('Access denied. Admin role required.');
            }
            const existingUser = await connection_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!existingUser) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            await connection_1.prisma.user.delete({
                where: { id: userId }
            });
            logger_1.logger.info('User deleted successfully', { userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete user', { userId, error });
            throw error;
        }
    }
    static async calculateUserStats(userId) {
        try {
            let coursesCompleted = 0;
            try {
                coursesCompleted = await connection_1.prisma.courseEnrollment.count({
                    where: {
                        userId,
                        completedAt: { not: null }
                    }
                });
            }
            catch (error) {
                logger_1.logger.warn('Failed to count course enrollments', { userId, error: error.message });
            }
            let testsCompleted = 0;
            try {
                testsCompleted = await connection_1.prisma.testAttempt.count({
                    where: {
                        userId,
                        status: 'COMPLETED'
                    }
                });
            }
            catch (error) {
                logger_1.logger.warn('Failed to count test attempts', { userId, error: error.message });
            }
            let totalTimeSpent = 0;
            try {
                const timeSpentResult = await connection_1.prisma.userProgress.aggregate({
                    where: { userId },
                    _sum: { timeSpent: true }
                }).catch(() => null);
                totalTimeSpent = timeSpentResult?._sum?.timeSpent || 0;
            }
            catch (error) {
                logger_1.logger.warn('userProgress table not available, using default', { userId });
                totalTimeSpent = 0;
            }
            let averageScore = 0;
            try {
                const scoreResult = await connection_1.prisma.testAttempt.aggregate({
                    where: {
                        userId,
                        status: 'COMPLETED',
                        score: { not: null }
                    },
                    _avg: { score: true }
                });
                averageScore = scoreResult._avg.score || 0;
            }
            catch (error) {
                logger_1.logger.warn('Failed to calculate average score', { userId, error: error.message });
            }
            return {
                coursesCompleted,
                testsCompleted,
                totalTimeSpent,
                averageScore
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate user stats', { userId, error: error.message });
            return {
                coursesCompleted: 0,
                testsCompleted: 0,
                totalTimeSpent: 0,
                averageScore: 0
            };
        }
    }
    static async getUsersByManager(managerId, options = {}) {
        try {
            const { page = 1, limit = 10, search, role, status } = options;
            const skip = (page - 1) * limit;
            const whereClause = {
                role: client_1.UserRole.STUDENT
            };
            if (search) {
                whereClause.OR = [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ];
            }
            if (role) {
                whereClause.role = role;
            }
            if (status) {
                whereClause.status = status;
            }
            const [users, total] = await Promise.all([
                connection_1.prisma.user.findMany({
                    where: whereClause,
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        status: true,
                        subscriptionTier: true,
                        profileImage: true,
                        lastLoginAt: true,
                        createdAt: true,
                        _count: {
                            select: {
                                courseEnrollments: true,
                                testAttempts: true
                            }
                        }
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                }),
                connection_1.prisma.user.count({ where: whereClause })
            ]);
            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get users by manager', { managerId, error });
            throw error;
        }
    }
    static async assignUsersToManager(managerId, userIds, requestingUserRole) {
        try {
            if (requestingUserRole !== client_1.UserRole.ADMIN && requestingUserRole !== client_1.UserRole.SENIOR_MANAGER) {
                throw new errorHandler_1.AuthorizationError('Access denied. Admin or Senior Manager role required.');
            }
            const manager = await connection_1.prisma.user.findUnique({
                where: { id: managerId }
            });
            if (!manager || (manager.role !== client_1.UserRole.JUNIOR_MANAGER && manager.role !== client_1.UserRole.SENIOR_MANAGER)) {
                throw new errorHandler_1.NotFoundError('Manager not found or invalid role');
            }
            const result = { count: userIds.length };
            logger_1.logger.info('Users assigned to manager', { managerId, userIds, count: result.count });
            return {
                managerId,
                assignedCount: result.count,
                userIds
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to assign users to manager', { managerId, userIds, error });
            throw error;
        }
    }
    static async getUserLearningAnalytics(userId) {
        try {
            const [enrollments, testAttempts, liveSessionParticipation, achievements, recentActivity] = await Promise.all([
                connection_1.prisma.courseEnrollment.findMany({
                    where: { userId },
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                level: true,
                                duration: true
                            }
                        }
                    },
                    orderBy: { enrolledAt: 'desc' }
                }),
                connection_1.prisma.testAttempt.findMany({
                    where: { userId },
                    include: {
                        test: {
                            select: {
                                id: true,
                                title: true,
                                type: true,
                                level: true
                            }
                        }
                    },
                    orderBy: { startedAt: 'desc' },
                    take: 20
                }),
                connection_1.prisma.liveSessionParticipant.findMany({
                    where: { userId },
                    include: {
                        liveSession: {
                            select: {
                                id: true,
                                title: true,
                                date: true,
                                duration: true
                            }
                        }
                    },
                    orderBy: { joinedAt: 'desc' },
                    take: 10
                }),
                connection_1.prisma.userAchievement.findMany({
                    where: { userId },
                    include: {
                        achievement: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                icon: true
                            }
                        }
                    },
                    orderBy: { unlockedAt: 'desc' }
                }).catch(() => []),
                this.getUserRecentActivity(userId)
            ]);
            const completedCourses = enrollments.filter(e => e.completedAt).length;
            const averageProgress = enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length || 0;
            const averageTestScore = testAttempts.reduce((sum, t) => sum + (t.score || 0), 0) / testAttempts.length || 0;
            const totalStudyTime = enrollments.reduce((sum, e) => sum + 0, 0);
            return {
                overview: {
                    totalCourses: enrollments.length,
                    completedCourses,
                    averageProgress: Math.round(averageProgress),
                    totalTests: testAttempts.length,
                    averageTestScore: Math.round(averageTestScore),
                    totalStudyTime,
                    liveSessionsAttended: liveSessionParticipation.filter(p => p.attended).length,
                    achievementsEarned: achievements.length
                },
                enrollments,
                testAttempts,
                liveSessionParticipation,
                achievements,
                recentActivity
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user learning analytics', { userId, error });
            throw error;
        }
    }
    static async getUserRecentActivity(userId) {
        try {
            const [recentEnrollments, recentTests, recentSessions] = await Promise.all([
                connection_1.prisma.courseEnrollment.findMany({
                    where: {
                        userId,
                        enrolledAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    },
                    include: {
                        course: { select: { title: true } }
                    },
                    orderBy: { enrolledAt: 'desc' },
                    take: 5
                }),
                connection_1.prisma.testAttempt.findMany({
                    where: {
                        userId,
                        startedAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    },
                    include: {
                        test: { select: { title: true } }
                    },
                    orderBy: { startedAt: 'desc' },
                    take: 5
                }),
                connection_1.prisma.liveSessionParticipant.findMany({
                    where: {
                        userId,
                        joinedAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    },
                    include: {
                        liveSession: { select: { title: true } }
                    },
                    orderBy: { joinedAt: 'desc' },
                    take: 5
                })
            ]);
            const activities = [
                ...recentEnrollments.map(e => ({
                    type: 'enrollment',
                    title: `Enrolled in ${e.course?.title || 'Unknown Course'}`,
                    date: e.enrolledAt,
                    progress: e.progress
                })),
                ...recentTests.map(t => ({
                    type: 'test',
                    title: `Completed ${t.test.title}`,
                    date: t.startedAt,
                    score: t.score
                })),
                ...recentSessions.map(s => ({
                    type: 'session',
                    title: `Joined ${s.liveSession.title}`,
                    date: s.joinedAt,
                    attended: s.attended
                }))
            ];
            return activities
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10);
        }
        catch (error) {
            logger_1.logger.error('Failed to get user recent activity', { userId, error });
            return [];
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map
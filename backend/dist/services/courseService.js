"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseService = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class CourseService {
    static async createCourse(courseData, createdById, creatorRole) {
        try {
            if (![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(creatorRole)) {
                throw new errorHandler_1.AuthorizationError('Access denied. Manager role required.');
            }
            const course = await connection_1.prisma.course.create({
                data: {
                    ...courseData,
                    createdById,
                    isPublished: false
                },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    },
                    enrollments: true,
                    lessons_data: true,
                    _count: {
                        select: {
                            enrollments: true,
                            lessons_data: true
                        }
                    }
                }
            });
            logger_1.logger.info('Course created successfully', {
                courseId: course.id,
                title: course.title,
                createdById
            });
            return course;
        }
        catch (error) {
            logger_1.logger.error('Failed to create course', { courseData, createdById, error });
            throw error;
        }
    }
    static async getCourseById(courseId, userId) {
        try {
            const course = await connection_1.prisma.course.findUnique({
                where: { id: courseId },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    },
                    enrollments: userId ? {
                        where: { userId },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    } : {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    },
                    lessons_data: {
                        orderBy: { order: 'asc' }
                    },
                    progress: userId ? {
                        where: { userId }
                    } : undefined,
                    _count: {
                        select: {
                            enrollments: true,
                            lessons_data: true
                        }
                    }
                }
            });
            if (!course) {
                throw new errorHandler_1.NotFoundError('Course not found');
            }
            if (course.requiredTier !== client_1.SubscriptionTier.FREE && userId) {
                if (course.createdById === userId) {
                }
                else {
                    const user = await connection_1.prisma.user.findUnique({
                        where: { id: userId },
                        select: { subscriptionTier: true }
                    });
                    if (user && !this.hasAccessToTier(user.subscriptionTier, course.requiredTier)) {
                        throw new errorHandler_1.AuthorizationError('Subscription upgrade required to access this course');
                    }
                }
            }
            const courseWithDetails = {
                ...course,
                userProgress: course.progress?.[0],
                isFavorited: false,
                isEnrolled: userId ? (course.enrollments.some(e => e.userId === userId) ||
                    course.createdById === userId) : false,
                progress: course.progress?.[0] ? {
                    completedLessons: 0,
                    totalLessons: course._count.lessons_data,
                    percentage: course.progress[0].progressPercentage
                } : undefined
            };
            return courseWithDetails;
        }
        catch (error) {
            logger_1.logger.error('Failed to get course by ID', { courseId, userId, error });
            throw error;
        }
    }
    static async getAllCourses(pagination, filters, userId, userRole) {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
            const { search, level, category, tier } = filters;
            const where = {};
            if (!userRole || ![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(userRole)) {
                where.isPublished = true;
            }
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { titleEn: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { tags: { has: search } }
                ];
            }
            if (level) {
                where.level = level;
            }
            if (category) {
                where.category = category;
            }
            if (tier) {
                where.requiredTier = tier;
            }
            const allCourses = await connection_1.prisma.course.findMany({
                where,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    },
                    enrollments: userId ? {
                        where: { userId }
                    } : {
                        take: 0
                    },
                    progress: userId ? {
                        where: { userId }
                    } : undefined,
                    lessons_data: {
                        orderBy: { order: 'asc' },
                        select: {
                            id: true,
                            title: true,
                            content: true,
                            videoUrl: true,
                            duration: true,
                            order: true,
                            resources: true
                        }
                    },
                    _count: {
                        select: {
                            enrollments: true,
                            lessons_data: true
                        }
                    }
                },
                orderBy: { [sortBy]: sortOrder }
            });
            let userSubscriptionTier = client_1.SubscriptionTier.FREE;
            logger_1.logger.info('🔍 Getting user subscription tier', { userId, hasUserId: !!userId });
            if (userId) {
                const user = await connection_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: { subscriptionTier: true, email: true }
                });
                if (user) {
                    if (user.subscriptionTier) {
                        userSubscriptionTier = user.subscriptionTier;
                        logger_1.logger.info('✅ User subscription tier fetched', {
                            userId,
                            email: user.email,
                            subscriptionTier: userSubscriptionTier
                        });
                    }
                    else {
                        logger_1.logger.warn('⚠️ User found but no subscription tier', { userId, email: user.email });
                    }
                }
                else {
                    logger_1.logger.warn('⚠️ User not found in database', { userId });
                }
            }
            else {
                logger_1.logger.warn('⚠️ No userId provided, defaulting to FREE tier - THIS IS THE PROBLEM!');
            }
            const courseMap = new Map();
            for (const course of allCourses) {
                let availableSubs = [];
                const subsField = course.availableSubscriptions;
                if (subsField != null && subsField !== 'null' && subsField !== '') {
                    try {
                        if (typeof subsField === 'string') {
                            if (subsField.trim().startsWith('[') || subsField.trim().startsWith('{')) {
                                availableSubs = JSON.parse(subsField);
                            }
                            else {
                                availableSubs = [subsField];
                            }
                        }
                        else if (Array.isArray(subsField)) {
                            availableSubs = subsField;
                        }
                        else if (typeof subsField === 'object') {
                            availableSubs = [];
                        }
                    }
                    catch (e) {
                        availableSubs = [];
                    }
                }
                if (availableSubs.length === 0) {
                    availableSubs = [course.requiredTier];
                }
                const isFreeCourse = course.requiredTier === client_1.SubscriptionTier.FREE || availableSubs.includes(client_1.SubscriptionTier.FREE);
                let hasAccess = false;
                let requiredTierForAccess = course.requiredTier;
                if (isFreeCourse) {
                    hasAccess = true;
                    requiredTierForAccess = client_1.SubscriptionTier.FREE;
                    logger_1.logger.debug('FREE course - granting access', { courseId: course.id, title: course.title });
                }
                else {
                    logger_1.logger.debug('Checking paid course access', {
                        courseId: course.id,
                        title: course.title,
                        userSubscriptionTier,
                        availableSubs,
                        requiredTier: course.requiredTier
                    });
                    for (const tier of availableSubs) {
                        const canAccess = this.hasAccessToTier(userSubscriptionTier, tier);
                        logger_1.logger.debug('Access check', {
                            userTier: userSubscriptionTier,
                            courseTier: tier,
                            canAccess,
                            courseTitle: course.title
                        });
                        if (canAccess) {
                            hasAccess = true;
                            requiredTierForAccess = tier;
                            break;
                        }
                    }
                    if (!hasAccess) {
                        const tierHierarchy = {
                            [client_1.SubscriptionTier.FREE]: 0,
                            [client_1.SubscriptionTier.ESSENTIAL]: 1,
                            [client_1.SubscriptionTier.PREMIUM]: 2,
                            [client_1.SubscriptionTier.PRO]: 3
                        };
                        const userTierLevel = tierHierarchy[userSubscriptionTier];
                        const requiredTiers = availableSubs.map(t => ({
                            tier: t,
                            level: tierHierarchy[t]
                        })).filter(t => t.level > userTierLevel);
                        if (requiredTiers.length > 0) {
                            requiredTierForAccess = requiredTiers.sort((a, b) => a.level - b.level)[0].tier;
                        }
                        else {
                            requiredTierForAccess = availableSubs[0] || course.requiredTier;
                        }
                    }
                }
                course.hasAccess = hasAccess;
                course.requiredTierForAccess = requiredTierForAccess;
                const normalizedTitle = course.title.trim().toLowerCase();
                if (!courseMap.has(normalizedTitle)) {
                    courseMap.set(normalizedTitle, course);
                }
                else {
                    const existing = courseMap.get(normalizedTitle);
                    const existingLessons = existing?.lessons_data?.length || 0;
                    const currentLessons = course.lessons_data?.length || 0;
                    if (currentLessons > existingLessons ||
                        (currentLessons === existingLessons && course.createdAt > existing.createdAt)) {
                        courseMap.set(normalizedTitle, course);
                    }
                }
            }
            const uniqueCourses = Array.from(courseMap.values());
            const total = uniqueCourses.length;
            const totalPages = Math.ceil(total / limit);
            const paginatedCourses = uniqueCourses.slice((page - 1) * limit, page * limit);
            const coursesWithDetails = paginatedCourses.map(course => {
                const realDuration = course.lessons_data && course.lessons_data.length > 0
                    ? course.lessons_data.reduce((total, lesson) => {
                        const lessonDuration = lesson.duration || 0;
                        return total + lessonDuration;
                    }, 0)
                    : 0;
                let availableLevels = [];
                if (course.availableLevels) {
                    try {
                        const levels = course.availableLevels;
                        if (typeof levels === 'string') {
                            availableLevels = JSON.parse(levels);
                        }
                        else if (Array.isArray(levels)) {
                            availableLevels = levels;
                        }
                    }
                    catch (e) {
                        availableLevels = [course.level];
                    }
                }
                if (availableLevels.length === 0) {
                    availableLevels = [course.level];
                }
                let availableSubscriptions = [];
                if (course.availableSubscriptions) {
                    try {
                        const subs = course.availableSubscriptions;
                        if (typeof subs === 'string') {
                            availableSubscriptions = JSON.parse(subs);
                        }
                        else if (Array.isArray(subs)) {
                            availableSubscriptions = subs;
                        }
                    }
                    catch (e) {
                        availableSubscriptions = [course.requiredTier];
                    }
                }
                if (availableSubscriptions.length === 0) {
                    availableSubscriptions = [course.requiredTier];
                }
                return {
                    ...course,
                    duration: realDuration,
                    lessons_data: course.lessons_data,
                    availableLevels: availableLevels,
                    availableSubscriptions: availableSubscriptions,
                    thumbnail: course.thumbnail,
                    userProgress: course.progress?.[0],
                    isFavorited: false,
                    isEnrolled: course.enrollments.length > 0,
                    hasAccess: course.hasAccess ?? true,
                    requiredTierForAccess: course.requiredTierForAccess ?? course.requiredTier,
                    progress: course.progress?.[0] ? {
                        completedLessons: 0,
                        totalLessons: course._count.lessons_data,
                        percentage: course.progress[0].progressPercentage
                    } : undefined
                };
            });
            return {
                courses: coursesWithDetails,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get all courses', { error });
            throw error;
        }
    }
    static async updateCourse(courseId, updateData, userId, userRole) {
        try {
            const existingCourse = await connection_1.prisma.course.findUnique({
                where: { id: courseId }
            });
            if (!existingCourse) {
                throw new errorHandler_1.NotFoundError('Course not found');
            }
            if (userRole !== client_1.UserRole.ADMIN && existingCourse.createdById !== userId) {
                throw new errorHandler_1.AuthorizationError('Access denied. You can only edit your own courses.');
            }
            const updatedCourse = await connection_1.prisma.course.update({
                where: { id: courseId },
                data: {
                    ...updateData,
                    updatedAt: new Date()
                },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    },
                    enrollments: true,
                    lessons_data: {
                        orderBy: { order: 'asc' }
                    },
                    _count: {
                        select: {
                            enrollments: true,
                            lessons_data: true
                        }
                    }
                }
            });
            logger_1.logger.info('Course updated successfully', {
                courseId,
                title: updatedCourse.title,
                updatedBy: userId
            });
            return updatedCourse;
        }
        catch (error) {
            logger_1.logger.error('Failed to update course', { courseId, updateData, userId, error });
            throw error;
        }
    }
    static async deleteCourse(courseId, userId, userRole) {
        try {
            const existingCourse = await connection_1.prisma.course.findUnique({
                where: { id: courseId }
            });
            if (!existingCourse) {
                throw new errorHandler_1.NotFoundError('Course not found');
            }
            if (userRole !== client_1.UserRole.ADMIN && existingCourse.createdById !== userId) {
                throw new errorHandler_1.AuthorizationError('Access denied. You can only delete your own courses.');
            }
            await connection_1.prisma.course.delete({
                where: { id: courseId }
            });
            logger_1.logger.info('Course deleted successfully', { courseId, deletedBy: userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete course', { courseId, userId, error });
            throw error;
        }
    }
    static async enrollInCourse(courseId, userId) {
        try {
            const course = await connection_1.prisma.course.findUnique({
                where: { id: courseId }
            });
            if (!course) {
                throw new errorHandler_1.NotFoundError('Course not found');
            }
            if (!course.isPublished) {
                throw new errorHandler_1.ValidationError('Course is not published');
            }
            if (course.createdById === userId) {
                throw new errorHandler_1.ValidationError('Course creators have automatic access to their own courses');
            }
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId },
                select: { subscriptionTier: true }
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            if (!this.hasAccessToTier(user.subscriptionTier, course.requiredTier)) {
                throw new errorHandler_1.AuthorizationError('Subscription upgrade required to enroll in this course');
            }
            const existingEnrollment = await connection_1.prisma.courseEnrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId
                    }
                }
            });
            if (existingEnrollment) {
                throw new errorHandler_1.ConflictError('Already enrolled in this course');
            }
            await connection_1.prisma.courseEnrollment.create({
                data: {
                    userId,
                    courseId,
                    enrolledAt: new Date()
                }
            });
            await connection_1.prisma.course.update({
                where: { id: courseId },
                data: {
                    enrolledCount: {
                        increment: 1
                    }
                }
            });
            logger_1.logger.info('User enrolled in course successfully', { courseId, userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to enroll in course', { courseId, userId, error });
            throw error;
        }
    }
    static async unenrollFromCourse(courseId, userId) {
        try {
            const enrollment = await connection_1.prisma.courseEnrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId
                    }
                }
            });
            if (!enrollment) {
                throw new errorHandler_1.NotFoundError('Not enrolled in this course');
            }
            await connection_1.prisma.courseEnrollment.delete({
                where: {
                    userId_courseId: {
                        userId,
                        courseId
                    }
                }
            });
            await connection_1.prisma.course.update({
                where: { id: courseId },
                data: {
                    enrolledCount: {
                        decrement: 1
                    }
                }
            });
            logger_1.logger.info('User unenrolled from course successfully', { courseId, userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to unenroll from course', { courseId, userId, error });
            throw error;
        }
    }
    static async getUserEnrolledCourses(userId, pagination) {
        try {
            const { page = 1, limit = 10, sortBy = 'enrolledAt', sortOrder = 'desc' } = pagination;
            const total = await connection_1.prisma.courseEnrollment.count({
                where: { userId }
            });
            const enrollments = await connection_1.prisma.courseEnrollment.findMany({
                where: { userId },
                include: {
                    course: {
                        include: {
                            createdBy: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    role: true
                                }
                            },
                            progress: {
                                where: { userId }
                            },
                            _count: {
                                select: {
                                    enrollments: true,
                                    lessons_data: true
                                }
                            }
                        }
                    }
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit
            });
            const totalPages = Math.ceil(total / limit);
            const courses = enrollments.map(enrollment => ({
                ...enrollment.course,
                userProgress: enrollment.course.progress[0],
                isFavorited: false,
                isEnrolled: true,
                progress: enrollment.course.progress[0] ? {
                    completedLessons: 0,
                    totalLessons: enrollment.course._count.lessons_data,
                    percentage: enrollment.course.progress[0].progressPercentage
                } : undefined
            }));
            return {
                courses,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user enrolled courses', { userId, error });
            throw error;
        }
    }
    static async getCourseStatistics(userId, userRole) {
        try {
            const whereClause = { createdById: userId };
            const [totalCourses, publishedCourses, totalEnrollments, averageRating] = await Promise.all([
                connection_1.prisma.course.count({ where: whereClause }),
                connection_1.prisma.course.count({
                    where: { ...whereClause, isPublished: true }
                }),
                connection_1.prisma.courseEnrollment.count({
                    where: {
                        course: whereClause
                    }
                }),
                Promise.resolve(4.5)
            ]);
            return {
                totalCourses,
                publishedCourses,
                totalEnrollments,
                averageRating
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get course statistics', { userId, error });
            throw error;
        }
    }
    static hasAccessToTier(userTier, requiredTier) {
        const tierHierarchy = {
            [client_1.SubscriptionTier.FREE]: 0,
            [client_1.SubscriptionTier.ESSENTIAL]: 1,
            [client_1.SubscriptionTier.PREMIUM]: 2,
            [client_1.SubscriptionTier.PRO]: 3
        };
        return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
    }
}
exports.CourseService = CourseService;
//# sourceMappingURL=courseService.js.map
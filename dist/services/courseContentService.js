"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonService = exports.CourseContentService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const prisma = new client_1.PrismaClient();
class CourseContentService {
    static async createCourse(data, createdById) {
        try {
            if (!data.title || data.title.trim().length === 0) {
                throw new errors_1.ValidationError('Course title is required');
            }
            if (!data.description || data.description.trim().length === 0) {
                throw new errors_1.ValidationError('Course description is required');
            }
            if (data.title.length > 200) {
                throw new errors_1.ValidationError('Course title must not exceed 200 characters');
            }
            if (data.description.length > 2000) {
                throw new errors_1.ValidationError('Course description must not exceed 2000 characters');
            }
            if (data.price && data.price < 0) {
                throw new errors_1.ValidationError('Course price cannot be negative');
            }
            const course = await prisma.course.create({
                data: {
                    title: data.title.trim(),
                    description: data.description.trim(),
                    level: data.level,
                    category: data.category,
                    duration: data.duration,
                    price: data.price,
                    tags: data.tags || [],
                    thumbnail: data.thumbnail,
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
                }
            });
            logger_1.logger.info('Course created', {
                courseId: course.id,
                title: course.title,
                createdById
            });
            return {
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level,
                category: course.category,
                isPublished: course.isPublished,
                createdAt: course.createdAt,
                updatedAt: course.updatedAt,
                duration: course.duration,
                price: course.price,
                tags: course.tags,
                thumbnail: course.thumbnail,
                createdBy: {
                    id: course.createdById,
                    firstName: 'Unknown',
                    lastName: 'User',
                    role: 'ADMIN'
                },
                lessons: [],
                _count: {
                    lesson_items: course._count.lessons_data,
                    enrollments: course._count.enrollments,
                    lessons: course._count.lessons_data
                },
                isEnrolled: false,
                progress: {
                    completedLessons: 0,
                    totalLessons: course._count.lessons_data,
                    percentage: 0
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create course', { data, createdById, error });
            throw error;
        }
    }
    static async updateCourse(courseId, data, userId) {
        try {
            const existingCourse = await prisma.course.findUnique({
                where: { id: courseId },
                select: { id: true, createdById: true, title: true }
            });
            if (!existingCourse) {
                throw new errors_1.NotFoundError('Course not found');
            }
            if (existingCourse.createdById !== userId) {
                throw new errors_1.ForbiddenError('You can only update your own courses');
            }
            if (data.title !== undefined) {
                if (!data.title || data.title.trim().length === 0) {
                    throw new errors_1.ValidationError('Course title cannot be empty');
                }
                if (data.title.length > 200) {
                    throw new errors_1.ValidationError('Course title must not exceed 200 characters');
                }
            }
            if (data.description !== undefined) {
                if (!data.description || data.description.trim().length === 0) {
                    throw new errors_1.ValidationError('Course description cannot be empty');
                }
                if (data.description.length > 2000) {
                    throw new errors_1.ValidationError('Course description must not exceed 2000 characters');
                }
            }
            if (data.price !== undefined && data.price < 0) {
                throw new errors_1.ValidationError('Course price cannot be negative');
            }
            const updatedCourse = await prisma.course.update({
                where: { id: courseId },
                data: {
                    ...(data.title && { title: data.title.trim() }),
                    ...(data.description && { description: data.description.trim() }),
                    ...(data.level && { level: data.level }),
                    ...(data.category && { category: data.category }),
                    ...(data.duration !== undefined && { duration: data.duration }),
                    ...(data.price !== undefined && { price: data.price }),
                    ...(data.tags && { tags: data.tags }),
                    ...(data.thumbnail && { thumbnail: data.thumbnail }),
                    ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
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
                }
            });
            logger_1.logger.info('Course updated', {
                courseId,
                title: updatedCourse.title,
                userId
            });
            return {
                id: updatedCourse.id,
                title: updatedCourse.title,
                description: updatedCourse.description,
                level: updatedCourse.level,
                category: updatedCourse.category,
                isPublished: updatedCourse.isPublished,
                createdAt: updatedCourse.createdAt,
                updatedAt: updatedCourse.updatedAt,
                duration: updatedCourse.duration,
                price: updatedCourse.price,
                tags: updatedCourse.tags,
                thumbnail: updatedCourse.thumbnail,
                createdBy: {
                    id: updatedCourse.createdById,
                    firstName: 'Unknown',
                    lastName: 'User',
                    role: 'ADMIN'
                },
                lessons: [],
                _count: {
                    lesson_items: updatedCourse._count.lessons_data,
                    enrollments: updatedCourse._count.enrollments,
                    lessons: updatedCourse._count.lessons_data
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update course', { courseId, data, userId, error });
            throw error;
        }
    }
    static async getCourseById(courseId, userId) {
        try {
            const course = await prisma.course.findUnique({
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
                }
            });
            if (!course) {
                throw new errors_1.NotFoundError('Course not found');
            }
            let isEnrolled = false;
            let progress = {
                completedLessons: 0,
                totalLessons: course._count.lessons_data,
                percentage: 0
            };
            if (userId) {
                const enrollment = await prisma.courseEnrollment.findUnique({
                    where: {
                        userId_courseId: {
                            userId,
                            courseId
                        }
                    },
                });
                if (enrollment) {
                    isEnrolled = true;
                    progress.completedLessons = 0;
                    progress.percentage = enrollment.progress;
                }
            }
            return {
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level,
                category: course.category,
                duration: course.duration,
                price: course.price,
                tags: course.tags,
                thumbnail: course.thumbnail,
                isPublished: course.isPublished,
                createdAt: course.createdAt,
                updatedAt: course.updatedAt,
                createdBy: {
                    id: course.createdById,
                    firstName: 'Unknown',
                    lastName: 'User',
                    role: 'ADMIN'
                },
                lessons: [],
                _count: {
                    lesson_items: course._count.lessons_data,
                    enrollments: course._count.enrollments,
                    lessons: course._count.lessons_data
                },
                isEnrolled,
                progress
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get course by ID', { courseId, userId, error });
            throw error;
        }
    }
    static async getCourses(filters = {}, options = {}, userId) {
        try {
            const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
            const skip = (page - 1) * limit;
            const whereClause = {};
            if (filters.level)
                whereClause.level = filters.level;
            if (filters.category)
                whereClause.category = filters.category;
            if (filters.isPublished !== undefined)
                whereClause.isPublished = filters.isPublished;
            if (filters.createdBy)
                whereClause.createdById = filters.createdBy;
            if (filters.search) {
                whereClause.OR = [
                    { title: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } },
                    { tags: { hasSome: filters.search.split(' ') } }
                ];
            }
            let orderBy = { createdAt: sortOrder };
            switch (sortBy) {
                case 'title':
                    orderBy = { title: sortOrder };
                    break;
                case 'enrollments':
                    orderBy = { enrollments: { _count: sortOrder } };
                    break;
            }
            const [courses, total] = await Promise.all([
                prisma.course.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy,
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true
                            }
                        },
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
                    }
                }),
                prisma.course.count({ where: whereClause })
            ]);
            let userEnrollments = [];
            if (userId) {
                const enrollments = await prisma.courseEnrollment.findMany({
                    where: { userId },
                    select: { courseId: true }
                });
                userEnrollments = enrollments.map(e => e.courseId);
            }
            const formattedCourses = courses.map(course => ({
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level,
                category: course.category,
                duration: course.duration,
                price: course.price,
                tags: course.tags,
                thumbnail: course.thumbnail,
                isPublished: course.isPublished,
                createdAt: course.createdAt,
                updatedAt: course.updatedAt,
                createdBy: {
                    id: course.createdBy?.id || course.createdById,
                    firstName: course.createdBy?.firstName || 'Unknown',
                    lastName: course.createdBy?.lastName || 'User',
                    role: course.createdBy?.role || 'ADMIN'
                },
                lessons: [],
                _count: {
                    lesson_items: course._count.lessons_data,
                    enrollments: course._count.enrollments,
                    lessons: course._count.lessons_data
                },
                isEnrolled: userEnrollments.includes(course.id),
                progress: {
                    completedLessons: 0,
                    totalLessons: course._count.lessons_data,
                    percentage: 0
                }
            }));
            return {
                courses: formattedCourses,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get courses', { filters, options, userId, error });
            throw error;
        }
    }
    static async deleteCourse(courseId, userId) {
        try {
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                select: {
                    id: true,
                    createdById: true,
                    title: true,
                    _count: {
                        select: { enrollments: true }
                    }
                }
            });
            if (!course) {
                throw new errors_1.NotFoundError('Course not found');
            }
            if (course.createdById !== userId) {
                throw new errors_1.ForbiddenError('You can only delete your own courses');
            }
            if (course._count.enrollments > 0) {
                throw new errors_1.ForbiddenError('Cannot delete course with active enrollments');
            }
            await prisma.course.delete({
                where: { id: courseId }
            });
            logger_1.logger.info('Course deleted', { courseId, title: course.title, userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete course', { courseId, userId, error });
            throw error;
        }
    }
    static async enrollInCourse(courseId, userId) {
        try {
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                select: {
                    id: true,
                    title: true,
                    isPublished: true,
                    _count: { select: { lessons_data: true } }
                }
            });
            if (!course) {
                throw new errors_1.NotFoundError('Course not found');
            }
            if (!course.isPublished) {
                throw new errors_1.ForbiddenError('Cannot enroll in unpublished course');
            }
            const existingEnrollment = await prisma.courseEnrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId
                    }
                }
            });
            if (existingEnrollment) {
                throw new errors_1.ValidationError('User is already enrolled in this course');
            }
            const enrollment = await prisma.courseEnrollment.create({
                data: {
                    userId,
                    courseId,
                    enrolledAt: new Date()
                }
            });
            logger_1.logger.info('User enrolled in course', {
                courseId,
                userId,
                courseTitle: course.title
            });
            return {
                enrollment: {
                    id: enrollment.id,
                    enrolledAt: enrollment.enrolledAt,
                    progress: {
                        completedLessons: 0,
                        totalLessons: course._count.lessons_data,
                        percentage: 0
                    }
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to enroll in course', { courseId, userId, error });
            throw error;
        }
    }
    static async getUserEnrolledCourses(userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const [enrollments, total] = await Promise.all([
                prisma.courseEnrollment.findMany({
                    where: { userId },
                    skip,
                    take: limit,
                    orderBy: { enrolledAt: 'desc' },
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
                                _count: {
                                    select: {
                                        enrollments: true,
                                        lessons_data: true
                                    }
                                }
                            }
                        }
                    }
                }),
                prisma.courseEnrollment.count({ where: { userId } })
            ]);
            const courses = enrollments.map(enrollment => {
                const completedLessons = 0;
                const totalLessons = enrollment.course._count.lessons_data;
                const percentage = enrollment.progress;
                return {
                    id: enrollment.course.id,
                    title: enrollment.course.title,
                    description: enrollment.course.description,
                    level: enrollment.course.level,
                    category: enrollment.course.category,
                    duration: enrollment.course.duration,
                    price: enrollment.course.price,
                    tags: enrollment.course.tags,
                    thumbnail: enrollment.course.thumbnail,
                    isPublished: enrollment.course.isPublished,
                    createdAt: enrollment.course.createdAt,
                    updatedAt: enrollment.course.updatedAt,
                    createdBy: {
                        id: enrollment.course.createdBy?.id || enrollment.course.createdById,
                        firstName: enrollment.course.createdBy?.firstName || 'Unknown',
                        lastName: enrollment.course.createdBy?.lastName || 'User',
                        role: enrollment.course.createdBy?.role || 'ADMIN'
                    },
                    lessons: [],
                    _count: {
                        lesson_items: enrollment.course._count.lessons_data,
                        enrollments: enrollment.course._count.enrollments,
                        lessons: enrollment.course._count.lessons_data
                    },
                    isEnrolled: true,
                    progress: {
                        completedLessons,
                        totalLessons,
                        percentage
                    },
                    enrollment: {
                        id: enrollment.id,
                        enrolledAt: enrollment.enrolledAt
                    }
                };
            });
            return {
                courses,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user enrolled courses', { userId, error });
            throw error;
        }
    }
}
exports.CourseContentService = CourseContentService;
class LessonService {
    static async createLesson(courseId, data, userId) {
        try {
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                select: { id: true, createdById: true, title: true }
            });
            if (!course) {
                throw new errors_1.NotFoundError('Course not found');
            }
            if (course.createdById !== userId) {
                throw new errors_1.ForbiddenError('You can only add lessons to your own courses');
            }
            if (!data.title || data.title.trim().length === 0) {
                throw new errors_1.ValidationError('Lesson title is required');
            }
            if (!data.content || data.content.trim().length === 0) {
                throw new errors_1.ValidationError('Lesson content is required');
            }
            if (data.title.length > 200) {
                throw new errors_1.ValidationError('Lesson title must not exceed 200 characters');
            }
            if (data.order < 1) {
                throw new errors_1.ValidationError('Lesson order must be at least 1');
            }
            const existingLesson = await prisma.lesson.findFirst({
                where: { courseId, order: data.order }
            });
            if (existingLesson) {
                throw new errors_1.ValidationError(`A lesson with order ${data.order} already exists`);
            }
            const lesson = await prisma.lesson.create({
                data: {
                    title: data.title.trim(),
                    content: data.content.trim(),
                    videoUrl: data.videoUrl,
                    duration: data.duration,
                    order: data.order,
                    resources: data.resources || [],
                    courseId
                }
            });
            logger_1.logger.info('Lesson created', {
                lessonId: lesson.id,
                courseId,
                title: lesson.title,
                userId
            });
            return {
                id: lesson.id,
                title: lesson.title,
                content: lesson.content,
                videoUrl: lesson.videoUrl,
                duration: lesson.duration,
                order: lesson.order,
                resources: lesson.resources
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create lesson', { courseId, data, userId, error });
            throw error;
        }
    }
    static async markLessonCompleted(lessonId, userId) {
        try {
            const lesson = await prisma.courseLesson.findUnique({
                where: { id: lessonId },
                include: {
                    course: {
                        select: {
                            id: true,
                            _count: { select: { lessons_data: true } }
                        }
                    }
                }
            });
            if (!lesson) {
                throw new errors_1.NotFoundError('Lesson not found');
            }
            const enrollment = await prisma.courseEnrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId: lesson.courseId
                    }
                }
            });
            if (!enrollment) {
                throw new errors_1.ForbiddenError('You must be enrolled in the course to mark lessons as completed');
            }
            const existingCompletion = await prisma.lessonCompletion.findUnique({
                where: {
                    userId_lessonId: {
                        userId,
                        lessonId
                    }
                }
            });
            if (existingCompletion) {
                throw new errors_1.ValidationError('Lesson is already marked as completed');
            }
            await prisma.lessonCompletion.create({
                data: {
                    userId,
                    lessonId,
                    completedAt: new Date(),
                    updatedAt: new Date()
                }
            });
            const courseLessons = await prisma.courseLesson.findMany({
                where: { courseId: lesson.courseId },
                select: { id: true }
            });
            const completedLessons = await prisma.lessonCompletion.count({
                where: {
                    userId,
                    lessonId: { in: courseLessons.map(l => l.id) }
                }
            });
            const totalLessons = lesson.course._count.lessons_data;
            const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
            logger_1.logger.info('Lesson marked as completed', {
                lessonId,
                userId,
                courseId: lesson.courseId,
                progress: { completedLessons, totalLessons, percentage }
            });
            return {
                completed: true,
                progress: {
                    completedLessons,
                    totalLessons,
                    percentage
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to mark lesson as completed', { lessonId, userId, error });
            throw error;
        }
    }
    static async getCourseLessons(courseId) {
        try {
            const course = await prisma.course.findUnique({
                where: { id: courseId }
            });
            if (!course) {
                throw new errors_1.NotFoundError('Course not found');
            }
            const lessons = await prisma.lesson.findMany({
                where: { courseId },
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    videoUrl: true,
                    duration: true,
                    order: true,
                    resources: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            return lessons;
        }
        catch (error) {
            logger_1.logger.error('Failed to get course lessons', { courseId, error });
            throw error;
        }
    }
}
exports.LessonService = LessonService;
//# sourceMappingURL=courseContentService.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonController = exports.CourseContentController = void 0;
const courseContentService_1 = require("../services/courseContentService");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class CourseContentController {
    static async createCourse(req, res) {
        try {
            const { title, description, level, category, duration, price, tags, thumbnail } = req.body;
            const userId = req.user.userId;
            if (!title || !description || !level || !category) {
                throw new errors_1.ValidationError('Title, description, level, and category are required');
            }
            const course = await courseContentService_1.CourseContentService.createCourse({ title, description, level, category, duration, price, tags, thumbnail }, userId);
            res.status(201).json({
                success: true,
                data: { course },
                message: 'Course created successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create course', {
                body: req.body,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to create course',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'COURSE_CREATION_ERROR'
                    }
                });
            }
        }
    }
    static async getCourses(req, res) {
        try {
            const filters = {
                level: req.query.level,
                category: req.query.category,
                isPublished: req.query.isPublished ? req.query.isPublished === 'true' : undefined,
                createdBy: req.query.createdBy,
                search: req.query.search
            };
            const options = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc'
            };
            if (options.limit > 100) {
                throw new errors_1.ValidationError('Limit cannot exceed 100');
            }
            const result = await courseContentService_1.CourseContentService.getCourses(filters, options, req.user?.userId);
            res.json({
                success: true,
                data: result,
                message: `Retrieved ${result.courses.length} courses`
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get courses', {
                query: req.query,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to get courses',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'COURSES_FETCH_ERROR'
                    }
                });
            }
        }
    }
    static async getCourseById(req, res) {
        try {
            const { courseId } = req.params;
            const userId = req.user?.userId;
            const course = await courseContentService_1.CourseContentService.getCourseById(courseId, userId);
            res.json({
                success: true,
                data: { course },
                message: 'Course retrieved successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get course by ID', {
                courseId: req.params.courseId,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'COURSE_NOT_FOUND'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to get course',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'COURSE_FETCH_ERROR'
                    }
                });
            }
        }
    }
    static async updateCourse(req, res) {
        try {
            const { courseId } = req.params;
            const { title, description, level, category, duration, price, tags, thumbnail, isPublished } = req.body;
            const userId = req.user.userId;
            const course = await courseContentService_1.CourseContentService.updateCourse(courseId, { title, description, level, category, duration, price, tags, thumbnail, isPublished }, userId);
            res.json({
                success: true,
                data: { course },
                message: 'Course updated successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update course', {
                courseId: req.params.courseId,
                body: req.body,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'COURSE_NOT_FOUND'
                    }
                });
            }
            else if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else if (error instanceof errors_1.ForbiddenError) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FORBIDDEN'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to update course',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'COURSE_UPDATE_ERROR'
                    }
                });
            }
        }
    }
    static async deleteCourse(req, res) {
        try {
            const { courseId } = req.params;
            const userId = req.user.userId;
            await courseContentService_1.CourseContentService.deleteCourse(courseId, userId);
            res.json({
                success: true,
                message: 'Course deleted successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete course', {
                courseId: req.params.courseId,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'COURSE_NOT_FOUND'
                    }
                });
            }
            else if (error instanceof errors_1.ForbiddenError) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FORBIDDEN'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to delete course',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'COURSE_DELETE_ERROR'
                    }
                });
            }
        }
    }
    static async enrollInCourse(req, res) {
        try {
            const { courseId } = req.params;
            const userId = req.user.userId;
            const result = await courseContentService_1.CourseContentService.enrollInCourse(courseId, userId);
            res.status(201).json({
                success: true,
                data: result,
                message: 'Successfully enrolled in course'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to enroll in course', {
                courseId: req.params.courseId,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'COURSE_NOT_FOUND'
                    }
                });
            }
            else if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else if (error instanceof errors_1.ForbiddenError) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FORBIDDEN'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to enroll in course',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'ENROLLMENT_ERROR'
                    }
                });
            }
        }
    }
    static async getUserEnrolledCourses(req, res) {
        try {
            const userId = req.user.userId;
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            if (limit > 100) {
                throw new errors_1.ValidationError('Limit cannot exceed 100');
            }
            const result = await courseContentService_1.CourseContentService.getUserEnrolledCourses(userId, page, limit);
            res.json({
                success: true,
                data: result,
                message: `Retrieved ${result.courses.length} enrolled courses`
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get user enrolled courses', {
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to get enrolled courses',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'ENROLLED_COURSES_FETCH_ERROR'
                    }
                });
            }
        }
    }
}
exports.CourseContentController = CourseContentController;
class LessonController {
    static async createLesson(req, res) {
        try {
            const { courseId } = req.params;
            const { title, content, videoUrl, duration, order, resources } = req.body;
            const userId = req.user.userId;
            if (!title || !content || !order) {
                throw new errors_1.ValidationError('Title, content, and order are required');
            }
            const lesson = await courseContentService_1.LessonService.createLesson(courseId, { title, content, videoUrl, duration, order, resources }, userId);
            res.status(201).json({
                success: true,
                data: { lesson },
                message: 'Lesson created successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create lesson', {
                courseId: req.params.courseId,
                body: req.body,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'COURSE_NOT_FOUND'
                    }
                });
            }
            else if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else if (error instanceof errors_1.ForbiddenError) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FORBIDDEN'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to create lesson',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'LESSON_CREATION_ERROR'
                    }
                });
            }
        }
    }
    static async markLessonCompleted(req, res) {
        try {
            const { lessonId } = req.params;
            const userId = req.user.userId;
            const result = await courseContentService_1.LessonService.markLessonCompleted(lessonId, userId);
            res.json({
                success: true,
                data: result,
                message: 'Lesson marked as completed'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to mark lesson as completed', {
                lessonId: req.params.lessonId,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'LESSON_NOT_FOUND'
                    }
                });
            }
            else if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else if (error instanceof errors_1.ForbiddenError) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FORBIDDEN'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to mark lesson as completed',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'LESSON_COMPLETION_ERROR'
                    }
                });
            }
        }
    }
    static async getCourseLessons(req, res) {
        try {
            const { courseId } = req.params;
            const lessons = await courseContentService_1.LessonService.getCourseLessons(courseId);
            res.json({
                success: true,
                data: { lessons },
                message: 'Course lessons retrieved successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get course lessons', {
                courseId: req.params.courseId,
                error
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'COURSE_NOT_FOUND'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to get course lessons',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'LESSONS_RETRIEVAL_ERROR'
                    }
                });
            }
        }
    }
    static async uploadCourseContent(req, res) {
        try {
            const { courseId } = req.params;
            const userId = req.user.userId;
            res.status(201).json({
                success: true,
                data: { message: 'Course content upload functionality will be implemented' },
                message: 'Course content upload endpoint ready'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to upload course content', {
                courseId: req.params.courseId,
                error,
                userId: req.user?.userId
            });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to upload course content',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'CONTENT_UPLOAD_ERROR'
                }
            });
        }
    }
}
exports.LessonController = LessonController;
//# sourceMappingURL=courseContentController.js.map
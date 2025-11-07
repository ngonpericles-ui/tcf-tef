"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseController = void 0;
const courseService_1 = require("@/services/courseService");
const errorHandler_1 = require("@/middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("@/utils/logger");
class CourseController {
}
exports.CourseController = CourseController;
_a = CourseController;
CourseController.createCourse = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const courseData = req.body;
    const createdById = req.user?.userId;
    const creatorRole = req.user?.role;
    if (!createdById || !creatorRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const course = await courseService_1.CourseService.createCourse(courseData, createdById, creatorRole);
    const response = {
        success: true,
        data: { course },
        message: 'Course created successfully'
    };
    logger_1.logger.info('Course created', { courseId: course.id, createdById });
    res.status(201).json(response);
});
CourseController.getCourseById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user?.userId;
    const course = await courseService_1.CourseService.getCourseById(courseId, userId);
    const response = {
        success: true,
        data: { course },
        message: 'Course retrieved successfully'
    };
    res.status(200).json(response);
});
CourseController.getAllCourses = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
    };
    const filters = {
        search: req.query.search,
        level: req.query.level,
        category: req.query.category,
        tier: req.query.tier
    };
    const result = await courseService_1.CourseService.getAllCourses(pagination, filters, userId, userRole);
    const response = {
        success: true,
        data: result.courses,
        pagination: result.pagination,
        message: 'Courses retrieved successfully'
    };
    res.status(200).json(response);
});
CourseController.updateCourse = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { courseId } = req.params;
    const updateData = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const course = await courseService_1.CourseService.updateCourse(courseId, updateData, userId, userRole);
    const response = {
        success: true,
        data: { course },
        message: 'Course updated successfully'
    };
    logger_1.logger.info('Course updated', { courseId, updatedBy: userId });
    res.status(200).json(response);
});
CourseController.deleteCourse = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await courseService_1.CourseService.deleteCourse(courseId, userId, userRole);
    const response = {
        success: true,
        message: 'Course deleted successfully'
    };
    logger_1.logger.info('Course deleted', { courseId, deletedBy: userId });
    res.status(200).json(response);
});
CourseController.enrollInCourse = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await courseService_1.CourseService.enrollInCourse(courseId, userId);
    const response = {
        success: true,
        message: 'Enrolled in course successfully'
    };
    logger_1.logger.info('User enrolled in course', { courseId, userId });
    res.status(200).json(response);
});
CourseController.unenrollFromCourse = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await courseService_1.CourseService.unenrollFromCourse(courseId, userId);
    const response = {
        success: true,
        message: 'Unenrolled from course successfully'
    };
    logger_1.logger.info('User unenrolled from course', { courseId, userId });
    res.status(200).json(response);
});
CourseController.getUserEnrolledCourses = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'enrolledAt',
        sortOrder: req.query.sortOrder || 'desc'
    };
    const result = await courseService_1.CourseService.getUserEnrolledCourses(userId, pagination);
    const response = {
        success: true,
        data: result.courses,
        pagination: result.pagination,
        message: 'Enrolled courses retrieved successfully'
    };
    res.status(200).json(response);
});
CourseController.getUserCreatedCourses = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    if (![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(userRole)) {
        res.status(403).json({
            success: false,
            error: { message: 'Access denied. Manager role required.' }
        });
        return;
    }
    const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
    };
    const filters = {
        search: req.query.search,
        level: req.query.level,
        category: req.query.category,
        tier: req.query.tier
    };
    const extendedFilters = {
        ...filters,
        createdById: userId
    };
    const result = await courseService_1.CourseService.getAllCourses(pagination, extendedFilters, userId, req.user?.role);
    const response = {
        success: true,
        data: result.courses,
        pagination: result.pagination,
        message: 'Created courses retrieved successfully'
    };
    res.status(200).json(response);
});
CourseController.getCourseStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    try {
        const statistics = await courseService_1.CourseService.getCourseStatistics(userId, userRole);
        const response = {
            success: true,
            data: statistics,
            message: 'Course statistics retrieved successfully'
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.logger.error('Failed to get course statistics', { userId, error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve course statistics' }
        });
    }
});
CourseController.healthCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const response = {
        success: true,
        data: {
            service: 'course',
            status: 'healthy',
            timestamp: new Date().toISOString()
        },
        message: 'Course service is healthy'
    };
    res.status(200).json(response);
});
//# sourceMappingURL=courseController.js.map
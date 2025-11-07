"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const courseContentController_1 = require("../controllers/courseContentController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
const createCourseSchema = {
    body: joi_1.default.object({
        title: joi_1.default.string().min(1).max(200).required().messages({
            'string.min': 'Course title cannot be empty',
            'string.max': 'Course title must not exceed 200 characters',
            'any.required': 'Course title is required'
        }),
        description: joi_1.default.string().min(1).max(2000).required().messages({
            'string.min': 'Course description cannot be empty',
            'string.max': 'Course description must not exceed 2000 characters',
            'any.required': 'Course description is required'
        }),
        level: joi_1.default.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').required().messages({
            'any.only': 'Level must be BEGINNER, INTERMEDIATE, or ADVANCED',
            'any.required': 'Course level is required'
        }),
        category: joi_1.default.string().valid('GRAMMAR', 'VOCABULARY', 'LISTENING', 'READING', 'WRITING', 'SPEAKING', 'CULTURE', 'BUSINESS', 'EXAM_PREP').required().messages({
            'any.only': 'Category must be a valid course category',
            'any.required': 'Course category is required'
        }),
        duration: joi_1.default.number().integer().min(1).optional(),
        price: joi_1.default.number().min(0).optional(),
        tags: joi_1.default.array().items(joi_1.default.string().max(50)).optional(),
        thumbnail: joi_1.default.string().uri().optional()
    })
};
const updateCourseSchema = {
    body: joi_1.default.object({
        title: joi_1.default.string().min(1).max(200).optional(),
        description: joi_1.default.string().min(1).max(2000).optional(),
        level: joi_1.default.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').optional(),
        category: joi_1.default.string().valid('GRAMMAR', 'VOCABULARY', 'LISTENING', 'READING', 'WRITING', 'SPEAKING', 'CULTURE', 'BUSINESS', 'EXAM_PREP').optional(),
        duration: joi_1.default.number().integer().min(1).optional(),
        price: joi_1.default.number().min(0).optional(),
        tags: joi_1.default.array().items(joi_1.default.string().max(50)).optional(),
        thumbnail: joi_1.default.string().uri().optional(),
        isPublished: joi_1.default.boolean().optional()
    })
};
const createLessonSchema = {
    body: joi_1.default.object({
        title: joi_1.default.string().min(1).max(200).required().messages({
            'string.min': 'Lesson title cannot be empty',
            'string.max': 'Lesson title must not exceed 200 characters',
            'any.required': 'Lesson title is required'
        }),
        content: joi_1.default.string().min(1).required().messages({
            'string.min': 'Lesson content cannot be empty',
            'any.required': 'Lesson content is required'
        }),
        videoUrl: joi_1.default.string().uri().optional(),
        duration: joi_1.default.number().integer().min(1).optional(),
        order: joi_1.default.number().integer().min(1).required().messages({
            'number.min': 'Lesson order must be at least 1',
            'any.required': 'Lesson order is required'
        }),
        resources: joi_1.default.array().items(joi_1.default.string().uri()).optional()
    })
};
const courseQuerySchema = {
    query: joi_1.default.object({
        level: joi_1.default.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').optional(),
        category: joi_1.default.string().valid('GRAMMAR', 'VOCABULARY', 'LISTENING', 'READING', 'WRITING', 'SPEAKING', 'CULTURE', 'BUSINESS', 'EXAM_PREP').optional(),
        isPublished: joi_1.default.boolean().optional(),
        createdBy: joi_1.default.string().uuid().optional(),
        search: joi_1.default.string().max(100).optional(),
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20),
        sortBy: joi_1.default.string().valid('title', 'createdAt', 'enrollments').default('createdAt'),
        sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc')
    })
};
router.get('/', (0, validation_1.validate)(courseQuerySchema), courseContentController_1.CourseContentController.getCourses);
router.post('/', auth_1.authenticate, (0, validation_1.validate)(createCourseSchema), courseContentController_1.CourseContentController.createCourse);
router.get('/:courseId', courseContentController_1.CourseContentController.getCourseById);
router.put('/:courseId', auth_1.authenticate, (0, validation_1.validate)(updateCourseSchema), courseContentController_1.CourseContentController.updateCourse);
router.delete('/:courseId', auth_1.authenticate, courseContentController_1.CourseContentController.deleteCourse);
router.post('/:courseId/enroll', auth_1.authenticate, courseContentController_1.CourseContentController.enrollInCourse);
router.post('/:courseId/lessons', auth_1.authenticate, (0, validation_1.validate)(createLessonSchema), courseContentController_1.LessonController.createLesson);
router.get('/:courseId/lessons', courseContentController_1.LessonController.getCourseLessons);
router.post('/lessons/:lessonId/complete', auth_1.authenticate, courseContentController_1.LessonController.markLessonCompleted);
router.get('/enrolled', auth_1.authenticate, courseContentController_1.CourseContentController.getUserEnrolledCourses);
exports.default = router;
//# sourceMappingURL=courseContentRoutes.js.map
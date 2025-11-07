"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherController = void 0;
const teacherService_1 = require("../services/teacherService");
const errorHandler_1 = require("../middleware/errorHandler");
class TeacherController {
}
exports.TeacherController = TeacherController;
_a = TeacherController;
TeacherController.getTeachers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const filters = {
        search: req.query.search,
        specialties: req.query.specialties,
        availability: req.query.availability,
        rating: req.query.rating ? parseFloat(req.query.rating) : undefined,
        sortBy: req.query.sortBy || 'rating'
    };
    const teachers = await teacherService_1.TeacherService.getAvailableTeachers(userId, filters);
    const response = {
        success: true,
        data: teachers,
        message: 'Teachers retrieved successfully'
    };
    res.status(200).json(response);
});
TeacherController.getTeacherProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { teacherId } = req.params;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const teacher = await teacherService_1.TeacherService.getTeacherProfile(teacherId, userId);
    const response = {
        success: true,
        data: teacher,
        message: 'Teacher profile retrieved successfully'
    };
    res.status(200).json(response);
});
TeacherController.getTeacherAvailability = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { teacherId } = req.params;
    const date = req.query.date;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const availability = await teacherService_1.TeacherService.getTeacherAvailability(teacherId, date);
    const response = {
        success: true,
        data: availability,
        message: 'Teacher availability retrieved successfully'
    };
    res.status(200).json(response);
});
TeacherController.bookSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { teacherId } = req.params;
    const bookingData = req.body;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const booking = await teacherService_1.TeacherService.bookSession(teacherId, userId, bookingData);
    const response = {
        success: true,
        data: booking,
        message: 'Session booked successfully'
    };
    res.status(201).json(response);
});
//# sourceMappingURL=teacherController.js.map
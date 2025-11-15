"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const userService_1 = require("../services/userService");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class UserController {
}
exports.UserController = UserController;
_a = UserController;
UserController.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const user = await userService_1.UserService.getUserById(userId);
    const response = {
        success: true,
        data: { user },
        message: 'Profile retrieved successfully'
    };
    res.status(200).json(response);
});
UserController.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const requestingUserRole = req.user?.role;
    if (!requestingUserRole || ![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(requestingUserRole)) {
        res.status(403).json({
            success: false,
            error: { message: 'Access denied. Manager role required.' }
        });
        return;
    }
    const user = await userService_1.UserService.getUserById(userId);
    const response = {
        success: true,
        data: { user },
        message: 'User retrieved successfully'
    };
    res.status(200).json(response);
});
UserController.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const updateData = req.body;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const user = await userService_1.UserService.updateUserProfile(userId, updateData);
    const response = {
        success: true,
        data: { user },
        message: 'Profile updated successfully'
    };
    logger_1.logger.info('User profile updated', { userId });
    res.status(200).json(response);
});
UserController.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await userService_1.UserService.changePassword(userId, currentPassword, newPassword);
    const response = {
        success: true,
        message: 'Password changed successfully'
    };
    logger_1.logger.info('User password changed', { userId });
    res.status(200).json(response);
});
UserController.getAllUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const requestingUserRole = req.user?.role;
    if (!requestingUserRole || ![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(requestingUserRole)) {
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
        status: req.query.status,
        tier: req.query.tier,
        type: req.query.role
    };
    const result = await userService_1.UserService.getAllUsers(pagination, filters, requestingUserRole);
    const response = {
        success: true,
        data: result.users,
        pagination: result.pagination,
        message: 'Users retrieved successfully'
    };
    res.status(200).json(response);
});
UserController.updateUserRole = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    const requestingUserRole = req.user?.role;
    if (!requestingUserRole || requestingUserRole !== client_1.UserRole.ADMIN) {
        res.status(403).json({
            success: false,
            error: { message: 'Access denied. Admin role required.' }
        });
        return;
    }
    const user = await userService_1.UserService.updateUserRole(userId, role, requestingUserRole);
    const response = {
        success: true,
        data: { user },
        message: 'User role updated successfully'
    };
    logger_1.logger.info('User role updated', { userId, newRole: role });
    res.status(200).json(response);
});
UserController.updateUserStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;
    const requestingUserRole = req.user?.role;
    if (!requestingUserRole || ![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER].includes(requestingUserRole)) {
        res.status(403).json({
            success: false,
            error: { message: 'Access denied. Senior Manager or Admin role required.' }
        });
        return;
    }
    const user = await userService_1.UserService.updateUserStatus(userId, status, requestingUserRole);
    const response = {
        success: true,
        data: { user },
        message: 'User status updated successfully'
    };
    logger_1.logger.info('User status updated', { userId, newStatus: status });
    res.status(200).json(response);
});
UserController.deleteUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const requestingUserRole = req.user?.role;
    if (!requestingUserRole || requestingUserRole !== client_1.UserRole.ADMIN) {
        res.status(403).json({
            success: false,
            error: { message: 'Access denied. Admin role required.' }
        });
        return;
    }
    await userService_1.UserService.deleteUser(userId, requestingUserRole);
    const response = {
        success: true,
        message: 'User deleted successfully'
    };
    logger_1.logger.info('User deleted', { userId });
    res.status(200).json(response);
});
UserController.getDashboardStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const user = await userService_1.UserService.getUserById(userId);
    const achievements = await userService_1.UserService.calculateUserAchievements(userId);
    const response = {
        success: true,
        data: {
            stats: achievements,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                subscriptionTier: user.subscriptionTier,
                role: user.role
            },
            recentActivity: {
                courseEnrollments: user.courseEnrollments?.slice(0, 5) || [],
                testAttempts: achievements.recentTests || []
            },
            performanceMetrics: {
                weeklyProgress: achievements.weeklyPoints,
                monthlyProgress: achievements.totalPoints,
                accuracy: achievements.completionPercentage,
                consistency: Math.min(100, achievements.totalTests * 10)
            }
        },
        message: 'Dashboard stats retrieved successfully'
    };
    res.status(200).json(response);
});
UserController.healthCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const response = {
        success: true,
        data: {
            service: 'user',
            status: 'healthy',
            timestamp: new Date().toISOString()
        },
        message: 'User service is healthy'
    };
    res.status(200).json(response);
});
//# sourceMappingURL=userController.js.map
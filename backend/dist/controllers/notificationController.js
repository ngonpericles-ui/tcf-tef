"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notificationService_1 = require("../services/notificationService");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class NotificationController {
}
exports.NotificationController = NotificationController;
_a = NotificationController;
NotificationController.createNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const notificationData = req.body;
    const creatorRole = req.user?.role;
    if (!creatorRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const notification = await notificationService_1.NotificationService.createNotification(notificationData, creatorRole);
    const response = {
        success: true,
        data: { notification },
        message: 'Notification created successfully'
    };
    logger_1.logger.info('Notification created', { notificationId: notification.id });
    res.status(201).json(response);
});
NotificationController.getUserNotifications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
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
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
    };
    const filters = {
        status: req.query.status,
        type: req.query.type,
        category: req.query.category
    };
    const result = await notificationService_1.NotificationService.getUserNotifications(userId, pagination, filters);
    const response = {
        success: true,
        data: {
            notifications: result.notifications,
            unreadCount: result.unreadCount
        },
        pagination: result.pagination,
        message: 'Notifications retrieved successfully'
    };
    res.status(200).json(response);
});
NotificationController.getUnreadCount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const result = await notificationService_1.NotificationService.getUserNotifications(userId, { page: 1, limit: 1 });
    const response = {
        success: true,
        data: {
            unreadCount: result.unreadCount
        },
        message: 'Unread count retrieved successfully'
    };
    res.status(200).json(response);
});
NotificationController.markAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await notificationService_1.NotificationService.markAsRead(userId, notificationId);
    const response = {
        success: true,
        message: 'Notification marked as read'
    };
    res.status(200).json(response);
});
NotificationController.markAllAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await notificationService_1.NotificationService.markAllAsRead(userId);
    const response = {
        success: true,
        message: 'All notifications marked as read'
    };
    logger_1.logger.info('All notifications marked as read', { userId });
    res.status(200).json(response);
});
NotificationController.archiveNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await notificationService_1.NotificationService.archiveNotification(userId, notificationId);
    const response = {
        success: true,
        message: 'Notification archived'
    };
    res.status(200).json(response);
});
NotificationController.deleteNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { notificationId } = req.params;
    const userRole = req.user?.role;
    if (!userRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await notificationService_1.NotificationService.deleteNotification(notificationId, userRole);
    const response = {
        success: true,
        message: 'Notification deleted successfully'
    };
    logger_1.logger.info('Notification deleted', { notificationId });
    res.status(200).json(response);
});
NotificationController.sendSystemNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId, title, message, type, data } = req.body;
    const userRole = req.user?.role;
    if (!userRole || ![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(userRole)) {
        res.status(403).json({
            success: false,
            error: { message: 'Access denied. Manager role required.' }
        });
        return;
    }
    await notificationService_1.NotificationService.sendSystemNotification(userId, title, message, type, data);
    const response = {
        success: true,
        message: 'System notification sent successfully'
    };
    res.status(200).json(response);
});
NotificationController.sendBulkNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userIds, title, message, type, data } = req.body;
    const userRole = req.user?.role;
    if (!userRole || ![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(userRole)) {
        res.status(403).json({
            success: false,
            error: { message: 'Access denied. Manager role required.' }
        });
        return;
    }
    await notificationService_1.NotificationService.sendBulkNotification(userIds, title, message, type, data);
    const response = {
        success: true,
        message: 'Bulk notification sent successfully'
    };
    res.status(200).json(response);
});
NotificationController.getNotificationStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userRole = req.user?.role;
    if (!userRole || ![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER].includes(userRole)) {
        res.status(403).json({
            success: false,
            error: { message: 'Access denied. Senior Manager or Admin role required.' }
        });
        return;
    }
    const stats = await notificationService_1.NotificationService.getNotificationStats(userRole);
    const response = {
        success: true,
        data: { stats },
        message: 'Notification statistics retrieved successfully'
    };
    res.status(200).json(response);
});
NotificationController.healthCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const response = {
        success: true,
        data: {
            service: 'notification',
            status: 'healthy',
            timestamp: new Date().toISOString()
        },
        message: 'Notification service is healthy'
    };
    res.status(200).json(response);
});
//# sourceMappingURL=notificationController.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class NotificationService {
    static async createNotification(notificationData, creatorRole) {
        try {
            if (![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(creatorRole)) {
                throw new errorHandler_1.AuthorizationError('Access denied. Manager role required.');
            }
            const { title, titleEn, message, messageEn, type, priority, category, actionUrl, imageUrl, data, scheduledAt, expiresAt, userIds, roles, subscriptionTiers } = notificationData;
            const notification = await connection_1.prisma.notification.create({
                data: {
                    title,
                    titleEn,
                    message,
                    messageEn,
                    type,
                    priority: priority || 'medium',
                    category,
                    actionUrl,
                    imageUrl,
                    data,
                    scheduledAt,
                    expiresAt
                }
            });
            let targetUserIds = [];
            if (userIds && userIds.length > 0) {
                targetUserIds = userIds;
            }
            else {
                const where = {};
                if (roles && roles.length > 0) {
                    where.role = { in: roles };
                }
                if (subscriptionTiers && subscriptionTiers.length > 0) {
                    where.subscriptionTier = { in: subscriptionTiers };
                }
                const targetUsers = await connection_1.prisma.user.findMany({
                    where,
                    select: { id: true }
                });
                targetUserIds = targetUsers.map(user => user.id);
            }
            if (targetUserIds.length > 0) {
                const userNotifications = targetUserIds.map(userId => ({
                    userId,
                    notificationId: notification.id,
                    status: client_1.NotificationStatus.UNREAD
                }));
                await connection_1.prisma.userNotification.createMany({
                    data: userNotifications
                });
            }
            logger_1.logger.info('Notification created successfully', {
                notificationId: notification.id,
                targetUsersCount: targetUserIds.length,
                type,
                category
            });
            return {
                ...notification,
                targetUsersCount: targetUserIds.length
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create notification', { notificationData, error });
            throw error;
        }
    }
    static async getUserNotifications(userId, pagination, filters) {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
            const { status, type, category } = filters || {};
            const where = {
                userId,
                notification: {
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gte: new Date() } }
                    ]
                }
            };
            if (status) {
                where.status = status;
            }
            if (type) {
                where.notification = {
                    ...where.notification,
                    type
                };
            }
            if (category) {
                where.notification = {
                    ...where.notification,
                    category
                };
            }
            let total = 0;
            let unreadCount = 0;
            let retryCount = 0;
            const maxRetries = 3;
            while (retryCount < maxRetries) {
                try {
                    total = await connection_1.prisma.userNotification.count({ where });
                    unreadCount = await connection_1.prisma.userNotification.count({
                        where: {
                            userId,
                            status: client_1.NotificationStatus.UNREAD,
                            notification: {
                                OR: [
                                    { expiresAt: null },
                                    { expiresAt: { gte: new Date() } }
                                ]
                            }
                        }
                    });
                    break;
                }
                catch (dbError) {
                    retryCount++;
                    console.log(`Database connection attempt ${retryCount} failed for notifications:`, dbError.message);
                    if (retryCount >= maxRetries) {
                        console.log('All database retry attempts failed for notifications, returning fallback');
                        return {
                            notifications: [],
                            pagination: {
                                page: 1,
                                limit: 10,
                                total: 0,
                                totalPages: 0
                            },
                            unreadCount: 0
                        };
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }
            const userNotifications = await connection_1.prisma.userNotification.findMany({
                where,
                include: {
                    notification: true
                },
                orderBy: {
                    notification: { [sortBy]: sortOrder }
                },
                skip: (page - 1) * limit,
                take: limit
            });
            const totalPages = Math.ceil(total / limit);
            const notifications = userNotifications.map(un => ({
                ...un.notification,
                userNotification: {
                    id: un.id,
                    userId: un.userId,
                    notificationId: un.notificationId,
                    status: un.status,
                    readAt: un.readAt,
                    createdAt: un.createdAt
                }
            }));
            return {
                notifications,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                },
                unreadCount
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user notifications', { userId, error });
            throw error;
        }
    }
    static async markAsRead(userId, notificationId) {
        try {
            const userNotification = await connection_1.prisma.userNotification.findUnique({
                where: {
                    userId_notificationId: {
                        userId,
                        notificationId
                    }
                }
            });
            if (!userNotification) {
                throw new errorHandler_1.NotFoundError('Notification not found');
            }
            if (userNotification.status === client_1.NotificationStatus.READ) {
                return;
            }
            await connection_1.prisma.userNotification.update({
                where: {
                    userId_notificationId: {
                        userId,
                        notificationId
                    }
                },
                data: {
                    status: client_1.NotificationStatus.READ,
                    readAt: new Date()
                }
            });
            logger_1.logger.info('Notification marked as read', { userId, notificationId });
        }
        catch (error) {
            logger_1.logger.error('Failed to mark notification as read', { userId, notificationId, error });
            throw error;
        }
    }
    static async markAllAsRead(userId) {
        try {
            await connection_1.prisma.userNotification.updateMany({
                where: {
                    userId,
                    status: client_1.NotificationStatus.UNREAD
                },
                data: {
                    status: client_1.NotificationStatus.READ,
                    readAt: new Date()
                }
            });
            logger_1.logger.info('All notifications marked as read', { userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to mark all notifications as read', { userId, error });
            throw error;
        }
    }
    static async archiveNotification(userId, notificationId) {
        try {
            const userNotification = await connection_1.prisma.userNotification.findUnique({
                where: {
                    userId_notificationId: {
                        userId,
                        notificationId
                    }
                }
            });
            if (!userNotification) {
                throw new errorHandler_1.NotFoundError('Notification not found');
            }
            await connection_1.prisma.userNotification.update({
                where: {
                    userId_notificationId: {
                        userId,
                        notificationId
                    }
                },
                data: {
                    status: client_1.NotificationStatus.ARCHIVED
                }
            });
            logger_1.logger.info('Notification archived', { userId, notificationId });
        }
        catch (error) {
            logger_1.logger.error('Failed to archive notification', { userId, notificationId, error });
            throw error;
        }
    }
    static async deleteNotification(notificationId, userRole) {
        try {
            if (userRole !== client_1.UserRole.ADMIN) {
                throw new errorHandler_1.AuthorizationError('Access denied. Admin role required.');
            }
            const notification = await connection_1.prisma.notification.findUnique({
                where: { id: notificationId }
            });
            if (!notification) {
                throw new errorHandler_1.NotFoundError('Notification not found');
            }
            await connection_1.prisma.notification.delete({
                where: { id: notificationId }
            });
            logger_1.logger.info('Notification deleted', { notificationId });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete notification', { notificationId, error });
            throw error;
        }
    }
    static async sendSystemNotification(userId, title, message, type = client_1.NotificationType.INFO, data) {
        try {
            const notification = await connection_1.prisma.notification.create({
                data: {
                    title,
                    message,
                    type,
                    priority: 'medium',
                    category: 'system',
                    data
                }
            });
            await connection_1.prisma.userNotification.create({
                data: {
                    userId,
                    notificationId: notification.id,
                    status: client_1.NotificationStatus.UNREAD
                }
            });
            logger_1.logger.info('System notification sent', { userId, notificationId: notification.id, type });
        }
        catch (error) {
            logger_1.logger.error('Failed to send system notification', { userId, title, error });
            throw error;
        }
    }
    static async sendBulkNotification(userIds, title, message, type = client_1.NotificationType.INFO, data) {
        try {
            if (userIds.length === 0) {
                return;
            }
            const notification = await connection_1.prisma.notification.create({
                data: {
                    title,
                    message,
                    type,
                    priority: 'medium',
                    category: 'bulk',
                    data
                }
            });
            const userNotifications = userIds.map(userId => ({
                userId,
                notificationId: notification.id,
                status: client_1.NotificationStatus.UNREAD
            }));
            await connection_1.prisma.userNotification.createMany({
                data: userNotifications
            });
            logger_1.logger.info('Bulk notification sent', {
                notificationId: notification.id,
                userCount: userIds.length,
                type
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send bulk notification', { userIds, title, error });
            throw error;
        }
    }
    static async cleanupExpiredNotifications() {
        try {
            const expiredNotifications = await connection_1.prisma.notification.findMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    }
                },
                select: { id: true }
            });
            if (expiredNotifications.length > 0) {
                const expiredIds = expiredNotifications.map(n => n.id);
                await connection_1.prisma.userNotification.deleteMany({
                    where: {
                        notificationId: { in: expiredIds }
                    }
                });
                await connection_1.prisma.notification.deleteMany({
                    where: {
                        id: { in: expiredIds }
                    }
                });
                logger_1.logger.info(`Cleaned up ${expiredNotifications.length} expired notifications`);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup expired notifications', { error });
        }
    }
    static async getNotificationStats(userRole) {
        try {
            if (![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER].includes(userRole)) {
                throw new errorHandler_1.AuthorizationError('Access denied. Senior Manager or Admin role required.');
            }
            const [totalNotifications, totalUserNotifications, unreadCount, notificationsByType, recentNotifications] = await Promise.all([
                connection_1.prisma.notification.count(),
                connection_1.prisma.userNotification.count(),
                connection_1.prisma.userNotification.count({
                    where: { status: client_1.NotificationStatus.UNREAD }
                }),
                connection_1.prisma.notification.groupBy({
                    by: ['type'],
                    _count: { type: true }
                }),
                connection_1.prisma.notification.findMany({
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        _count: {
                            select: {
                                userNotifications: true
                            }
                        }
                    }
                })
            ]);
            return {
                totalNotifications,
                totalUserNotifications,
                unreadCount,
                notificationsByType: notificationsByType.reduce((acc, item) => {
                    acc[item.type] = item._count.type;
                    return acc;
                }, {}),
                recentNotifications
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get notification stats', { error });
            throw error;
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notificationService.js.map
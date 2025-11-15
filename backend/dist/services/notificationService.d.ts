import { NotificationWithStatus, CreateNotificationRequest, PaginationParams } from '@/types';
import { UserRole, NotificationType, NotificationStatus } from '@prisma/client';
export declare class NotificationService {
    static createNotification(notificationData: CreateNotificationRequest, creatorRole: UserRole): Promise<any>;
    static getUserNotifications(userId: string, pagination: PaginationParams, filters?: {
        status?: NotificationStatus;
        type?: NotificationType;
        category?: string;
    }): Promise<{
        notifications: NotificationWithStatus[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        unreadCount: number;
    }>;
    static markAsRead(userId: string, notificationId: string): Promise<void>;
    static markAllAsRead(userId: string): Promise<void>;
    static archiveNotification(userId: string, notificationId: string): Promise<void>;
    static deleteNotification(notificationId: string, userRole: UserRole): Promise<void>;
    static sendSystemNotification(userId: string, title: string, message: string, type?: NotificationType, data?: any): Promise<void>;
    static sendBulkNotification(userIds: string[], title: string, message: string, type?: NotificationType, data?: any): Promise<void>;
    static cleanupExpiredNotifications(): Promise<void>;
    static getNotificationStats(userRole: UserRole): Promise<any>;
}
//# sourceMappingURL=notificationService.d.ts.map
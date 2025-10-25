import { Request, Response } from 'express';
export declare class NotificationController {
    static createNotification: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserNotifications: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUnreadCount: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static markAsRead: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static markAllAsRead: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static archiveNotification: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteNotification: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static sendSystemNotification: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static sendBulkNotification: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getNotificationStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static healthCheck: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=notificationController.d.ts.map
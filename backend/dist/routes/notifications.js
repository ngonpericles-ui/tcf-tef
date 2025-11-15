"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = void 0;
const express_1 = require("express");
const notificationController_1 = require("@/controllers/notificationController");
const validation_1 = require("@/middleware/validation");
const auth_1 = require("@/middleware/auth");
const client_1 = require("@prisma/client");
const nodemailer_1 = __importDefault(require("nodemailer"));
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.notificationRoutes = router;
const prisma = new client_1.PrismaClient();
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_FROM,
        pass: process.env.SMTP_PASS
    }
});
const sendEmailNotification = async (to, subject, html) => {
    try {
        if (!process.env.SMTP_PASS) {
            console.log('SMTP not configured, skipping email notification');
            return;
        }
        await transporter.sendMail({
            from: `${process.env.EMAIL_FROM_NAME || 'AURA.CA'} <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            html
        });
        console.log(`Email notification sent to ${to}`);
    }
    catch (error) {
        console.error('Error sending email notification:', error);
    }
};
const createNotificationSchema = joi_1.default.object({
    title: joi_1.default.string().min(3).max(200).required(),
    titleEn: joi_1.default.string().min(3).max(200).optional(),
    message: joi_1.default.string().min(10).max(1000).required(),
    messageEn: joi_1.default.string().min(10).max(1000).optional(),
    type: joi_1.default.string().valid('INFO', 'WARNING', 'SUCCESS', 'ERROR', 'REMINDER').required(),
    priority: joi_1.default.string().valid('low', 'medium', 'high').default('medium'),
    category: joi_1.default.string().max(50).optional(),
    actionUrl: joi_1.default.string().uri().optional(),
    imageUrl: joi_1.default.string().uri().optional(),
    data: joi_1.default.object().optional(),
    scheduledAt: joi_1.default.date().optional(),
    expiresAt: joi_1.default.date().optional(),
    userIds: joi_1.default.array().items(validation_1.commonSchemas.id).optional(),
    roles: joi_1.default.array().items(validation_1.commonSchemas.role).optional(),
    subscriptionTiers: joi_1.default.array().items(validation_1.commonSchemas.subscriptionTier).optional()
});
const systemNotificationSchema = joi_1.default.object({
    userId: validation_1.commonSchemas.id.required(),
    title: joi_1.default.string().min(3).max(200).required(),
    message: joi_1.default.string().min(10).max(1000).required(),
    type: joi_1.default.string().valid('INFO', 'WARNING', 'SUCCESS', 'ERROR', 'REMINDER').default('INFO'),
    data: joi_1.default.object().optional()
});
const bulkNotificationSchema = joi_1.default.object({
    userIds: joi_1.default.array().items(validation_1.commonSchemas.id).min(1).required(),
    title: joi_1.default.string().min(3).max(200).required(),
    message: joi_1.default.string().min(10).max(1000).required(),
    type: joi_1.default.string().valid('INFO', 'WARNING', 'SUCCESS', 'ERROR', 'REMINDER').default('INFO'),
    data: joi_1.default.object().optional()
});
router.get('/health', notificationController_1.NotificationController.healthCheck);
router.get('/unread-count', auth_1.authenticate, notificationController_1.NotificationController.getUnreadCount);
router.put('/mark-all-read', auth_1.authenticate, notificationController_1.NotificationController.markAllAsRead);
router.get('/stats', auth_1.authenticate, auth_1.requireSeniorManager, notificationController_1.NotificationController.getNotificationStats);
router.get('/', auth_1.authenticate, notificationController_1.NotificationController.getUserNotifications);
router.post('/', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validate)(createNotificationSchema), notificationController_1.NotificationController.createNotification);
router.post('/system', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validate)(systemNotificationSchema), notificationController_1.NotificationController.sendSystemNotification);
router.post('/bulk', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validate)(bulkNotificationSchema), notificationController_1.NotificationController.sendBulkNotification);
router.put('/:notificationId/read', auth_1.authenticate, (0, validation_1.validateParams)({ notificationId: validation_1.commonSchemas.id }), notificationController_1.NotificationController.markAsRead);
router.put('/:notificationId/archive', auth_1.authenticate, (0, validation_1.validateParams)({ notificationId: validation_1.commonSchemas.id }), notificationController_1.NotificationController.archiveNotification);
router.delete('/:notificationId', auth_1.authenticate, (0, validation_1.validateParams)({ notificationId: validation_1.commonSchemas.id }), notificationController_1.NotificationController.deleteNotification);
//# sourceMappingURL=notifications.js.map
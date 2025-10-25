"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const notificationService_1 = require("../services/notificationService");
const router = express_1.default.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
router.get('/unread-count', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const count = await prisma.message.count({
            where: {
                receiverId: userId,
                isRead: false
            }
        });
        res.json({
            success: true,
            data: { count }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20, type = 'received' } = req.query;
        const where = type === 'sent'
            ? { senderId: userId }
            : { receiverId: userId };
        const messages = await prisma.message.findMany({
            where,
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        profileImage: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        profileImage: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: (parseInt(page) - 1) * parseInt(limit)
        });
        const totalCount = await prisma.message.count({ where });
        const unreadCount = await prisma.message.count({
            where: { ...where, isRead: false }
        });
        res.json({
            success: true,
            data: {
                messages,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    pages: Math.ceil(totalCount / parseInt(limit))
                },
                unreadCount
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const senderId = req.user.userId;
        const { receiverId, subject, content, parentId, attachments } = req.body;
        const receiver = await prisma.user.findUnique({
            where: { id: receiverId }
        });
        if (!receiver) {
            return res.status(404).json({
                success: false,
                error: { message: 'Receiver not found' }
            });
        }
        const message = await prisma.message.create({
            data: {
                senderId,
                receiverId,
                subject,
                content,
                parentId,
                attachments
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        await notificationService_1.NotificationService.sendSystemNotification(receiverId, `Nouveau message de ${message.sender.firstName} ${message.sender.lastName}`, subject || content.substring(0, 100) + '...', 'INFO', {
            messageId: message.id,
            senderId: senderId,
            actionUrl: `/messages/${message.id}`
        });
        res.json({
            success: true,
            data: message,
            message: 'Message sent successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const message = await prisma.message.findFirst({
            where: {
                id,
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        profilePicture: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        profilePicture: true
                    }
                },
                replies: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                                profilePicture: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!message) {
            return res.status(404).json({
                success: false,
                error: { message: 'Message not found' }
            });
        }
        if (message.receiverId === userId && !message.isRead) {
            await prisma.message.update({
                where: { id },
                data: { isRead: true }
            });
        }
        res.json({
            success: true,
            data: message
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/reply', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const senderId = req.user.userId;
        const { content, attachments } = req.body;
        const originalMessage = await prisma.message.findFirst({
            where: {
                id,
                OR: [
                    { senderId: senderId },
                    { receiverId: senderId }
                ]
            },
            include: {
                sender: true,
                receiver: true
            }
        });
        if (!originalMessage) {
            return res.status(404).json({
                success: false,
                error: { message: 'Original message not found' }
            });
        }
        const receiverId = originalMessage.senderId === senderId
            ? originalMessage.receiverId
            : originalMessage.senderId;
        const reply = await prisma.message.create({
            data: {
                senderId,
                receiverId,
                subject: `Re: ${originalMessage.subject || 'Message'}`,
                content,
                parentId: originalMessage.parentId || id,
                attachments
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                }
            }
        });
        await notificationService_1.NotificationService.sendSystemNotification(receiverId, `Réponse de ${reply.sender.firstName} ${reply.sender.lastName}`, content.substring(0, 100) + '...', 'INFO', {
            messageId: reply.id,
            senderId: senderId,
            actionUrl: `/messages/${originalMessage.parentId || id}`,
            isReply: true
        });
        res.json({
            success: true,
            data: reply,
            message: 'Reply sent successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/contacts', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { search, role } = req.query;
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
        }
        let allowedRoles = [];
        if (user.role === 'STUDENT' || user.role === 'USER') {
            allowedRoles = ['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'];
        }
        else if (user.role === 'JUNIOR_MANAGER') {
            allowedRoles = ['ADMIN', 'SENIOR_MANAGER', 'STUDENT'];
        }
        else if (user.role === 'SENIOR_MANAGER') {
            allowedRoles = ['ADMIN', 'JUNIOR_MANAGER', 'STUDENT'];
        }
        else if (user.role === 'ADMIN') {
            allowedRoles = ['SENIOR_MANAGER', 'JUNIOR_MANAGER', 'STUDENT'];
        }
        const where = {
            id: { not: userId },
            role: { in: allowedRoles },
            status: 'ACTIVE'
        };
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (role) {
            where.role = role;
        }
        const contacts = await prisma.user.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                profileImage: true,
                status: true
            },
            orderBy: [
                { role: 'asc' },
                { firstName: 'asc' }
            ],
            take: 50
        });
        res.json({
            success: true,
            data: contacts
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id/read', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const message = await prisma.message.updateMany({
            where: {
                id,
                receiverId: userId
            },
            data: {
                isRead: true
            }
        });
        if (message.count === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Message not found' }
            });
        }
        res.json({
            success: true,
            message: 'Message marked as read'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map
"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveSessionController = void 0;
const liveSessionService_1 = require("@/services/liveSessionService");
const errorHandler_1 = require("@/middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("@/utils/logger");
const emailService_1 = require("@/services/emailService");
const database_1 = require("@/config/database");
class LiveSessionController {
    static storeMessage(sessionId, message) {
        if (!this.messageStorage.has(sessionId)) {
            this.messageStorage.set(sessionId, []);
        }
        this.messageStorage.get(sessionId).push(message);
        console.log(`💾 Message stored for session ${sessionId}. Total messages: ${this.messageStorage.get(sessionId).length}`);
    }
    static getStoredMessages(sessionId) {
        const messages = this.messageStorage.get(sessionId) || [];
        console.log(`📥 Retrieved ${messages.length} messages for session ${sessionId}`);
        return messages;
    }
}
exports.LiveSessionController = LiveSessionController;
_a = LiveSessionController;
LiveSessionController.messageStorage = new Map();
LiveSessionController.createLiveSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const sessionData = req.body;
    const createdById = req.user?.userId;
    const creatorRole = req.user?.role;
    if (!createdById || !creatorRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const session = await liveSessionService_1.LiveSessionService.createLiveSession(sessionData, createdById, creatorRole);
    const response = {
        success: true,
        data: { session },
        message: 'Live session created successfully'
    };
    logger_1.logger.info('Live session created', { sessionId: session.id, createdById });
    res.status(201).json(response);
});
LiveSessionController.getLiveSessionById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    const session = await liveSessionService_1.LiveSessionService.getLiveSessionById(sessionId, userId);
    const response = {
        success: true,
        data: { session },
        message: 'Live session retrieved successfully'
    };
    res.status(200).json(response);
});
LiveSessionController.getAllLiveSessions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'date',
        sortOrder: req.query.sortOrder || 'asc'
    };
    const filters = {
        search: req.query.search,
        level: req.query.level,
        category: req.query.category,
        tier: req.query.tier,
        status: req.query.status
    };
    const result = await liveSessionService_1.LiveSessionService.getAllLiveSessions(pagination, filters, userId);
    const response = {
        success: true,
        data: result.sessions,
        pagination: result.pagination,
        message: 'Live sessions retrieved successfully'
    };
    res.status(200).json(response);
});
LiveSessionController.registerForSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await liveSessionService_1.LiveSessionService.registerForSession(sessionId, userId);
    const response = {
        success: true,
        message: 'Registered for live session successfully'
    };
    logger_1.logger.info('User registered for live session', { sessionId, userId });
    res.status(200).json(response);
});
LiveSessionController.unregisterFromSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await liveSessionService_1.LiveSessionService.unregisterFromSession(sessionId, userId);
    const response = {
        success: true,
        message: 'Unregistered from live session successfully'
    };
    logger_1.logger.info('User unregistered from live session', { sessionId, userId });
    res.status(200).json(response);
});
LiveSessionController.updateSessionStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    console.log('🔍 Update session status request:', {
        sessionId,
        status,
        userId,
        userRole
    });
    if (!userId || !userRole) {
        console.log('❌ Authentication required');
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    console.log('🚀 Calling LiveSessionService.updateSessionStatus...');
    const session = await liveSessionService_1.LiveSessionService.updateSessionStatus(sessionId, status, userId, userRole);
    const response = {
        success: true,
        data: { session },
        message: 'Session status updated successfully'
    };
    logger_1.logger.info('Live session status updated', { sessionId, newStatus: status, updatedBy: userId });
    res.status(200).json(response);
});
LiveSessionController.getUserRegisteredSessions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        sortBy: req.query.sortBy || 'date',
        sortOrder: req.query.sortOrder || 'asc'
    };
    const result = await liveSessionService_1.LiveSessionService.getUserRegisteredSessions(userId, pagination);
    const response = {
        success: true,
        data: result.sessions,
        pagination: result.pagination,
        message: 'Registered sessions retrieved successfully'
    };
    res.status(200).json(response);
});
LiveSessionController.getUserCreatedSessions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        sortBy: req.query.sortBy || 'date',
        sortOrder: req.query.sortOrder || 'asc'
    };
    const filters = {
        search: req.query.search,
        level: req.query.level,
        category: req.query.category,
        tier: req.query.tier,
        status: req.query.status
    };
    const extendedFilters = {
        ...filters,
        createdById: userId
    };
    const result = await liveSessionService_1.LiveSessionService.getAllLiveSessions(pagination, extendedFilters, userId);
    const response = {
        success: true,
        data: result.sessions,
        pagination: result.pagination,
        message: 'Created sessions retrieved successfully'
    };
    res.status(200).json(response);
});
LiveSessionController.getUpcomingSessions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: 'date',
        sortOrder: 'asc'
    };
    const filters = {
        status: client_1.LiveSessionStatus.SCHEDULED
    };
    const extendedFilters = {
        ...filters,
        dateFrom: new Date().toISOString()
    };
    const result = await liveSessionService_1.LiveSessionService.getAllLiveSessions(pagination, extendedFilters, userId);
    const response = {
        success: true,
        data: result.sessions,
        pagination: result.pagination,
        message: 'Upcoming sessions retrieved successfully'
    };
    res.status(200).json(response);
});
LiveSessionController.setReminder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, reminderTime } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    try {
        const session = await liveSessionService_1.LiveSessionService.getLiveSessionById(sessionId, userId);
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true, email: true }
        });
        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found' }
            });
            return;
        }
        const sessionDate = new Date(session.date);
        const reminderMinutes = reminderTime === '5min' ? 5 : 10;
        const reminderDate = new Date(sessionDate.getTime() - (reminderMinutes * 60 * 1000));
        const existingReminder = await database_1.prisma.sessionReminder.findFirst({
            where: {
                userId,
                sessionId,
                reminderTime: reminderMinutes,
                reminderType: 'scheduled'
            }
        });
        let reminder;
        if (existingReminder) {
            reminder = await database_1.prisma.sessionReminder.update({
                where: { id: existingReminder.id },
                data: {
                    reminderDate,
                    emailSent: false,
                    sentAt: null
                }
            });
        }
        else {
            reminder = await database_1.prisma.sessionReminder.create({
                data: {
                    userId,
                    sessionId,
                    reminderTime: reminderMinutes,
                    reminderDate,
                    emailSent: false,
                    reminderType: 'scheduled'
                }
            });
        }
        const statusChangeReminderDate = new Date(sessionDate.getTime() - (5 * 60 * 1000));
        const existingStatusReminder = await database_1.prisma.sessionReminder.findFirst({
            where: {
                userId,
                sessionId,
                reminderType: 'status_change'
            }
        });
        if (!existingStatusReminder) {
            await database_1.prisma.sessionReminder.create({
                data: {
                    userId,
                    sessionId,
                    reminderTime: 5,
                    reminderDate: statusChangeReminderDate,
                    emailSent: false,
                    reminderType: 'status_change'
                }
            });
        }
        const emailData = {
            firstName: user.firstName,
            email: user.email,
            sessionTitle: session.title,
            sessionDate: sessionDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            sessionTime: sessionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            joinUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/live`,
            duration: session.duration || 60,
            reminderMinutes: reminderMinutes
        };
        await emailService_1.EmailService.sendLiveSessionReminderConfirmationEmail(emailData);
        logger_1.logger.info('Reminder set for live session', {
            sessionId,
            userId,
            reminderTime,
            reminderDate: reminderDate.toISOString(),
            sessionDate: sessionDate.toISOString()
        });
        const response = {
            success: true,
            data: {
                sessionId,
                reminderTime,
                reminderDate: reminderDate.toISOString(),
                emailSent: true
            },
            message: 'Reminder set successfully and confirmation email sent'
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.logger.error('Error setting reminder:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to set reminder' }
        });
    }
});
LiveSessionController.updateLiveSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const updateData = req.body;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const session = await liveSessionService_1.LiveSessionService.updateLiveSession(sessionId, userId, userRole, updateData);
    const response = {
        success: true,
        data: { session },
        message: 'Live session updated successfully'
    };
    logger_1.logger.info('Live session updated', { sessionId, updatedBy: userId });
    res.status(200).json(response);
});
LiveSessionController.deleteLiveSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await liveSessionService_1.LiveSessionService.deleteLiveSession(sessionId, userId, userRole);
    const response = {
        success: true,
        data: { sessionId },
        message: 'Live session deleted successfully'
    };
    logger_1.logger.info('Live session deleted', { sessionId, deletedBy: userId });
    res.status(200).json(response);
});
LiveSessionController.healthCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const response = {
        success: true,
        data: {
            service: 'live-session',
            status: 'healthy',
            timestamp: new Date().toISOString()
        },
        message: 'Live session service is healthy'
    };
    res.status(200).json(response);
});
LiveSessionController.getLiveSessionStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    try {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const statistics = await database_1.prisma.$transaction(async (tx) => {
            const [scheduledSessions, completedSessions, totalParticipants, totalTimeThisWeek] = await Promise.all([
                tx.liveSession.count({
                    where: {
                        createdById: userId,
                        status: 'SCHEDULED'
                    }
                }),
                tx.liveSession.count({
                    where: {
                        createdById: userId,
                        status: 'COMPLETED'
                    }
                }),
                tx.liveSessionParticipant.count({
                    where: {
                        liveSession: {
                            createdById: userId
                        }
                    }
                }),
                tx.liveSession.aggregate({
                    where: {
                        createdById: userId,
                        status: 'COMPLETED',
                        date: {
                            gte: startOfWeek
                        }
                    },
                    _sum: {
                        duration: true
                    }
                })
            ]);
            return {
                scheduledSessions,
                completedSessions,
                totalParticipants,
                totalTimeThisWeek: Math.round((totalTimeThisWeek._sum.duration || 0) / 60)
            };
        });
        const response = {
            success: true,
            data: statistics,
            message: 'Live session statistics retrieved successfully'
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.logger.error('Failed to get live session statistics', { userId, error });
        if (error.message && error.message.includes('remaining connection slots are reserved')) {
            res.status(503).json({
                success: false,
                error: {
                    message: 'Database connection pool exhausted. Please try again in a moment.',
                    code: 'CONNECTION_POOL_EXHAUSTED'
                }
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: { message: 'Failed to retrieve statistics' }
            });
        }
    }
});
LiveSessionController.getSessionParticipants = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    try {
        const participants = await database_1.prisma.liveSessionParticipant.findMany({
            where: {
                liveSessionId: sessionId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        profilePicture: true,
                        role: true
                    }
                }
            }
        });
        const formattedParticipants = participants.map(p => ({
            id: p.user.id,
            name: `${p.user.firstName} ${p.user.lastName}`,
            email: p.user.email,
            profilePicture: p.user.profilePicture,
            role: p.user.role,
            isMuted: false,
            isVideoOn: true,
            hasHandRaised: false,
            isHost: false,
            joinedAt: p.joinedAt
        }));
        res.status(200).json({
            success: true,
            data: formattedParticipants
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get session participants', { sessionId, userId, error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve participants' }
        });
    }
});
LiveSessionController.muteParticipant = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, participantId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    try {
        const participant = await database_1.prisma.liveSessionParticipant.findFirst({
            where: {
                liveSessionId: sessionId,
                userId: participantId
            }
        });
        if (!participant) {
            res.status(404).json({
                success: false,
                error: { message: 'Participant not found' }
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: { isMuted: false }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to mute participant', { sessionId, participantId, userId, error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to mute participant' }
        });
    }
});
LiveSessionController.pinParticipant = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, participantId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    try {
        const participant = await database_1.prisma.liveSessionParticipant.findFirst({
            where: {
                liveSessionId: sessionId,
                userId: participantId
            }
        });
        if (!participant) {
            res.status(404).json({
                success: false,
                error: { message: 'Participant not found' }
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: { isPinned: false }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to pin participant', { sessionId, participantId, userId, error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to pin participant' }
        });
    }
});
LiveSessionController.removeParticipant = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, participantId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    try {
        const participant = await database_1.prisma.liveSessionParticipant.findFirst({
            where: {
                liveSessionId: sessionId,
                userId: participantId
            }
        });
        if (!participant) {
            res.status(404).json({
                success: false,
                error: { message: 'Participant not found' }
            });
            return;
        }
        await database_1.prisma.liveSessionParticipant.delete({
            where: { id: participant.id }
        });
        res.status(200).json({
            success: true,
            message: 'Participant removed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to remove participant', { sessionId, participantId, userId, error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to remove participant' }
        });
    }
});
LiveSessionController.getSessionMessages = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    try {
        const messages = _a.getStoredMessages(sessionId);
        res.status(200).json({
            success: true,
            data: messages
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get session messages', { sessionId, userId, error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve messages' }
        });
    }
});
LiveSessionController.sendMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true, profilePicture: true }
        });
        const formattedMessage = {
            id: `msg_${Date.now()}`,
            senderId: userId,
            senderName: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
            senderProfilePicture: user?.profilePicture || null,
            message: message,
            timestamp: new Date(),
            isSystemMessage: false
        };
        _a.storeMessage(sessionId, formattedMessage);
        res.status(201).json({
            success: true,
            data: formattedMessage
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to send message', { sessionId, userId, error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to send message' }
        });
    }
});
//# sourceMappingURL=liveSessionController.js.map
"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveSessionController = void 0;
const liveSessionService_1 = require("../services/liveSessionService");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const emailService_1 = require("../services/emailService");
const database_1 = require("../config/database");
class LiveSessionController {
}
exports.LiveSessionController = LiveSessionController;
_a = LiveSessionController;
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
    if (!userId || !userRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
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
        await database_1.prisma.sessionReminder.create({
            data: {
                userId,
                sessionId,
                reminderTime: reminderMinutes,
                reminderDate,
                emailSent: false
            }
        });
        const emailData = {
            firstName: user.firstName,
            email: user.email,
            sessionTitle: session.title,
            sessionDate: sessionDate.toLocaleDateString('fr-FR'),
            sessionTime: sessionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            joinUrl: `${process.env.FRONTEND_URL}/live/${sessionId}`,
            duration: session.duration || 60
        };
        await emailService_1.EmailService.sendLiveSessionReminderEmail(emailData);
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
        const [scheduledSessions, completedSessions, totalParticipants, totalTimeThisWeek] = await Promise.all([
            database_1.prisma.liveSession.count({
                where: {
                    createdById: userId,
                    status: 'SCHEDULED'
                }
            }),
            database_1.prisma.liveSession.count({
                where: {
                    createdById: userId,
                    status: 'COMPLETED'
                }
            }),
            database_1.prisma.liveSessionParticipant.count({
                where: {
                    liveSession: {
                        createdById: userId
                    }
                }
            }),
            database_1.prisma.liveSession.aggregate({
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
        const statistics = {
            scheduledSessions,
            completedSessions,
            totalParticipants,
            totalTimeThisWeek: Math.round((totalTimeThisWeek._sum.duration || 0) / 60)
        };
        const response = {
            success: true,
            data: statistics,
            message: 'Live session statistics retrieved successfully'
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.logger.error('Failed to get live session statistics', { userId, error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve statistics' }
        });
    }
});
//# sourceMappingURL=liveSessionController.js.map
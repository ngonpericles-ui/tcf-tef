"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveSessionService = void 0;
const prisma_1 = require("../lib/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const node_cron_1 = __importDefault(require("node-cron"));
class LiveSessionService {
    static async createLiveSession(sessionData, createdById, creatorRole) {
        try {
            if (![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(creatorRole)) {
                throw new errorHandler_1.AuthorizationError('Access denied. Manager role required.');
            }
            if (new Date(sessionData.date) <= new Date()) {
                throw new errorHandler_1.ValidationError('Session date must be in the future');
            }
            if (creatorRole === client_1.UserRole.JUNIOR_MANAGER) {
                const allowedLevels = ['A1', 'A2', 'B1'];
                const allowedTiers = ['FREE', 'ESSENTIAL'];
                if (sessionData.level && !allowedLevels.includes(sessionData.level)) {
                    throw new errorHandler_1.AuthorizationError('Junior managers can only create sessions up to B1 level');
                }
                if (sessionData.requiredTier && !allowedTiers.includes(sessionData.requiredTier)) {
                    throw new errorHandler_1.AuthorizationError('Junior managers can only create sessions for FREE and ESSENTIAL tiers');
                }
                if (sessionData.maxParticipants <= 1) {
                    throw new errorHandler_1.AuthorizationError('Junior managers cannot create 1-on-1 sessions');
                }
            }
            if (creatorRole === client_1.UserRole.SENIOR_MANAGER || creatorRole === client_1.UserRole.ADMIN) {
                if (sessionData.requiredTier === 'PRO' && sessionData.maxParticipants === 1) {
                }
            }
            const liveSession = await prisma_1.prisma.liveSession.create({
                data: {
                    ...sessionData,
                    createdById,
                    status: client_1.LiveSessionStatus.SCHEDULED
                },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            profileImage: true
                        }
                    },
                    participants: true
                }
            });
            logger_1.logger.info('Live session created successfully', {
                sessionId: liveSession.id,
                title: liveSession.title,
                createdById
            });
            return liveSession;
        }
        catch (error) {
            logger_1.logger.error('Failed to create live session', { sessionData, createdById, error });
            throw error;
        }
    }
    static async getLiveSessionById(sessionId, userId) {
        try {
            const liveSession = await prisma_1.prisma.liveSession.findUnique({
                where: { id: sessionId },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            email: true,
                            profileImage: true
                        }
                    },
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            participants: true
                        }
                    }
                }
            });
            if (!liveSession) {
                throw new errorHandler_1.NotFoundError('Live session not found');
            }
            if (liveSession.requiredTier !== client_1.SubscriptionTier.FREE && userId) {
                const user = await prisma_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: { subscriptionTier: true, role: true }
                });
                if (user && [client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(user.role)) {
                }
                else if (user && !this.hasAccessToTier(user.subscriptionTier, liveSession.requiredTier)) {
                    throw new errorHandler_1.AuthorizationError('Subscription upgrade required to access this session');
                }
            }
            const sessionWithDetails = {
                ...liveSession,
                participantCount: liveSession.participants.length,
                isRegistered: userId ? liveSession.participants.some(p => p.userId === userId) : false,
                isFavorited: false
            };
            return sessionWithDetails;
        }
        catch (error) {
            logger_1.logger.error('Failed to get live session by ID', { sessionId, userId, error });
            throw error;
        }
    }
    static async getAllLiveSessions(pagination, filters, userId) {
        try {
            const { page = 1, limit = 10, sortBy = 'date', sortOrder = 'asc' } = pagination;
            const { search, level, category, tier, status } = filters;
            const where = {
                isOneOnOne: false
            };
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { titleEn: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { instructor: { contains: search, mode: 'insensitive' } },
                    { tags: { has: search } }
                ];
            }
            if (level) {
                where.level = level;
            }
            if (category) {
                where.category = category;
            }
            if (tier) {
                where.requiredTier = tier;
            }
            if (status) {
                if (typeof status === 'string' && status.includes(',')) {
                    const statusArray = status.split(',').map(s => s.trim());
                    where.status = { in: statusArray };
                }
                else {
                    where.status = status;
                }
            }
            const total = await prisma_1.prisma.liveSession.count({ where });
            const sessions = await prisma_1.prisma.liveSession.findMany({
                where,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            profileImage: true
                        }
                    },
                    participants: userId ? {
                        where: { userId }
                    } : {
                        take: 0
                    },
                    _count: {
                        select: {
                            participants: true
                        }
                    }
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit
            });
            const totalPages = Math.ceil(total / limit);
            const sessionsWithDetails = sessions.map(session => ({
                ...session,
                participantCount: session._count.participants,
                isRegistered: session.participants.length > 0,
                isFavorited: false
            }));
            return {
                sessions: sessionsWithDetails,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get all live sessions', { error });
            throw error;
        }
    }
    static async registerForSession(sessionId, userId) {
        try {
            const session = await prisma_1.prisma.liveSession.findUnique({
                where: { id: sessionId },
                include: {
                    participants: true
                }
            });
            if (!session) {
                throw new errorHandler_1.NotFoundError('Live session not found');
            }
            if (session.status !== client_1.LiveSessionStatus.SCHEDULED && session.status !== client_1.LiveSessionStatus.LIVE) {
                throw new errorHandler_1.ValidationError('Cannot register for this session');
            }
            if (session.status === client_1.LiveSessionStatus.SCHEDULED && session.date <= new Date()) {
                throw new errorHandler_1.ValidationError('Cannot register for past sessions');
            }
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: { subscriptionTier: true, role: true }
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            if (![client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(user.role)) {
                if (!this.hasAccessToTier(user.subscriptionTier, session.requiredTier)) {
                    throw new errorHandler_1.AuthorizationError('Subscription upgrade required to register for this session');
                }
            }
            const existingParticipant = await prisma_1.prisma.liveSessionParticipant.findUnique({
                where: {
                    userId_liveSessionId: {
                        userId,
                        liveSessionId: sessionId
                    }
                }
            });
            if (existingParticipant) {
                throw new errorHandler_1.ConflictError('Already registered for this session');
            }
            if (session.participants.length >= session.maxParticipants) {
                throw new errorHandler_1.ValidationError('Session is full');
            }
            await prisma_1.prisma.liveSessionParticipant.create({
                data: {
                    userId,
                    liveSessionId: sessionId,
                    joinedAt: new Date()
                }
            });
            logger_1.logger.info('User registered for live session successfully', { sessionId, userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to register for live session', { sessionId, userId, error });
            throw error;
        }
    }
    static async unregisterFromSession(sessionId, userId) {
        try {
            const participant = await prisma_1.prisma.liveSessionParticipant.findUnique({
                where: {
                    userId_liveSessionId: {
                        userId,
                        liveSessionId: sessionId
                    }
                }
            });
            if (!participant) {
                throw new errorHandler_1.NotFoundError('Not registered for this session');
            }
            const session = await prisma_1.prisma.liveSession.findUnique({
                where: { id: sessionId }
            });
            if (!session) {
                throw new errorHandler_1.NotFoundError('Live session not found');
            }
            if (session.status === client_1.LiveSessionStatus.LIVE) {
                throw new errorHandler_1.ValidationError('Cannot unregister from a live session');
            }
            await prisma_1.prisma.liveSessionParticipant.delete({
                where: {
                    userId_liveSessionId: {
                        userId,
                        liveSessionId: sessionId
                    }
                }
            });
            logger_1.logger.info('User unregistered from live session successfully', { sessionId, userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to unregister from live session', { sessionId, userId, error });
            throw error;
        }
    }
    static async updateSessionStatus(sessionId, newStatus, userId, userRole) {
        try {
            console.log('🔍 LiveSessionService.updateSessionStatus called:', {
                sessionId,
                newStatus,
                userId,
                userRole
            });
            const existingSession = await prisma_1.prisma.liveSession.findUnique({
                where: { id: sessionId }
            });
            console.log('📋 Existing session found:', {
                id: existingSession?.id,
                status: existingSession?.status,
                createdById: existingSession?.createdById
            });
            if (!existingSession) {
                throw new errorHandler_1.NotFoundError('Live session not found');
            }
            const isAdminOrManager = userRole !== 'STUDENT' && [client_1.UserRole.ADMIN, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.JUNIOR_MANAGER].includes(userRole);
            const isCreator = existingSession.createdById === userId;
            console.log('🔐 Authorization check:', {
                isAdminOrManager,
                isCreator,
                userRole,
                sessionCreatorId: existingSession.createdById,
                requestingUserId: userId
            });
            if (!isAdminOrManager && !isCreator) {
                throw new errorHandler_1.AuthorizationError('Access denied. Only admins, managers, or session creators can update session status.');
            }
            console.log('🔄 Updating session status in database...');
            const updatedSession = await prisma_1.prisma.liveSession.update({
                where: { id: sessionId },
                data: {
                    status: newStatus,
                    updatedAt: new Date()
                },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            profileImage: true
                        }
                    },
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true
                                }
                            }
                        }
                    },
                    reminders: {
                        where: {
                            emailSent: false,
                            reminderType: 'status_change'
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true
                                }
                            }
                        }
                    }
                }
            });
            if (existingSession.status === 'SCHEDULED' && newStatus === 'LIVE') {
                console.log('📧 Status changed to LIVE - sending reminder emails to participants...');
                const { EmailService } = await Promise.resolve().then(() => __importStar(require('./emailService')));
                const sessionDate = new Date(updatedSession.date);
                const sessionEnd = new Date(sessionDate.getTime() + (updatedSession.duration * 60 * 1000));
                for (const participant of updatedSession.participants) {
                    try {
                        const emailData = {
                            firstName: participant.user.firstName || 'Étudiant',
                            email: participant.user.email,
                            sessionTitle: updatedSession.title,
                            sessionDate: sessionDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                            sessionTime: sessionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                            joinUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/live`,
                            duration: updatedSession.duration || 60,
                            reminderMinutes: 5
                        };
                        await EmailService.sendLiveSessionReminderEmail(emailData);
                        console.log(`✅ Reminder email sent to ${participant.user.email}`);
                    }
                    catch (error) {
                        console.error(`❌ Failed to send reminder email to ${participant.user.email}:`, error);
                    }
                }
                await prisma_1.prisma.sessionReminder.updateMany({
                    where: {
                        sessionId,
                        reminderType: 'status_change',
                        emailSent: false
                    },
                    data: {
                        emailSent: true,
                        sentAt: new Date()
                    }
                });
            }
            console.log('✅ Session status updated successfully in database:', {
                sessionId,
                oldStatus: existingSession.status,
                newStatus,
                updatedBy: userId
            });
            logger_1.logger.info('Live session status updated successfully', {
                sessionId,
                oldStatus: existingSession.status,
                newStatus,
                updatedBy: userId
            });
            return {
                ...updatedSession,
                participantCount: updatedSession.participants?.length || 0,
                isRegistered: false,
                isFavorited: false
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update session status', { sessionId, newStatus, userId, error });
            throw error;
        }
    }
    static async getUserRegisteredSessions(userId, pagination) {
        try {
            const { page = 1, limit = 10, sortBy = 'date', sortOrder = 'asc' } = pagination;
            const total = await prisma_1.prisma.liveSessionParticipant.count({
                where: { userId }
            });
            const participants = await prisma_1.prisma.liveSessionParticipant.findMany({
                where: { userId },
                include: {
                    liveSession: {
                        include: {
                            createdBy: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true
                                }
                            },
                            _count: {
                                select: {
                                    participants: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    liveSession: { [sortBy]: sortOrder }
                },
                skip: (page - 1) * limit,
                take: limit
            });
            const totalPages = Math.ceil(total / limit);
            const sessions = participants.map(participant => ({
                ...participant.liveSession,
                createdBy: participant.liveSession.createdBy,
                participantCount: participant.liveSession._count.participants,
                isRegistered: true,
                isFavorited: false
            }));
            return {
                sessions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user registered sessions', { userId, error });
            throw error;
        }
    }
    static async updateLiveSession(sessionId, userId, userRole, updateData) {
        try {
            const session = await prisma_1.prisma.liveSession.findUnique({
                where: { id: sessionId },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            profileImage: true
                        }
                    },
                    _count: {
                        select: {
                            participants: true
                        }
                    }
                }
            });
            if (!session) {
                throw new errorHandler_1.NotFoundError('Live session not found');
            }
            if (session.createdById !== userId && userRole !== client_1.UserRole.ADMIN) {
                throw new errorHandler_1.AuthorizationError('You do not have permission to update this session');
            }
            const updated = await prisma_1.prisma.liveSession.update({
                where: { id: sessionId },
                data: {
                    title: updateData.title || session.title,
                    description: updateData.description || session.description,
                    date: updateData.date || session.date,
                    duration: updateData.duration || session.duration,
                    maxParticipants: updateData.maxParticipants || session.maxParticipants,
                    category: updateData.category || session.category,
                    level: updateData.level || session.level,
                    tags: updateData.tags || session.tags,
                    updatedAt: new Date()
                }
            });
            logger_1.logger.info('Live session updated', { sessionId, updatedBy: userId });
            return {
                ...updated,
                createdBy: session.createdBy,
                participantCount: session._count.participants,
                isRegistered: false,
                isFavorited: false
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update live session', { sessionId, userId, error });
            throw error;
        }
    }
    static async deleteLiveSession(sessionId, userId, userRole) {
        try {
            const session = await prisma_1.prisma.liveSession.findUnique({
                where: { id: sessionId }
            });
            if (!session) {
                throw new errorHandler_1.NotFoundError('Live session not found');
            }
            if (session.createdById !== userId && userRole !== client_1.UserRole.ADMIN) {
                throw new errorHandler_1.AuthorizationError('You do not have permission to delete this session');
            }
            await prisma_1.prisma.liveSession.delete({
                where: { id: sessionId }
            });
            logger_1.logger.info('Live session deleted', { sessionId, deletedBy: userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete live session', { sessionId, userId, error });
            throw error;
        }
    }
    static hasAccessToTier(userTier, requiredTier) {
        const tierHierarchy = {
            [client_1.SubscriptionTier.FREE]: 0,
            [client_1.SubscriptionTier.ESSENTIAL]: 1,
            [client_1.SubscriptionTier.PREMIUM]: 2,
            [client_1.SubscriptionTier.PRO]: 3
        };
        return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
    }
    static initializeCronJobs() {
        node_cron_1.default.schedule('* * * * *', async () => {
            try {
                const now = new Date();
                const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
                const sixMinutesFromNow = new Date(now.getTime() + 6 * 60 * 1000);
                const sessionsToActivate = await prisma_1.prisma.liveSession.findMany({
                    where: {
                        status: 'SCHEDULED',
                        date: {
                            gte: fiveMinutesFromNow,
                            lte: sixMinutesFromNow
                        }
                    },
                    include: {
                        participants: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                });
                if (sessionsToActivate.length > 0) {
                    logger_1.logger.info(`🔄 Found ${sessionsToActivate.length} session(s) to activate (5 minutes before start)`);
                }
                for (const session of sessionsToActivate) {
                    try {
                        await prisma_1.prisma.liveSession.update({
                            where: { id: session.id },
                            data: { status: 'LIVE' }
                        });
                        logger_1.logger.info(`✅ Session ${session.id} status changed to LIVE (5 minutes before start)`);
                        const { EmailService } = await Promise.resolve().then(() => __importStar(require('./emailService')));
                        const sessionDate = new Date(session.date);
                        for (const participant of session.participants) {
                            try {
                                const emailData = {
                                    firstName: participant.user.firstName || 'Étudiant',
                                    email: participant.user.email,
                                    sessionTitle: session.title,
                                    sessionDate: sessionDate.toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }),
                                    sessionTime: sessionDate.toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }),
                                    joinUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/live`,
                                    duration: session.duration || 60,
                                    reminderMinutes: 5
                                };
                                await EmailService.sendLiveSessionReminderEmail(emailData);
                                logger_1.logger.info(`✅ Reminder email sent to ${participant.user.email} for session ${session.id}`);
                            }
                            catch (error) {
                                logger_1.logger.error(`❌ Failed to send reminder email to ${participant.user.email}:`, error);
                            }
                        }
                        await prisma_1.prisma.sessionReminder.updateMany({
                            where: {
                                sessionId: session.id,
                                reminderType: 'status_change',
                                emailSent: false
                            },
                            data: {
                                emailSent: true,
                                sentAt: new Date()
                            }
                        });
                    }
                    catch (error) {
                        logger_1.logger.error(`❌ Failed to activate session ${session.id}:`, error);
                    }
                }
            }
            catch (error) {
                logger_1.logger.error('❌ Error in live session cron job:', error);
            }
        });
        logger_1.logger.info('🕐 Live session status update cron job initialized (runs every minute)');
    }
}
exports.LiveSessionService = LiveSessionService;
//# sourceMappingURL=liveSessionService.js.map
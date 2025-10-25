"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveSessionService = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
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
            const liveSession = await connection_1.prisma.liveSession.create({
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
                            lastName: true
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
            const liveSession = await connection_1.prisma.liveSession.findUnique({
                where: { id: sessionId },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
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
                const user = await connection_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: { subscriptionTier: true }
                });
                if (user && !this.hasAccessToTier(user.subscriptionTier, liveSession.requiredTier)) {
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
            const where = {};
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
            const total = await connection_1.prisma.liveSession.count({ where });
            const sessions = await connection_1.prisma.liveSession.findMany({
                where,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
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
            const session = await connection_1.prisma.liveSession.findUnique({
                where: { id: sessionId },
                include: {
                    participants: true
                }
            });
            if (!session) {
                throw new errorHandler_1.NotFoundError('Live session not found');
            }
            if (session.status !== client_1.LiveSessionStatus.SCHEDULED) {
                throw new errorHandler_1.ValidationError('Cannot register for this session');
            }
            if (session.date <= new Date()) {
                throw new errorHandler_1.ValidationError('Cannot register for past sessions');
            }
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId },
                select: { subscriptionTier: true }
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            if (!this.hasAccessToTier(user.subscriptionTier, session.requiredTier)) {
                throw new errorHandler_1.AuthorizationError('Subscription upgrade required to register for this session');
            }
            const existingParticipant = await connection_1.prisma.liveSessionParticipant.findUnique({
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
            await connection_1.prisma.liveSessionParticipant.create({
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
            const participant = await connection_1.prisma.liveSessionParticipant.findUnique({
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
            const session = await connection_1.prisma.liveSession.findUnique({
                where: { id: sessionId }
            });
            if (!session) {
                throw new errorHandler_1.NotFoundError('Live session not found');
            }
            if (session.status === client_1.LiveSessionStatus.LIVE) {
                throw new errorHandler_1.ValidationError('Cannot unregister from a live session');
            }
            await connection_1.prisma.liveSessionParticipant.delete({
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
            const existingSession = await connection_1.prisma.liveSession.findUnique({
                where: { id: sessionId }
            });
            if (!existingSession) {
                throw new errorHandler_1.NotFoundError('Live session not found');
            }
            if (userRole !== client_1.UserRole.ADMIN && existingSession.createdById !== userId) {
                throw new errorHandler_1.AuthorizationError('Access denied. You can only manage your own sessions.');
            }
            const updatedSession = await connection_1.prisma.liveSession.update({
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
                            lastName: true
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
                    }
                }
            });
            logger_1.logger.info('Live session status updated successfully', {
                sessionId,
                oldStatus: existingSession.status,
                newStatus,
                updatedBy: userId
            });
            return {
                ...updatedSession,
                participantCount: updatedSession.participants.length,
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
            const total = await connection_1.prisma.liveSessionParticipant.count({
                where: { userId }
            });
            const participants = await connection_1.prisma.liveSessionParticipant.findMany({
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
            const session = await connection_1.prisma.liveSession.findUnique({
                where: { id: sessionId },
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
            });
            if (!session) {
                throw new errorHandler_1.NotFoundError('Live session not found');
            }
            if (session.createdById !== userId && userRole !== client_1.UserRole.ADMIN) {
                throw new errorHandler_1.AuthorizationError('You do not have permission to update this session');
            }
            const updated = await connection_1.prisma.liveSession.update({
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
            const session = await connection_1.prisma.liveSession.findUnique({
                where: { id: sessionId }
            });
            if (!session) {
                throw new errorHandler_1.NotFoundError('Live session not found');
            }
            if (session.createdById !== userId && userRole !== client_1.UserRole.ADMIN) {
                throw new errorHandler_1.AuthorizationError('You do not have permission to delete this session');
            }
            await connection_1.prisma.liveSession.delete({
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
}
exports.LiveSessionService = LiveSessionService;
//# sourceMappingURL=liveSessionService.js.map
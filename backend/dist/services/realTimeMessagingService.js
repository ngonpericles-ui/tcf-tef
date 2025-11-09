"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeMessagingService = void 0;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const messagingService_1 = require("./messagingService");
const logger_1 = require("../utils/logger");
const redis_1 = require("../config/redis");
class RealTimeMessagingService {
    constructor(server) {
        this.connectedUsers = new Map();
        this.userRooms = new Map();
        this.typingUsers = new Map();
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000,
            maxHttpBufferSize: 1e6,
            allowEIO3: true,
        });
        this.setupRedisAdapter().catch((error) => {
            logger_1.logger.warn('Redis adapter setup error (non-blocking):', error);
        });
        this.messagingService = new messagingService_1.MessagingService(this.io);
        this.messageQueue = redis_1.messageQueueRedis;
        this.initializeSocketHandlers();
        this.initializeCleanupTasks();
        logger_1.logger.info('Real-time messaging service initialized');
    }
    async setupRedisAdapter() {
        const isRedisEnabled = !!process.env.REDIS_HOST && process.env.REDIS_HOST !== 'localhost';
        if (!isRedisEnabled) {
            logger_1.logger.info('Socket.IO using default adapter (Redis not configured - REDIS_HOST not set)');
            return;
        }
        if (!redis_1.redisPubClient || !redis_1.redisSubClient) {
            logger_1.logger.info('Socket.IO using default adapter (Redis clients not available)');
            return;
        }
        const pubStatus = redis_1.redisPubClient.status;
        const subStatus = redis_1.redisSubClient.status;
        logger_1.logger.info(`Redis client status - Pub: ${pubStatus}, Sub: ${subStatus}`);
        if (pubStatus !== 'ready' || subStatus !== 'ready') {
            logger_1.logger.info('Redis clients not ready, waiting for connection (max 5s)...');
            try {
                await Promise.race([
                    Promise.all([
                        new Promise((resolve) => {
                            if (pubStatus === 'ready') {
                                resolve();
                                return;
                            }
                            const timeout = setTimeout(() => {
                                redis_1.redisPubClient.removeListener('ready', onReady);
                                resolve();
                            }, 5000);
                            const onReady = () => {
                                clearTimeout(timeout);
                                resolve();
                            };
                            redis_1.redisPubClient.once('ready', onReady);
                        }),
                        new Promise((resolve) => {
                            if (subStatus === 'ready') {
                                resolve();
                                return;
                            }
                            const timeout = setTimeout(() => {
                                redis_1.redisSubClient.removeListener('ready', onReady);
                                resolve();
                            }, 5000);
                            const onReady = () => {
                                clearTimeout(timeout);
                                resolve();
                            };
                            redis_1.redisSubClient.once('ready', onReady);
                        })
                    ]),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 5000))
                ]);
                const finalPubStatus = redis_1.redisPubClient.status;
                const finalSubStatus = redis_1.redisSubClient.status;
                if (finalPubStatus !== 'ready' || finalSubStatus !== 'ready') {
                    logger_1.logger.warn(`Redis clients still not ready after wait - Pub: ${finalPubStatus}, Sub: ${finalSubStatus}. Using default adapter.`);
                    return;
                }
            }
            catch (error) {
                logger_1.logger.warn('Redis clients not ready after timeout, using default adapter', {
                    error: error?.message || error,
                    pubStatus: redis_1.redisPubClient.status,
                    subStatus: redis_1.redisSubClient.status
                });
                return;
            }
        }
        try {
            this.io.adapter((0, redis_adapter_1.createAdapter)(redis_1.redisPubClient, redis_1.redisSubClient));
            logger_1.logger.info('✅ Redis adapter configured for Socket.IO clustering');
        }
        catch (error) {
            logger_1.logger.warn('Redis adapter setup failed - using default adapter', {
                error: error?.message || error,
                pubStatus: redis_1.redisPubClient.status,
                subStatus: redis_1.redisSubClient.status
            });
        }
    }
    initializeSocketHandlers() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token ||
                    socket.handshake.headers.authorization?.replace('Bearer ', '');
                if (!token) {
                    return next(new Error('Authentication required'));
                }
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.userId;
                socket.userRole = decoded.role;
                socket.userName = `${decoded.firstName} ${decoded.lastName}`;
                next();
            }
            catch (error) {
                logger_1.logger.error('Socket authentication failed', { error: error.message });
                next(new Error('Authentication failed'));
            }
        });
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    handleConnection(socket) {
        const userId = socket.userId;
        const socketId = socket.id;
        this.connectedUsers.set(userId, socketId);
        this.userRooms.set(userId, new Set());
        socket.join(`user:${userId}`);
        this.messagingService.setUserOnline(userId, socketId);
        logger_1.logger.info('User connected to messaging', {
            userId,
            socketId,
            totalConnected: this.connectedUsers.size
        });
        this.handleMessagingEvents(socket);
        this.handlePresenceEvents(socket);
        this.handleTypingEvents(socket);
        this.handleRoomEvents(socket);
        socket.on('disconnect', () => {
            this.handleDisconnection(socket);
        });
    }
    handleMessagingEvents(socket) {
        const userId = socket.userId;
        socket.on('message:send', async (data) => {
            try {
                const { receiverId, content, type = 'text', metadata } = data;
                if (!receiverId || !content) {
                    socket.emit('message:error', { message: 'Invalid message data' });
                    return;
                }
                const message = await this.messagingService.sendMessage(userId, receiverId, content, type, metadata);
                socket.emit('message:sent', message);
                logger_1.logger.info('Message sent via socket', {
                    messageId: message.id,
                    senderId: userId,
                    receiverId
                });
            }
            catch (error) {
                logger_1.logger.error('Failed to send message via socket', { error, userId });
                socket.emit('message:error', { message: error.message });
            }
        });
        socket.on('message:read', async (data) => {
            try {
                const { messageId } = data;
                await this.messagingService.markAsRead(messageId, userId);
                socket.emit('message:read_confirmed', { messageId });
            }
            catch (error) {
                logger_1.logger.error('Failed to mark message as read', { error, userId, messageId: data.messageId });
            }
        });
        socket.on('message:get_recent', async (data) => {
            try {
                const { otherUserId, limit = 50 } = data;
                const messages = await this.messagingService.getRecentMessages(userId, otherUserId, limit);
                socket.emit('message:recent', { messages, otherUserId });
            }
            catch (error) {
                logger_1.logger.error('Failed to get recent messages', { error, userId });
                socket.emit('message:error', { message: 'Failed to load messages' });
            }
        });
        socket.on('message:delivered', (data) => {
            const { messageId } = data;
            socket.broadcast.emit('message:delivery_confirmed', { messageId, deliveredTo: userId });
        });
    }
    handlePresenceEvents(socket) {
        const userId = socket.userId;
        socket.on('presence:update', (data) => {
            const { status } = data;
            socket.broadcast.emit('presence:updated', {
                userId,
                status,
                timestamp: new Date()
            });
            logger_1.logger.debug('Presence updated', { userId, status });
        });
        socket.on('presence:request', (data) => {
            const { contactIds } = data;
            const presenceData = contactIds.map((contactId) => ({
                userId: contactId,
                isOnline: this.connectedUsers.has(contactId),
                lastSeen: new Date()
            }));
            socket.emit('presence:response', { presence: presenceData });
        });
    }
    handleTypingEvents(socket) {
        const userId = socket.userId;
        socket.on('typing:start', (data) => {
            const { roomId } = data;
            if (!this.typingUsers.has(roomId)) {
                this.typingUsers.set(roomId, new Map());
            }
            this.typingUsers.get(roomId).set(userId, Date.now());
            socket.to(roomId).emit('typing:started', {
                roomId,
                userId,
                timestamp: new Date()
            });
            setTimeout(() => {
                this.stopTyping(roomId, userId);
            }, 3000);
        });
        socket.on('typing:stop', (data) => {
            const { roomId } = data;
            this.stopTyping(roomId, userId);
        });
    }
    stopTyping(roomId, userId) {
        if (this.typingUsers.has(roomId)) {
            this.typingUsers.get(roomId).delete(userId);
            this.io.to(roomId).emit('typing:stopped', {
                roomId,
                userId,
                timestamp: new Date()
            });
        }
    }
    handleRoomEvents(socket) {
        const userId = socket.userId;
        socket.on('room:join', (data) => {
            const { roomId } = data;
            socket.join(roomId);
            if (!this.userRooms.has(userId)) {
                this.userRooms.set(userId, new Set());
            }
            this.userRooms.get(userId).add(roomId);
            socket.to(roomId).emit('room:user_joined', {
                roomId,
                userId,
                timestamp: new Date()
            });
            logger_1.logger.debug('User joined room', { userId, roomId });
        });
        socket.on('room:leave', (data) => {
            const { roomId } = data;
            socket.leave(roomId);
            this.userRooms.get(userId)?.delete(roomId);
            socket.to(roomId).emit('room:user_left', {
                roomId,
                userId,
                timestamp: new Date()
            });
            logger_1.logger.debug('User left room', { userId, roomId });
        });
    }
    handleDisconnection(socket) {
        const userId = socket.userId;
        const socketId = socket.id;
        this.connectedUsers.delete(userId);
        const userRooms = this.userRooms.get(userId);
        if (userRooms) {
            userRooms.forEach(roomId => {
                socket.to(roomId).emit('room:user_left', {
                    roomId,
                    userId,
                    timestamp: new Date()
                });
            });
            this.userRooms.delete(userId);
        }
        this.messagingService.setUserOffline(userId);
        this.typingUsers.forEach((users, roomId) => {
            if (users.has(userId)) {
                users.delete(userId);
                this.io.to(roomId).emit('typing:stopped', {
                    roomId,
                    userId,
                    timestamp: new Date()
                });
            }
        });
        logger_1.logger.info('User disconnected from messaging', {
            userId,
            socketId,
            totalConnected: this.connectedUsers.size
        });
    }
    initializeCleanupTasks() {
        setInterval(() => {
            const now = Date.now();
            this.typingUsers.forEach((users, roomId) => {
                users.forEach((timestamp, userId) => {
                    if (now - timestamp > 5000) {
                        users.delete(userId);
                        this.io.to(roomId).emit('typing:stopped', {
                            roomId,
                            userId,
                            timestamp: new Date()
                        });
                    }
                });
            });
        }, 30000);
        setInterval(() => {
            const stats = this.getStats();
            logger_1.logger.info('Messaging service stats', stats);
        }, 60000);
    }
    sendNotificationToUser(userId, notification) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit('notification', notification);
            return true;
        }
        return false;
    }
    broadcast(event, data) {
        this.io.emit(event, data);
    }
    getStats() {
        return {
            connectedUsers: this.connectedUsers.size,
            activeRooms: this.userRooms.size,
            typingUsers: Array.from(this.typingUsers.values()).reduce((total, users) => total + users.size, 0),
            uptime: process.uptime(),
            messagingStats: this.messagingService.getStats()
        };
    }
    getIO() {
        return this.io;
    }
}
exports.RealTimeMessagingService = RealTimeMessagingService;
exports.default = RealTimeMessagingService;
//# sourceMappingURL=realTimeMessagingService.js.map
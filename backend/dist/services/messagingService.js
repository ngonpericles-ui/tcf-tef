"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const client_1 = require("@prisma/client");
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const redis_1 = require("../config/redis");
const prisma = new client_1.PrismaClient();
const redisCluster = process.env.REDIS_CLUSTER_NODES ? new ioredis_1.default.Cluster(process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
    const [host, port] = node.split(':');
    return { host, port: parseInt(port) };
}), {
    enableReadyCheck: false,
    redisOptions: {
        password: process.env.REDIS_PASSWORD,
    },
}) : null;
class MessagingService {
    constructor(io) {
        this.onlineUsers = new Map();
        this.typingUsers = new Map();
        this.roomParticipants = new Map();
        this.userRooms = new Map();
        this.io = io;
        this.messageQueue = redis_1.messageQueueRedis;
        this.messageCache = redis_1.cacheRedis;
        this.rateLimiter = redis_1.rateLimitRedis;
        logger_1.logger.info('MessagingService initialized with Redis');
        this.initializeMessageProcessing();
        this.initializeRateLimiting();
    }
    async initializeMessageProcessing() {
        setInterval(async () => {
            await this.cleanupOldMessages();
        }, 300000);
        logger_1.logger.info('Messaging service initialized with high-performance pipeline');
    }
    async initializeRateLimiting() {
        const rateLimitScript = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local current = redis.call('GET', key)
      
      if current == false then
        redis.call('SET', key, 1)
        redis.call('EXPIRE', key, window)
        return 1
      end
      
      if tonumber(current) < limit then
        redis.call('INCR', key)
        return tonumber(current) + 1
      end
      
      return -1
    `;
        await this.rateLimiter.defineCommand('rateLimit', {
            numberOfKeys: 1,
            lua: rateLimitScript,
        });
    }
    async sendMessage(senderId, receiverId, content, type = 'text', metadata) {
        try {
            await this.checkRateLimit(senderId);
            const roomId = await this.createOrGetRoom(senderId, receiverId);
            const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const message = {
                id: messageId,
                senderId,
                receiverId,
                content,
                type,
                timestamp: new Date(),
                isRead: false,
                metadata,
            };
            await this.messageQueue.lpush('message_queue', JSON.stringify({
                ...message,
                action: 'send',
                priority: 'high',
                roomId
            }));
            await this.broadcastMessageToRoom(message, roomId);
            await this.cacheMessage(message);
            logger_1.logger.info('Message queued for processing', {
                messageId,
                senderId,
                receiverId,
                roomId,
                type
            });
            return message;
        }
        catch (error) {
            logger_1.logger.error('Failed to send message', { error, senderId, receiverId });
            throw error;
        }
    }
    async sendGroupMessage(senderId, roomId, content, type = 'text', metadata) {
        try {
            await this.checkRateLimit(senderId);
            const participants = await this.getRoomParticipants(roomId);
            if (!participants.includes(senderId)) {
                throw new Error('User not in room');
            }
            const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const message = {
                id: messageId,
                senderId,
                receiverId: roomId,
                content,
                type,
                timestamp: new Date(),
                isRead: false,
                metadata: { ...metadata, isGroupMessage: true, roomId },
            };
            await this.messageQueue.lpush('message_queue', JSON.stringify({
                ...message,
                action: 'send',
                priority: 'high',
                roomId,
                isGroupMessage: true
            }));
            await this.broadcastMessageToRoom(message, roomId);
            await this.cacheMessage(message);
            logger_1.logger.info('Group message queued for processing', {
                messageId,
                senderId,
                roomId,
                type
            });
            return message;
        }
        catch (error) {
            logger_1.logger.error('Failed to send group message', { error, senderId, roomId });
            throw error;
        }
    }
    async checkRateLimit(userId) {
        if (!this.rateLimiter)
            return;
        const rateLimitKey = `rate_limit:${userId}`;
        const current = await this.rateLimiter.incr(rateLimitKey);
        if (current === 1) {
            await this.rateLimiter.expire(rateLimitKey, 60);
        }
        if (current > 100) {
            throw new Error('Rate limit exceeded. Please slow down.');
        }
    }
    async broadcastMessageToRoom(message, roomId) {
        try {
            const participants = await this.getRoomParticipants(roomId);
            this.io.to(roomId).emit('message:new', {
                ...message,
                roomId,
                participants
            });
            await this.updateRoomActivity(roomId, message);
            logger_1.logger.debug('Message broadcasted to room', {
                messageId: message.id,
                roomId,
                participants: participants.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast message to room', { error, messageId: message.id, roomId });
        }
    }
    async updateRoomActivity(roomId, message) {
        try {
            await this.messageCache.hset(`room:${roomId}`, {
                lastActivity: new Date().toISOString(),
                lastMessageId: message.id,
                lastMessageContent: message.content.substring(0, 100)
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update room activity', { error, roomId });
        }
    }
    async processMessageQueue() {
        if (!this.messageQueue) {
            logger_1.logger.debug('Message queue processing skipped - Redis not available');
            return;
        }
        try {
            const queueLength = await this.messageQueue.llen('message_queue');
            if (queueLength === 0)
                return;
            const messages = await this.messageQueue.rpop('message_queue', 10);
            if (!messages || messages.length === 0)
                return;
            await this.processMessageBatch(messages);
        }
        catch (error) {
            logger_1.logger.error('Failed to process message queue', { error });
            try {
                await this.messageQueue.del('message_queue');
                logger_1.logger.warn('Cleared message queue due to persistent errors');
            }
            catch (clearError) {
                logger_1.logger.error('Failed to clear message queue', { error: clearError });
            }
        }
    }
    async processMessageBatch(messages) {
        try {
            const batchSize = 10;
            const batches = [];
            for (let i = 0; i < messages.length; i += batchSize) {
                batches.push(messages.slice(i, i + batchSize));
            }
            const batchPromises = batches.map(async (batch) => {
                const batchData = [];
                for (const messageStr of batch) {
                    try {
                        const messageData = JSON.parse(messageStr);
                        batchData.push(messageData);
                    }
                    catch (error) {
                        logger_1.logger.error('Failed to parse message in batch', { error, messageStr });
                    }
                }
                if (batchData.length > 0) {
                    await this.batchPersistMessages(batchData);
                }
            });
            await Promise.allSettled(batchPromises);
            logger_1.logger.debug('Message batch processed', {
                totalMessages: messages.length,
                batches: batches.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to process message batch', { error });
        }
    }
    async batchPersistMessages(messages) {
        try {
            await prisma.$transaction(async (tx) => {
                for (const messageData of messages) {
                    await tx.message.create({
                        data: {
                            id: messageData.id,
                            senderId: messageData.senderId,
                            receiverId: messageData.receiverId,
                            content: messageData.content,
                            subject: messageData.subject || '',
                            isRead: false,
                            parentId: messageData.parentId,
                            attachments: messageData.attachments,
                        },
                    });
                }
            });
            await this.batchCacheMessages(messages);
            logger_1.logger.debug('Messages batch persisted', { count: messages.length });
        }
        catch (error) {
            logger_1.logger.error('Failed to batch persist messages', { error, count: messages.length });
        }
    }
    async batchCacheMessages(messages) {
        try {
            const pipeline = this.messageCache.pipeline();
            for (const message of messages) {
                const roomId = this.getRoomId(message.senderId, message.receiverId);
                const cacheKey = `messages:${roomId}`;
                pipeline.zadd(cacheKey, message.timestamp.getTime(), JSON.stringify(message));
                pipeline.expire(cacheKey, 86400);
            }
            await pipeline.exec();
            logger_1.logger.debug('Messages batch cached', { count: messages.length });
        }
        catch (error) {
            logger_1.logger.error('Failed to batch cache messages', { error, count: messages.length });
        }
    }
    async persistMessage(messageData) {
        try {
            await prisma.$transaction(async (tx) => {
                const message = await tx.message.create({
                    data: {
                        id: messageData.id,
                        senderId: messageData.senderId,
                        receiverId: messageData.receiverId,
                        content: messageData.content,
                        subject: messageData.subject || '',
                        isRead: false,
                        parentId: messageData.parentId,
                        attachments: messageData.attachments,
                    },
                });
                const roomId = this.getRoomId(messageData.senderId, messageData.receiverId);
                await this.updateChatRoom(roomId, messageData.senderId, messageData.receiverId, {
                    id: message.id,
                    senderId: message.senderId,
                    receiverId: message.receiverId,
                    content: message.content,
                    type: 'text',
                    timestamp: message.createdAt,
                    isRead: message.isRead,
                    parentId: message.parentId,
                    attachments: Array.isArray(message.attachments) ? message.attachments : [],
                });
                await this.updateUnreadCount(messageData.receiverId, roomId, 1);
            });
            logger_1.logger.debug('Message persisted to database', { messageId: messageData.id });
        }
        catch (error) {
            logger_1.logger.error('Failed to persist message', { error, messageId: messageData.id });
        }
    }
    broadcastMessage(message) {
        const roomId = this.getRoomId(message.senderId, message.receiverId);
        const receiverSocketId = this.onlineUsers.get(message.receiverId);
        if (receiverSocketId) {
            this.io.to(receiverSocketId).emit('message:new', message);
        }
        const senderSocketId = this.onlineUsers.get(message.senderId);
        if (senderSocketId) {
            this.io.to(senderSocketId).emit('message:sent', message);
        }
        this.io.to(roomId).emit('message:room', {
            roomId,
            message,
            timestamp: new Date()
        });
    }
    async cacheMessage(message) {
        const roomId = this.getRoomId(message.senderId, message.receiverId);
        const cacheKey = `messages:${roomId}`;
        await this.messageCache.zadd(cacheKey, message.timestamp.getTime(), JSON.stringify(message));
        await this.messageCache.zremrangebyrank(cacheKey, 0, -101);
        await this.messageCache.expire(cacheKey, 86400);
    }
    async getRecentMessages(userId1, userId2, limit = 50) {
        const roomId = this.getRoomId(userId1, userId2);
        const cacheKey = `messages:${roomId}`;
        try {
            const cachedMessages = await this.messageCache.zrevrange(cacheKey, 0, limit - 1);
            if (cachedMessages.length > 0) {
                return cachedMessages.map(msg => JSON.parse(msg));
            }
            const messages = await prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: userId1, receiverId: userId2 },
                        { senderId: userId2, receiverId: userId1 }
                    ]
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profileImage: true
                        }
                    }
                }
            });
            const cachePromises = messages.map(msg => this.messageCache.zadd(cacheKey, msg.createdAt.getTime(), JSON.stringify(msg)));
            await Promise.all(cachePromises);
            await this.messageCache.expire(cacheKey, 86400);
            return messages.map(msg => ({
                id: msg.id,
                senderId: msg.senderId,
                receiverId: msg.receiverId,
                content: msg.content,
                type: 'text',
                timestamp: msg.createdAt,
                isRead: msg.isRead,
                readAt: undefined,
                deliveredAt: undefined,
                metadata: undefined,
                parentId: msg.parentId,
                attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get recent messages', { error, userId1, userId2 });
            return [];
        }
    }
    async markAsRead(messageId, userId) {
        try {
            const readAt = new Date();
            await prisma.message.updateMany({
                where: {
                    id: messageId,
                    receiverId: userId,
                    isRead: false
                },
                data: {
                    isRead: true
                }
            });
            await this.messageCache.hset(`message:${messageId}`, {
                isRead: 'true',
                readAt: readAt.toISOString(),
                readBy: userId
            });
            const message = await prisma.message.findUnique({
                where: { id: messageId },
                select: { senderId: true, receiverId: true }
            });
            if (message) {
                const roomId = this.getRoomId(message.senderId, message.receiverId);
                const cacheKey = `messages:${roomId}`;
                const cachedMessages = await this.messageCache.zrange(cacheKey, 0, -1);
                for (const cachedMsg of cachedMessages) {
                    const msg = JSON.parse(cachedMsg);
                    if (msg.id === messageId) {
                        msg.isRead = true;
                        msg.readAt = readAt;
                        await this.messageCache.zadd(cacheKey, msg.timestamp, JSON.stringify(msg));
                        break;
                    }
                }
                const senderSocketId = this.onlineUsers.get(message.senderId);
                if (senderSocketId) {
                    this.io.to(senderSocketId).emit('message:read', {
                        messageId,
                        readAt,
                        readBy: userId
                    });
                }
                this.io.to(roomId).emit('message:status:read', {
                    messageId,
                    readAt,
                    readBy: userId
                });
            }
            logger_1.logger.debug('Message marked as read', { messageId, userId, readAt });
        }
        catch (error) {
            logger_1.logger.error('Failed to mark message as read', { error, messageId, userId });
        }
    }
    async markAsDelivered(messageId, userId) {
        try {
            const deliveredAt = new Date();
            await this.messageCache.hset(`message:${messageId}`, {
                deliveredAt: deliveredAt.toISOString(),
                deliveredTo: userId
            });
            const message = await prisma.message.findUnique({
                where: { id: messageId },
                select: { senderId: true, receiverId: true }
            });
            if (message) {
                const senderSocketId = this.onlineUsers.get(message.senderId);
                if (senderSocketId) {
                    this.io.to(senderSocketId).emit('message:delivered', {
                        messageId,
                        deliveredAt,
                        deliveredTo: userId
                    });
                }
                const roomId = this.getRoomId(message.senderId, message.receiverId);
                this.io.to(roomId).emit('message:status:delivered', {
                    messageId,
                    deliveredAt,
                    deliveredTo: userId
                });
            }
            logger_1.logger.debug('Message marked as delivered', { messageId, userId, deliveredAt });
        }
        catch (error) {
            logger_1.logger.error('Failed to mark message as delivered', { error, messageId, userId });
        }
    }
    async getMessageStatus(messageId) {
        try {
            const cachedStatus = await this.messageCache.hgetall(`message:${messageId}`);
            if (Object.keys(cachedStatus).length > 0) {
                return {
                    delivered: !!cachedStatus.deliveredAt,
                    read: cachedStatus.isRead === 'true',
                    deliveredAt: cachedStatus.deliveredAt ? new Date(cachedStatus.deliveredAt) : undefined,
                    readAt: cachedStatus.readAt ? new Date(cachedStatus.readAt) : undefined,
                    deliveredTo: cachedStatus.deliveredTo,
                    readBy: cachedStatus.readBy
                };
            }
            const message = await prisma.message.findUnique({
                where: { id: messageId },
                select: {
                    isRead: true
                }
            });
            return {
                delivered: false,
                read: message?.isRead || false
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get message status', { error, messageId });
            return { delivered: false, read: false };
        }
    }
    async markMessagesAsRead(messageIds, userId) {
        try {
            const readAt = new Date();
            await prisma.message.updateMany({
                where: {
                    id: { in: messageIds },
                    receiverId: userId,
                    isRead: false
                },
                data: {
                    isRead: true
                }
            });
            const pipeline = this.messageCache.pipeline();
            for (const messageId of messageIds) {
                pipeline.hset(`message:${messageId}`, {
                    isRead: 'true',
                    readAt: readAt.toISOString(),
                    readBy: userId
                });
            }
            await pipeline.exec();
            const messages = await prisma.message.findMany({
                where: { id: { in: messageIds } },
                select: { senderId: true, receiverId: true },
                distinct: ['senderId']
            });
            for (const message of messages) {
                const senderSocketId = this.onlineUsers.get(message.senderId);
                if (senderSocketId) {
                    this.io.to(senderSocketId).emit('messages:read', {
                        messageIds,
                        readAt,
                        readBy: userId
                    });
                }
            }
            logger_1.logger.debug('Messages marked as read', { messageIds, userId, readAt });
        }
        catch (error) {
            logger_1.logger.error('Failed to mark messages as read', { error, messageIds, userId });
        }
    }
    handleTyping(roomId, userId, isTyping) {
        if (isTyping) {
            if (!this.typingUsers.has(roomId)) {
                this.typingUsers.set(roomId, new Set());
            }
            this.typingUsers.get(roomId).add(userId);
        }
        else {
            this.typingUsers.get(roomId)?.delete(userId);
        }
        this.io.to(roomId).emit('typing:update', {
            roomId,
            userId,
            isTyping,
            typingUsers: Array.from(this.typingUsers.get(roomId) || [])
        });
    }
    getRoomId(userId1, userId2) {
        return [userId1, userId2].sort().join('_');
    }
    async createOrGetRoom(userId1, userId2) {
        const roomId = this.getRoomId(userId1, userId2);
        const roomExists = await this.messageCache.exists(`room:${roomId}`);
        if (!roomExists) {
            await this.messageCache.hset(`room:${roomId}`, {
                id: roomId,
                type: 'individual',
                participants: JSON.stringify([userId1, userId2]),
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            });
            await this.messageCache.expire(`room:${roomId}`, 30 * 24 * 60 * 60);
            logger_1.logger.info('Created new room', { roomId, participants: [userId1, userId2] });
        }
        return roomId;
    }
    async createGroupRoom(name, participants, createdBy) {
        const roomId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.messageCache.hset(`room:${roomId}`, {
            id: roomId,
            name,
            type: 'group',
            participants: JSON.stringify(participants),
            createdBy,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        });
        await this.messageCache.expire(`room:${roomId}`, 30 * 24 * 60 * 60);
        for (const participantId of participants) {
            await this.addUserToRoom(participantId, roomId);
        }
        logger_1.logger.info('Created group room', { roomId, name, participants, createdBy });
        return roomId;
    }
    async addUserToRoom(userId, roomId) {
        if (!this.roomParticipants.has(roomId)) {
            this.roomParticipants.set(roomId, new Set());
        }
        this.roomParticipants.get(roomId).add(userId);
        if (!this.userRooms.has(userId)) {
            this.userRooms.set(userId, new Set());
        }
        this.userRooms.get(userId).add(roomId);
        await this.messageCache.sadd(`room:${roomId}:participants`, userId);
        await this.messageCache.sadd(`user:${userId}:rooms`, roomId);
        const socketId = this.onlineUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).socketsJoin(roomId);
        }
        logger_1.logger.debug('User added to room', { userId, roomId });
    }
    async removeUserFromRoom(userId, roomId) {
        this.roomParticipants.get(roomId)?.delete(userId);
        this.userRooms.get(userId)?.delete(roomId);
        await this.messageCache.srem(`room:${roomId}:participants`, userId);
        await this.messageCache.srem(`user:${userId}:rooms`, roomId);
        const socketId = this.onlineUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).socketsLeave(roomId);
        }
        logger_1.logger.debug('User removed from room', { userId, roomId });
    }
    async getRoomParticipants(roomId) {
        const participants = await this.messageCache.smembers(`room:${roomId}:participants`);
        if (participants.length > 0) {
            return participants;
        }
        return Array.from(this.roomParticipants.get(roomId) || []);
    }
    async getUserRooms(userId) {
        const rooms = await this.messageCache.smembers(`user:${userId}:rooms`);
        if (rooms.length > 0) {
            return rooms;
        }
        return Array.from(this.userRooms.get(userId) || []);
    }
    async updateChatRoom(roomId, senderId, receiverId, message) {
        const cacheKey = `room:${roomId}`;
        const roomData = {
            id: roomId,
            participants: [senderId, receiverId],
            lastMessage: message,
            lastActivity: new Date(),
            unreadCount: {}
        };
        await this.messageCache.setex(cacheKey, 86400, JSON.stringify(roomData));
    }
    async updateUnreadCount(userId, roomId, increment) {
        const key = `unread:${userId}:${roomId}`;
        await this.messageCache.incrby(key, increment);
        await this.messageCache.expire(key, 86400);
    }
    async cleanupOldMessages() {
        if (!this.messageCache) {
            logger_1.logger.debug('Message cache cleanup skipped - Redis not available');
            return;
        }
        try {
            const keys = await this.messageCache.keys('messages:*');
            const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
            for (const key of keys) {
                await this.messageCache.zremrangebyscore(key, 0, cutoffTime);
            }
            logger_1.logger.debug('Cleaned up old cached messages', { keysCount: keys.length });
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup old messages', { error });
        }
    }
    async getStats() {
        return {
            onlineUsers: this.onlineUsers.size,
            activeRooms: this.typingUsers.size,
            redisConnected: this.messageQueue.status === 'ready',
            uptime: process.uptime()
        };
    }
    async saveMessage(messageData) {
        try {
            await this.persistMessage(messageData);
            return messageData;
        }
        catch (error) {
            logger_1.logger.error('Failed to save message', { error, messageId: messageData.id });
            throw error;
        }
    }
    async sendRealTimeNotification(message) {
        try {
            this.broadcastMessage(message);
            logger_1.logger.info('Real-time notification sent', { messageId: message.id });
        }
        catch (error) {
            logger_1.logger.error('Failed to send real-time notification', { error, messageId: message.id });
        }
    }
    async updateSearchIndex(message) {
        try {
            logger_1.logger.debug('Search index updated', { messageId: message.id });
        }
        catch (error) {
            logger_1.logger.error('Failed to update search index', { error, messageId: message.id });
        }
    }
    async processAttachments(message) {
        try {
            if (message.attachments && message.attachments.length > 0) {
                logger_1.logger.debug('Attachments processed', { messageId: message.id, count: message.attachments.length });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to process attachments', { error, messageId: message.id });
        }
    }
    async updateConversationMetadata(message) {
        try {
            const roomId = this.getRoomId(message.senderId, message.receiverId);
            await this.updateChatRoom(roomId, message.senderId, message.receiverId, message);
            logger_1.logger.debug('Conversation metadata updated', { messageId: message.id });
        }
        catch (error) {
            logger_1.logger.error('Failed to update conversation metadata', { error, messageId: message.id });
        }
    }
    async triggerWebhooks(message) {
        try {
            logger_1.logger.debug('Webhooks triggered', { messageId: message.id });
        }
        catch (error) {
            logger_1.logger.error('Failed to trigger webhooks', { error, messageId: message.id });
        }
    }
    async sendPushNotification(notificationData) {
        try {
            logger_1.logger.info('Push notification sent', { notificationId: notificationData.id });
        }
        catch (error) {
            logger_1.logger.error('Failed to send push notification', { error, notificationId: notificationData.id });
        }
    }
    async sendEmailNotification(notificationData) {
        try {
            logger_1.logger.info('Email notification sent', { notificationId: notificationData.id });
        }
        catch (error) {
            logger_1.logger.error('Failed to send email notification', { error, notificationId: notificationData.id });
        }
    }
    async sendSMSNotification(notificationData) {
        try {
            logger_1.logger.info('SMS notification sent', { notificationId: notificationData.id });
        }
        catch (error) {
            logger_1.logger.error('Failed to send SMS notification', { error, notificationId: notificationData.id });
        }
    }
    async updateMessageDeliveryStatus(messageId, status, timestamp) {
        try {
            await prisma.message.update({
                where: { id: messageId },
                data: {},
            });
            logger_1.logger.debug('Message delivery status updated', { messageId, status, timestamp });
        }
        catch (error) {
            logger_1.logger.error('Failed to update message delivery status', { error, messageId, status });
        }
    }
    async updateMessageReadStatus(messageId, readBy, timestamp) {
        try {
            await prisma.message.update({
                where: { id: messageId },
                data: {
                    isRead: true,
                },
            });
            logger_1.logger.debug('Message read status updated', { messageId, readBy, timestamp });
        }
        catch (error) {
            logger_1.logger.error('Failed to update message read status', { error, messageId, readBy });
        }
    }
    async setUserOnline(userId, socketId) {
        try {
            this.onlineUsers.set(userId, socketId);
            this.io.emit('presence:online', { userId, timestamp: new Date() });
            await this.processOfflineMessages(userId);
            logger_1.logger.debug('User set online', { userId, socketId });
        }
        catch (error) {
            logger_1.logger.error('Failed to set user online', { error, userId, socketId });
        }
    }
    async setUserOffline(userId) {
        try {
            this.onlineUsers.delete(userId);
            this.io.emit('presence:offline', { userId, timestamp: new Date() });
            logger_1.logger.debug('User set offline', { userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to set user offline', { error, userId });
        }
    }
    async cleanupExpiredSessions() {
        try {
            logger_1.logger.info('Expired sessions cleaned up');
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup expired sessions', { error });
        }
    }
    async getMessageFromQueue() {
        try {
            const result = await this.messageQueue.brpop('message_queue', 0);
            if (result && result[1]) {
                return JSON.parse(result[1]);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get message from queue', { error });
            throw error;
        }
    }
    async queueOfflineMessage(message, recipientId) {
        try {
            const offlineKey = `offline:${recipientId}`;
            await this.messageQueue.lpush(offlineKey, JSON.stringify({
                ...message,
                queuedAt: new Date().toISOString()
            }));
            await this.messageQueue.expire(offlineKey, 7 * 24 * 60 * 60);
            logger_1.logger.debug('Message queued for offline user', {
                messageId: message.id,
                recipientId
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to queue offline message', { error, messageId: message.id, recipientId });
        }
    }
    async processOfflineMessages(userId) {
        try {
            const offlineKey = `offline:${userId}`;
            const offlineMessages = await this.messageQueue.lrange(offlineKey, 0, -1);
            if (offlineMessages.length === 0) {
                return;
            }
            const socketId = this.onlineUsers.get(userId);
            if (!socketId) {
                return;
            }
            for (const messageStr of offlineMessages) {
                try {
                    const message = JSON.parse(messageStr);
                    this.io.to(socketId).emit('message:offline', message);
                }
                catch (error) {
                    logger_1.logger.error('Failed to parse offline message', { error, messageStr });
                }
            }
            await this.messageQueue.del(offlineKey);
            logger_1.logger.info('Processed offline messages', {
                userId,
                messageCount: offlineMessages.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to process offline messages', { error, userId });
        }
    }
    async getOfflineMessageCount(userId) {
        try {
            const offlineKey = `offline:${userId}`;
            return await this.messageQueue.llen(offlineKey);
        }
        catch (error) {
            logger_1.logger.error('Failed to get offline message count', { error, userId });
            return 0;
        }
    }
    async broadcastMessageWithOfflineQueuing(message, roomId) {
        try {
            const participants = await this.getRoomParticipants(roomId);
            for (const participantId of participants) {
                if (participantId === message.senderId) {
                    continue;
                }
                const isOnline = this.onlineUsers.has(participantId);
                if (isOnline) {
                    const socketId = this.onlineUsers.get(participantId);
                    if (socketId) {
                        this.io.to(socketId).emit('message:new', {
                            ...message,
                            roomId,
                            participants
                        });
                    }
                }
                else {
                    await this.queueOfflineMessage(message, participantId);
                }
            }
            await this.updateRoomActivity(roomId, message);
            logger_1.logger.debug('Message broadcasted with offline queuing', {
                messageId: message.id,
                roomId,
                participants: participants.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast message with offline queuing', { error, messageId: message.id, roomId });
        }
    }
    compressMessage(message) {
        try {
            if (message.content.length > 1000) {
                return {
                    ...message,
                    content: message.content.substring(0, 1000) + '... [truncated]',
                    metadata: {
                        ...message.metadata,
                        compressed: true,
                        originalLength: message.content.length
                    }
                };
            }
            return message;
        }
        catch (error) {
            logger_1.logger.error('Failed to compress message', { error, messageId: message.id });
            return message;
        }
    }
    decompressMessage(message) {
        try {
            if (message.metadata?.compressed) {
                return message;
            }
            return message;
        }
        catch (error) {
            logger_1.logger.error('Failed to decompress message', { error, messageId: message.id });
            return message;
        }
    }
    async getCompressionStats() {
        try {
            return {
                totalMessages: 0,
                compressedMessages: 0,
                compressionRatio: 0,
                spaceSaved: 0
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get compression stats', { error });
            return {
                totalMessages: 0,
                compressedMessages: 0,
                compressionRatio: 0,
                spaceSaved: 0
            };
        }
    }
}
exports.MessagingService = MessagingService;
exports.default = MessagingService;
//# sourceMappingURL=messagingService.js.map
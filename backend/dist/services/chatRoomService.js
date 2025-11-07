"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRoomService = void 0;
const socket_io_1 = require("socket.io");
const logger_1 = require("@/utils/logger");
const aiChatService_1 = require("./aiChatService");
class ChatRoomService {
    constructor() {
        this.io = null;
        this.chatRooms = new Map();
        this.connectedUsers = new Map();
        this.userSockets = new Map();
    }
    initialize(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.CORS_ORIGIN || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            }
        });
        this.createRoom('general', 'General Chat', 'Main chat room for all users', 'system', true);
        this.io.on('connection', (socket) => {
            logger_1.logger.info('User connected to chat', { socketId: socket.id });
            socket.on('authenticate', (userData) => {
                this.handleUserAuthentication(socket, userData);
            });
            socket.on('join-room', (roomId) => {
                this.handleJoinRoom(socket, roomId);
            });
            socket.on('leave-room', (roomId) => {
                this.handleLeaveRoom(socket, roomId);
            });
            socket.on('send-message', async (data) => {
                await this.handleSendMessage(socket, data);
            });
            socket.on('create-room', (data) => {
                this.handleCreateRoom(socket, data);
            });
            socket.on('aura-chat', async (data) => {
                await this.handleAuraChat(socket, data);
            });
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
        logger_1.logger.info('Socket.IO chat service initialized');
    }
    handleUserAuthentication(socket, userData) {
        const user = {
            id: userData.userId,
            username: userData.username,
            role: userData.role,
            socketId: socket.id
        };
        this.connectedUsers.set(socket.id, user);
        this.userSockets.set(userData.userId, socket.id);
        socket.userId = userData.userId;
        socket.username = userData.username;
        socket.userRole = userData.role;
        socket.join('general');
        const generalRoom = this.chatRooms.get('general');
        if (generalRoom) {
            generalRoom.participants.add(userData.userId);
        }
        socket.emit('rooms-list', this.getAvailableRooms(userData.role));
        socket.emit('room-history', {
            roomId: 'general',
            messages: generalRoom?.messages.slice(-50) || []
        });
        logger_1.logger.info('User authenticated in chat', { userId: userData.userId, username: userData.username });
    }
    handleJoinRoom(socket, roomId) {
        if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }
        const room = this.chatRooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        socket.join(roomId);
        room.participants.add(socket.userId);
        socket.emit('room-history', {
            roomId,
            messages: room.messages.slice(-50)
        });
        socket.to(roomId).emit('user-joined', {
            userId: socket.userId,
            username: socket.username,
            roomId
        });
        logger_1.logger.info('User joined room', { userId: socket.userId, roomId });
    }
    handleLeaveRoom(socket, roomId) {
        if (!socket.userId)
            return;
        const room = this.chatRooms.get(roomId);
        if (room) {
            room.participants.delete(socket.userId);
        }
        socket.leave(roomId);
        socket.to(roomId).emit('user-left', {
            userId: socket.userId,
            username: socket.username,
            roomId
        });
        logger_1.logger.info('User left room', { userId: socket.userId, roomId });
    }
    async handleSendMessage(socket, data) {
        if (!socket.userId || !data.message.trim()) {
            socket.emit('error', { message: 'Invalid message' });
            return;
        }
        const room = this.chatRooms.get(data.roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            roomId: data.roomId,
            userId: socket.userId,
            username: socket.username,
            userRole: socket.userRole,
            message: data.message.trim(),
            timestamp: new Date()
        };
        room.messages.push(message);
        if (room.messages.length > 1000) {
            room.messages = room.messages.slice(-1000);
        }
        this.io?.to(data.roomId).emit('new-message', message);
        logger_1.logger.info('Message sent', { userId: socket.userId, roomId: data.roomId, messageLength: data.message.length });
    }
    handleCreateRoom(socket, data) {
        if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }
        if (!['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(socket.userRole)) {
            socket.emit('error', { message: 'Insufficient permissions' });
            return;
        }
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        this.createRoom(roomId, data.name, data.description, socket.userId, data.isPublic);
        if (data.isPublic) {
            this.io?.emit('room-created', {
                id: roomId,
                name: data.name,
                description: data.description,
                isPublic: data.isPublic,
                createdBy: socket.username
            });
        }
        socket.emit('room-created-success', { roomId, name: data.name });
        logger_1.logger.info('Room created', { roomId, name: data.name, createdBy: socket.userId });
    }
    async handleAuraChat(socket, data) {
        if (!socket.userId || !data.message.trim()) {
            socket.emit('error', { message: 'Invalid message' });
            return;
        }
        try {
            const auraResponse = await aiChatService_1.AiChatService.sendMessage(socket.userId, data.message, null, {
                userLevel: 'B1',
                language: 'fr',
                previousMessages: []
            });
            socket.emit('aura-response', {
                message: auraResponse.message,
                sources: auraResponse.sources,
                confidence: auraResponse.confidence,
                timestamp: new Date()
            });
            logger_1.logger.info('Aura.CA response sent', { userId: socket.userId, messageLength: data.message.length });
        }
        catch (error) {
            logger_1.logger.error('Aura.CA chat error', { error, userId: socket.userId });
            socket.emit('error', { message: 'Aura.CA is temporarily unavailable' });
        }
    }
    handleDisconnect(socket) {
        if (socket.userId) {
            this.chatRooms.forEach((room) => {
                room.participants.delete(socket.userId);
            });
            this.userSockets.delete(socket.userId);
        }
        this.connectedUsers.delete(socket.id);
        logger_1.logger.info('User disconnected from chat', { socketId: socket.id, userId: socket.userId });
    }
    createRoom(id, name, description = '', createdBy, isPublic = true) {
        const room = {
            id,
            name,
            description,
            createdBy,
            createdAt: new Date(),
            isPublic,
            participants: new Set(),
            messages: []
        };
        this.chatRooms.set(id, room);
        return room;
    }
    getAvailableRooms(userRole) {
        const rooms = Array.from(this.chatRooms.values()).map(room => ({
            id: room.id,
            name: room.name,
            description: room.description,
            isPublic: room.isPublic,
            participantCount: room.participants.size,
            createdAt: room.createdAt
        }));
        return rooms.filter(room => room.isPublic || ['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(userRole));
    }
    getRooms() {
        return Array.from(this.chatRooms.values());
    }
    getConnectedUsers() {
        return Array.from(this.connectedUsers.values());
    }
}
exports.chatRoomService = new ChatRoomService();
//# sourceMappingURL=chatRoomService.js.map
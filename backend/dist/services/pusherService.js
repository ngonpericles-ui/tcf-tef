"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pusherService = exports.pusher = void 0;
const pusher_1 = __importDefault(require("pusher"));
const logger_1 = require("../utils/logger");
const pusher = new pusher_1.default({
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.PUSHER_CLUSTER || '',
    useTLS: true
});
exports.pusher = pusher;
setTimeout(() => {
    pusher.trigger('test-channel', 'test-event', {
        message: 'Pusher connection test'
    }).then(() => {
        logger_1.logger.info('✅ Pusher connection successful');
    }).catch((error) => {
        logger_1.logger.error('❌ Pusher connection failed (non-critical):', error?.message || error);
    });
}, 2000);
exports.pusherService = {
    sendMessage: async (receiverId, message) => {
        try {
            await pusher.trigger(`private-${receiverId}`, 'new-message', {
                message,
                timestamp: new Date().toISOString()
            });
            logger_1.logger.info(`Message sent to user ${receiverId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to send message via Pusher:', error);
            throw error;
        }
    },
    sendTypingIndicator: async (receiverId, senderId, isTyping) => {
        try {
            await pusher.trigger(`private-${receiverId}`, 'typing', {
                senderId,
                isTyping,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send typing indicator:', error);
        }
    },
    sendMessageStatus: async (receiverId, messageId, status) => {
        try {
            await pusher.trigger(`private-${receiverId}`, 'message-status', {
                messageId,
                status,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send message status:', error);
        }
    },
    sendPresenceUpdate: async (userId, isOnline) => {
        try {
            console.log(`🟢 Sending presence update: ${userId} is ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
            await pusher.trigger('presence-presence-channel', 'presence-update', {
                userId,
                isOnline,
                timestamp: new Date().toISOString()
            });
            console.log(`✅ Presence update sent successfully for ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to send presence update (non-critical):', error?.message || error);
            console.warn('⚠️ Pusher unavailable for presence update - continuing without it');
        }
    },
    sendVideoCallNotification: async (receiverId, notificationData) => {
        try {
            console.log(`📞 Sending video call notification to: ${receiverId}`);
            await pusher.trigger(`private-${receiverId}`, 'video-call-incoming', notificationData);
            console.log(`✅ Video call notification sent successfully to ${receiverId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to send video call notification:', error);
            throw error;
        }
    }
};
//# sourceMappingURL=pusherService.js.map
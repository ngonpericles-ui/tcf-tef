import { Server as SocketIOServer } from 'socket.io';
export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'audio' | 'video';
    timestamp: Date;
    isRead: boolean;
    readAt?: Date;
    deliveredAt?: Date;
    metadata?: any;
    parentId?: string;
    attachments?: any[];
}
export interface ChatRoom {
    id: string;
    type: 'direct' | 'group';
    participants: string[];
    lastMessage?: Message;
    lastActivity: Date;
    unreadCount: {
        [userId: string]: number;
    };
}
export declare class MessagingService {
    private io;
    private messageQueue;
    private onlineUsers;
    private typingUsers;
    private roomParticipants;
    private userRooms;
    private messageCache;
    private rateLimiter;
    constructor(io: SocketIOServer);
    private initializeMessageProcessing;
    private initializeRateLimiting;
    sendMessage(senderId: string, receiverId: string, content: string, type?: 'text' | 'image' | 'file' | 'audio' | 'video', metadata?: any): Promise<Message>;
    sendGroupMessage(senderId: string, roomId: string, content: string, type?: 'text' | 'image' | 'file' | 'audio' | 'video', metadata?: any): Promise<Message>;
    private checkRateLimit;
    private broadcastMessageToRoom;
    private updateRoomActivity;
    private processMessageQueue;
    private processMessageBatch;
    private batchPersistMessages;
    private batchCacheMessages;
    private persistMessage;
    private broadcastMessage;
    private cacheMessage;
    getRecentMessages(userId1: string, userId2: string, limit?: number): Promise<Message[]>;
    markAsRead(messageId: string, userId: string): Promise<void>;
    markAsDelivered(messageId: string, userId: string): Promise<void>;
    getMessageStatus(messageId: string): Promise<{
        delivered: boolean;
        read: boolean;
        deliveredAt?: Date;
        readAt?: Date;
        deliveredTo?: string;
        readBy?: string;
    }>;
    markMessagesAsRead(messageIds: string[], userId: string): Promise<void>;
    handleTyping(roomId: string, userId: string, isTyping: boolean): void;
    private getRoomId;
    createOrGetRoom(userId1: string, userId2: string): Promise<string>;
    createGroupRoom(name: string, participants: string[], createdBy: string): Promise<string>;
    addUserToRoom(userId: string, roomId: string): Promise<void>;
    removeUserFromRoom(userId: string, roomId: string): Promise<void>;
    getRoomParticipants(roomId: string): Promise<string[]>;
    getUserRooms(userId: string): Promise<string[]>;
    private updateChatRoom;
    private updateUnreadCount;
    cleanupOldMessages(): Promise<void>;
    getStats(): Promise<{
        onlineUsers: number;
        activeRooms: number;
        redisConnected: boolean;
        uptime: number;
    }>;
    saveMessage(messageData: any): Promise<any>;
    sendRealTimeNotification(message: any): Promise<void>;
    updateSearchIndex(message: any): Promise<void>;
    processAttachments(message: any): Promise<void>;
    updateConversationMetadata(message: any): Promise<void>;
    triggerWebhooks(message: any): Promise<void>;
    sendPushNotification(notificationData: any): Promise<void>;
    sendEmailNotification(notificationData: any): Promise<void>;
    sendSMSNotification(notificationData: any): Promise<void>;
    updateMessageDeliveryStatus(messageId: string, status: string, timestamp: Date): Promise<void>;
    updateMessageReadStatus(messageId: string, readBy: string, timestamp: Date): Promise<void>;
    setUserOnline(userId: string, socketId: string): Promise<void>;
    setUserOffline(userId: string): Promise<void>;
    cleanupExpiredSessions(): Promise<void>;
    getMessageFromQueue(): Promise<any | null>;
    queueOfflineMessage(message: Message, recipientId: string): Promise<void>;
    processOfflineMessages(userId: string): Promise<void>;
    getOfflineMessageCount(userId: string): Promise<number>;
    private broadcastMessageWithOfflineQueuing;
    private compressMessage;
    private decompressMessage;
    getCompressionStats(): Promise<{
        totalMessages: number;
        compressedMessages: number;
        compressionRatio: number;
        spaceSaved: number;
    }>;
}
export default MessagingService;
//# sourceMappingURL=messagingService.d.ts.map
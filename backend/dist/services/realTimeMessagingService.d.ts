import { Server as SocketIOServer } from 'socket.io';
declare module 'socket.io' {
    interface Socket {
        userId?: string;
        userRole?: string;
        userName?: string;
    }
}
export declare class RealTimeMessagingService {
    private io;
    private messagingService;
    private connectedUsers;
    private userRooms;
    private typingUsers;
    private messageQueue;
    constructor(server: any);
    private initializeSocketHandlers;
    private handleConnection;
    private handleMessagingEvents;
    private handlePresenceEvents;
    private handleTypingEvents;
    private stopTyping;
    private handleRoomEvents;
    private handleDisconnection;
    private initializeCleanupTasks;
    sendNotificationToUser(userId: string, notification: any): boolean;
    broadcast(event: string, data: any): void;
    getStats(): {
        connectedUsers: number;
        activeRooms: number;
        typingUsers: number;
        uptime: number;
        messagingStats: Promise<{
            onlineUsers: number;
            activeRooms: number;
            redisConnected: boolean;
            uptime: number;
        }>;
    };
    getIO(): SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
}
export default RealTimeMessagingService;
//# sourceMappingURL=realTimeMessagingService.d.ts.map
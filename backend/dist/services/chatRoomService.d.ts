import { Server as HTTPServer } from 'http';
interface ChatRoom {
    id: string;
    name: string;
    description?: string;
    createdBy: string;
    createdAt: Date;
    isPublic: boolean;
    participants: Set<string>;
    messages: ChatMessage[];
}
interface ChatMessage {
    id: string;
    roomId: string;
    userId: string;
    username: string;
    userRole: string;
    message: string;
    timestamp: Date;
    isAura?: boolean;
}
interface ConnectedUser {
    id: string;
    username: string;
    role: string;
    socketId: string;
}
declare class ChatRoomService {
    private io;
    private chatRooms;
    private connectedUsers;
    private userSockets;
    initialize(server: HTTPServer): void;
    private handleUserAuthentication;
    private handleJoinRoom;
    private handleLeaveRoom;
    private handleSendMessage;
    private handleCreateRoom;
    private handleAuraChat;
    private handleDisconnect;
    private createRoom;
    private getAvailableRooms;
    getRooms(): ChatRoom[];
    getConnectedUsers(): ConnectedUser[];
}
export declare const chatRoomService: ChatRoomService;
export { ChatRoom, ChatMessage, ConnectedUser };
//# sourceMappingURL=chatRoomService.d.ts.map
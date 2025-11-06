import Pusher from 'pusher';
declare const pusher: Pusher;
export { pusher };
export declare const pusherService: {
    sendMessage: (receiverId: string, message: any) => Promise<void>;
    sendTypingIndicator: (receiverId: string, senderId: string, isTyping: boolean) => Promise<void>;
    sendMessageStatus: (receiverId: string, messageId: string, status: "delivered" | "read") => Promise<void>;
    sendPresenceUpdate: (userId: string, isOnline: boolean) => Promise<void>;
    sendVideoCallNotification: (receiverId: string, notificationData: any) => Promise<void>;
};
//# sourceMappingURL=pusherService.d.ts.map
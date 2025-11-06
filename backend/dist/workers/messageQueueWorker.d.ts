export declare class MessageQueueWorker {
    private messagingService;
    private redis;
    private isRunning;
    private workerId;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    private processMessages;
    private handleMessage;
    private processMessageFeatures;
    private processNotifications;
    private handleNotification;
    private processDeliveryConfirmations;
    private handleDeliveryConfirmation;
    private processReadReceipts;
    private handleReadReceipt;
    private addToDeadLetterQueue;
    private startCleanupTasks;
    private logWorkerStats;
    private sleep;
}
export default MessageQueueWorker;
//# sourceMappingURL=messageQueueWorker.d.ts.map
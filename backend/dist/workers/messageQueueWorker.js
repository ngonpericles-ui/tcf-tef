"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueueWorker = void 0;
const messagingService_1 = require("../services/messagingService");
const logger_1 = require("../utils/logger");
const ioredis_1 = __importDefault(require("ioredis"));
class MessageQueueWorker {
    constructor() {
        this.isRunning = false;
        this.workerId = `worker-${process.pid}-${Date.now()}`;
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
        });
        this.messagingService = new messagingService_1.MessagingService(null);
        logger_1.logger.info('Message queue worker initialized', { workerId: this.workerId });
    }
    async start() {
        if (this.isRunning) {
            logger_1.logger.warn('Worker is already running', { workerId: this.workerId });
            return;
        }
        this.isRunning = true;
        logger_1.logger.info('Starting message queue worker', { workerId: this.workerId });
        this.processMessages();
        this.processNotifications();
        this.processDeliveryConfirmations();
        this.processReadReceipts();
        this.startCleanupTasks();
    }
    async stop() {
        this.isRunning = false;
        logger_1.logger.info('Stopping message queue worker', { workerId: this.workerId });
        await this.redis.quit();
    }
    async processMessages() {
        while (this.isRunning) {
            try {
                const message = await this.messagingService.getMessageFromQueue();
                if (message) {
                    await this.handleMessage(message);
                }
            }
            catch (error) {
                logger_1.logger.error('Error processing message', {
                    error: error.message,
                    workerId: this.workerId
                });
                await this.sleep(1000);
            }
        }
    }
    async handleMessage(messageData) {
        const startTime = Date.now();
        try {
            logger_1.logger.debug('Processing message', {
                messageId: messageData.id,
                workerId: this.workerId
            });
            const savedMessage = await this.messagingService.saveMessage(messageData);
            await this.messagingService.sendRealTimeNotification(savedMessage);
            await this.processMessageFeatures(savedMessage);
            const processingTime = Date.now() - startTime;
            logger_1.logger.info('Message processed successfully', {
                messageId: savedMessage.id,
                processingTime,
                workerId: this.workerId
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to process message', {
                error: error.message,
                messageId: messageData.id,
                workerId: this.workerId
            });
            await this.addToDeadLetterQueue(messageData, error);
        }
    }
    async processMessageFeatures(message) {
        try {
            await this.messagingService.updateSearchIndex(message);
            if (message.attachments && message.attachments.length > 0) {
                await this.messagingService.processAttachments(message);
            }
            await this.messagingService.updateConversationMetadata(message);
            await this.messagingService.triggerWebhooks(message);
        }
        catch (error) {
            logger_1.logger.error('Error processing message features', {
                error: error.message,
                messageId: message.id,
                workerId: this.workerId
            });
        }
    }
    async processNotifications() {
        while (this.isRunning) {
            try {
                const notification = await this.redis.brpop('notification_queue', 1);
                if (notification && notification[1]) {
                    const notificationData = JSON.parse(notification[1]);
                    await this.handleNotification(notificationData);
                }
            }
            catch (error) {
                logger_1.logger.error('Error processing notification', {
                    error: error.message,
                    workerId: this.workerId
                });
                await this.sleep(1000);
            }
        }
    }
    async handleNotification(notificationData) {
        try {
            await this.messagingService.sendPushNotification(notificationData);
            if (notificationData.emailNotification) {
                await this.messagingService.sendEmailNotification(notificationData);
            }
            if (notificationData.smsNotification) {
                await this.messagingService.sendSMSNotification(notificationData);
            }
            logger_1.logger.info('Notification processed', {
                notificationId: notificationData.id,
                workerId: this.workerId
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to process notification', {
                error: error.message,
                notificationId: notificationData.id,
                workerId: this.workerId
            });
        }
    }
    async processDeliveryConfirmations() {
        while (this.isRunning) {
            try {
                const confirmation = await this.redis.brpop('delivery_confirmation_queue', 1);
                if (confirmation && confirmation[1]) {
                    const confirmationData = JSON.parse(confirmation[1]);
                    await this.handleDeliveryConfirmation(confirmationData);
                }
            }
            catch (error) {
                logger_1.logger.error('Error processing delivery confirmation', {
                    error: error.message,
                    workerId: this.workerId
                });
                await this.sleep(1000);
            }
        }
    }
    async handleDeliveryConfirmation(confirmationData) {
        try {
            await this.messagingService.updateMessageDeliveryStatus(confirmationData.messageId, confirmationData.status, confirmationData.timestamp);
            logger_1.logger.debug('Delivery confirmation processed', {
                messageId: confirmationData.messageId,
                status: confirmationData.status,
                workerId: this.workerId
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to process delivery confirmation', {
                error: error.message,
                messageId: confirmationData.messageId,
                workerId: this.workerId
            });
        }
    }
    async processReadReceipts() {
        while (this.isRunning) {
            try {
                const receipt = await this.redis.brpop('read_receipt_queue', 1);
                if (receipt && receipt[1]) {
                    const receiptData = JSON.parse(receipt[1]);
                    await this.handleReadReceipt(receiptData);
                }
            }
            catch (error) {
                logger_1.logger.error('Error processing read receipt', {
                    error: error.message,
                    workerId: this.workerId
                });
                await this.sleep(1000);
            }
        }
    }
    async handleReadReceipt(receiptData) {
        try {
            await this.messagingService.updateMessageReadStatus(receiptData.messageId, receiptData.readBy, receiptData.timestamp);
            logger_1.logger.debug('Read receipt processed', {
                messageId: receiptData.messageId,
                readBy: receiptData.readBy,
                workerId: this.workerId
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to process read receipt', {
                error: error.message,
                messageId: receiptData.messageId,
                workerId: this.workerId
            });
        }
    }
    async addToDeadLetterQueue(messageData, error) {
        try {
            const deadLetterData = {
                originalMessage: messageData,
                error: error.message,
                timestamp: new Date(),
                workerId: this.workerId
            };
            await this.redis.lpush('dead_letter_queue', JSON.stringify(deadLetterData));
            logger_1.logger.warn('Message added to dead letter queue', {
                messageId: messageData.id,
                error: error.message,
                workerId: this.workerId
            });
        }
        catch (dlqError) {
            logger_1.logger.error('Failed to add message to dead letter queue', {
                error: dlqError.message,
                originalMessageId: messageData.id,
                workerId: this.workerId
            });
        }
    }
    startCleanupTasks() {
        setInterval(async () => {
            try {
                await this.messagingService.cleanupOldMessages();
                logger_1.logger.info('Old messages cleanup completed', { workerId: this.workerId });
            }
            catch (error) {
                logger_1.logger.error('Failed to cleanup old messages', {
                    error: error.message,
                    workerId: this.workerId
                });
            }
        }, 3600000);
        setInterval(async () => {
            try {
                await this.messagingService.cleanupExpiredSessions();
                logger_1.logger.info('Expired sessions cleanup completed', { workerId: this.workerId });
            }
            catch (error) {
                logger_1.logger.error('Failed to cleanup expired sessions', {
                    error: error.message,
                    workerId: this.workerId
                });
            }
        }, 1800000);
        setInterval(() => {
            this.logWorkerStats();
        }, 300000);
    }
    logWorkerStats() {
        const stats = {
            workerId: this.workerId,
            isRunning: this.isRunning,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            queueLength: 0,
            processedMessages: 0,
            errors: 0
        };
        logger_1.logger.info('Worker statistics', stats);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.MessageQueueWorker = MessageQueueWorker;
if (require.main === module) {
    const worker = new MessageQueueWorker();
    worker.start().catch(error => {
        logger_1.logger.error('Failed to start message queue worker', { error: error.message });
        process.exit(1);
    });
    process.on('SIGINT', async () => {
        logger_1.logger.info('Received SIGINT, shutting down worker gracefully...');
        await worker.stop();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        logger_1.logger.info('Received SIGTERM, shutting down worker gracefully...');
        await worker.stop();
        process.exit(0);
    });
}
exports.default = MessageQueueWorker;
//# sourceMappingURL=messageQueueWorker.js.map
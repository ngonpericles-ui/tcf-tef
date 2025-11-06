"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiChatController = void 0;
const errorHandler_1 = require("@/middleware/errorHandler");
const aiChatService_1 = require("../services/aiChatService");
const logger_1 = require("@/utils/logger");
class AiChatController {
}
exports.AiChatController = AiChatController;
_a = AiChatController;
AiChatController.sendMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { message, chatId, context } = req.body;
        const userId = req.user.userId;
        if (!message || typeof message !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: 'Message is required', code: 'INVALID_INPUT' }
            });
            return;
        }
        const response = await aiChatService_1.AiChatService.sendMessage(userId, message, chatId, context || {});
        res.status(200).json({
            success: true,
            data: response,
            message: 'Message sent successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error sending AI message:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to send message', code: 'INTERNAL_ERROR' }
        });
    }
});
AiChatController.getChatHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 10;
        const history = await aiChatService_1.AiChatService.getChatHistory(userId, limit);
        res.status(200).json({
            success: true,
            data: history,
            message: 'Chat history fetched successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting chat history:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch chat history', code: 'INTERNAL_ERROR' }
        });
    }
});
AiChatController.getChatSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.userId;
        const session = await aiChatService_1.AiChatService.getChatSession(chatId, userId);
        if (!session) {
            res.status(404).json({
                success: false,
                error: { message: 'Chat session not found', code: 'NOT_FOUND' }
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: session,
            message: 'Chat session fetched successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting chat session:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch chat session', code: 'INTERNAL_ERROR' }
        });
    }
});
AiChatController.deleteChatSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.userId;
        await aiChatService_1.AiChatService.deleteChatSession(chatId, userId);
        res.status(200).json({
            success: true,
            message: 'Chat session deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting chat session:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to delete chat session', code: 'INTERNAL_ERROR' }
        });
    }
});
//# sourceMappingURL=aiChatController.js.map
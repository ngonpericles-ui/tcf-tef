"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const requestLogger_1 = require("../middleware/requestLogger");
const floatingAiAssistantService_1 = require("../services/floatingAiAssistantService");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
router.post('/chat', requestLogger_1.requestLogger, auth_1.authenticate, (0, validation_1.validate)(validation_1.aiAssistantSchemas.chat), async (req, res) => {
    try {
        const { message, context } = req.body;
        const userId = req.user.userId;
        if (!message || !context) {
            return res.status(400).json({
                success: false,
                message: 'Message and context are required'
            });
        }
        const assistantContext = {
            page: context.page || 'general',
            userLevel: context.userLevel,
            simulationType: context.simulationType,
            country: context.country,
            immigrationType: context.immigrationType,
            language: context.language || 'fr'
        };
        const response = await floatingAiAssistantService_1.FloatingAiAssistantService.getAssistance(userId, message, assistantContext);
        logger_1.logger.info('AI Assistant chat request processed', {
            userId,
            page: assistantContext.page,
            messageLength: message.length
        });
        res.json({
            success: true,
            data: response
        });
    }
    catch (error) {
        logger_1.logger.error('Error in AI assistant chat:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/suggestions', requestLogger_1.requestLogger, auth_1.authenticate, (0, validation_1.validate)({ query: validation_1.aiAssistantSchemas.suggestions }), async (req, res) => {
    try {
        const { page, language = 'fr' } = req.query;
        const context = {
            page: page || 'general',
            language: language
        };
        const suggestions = floatingAiAssistantService_1.FloatingAiAssistantService.getQuickSuggestions(context);
        res.json({
            success: true,
            data: {
                suggestions,
                page: context.page
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting AI assistant suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/context-help', auth_1.authenticate, async (req, res) => {
    try {
        const { context } = req.body;
        const userId = req.user.userId;
        if (!context) {
            return res.status(400).json({
                success: false,
                message: 'Context is required'
            });
        }
        const assistantContext = {
            page: context.page || 'general',
            userLevel: context.userLevel,
            simulationType: context.simulationType,
            country: context.country,
            immigrationType: context.immigrationType,
            language: context.language || 'fr'
        };
        const helpMessage = assistantContext.language === 'fr'
            ? `Bonjour ! Je suis votre assistant IA pour vous aider sur cette page. Comment puis-je vous aider aujourd'hui ?`
            : `Hello! I'm your AI assistant to help you on this page. How can I help you today?`;
        const response = await floatingAiAssistantService_1.FloatingAiAssistantService.getAssistance(userId, helpMessage, assistantContext);
        res.json({
            success: true,
            data: response
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting context help:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=floatingAiAssistant.js.map
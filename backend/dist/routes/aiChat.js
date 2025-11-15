"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiChatController_1 = require("../controllers/aiChatController");
const auth_1 = require("@/middleware/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.post('/message', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), aiChatController_1.AiChatController.sendMessage);
router.get('/history', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), aiChatController_1.AiChatController.getChatHistory);
router.get('/session/:chatId', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), aiChatController_1.AiChatController.getChatSession);
router.delete('/session/:chatId', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), aiChatController_1.AiChatController.deleteChatSession);
router.post('/test', async (req, res) => {
    try {
        const { message } = req.body;
        const { AIService } = await Promise.resolve().then(() => __importStar(require('../services/aiService')));
        const response = await AIService.generateResponse({
            message,
            systemPrompt: "Tu es un assistant IA pour Aura.ca, une plateforme d'apprentissage du français. Réponds de manière utile et engageante.",
            context: {
                userLevel: 'BASIC',
                language: 'fr',
                relevantQuestions: [],
                conversationHistory: []
            }
        });
        res.json({ success: true, data: { message: response.content, confidence: response.confidence } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/test', async (req, res) => {
    try {
        res.json({
            success: true,
            message: "AI Chat service is working",
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/api-status', auth_1.authenticate, async (req, res) => {
    try {
        const mistralApiManager = require('../utils/mistralApiManager');
        const usageStatus = mistralApiManager.getUsageStatus();
        const modelName = 'mistral-small-latest';
        const hasApiKeys = usageStatus.length > 0;
        const availableKeys = usageStatus.filter(key => key.available).length;
        const totalKeys = usageStatus.length;
        let apiTestResult = null;
        try {
            const testResponse = await mistralApiManager.generateContent('Test', {
                maxTokens: 10
            });
            apiTestResult = {
                working: true,
                message: 'API key is working'
            };
        }
        catch (testError) {
            apiTestResult = {
                working: false,
                error: testError.message || 'API test failed',
                status: testError.status || testError.statusCode || testError.code,
                details: {
                    message: testError.message,
                    status: testError.status || testError.statusCode,
                    code: testError.code
                }
            };
        }
        res.json({
            success: true,
            data: {
                modelName,
                hasApiKeys,
                totalKeys,
                availableKeys,
                usageStatus,
                status: availableKeys > 0 ? 'active' : 'exhausted',
                apiTest: apiTestResult
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message || 'Failed to get API status' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=aiChat.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const questionBankService_1 = __importDefault(require("../services/questionBankService"));
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
router.get('/context', auth_1.authenticate, async (req, res, next) => {
    try {
        const { level, contentTypes, limit = '20' } = req.query;
        const user = req.user;
        if (user.role !== 'USER') {
            return res.status(403).json({
                success: false,
                error: { message: 'AI assistant is only available for students' }
            });
        }
        const contentTypeArray = contentTypes
            ? contentTypes.split(',')
            : undefined;
        const context = await questionBankService_1.default.getAllQuestionBanks();
        res.json({
            success: true,
            data: {
                context,
                count: context.length,
                userLevel: level || 'general'
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/search', auth_1.authenticate, async (req, res, next) => {
    try {
        const { query, contentType, level, tags, limit = 10 } = req.body;
        const user = req.user;
        if (user.role !== 'USER') {
            return res.status(403).json({
                success: false,
                error: { message: 'AI assistant is only available for students' }
            });
        }
        const searchResults = await questionBankService_1.default.getAllQuestionBanks();
        res.json({
            success: true,
            data: {
                results: searchResults,
                count: searchResults.length
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/stats', auth_1.authenticate, async (req, res, next) => {
    try {
        const user = req.user;
        if (user.role !== 'USER') {
            return res.status(403).json({
                success: false,
                error: { message: 'AI assistant is only available for students' }
            });
        }
        const stats = await questionBankService_1.default.getQuestionBankStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/feedback', auth_1.authenticate, async (req, res, next) => {
    try {
        const { query, response, rating, feedback } = req.body;
        const user = req.user;
        if (user.role !== 'USER') {
            return res.status(403).json({
                success: false,
                error: { message: 'Only students can submit AI assistant feedback' }
            });
        }
        logger_1.logger.info('AI Assistant Feedback', {
            userId: user.id,
            query,
            response: response?.substring(0, 100),
            rating,
            feedback,
            timestamp: new Date().toISOString()
        });
        res.json({
            success: true,
            data: {
                message: 'Feedback received successfully',
                feedbackId: `feedback_${Date.now()}_${user.id}`
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/suggestions', auth_1.authenticate, async (req, res, next) => {
    try {
        const { level, interests } = req.query;
        const user = req.user;
        if (user.role !== 'USER') {
            return res.status(403).json({
                success: false,
                error: { message: 'Content suggestions are only available for students' }
            });
        }
        const userLevel = level || 'A1';
        const interestTags = interests
            ? interests.split(',')
            : ['grammar', 'vocabulary', 'listening'];
        const suggestions = await questionBankService_1.default.getAllQuestionBanks();
        const formattedSuggestions = suggestions.map(item => ({
            id: item.id,
            title: `${item.contentType} - ${item.level}`,
            description: item.content.substring(0, 150) + '...',
            type: item.contentType,
            level: item.level,
            tags: item.tags
        }));
        res.json({
            success: true,
            data: {
                suggestions: formattedSuggestions,
                userLevel,
                count: formattedSuggestions.length
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=aiAssistant.js.map
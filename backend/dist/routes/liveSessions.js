"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveSessionRoutes = void 0;
const express_1 = require("express");
const liveSessionController_1 = require("@/controllers/liveSessionController");
const validation_1 = require("@/middleware/validation");
const auth_1 = require("@/middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.liveSessionRoutes = router;
const createLiveSessionSchema = joi_1.default.object({
    title: joi_1.default.string().min(3).max(200).required(),
    titleEn: joi_1.default.string().min(3).max(200).optional(),
    description: joi_1.default.string().min(10).max(1000).required(),
    descriptionEn: joi_1.default.string().min(10).max(1000).optional(),
    instructor: joi_1.default.string().min(2).max(100).required(),
    coInstructors: joi_1.default.array().items(joi_1.default.string().max(100)).optional(),
    date: joi_1.default.date().greater('now').required(),
    duration: joi_1.default.number().integer().min(15).max(480).required(),
    maxParticipants: joi_1.default.number().integer().min(1).max(1000).required(),
    price: joi_1.default.number().min(0).default(0),
    currency: joi_1.default.string().default('CFA'),
    requiredTier: validation_1.commonSchemas.subscriptionTier.required(),
    level: validation_1.commonSchemas.courseLevel.optional(),
    category: validation_1.commonSchemas.courseCategory.optional(),
    tags: joi_1.default.array().items(joi_1.default.string().max(50)).max(10).required(),
    image: joi_1.default.string().uri().optional(),
    notifyFollowers: joi_1.default.boolean().default(true)
});
const updateSessionStatusSchema = joi_1.default.object({
    status: joi_1.default.string().valid('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED').required()
});
router.get('/health', liveSessionController_1.LiveSessionController.healthCheck);
router.get('/statistics', auth_1.authenticate, auth_1.requireManager, liveSessionController_1.LiveSessionController.getLiveSessionStatistics);
router.get('/created', auth_1.authenticate, auth_1.requireManager, liveSessionController_1.LiveSessionController.getUserCreatedSessions);
router.get('/registered', auth_1.authenticate, liveSessionController_1.LiveSessionController.getUserRegisteredSessions);
router.get('/upcoming', auth_1.optionalAuthenticate, liveSessionController_1.LiveSessionController.getUpcomingSessions);
router.get('/', auth_1.optionalAuthenticate, liveSessionController_1.LiveSessionController.getAllLiveSessions);
router.post('/', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validate)(createLiveSessionSchema), liveSessionController_1.LiveSessionController.createLiveSession);
router.get('/:sessionId', auth_1.optionalAuthenticate, (0, validation_1.validateParams)({ sessionId: validation_1.commonSchemas.id }), liveSessionController_1.LiveSessionController.getLiveSessionById);
router.post('/:sessionId/register', auth_1.authenticate, (0, validation_1.validateParams)({ sessionId: validation_1.commonSchemas.id }), liveSessionController_1.LiveSessionController.registerForSession);
router.post('/:sessionId/join', auth_1.authenticate, (0, validation_1.validateParams)({ sessionId: validation_1.commonSchemas.id }), liveSessionController_1.LiveSessionController.registerForSession);
router.delete('/:sessionId/register', auth_1.authenticate, (0, validation_1.validateParams)({ sessionId: validation_1.commonSchemas.id }), liveSessionController_1.LiveSessionController.unregisterFromSession);
router.post('/:sessionId/leave', auth_1.authenticate, (0, validation_1.validateParams)({ sessionId: validation_1.commonSchemas.id }), liveSessionController_1.LiveSessionController.unregisterFromSession);
router.put('/:sessionId', auth_1.authenticate, (0, validation_1.validateParams)({ sessionId: validation_1.commonSchemas.id }), (0, validation_1.validate)(joi_1.default.object({
    title: joi_1.default.string().min(3).max(200).optional(),
    description: joi_1.default.string().min(10).max(1000).optional(),
    date: joi_1.default.date().optional(),
    duration: joi_1.default.number().integer().min(15).max(480).optional(),
    maxParticipants: joi_1.default.number().integer().min(1).max(1000).optional(),
    category: validation_1.commonSchemas.courseCategory.optional(),
    levels: joi_1.default.array().items(validation_1.commonSchemas.courseLevel).optional(),
    tags: joi_1.default.array().items(joi_1.default.string().max(50)).max(10).optional()
})), liveSessionController_1.LiveSessionController.updateLiveSession);
router.delete('/:sessionId', auth_1.authenticate, (0, validation_1.validateParams)({ sessionId: validation_1.commonSchemas.id }), liveSessionController_1.LiveSessionController.deleteLiveSession);
router.put('/:sessionId/status', auth_1.authenticate, (0, validation_1.validateParams)({ sessionId: validation_1.commonSchemas.id }), (0, validation_1.validate)(updateSessionStatusSchema), liveSessionController_1.LiveSessionController.updateSessionStatus);
router.post('/reminder', auth_1.authenticate, (0, validation_1.validate)(joi_1.default.object({
    sessionId: validation_1.commonSchemas.id.required(),
    reminderTime: joi_1.default.string().valid('5min', '10min').required()
})), liveSessionController_1.LiveSessionController.setReminder);
router.get('/:sessionId/participants', auth_1.authenticate, (0, validation_1.validateParams)({ sessionId: validation_1.commonSchemas.id }), liveSessionController_1.LiveSessionController.getSessionParticipants);
router.post('/:sessionId/participants/:participantId/mute', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validateParams)({ sessionId: validation_1.commonSchemas.id, participantId: validation_1.commonSchemas.id }), liveSessionController_1.LiveSessionController.muteParticipant);
router.post('/:sessionId/participants/:participantId/pin', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validateParams)({ sessionId: validation_1.commonSchemas.id, participantId: validation_1.commonSchemas.id }), liveSessionController_1.LiveSessionController.pinParticipant);
router.delete('/:sessionId/participants/:participantId', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validateParams)({ sessionId: validation_1.commonSchemas.id, participantId: validation_1.commonSchemas.id }), liveSessionController_1.LiveSessionController.removeParticipant);
router.get('/:sessionId/messages', auth_1.authenticate, (0, validation_1.validateParams)({ sessionId: validation_1.commonSchemas.id }), liveSessionController_1.LiveSessionController.getSessionMessages);
router.post('/:sessionId/messages', auth_1.authenticate, (0, validation_1.validateParams)({ sessionId: validation_1.commonSchemas.id }), (0, validation_1.validate)(joi_1.default.object({
    message: joi_1.default.string().min(1).max(1000).required()
})), liveSessionController_1.LiveSessionController.sendMessage);
//# sourceMappingURL=liveSessions.js.map
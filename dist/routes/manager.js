"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.managerRoutes = void 0;
const express_1 = require("express");
const managerController_1 = require("../controllers/managerController");
const settingsService_1 = require("../services/settingsService");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.managerRoutes = router;
const messageSchema = joi_1.default.object({
    title: joi_1.default.string().min(1).max(200).required(),
    message: joi_1.default.string().min(1).max(2000).required(),
    type: joi_1.default.string().valid('INFO', 'WARNING', 'SUCCESS', 'ERROR').default('INFO')
});
const contentSchema = joi_1.default.object({
    type: joi_1.default.string().valid('post', 'course', 'test').required(),
    title: joi_1.default.string().min(1).max(200).required(),
    content: joi_1.default.string().min(1).required(),
    excerpt: joi_1.default.string().max(500).optional(),
    category: joi_1.default.string().optional(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    level: joi_1.default.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').optional(),
    targetTier: joi_1.default.string().valid('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE').default('FREE')
});
const updateContentSchema = joi_1.default.object({
    type: joi_1.default.string().valid('post', 'course', 'test').required(),
    title: joi_1.default.string().min(1).max(200).optional(),
    content: joi_1.default.string().min(1).optional(),
    excerpt: joi_1.default.string().max(500).optional(),
    category: joi_1.default.string().optional(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    level: joi_1.default.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').optional(),
    targetTier: joi_1.default.string().valid('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE').optional()
});
const reportConfigSchema = joi_1.default.object({
    type: joi_1.default.string().valid('content', 'users', 'engagement', 'performance').required(),
    timeframe: joi_1.default.string().valid('7d', '30d', '90d', '1y').default('30d'),
    filters: joi_1.default.object().optional(),
    format: joi_1.default.string().valid('pdf', 'csv', 'excel').default('pdf')
});
router.get('/dashboard', auth_1.authenticate, auth_1.requireManager, managerController_1.ManagerController.getDashboard);
router.get('/metrics', auth_1.authenticate, auth_1.requireManager, managerController_1.ManagerController.getMetrics);
router.get('/activity', auth_1.authenticate, auth_1.requireManager, managerController_1.ManagerController.getActivity);
router.get('/analytics', auth_1.authenticate, auth_1.requireManager, managerController_1.ManagerController.getAnalytics);
router.post('/analytics/reports', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validate)(reportConfigSchema), managerController_1.ManagerController.generateReport);
router.get('/analytics/export', auth_1.authenticate, auth_1.requireManager, managerController_1.ManagerController.exportData);
router.get('/students', auth_1.authenticate, auth_1.requireManager, managerController_1.ManagerController.getManagedUsers);
router.get('/users', auth_1.authenticate, auth_1.requireManager, managerController_1.ManagerController.getManagedUsers);
router.get('/users/:userId/analytics', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validateParams)({ userId: validation_1.commonSchemas.id }), managerController_1.ManagerController.getUserAnalytics);
router.post('/users/:userId/message', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validateParams)({ userId: validation_1.commonSchemas.id }), (0, validation_1.validate)(messageSchema), managerController_1.ManagerController.sendMessageToUser);
router.get('/content', auth_1.authenticate, auth_1.requireManager, managerController_1.ManagerController.getContentLibrary);
router.post('/content', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validate)(contentSchema), managerController_1.ManagerController.createContent);
router.put('/content/:contentId', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validateParams)({ contentId: validation_1.commonSchemas.id }), (0, validation_1.validate)(updateContentSchema), managerController_1.ManagerController.updateContent);
router.post('/content/:contentId/publish', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validateParams)({ contentId: validation_1.commonSchemas.id }), managerController_1.ManagerController.publishContent);
router.get('/content/:contentId/analytics', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validateParams)({ contentId: validation_1.commonSchemas.id }), managerController_1.ManagerController.getContentAnalytics);
router.get('/health', managerController_1.ManagerController.healthCheck);
router.get('/settings', auth_1.authenticate, auth_1.requireManager, async (req, res, next) => {
    try {
        const settings = await settingsService_1.SettingsService.getManagerSettings(req.user.userId);
        res.json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/settings', auth_1.authenticate, auth_1.requireManager, async (req, res, next) => {
    try {
        const settings = await settingsService_1.SettingsService.updateManagerSettings(req.user.userId, req.body);
        res.json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=manager.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const settingsService_1 = require("../services/settingsService");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.adminRoutes = router;
const createManagerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).required(),
    firstName: joi_1.default.string().min(2).max(50).required(),
    lastName: joi_1.default.string().min(2).max(50).required(),
    role: joi_1.default.string().valid('JUNIOR_MANAGER', 'SENIOR_MANAGER').required()
});
const updateManagerSchema = joi_1.default.object({
    firstName: joi_1.default.string().min(2).max(50).optional(),
    lastName: joi_1.default.string().min(2).max(50).optional(),
    role: joi_1.default.string().valid('JUNIOR_MANAGER', 'SENIOR_MANAGER').optional(),
    status: joi_1.default.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').optional()
});
const reportConfigSchema = joi_1.default.object({
    type: joi_1.default.string().valid('users', 'courses', 'tests', 'revenue', 'engagement').required(),
    timeframe: joi_1.default.string().valid('7d', '30d', '90d', '1y').default('30d'),
    filters: joi_1.default.object().optional(),
    format: joi_1.default.string().valid('pdf', 'csv', 'excel').default('pdf')
});
router.get('/dashboard', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getDashboard);
router.get('/system/health', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getSystemHealth);
router.get('/metrics/business', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getBusinessMetrics);
router.get('/metrics/technical', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getTechnicalMetrics);
router.get('/users', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getAllUsers);
router.get('/users/:userId/analytics', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)({ userId: validation_1.commonSchemas.id }), adminController_1.AdminController.getUserAnalytics);
router.get('/managers', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getManagers);
router.post('/managers', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)(createManagerSchema), adminController_1.AdminController.createManager);
router.put('/managers/:managerId', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)({ managerId: validation_1.commonSchemas.id }), (0, validation_1.validate)(updateManagerSchema), adminController_1.AdminController.updateManager);
router.get('/managers/:managerId/performance', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)({ managerId: validation_1.commonSchemas.id }), adminController_1.AdminController.getManagerPerformance);
router.get('/analytics', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getAnalytics);
router.post('/analytics/reports', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)(reportConfigSchema), adminController_1.AdminController.generateReport);
router.get('/analytics/export', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.exportData);
router.get('/health', adminController_1.AdminController.healthCheck);
router.get('/settings', auth_1.authenticate, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const settings = await settingsService_1.SettingsService.getAdminSettings();
        res.json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/settings', auth_1.authenticate, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const settings = await settingsService_1.SettingsService.updateAdminSettings(req.body);
        res.json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/review-requests', auth_1.authenticate, auth_1.requireSeniorManager, adminController_1.AdminController.getReviewRequests);
router.post('/review-requests/:id/action', auth_1.authenticate, auth_1.requireSeniorManager, (0, validation_1.validate)({
    params: joi_1.default.object({
        id: validation_1.commonSchemas.id
    }),
    body: joi_1.default.object({
        action: joi_1.default.string().valid('accept', 'reject', 'complete').required(),
        response: joi_1.default.string().optional(),
        humanFeedback: joi_1.default.string().optional(),
        humanScore: joi_1.default.number().min(0).max(100).optional()
    })
}), adminController_1.AdminController.handleReviewRequest);
//# sourceMappingURL=admin.js.map
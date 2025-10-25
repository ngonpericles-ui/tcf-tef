"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = void 0;
const express_1 = require("express");
const analyticsService_1 = require("../services/analyticsService");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.analyticsRoutes = router;
router.get('/dashboard', auth_1.authenticate, auth_1.requireManager, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userRole = req.user?.role;
    if (!userRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const analytics = await analyticsService_1.AnalyticsService.getDashboardAnalytics(userRole);
    const response = {
        success: true,
        data: { analytics },
        message: 'Dashboard analytics retrieved successfully'
    };
    res.status(200).json(response);
}));
router.get('/user-activity', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const days = parseInt(req.query.days) || 30;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const analytics = await analyticsService_1.AnalyticsService.getUserActivityAnalytics(userId, days);
    const response = {
        success: true,
        data: { analytics },
        message: 'User activity analytics retrieved successfully'
    };
    res.status(200).json(response);
}));
router.get('/system-metrics', auth_1.authenticate, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userRole = req.user?.role;
    if (!userRole) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const metrics = await analyticsService_1.AnalyticsService.getSystemMetrics(userRole);
    const response = {
        success: true,
        data: { metrics },
        message: 'System metrics retrieved successfully'
    };
    res.status(200).json(response);
}));
router.post('/track', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { eventType, eventData } = req.body;
    const userId = req.user?.userId;
    const sessionId = req.headers['x-session-id'];
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    await analyticsService_1.AnalyticsService.trackEvent(eventType, eventData, userId, sessionId, userAgent, ipAddress);
    const response = {
        success: true,
        message: 'Event tracked successfully'
    };
    res.status(200).json(response);
}));
router.get('/health', (req, res) => {
    const response = {
        success: true,
        data: {
            service: 'analytics',
            status: 'healthy',
            timestamp: new Date().toISOString()
        },
        message: 'Analytics service is healthy'
    };
    res.status(200).json(response);
});
//# sourceMappingURL=analytics.js.map
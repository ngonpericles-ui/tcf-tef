"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const marketplaceService_1 = require("../services/marketplaceService");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/manager/marketplace/profile', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const result = await marketplaceService_1.MarketplaceService.getTutorProfile(userId);
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error in marketplace profile route:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', statusCode: 500 }
        });
    }
});
router.get('/manager/marketplace/requests', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const result = await marketplaceService_1.MarketplaceService.getStudentRequests(userId);
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error in marketplace requests route:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', statusCode: 500 }
        });
    }
});
router.put('/manager/marketplace/profile', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const result = await marketplaceService_1.MarketplaceService.updateTutorProfile(userId, req.body);
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error in marketplace profile update route:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', statusCode: 500 }
        });
    }
});
router.post('/manager/marketplace/activate', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { isActive } = req.body;
        const result = await marketplaceService_1.MarketplaceService.activateTutorProfile(userId, isActive);
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error in marketplace activation route:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', statusCode: 500 }
        });
    }
});
router.post('/manager/marketplace/requests/:id/action', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.id;
        const requestId = req.params.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { action, managerId } = req.body;
        const result = await marketplaceService_1.MarketplaceService.handleStudentRequest(requestId, action, managerId || userId);
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error in marketplace request action route:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', statusCode: 500 }
        });
    }
});
router.get('/marketplace/tutors', auth_1.authenticate, async (req, res) => {
    try {
        const result = await marketplaceService_1.MarketplaceService.getAllTutors();
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error in marketplace tutors route:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', statusCode: 500 }
        });
    }
});
exports.default = router;
//# sourceMappingURL=marketplaceRoutes.js.map
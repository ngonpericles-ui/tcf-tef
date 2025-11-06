"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const marketplaceService_1 = require("../services/marketplaceService");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const fileUploadController_1 = require("../controllers/fileUploadController");
const fileUploadService_1 = require("../services/fileUploadService");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const profileImageUpload = fileUploadService_1.FileUploadService.configureMulter({
    category: 'PROFILE_IMAGE',
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
});
router.get('/manager/marketplace/profile', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    console.log('🔍 Route handler called for /manager/marketplace/profile');
    try {
        const userId = req.user?.userId || req.user?.id;
        console.log('🔍 User ID extracted for profile:', userId);
        if (!userId) {
            console.error('❌ User ID not found in request:', {
                user: req.user,
                hasUser: !!req.user,
                userId: req.user?.userId,
                id: req.user?.id
            });
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        console.log('📋 Fetching tutor profile for userId:', userId);
        const result = await marketplaceService_1.MarketplaceService.getTutorProfile(userId);
        if (!result.success) {
            console.error('❌ Failed to get tutor profile:', result.error);
            return res.status(result.error?.statusCode || 500).json(result);
        }
        console.log('✅ Tutor profile retrieved successfully:', {
            userId,
            hasProfile: !!result.data,
            isActive: result.data?.isActive
        });
        res.json(result);
    }
    catch (error) {
        console.error('❌ Unhandled error in marketplace profile route:', {
            error: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack?.substring(0, 1000),
            userId: req.user?.userId || req.user?.id,
            errorType: error.constructor?.name,
            errorKeys: Object.keys(error)
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Internal server error',
                statusCode: 500,
                details: process.env.NODE_ENV === 'development' ? {
                    code: error.code,
                    meta: error.meta
                } : undefined
            }
        });
    }
});
router.get('/manager/marketplace/requests', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    console.log('🔍 Route handler called for /manager/marketplace/requests');
    try {
        const userId = req.user?.userId || req.user?.id;
        console.log('🔍 User ID extracted:', userId);
        if (!userId) {
            console.error('❌ User ID not found in request:', {
                user: req.user,
                hasUser: !!req.user,
                userId: req.user?.userId,
                id: req.user?.id
            });
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { status, requestType } = req.query;
        console.log('📋 Fetching student requests for tutor:', userId, 'status:', status, 'requestType:', requestType);
        let statusStr;
        if (typeof status === 'string') {
            statusStr = status;
        }
        else if (Array.isArray(status) && status.length > 0 && typeof status[0] === 'string') {
            statusStr = status[0];
        }
        let requestTypeStr;
        if (typeof requestType === 'string') {
            requestTypeStr = requestType;
        }
        else if (Array.isArray(requestType) && requestType.length > 0 && typeof requestType[0] === 'string') {
            requestTypeStr = requestType[0];
        }
        const result = await marketplaceService_1.MarketplaceService.getStudentRequests(userId, statusStr ? statusStr.toUpperCase() : undefined, requestTypeStr ? requestTypeStr.toUpperCase() : undefined);
        if (!result.success) {
            console.error('❌ Failed to get student requests:', result.error);
            return res.status(result.error?.statusCode || 500).json(result);
        }
        console.log('✅ Student requests retrieved successfully:', {
            count: Array.isArray(result.data) ? result.data.length : 0,
            userId,
            status
        });
        res.json(result);
    }
    catch (error) {
        console.error('❌ Unhandled error in marketplace requests route:', {
            error: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack?.substring(0, 1000),
            userId: req.user?.userId || req.user?.id,
            user: req.user,
            errorType: error.constructor?.name,
            errorKeys: Object.keys(error)
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Internal server error',
                statusCode: 500,
                details: process.env.NODE_ENV === 'development' ? {
                    code: error.code,
                    meta: error.meta
                } : undefined
            }
        });
    }
});
router.put('/manager/marketplace/profile', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
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
        const userId = req.user?.userId || req.user?.id;
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
router.delete('/manager/marketplace/requests/:id', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const requestId = req.params.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const request = await prisma.marketplaceRequest.findUnique({
            where: { id: requestId }
        });
        if (!request) {
            return res.status(404).json({
                success: false,
                error: { message: 'Request not found', statusCode: 404 }
            });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if (request.tutorId !== userId && user?.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: { message: 'Unauthorized: You can only delete requests assigned to you', statusCode: 403 }
            });
        }
        await prisma.marketplaceRequest.delete({
            where: { id: requestId }
        });
        res.json({
            success: true,
            message: 'Request deleted successfully'
        });
    }
    catch (error) {
        console.error('❌ Error deleting marketplace request:', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: { message: error.message || 'Internal server error', statusCode: 500 }
        });
    }
});
router.post('/manager/marketplace/requests/:id/action', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const requestId = req.params.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { action, response } = req.body;
        if (!action || !['accept', 'decline', 'complete'].includes(action)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid action. Use "accept", "decline", or "complete"', statusCode: 400 }
            });
        }
        const result = await marketplaceService_1.MarketplaceService.handleStudentRequest(requestId, action, userId, response);
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('❌ Error in marketplace request action route:', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: { message: error.message || 'Internal server error', statusCode: 500 }
        });
    }
});
router.post('/marketplace/requests', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { tutorId, requestType, subject, description, urgency, requestedDate, feedbackId, metadata } = req.body;
        if (!tutorId || !requestType || !subject || !description) {
            return res.status(400).json({
                success: false,
                error: { message: 'Missing required fields: tutorId, requestType, subject, description', statusCode: 400 }
            });
        }
        if (!['SESSION', 'MESSAGE', 'EXPERTISE'].includes(requestType.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid requestType. Use SESSION, MESSAGE, or EXPERTISE', statusCode: 400 }
            });
        }
        const result = await marketplaceService_1.MarketplaceService.createStudentRequest(userId, tutorId, {
            requestType: requestType.toUpperCase(),
            subject,
            description,
            urgency: urgency?.toUpperCase(),
            requestedDate: requestedDate ? new Date(requestedDate) : undefined,
            feedbackId,
            metadata
        });
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('❌ Error creating marketplace request:', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: { message: error.message || 'Internal server error', statusCode: 500 }
        });
    }
});
router.get('/marketplace/my-requests', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { status } = req.query;
        let statusStr;
        if (typeof status === 'string') {
            statusStr = status;
        }
        else if (Array.isArray(status) && status.length > 0 && typeof status[0] === 'string') {
            statusStr = status[0];
        }
        const result = await marketplaceService_1.MarketplaceService.getStudentOwnRequests(userId, statusStr ? statusStr.toUpperCase() : undefined);
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('❌ Error getting student own requests:', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: { message: error.message || 'Internal server error', statusCode: 500 }
        });
    }
});
router.get('/marketplace/tutors', auth_1.authenticate, async (req, res) => {
    try {
        console.log('🔍 GET /marketplace/tutors - Route handler called');
        console.log('🔍 User ID:', req.user?.userId || req.user?.id);
        const result = await marketplaceService_1.MarketplaceService.getAllTutors();
        console.log('📋 MarketplaceService.getAllTutors result:', {
            success: result.success,
            dataLength: result.success ? (Array.isArray(result.data) ? result.data.length : 0) : 0,
            error: result.error?.message
        });
        if (!result.success) {
            console.error('❌ getAllTutors failed:', result.error);
            return res.status(result.error?.statusCode || 500).json(result);
        }
        console.log('✅ Sending response with', result.data?.length || 0, 'tutors');
        res.json(result);
    }
    catch (error) {
        console.error('❌ Error in marketplace tutors route:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', statusCode: 500 }
        });
    }
});
router.get('/marketplace/specialties', async (req, res, next) => {
    try {
        console.log('🔍 GET /marketplace/specialties - Route handler called');
        console.log('📋 Request details:', {
            method: req.method,
            path: req.path,
            url: req.url,
            originalUrl: req.originalUrl,
            baseUrl: req.baseUrl
        });
        const result = await marketplaceService_1.MarketplaceService.getAllSpecialties();
        if (!result.success) {
            console.error('❌ getAllSpecialties failed:', result.error);
            return res.status(result.error?.statusCode || 500).json(result);
        }
        console.log('✅ Sending response with', result.data?.length || 0, 'specialties');
        res.json(result);
    }
    catch (error) {
        console.error('❌ Error in marketplace specialties route:', error.message);
        console.error('Stack:', error.stack);
        next(error);
    }
});
router.get('/marketplace/subjects', async (req, res, next) => {
    try {
        console.log('🔍 GET /marketplace/subjects - Route handler called');
        const result = await marketplaceService_1.MarketplaceService.getAllSubjects();
        if (!result.success) {
            console.error('❌ getAllSubjects failed:', result.error);
            return res.status(result.error?.statusCode || 500).json(result);
        }
        console.log('✅ Sending response with', result.data?.length || 0, 'subjects');
        res.json(result);
    }
    catch (error) {
        console.error('❌ Error in marketplace subjects route:', error.message);
        next(error);
    }
});
router.get('/marketplace/availability-options', async (req, res, next) => {
    try {
        console.log('🔍 GET /marketplace/availability-options - Route handler called');
        const result = await marketplaceService_1.MarketplaceService.getAllAvailabilityOptions();
        if (!result.success) {
            console.error('❌ getAllAvailabilityOptions failed:', result.error);
            return res.status(result.error?.statusCode || 500).json(result);
        }
        console.log('✅ Sending response with', result.data?.length || 0, 'availability options');
        res.json(result);
    }
    catch (error) {
        console.error('❌ Error in marketplace availability options route:', error.message);
        next(error);
    }
});
router.post('/manager/marketplace/upload-image', auth_1.authenticate, auth_1.requireManager, profileImageUpload.single('file'), async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        await fileUploadController_1.FileUploadController.uploadProfileImage(req, res);
    }
    catch (error) {
        console.error('❌ Error in marketplace image upload route:', error.message);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=marketplaceRoutes.js.map
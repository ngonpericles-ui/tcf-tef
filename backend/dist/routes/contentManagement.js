"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const contentManagementService_1 = require("../services/contentManagementService");
const auth_1 = require("../middleware/auth");
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/content/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 500 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/plain',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'video/mp4',
            'video/avi',
            'video/mov',
            'audio/mp3',
            'audio/wav',
            'audio/m4a',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new errors_1.ValidationError('Invalid file type'));
        }
    }
});
router.post('/upload', auth_1.authenticate, upload.single('file'), async (req, res, next) => {
    try {
        const { title, description, level, category, subscriptionTier, availableLevels, availableTiers, language, contentType, tags, duration, maxScore, passingScore } = req.body;
        if (!title || !description || !level || !category || !subscriptionTier || !contentType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        const uploadData = {
            title,
            description,
            level,
            category,
            subscriptionTier,
            availableLevels: availableLevels ? JSON.parse(availableLevels) : undefined,
            availableTiers: availableTiers ? JSON.parse(availableTiers) : undefined,
            language: language || 'fr',
            contentType,
            file: req.file,
            tags: tags ? JSON.parse(tags) : [],
            duration: duration ? parseInt(duration) : undefined,
            maxScore: maxScore ? parseInt(maxScore) : undefined,
            passingScore: passingScore ? parseInt(passingScore) : undefined
        };
        const result = await contentManagementService_1.ContentManagementService.uploadContent(uploadData, req.user.id, req.user.role);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/courses', async (req, res, next) => {
    try {
        const { level, category, subscriptionTier, search, page = '1', limit = '20' } = req.query;
        const result = await contentManagementService_1.ContentManagementService.getContentForCourses(level, category, subscriptionTier, search, parseInt(page), parseInt(limit));
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/tests', async (req, res, next) => {
    try {
        const { level, type, category, subscriptionTier, search, page = '1', limit = '20' } = req.query;
        const result = await contentManagementService_1.ContentManagementService.getContentForTests(level, category, subscriptionTier, search, parseInt(page), parseInt(limit));
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/simulations', async (req, res, next) => {
    try {
        const { level, type, subscriptionTier, search, page = '1', limit = '20' } = req.query;
        const result = await contentManagementService_1.ContentManagementService.getContentForTests(level, 'SIMULATION', subscriptionTier, search, parseInt(page), parseInt(limit));
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/management', auth_1.authenticate, async (req, res, next) => {
    try {
        console.log('🔍 Content Management Request:', {
            userRole: req.user.role,
            userId: req.user.id,
            query: req.query
        });
        const { contentType, page = '1', limit = '20' } = req.query;
        const result = await contentManagementService_1.ContentManagementService.getContentForManagement(req.user.role, req.user.id, contentType, parseInt(page), parseInt(limit));
        console.log('✅ Content Management Response:', {
            contentCount: result.content.length,
            total: result.total
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('❌ Content Management Error:', error);
        next(error);
    }
});
router.put('/:id/publish', auth_1.authenticate, auth_1.requireSeniorManager, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { contentType } = req.body;
        if (!contentType) {
            return res.status(400).json({
                success: false,
                message: 'Content type is required'
            });
        }
        const result = await contentManagementService_1.ContentManagementService.publishContent(id, contentType, req.user.id, req.user.role);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { contentType } = req.body;
        if (!contentType) {
            return res.status(400).json({
                success: false,
                message: 'Content type is required'
            });
        }
        await contentManagementService_1.ContentManagementService.deleteContent(id, contentType, req.user.id, req.user.role);
        res.json({
            success: true,
            message: 'Content deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/corriger-tcf', async (req, res, next) => {
    try {
        const { level, subscriptionTier, search, page = '1', limit = '20' } = req.query;
        const result = await contentManagementService_1.ContentManagementService.getContentForTests(level, 'CORRIGER_TCF', subscriptionTier, search, parseInt(page), parseInt(limit));
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id/levels-subscriptions', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { levels, subscriptions } = req.body;
        if (!levels || !subscriptions || !Array.isArray(levels) || !Array.isArray(subscriptions)) {
            return res.status(400).json({
                success: false,
                message: 'Levels and subscriptions must be arrays'
            });
        }
        const result = await contentManagementService_1.ContentManagementService.updateCourseLevelsAndSubscriptions(id, levels, subscriptions, req.user.id, req.user.role);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=contentManagement.js.map
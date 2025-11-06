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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const contentManagementService_1 = require("../services/contentManagementService");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
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
        fileSize: 10 * 1024 * 1024 * 1024,
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
router.get('/test-cloudinary', auth_1.authenticate, async (req, res) => {
    try {
        const { CloudinaryService } = await Promise.resolve().then(() => __importStar(require('../services/cloudinaryService')));
        if (!CloudinaryService.isConfigured()) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.',
                    code: 'CLOUDINARY_NOT_CONFIGURED'
                }
            });
        }
        const connectionTest = await CloudinaryService.testConnection();
        if (connectionTest) {
            return res.json({
                success: true,
                message: 'Cloudinary connection test successful',
                data: {
                    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'parsed from CLOUDINARY_URL',
                    configured: true,
                    connectionTest: true
                }
            });
        }
        else {
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Cloudinary connection test failed. Please check your credentials.',
                    code: 'CLOUDINARY_CONNECTION_FAILED'
                }
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Cloudinary test failed:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Cloudinary test failed',
                code: 'CLOUDINARY_TEST_ERROR'
            }
        });
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
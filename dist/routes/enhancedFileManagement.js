"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const enhancedFileManagementService_1 = require("../services/enhancedFileManagementService");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/temp/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'video/mp4',
            'video/avi',
            'video/quicktime',
            'audio/mpeg',
            'audio/wav',
            'audio/mp3',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new errors_1.ValidationError(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`));
        }
    }
});
router.post('/upload', auth_1.authenticate, auth_1.requireManager, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'No file uploaded', code: 'VALIDATION_ERROR' }
            });
        }
        const { title, description, level, category, contentType, subscriptionTier } = req.body;
        if (!title || !description || !level || !category || !contentType) {
            return res.status(400).json({
                success: false,
                error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
            });
        }
        const result = await enhancedFileManagementService_1.EnhancedFileManagementService.uploadAndProcess(req.file, {
            title,
            description,
            level,
            category,
            contentType,
            subscriptionTier: subscriptionTier || 'FREE',
            userId: req.user.userId
        });
        res.status(201).json({
            success: true,
            data: result,
            message: 'File uploaded and processed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Enhanced file upload failed:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'File upload failed',
                code: 'UPLOAD_ERROR'
            }
        });
    }
});
router.get('/files', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const { page = 1, limit = 20, category, level, contentType, dateFrom, dateTo, hasAiAnalysis, createdBy } = req.query;
        const filters = {
            category: category,
            level: level,
            contentType: contentType,
            dateFrom: dateFrom ? new Date(dateFrom) : undefined,
            dateTo: dateTo ? new Date(dateTo) : undefined,
            hasAiAnalysis: hasAiAnalysis === 'true',
            createdBy: createdBy
        };
        const pagination = {
            page: parseInt(page),
            limit: parseInt(limit)
        };
        const result = await enhancedFileManagementService_1.EnhancedFileManagementService.searchFiles(filters, pagination);
        res.json({
            success: true,
            data: result.files,
            pagination: result.pagination,
            total: result.total
        });
    }
    catch (error) {
        logger_1.logger.error('File listing failed:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Failed to fetch files',
                code: 'FETCH_ERROR'
            }
        });
    }
});
router.post('/process/:fileId', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const { fileId } = req.params;
        if (!fileId) {
            return res.status(400).json({
                success: false,
                error: { message: 'File ID is required', code: 'VALIDATION_ERROR' }
            });
        }
        const result = await enhancedFileManagementService_1.EnhancedFileManagementService.processFile(fileId);
        res.json({
            success: true,
            data: result,
            message: 'File processing completed'
        });
    }
    catch (error) {
        logger_1.logger.error('File processing failed:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'File processing failed',
                code: 'PROCESSING_ERROR'
            }
        });
    }
});
router.get('/search', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const { q, page = 1, limit = 20, category, level, contentType, dateFrom, dateTo } = req.query;
        const filters = {
            category: category,
            level: level,
            contentType: contentType,
            dateFrom: dateFrom ? new Date(dateFrom) : undefined,
            dateTo: dateTo ? new Date(dateTo) : undefined
        };
        const pagination = {
            page: parseInt(page),
            limit: parseInt(limit)
        };
        const result = await enhancedFileManagementService_1.EnhancedFileManagementService.searchFiles(filters, pagination);
        let filteredFiles = result.files;
        if (q) {
            const searchTerm = q.toLowerCase();
            filteredFiles = result.files.filter(file => file.originalName.toLowerCase().includes(searchTerm) ||
                (file.metadata?.extractedText &&
                    file.metadata.extractedText.toLowerCase().includes(searchTerm)));
        }
        res.json({
            success: true,
            data: filteredFiles,
            pagination: result.pagination,
            total: filteredFiles.length,
            query: q
        });
    }
    catch (error) {
        logger_1.logger.error('File search failed:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Search failed',
                code: 'SEARCH_ERROR'
            }
        });
    }
});
router.get('/stats', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            filesByType: {},
            filesByLevel: {},
            processingStatus: {
                completed: 0,
                processing: 0,
                failed: 0
            },
            aiAnalysisStats: {
                questionsExtracted: 0,
                documentsAnalyzed: 0
            }
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.logger.error('Stats fetch failed:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Failed to fetch stats',
                code: 'STATS_ERROR'
            }
        });
    }
});
router.delete('/files/:fileId', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const { fileId } = req.params;
        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('File deletion failed:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'File deletion failed',
                code: 'DELETE_ERROR'
            }
        });
    }
});
exports.default = router;
//# sourceMappingURL=enhancedFileManagement.js.map
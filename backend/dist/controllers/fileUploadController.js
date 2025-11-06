"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadController = void 0;
const fileUploadService_1 = require("../services/fileUploadService");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
class FileUploadController {
    static async uploadProfileImage(req, res) {
        try {
            const userId = req.user.userId || req.user.id;
            if (!userId) {
                throw new errors_1.ValidationError('User ID not found in token');
            }
            const file = req.file;
            if (!file) {
                throw new errors_1.ValidationError('No file uploaded');
            }
            const uploadedFile = await fileUploadService_1.FileUploadService.processUploadedFile(file, userId, {
                category: 'PROFILE_IMAGE',
                maxSize: 5 * 1024 * 1024,
                allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
                resize: {
                    width: 300,
                    height: 300,
                    quality: 85
                }
            });
            await fileUploadService_1.FileUploadService.updateProfileImage(userId, uploadedFile.id);
            res.status(201).json({
                success: true,
                data: { file: uploadedFile },
                message: 'Profile image uploaded successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to upload profile image', {
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to upload profile image',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'UPLOAD_ERROR'
                    }
                });
            }
        }
    }
    static async uploadCourseMaterial(req, res) {
        try {
            const userId = req.user.userId;
            const files = req.files;
            if (!files || files.length === 0) {
                throw new errors_1.ValidationError('No files uploaded');
            }
            const uploadedFiles = [];
            for (const file of files) {
                const uploadedFile = await fileUploadService_1.FileUploadService.processUploadedFile(file, userId, {
                    category: 'COURSE_MATERIAL',
                    maxSize: 50 * 1024 * 1024,
                    allowedTypes: [
                        'application/pdf',
                        'video/mp4',
                        'audio/mp3',
                        'image/jpeg',
                        'image/png',
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                        'application/vnd.ms-powerpoint'
                    ]
                });
                uploadedFiles.push(uploadedFile);
            }
            res.status(201).json({
                success: true,
                data: { files: uploadedFiles },
                message: `${uploadedFiles.length} course material(s) uploaded successfully`
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to upload course material', {
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to upload course material',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'UPLOAD_ERROR'
                    }
                });
            }
        }
    }
    static async uploadPostMedia(req, res) {
        try {
            const userId = req.user.userId;
            const files = req.files;
            if (!files || files.length === 0) {
                throw new errors_1.ValidationError('No files uploaded');
            }
            const uploadedFiles = [];
            for (const file of files) {
                const uploadedFile = await fileUploadService_1.FileUploadService.processUploadedFile(file, userId, {
                    category: 'POST_MEDIA',
                    maxSize: 20 * 1024 * 1024,
                    allowedTypes: [
                        'image/jpeg',
                        'image/png',
                        'image/gif',
                        'video/mp4',
                        'audio/mp3'
                    ]
                });
                uploadedFiles.push(uploadedFile);
            }
            const filesWithAbsoluteUrls = uploadedFiles.map(file => ({
                ...file,
                url: file.url?.startsWith('http') ? file.url : `http://localhost:3001${file.url || file.path || ''}`
            }));
            res.status(201).json({
                success: true,
                data: { files: filesWithAbsoluteUrls },
                message: `${uploadedFiles.length} media file(s) uploaded successfully`
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to upload post media', {
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to upload post media',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'UPLOAD_ERROR'
                    }
                });
            }
        }
    }
    static async uploadDocument(req, res) {
        try {
            const userId = req.user.userId;
            const file = req.file;
            if (!file) {
                throw new errors_1.ValidationError('No file uploaded');
            }
            const uploadedFile = await fileUploadService_1.FileUploadService.processUploadedFile(file, userId, {
                category: 'DOCUMENT',
                maxSize: 25 * 1024 * 1024,
                allowedTypes: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/plain'
                ]
            });
            res.status(201).json({
                success: true,
                data: { file: uploadedFile },
                message: 'Document uploaded successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to upload document', {
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to upload document',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'UPLOAD_ERROR'
                    }
                });
            }
        }
    }
    static async getFileById(req, res) {
        try {
            const { fileId } = req.params;
            const userId = req.user?.userId;
            const file = await fileUploadService_1.FileUploadService.getFileById(fileId, userId);
            res.json({
                success: true,
                data: { file },
                message: 'File retrieved successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get file by ID', {
                fileId: req.params.fileId,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FILE_NOT_FOUND'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to get file',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'FILE_FETCH_ERROR'
                    }
                });
            }
        }
    }
    static async downloadFile(req, res) {
        try {
            const { fileId } = req.params;
            const userId = req.user?.userId;
            const file = await fileUploadService_1.FileUploadService.getFileById(fileId, userId);
            try {
                await promises_1.default.access(file.path);
            }
            catch {
                throw new errors_1.NotFoundError('File not found on disk');
            }
            res.setHeader('Content-Type', file.mimetype);
            res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
            res.setHeader('Content-Length', file.size.toString());
            res.sendFile(path_1.default.resolve(file.path));
            logger_1.logger.info('File downloaded', {
                fileId,
                originalName: file.originalName,
                userId
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to download file', {
                fileId: req.params.fileId,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FILE_NOT_FOUND'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to download file',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'DOWNLOAD_ERROR'
                    }
                });
            }
        }
    }
    static async getUserFiles(req, res) {
        try {
            const userId = req.user.userId;
            const category = req.query.category;
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            if (limit > 100) {
                throw new errors_1.ValidationError('Limit cannot exceed 100');
            }
            const result = await fileUploadService_1.FileUploadService.getUserFiles(userId, category, page, limit);
            res.json({
                success: true,
                data: result,
                message: `Retrieved ${result.files.length} files`
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get user files', {
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to get files',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'FILES_FETCH_ERROR'
                    }
                });
            }
        }
    }
    static async deleteFile(req, res) {
        try {
            const { fileId } = req.params;
            const userId = req.user.userId;
            await fileUploadService_1.FileUploadService.deleteFile(fileId, userId);
            res.json({
                success: true,
                message: 'File deleted successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete file', {
                fileId: req.params.fileId,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FILE_NOT_FOUND'
                    }
                });
            }
            else if (error instanceof errors_1.ForbiddenError) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FORBIDDEN'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to delete file',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'FILE_DELETE_ERROR'
                    }
                });
            }
        }
    }
    static async getFileStatistics(req, res) {
        try {
            const userId = req.user.userId;
            const stats = await fileUploadService_1.FileUploadService.getFileStatistics(userId);
            res.json({
                success: true,
                data: { statistics: stats },
                message: 'File statistics retrieved successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get file statistics', {
                error,
                userId: req.user?.userId
            });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to get file statistics',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'STATISTICS_ERROR'
                }
            });
        }
    }
}
exports.FileUploadController = FileUploadController;
//# sourceMappingURL=fileUploadController.js.map
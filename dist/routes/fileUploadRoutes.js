"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fileUploadController_1 = require("../controllers/fileUploadController");
const fileUploadService_1 = require("../services/fileUploadService");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
fileUploadService_1.FileUploadService.initializeDirectories().catch(console.error);
const fileQuerySchema = {
    query: joi_1.default.object({
        category: joi_1.default.string().valid('PROFILE_IMAGE', 'COURSE_MATERIAL', 'POST_MEDIA', 'DOCUMENT', 'OTHER').optional(),
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20)
    })
};
const profileImageUpload = fileUploadService_1.FileUploadService.configureMulter({
    category: 'PROFILE_IMAGE',
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
});
const courseMaterialUpload = fileUploadService_1.FileUploadService.configureMulter({
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
const postMediaUpload = fileUploadService_1.FileUploadService.configureMulter({
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
const documentUpload = fileUploadService_1.FileUploadService.configureMulter({
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
router.post('/profile-image', auth_1.authenticate, profileImageUpload.single('file'), fileUploadController_1.FileUploadController.uploadProfileImage);
router.post('/course-material', auth_1.authenticate, (0, auth_1.requireRole)(['SENIOR_MANAGER', 'JUNIOR_MANAGER', 'ADMIN']), courseMaterialUpload.array('files', 5), fileUploadController_1.FileUploadController.uploadCourseMaterial);
router.post('/post-media', auth_1.authenticate, postMediaUpload.array('files', 5), fileUploadController_1.FileUploadController.uploadPostMedia);
router.post('/document', auth_1.authenticate, documentUpload.single('file'), fileUploadController_1.FileUploadController.uploadDocument);
router.get('/', auth_1.authenticate, (0, validation_1.validate)(fileQuerySchema), fileUploadController_1.FileUploadController.getUserFiles);
router.get('/:fileId', fileUploadController_1.FileUploadController.getFileById);
router.get('/:fileId/download', fileUploadController_1.FileUploadController.downloadFile);
router.delete('/:fileId', auth_1.authenticate, fileUploadController_1.FileUploadController.deleteFile);
router.get('/statistics', auth_1.authenticate, fileUploadController_1.FileUploadController.getFileStatistics);
exports.default = router;
//# sourceMappingURL=fileUploadRoutes.js.map
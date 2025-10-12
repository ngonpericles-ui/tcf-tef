"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agoraController_1 = require("../controllers/agoraController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
const rtcTokenSchema = {
    body: joi_1.default.object({
        channelName: joi_1.default.string().required().min(1).max(64).messages({
            'string.empty': 'Channel name cannot be empty',
            'string.min': 'Channel name must be at least 1 character',
            'string.max': 'Channel name cannot exceed 64 characters',
            'any.required': 'Channel name is required'
        }),
        uid: joi_1.default.alternatives().try(joi_1.default.string().required(), joi_1.default.number().integer().min(0).max(4294967295).required()).messages({
            'any.required': 'UID is required',
            'number.min': 'UID must be a positive integer',
            'number.max': 'UID must be within valid range'
        }),
        role: joi_1.default.string().valid('publisher', 'subscriber').required().messages({
            'any.only': 'Role must be either "publisher" or "subscriber"',
            'any.required': 'Role is required'
        }),
        expiry: joi_1.default.number().integer().min(60).max(86400).optional().messages({
            'number.min': 'Expiry must be at least 60 seconds',
            'number.max': 'Expiry cannot exceed 24 hours (86400 seconds)'
        })
    })
};
const rtmTokenSchema = {
    body: joi_1.default.object({
        uid: joi_1.default.string().required().min(1).max(64).messages({
            'string.empty': 'UID cannot be empty',
            'string.min': 'UID must be at least 1 character',
            'string.max': 'UID cannot exceed 64 characters',
            'any.required': 'UID is required'
        }),
        expiry: joi_1.default.number().integer().min(60).max(86400).optional().messages({
            'number.min': 'Expiry must be at least 60 seconds',
            'number.max': 'Expiry cannot exceed 24 hours (86400 seconds)'
        })
    })
};
const startRecordingSchema = {
    body: joi_1.default.object({
        channelName: joi_1.default.string().required().min(1).max(64),
        uid: joi_1.default.string().required().min(1).max(64),
        recordingConfig: joi_1.default.object({
            maxIdleTime: joi_1.default.number().integer().min(5).max(2592000).optional(),
            streamTypes: joi_1.default.number().integer().valid(0, 1, 2).optional(),
            audioProfile: joi_1.default.number().integer().valid(0, 1, 2).optional(),
            channelType: joi_1.default.number().integer().valid(0, 1).optional(),
            videoStreamType: joi_1.default.number().integer().valid(0, 1).optional(),
            subscribeVideoUids: joi_1.default.array().items(joi_1.default.string()).optional(),
            subscribeAudioUids: joi_1.default.array().items(joi_1.default.string()).optional()
        }).optional(),
        storageConfig: joi_1.default.object({
            vendor: joi_1.default.number().integer().valid(0, 1, 2).optional(),
            region: joi_1.default.number().integer().optional(),
            bucket: joi_1.default.string().optional(),
            accessKey: joi_1.default.string().optional(),
            secretKey: joi_1.default.string().optional(),
            fileNamePrefix: joi_1.default.array().items(joi_1.default.string()).optional()
        }).optional()
    })
};
const stopRecordingSchema = {
    body: joi_1.default.object({
        channelName: joi_1.default.string().required(),
        uid: joi_1.default.string().required(),
        resourceId: joi_1.default.string().required(),
        sid: joi_1.default.string().required()
    })
};
router.get('/config', agoraController_1.AgoraController.getConfig);
router.get('/health', agoraController_1.AgoraController.healthCheck);
router.post('/rtc/token', auth_1.authenticate, (0, validation_1.validate)(rtcTokenSchema), agoraController_1.AgoraController.generateRTCToken);
router.post('/token', auth_1.authenticate, (0, validation_1.validate)(rtcTokenSchema), agoraController_1.AgoraController.generateRTCToken);
router.post('/rtm/token', auth_1.authenticate, (0, validation_1.validate)(rtmTokenSchema), agoraController_1.AgoraController.generateRTMToken);
router.post('/recording/start', auth_1.authenticate, (0, auth_1.requireRole)(['SENIOR_MANAGER', 'JUNIOR_MANAGER', 'ADMIN']), (0, validation_1.validate)(startRecordingSchema), agoraController_1.AgoraController.startRecording);
router.post('/recording/stop', auth_1.authenticate, (0, auth_1.requireRole)(['SENIOR_MANAGER', 'JUNIOR_MANAGER', 'ADMIN']), (0, validation_1.validate)(stopRecordingSchema), agoraController_1.AgoraController.stopRecording);
router.get('/recording/:resourceId/:sid/status', auth_1.authenticate, (0, auth_1.requireRole)(['SENIOR_MANAGER', 'JUNIOR_MANAGER', 'ADMIN']), agoraController_1.AgoraController.getRecordingStatus);
exports.default = router;
//# sourceMappingURL=agoraRoutes.js.map
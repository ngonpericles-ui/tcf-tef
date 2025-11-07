"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgoraController = void 0;
const agoraService_1 = require("../services/agoraService");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class AgoraController {
    static async generateRTCToken(req, res) {
        try {
            const { channelName, uid, role, expiry } = req.body;
            if (!channelName) {
                throw new errors_1.ValidationError('Channel name is required');
            }
            if (!uid) {
                throw new errors_1.ValidationError('UID is required');
            }
            if (!role || !['publisher', 'subscriber'].includes(role)) {
                throw new errors_1.ValidationError('Role must be either "publisher" or "subscriber"');
            }
            const tokenResponse = agoraService_1.AgoraService.generateRTCToken({
                channelName,
                uid,
                role,
                tokenType: 'rtc',
                expiry: expiry ? parseInt(expiry) : 3600
            });
            res.status(200).json({
                success: true,
                data: tokenResponse,
                message: 'RTC token generated successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to generate RTC token', { body: req.body, error });
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
                        message: 'Failed to generate RTC token',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'TOKEN_GENERATION_ERROR'
                    }
                });
            }
        }
    }
    static async generateRTMToken(req, res) {
        try {
            const { uid, expiry } = req.body;
            if (!uid) {
                throw new errors_1.ValidationError('UID is required');
            }
            const tokenResponse = agoraService_1.AgoraService.generateRTMToken(uid, expiry ? parseInt(expiry) : 3600);
            res.status(200).json({
                success: true,
                data: tokenResponse,
                message: 'RTM token generated successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to generate RTM token', { body: req.body, error });
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
                        message: 'Failed to generate RTM token',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'TOKEN_GENERATION_ERROR'
                    }
                });
            }
        }
    }
    static async startRecording(req, res) {
        try {
            const { channelName, uid, recordingConfig, storageConfig } = req.body;
            if (!channelName) {
                throw new errors_1.ValidationError('Channel name is required');
            }
            if (!uid) {
                throw new errors_1.ValidationError('UID is required');
            }
            const recordingResponse = await agoraService_1.AgoraService.startCloudRecording({
                channelName,
                uid,
                recordingConfig: recordingConfig || {
                    maxIdleTime: 30,
                    streamTypes: 2,
                    audioProfile: 1,
                    channelType: 0,
                    videoStreamType: 0,
                    subscribeVideoUids: [],
                    subscribeAudioUids: []
                },
                storageConfig: storageConfig || {
                    vendor: 1,
                    region: 0,
                    bucket: process.env.AGORA_RECORDING_BUCKET || 'agora-recordings',
                    accessKey: process.env.AGORA_RECORDING_ACCESS_KEY || '',
                    secretKey: process.env.AGORA_RECORDING_SECRET_KEY || '',
                    fileNamePrefix: ['recordings']
                }
            });
            res.status(200).json({
                success: true,
                data: recordingResponse,
                message: 'Cloud recording started successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to start cloud recording', { body: req.body, error });
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
                        message: 'Failed to start cloud recording',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'RECORDING_START_ERROR'
                    }
                });
            }
        }
    }
    static async stopRecording(req, res) {
        try {
            const { channelName, uid, resourceId, sid } = req.body;
            if (!channelName || !uid || !resourceId || !sid) {
                throw new errors_1.ValidationError('Channel name, UID, resource ID, and SID are required');
            }
            const stopResponse = await agoraService_1.AgoraService.stopCloudRecording(channelName, uid, resourceId, sid);
            res.status(200).json({
                success: true,
                data: stopResponse,
                message: 'Cloud recording stopped successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to stop cloud recording', { body: req.body, error });
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
                        message: 'Failed to stop cloud recording',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'RECORDING_STOP_ERROR'
                    }
                });
            }
        }
    }
    static async getRecordingStatus(req, res) {
        try {
            const { resourceId, sid } = req.params;
            if (!resourceId || !sid) {
                throw new errors_1.ValidationError('Resource ID and SID are required');
            }
            const status = await agoraService_1.AgoraService.getRecordingStatus(resourceId, sid);
            res.status(200).json({
                success: true,
                data: status,
                message: 'Recording status retrieved successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get recording status', { params: req.params, error });
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
                        message: 'Failed to get recording status',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'RECORDING_STATUS_ERROR'
                    }
                });
            }
        }
    }
    static async getConfig(req, res) {
        try {
            const config = agoraService_1.AgoraService.getClientConfig();
            const validation = agoraService_1.AgoraService.validateConfiguration();
            res.status(200).json({
                success: true,
                data: {
                    ...config,
                    isConfigured: validation.isValid,
                    missingFields: validation.missingFields
                },
                message: 'Agora configuration retrieved successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get Agora configuration', { error });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to get Agora configuration',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'CONFIG_ERROR'
                }
            });
        }
    }
    static async healthCheck(req, res) {
        try {
            const validation = agoraService_1.AgoraService.validateConfiguration();
            res.status(200).json({
                success: true,
                data: {
                    service: 'agora',
                    status: validation.isValid ? 'healthy' : 'misconfigured',
                    features: {
                        rtcTokenGeneration: validation.isValid,
                        rtmTokenGeneration: validation.isValid,
                        cloudRecording: validation.isValid && !!process.env.AGORA_CUSTOMER_ID,
                        liveStreaming: validation.isValid
                    },
                    configuration: {
                        appIdConfigured: !!process.env.AGORA_APP_ID,
                        appCertificateConfigured: !!process.env.AGORA_APP_CERTIFICATE,
                        customerIdConfigured: !!process.env.AGORA_CUSTOMER_ID,
                        customerSecretConfigured: !!process.env.AGORA_CUSTOMER_SECRET
                    },
                    missingFields: validation.missingFields
                },
                message: validation.isValid ? 'Agora service is healthy' : 'Agora service needs configuration'
            });
        }
        catch (error) {
            logger_1.logger.error('Agora health check failed', { error });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Agora health check failed',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'HEALTH_CHECK_ERROR'
                }
            });
        }
    }
}
exports.AgoraController = AgoraController;
//# sourceMappingURL=agoraController.js.map
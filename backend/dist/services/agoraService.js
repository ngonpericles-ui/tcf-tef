"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgoraService = void 0;
const agora_token_1 = require("agora-token");
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class AgoraService {
    static generateRTCToken(request) {
        try {
            const { channelName, uid, role, expiry = 3600 } = request;
            if (!this.appId || !this.appCertificate) {
                throw new errors_1.ValidationError('Agora service is not configured. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE environment variables.');
            }
            if (!channelName) {
                throw new errors_1.ValidationError('Channel name is required');
            }
            if (!uid) {
                throw new errors_1.ValidationError('UID is required');
            }
            const agoraRole = role === 'publisher' ? agora_token_1.RtcRole.PUBLISHER : agora_token_1.RtcRole.SUBSCRIBER;
            const currentTime = Math.floor(Date.now() / 1000);
            const privilegeExpiredTs = currentTime + expiry;
            const token = agora_token_1.RtcTokenBuilder.buildTokenWithUid(this.appId, this.appCertificate, channelName, typeof uid === 'string' ? 0 : uid, agoraRole, privilegeExpiredTs, privilegeExpiredTs);
            logger_1.logger.info('RTC token generated successfully', {
                channelName,
                uid,
                role,
                expiry: privilegeExpiredTs
            });
            return {
                token,
                appId: this.appId,
                channelName,
                uid,
                role,
                expiry: privilegeExpiredTs,
                timestamp: currentTime
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate RTC token', { request, error });
            throw error;
        }
    }
    static generateRTMToken(uid, expiry = 3600) {
        try {
            if (!uid) {
                throw new errors_1.ValidationError('UID is required for RTM token');
            }
            const currentTime = Math.floor(Date.now() / 1000);
            const privilegeExpiredTs = currentTime + expiry;
            const token = agora_token_1.RtmTokenBuilder.buildToken(this.appId, this.appCertificate, uid, privilegeExpiredTs);
            logger_1.logger.info('RTM token generated successfully', { uid, expiry: privilegeExpiredTs });
            return {
                token,
                appId: this.appId,
                channelName: '',
                uid,
                role: 'rtm_user',
                expiry: privilegeExpiredTs,
                timestamp: currentTime
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate RTM token', { uid, error });
            throw error;
        }
    }
    static async startCloudRecording(config) {
        try {
            if (!this.customerId || !this.customerSecret) {
                throw new errors_1.ValidationError('Cloud recording is not configured. Customer ID and Secret are required.');
            }
            const resourceResponse = await this.acquireRecordingResource(config.channelName, config.uid);
            const resourceId = resourceResponse.resourceId;
            const startResponse = await this.startRecording(resourceId, config);
            logger_1.logger.info('Cloud recording started successfully', {
                channelName: config.channelName,
                resourceId,
                sid: startResponse.sid
            });
            return {
                resourceId,
                sid: startResponse.sid
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to start cloud recording', { config, error });
            throw error;
        }
    }
    static async stopCloudRecording(channelName, uid, resourceId, sid) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/v1/apps/${this.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`, {
                cname: channelName,
                uid,
                clientRequest: {}
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${Buffer.from(`${this.customerId}:${this.customerSecret}`).toString('base64')}`
                }
            });
            logger_1.logger.info('Cloud recording stopped successfully', {
                channelName,
                resourceId,
                sid,
                response: response.data
            });
            return {
                resourceId,
                sid,
                serverResponse: response.data.serverResponse
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to stop cloud recording', { channelName, resourceId, sid, error });
            throw error;
        }
    }
    static async getRecordingStatus(resourceId, sid) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/v1/apps/${this.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`, {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.customerId}:${this.customerSecret}`).toString('base64')}`
                }
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to get recording status', { resourceId, sid, error });
            throw error;
        }
    }
    static async acquireRecordingResource(channelName, uid) {
        const response = await axios_1.default.post(`${this.baseUrl}/v1/apps/${this.appId}/cloud_recording/acquire`, {
            cname: channelName,
            uid,
            clientRequest: {
                resourceExpiredHour: 24,
                scene: 0
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(`${this.customerId}:${this.customerSecret}`).toString('base64')}`
            }
        });
        return {
            resourceId: response.data.resourceId || ''
        };
    }
    static async startRecording(resourceId, config) {
        const response = await axios_1.default.post(`${this.baseUrl}/v1/apps/${this.appId}/cloud_recording/resourceid/${resourceId}/mode/mix/start`, {
            cname: config.channelName,
            uid: config.uid,
            clientRequest: {
                token: this.generateRTCToken({
                    channelName: config.channelName,
                    uid: config.uid,
                    role: 'publisher',
                    tokenType: 'rtc',
                    expiry: 3600
                }).token,
                recordingConfig: config.recordingConfig,
                storageConfig: config.storageConfig
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(`${this.customerId}:${this.customerSecret}`).toString('base64')}`
            }
        });
        return {
            sid: response.data.sid || ''
        };
    }
    static validateConfiguration() {
        const requiredFields = [
            { key: 'AGORA_APP_ID', value: this.appId },
            { key: 'AGORA_APP_CERTIFICATE', value: this.appCertificate }
        ];
        const missingFields = requiredFields
            .filter(field => !field.value)
            .map(field => field.key);
        return {
            isValid: missingFields.length === 0,
            missingFields
        };
    }
    static getClientConfig() {
        return {
            appId: this.appId,
            mode: 'rtc',
            codec: 'vp8'
        };
    }
}
exports.AgoraService = AgoraService;
AgoraService.appId = process.env.AGORA_APP_ID;
AgoraService.appCertificate = process.env.AGORA_APP_CERTIFICATE;
AgoraService.customerId = process.env.AGORA_CUSTOMER_ID;
AgoraService.customerSecret = process.env.AGORA_CUSTOMER_SECRET;
AgoraService.baseUrl = 'https://api.agora.io';
//# sourceMappingURL=agoraService.js.map
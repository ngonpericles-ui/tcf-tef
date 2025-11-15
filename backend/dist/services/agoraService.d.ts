export interface AgoraTokenRequest {
    channelName: string;
    uid: string | number;
    role: 'publisher' | 'subscriber';
    tokenType: 'rtc' | 'rtm';
    expiry?: number;
}
export interface AgoraTokenResponse {
    token: string;
    appId: string;
    channelName: string;
    uid: number;
    originalUid?: string | number;
    role: string;
    expiry: number;
    timestamp: number;
}
export interface LiveSessionConfig {
    channelName: string;
    uid: string;
    role: 'host' | 'audience';
    enableRecording?: boolean;
    maxParticipants?: number;
}
export interface CloudRecordingConfig {
    channelName: string;
    uid: string;
    recordingConfig: {
        maxIdleTime: number;
        streamTypes: number;
        audioProfile: number;
        channelType: number;
        videoStreamType: number;
        subscribeVideoUids: string[];
        subscribeAudioUids: string[];
    };
    storageConfig: {
        vendor: number;
        region: number;
        bucket: string;
        accessKey: string;
        secretKey: string;
        fileNamePrefix: string[];
    };
}
export declare class AgoraService {
    private static appId;
    private static appCertificate;
    private static customerId;
    private static customerSecret;
    private static baseUrl;
    static generateRTCToken(request: AgoraTokenRequest): AgoraTokenResponse;
    static generateRTMToken(uid: string, expiry?: number): AgoraTokenResponse;
    static startCloudRecording(config: CloudRecordingConfig): Promise<{
        resourceId: string;
        sid: string;
    }>;
    static stopCloudRecording(channelName: string, uid: string, resourceId: string, sid: string): Promise<{
        resourceId: string;
        sid: string;
        serverResponse: any;
    }>;
    static getRecordingStatus(resourceId: string, sid: string): Promise<any>;
    private static acquireRecordingResource;
    private static startRecording;
    static validateConfiguration(): {
        isValid: boolean;
        missingFields: string[];
    };
    static getClientConfig(): {
        appId: string;
        mode: string;
        codec: string;
    };
}
//# sourceMappingURL=agoraService.d.ts.map
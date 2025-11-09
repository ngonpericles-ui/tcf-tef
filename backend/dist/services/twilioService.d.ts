export declare class TwilioService {
    static isConfigured(): boolean;
    static sendSMS(to: string, message: string): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    static sendPasswordResetCode(phone: string, code: string, firstName?: string): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    static sendPasswordResetCodeEn(phone: string, code: string, firstName?: string): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
}
export default TwilioService;
//# sourceMappingURL=twilioService.d.ts.map
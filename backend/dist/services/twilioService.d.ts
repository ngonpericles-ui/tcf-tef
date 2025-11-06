export interface TwilioSMSData {
    to: string;
    message: string;
}
export interface TwilioEmailData {
    to: string;
    subject: string;
    body: string;
}
export declare class TwilioService {
    static sendSMS(data: TwilioSMSData): Promise<boolean>;
    static sendEmail(data: TwilioEmailData): Promise<boolean>;
    static sendSecureSessionNotification(phoneNumber: string, email: string, sessionTitle: string, instructorName: string, secureLink: string): Promise<{
        sms: boolean;
        email: boolean;
    }>;
}
//# sourceMappingURL=twilioService.d.ts.map
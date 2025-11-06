export declare class SecureSessionService {
    private static readonly JWT_SECRET;
    private static readonly TOKEN_EXPIRY_HOURS;
    static generateSecureToken(sessionId: string, studentId: string): string;
    static validateSecureToken(token: string): {
        valid: boolean;
        sessionId?: string;
        studentId?: string;
        error?: string;
    };
    static generateSecureLink(sessionId: string, studentId: string, baseUrl: string): string;
    static generateSessionCode(): string;
}
//# sourceMappingURL=secureSessionService.d.ts.map
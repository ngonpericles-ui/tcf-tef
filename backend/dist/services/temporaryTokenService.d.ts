declare global {
    var temporaryTokens: Map<string, any> | undefined;
}
interface TokenValidationResult {
    isValid: boolean;
    userId?: string;
    simulationId?: string;
    simulationType?: 'voice' | 'immigration';
    error?: string;
}
declare class TemporaryTokenService {
    static generateToken(userId: string, simulationId: string, simulationType: 'voice' | 'immigration', expirationHours?: number): Promise<string>;
    static validateToken(token: string): Promise<TokenValidationResult>;
    static invalidateToken(token: string): Promise<void>;
    static cleanupExpiredTokens(): Promise<void>;
    private static storeTokenData;
    private static getTokenData;
    private static deleteToken;
    private static verifySimulationExists;
}
export default TemporaryTokenService;
//# sourceMappingURL=temporaryTokenService.d.ts.map
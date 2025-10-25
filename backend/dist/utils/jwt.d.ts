import { JWTPayload, AuthTokens } from '../types';
import { UserRole, SubscriptionTier } from '@prisma/client';
export interface TokenPayload {
    userId: string;
    email: string;
    role: UserRole;
    subscriptionTier: SubscriptionTier;
}
export declare class JWTService {
    static generateAccessToken(payload: TokenPayload): string;
    static generateRefreshToken(payload: TokenPayload): string;
    static generateTokens(payload: TokenPayload): AuthTokens;
    static verifyAccessToken(token: string): JWTPayload;
    static verifyRefreshToken(token: string): {
        userId: string;
        email: string;
    };
    static decodeToken(token: string): any;
    static getTokenExpiration(token: string): Date | null;
    static isTokenExpired(token: string): boolean;
}
//# sourceMappingURL=jwt.d.ts.map
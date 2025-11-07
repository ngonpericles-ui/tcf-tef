import { LoginRequest, RegisterRequest, RefreshTokenRequest, AuthTokens, UserProfile } from '@/types';
export declare class AuthService {
    static register(data: RegisterRequest): Promise<{
        user: UserProfile;
        tokens: AuthTokens;
    }>;
    static registerAdmin(data: RegisterRequest): Promise<{
        user: UserProfile;
        tokens: AuthTokens;
    }>;
    static login(data: LoginRequest): Promise<{
        user: UserProfile;
        tokens: AuthTokens;
    }>;
    static refreshToken(data: RefreshTokenRequest): Promise<AuthTokens>;
    static logout(refreshToken: string): Promise<void>;
    static logoutAll(userId: string): Promise<void>;
    static getUserProfile(userId: string): Promise<UserProfile>;
    static updateUserActivity(userId: string): Promise<void>;
    static cleanupExpiredTokens(): Promise<void>;
    static authenticateWithGoogle(idToken: string): Promise<{
        success: boolean;
        error: {
            message: string;
            code: string;
        };
        data?: undefined;
    } | {
        success: boolean;
        data: {
            user: {
                email: string;
                id: string;
                firstName: string;
                lastName: string;
                role: import(".prisma/client").$Enums.UserRole;
                status: import(".prisma/client").$Enums.UserStatus;
                subscriptionTier: import(".prisma/client").$Enums.SubscriptionTier;
                currentLevel: string | null;
                profileImage: string | null;
                phone: string | null;
                dateOfBirth: Date | null;
                country: string | null;
                city: string | null;
                bio: string | null;
                preferences: import("@prisma/client/runtime/library").JsonValue | null;
                lastLoginAt: Date | null;
                lastActivityAt: Date | null;
                emailVerifiedAt: Date | null;
                socialAuthProvider: string | null;
                socialAuthId: string | null;
                profilePicture: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            tokens: AuthTokens;
        };
        error?: undefined;
    }>;
    static authenticateWithApple(idToken: string): Promise<{
        success: boolean;
        error: {
            message: string;
            code: string;
        };
        data?: undefined;
    } | {
        success: boolean;
        data: {
            user: {
                email: string;
                id: string;
                firstName: string;
                lastName: string;
                role: import(".prisma/client").$Enums.UserRole;
                status: import(".prisma/client").$Enums.UserStatus;
                subscriptionTier: import(".prisma/client").$Enums.SubscriptionTier;
                currentLevel: string | null;
                profileImage: string | null;
                phone: string | null;
                dateOfBirth: Date | null;
                country: string | null;
                city: string | null;
                bio: string | null;
                preferences: import("@prisma/client/runtime/library").JsonValue | null;
                lastLoginAt: Date | null;
                lastActivityAt: Date | null;
                emailVerifiedAt: Date | null;
                socialAuthProvider: string | null;
                socialAuthId: string | null;
                profilePicture: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            tokens: AuthTokens;
        };
        error?: undefined;
    }>;
    static authenticateWithFacebook(idToken: string): Promise<{
        success: boolean;
        error: {
            message: string;
            code: string;
        };
        data?: undefined;
    } | {
        success: boolean;
        data: {
            user: {
                email: string;
                id: string;
                firstName: string;
                lastName: string;
                role: import(".prisma/client").$Enums.UserRole;
                status: import(".prisma/client").$Enums.UserStatus;
                subscriptionTier: import(".prisma/client").$Enums.SubscriptionTier;
                currentLevel: string | null;
                profileImage: string | null;
                phone: string | null;
                dateOfBirth: Date | null;
                country: string | null;
                city: string | null;
                bio: string | null;
                preferences: import("@prisma/client/runtime/library").JsonValue | null;
                lastLoginAt: Date | null;
                lastActivityAt: Date | null;
                emailVerifiedAt: Date | null;
                socialAuthProvider: string | null;
                socialAuthId: string | null;
                profilePicture: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            tokens: AuthTokens;
        };
        error?: undefined;
    }>;
    private static verifyAppleToken;
    private static verifyFacebookToken;
    static googleAuth(data: {
        idToken: string;
        email: string;
        firstName: string;
        lastName: string;
        profileImage?: string;
    }): Promise<{
        success: boolean;
        user?: UserProfile;
        tokens?: AuthTokens;
        isNewUser?: boolean;
        error?: {
            message: string;
            code?: string;
        };
    }>;
    private static verifyGoogleToken;
}
//# sourceMappingURL=authService.d.ts.map
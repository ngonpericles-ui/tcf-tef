"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const connection_1 = require("@/database/connection");
const password_1 = require("@/utils/password");
const jwt_1 = require("@/utils/jwt");
const admin = __importStar(require("firebase-admin"));
const path_1 = __importDefault(require("path"));
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: privateKey,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
                }),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
            console.log('✅ Firebase Admin SDK initialized with environment variables');
        }
        else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            try {
                const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'base64').toString());
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id
                });
                console.log('✅ Firebase Admin SDK initialized with base64 JSON');
            }
            catch (parseError) {
                console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', parseError);
                throw parseError;
            }
        }
        else {
            const serviceAccountPath = path_1.default.join(__dirname, '../../tcftef-68b4c-firebase-adminsdk-fbsvc-49c8267271.json');
            if (require('fs').existsSync(serviceAccountPath)) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccountPath),
                    projectId: 'tcftef-68b4c'
                });
                console.log('✅ Firebase Admin SDK initialized with local JSON file');
            }
            else {
                console.warn('⚠️ Firebase credentials not found. Google authentication will not work.');
                console.warn('⚠️ Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables');
            }
        }
    }
    catch (error) {
        console.error('❌ Firebase initialization error:', error);
        console.warn('⚠️ Google authentication will not work.');
    }
}
const { ValidationError, ConflictError, NotFoundError, AuthenticationError } = require('../utils/errors.js');
const client_1 = require("@prisma/client");
const logger_1 = require("@/utils/logger");
class AuthService {
    static async register(data) {
        try {
            const existingUser = await connection_1.prisma.user.findUnique({
                where: { email: data.email.toLowerCase() }
            });
            if (existingUser) {
                logger_1.logger.warn('Registration attempt with existing email', { email: data.email });
                throw new ConflictError(`User with email ${data.email} already exists`);
            }
            const passwordValidation = password_1.PasswordService.validatePasswordStrength(data.password);
            if (!passwordValidation.isValid) {
                throw new ValidationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
            }
            const userRole = data.role ? client_1.UserRole[data.role] : client_1.UserRole.STUDENT;
            const passwordHash = await password_1.PasswordService.hashPassword(data.password, userRole);
            const user = await connection_1.prisma.user.create({
                data: {
                    email: data.email.toLowerCase(),
                    passwordHash,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    country: data.country,
                    role: userRole,
                    status: client_1.UserStatus.ACTIVE,
                    subscriptionTier: client_1.SubscriptionTier.FREE
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    subscriptionTier: true,
                    profileImage: true,
                    phone: true,
                    dateOfBirth: true,
                    country: true,
                    city: true,
                    bio: true,
                    preferences: true,
                    lastLoginAt: true,
                    lastActivityAt: true,
                    emailVerifiedAt: true,
                    socialAuthProvider: true,
                    socialAuthId: true,
                    profilePicture: true,
                    currentLevel: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role,
                subscriptionTier: user.subscriptionTier
            };
            const tokens = jwt_1.JWTService.generateTokens(tokenPayload);
            await connection_1.prisma.refreshToken.create({
                data: {
                    token: tokens.refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
            logger_1.logger.info('User registered successfully', { userId: user.id, email: user.email });
            return {
                user: {
                    ...user,
                    dateOfBirth: user.dateOfBirth || null,
                    lastActivityAt: user.lastActivityAt || null,
                    socialAuthProvider: user.socialAuthProvider || null,
                    socialAuthId: user.socialAuthId || null,
                    profilePicture: user.profilePicture || null,
                    currentLevel: user.currentLevel || 'A1'
                },
                tokens
            };
        }
        catch (error) {
            logger_1.logger.error('Registration failed', error);
            throw error;
        }
    }
    static async registerAdmin(data) {
        try {
            const existingUser = await connection_1.prisma.user.findUnique({
                where: { email: data.email.toLowerCase() }
            });
            if (existingUser) {
                throw new ValidationError('User with this email already exists');
            }
            const passwordHash = await password_1.PasswordService.hashPassword(data.password, 'ADMIN');
            const user = await connection_1.prisma.user.create({
                data: {
                    email: data.email.toLowerCase(),
                    passwordHash,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    country: data.country,
                    role: client_1.UserRole.ADMIN,
                    status: client_1.UserStatus.ACTIVE,
                    subscriptionTier: client_1.SubscriptionTier.PREMIUM
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    subscriptionTier: true,
                    profileImage: true,
                    phone: true,
                    dateOfBirth: true,
                    country: true,
                    city: true,
                    bio: true,
                    preferences: true,
                    lastLoginAt: true,
                    lastActivityAt: true,
                    emailVerifiedAt: true,
                    socialAuthProvider: true,
                    socialAuthId: true,
                    profilePicture: true,
                    currentLevel: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role,
                subscriptionTier: user.subscriptionTier
            };
            const tokens = jwt_1.JWTService.generateTokens(tokenPayload);
            await connection_1.prisma.refreshToken.create({
                data: {
                    token: tokens.refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
            logger_1.logger.info('Admin user registered successfully', { userId: user.id, email: user.email });
            return {
                user: {
                    ...user,
                    dateOfBirth: user.dateOfBirth || null,
                    lastActivityAt: user.lastActivityAt || null,
                    socialAuthProvider: user.socialAuthProvider || null,
                    socialAuthId: user.socialAuthId || null,
                    profilePicture: user.profilePicture || null,
                    currentLevel: user.currentLevel || 'A1'
                },
                tokens
            };
        }
        catch (error) {
            logger_1.logger.error('Admin registration failed', error);
            throw error;
        }
    }
    static async login(data) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Login attempt started', { email: data.email });
            const dbQueryStart = Date.now();
            const user = await connection_1.prisma.user.findUnique({
                where: { email: data.email.toLowerCase() },
                include: {
                    subscriptions: {
                        where: { status: 'ACTIVE' },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });
            const dbQueryTime = Date.now() - dbQueryStart;
            logger_1.logger.info('Database query completed', { email: data.email, queryTime: `${dbQueryTime}ms` });
            if (!user) {
                logger_1.logger.warn('Login attempt with non-existent email', { email: data.email });
                throw new AuthenticationError('Invalid email or password');
            }
            if (user.status === client_1.UserStatus.SUSPENDED) {
                logger_1.logger.warn('Login attempt with suspended account', { userId: user.id, email: user.email });
                throw new AuthenticationError('Account is suspended. Please contact support.');
            }
            if (user.status === client_1.UserStatus.INACTIVE) {
                logger_1.logger.warn('Login attempt with inactive account', { userId: user.id, email: user.email });
                throw new AuthenticationError('Account is inactive. Please contact support.');
            }
            const passwordVerifyStart = Date.now();
            const isPasswordValid = await password_1.PasswordService.verifyPassword(data.password, user.passwordHash);
            const passwordVerifyTime = Date.now() - passwordVerifyStart;
            logger_1.logger.info('Password verification completed', {
                email: data.email,
                role: user.role,
                verifyTime: `${passwordVerifyTime}ms`
            });
            if (!isPasswordValid) {
                logger_1.logger.warn('Login attempt with invalid password', { userId: user.id, email: user.email });
                throw new AuthenticationError('Invalid email or password');
            }
            await connection_1.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() }
            });
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role,
                subscriptionTier: user.subscriptionTier
            };
            const tokens = jwt_1.JWTService.generateTokens(tokenPayload);
            await connection_1.prisma.refreshToken.create({
                data: {
                    token: tokens.refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
            const { passwordHash, ...userProfile } = user;
            const totalTime = Date.now() - startTime;
            logger_1.logger.info('User logged in successfully', {
                userId: user.id,
                email: user.email,
                role: user.role,
                totalLoginTime: `${totalTime}ms`
            });
            return { user: userProfile, tokens };
        }
        catch (error) {
            const totalTime = Date.now() - startTime;
            logger_1.logger.error('Login failed', {
                email: data.email,
                totalTime: `${totalTime}ms`,
                error: error.message
            });
            throw error;
        }
    }
    static async refreshToken(data) {
        try {
            jwt_1.JWTService.verifyRefreshToken(data.refreshToken);
            const storedToken = await connection_1.prisma.refreshToken.findUnique({
                where: { token: data.refreshToken },
                include: { user: true }
            });
            if (!storedToken) {
                throw new AuthenticationError('Invalid refresh token');
            }
            if (storedToken.expiresAt < new Date()) {
                await connection_1.prisma.refreshToken.delete({
                    where: { id: storedToken.id }
                });
                throw new AuthenticationError('Refresh token expired');
            }
            if (!storedToken.user || storedToken.user.status !== client_1.UserStatus.ACTIVE) {
                throw new AuthenticationError('User account is not active');
            }
            const tokenPayload = {
                userId: storedToken.user.id,
                email: storedToken.user.email,
                role: storedToken.user.role,
                subscriptionTier: storedToken.user.subscriptionTier
            };
            const tokens = jwt_1.JWTService.generateTokens(tokenPayload);
            await connection_1.prisma.refreshToken.update({
                where: { id: storedToken.id },
                data: {
                    token: tokens.refreshToken,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
            logger_1.logger.info('Token refreshed successfully', { userId: storedToken.user.id });
            return tokens;
        }
        catch (error) {
            logger_1.logger.error('Token refresh failed', error);
            throw error;
        }
    }
    static async logout(refreshToken) {
        try {
            const deletedToken = await connection_1.prisma.refreshToken.deleteMany({
                where: { token: refreshToken }
            });
            if (deletedToken.count === 0) {
                logger_1.logger.warn('Attempted to logout with invalid refresh token');
            }
            else {
                logger_1.logger.info('User logged out successfully');
            }
        }
        catch (error) {
            logger_1.logger.error('Logout failed', error);
            throw error;
        }
    }
    static async logoutAll(userId) {
        try {
            await connection_1.prisma.refreshToken.deleteMany({
                where: { userId }
            });
            logger_1.logger.info('User logged out from all devices', { userId });
        }
        catch (error) {
            logger_1.logger.error('Logout all failed', error);
            throw error;
        }
    }
    static async getUserProfile(userId) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    subscriptions: {
                        where: { status: 'ACTIVE' },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });
            if (!user) {
                throw new NotFoundError('User not found');
            }
            const { passwordHash, ...userProfile } = user;
            return userProfile;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user profile', error);
            throw error;
        }
    }
    static async updateUserActivity(userId) {
        try {
            await connection_1.prisma.user.update({
                where: { id: userId },
                data: {
                    lastActivityAt: new Date()
                }
            });
            logger_1.logger.debug('User activity updated', { userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to update user activity', error);
        }
    }
    static async cleanupExpiredTokens() {
        try {
            const result = await connection_1.prisma.refreshToken.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    }
                }
            });
            logger_1.logger.info(`Cleaned up ${result.count} expired refresh tokens`);
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup expired tokens', error);
        }
    }
    static async authenticateWithGoogle(idToken) {
        try {
            const googleUserInfo = await this.verifyGoogleToken(idToken);
            if (!googleUserInfo) {
                return {
                    success: false,
                    error: { message: 'Invalid Google token', code: 'INVALID_TOKEN' }
                };
            }
            let user = await connection_1.prisma.user.findUnique({
                where: { email: googleUserInfo.email }
            });
            if (!user) {
                user = await connection_1.prisma.user.create({
                    data: {
                        email: googleUserInfo.email,
                        firstName: googleUserInfo.given_name || 'User',
                        lastName: googleUserInfo.family_name || '',
                        profileImage: googleUserInfo.picture,
                        role: client_1.UserRole.STUDENT,
                        status: client_1.UserStatus.ACTIVE,
                        subscriptionTier: client_1.SubscriptionTier.FREE,
                        emailVerifiedAt: new Date(),
                        passwordHash: null
                    }
                });
            }
            else {
                if (!user.profileImage && googleUserInfo.picture) {
                    user = await connection_1.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            profileImage: googleUserInfo.picture,
                        }
                    });
                }
            }
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role,
                subscriptionTier: user.subscriptionTier
            };
            const tokens = jwt_1.JWTService.generateTokens(tokenPayload);
            await connection_1.prisma.refreshToken.create({
                data: {
                    token: tokens.refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
            const { passwordHash, ...userResponse } = user;
            return {
                success: true,
                data: {
                    user: userResponse,
                    tokens
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Google authentication failed', error);
            return {
                success: false,
                error: { message: 'Google authentication failed', code: 'GOOGLE_AUTH_ERROR' }
            };
        }
    }
    static async authenticateWithApple(idToken) {
        try {
            const appleUserInfo = await this.verifyAppleToken(idToken);
            if (!appleUserInfo) {
                return {
                    success: false,
                    error: { message: 'Invalid Apple token', code: 'INVALID_TOKEN' }
                };
            }
            let user = await connection_1.prisma.user.findUnique({
                where: { email: appleUserInfo.email }
            });
            if (!user) {
                user = await connection_1.prisma.user.create({
                    data: {
                        email: appleUserInfo.email,
                        firstName: appleUserInfo.name?.firstName || 'User',
                        lastName: appleUserInfo.name?.lastName || '',
                        role: client_1.UserRole.STUDENT,
                        status: client_1.UserStatus.ACTIVE,
                        subscriptionTier: client_1.SubscriptionTier.FREE,
                        emailVerifiedAt: new Date(),
                        passwordHash: null
                    }
                });
            }
            else {
                user = await connection_1.prisma.user.update({
                    where: { id: user.id },
                    data: {}
                });
            }
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role,
                subscriptionTier: user.subscriptionTier
            };
            const tokens = jwt_1.JWTService.generateTokens(tokenPayload);
            await connection_1.prisma.refreshToken.create({
                data: {
                    token: tokens.refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
            const { passwordHash, ...userResponse } = user;
            return {
                success: true,
                data: {
                    user: userResponse,
                    tokens
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Apple authentication failed', error);
            return {
                success: false,
                error: { message: 'Apple authentication failed', code: 'APPLE_AUTH_ERROR' }
            };
        }
    }
    static async authenticateWithFacebook(idToken) {
        try {
            const facebookUserInfo = await this.verifyFacebookToken(idToken);
            if (!facebookUserInfo) {
                return {
                    success: false,
                    error: { message: 'Invalid Facebook token', code: 'INVALID_TOKEN' }
                };
            }
            let user = await connection_1.prisma.user.findUnique({
                where: { email: facebookUserInfo.email }
            });
            if (!user) {
                user = await connection_1.prisma.user.create({
                    data: {
                        email: facebookUserInfo.email,
                        firstName: facebookUserInfo.first_name || 'User',
                        lastName: facebookUserInfo.last_name || '',
                        profileImage: facebookUserInfo.picture?.data?.url,
                        role: client_1.UserRole.STUDENT,
                        status: client_1.UserStatus.ACTIVE,
                        subscriptionTier: client_1.SubscriptionTier.FREE,
                        emailVerifiedAt: new Date(),
                        passwordHash: null
                    }
                });
            }
            else {
                if (!user.profileImage && facebookUserInfo.picture?.data?.url) {
                    user = await connection_1.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            profileImage: facebookUserInfo.picture.data.url,
                        }
                    });
                }
            }
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role,
                subscriptionTier: user.subscriptionTier
            };
            const tokens = jwt_1.JWTService.generateTokens(tokenPayload);
            await connection_1.prisma.refreshToken.create({
                data: {
                    token: tokens.refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
            const { passwordHash, ...userResponse } = user;
            return {
                success: true,
                data: {
                    user: userResponse,
                    tokens
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Facebook authentication failed', error);
            return {
                success: false,
                error: { message: 'Facebook authentication failed', code: 'FACEBOOK_AUTH_ERROR' }
            };
        }
    }
    static async verifyAppleToken(idToken) {
        try {
            if (idToken.startsWith('mock_apple_')) {
                return {
                    email: 'user@privaterelay.appleid.com',
                    name: {
                        firstName: 'John',
                        lastName: 'Doe'
                    }
                };
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Apple token verification failed', error);
            return null;
        }
    }
    static async verifyFacebookToken(accessToken) {
        try {
            if (accessToken.startsWith('mock_facebook_')) {
                return {
                    email: 'user@facebook.com',
                    first_name: 'John',
                    last_name: 'Doe',
                    picture: {
                        data: {
                            url: 'https://example.com/avatar.jpg'
                        }
                    }
                };
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Facebook token verification failed', error);
            return null;
        }
    }
    static async googleAuth(data) {
        try {
            const googleUser = await this.verifyGoogleToken(data.idToken);
            if (!googleUser || googleUser.email !== data.email) {
                logger_1.logger.warn('Google token verification failed', { email: data.email });
                return {
                    success: false,
                    error: {
                        message: 'Invalid Google token',
                        code: 'INVALID_TOKEN'
                    }
                };
            }
            let user = await connection_1.prisma.user.findUnique({
                where: { email: data.email.toLowerCase() }
            });
            let isNewUser = false;
            if (!user) {
                user = await connection_1.prisma.user.create({
                    data: {
                        email: data.email.toLowerCase(),
                        firstName: data.firstName,
                        lastName: data.lastName,
                        passwordHash: '',
                        role: client_1.UserRole.STUDENT,
                        status: client_1.UserStatus.ACTIVE,
                        subscriptionTier: client_1.SubscriptionTier.FREE,
                        profileImage: data.profileImage,
                        emailVerifiedAt: new Date(),
                        lastLoginAt: new Date()
                    }
                });
                isNewUser = true;
                logger_1.logger.info('User registered successfully with Google', {
                    userId: user.id,
                    email: user.email
                });
            }
            else {
                user = await connection_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastLoginAt: new Date(),
                        ...(data.profileImage && { profileImage: data.profileImage })
                    }
                });
                logger_1.logger.info('User logged in successfully with Google', {
                    userId: user.id,
                    email: user.email
                });
            }
            if (user.role !== client_1.UserRole.STUDENT) {
                logger_1.logger.warn('Non-student attempted Google authentication', {
                    userId: user.id,
                    role: user.role
                });
                return {
                    success: false,
                    error: {
                        message: 'Google authentication is only available for students',
                        code: 'INVALID_ROLE'
                    }
                };
            }
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role,
                subscriptionTier: user.subscriptionTier
            };
            const accessToken = jwt_1.JWTService.generateAccessToken(tokenPayload);
            const refreshToken = jwt_1.JWTService.generateRefreshToken(tokenPayload);
            await connection_1.prisma.refreshToken.create({
                data: {
                    token: refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            });
            const { passwordHash, ...userProfile } = user;
            const completeUserProfile = {
                ...userProfile,
                dateOfBirth: userProfile.dateOfBirth || null,
                preferences: userProfile.preferences || null
            };
            return {
                success: true,
                user: completeUserProfile,
                tokens: { accessToken, refreshToken },
                isNewUser
            };
        }
        catch (error) {
            logger_1.logger.error('Google authentication failed', error);
            return {
                success: false,
                error: {
                    message: error.message || 'Google authentication failed',
                    code: 'GOOGLE_AUTH_ERROR'
                }
            };
        }
    }
    static async verifyGoogleToken(idToken) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            if (!decodedToken) {
                logger_1.logger.warn('Firebase token verification failed: No decoded token');
                return null;
            }
            logger_1.logger.info('Firebase token verified successfully', {
                email: decodedToken.email,
                emailVerified: decodedToken.email_verified,
                uid: decodedToken.uid
            });
            return {
                email: decodedToken.email,
                email_verified: decodedToken.email_verified,
                given_name: decodedToken.name?.split(' ')[0] || '',
                family_name: decodedToken.name?.split(' ').slice(1).join(' ') || '',
                picture: decodedToken.picture,
                uid: decodedToken.uid
            };
        }
        catch (error) {
            logger_1.logger.error('Firebase token verification failed', error);
            return null;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map
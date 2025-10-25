"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
class JWTService {
    static generateAccessToken(payload) {
        try {
            return jsonwebtoken_1.default.sign({
                id: payload.userId,
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                subscriptionTier: payload.subscriptionTier,
                type: 'access'
            }, environment_1.config.jwtSecret, {
                expiresIn: '24h',
                issuer: 'tcf-tef-api',
                audience: 'tcf-tef-app'
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating access token', error);
            throw new Error('Failed to generate access token');
        }
    }
    static generateRefreshToken(payload) {
        try {
            return jsonwebtoken_1.default.sign({
                userId: payload.userId,
                email: payload.email,
                type: 'refresh'
            }, environment_1.config.jwtRefreshSecret, {
                expiresIn: '7d',
                issuer: 'tcf-tef-api',
                audience: 'tcf-tef-app'
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating refresh token', error);
            throw new Error('Failed to generate refresh token');
        }
    }
    static generateTokens(payload) {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload)
        };
    }
    static verifyAccessToken(token) {
        try {
            console.log('🔍 JWT DEBUG: Verifying token');
            console.log('🔍 JWT DEBUG: Token length:', token.length);
            console.log('🔍 JWT DEBUG: JWT Secret length:', environment_1.config.jwtSecret.length);
            console.log('🔍 JWT DEBUG: JWT Secret preview:', environment_1.config.jwtSecret.substring(0, 10) + '...');
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.config.jwtSecret, {
                issuer: 'tcf-tef-api',
                audience: 'tcf-tef-app'
            });
            if (decoded.type !== 'access') {
                throw new Error('Invalid token type');
            }
            console.log('✅ JWT DEBUG: Token verified successfully');
            console.log('🔍 JWT DEBUG: User ID:', decoded.userId);
            return {
                id: decoded.id || decoded.userId,
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                subscriptionTier: decoded.subscriptionTier,
                iat: decoded.iat,
                exp: decoded.exp
            };
        }
        catch (error) {
            console.log('❌ JWT DEBUG: Token verification failed');
            console.log('❌ JWT DEBUG: Error:', error instanceof Error ? error.message : error);
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid token');
            }
            else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Token expired');
            }
            else {
                logger_1.logger.error('Error verifying access token', error);
                throw new Error('Token verification failed');
            }
        }
    }
    static verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.config.jwtRefreshSecret, {
                issuer: 'tcf-tef-api',
                audience: 'tcf-tef-app'
            });
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            return {
                userId: decoded.userId,
                email: decoded.email
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid refresh token');
            }
            else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Refresh token expired');
            }
            else {
                logger_1.logger.error('Error verifying refresh token', error);
                throw new Error('Refresh token verification failed');
            }
        }
    }
    static decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            logger_1.logger.error('Error decoding token', error);
            return null;
        }
    }
    static getTokenExpiration(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (decoded && decoded.exp) {
                return new Date(decoded.exp * 1000);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Error getting token expiration', error);
            return null;
        }
    }
    static isTokenExpired(token) {
        const expiration = this.getTokenExpiration(token);
        if (!expiration)
            return true;
        return expiration < new Date();
    }
}
exports.JWTService = JWTService;
//# sourceMappingURL=jwt.js.map
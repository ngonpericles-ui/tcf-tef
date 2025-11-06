"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureSessionService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
class SecureSessionService {
    static generateSecureToken(sessionId, studentId) {
        const payload = {
            sessionId,
            studentId,
            type: 'one-on-one-session',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (this.TOKEN_EXPIRY_HOURS * 60 * 60)
        };
        return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET);
    }
    static validateSecureToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
            if (decoded.type !== 'one-on-one-session') {
                return { valid: false, error: 'Invalid token type' };
            }
            return {
                valid: true,
                sessionId: decoded.sessionId,
                studentId: decoded.studentId
            };
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                return { valid: false, error: 'Token has expired' };
            }
            else if (error.name === 'JsonWebTokenError') {
                return { valid: false, error: 'Invalid token' };
            }
            else {
                return { valid: false, error: 'Token validation failed' };
            }
        }
    }
    static generateSecureLink(sessionId, studentId, baseUrl) {
        const token = this.generateSecureToken(sessionId, studentId);
        return `${baseUrl}/session/${token}`;
    }
    static generateSessionCode() {
        return crypto_1.default.randomBytes(6).toString('hex').toUpperCase();
    }
}
exports.SecureSessionService = SecureSessionService;
SecureSessionService.JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
SecureSessionService.TOKEN_EXPIRY_HOURS = 1.5;
//# sourceMappingURL=secureSessionService.js.map
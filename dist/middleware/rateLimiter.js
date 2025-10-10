"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRateLimit = exports.apiRateLimit = exports.authRateLimit = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rateLimiter = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: {
            success: false,
            error: {
                message: 'Too many requests from this IP, please try again later.',
                code: 'RATE_LIMIT_EXCEEDED'
            }
        },
        standardHeaders: true,
        legacyHeaders: false,
        ...options
    };
    return (0, express_rate_limit_1.default)(defaultOptions);
};
exports.rateLimiter = rateLimiter;
exports.authRateLimit = (0, exports.rateLimiter)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: {
            message: 'Too many authentication attempts, please try again later.',
            code: 'AUTH_RATE_LIMIT_EXCEEDED'
        }
    }
});
exports.apiRateLimit = (0, exports.rateLimiter)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: {
            message: 'Too many API requests, please try again later.',
            code: 'API_RATE_LIMIT_EXCEEDED'
        }
    }
});
exports.uploadRateLimit = (0, exports.rateLimiter)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        error: {
            message: 'Too many upload requests, please try again later.',
            code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
        }
    }
});
//# sourceMappingURL=rateLimiter.js.map
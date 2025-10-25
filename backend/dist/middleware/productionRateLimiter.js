"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productionConfig = exports.createSubscriptionBasedRateLimit = exports.aiChatRateLimit = exports.uploadRateLimit = exports.sensitiveRateLimit = exports.authRateLimit = exports.generalRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.generalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: process.env.REDIS_URL ? undefined : undefined,
    keyGenerator: (req) => {
        const userId = req.user?.userId;
        return userId ? `user:${userId}` : `ip:${req.ip}`;
    },
    skip: (req) => {
        const user = req.user;
        if (user?.subscriptionTier === 'PRO' || user?.subscriptionTier === 'PRO+') {
            return true;
        }
        return false;
    }
});
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `auth:${req.ip}`,
    skipSuccessfulRequests: true
});
exports.sensitiveRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        error: 'Too many sensitive operation attempts, please try again later.',
        retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `sensitive:${req.ip}`
});
exports.uploadRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: {
        error: 'Too many file uploads, please try again later.',
        retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const userId = req.user?.userId;
        return userId ? `upload:${userId}` : `upload:${req.ip}`;
    }
});
exports.aiChatRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: {
        error: 'AI chat rate limit exceeded, please try again later.',
        retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const userId = req.user?.userId;
        return userId ? `ai:${userId}` : `ai:${req.ip}`;
    },
    skip: (req) => {
        const user = req.user;
        if (user?.subscriptionTier === 'PRO' || user?.subscriptionTier === 'PRO+') {
            return false;
        }
        return false;
    }
});
const createSubscriptionBasedRateLimit = (baseLimit) => {
    return (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: (req) => {
            const user = req.user;
            if (!user)
                return baseLimit;
            switch (user.subscriptionTier) {
                case 'FREE':
                    return baseLimit;
                case 'ESSENTIAL':
                    return baseLimit * 2;
                case 'PREMIUM':
                    return baseLimit * 5;
                case 'PRO':
                case 'PRO+':
                    return baseLimit * 10;
                default:
                    return baseLimit;
            }
        },
        message: {
            error: 'Rate limit exceeded for your subscription tier.',
            retryAfter: 900
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            const userId = req.user?.userId;
            return userId ? `sub:${userId}` : `sub:${req.ip}`;
        }
    });
};
exports.createSubscriptionBasedRateLimit = createSubscriptionBasedRateLimit;
exports.productionConfig = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0')
    },
    tiers: {
        free: {
            requestsPerMinute: 10,
            requestsPerHour: 100,
            requestsPerDay: 1000
        },
        essential: {
            requestsPerMinute: 20,
            requestsPerHour: 500,
            requestsPerDay: 5000
        },
        premium: {
            requestsPerMinute: 50,
            requestsPerHour: 2000,
            requestsPerDay: 20000
        },
        pro: {
            requestsPerMinute: 100,
            requestsPerHour: 5000,
            requestsPerDay: 50000
        }
    },
    global: {
        maxRequestsPerSecond: 10000,
        maxConcurrentUsers: 1000000,
        emergencyThreshold: 0.9
    }
};
exports.default = {
    generalRateLimit: exports.generalRateLimit,
    authRateLimit: exports.authRateLimit,
    sensitiveRateLimit: exports.sensitiveRateLimit,
    uploadRateLimit: exports.uploadRateLimit,
    aiChatRateLimit: exports.aiChatRateLimit,
    createSubscriptionBasedRateLimit: exports.createSubscriptionBasedRateLimit,
    productionConfig: exports.productionConfig
};
//# sourceMappingURL=productionRateLimiter.js.map
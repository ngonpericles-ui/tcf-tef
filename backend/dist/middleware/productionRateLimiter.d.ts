export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const sensitiveRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const uploadRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const aiChatRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const createSubscriptionBasedRateLimit: (baseLimit: number) => import("express-rate-limit").RateLimitRequestHandler;
export declare const productionConfig: {
    redis: {
        host: string;
        port: number;
        password: string;
        db: number;
    };
    tiers: {
        free: {
            requestsPerMinute: number;
            requestsPerHour: number;
            requestsPerDay: number;
        };
        essential: {
            requestsPerMinute: number;
            requestsPerHour: number;
            requestsPerDay: number;
        };
        premium: {
            requestsPerMinute: number;
            requestsPerHour: number;
            requestsPerDay: number;
        };
        pro: {
            requestsPerMinute: number;
            requestsPerHour: number;
            requestsPerDay: number;
        };
    };
    global: {
        maxRequestsPerSecond: number;
        maxConcurrentUsers: number;
        emergencyThreshold: number;
    };
};
declare const _default: {
    generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    sensitiveRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    uploadRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    aiChatRateLimit: import("express-rate-limit").RateLimitRequestHandler;
    createSubscriptionBasedRateLimit: (baseLimit: number) => import("express-rate-limit").RateLimitRequestHandler;
    productionConfig: {
        redis: {
            host: string;
            port: number;
            password: string;
            db: number;
        };
        tiers: {
            free: {
                requestsPerMinute: number;
                requestsPerHour: number;
                requestsPerDay: number;
            };
            essential: {
                requestsPerMinute: number;
                requestsPerHour: number;
                requestsPerDay: number;
            };
            premium: {
                requestsPerMinute: number;
                requestsPerHour: number;
                requestsPerDay: number;
            };
            pro: {
                requestsPerMinute: number;
                requestsPerHour: number;
                requestsPerDay: number;
            };
        };
        global: {
            maxRequestsPerSecond: number;
            maxConcurrentUsers: number;
            emergencyThreshold: number;
        };
    };
};
export default _default;
//# sourceMappingURL=productionRateLimiter.d.ts.map
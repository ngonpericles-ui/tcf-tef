interface RateLimiterOptions {
    windowMs?: number;
    max?: number;
    message?: any;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
}
export declare const rateLimiter: (options?: RateLimiterOptions) => import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const apiRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const uploadRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export {};
//# sourceMappingURL=rateLimiter.d.ts.map
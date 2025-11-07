interface Config {
    port: number;
    nodeEnv: string;
    databaseUrl: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshSecret: string;
    jwtRefreshExpiresIn: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    redisUrl: string;
    maxFileSize: number;
    uploadPath: string;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    corsOrigin: string;
    logLevel: string;
    logFile: string;
    stripeSecretKey: string;
    stripeWebhookSecret: string;
    openaiApiKey: string;
}
export declare const config: Config;
export {};
//# sourceMappingURL=environment.d.ts.map
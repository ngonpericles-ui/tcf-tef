"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const productionRateLimiter_1 = require("./middleware/productionRateLimiter");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const http_1 = require("http");
const environment_1 = require("./config/environment");
const logger_1 = require("./utils/logger");
const swagger_1 = require("./config/swagger");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const auth_1 = require("./routes/auth");
const users_1 = require("./routes/users");
const courses_1 = require("./routes/courses");
const tests_1 = require("./routes/tests");
const subscriptions_1 = require("./routes/subscriptions");
const liveSessions_1 = require("./routes/liveSessions");
const notifications_1 = require("./routes/notifications");
const content_1 = require("./routes/content");
const analytics_1 = require("./routes/analytics");
const health_1 = require("./routes/health");
const admin_1 = require("./routes/admin");
const manager_1 = require("./routes/manager");
const posts_1 = require("./routes/posts");
const favorites_1 = require("./routes/favorites");
const searchRoutes_1 = __importDefault(require("./routes/searchRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const courseContentRoutes_1 = __importDefault(require("./routes/courseContentRoutes"));
const fileUploadRoutes_1 = __importDefault(require("./routes/fileUploadRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const agoraRoutes_1 = __importDefault(require("./routes/agoraRoutes"));
const aiChat_1 = __importDefault(require("./routes/aiChat"));
const voiceSimulation_1 = __importDefault(require("./routes/voiceSimulation"));
const immigrationSimulation_1 = __importDefault(require("./routes/immigrationSimulation"));
const floatingAiAssistant_1 = __importDefault(require("./routes/floatingAiAssistant"));
const requestLogger_1 = require("./middleware/requestLogger");
const simulations_1 = __importDefault(require("./routes/simulations"));
const ai_1 = __importDefault(require("./routes/ai"));
const marketplaceRoutes_1 = __importDefault(require("./routes/marketplaceRoutes"));
const marketplace_1 = __importDefault(require("./routes/marketplace"));
const contentManagement_1 = __importDefault(require("./routes/contentManagement"));
const messages_1 = __importDefault(require("./routes/messages"));
const aiAssistant_1 = __importDefault(require("./routes/aiAssistant"));
const enhancedFileManagement_1 = __importDefault(require("./routes/enhancedFileManagement"));
const likes_1 = __importDefault(require("./routes/likes"));
const home_1 = __importDefault(require("./routes/home"));
const challenges_1 = __importDefault(require("./routes/challenges"));
const achievements_1 = __importDefault(require("./routes/achievements"));
const teachers_1 = require("./routes/teachers");
const userActivity_1 = __importDefault(require("./routes/userActivity"));
const moderation_1 = __importDefault(require("./routes/moderation"));
const chatRoomService_1 = require("./services/chatRoomService");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        environment_1.config.corsOrigin
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: environment_1.config.rateLimitWindowMs,
    max: environment_1.config.rateLimitMaxRequests,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(environment_1.config.rateLimitWindowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        if (environment_1.config.nodeEnv === 'development') {
            console.log('🔓 Rate limiting skipped for development');
            return true;
        }
        return false;
    },
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || 'unknown';
    }
});
if (environment_1.config.nodeEnv === 'production') {
    app.use('/api/', productionRateLimiter_1.generalRateLimit);
    app.use('/api/auth/', productionRateLimiter_1.authRateLimit);
    app.use('/api/auth/reset-password', productionRateLimiter_1.sensitiveRateLimit);
    app.use('/api/auth/change-password', productionRateLimiter_1.sensitiveRateLimit);
    app.use('/api/upload/', productionRateLimiter_1.uploadRateLimit);
    app.use('/api/ai-chat/', productionRateLimiter_1.aiChatRateLimit);
    console.log('🔒 Production rate limiting enabled with tiered limits');
}
else {
    app.use('/api/', limiter);
    console.log('🔓 Development rate limiting enabled (relaxed limits)');
}
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => logger_1.logger.info(message.trim())
    }
}));
app.use(requestLogger_1.requestLogger);
app.use(requestLogger_1.performanceMonitor);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TCF/TEF API Documentation'
}));
app.use('/health', health_1.healthRoutes);
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/users', users_1.userRoutes);
app.use('/api/courses', courses_1.courseRoutes);
app.use('/api/tests', tests_1.testRoutes);
app.use('/api/subscriptions', subscriptions_1.subscriptionRoutes);
app.use('/api/live-sessions', liveSessions_1.liveSessionRoutes);
app.use('/api/notifications', notifications_1.notificationRoutes);
app.use('/api/content', content_1.contentRoutes);
app.use('/api/analytics', analytics_1.analyticsRoutes);
app.use('/api/admin', admin_1.adminRoutes);
app.use('/api/manager', manager_1.managerRoutes);
app.use('/api/posts', posts_1.postRoutes);
app.use('/api/favorites', favorites_1.favoriteRoutes);
app.use('/api/search', searchRoutes_1.default);
app.use('/api', commentRoutes_1.default);
app.use('/api/course-content', courseContentRoutes_1.default);
app.use('/api/upload', fileUploadRoutes_1.default);
app.use('/api/files', fileUploadRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
app.use('/api/agora', agoraRoutes_1.default);
app.use('/api/ai-chat', aiChat_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/voice-simulation', voiceSimulation_1.default);
app.use('/api/immigration-simulation', immigrationSimulation_1.default);
app.use('/api/floating-ai-assistant', floatingAiAssistant_1.default);
app.use('/api/simulations', simulations_1.default);
app.use('/api', marketplaceRoutes_1.default);
app.use('/api/marketplace', marketplace_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/content-management', contentManagement_1.default);
app.use('/api/ai-assistant', aiAssistant_1.default);
app.use('/api/file-management', enhancedFileManagement_1.default);
app.use('/api/likes', likes_1.default);
app.use('/api/home', home_1.default);
app.use('/api/challenges', challenges_1.default);
app.use('/api/achievements', achievements_1.default);
app.use('/api/teachers', teachers_1.teacherRoutes);
app.use('/api/user', userActivity_1.default);
app.use('/api', moderation_1.default);
app.use('/uploads', express_1.default.static('uploads'));
app.use(notFoundHandler_1.notFoundHandler);
app.use(requestLogger_1.errorLogger);
app.use(errorHandler_1.errorHandler);
chatRoomService_1.chatRoomService.initialize(server);
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const PORT = environment_1.config.port || 3001;
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Environment: ${environment_1.config.nodeEnv}`);
        console.log(`🔗 Database: ${environment_1.config.databaseUrl ? 'Connected' : 'Not configured'}`);
        console.log(`💬 Socket.IO chat service initialized`);
        logger_1.logger.info(`🚀 Server running on port ${PORT}`);
        logger_1.logger.info(`📊 Environment: ${environment_1.config.nodeEnv}`);
        logger_1.logger.info(`🔗 Database: ${environment_1.config.databaseUrl ? 'Connected' : 'Not configured'}`);
        logger_1.logger.info(`💬 Socket.IO chat service initialized`);
    });
    process.on('SIGTERM', () => {
        logger_1.logger.info('SIGTERM received, shutting down gracefully');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        logger_1.logger.info('SIGINT received, shutting down gracefully');
        process.exit(0);
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map
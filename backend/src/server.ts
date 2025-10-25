import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { generalRateLimit, authRateLimit, sensitiveRateLimit, uploadRateLimit, aiChatRateLimit } from './middleware/productionRateLimiter';
import swaggerUi from 'swagger-ui-express';
import { createServer } from 'http';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { courseRoutes } from './routes/courses';
import { testRoutes } from './routes/tests';
import { subscriptionRoutes } from './routes/subscriptions';
import { liveSessionRoutes } from './routes/liveSessions';
import { notificationRoutes } from './routes/notifications';
import { contentRoutes } from './routes/content';
import { analyticsRoutes } from './routes/analytics';
import { healthRoutes } from './routes/health';
import { adminRoutes } from './routes/admin';
import { managerRoutes } from './routes/manager';
import { postRoutes } from './routes/posts';
import { favoriteRoutes } from './routes/favorites';
import searchRoutes from './routes/searchRoutes';
import commentRoutes from './routes/commentRoutes';
import courseContentRoutes from './routes/courseContentRoutes';
import fileUploadRoutes from './routes/fileUploadRoutes';
import paymentRoutes from './routes/paymentRoutes';
import agoraRoutes from './routes/agoraRoutes';
import aiChatRoutes from './routes/aiChat';
import voiceSimulationRoutes from './routes/voiceSimulation';
import immigrationSimulationRoutes from './routes/immigrationSimulation';
import floatingAiAssistantRoutes from './routes/floatingAiAssistant';
import { requestLogger, errorLogger, performanceMonitor } from './middleware/requestLogger';
import simulationRoutes from './routes/simulations';
import aiRoutes from './routes/ai';
import marketplaceRoutes from './routes/marketplaceRoutes';
import marketplaceApiRoutes from './routes/marketplace';
import contentManagementRoutes from './routes/contentManagement';
import messagesRoutes from './routes/messages';
import aiAssistantRoutes from './routes/aiAssistant';
import enhancedFileManagementRoutes from './routes/enhancedFileManagement';
import likesRoutes from './routes/likes';
import homeRoutes from './routes/home'
import challengeRoutes from './routes/challenges';
import achievementRoutes from './routes/achievements';
import { teacherRoutes } from './routes/teachers';
import userActivityRoutes from './routes/userActivity';
import moderationRoutes from './routes/moderation';
import { chatRoomService } from './services/chatRoomService';

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',  // Frontend (only port 3000)
    config.corsOrigin
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting - Different limits for different environments
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for development
  skip: (req) => {
    if (config.nodeEnv === 'development') {
      console.log('🔓 Rate limiting skipped for development');
      return true;
    }
    return false;
  },
  // Custom key generator for better production scaling
  keyGenerator: (req) => {
    // In production, you might want to use user ID instead of IP
    // For now, use IP but this can be enhanced
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

// Apply rate limiting based on environment
if (config.nodeEnv === 'production') {
  // Production: Use sophisticated rate limiting
  app.use('/api/', generalRateLimit);
  app.use('/api/auth/', authRateLimit);
  app.use('/api/auth/reset-password', sensitiveRateLimit);
  app.use('/api/auth/change-password', sensitiveRateLimit);
  app.use('/api/upload/', uploadRateLimit);
  app.use('/api/ai-chat/', aiChatRateLimit);
  console.log('🔒 Production rate limiting enabled with tiered limits');
} else {
  // Development: Use basic rate limiting or disable
  app.use('/api/', limiter);
  console.log('🔓 Development rate limiting enabled (relaxed limits)');
}

// Body parsing middleware
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Enhanced request logging and performance monitoring
app.use(requestLogger);
app.use(performanceMonitor);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TCF/TEF API Documentation'
}));

// Health check route (before other routes)
app.use('/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/live-sessions', liveSessionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', commentRoutes);
app.use('/api/course-content', courseContentRoutes);
app.use('/api/upload', fileUploadRoutes);
app.use('/api/files', fileUploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/voice-simulation', voiceSimulationRoutes);
app.use('/api/immigration-simulation', immigrationSimulationRoutes);
app.use('/api/floating-ai-assistant', floatingAiAssistantRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api', marketplaceRoutes);
app.use('/api/marketplace', marketplaceApiRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/content-management', contentManagementRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/file-management', enhancedFileManagementRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/user', userActivityRoutes);
app.use('/api', moderationRoutes);

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use(notFoundHandler);

// Enhanced error logging
app.use(errorLogger);

// Global error handler
app.use(errorHandler);

// Initialize Socket.IO chat service
chatRoomService.initialize(server);

// Start server
const PORT = config.port || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Database: ${config.databaseUrl ? 'Connected' : 'Not configured'}`);
  console.log(`💬 Socket.IO chat service initialized`);
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 Database: ${config.databaseUrl ? 'Connected' : 'Not configured'}`);
  logger.info(`💬 Socket.IO chat service initialized`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;

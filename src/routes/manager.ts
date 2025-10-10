import { Router } from 'express';
import { ManagerController } from '@/controllers/managerController';
import { SettingsService } from '@/services/settingsService';
import { validate, validateParams, commonSchemas } from '@/middleware/validation';
import { authenticate, requireManager } from '@/middleware/auth';
import Joi from 'joi';

const router = Router();

// Validation schemas
const messageSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  message: Joi.string().min(1).max(2000).required(),
  type: Joi.string().valid('INFO', 'WARNING', 'SUCCESS', 'ERROR').default('INFO')
});

const contentSchema = Joi.object({
  type: Joi.string().valid('post', 'course', 'test').required(),
  title: Joi.string().min(1).max(200).required(),
  content: Joi.string().min(1).required(),
  excerpt: Joi.string().max(500).optional(),
  category: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  level: Joi.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').optional(),
  targetTier: Joi.string().valid('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE').default('FREE')
});

const updateContentSchema = Joi.object({
  type: Joi.string().valid('post', 'course', 'test').required(),
  title: Joi.string().min(1).max(200).optional(),
  content: Joi.string().min(1).optional(),
  excerpt: Joi.string().max(500).optional(),
  category: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  level: Joi.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').optional(),
  targetTier: Joi.string().valid('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE').optional()
});

const reportConfigSchema = Joi.object({
  type: Joi.string().valid('content', 'users', 'engagement', 'performance').required(),
  timeframe: Joi.string().valid('7d', '30d', '90d', '1y').default('30d'),
  filters: Joi.object().optional(),
  format: Joi.string().valid('pdf', 'csv', 'excel').default('pdf')
});

/**
 * @route   GET /api/manager/dashboard
 * @desc    Get manager dashboard data
 * @access  Private (Manager+)
 */
router.get('/dashboard', authenticate, requireManager, ManagerController.getDashboard);

/**
 * @route   GET /api/manager/metrics
 * @desc    Get manager performance metrics
 * @access  Private (Manager+)
 */
router.get('/metrics', authenticate, requireManager, ManagerController.getMetrics);

/**
 * @route   GET /api/manager/activity
 * @desc    Get recent manager activity
 * @access  Private (Manager+)
 */
router.get('/activity', authenticate, requireManager, ManagerController.getActivity);

/**
 * @route   GET /api/manager/analytics
 * @desc    Get manager analytics
 * @access  Private (Manager+)
 */
router.get('/analytics', authenticate, requireManager, ManagerController.getAnalytics);

/**
 * @route   POST /api/manager/analytics/reports
 * @desc    Generate manager report
 * @access  Private (Manager+)
 */
router.post('/analytics/reports',
  authenticate,
  requireManager,
  validate(reportConfigSchema),
  ManagerController.generateReport
);

/**
 * @route   GET /api/manager/analytics/export
 * @desc    Export manager data
 * @access  Private (Manager+)
 */
router.get('/analytics/export', authenticate, requireManager, ManagerController.exportData);

/**
 * @route   GET /api/manager/students
 * @desc    Get students managed by this manager
 * @access  Private (Manager+)
 */
router.get('/students', authenticate, requireManager, ManagerController.getManagedUsers);

/**
 * @route   GET /api/manager/users
 * @desc    Get users managed by this manager
 * @access  Private (Manager+)
 */
router.get('/users', authenticate, requireManager, ManagerController.getManagedUsers);

/**
 * @route   GET /api/manager/users/:userId/analytics
 * @desc    Get user analytics for managed users
 * @access  Private (Manager+)
 */
router.get('/users/:userId/analytics',
  authenticate,
  requireManager,
  validateParams({ userId: commonSchemas.id }),
  ManagerController.getUserAnalytics
);

/**
 * @route   POST /api/manager/users/:userId/message
 * @desc    Send message to user
 * @access  Private (Manager+)
 */
router.post('/users/:userId/message',
  authenticate,
  requireManager,
  validateParams({ userId: commonSchemas.id }),
  validate(messageSchema),
  ManagerController.sendMessageToUser
);

/**
 * @route   GET /api/manager/content
 * @desc    Get content library for manager
 * @access  Private (Manager+)
 */
router.get('/content', authenticate, requireManager, ManagerController.getContentLibrary);

/**
 * @route   POST /api/manager/content
 * @desc    Create new content
 * @access  Private (Manager+)
 */
router.post('/content',
  authenticate,
  requireManager,
  validate(contentSchema),
  ManagerController.createContent
);

/**
 * @route   PUT /api/manager/content/:contentId
 * @desc    Update content
 * @access  Private (Manager+)
 */
router.put('/content/:contentId',
  authenticate,
  requireManager,
  validateParams({ contentId: commonSchemas.id }),
  validate(updateContentSchema),
  ManagerController.updateContent
);

/**
 * @route   POST /api/manager/content/:contentId/publish
 * @desc    Publish content
 * @access  Private (Manager+)
 */
router.post('/content/:contentId/publish',
  authenticate,
  requireManager,
  validateParams({ contentId: commonSchemas.id }),
  ManagerController.publishContent
);

/**
 * @route   GET /api/manager/content/:contentId/analytics
 * @desc    Get content analytics
 * @access  Private (Manager+)
 */
router.get('/content/:contentId/analytics',
  authenticate,
  requireManager,
  validateParams({ contentId: commonSchemas.id }),
  ManagerController.getContentAnalytics
);

/**
 * @route   GET /api/manager/health
 * @desc    Manager service health check
 * @access  Public
 */
router.get('/health', ManagerController.healthCheck);

/**
 * @route   GET /api/manager/settings
 * @desc    Get manager settings
 * @access  Private (Manager+)
 */
router.get('/settings', authenticate, requireManager, async (req, res, next) => {
  try {
    const settings = await SettingsService.getManagerSettings(req.user!.userId);
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/manager/settings
 * @desc    Update manager settings
 * @access  Private (Manager+)
 */
router.put('/settings', authenticate, requireManager, async (req, res, next) => {
  try {
    const settings = await SettingsService.updateManagerSettings(req.user!.userId, req.body);
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

export { router as managerRoutes };

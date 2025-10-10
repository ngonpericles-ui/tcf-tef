import { Router } from 'express';
import { AdminController } from '@/controllers/adminController';
import { SettingsService } from '@/services/settingsService';
import { validate, validateParams, commonSchemas } from '@/middleware/validation';
import { authenticate, requireAdmin, requireSeniorManager } from '@/middleware/auth';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createManagerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('JUNIOR_MANAGER', 'SENIOR_MANAGER').required()
});

const updateManagerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  role: Joi.string().valid('JUNIOR_MANAGER', 'SENIOR_MANAGER').optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').optional()
});

const reportConfigSchema = Joi.object({
  type: Joi.string().valid('users', 'courses', 'tests', 'revenue', 'engagement').required(),
  timeframe: Joi.string().valid('7d', '30d', '90d', '1y').default('30d'),
  filters: Joi.object().optional(),
  format: Joi.string().valid('pdf', 'csv', 'excel').default('pdf')
});

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard data
 * @access  Private (Admin)
 */
router.get('/dashboard', authenticate, requireAdmin, AdminController.getDashboard);

/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health metrics
 * @access  Private (Admin)
 */
router.get('/system/health', authenticate, requireAdmin, AdminController.getSystemHealth);

/**
 * @route   GET /api/admin/metrics/business
 * @desc    Get business metrics
 * @access  Private (Admin)
 */
router.get('/metrics/business', authenticate, requireAdmin, AdminController.getBusinessMetrics);

/**
 * @route   GET /api/admin/metrics/technical
 * @desc    Get technical metrics
 * @access  Private (Admin)
 */
router.get('/metrics/technical', authenticate, requireAdmin, AdminController.getTechnicalMetrics);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with advanced filtering
 * @access  Private (Admin)
 */
router.get('/users', authenticate, requireAdmin, AdminController.getAllUsers);

/**
 * @route   GET /api/admin/users/:userId/analytics
 * @desc    Get user analytics
 * @access  Private (Admin)
 */
router.get('/users/:userId/analytics',
  authenticate,
  requireAdmin,
  validateParams({ userId: commonSchemas.id }),
  AdminController.getUserAnalytics
);

/**
 * @route   GET /api/admin/managers
 * @desc    Get managers list
 * @access  Private (Admin)
 */
router.get('/managers', authenticate, requireAdmin, AdminController.getManagers);

/**
 * @route   POST /api/admin/managers
 * @desc    Create new manager
 * @access  Private (Admin)
 */
router.post('/managers',
  authenticate,
  requireAdmin,
  validate(createManagerSchema),
  AdminController.createManager
);

/**
 * @route   PUT /api/admin/managers/:managerId
 * @desc    Update manager
 * @access  Private (Admin)
 */
router.put('/managers/:managerId',
  authenticate,
  requireAdmin,
  validateParams({ managerId: commonSchemas.id }),
  validate(updateManagerSchema),
  AdminController.updateManager
);

/**
 * @route   GET /api/admin/managers/:managerId/performance
 * @desc    Get manager performance analytics
 * @access  Private (Admin)
 */
router.get('/managers/:managerId/performance',
  authenticate,
  requireAdmin,
  validateParams({ managerId: commonSchemas.id }),
  AdminController.getManagerPerformance
);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get analytics data
 * @access  Private (Admin)
 */
router.get('/analytics', authenticate, requireAdmin, AdminController.getAnalytics);

/**
 * @route   POST /api/admin/analytics/reports
 * @desc    Generate custom report
 * @access  Private (Admin)
 */
router.post('/analytics/reports',
  authenticate,
  requireAdmin,
  validate(reportConfigSchema),
  AdminController.generateReport
);

/**
 * @route   GET /api/admin/analytics/export
 * @desc    Export analytics data
 * @access  Private (Admin)
 */
router.get('/analytics/export', authenticate, requireAdmin, AdminController.exportData);

/**
 * @route   GET /api/admin/health
 * @desc    Admin service health check
 * @access  Public
 */
router.get('/health', AdminController.healthCheck);

/**
 * @route   GET /api/admin/settings
 * @desc    Get admin settings
 * @access  Admin only
 */
router.get('/settings', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const settings = await SettingsService.getAdminSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/admin/settings
 * @desc    Update admin settings
 * @access  Admin only
 */
router.put('/settings', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const settings = await SettingsService.updateAdminSettings(req.body);
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/review-requests
 * @desc    Get all review requests for admin/senior managers
 * @access  Private (Admin/Senior Manager only)
 */
router.get('/review-requests', authenticate, requireSeniorManager, AdminController.getReviewRequests);

/**
 * @route   POST /api/admin/review-requests/:id/action
 * @desc    Handle review request (accept/reject/complete)
 * @access  Private (Admin/Senior Manager only)
 */
router.post('/review-requests/:id/action',
  authenticate,
  requireSeniorManager,
  validate({
    params: Joi.object({
      id: commonSchemas.id
    }),
    body: Joi.object({
      action: Joi.string().valid('accept', 'reject', 'complete').required(),
      response: Joi.string().optional(),
      humanFeedback: Joi.string().optional(),
      humanScore: Joi.number().min(0).max(100).optional()
    })
  }),
  AdminController.handleReviewRequest
);

export { router as adminRoutes };

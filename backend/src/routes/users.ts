import { Router } from 'express';
import Joi from 'joi';
import { UserController } from '@/controllers/userController';
import { validate, validateParams, userSchemas, commonSchemas } from '@/middleware/validation';
import { authenticate, requireAdmin, requireManager, requireSeniorManager } from '@/middleware/auth';

const router = Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, UserController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', authenticate, validate(userSchemas.updateProfile), UserController.updateProfile);

/**
 * @route   POST /api/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticate, validate(userSchemas.changePassword), UserController.changePassword);

/**
 * @route   GET /api/users/dashboard
 * @desc    Get user dashboard stats
 * @access  Private
 */
router.get('/dashboard', authenticate, UserController.getDashboardStats);

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin/Manager only)
 * @access  Private (Manager+)
 */
router.get('/', authenticate, requireManager, UserController.getAllUsers);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID (Admin/Manager only)
 * @access  Private (Manager+)
 */
router.get('/:userId',
  authenticate,
  requireManager,
  validateParams({ userId: commonSchemas.id }),
  UserController.getUserById
);

/**
 * @route   PUT /api/users/:userId/role
 * @desc    Update user role (Admin only)
 * @access  Private (Admin)
 */
router.put('/:userId/role',
  authenticate,
  requireAdmin,
  validateParams({ userId: commonSchemas.id }),
  validate(Joi.object({ role: commonSchemas.role.required() })),
  UserController.updateUserRole
);

/**
 * @route   PUT /api/users/:userId/status
 * @desc    Update user status (Admin/Senior Manager only)
 * @access  Private (Senior Manager+)
 */
router.put('/:userId/status',
  authenticate,
  requireSeniorManager,
  validateParams({ userId: commonSchemas.id }),
  validate(Joi.object({ status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').required() })),
  UserController.updateUserStatus
);

/**
 * @route   DELETE /api/users/:userId
 * @desc    Delete user (Admin only)
 * @access  Private (Admin)
 */
router.delete('/:userId',
  authenticate,
  requireAdmin,
  validateParams({ userId: commonSchemas.id }),
  UserController.deleteUser
);

/**
 * @route   GET /api/users/health
 * @desc    User service health check
 * @access  Public
 */
router.get('/health', UserController.healthCheck);

export { router as userRoutes };

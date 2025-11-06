import { Router } from 'express';
import Joi from 'joi';
import { prisma } from '@/database/connection';
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
 * @route   POST /api/users/upload-profile-image
 * @desc    Upload profile image (unified endpoint for admin/manager/student)
 * @access  Private
 */
router.post('/upload-profile-image', authenticate, async (req, res, next) => {
  try {
    // Import here to avoid circular dependencies
    const { FileUploadController } = await import('../controllers/fileUploadController');
    const { FileUploadService } = await import('../services/fileUploadService');
    
    // Configure multer for profile image
    const profileImageUpload = FileUploadService.configureMulter({
      category: 'PROFILE_IMAGE',
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
    });

    // Verify user is authenticated (should be done by authenticate middleware, but double-check)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'AUTH_ERROR'
        }
      });
    }

    // Use multer middleware and then call controller
    profileImageUpload.single('file')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: {
            message: err.message || 'File upload error',
            code: 'UPLOAD_ERROR'
          }
        });
      }
      
      // Ensure req.user has userId or id
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User not authenticated',
            code: 'AUTH_ERROR'
          }
        });
      }

      // Call the upload controller
      try {
        await FileUploadController.uploadProfileImage(req, res);
      } catch (controllerError: any) {
        console.error('❌ FileUploadController error:', controllerError);
        next(controllerError);
      }
    });
  } catch (error: any) {
    console.error('❌ Error in /users/upload-profile-image route:', error);
    next(error);
  }
});

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
 * @route   POST /api/users/preferences/voice
 * @desc    Save user voice preference
 * @access  Private
 */
router.post('/preferences/voice', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { voiceId, voiceName, gender, accent } = req.body;

    if (!voiceId) {
      return res.status(400).json({
        success: false,
        message: 'Voice ID is required'
      });
    }

    // Get current user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });

    // Update preferences
    const currentPreferences = (user?.preferences as any) || {};
    const updatedPreferences = {
      ...currentPreferences,
      voice: {
        voiceId,
        voiceName: voiceName || '',
        gender: gender || '',
        accent: accent || '',
        updatedAt: new Date().toISOString()
      }
    };

    // Save to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: updatedPreferences
      }
    });

    res.json({
      success: true,
      message: 'Voice preference saved successfully',
      data: {
        voiceId,
        voiceName,
        gender,
        accent
      }
    });
  } catch (error: any) {
    console.error('Error saving voice preference:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save voice preference'
    });
  }
});

/**
 * @route   GET /api/users/preferences/voice
 * @desc    Get user voice preference
 * @access  Private
 */
router.get('/preferences/voice', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });

    const preferences = (user?.preferences as any) || {};
    const voicePreference = preferences.voice || null;

    res.json({
      success: true,
      data: voicePreference
    });
  } catch (error: any) {
    console.error('Error getting voice preference:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get voice preference'
    });
  }
});

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

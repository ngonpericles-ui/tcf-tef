import { Router } from 'express';
import { LiveSessionController } from '@/controllers/liveSessionController';
import { validate, validateParams, commonSchemas } from '@/middleware/validation';
import { authenticate, requireManager, optionalAuthenticate } from '@/middleware/auth';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createLiveSessionSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  titleEn: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).max(1000).required(),
  descriptionEn: Joi.string().min(10).max(1000).optional(),
  instructor: Joi.string().min(2).max(100).required(),
  coInstructors: Joi.array().items(Joi.string().max(100)).optional(),
  date: Joi.date().greater('now').required(),
  duration: Joi.number().integer().min(15).max(480).required(), // 15 minutes to 8 hours
  maxParticipants: Joi.number().integer().min(1).max(1000).required(),
  price: Joi.number().min(0).default(0),
  currency: Joi.string().default('CFA'),
  requiredTier: commonSchemas.subscriptionTier.required(),
  level: commonSchemas.courseLevel.optional(),
  category: commonSchemas.courseCategory.optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).required(),
  image: Joi.string().uri().optional(),
  notifyFollowers: Joi.boolean().default(true)
});

const updateSessionStatusSchema = Joi.object({
  status: Joi.string().valid('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED').required()
});

/**
 * @route   GET /api/live-sessions/health
 * @desc    Live session service health check
 * @access  Public
 */
router.get('/health', LiveSessionController.healthCheck);

/**
 * @route   GET /api/live-sessions/statistics
 * @desc    Get live session statistics (Manager/Admin only)
 * @access  Private (Manager+)
 */
router.get('/statistics', authenticate, requireManager, LiveSessionController.getLiveSessionStatistics);

/**
 * @route   GET /api/live-sessions/created
 * @desc    Get sessions created by user (Manager/Admin only)
 * @access  Private (Manager+)
 */
router.get('/created', authenticate, requireManager, LiveSessionController.getUserCreatedSessions);

/**
 * @route   GET /api/live-sessions/registered
 * @desc    Get user's registered sessions
 * @access  Private
 */
router.get('/registered', authenticate, LiveSessionController.getUserRegisteredSessions);

/**
 * @route   GET /api/live-sessions/upcoming
 * @desc    Get upcoming live sessions
 * @access  Public (with optional authentication for personalized data)
 */
router.get('/upcoming', optionalAuthenticate, LiveSessionController.getUpcomingSessions);

/**
 * @route   GET /api/live-sessions
 * @desc    Get all live sessions with pagination and filtering
 * @access  Public (with optional authentication for personalized data)
 */
router.get('/', optionalAuthenticate, LiveSessionController.getAllLiveSessions);

/**
 * @route   POST /api/live-sessions
 * @desc    Create a new live session (Manager/Admin only)
 * @access  Private (Manager+)
 */
router.post('/', authenticate, requireManager, validate(createLiveSessionSchema), LiveSessionController.createLiveSession);

/**
 * @route   GET /api/live-sessions/:sessionId
 * @desc    Get live session by ID
 * @access  Public (with optional authentication for personalized data)
 */
router.get('/:sessionId',
  optionalAuthenticate,
  validateParams({ sessionId: commonSchemas.id }),
  LiveSessionController.getLiveSessionById
);

/**
 * @route   POST /api/live-sessions/:sessionId/register
 * @desc    Register for live session
 * @access  Private
 */
router.post('/:sessionId/register',
  authenticate,
  validateParams({ sessionId: commonSchemas.id }),
  LiveSessionController.registerForSession
);

/**
 * @route   DELETE /api/live-sessions/:sessionId/register
 * @desc    Unregister from live session
 * @access  Private
 */
router.delete('/:sessionId/register',
  authenticate,
  validateParams({ sessionId: commonSchemas.id }),
  LiveSessionController.unregisterFromSession
);

/**
 * @route   PUT /api/live-sessions/:sessionId
 * @desc    Update live session (Creator/Admin only)
 * @access  Private (Creator/Admin)
 */
router.put('/:sessionId',
  authenticate,
  validateParams({ sessionId: commonSchemas.id }),
  validate(Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().min(10).max(1000).optional(),
    date: Joi.date().optional(),
    duration: Joi.number().integer().min(15).max(480).optional(),
    maxParticipants: Joi.number().integer().min(1).max(1000).optional(),
    category: commonSchemas.courseCategory.optional(),
    levels: Joi.array().items(commonSchemas.courseLevel).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional()
  })),
  LiveSessionController.updateLiveSession
);

/**
 * @route   DELETE /api/live-sessions/:sessionId
 * @desc    Delete live session (Creator/Admin only)
 * @access  Private (Creator/Admin)
 */
router.delete('/:sessionId',
  authenticate,
  validateParams({ sessionId: commonSchemas.id }),
  LiveSessionController.deleteLiveSession
);

/**
 * @route   PUT /api/live-sessions/:sessionId/status
 * @desc    Update session status (Creator/Admin only)
 * @access  Private (Creator/Admin)
 */
router.put('/:sessionId/status',
  authenticate,
  validateParams({ sessionId: commonSchemas.id }),
  validate(updateSessionStatusSchema),
  LiveSessionController.updateSessionStatus
);

/**
 * @route   POST /api/live-sessions/reminder
 * @desc    Set reminder for live session
 * @access  Private
 */
router.post('/reminder',
  authenticate,
  validate(Joi.object({
    sessionId: commonSchemas.id.required(),
    reminderTime: Joi.string().valid('5min', '10min').required()
  })),
  LiveSessionController.setReminder
);

export { router as liveSessionRoutes };

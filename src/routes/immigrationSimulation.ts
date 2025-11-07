import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import { validate, immigrationSimulationSchemas } from '../middleware/validation';
import { requestLogger, errorLogger } from '../middleware/requestLogger';
import I18nService, { Language } from '../services/i18nService';

const router = express.Router();
const prisma = new PrismaClient();

// Import the immigration simulation service
const ImmigrationSimulationService = require('../services/immigrationSimulationService');

// STUDENT ROUTES

/**
 * @route GET /api/immigration-simulation
 * @desc Test endpoint - check if service is available
 * @access Public
 */
router.get('/', async (req, res) => {
  res.json({
    success: true,
    message: 'Immigration Simulation API is available',
    endpoints: {
      userHistory: 'GET /history/user',
      monthlyCount: 'GET /monthly-count/user',
      createSimulation: 'POST /create',
      startSimulation: 'POST /start/:id',
      endSimulation: 'POST /end/:id',
      getSimulation: 'GET /:id'
    },
    note: 'Most endpoints require authentication and Pro subscription'
  });
});

/**
 * @route GET /api/immigration-simulation/history/user
 * @desc Get user's immigration simulation history
 * @access Private (Student)
 */
router.get('/history/user', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's immigration simulations using the service
    const result = await ImmigrationSimulationService.getUserSimulations(userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error getting immigration simulation history:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/immigration-simulation/monthly-count/user
 * @desc Get user's monthly immigration simulation count
 * @access Private (Student)
 */
router.get('/monthly-count/user', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has Pro subscription (immigration is Pro-only)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    });

    if (!user || user.subscriptionTier !== 'PRO') {
      return res.status(403).json({
        success: false,
        message: 'Immigration simulations are exclusive to Pro subscribers'
      });
    }

    // Get monthly count using the service
    const monthlyCount = await ImmigrationSimulationService.getMonthlySimulationCount(userId);
    const limit = 2;
    const remaining = Math.max(0, limit - monthlyCount);

    res.json({
      success: true,
      data: {
        monthlyCount,
        limit,
        remaining,
        subscriptionTier: user.subscriptionTier
      }
    });
  } catch (error: any) {
    console.error('Error getting monthly count:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route POST /api/immigration-simulation/create
 * @desc Create new immigration simulation
 * @access Private (Student)
 */
router.post('/create',
  requestLogger,
  authenticate,
  validate(immigrationSimulationSchemas.create),
  async (req, res) => {
  try {
    const userId = req.user.id;
    const { country, immigrationType, level, personalInfo, voicePreference } = req.body;
    const language = I18nService.getLanguageFromRequest(req);

    // Check if user has Pro subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    });

    if (!user || user.subscriptionTier !== 'PRO') {
      return res.status(403).json({
        success: false,
        message: language === 'fr' 
          ? 'Les simulations d\'immigration sont réservées aux abonnés Pro'
          : 'Immigration simulations are exclusive to Pro subscribers'
      });
    }

    // Check monthly limit (2 simulations per month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyCount = await prisma.immigrationSimulation.count({
      where: {
        userId,
        createdAt: {
          gte: currentMonth
        }
      }
    });

    if (monthlyCount >= 2) {
      return res.status(400).json({
        success: false,
        message: language === 'fr'
          ? 'Vous avez atteint la limite mensuelle de 2 simulations d\'immigration'
          : 'You have reached the monthly limit of 2 immigration simulations'
      });
    }

    // Create immigration simulation using the service
    const sessionData = {
      country,
      immigrationType,
      level,
      personalInfo,
      voicePreference
    };

    const simulation = await ImmigrationSimulationService.createImmigrationSession(userId, sessionData);

    res.json({
      success: true,
      data: simulation,
      message: language === 'fr'
        ? 'Simulation d\'immigration créée avec succès'
        : 'Immigration simulation created successfully'
    });
  } catch (error: any) {
    const language = I18nService.getLanguageFromRequest(req);
    console.error('Error creating immigration simulation:', error);
    res.status(400).json({
      success: false,
      message: error.message || (language === 'fr'
        ? 'Erreur lors de la création de la simulation'
        : 'Error creating simulation')
    });
  }
});

/**
 * @route POST /api/immigration-simulation/start/:id
 * @desc Start an immigration simulation
 * @access Private (Student)
 */
router.post('/start/:id',
  requestLogger,
  authenticate,
  validate({ params: immigrationSimulationSchemas.params }),
  async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const language = I18nService.getLanguageFromRequest(req);

    // Verify the simulation belongs to the user
    const simulation = await prisma.immigrationSimulation.findFirst({
      where: { id, userId }
    });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: language === 'fr'
          ? 'Simulation non trouvée'
          : 'Simulation not found'
      });
    }

    // Start the simulation using the service
    const result = await ImmigrationSimulationService.startSession(id, userId);

    res.json({
      success: true,
      data: result,
      message: language === 'fr'
        ? 'Simulation d\'immigration démarrée'
        : 'Immigration simulation started'
    });
  } catch (error: any) {
    const language = I18nService.getLanguageFromRequest(req);
    console.error('Error starting immigration simulation:', error);
    res.status(400).json({
      success: false,
      message: error.message || (language === 'fr'
        ? 'Erreur lors du démarrage de la simulation'
        : 'Error starting simulation')
    });
  }
});

/**
 * @route POST /api/immigration-simulation/end/:id
 * @desc End an immigration simulation
 * @access Private (Student)
 */
router.post('/end/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const language = I18nService.getLanguageFromRequest(req);

    // Verify the simulation belongs to the user
    const simulation = await prisma.immigrationSimulation.findFirst({
      where: { id, userId }
    });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: language === 'fr'
          ? 'Simulation non trouvée'
          : 'Simulation not found'
      });
    }

    // Complete the simulation using the service
    const result = await ImmigrationSimulationService.completeSession(id, userId);

    res.json({
      success: true,
      data: result,
      message: language === 'fr'
        ? 'Simulation d\'immigration terminée'
        : 'Immigration simulation completed'
    });
  } catch (error: any) {
    const language = I18nService.getLanguageFromRequest(req);
    console.error('Error ending immigration simulation:', error);
    res.status(400).json({
      success: false,
      message: error.message || (language === 'fr'
        ? 'Erreur lors de la fin de la simulation'
        : 'Error ending simulation')
    });
  }
});

/**
 * @route GET /api/immigration-simulation/:id
 * @desc Get specific immigration simulation
 * @access Private (Student)
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get the simulation using the service
    const simulation = await ImmigrationSimulationService.getSession(id, userId);

    res.json({
      success: true,
      data: simulation
    });
  } catch (error: any) {
    console.error('Error getting immigration simulation:', error);
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

export default router;

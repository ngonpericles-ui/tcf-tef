import express from 'express';
import multer from 'multer';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { JWTService } from '../utils/jwt';
import { authenticate, requireRole } from '../middleware/auth';
import { temporaryOrRegularAuth } from '../middleware/temporaryAuth';
import voiceSimulationService from '../services/voiceSimulationService';
import questionBankService from '../services/questionBankService';
import vapiService from '../services/vapiService';
import I18nService, { Language } from '../services/i18nService';

const prisma = new PrismaClient();

const router = express.Router();

console.log('🔍 VOICE SIMULATION ROUTES: Router initialized');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'questionbank-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// PUBLIC ROUTES

// Get VAPI public key for frontend
router.get('/vapi-config', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        publicKey: vapiService.getPublicKey()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Test endpoint to create a demo simulation
router.post('/test-simulation', async (req, res) => {
  try {
    // Create a test user if not exists
    const testUser = await prisma.user.upsert({
      where: { email: 'test@vapi-demo.com' },
      update: {},
      create: {
        email: 'test@vapi-demo.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'STUDENT',
        status: 'ACTIVE',
        passwordHash: 'test-password'
      }
    });

    // Create a test simulation
    const simulation = await prisma.voiceSimulation.create({
      data: {
        userId: testUser.id,
        scheduledDate: new Date(Date.now() + 60000), // 1 minute from now
        voicePreference: 'MALE',
        status: 'SCHEDULED',
        duration: 420
      }
    });

    // Generate test JWT token
    const token = JWTService.generateAccessToken({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role,
      subscriptionTier: testUser.subscriptionTier
    });

    res.json({
      success: true,
      data: {
        user: testUser,
        simulation,
        token,
        accessUrl: `http://localhost:3000/voice-simulation/${simulation.id}`
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Test email sending
router.post('/test-email', async (req, res) => {
  try {
    const { email, type } = req.body;
    const testEmail = email || 'periclesngon01@gmail.com';

    console.log(`🧪 Testing email to: ${testEmail} (type: ${type})`);

    // Import email service
    const { EmailService } = require('../services/emailService');

    let result: any;
    switch (type) {
      case 'booking':
        result = await EmailService.sendVoiceSimulationBookingEmail({
          email: testEmail,
          userName: 'Pericles Ngon',
          simulation: {
            id: 'test-123',
            scheduledDate: new Date(Date.now() + 3600000), // 1 hour from now
            voicePreference: 'MALE'
          },
          accessUrl: 'http://localhost:3000/voice-simulation/test-123'
        });
        break;
      case 'reminder':
        result = await EmailService.sendVoiceSimulationReminderEmail({
          email: testEmail,
          userName: 'Pericles Ngon',
          simulation: {
            id: 'test-123',
            scheduledDate: new Date(Date.now() + 1800000), // 30 minutes from now
            voicePreference: 'MALE'
          },
          accessUrl: 'http://localhost:3000/voice-simulation/test-123',
          timeRemaining: '30 minutes'
        });
        break;
      case 'results':
        result = await EmailService.sendVoiceSimulationResultsEmail({
          email: testEmail,
          userName: 'Pericles Ngon',
          simulation: {
            id: 'test-123',
            scheduledDate: new Date(),
            voicePreference: 'MALE'
          },
          results: {
            overallScore: 85,
            fluencyScore: 80,
            grammarScore: 90,
            vocabularyScore: 85,
            pronunciationScore: 80,
            coherenceScore: 90,
            feedback: 'Excellent niveau de français ! Votre maîtrise de la langue est impressionnante. Continuez à pratiquer pour maintenir ce niveau élevé.'
          }
        });
        break;
      default:
        throw new Error('Invalid email type');
    }

    res.json({
      success: true,
      data: result,
      message: `Test ${type} email sent successfully`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Complete end-to-end test
router.post('/test-complete-flow', async (req, res) => {
  try {
    console.log('🚀 Starting complete VAPI voice simulation test...');

    // Step 1: Create test user and simulation
    const testUser = await prisma.user.upsert({
      where: { email: 'e2e-test@vapi-demo.com' },
      update: {},
      create: {
        email: 'e2e-test@vapi-demo.com',
        firstName: 'E2E',
        lastName: 'Test',
        role: 'STUDENT',
        status: 'ACTIVE',
        passwordHash: 'test-password'
      }
    });
    console.log('✅ Step 1: Test user created/found');

    // Step 2: Create simulation
    const simulation = await prisma.voiceSimulation.create({
      data: {
        userId: testUser.id,
        scheduledDate: new Date(Date.now() + 60000), // 1 minute from now
        voicePreference: 'quebec_male_1' as any, // Use proper voice ID
        status: 'SCHEDULED',
        duration: 420
      }
    });
    console.log('✅ Step 2: Voice simulation created');

    // Step 3: Generate JWT token
    const token = JWTService.generateAccessToken({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role,
      subscriptionTier: testUser.subscriptionTier
    });
    console.log('✅ Step 3: JWT token generated');

    // Step 4: Test VAPI assistant creation
    const questions = await vapiService.getRandomQuestions('B1', 5);
    const assistant = await vapiService.createFrenchAssistant(
      simulation.voicePreference,
      questions
    );
    console.log('✅ Step 4: VAPI assistant created:', assistant.id);

    // Step 5: Test email system
    const { EmailService } = require('../services/emailService');
    const emailResult = await EmailService.sendVoiceSimulationReminderEmail({
      email: testUser.email,
      userName: `${testUser.firstName} ${testUser.lastName}`,
      simulation: {
        id: simulation.id,
        scheduledDate: simulation.scheduledDate,
        voicePreference: simulation.voicePreference
      },
      accessUrl: `http://localhost:3000/voice-simulation/${simulation.id}`,
      timeRemaining: '30 minutes'
    });
    console.log('✅ Step 5: Email system tested');

    // Step 6: Update simulation with assistant info
    await prisma.voiceSimulation.update({
      where: { id: simulation.id },
      data: {
        questionsData: questions,
        status: 'SCHEDULED'
      }
    });
    console.log('✅ Step 6: Simulation updated with questions');

    res.json({
      success: true,
      data: {
        user: testUser,
        simulation,
        assistant,
        questions,
        token,
        emailResult,
        accessUrl: `http://localhost:3000/voice-simulation/${simulation.id}`,
        testSteps: [
          '✅ User created/found',
          '✅ Voice simulation created',
          '✅ JWT token generated',
          '✅ VAPI assistant created',
          '✅ Email system tested',
          '✅ Simulation updated with questions'
        ]
      },
      message: '🎉 Complete end-to-end test successful!'
    });
  } catch (error: any) {
    console.error('❌ End-to-end test failed:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.stack
    });
  }
});

// STUDENT ROUTES - Voice Simulation API

// Get available voice options
router.get('/voices', async (req, res) => {
  try {
    const voices = vapiService.getVoiceOptions();
    res.json({
      success: true,
      data: voices,
      message: 'Available voices retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Book a voice simulation
router.post('/book', authenticate, async (req, res) => {
  try {
    const { bookingType, preferredDates, voicePreference } = req.body;
    const userId = req.user.id;
    const language = I18nService.getLanguageFromRequest(req);

    const result = await voiceSimulationService.bookSimulation({
      userId,
      bookingType,
      preferredDates: preferredDates?.map((date: string) => new Date(date)),
      voicePreference
    }, language);

    res.json({
      success: true,
      data: result,
      message: I18nService.t('success.simulation_booked', language)
    });
  } catch (error: any) {
    const language = I18nService.getLanguageFromRequest(req);
    res.status(400).json({
      success: false,
      message: error.message.includes('voice.') || error.message.includes('error.')
        ? error.message
        : I18nService.t('voice.booking_failed', language)
    });
  }
});

// Cancel a voice simulation booking
router.delete('/cancel/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const language = I18nService.getLanguageFromRequest(req);

    const result = await voiceSimulationService.cancelSimulation(id, userId, language);

    res.json({
      success: true,
      data: result,
      message: language === 'fr'
        ? 'Simulation annulée avec succès'
        : 'Simulation cancelled successfully'
    });
  } catch (error: any) {
    const language = I18nService.getLanguageFromRequest(req);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Reschedule a voice simulation booking
router.put('/reschedule/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, voicePreference } = req.body;
    const userId = req.user.id;
    const language = I18nService.getLanguageFromRequest(req);

    if (!newDate) {
      return res.status(400).json({
        success: false,
        message: language === 'fr'
          ? 'Nouvelle date requise'
          : 'New date required'
      });
    }

    const result = await voiceSimulationService.rescheduleSimulation(
      id,
      userId,
      new Date(newDate),
      voicePreference,
      language
    );

    res.json({
      success: true,
      data: result,
      message: language === 'fr'
        ? 'Simulation reprogrammée avec succès'
        : 'Simulation rescheduled successfully'
    });
  } catch (error: any) {
    const language = I18nService.getLanguageFromRequest(req);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Access voice simulation via temporary token (for email links)
router.get('/access/:simulationId', temporaryOrRegularAuth('voice'), async (req, res) => {
  try {
    const { simulationId } = req.params;
    const userId = req.user.id;

    const result = await voiceSimulationService.getSimulation(simulationId, userId);

    res.json({
      success: true,
      data: result,
      message: 'Voice simulation accessed successfully via temporary token'
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Get user's simulation history
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await voiceSimulationService.getUserSimulations(userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user's monthly voice simulation count
router.get('/monthly-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const language = I18nService.getLanguageFromRequest(req);

    // Get current month's simulation count
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyCount = await prisma.voiceSimulation.count({
      where: {
        userId: userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    // Get user's subscription tier to determine limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    });

    // Voice simulation limits based on subscription tier
    let limit = 0;
    if (user?.subscriptionTier === 'PREMIUM' || user?.subscriptionTier === 'PRO') {
      limit = 2; // 2 voice simulations per month for Premium/Pro
    } else {
      limit = 0; // Free users cannot access voice simulations
    }

    const remaining = Math.max(0, limit - monthlyCount);

    res.json({
      success: true,
      data: {
        monthlyCount,
        limit,
        remaining,
        subscriptionTier: user?.subscriptionTier || 'FREE'
      }
    });
  } catch (error: any) {
    console.error('Error getting monthly count:', error);
    const language = I18nService.getLanguageFromRequest(req);
    res.status(500).json({
      success: false,
      message: language === 'fr'
        ? 'Erreur lors de la récupération du compte mensuel'
        : 'Failed to get monthly count'
    });
  }
});

// MANAGER ROUTES

// Upload PDF question bank
router.post('/question-bank/upload',
  authenticate,
  requireRole(['SENIOR_MANAGER', 'ADMIN']),
  upload.single('pdf'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'PDF file is required'
        });
      }

      const { title, description, level, category } = req.body;
      const managerId = req.user.id;

      const result = await questionBankService.uploadPDF({
        managerId,
        title,
        description,
        level,
        category,
        filePath: req.file.path
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get manager's question banks
router.get('/question-bank/my-banks',
  authenticate,
  requireRole(['SENIOR_MANAGER', 'ADMIN']),
  async (req, res) => {
    try {
      const managerId = req.user.id;
      
      const result = await questionBankService.getManagerQuestionBanks(managerId);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ADMIN ROUTES

// Get all question banks
router.get('/question-bank/all',
  authenticate,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const result = await questionBankService.getAllQuestionBanks();

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Update question bank status
router.patch('/question-bank/:questionBankId/status',
  authenticate,
  requireRole(['SENIOR_MANAGER', 'ADMIN']),
  async (req, res) => {
    try {
      const { questionBankId } = req.params;
      const { isActive } = req.body;
      const userId = req.user.id;

      const result = await questionBankService.updateQuestionBankStatus(
        questionBankId, 
        isActive, 
        userId
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get question bank statistics
router.get('/question-bank/stats',
  authenticate,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const result = await questionBankService.getQuestionBankStats();

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// VAPI WEBHOOK ENDPOINTS

// Handle VAPI call status updates
router.post('/webhook/vapi/status', async (req, res) => {
  try {
    const { callId, status, message } = req.body;
    
    console.log('VAPI Status Update:', { callId, status, message });
    
    // Handle different status updates
    switch (status) {
      case 'ended':
        // Process call results
        // This would be handled by the voiceSimulationService
        break;
      case 'failed':
        // Handle failed calls
        console.error('VAPI call failed:', message);
        break;
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error handling VAPI webhook:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Handle VAPI call transcripts
router.post('/webhook/vapi/transcript', async (req, res) => {
  try {
    const { callId, transcript, messages } = req.body;
    
    console.log('VAPI Transcript Update:', { callId, transcript });
    
    // Store transcript data for real-time updates
    // This could be sent to frontend via WebSocket
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error handling VAPI transcript:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Handle VAPI call analysis
router.post('/webhook/vapi/analysis', async (req, res) => {
  try {
    const { callId, analysis, summary } = req.body;
    
    console.log('VAPI Analysis Update:', { callId, analysis, summary });
    
    // Process the analysis results
    // Update simulation with final results
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error handling VAPI analysis:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get available time slots for booking
router.get('/available-slots', (req, res, next) => {
  console.log('🔍 ROUTE DEBUG: /available-slots route hit');
  console.log('🔍 ROUTE DEBUG: Headers:', req.headers.authorization ? 'Present' : 'Missing');
  next();
}, authenticate, async (req, res) => {
  try {
    console.log('🔍 ROUTE DEBUG: Inside available-slots handler');
    const { startDate, endDate } = req.query;
    const language = I18nService.getLanguageFromRequest(req);

    let start: Date, end: Date;

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      // Default to next 7 days
      start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(9, 0, 0, 0);

      end = new Date();
      end.setDate(end.getDate() + 7);
      end.setHours(18, 0, 0, 0);
    }

    const availableSlots = await voiceSimulationService.findAvailableSlots(start, end);

    res.json({
      success: true,
      data: {
        slots: availableSlots,
        count: availableSlots.length
      },
      message: language === 'fr'
        ? `${availableSlots.length} créneaux disponibles trouvés`
        : `${availableSlots.length} available slots found`
    });
  } catch (error: any) {
    const language = I18nService.getLanguageFromRequest(req);
    console.error('Error getting available slots:', error);
    res.status(400).json({
      success: false,
      message: error.message || (language === 'fr'
        ? 'Erreur lors de la recherche de créneaux'
        : 'Error finding available slots')
    });
  }
});

// Create immigration-specific VAPI assistant
router.post('/create-immigration-assistant', authenticate, async (req, res) => {
  try {
    const { voiceId, country, immigrationType, questions } = req.body;
    const language = I18nService.getLanguageFromRequest(req);

    if (!voiceId || !country || !immigrationType) {
      return res.status(400).json({
        success: false,
        message: language === 'fr'
          ? 'Paramètres manquants: voiceId, country, immigrationType requis'
          : 'Missing parameters: voiceId, country, immigrationType required'
      });
    }

    // Create immigration assistant using VAPI service
    const assistant = await vapiService.createImmigrationAssistant(
      voiceId,
      country,
      immigrationType,
      questions || [],
      language
    );

    res.json({
      success: true,
      data: assistant,
      message: language === 'fr'
        ? 'Assistant d\'immigration créé avec succès'
        : 'Immigration assistant created successfully'
    });
  } catch (error: any) {
    const language = I18nService.getLanguageFromRequest(req);
    console.error('Error creating immigration assistant:', error);
    res.status(400).json({
      success: false,
      message: error.message || (language === 'fr'
        ? 'Erreur lors de la création de l\'assistant'
        : 'Error creating assistant')
    });
  }
});

// Get a specific voice simulation (supports temporary token access)
// NOTE: This catch-all route MUST be placed AFTER all specific routes
router.get('/:simulationId', temporaryOrRegularAuth('voice'), async (req, res) => {
  try {
    const { simulationId } = req.params;
    const userId = req.user.id;

    const result = await voiceSimulationService.getSimulation(simulationId, userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Start a voice simulation (supports temporary token access)
router.post('/start/:simulationId', temporaryOrRegularAuth('voice'), async (req, res) => {
  try {
    const { simulationId } = req.params;

    const result = await voiceSimulationService.startSimulation(simulationId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// End a voice simulation (supports temporary token access)
router.post('/end/:simulationId', temporaryOrRegularAuth('voice'), async (req, res) => {
  try {
    const { simulationId } = req.params;

    const result = await voiceSimulationService.endSimulation(simulationId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

console.log('🔍 VOICE SIMULATION ROUTES: Exporting router with', router.stack.length, 'routes');

export default router;

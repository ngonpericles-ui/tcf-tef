"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const jwt_1 = require("../utils/jwt");
const auth_1 = require("../middleware/auth");
const temporaryAuth_1 = require("../middleware/temporaryAuth");
const voiceSimulationService_1 = __importDefault(require("../services/voiceSimulationService"));
const questionBankService_1 = __importDefault(require("../services/questionBankService"));
const vapiService_1 = __importDefault(require("../services/vapiService"));
const i18nService_1 = __importDefault(require("../services/i18nService"));
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
console.log('🔍 VOICE SIMULATION ROUTES: Router initialized');
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_DIR || './uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'questionbank-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
    limits: {
        fileSize: 0
    }
});
router.get('/vapi-config', (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                publicKey: vapiService_1.default.getPublicKey()
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.post('/test-simulation', async (req, res) => {
    try {
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
        const simulation = await prisma.voiceSimulation.create({
            data: {
                userId: testUser.id,
                scheduledDate: new Date(Date.now() + 60000),
                voicePreference: 'MALE',
                status: 'SCHEDULED',
                duration: 420
            }
        });
        const token = jwt_1.JWTService.generateAccessToken({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.post('/test-email', async (req, res) => {
    try {
        const { email, type } = req.body;
        const testEmail = email || 'periclesngon01@gmail.com';
        console.log(`🧪 Testing email to: ${testEmail} (type: ${type})`);
        const { EmailService } = require('../services/emailService');
        let result;
        switch (type) {
            case 'booking':
                result = await EmailService.sendVoiceSimulationBookingEmail({
                    email: testEmail,
                    userName: 'Pericles Ngon',
                    simulation: {
                        id: 'test-123',
                        scheduledDate: new Date(Date.now() + 3600000),
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
                        scheduledDate: new Date(Date.now() + 1800000),
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.post('/test-complete-flow', async (req, res) => {
    try {
        console.log('🚀 Starting complete VAPI voice simulation test...');
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
        const simulation = await prisma.voiceSimulation.create({
            data: {
                userId: testUser.id,
                scheduledDate: new Date(Date.now() + 60000),
                voicePreference: 'quebec_male_1',
                status: 'SCHEDULED',
                duration: 420
            }
        });
        console.log('✅ Step 2: Voice simulation created');
        const token = jwt_1.JWTService.generateAccessToken({
            userId: testUser.id,
            email: testUser.email,
            role: testUser.role,
            subscriptionTier: testUser.subscriptionTier
        });
        console.log('✅ Step 3: JWT token generated');
        const questions = await vapiService_1.default.getRandomQuestions('B1', 5);
        const assistant = await vapiService_1.default.createFrenchAssistant(simulation.voicePreference, questions);
        console.log('✅ Step 4: VAPI assistant created:', assistant.id);
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
    }
    catch (error) {
        console.error('❌ End-to-end test failed:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.stack
        });
    }
});
router.get('/voices', async (req, res) => {
    try {
        const voices = vapiService_1.default.getVoiceOptions();
        res.json({
            success: true,
            data: voices,
            message: 'Available voices retrieved successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.post('/book', auth_1.authenticate, async (req, res) => {
    try {
        const { bookingType, preferredDates, voicePreference } = req.body;
        const userId = req.user.id;
        const language = i18nService_1.default.getLanguageFromRequest(req);
        const result = await voiceSimulationService_1.default.bookSimulation({
            userId,
            bookingType,
            preferredDates: preferredDates?.map((date) => new Date(date)),
            voicePreference
        }, language);
        res.json({
            success: true,
            data: result,
            message: i18nService_1.default.t('success.simulation_booked', language)
        });
    }
    catch (error) {
        const language = i18nService_1.default.getLanguageFromRequest(req);
        res.status(400).json({
            success: false,
            message: error.message.includes('voice.') || error.message.includes('error.')
                ? error.message
                : i18nService_1.default.t('voice.booking_failed', language)
        });
    }
});
router.delete('/cancel/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const language = i18nService_1.default.getLanguageFromRequest(req);
        const result = await voiceSimulationService_1.default.cancelSimulation(id, userId, language);
        res.json({
            success: true,
            data: result,
            message: language === 'fr'
                ? 'Simulation annulée avec succès'
                : 'Simulation cancelled successfully'
        });
    }
    catch (error) {
        const language = i18nService_1.default.getLanguageFromRequest(req);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
router.put('/reschedule/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { newDate, voicePreference } = req.body;
        const userId = req.user.id;
        const language = i18nService_1.default.getLanguageFromRequest(req);
        if (!newDate) {
            return res.status(400).json({
                success: false,
                message: language === 'fr'
                    ? 'Nouvelle date requise'
                    : 'New date required'
            });
        }
        const result = await voiceSimulationService_1.default.rescheduleSimulation(id, userId, new Date(newDate), voicePreference, language);
        res.json({
            success: true,
            data: result,
            message: language === 'fr'
                ? 'Simulation reprogrammée avec succès'
                : 'Simulation rescheduled successfully'
        });
    }
    catch (error) {
        const language = i18nService_1.default.getLanguageFromRequest(req);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
router.get('/access/:simulationId', (0, temporaryAuth_1.temporaryOrRegularAuth)('voice'), async (req, res) => {
    try {
        const { simulationId } = req.params;
        const userId = req.user.id;
        const result = await voiceSimulationService_1.default.getSimulation(simulationId, userId);
        res.json({
            success: true,
            data: result,
            message: 'Voice simulation accessed successfully via temporary token'
        });
    }
    catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
});
router.get('/history', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await voiceSimulationService_1.default.getUserSimulations(userId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.get('/monthly-count', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const language = i18nService_1.default.getLanguageFromRequest(req);
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
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { subscriptionTier: true }
        });
        let limit = 0;
        if (user?.subscriptionTier === 'PREMIUM' || user?.subscriptionTier === 'PRO') {
            limit = 2;
        }
        else {
            limit = 0;
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
    }
    catch (error) {
        console.error('Error getting monthly count:', error);
        const language = i18nService_1.default.getLanguageFromRequest(req);
        res.status(500).json({
            success: false,
            message: language === 'fr'
                ? 'Erreur lors de la récupération du compte mensuel'
                : 'Failed to get monthly count'
        });
    }
});
router.post('/question-bank/upload', auth_1.authenticate, (0, auth_1.requireRole)(['SENIOR_MANAGER', 'ADMIN']), upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'PDF file is required'
            });
        }
        const { title, description, level, category } = req.body;
        const managerId = req.user.id;
        const result = await questionBankService_1.default.uploadPDF({
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
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
router.get('/question-bank/my-banks', auth_1.authenticate, (0, auth_1.requireRole)(['SENIOR_MANAGER', 'ADMIN']), async (req, res) => {
    try {
        const managerId = req.user.id;
        const result = await questionBankService_1.default.getManagerQuestionBanks(managerId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.get('/question-bank/all', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const result = await questionBankService_1.default.getAllQuestionBanks();
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.patch('/question-bank/:questionBankId/status', auth_1.authenticate, (0, auth_1.requireRole)(['SENIOR_MANAGER', 'ADMIN']), async (req, res) => {
    try {
        const { questionBankId } = req.params;
        const { isActive } = req.body;
        const userId = req.user.id;
        const result = await questionBankService_1.default.updateQuestionBankStatus(questionBankId, isActive, userId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
router.get('/question-bank/stats', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const result = await questionBankService_1.default.getQuestionBankStats();
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.post('/webhook/vapi/status', async (req, res) => {
    try {
        const { callId, status, message } = req.body;
        console.log('VAPI Status Update:', { callId, status, message });
        switch (status) {
            case 'ended':
                break;
            case 'failed':
                console.error('VAPI call failed:', message);
                break;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error handling VAPI webhook:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.post('/webhook/vapi/transcript', async (req, res) => {
    try {
        const { callId, transcript, messages } = req.body;
        console.log('VAPI Transcript Update:', { callId, transcript });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error handling VAPI transcript:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.post('/webhook/vapi/analysis', async (req, res) => {
    try {
        const { callId, analysis, summary } = req.body;
        console.log('VAPI Analysis Update:', { callId, analysis, summary });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error handling VAPI analysis:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.get('/available-slots', (req, res, next) => {
    console.log('🔍 ROUTE DEBUG: /available-slots route hit');
    console.log('🔍 ROUTE DEBUG: Headers:', req.headers.authorization ? 'Present' : 'Missing');
    next();
}, auth_1.authenticate, async (req, res) => {
    try {
        console.log('🔍 ROUTE DEBUG: Inside available-slots handler');
        const { startDate, endDate } = req.query;
        const language = i18nService_1.default.getLanguageFromRequest(req);
        let start, end;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        }
        else {
            start = new Date();
            start.setDate(start.getDate() + 1);
            start.setHours(9, 0, 0, 0);
            end = new Date();
            end.setDate(end.getDate() + 7);
            end.setHours(18, 0, 0, 0);
        }
        const availableSlots = await voiceSimulationService_1.default.findAvailableSlots(start, end);
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
    }
    catch (error) {
        const language = i18nService_1.default.getLanguageFromRequest(req);
        console.error('Error getting available slots:', error);
        res.status(400).json({
            success: false,
            message: error.message || (language === 'fr'
                ? 'Erreur lors de la recherche de créneaux'
                : 'Error finding available slots')
        });
    }
});
router.post('/create-immigration-assistant', auth_1.authenticate, async (req, res) => {
    try {
        const { voiceId, country, immigrationType, questions } = req.body;
        const language = i18nService_1.default.getLanguageFromRequest(req);
        if (!voiceId || !country || !immigrationType) {
            return res.status(400).json({
                success: false,
                message: language === 'fr'
                    ? 'Paramètres manquants: voiceId, country, immigrationType requis'
                    : 'Missing parameters: voiceId, country, immigrationType required'
            });
        }
        const assistant = await vapiService_1.default.createImmigrationAssistant(voiceId, country, immigrationType, questions || [], language);
        res.json({
            success: true,
            data: assistant,
            message: language === 'fr'
                ? 'Assistant d\'immigration créé avec succès'
                : 'Immigration assistant created successfully'
        });
    }
    catch (error) {
        const language = i18nService_1.default.getLanguageFromRequest(req);
        console.error('Error creating immigration assistant:', error);
        res.status(400).json({
            success: false,
            message: error.message || (language === 'fr'
                ? 'Erreur lors de la création de l\'assistant'
                : 'Error creating assistant')
        });
    }
});
router.get('/:simulationId', (0, temporaryAuth_1.temporaryOrRegularAuth)('voice'), async (req, res) => {
    try {
        const { simulationId } = req.params;
        const userId = req.user.id;
        const result = await voiceSimulationService_1.default.getSimulation(simulationId, userId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
});
router.post('/start/:simulationId', (0, temporaryAuth_1.temporaryOrRegularAuth)('voice'), async (req, res) => {
    try {
        const { simulationId } = req.params;
        const result = await voiceSimulationService_1.default.startSimulation(simulationId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
router.post('/end/:simulationId', (0, temporaryAuth_1.temporaryOrRegularAuth)('voice'), async (req, res) => {
    try {
        const { simulationId } = req.params;
        const result = await voiceSimulationService_1.default.endSimulation(simulationId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
router.get('/question-bank/sujets', async (req, res) => {
    try {
        const questionBanks = await prisma.questionBank.findMany({
            where: {
                isActive: true,
                category: 'GENERAL'
            },
            select: {
                id: true,
                title: true,
                extractedQuestions: true,
                level: true,
                category: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        console.log(`📚 Found ${questionBanks.length} question banks for voice simulation`);
        const allSujets = new Set();
        questionBanks.forEach(bank => {
            if (bank.extractedQuestions && Array.isArray(bank.extractedQuestions)) {
                bank.extractedQuestions.forEach((q) => {
                    if (q.question) {
                        allSujets.add(q.question);
                    }
                });
            }
            else if (bank.extractedQuestions && typeof bank.extractedQuestions === 'object') {
                const data = bank.extractedQuestions;
                if (data.questions && Array.isArray(data.questions)) {
                    data.questions.forEach((q) => {
                        if (q.question) {
                            allSujets.add(q.question);
                        }
                    });
                }
            }
        });
        const sujets = Array.from(allSujets);
        console.log(`📝 Found ${sujets.length} sujets from question banks`);
        if (sujets.length === 0) {
            const defaultSujets = [
                'Immigration et intégration',
                'Vie quotidienne et culture',
                'Travail et carrière',
                'Éducation et formation',
                'Santé et bien-être',
                'Voyages et tourisme',
                'Technologie et innovation',
                'Environnement et développement durable'
            ];
            return res.json({
                success: true,
                data: {
                    sujets: defaultSujets,
                    source: 'default',
                    message: 'Aucun contenu extrait trouvé - Utilisation des sujets par défaut'
                }
            });
        }
        res.json({
            success: true,
            data: {
                sujets: sujets.sort(),
                source: 'question_banks',
                count: sujets.length,
                message: `${sujets.length} sujets trouvés dans la banque de questions`
            }
        });
    }
    catch (error) {
        console.error('Error fetching sujets:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch sujets'
        });
    }
});
console.log('🔍 VOICE SIMULATION ROUTES: Exporting router with', router.stack.length, 'routes');
exports.default = router;
//# sourceMappingURL=voiceSimulation.js.map
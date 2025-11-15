"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const requestLogger_1 = require("../middleware/requestLogger");
const temporaryAuth_1 = require("../middleware/temporaryAuth");
const i18nService_1 = __importDefault(require("../services/i18nService"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const ImmigrationSimulationService = require('../services/immigrationSimulationService');
router.get('/history', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user.id;
        if (!userId) {
            console.error('❌ No userId found in token (immigration history):', {
                user: req.user,
                hasId: !!req.user?.id,
                hasUserId: !!req.user?.userId
            });
            return res.status(401).json({
                success: false,
                message: 'User ID not found in token'
            });
        }
        console.log('📋 Fetching immigration simulation history for user:', userId);
        const result = await ImmigrationSimulationService.getUserSimulations(userId);
        console.log('📋 Immigration simulations result:', {
            simulationsCount: Array.isArray(result) ? result.length : 0,
            result: result
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('❌ Error getting immigration simulation history:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch immigration simulation history'
        });
    }
});
router.get('/monthly-count', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user.id;
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
    }
    catch (error) {
        console.error('Error getting monthly count:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.post('/create', requestLogger_1.requestLogger, auth_1.authenticate, (0, validation_1.validate)(validation_1.immigrationSimulationSchemas.create), async (req, res) => {
    try {
        const userId = req.user.id;
        const { country, immigrationType, level, personalInfo, voicePreference, bookingType, scheduledDate, questionsData } = req.body;
        const language = i18nService_1.default.getLanguageFromRequest(req);
        const topicMap = {
            'immigration': 'skilled_worker',
            'school': 'student',
            'work': 'work_permit',
            'relocation': 'family_reunification'
        };
        const normalizedCountry = country?.toLowerCase() || '';
        const mappedImmigrationType = topicMap[immigrationType] || immigrationType || 'skilled_worker';
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { subscriptionTier: true }
        });
        const { checkSimulationLimit } = await Promise.resolve().then(() => __importStar(require('../services/simulationLimitService')));
        const limitCheck = await checkSimulationLimit(userId);
        if (!user || (user.subscriptionTier !== 'PRO' && limitCheck.subscriptionTier !== 'FREE')) {
            return res.status(403).json({
                success: false,
                message: language === 'fr'
                    ? 'Les simulations d\'immigration sont réservées aux abonnés Pro'
                    : 'Immigration simulations are exclusive to Pro subscribers'
            });
        }
        if (!limitCheck.canCreate) {
            return res.status(403).json({
                success: false,
                message: language === 'fr'
                    ? limitCheck.error || `Vous avez atteint votre limite de simulations (${limitCheck.maxSimulations}). Veuillez attendre le prochain cycle de facturation ou améliorer votre abonnement.`
                    : limitCheck.error || `You have reached your simulation limit (${limitCheck.maxSimulations}). Please wait for the next billing cycle or upgrade your subscription.`,
                limitReached: true,
                remaining: limitCheck.remaining,
                maxSimulations: limitCheck.maxSimulations
            });
        }
        const sessionData = {
            country: normalizedCountry,
            immigrationType: mappedImmigrationType,
            level: level || 'B1',
            personalInfo: personalInfo || {},
            voicePreference: voicePreference || 'france_female_1',
            bookingType: bookingType || 'AUTO',
            scheduledDate: scheduledDate || null,
            questionsData: questionsData || {}
        };
        const simulation = await ImmigrationSimulationService.createImmigrationSession(userId, sessionData);
        res.json({
            success: true,
            data: simulation,
            message: language === 'fr'
                ? 'Simulation d\'immigration créée avec succès'
                : 'Immigration simulation created successfully'
        });
    }
    catch (error) {
        const language = i18nService_1.default.getLanguageFromRequest(req);
        console.error('Error creating immigration simulation:', error);
        res.status(400).json({
            success: false,
            message: error.message || (language === 'fr'
                ? 'Erreur lors de la création de la simulation'
                : 'Error creating simulation')
        });
    }
});
router.post('/start/:id', requestLogger_1.requestLogger, (0, temporaryAuth_1.temporaryOrRegularAuth)('immigration'), (0, validation_1.validate)({ params: validation_1.immigrationSimulationSchemas.params }), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || req.user?.id || req.temporaryAuth?.userId;
        const language = i18nService_1.default.getLanguageFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: language === 'fr'
                    ? 'Authentification requise'
                    : 'Authentication required'
            });
        }
        const result = await ImmigrationSimulationService.startSession(id, userId);
        res.json({
            success: true,
            data: result,
            message: language === 'fr'
                ? 'Simulation d\'immigration démarrée'
                : 'Immigration simulation started'
        });
    }
    catch (error) {
        const language = i18nService_1.default.getLanguageFromRequest(req);
        console.error('Error starting immigration simulation:', error);
        res.status(400).json({
            success: false,
            message: error.message || (language === 'fr'
                ? 'Erreur lors du démarrage de la simulation'
                : 'Error starting simulation')
        });
    }
});
router.post('/end/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const language = i18nService_1.default.getLanguageFromRequest(req);
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
        const result = await ImmigrationSimulationService.completeSession(id, userId);
        res.json({
            success: true,
            data: result,
            message: language === 'fr'
                ? 'Simulation d\'immigration terminée'
                : 'Immigration simulation completed'
        });
    }
    catch (error) {
        const language = i18nService_1.default.getLanguageFromRequest(req);
        console.error('Error ending immigration simulation:', error);
        res.status(400).json({
            success: false,
            message: error.message || (language === 'fr'
                ? 'Erreur lors de la fin de la simulation'
                : 'Error ending simulation')
        });
    }
});
router.delete('/cancel/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || req.user?.id;
        const language = i18nService_1.default.getLanguageFromRequest(req);
        if (!userId) {
            console.error('❌ No userId found in token (immigration cancel):', {
                user: req.user,
                hasId: !!req.user?.id,
                hasUserId: !!req.user?.userId
            });
            return res.status(401).json({
                success: false,
                message: 'User ID not found in token'
            });
        }
        console.log('🗑️ Cancel immigration simulation endpoint called:', {
            simulationId: id,
            userId
        });
        const result = await ImmigrationSimulationService.cancelSimulation(id, userId, language);
        res.json({
            success: true,
            data: result,
            message: language === 'fr'
                ? 'Simulation d\'immigration annulée avec succès'
                : 'Immigration simulation cancelled successfully'
        });
    }
    catch (error) {
        const language = i18nService_1.default.getLanguageFromRequest(req);
        res.status(400).json({
            success: false,
            message: error.message || (language === 'fr'
                ? 'Erreur lors de l\'annulation'
                : 'Error cancelling simulation')
        });
    }
});
router.put('/reschedule/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { newDate, voicePreference } = req.body;
        const userId = req.user?.userId || req.user?.id;
        const language = i18nService_1.default.getLanguageFromRequest(req);
        if (!userId) {
            console.error('❌ No userId found in token (immigration reschedule):', {
                user: req.user,
                hasId: !!req.user?.id,
                hasUserId: !!req.user?.userId
            });
            return res.status(401).json({
                success: false,
                message: 'User ID not found in token'
            });
        }
        if (!newDate) {
            return res.status(400).json({
                success: false,
                message: language === 'fr'
                    ? 'Nouvelle date requise'
                    : 'New date required'
            });
        }
        console.log('📅 Reschedule immigration simulation endpoint called:', {
            simulationId: id,
            userId,
            newDate,
            voicePreference
        });
        const result = await ImmigrationSimulationService.rescheduleSimulation(id, userId, new Date(newDate), voicePreference, language);
        res.json({
            success: true,
            data: result,
            message: language === 'fr'
                ? 'Simulation d\'immigration reprogrammée avec succès'
                : 'Immigration simulation rescheduled successfully'
        });
    }
    catch (error) {
        const language = i18nService_1.default.getLanguageFromRequest(req);
        res.status(400).json({
            success: false,
            message: error.message || (language === 'fr'
                ? 'Erreur lors de la reprogrammation'
                : 'Error rescheduling simulation')
        });
    }
});
router.get('/question-bank/sujets', auth_1.authenticate, async (req, res) => {
    try {
        const questionBanks = await prisma.questionBank.findMany({
            where: {
                isActive: true,
                OR: [
                    { category: 'GENERAL' },
                    { category: 'IMMIGRATION' }
                ]
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
        console.log(`📚 Found ${questionBanks.length} question banks for immigration simulation`);
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
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            console.error('❌ No userId found in token (immigration get):', {
                user: req.user,
                hasId: !!req.user?.id,
                hasUserId: !!req.user?.userId
            });
            return res.status(401).json({
                success: false,
                message: 'User ID not found in token'
            });
        }
        const simulation = await ImmigrationSimulationService.getSession(id, userId);
        res.json({
            success: true,
            data: simulation
        });
    }
    catch (error) {
        console.error('Error getting immigration simulation:', error);
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
});
router.post('/book', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user.id;
        const { bookingType, preferredDates, country, immigrationType, level, personalInfo, voicePreference, questionsData } = req.body;
        const language = i18nService_1.default.getLanguageFromRequest(req);
        console.log('📋 Immigration booking request:', {
            userId,
            bookingType,
            preferredDates,
            country,
            immigrationType,
            level,
            voicePreference,
            hasQuestionsData: !!questionsData
        });
        const sessionData = {
            country: country || 'canada',
            immigrationType: immigrationType || 'skilled_worker',
            level: level || 'B1',
            personalInfo: personalInfo || {},
            voicePreference: voicePreference || 'france_female_1',
            bookingType: bookingType || 'AUTO',
            scheduledDate: preferredDates && preferredDates.length > 0 ? new Date(preferredDates[0]) : null,
            questionsData: questionsData || {}
        };
        const simulation = await ImmigrationSimulationService.createImmigrationSession(userId, sessionData);
        res.json({
            success: true,
            data: simulation,
            message: language === 'fr'
                ? 'Simulation d\'immigration créée avec succès'
                : 'Immigration simulation created successfully'
        });
    }
    catch (error) {
        const language = i18nService_1.default.getLanguageFromRequest(req);
        console.error('❌ Error booking immigration simulation:', {
            error: error?.message,
            stack: error?.stack,
            userId: req.user?.userId || req.user?.id,
            body: req.body
        });
        const errorMessage = error?.message || (language === 'fr'
            ? 'Erreur lors de la réservation'
            : 'Error booking simulation');
        res.status(400).json({
            success: false,
            error: {
                message: errorMessage,
                code: error?.code || 'BOOKING_ERROR'
            },
            message: errorMessage
        });
    }
});
router.get('/:id', (0, temporaryAuth_1.temporaryOrRegularAuth)('immigration'), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || req.user?.id || req.temporaryAuth?.userId;
        const language = i18nService_1.default.getLanguageFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
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
        let displayStatus = simulation.status;
        const scheduledDate = simulation.scheduledDate;
        if (scheduledDate) {
            const now = new Date();
            const scheduledDateObj = new Date(scheduledDate);
            if (simulation.status === 'SCHEDULED' && scheduledDateObj < now) {
                displayStatus = 'EXPIRED';
            }
            else if (simulation.status === 'EXPIRED' && scheduledDateObj >= now) {
                displayStatus = 'SCHEDULED';
            }
        }
        res.json({
            success: true,
            data: {
                ...simulation,
                status: displayStatus
            }
        });
    }
    catch (error) {
        console.error('Error getting immigration simulation:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch simulation'
        });
    }
});
router.delete('/delete/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || req.user.id;
        const language = i18nService_1.default.getLanguageFromRequest(req);
        const result = await ImmigrationSimulationService.deleteImmigrationSimulation(id, userId, language);
        res.json({
            success: true,
            data: result,
            message: language === 'fr'
                ? 'Simulation supprimée avec succès'
                : 'Simulation deleted successfully'
        });
    }
    catch (error) {
        const language = i18nService_1.default.getLanguageFromRequest(req);
        res.status(400).json({
            success: false,
            message: error.message || (language === 'fr'
                ? 'Erreur lors de la suppression'
                : 'Error deleting simulation')
        });
    }
});
router.post('/admin/mark-expired', (0, auth_1.requireRole)(['ADMIN', 'SENIOR_MANAGER']), async (req, res) => {
    try {
        const result = await ImmigrationSimulationService.markExpiredImmigrationSessions();
        res.json({
            success: true,
            data: result,
            message: `Marked ${result.scheduled + result.active} expired immigration sessions`
        });
    }
    catch (error) {
        console.error('Error marking expired immigration sessions:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark expired sessions'
        });
    }
});
exports.default = router;
//# sourceMappingURL=immigrationSimulation.js.map
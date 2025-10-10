"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const requestLogger_1 = require("../middleware/requestLogger");
const i18nService_1 = __importDefault(require("../services/i18nService"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const ImmigrationSimulationService = require('../services/immigrationSimulationService');
router.get('/history/user', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await ImmigrationSimulationService.getUserSimulations(userId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error getting immigration simulation history:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.get('/monthly-count/user', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
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
        const { country, immigrationType, level, personalInfo, voicePreference } = req.body;
        const language = i18nService_1.default.getLanguageFromRequest(req);
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
router.post('/start/:id', requestLogger_1.requestLogger, auth_1.authenticate, (0, validation_1.validate)({ params: validation_1.immigrationSimulationSchemas.params }), async (req, res) => {
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
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
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
exports.default = router;
//# sourceMappingURL=immigrationSimulation.js.map
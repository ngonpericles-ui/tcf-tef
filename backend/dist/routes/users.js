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
exports.userRoutes = void 0;
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const connection_1 = require("../database/connection");
const userController_1 = require("../controllers/userController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.userRoutes = router;
router.get('/profile', auth_1.authenticate, userController_1.UserController.getProfile);
router.put('/profile', auth_1.authenticate, (0, validation_1.validate)(validation_1.userSchemas.updateProfile), userController_1.UserController.updateProfile);
router.post('/upload-profile-image', auth_1.authenticate, async (req, res, next) => {
    try {
        const { FileUploadController } = await Promise.resolve().then(() => __importStar(require('../controllers/fileUploadController')));
        const { FileUploadService } = await Promise.resolve().then(() => __importStar(require('../services/fileUploadService')));
        const profileImageUpload = FileUploadService.configureMulter({
            category: 'PROFILE_IMAGE',
            maxSize: 5 * 1024 * 1024,
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
        });
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'User not authenticated',
                    code: 'AUTH_ERROR'
                }
            });
        }
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
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'User not authenticated',
                        code: 'AUTH_ERROR'
                    }
                });
            }
            try {
                await FileUploadController.uploadProfileImage(req, res);
            }
            catch (controllerError) {
                console.error('❌ FileUploadController error:', controllerError);
                next(controllerError);
            }
        });
    }
    catch (error) {
        console.error('❌ Error in /users/upload-profile-image route:', error);
        next(error);
    }
});
router.post('/change-password', auth_1.authenticate, (0, validation_1.validate)(validation_1.userSchemas.changePassword), userController_1.UserController.changePassword);
router.get('/dashboard', auth_1.authenticate, userController_1.UserController.getDashboardStats);
router.post('/preferences/voice', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { voiceId, voiceName, gender, accent } = req.body;
        if (!voiceId) {
            return res.status(400).json({
                success: false,
                message: 'Voice ID is required'
            });
        }
        const user = await connection_1.prisma.user.findUnique({
            where: { id: userId },
            select: { preferences: true }
        });
        const currentPreferences = user?.preferences || {};
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
        await connection_1.prisma.user.update({
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
    }
    catch (error) {
        console.error('Error saving voice preference:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to save voice preference'
        });
    }
});
router.get('/preferences/voice', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await connection_1.prisma.user.findUnique({
            where: { id: userId },
            select: { preferences: true }
        });
        const preferences = user?.preferences || {};
        const voicePreference = preferences.voice || null;
        res.json({
            success: true,
            data: voicePreference
        });
    }
    catch (error) {
        console.error('Error getting voice preference:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get voice preference'
        });
    }
});
router.get('/', auth_1.authenticate, auth_1.requireManager, userController_1.UserController.getAllUsers);
router.get('/:userId', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validateParams)({ userId: validation_1.commonSchemas.id }), userController_1.UserController.getUserById);
router.put('/:userId/role', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)({ userId: validation_1.commonSchemas.id }), (0, validation_1.validate)(joi_1.default.object({ role: validation_1.commonSchemas.role.required() })), userController_1.UserController.updateUserRole);
router.put('/:userId/status', auth_1.authenticate, auth_1.requireSeniorManager, (0, validation_1.validateParams)({ userId: validation_1.commonSchemas.id }), (0, validation_1.validate)(joi_1.default.object({ status: joi_1.default.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').required() })), userController_1.UserController.updateUserStatus);
router.delete('/:userId', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)({ userId: validation_1.commonSchemas.id }), userController_1.UserController.deleteUser);
router.get('/health', userController_1.UserController.healthCheck);
router.get('/testimonials', async (req, res) => {
    try {
        const students = await connection_1.prisma.user.findMany({
            where: {
                role: 'STUDENT',
                status: 'ACTIVE',
                testAttempts: {
                    some: {
                        status: 'COMPLETED'
                    }
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                currentLevel: true,
                testAttempts: {
                    where: {
                        status: 'COMPLETED'
                    },
                    orderBy: {
                        completedAt: 'desc'
                    },
                    take: 1,
                    select: {
                        score: true,
                        test: {
                            select: {
                                level: true
                            }
                        },
                        feedback: true
                    }
                },
                _count: {
                    select: {
                        testAttempts: {
                            where: {
                                status: 'COMPLETED'
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });
        const testimonials = students
            .filter(student => {
            return student.testAttempts.length > 0 && student.currentLevel;
        })
            .slice(0, 5)
            .map(student => {
            const latestAttempt = student.testAttempts[0];
            let feedbackData = {};
            if (latestAttempt.feedback) {
                try {
                    feedbackData = JSON.parse(latestAttempt.feedback);
                }
                catch (e) {
                }
            }
            const initialLevel = 'A1';
            const currentLevel = student.currentLevel || latestAttempt.test.level || 'A1';
            const quotes = [
                "J'ai réussi mon TCF grâce à l'IA explicable",
                "La préparation adaptative a changé ma vie",
                "Les sessions live sont incroyables",
                "Meilleure plateforme de préparation",
                "Le feedback IA est exceptionnel",
                "La simulation vocale m'a beaucoup aidé",
                "Les tests blancs sont très réalistes",
                "J'ai progressé rapidement grâce à AURA"
            ];
            const quoteIndex = parseInt(student.id.slice(-1), 16) % quotes.length;
            const quote = quotes[quoteIndex];
            return {
                id: student.id,
                name: `${student.firstName} ${student.lastName.charAt(0)}.`,
                fullName: `${student.firstName} ${student.lastName}`,
                profileImage: student.profileImage,
                initialLevel,
                currentLevel,
                score: `${initialLevel} → ${currentLevel}`,
                quote,
                testCount: student._count.testAttempts,
                latestScore: latestAttempt.score || 0
            };
        });
        res.json({
            success: true,
            data: testimonials
        });
    }
    catch (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch testimonials'
        });
    }
});
//# sourceMappingURL=users.js.map
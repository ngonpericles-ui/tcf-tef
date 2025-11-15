"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const authController_1 = require("@/controllers/authController");
const validation_1 = require("@/middleware/validation");
const auth_1 = require("@/middleware/auth");
const temporaryTokenService_1 = __importDefault(require("@/services/temporaryTokenService"));
const router = (0, express_1.Router)();
exports.authRoutes = router;
router.post('/register', (0, validation_1.validate)(validation_1.authSchemas.register), authController_1.AuthController.register);
router.post('/register-admin', (0, validation_1.validate)(validation_1.authSchemas.register), authController_1.AuthController.registerAdmin);
router.post('/login', (0, validation_1.validate)(validation_1.authSchemas.login), authController_1.AuthController.login);
router.post('/refresh', (0, validation_1.validate)(validation_1.authSchemas.refreshToken), authController_1.AuthController.refreshToken);
router.post('/logout', authController_1.AuthController.logout);
router.post('/logout-all', auth_1.authenticate, authController_1.AuthController.logoutAll);
router.post('/social/google', (0, validation_1.validate)(validation_1.authSchemas.googleAuth), authController_1.AuthController.googleAuth);
router.get('/profile', auth_1.authenticate, authController_1.AuthController.getProfile);
router.get('/verify', auth_1.authenticate, authController_1.AuthController.verifyToken);
router.post('/activity', auth_1.authenticate, authController_1.AuthController.updateActivity);
router.post('/social/google', (0, validation_1.validate)(validation_1.authSchemas.socialAuth), authController_1.AuthController.googleAuth);
router.post('/social/apple', (0, validation_1.validate)(validation_1.authSchemas.socialAuth), authController_1.AuthController.appleAuth);
router.post('/social/facebook', (0, validation_1.validate)(validation_1.authSchemas.socialAuth), authController_1.AuthController.facebookAuth);
router.post('/generate-temporary-token', auth_1.authenticate, async (req, res) => {
    try {
        const { userId, simulationId, purpose } = req.body;
        let simulationType;
        if (purpose === 'voice_simulation_access') {
            simulationType = 'voice';
        }
        else if (purpose === 'immigration_simulation_access') {
            simulationType = 'immigration';
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Invalid purpose. Must be voice_simulation_access or immigration_simulation_access'
            });
        }
        const token = await temporaryTokenService_1.default.generateToken(userId, simulationId, simulationType, 2);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 2);
        res.json({
            success: true,
            data: {
                token,
                expiresAt: expiresAt.toISOString(),
                purpose,
                simulationType
            }
        });
    }
    catch (error) {
        console.error('Error generating temporary token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate temporary token'
        });
    }
});
router.get('/health', authController_1.AuthController.healthCheck);
router.post('/forgot-password', (0, validation_1.validate)(validation_1.authSchemas.forgotPassword), authController_1.AuthController.forgotPassword);
router.post('/verify-reset-code', (0, validation_1.validate)(validation_1.authSchemas.verifyResetCode), authController_1.AuthController.verifyResetCode);
router.post('/reset-password', (0, validation_1.validate)(validation_1.authSchemas.resetPassword), authController_1.AuthController.resetPassword);
router.post('/resend-reset-code', (0, validation_1.validate)(validation_1.authSchemas.resendResetCode), authController_1.AuthController.resendResetCode);
//# sourceMappingURL=auth.js.map
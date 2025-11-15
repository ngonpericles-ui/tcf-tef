"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("@/services/authService");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = require("@/utils/logger");
require("@/middleware/auth");
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
AuthController.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const registerData = req.body;
    const result = await authService_1.AuthService.register(registerData);
    const response = {
        success: true,
        data: {
            user: result.user,
            tokens: result.tokens
        },
        message: 'User registered successfully'
    };
    logger_1.logger.info('User registration successful', {
        userId: result.user.id,
        email: result.user.email
    });
    res.status(201).json(response);
});
AuthController.registerAdmin = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const registerData = req.body;
    const result = await authService_1.AuthService.registerAdmin(registerData);
    const response = {
        success: true,
        data: {
            user: result.user,
            tokens: result.tokens
        },
        message: 'Admin user registered successfully'
    };
    logger_1.logger.info('Admin registration successful', {
        userId: result.user.id,
        email: result.user.email
    });
    res.status(201).json(response);
});
AuthController.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const loginData = req.body;
    const result = await authService_1.AuthService.login(loginData);
    const response = {
        success: true,
        data: {
            user: result.user,
            tokens: result.tokens
        },
        message: 'Login successful'
    };
    logger_1.logger.info('User login successful', {
        userId: result.user.id,
        email: result.user.email
    });
    res.status(200).json(response);
});
AuthController.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const refreshData = req.body;
    const tokens = await authService_1.AuthService.refreshToken(refreshData);
    const response = {
        success: true,
        data: { tokens },
        message: 'Token refreshed successfully'
    };
    res.status(200).json(response);
});
AuthController.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await authService_1.AuthService.logout(refreshToken);
    }
    const response = {
        success: true,
        message: 'Logout successful'
    };
    res.status(200).json(response);
});
AuthController.logoutAll = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await authService_1.AuthService.logoutAll(userId);
    const response = {
        success: true,
        message: 'Logged out from all devices successfully'
    };
    res.status(200).json(response);
});
AuthController.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const user = await authService_1.AuthService.getUserProfile(userId);
    const response = {
        success: true,
        data: { user },
        message: 'Profile retrieved successfully'
    };
    res.status(200).json(response);
});
AuthController.verifyToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const response = {
        success: true,
        data: {
            user: req.user,
            isValid: true
        },
        message: 'Token is valid'
    };
    res.status(200).json(response);
});
AuthController.updateActivity = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await authService_1.AuthService.updateUserActivity(userId);
    const response = {
        success: true,
        data: { lastActivityAt: new Date() },
        message: 'Activity updated successfully'
    };
    res.status(200).json(response);
});
AuthController.appleAuth = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { idToken } = req.body;
    const result = await authService_1.AuthService.authenticateWithApple(idToken);
    if (result.success) {
        const response = {
            success: true,
            data: result.data,
            message: 'Apple authentication successful'
        };
        res.status(200).json(response);
    }
    else {
        const response = {
            success: false,
            error: result.error
        };
        res.status(400).json(response);
    }
});
AuthController.facebookAuth = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { idToken } = req.body;
    const result = await authService_1.AuthService.authenticateWithFacebook(idToken);
    if (result.success) {
        const response = {
            success: true,
            data: result.data,
            message: 'Facebook authentication successful'
        };
        res.status(200).json(response);
    }
    else {
        const response = {
            success: false,
            error: result.error
        };
        res.status(400).json(response);
    }
});
AuthController.googleAuth = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { idToken, email, firstName, lastName, profileImage } = req.body;
    const result = await authService_1.AuthService.googleAuth({
        idToken,
        email,
        firstName,
        lastName,
        profileImage
    });
    if (result.success) {
        const response = {
            success: true,
            data: {
                user: result.user,
                tokens: result.tokens
            },
            message: result.isNewUser ? 'User registered successfully with Google' : 'User logged in successfully with Google'
        };
        logger_1.logger.info('Google authentication successful', {
            userId: result.user?.id,
            email: result.user?.email,
            isNewUser: result.isNewUser
        });
        res.status(result.isNewUser ? 201 : 200).json(response);
    }
    else {
        const response = {
            success: false,
            error: result.error
        };
        res.status(400).json(response);
    }
});
AuthController.healthCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const response = {
        success: true,
        data: {
            service: 'auth',
            status: 'healthy',
            timestamp: new Date().toISOString()
        },
        message: 'Auth service is healthy'
    };
    res.status(200).json(response);
});
AuthController.forgotPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { method, email, phone, lang } = req.body;
    const result = await authService_1.AuthService.requestPasswordReset({
        method,
        email,
        phone,
        lang: lang || 'fr'
    });
    if (result.success) {
        const response = {
            success: true,
            message: result.message || 'Password reset code sent successfully'
        };
        res.status(200).json(response);
    }
    else {
        const response = {
            success: false,
            error: { message: result.error || 'Failed to send password reset code' }
        };
        res.status(400).json(response);
    }
});
AuthController.verifyResetCode = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { code, method, email, phone } = req.body;
    const result = await authService_1.AuthService.verifyPasswordResetCode({
        code,
        method,
        email,
        phone
    });
    if (result.success && result.tokenId) {
        const response = {
            success: true,
            data: {
                tokenId: result.tokenId
            },
            message: 'Reset code verified successfully'
        };
        res.status(200).json(response);
    }
    else {
        const response = {
            success: false,
            error: { message: result.error || 'Invalid or expired reset code' }
        };
        res.status(400).json(response);
    }
});
AuthController.resetPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { tokenId, newPassword } = req.body;
    const result = await authService_1.AuthService.resetPassword({
        tokenId,
        newPassword
    });
    if (result.success) {
        const response = {
            success: true,
            message: result.message || 'Password reset successfully'
        };
        res.status(200).json(response);
    }
    else {
        const response = {
            success: false,
            error: { message: result.error || 'Failed to reset password' }
        };
        res.status(400).json(response);
    }
});
AuthController.resendResetCode = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { method, email, phone, lang } = req.body;
    const result = await authService_1.AuthService.resendPasswordResetCode({
        method,
        email,
        phone,
        lang: lang || 'fr'
    });
    if (result.success) {
        const response = {
            success: true,
            message: result.message || 'Reset code resent successfully'
        };
        res.status(200).json(response);
    }
    else {
        const response = {
            success: false,
            error: { message: result.error || 'Failed to resend reset code' }
        };
        res.status(400).json(response);
    }
});
//# sourceMappingURL=authController.js.map
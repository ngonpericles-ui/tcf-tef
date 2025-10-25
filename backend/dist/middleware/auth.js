"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePaidSubscription = exports.requirePremium = exports.requireRole = exports.requireAdmin = exports.requireSeniorManager = exports.requireManager = exports.authorizeResourceOwner = exports.requireSubscriptionTier = exports.authorize = exports.optionalAuthenticate = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new errorHandler_1.AuthenticationError('Authorization header is required');
        }
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;
        if (!token) {
            throw new errorHandler_1.AuthenticationError('Token is required');
        }
        const decoded = jwt_1.JWTService.verifyAccessToken(token);
        req.user = decoded;
        logger_1.logger.debug('User authenticated', {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        });
        next();
    }
    catch (error) {
        let message = 'Authentication required';
        if (error instanceof Error) {
            if (error.message.includes('expired')) {
                message = 'Token has expired';
            }
            else if (error.message.includes('invalid')) {
                message = 'Invalid token';
            }
            else {
                message = error.message;
            }
        }
        res.status(401).json({
            success: false,
            message: message
        });
    }
};
exports.authenticate = authenticate;
const optionalAuthenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next();
        }
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;
        if (!token) {
            return next();
        }
        const decoded = jwt_1.JWTService.verifyAccessToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new errorHandler_1.AuthenticationError('Authentication required');
            }
            if (!allowedRoles.includes(req.user.role)) {
                throw new errorHandler_1.AuthorizationError(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
            }
            logger_1.logger.debug('User authorized', {
                userId: req.user.userId,
                role: req.user.role,
                allowedRoles
            });
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
const requireSubscriptionTier = (...allowedTiers) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new errorHandler_1.AuthenticationError('Authentication required');
            }
            if (!allowedTiers.includes(req.user.subscriptionTier)) {
                throw new errorHandler_1.AuthorizationError(`Subscription upgrade required. Required tiers: ${allowedTiers.join(', ')}`);
            }
            logger_1.logger.debug('Subscription tier authorized', {
                userId: req.user.userId,
                subscriptionTier: req.user.subscriptionTier,
                allowedTiers
            });
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireSubscriptionTier = requireSubscriptionTier;
const authorizeResourceOwner = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new errorHandler_1.AuthenticationError('Authentication required');
            }
            if (req.user.role === client_1.UserRole.ADMIN || req.user.role === client_1.UserRole.SENIOR_MANAGER) {
                return next();
            }
            const resourceUserId = req.params[resourceUserIdField] ||
                req.body[resourceUserIdField] ||
                req.query[resourceUserIdField];
            if (!resourceUserId) {
                throw new errorHandler_1.AuthorizationError('Resource user ID not found');
            }
            if (req.user.userId !== resourceUserId) {
                throw new errorHandler_1.AuthorizationError('Access denied. You can only access your own resources');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorizeResourceOwner = authorizeResourceOwner;
exports.requireManager = (0, exports.authorize)(client_1.UserRole.JUNIOR_MANAGER, client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.ADMIN);
exports.requireSeniorManager = (0, exports.authorize)(client_1.UserRole.SENIOR_MANAGER, client_1.UserRole.ADMIN);
exports.requireAdmin = (0, exports.authorize)(client_1.UserRole.ADMIN);
const requireRole = (roles) => {
    return (0, exports.authorize)(...roles);
};
exports.requireRole = requireRole;
exports.requirePremium = (0, exports.requireSubscriptionTier)(client_1.SubscriptionTier.PREMIUM, client_1.SubscriptionTier.PRO);
exports.requirePaidSubscription = (0, exports.requireSubscriptionTier)(client_1.SubscriptionTier.ESSENTIAL, client_1.SubscriptionTier.PREMIUM, client_1.SubscriptionTier.PRO);
//# sourceMappingURL=auth.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.temporaryOrRegularAuth = exports.simulationAccessMiddleware = exports.temporaryAuthMiddleware = void 0;
const client_1 = require("@prisma/client");
const temporaryTokenService_1 = __importDefault(require("../services/temporaryTokenService"));
const prisma = new client_1.PrismaClient();
const temporaryAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.query.token;
        if (!token) {
            return next();
        }
        console.log('🔑 Temporary token detected, validating...');
        const validation = await temporaryTokenService_1.default.validateToken(token);
        if (!validation.isValid) {
            console.log('❌ Temporary token validation failed:', validation.error);
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired access link',
                error: validation.error
            });
        }
        console.log('✅ Temporary token validated successfully');
        const user = await prisma.user.findUnique({
            where: { id: validation.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                subscriptionTier: true
            }
        });
        if (!user || user.status !== 'ACTIVE') {
            console.log('❌ User not found or inactive');
            return res.status(401).json({
                success: false,
                message: 'User account not found or inactive'
            });
        }
        req.temporaryAuth = {
            userId: validation.userId,
            simulationId: validation.simulationId,
            simulationType: validation.simulationType,
            isTemporary: true
        };
        req.user = {
            ...user,
            userId: user.id,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 7200
        };
        console.log(`🎯 Temporary access granted for ${validation.simulationType} simulation ${validation.simulationId}`);
        await temporaryTokenService_1.default.invalidateToken(token);
        next();
    }
    catch (error) {
        console.error('Error in temporary auth middleware:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};
exports.temporaryAuthMiddleware = temporaryAuthMiddleware;
const simulationAccessMiddleware = (simulationType) => {
    return async (req, res, next) => {
        try {
            const simulationId = req.params.id || req.params.simulationId;
            if (!simulationId) {
                return res.status(400).json({
                    success: false,
                    message: 'Simulation ID is required'
                });
            }
            let userId;
            let hasAccess = false;
            if (req.temporaryAuth) {
                userId = req.temporaryAuth.userId;
                if (req.temporaryAuth.simulationId === simulationId &&
                    req.temporaryAuth.simulationType === simulationType) {
                    hasAccess = true;
                }
            }
            else if (req.user) {
                userId = req.user.id;
                hasAccess = true;
            }
            else {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            if (hasAccess) {
                let simulation;
                if (simulationType === 'voice') {
                    simulation = await prisma.voiceSimulation.findFirst({
                        where: { id: simulationId, userId }
                    });
                }
                else if (simulationType === 'immigration') {
                    simulation = await prisma.immigrationSimulation.findFirst({
                        where: { id: simulationId, userId }
                    });
                }
                if (!simulation) {
                    return res.status(404).json({
                        success: false,
                        message: 'Simulation not found or access denied'
                    });
                }
            }
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this simulation'
                });
            }
            next();
        }
        catch (error) {
            console.error('Error in simulation access middleware:', error);
            res.status(500).json({
                success: false,
                message: 'Access verification error'
            });
        }
    };
};
exports.simulationAccessMiddleware = simulationAccessMiddleware;
const temporaryOrRegularAuth = (simulationType) => {
    return [
        exports.temporaryAuthMiddleware,
        (0, exports.simulationAccessMiddleware)(simulationType)
    ];
};
exports.temporaryOrRegularAuth = temporaryOrRegularAuth;
//# sourceMappingURL=temporaryAuth.js.map
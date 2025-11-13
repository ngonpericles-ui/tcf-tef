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
exports.temporaryOrRegularAuth = exports.simulationAccessMiddleware = exports.temporaryAuthMiddleware = void 0;
const client_1 = require("@prisma/client");
const temporaryTokenService_1 = __importDefault(require("../services/temporaryTokenService"));
const prisma = new client_1.PrismaClient();
const temporaryAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.query.token || req.headers['x-token'];
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
                userId = req.user.userId || req.user.id;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: 'User ID not found in token'
                    });
                }
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
                const now = new Date();
                let scheduledDate = null;
                if (simulationType === 'voice') {
                    scheduledDate = simulation.scheduledDate ? new Date(simulation.scheduledDate) : null;
                }
                else if (simulationType === 'immigration') {
                    try {
                        const personalInfo = simulation.personalInfo;
                        const personalInfoParsed = typeof personalInfo === 'string' ? JSON.parse(personalInfo) : (personalInfo || {});
                        if (personalInfoParsed.scheduledDate) {
                            scheduledDate = new Date(personalInfoParsed.scheduledDate);
                        }
                    }
                    catch (e) {
                        console.warn('Failed to parse personalInfo for scheduledDate in middleware:', e);
                    }
                }
                if (!scheduledDate) {
                    const createdAt = simulation.createdAt ? new Date(simulation.createdAt) : now;
                    scheduledDate = new Date(createdAt.getTime() + 5 * 60 * 1000);
                }
                const durationInSeconds = simulation.duration || 300;
                const estimatedEndTime = new Date(scheduledDate.getTime() + durationInSeconds * 1000);
                if (simulation.status === 'COMPLETED' || simulation.status === 'FINISHED') {
                    const endedAt = simulationType === 'voice'
                        ? simulation.updatedAt || simulation.completedAt || estimatedEndTime
                        : simulation.completedAt || simulation.endedAt || estimatedEndTime;
                    if (endedAt) {
                        const endTime = new Date(endedAt);
                        const timeSinceEnd = (now.getTime() - endTime.getTime()) / (1000 * 60);
                        if (timeSinceEnd > 2) {
                            return res.status(403).json({
                                success: false,
                                message: 'This simulation has ended. Access links expire 2 minutes after completion for security reasons.',
                                code: 'SIMULATION_ENDED'
                            });
                        }
                    }
                }
                const timeUntilStart = (scheduledDate.getTime() - now.getTime()) / (1000 * 60);
                if (timeUntilStart > 5) {
                    return res.status(403).json({
                        success: false,
                        message: `This link will be accessible 5 minutes before the simulation starts (in ${Math.ceil(timeUntilStart - 5)} minute${Math.ceil(timeUntilStart - 5) > 1 ? 's' : ''}).`,
                        code: 'TOO_EARLY',
                        minutesUntilAccessible: Math.ceil(timeUntilStart - 5),
                        scheduledDate: scheduledDate.toISOString()
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
    return async (req, res, next) => {
        const tempToken = req.query.token || req.headers['x-token'];
        if (tempToken) {
            await (0, exports.temporaryAuthMiddleware)(req, res, async () => {
                if (req.user || req.temporaryAuth) {
                    await (0, exports.simulationAccessMiddleware)(simulationType)(req, res, next);
                }
                else {
                    const { authenticate } = await Promise.resolve().then(() => __importStar(require('./auth')));
                    authenticate(req, res, () => {
                        (0, exports.simulationAccessMiddleware)(simulationType)(req, res, next);
                    });
                }
            });
        }
        else {
            const { authenticate } = await Promise.resolve().then(() => __importStar(require('./auth')));
            authenticate(req, res, () => {
                (0, exports.simulationAccessMiddleware)(simulationType)(req, res, next);
            });
        }
    };
};
exports.temporaryOrRegularAuth = temporaryOrRegularAuth;
//# sourceMappingURL=temporaryAuth.js.map
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
const connection_1 = require("../database/connection");
const crypto_1 = __importDefault(require("crypto"));
class TemporaryTokenService {
    static async generateToken(userId, simulationId, simulationType, expirationHours = 2) {
        try {
            const token = crypto_1.default.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + expirationHours);
            const tokenData = {
                userId,
                simulationId,
                simulationType,
                expiresAt
            };
            await this.storeTokenData(token, tokenData);
            return token;
        }
        catch (error) {
            console.error('Error generating temporary token:', error);
            throw new Error('Failed to generate temporary token');
        }
    }
    static async validateToken(token) {
        try {
            if (!token) {
                return { isValid: false, error: 'Token is required' };
            }
            const tokenData = await this.getTokenData(token);
            if (!tokenData) {
                return { isValid: false, error: 'Invalid token' };
            }
            const now = new Date();
            if (now > tokenData.expiresAt) {
                await this.deleteToken(token);
                return { isValid: false, error: 'Token has expired' };
            }
            const simulationExists = await this.verifySimulationExists(tokenData.userId, tokenData.simulationId, tokenData.simulationType);
            if (!simulationExists) {
                await this.deleteToken(token);
                return { isValid: false, error: 'Simulation not found or access denied' };
            }
            if (tokenData.simulationType === 'voice') {
                const { prisma } = await Promise.resolve().then(() => __importStar(require('../database/connection')));
                const simulation = await prisma.voiceSimulation.findUnique({
                    where: { id: tokenData.simulationId }
                });
                if (!simulation) {
                    return { isValid: false, error: 'Simulation not found' };
                }
                if (simulation.status === 'COMPLETED' || simulation.status === 'CANCELLED') {
                    return { isValid: false, error: 'Cette simulation est terminée ou annulée' };
                }
                const scheduledDate = new Date(simulation.scheduledDate);
                const timeUntilStart = scheduledDate.getTime() - now.getTime();
                const minutesUntilStart = timeUntilStart / (1000 * 60);
                const simulationEnd = new Date(scheduledDate.getTime() + simulation.duration * 1000);
                if (now > simulationEnd) {
                    await this.deleteToken(token);
                    return { isValid: false, error: 'Cette simulation est terminée' };
                }
                if (minutesUntilStart <= 0 && now <= simulationEnd) {
                    return {
                        isValid: true,
                        userId: tokenData.userId,
                        simulationId: tokenData.simulationId,
                        simulationType: tokenData.simulationType
                    };
                }
                if (minutesUntilStart > 0) {
                    return {
                        isValid: true,
                        userId: tokenData.userId,
                        simulationId: tokenData.simulationId,
                        simulationType: tokenData.simulationType
                    };
                }
            }
            return {
                isValid: true,
                userId: tokenData.userId,
                simulationId: tokenData.simulationId,
                simulationType: tokenData.simulationType
            };
        }
        catch (error) {
            console.error('Error validating temporary token:', error);
            return { isValid: false, error: 'Token validation failed' };
        }
    }
    static async invalidateToken(token) {
        try {
            await this.deleteToken(token);
        }
        catch (error) {
            console.error('Error invalidating token:', error);
        }
    }
    static async cleanupExpiredTokens() {
        try {
            console.log('Cleaning up expired tokens...');
        }
        catch (error) {
            console.error('Error cleaning up expired tokens:', error);
        }
    }
    static async storeTokenData(token, data) {
        try {
            const tokenData = {
                ...data,
                createdAt: new Date(),
                token
            };
            if (!global.temporaryTokens) {
                global.temporaryTokens = new Map();
            }
            global.temporaryTokens.set(token, tokenData);
            console.log(`✅ Token stored: ${token} for user ${data.userId}`);
        }
        catch (error) {
            console.error('Error storing token data:', error);
            throw error;
        }
    }
    static async getTokenData(token) {
        try {
            if (!global.temporaryTokens) {
                return null;
            }
            const tokenData = global.temporaryTokens.get(token);
            if (!tokenData) {
                return null;
            }
            const { token: _, createdAt, ...data } = tokenData;
            return data;
        }
        catch (error) {
            console.error('Error getting token data:', error);
            return null;
        }
    }
    static async deleteToken(token) {
        try {
            if (global.temporaryTokens) {
                global.temporaryTokens.delete(token);
                console.log(`🗑️ Token deleted: ${token}`);
            }
        }
        catch (error) {
            console.error('Error deleting token:', error);
        }
    }
    static async verifySimulationExists(userId, simulationId, simulationType) {
        try {
            if (simulationType === 'voice') {
                const simulation = await connection_1.prisma.voiceSimulation.findFirst({
                    where: { id: simulationId, userId }
                });
                return !!simulation;
            }
            else if (simulationType === 'immigration') {
                const simulation = await connection_1.prisma.immigrationSimulation.findFirst({
                    where: { id: simulationId, userId }
                });
                return !!simulation;
            }
            return false;
        }
        catch (error) {
            console.error('Error verifying simulation:', error);
            return false;
        }
    }
}
exports.default = TemporaryTokenService;
//# sourceMappingURL=temporaryTokenService.js.map
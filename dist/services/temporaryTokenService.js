"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
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
                const simulation = await prisma.voiceSimulation.findFirst({
                    where: { id: simulationId, userId }
                });
                return !!simulation;
            }
            else if (simulationType === 'immigration') {
                const simulation = await prisma.immigrationSimulation.findFirst({
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
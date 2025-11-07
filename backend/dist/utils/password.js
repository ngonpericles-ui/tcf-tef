"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("../utils/logger");
class PasswordService {
    static getSaltRounds(role) {
        switch (role) {
            case 'ADMIN':
            case 'SENIOR_MANAGER':
            case 'JUNIOR_MANAGER':
                return this.ADMIN_SALT_ROUNDS;
            case 'STUDENT':
            case 'USER':
            default:
                return this.STUDENT_SALT_ROUNDS;
        }
    }
    static async hashPassword(password, role) {
        try {
            if (!password || password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }
            const saltRounds = this.getSaltRounds(role);
            const salt = await bcryptjs_1.default.genSalt(saltRounds);
            const hashedPassword = await bcryptjs_1.default.hash(password, salt);
            logger_1.logger.info(`Password hashed with ${saltRounds} salt rounds for role: ${role || 'default'}`);
            return hashedPassword;
        }
        catch (error) {
            logger_1.logger.error('Error hashing password', error);
            throw new Error('Failed to hash password');
        }
    }
    static async verifyPassword(password, hashedPassword) {
        try {
            if (!password || !hashedPassword) {
                return false;
            }
            const isValid = await bcryptjs_1.default.compare(password, hashedPassword);
            return isValid;
        }
        catch (error) {
            logger_1.logger.error('Error verifying password', error);
            return false;
        }
    }
    static validatePasswordStrength(password) {
        const errors = [];
        let score = 0;
        if (password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }
        else if (password.length >= 8) {
            score += 1;
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        else {
            score += 1;
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        else {
            score += 1;
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        else {
            score += 1;
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        else {
            score += 1;
        }
        const commonPatterns = [
            /123456/,
            /password/i,
            /qwerty/i,
            /abc123/i,
            /admin/i
        ];
        for (const pattern of commonPatterns) {
            if (pattern.test(password)) {
                errors.push('Password contains common patterns and is not secure');
                score = Math.max(0, score - 2);
                break;
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            score: Math.min(5, score)
        };
    }
    static generateRandomPassword(length = 12) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const allChars = lowercase + uppercase + numbers + symbols;
        let password = '';
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        for (let i = 4; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
    static generateTemporaryPassword() {
        return this.generateRandomPassword(8);
    }
}
exports.PasswordService = PasswordService;
PasswordService.ADMIN_SALT_ROUNDS = 8;
PasswordService.STUDENT_SALT_ROUNDS = 10;
//# sourceMappingURL=password.js.map
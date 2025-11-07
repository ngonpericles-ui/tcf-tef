"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.BusinessLogicError = exports.FileError = exports.DatabaseError = exports.ExternalServiceError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}
exports.AuthorizationError = AuthorizationError;
class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'FORBIDDEN_ERROR');
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND_ERROR');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT_ERROR');
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_ERROR');
    }
}
exports.RateLimitError = RateLimitError;
class ExternalServiceError extends AppError {
    constructor(message = 'External service error', service = 'unknown') {
        super(message, 502, 'EXTERNAL_SERVICE_ERROR');
        this.service = service;
    }
}
exports.ExternalServiceError = ExternalServiceError;
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', operation = 'unknown') {
        super(message, 500, 'DATABASE_ERROR');
        this.operation = operation;
    }
}
exports.DatabaseError = DatabaseError;
class FileError extends AppError {
    constructor(message = 'File operation failed', operation = 'unknown') {
        super(message, 500, 'FILE_ERROR');
        this.operation = operation;
    }
}
exports.FileError = FileError;
class BusinessLogicError extends AppError {
    constructor(message = 'Business rule violation') {
        super(message, 422, 'BUSINESS_LOGIC_ERROR');
    }
}
exports.BusinessLogicError = BusinessLogicError;
const errorHandler = (err, req, res, next) => {
    const { logger } = require('./logger');
    logger.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId || 'anonymous'
    });
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
                code: err.code,
                details: err.details || null
            }
        });
        return;
    }
    if (err.code && err.code.startsWith('P')) {
        handlePrismaError(err, res);
        return;
    }
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            error: {
                message: 'Invalid token',
                code: 'INVALID_TOKEN'
            }
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            error: {
                message: 'Token expired',
                code: 'TOKEN_EXPIRED'
            }
        });
        return;
    }
    if (err.name === 'ValidationError' && err.details) {
        res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: err.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            }
        });
        return;
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
            success: false,
            error: {
                message: 'File too large',
                code: 'FILE_TOO_LARGE'
            }
        });
        return;
    }
    res.status(500).json({
        success: false,
        error: {
            message: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message,
            code: 'INTERNAL_ERROR'
        }
    });
};
exports.errorHandler = errorHandler;
const handlePrismaError = (err, res) => {
    switch (err.code) {
        case 'P2002':
            res.status(409).json({
                success: false,
                error: {
                    message: 'Resource already exists',
                    code: 'DUPLICATE_RESOURCE',
                    details: err.meta
                }
            });
            break;
        case 'P2025':
            res.status(404).json({
                success: false,
                error: {
                    message: 'Resource not found',
                    code: 'RESOURCE_NOT_FOUND'
                }
            });
            break;
        case 'P2003':
            res.status(400).json({
                success: false,
                error: {
                    message: 'Foreign key constraint failed',
                    code: 'FOREIGN_KEY_ERROR'
                }
            });
            break;
        default:
            res.status(500).json({
                success: false,
                error: {
                    message: 'Database operation failed',
                    code: 'DATABASE_ERROR'
                }
            });
            break;
    }
};
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errors.js.map
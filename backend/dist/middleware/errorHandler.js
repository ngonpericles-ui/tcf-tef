"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.DatabaseError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.CustomError = void 0;
const logger_1 = require("../utils/logger");
const environment_1 = require("../config/environment");
class CustomError extends Error {
    constructor(message, statusCode = 500, isOperational = true, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
class ValidationError extends CustomError {
    constructor(message) {
        super(message, 400, true, 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends CustomError {
    constructor(message = 'Authentication failed') {
        super(message, 401, true, 'AUTHENTICATION_ERROR');
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends CustomError {
    constructor(message = 'Access denied') {
        super(message, 403, true, 'AUTHORIZATION_ERROR');
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends CustomError {
    constructor(message = 'Resource not found') {
        super(message, 404, true, 'NOT_FOUND_ERROR');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends CustomError {
    constructor(message) {
        super(message, 409, true, 'CONFLICT_ERROR');
    }
}
exports.ConflictError = ConflictError;
class DatabaseError extends CustomError {
    constructor(message) {
        super(message, 500, true, 'DATABASE_ERROR');
    }
}
exports.DatabaseError = DatabaseError;
const errorHandler = (error, req, res, next) => {
    let { statusCode = 500, message, code } = error;
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = error.message;
        code = 'VALIDATION_ERROR';
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        code = 'INVALID_TOKEN';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        code = 'TOKEN_EXPIRED';
    }
    else if (error.name === 'MulterError') {
        statusCode = 400;
        message = 'File upload error';
        code = 'FILE_UPLOAD_ERROR';
    }
    logger_1.logger.error('Request error', {
        error: {
            message: error.message,
            stack: error.stack,
            statusCode,
            code
        },
        request: {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        }
    });
    const errorResponse = {
        success: false,
        error: {
            message,
            code,
            statusCode
        }
    };
    if (environment_1.config.nodeEnv === 'development') {
        errorResponse.error.stack = error.stack;
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map
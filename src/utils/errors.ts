/**
 * Custom error classes for the TCF/TEF platform
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - 400 Bad Request
 */
export class ValidationError extends AppError {
  public readonly details: Record<string, any> | null;

  constructor(message: string, details: Record<string, any> | null = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

/**
 * Authentication error - 401 Unauthorized
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization error - 403 Forbidden
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Forbidden error - 403 Forbidden (alias for AuthorizationError)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN_ERROR');
  }
}

/**
 * Not found error - 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

/**
 * Conflict error - 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

/**
 * Rate limit error - 429 Too Many Requests
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

/**
 * External service error - 502 Bad Gateway
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(message: string = 'External service error', service: string = 'unknown') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * Database error - 500 Internal Server Error
 */
export class DatabaseError extends AppError {
  public readonly operation: string;

  constructor(message: string = 'Database operation failed', operation: string = 'unknown') {
    super(message, 500, 'DATABASE_ERROR');
    this.operation = operation;
  }
}

/**
 * File operation error - 500 Internal Server Error
 */
export class FileError extends AppError {
  public readonly operation: string;

  constructor(message: string = 'File operation failed', operation: string = 'unknown') {
    super(message, 500, 'FILE_ERROR');
    this.operation = operation;
  }
}

/**
 * Business logic error - 422 Unprocessable Entity
 */
export class BusinessLogicError extends AppError {
  constructor(message: string = 'Business rule violation') {
    super(message, 422, 'BUSINESS_LOGIC_ERROR');
  }
}

/**
 * Error handler middleware
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const { logger } = require('./logger');

  // Log the error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || 'anonymous'
  });

  // Handle known operational errors
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

  // Handle Prisma errors
  if (err.code && err.code.startsWith('P')) {
    handlePrismaError(err, res);
    return;
  }

  // Handle JWT errors
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

  // Handle validation errors (Joi, etc.)
  if (err.name === 'ValidationError' && err.details) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      }
    });
    return;
  }

  // Handle multer errors (file upload)
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

  // Default to 500 server error
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

/**
 * Handle Prisma database errors
 */
const handlePrismaError = (err: any, res: Response): void => {
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

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

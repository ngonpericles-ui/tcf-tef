"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTimeout = exports.createBilingualErrorResponse = exports.apiUsageTracker = exports.performanceMonitor = exports.errorLogger = exports.requestLogger = void 0;
const logger_1 = require("../utils/logger");
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function getLanguagePreference(req) {
    const acceptLanguage = req.headers['accept-language'];
    return acceptLanguage?.includes('en') ? 'en' : 'fr';
}
function sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object')
        return body;
    const sensitiveFields = ['password', 'passwordHash', 'token', 'accessToken', 'refreshToken'];
    const sanitized = { ...body };
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }
    return sanitized;
}
const requestLogger = (req, res, next) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    req.requestId = requestId;
    req.startTime = startTime;
    logger_1.logger.info('Incoming Request', {
        requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        body: sanitizeRequestBody(req.body),
        userId: req.user?.userId,
        userRole: req.user?.role,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress,
        language: getLanguagePreference(req),
        timestamp: new Date().toISOString()
    });
    const originalJson = res.json;
    res.json = function (body) {
        const duration = Date.now() - startTime;
        logger_1.logger.info('Outgoing Response', {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user?.userId,
            success: body?.success,
            errorMessage: body?.success === false ? body.message : undefined,
            timestamp: new Date().toISOString()
        });
        if (duration > 2000) {
            logger_1.logger.warn('Slow Request Detected', {
                requestId,
                method: req.method,
                path: req.path,
                duration: `${duration}ms`,
                userId: req.user?.userId
            });
        }
        return originalJson.call(this, body);
    };
    const originalStatus = res.status;
    res.status = function (code) {
        if (code >= 400) {
            logger_1.logger.warn('Error Status Code', {
                requestId,
                method: req.method,
                path: req.path,
                statusCode: code,
                userId: req.user?.userId
            });
        }
        return originalStatus.call(this, code);
    };
    next();
};
exports.requestLogger = requestLogger;
const errorLogger = (error, req, res, next) => {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    logger_1.logger.error('Request Error', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack
        },
        userId: req.user?.userId,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
    });
    next(error);
};
exports.errorLogger = errorLogger;
const performanceMonitor = (req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger_1.logger.info('Performance Metrics', {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            memoryUsage: process.memoryUsage(),
            timestamp: new Date().toISOString()
        });
        if (duration > 5000) {
            logger_1.logger.error('Very Slow Request Alert', {
                requestId: req.requestId,
                method: req.method,
                path: req.path,
                duration: `${duration}ms`,
                userId: req.user?.userId
            });
        }
    });
    next();
};
exports.performanceMonitor = performanceMonitor;
const apiUsageTracker = (req, res, next) => {
    const endpoint = `${req.method} ${req.path}`;
    res.on('finish', () => {
        logger_1.logger.info('API Usage', {
            requestId: req.requestId,
            endpoint,
            userId: req.user?.userId,
            userRole: req.user?.role,
            statusCode: res.statusCode,
            timestamp: new Date().toISOString()
        });
    });
    next();
};
exports.apiUsageTracker = apiUsageTracker;
const createBilingualErrorResponse = (error, language = 'fr') => {
    const errorMessages = {
        'ValidationError': {
            fr: 'Erreur de validation des données',
            en: 'Data validation error'
        },
        'UnauthorizedError': {
            fr: 'Accès non autorisé',
            en: 'Unauthorized access'
        },
        'NotFoundError': {
            fr: 'Ressource non trouvée',
            en: 'Resource not found'
        },
        'ConflictError': {
            fr: 'Conflit de données',
            en: 'Data conflict'
        },
        'RateLimitError': {
            fr: 'Limite de requêtes dépassée',
            en: 'Rate limit exceeded'
        },
        'InternalServerError': {
            fr: 'Erreur interne du serveur',
            en: 'Internal server error'
        }
    };
    const errorType = error.constructor.name;
    const translatedMessage = errorMessages[errorType]?.[language] || error.message;
    return {
        success: false,
        message: translatedMessage,
        errorType,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };
};
exports.createBilingualErrorResponse = createBilingualErrorResponse;
const requestTimeout = (timeoutMs = 30000) => {
    return (req, res, next) => {
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                logger_1.logger.error('Request Timeout', {
                    requestId: req.requestId,
                    method: req.method,
                    path: req.path,
                    timeout: `${timeoutMs}ms`,
                    userId: req.user?.userId
                });
                const language = getLanguagePreference(req);
                res.status(408).json({
                    success: false,
                    message: language === 'fr'
                        ? 'Délai d\'attente de la requête dépassé'
                        : 'Request timeout exceeded',
                    timestamp: new Date().toISOString()
                });
            }
        }, timeoutMs);
        res.on('finish', () => {
            clearTimeout(timeout);
        });
        next();
    };
};
exports.requestTimeout = requestTimeout;
//# sourceMappingURL=requestLogger.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationError = exports.AuthenticationError = exports.InternalServerError = exports.ConflictError = exports.UnauthorizedError = exports.ForbiddenError = exports.NotFoundError = exports.ValidationError = void 0;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.code = 'VALIDATION_ERROR';
        this.isOperational = true;
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
        this.code = 'NOT_FOUND_ERROR';
        this.isOperational = true;
    }
}
exports.NotFoundError = NotFoundError;
class ForbiddenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ForbiddenError';
        this.statusCode = 403;
        this.code = 'FORBIDDEN_ERROR';
        this.isOperational = true;
    }
}
exports.ForbiddenError = ForbiddenError;
class UnauthorizedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnauthorizedError';
        this.statusCode = 401;
        this.code = 'UNAUTHORIZED_ERROR';
        this.isOperational = true;
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConflictError';
        this.statusCode = 409;
        this.code = 'CONFLICT_ERROR';
        this.isOperational = true;
    }
}
exports.ConflictError = ConflictError;
class InternalServerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InternalServerError';
        this.statusCode = 500;
        this.code = 'INTERNAL_SERVER_ERROR';
        this.isOperational = true;
    }
}
exports.InternalServerError = InternalServerError;
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = 401;
        this.code = 'AUTHENTICATION_ERROR';
        this.isOperational = true;
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthorizationError';
        this.statusCode = 403;
        this.code = 'AUTHORIZATION_ERROR';
        this.isOperational = true;
    }
}
exports.AuthorizationError = AuthorizationError;
//# sourceMappingURL=errors.js.map
export declare class ValidationError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
    constructor(message: string);
}
export declare class NotFoundError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
    constructor(message: string);
}
export declare class ForbiddenError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
    constructor(message: string);
}
export declare class UnauthorizedError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
    constructor(message: string);
}
export declare class ConflictError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
    constructor(message: string);
}
export declare class InternalServerError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
    constructor(message: string);
}
export declare class AuthenticationError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
    constructor(message: string);
}
export declare class AuthorizationError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map
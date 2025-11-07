import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string);
}
export declare class ValidationError extends AppError {
    readonly details: Record<string, any> | null;
    constructor(message: string, details?: Record<string, any> | null);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
export declare class ExternalServiceError extends AppError {
    readonly service: string;
    constructor(message?: string, service?: string);
}
export declare class DatabaseError extends AppError {
    readonly operation: string;
    constructor(message?: string, operation?: string);
}
export declare class FileError extends AppError {
    readonly operation: string;
    constructor(message?: string, operation?: string);
}
export declare class BusinessLogicError extends AppError {
    constructor(message?: string);
}
export declare const errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errors.d.ts.map
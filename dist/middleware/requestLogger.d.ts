import { Request, Response, NextFunction } from 'express';
interface LoggedRequest extends Request {
    startTime?: number;
    requestId?: string;
}
export declare const requestLogger: (req: LoggedRequest, res: Response, next: NextFunction) => void;
export declare const errorLogger: (error: any, req: LoggedRequest, res: Response, next: NextFunction) => void;
export declare const performanceMonitor: (req: LoggedRequest, res: Response, next: NextFunction) => void;
export declare const apiUsageTracker: (req: LoggedRequest, res: Response, next: NextFunction) => void;
export declare const createBilingualErrorResponse: (error: any, language?: "fr" | "en") => {
    stack: any;
    success: boolean;
    message: any;
    errorType: any;
    timestamp: string;
};
export declare const requestTimeout: (timeoutMs?: number) => (req: LoggedRequest, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=requestLogger.d.ts.map
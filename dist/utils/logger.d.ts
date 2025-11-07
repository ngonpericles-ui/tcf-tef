import winston from 'winston';
export declare const logger: winston.Logger;
export declare const logStream: {
    write: (message: string) => void;
};
export declare const logError: (error: Error, context?: any) => void;
export declare const logInfo: (message: string, meta?: any) => void;
export declare const logWarn: (message: string, meta?: any) => void;
export declare const logDebug: (message: string, meta?: any) => void;
//# sourceMappingURL=logger.d.ts.map
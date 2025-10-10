import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            temporaryAuth?: {
                userId: string;
                simulationId: string;
                simulationType: 'voice' | 'immigration';
                isTemporary: boolean;
            };
        }
    }
}
export declare const temporaryAuthMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const simulationAccessMiddleware: (simulationType: "voice" | "immigration") => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const temporaryOrRegularAuth: (simulationType: "voice" | "immigration") => ((req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>)[];
//# sourceMappingURL=temporaryAuth.d.ts.map
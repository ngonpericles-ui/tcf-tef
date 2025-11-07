import { Request, Response, NextFunction } from 'express';
import { UserRole, SubscriptionTier } from '@prisma/client';
import { JWTPayload } from '@/types';
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuthenticate: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorize: (...allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireSubscriptionTier: (...allowedTiers: SubscriptionTier[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const authorizeResourceOwner: (resourceUserIdField?: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireManager: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireSeniorManager: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireRole: (roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requirePremium: (req: Request, res: Response, next: NextFunction) => void;
export declare const requirePaidSubscription: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map
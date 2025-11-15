import { Request, Response, NextFunction } from 'express';
import '../middleware/auth';
export declare class AuthController {
    static register: (req: Request, res: Response, next: NextFunction) => void;
    static registerAdmin: (req: Request, res: Response, next: NextFunction) => void;
    static login: (req: Request, res: Response, next: NextFunction) => void;
    static refreshToken: (req: Request, res: Response, next: NextFunction) => void;
    static logout: (req: Request, res: Response, next: NextFunction) => void;
    static logoutAll: (req: Request, res: Response, next: NextFunction) => void;
    static getProfile: (req: Request, res: Response, next: NextFunction) => void;
    static verifyToken: (req: Request, res: Response, next: NextFunction) => void;
    static updateActivity: (req: Request, res: Response, next: NextFunction) => void;
    static appleAuth: (req: Request, res: Response, next: NextFunction) => void;
    static facebookAuth: (req: Request, res: Response, next: NextFunction) => void;
    static googleAuth: (req: Request, res: Response, next: NextFunction) => void;
    static healthCheck: (req: Request, res: Response, next: NextFunction) => void;
    static forgotPassword: (req: Request, res: Response, next: NextFunction) => void;
    static verifyResetCode: (req: Request, res: Response, next: NextFunction) => void;
    static resetPassword: (req: Request, res: Response, next: NextFunction) => void;
    static resendResetCode: (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=authController.d.ts.map
import { Request, Response } from 'express';
export declare class UserController {
    static getProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static changePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getAllUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateUserRole: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateUserStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getDashboardStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static healthCheck: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=userController.d.ts.map
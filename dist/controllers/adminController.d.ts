import { Request, Response } from 'express';
export declare class AdminController {
    static getDashboard: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSystemHealth: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getBusinessMetrics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getTechnicalMetrics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getAllUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getManagers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createManager: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateManager: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getManagerPerformance: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static generateReport: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static exportData: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static healthCheck: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getReviewRequests: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static handleReviewRequest: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=adminController.d.ts.map
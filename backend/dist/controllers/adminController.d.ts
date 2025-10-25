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
    static createSubscriptionPlan: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSubscriptionPlans: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSubscriptionPlanById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateSubscriptionPlan: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteSubscriptionPlan: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSubscriptionAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getAudioSimulations: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getAudioSimulation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createAudioSimulation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateAudioSimulation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteAudioSimulation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getImmigrationSimulations: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getImmigrationSimulation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createImmigrationSimulation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateImmigrationSimulation: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteImmigrationSimulation: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=adminController.d.ts.map
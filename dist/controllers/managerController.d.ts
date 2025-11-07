import { Request, Response } from 'express';
export declare class ManagerController {
    static getDashboard: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getMetrics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getActivity: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static generateReport: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static exportData: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getManagedUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static sendMessageToUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getContentLibrary: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createContent: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateContent: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static publishContent: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getContentAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static healthCheck: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=managerController.d.ts.map
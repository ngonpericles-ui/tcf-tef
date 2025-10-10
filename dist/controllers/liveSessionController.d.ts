import { Request, Response } from 'express';
export declare class LiveSessionController {
    static createLiveSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getLiveSessionById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getAllLiveSessions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static registerForSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static unregisterFromSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateSessionStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserRegisteredSessions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserCreatedSessions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUpcomingSessions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static setReminder: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static healthCheck: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=liveSessionController.d.ts.map
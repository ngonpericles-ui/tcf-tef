import { Request, Response } from 'express';
export declare class LiveSessionController {
    private static messageStorage;
    static storeMessage(sessionId: string, message: any): void;
    static getStoredMessages(sessionId: string): any[];
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
    static updateLiveSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteLiveSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static healthCheck: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getLiveSessionStatistics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSessionParticipants: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static muteParticipant: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static pinParticipant: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static removeParticipant: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSessionMessages: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static sendMessage: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=liveSessionController.d.ts.map
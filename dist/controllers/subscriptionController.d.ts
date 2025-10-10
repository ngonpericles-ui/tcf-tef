import { Request, Response } from 'express';
export declare class SubscriptionController {
    static getSubscriptionPlans: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserSubscriptions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getActiveSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static cancelSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static changeSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static processPaymentWebhook: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSubscriptionAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static healthCheck: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=subscriptionController.d.ts.map
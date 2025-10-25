import { Request, Response } from 'express';
export declare class PaymentController {
    static getSubscriptionPlans(req: Request, res: Response): Promise<void>;
    static createCoursePaymentIntent(req: Request, res: Response): Promise<void>;
    static createSubscriptionPaymentIntent(req: Request, res: Response): Promise<void>;
    static confirmCoursePayment(req: Request, res: Response): Promise<void>;
    static getPaymentHistory(req: Request, res: Response): Promise<void>;
    static handleWebhook(req: Request, res: Response): Promise<void>;
    static getStripeConfig(req: Request, res: Response): Promise<void>;
    static cancelSubscription(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=paymentController.d.ts.map
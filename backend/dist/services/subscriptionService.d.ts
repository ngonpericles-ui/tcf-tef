import { SubscriptionPlan, CreateSubscriptionRequest, PaginationParams } from '@/types';
import { SubscriptionTier, PaymentStatus } from '@prisma/client';
export declare class SubscriptionService {
    static getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
    static createSubscription(userId: string, subscriptionData: CreateSubscriptionRequest): Promise<any>;
    static getUserSubscriptions(userId: string, pagination: PaginationParams): Promise<{
        subscriptions: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static getActiveSubscription(userId: string): Promise<any | null>;
    static cancelSubscription(userId: string, subscriptionId: string): Promise<void>;
    static changeSubscription(userId: string, newTier: SubscriptionTier, billingCycle?: string): Promise<any>;
    static processPayment(paymentId: string, status: PaymentStatus, transactionId?: string, metadata?: any): Promise<void>;
    static updateExpiredSubscriptions(): Promise<void>;
}
//# sourceMappingURL=subscriptionService.d.ts.map
import Stripe from 'stripe';
import { SubscriptionPlan } from '../types';
export interface CreatePaymentIntentData {
    courseId: string;
    currency?: string;
    metadata?: Record<string, string>;
}
export interface PaymentIntentResponse {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    course: {
        id: string;
        title: string;
        price: number;
        level: string;
        category: string;
    };
}
export interface CreateSubscriptionData {
    planId: string;
    paymentMethodId: string;
}
export declare class PaymentService {
    private static isStripeConfigured;
    static getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
    static createCoursePaymentIntent(data: CreatePaymentIntentData, userId: string): Promise<PaymentIntentResponse>;
    static createSubscriptionPaymentIntent(tier: string, billingCycle: string, userId: string): Promise<{
        clientSecret: string;
        subscriptionId: string;
        plan: SubscriptionPlan;
    }>;
    static confirmCoursePayment(paymentIntentId: string): Promise<{
        success: boolean;
        enrollment?: {
            id: string;
            courseId: string;
            enrolledAt: Date;
        };
    }>;
    static handleWebhookEvent(event: Stripe.Event): Promise<void>;
    private static handleSubscriptionPaymentSuccess;
    private static updateSubscriptionStatus;
    private static cancelSubscription;
    static getUserPaymentHistory(userId: string, page?: number, limit?: number): Promise<{
        payments: Array<{
            id: string;
            amount: number;
            currency: string;
            status: string;
            type: string;
            createdAt: Date;
            metadata: any;
        }>;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
//# sourceMappingURL=paymentService.d.ts.map
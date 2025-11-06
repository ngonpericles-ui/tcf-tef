"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const paymentService_1 = require("../services/paymentService");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PaymentController {
    static async getSubscriptionPlans(req, res) {
        try {
            const plans = await paymentService_1.PaymentService.getSubscriptionPlans();
            res.json({
                success: true,
                data: { plans },
                message: 'Subscription plans retrieved successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get subscription plans', { error });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to get subscription plans',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'PLANS_FETCH_ERROR'
                }
            });
        }
    }
    static async createCoursePaymentIntent(req, res) {
        try {
            const { courseId, currency, metadata } = req.body;
            const userId = req.user.userId;
            if (!courseId) {
                throw new errors_1.ValidationError('Course ID is required');
            }
            const paymentIntent = await paymentService_1.PaymentService.createCoursePaymentIntent({ courseId, currency, metadata }, userId);
            res.status(201).json({
                success: true,
                data: { paymentIntent },
                message: 'Payment intent created successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create course payment intent', {
                body: req.body,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'COURSE_NOT_FOUND'
                    }
                });
            }
            else if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else if (error instanceof errors_1.ForbiddenError) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FORBIDDEN'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to create payment intent',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'PAYMENT_INTENT_ERROR'
                    }
                });
            }
        }
    }
    static async createSubscriptionPaymentIntent(req, res) {
        try {
            const { tier, billingCycle } = req.body;
            const userId = req.user.userId;
            if (!tier) {
                throw new errors_1.ValidationError('Subscription tier is required');
            }
            if (!billingCycle) {
                throw new errors_1.ValidationError('Billing cycle is required');
            }
            const subscription = await paymentService_1.PaymentService.createSubscriptionPaymentIntent(tier, billingCycle, userId);
            res.status(201).json({
                success: true,
                data: { subscription },
                message: 'Subscription payment intent created successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create subscription payment intent', {
                body: req.body,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'PLAN_NOT_FOUND'
                    }
                });
            }
            else if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to create subscription payment intent',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'SUBSCRIPTION_INTENT_ERROR'
                    }
                });
            }
        }
    }
    static async confirmCoursePayment(req, res) {
        try {
            const { paymentIntentId } = req.body;
            if (!paymentIntentId) {
                throw new errors_1.ValidationError('Payment intent ID is required');
            }
            const result = await paymentService_1.PaymentService.confirmCoursePayment(paymentIntentId);
            res.json({
                success: true,
                data: result,
                message: 'Payment confirmed and course access granted'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to confirm course payment', {
                body: req.body,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to confirm payment',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'PAYMENT_CONFIRMATION_ERROR'
                    }
                });
            }
        }
    }
    static async getPaymentHistory(req, res) {
        try {
            const userId = req.user.userId;
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            if (limit > 100) {
                throw new errors_1.ValidationError('Limit cannot exceed 100');
            }
            const result = await paymentService_1.PaymentService.getUserPaymentHistory(userId, page, limit);
            res.json({
                success: true,
                data: result,
                message: `Retrieved ${result.payments.length} payment records`
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get payment history', {
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to get payment history',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'PAYMENT_HISTORY_ERROR'
                    }
                });
            }
        }
    }
    static async handleWebhook(req, res) {
        try {
            const sig = req.headers['stripe-signature'];
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
            if (!webhookSecret) {
                throw new Error('Stripe webhook secret not configured');
            }
            let event;
            try {
                event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
            }
            catch (err) {
                logger_1.logger.error('Webhook signature verification failed', { error: err });
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Webhook signature verification failed',
                        code: 'WEBHOOK_SIGNATURE_ERROR'
                    }
                });
                return;
            }
            await paymentService_1.PaymentService.handleWebhookEvent(event);
            res.json({
                success: true,
                message: 'Webhook processed successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to handle webhook', { error });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to process webhook',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'WEBHOOK_PROCESSING_ERROR'
                }
            });
        }
    }
    static async getStripeConfig(req, res) {
        try {
            const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
            if (!publishableKey) {
                throw new Error('Stripe publishable key not configured');
            }
            res.json({
                success: true,
                data: {
                    publishableKey,
                    currency: 'usd'
                },
                message: 'Stripe configuration retrieved successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get Stripe config', { error });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to get payment configuration',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'STRIPE_CONFIG_ERROR'
                }
            });
        }
    }
    static async cancelSubscription(req, res) {
        try {
            const { subscriptionId } = req.params;
            const userId = req.user.userId;
            const subscription = await prisma.subscription.findFirst({
                where: {
                    stripeSubscriptionId: subscriptionId,
                    userId
                }
            });
            if (!subscription) {
                throw new errors_1.NotFoundError('Subscription not found');
            }
            await stripe.subscriptions.cancel(subscriptionId);
            res.json({
                success: true,
                message: 'Subscription cancelled successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to cancel subscription', {
                subscriptionId: req.params.subscriptionId,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'SUBSCRIPTION_NOT_FOUND'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to cancel subscription',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'SUBSCRIPTION_CANCEL_ERROR'
                    }
                });
            }
        }
    }
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=paymentController.js.map
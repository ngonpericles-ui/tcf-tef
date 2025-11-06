"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const connection_1 = require("@/database/connection");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const subscriptionService_1 = require("./subscriptionService");
const stripe = process.env.STRIPE_SECRET_KEY ? new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil'
}) : null;
class PaymentService {
    static isStripeConfigured() {
        return stripe !== null;
    }
    static async getSubscriptionPlans() {
        if (!this.isStripeConfigured()) {
            logger_1.logger.warn('Stripe not configured, returning empty subscription plans');
            return [];
        }
        try {
            return await subscriptionService_1.SubscriptionService.getSubscriptionPlans();
        }
        catch (error) {
            logger_1.logger.error('Failed to get subscription plans', { error });
            throw error;
        }
    }
    static async createCoursePaymentIntent(data, userId) {
        if (!this.isStripeConfigured()) {
            throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
        }
        try {
            const course = await connection_1.prisma.course.findUnique({
                where: { id: data.courseId },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    level: true,
                    category: true,
                    isPublished: true
                }
            });
            if (!course) {
                throw new errors_1.NotFoundError('Course not found');
            }
            if (!course.isPublished) {
                throw new errors_1.ForbiddenError('Cannot purchase unpublished course');
            }
            if (!course.price || course.price <= 0) {
                throw new errors_1.ValidationError('Course is not available for purchase');
            }
            const existingEnrollment = await connection_1.prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId: data.courseId
                    }
                }
            });
            if (existingEnrollment) {
                throw new errors_1.ValidationError('You already own this course');
            }
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(course.price * 100),
                currency: data.currency || 'usd',
                metadata: {
                    userId,
                    courseId: data.courseId,
                    type: 'course_purchase',
                    ...data.metadata
                },
                automatic_payment_methods: {
                    enabled: true
                }
            });
            await connection_1.prisma.payment.create({
                data: {
                    stripePaymentIntentId: paymentIntent.id,
                    userId,
                    amount: course.price,
                    currency: data.currency || 'usd',
                    status: 'PENDING',
                    paymentMethod: 'card',
                    paymentGateway: 'stripe',
                    type: 'COURSE_PURCHASE',
                    metadata: {
                        courseId: data.courseId,
                        courseName: course.title
                    }
                }
            });
            logger_1.logger.info('Payment intent created for course purchase', {
                paymentIntentId: paymentIntent.id,
                userId,
                courseId: data.courseId,
                amount: course.price
            });
            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                amount: course.price,
                currency: data.currency || 'usd',
                course: {
                    id: course.id,
                    title: course.title,
                    price: course.price,
                    level: course.level,
                    category: course.category
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create course payment intent', { data, userId, error });
            throw error;
        }
    }
    static async createSubscriptionPaymentIntent(tier, billingCycle, userId) {
        try {
            const plans = await this.getSubscriptionPlans();
            const plan = plans.find(p => p.tier === tier.toUpperCase());
            if (!plan) {
                throw new errors_1.NotFoundError('Subscription plan not found');
            }
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, firstName: true, lastName: true }
            });
            if (!user) {
                throw new errors_1.NotFoundError('User not found');
            }
            let customer;
            const existingCustomer = await stripe.customers.list({
                email: user.email,
                limit: 1
            });
            if (existingCustomer.data.length > 0) {
                customer = existingCustomer.data[0];
            }
            else {
                customer = await stripe.customers.create({
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    metadata: { userId }
                });
            }
            let stripePrice;
            try {
                const prices = await stripe.prices.list({
                    lookup_keys: [plan.id],
                    limit: 1
                });
                if (prices.data.length > 0) {
                    stripePrice = prices.data[0];
                }
                else {
                    stripePrice = await stripe.prices.create({
                        unit_amount: Math.round(plan.price * 100),
                        currency: plan.currency,
                        recurring: { interval: plan.billingCycle === 'yearly' ? 'year' : 'month' },
                        product_data: {
                            name: plan.name
                        },
                        lookup_key: plan.id
                    });
                }
            }
            catch (priceError) {
                logger_1.logger.error('Failed to create/get Stripe price', { tier, plan: plan.id, error: priceError });
                throw new Error('Failed to setup subscription pricing');
            }
            const subscription = await stripe.subscriptions.create({
                customer: customer.id,
                items: [{ price: stripePrice.id }],
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
                metadata: {
                    userId,
                    tier,
                    billingCycle
                }
            });
            const currentPeriodStart = subscription.current_period_start
                ? new Date(subscription.current_period_start * 1000)
                : new Date();
            const currentPeriodEnd = subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await connection_1.prisma.subscription.create({
                data: {
                    userId,
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: customer.id,
                    status: 'PENDING',
                    tier: tier,
                    startDate: new Date(),
                    billingCycle: billingCycle,
                    currentPeriodStart,
                    currentPeriodEnd
                }
            });
            const invoice = subscription.latest_invoice;
            const paymentIntent = invoice.payment_intent;
            logger_1.logger.info('Subscription payment intent created', {
                subscriptionId: subscription.id,
                userId,
                tier,
                billingCycle,
                amount: plan.price
            });
            let clientSecret = '';
            if (paymentIntent && paymentIntent.client_secret) {
                clientSecret = paymentIntent.client_secret;
            }
            else if (invoice && invoice.payment_intent) {
                const pi = invoice.payment_intent;
                clientSecret = pi.client_secret || '';
            }
            else {
                clientSecret = `pi_test_${subscription.id}_secret_${Date.now()}`;
            }
            return {
                clientSecret,
                subscriptionId: subscription.id,
                plan
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create subscription payment intent', {
                tier,
                billingCycle,
                userId,
                error: {
                    name: error instanceof Error ? error.name : 'Unknown',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                }
            });
            throw error;
        }
    }
    static async confirmCoursePayment(paymentIntentId) {
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status !== 'succeeded') {
                throw new errors_1.ValidationError('Payment has not been completed');
            }
            const userId = paymentIntent.metadata.userId;
            const courseId = paymentIntent.metadata.courseId;
            if (!userId || !courseId) {
                throw new errors_1.ValidationError('Invalid payment metadata');
            }
            await connection_1.prisma.payment.updateMany({
                where: { stripePaymentIntentId: paymentIntentId },
                data: { status: 'COMPLETED' }
            });
            const existingEnrollment = await connection_1.prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId
                    }
                }
            });
            if (existingEnrollment) {
                return {
                    success: true,
                    enrollment: {
                        id: existingEnrollment.id,
                        courseId: existingEnrollment.courseId,
                        enrolledAt: existingEnrollment.enrolledAt
                    }
                };
            }
            const enrollment = await connection_1.prisma.enrollment.create({
                data: {
                    userId,
                    courseId,
                    enrolledAt: new Date()
                }
            });
            logger_1.logger.info('Course payment confirmed and user enrolled', {
                paymentIntentId,
                userId,
                courseId,
                enrollmentId: enrollment.id
            });
            return {
                success: true,
                enrollment: {
                    id: enrollment.id,
                    courseId: enrollment.courseId,
                    enrolledAt: enrollment.enrolledAt
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to confirm course payment', { paymentIntentId, error });
            throw error;
        }
    }
    static async handleWebhookEvent(event) {
        try {
            logger_1.logger.info('Processing Stripe webhook event', { type: event.type, id: event.id });
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object;
                    if (paymentIntent.metadata.type === 'course_purchase') {
                        await this.confirmCoursePayment(paymentIntent.id);
                    }
                    break;
                case 'invoice.payment_succeeded':
                    const invoice = event.data.object;
                    if (invoice.subscription) {
                        await this.handleSubscriptionPaymentSuccess(invoice);
                    }
                    break;
                case 'customer.subscription.updated':
                    const subscription = event.data.object;
                    await this.updateSubscriptionStatus(subscription);
                    break;
                case 'customer.subscription.deleted':
                    const deletedSubscription = event.data.object;
                    await this.cancelSubscription(deletedSubscription.id);
                    break;
                default:
                    logger_1.logger.info('Unhandled webhook event type', { type: event.type });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to handle webhook event', { event: event.type, error });
            throw error;
        }
    }
    static async handleSubscriptionPaymentSuccess(invoice) {
        try {
            const subscriptionId = invoice.subscription;
            await connection_1.prisma.subscription.updateMany({
                where: { stripeSubscriptionId: subscriptionId },
                data: { status: 'ACTIVE' }
            });
            logger_1.logger.info('Subscription payment succeeded', { subscriptionId });
        }
        catch (error) {
            logger_1.logger.error('Failed to handle subscription payment success', { invoice: invoice.id, error });
            throw error;
        }
    }
    static async updateSubscriptionStatus(subscription) {
        try {
            const status = subscription.status === 'active' ? 'ACTIVE' :
                subscription.status === 'canceled' ? 'CANCELLED' : 'PENDING';
            await connection_1.prisma.subscription.updateMany({
                where: { stripeSubscriptionId: subscription.id },
                data: {
                    status,
                    currentPeriodStart: new Date(subscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000)
                }
            });
            logger_1.logger.info('Subscription status updated', { subscriptionId: subscription.id, status });
        }
        catch (error) {
            logger_1.logger.error('Failed to update subscription status', { subscriptionId: subscription.id, error });
            throw error;
        }
    }
    static async cancelSubscription(subscriptionId) {
        try {
            await connection_1.prisma.subscription.updateMany({
                where: { stripeSubscriptionId: subscriptionId },
                data: { status: 'CANCELLED' }
            });
            logger_1.logger.info('Subscription cancelled', { subscriptionId });
        }
        catch (error) {
            logger_1.logger.error('Failed to cancel subscription', { subscriptionId, error });
            throw error;
        }
    }
    static async getUserPaymentHistory(userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const [payments, total] = await Promise.all([
                connection_1.prisma.payment.findMany({
                    where: { userId },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                }),
                connection_1.prisma.payment.count({ where: { userId } })
            ]);
            return {
                payments: payments.map(payment => ({
                    id: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    type: payment.type,
                    createdAt: payment.createdAt,
                    metadata: payment.metadata
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user payment history', { userId, error });
            throw error;
        }
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=paymentService.js.map
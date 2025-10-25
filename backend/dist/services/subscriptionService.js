"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class SubscriptionService {
    static async getSubscriptionPlans() {
        try {
            const dbPlans = await connection_1.prisma.subscriptionPlan.findMany({
                where: { isActive: true },
                orderBy: [
                    { sortOrder: 'asc' },
                    { createdAt: 'desc' }
                ]
            });
            if (dbPlans && dbPlans.length > 0) {
                return dbPlans;
            }
            const plans = [
                {
                    id: 'free',
                    name: 'Gratuit',
                    nameEn: 'Free',
                    description: 'Accès limité aux cours et tests de base',
                    descriptionEn: 'Limited access to basic courses and tests',
                    tier: client_1.SubscriptionTier.FREE,
                    price: 0,
                    currency: 'FCFA',
                    billingCycle: 'monthly',
                    features: [
                        'Accès aux cours gratuits',
                        'Tests de base',
                        'Support communautaire'
                    ],
                    limitations: [
                        'Pas d\'accès aux cours premium',
                        'Pas de sessions en direct',
                        'Support limité'
                    ]
                },
                {
                    id: 'essential',
                    name: 'Essentiel',
                    nameEn: 'Essential',
                    description: 'Base pour démarrer (A1-B1)',
                    descriptionEn: 'Basics to get started (A1-B1)',
                    tier: client_1.SubscriptionTier.ESSENTIAL,
                    price: 4500,
                    currency: 'FCFA',
                    billingCycle: 'monthly',
                    features: [
                        'Cours fondamentaux (A1–B1)',
                        '5 tests blancs par mois',
                        '2 sessions live par mois',
                        'Aperçu du fil social',
                        'Support par email'
                    ],
                    limitations: [
                        'Pas d\'accès aux cours B2-C2',
                        'Sessions live limitées à B1'
                    ]
                },
                {
                    id: 'premium',
                    name: 'Premium',
                    nameEn: 'Premium',
                    description: 'Tout inclus pour réussir (A1-C2)',
                    descriptionEn: 'All‑inclusive for success (A1-C2)',
                    tier: client_1.SubscriptionTier.PREMIUM,
                    price: 9500,
                    currency: 'FCFA',
                    billingCycle: 'monthly',
                    features: [
                        'Cours complets (A1–C2)',
                        'Tests blancs illimités',
                        'Sessions live illimitées',
                        'Coach IA et feedback détaillé',
                        'Analyses avancées',
                        'Certificats de réussite',
                        'Support prioritaire'
                    ],
                    isPopular: true
                },
                {
                    id: 'pro',
                    name: 'Pro+',
                    nameEn: 'Pro+',
                    description: 'Pour objectifs intensifs',
                    descriptionEn: 'For intensive goals',
                    tier: client_1.SubscriptionTier.PRO,
                    price: 14500,
                    currency: 'FCFA',
                    billingCycle: 'monthly',
                    features: [
                        'Parcours personnalisés',
                        'Sessions 1-on-1 avec managers',
                        'Correction prioritaire',
                        'Rapports détaillés',
                        'Accès anticipé aux nouveautés',
                        'Garantie de réussite',
                        'Support téléphonique'
                    ]
                }
            ];
            return plans;
        }
        catch (error) {
            logger_1.logger.error('Failed to get subscription plans', { error });
            throw error;
        }
    }
    static async createSubscription(userId, subscriptionData) {
        try {
            const { tier, billingCycle, paymentMethodId } = subscriptionData;
            const user = await connection_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            const existingSubscription = await connection_1.prisma.subscription.findFirst({
                where: {
                    userId,
                    tier,
                    status: client_1.SubscriptionStatus.ACTIVE
                }
            });
            if (existingSubscription) {
                throw new errorHandler_1.ConflictError('User already has an active subscription of this tier');
            }
            const plans = await this.getSubscriptionPlans();
            const plan = plans.find(p => p.tier === tier);
            if (!plan) {
                throw new errorHandler_1.NotFoundError('Subscription plan not found');
            }
            const startDate = new Date();
            const endDate = new Date();
            switch (billingCycle) {
                case 'monthly':
                    endDate.setMonth(endDate.getMonth() + 1);
                    break;
                case 'quarterly':
                    endDate.setMonth(endDate.getMonth() + 3);
                    break;
                case 'yearly':
                    endDate.setFullYear(endDate.getFullYear() + 1);
                    break;
                default:
                    endDate.setMonth(endDate.getMonth() + 1);
            }
            const subscription = await connection_1.prisma.subscription.create({
                data: {
                    userId,
                    tier,
                    status: tier === client_1.SubscriptionTier.FREE ? client_1.SubscriptionStatus.ACTIVE : client_1.SubscriptionStatus.PENDING,
                    startDate,
                    endDate,
                    billingCycle,
                    paymentMethod: paymentMethodId || 'free'
                }
            });
            if (tier !== client_1.SubscriptionTier.FREE && plan.price > 0) {
                await connection_1.prisma.payment.create({
                    data: {
                        userId,
                        subscriptionId: subscription.id,
                        amount: plan.price,
                        currency: plan.currency,
                        status: client_1.PaymentStatus.PENDING,
                        paymentMethod: paymentMethodId || 'unknown',
                        paymentGateway: 'stripe'
                    }
                });
            }
            if (subscription.status === client_1.SubscriptionStatus.ACTIVE) {
                await connection_1.prisma.user.update({
                    where: { id: userId },
                    data: { subscriptionTier: tier }
                });
            }
            logger_1.logger.info('Subscription created successfully', {
                subscriptionId: subscription.id,
                userId,
                tier
            });
            return subscription;
        }
        catch (error) {
            logger_1.logger.error('Failed to create subscription', { userId, subscriptionData, error });
            throw error;
        }
    }
    static async getUserSubscriptions(userId, pagination) {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
            const total = await connection_1.prisma.subscription.count({
                where: { userId }
            });
            const subscriptions = await connection_1.prisma.subscription.findMany({
                where: { userId },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit
            });
            const totalPages = Math.ceil(total / limit);
            return {
                subscriptions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user subscriptions', { userId, error });
            throw error;
        }
    }
    static async getActiveSubscription(userId) {
        try {
            const subscription = await connection_1.prisma.subscription.findFirst({
                where: {
                    userId,
                    status: client_1.SubscriptionStatus.ACTIVE,
                    endDate: {
                        gte: new Date()
                    }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            if (!subscription) {
                const user = await connection_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        subscriptionTier: true
                    }
                });
                if (user) {
                    return {
                        id: `user-tier-${user.id}`,
                        tier: user.subscriptionTier,
                        status: 'ACTIVE',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                        user: {
                            id: user.id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email
                        }
                    };
                }
            }
            return subscription;
        }
        catch (error) {
            logger_1.logger.error('Failed to get active subscription', { userId, error });
            throw error;
        }
    }
    static async cancelSubscription(userId, subscriptionId) {
        try {
            const subscription = await connection_1.prisma.subscription.findUnique({
                where: { id: subscriptionId }
            });
            if (!subscription) {
                throw new errorHandler_1.NotFoundError('Subscription not found');
            }
            if (subscription.userId !== userId) {
                throw new errorHandler_1.AuthorizationError('Access denied');
            }
            if (subscription.status !== client_1.SubscriptionStatus.ACTIVE) {
                throw new errorHandler_1.ValidationError('Subscription is not active');
            }
            await connection_1.prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    status: client_1.SubscriptionStatus.CANCELLED,
                    autoRenew: false
                }
            });
            await connection_1.prisma.user.update({
                where: { id: userId },
                data: { subscriptionTier: client_1.SubscriptionTier.FREE }
            });
            logger_1.logger.info('Subscription cancelled successfully', { subscriptionId, userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to cancel subscription', { userId, subscriptionId, error });
            throw error;
        }
    }
    static async changeSubscription(userId, newTier, billingCycle = 'monthly') {
        try {
            const currentSubscription = await this.getActiveSubscription(userId);
            if (currentSubscription && currentSubscription.tier === newTier) {
                throw new errorHandler_1.ValidationError('User already has this subscription tier');
            }
            if (currentSubscription) {
                await this.cancelSubscription(userId, currentSubscription.id);
            }
            const newSubscription = await this.createSubscription(userId, {
                tier: newTier,
                billingCycle
            });
            logger_1.logger.info('Subscription changed successfully', {
                userId,
                oldTier: currentSubscription?.tier,
                newTier
            });
            return newSubscription;
        }
        catch (error) {
            logger_1.logger.error('Failed to change subscription', { userId, newTier, error });
            throw error;
        }
    }
    static async processPayment(paymentId, status, transactionId, metadata) {
        try {
            const payment = await connection_1.prisma.payment.findUnique({
                where: { id: paymentId }
            });
            if (!payment) {
                throw new errorHandler_1.NotFoundError('Payment not found');
            }
            await connection_1.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status,
                    transactionId,
                    metadata,
                    processedAt: new Date()
                }
            });
            if (status === client_1.PaymentStatus.COMPLETED && payment.subscriptionId) {
                const subscription = await connection_1.prisma.subscription.findUnique({
                    where: { id: payment.subscriptionId }
                });
                if (subscription) {
                    await connection_1.prisma.subscription.update({
                        where: { id: payment.subscriptionId },
                        data: { status: client_1.SubscriptionStatus.ACTIVE }
                    });
                    await connection_1.prisma.user.update({
                        where: { id: payment.userId },
                        data: { subscriptionTier: subscription.tier }
                    });
                    logger_1.logger.info('Payment processed and subscription activated', {
                        paymentId,
                        subscriptionId: payment.subscriptionId,
                        userId: payment.userId
                    });
                }
            }
            if (status === client_1.PaymentStatus.FAILED && payment.subscriptionId) {
                await connection_1.prisma.subscription.update({
                    where: { id: payment.subscriptionId },
                    data: { status: client_1.SubscriptionStatus.CANCELLED }
                });
                logger_1.logger.warn('Payment failed, subscription cancelled', {
                    paymentId,
                    subscriptionId: payment.subscriptionId
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to process payment', { paymentId, status, error });
            throw error;
        }
    }
    static async updateExpiredSubscriptions() {
        try {
            const expiredSubscriptions = await connection_1.prisma.subscription.findMany({
                where: {
                    status: client_1.SubscriptionStatus.ACTIVE,
                    endDate: {
                        lt: new Date()
                    }
                }
            });
            for (const subscription of expiredSubscriptions) {
                await connection_1.prisma.subscription.update({
                    where: { id: subscription.id },
                    data: { status: client_1.SubscriptionStatus.EXPIRED }
                });
                await connection_1.prisma.user.update({
                    where: { id: subscription.userId },
                    data: { subscriptionTier: client_1.SubscriptionTier.FREE }
                });
                logger_1.logger.info('Subscription expired and user downgraded', {
                    subscriptionId: subscription.id,
                    userId: subscription.userId
                });
            }
            logger_1.logger.info(`Updated ${expiredSubscriptions.length} expired subscriptions`);
        }
        catch (error) {
            logger_1.logger.error('Failed to update expired subscriptions', { error });
            throw error;
        }
    }
}
exports.SubscriptionService = SubscriptionService;
//# sourceMappingURL=subscriptionService.js.map
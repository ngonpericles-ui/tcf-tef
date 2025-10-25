"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const subscriptionService_1 = require("../services/subscriptionService");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class SubscriptionController {
}
exports.SubscriptionController = SubscriptionController;
_a = SubscriptionController;
SubscriptionController.getSubscriptionPlans = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const plans = await subscriptionService_1.SubscriptionService.getSubscriptionPlans();
    const response = {
        success: true,
        data: { plans },
        message: 'Subscription plans retrieved successfully'
    };
    res.status(200).json(response);
});
SubscriptionController.createSubscription = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const subscriptionData = req.body;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const subscription = await subscriptionService_1.SubscriptionService.createSubscription(userId, subscriptionData);
    const response = {
        success: true,
        data: { subscription },
        message: 'Subscription created successfully'
    };
    logger_1.logger.info('Subscription created', { subscriptionId: subscription.id, userId });
    res.status(201).json(response);
});
SubscriptionController.getUserSubscriptions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
    };
    const result = await subscriptionService_1.SubscriptionService.getUserSubscriptions(userId, pagination);
    const response = {
        success: true,
        data: result.subscriptions,
        pagination: result.pagination,
        message: 'User subscriptions retrieved successfully'
    };
    res.status(200).json(response);
});
SubscriptionController.getActiveSubscription = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const subscription = await subscriptionService_1.SubscriptionService.getActiveSubscription(userId);
    const response = {
        success: true,
        data: { subscription },
        message: subscription ? 'Active subscription retrieved successfully' : 'No active subscription found'
    };
    res.status(200).json(response);
});
SubscriptionController.cancelSubscription = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { subscriptionId } = req.params;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await subscriptionService_1.SubscriptionService.cancelSubscription(userId, subscriptionId);
    const response = {
        success: true,
        message: 'Subscription cancelled successfully'
    };
    logger_1.logger.info('Subscription cancelled', { subscriptionId, userId });
    res.status(200).json(response);
});
SubscriptionController.changeSubscription = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { tier, billingCycle } = req.body;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const subscription = await subscriptionService_1.SubscriptionService.changeSubscription(userId, tier, billingCycle);
    const response = {
        success: true,
        data: { subscription },
        message: 'Subscription changed successfully'
    };
    logger_1.logger.info('Subscription changed', { subscriptionId: subscription.id, userId, newTier: tier });
    res.status(200).json(response);
});
SubscriptionController.processPaymentWebhook = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { paymentId, status, transactionId, metadata } = req.body;
    await subscriptionService_1.SubscriptionService.processPayment(paymentId, status, transactionId, metadata);
    const response = {
        success: true,
        message: 'Payment processed successfully'
    };
    logger_1.logger.info('Payment webhook processed', { paymentId, status });
    res.status(200).json(response);
});
SubscriptionController.getSubscriptionAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN') {
        res.status(403).json({
            success: false,
            error: { message: 'Access denied. Admin role required.' }
        });
        return;
    }
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../database/connection')));
    const [totalSubscriptions, activeSubscriptions, subscriptionsByTier, recentSubscriptions, totalRevenue] = await Promise.all([
        prisma.subscription.count(),
        prisma.subscription.count({
            where: { status: 'ACTIVE' }
        }),
        prisma.subscription.groupBy({
            by: ['tier'],
            _count: { tier: true },
            where: { status: 'ACTIVE' }
        }),
        prisma.subscription.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        }),
        prisma.payment.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { amount: true }
        })
    ]);
    const analytics = {
        totalSubscriptions,
        activeSubscriptions,
        subscriptionsByTier: subscriptionsByTier.reduce((acc, item) => {
            acc[item.tier] = item._count.tier;
            return acc;
        }, {}),
        recentSubscriptions,
        totalRevenue: totalRevenue._sum.amount || 0
    };
    const response = {
        success: true,
        data: { analytics },
        message: 'Subscription analytics retrieved successfully'
    };
    res.status(200).json(response);
});
SubscriptionController.healthCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const response = {
        success: true,
        data: {
            service: 'subscription',
            status: 'healthy',
            timestamp: new Date().toISOString()
        },
        message: 'Subscription service is healthy'
    };
    res.status(200).json(response);
});
//# sourceMappingURL=subscriptionController.js.map
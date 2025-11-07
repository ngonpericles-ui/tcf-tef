"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionRoutes = void 0;
const express_1 = require("express");
const subscriptionController_1 = require("@/controllers/subscriptionController");
const validation_1 = require("@/middleware/validation");
const auth_1 = require("@/middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.subscriptionRoutes = router;
const createSubscriptionSchema = joi_1.default.object({
    tier: validation_1.commonSchemas.subscriptionTier.required(),
    billingCycle: joi_1.default.string().valid('monthly', 'quarterly', 'yearly').default('monthly'),
    paymentMethodId: joi_1.default.string().optional()
});
const changeSubscriptionSchema = joi_1.default.object({
    tier: validation_1.commonSchemas.subscriptionTier.required(),
    billingCycle: joi_1.default.string().valid('monthly', 'quarterly', 'yearly').default('monthly')
});
const paymentWebhookSchema = joi_1.default.object({
    paymentId: validation_1.commonSchemas.id.required(),
    status: joi_1.default.string().valid('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED').required(),
    transactionId: joi_1.default.string().optional(),
    metadata: joi_1.default.object().optional()
});
router.get('/plans', subscriptionController_1.SubscriptionController.getSubscriptionPlans);
router.post('/', auth_1.authenticate, (0, validation_1.validate)(createSubscriptionSchema), subscriptionController_1.SubscriptionController.createSubscription);
router.get('/', auth_1.authenticate, subscriptionController_1.SubscriptionController.getUserSubscriptions);
router.get('/active', auth_1.authenticate, subscriptionController_1.SubscriptionController.getActiveSubscription);
router.get('/history', auth_1.authenticate, subscriptionController_1.SubscriptionController.getUserSubscriptions);
router.put('/change', auth_1.authenticate, (0, validation_1.validate)(changeSubscriptionSchema), subscriptionController_1.SubscriptionController.changeSubscription);
router.delete('/:subscriptionId', auth_1.authenticate, (0, validation_1.validateParams)({ subscriptionId: validation_1.commonSchemas.id }), subscriptionController_1.SubscriptionController.cancelSubscription);
router.post('/webhook/payment', (0, validation_1.validate)(paymentWebhookSchema), subscriptionController_1.SubscriptionController.processPaymentWebhook);
router.get('/analytics', auth_1.authenticate, auth_1.requireAdmin, subscriptionController_1.SubscriptionController.getSubscriptionAnalytics);
router.get('/health', subscriptionController_1.SubscriptionController.healthCheck);
//# sourceMappingURL=subscriptions.js.map
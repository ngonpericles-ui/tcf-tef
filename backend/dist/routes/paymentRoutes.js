"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const joi_1 = __importDefault(require("joi"));
const express_2 = __importDefault(require("express"));
const router = (0, express_1.Router)();
const createCoursePaymentSchema = {
    body: joi_1.default.object({
        courseId: joi_1.default.string().required().messages({
            'any.required': 'Course ID is required'
        }),
        currency: joi_1.default.string().valid('usd', 'eur', 'gbp').default('usd'),
        metadata: joi_1.default.object().optional()
    })
};
const createSubscriptionPaymentSchema = {
    body: joi_1.default.object({
        tier: joi_1.default.string().valid('ESSENTIAL', 'PREMIUM', 'PRO').required().messages({
            'any.only': 'Subscription tier must be one of: ESSENTIAL, PREMIUM, PRO',
            'any.required': 'Subscription tier is required'
        }),
        billingCycle: joi_1.default.string().valid('monthly', 'quarterly', 'yearly').required().messages({
            'any.only': 'Billing cycle must be one of: monthly, quarterly, yearly',
            'any.required': 'Billing cycle is required'
        })
    })
};
const confirmPaymentSchema = {
    body: joi_1.default.object({
        paymentIntentId: joi_1.default.string().required().messages({
            'any.required': 'Payment intent ID is required'
        })
    })
};
const paginationSchema = {
    query: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20)
    })
};
router.get('/config', paymentController_1.PaymentController.getStripeConfig);
router.get('/plans', paymentController_1.PaymentController.getSubscriptionPlans);
router.post('/course/create-intent', auth_1.authenticate, (0, validation_1.validate)(createCoursePaymentSchema), paymentController_1.PaymentController.createCoursePaymentIntent);
router.post('/create-payment-intent', auth_1.authenticate, (0, validation_1.validate)(createCoursePaymentSchema), paymentController_1.PaymentController.createCoursePaymentIntent);
router.post('/subscription/create-intent', auth_1.authenticate, (0, validation_1.validate)(createSubscriptionPaymentSchema), paymentController_1.PaymentController.createSubscriptionPaymentIntent);
router.post('/course/confirm', auth_1.authenticate, (0, validation_1.validate)(confirmPaymentSchema), paymentController_1.PaymentController.confirmCoursePayment);
router.get('/history', auth_1.authenticate, (0, validation_1.validate)(paginationSchema), paymentController_1.PaymentController.getPaymentHistory);
router.post('/subscription/:subscriptionId/cancel', auth_1.authenticate, paymentController_1.PaymentController.cancelSubscription);
router.post('/webhook', express_2.default.raw({ type: 'application/json' }), paymentController_1.PaymentController.handleWebhook);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const settingsService_1 = require("../services/settingsService");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.adminRoutes = router;
const createManagerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).required(),
    firstName: joi_1.default.string().min(2).max(50).required(),
    lastName: joi_1.default.string().min(2).max(50).required(),
    role: joi_1.default.string().valid('JUNIOR_MANAGER', 'SENIOR_MANAGER').required(),
    phone: joi_1.default.string().optional(),
    specialties: joi_1.default.array().items(joi_1.default.string()).optional()
});
const updateManagerSchema = joi_1.default.object({
    firstName: joi_1.default.string().min(2).max(50).optional(),
    lastName: joi_1.default.string().min(2).max(50).optional(),
    role: joi_1.default.string().valid('JUNIOR_MANAGER', 'SENIOR_MANAGER').optional(),
    status: joi_1.default.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').optional()
});
const reportConfigSchema = joi_1.default.object({
    type: joi_1.default.string().valid('users', 'courses', 'tests', 'revenue', 'engagement').required(),
    timeframe: joi_1.default.string().valid('7d', '30d', '90d', '1y').default('30d'),
    filters: joi_1.default.object().optional(),
    format: joi_1.default.string().valid('pdf', 'csv', 'excel').default('pdf')
});
router.get('/dashboard', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getDashboard);
router.get('/system/health', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getSystemHealth);
router.get('/metrics/business', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getBusinessMetrics);
router.get('/metrics/technical', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getTechnicalMetrics);
router.get('/users', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getAllUsers);
router.get('/users/:userId/analytics', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)({ userId: validation_1.commonSchemas.id }), adminController_1.AdminController.getUserAnalytics);
router.get('/managers', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getManagers);
router.post('/managers', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)(createManagerSchema), adminController_1.AdminController.createManager);
router.put('/managers/:managerId', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)({ managerId: validation_1.commonSchemas.id }), (0, validation_1.validate)(updateManagerSchema), adminController_1.AdminController.updateManager);
router.get('/managers/:managerId/performance', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)({ managerId: validation_1.commonSchemas.id }), adminController_1.AdminController.getManagerPerformance);
router.get('/analytics', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getAnalytics);
router.post('/analytics/reports', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)(reportConfigSchema), adminController_1.AdminController.generateReport);
router.get('/analytics/export', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.exportData);
router.get('/health', adminController_1.AdminController.healthCheck);
router.get('/settings', auth_1.authenticate, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const settings = await settingsService_1.SettingsService.getAdminSettings();
        res.json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/settings', auth_1.authenticate, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const settings = await settingsService_1.SettingsService.updateAdminSettings(req.body);
        res.json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/review-requests', auth_1.authenticate, auth_1.requireSeniorManager, adminController_1.AdminController.getReviewRequests);
router.post('/review-requests/:id/action', auth_1.authenticate, auth_1.requireSeniorManager, (0, validation_1.validate)({
    params: joi_1.default.object({
        id: validation_1.commonSchemas.id
    }),
    body: joi_1.default.object({
        action: joi_1.default.string().valid('accept', 'reject', 'complete').required(),
        response: joi_1.default.string().optional(),
        humanFeedback: joi_1.default.string().optional(),
        humanScore: joi_1.default.number().min(0).max(100).optional()
    })
}), adminController_1.AdminController.handleReviewRequest);
router.post('/subscription-plans', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    body: joi_1.default.object({
        name: joi_1.default.string().required(),
        nameEn: joi_1.default.string().optional(),
        description: joi_1.default.string().required(),
        descriptionEn: joi_1.default.string().optional(),
        tier: joi_1.default.string().valid('FREE', 'ESSENTIAL', 'PREMIUM', 'PRO').required(),
        price: joi_1.default.number().min(0).required(),
        currency: joi_1.default.string().default('FCFA'),
        billingCycle: joi_1.default.string().valid('monthly', 'quarterly', 'yearly').default('monthly'),
        features: joi_1.default.array().items(joi_1.default.string()).default([]),
        featuresEn: joi_1.default.array().items(joi_1.default.string()).default([]),
        maxSimulations: joi_1.default.number().min(0).optional(),
        maxLiveSessions: joi_1.default.number().min(0).optional(),
        maxCourses: joi_1.default.number().min(0).optional(),
        maxTests: joi_1.default.number().min(0).optional(),
        isActive: joi_1.default.boolean().default(true),
        isPopular: joi_1.default.boolean().default(false),
        sortOrder: joi_1.default.number().default(0),
        stripePriceId: joi_1.default.string().optional()
    })
}), adminController_1.AdminController.createSubscriptionPlan);
router.get('/subscription-plans', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getSubscriptionPlans);
router.get('/subscription-plans/:id', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    params: joi_1.default.object({
        id: validation_1.commonSchemas.id
    })
}), adminController_1.AdminController.getSubscriptionPlanById);
router.put('/subscription-plans/:id', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    params: joi_1.default.object({
        id: validation_1.commonSchemas.id
    }),
    body: joi_1.default.object({
        name: joi_1.default.string().optional(),
        nameEn: joi_1.default.string().optional(),
        description: joi_1.default.string().optional(),
        descriptionEn: joi_1.default.string().optional(),
        tier: joi_1.default.string().valid('FREE', 'ESSENTIAL', 'PREMIUM', 'PRO').optional(),
        price: joi_1.default.number().min(0).optional(),
        currency: joi_1.default.string().optional(),
        billingCycle: joi_1.default.string().valid('monthly', 'quarterly', 'yearly').optional(),
        features: joi_1.default.array().items(joi_1.default.string()).optional(),
        featuresEn: joi_1.default.array().items(joi_1.default.string()).optional(),
        maxSimulations: joi_1.default.number().min(0).optional(),
        maxLiveSessions: joi_1.default.number().min(0).optional(),
        maxCourses: joi_1.default.number().min(0).optional(),
        maxTests: joi_1.default.number().min(0).optional(),
        isActive: joi_1.default.boolean().optional(),
        isPopular: joi_1.default.boolean().optional(),
        sortOrder: joi_1.default.number().optional(),
        stripePriceId: joi_1.default.string().optional()
    })
}), adminController_1.AdminController.updateSubscriptionPlan);
router.delete('/subscription-plans/:id', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    params: joi_1.default.object({
        id: validation_1.commonSchemas.id
    })
}), adminController_1.AdminController.deleteSubscriptionPlan);
router.get('/subscription-analytics', auth_1.authenticate, auth_1.requireAdmin, adminController_1.AdminController.getSubscriptionAnalytics);
router.get('/audio-simulations', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    query: joi_1.default.object({
        page: joi_1.default.number().min(1).default(1),
        limit: joi_1.default.number().min(1).max(100).default(20),
        status: joi_1.default.string().valid('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED').optional(),
        level: joi_1.default.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').optional(),
        search: joi_1.default.string().optional()
    })
}), adminController_1.AdminController.getAudioSimulations);
router.get('/audio-simulations/:id', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    params: joi_1.default.object({
        id: validation_1.commonSchemas.id
    })
}), adminController_1.AdminController.getAudioSimulation);
router.post('/audio-simulations', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    body: joi_1.default.object({
        title: joi_1.default.string().min(3).max(200).required(),
        description: joi_1.default.string().min(10).max(1000).required(),
        level: joi_1.default.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').required(),
        category: joi_1.default.string().valid('GRAMMAR', 'LISTENING', 'READING', 'VOCABULARY', 'WRITING', 'ORAL', 'TCF_TEF').required(),
        questions: joi_1.default.array().items(joi_1.default.object({
            question: joi_1.default.string().required(),
            type: joi_1.default.string().valid('multiple-choice', 'open-ended', 'scenario').required(),
            options: joi_1.default.array().items(joi_1.default.string()).optional(),
            correctAnswer: joi_1.default.string().optional(),
            points: joi_1.default.number().min(1).max(10).required()
        })).min(1).required(),
        duration: joi_1.default.number().min(60).max(1800).default(420),
        voicePreference: joi_1.default.string().default('france_female_1'),
        isActive: joi_1.default.boolean().default(true)
    })
}), adminController_1.AdminController.createAudioSimulation);
router.put('/audio-simulations/:id', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    params: joi_1.default.object({
        id: validation_1.commonSchemas.id
    }),
    body: joi_1.default.object({
        title: joi_1.default.string().min(3).max(200).optional(),
        description: joi_1.default.string().min(10).max(1000).optional(),
        level: joi_1.default.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').optional(),
        category: joi_1.default.string().valid('GRAMMAR', 'LISTENING', 'READING', 'VOCABULARY', 'WRITING', 'ORAL', 'TCF_TEF').optional(),
        questions: joi_1.default.array().items(joi_1.default.object({
            question: joi_1.default.string().required(),
            type: joi_1.default.string().valid('multiple-choice', 'open-ended', 'scenario').required(),
            options: joi_1.default.array().items(joi_1.default.string()).optional(),
            correctAnswer: joi_1.default.string().optional(),
            points: joi_1.default.number().min(1).max(10).required()
        })).min(1).optional(),
        duration: joi_1.default.number().min(60).max(1800).optional(),
        voicePreference: joi_1.default.string().optional(),
        isActive: joi_1.default.boolean().optional()
    })
}), adminController_1.AdminController.updateAudioSimulation);
router.delete('/audio-simulations/:id', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    params: joi_1.default.object({
        id: validation_1.commonSchemas.id
    })
}), adminController_1.AdminController.deleteAudioSimulation);
router.get('/immigration-simulations', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    query: joi_1.default.object({
        page: joi_1.default.number().min(1).default(1),
        limit: joi_1.default.number().min(1).max(100).default(20),
        status: joi_1.default.string().optional(),
        country: joi_1.default.string().optional(),
        immigrationType: joi_1.default.string().optional(),
        level: joi_1.default.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').optional(),
        search: joi_1.default.string().optional()
    })
}), adminController_1.AdminController.getImmigrationSimulations);
router.get('/immigration-simulations/:id', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    params: joi_1.default.object({
        id: validation_1.commonSchemas.id
    })
}), adminController_1.AdminController.getImmigrationSimulation);
router.post('/immigration-simulations', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    body: joi_1.default.object({
        title: joi_1.default.string().min(3).max(200).required(),
        description: joi_1.default.string().min(10).max(1000).required(),
        country: joi_1.default.string().min(2).max(100).required(),
        immigrationType: joi_1.default.string().valid('work', 'study', 'family', 'refugee', 'business').required(),
        level: joi_1.default.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').required(),
        questions: joi_1.default.array().items(joi_1.default.object({
            question: joi_1.default.string().required(),
            type: joi_1.default.string().valid('personal', 'scenario', 'document').required(),
            category: joi_1.default.string().valid('personal_info', 'work_experience', 'education', 'family', 'documents').required(),
            points: joi_1.default.number().min(1).max(10).required()
        })).min(1).required(),
        duration: joi_1.default.number().min(300).max(1800).default(900),
        voicePreference: joi_1.default.string().default('france_female_1'),
        isActive: joi_1.default.boolean().default(true)
    })
}), adminController_1.AdminController.createImmigrationSimulation);
router.put('/immigration-simulations/:id', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    params: joi_1.default.object({
        id: validation_1.commonSchemas.id
    }),
    body: joi_1.default.object({
        title: joi_1.default.string().min(3).max(200).optional(),
        description: joi_1.default.string().min(10).max(1000).optional(),
        country: joi_1.default.string().min(2).max(100).optional(),
        immigrationType: joi_1.default.string().valid('work', 'study', 'family', 'refugee', 'business').optional(),
        level: joi_1.default.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').optional(),
        questions: joi_1.default.array().items(joi_1.default.object({
            question: joi_1.default.string().required(),
            type: joi_1.default.string().valid('personal', 'scenario', 'document').required(),
            category: joi_1.default.string().valid('personal_info', 'work_experience', 'education', 'family', 'documents').required(),
            points: joi_1.default.number().min(1).max(10).required()
        })).min(1).optional(),
        duration: joi_1.default.number().min(300).max(1800).optional(),
        voicePreference: joi_1.default.string().optional(),
        isActive: joi_1.default.boolean().optional()
    })
}), adminController_1.AdminController.updateImmigrationSimulation);
router.delete('/immigration-simulations/:id', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validate)({
    params: joi_1.default.object({
        id: validation_1.commonSchemas.id
    })
}), adminController_1.AdminController.deleteImmigrationSimulation);
//# sourceMappingURL=admin.js.map
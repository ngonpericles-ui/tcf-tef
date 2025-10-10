"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vapiAssistantSchemas = exports.aiAssistantSchemas = exports.voiceSimulationSchemas = exports.immigrationSimulationSchemas = exports.testSchemas = exports.courseSchemas = exports.userSchemas = exports.authSchemas = exports.commonSchemas = exports.validateParams = exports.validateQuery = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const errors_1 = require("../utils/errors");
const validate = (schema) => {
    return (req, _res, next) => {
        try {
            if (schema && typeof schema === 'object' && !schema.validate) {
                const schemaObj = schema;
                if (schemaObj.body) {
                    const { error, value } = schemaObj.body.validate(req.body, {
                        abortEarly: false,
                        stripUnknown: true
                    });
                    if (error) {
                        const errorMessage = error.details
                            .map(detail => detail.message)
                            .join(', ');
                        throw new errors_1.ValidationError(errorMessage);
                    }
                    req.body = value;
                }
                if (schemaObj.query) {
                    const { error, value } = schemaObj.query.validate(req.query, {
                        abortEarly: false,
                        stripUnknown: true
                    });
                    if (error) {
                        const errorMessage = error.details
                            .map(detail => detail.message)
                            .join(', ');
                        throw new errors_1.ValidationError(errorMessage);
                    }
                    req.query = value;
                }
                if (schemaObj.params) {
                    const { error, value } = schemaObj.params.validate(req.params, {
                        abortEarly: false,
                        stripUnknown: true
                    });
                    if (error) {
                        const errorMessage = error.details
                            .map(detail => detail.message)
                            .join(', ');
                        throw new errors_1.ValidationError(errorMessage);
                    }
                    req.params = value;
                }
            }
            else {
                const joiSchema = schema;
                const { error, value } = joiSchema.validate(req.body, {
                    abortEarly: false,
                    stripUnknown: true
                });
                if (error) {
                    const errorMessage = error.details
                        .map(detail => detail.message)
                        .join(', ');
                    throw new errors_1.ValidationError(errorMessage);
                }
                req.body = value;
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validate = validate;
const validateQuery = (schema) => {
    return (req, _res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessage = error.details
                .map(detail => detail.message)
                .join(', ');
            throw new errors_1.ValidationError(errorMessage);
        }
        req.query = value;
        next();
    };
};
exports.validateQuery = validateQuery;
const validateParams = (schemaObject) => {
    const schema = joi_1.default.object(schemaObject);
    return (req, _res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessage = error.details
                .map(detail => detail.message)
                .join(', ');
            throw new errors_1.ValidationError(errorMessage);
        }
        req.params = value;
        next();
    };
};
exports.validateParams = validateParams;
exports.commonSchemas = {
    id: joi_1.default.string().required().messages({
        'string.empty': 'ID is required',
        'any.required': 'ID is required'
    }),
    email: joi_1.default.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
    }),
    password: joi_1.default.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
    }),
    name: joi_1.default.string().min(2).max(50).required().messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name must not exceed 50 characters',
        'string.empty': 'Name is required',
        'any.required': 'Name is required'
    }),
    phone: joi_1.default.string().pattern(/^\+?[\d\s\-\(\)]+$/).messages({
        'string.pattern.base': 'Please provide a valid phone number'
    }),
    role: joi_1.default.string().valid('STUDENT', 'JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN').messages({
        'any.only': 'Role must be one of: STUDENT, JUNIOR_MANAGER, SENIOR_MANAGER, ADMIN'
    }),
    subscriptionTier: joi_1.default.string().valid('FREE', 'ESSENTIAL', 'PREMIUM', 'PRO').messages({
        'any.only': 'Subscription tier must be one of: FREE, ESSENTIAL, PREMIUM, PRO'
    }),
    courseLevel: joi_1.default.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').messages({
        'any.only': 'Course level must be one of: A1, A2, B1, B2, C1, C2'
    }),
    courseCategory: joi_1.default.string().valid('GRAMMAR', 'LISTENING', 'READING', 'VOCABULARY', 'WRITING', 'ORAL', 'TCF_TEF').messages({
        'any.only': 'Course category must be one of: GRAMMAR, LISTENING, READING, VOCABULARY, WRITING, ORAL, TCF_TEF'
    }),
    testType: joi_1.default.string().valid('TCF', 'TEF', 'PRACTICE', 'MOCK', 'DIAGNOSTIC').messages({
        'any.only': 'Test type must be one of: TCF, TEF, PRACTICE, MOCK, DIAGNOSTIC'
    }),
    pagination: {
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(10),
        sortBy: joi_1.default.string().default('createdAt'),
        sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc')
    }
};
exports.authSchemas = {
    register: joi_1.default.object({
        email: exports.commonSchemas.email,
        password: exports.commonSchemas.password,
        firstName: exports.commonSchemas.name,
        lastName: exports.commonSchemas.name,
        phone: exports.commonSchemas.phone.optional().allow(''),
        country: joi_1.default.string().max(100).optional().allow('')
    }),
    login: joi_1.default.object({
        email: exports.commonSchemas.email,
        password: joi_1.default.string().required().messages({
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        })
    }),
    refreshToken: joi_1.default.object({
        refreshToken: joi_1.default.string().required().messages({
            'string.empty': 'Refresh token is required',
            'any.required': 'Refresh token is required'
        })
    }),
    forgotPassword: joi_1.default.object({
        email: exports.commonSchemas.email
    }),
    resetPassword: joi_1.default.object({
        token: joi_1.default.string().required(),
        password: exports.commonSchemas.password
    }),
    socialAuth: joi_1.default.object({
        idToken: joi_1.default.string().required().messages({
            'string.empty': 'ID token is required',
            'any.required': 'ID token is required'
        }),
        provider: joi_1.default.string().valid('google', 'apple', 'facebook').optional()
    }),
    googleAuth: joi_1.default.object({
        idToken: joi_1.default.string().required().messages({
            'string.empty': 'Google ID token is required',
            'any.required': 'Google ID token is required'
        }),
        email: exports.commonSchemas.email,
        firstName: exports.commonSchemas.name,
        lastName: exports.commonSchemas.name,
        profileImage: joi_1.default.string().uri().optional()
    })
};
exports.userSchemas = {
    updateProfile: joi_1.default.object({
        firstName: exports.commonSchemas.name.optional(),
        lastName: exports.commonSchemas.name.optional(),
        phone: exports.commonSchemas.phone.optional(),
        country: joi_1.default.string().max(100).optional(),
        city: joi_1.default.string().max(100).optional(),
        bio: joi_1.default.string().max(500).optional(),
        profileImage: joi_1.default.string().uri().optional(),
        preferences: joi_1.default.object().optional()
    }),
    changePassword: joi_1.default.object({
        currentPassword: joi_1.default.string().required(),
        newPassword: exports.commonSchemas.password
    })
};
exports.courseSchemas = {
    create: joi_1.default.object({
        title: joi_1.default.string().min(3).max(200).required(),
        titleEn: joi_1.default.string().min(3).max(200).optional(),
        description: joi_1.default.string().min(10).max(1000).required(),
        descriptionEn: joi_1.default.string().min(10).max(1000).optional(),
        level: exports.commonSchemas.courseLevel.required(),
        category: exports.commonSchemas.courseCategory.required(),
        requiredTier: exports.commonSchemas.subscriptionTier.required(),
        duration: joi_1.default.number().integer().min(1).required(),
        lessons: joi_1.default.number().integer().min(1).required(),
        difficulty: joi_1.default.number().integer().min(1).max(5).required(),
        image: joi_1.default.string().uri().optional(),
        tags: joi_1.default.array().items(joi_1.default.string().max(50)).max(10).required()
    }),
    update: joi_1.default.object({
        title: joi_1.default.string().min(3).max(200).optional(),
        titleEn: joi_1.default.string().min(3).max(200).optional(),
        description: joi_1.default.string().min(10).max(1000).optional(),
        descriptionEn: joi_1.default.string().min(10).max(1000).optional(),
        level: exports.commonSchemas.courseLevel.optional(),
        category: exports.commonSchemas.courseCategory.optional(),
        requiredTier: exports.commonSchemas.subscriptionTier.optional(),
        duration: joi_1.default.number().integer().min(1).optional(),
        lessons: joi_1.default.number().integer().min(1).optional(),
        difficulty: joi_1.default.number().integer().min(1).max(5).optional(),
        image: joi_1.default.string().uri().optional(),
        tags: joi_1.default.array().items(joi_1.default.string().max(50)).max(10).optional(),
        isPublished: joi_1.default.boolean().optional()
    }),
    query: joi_1.default.object({
        page: exports.commonSchemas.pagination.page,
        limit: exports.commonSchemas.pagination.limit,
        sortBy: exports.commonSchemas.pagination.sortBy,
        sortOrder: exports.commonSchemas.pagination.sortOrder,
        search: joi_1.default.string().max(100).optional(),
        level: exports.commonSchemas.courseLevel.optional(),
        category: exports.commonSchemas.courseCategory.optional(),
        tier: exports.commonSchemas.subscriptionTier.optional(),
        isPublished: joi_1.default.boolean().optional()
    })
};
exports.testSchemas = {
    create: joi_1.default.object({
        title: joi_1.default.string().min(3).max(200).required(),
        titleEn: joi_1.default.string().min(3).max(200).optional(),
        description: joi_1.default.string().min(10).max(1000).required(),
        descriptionEn: joi_1.default.string().min(10).max(1000).optional(),
        type: exports.commonSchemas.testType.required(),
        level: exports.commonSchemas.courseLevel.required(),
        category: exports.commonSchemas.courseCategory.required(),
        requiredTier: exports.commonSchemas.subscriptionTier.required(),
        duration: joi_1.default.number().integer().min(1).required(),
        questionCount: joi_1.default.number().integer().min(1).required(),
        difficulty: joi_1.default.number().integer().min(1).max(5).required(),
        passingScore: joi_1.default.number().integer().min(0).max(100).required(),
        maxAttempts: joi_1.default.number().integer().min(1).optional(),
        tags: joi_1.default.array().items(joi_1.default.string().max(50)).max(10).required(),
        aiPowered: joi_1.default.boolean().optional(),
        hasAIFeedback: joi_1.default.boolean().optional(),
        isOfficial: joi_1.default.boolean().optional(),
        image: joi_1.default.string().uri().optional()
    }),
    submitAnswers: joi_1.default.object({
        attemptId: exports.commonSchemas.id,
        answers: joi_1.default.array().items(joi_1.default.object({
            questionId: exports.commonSchemas.id,
            answer: joi_1.default.any().required(),
            timeSpent: joi_1.default.number().integer().min(0).optional()
        })).required()
    })
};
exports.immigrationSimulationSchemas = {
    create: joi_1.default.object({
        country: joi_1.default.string().valid('canada', 'france', 'belgium').required(),
        immigrationType: joi_1.default.string().valid('skilled_worker', 'student', 'family_reunification', 'work_permit', 'family', 'work').required(),
        level: joi_1.default.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').required(),
        voicePreference: joi_1.default.string().valid('france_female_1', 'france_male_1', 'quebec_female_1', 'quebec_male_1').optional(),
        personalInfo: joi_1.default.object().optional()
    }),
    params: joi_1.default.object({
        id: joi_1.default.string().pattern(/^[a-z0-9]{25}$/).required().messages({
            'string.pattern.base': '"id" must be a valid CUID'
        })
    })
};
exports.voiceSimulationSchemas = {
    booking: joi_1.default.object({
        scheduledDate: joi_1.default.date().iso().required(),
        voicePreference: joi_1.default.string().valid('france_female_1', 'france_male_1', 'quebec_female_1', 'quebec_male_1').required(),
        language: joi_1.default.string().valid('fr', 'en').optional().default('fr')
    }),
    reschedule: joi_1.default.object({
        newDate: joi_1.default.date().iso().required(),
        voicePreference: joi_1.default.string().valid('france_female_1', 'france_male_1', 'quebec_female_1', 'quebec_male_1').optional()
    }),
    params: joi_1.default.object({
        id: joi_1.default.string().pattern(/^[a-z0-9]{25}$/).required().messages({
            'string.pattern.base': '"id" must be a valid CUID'
        })
    })
};
exports.aiAssistantSchemas = {
    chat: joi_1.default.object({
        message: joi_1.default.string().min(1).max(1000).required(),
        context: joi_1.default.object({
            page: joi_1.default.string().valid('voice-simulation', 'immigration-simulation', 'tcf-tef-simulation', 'general').required(),
            language: joi_1.default.string().valid('fr', 'en').optional().default('fr'),
            simulationType: joi_1.default.string().valid('voice', 'immigration').optional(),
            country: joi_1.default.string().valid('canada', 'france', 'belgium').optional(),
            immigrationType: joi_1.default.string().valid('skilled_worker', 'student', 'family_reunification', 'work_permit', 'family', 'work').optional(),
            userLevel: joi_1.default.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').optional()
        }).required()
    }),
    suggestions: joi_1.default.object({
        page: joi_1.default.string().valid('voice-simulation', 'immigration-simulation', 'tcf-tef-simulation', 'general').optional(),
        language: joi_1.default.string().valid('fr', 'en').optional().default('fr')
    })
};
exports.vapiAssistantSchemas = {
    create: joi_1.default.object({
        voiceId: joi_1.default.string().valid('france_female_1', 'france_male_1', 'quebec_female_1', 'quebec_male_1').required(),
        country: joi_1.default.string().valid('canada', 'france', 'belgium').optional(),
        immigrationType: joi_1.default.string().valid('skilled_worker', 'student', 'family_reunification', 'work_permit', 'family', 'work').optional(),
        questions: joi_1.default.array().items(joi_1.default.object()).min(1).required(),
        language: joi_1.default.string().valid('fr', 'en').optional().default('fr')
    })
};
//# sourceMappingURL=validation.js.map
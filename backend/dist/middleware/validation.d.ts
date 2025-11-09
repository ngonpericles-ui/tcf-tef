import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare const validate: (schema: Joi.ObjectSchema | {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
}) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const validateQuery: (schema: Joi.ObjectSchema) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const validateParams: (schemaObject: Record<string, Joi.Schema>) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const commonSchemas: {
    id: Joi.StringSchema<string>;
    email: Joi.StringSchema<string>;
    password: Joi.StringSchema<string>;
    name: Joi.StringSchema<string>;
    phone: Joi.StringSchema<string>;
    role: Joi.StringSchema<string>;
    subscriptionTier: Joi.StringSchema<string>;
    courseLevel: Joi.StringSchema<string>;
    courseCategory: Joi.StringSchema<string>;
    testType: Joi.StringSchema<string>;
    pagination: {
        page: Joi.NumberSchema<number>;
        limit: Joi.NumberSchema<number>;
        sortBy: Joi.StringSchema<string>;
        sortOrder: Joi.StringSchema<string>;
    };
};
export declare const authSchemas: {
    register: Joi.ObjectSchema<any>;
    login: Joi.ObjectSchema<any>;
    refreshToken: Joi.ObjectSchema<any>;
    forgotPassword: Joi.ObjectSchema<any>;
    verifyResetCode: Joi.ObjectSchema<any>;
    resetPassword: Joi.ObjectSchema<any>;
    resendResetCode: Joi.ObjectSchema<any>;
    socialAuth: Joi.ObjectSchema<any>;
    googleAuth: Joi.ObjectSchema<any>;
};
export declare const userSchemas: {
    updateProfile: Joi.ObjectSchema<any>;
    changePassword: Joi.ObjectSchema<any>;
};
export declare const courseSchemas: {
    create: Joi.ObjectSchema<any>;
    update: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const testSchemas: {
    create: Joi.ObjectSchema<any>;
    submitAnswers: Joi.ObjectSchema<any>;
};
export declare const immigrationSimulationSchemas: {
    create: Joi.ObjectSchema<any>;
    params: Joi.ObjectSchema<any>;
};
export declare const voiceSimulationSchemas: {
    booking: Joi.ObjectSchema<any>;
    reschedule: Joi.ObjectSchema<any>;
    params: Joi.ObjectSchema<any>;
};
export declare const aiAssistantSchemas: {
    chat: Joi.ObjectSchema<any>;
    suggestions: Joi.ObjectSchema<any>;
};
export declare const vapiAssistantSchemas: {
    create: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=validation.d.ts.map
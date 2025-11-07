"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherRoutes = void 0;
const express_1 = require("express");
const teacherController_1 = require("@/controllers/teacherController");
const auth_1 = require("@/middleware/auth");
const client_1 = require("@prisma/client");
const validation_1 = require("@/middleware/validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.teacherRoutes = router;
const teacherFiltersSchema = joi_1.default.object({
    search: joi_1.default.string().optional(),
    specialties: joi_1.default.string().optional(),
    availability: joi_1.default.string().optional(),
    rating: joi_1.default.number().min(1).max(5).optional(),
    sortBy: joi_1.default.string().valid('rating', 'experience', 'availability').default('rating')
});
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), (0, validation_1.validate)(teacherFiltersSchema), teacherController_1.TeacherController.getTeachers);
router.get('/:teacherId', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), (0, validation_1.validate)({ params: joi_1.default.object({ teacherId: validation_1.commonSchemas.id }) }), teacherController_1.TeacherController.getTeacherProfile);
router.get('/:teacherId/availability', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), (0, validation_1.validate)({ params: joi_1.default.object({ teacherId: validation_1.commonSchemas.id }) }), teacherController_1.TeacherController.getTeacherAvailability);
router.post('/:teacherId/book', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.STUDENT), (0, validation_1.validate)({
    params: joi_1.default.object({ teacherId: validation_1.commonSchemas.id }),
    body: joi_1.default.object({
        date: joi_1.default.date().required(),
        time: joi_1.default.string().required(),
        duration: joi_1.default.number().min(30).max(120).default(60),
        subject: joi_1.default.string().required(),
        level: joi_1.default.string().valid('B1', 'B2', 'C1', 'C2').required(),
        notes: joi_1.default.string().max(500).optional()
    })
}), teacherController_1.TeacherController.bookSession);
//# sourceMappingURL=teachers.js.map
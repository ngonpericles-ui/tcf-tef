"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const userController_1 = require("../controllers/userController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.userRoutes = router;
router.get('/profile', auth_1.authenticate, userController_1.UserController.getProfile);
router.put('/profile', auth_1.authenticate, (0, validation_1.validate)(validation_1.userSchemas.updateProfile), userController_1.UserController.updateProfile);
router.post('/change-password', auth_1.authenticate, (0, validation_1.validate)(validation_1.userSchemas.changePassword), userController_1.UserController.changePassword);
router.get('/dashboard', auth_1.authenticate, userController_1.UserController.getDashboardStats);
router.get('/', auth_1.authenticate, auth_1.requireManager, userController_1.UserController.getAllUsers);
router.get('/:userId', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validateParams)({ userId: validation_1.commonSchemas.id }), userController_1.UserController.getUserById);
router.put('/:userId/role', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)({ userId: validation_1.commonSchemas.id }), (0, validation_1.validate)(joi_1.default.object({ role: validation_1.commonSchemas.role.required() })), userController_1.UserController.updateUserRole);
router.put('/:userId/status', auth_1.authenticate, auth_1.requireSeniorManager, (0, validation_1.validateParams)({ userId: validation_1.commonSchemas.id }), (0, validation_1.validate)(joi_1.default.object({ status: joi_1.default.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').required() })), userController_1.UserController.updateUserStatus);
router.delete('/:userId', auth_1.authenticate, auth_1.requireAdmin, (0, validation_1.validateParams)({ userId: validation_1.commonSchemas.id }), userController_1.UserController.deleteUser);
router.get('/health', userController_1.UserController.healthCheck);
//# sourceMappingURL=users.js.map
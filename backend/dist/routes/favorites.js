"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoriteRoutes = void 0;
const express_1 = require("express");
const favoriteController_1 = require("@/controllers/favoriteController");
const validation_1 = require("@/middleware/validation");
const auth_1 = require("@/middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.favoriteRoutes = router;
const addFavoriteSchema = joi_1.default.object({
    contentId: joi_1.default.string().required(),
    contentType: joi_1.default.string().valid('COURSE', 'TEST', 'LIVE_SESSION', 'POST', 'DOCUMENT', 'VIDEO', 'AUDIO').required(),
    folder: joi_1.default.string().optional(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    notes: joi_1.default.string().max(1000).optional()
});
const updateFavoriteSchema = joi_1.default.object({
    folder: joi_1.default.string().optional(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    notes: joi_1.default.string().max(1000).optional()
});
const createFolderSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(100).required(),
    description: joi_1.default.string().max(500).optional(),
    color: joi_1.default.string().pattern(/^#[0-9A-F]{6}$/i).optional()
});
const updateFolderSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(100).optional(),
    description: joi_1.default.string().max(500).optional(),
    color: joi_1.default.string().pattern(/^#[0-9A-F]{6}$/i).optional()
});
const bulkOperationSchema = joi_1.default.object({
    operation: joi_1.default.string().valid('move', 'delete', 'removeFolder').required(),
    favoriteIds: joi_1.default.array().items(joi_1.default.string()).min(1).required(),
    targetFolder: joi_1.default.string().optional()
});
router.get('/', auth_1.authenticate, favoriteController_1.FavoriteController.getFavorites);
router.post('/', auth_1.authenticate, (0, validation_1.validate)(addFavoriteSchema), favoriteController_1.FavoriteController.addToFavorites);
router.get('/check', auth_1.authenticate, favoriteController_1.FavoriteController.checkFavorite);
router.get('/stats', auth_1.authenticate, favoriteController_1.FavoriteController.getFavoriteStats);
router.get('/folders', auth_1.authenticate, favoriteController_1.FavoriteController.getFolders);
router.post('/folders', auth_1.authenticate, (0, validation_1.validate)(createFolderSchema), favoriteController_1.FavoriteController.createFolder);
router.post('/bulk', auth_1.authenticate, (0, validation_1.validate)(bulkOperationSchema), favoriteController_1.FavoriteController.bulkOperation);
router.put('/:favoriteId', auth_1.authenticate, (0, validation_1.validateParams)({ favoriteId: validation_1.commonSchemas.id }), (0, validation_1.validate)(updateFavoriteSchema), favoriteController_1.FavoriteController.updateFavorite);
router.delete('/:favoriteId', auth_1.authenticate, (0, validation_1.validateParams)({ favoriteId: validation_1.commonSchemas.id }), favoriteController_1.FavoriteController.removeFromFavorites);
router.put('/folders/:folderId', auth_1.authenticate, (0, validation_1.validateParams)({ folderId: validation_1.commonSchemas.id }), (0, validation_1.validate)(updateFolderSchema), favoriteController_1.FavoriteController.updateFolder);
router.delete('/folders/:folderId', auth_1.authenticate, (0, validation_1.validateParams)({ folderId: validation_1.commonSchemas.id }), favoriteController_1.FavoriteController.deleteFolder);
//# sourceMappingURL=favorites.js.map
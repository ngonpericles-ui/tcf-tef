"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRoutes = void 0;
const express_1 = require("express");
const postController_1 = require("../controllers/postController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.postRoutes = router;
const createPostSchema = joi_1.default.object({
    title: joi_1.default.string().min(1).max(200).required(),
    content: joi_1.default.string().min(1).required(),
    excerpt: joi_1.default.string().max(500).optional(),
    media: joi_1.default.string().uri().optional(),
    visibility: joi_1.default.string().valid('PUBLIC', 'SUBSCRIBERS_ONLY', 'PRIVATE').default('PUBLIC'),
    status: joi_1.default.string().valid('DRAFT', 'PUBLISHED', 'SCHEDULED').default('DRAFT'),
    category: joi_1.default.string().optional(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    objectives: joi_1.default.array().items(joi_1.default.string()).optional(),
    keyPoints: joi_1.default.array().items(joi_1.default.string()).optional(),
    level: joi_1.default.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').optional(),
    targetTier: joi_1.default.string().valid('FREE', 'ESSENTIAL', 'PREMIUM', 'PRO').default('FREE'),
    scheduledAt: joi_1.default.date().optional()
});
const updatePostSchema = joi_1.default.object({
    title: joi_1.default.string().min(1).max(200).optional(),
    content: joi_1.default.string().min(1).optional(),
    excerpt: joi_1.default.string().max(500).optional(),
    media: joi_1.default.string().uri().optional(),
    visibility: joi_1.default.string().valid('PUBLIC', 'SUBSCRIBERS_ONLY', 'PRIVATE').optional(),
    status: joi_1.default.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED').optional(),
    category: joi_1.default.string().optional(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    objectives: joi_1.default.array().items(joi_1.default.string()).optional(),
    keyPoints: joi_1.default.array().items(joi_1.default.string()).optional(),
    level: joi_1.default.string().valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2').optional(),
    targetTier: joi_1.default.string().valid('FREE', 'ESSENTIAL', 'PREMIUM', 'PRO').optional(),
    scheduledAt: joi_1.default.date().optional()
});
const commentSchema = joi_1.default.object({
    content: joi_1.default.string().min(1).max(2000).required(),
    parentId: joi_1.default.string().optional()
});
const shareSchema = joi_1.default.object({
    platform: joi_1.default.string().optional()
});
router.get('/', postController_1.PostController.getAllPosts);
router.get('/trending', postController_1.PostController.getTrendingPosts);
router.get('/search', postController_1.PostController.searchPosts);
router.get('/my', auth_1.authenticate, postController_1.PostController.getUserPosts);
router.post('/', auth_1.authenticate, auth_1.requireManager, (0, validation_1.validate)(createPostSchema), postController_1.PostController.createPost);
router.get('/:postId', (0, validation_1.validateParams)({ postId: validation_1.commonSchemas.id }), postController_1.PostController.getPostById);
router.put('/:postId', auth_1.authenticate, (0, validation_1.validateParams)({ postId: validation_1.commonSchemas.id }), (0, validation_1.validate)(updatePostSchema), postController_1.PostController.updatePost);
router.delete('/:postId', auth_1.authenticate, (0, validation_1.validateParams)({ postId: validation_1.commonSchemas.id }), postController_1.PostController.deletePost);
router.post('/:postId/like', auth_1.authenticate, (0, validation_1.validateParams)({ postId: validation_1.commonSchemas.id }), postController_1.PostController.toggleLike);
router.get('/:postId/comments', (0, validation_1.validateParams)({ postId: validation_1.commonSchemas.id }), postController_1.PostController.getComments);
router.post('/:postId/comments', auth_1.authenticate, (0, validation_1.validateParams)({ postId: validation_1.commonSchemas.id }), (0, validation_1.validate)(commentSchema), postController_1.PostController.addComment);
router.post('/:postId/share', auth_1.authenticate, (0, validation_1.validateParams)({ postId: validation_1.commonSchemas.id }), (0, validation_1.validate)(shareSchema), postController_1.PostController.sharePost);
router.get('/:postId/analytics', auth_1.authenticate, (0, validation_1.validateParams)({ postId: validation_1.commonSchemas.id }), postController_1.PostController.getPostAnalytics);
//# sourceMappingURL=posts.js.map
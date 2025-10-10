"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commentController_1 = require("../controllers/commentController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
const createCommentSchema = {
    body: joi_1.default.object({
        content: joi_1.default.string().min(1).max(2000).required().messages({
            'string.min': 'Comment content cannot be empty',
            'string.max': 'Comment content must not exceed 2000 characters',
            'any.required': 'Comment content is required'
        }),
        parentId: joi_1.default.string().uuid().optional().messages({
            'string.uuid': 'Parent ID must be a valid UUID'
        })
    })
};
const updateCommentSchema = {
    body: joi_1.default.object({
        content: joi_1.default.string().min(1).max(2000).required().messages({
            'string.min': 'Comment content cannot be empty',
            'string.max': 'Comment content must not exceed 2000 characters',
            'any.required': 'Comment content is required'
        })
    })
};
const sharePostSchema = {
    body: joi_1.default.object({
        platform: joi_1.default.string().valid('internal', 'facebook', 'twitter', 'linkedin', 'whatsapp').optional()
    })
};
const paginationSchema = {
    query: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20)
    })
};
router.get('/posts/:postId/comments', (0, validation_1.validate)(paginationSchema), commentController_1.CommentController.getPostComments);
router.post('/posts/:postId/comments', auth_1.authenticate, (0, validation_1.validate)(createCommentSchema), commentController_1.CommentController.createComment);
router.get('/comments/:commentId', commentController_1.CommentController.getCommentById);
router.put('/comments/:commentId', auth_1.authenticate, (0, validation_1.validate)(updateCommentSchema), commentController_1.CommentController.updateComment);
router.delete('/comments/:commentId', auth_1.authenticate, commentController_1.CommentController.deleteComment);
router.post('/comments/:commentId/like', auth_1.authenticate, commentController_1.CommentController.toggleCommentLike);
router.post('/posts/:postId/like', auth_1.authenticate, commentController_1.SocialController.togglePostLike);
router.post('/posts/:postId/share', auth_1.authenticate, (0, validation_1.validate)(sharePostSchema), commentController_1.SocialController.sharePost);
router.get('/posts/:postId/engagement', commentController_1.SocialController.getPostEngagement);
exports.default = router;
//# sourceMappingURL=commentRoutes.js.map
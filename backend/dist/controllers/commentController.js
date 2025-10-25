"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialController = exports.CommentController = void 0;
const commentService_1 = require("../services/commentService");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class CommentController {
    static async getPostComments(req, res) {
        try {
            const { postId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const userId = req.user?.userId;
            if (limit > 100) {
                throw new errors_1.ValidationError('Limit cannot exceed 100');
            }
            const result = await commentService_1.CommentService.getPostComments(postId, userId, page, limit);
            res.json({
                success: true,
                data: result,
                message: `Retrieved ${result.comments.length} comments for post`
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get post comments', {
                postId: req.params.postId,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'POST_NOT_FOUND'
                    }
                });
            }
            else if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to get comments',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'COMMENTS_FETCH_ERROR'
                    }
                });
            }
        }
    }
    static async createComment(req, res) {
        try {
            const { postId } = req.params;
            const { content, parentId } = req.body;
            const userId = req.user.userId;
            if (!content || typeof content !== 'string') {
                throw new errors_1.ValidationError('Comment content is required');
            }
            const comment = await commentService_1.CommentService.createComment({ content, postId, parentId }, userId);
            res.status(201).json({
                success: true,
                data: { comment },
                message: parentId ? 'Reply created successfully' : 'Comment created successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create comment', {
                postId: req.params.postId,
                body: req.body,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'RESOURCE_NOT_FOUND'
                    }
                });
            }
            else if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else if (error instanceof errors_1.ForbiddenError) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FORBIDDEN'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to create comment',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'COMMENT_CREATION_ERROR'
                    }
                });
            }
        }
    }
    static async updateComment(req, res) {
        try {
            const { commentId } = req.params;
            const { content } = req.body;
            const userId = req.user.userId;
            if (!content || typeof content !== 'string') {
                throw new errors_1.ValidationError('Comment content is required');
            }
            const comment = await commentService_1.CommentService.updateComment(commentId, { content }, userId);
            res.json({
                success: true,
                data: { comment },
                message: 'Comment updated successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update comment', {
                commentId: req.params.commentId,
                body: req.body,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'COMMENT_NOT_FOUND'
                    }
                });
            }
            else if (error instanceof errors_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            else if (error instanceof errors_1.ForbiddenError) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FORBIDDEN'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to update comment',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'COMMENT_UPDATE_ERROR'
                    }
                });
            }
        }
    }
    static async deleteComment(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user.userId;
            await commentService_1.CommentService.deleteComment(commentId, userId);
            res.json({
                success: true,
                message: 'Comment deleted successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete comment', {
                commentId: req.params.commentId,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'COMMENT_NOT_FOUND'
                    }
                });
            }
            else if (error instanceof errors_1.ForbiddenError) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FORBIDDEN'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to delete comment',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'COMMENT_DELETE_ERROR'
                    }
                });
            }
        }
    }
    static async toggleCommentLike(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user.userId;
            const result = await commentService_1.CommentService.toggleCommentLike(commentId, userId);
            res.json({
                success: true,
                data: result,
                message: result.isLiked ? 'Comment liked' : 'Comment unliked'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to toggle comment like', {
                commentId: req.params.commentId,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'COMMENT_NOT_FOUND'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to toggle comment like',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'COMMENT_LIKE_ERROR'
                    }
                });
            }
        }
    }
    static async getCommentById(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user?.userId;
            const comment = await commentService_1.CommentService.getCommentById(commentId, userId);
            res.json({
                success: true,
                data: { comment },
                message: 'Comment retrieved successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get comment by ID', {
                commentId: req.params.commentId,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'COMMENT_NOT_FOUND'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to get comment',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'COMMENT_FETCH_ERROR'
                    }
                });
            }
        }
    }
}
exports.CommentController = CommentController;
class SocialController {
    static async togglePostLike(req, res) {
        try {
            const { postId } = req.params;
            const userId = req.user.userId;
            const result = await commentService_1.SocialInteractionService.togglePostLike(postId, userId);
            res.json({
                success: true,
                data: result,
                message: result.isLiked ? 'Post liked' : 'Post unliked'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to toggle post like', {
                postId: req.params.postId,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'POST_NOT_FOUND'
                    }
                });
            }
            else if (error instanceof errors_1.ForbiddenError) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FORBIDDEN'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to toggle post like',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'POST_LIKE_ERROR'
                    }
                });
            }
        }
    }
    static async sharePost(req, res) {
        try {
            const { postId } = req.params;
            const { platform } = req.body;
            const userId = req.user.userId;
            const result = await commentService_1.SocialInteractionService.sharePost(postId, userId, platform);
            res.json({
                success: true,
                data: result,
                message: 'Post shared successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to share post', {
                postId: req.params.postId,
                body: req.body,
                error,
                userId: req.user?.userId
            });
            if (error instanceof errors_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'POST_NOT_FOUND'
                    }
                });
            }
            else if (error instanceof errors_1.ForbiddenError) {
                res.status(403).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: 'FORBIDDEN'
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to share post',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        code: 'POST_SHARE_ERROR'
                    }
                });
            }
        }
    }
    static async getPostEngagement(req, res) {
        try {
            const { postId } = req.params;
            const userId = req.user?.userId;
            const engagement = await commentService_1.SocialInteractionService.getPostEngagement(postId, userId);
            res.json({
                success: true,
                data: { engagement },
                message: 'Post engagement retrieved successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get post engagement', {
                postId: req.params.postId,
                error,
                userId: req.user?.userId
            });
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to get post engagement',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'ENGAGEMENT_FETCH_ERROR'
                }
            });
        }
    }
}
exports.SocialController = SocialController;
//# sourceMappingURL=commentController.js.map
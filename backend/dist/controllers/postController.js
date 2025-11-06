"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostController = void 0;
const postService_1 = require("@/services/postService");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = require("@/utils/logger");
class PostController {
}
exports.PostController = PostController;
_a = PostController;
PostController.getAllPosts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;
    const level = req.query.level;
    const status = req.query.status;
    const search = req.query.search;
    const authorId = req.query.authorId;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const filters = {
        category,
        level,
        status,
        search,
        authorId
    };
    const result = await postService_1.PostService.getAllPosts({ page, limit }, filters, { sortBy, sortOrder });
    const response = {
        success: true,
        data: result.posts,
        pagination: result.pagination,
        message: 'Posts retrieved successfully'
    };
    res.status(200).json(response);
});
PostController.getPostById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?.userId;
    const post = await postService_1.PostService.getPostById(postId, userId);
    const response = {
        success: true,
        data: { post },
        message: 'Post retrieved successfully'
    };
    res.status(200).json(response);
});
PostController.createPost = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const authorId = req.user?.userId;
    const postData = req.body;
    if (!authorId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const post = await postService_1.PostService.createPost(authorId, postData);
    const response = {
        success: true,
        data: { post },
        message: 'Post created successfully'
    };
    logger_1.logger.info('Post created', { postId: post.id, authorId });
    res.status(201).json(response);
});
PostController.updatePost = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?.userId;
    const updateData = req.body;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const post = await postService_1.PostService.updatePost(postId, userId, updateData);
    const response = {
        success: true,
        data: { post },
        message: 'Post updated successfully'
    };
    logger_1.logger.info('Post updated', { postId, userId });
    res.status(200).json(response);
});
PostController.deletePost = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await postService_1.PostService.deletePost(postId, userId);
    const response = {
        success: true,
        message: 'Post deleted successfully'
    };
    logger_1.logger.info('Post deleted', { postId, userId });
    res.status(200).json(response);
});
PostController.toggleLike = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const result = await postService_1.PostService.toggleLike(postId, userId);
    const response = {
        success: true,
        data: result,
        message: result.liked ? 'Post liked' : 'Post unliked'
    };
    res.status(200).json(response);
});
PostController.addComment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?.userId;
    const { content, parentId } = req.body;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const comment = await postService_1.PostService.addComment(postId, userId, content, parentId);
    const response = {
        success: true,
        data: { comment },
        message: 'Comment added successfully'
    };
    logger_1.logger.info('Comment added', { postId, commentId: comment.id, userId });
    res.status(201).json(response);
});
PostController.getComments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await postService_1.PostService.getComments(postId, { page, limit });
    const response = {
        success: true,
        data: result.comments,
        pagination: result.pagination,
        message: 'Comments retrieved successfully'
    };
    res.status(200).json(response);
});
PostController.sharePost = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?.userId;
    const { platform } = req.body;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const share = await postService_1.PostService.sharePost(postId, userId, platform);
    const response = {
        success: true,
        data: { share },
        message: 'Post shared successfully'
    };
    logger_1.logger.info('Post shared', { postId, userId, platform });
    res.status(201).json(response);
});
PostController.getPostAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const analytics = await postService_1.PostService.getPostAnalytics(postId, userId);
    const response = {
        success: true,
        data: analytics,
        message: 'Post analytics retrieved successfully'
    };
    res.status(200).json(response);
});
PostController.getUserPosts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const result = await postService_1.PostService.getUserPosts(userId, { page, limit }, { status });
    const response = {
        success: true,
        data: result.posts,
        pagination: result.pagination,
        message: 'User posts retrieved successfully'
    };
    res.status(200).json(response);
});
PostController.getTrendingPosts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const timeframe = req.query.timeframe || '7d';
    const posts = await postService_1.PostService.getTrendingPosts(limit, timeframe);
    const response = {
        success: true,
        data: { posts },
        message: 'Trending posts retrieved successfully'
    };
    res.status(200).json(response);
});
PostController.searchPosts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {
        category: req.query.category,
        level: req.query.level,
        author: req.query.author
    };
    if (!query) {
        res.status(400).json({
            success: false,
            error: { message: 'Search query is required' }
        });
        return;
    }
    const result = await postService_1.PostService.searchPosts(query, { page, limit }, filters);
    const response = {
        success: true,
        data: result.posts,
        pagination: result.pagination,
        message: 'Search results retrieved successfully'
    };
    res.status(200).json(response);
});
//# sourceMappingURL=postController.js.map
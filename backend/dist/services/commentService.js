"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialInteractionService = exports.CommentService = void 0;
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class CommentService {
    static async getPostComments(postId, userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const post = await connection_1.prisma.post.findUnique({
                where: { id: postId },
                select: { id: true, title: true }
            });
            if (!post) {
                throw new errors_1.NotFoundError('Post not found');
            }
            const [comments, total] = await Promise.all([
                connection_1.prisma.comment.findMany({
                    where: {
                        postId,
                        parentId: null
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        author: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                                profileImage: true
                            }
                        },
                        post: {
                            select: {
                                id: true,
                                title: true
                            }
                        },
                        replies: {
                            include: {
                                author: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        role: true,
                                        profileImage: true
                                    }
                                },
                                parent: {
                                    select: {
                                        id: true,
                                        author: {
                                            select: {
                                                firstName: true,
                                                lastName: true
                                            }
                                        }
                                    }
                                },
                                _count: {
                                    select: {
                                        replies: true
                                    }
                                }
                            },
                            orderBy: { createdAt: 'asc' }
                        },
                        _count: {
                            select: {
                                replies: true
                            }
                        }
                    }
                }),
                connection_1.prisma.comment.count({
                    where: {
                        postId,
                        parentId: null
                    }
                })
            ]);
            let userLikes = [];
            if (userId) {
                const likes = await connection_1.prisma.like.findMany({
                    where: {
                        userId,
                        contentType: 'COMMENT'
                    },
                    select: { contentId: true }
                });
                userLikes = likes.map(like => like.contentId).filter(Boolean);
            }
            const formattedComments = comments.map(comment => ({
                id: comment.id,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                author: comment.author,
                post: comment.post,
                replies: comment.replies.map(reply => ({
                    id: reply.id,
                    content: reply.content,
                    createdAt: reply.createdAt,
                    updatedAt: reply.updatedAt,
                    author: reply.author,
                    post: comment.post,
                    parent: reply.parent,
                    replies: [],
                    _count: reply._count,
                    isLiked: userLikes.includes(reply.id),
                    canEdit: userId === reply.author.id,
                    canDelete: userId === reply.author.id
                })),
                _count: comment._count,
                isLiked: userLikes.includes(comment.id),
                canEdit: userId === comment.author.id,
                canDelete: userId === comment.author.id
            }));
            logger_1.logger.info('Post comments retrieved', {
                postId,
                commentsCount: formattedComments.length,
                userId
            });
            return {
                comments: formattedComments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get post comments', { postId, userId, error });
            throw error;
        }
    }
    static async createComment(data, userId) {
        try {
            if (!data.content || data.content.trim().length === 0) {
                throw new errors_1.ValidationError('Comment content is required');
            }
            if (data.content.length > 2000) {
                throw new errors_1.ValidationError('Comment content must not exceed 2000 characters');
            }
            const post = await connection_1.prisma.post.findUnique({
                where: { id: data.postId },
                select: { id: true, title: true, status: true }
            });
            if (!post) {
                throw new errors_1.NotFoundError('Post not found');
            }
            if (post.status !== 'PUBLISHED') {
                throw new errors_1.ForbiddenError('Cannot comment on unpublished posts');
            }
            if (data.parentId) {
                const parentComment = await connection_1.prisma.comment.findUnique({
                    where: { id: data.parentId },
                    select: { id: true, postId: true }
                });
                if (!parentComment) {
                    throw new errors_1.NotFoundError('Parent comment not found');
                }
                if (parentComment.postId !== data.postId) {
                    throw new errors_1.ValidationError('Parent comment must belong to the same post');
                }
            }
            const comment = await connection_1.prisma.comment.create({
                data: {
                    content: data.content.trim(),
                    postId: data.postId,
                    parentId: data.parentId,
                    authorId: userId
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            profileImage: true
                        }
                    },
                    post: {
                        select: {
                            id: true,
                            title: true
                        }
                    },
                    parent: {
                        select: {
                            id: true,
                            author: {
                                select: {
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            replies: true
                        }
                    }
                }
            });
            logger_1.logger.info('Comment created', {
                commentId: comment.id,
                postId: data.postId,
                userId,
                isReply: !!data.parentId
            });
            return {
                id: comment.id,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                author: comment.author,
                post: comment.post,
                parent: comment.parent,
                replies: [],
                _count: comment._count,
                isLiked: false,
                canEdit: true,
                canDelete: true
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create comment', { data, userId, error });
            throw error;
        }
    }
    static async updateComment(commentId, data, userId) {
        try {
            if (!data.content || data.content.trim().length === 0) {
                throw new errors_1.ValidationError('Comment content is required');
            }
            if (data.content.length > 2000) {
                throw new errors_1.ValidationError('Comment content must not exceed 2000 characters');
            }
            const existingComment = await connection_1.prisma.comment.findUnique({
                where: { id: commentId },
                select: { id: true, authorId: true, createdAt: true }
            });
            if (!existingComment) {
                throw new errors_1.NotFoundError('Comment not found');
            }
            if (existingComment.authorId !== userId) {
                throw new errors_1.ForbiddenError('You can only edit your own comments');
            }
            const hoursSinceCreation = (Date.now() - existingComment.createdAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceCreation > 24) {
                throw new errors_1.ForbiddenError('Comments can only be edited within 24 hours of creation');
            }
            const updatedComment = await connection_1.prisma.comment.update({
                where: { id: commentId },
                data: {
                    content: data.content.trim(),
                    updatedAt: new Date()
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            profileImage: true
                        }
                    },
                    post: {
                        select: {
                            id: true,
                            title: true
                        }
                    },
                    parent: {
                        select: {
                            id: true,
                            author: {
                                select: {
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            replies: true
                        }
                    }
                }
            });
            logger_1.logger.info('Comment updated', { commentId, userId });
            return {
                id: updatedComment.id,
                content: updatedComment.content,
                createdAt: updatedComment.createdAt,
                updatedAt: updatedComment.updatedAt,
                author: updatedComment.author,
                post: updatedComment.post,
                parent: updatedComment.parent,
                replies: [],
                _count: updatedComment._count,
                canEdit: true,
                canDelete: true
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update comment', { commentId, data, userId, error });
            throw error;
        }
    }
    static async deleteComment(commentId, userId) {
        try {
            const comment = await connection_1.prisma.comment.findUnique({
                where: { id: commentId },
                select: {
                    id: true,
                    authorId: true,
                    _count: {
                        select: { replies: true }
                    }
                }
            });
            if (!comment) {
                throw new errors_1.NotFoundError('Comment not found');
            }
            if (comment.authorId !== userId) {
                throw new errors_1.ForbiddenError('You can only delete your own comments');
            }
            if (comment._count.replies > 0) {
                await connection_1.prisma.comment.update({
                    where: { id: commentId },
                    data: {
                        content: '[This comment has been deleted]',
                        updatedAt: new Date()
                    }
                });
                logger_1.logger.info('Comment soft deleted (has replies)', { commentId, userId });
            }
            else {
                await connection_1.prisma.comment.delete({
                    where: { id: commentId }
                });
                logger_1.logger.info('Comment hard deleted', { commentId, userId });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to delete comment', { commentId, userId, error });
            throw error;
        }
    }
    static async toggleCommentLike(commentId, userId) {
        try {
            const comment = await connection_1.prisma.comment.findUnique({
                where: { id: commentId },
                select: { id: true }
            });
            if (!comment) {
                throw new errors_1.NotFoundError('Comment not found');
            }
            const existingLike = await connection_1.prisma.like.findFirst({
                where: {
                    userId,
                    contentId: commentId,
                    contentType: 'COMMENT'
                }
            });
            let isLiked;
            if (existingLike) {
                await connection_1.prisma.like.delete({
                    where: { id: existingLike.id }
                });
                isLiked = false;
                logger_1.logger.info('Comment unliked', { commentId, userId });
            }
            else {
                await connection_1.prisma.like.create({
                    data: {
                        userId,
                        contentId: commentId,
                        contentType: 'COMMENT'
                    }
                });
                isLiked = true;
                logger_1.logger.info('Comment liked', { commentId, userId });
            }
            const likeCount = await connection_1.prisma.like.count({
                where: { contentId: commentId, contentType: 'COMMENT' }
            });
            return { isLiked, likeCount };
        }
        catch (error) {
            logger_1.logger.error('Failed to toggle comment like', { commentId, userId, error });
            throw error;
        }
    }
    static async getCommentById(commentId, userId) {
        try {
            const comment = await connection_1.prisma.comment.findUnique({
                where: { id: commentId },
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            profileImage: true
                        }
                    },
                    post: {
                        select: {
                            id: true,
                            title: true
                        }
                    },
                    parent: {
                        select: {
                            id: true,
                            author: {
                                select: {
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    },
                    replies: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    role: true,
                                    profileImage: true
                                }
                            },
                            _count: {
                                select: {
                                    replies: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    },
                    _count: {
                        select: {
                            replies: true
                        }
                    }
                }
            });
            if (!comment) {
                throw new errors_1.NotFoundError('Comment not found');
            }
            let isLiked = false;
            if (userId) {
                const like = await connection_1.prisma.like.findFirst({
                    where: {
                        userId,
                        contentId: commentId,
                        contentType: 'COMMENT'
                    }
                });
                isLiked = !!like;
            }
            return {
                id: comment.id,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                author: comment.author,
                post: comment.post,
                parent: comment.parent,
                replies: comment.replies.map(reply => ({
                    id: reply.id,
                    content: reply.content,
                    createdAt: reply.createdAt,
                    updatedAt: reply.updatedAt,
                    author: reply.author,
                    post: comment.post,
                    replies: [],
                    _count: reply._count,
                    canEdit: userId === reply.author.id,
                    canDelete: userId === reply.author.id
                })),
                _count: comment._count,
                isLiked,
                canEdit: userId === comment.author.id,
                canDelete: userId === comment.author.id
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get comment by ID', { commentId, userId, error });
            throw error;
        }
    }
}
exports.CommentService = CommentService;
class SocialInteractionService {
    static async togglePostLike(postId, userId) {
        try {
            const post = await connection_1.prisma.post.findUnique({
                where: { id: postId },
                select: { id: true, status: true }
            });
            if (!post) {
                throw new errors_1.NotFoundError('Post not found');
            }
            if (post.status !== 'PUBLISHED') {
                throw new errors_1.ForbiddenError('Cannot like unpublished posts');
            }
            const existingLike = await connection_1.prisma.like.findFirst({
                where: {
                    userId,
                    contentId: postId,
                    contentType: 'POST'
                }
            });
            let isLiked;
            if (existingLike) {
                await connection_1.prisma.like.delete({
                    where: { id: existingLike.id }
                });
                isLiked = false;
                logger_1.logger.info('Post unliked', { postId, userId });
            }
            else {
                await connection_1.prisma.like.create({
                    data: {
                        userId,
                        contentId: postId,
                        contentType: 'POST'
                    }
                });
                isLiked = true;
                logger_1.logger.info('Post liked', { postId, userId });
            }
            const likeCount = await connection_1.prisma.like.count({
                where: { contentId: postId, contentType: 'POST' }
            });
            return { isLiked, likeCount };
        }
        catch (error) {
            logger_1.logger.error('Failed to toggle post like', { postId, userId, error });
            throw error;
        }
    }
    static async sharePost(postId, userId, platform) {
        try {
            const post = await connection_1.prisma.post.findUnique({
                where: { id: postId },
                select: { id: true, status: true }
            });
            if (!post) {
                throw new errors_1.NotFoundError('Post not found');
            }
            if (post.status !== 'PUBLISHED') {
                throw new errors_1.ForbiddenError('Cannot share unpublished posts');
            }
            await connection_1.prisma.share.create({
                data: {
                    userId,
                    postId,
                    platform: platform || 'internal'
                }
            });
            const shareCount = await connection_1.prisma.share.count({
                where: { postId }
            });
            logger_1.logger.info('Post shared', { postId, userId, platform });
            return { shareCount };
        }
        catch (error) {
            logger_1.logger.error('Failed to share post', { postId, userId, platform, error });
            throw error;
        }
    }
    static async getPostEngagement(postId, userId) {
        try {
            const [likeCount, commentCount, shareCount, userLike, userShare] = await Promise.all([
                connection_1.prisma.like.count({ where: { contentId: postId, contentType: 'POST' } }),
                connection_1.prisma.comment.count({ where: { postId } }),
                connection_1.prisma.share.count({ where: { postId } }),
                userId ? connection_1.prisma.like.findFirst({
                    where: { userId, contentId: postId, contentType: 'POST' }
                }) : null,
                userId ? connection_1.prisma.share.findFirst({
                    where: { userId, postId }
                }) : null
            ]);
            return {
                likeCount,
                commentCount,
                shareCount,
                isLiked: !!userLike,
                hasShared: !!userShare
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get post engagement', { postId, userId, error });
            throw error;
        }
    }
}
exports.SocialInteractionService = SocialInteractionService;
//# sourceMappingURL=commentService.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = void 0;
const connection_1 = require("@/database/connection");
const client_1 = require("@prisma/client");
const logger_1 = require("@/utils/logger");
class PostService {
    static async getAllPosts(pagination, filters, sort) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const where = {
            status: client_1.PostStatus.PUBLISHED,
            visibility: client_1.PostVisibility.PUBLIC
        };
        if (filters.category) {
            where.category = filters.category;
        }
        if (filters.level) {
            where.level = filters.level;
        }
        if (filters.authorId) {
            where.authorId = filters.authorId;
        }
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { content: { contains: filters.search, mode: 'insensitive' } },
                { excerpt: { contains: filters.search, mode: 'insensitive' } }
            ];
        }
        const orderBy = {};
        orderBy[sort.sortBy] = sort.sortOrder;
        let posts = [];
        let total = 0;
        try {
            [posts, total] = await Promise.all([
                connection_1.prisma.post.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy,
                    include: {
                        author: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                                profileImage: true,
                                profilePicture: true,
                                email: true
                            }
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: true,
                                shares: true
                            }
                        }
                    }
                }).catch(async (error) => {
                    logger_1.logger.warn('Failed to fetch posts with _count, trying without', { error: error.message });
                    return await connection_1.prisma.post.findMany({
                        where,
                        skip,
                        take: limit,
                        orderBy,
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    role: true,
                                    profileImage: true,
                                    profilePicture: true,
                                    email: true
                                }
                            }
                        }
                    }).then(posts => posts.map(post => ({
                        ...post,
                        _count: {
                            likes: 0,
                            comments: 0,
                            shares: 0
                        }
                    })));
                }),
                connection_1.prisma.post.count({ where }).catch(() => 0)
            ]);
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch posts', { error: error.message });
            posts = [];
            total = 0;
        }
        const formattedPosts = posts.map(post => ({
            ...post,
            likes: post._count?.likes || 0,
            comments: post._count?.comments || 0,
            shares: post._count?.shares || 0,
            views: post.viewCount || 0,
            images: post.media ? [post.media] : []
        }));
        return {
            posts: formattedPosts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    static async getPostById(postId, userId) {
        const post = await connection_1.prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        },
                        _count: {
                            select: {
                                replies: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        shares: true
                    }
                }
            }
        });
        if (!post) {
            throw new Error('Post not found');
        }
        if (post.visibility === client_1.PostVisibility.PRIVATE && post.authorId !== userId) {
            throw new Error('Access denied');
        }
        await connection_1.prisma.post.update({
            where: { id: postId },
            data: { viewCount: { increment: 1 } }
        });
        let userLiked = false;
        if (userId) {
            const like = await connection_1.prisma.like.findFirst({
                where: {
                    userId,
                    postId: postId
                }
            });
            userLiked = !!like;
        }
        return {
            ...post,
            userLiked
        };
    }
    static async createPost(authorId, postData) {
        const post = await connection_1.prisma.post.create({
            data: {
                title: postData.title,
                content: postData.content,
                excerpt: postData.excerpt,
                media: postData.media,
                visibility: postData.visibility || client_1.PostVisibility.PUBLIC,
                status: postData.status || client_1.PostStatus.DRAFT,
                authorId,
                category: postData.category,
                tags: postData.tags || [],
                objectives: postData.objectives || [],
                keyPoints: postData.keyPoints || [],
                level: postData.level,
                targetTier: postData.targetTier || 'FREE',
                scheduledAt: postData.scheduledAt ? new Date(postData.scheduledAt) : null
            },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                }
            }
        });
        if (post.status === client_1.PostStatus.PUBLISHED) {
            await connection_1.prisma.post.update({
                where: { id: post.id },
                data: { publishedAt: new Date() }
            });
        }
        return post;
    }
    static async updatePost(postId, userId, updateData) {
        const existingPost = await connection_1.prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: true
            }
        });
        if (!existingPost) {
            throw new Error('Post not found');
        }
        const user = await connection_1.prisma.user.findUnique({
            where: { id: userId }
        });
        const canEdit = existingPost.authorId === userId ||
            user?.role === client_1.UserRole.ADMIN ||
            user?.role === client_1.UserRole.SENIOR_MANAGER;
        if (!canEdit) {
            throw new Error('Access denied');
        }
        const post = await connection_1.prisma.post.update({
            where: { id: postId },
            data: {
                ...updateData,
                updatedAt: new Date(),
                ...(updateData.status === client_1.PostStatus.PUBLISHED && !existingPost.publishedAt && {
                    publishedAt: new Date()
                })
            },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                }
            }
        });
        return post;
    }
    static async deletePost(postId, userId) {
        const existingPost = await connection_1.prisma.post.findUnique({
            where: { id: postId }
        });
        if (!existingPost) {
            throw new Error('Post not found');
        }
        const user = await connection_1.prisma.user.findUnique({
            where: { id: userId }
        });
        const canDelete = existingPost.authorId === userId ||
            user?.role === client_1.UserRole.ADMIN ||
            user?.role === client_1.UserRole.SENIOR_MANAGER;
        if (!canDelete) {
            throw new Error('Access denied');
        }
        await connection_1.prisma.post.delete({
            where: { id: postId }
        });
    }
    static async toggleLike(postId, userId) {
        try {
            const existingLike = await connection_1.prisma.like.findFirst({
                where: {
                    userId,
                    postId: postId
                }
            });
            let liked = false;
            if (existingLike) {
                await connection_1.prisma.like.delete({
                    where: { id: existingLike.id }
                });
                liked = false;
                logger_1.logger.info('Post unliked', { postId, userId });
            }
            else {
                await connection_1.prisma.like.create({
                    data: {
                        userId,
                        postId: postId
                    }
                });
                liked = true;
                logger_1.logger.info('Post liked', { postId, userId });
            }
            const likeCount = await connection_1.prisma.like.count({
                where: { postId: postId }
            });
            return { liked, likeCount };
        }
        catch (error) {
            logger_1.logger.error('Failed to toggle post like', { postId, userId, error: error.message });
            throw error;
        }
    }
    static async addComment(postId, userId, content, parentId) {
        const post = await connection_1.prisma.post.findUnique({
            where: { id: postId }
        });
        if (!post) {
            throw new Error('Post not found');
        }
        if (parentId) {
            const parentComment = await connection_1.prisma.comment.findUnique({
                where: { id: parentId }
            });
            if (!parentComment || parentComment.postId !== postId) {
                throw new Error('Parent comment not found');
            }
        }
        const comment = await connection_1.prisma.comment.create({
            data: {
                content,
                postId,
                authorId: userId,
                parentId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        profileImage: true,
                        profilePicture: true,
                        role: true
                    }
                },
                _count: {
                    select: {
                        replies: true
                    }
                }
            }
        });
        return comment;
    }
    static async getComments(postId, pagination) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
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
                            email: true,
                            profileImage: true,
                            profilePicture: true,
                            role: true
                        }
                    },
                    replies: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    profileImage: true,
                                    profilePicture: true,
                                    role: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'asc' },
                        take: 5
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
        return {
            comments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    static async sharePost(postId, userId, platform) {
        const post = await connection_1.prisma.post.findUnique({
            where: { id: postId }
        });
        if (!post) {
            throw new Error('Post not found');
        }
        const share = await connection_1.prisma.share.create({
            data: {
                userId,
                postId,
                platform
            }
        });
        return share;
    }
    static async getPostAnalytics(postId, userId) {
        const post = await connection_1.prisma.post.findUnique({
            where: { id: postId }
        });
        if (!post) {
            throw new Error('Post not found');
        }
        const user = await connection_1.prisma.user.findUnique({
            where: { id: userId }
        });
        const canViewAnalytics = post.authorId === userId ||
            user?.role === client_1.UserRole.ADMIN ||
            user?.role === client_1.UserRole.SENIOR_MANAGER;
        if (!canViewAnalytics) {
            throw new Error('Access denied');
        }
        const [likes, comments, shares, views] = await Promise.all([
            connection_1.prisma.like.count({ where: { postId: postId } }),
            connection_1.prisma.comment.count({ where: { postId } }),
            connection_1.prisma.share.count({ where: { postId } }),
            post.viewCount
        ]);
        return {
            postId,
            views,
            likes,
            comments,
            shares,
            engagement: likes + comments + shares,
            engagementRate: views > 0 ? ((likes + comments + shares) / views) * 100 : 0
        };
    }
    static async getUserPosts(userId, pagination, filters) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const where = { authorId: userId };
        if (filters.status) {
            where.status = filters.status;
        }
        const [posts, total] = await Promise.all([
            connection_1.prisma.post.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                            shares: true
                        }
                    }
                }
            }),
            connection_1.prisma.post.count({ where })
        ]);
        return {
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    static async getTrendingPosts(limit, timeframe) {
        const startDate = this.getStartDate(timeframe);
        const posts = await connection_1.prisma.post.findMany({
            where: {
                status: client_1.PostStatus.PUBLISHED,
                visibility: client_1.PostVisibility.PUBLIC,
                publishedAt: {
                    gte: startDate
                }
            },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        shares: true
                    }
                }
            },
            take: limit * 2
        });
        const postsWithScore = posts.map(post => ({
            ...post,
            engagementScore: (post._count.likes * 1) + (post._count.comments * 2) + (post._count.shares * 3) + (post.viewCount * 0.1)
        }));
        return postsWithScore
            .sort((a, b) => b.engagementScore - a.engagementScore)
            .slice(0, limit);
    }
    static async searchPosts(query, pagination, filters) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const where = {
            status: client_1.PostStatus.PUBLISHED,
            visibility: client_1.PostVisibility.PUBLIC,
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
                { excerpt: { contains: query, mode: 'insensitive' } },
                { tags: { has: query } }
            ]
        };
        if (filters.category) {
            where.category = filters.category;
        }
        if (filters.level) {
            where.level = filters.level;
        }
        if (filters.author) {
            where.author = {
                OR: [
                    { firstName: { contains: filters.author, mode: 'insensitive' } },
                    { lastName: { contains: filters.author, mode: 'insensitive' } }
                ]
            };
        }
        const [posts, total] = await Promise.all([
            connection_1.prisma.post.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                            shares: true
                        }
                    }
                }
            }),
            connection_1.prisma.post.count({ where })
        ]);
        return {
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    static getStartDate(timeframe) {
        const now = new Date();
        switch (timeframe) {
            case '1d':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case '7d':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case '30d':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
    }
}
exports.PostService = PostService;
//# sourceMappingURL=postService.js.map
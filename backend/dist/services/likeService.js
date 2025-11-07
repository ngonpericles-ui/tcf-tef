"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeService = exports.LikeType = void 0;
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
var LikeType;
(function (LikeType) {
    LikeType["POST"] = "POST";
    LikeType["COMMENT"] = "COMMENT";
})(LikeType || (exports.LikeType = LikeType = {}));
class LikeService {
    async likeContent(userId, contentId, contentType) {
        try {
            const whereCondition = { userId };
            if (contentType === LikeType.POST) {
                whereCondition.postId = contentId;
            }
            else if (contentType === LikeType.COMMENT) {
                whereCondition.commentId = contentId;
            }
            else {
                throw new Error(`Invalid contentType: ${contentType}`);
            }
            const existingLike = await connection_1.prisma.like.findFirst({
                where: whereCondition
            });
            if (existingLike) {
                await connection_1.prisma.like.delete({
                    where: {
                        id: existingLike.id
                    }
                });
                const countWhere = {};
                if (contentType === LikeType.POST) {
                    countWhere.postId = contentId;
                }
                else {
                    countWhere.commentId = contentId;
                }
                const likeCount = await connection_1.prisma.like.count({
                    where: countWhere
                });
                logger_1.logger.info('Content unliked', { userId, contentId, contentType, likeCount });
                return { success: true, liked: false, likeCount };
            }
            else {
                const createData = {
                    userId
                };
                if (contentType === LikeType.POST) {
                    createData.postId = contentId;
                }
                else {
                    createData.commentId = contentId;
                }
                await connection_1.prisma.like.create({
                    data: createData
                });
                const countWhere = {};
                if (contentType === LikeType.POST) {
                    countWhere.postId = contentId;
                }
                else {
                    countWhere.commentId = contentId;
                }
                const likeCount = await connection_1.prisma.like.count({
                    where: countWhere
                });
                logger_1.logger.info('Content liked', { userId, contentId, contentType, likeCount });
                return { success: true, liked: true, likeCount };
            }
        }
        catch (error) {
            logger_1.logger.error('Error liking content:', error);
            throw error;
        }
    }
    async getLikeStatus(userId, contentId, contentType) {
        try {
            const whereCondition = { userId };
            if (contentType === LikeType.POST) {
                whereCondition.postId = contentId;
            }
            else {
                whereCondition.commentId = contentId;
            }
            const countWhere = {};
            if (contentType === LikeType.POST) {
                countWhere.postId = contentId;
            }
            else {
                countWhere.commentId = contentId;
            }
            const [liked, likeCount] = await Promise.all([
                connection_1.prisma.like.findFirst({
                    where: whereCondition
                }),
                connection_1.prisma.like.count({
                    where: countWhere
                })
            ]);
            return {
                liked: !!liked,
                likeCount
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting like status:', error);
            throw error;
        }
    }
    async getContentLikes(contentId, contentType, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const whereCondition = {};
        if (contentType === LikeType.POST) {
            whereCondition.postId = contentId;
        }
        else {
            whereCondition.commentId = contentId;
        }
        const [likes, total] = await Promise.all([
            connection_1.prisma.like.findMany({
                where: whereCondition,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profileImage: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            connection_1.prisma.like.count({
                where: whereCondition
            })
        ]);
        return {
            likes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async getUserLikes(userId, contentType, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = { userId };
        if (contentType === LikeType.POST) {
            where.postId = { not: null };
        }
        else if (contentType === LikeType.COMMENT) {
            where.commentId = { not: null };
        }
        const [likes, total] = await Promise.all([
            connection_1.prisma.like.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profileImage: true
                        }
                    },
                    post: contentType === LikeType.POST ? {
                        select: {
                            id: true,
                            title: true,
                            excerpt: true
                        }
                    } : undefined
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            connection_1.prisma.like.count({ where })
        ]);
        return {
            likes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async getLikeStats(contentId, contentType) {
        const countWhere = {};
        if (contentType === LikeType.POST) {
            countWhere.postId = contentId;
        }
        else {
            countWhere.commentId = contentId;
        }
        const [totalLikes, recentLikes] = await Promise.all([
            connection_1.prisma.like.count({
                where: countWhere
            }),
            connection_1.prisma.like.count({
                where: {
                    ...countWhere,
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            })
        ]);
        return {
            totalLikes,
            recentLikes,
            engagement: recentLikes > 0 ? 'high' : totalLikes > 10 ? 'medium' : 'low'
        };
    }
}
exports.LikeService = LikeService;
exports.default = new LikeService();
//# sourceMappingURL=likeService.js.map
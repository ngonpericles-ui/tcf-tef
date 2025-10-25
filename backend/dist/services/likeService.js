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
            const existingLike = await connection_1.prisma.like.findUnique({
                where: {
                    userId_contentId_contentType: {
                        userId,
                        contentId,
                        contentType
                    }
                }
            });
            if (existingLike) {
                await connection_1.prisma.like.delete({
                    where: {
                        userId_contentId_contentType: {
                            userId,
                            contentId,
                            contentType
                        }
                    }
                });
                const likeCount = await connection_1.prisma.like.count({
                    where: {
                        contentId,
                        contentType
                    }
                });
                logger_1.logger.info('Content unliked', { userId, contentId, contentType, likeCount });
                return { success: true, liked: false, likeCount };
            }
            else {
                await connection_1.prisma.like.create({
                    data: {
                        userId,
                        contentId,
                        contentType
                    }
                });
                const likeCount = await connection_1.prisma.like.count({
                    where: {
                        contentId,
                        contentType
                    }
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
            const [liked, likeCount] = await Promise.all([
                connection_1.prisma.like.findUnique({
                    where: {
                        userId_contentId_contentType: {
                            userId,
                            contentId,
                            contentType
                        }
                    }
                }),
                connection_1.prisma.like.count({
                    where: {
                        contentId,
                        contentType
                    }
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
        const [likes, total] = await Promise.all([
            connection_1.prisma.like.findMany({
                where: {
                    contentId,
                    contentType
                },
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
                where: {
                    contentId,
                    contentType
                }
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
        if (contentType) {
            where.contentType = contentType;
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
                    }
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
        const [totalLikes, recentLikes] = await Promise.all([
            connection_1.prisma.like.count({
                where: {
                    contentId,
                    contentType
                }
            }),
            connection_1.prisma.like.count({
                where: {
                    contentId,
                    contentType,
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
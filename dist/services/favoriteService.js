"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoriteService = void 0;
const connection_1 = require("../database/connection");
const client_1 = require("@prisma/client");
class FavoriteService {
    static async getFavorites(userId, pagination, filters) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (filters.contentType) {
            where.contentType = filters.contentType;
        }
        if (filters.folder) {
            where.folder = filters.folder;
        }
        if (filters.search) {
            where.OR = [
                { notes: { contains: filters.search, mode: 'insensitive' } },
                { tags: { has: filters.search } }
            ];
        }
        const [favorites, total] = await Promise.all([
            connection_1.prisma.favorite.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            connection_1.prisma.favorite.count({ where })
        ]);
        return {
            favorites,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    static async addToFavorites(userId, data) {
        const existing = await connection_1.prisma.favorite.findFirst({
            where: {
                userId,
                contentId: data.contentId,
                contentType: data.contentType
            }
        });
        if (existing) {
            throw new Error('Item is already in favorites');
        }
        await this.verifyContentExists(data.contentId, data.contentType);
        const favorite = await connection_1.prisma.favorite.create({
            data: {
                userId,
                contentId: data.contentId,
                contentType: data.contentType,
                folder: data.folder,
                tags: data.tags || []
            },
        });
        return favorite;
    }
    static async removeFromFavorites(favoriteId, userId) {
        const favorite = await connection_1.prisma.favorite.findFirst({
            where: {
                id: favoriteId,
                userId
            }
        });
        if (!favorite) {
            throw new Error('Favorite not found');
        }
        await connection_1.prisma.favorite.delete({
            where: { id: favoriteId }
        });
    }
    static async updateFavorite(favoriteId, userId, updateData) {
        const favorite = await connection_1.prisma.favorite.findFirst({
            where: {
                id: favoriteId,
                userId
            }
        });
        if (!favorite) {
            throw new Error('Favorite not found');
        }
        const updatedFavorite = await connection_1.prisma.favorite.update({
            where: { id: favoriteId },
            data: {
                folder: updateData.folder,
                tags: updateData.tags
            }
        });
        return updatedFavorite;
    }
    static async getFolders(userId) {
        const folders = await connection_1.prisma.favorite.groupBy({
            by: ['folder'],
            where: {
                userId,
                folder: { not: null }
            },
            _count: {
                folder: true
            }
        });
        return folders.map(folder => ({
            name: folder.folder,
            count: folder._count.folder
        }));
    }
    static async createFolder(userId, data) {
        return {
            id: `folder_${Date.now()}`,
            name: data.name,
            description: data.description,
            color: data.color,
            userId,
            createdAt: new Date()
        };
    }
    static async updateFolder(folderId, userId, updateData) {
        return {
            id: folderId,
            ...updateData,
            userId,
            updatedAt: new Date()
        };
    }
    static async deleteFolder(folderId, userId) {
        await connection_1.prisma.favorite.updateMany({
            where: {
                userId,
                folder: folderId
            },
            data: {
                folder: null
            }
        });
    }
    static async checkFavorite(userId, contentId, contentType) {
        const favorite = await connection_1.prisma.favorite.findFirst({
            where: {
                userId,
                contentId,
                contentType: contentType
            }
        });
        return !!favorite;
    }
    static async getFavoriteStats(userId) {
        const [totalFavorites, favoritesByType, favoritesByFolder, recentFavorites] = await Promise.all([
            connection_1.prisma.favorite.count({ where: { userId } }),
            connection_1.prisma.favorite.groupBy({
                by: ['contentType'],
                where: { userId },
                _count: { contentType: true }
            }),
            connection_1.prisma.favorite.groupBy({
                by: ['folder'],
                where: { userId, folder: { not: null } },
                _count: { folder: true }
            }),
            connection_1.prisma.favorite.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    contentType: true,
                    createdAt: true
                }
            })
        ]);
        return {
            totalFavorites,
            favoritesByType: favoritesByType.map(item => ({
                type: item.contentType,
                count: item._count.contentType
            })),
            favoritesByFolder: favoritesByFolder.map(item => ({
                folder: item.folder,
                count: item._count.folder
            })),
            recentFavorites
        };
    }
    static async bulkOperation(userId, operation, favoriteIds, targetFolder) {
        switch (operation) {
            case 'move':
                if (!targetFolder) {
                    throw new Error('Target folder is required for move operation');
                }
                await connection_1.prisma.favorite.updateMany({
                    where: {
                        id: { in: favoriteIds },
                        userId
                    },
                    data: { folder: targetFolder }
                });
                return { moved: favoriteIds.length };
            case 'delete':
                const deleteResult = await connection_1.prisma.favorite.deleteMany({
                    where: {
                        id: { in: favoriteIds },
                        userId
                    }
                });
                return { deleted: deleteResult.count };
            case 'removeFolder':
                await connection_1.prisma.favorite.updateMany({
                    where: {
                        id: { in: favoriteIds },
                        userId
                    },
                    data: { folder: null }
                });
                return { updated: favoriteIds.length };
            default:
                throw new Error('Invalid bulk operation');
        }
    }
    static async verifyContentExists(contentId, contentType) {
        switch (contentType) {
            case client_1.ContentType.COURSE:
                const course = await connection_1.prisma.course.findUnique({ where: { id: contentId } });
                if (!course)
                    throw new Error('Course not found');
                break;
            case client_1.ContentType.TEST:
                const test = await connection_1.prisma.test.findUnique({ where: { id: contentId } });
                if (!test)
                    throw new Error('Test not found');
                break;
            case client_1.ContentType.LIVE_SESSION:
                const liveSession = await connection_1.prisma.liveSession.findUnique({ where: { id: contentId } });
                if (!liveSession)
                    throw new Error('Live session not found');
                break;
            case client_1.ContentType.POST:
                const post = await connection_1.prisma.post.findUnique({ where: { id: contentId } });
                if (!post)
                    throw new Error('Post not found');
                break;
            default:
                throw new Error('Invalid content type');
        }
    }
}
exports.FavoriteService = FavoriteService;
//# sourceMappingURL=favoriteService.js.map
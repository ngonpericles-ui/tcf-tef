"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoriteController = void 0;
const favoriteService_1 = require("@/services/favoriteService");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = require("@/utils/logger");
class FavoriteController {
}
exports.FavoriteController = FavoriteController;
_a = FavoriteController;
FavoriteController.getFavorites = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const contentType = req.query.contentType;
    const folder = req.query.folder;
    const search = req.query.search;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const filters = {
        contentType,
        folder,
        search
    };
    const result = await favoriteService_1.FavoriteService.getFavorites(userId, { page, limit }, filters);
    const response = {
        success: true,
        data: {
            favorites: result.favorites,
            pagination: result.pagination
        },
        message: 'Favorites retrieved successfully'
    };
    res.status(200).json(response);
});
FavoriteController.addToFavorites = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { contentId, contentType, folder, tags, notes } = req.body;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const favorite = await favoriteService_1.FavoriteService.addToFavorites(userId, {
        contentId,
        contentType,
        folder,
        tags,
        notes
    });
    const response = {
        success: true,
        data: { favorite },
        message: 'Item added to favorites successfully'
    };
    logger_1.logger.info('Item added to favorites', { userId, contentId, contentType });
    res.status(201).json(response);
});
FavoriteController.removeFromFavorites = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { favoriteId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await favoriteService_1.FavoriteService.removeFromFavorites(favoriteId, userId);
    const response = {
        success: true,
        message: 'Item removed from favorites successfully'
    };
    logger_1.logger.info('Item removed from favorites', { favoriteId, userId });
    res.status(200).json(response);
});
FavoriteController.updateFavorite = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { favoriteId } = req.params;
    const userId = req.user?.userId;
    const updateData = req.body;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const favorite = await favoriteService_1.FavoriteService.updateFavorite(favoriteId, userId, updateData);
    const response = {
        success: true,
        data: { favorite },
        message: 'Favorite updated successfully'
    };
    logger_1.logger.info('Favorite updated', { favoriteId, userId });
    res.status(200).json(response);
});
FavoriteController.getFolders = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const folders = await favoriteService_1.FavoriteService.getFolders(userId);
    const response = {
        success: true,
        data: { folders },
        message: 'Favorite folders retrieved successfully'
    };
    res.status(200).json(response);
});
FavoriteController.createFolder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { name, description, color } = req.body;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const folder = await favoriteService_1.FavoriteService.createFolder(userId, { name, description, color });
    const response = {
        success: true,
        data: { folder },
        message: 'Favorite folder created successfully'
    };
    logger_1.logger.info('Favorite folder created', { userId, folderName: name });
    res.status(201).json(response);
});
FavoriteController.updateFolder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { folderId } = req.params;
    const userId = req.user?.userId;
    const updateData = req.body;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const folder = await favoriteService_1.FavoriteService.updateFolder(folderId, userId, updateData);
    const response = {
        success: true,
        data: { folder },
        message: 'Favorite folder updated successfully'
    };
    logger_1.logger.info('Favorite folder updated', { folderId, userId });
    res.status(200).json(response);
});
FavoriteController.deleteFolder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { folderId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    await favoriteService_1.FavoriteService.deleteFolder(folderId, userId);
    const response = {
        success: true,
        message: 'Favorite folder deleted successfully'
    };
    logger_1.logger.info('Favorite folder deleted', { folderId, userId });
    res.status(200).json(response);
});
FavoriteController.checkFavorite = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { contentId, contentType } = req.query;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    if (!contentId || !contentType) {
        res.status(400).json({
            success: false,
            error: { message: 'contentId and contentType are required' }
        });
        return;
    }
    const isFavorited = await favoriteService_1.FavoriteService.checkFavorite(userId, contentId, contentType);
    const response = {
        success: true,
        data: { isFavorited },
        message: 'Favorite status checked successfully'
    };
    res.status(200).json(response);
});
FavoriteController.getFavoriteStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const stats = await favoriteService_1.FavoriteService.getFavoriteStats(userId);
    const response = {
        success: true,
        data: stats,
        message: 'Favorite statistics retrieved successfully'
    };
    res.status(200).json(response);
});
FavoriteController.bulkOperation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { operation, favoriteIds, targetFolder } = req.body;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
        return;
    }
    const result = await favoriteService_1.FavoriteService.bulkOperation(userId, operation, favoriteIds, targetFolder);
    const response = {
        success: true,
        data: result,
        message: `Bulk ${operation} completed successfully`
    };
    logger_1.logger.info('Bulk favorite operation', { userId, operation, count: favoriteIds.length });
    res.status(200).json(response);
});
//# sourceMappingURL=favoriteController.js.map
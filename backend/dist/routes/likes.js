"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const likeService_1 = __importStar(require("../services/likeService"));
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.post('/like', auth_1.authenticate, async (req, res) => {
    try {
        const { contentId, contentType } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        if (!contentId || !contentType) {
            return res.status(400).json({
                success: false,
                message: 'contentId and contentType are required'
            });
        }
        if (!Object.values(likeService_1.LikeType).includes(contentType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid contentType. Must be POST or COMMENT'
            });
        }
        const result = await likeService_1.default.likeContent(userId, contentId, contentType);
        res.json({
            success: true,
            liked: result.liked,
            likeCount: result.likeCount,
            message: result.liked ? 'Content liked successfully' : 'Content unliked successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error in like endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/status/:contentId/:contentType', auth_1.authenticate, async (req, res) => {
    try {
        const { contentId, contentType } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        if (!Object.values(likeService_1.LikeType).includes(contentType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid contentType. Must be POST or COMMENT'
            });
        }
        const result = await likeService_1.default.getLikeStatus(userId, contentId, contentType);
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        logger_1.logger.error('Error in like status endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/content/:contentId/:contentType', async (req, res) => {
    try {
        const { contentId, contentType } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        if (!Object.values(likeService_1.LikeType).includes(contentType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid contentType. Must be POST or COMMENT'
            });
        }
        const result = await likeService_1.default.getContentLikes(contentId, contentType, page, limit);
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        logger_1.logger.error('Error in content likes endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/user', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        const contentType = req.query.contentType;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        if (contentType && !Object.values(likeService_1.LikeType).includes(contentType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid contentType. Must be POST or COMMENT'
            });
        }
        const result = await likeService_1.default.getUserLikes(userId, contentType, page, limit);
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        logger_1.logger.error('Error in user likes endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/stats/:contentId/:contentType', async (req, res) => {
    try {
        const { contentId, contentType } = req.params;
        if (!Object.values(likeService_1.LikeType).includes(contentType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid contentType. Must be POST or COMMENT'
            });
        }
        const stats = await likeService_1.default.getLikeStats(contentId, contentType);
        res.json({
            success: true,
            ...stats
        });
    }
    catch (error) {
        logger_1.logger.error('Error in like stats endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=likes.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const moderationService_1 = require("../services/moderationService");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/admin/reports', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const result = await moderationService_1.ModerationService.getUserReports();
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error in get reports route:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', statusCode: 500 }
        });
    }
});
router.get('/admin/content/reports', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const result = await moderationService_1.ModerationService.getContentReports();
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error in get content reports route:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', statusCode: 500 }
        });
    }
});
router.get('/admin/moderation/actions', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const result = await moderationService_1.ModerationService.getModerationActions();
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error in get moderation actions route:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', statusCode: 500 }
        });
    }
});
router.post('/live-sessions/:id/moderate', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.id;
        const sessionId = req.params.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { participantId, action, reason, moderatorId } = req.body;
        const result = await moderationService_1.ModerationService.moderateLiveSession(sessionId, participantId, action, reason, moderatorId || userId);
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error in live session moderation route:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', statusCode: 500 }
        });
    }
});
router.post('/admin/content/posts/:id/moderate', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.id;
        const postId = req.params.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { action, reason, moderatorId } = req.body;
        const result = await moderationService_1.ModerationService.moderatePost(postId, action, reason, moderatorId || userId);
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error in post moderation route:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', statusCode: 500 }
        });
    }
});
router.post('/admin/content/comments/:id/moderate', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.id;
        const commentId = req.params.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { action, reason, moderatorId } = req.body;
        const result = await moderationService_1.ModerationService.moderateComment(commentId, action, reason, moderatorId || userId);
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error in comment moderation route:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', statusCode: 500 }
        });
    }
});
router.post('/admin/reports/:id/action', auth_1.authenticate, auth_1.requireManager, async (req, res) => {
    try {
        const userId = req.user?.id;
        const reportId = req.params.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 }
            });
        }
        const { action, notes, moderatorId } = req.body;
        const result = await moderationService_1.ModerationService.handleReport(reportId, action, notes, moderatorId || userId);
        if (!result.success) {
            return res.status(result.error?.statusCode || 500).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error in report action route:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error', statusCode: 500 }
        });
    }
});
exports.default = router;
//# sourceMappingURL=moderation.js.map
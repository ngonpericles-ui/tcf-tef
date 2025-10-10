import { Router } from 'express';
import { ModerationService } from '../services/moderationService';
import { authenticate, requireManager } from '../middleware/auth';

const router = Router();

// Get user reports
router.get('/admin/reports',
  authenticate,
  requireManager,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'User not authenticated', statusCode: 401 }
        });
      }

      const result = await ModerationService.getUserReports();
      
      if (!result.success) {
        return res.status(result.error?.statusCode || 500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in get reports route:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error', statusCode: 500 }
      });
    }
  }
);

// Get content reports
router.get('/admin/content/reports',
  authenticate,
  requireManager,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'User not authenticated', statusCode: 401 }
        });
      }

      const result = await ModerationService.getContentReports();
      
      if (!result.success) {
        return res.status(result.error?.statusCode || 500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in get content reports route:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error', statusCode: 500 }
      });
    }
  }
);

// Get moderation actions history
router.get('/admin/moderation/actions',
  authenticate,
  requireManager,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'User not authenticated', statusCode: 401 }
        });
      }

      const result = await ModerationService.getModerationActions();
      
      if (!result.success) {
        return res.status(result.error?.statusCode || 500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in get moderation actions route:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error', statusCode: 500 }
      });
    }
  }
);

// Apply moderation action to live session participant
router.post('/live-sessions/:id/moderate',
  authenticate,
  requireManager,
  async (req, res) => {
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
      const result = await ModerationService.moderateLiveSession(
        sessionId, 
        participantId, 
        action, 
        reason, 
        moderatorId || userId
      );
      
      if (!result.success) {
        return res.status(result.error?.statusCode || 500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in live session moderation route:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error', statusCode: 500 }
      });
    }
  }
);

// Moderate post
router.post('/admin/content/posts/:id/moderate',
  authenticate,
  requireManager,
  async (req, res) => {
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
      const result = await ModerationService.moderatePost(
        postId, 
        action, 
        reason, 
        moderatorId || userId
      );
      
      if (!result.success) {
        return res.status(result.error?.statusCode || 500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in post moderation route:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error', statusCode: 500 }
      });
    }
  }
);

// Moderate comment
router.post('/admin/content/comments/:id/moderate',
  authenticate,
  requireManager,
  async (req, res) => {
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
      const result = await ModerationService.moderateComment(
        commentId, 
        action, 
        reason, 
        moderatorId || userId
      );
      
      if (!result.success) {
        return res.status(result.error?.statusCode || 500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in comment moderation route:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error', statusCode: 500 }
      });
    }
  }
);

// Handle report action
router.post('/admin/reports/:id/action',
  authenticate,
  requireManager,
  async (req, res) => {
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
      const result = await ModerationService.handleReport(
        reportId, 
        action, 
        notes, 
        moderatorId || userId
      );
      
      if (!result.success) {
        return res.status(result.error?.statusCode || 500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in report action route:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error', statusCode: 500 }
      });
    }
  }
);

export default router;

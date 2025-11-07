import { Router } from 'express';
import { MarketplaceService } from '../services/marketplaceService';
import { authenticate, requireManager } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Manager/Admin marketplace routes
router.get('/manager/marketplace/profile',
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

      const result = await MarketplaceService.getTutorProfile(userId);
      
      if (!result.success) {
        return res.status(result.error?.statusCode || 500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in marketplace profile route:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error', statusCode: 500 }
      });
    }
  }
);

router.get('/manager/marketplace/requests',
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

      const result = await MarketplaceService.getStudentRequests(userId);
      
      if (!result.success) {
        return res.status(result.error?.statusCode || 500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in marketplace requests route:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error', statusCode: 500 }
      });
    }
  }
);

router.put('/manager/marketplace/profile',
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

      const result = await MarketplaceService.updateTutorProfile(userId, req.body);
      
      if (!result.success) {
        return res.status(result.error?.statusCode || 500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in marketplace profile update route:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error', statusCode: 500 }
      });
    }
  }
);

// Missing marketplace endpoints
router.post('/manager/marketplace/activate',
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

      const { isActive } = req.body;
      const result = await MarketplaceService.activateTutorProfile(userId, isActive);

      if (!result.success) {
        return res.status(result.error?.statusCode || 500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in marketplace activation route:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error', statusCode: 500 }
      });
    }
  }
);

router.post('/manager/marketplace/requests/:id/action',
  authenticate,
  requireManager,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const requestId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'User not authenticated', statusCode: 401 }
        });
      }

      const { action, managerId } = req.body;
      const result = await MarketplaceService.handleStudentRequest(requestId, action, managerId || userId);

      if (!result.success) {
        return res.status(result.error?.statusCode || 500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in marketplace request action route:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error', statusCode: 500 }
      });
    }
  }
);

// Student marketplace routes
router.get('/marketplace/tutors',
  authenticate,
  async (req, res) => {
    try {
      const result = await MarketplaceService.getAllTutors();
      
      if (!result.success) {
        return res.status(result.error?.statusCode || 500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in marketplace tutors route:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error', statusCode: 500 }
      });
    }
  }
);

export default router;

import { Request, Response } from 'express';
import { LiveSessionService } from '@/services/liveSessionService';
import { asyncHandler } from '@/middleware/errorHandler';
import { ApiResponse, CreateLiveSessionRequest, PaginationParams, FilterParams } from '@/types';
import { UserRole, LiveSessionStatus } from '@prisma/client';
import { logger } from '@/utils/logger';
import { EmailService } from '@/services/emailService';
import { prisma } from '@/config/database';

export class LiveSessionController {
  /**
   * Create a new live session (Manager/Admin only)
   */
  static createLiveSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const sessionData: CreateLiveSessionRequest = req.body;
    const createdById = req.user?.userId;
    const creatorRole = req.user?.role;

    if (!createdById || !creatorRole) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
      return;
    }

    const session = await LiveSessionService.createLiveSession(sessionData, createdById, creatorRole);

    const response: ApiResponse = {
      success: true,
      data: { session },
      message: 'Live session created successfully'
    };

    logger.info('Live session created', { sessionId: session.id, createdById });

    res.status(201).json(response);
  });

  /**
   * Get live session by ID
   */
  static getLiveSessionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    const userId = req.user?.userId;

    const session = await LiveSessionService.getLiveSessionById(sessionId, userId);

    const response: ApiResponse = {
      success: true,
      data: { session },
      message: 'Live session retrieved successfully'
    };

    res.status(200).json(response);
  });

  /**
   * Get all live sessions with pagination and filtering
   */
  static getAllLiveSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    const pagination: PaginationParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: req.query.sortBy as string || 'date',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc'
    };

    const filters: FilterParams = {
      search: req.query.search as string,
      level: req.query.level as string,
      category: req.query.category as string,
      tier: req.query.tier as string,
      status: req.query.status as string
    };

    const result = await LiveSessionService.getAllLiveSessions(pagination, filters, userId);

    const response: ApiResponse = {
      success: true,
      data: result.sessions,
      pagination: result.pagination,
      message: 'Live sessions retrieved successfully'
    };

    res.status(200).json(response);
  });

  /**
   * Register for live session
   */
  static registerForSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
      return;
    }

    await LiveSessionService.registerForSession(sessionId, userId);

    const response: ApiResponse = {
      success: true,
      message: 'Registered for live session successfully'
    };

    logger.info('User registered for live session', { sessionId, userId });

    res.status(200).json(response);
  });

  /**
   * Unregister from live session
   */
  static unregisterFromSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
      return;
    }

    await LiveSessionService.unregisterFromSession(sessionId, userId);

    const response: ApiResponse = {
      success: true,
      message: 'Unregistered from live session successfully'
    };

    logger.info('User unregistered from live session', { sessionId, userId });

    res.status(200).json(response);
  });

  /**
   * Update session status (Creator/Admin only)
   */
  static updateSessionStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
      return;
    }

    const session = await LiveSessionService.updateSessionStatus(sessionId, status, userId, userRole);

    const response: ApiResponse = {
      success: true,
      data: { session },
      message: 'Session status updated successfully'
    };

    logger.info('Live session status updated', { sessionId, newStatus: status, updatedBy: userId });

    res.status(200).json(response);
  });

  /**
   * Get user's registered sessions
   */
  static getUserRegisteredSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
      return;
    }

    const pagination: PaginationParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: req.query.sortBy as string || 'date',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc'
    };

    const result = await LiveSessionService.getUserRegisteredSessions(userId, pagination);

    const response: ApiResponse = {
      success: true,
      data: result.sessions,
      pagination: result.pagination,
      message: 'Registered sessions retrieved successfully'
    };

    res.status(200).json(response);
  });

  /**
   * Get sessions created by user (Manager/Admin only)
   */
  static getUserCreatedSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
      return;
    }

    if (![UserRole.ADMIN, UserRole.SENIOR_MANAGER, UserRole.JUNIOR_MANAGER].includes(userRole as any)) {
      res.status(403).json({
        success: false,
        error: { message: 'Access denied. Manager role required.' }
      });
      return;
    }

    const pagination: PaginationParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: req.query.sortBy as string || 'date',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc'
    };

    const filters: FilterParams = {
      search: req.query.search as string,
      level: req.query.level as string,
      category: req.query.category as string,
      tier: req.query.tier as string,
      status: req.query.status as string
    };

    // Add creator filter
    const extendedFilters = {
      ...filters,
      createdById: userId
    };

    const result = await LiveSessionService.getAllLiveSessions(pagination, extendedFilters, userId);

    const response: ApiResponse = {
      success: true,
      data: result.sessions,
      pagination: result.pagination,
      message: 'Created sessions retrieved successfully'
    };

    res.status(200).json(response);
  });

  /**
   * Get upcoming sessions
   */
  static getUpcomingSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    const pagination: PaginationParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: 'date',
      sortOrder: 'asc'
    };

    const filters: FilterParams = {
      status: LiveSessionStatus.SCHEDULED
    };

    // Add date filter for upcoming sessions
    const extendedFilters = {
      ...filters,
      dateFrom: new Date().toISOString()
    };

    const result = await LiveSessionService.getAllLiveSessions(pagination, extendedFilters, userId);

    const response: ApiResponse = {
      success: true,
      data: result.sessions,
      pagination: result.pagination,
      message: 'Upcoming sessions retrieved successfully'
    };

    res.status(200).json(response);
  });

  /**
   * Set reminder for live session
   */
  static setReminder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId, reminderTime } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
      return;
    }

    try {
      // Get session details
      const session = await LiveSessionService.getLiveSessionById(sessionId, userId);

      // Get user details for email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
        return;
      }

      // Calculate reminder time
      const sessionDate = new Date(session.date);
      const reminderMinutes = reminderTime === '5min' ? 5 : 10;
      const reminderDate = new Date(sessionDate.getTime() - (reminderMinutes * 60 * 1000));

      // Store reminder in database
      await prisma.sessionReminder.create({
        data: {
          userId,
          sessionId,
          reminderTime: reminderMinutes,
          reminderDate,
          emailSent: false
        }
      });

      // Schedule email reminder (in a real implementation, you'd use a job queue)
      // For now, we'll send a confirmation email
      const emailData = {
        firstName: user.firstName,
        email: user.email,
        sessionTitle: session.title,
        sessionDate: sessionDate.toLocaleDateString('fr-FR'),
        sessionTime: sessionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        joinUrl: `${process.env.FRONTEND_URL}/live/${sessionId}`,
        duration: session.duration || 60
      };

      // Send confirmation email
      await EmailService.sendLiveSessionReminderEmail(emailData);

      logger.info('Reminder set for live session', {
        sessionId,
        userId,
        reminderTime,
        reminderDate: reminderDate.toISOString(),
        sessionDate: sessionDate.toISOString()
      });

      const response: ApiResponse = {
        success: true,
        data: {
          sessionId,
          reminderTime,
          reminderDate: reminderDate.toISOString(),
          emailSent: true
        },
        message: 'Reminder set successfully and confirmation email sent'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error setting reminder:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to set reminder' }
      });
    }
  });

  /**
   * Update live session (Creator/Admin only)
   */
  static updateLiveSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const updateData = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
      return;
    }

    const session = await LiveSessionService.updateLiveSession(sessionId, userId, userRole, updateData);

    const response: ApiResponse = {
      success: true,
      data: { session },
      message: 'Live session updated successfully'
    };

    logger.info('Live session updated', { sessionId, updatedBy: userId });

    res.status(200).json(response);
  });

  /**
   * Delete live session (Creator/Admin only)
   */
  static deleteLiveSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
      return;
    }

    await LiveSessionService.deleteLiveSession(sessionId, userId, userRole);

    const response: ApiResponse = {
      success: true,
      data: { sessionId },
      message: 'Live session deleted successfully'
    };

    logger.info('Live session deleted', { sessionId, deletedBy: userId });

    res.status(200).json(response);
  });

  /**
   * Health check for live session service
   */
  static healthCheck = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const response: ApiResponse = {
      success: true,
      data: {
        service: 'live-session',
        status: 'healthy',
        timestamp: new Date().toISOString()
      },
      message: 'Live session service is healthy'
    };

    res.status(200).json(response);
  });

  /**
   * Get live session statistics
   */
  static getLiveSessionStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
      return;
    }

    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const [
        scheduledSessions,
        completedSessions,
        totalParticipants,
        totalTimeThisWeek
      ] = await Promise.all([
        // Scheduled sessions count
        prisma.liveSession.count({
          where: {
            createdById: userId,
            status: 'SCHEDULED'
          }
        }),

        // Completed sessions count
        prisma.liveSession.count({
          where: {
            createdById: userId,
            status: 'COMPLETED'
          }
        }),

        // Total participants across all sessions
        prisma.liveSessionParticipant.count({
          where: {
            liveSession: {
              createdById: userId
            }
          }
        }),

        // Total time this week (completed sessions)
        prisma.liveSession.aggregate({
          where: {
            createdById: userId,
            status: 'COMPLETED',
            date: {
              gte: startOfWeek
            }
          },
          _sum: {
            duration: true
          }
        })
      ]);

      const statistics = {
        scheduledSessions,
        completedSessions,
        totalParticipants,
        totalTimeThisWeek: Math.round((totalTimeThisWeek._sum.duration || 0) / 60) // Convert minutes to hours
      };

      const response: ApiResponse = {
        success: true,
        data: statistics,
        message: 'Live session statistics retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to get live session statistics', { userId, error });
      res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve statistics' }
      });
    }
  });
}

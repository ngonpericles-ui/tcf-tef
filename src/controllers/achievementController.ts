import { Request, Response } from 'express'
import { asyncHandler } from '@/middleware/errorHandler'
import { AchievementService } from '../services/achievementService'
import { logger } from '@/utils/logger'

export class AchievementController {
  // Get recent achievements for user
  static getRecentAchievements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId
      const achievements = await AchievementService.getRecentAchievements(userId)
      
      res.status(200).json({
        success: true,
        data: achievements,
        message: 'Recent achievements fetched successfully'
      })
    } catch (error: any) {
      logger.error('Error fetching recent achievements:', error)
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch recent achievements', code: 'INTERNAL_ERROR' }
      })
    }
  })

  // Get all achievements for user
  static getAllAchievements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId
      const achievements = await AchievementService.getAllAchievements(userId)
      
      res.status(200).json({
        success: true,
        data: achievements,
        message: 'All achievements fetched successfully'
      })
    } catch (error: any) {
      logger.error('Error fetching all achievements:', error)
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch achievements', code: 'INTERNAL_ERROR' }
      })
    }
  })

  // Get achievement progress
  static getAchievementProgress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId
      const progress = await AchievementService.getAchievementProgress(userId)
      
      res.status(200).json({
        success: true,
        data: progress,
        message: 'Achievement progress fetched successfully'
      })
    } catch (error: any) {
      logger.error('Error fetching achievement progress:', error)
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch achievement progress', code: 'INTERNAL_ERROR' }
      })
    }
  })
}

import { prisma } from '@/database/connection'
import { logger } from '../utils/logger'
import { AIService } from './aiService'
// Updated for targetTime support

export interface DashboardData {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    subscriptionTier: string
    profileImage?: string
    createdAt: string
  }
  analytics: {
    weeklyProgress: number
    improvementRate: number
    studyStreak: number
    completedTests: number
    averageScore: number
    timeStudied: string
    weakAreas: string[]
    strongAreas: string[]
    nextRecommendations: any[]
  }
  studySession: {
    isActive: boolean
    startTime?: string
    currentDuration: number
    dailyGoal: number
    progress: number
  }
  daysOnPlatform: number
  regionalTime: {
    time: string
    date: string
    timezone: string
  }
}

export interface AIMessages {
  greeting: string
  motivation: string
  weather: string
}

export interface StudySessionData {
  isActive: boolean
  startTime?: string
  currentDuration: number
  dailyGoal: number
  progress: number
  totalTimeToday: number
  targetTime?: number
}

export class HomeService {
  // Get comprehensive dashboard data - OPTIMIZED
  static async getDashboardData(userId: string): Promise<DashboardData> {
    try {
      // Get user data with minimal fields
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          subscriptionTier: true,
          profileImage: true,
          createdAt: true,
          country: true // Include country for timezone
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Get essential data in parallel with minimal queries
      const [analytics, studySession, daysOnPlatform, regionalTime] = await Promise.all([
        this.getAnalyticsDataOptimized(userId),
        this.getStudySessionDataOptimized(userId),
        this.getDaysOnPlatform(userId),
        this.getRegionalTimeDataOptimized(user?.country || 'Canada')
      ])

      return {
        user: {
          ...user,
          createdAt: user.createdAt.toISOString()
        },
        analytics,
        studySession,
        daysOnPlatform,
        regionalTime
      }
    } catch (error) {
      logger.error('Error getting dashboard data:', error)
      throw error
    }
  }

  // Get AI-generated messages
  static async getAIMessages(userId: string): Promise<AIMessages> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, country: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Generate AI messages
      const greeting = await AIService.generateGreeting(user.firstName, user.lastName)
      const motivation = await AIService.generateMotivation(user.firstName)
      const weather = await AIService.generateWeatherMessage(user.country || 'Canada')

      return {
        greeting,
        motivation,
        weather
      }
    } catch (error) {
      logger.error('Error getting AI messages:', error)
      // Return fallback messages if AI service fails
      return {
        greeting: `Bonjour Apprenant!`,
        motivation: 'Chaque mot appris vous rapproche de vos rêves.',
        weather: 'Bonne journée pour apprendre le français!'
      }
    }
  }

  // Get study session data - OPTIMIZED VERSION
  static async getStudySessionDataOptimized(userId: string): Promise<StudySessionData> {
    try {
      // Single query for today's sessions
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const sessions = await prisma.studySession.findMany({
        where: {
          userId,
          startTime: { gte: today }
        },
        select: {
          startTime: true,
          endTime: true,
          targetTime: true
        },
        orderBy: { startTime: 'desc' }
      })

      // Quick calculations
      const totalTimeToday = sessions.reduce((total, session) => {
        if (session.endTime) {
          return total + (session.endTime.getTime() - session.startTime.getTime())
        }
        return total
      }, 0)

      const activeSession = sessions.find(session => !session.endTime)
      const dailyGoal = 15 * 60 * 1000 // 15 minutes

      return {
        isActive: !!activeSession,
        startTime: activeSession?.startTime.toISOString(),
        currentDuration: activeSession ? Date.now() - activeSession.startTime.getTime() : 0,
        dailyGoal,
        progress: Math.min((totalTimeToday / dailyGoal) * 100, 100),
        totalTimeToday,
        targetTime: activeSession?.targetTime || 900
      }
    } catch (error) {
      logger.error('Error getting study session data:', error)
      return {
        isActive: false,
        currentDuration: 0,
        dailyGoal: 15 * 60 * 1000,
        progress: 0,
        totalTimeToday: 0,
        targetTime: 900
      }
    }
  }

  // Get study session data - ORIGINAL
  static async getStudySessionData(userId: string): Promise<StudySessionData> {
    try {
      // Get today's study sessions
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const sessions = await prisma.studySession.findMany({
        where: {
          userId,
          startTime: {
            gte: today
          }
        },
        orderBy: { startTime: 'desc' }
      })

      // Calculate total time today
      const totalTimeToday = sessions.reduce((total, session) => {
        if (session.endTime) {
          return total + (session.endTime.getTime() - session.startTime.getTime())
        }
        return total
      }, 0)

      // Get active session
      const activeSession = sessions.find(session => !session.endTime)
      
      // Get user's daily goal (default 15 minutes)
      const dailyGoal = 15 * 60 * 1000 // 15 minutes in milliseconds

      return {
        isActive: !!activeSession,
        startTime: activeSession?.startTime.toISOString(),
        currentDuration: activeSession ? Date.now() - activeSession.startTime.getTime() : 0,
        dailyGoal,
        progress: Math.min((totalTimeToday / dailyGoal) * 100, 100),
        totalTimeToday,
        targetTime: activeSession?.targetTime || 900 // Default 15 minutes
      }
    } catch (error) {
      logger.error('Error getting study session data:', error)
      throw error
    }
  }

  // Start study session
  static async startStudySession(userId: string, targetTime?: number) {
    try {
      // Check if there's already an active session
      const activeSession = await prisma.studySession.findFirst({
        where: {
          userId,
          endTime: null
        }
      })

      if (activeSession) {
        return {
          isActive: true,
          startTime: activeSession.startTime.toISOString(),
          targetTime: activeSession.targetTime || 900, // Default 15 minutes
          message: 'Study session already active'
        }
      }

      // Create new study session with target time
      const session = await prisma.studySession.create({
        data: {
          userId,
          startTime: new Date(),
          targetTime: targetTime || 900 // Default 15 minutes (900 seconds)
        }
      })

      return {
        isActive: true,
        startTime: session.startTime.toISOString(),
        targetTime: session.targetTime,
        message: 'Study session started successfully'
      }
    } catch (error) {
      logger.error('Error starting study session:', error)
      throw error
    }
  }

  // Stop study session
  static async stopStudySession(userId: string) {
    try {
      const activeSession = await prisma.studySession.findFirst({
        where: {
          userId,
          endTime: null
        }
      })

      if (!activeSession) {
        return {
          isActive: false,
          message: 'No active study session found'
        }
      }

      // Update session with end time
      await prisma.studySession.update({
        where: { id: activeSession.id },
        data: { endTime: new Date() }
      })

      return {
        isActive: false,
        message: 'Study session stopped successfully'
      }
    } catch (error) {
      logger.error('Error stopping study session:', error)
      throw error
    }
  }

  // Reset study session
  static async resetStudySession(userId: string) {
    try {
      // Stop any active session
      await prisma.studySession.updateMany({
        where: {
          userId,
          endTime: null
        },
        data: { endTime: new Date() }
      })

      return {
        isActive: false,
        message: 'Study session reset successfully'
      }
    } catch (error) {
      logger.error('Error resetting study session:', error)
      throw error
    }
  }

  // Get days on platform
  static async getDaysOnPlatform(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true }
      })

      if (!user) {
        return 0
      }

      const now = new Date()
      const diffTime = now.getTime() - user.createdAt.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return Math.max(1, diffDays) // At least 1 day
    } catch (error) {
      logger.error('Error getting days on platform:', error)
      return 1
    }
  }

  // Get regional time - OPTIMIZED VERSION
  static async getRegionalTimeDataOptimized(country: string) {
    try {
      const timezone = this.getTimezoneFromCountry(country)
      const now = new Date()
      
      return {
        time: now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: timezone
        }),
        date: now.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: timezone
        }),
        timezone
      }
    } catch (error) {
      logger.error('Error getting regional time:', error)
      const now = new Date()
      return {
        time: now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        date: now.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        timezone: 'America/Toronto'
      }
    }
  }

  // Get regional time - ORIGINAL
  static async getRegionalTimeData(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { country: true }
      })

      // Default to Canada if no country specified
      const timezone = this.getTimezoneFromCountry(user?.country || 'Canada')
      const now = new Date()
      
      const regionalTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
      
      return {
        time: regionalTime.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        date: regionalTime.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        timezone
      }
    } catch (error) {
      logger.error('Error getting regional time:', error)
      const now = new Date()
      return {
        time: now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        date: now.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        timezone: 'America/Toronto'
      }
    }
  }

  // Get analytics data - OPTIMIZED VERSION
  private static async getAnalyticsDataOptimized(userId: string) {
    try {
      // Single query to get test results and sessions
      const [testResults, weeklySessions] = await Promise.all([
        prisma.testAttempt.findMany({
          where: { 
            userId,
            status: 'COMPLETED'
          },
          orderBy: { completedAt: 'desc' },
          take: 5 // Reduced from 10
        }),
        prisma.studySession.findMany({
          where: {
            userId,
            startTime: { 
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          },
          select: {
            startTime: true,
            endTime: true
          }
        })
      ])

      // Quick calculations
      const completedTests = testResults.length
      const averageScore = testResults.length > 0 
        ? Math.round(testResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / testResults.length)
        : 0

      const totalStudyTime = weeklySessions.reduce((total, session) => {
        if (session.endTime) {
          return total + (session.endTime.getTime() - session.startTime.getTime())
        }
        return total
      }, 0)

      const timeStudied = this.formatDuration(totalStudyTime)
      const weeklyProgress = Math.min(Math.round((totalStudyTime / (7 * 15 * 60 * 1000)) * 100), 100)

      return {
        weeklyProgress,
        improvementRate: 0, // Simplified
        studyStreak: 0, // Simplified - remove complex calculation
        completedTests,
        averageScore,
        timeStudied,
        weakAreas: [], // Simplified
        strongAreas: [], // Simplified
        nextRecommendations: [] // Simplified
      }
    } catch (error) {
      logger.error('Error getting analytics data:', error)
      return {
        weeklyProgress: 0,
        improvementRate: 0,
        studyStreak: 0,
        completedTests: 0,
        averageScore: 0,
        timeStudied: '0h 0m',
        weakAreas: [],
        strongAreas: [],
        nextRecommendations: []
      }
    }
  }

  // Get analytics data - ORIGINAL (kept for reference)
  private static async getAnalyticsData(userId: string) {
    try {
      // Get user's test attempts
      const testResults = await prisma.testAttempt.findMany({
        where: { 
          userId,
          status: 'COMPLETED'
        },
        orderBy: { completedAt: 'desc' },
        take: 10
      })

      // Get study sessions from last 7 days
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const weeklySessions = await prisma.studySession.findMany({
        where: {
          userId,
          startTime: { gte: weekAgo }
        }
      })

      // Calculate analytics
      const completedTests = testResults.length
      const averageScore = testResults.length > 0 
        ? testResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / testResults.length 
        : 0

      const totalStudyTime = weeklySessions.reduce((total, session) => {
        if (session.endTime) {
          return total + (session.endTime.getTime() - session.startTime.getTime())
        }
        return total
      }, 0)

      const timeStudied = this.formatDuration(totalStudyTime)
      
      // Calculate study streak
      const studyStreak = await this.calculateStudyStreak(userId)
      
      // Calculate weekly progress (simplified)
      const weeklyProgress = Math.min((totalStudyTime / (7 * 15 * 60 * 1000)) * 100, 100) // 15 min per day goal
      
      // Calculate improvement rate (simplified)
      const improvementRate = testResults.length > 1 
        ? Math.max(0, (testResults[0]?.percentage || 0) - (testResults[testResults.length - 1]?.percentage || 0))
        : 0

      return {
        weeklyProgress: Math.round(weeklyProgress),
        improvementRate: Math.round(improvementRate),
        studyStreak,
        completedTests,
        averageScore: Math.round(averageScore),
        timeStudied,
        weakAreas: ['Grammaire', 'Vocabulaire'], // Placeholder
        strongAreas: ['Compréhension orale'], // Placeholder
        nextRecommendations: [] // Placeholder
      }
    } catch (error) {
      logger.error('Error getting analytics data:', error)
      return {
        weeklyProgress: 0,
        improvementRate: 0,
        studyStreak: 0,
        completedTests: 0,
        averageScore: 0,
        timeStudied: '0h 0m',
        weakAreas: [],
        strongAreas: [],
        nextRecommendations: []
      }
    }
  }

  // Calculate study streak
  private static async calculateStudyStreak(userId: string): Promise<number> {
    try {
      const sessions = await prisma.studySession.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' }
      })

      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i < 30; i++) { // Check last 30 days
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - i)
        
        const hasSession = sessions.some(session => {
          const sessionDate = new Date(session.startTime)
          sessionDate.setHours(0, 0, 0, 0)
          return sessionDate.getTime() === checkDate.getTime()
        })

        if (hasSession) {
          streak++
        } else if (i > 0) { // Don't break on first day if no session
          break
        }
      }

      return streak
    } catch (error) {
      logger.error('Error calculating study streak:', error)
      return 0
    }
  }

  // Format duration in milliseconds to readable format
  private static formatDuration(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  // Get timezone from country
  private static getTimezoneFromCountry(country: string): string {
    const timezoneMap: { [key: string]: string } = {
      'Canada': 'America/Toronto',
      'France': 'Europe/Paris',
      'Belgium': 'Europe/Brussels',
      'Switzerland': 'Europe/Zurich',
      'United States': 'America/New_York',
      'United Kingdom': 'Europe/London',
      'Germany': 'Europe/Berlin',
      'Spain': 'Europe/Madrid',
      'Italy': 'Europe/Rome'
    }
    
    return timezoneMap[country] || 'America/Toronto'
  }
}

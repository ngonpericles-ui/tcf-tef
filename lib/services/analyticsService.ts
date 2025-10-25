import { apiClient, ApiResponse } from '@/lib/api-client'

// Analytics Data Types
export interface DashboardAnalytics {
  totalUsers: number
  activeUsers: number
  totalCourses: number
  totalTests: number
  totalLiveSessions: number
  subscriptionDistribution: Record<string, number>
  userGrowth: MonthlyData[]
  courseCompletions: MonthlyData[]
  testScores: TestScoreData[]
  revenueData: RevenueData[]
}

export interface MonthlyData {
  month: string
  value: number
  change?: number
}

export interface TestScoreData {
  level: string
  averageScore: number
  totalTests: number
  passRate: number
}

export interface RevenueData {
  month: string
  revenue: number
  subscriptions: number
  growth: number
}

export interface UserActivityAnalytics {
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  sessionDuration: number
  pageViews: number
  activityTimeline: ActivityData[]
  topPages: PageData[]
  deviceBreakdown: DeviceData[]
}

export interface ActivityData {
  date: string
  sessions: number
  duration: number
  pageViews: number
}

export interface PageData {
  page: string
  views: number
  uniqueUsers: number
  avgDuration: number
}

export interface DeviceData {
  device: string
  users: number
  percentage: number
}

export interface SystemMetrics {
  database: {
    size: string
    activeConnections: number
  }
  errors: {
    last24Hours: number
  }
  system: {
    uptime: number
    memoryUsage: any
    cpuUsage: any
  }
}

export interface ManagerAnalytics {
  studentsManaged: number
  coursesCreated: number
  averageRating: number
  totalRevenue: number
  studentProgress: StudentProgressData[]
  coursePerformance: CoursePerformanceData[]
  engagementMetrics: EngagementData
}

export interface StudentProgressData {
  studentId: string
  studentName: string
  currentLevel: string
  progress: number
  lastActivity: string
  completedCourses: number
}

export interface CoursePerformanceData {
  courseId: string
  courseName: string
  enrollments: number
  completions: number
  averageRating: number
  revenue: number
}

export interface EngagementData {
  totalViews: number
  totalLikes: number
  totalComments: number
  averageSessionTime: number
  returnRate: number
}

export interface LearningAnalytics {
  levelDistribution: LevelData[]
  skillProgress: SkillData[]
  learningPaths: PathData[]
  weakAreas: WeakAreaData[]
  recommendations: RecommendationData[]
}

export interface LevelData {
  level: string
  students: number
  averageProgress: number
  completionRate: number
}

export interface SkillData {
  skill: string
  averageScore: number
  improvement: number
  studentsCount: number
}

export interface PathData {
  pathName: string
  completionRate: number
  averageTime: number
  successRate: number
}

export interface WeakAreaData {
  area: string
  studentsAffected: number
  averageScore: number
  improvementNeeded: number
}

export interface RecommendationData {
  type: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  impact: number
}

export class AnalyticsService {
  /**
   * Get dashboard analytics for different user roles
   */
  static async getDashboardAnalytics(timeframe: string = '30d'): Promise<ApiResponse<DashboardAnalytics>> {
    try {
      return await apiClient.get(`/analytics/dashboard?timeframe=${timeframe}`)
    } catch (error) {
      console.error('Failed to fetch dashboard analytics:', error)
      throw error
    }
  }

  /**
   * Get user activity analytics
   */
  static async getUserActivityAnalytics(days: number = 30): Promise<ApiResponse<UserActivityAnalytics>> {
    try {
      return await apiClient.get(`/analytics/user-activity?days=${days}`)
    } catch (error) {
      console.error('Failed to fetch user activity analytics:', error)
      throw error
    }
  }

  /**
   * Get system metrics (Admin only)
   */
  static async getSystemMetrics(): Promise<ApiResponse<SystemMetrics>> {
    try {
      return await apiClient.get('/analytics/system-metrics')
    } catch (error) {
      console.error('Failed to fetch system metrics:', error)
      throw error
    }
  }

  /**
   * Get manager analytics
   */
  static async getManagerAnalytics(
    timeframe: string = '30d',
    category?: string,
    filters?: string
  ): Promise<ApiResponse<ManagerAnalytics>> {
    try {
      const params = new URLSearchParams({ timeframe })
      if (category) params.append('category', category)
      if (filters) params.append('filters', filters)
      
      return await apiClient.get(`/manager/analytics?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch manager analytics:', error)
      throw error
    }
  }

  /**
   * Get admin analytics
   */
  static async getAdminAnalytics(
    category?: string,
    timeframe: string = '30d',
    filters?: string
  ): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams({ timeframe })
      if (category) params.append('category', category)
      if (filters) params.append('filters', filters)
      
      return await apiClient.get(`/admin/analytics?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch admin analytics:', error)
      throw error
    }
  }

  /**
   * Get manager performance analytics (Admin only)
   */
  static async getManagerPerformance(
    managerId: string,
    period: string = '30d'
  ): Promise<ApiResponse<any>> {
    try {
      return await apiClient.get(`/admin/managers/${managerId}/performance?period=${period}`)
    } catch (error) {
      console.error('Failed to fetch manager performance:', error)
      throw error
    }
  }

  /**
   * Track analytics event
   */
  static async trackEvent(
    eventType: string,
    eventData: any,
    sessionId?: string
  ): Promise<ApiResponse<void>> {
    try {
      const headers: any = {}
      if (sessionId) {
        headers['x-session-id'] = sessionId
      }

      return await apiClient.post('/analytics/track', {
        eventType,
        eventData
      }, { headers })
    } catch (error) {
      console.error('Failed to track analytics event:', error)
      // Don't throw error for tracking failures
      return { success: false, message: 'Tracking failed' }
    }
  }

  /**
   * Generate analytics report
   */
  static async generateReport(
    reportConfig: any,
    isAdmin: boolean = false
  ): Promise<ApiResponse<any>> {
    try {
      const endpoint = isAdmin ? '/admin/analytics/reports' : '/manager/analytics/reports'
      return await apiClient.post(endpoint, reportConfig)
    } catch (error) {
      console.error('Failed to generate report:', error)
      throw error
    }
  }

  /**
   * Export analytics data
   */
  static async exportData(
    format: 'csv' | 'xlsx' | 'pdf' = 'csv',
    category?: string,
    timeframe: string = '30d'
  ): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams({ format, timeframe })
      if (category) params.append('category', category)
      
      return await apiClient.get(`/admin/analytics/export?${params.toString()}`)
    } catch (error) {
      console.error('Failed to export analytics data:', error)
      throw error
    }
  }

  /**
   * Get learning analytics (Educational specific)
   */
  static async getLearningAnalytics(
    timeframe: string = '30d',
    level?: string
  ): Promise<ApiResponse<LearningAnalytics>> {
    try {
      const params = new URLSearchParams({ timeframe })
      if (level) params.append('level', level)
      
      // This will be a new endpoint we'll need to add to backend
      return await apiClient.get(`/analytics/learning?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch learning analytics:', error)
      throw error
    }
  }

  /**
   * Get real-time analytics updates
   */
  static async getRealTimeUpdates(): Promise<ApiResponse<any>> {
    try {
      return await apiClient.get('/analytics/realtime')
    } catch (error) {
      console.error('Failed to fetch real-time updates:', error)
      throw error
    }
  }

  /**
   * Utility function to format numbers
   */
  static formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  /**
   * Utility function to calculate percentage change
   */
  static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  /**
   * Utility function to format percentage
   */
  static formatPercentage(num: number): string {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`
  }
}

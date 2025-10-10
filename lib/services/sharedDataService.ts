import { apiClient, ApiResponse } from '@/lib/api-client'

// Shared data types across all sections
export interface UserProfile {
  id: string
  name: string
  email: string
  role: 'STUDENT' | 'JUNIOR_MANAGER' | 'SENIOR_MANAGER' | 'ADMIN'
  subscriptionTier: 'FREE' | 'ESSENTIAL' | 'PREMIUM' | 'PRO'
  avatar?: string
  preferences: UserPreferences
  stats: UserStats
  permissions: UserPermissions
  createdAt: string
  lastLoginAt: string
}

export interface UserPreferences {
  language: 'fr' | 'en'
  theme: 'light' | 'dark' | 'system'
  notifications: NotificationPreferences
  privacy: PrivacySettings
  accessibility: AccessibilitySettings
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  marketing: boolean
  updates: boolean
  reminders: boolean
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends'
  showProgress: boolean
  showAchievements: boolean
  allowMessages: boolean
}

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large'
  highContrast: boolean
  reducedMotion: boolean
  screenReader: boolean
}

export interface UserStats {
  totalCourses: number
  completedCourses: number
  totalTests: number
  averageScore: number
  studyTime: number // in minutes
  streak: number // days
  level: string // CEFR level
  achievements: Achievement[]
  recentActivity: ActivityItem[]
}

export interface UserPermissions {
  canCreateContent: boolean
  canModerateContent: boolean
  canManageUsers: boolean
  canViewAnalytics: boolean
  canExportData: boolean
  canAccessAdmin: boolean
  canHostLiveSessions: boolean
  canManageSubscriptions: boolean
}

export interface Achievement {
  id: string
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  icon: string
  category: string
  earnedAt: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface ActivityItem {
  id: string
  type: 'course_completed' | 'test_taken' | 'live_session_attended' | 'achievement_earned' | 'content_created'
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  timestamp: string
  metadata?: any
}

export interface SharedNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  titleEn: string
  message: string
  messageEn: string
  timestamp: string
  read: boolean
  actionUrl?: string
  actionLabel?: string
  actionLabelEn?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'system' | 'course' | 'test' | 'live_session' | 'achievement' | 'subscription'
}

export interface CrossSectionData {
  recentCourses: CourseProgress[]
  upcomingLiveSessions: LiveSession[]
  pendingTests: TestAssignment[]
  notifications: SharedNotification[]
  quickStats: QuickStats
  recommendations: Recommendation[]
}

export interface CourseProgress {
  courseId: string
  title: string
  titleEn: string
  progress: number
  lastAccessed: string
  estimatedTimeToComplete: number
  difficulty: string
  category: string
  thumbnail?: string
}

export interface LiveSession {
  id: string
  title: string
  titleEn: string
  instructor: string
  scheduledAt: string
  duration: number
  participants: number
  maxParticipants: number
  level: string
  topic: string
  isRegistered: boolean
  meetingUrl?: string
}

export interface TestAssignment {
  id: string
  title: string
  titleEn: string
  type: 'practice' | 'assessment' | 'tcf' | 'tef'
  dueDate?: string
  estimatedDuration: number
  difficulty: string
  attempts: number
  maxAttempts: number
  bestScore?: number
}

export interface QuickStats {
  todayStudyTime: number
  weeklyProgress: number
  currentStreak: number
  nextMilestone: string
  completionRate: number
  averageScore: number
}

export interface Recommendation {
  id: string
  type: 'course' | 'test' | 'live_session' | 'content'
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  reason: string
  reasonEn: string
  priority: number
  actionUrl: string
  actionLabel: string
  actionLabelEn: string
  thumbnail?: string
}

export class SharedDataService {
  /**
   * Get current user profile with all sections data
   */
  static async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      return await apiClient.get('/user/profile')
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      throw error
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
    try {
      return await apiClient.put('/user/preferences', preferences)
    } catch (error) {
      console.error('Failed to update user preferences:', error)
      throw error
    }
  }

  /**
   * Get cross-section data for dashboard
   */
  static async getCrossSectionData(): Promise<ApiResponse<CrossSectionData>> {
    try {
      return await apiClient.get('/user/cross-section-data')
    } catch (error) {
      console.error('Failed to fetch cross-section data:', error)
      throw error
    }
  }

  /**
   * Get notifications across all sections
   */
  static async getNotifications(
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<ApiResponse<SharedNotification[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString()
      })
      return await apiClient.get(`/user/notifications?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      throw error
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.put(`/user/notifications/${notificationId}/read`)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    try {
      return await apiClient.put('/user/notifications/read-all')
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }

  /**
   * Get user activity across all sections
   */
  static async getUserActivity(
    limit: number = 10,
    section?: 'student' | 'manager' | 'admin'
  ): Promise<ApiResponse<ActivityItem[]>> {
    try {
      const params = new URLSearchParams({ limit: limit.toString() })
      if (section) params.append('section', section)
      
      return await apiClient.get(`/user/activity?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch user activity:', error)
      throw error
    }
  }

  /**
   * Get personalized recommendations
   */
  static async getRecommendations(
    section?: 'student' | 'manager' | 'admin',
    limit: number = 5
  ): Promise<ApiResponse<Recommendation[]>> {
    try {
      const params = new URLSearchParams({ limit: limit.toString() })
      if (section) params.append('section', section)
      
      return await apiClient.get(`/user/recommendations?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
      throw error
    }
  }

  /**
   * Search across all sections
   */
  static async globalSearch(
    query: string,
    sections: ('courses' | 'tests' | 'live_sessions' | 'content' | 'users')[] = ['courses', 'tests', 'live_sessions', 'content'],
    limit: number = 20
  ): Promise<ApiResponse<any[]>> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString()
      })
      sections.forEach(section => params.append('sections', section))
      
      return await apiClient.get(`/search?${params.toString()}`)
    } catch (error) {
      console.error('Failed to perform global search:', error)
      throw error
    }
  }

  /**
   * Get quick stats for dashboard widgets
   */
  static async getQuickStats(): Promise<ApiResponse<QuickStats>> {
    try {
      return await apiClient.get('/user/quick-stats')
    } catch (error) {
      console.error('Failed to fetch quick stats:', error)
      throw error
    }
  }

  /**
   * Sync data across sections (for real-time updates)
   */
  static async syncSectionData(
    section: 'student' | 'manager' | 'admin',
    lastSyncTimestamp?: string
  ): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams({ section })
      if (lastSyncTimestamp) params.append('since', lastSyncTimestamp)
      
      return await apiClient.get(`/user/sync?${params.toString()}`)
    } catch (error) {
      console.error('Failed to sync section data:', error)
      throw error
    }
  }

  /**
   * Get section-specific permissions
   */
  static async getSectionPermissions(
    section: 'student' | 'manager' | 'admin'
  ): Promise<ApiResponse<UserPermissions>> {
    try {
      return await apiClient.get(`/user/permissions/${section}`)
    } catch (error) {
      console.error('Failed to fetch section permissions:', error)
      throw error
    }
  }

  /**
   * Update user activity (for tracking)
   */
  static async trackActivity(
    activity: {
      type: string
      section: 'student' | 'manager' | 'admin'
      metadata?: any
    }
  ): Promise<ApiResponse<void>> {
    try {
      return await apiClient.post('/user/activity', activity)
    } catch (error) {
      console.error('Failed to track activity:', error)
      throw error
    }
  }

  /**
   * Get section navigation context
   */
  static async getNavigationContext(
    section: 'student' | 'manager' | 'admin'
  ): Promise<ApiResponse<{
    currentSection: string
    availableSections: string[]
    quickActions: any[]
    recentItems: any[]
  }>> {
    try {
      return await apiClient.get(`/user/navigation-context/${section}`)
    } catch (error) {
      console.error('Failed to fetch navigation context:', error)
      throw error
    }
  }

  /**
   * Utility: Format user role for display
   */
  static formatUserRole(role: string, language: 'fr' | 'en' = 'fr'): string {
    const roleLabels = {
      'STUDENT': { fr: 'Étudiant', en: 'Student' },
      'JUNIOR_MANAGER': { fr: 'Manager Junior', en: 'Junior Manager' },
      'SENIOR_MANAGER': { fr: 'Manager Senior', en: 'Senior Manager' },
      'ADMIN': { fr: 'Administrateur', en: 'Administrator' }
    }
    
    return roleLabels[role as keyof typeof roleLabels]?.[language] || role
  }

  /**
   * Utility: Format subscription tier for display
   */
  static formatSubscriptionTier(tier: string, language: 'fr' | 'en' = 'fr'): string {
    const tierLabels = {
      'FREE': { fr: 'Gratuit', en: 'Free' },
      'ESSENTIAL': { fr: 'Essentiel', en: 'Essential' },
      'PREMIUM': { fr: 'Premium', en: 'Premium' },
      'PRO': { fr: 'Pro', en: 'Pro' }
    }
    
    return tierLabels[tier as keyof typeof tierLabels]?.[language] || tier
  }

  /**
   * Utility: Check if user has permission
   */
  static hasPermission(permissions: UserPermissions, permission: keyof UserPermissions): boolean {
    return permissions[permission] === true
  }

  /**
   * Utility: Get notification priority color
   */
  static getNotificationPriorityColor(priority: string): string {
    const colors = {
      'low': '#6b7280',      // gray
      'medium': '#f59e0b',   // amber
      'high': '#ef4444',     // red
      'urgent': '#dc2626'    // dark red
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }
}

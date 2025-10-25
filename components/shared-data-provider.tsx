"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { 
  SharedDataService, 
  type UserProfile, 
  type CrossSectionData, 
  type SharedNotification,
  type QuickStats,
  type Recommendation,
  type ActivityItem
} from "@/lib/services/sharedDataService"

interface SharedDataContextType {
  // User data
  userProfile: UserProfile | null
  crossSectionData: CrossSectionData | null
  notifications: SharedNotification[]
  quickStats: QuickStats | null
  recommendations: Recommendation[]
  recentActivity: ActivityItem[]
  
  // Loading states
  loading: boolean
  profileLoading: boolean
  notificationsLoading: boolean
  
  // Error states
  error: string | null
  
  // Counters
  unreadNotificationCount: number
  
  // Actions
  refreshUserProfile: () => Promise<void>
  refreshCrossSectionData: () => Promise<void>
  refreshNotifications: () => Promise<void>
  markNotificationAsRead: (notificationId: string) => Promise<void>
  markAllNotificationsAsRead: () => Promise<void>
  updateUserPreferences: (preferences: any) => Promise<void>
  trackActivity: (activity: any) => Promise<void>
  
  // Real-time updates
  lastUpdated: Date | null
  isOnline: boolean
}

const SharedDataContext = createContext<SharedDataContextType | undefined>(undefined)

interface SharedDataProviderProps {
  children: ReactNode
  autoRefresh?: boolean
  refreshInterval?: number
}

export function SharedDataProvider({ 
  children, 
  autoRefresh = true, 
  refreshInterval = 5 * 60 * 1000 // 5 minutes
}: SharedDataProviderProps) {
  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [crossSectionData, setCrossSectionData] = useState<CrossSectionData | null>(null)
  const [notifications, setNotifications] = useState<SharedNotification[]>([])
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  
  // Error state
  const [error, setError] = useState<string | null>(null)
  
  // Meta state
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  // Computed values
  const unreadNotificationCount = notifications.filter(n => !n.read).length

  // Refresh user profile
  const refreshUserProfile = useCallback(async () => {
    try {
      setProfileLoading(true)
      setError(null)
      
      const response = await SharedDataService.getUserProfile()
      if (response.success) {
        setUserProfile(response.data)
        setLastUpdated(new Date())
      } else {
        setError(response.error || 'Failed to load user profile')
      }
    } catch (err) {
      setError('Failed to load user profile')
      console.error('Error refreshing user profile:', err)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  // Refresh cross-section data
  const refreshCrossSectionData = useCallback(async () => {
    try {
      setError(null)
      
      const response = await SharedDataService.getCrossSectionData()
      if (response.success) {
        setCrossSectionData(response.data)
        setQuickStats(response.data.quickStats)
        setRecommendations(response.data.recommendations)
        setLastUpdated(new Date())
      } else {
        setError(response.error || 'Failed to load cross-section data')
      }
    } catch (err) {
      setError('Failed to load cross-section data')
      console.error('Error refreshing cross-section data:', err)
    }
  }, [])

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true)
      setError(null)
      
      const response = await SharedDataService.getNotifications(20)
      if (response.success) {
        setNotifications(response.data)
        setLastUpdated(new Date())
      } else {
        setError(response.error || 'Failed to load notifications')
      }
    } catch (err) {
      setError('Failed to load notifications')
      console.error('Error refreshing notifications:', err)
    } finally {
      setNotificationsLoading(false)
    }
  }, [])

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await SharedDataService.markNotificationAsRead(notificationId)
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        )
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }, [])

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      const response = await SharedDataService.markAllNotificationsAsRead()
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        )
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }, [])

  // Update user preferences
  const updateUserPreferences = useCallback(async (preferences: any) => {
    try {
      const response = await SharedDataService.updateUserPreferences(preferences)
      if (response.success && userProfile) {
        setUserProfile({
          ...userProfile,
          preferences: { ...userProfile.preferences, ...preferences }
        })
      }
    } catch (err) {
      console.error('Error updating user preferences:', err)
    }
  }, [userProfile])

  // Track activity
  const trackActivity = useCallback(async (activity: any) => {
    try {
      await SharedDataService.trackActivity(activity)
      // Optionally refresh recent activity
      const activityResponse = await SharedDataService.getUserActivity(10)
      if (activityResponse.success) {
        setRecentActivity(activityResponse.data)
      }
    } catch (err) {
      console.error('Error tracking activity:', err)
    }
  }, [])

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      
      try {
        // Load all initial data in parallel
        const [profileResponse, crossSectionResponse, notificationsResponse, activityResponse] = await Promise.allSettled([
          SharedDataService.getUserProfile(),
          SharedDataService.getCrossSectionData(),
          SharedDataService.getNotifications(20),
          SharedDataService.getUserActivity(10)
        ])

        // Process profile
        if (profileResponse.status === 'fulfilled' && profileResponse.value.success) {
          setUserProfile(profileResponse.value.data)
        }

        // Process cross-section data
        if (crossSectionResponse.status === 'fulfilled' && crossSectionResponse.value.success) {
          setCrossSectionData(crossSectionResponse.value.data)
          setQuickStats(crossSectionResponse.value.data.quickStats)
          setRecommendations(crossSectionResponse.value.data.recommendations)
        }

        // Process notifications
        if (notificationsResponse.status === 'fulfilled' && notificationsResponse.value.success) {
          setNotifications(notificationsResponse.value.data)
        }

        // Process activity
        if (activityResponse.status === 'fulfilled' && activityResponse.value.success) {
          setRecentActivity(activityResponse.value.data)
        }

        setLastUpdated(new Date())
      } catch (err) {
        setError('Failed to load initial data')
        console.error('Error loading initial data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(async () => {
      if (isOnline) {
        try {
          await Promise.allSettled([
            refreshCrossSectionData(),
            refreshNotifications()
          ])
        } catch (err) {
          console.error('Error during auto-refresh:', err)
        }
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, isOnline, refreshCrossSectionData, refreshNotifications])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Context value
  const contextValue: SharedDataContextType = {
    // Data
    userProfile,
    crossSectionData,
    notifications,
    quickStats,
    recommendations,
    recentActivity,
    
    // Loading states
    loading,
    profileLoading,
    notificationsLoading,
    
    // Error state
    error,
    
    // Counters
    unreadNotificationCount,
    
    // Actions
    refreshUserProfile,
    refreshCrossSectionData,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    updateUserPreferences,
    trackActivity,
    
    // Meta
    lastUpdated,
    isOnline
  }

  return (
    <SharedDataContext.Provider value={contextValue}>
      {children}
    </SharedDataContext.Provider>
  )
}

// Hook to use shared data
export function useSharedData(): SharedDataContextType {
  const context = useContext(SharedDataContext)
  if (context === undefined) {
    throw new Error('useSharedData must be used within a SharedDataProvider')
  }
  return context
}

// Specialized hooks for specific data
export function useUserProfile() {
  const { userProfile, profileLoading, refreshUserProfile } = useSharedData()
  return { userProfile, loading: profileLoading, refresh: refreshUserProfile }
}

export function useNotifications() {
  const { 
    notifications, 
    unreadNotificationCount, 
    notificationsLoading, 
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useSharedData()
  
  return {
    notifications,
    unreadCount: unreadNotificationCount,
    loading: notificationsLoading,
    refresh: refreshNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead
  }
}

export function useQuickStats() {
  const { quickStats, refreshCrossSectionData } = useSharedData()
  return { quickStats, refresh: refreshCrossSectionData }
}

export function useRecommendations() {
  const { recommendations, refreshCrossSectionData } = useSharedData()
  return { recommendations, refresh: refreshCrossSectionData }
}

export function useActivityTracking() {
  const { trackActivity, recentActivity } = useSharedData()
  return { trackActivity, recentActivity }
}

export function useCrossSectionData() {
  const { crossSectionData, refreshCrossSectionData } = useSharedData()
  return { crossSectionData, refresh: refreshCrossSectionData }
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  AnalyticsService, 
  type DashboardAnalytics, 
  type UserActivityAnalytics,
  type ManagerAnalytics 
} from '@/lib/services/analyticsService'

export interface UseAnalyticsOptions {
  userRole: 'ADMIN' | 'SENIOR_MANAGER' | 'JUNIOR_MANAGER' | 'USER'
  timeRange?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UseAnalyticsReturn {
  dashboardData: DashboardAnalytics | null
  activityData: UserActivityAnalytics | null
  managerData: ManagerAnalytics | null
  loading: boolean
  error: string | null
  refreshing: boolean
  lastUpdated: Date | null
  refresh: () => Promise<void>
  setTimeRange: (range: string) => void
  trackEvent: (eventType: string, eventData: any) => Promise<void>
}

export function useAnalytics(options: UseAnalyticsOptions): UseAnalyticsReturn {
  const {
    userRole,
    timeRange: initialTimeRange = '30d',
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000 // 5 minutes
  } = options

  const [dashboardData, setDashboardData] = useState<DashboardAnalytics | null>(null)
  const [activityData, setActivityData] = useState<UserActivityAnalytics | null>(null)
  const [managerData, setManagerData] = useState<ManagerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [timeRange, setTimeRange] = useState(initialTimeRange)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load analytics data
  const loadAnalyticsData = useCallback(async (isRefresh = false) => {
    try {
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      abortControllerRef.current = new AbortController()

      if (!isRefresh) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      setError(null)

      const promises = []

      // Load dashboard analytics for all roles
      promises.push(AnalyticsService.getDashboardAnalytics(timeRange))

      // Load user activity analytics
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
      promises.push(AnalyticsService.getUserActivityAnalytics(days))

      // Load manager-specific analytics if user is manager or admin
      if (userRole === 'SENIOR_MANAGER' || userRole === 'JUNIOR_MANAGER' || userRole === 'ADMIN') {
        promises.push(AnalyticsService.getManagerAnalytics(timeRange))
      }

      const results = await Promise.allSettled(promises)

      // Process dashboard analytics
      if (results[0].status === 'fulfilled' && results[0].value.success) {
        setDashboardData(results[0].value.data)
      } else if (results[0].status === 'rejected') {
        console.error('Dashboard analytics failed:', results[0].reason)
      }

      // Process activity analytics
      if (results[1].status === 'fulfilled' && results[1].value.success) {
        setActivityData(results[1].value.data)
      } else if (results[1].status === 'rejected') {
        console.error('Activity analytics failed:', results[1].reason)
      }

      // Process manager analytics
      if (results[2] && results[2].status === 'fulfilled' && results[2].value.success) {
        setManagerData(results[2].value.data)
      } else if (results[2] && results[2].status === 'rejected') {
        console.error('Manager analytics failed:', results[2].reason)
      }

      setLastUpdated(new Date())
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
        console.error('Analytics loading failed:', err)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [timeRange, userRole])

  // Manual refresh function
  const refresh = useCallback(async () => {
    await loadAnalyticsData(true)
  }, [loadAnalyticsData])

  // Track analytics event
  const trackEvent = useCallback(async (eventType: string, eventData: any) => {
    try {
      await AnalyticsService.trackEvent(eventType, eventData)
    } catch (error) {
      console.error('Event tracking failed:', error)
      // Don't throw error for tracking failures
    }
  }, [])

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        loadAnalyticsData(true)
      }, refreshInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [autoRefresh, refreshInterval, loadAnalyticsData])

  // Load data when timeRange changes
  useEffect(() => {
    loadAnalyticsData()
  }, [loadAnalyticsData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    dashboardData,
    activityData,
    managerData,
    loading,
    error,
    refreshing,
    lastUpdated,
    refresh,
    setTimeRange,
    trackEvent
  }
}

// Utility hook for tracking page views
export function useAnalyticsPageView(pageName: string) {
  const trackEvent = useCallback(async (eventType: string, eventData: any) => {
    try {
      await AnalyticsService.trackEvent(eventType, eventData)
    } catch (error) {
      console.error('Page view tracking failed:', error)
    }
  }, [])

  useEffect(() => {
    trackEvent('page_view', {
      page: pageName,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : ''
    })
  }, [pageName, trackEvent])
}

// Utility hook for tracking user interactions
export function useAnalyticsInteraction() {
  const trackEvent = useCallback(async (eventType: string, eventData: any) => {
    try {
      await AnalyticsService.trackEvent(eventType, eventData)
    } catch (error) {
      console.error('Interaction tracking failed:', error)
    }
  }, [])

  const trackClick = useCallback((element: string, context?: any) => {
    trackEvent('click', {
      element,
      context,
      timestamp: new Date().toISOString()
    })
  }, [trackEvent])

  const trackFormSubmit = useCallback((formName: string, data?: any) => {
    trackEvent('form_submit', {
      form: formName,
      data,
      timestamp: new Date().toISOString()
    })
  }, [trackEvent])

  const trackSearch = useCallback((query: string, results?: number) => {
    trackEvent('search', {
      query,
      results,
      timestamp: new Date().toISOString()
    })
  }, [trackEvent])

  const trackDownload = useCallback((fileName: string, fileType?: string) => {
    trackEvent('download', {
      fileName,
      fileType,
      timestamp: new Date().toISOString()
    })
  }, [trackEvent])

  return {
    trackEvent,
    trackClick,
    trackFormSubmit,
    trackSearch,
    trackDownload
  }
}

// Utility hook for performance monitoring
export function useAnalyticsPerformance() {
  const trackEvent = useCallback(async (eventType: string, eventData: any) => {
    try {
      await AnalyticsService.trackEvent(eventType, eventData)
    } catch (error) {
      console.error('Performance tracking failed:', error)
    }
  }, [])

  const trackPageLoad = useCallback((pageName: string, loadTime: number) => {
    trackEvent('page_load', {
      page: pageName,
      loadTime,
      timestamp: new Date().toISOString()
    })
  }, [trackEvent])

  const trackApiCall = useCallback((endpoint: string, duration: number, status: number) => {
    trackEvent('api_call', {
      endpoint,
      duration,
      status,
      timestamp: new Date().toISOString()
    })
  }, [trackEvent])

  const trackError = useCallback((error: Error, context?: any) => {
    trackEvent('error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    })
  }, [trackEvent])

  return {
    trackPageLoad,
    trackApiCall,
    trackError
  }
}

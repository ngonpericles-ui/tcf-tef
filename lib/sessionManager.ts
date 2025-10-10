import { apiClient } from './api-client'
import { SimpleTokenStorage } from './simpleTokenStorage'
import { TokenValidator } from './tokenValidator'

export interface SessionData {
  user: any
  accessToken: string
  refreshToken: string
  expiresAt: number
  lastActivity: number
}

export class SessionManager {
  private static readonly SESSION_KEY = 'tcf_tef_session'
  private static readonly ACTIVITY_KEY = 'tcf_tef_activity'
  private static readonly ROLE_KEY = 'tcf_tef_role'
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes (default)
  private static readonly REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes before expiry

  // Role-based session isolation keys
  private static getSessionKey(role?: string): string {
    switch (role) {
      case 'ADMIN':
        return 'tcf_tef_admin_session'
      case 'SENIOR_MANAGER':
        return 'tcf_tef_senior_manager_session'
      case 'JUNIOR_MANAGER':
        return 'tcf_tef_junior_manager_session'
      case 'USER':
      case 'STUDENT':
      default:
        return 'tcf_tef_student_session'
    }
  }

  private static getActivityKey(role?: string): string {
    switch (role) {
      case 'ADMIN':
        return 'tcf_tef_admin_activity'
      case 'SENIOR_MANAGER':
        return 'tcf_tef_senior_manager_activity'
      case 'JUNIOR_MANAGER':
        return 'tcf_tef_junior_manager_activity'
      case 'USER':
      case 'STUDENT':
      default:
        return 'tcf_tef_student_activity'
    }
  }

  // Role-based session timeouts
  private static getSessionTimeout(role?: string): number {
    switch (role) {
      case 'ADMIN':
      case 'SENIOR_MANAGER':
      case 'JUNIOR_MANAGER':
        return 15 * 60 * 1000 // 15 minutes for managers and admins
      case 'USER':
      case 'STUDENT':
      default:
        return 60 * 60 * 1000 // 60 minutes for students
    }
  }

  /**
   * Initialize session from stored data with improved caching
   */
  static async initializeSession(): Promise<SessionData | null> {
    try {
      if (typeof window === 'undefined') {
        console.log('SessionManager: Server-side rendering, no session available')
        return null
      }

      // CRITICAL FIX: Add session caching to prevent repeated validation
      const sessionCache = sessionStorage.getItem('session_cache')
      if (sessionCache) {
        try {
          const cachedSession = JSON.parse(sessionCache)
          const cacheTime = cachedSession.cacheTime || 0
          const cacheExpiry = 5 * 60 * 1000 // 5 minutes cache
          
          if (Date.now() - cacheTime < cacheExpiry) {
            console.log('Using cached session data')
            return cachedSession.session
          }
        } catch (error) {
          console.log('Failed to parse cached session, continuing with fresh validation')
        }
      }

      // First, try to get user from localStorage (fastest path)
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          console.log('Found stored user data, attempting to restore session')
          
          // Get tokens from simple storage
          const accessToken = await SimpleTokenStorage.getAccessToken()
          const refreshToken = await SimpleTokenStorage.getRefreshToken()

          if (accessToken && refreshToken) {
            // Create session with stored user data
            const session: SessionData = {
              user: userData,
              accessToken,
              refreshToken,
              expiresAt: Date.now() + (15 * 60 * 1000), // Default 15 minutes
              lastActivity: Date.now()
            }

            // Update activity
            this.updateLastActivity()
            
            // Cache the session to prevent repeated validation
            this.cacheSession(session)
            
            return session
          }
        } catch (error) {
          console.error('Failed to parse stored user:', error)
          localStorage.removeItem('user')
        }
      }

      // Fallback to token-based session restoration
      const accessToken = await SimpleTokenStorage.getAccessToken()
      const refreshToken = await SimpleTokenStorage.getRefreshToken()

      if (!accessToken || !refreshToken) {
        console.log('SessionManager: No tokens found in storage')
        return null
      }

      // More lenient validation - only check basic structure
      const accessValidation = TokenValidator.validateToken(accessToken)
      
      // If access token is expired but refresh token exists, try refresh
      if (accessValidation.isExpired && refreshToken) {
        console.log('Access token expired, attempting refresh')
        const refreshedSession = await this.refreshSession()
        if (refreshedSession) {
          return refreshedSession
        }
        // If refresh fails, don't clear session immediately - user might be offline
        console.log('Refresh failed, but keeping session for retry')
        
        // For students, try to return a basic session even if refresh fails
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            if (userData.role === 'USER' || userData.role === 'STUDENT') {
              console.log('Returning basic session for student despite refresh failure')
              return {
                user: userData,
                accessToken,
                refreshToken,
                expiresAt: Date.now() + (15 * 60 * 1000),
                lastActivity: Date.now()
              }
            }
          } catch (error) {
            console.error('Failed to parse stored user for fallback session:', error)
          }
        }
        
        return null
      }

      // Only check inactivity if we have a valid, non-expired token
      if (accessValidation.isValid && !accessValidation.isExpired) {
        // Check if session is inactive (only if we have a valid session)
        if (this.isSessionInactive()) {
          console.log('Session inactive, handling timeout')
          await this.handleSessionTimeout()
          return null
        }

        // Update last activity
        this.updateLastActivity()

        // Create session data from tokens
        const session: SessionData = {
          user: accessValidation.payload || {},
          accessToken,
          refreshToken,
          expiresAt: accessValidation.payload?.exp ? accessValidation.payload.exp * 1000 : Date.now() + (15 * 60 * 1000),
          lastActivity: Date.now()
        }

        return session
      }

      // If token is invalid but not expired, try to use it anyway (might be a validation issue)
      if (!accessValidation.isExpired) {
        console.log('Token validation failed but not expired, attempting to use anyway')
        
        // Try to decode user info from token
        const payload = TokenValidator.decodeToken(accessToken)
        if (payload && payload.userId) {
          this.updateLastActivity()
          
          const session: SessionData = {
            user: payload,
            accessToken,
            refreshToken,
            expiresAt: payload.exp ? payload.exp * 1000 : Date.now() + (15 * 60 * 1000),
            lastActivity: Date.now()
          }

          return session
        }
      }

      console.log('Session initialization failed - no valid tokens')
      return null
    } catch (error) {
      console.error('Session initialization failed:', error)
      // Don't clear session on error - might be temporary
      return null
    }
  }

  /**
   * Save session data
   */
  static async saveSession(sessionData: SessionData): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      // Store tokens simply
      await SimpleTokenStorage.storeAccessToken(sessionData.accessToken)
      await SimpleTokenStorage.storeRefreshToken(sessionData.refreshToken)
      
      // Store session metadata in regular storage
      const sessionMetadata = {
        user: sessionData.user,
        expiresAt: sessionData.expiresAt,
        lastActivity: sessionData.lastActivity
      }

      // Use role-based session key for isolation
      const sessionKey = this.getSessionKey(sessionData.user.role)
      localStorage.setItem(sessionKey, JSON.stringify(sessionMetadata))

      // Also store user data separately for easier access
      localStorage.setItem('user', JSON.stringify(sessionData.user))
      
      // Store additional persistence data
      localStorage.setItem('auth_persistent', 'true')
      localStorage.setItem('user_role', sessionData.user.role || 'USER')
      localStorage.setItem('user_email', sessionData.user.email || '')
      
      this.updateLastActivity()
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  /**
   * Clear session data
   */
  static async clearSession(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      // Clear simple tokens
      await SimpleTokenStorage.clearTokens()
      
      // Clear all role-based session metadata
      localStorage.removeItem(this.SESSION_KEY)
      localStorage.removeItem(this.getSessionKey('ADMIN'))
      localStorage.removeItem(this.getSessionKey('SENIOR_MANAGER'))
      localStorage.removeItem(this.getSessionKey('JUNIOR_MANAGER'))
      localStorage.removeItem(this.getSessionKey('STUDENT'))

      // Clear all role-based activity data
      localStorage.removeItem(this.ACTIVITY_KEY)
      localStorage.removeItem(this.getActivityKey('ADMIN'))
      localStorage.removeItem(this.getActivityKey('SENIOR_MANAGER'))
      localStorage.removeItem(this.getActivityKey('JUNIOR_MANAGER'))
      localStorage.removeItem(this.getActivityKey('STUDENT'))
      
      // Clear all auth-related data
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('userRole')
      localStorage.removeItem('managerRole')
      localStorage.removeItem('auth_persistent')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_email')
      
      // Clear any other user-related data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('user_') || key.startsWith('auth_') || key.startsWith('tcf_')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear session cache
      this.clearSessionCache()
      
      console.log('Session cleared successfully')
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }

  /**
   * Refresh session tokens
   */
  static async refreshSession(): Promise<SessionData | null> {
    try {
      const refreshToken = await SimpleTokenStorage.getRefreshToken()
      if (!refreshToken) {
        console.log('No refresh token available')
        return null
      }

      // Only validate refresh token structure, not expiration (backend will handle expiration)
      const refreshValidation = TokenValidator.validateToken(refreshToken)
      if (!refreshValidation.payload) {
        console.log('Invalid refresh token structure')
        await this.clearSession()
        return null
      }

      console.log('Attempting to refresh session with backend...')
      const response = await apiClient.post('/auth/refresh', { refreshToken })
      
      if (response.success && (response.data as any)?.tokens) {
        const { user, tokens } = response.data as any
        
        console.log('Session refresh successful, updating tokens...')
        
        // Don't validate new tokens too strictly - backend already validated them
        const expiresAt = Date.now() + (15 * 60 * 1000) // 15 minutes from now

        const sessionData: SessionData = {
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt,
          lastActivity: Date.now()
        }

        await this.saveSession(sessionData)
        console.log('Session data saved successfully')
        return sessionData
      } else {
        console.log('Backend refresh failed:', response.error?.message || 'Unknown error')
        await this.clearSession()
        return null
      }
    } catch (error) {
      console.error('Session refresh failed:', error)
      await this.clearSession()
      return null // Don't throw, just return null to indicate failure
    }
  }

  /**
   * Update last activity timestamp with role-based isolation
   */
  static updateLastActivity(role?: string): void {
    if (typeof window === 'undefined') return

    try {
      // Get role from stored user if not provided
      if (!role) {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            role = userData.role
          } catch (error) {
            console.error('Failed to parse stored user for activity update:', error)
          }
        }
      }

      // Update activity for the specific role
      const activityKey = this.getActivityKey(role)
      localStorage.setItem(activityKey, Date.now().toString())

      // Also update the general activity key for backward compatibility
      localStorage.setItem(this.ACTIVITY_KEY, Date.now().toString())
    } catch (error) {
      console.error('Failed to update last activity:', error)
    }
  }

  /**
   * Cache session data to prevent repeated validation
   */
  static cacheSession(session: SessionData): void {
    if (typeof window === 'undefined') return

    try {
      const cacheData = {
        session,
        cacheTime: Date.now()
      }
      sessionStorage.setItem('session_cache', JSON.stringify(cacheData))
    } catch (error) {
      console.error('Failed to cache session:', error)
    }
  }

  /**
   * Clear session cache
   */
  static clearSessionCache(): void {
    if (typeof window === 'undefined') return

    try {
      sessionStorage.removeItem('session_cache')
    } catch (error) {
      console.error('Failed to clear session cache:', error)
    }
  }

  /**
   * Check if session is inactive with role-based isolation
   */
  static isSessionInactive(role?: string): boolean {
    if (typeof window === 'undefined') return true

    try {
      // Get role from stored user if not provided
      if (!role) {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            role = userData.role
          } catch (error) {
            console.error('Failed to parse stored user for inactivity check:', error)
          }
        }
      }

      // Check role-specific activity first, then fall back to general activity
      const roleActivityKey = this.getActivityKey(role)
      let lastActivity = localStorage.getItem(roleActivityKey)

      if (!lastActivity) {
        lastActivity = localStorage.getItem(this.ACTIVITY_KEY)
      }

      // If no activity recorded, don't consider it inactive immediately
      // This handles cases where activity tracking failed
      if (!lastActivity) {
        console.log('No activity recorded, but not considering session inactive')
        return false
      }

      // Get user role to determine appropriate timeout
      const timeout = this.getSessionTimeout(role)

      const timeSinceActivity = Date.now() - parseInt(lastActivity)
      const isInactive = timeSinceActivity > timeout

      if (isInactive) {
        console.log(`Session inactive for role ${role}: ${Math.floor(timeSinceActivity / 1000 / 60)} minutes since last activity (timeout: ${Math.floor(timeout / 1000 / 60)} minutes)`)
      }

      return isInactive
    } catch (error) {
      console.error('Failed to check session activity:', error)
      // Don't consider session inactive on error - might be temporary
      return false
    }
  }

  /**
   * Check if token should be refreshed
   */
  static shouldRefreshToken(expiresAt: number): boolean {
    const timeUntilExpiry = expiresAt - Date.now()
    return timeUntilExpiry < this.REFRESH_THRESHOLD
  }

  /**
   * Handle session timeout
   */
  static async handleSessionTimeout(): Promise<void> {
    console.log('Session timeout detected, clearing session')
    
    // Get user role before clearing session
    const session = this.getCurrentSession()
    const userRole = session?.user?.role
    
    this.clearSession()
    
    // Redirect to appropriate login page based on role
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      
      if (currentPath.startsWith('/admin') || userRole === 'ADMIN') {
        window.location.href = '/admin/login'
      } else if (currentPath.startsWith('/manager') || userRole === 'SENIOR_MANAGER' || userRole === 'JUNIOR_MANAGER') {
        window.location.href = '/manager'
      } else {
        window.location.href = '/connexion'
      }
    }
  }

  /**
   * Get current session data with role-based isolation
   */
  static getCurrentSession(role?: string): SessionData | null {
    if (typeof window === 'undefined') return null

    try {
      // Get role from stored user if not provided
      if (!role) {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            role = userData.role
          } catch (error) {
            console.error('Failed to parse stored user for session retrieval:', error)
          }
        }
      }

      // Try role-specific session first
      const roleSessionKey = this.getSessionKey(role)
      let sessionData = localStorage.getItem(roleSessionKey)

      // Fall back to general session key if role-specific not found
      if (!sessionData) {
        sessionData = localStorage.getItem(this.SESSION_KEY)
      }

      if (!sessionData) return null

      return JSON.parse(sessionData)
    } catch (error) {
      console.error('Failed to get current session:', error)
      return null
    }
  }

  /**
   * Check if user is online
   */
  static isOnline(): boolean {
    return typeof window !== 'undefined' && navigator.onLine
  }

  /**
   * Handle network change
   */
  static handleNetworkChange(): (() => void) | void {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      console.log('Network connection restored')
      // Optionally refresh session when back online
    }

    const handleOffline = () => {
      console.log('Network connection lost')
      // Optionally show offline indicator
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  /**
   * Setup session monitoring
   */
  static setupSessionMonitoring(): () => void {
    if (typeof window === 'undefined') return () => {}

    // Monitor user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      this.updateLastActivity()
    }

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Monitor visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, don't update activity
        return
      }
      
      // Page is visible, check if session is still valid
      if (this.isSessionInactive()) {
        this.handleSessionTimeout()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Monitor beforeunload
    const handleBeforeUnload = () => {
      // Save any pending data
      this.updateLastActivity()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    // Setup network monitoring
    const cleanupNetwork = this.handleNetworkChange()

    // Return cleanup function
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (cleanupNetwork && typeof cleanupNetwork === 'function') {
        cleanupNetwork()
      }
    }
  }
}

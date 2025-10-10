import { apiClient } from './api-client'

export interface SessionData {
  user: any
  accessToken: string
  refreshToken: string
  expiresAt: number
  lastActivity: number
  role: string
}

export class RoleBasedSessionManager {
  private static readonly SESSION_KEY = 'tcf_tef_session'
  private static readonly ACTIVITY_KEY = 'tcf_tef_activity'
  
  // Role-based timeout settings (in milliseconds)
  private static readonly ROLE_TIMEOUTS = {
    ADMIN: 0, // No timeout for admin
    SENIOR_MANAGER: 5 * 60 * 1000, // 5 minutes
    JUNIOR_MANAGER: 5 * 60 * 1000, // 5 minutes
    STUDENT: 60 * 60 * 1000, // 60 minutes
  }

  private static readonly REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes before expiry
  private static activityTimer: NodeJS.Timeout | null = null
  private static sessionCheckInterval: NodeJS.Timeout | null = null

  /**
   * Get timeout for user role
   */
  private static getTimeoutForRole(role: string): number {
    return this.ROLE_TIMEOUTS[role as keyof typeof this.ROLE_TIMEOUTS] || this.ROLE_TIMEOUTS.STUDENT
  }

  /**
   * Initialize session from stored data
   */
  static async initializeSession(): Promise<SessionData | null> {
    if (typeof window === 'undefined') return null

    try {
      const accessToken = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')
      const userStr = localStorage.getItem('user')

      if (!accessToken || !refreshToken || !userStr) {
        return null
      }

      const user = JSON.parse(userStr)
      const session: SessionData = {
        user,
        accessToken,
        refreshToken,
        expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes from now
        lastActivity: Date.now(),
        role: user.role
      }

      // Check if session is inactive based on role
      if (this.isSessionInactive(session.role)) {
        await this.handleSessionTimeout(session.role)
        return null
      }

      // Update last activity
      this.updateLastActivity()

      // Start session monitoring
      this.startSessionMonitoring(session.role)

      return session
    } catch (error) {
      console.error('Session initialization failed:', error)
      this.clearSession()
      return null
    }
  }

  /**
   * Save session data
   */
  static async saveSession(sessionData: SessionData): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('accessToken', sessionData.accessToken)
      localStorage.setItem('refreshToken', sessionData.refreshToken)
      localStorage.setItem('user', JSON.stringify(sessionData.user))
      this.updateLastActivity()
      
      // Start session monitoring
      this.startSessionMonitoring(sessionData.role)
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  /**
   * Clear session data
   */
  static clearSession(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem(this.ACTIVITY_KEY)
      localStorage.removeItem('managerRole')
      
      // Clear timers
      if (this.activityTimer) {
        clearTimeout(this.activityTimer)
        this.activityTimer = null
      }
      if (this.sessionCheckInterval) {
        clearInterval(this.sessionCheckInterval)
        this.sessionCheckInterval = null
      }
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }

  /**
   * Update last activity timestamp
   */
  static updateLastActivity(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.ACTIVITY_KEY, Date.now().toString())
    } catch (error) {
      console.error('Failed to update last activity:', error)
    }
  }

  /**
   * Check if session is inactive based on role
   */
  static isSessionInactive(role: string): boolean {
    if (typeof window === 'undefined') return true

    // Admin never times out
    if (role === 'ADMIN') return false

    try {
      const lastActivity = localStorage.getItem(this.ACTIVITY_KEY)
      if (!lastActivity) return true

      const timeSinceActivity = Date.now() - parseInt(lastActivity)
      const timeout = this.getTimeoutForRole(role)
      
      return timeSinceActivity > timeout
    } catch (error) {
      console.error('Failed to check session activity:', error)
      return true
    }
  }

  /**
   * Handle session timeout based on role
   */
  static async handleSessionTimeout(role: string): Promise<void> {
    console.log(`Session timeout detected for role: ${role}`)
    this.clearSession()
    
    // Redirect based on role
    if (typeof window !== 'undefined') {
      if (role === 'ADMIN') {
        window.location.href = '/admin/login'
      } else if (role === 'SENIOR_MANAGER' || role === 'JUNIOR_MANAGER') {
        window.location.href = '/manager'
      } else {
        window.location.href = '/connexion'
      }
    }
  }

  /**
   * Start session monitoring based on role
   */
  static startSessionMonitoring(role: string): void {
    if (typeof window === 'undefined') return

    // Clear existing timers
    if (this.activityTimer) {
      clearTimeout(this.activityTimer)
    }
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
    }

    // Admin doesn't need session monitoring
    if (role === 'ADMIN') return

    const timeout = this.getTimeoutForRole(role)

    // Set up activity monitoring
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      this.updateLastActivity()
      
      // Reset the timeout timer
      if (this.activityTimer) {
        clearTimeout(this.activityTimer)
      }
      
      this.activityTimer = setTimeout(() => {
        this.handleSessionTimeout(role)
      }, timeout)
    }

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Start the initial timeout
    this.activityTimer = setTimeout(() => {
      this.handleSessionTimeout(role)
    }, timeout)

    // Check session every minute
    this.sessionCheckInterval = setInterval(() => {
      if (this.isSessionInactive(role)) {
        this.handleSessionTimeout(role)
      }
    }, 60 * 1000) // Check every minute
  }

  /**
   * Logout user
   */
  static async logout(role: string): Promise<void> {
    try {
      // Call backend logout if possible
      const accessToken = localStorage.getItem('accessToken')
      if (accessToken) {
        await apiClient.post('/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      this.clearSession()
      
      // Redirect to appropriate login page based on role
      if (typeof window !== 'undefined') {
        if (role === 'ADMIN') {
          window.location.href = '/admin/login'
        } else if (role === 'SENIOR_MANAGER' || role === 'JUNIOR_MANAGER') {
          window.location.href = '/manager'
        } else {
          // Students and regular users go to /connexion
          window.location.href = '/connexion'
        }
      }
    }
  }

  /**
   * Get current session data
   */
  static getCurrentSession(): SessionData | null {
    if (typeof window === 'undefined') return null

    try {
      const accessToken = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')
      const userStr = localStorage.getItem('user')

      if (!accessToken || !refreshToken || !userStr) {
        return null
      }

      const user = JSON.parse(userStr)
      return {
        user,
        accessToken,
        refreshToken,
        expiresAt: Date.now() + (15 * 60 * 1000),
        lastActivity: Date.now(),
        role: user.role
      }
    } catch (error) {
      console.error('Failed to get current session:', error)
      return null
    }
  }
}

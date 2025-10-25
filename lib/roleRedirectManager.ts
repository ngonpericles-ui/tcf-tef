/**
 * 🧠 Smart Role Redirect Manager
 * Remembers user's last successful section and provides intelligent redirects
 */

export interface RoleRedirectData {
  lastSection: string
  role: string
  timestamp: number
}

export class RoleRedirectManager {
  private static readonly STORAGE_KEY = 'roleRedirect'
  private static readonly EXPIRY_DAYS = 30

  /**
   * Save user's successful section access
   */
  static saveSuccessfulAccess(role: string, section: string): void {
    if (typeof window === 'undefined') return

    const data: RoleRedirectData = {
      lastSection: section,
      role,
      timestamp: Date.now()
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
      console.log(`💾 Saved role redirect: ${role} → ${section}`)
    } catch (error) {
      console.warn('Failed to save role redirect:', error)
    }
  }

  /**
   * Get user's last successful section
   */
  static getLastSection(): string | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null

      const data: RoleRedirectData = JSON.parse(stored)
      
      // Check if data is expired
      const daysSinceLastAccess = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24)
      if (daysSinceLastAccess > this.EXPIRY_DAYS) {
        this.clearData()
        return null
      }

      return data.lastSection
    } catch (error) {
      console.warn('Failed to get role redirect:', error)
      return null
    }
  }

  /**
   * Get user's stored role
   */
  static getStoredRole(): string | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null

      const data: RoleRedirectData = JSON.parse(stored)
      return data.role
    } catch (error) {
      console.warn('Failed to get stored role:', error)
      return null
    }
  }

  /**
   * Get intelligent redirect URL based on role and intent
   */
  static getIntelligentRedirect(role: string, intendedPath?: string): string {
    // If user has a specific intent (typed a URL), respect it
    if (intendedPath) {
      if (role === 'ADMIN' && intendedPath.startsWith('/admin')) return '/admin'
      if (role === 'ADMIN' && intendedPath.startsWith('/manager')) return '/manager'
      if (role === 'ADMIN' && intendedPath.startsWith('/home')) return '/home'
      if ((role === 'SENIOR_MANAGER' || role === 'JUNIOR_MANAGER') && intendedPath.startsWith('/manager')) return '/manager'
      if (role === 'STUDENT' && intendedPath.startsWith('/home')) return '/home'
    }

    // Otherwise, use last successful section
    const lastSection = this.getLastSection()
    if (lastSection) return lastSection

    // Fallback to role-based defaults
    switch (role) {
      case 'ADMIN': return '/admin'
      case 'SENIOR_MANAGER':
      case 'JUNIOR_MANAGER': return '/manager'
      case 'STUDENT': return '/home'
      default: return '/welcome'
    }
  }

  /**
   * Clear stored data
   */
  static clearData(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('🗑️ Cleared role redirect data')
    } catch (error) {
      console.warn('Failed to clear role redirect data:', error)
    }
  }

  /**
   * Check if user should be redirected to login with role hint
   */
  static shouldRedirectToLoginWithRole(): string | null {
    if (typeof window === 'undefined') return null

    const storedRole = this.getStoredRole()
    const lastSection = this.getLastSection()
    
    // If we have a stored role but no current auth, suggest login with role
    if (storedRole && lastSection) {
      return `/connexion?role=${storedRole.toLowerCase()}`
    }

    return null
  }
}

/**
 * Hook for React components to use role redirect management
 */
export function useRoleRedirect() {
  const saveAccess = (role: string, section: string) => {
    RoleRedirectManager.saveSuccessfulAccess(role, section)
  }

  const getRedirect = (role: string, intendedPath?: string) => {
    return RoleRedirectManager.getIntelligentRedirect(role, intendedPath)
  }

  const clearData = () => {
    RoleRedirectManager.clearData()
  }

  return {
    saveAccess,
    getRedirect,
    clearData
  }
}

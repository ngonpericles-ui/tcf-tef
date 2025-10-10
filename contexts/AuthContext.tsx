"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { SessionManager } from '@/lib/sessionManager'
import { SimpleTokenStorage } from '@/lib/simpleTokenStorage'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'USER' | 'STUDENT' | 'JUNIOR_MANAGER' | 'SENIOR_MANAGER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  subscriptionTier: 'FREE' | 'ESSENTIAL' | 'PREMIUM' | 'PRO'
  profileImage?: string
  phone?: string
  country?: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  mounted: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>
  signInWithGoogle: () => Promise<{ success: boolean; user?: User; error?: string }>
  logout: (logoutFromAllDevices?: boolean) => Promise<void>
  register: (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
    country?: string
  }) => Promise<{ success: boolean; user?: User; error?: string }>
  checkAuthStatus: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
  isManager: boolean
  isStudent: boolean
  hasRole: (roles: string[]) => boolean
  hasSubscriptionTier: (tiers: string[]) => boolean
  logoutFromAllDevices: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // Always start with true, will be set to false after auth check
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false) // Track if component is mounted on client
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    
    // Don't clear any user data from localStorage - preserve all sessions
    // This ensures admin/manager users stay logged in on refresh
    
    checkAuthStatus()

    // Setup session monitoring
    const cleanup = SessionManager.setupSessionMonitoring()

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  // Helper: Update cookies to sync with session state
  const updateAuthCookies = (userData: User | null) => {
    if (typeof document === 'undefined') return
    
    if (userData) {
      document.cookie = `auth=1; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
      document.cookie = `role=${userData.role}; path=/; max-age=${60 * 60 * 24 * 7}`;
      if (['USER', 'STUDENT'].includes(userData.role)) {
        document.cookie = `hasAccount=1; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
    } else {
      // Clear cookies
      document.cookie = 'auth=; Max-Age=0; path=/'
      document.cookie = 'role=; Max-Age=0; path=/'
    }
  }

  // Helper: Check if token needs refresh (expires in less than 5 minutes)
  const shouldRefreshToken = (session: any): boolean => {
    if (!session || !session.expiresAt) return false
    const expiresIn = session.expiresAt - Date.now()
    return expiresIn < 5 * 60 * 1000 // Less than 5 minutes
  }

  // Helper: Refresh access token
  const refreshTokenIfNeeded = async (): Promise<boolean> => {
    try {
      const session = SessionManager.getCurrentSession()
      if (!session || !session.refreshToken) {
        console.log('No session or refresh token available')
        return false
      }

      // Check if token needs refresh
      if (!shouldRefreshToken(session)) {
        console.log('Token still valid, no refresh needed')
        return true
      }

      console.log('Token expiring soon, refreshing...')
      
      // Call refresh endpoint
      const response = await apiClient.post<{tokens: {accessToken: string, refreshToken: string}}>('/auth/refresh', {
        refreshToken: session.refreshToken
      })

      if (response.success && response.data?.tokens) {
        // Update session with new tokens
        const newSession = {
          ...session,
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken || session.refreshToken,
          expiresAt: Date.now() + (15 * 60 * 1000),
          lastActivity: Date.now()
        }
        
        await SessionManager.saveSession(newSession)
        console.log('Token refreshed successfully')
        return true
      } else {
        console.error('Token refresh failed:', response.error)
        return false
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      return false
    }
  }

  const checkAuthStatus = async () => {
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Auth check timeout - setting loading to false')
      setLoading(false)
    }, 10000) // 10 second timeout

    try {
      setError(null)

      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        clearTimeout(timeoutId)
        setUser(null)
        setLoading(false)
        return
      }

      // Get stored user and session
      const storedUser = localStorage.getItem('user')
      const session = SessionManager.getCurrentSession()

      if (!storedUser || !session) {
        console.log('No stored user or session found')
        clearTimeout(timeoutId)
        setUser(null)
        setLoading(false)
        updateAuthCookies(null)
        return
      }

      try {
        const userData = JSON.parse(storedUser)
        console.log('Found stored user:', userData.email, 'Role:', userData.role)

        // Try to refresh token if needed
        const tokenValid = await refreshTokenIfNeeded()
        
        if (!tokenValid) {
          console.log('Token refresh failed, attempting verification...')
        }

        // Validate session with backend
        try {
          const verifyResponse = await apiClient.get('/auth/verify')
          
          if (verifyResponse.success) {
            console.log('Session validated successfully')
            clearTimeout(timeoutId)
            setUser(userData)
            updateAuthCookies(userData)
            setLoading(false)
            return
          }
        } catch (verifyError: any) {
          console.error('Session verification failed:', verifyError?.response?.status)
          
          // If 401 or network error, session is invalid - clear everything
          if (verifyError?.response?.status === 401 || verifyError?.code === 'ERR_NETWORK' || verifyError?.code === 'ECONNABORTED') {
            console.log('Unauthorized - clearing session')
            clearTimeout(timeoutId)
            await SessionManager.clearSession()
            localStorage.removeItem('user')
            setUser(null)
            updateAuthCookies(null)
            setLoading(false)
            return
          }
          
          // For other errors, try to refresh token one more time
          const refreshed = await refreshTokenIfNeeded()
          if (refreshed) {
            console.log('Token refreshed after verification failure')
            setUser(userData)
            updateAuthCookies(userData)
            setLoading(false)
            return
          }
          
          // If refresh also fails, clear session
          console.log('Both verification and refresh failed - clearing session')
          await SessionManager.clearSession()
          localStorage.removeItem('user')
          setUser(null)
          updateAuthCookies(null)
          setLoading(false)
          return
        }
      } catch (parseError) {
        console.error('Failed to parse stored user:', parseError)
        clearTimeout(timeoutId)
        localStorage.removeItem('user')
        await SessionManager.clearSession()
        setUser(null)
        updateAuthCookies(null)
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Auth check failed:', error)
      clearTimeout(timeoutId)
      setUser(null)
      updateAuthCookies(null)
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      // Use token-aware helper so Authorization header is set globally
      const response = await apiClient.login(email, password)
      
      if (response.success && response.data) {
        const { user: userData, tokens } = response.data as any
        
        // Create session data
        const sessionData = {
          user: userData,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes from now
          lastActivity: Date.now()
        }

        // Set user immediately for faster redirect
        setUser(userData)
        
        // Update cookies to sync with session
        updateAuthCookies(userData)
        
        // Save session in background (non-blocking)
        SessionManager.saveSession(sessionData).catch(error => {
          console.error('Failed to save session:', error)
        })
        
        // Don't redirect here - let the login page handle it
        // This prevents race conditions with multiple redirects
        
        return { success: true, user: userData }
      } else {
        const errorMessage = response.error?.message || 'Login failed'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Handle specific timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        const timeoutError = 'Connexion trop lente. Vérifiez votre connexion ou réessayez.'
        setError(timeoutError)
        return { success: false, error: timeoutError }
      }
      
      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        const networkError = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.'
        setError(networkError)
        return { success: false, error: networkError }
      }
      
      const errorMessage = error.response?.data?.error?.message || error.message || 'Login failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      setError(null)

      // Import the authService dynamically to avoid circular dependencies
      const { authService } = await import('@/lib/services/authService')
      const result = await authService.signInWithGoogle()
      
      if (result.success && result.data) {
        const { user: userData, tokens } = result.data
        
        // Create session data
        const sessionData = {
          user: userData,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes from now
          lastActivity: Date.now()
        }

        // Set user immediately for faster redirect
        setUser(userData)
        
        // Update cookies to sync with session
        updateAuthCookies(userData)
        
        // Save session in background (non-blocking)
        SessionManager.saveSession(sessionData).catch(error => {
          console.error('Failed to save session:', error)
        })
        
        // Don't redirect here - let the login page handle it
        // This prevents race conditions with multiple redirects
        
        return { success: true, user: userData }
      } else {
        // Handle specific popup blocked error
        if (result.error?.code === 'auth/popup-blocked') {
          const errorMessage = 'Pop-up bloqué. Veuillez autoriser les pop-ups pour ce site et réessayer.'
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }
        
        const errorMessage = result.error?.message || 'Google login failed'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Google login failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async (logoutFromAllDevices = false) => {
    try {
      setLoading(true)
      setError(null)

      // Get current user role before clearing session
      const currentUser = user
      const userRole = currentUser?.role || 'STUDENT'

      // Get current session
      const session = SessionManager.getCurrentSession()
      
      if (session?.refreshToken) {
        // Call appropriate logout endpoint
        if (logoutFromAllDevices) {
          await apiClient.post('/auth/logout-all')
        } else {
          await apiClient.post('/auth/logout', { refreshToken: session.refreshToken })
        }
      }
    } catch (error: any) {
      console.error('Logout error:', error)
      // Continue with local cleanup even if API call fails
    } finally {
      // Clear session and all local state
      await SessionManager.clearSession()
      setUser(null)
      setError(null)
      updateAuthCookies(null)
      setLoading(false)
      
      if (typeof document !== 'undefined') {
        // Redirect based on user role
        const userRole = user?.role || 'STUDENT'
        if (userRole === 'ADMIN') {
          window.location.href = '/admin/login'
        } else if (userRole === 'SENIOR_MANAGER' || userRole === 'JUNIOR_MANAGER') {
          window.location.href = '/manager'
        } else {
          // Students and regular users go to /connexion
          // Keep hasAccount=1 so user gets redirected to /connexion next time
          // This preserves the "user has an account" state even after logout
          window.location.href = '/connexion'
        }
      }
    }
  }

  const register = async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
    country?: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      // Use token-aware helper so Authorization header is set globally
      const response = await apiClient.register(userData)
      
      if (response.success && response.data) {
        const { user: newUser, tokens } = response.data as any

        // Also persist a structured session for our SessionManager consumers
        const sessionData = {
          user: newUser,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: Date.now() + (15 * 60 * 1000),
          lastActivity: Date.now()
        }
        await SessionManager.saveSession(sessionData)

        setUser(newUser)
        updateAuthCookies(newUser)
        
        return { success: true, user: newUser }
      } else {
        const errorMessage = response.error?.message || 'Registration failed'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Registration failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const hasSubscriptionTier = (tiers: string[]): boolean => {
    if (!user) return false
    return tiers.includes(user.subscriptionTier)
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    mounted,
    login,
    signInWithGoogle,
    logout,
    register,
    checkAuthStatus,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isManager: user?.role === 'SENIOR_MANAGER' || user?.role === 'JUNIOR_MANAGER',
    isStudent: user ? ['USER', 'STUDENT'].includes(user.role) : false,
    hasRole,
    hasSubscriptionTier,
    logoutFromAllDevices: () => logout(true)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

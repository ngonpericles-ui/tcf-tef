/**
 * Enhanced Authentication Hook with Google Auth and Role-Based Access Control
 * Handles authentication state and route protection
 */

"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authService, User } from '../lib/services/authService'

export interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isStudent: boolean
  isAdminOrManager: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: any) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkRole: (allowedRoles: string[]) => boolean
  redirectBasedOnRole: () => void
}

export const useEnhancedAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = () => {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)
      setIsLoading(false)
    }

    initializeAuth()

    // Listen to auth state changes
    const unsubscribe = authService.onAuthStateChange((newUser) => {
      setUser(newUser)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await authService.login({ email, password })
      
      if (result.success && result.data) {
        setUser(result.data.user)
        return { success: true, user: result.data.user, redirectPath: getRedirectPath(result.data.user.role) }
      } else {
        return {
          success: false,
          error: result.error?.message || 'Erreur de connexion'
        }
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Erreur de connexion' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Register function
  const register = useCallback(async (data: any) => {
    setIsLoading(true)
    try {
      const result = await authService.register(data)
      
      if (result.success && result.data) {
        setUser(result.data.user)
        return { success: true }
      } else {
        return { 
          success: false, 
          error: result.error?.message || 'Erreur d\'inscription' 
        }
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Erreur d\'inscription' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Google login function
  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await authService.signInWithGoogle()
      
      if (result.success && result.data) {
        setUser(result.data.user)
        return { success: true, user: result.data.user, redirectPath: getRedirectPath(result.data.user.role) }
      } else {
        return {
          success: false,
          error: result.error?.message || 'Erreur de connexion Google'
        }
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Erreur de connexion Google' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Admin login function
  const adminLogin = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await authService.adminLogin({ email, password })
      
      if (result.success && result.data) {
        setUser(result.data.user)
        return { success: true }
      } else {
        return { 
          success: false, 
          error: result.error?.message || 'Erreur de connexion administrateur' 
        }
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Erreur de connexion administrateur' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.logout()
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // Check if user has required role
  const checkRole = useCallback((allowedRoles: string[]): boolean => {
    if (!user) return false
    return allowedRoles.includes(user.role)
  }, [user])

  // Redirect based on user role
  const redirectBasedOnRole = useCallback((userOverride?: any) => {
    const currentUser = userOverride || user

    if (!currentUser) {
      console.log('No user found for redirection')
      router.replace('/')
      return
    }

    console.log('Redirecting user with role:', currentUser.role)

    switch (currentUser.role) {
      case 'USER':
      case 'STUDENT':
        console.log('Redirecting student to /home')
        router.replace('/home')
        break
      case 'ADMIN':
        console.log('Redirecting admin to /admin')
        router.replace('/admin')
        break
      case 'SENIOR_MANAGER':
      case 'JUNIOR_MANAGER':
        console.log('Redirecting manager to /manager/dashboard')
        router.replace('/manager/dashboard')
        break
      default:
        console.log('Unknown role, redirecting to /')
        router.replace('/')
    }
  }, [user, router])

  // Get redirect path for a user role
  const getRedirectPath = useCallback((userRole: string) => {
    switch (userRole) {
      case 'USER':
      case 'STUDENT':
        return '/home'
      case 'ADMIN':
        return '/admin'
      case 'SENIOR_MANAGER':
      case 'JUNIOR_MANAGER':
        return '/manager/dashboard'
      default:
        return '/'
    }
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isStudent: user ? ['USER', 'STUDENT'].includes(user.role) : false,
    isAdminOrManager: user ? ['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(user.role) : false,
    login,
    register,
    loginWithGoogle,
    adminLogin,
    logout,
    checkRole,
    redirectBasedOnRole,
    getRedirectPath
  }
}

/**
 * Hook for protecting routes based on user role
 */
export const useRoleProtection = (allowedRoles: string[], redirectTo: string = '/') => {
  const { user, isLoading, checkRole } = useEnhancedAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(redirectTo)
        return
      }

      if (!checkRole(allowedRoles)) {
        // Redirect based on user role
        switch (user.role) {
          case 'USER':
          case 'STUDENT':
            router.push('/home')
            break
          case 'ADMIN':
            router.push('/admin')
            break
          case 'SENIOR_MANAGER':
          case 'JUNIOR_MANAGER':
            router.push('/manager/dashboard')
            break
          default:
            router.push('/')
        }
      }
    }
  }, [user, isLoading, checkRole, allowedRoles, router, redirectTo])

  return { user, isLoading, hasAccess: user ? checkRole(allowedRoles) : false }
}

/**
 * Hook for student-only pages
 */
export const useStudentProtection = () => {
  return useRoleProtection(['USER', 'STUDENT'], '/')
}

/**
 * Hook for admin/manager pages
 */
export const useAdminProtection = () => {
  return useRoleProtection(['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'], '/')
}

/**
 * Hook for admin-only pages
 */
export const useAdminOnlyProtection = () => {
  return useRoleProtection(['ADMIN'], '/')
}

export default useEnhancedAuth

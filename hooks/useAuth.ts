"use client"

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'STUDENT' | 'JUNIOR_MANAGER' | 'SENIOR_MANAGER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  subscriptionTier: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  profileImage?: string
  phone?: string
  country?: string
  createdAt: string
  updatedAt: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if we have tokens in localStorage
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      
      if (!accessToken) {
        setUser(null)
        setLoading(false)
        return
      }

      // Try to get user profile to verify token is valid
      const response = await apiClient.get('/auth/profile')
      
      if (response.success && response.data) {
        setUser((response.data as any).user || response.data)
      } else {
        // Token might be invalid, clear it
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
        setUser(null)
      }
    } catch (error: any) {
      console.error('Auth check failed:', error)
      setError(error.message || 'Authentication check failed')
      
      // Clear invalid tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.post('/auth/login', { email, password })
      
      if (response.success && response.data) {
        const { user: userData, tokens } = response.data as any
        
        // Store tokens
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken)
          localStorage.setItem('refreshToken', tokens.refreshToken)
        }
        
        setUser(userData)
        return { success: true, user: userData }
      } else {
        const errorMessage = response.error?.message || 'Login failed'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Login failed'
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

      // Get current tokens
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null
      
      if (refreshToken) {
        // Call appropriate logout endpoint
        if (logoutFromAllDevices) {
          await apiClient.post('/auth/logout-all')
        } else {
          await apiClient.post('/auth/logout', { refreshToken })
        }
      }
    } catch (error: any) {
      console.error('Logout error:', error)
      // Continue with local cleanup even if API call fails
    } finally {
      // Clear all local state and tokens
      setUser(null)
      setError(null)
      setLoading(false)
      
      if (typeof window !== 'undefined') {
        // Clear all auth-related data
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('userRole')
        localStorage.removeItem('managerRole')
        
        // Clear any other user-related data
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('user_') || key.startsWith('auth_')) {
            localStorage.removeItem(key)
          }
        })
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

      const response = await apiClient.post('/auth/register', userData)
      
      if (response.success && response.data) {
        const { user: newUser, tokens } = response.data as any
        
        // Store tokens
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken)
          localStorage.setItem('refreshToken', tokens.refreshToken)
        }
        
        setUser(newUser)
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

  return {
    user,
    loading,
    error,
    login,
    logout,
    register,
    checkAuthStatus,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isManager: user?.role === 'SENIOR_MANAGER' || user?.role === 'JUNIOR_MANAGER',
    isStudent: user ? ['USER', 'STUDENT'].includes(user.role) : false,
    // Enhanced logout functionality
    logoutFromAllDevices: () => logout(true)
  }
}

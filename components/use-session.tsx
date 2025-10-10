"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export interface SessionUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'STUDENT' | 'JUNIOR_MANAGER' | 'SENIOR_MANAGER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  subscriptionTier: 'FREE' | 'ESSENTIAL' | 'PREMIUM' | 'PRO'
  profileImage?: string
  phone?: string
  country?: string
  createdAt: string
  updatedAt: string
}

export function useSession() {
  const { user, loading, isAuthenticated, login, logout, register } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Mark as ready when auth context is no longer loading
    if (!loading) {
      setReady(true)
    }
  }, [loading])

  return {
    user: user as SessionUser | null,
    loading,
    ready,
    isAuthenticated,
    login,
    logout,
    register
  }
}
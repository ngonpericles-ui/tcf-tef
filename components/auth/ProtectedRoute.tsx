"use client"

import { ReactNode, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: string[]
  requiredSubscriptionTiers?: string[]
  redirectTo?: string
  fallback?: ReactNode
  allowUnauthenticated?: boolean
}

export default function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredSubscriptionTiers = [],
  redirectTo = '/connexion',
  fallback,
  allowUnauthenticated = false
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated, hasRole, hasSubscriptionTier } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return

    // If authentication is not required, allow access
    if (allowUnauthenticated) {
      setIsChecking(false)
      return
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.replace(redirectTo)
      return
    }

    // Check role requirements
    if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
      // Redirect based on user role to appropriate dashboard
      if (user?.role === 'ADMIN') {
        router.replace('/admin')
      } else if (user?.role === 'SENIOR_MANAGER' || user?.role === 'JUNIOR_MANAGER') {
        router.replace('/manager/dashboard')
      } else if (user?.role === 'USER') {
        router.replace('/home')
      } else {
        router.replace('/welcome')
      }
      return
    }

    // Check subscription tier requirements
    if (requiredSubscriptionTiers.length > 0 && !hasSubscriptionTier(requiredSubscriptionTiers)) {
      router.replace('/subscription')
      return
    }

    // All checks passed
    setIsChecking(false)
  }, [loading, isAuthenticated, user, hasRole, hasSubscriptionTier, router, redirectTo, requiredRoles, requiredSubscriptionTiers, allowUnauthenticated])

  // Show loading while checking authentication
  if (loading || isChecking) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If not authenticated and authentication is required, don't render
  if (!allowUnauthenticated && !isAuthenticated) {
    return null
  }

  // Render the children
  return <>{children}</>
}
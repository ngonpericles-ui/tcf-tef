"use client"

import { ComponentType, ReactNode, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface WithAuthClientOptions {
  requiredRoles?: string[]
  requiredSubscriptionTiers?: string[]
  redirectTo?: string
  fallback?: ReactNode
  allowUnauthenticated?: boolean
}

export default function withAuthClient<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthClientOptions = {}
) {
  const {
    requiredRoles = [],
    requiredSubscriptionTiers = [],
    redirectTo = '/connexion',
    fallback,
    allowUnauthenticated = false
  } = options

  const AuthenticatedComponent = (props: P) => {
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
        // Redirect based on user role
        if (user?.role === 'ADMIN') {
          router.replace('/admin')
        } else if (user?.role === 'SENIOR_MANAGER' || user?.role === 'JUNIOR_MANAGER') {
          router.replace('/manager/dashboard')
        } else if (['USER', 'STUDENT'].includes(user?.role || '')) {
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

    // Render the wrapped component
    return <WrappedComponent {...props} />
  }

  // Set display name for debugging
  AuthenticatedComponent.displayName = `withAuthClient(${WrappedComponent.displayName || WrappedComponent.name})`

  return AuthenticatedComponent
}

// Convenience HOCs for common use cases
export const withStudentAuth = <P extends object>(WrappedComponent: ComponentType<P>) =>
  withAuthClient(WrappedComponent, { requiredRoles: ['STUDENT'] })

export const withManagerAuth = <P extends object>(WrappedComponent: ComponentType<P>) =>
  withAuthClient(WrappedComponent, { requiredRoles: ['JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN'] })

export const withAdminAuth = <P extends object>(WrappedComponent: ComponentType<P>) =>
  withAuthClient(WrappedComponent, { requiredRoles: ['ADMIN'] })

export const withPremiumAuth = <P extends object>(WrappedComponent: ComponentType<P>) =>
  withAuthClient(WrappedComponent, { requiredSubscriptionTiers: ['PREMIUM', 'PRO'] })

export const withPaidAuth = <P extends object>(WrappedComponent: ComponentType<P>) =>
  withAuthClient(WrappedComponent, { requiredSubscriptionTiers: ['ESSENTIAL', 'PREMIUM', 'PRO'] })

export const withPublicAuth = <P extends object>(WrappedComponent: ComponentType<P>) =>
  withAuthClient(WrappedComponent, { allowUnauthenticated: true })

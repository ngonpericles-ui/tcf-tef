"use client"

import { ComponentType, ReactNode } from 'react'
import ProtectedRoute from './ProtectedRoute'

interface WithAuthOptions {
  requiredRoles?: string[]
  requiredSubscriptionTiers?: string[]
  redirectTo?: string
  fallback?: ReactNode
}

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    requiredRoles = [],
    requiredSubscriptionTiers = [],
    redirectTo = '/connexion',
    fallback
  } = options

  const AuthenticatedComponent = (props: P) => {
    return (
      <ProtectedRoute
        requiredRoles={requiredRoles}
        requiredSubscriptionTiers={requiredSubscriptionTiers}
        redirectTo={redirectTo}
        fallback={fallback}
      >
        <WrappedComponent {...props} />
      </ProtectedRoute>
    )
  }

  // Set display name for debugging
  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`

  return AuthenticatedComponent
}

// Convenience HOCs for common use cases
export const withAdminAuth = <P extends object>(WrappedComponent: ComponentType<P>) =>
  withAuth(WrappedComponent, { requiredRoles: ['ADMIN'] })

export const withManagerAuth = <P extends object>(WrappedComponent: ComponentType<P>) =>
  withAuth(WrappedComponent, { requiredRoles: ['JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN'] })

export const withStudentAuth = <P extends object>(WrappedComponent: ComponentType<P>) =>
  withAuth(WrappedComponent, { requiredRoles: ['STUDENT', 'JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN'] })

export const withPremiumAuth = <P extends object>(WrappedComponent: ComponentType<P>) =>
  withAuth(WrappedComponent, { requiredSubscriptionTiers: ['PREMIUM', 'PRO'] })

export const withPaidAuth = <P extends object>(WrappedComponent: ComponentType<P>) =>
  withAuth(WrappedComponent, { requiredSubscriptionTiers: ['ESSENTIAL', 'PREMIUM', 'PRO'] })

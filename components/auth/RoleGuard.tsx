"use client"

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface RoleGuardProps {
  allowedRoles: string[]
  allowedSubscriptionTiers?: string[]
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean // If true, user must have ALL roles/tiers, not just one
}

export default function RoleGuard({
  allowedRoles,
  allowedSubscriptionTiers = [],
  children,
  fallback,
  requireAll = false
}: RoleGuardProps) {
  const { user, hasRole, hasSubscriptionTier, isAuthenticated } = useAuth()

  // Don't render anything if not authenticated
  if (!isAuthenticated || !user) {
    return fallback || null
  }

  // Check role requirements
  const hasRequiredRole = requireAll 
    ? allowedRoles.every(role => hasRole([role]))
    : hasRole(allowedRoles)

  // Check subscription tier requirements
  const hasRequiredTier = allowedSubscriptionTiers.length === 0 || (
    requireAll
      ? allowedSubscriptionTiers.every(tier => hasSubscriptionTier([tier]))
      : hasSubscriptionTier(allowedSubscriptionTiers)
  )

  // Render children if all requirements are met
  if (hasRequiredRole && hasRequiredTier) {
    return <>{children}</>
  }

  // Render fallback if requirements not met
  return fallback || null
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['ADMIN']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function ManagerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function StudentOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['STUDENT']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function PremiumOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard 
      allowedRoles={[]}
      allowedSubscriptionTiers={['PREMIUM', 'PRO']} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

export function PaidOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard 
      allowedRoles={[]}
      allowedSubscriptionTiers={['ESSENTIAL', 'PREMIUM', 'PRO']} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

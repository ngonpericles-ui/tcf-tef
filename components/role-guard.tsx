"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Shield,
  Lock,
  CreditCard,
  Home
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useSharedData } from "@/components/shared-data-provider"
import {
  RoleAccessService,
  type UserRole,
  type SubscriptionTier,
  type SectionType,
  type PermissionType,
  type UserAccessContext,
  type AccessCheckResult
} from "@/lib/services/roleAccessService"
import { cn } from "@/lib/utils"

// Legacy interface for backward compatibility
interface LegacyRoleGuardProps {
  allowedRoles: string[]
  currentRole?: string
  children: ReactNode
}

// New comprehensive interface
interface RoleGuardProps {
  children: ReactNode
  requiredRole?: UserRole[]
  requiredSubscription?: SubscriptionTier[]
  requiredPermissions?: PermissionType[]
  requiredSection?: SectionType
  requiredFeature?: string
  fallbackComponent?: ReactNode
  redirectTo?: string
  showUpgrade?: boolean
  className?: string
  // Legacy props for backward compatibility
  allowedRoles?: string[]
  currentRole?: string
}

export default function RoleGuard(props: RoleGuardProps | LegacyRoleGuardProps) {
  // Check if using legacy props
  const isLegacy = 'allowedRoles' in props && !('requiredRole' in props)

  if (isLegacy) {
    return <LegacyRoleGuard {...props as LegacyRoleGuardProps} />
  }

  return <ModernRoleGuard {...props as RoleGuardProps} />
}

// Legacy role guard for backward compatibility
function LegacyRoleGuard({ allowedRoles, currentRole, children }: LegacyRoleGuardProps) {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Always set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    // Try to get role from localStorage, but don't wait for it
    if (typeof window !== "undefined") {
      try {
        const storedRole = localStorage.getItem("managerRole")
        const roleToUse = currentRole || storedRole || "junior"
        setUserRole(roleToUse)
        setIsLoading(false)
        clearTimeout(timeout)
      } catch (error) {
        console.error("Error accessing localStorage:", error)
        setUserRole("junior")
        setIsLoading(false)
        clearTimeout(timeout)
      }
    } else {
      // Server-side rendering
      setUserRole(currentRole || "junior")
      setIsLoading(false)
      clearTimeout(timeout)
    }

    return () => clearTimeout(timeout)
  }, [currentRole])

  // Show loading for a short time
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  // Check if user role is allowed
  if (!userRole || !allowedRoles.includes(userRole)) {
    // Redirect to unauthorized page
    router.replace("/unauthorized")
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Redirecting...</div>
      </div>
    )
  }

  return <>{children}</>
}

// Modern role guard with comprehensive access control
function ModernRoleGuard({
  children,
  requiredRole,
  requiredSubscription,
  requiredPermissions,
  requiredSection,
  requiredFeature,
  fallbackComponent,
  redirectTo,
  showUpgrade = true,
  className = ""
}: Omit<RoleGuardProps, 'allowedRoles' | 'currentRole'>) {
  const { t } = useLanguage()
  const router = useRouter()
  const { userProfile, loading } = useSharedData()

  const [accessResult, setAccessResult] = useState<AccessCheckResult | null>(null)
  const [checking, setChecking] = useState(true)

  // Check access when component mounts or dependencies change
  useEffect(() => {
    const checkAccess = async () => {
      if (!userProfile || loading) return

      setChecking(true)

      try {
        const userContext: UserAccessContext = {
          userId: userProfile.id,
          role: userProfile.role,
          subscriptionTier: userProfile.subscriptionTier,
          permissions: RoleAccessService.getRolePermissions(userProfile.role),
          currentSection: getCurrentSection(),
          sessionData: {
            loginTime: userProfile.lastLoginAt,
            lastActivity: new Date().toISOString(),
            ipAddress: undefined, // Would be provided by backend
            userAgent: navigator.userAgent,
            location: undefined // Would be provided by geolocation
          },
          preferences: {
            language: userProfile.preferences.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }

        let result: AccessCheckResult = { allowed: true }

        // Check role requirements
        if (requiredRole && !requiredRole.includes(userProfile.role)) {
          result = {
            allowed: false,
            reason: 'Rôle insuffisant pour accéder à cette ressource',
            reasonEn: 'Insufficient role to access this resource',
            requiredRole
          }
        }

        // Check subscription requirements
        if (result.allowed && requiredSubscription && !requiredSubscription.includes(userProfile.subscriptionTier)) {
          result = {
            allowed: false,
            reason: 'Abonnement insuffisant pour accéder à cette fonctionnalité',
            reasonEn: 'Insufficient subscription to access this feature',
            requiredSubscription,
            upgradeUrl: '/abonnement'
          }
        }

        // Check section access
        if (result.allowed && requiredSection) {
          result = await RoleAccessService.checkSectionAccess(userContext, requiredSection)
        }

        // Check permissions
        if (result.allowed && requiredPermissions) {
          for (const permission of requiredPermissions) {
            const permResult = await RoleAccessService.checkPermission(userContext, permission)
            if (!permResult.allowed) {
              result = permResult
              break
            }
          }
        }

        // Check feature access
        if (result.allowed && requiredFeature) {
          result = await RoleAccessService.checkFeatureAccess(userContext, requiredFeature)
        }

        setAccessResult(result)
      } catch (error) {
        console.error('Error checking access:', error)
        setAccessResult({
          allowed: false,
          reason: 'Erreur lors de la vérification des accès',
          reasonEn: 'Error checking access permissions'
        })
      } finally {
        setChecking(false)
      }
    }

    checkAccess()
  }, [userProfile, loading, requiredRole, requiredSubscription, requiredPermissions, requiredSection, requiredFeature])

  // Get current section from URL
  const getCurrentSection = (): SectionType => {
    if (typeof window === 'undefined') return 'student'

    const pathname = window.location.pathname
    if (pathname.startsWith('/admin')) return 'admin'
    if (pathname.startsWith('/manager')) return 'manager'
    return 'student'
  }

  // Handle redirect
  const handleRedirect = () => {
    if (redirectTo) {
      router.push(redirectTo)
    } else {
      router.push('/home')
    }
  }

  // Handle upgrade
  const handleUpgrade = () => {
    router.push(accessResult?.upgradeUrl || '/abonnement')
  }

  // Show loading state
  if (loading || checking) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  // Show access denied
  if (!accessResult?.allowed) {
    return (
      <div className={cn("max-w-md mx-auto", className)}>
        <Card className="border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              {accessResult?.requiredSubscription ? (
                <Lock className="h-6 w-6 text-destructive" />
              ) : (
                <Shield className="h-6 w-6 text-destructive" />
              )}
            </div>
            <CardTitle className="text-destructive">
              {t('Accès refusé', 'Access Denied')}
            </CardTitle>
            <CardDescription>
              {t(
                accessResult?.reason || 'Vous n\'avez pas les permissions nécessaires',
                accessResult?.reasonEn || 'You don\'t have the necessary permissions'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {/* Upgrade Button */}
              {showUpgrade && accessResult?.upgradeUrl && (
                <Button onClick={handleUpgrade} className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t('Mettre à niveau', 'Upgrade')}
                </Button>
              )}

              {/* Go Home Button */}
              <Button variant="outline" onClick={handleRedirect} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                {t('Retour à l\'accueil', 'Go to Home')}
              </Button>

              {/* Fallback Component */}
              {fallbackComponent && (
                <div className="mt-4">
                  {fallbackComponent}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Access granted - render children
  return <div className={className}>{children}</div>
}

// Specialized role guards for common use cases
export function StudentRoleGuard({ children, ...props }: Omit<RoleGuardProps, 'requiredRole' | 'allowedRoles' | 'currentRole'>) {
  return (
    <RoleGuard requiredRole={['STUDENT', 'JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN']} {...props}>
      {children}
    </RoleGuard>
  )
}

export function ManagerRoleGuard({ children, ...props }: Omit<RoleGuardProps, 'requiredRole' | 'allowedRoles' | 'currentRole'>) {
  return (
    <RoleGuard requiredRole={['JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN']} {...props}>
      {children}
    </RoleGuard>
  )
}

export function AdminRoleGuard({ children, ...props }: Omit<RoleGuardProps, 'requiredRole' | 'allowedRoles' | 'currentRole'>) {
  return (
    <RoleGuard requiredRole={['ADMIN']} {...props}>
      {children}
    </RoleGuard>
  )
}

export function SubscriptionGuard({
  children,
  tier,
  ...props
}: Omit<RoleGuardProps, 'requiredSubscription' | 'allowedRoles' | 'currentRole'> & { tier: SubscriptionTier[] }) {
  return (
    <RoleGuard requiredSubscription={tier} {...props}>
      {children}
    </RoleGuard>
  )
}

export function FeatureGuard({
  children,
  feature,
  ...props
}: Omit<RoleGuardProps, 'requiredFeature' | 'allowedRoles' | 'currentRole'> & { feature: string }) {
  return (
    <RoleGuard requiredFeature={feature} {...props}>
      {children}
    </RoleGuard>
  )
}

// Hook for checking access in components
export function useRoleAccess() {
  const { userProfile } = useSharedData()

  const checkAccess = async (requirements: {
    role?: UserRole[]
    subscription?: SubscriptionTier[]
    permissions?: PermissionType[]
    section?: SectionType
    feature?: string
  }) => {
    if (!userProfile) return { allowed: false, reason: 'User not loaded' }

    const userContext: UserAccessContext = {
      userId: userProfile.id,
      role: userProfile.role,
      subscriptionTier: userProfile.subscriptionTier,
      permissions: RoleAccessService.getRolePermissions(userProfile.role),
      currentSection: 'student', // Default
      sessionData: {
        loginTime: userProfile.lastLoginAt,
        lastActivity: new Date().toISOString()
      },
      preferences: {
        language: userProfile.preferences.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    }

    // Check role
    if (requirements.role && !requirements.role.includes(userProfile.role)) {
      return {
        allowed: false,
        reason: 'Insufficient role',
        requiredRole: requirements.role
      }
    }

    // Check subscription
    if (requirements.subscription && !requirements.subscription.includes(userProfile.subscriptionTier)) {
      return {
        allowed: false,
        reason: 'Insufficient subscription',
        requiredSubscription: requirements.subscription
      }
    }

    // Check section
    if (requirements.section) {
      return await RoleAccessService.checkSectionAccess(userContext, requirements.section)
    }

    // Check feature
    if (requirements.feature) {
      return await RoleAccessService.checkFeatureAccess(userContext, requirements.feature)
    }

    return { allowed: true }
  }

  const hasRole = (roles: UserRole[]) => {
    return userProfile ? roles.includes(userProfile.role) : false
  }

  const hasSubscription = (tiers: SubscriptionTier[]) => {
    return userProfile ? tiers.includes(userProfile.subscriptionTier) : false
  }

  const getAccessibleSections = () => {
    return userProfile ? RoleAccessService.getAccessibleSections(userProfile.role) : ['student']
  }

  return {
    userProfile,
    checkAccess,
    hasRole,
    hasSubscription,
    getAccessibleSections
  }
}

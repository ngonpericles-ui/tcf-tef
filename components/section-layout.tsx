"use client"

import { ReactNode, Suspense } from "react"
import { usePathname } from "next/navigation"
import UnifiedNavigation from "@/components/unified-navigation"
import BreadcrumbNavigation from "@/components/breadcrumb-navigation"
import FloatingAIButton from "@/components/ai-chat/floating-ai-button"
import { useLanguage } from "@/components/language-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserRole, SubscriptionTier } from "@/lib/services/navigationService"

interface SectionLayoutProps {
  children: ReactNode
  userRole: UserRole
  subscriptionTier: SubscriptionTier
  currentSection: 'student' | 'manager' | 'admin'
  userName?: string
  userEmail?: string
  notificationCount?: number
  messageCount?: number
  showBreadcrumbs?: boolean
  showAIAssistant?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  className?: string
  contentClassName?: string
  requiresAuth?: boolean
  requiredRole?: UserRole[]
  requiredSubscription?: SubscriptionTier[]
  fallbackComponent?: ReactNode
}

export default function SectionLayout({
  children,
  userRole,
  subscriptionTier,
  currentSection,
  userName = "User",
  userEmail = "user@example.com",
  notificationCount = 0,
  messageCount = 0,
  showBreadcrumbs = true,
  showAIAssistant = true,
  maxWidth = 'full',
  className = "",
  contentClassName = "",
  requiresAuth = true,
  requiredRole,
  requiredSubscription,
  fallbackComponent
}: SectionLayoutProps) {
  const { t } = useLanguage()
  const pathname = usePathname()

  // Check role requirements
  const hasRoleAccess = !requiredRole || requiredRole.includes(userRole)
  
  // Check subscription requirements
  const hasSubscriptionAccess = !requiredSubscription || requiredSubscription.includes(subscriptionTier)

  // Get container max width class
  const getMaxWidthClass = (width: string) => {
    const widthClasses = {
      'sm': 'max-w-sm',
      'md': 'max-w-md',
      'lg': 'max-w-4xl',
      'xl': 'max-w-6xl',
      '2xl': 'max-w-7xl',
      'full': 'max-w-none'
    }
    return widthClasses[width as keyof typeof widthClasses] || 'max-w-none'
  }

  // Show access denied if user doesn't have required permissions
  if (!hasRoleAccess || !hasSubscriptionAccess) {
    return (
      <div className="min-h-screen bg-background">
        <UnifiedNavigation
          userRole={userRole}
          subscriptionTier={subscriptionTier}
          currentSection={currentSection}
          userName={userName}
          userEmail={userEmail}
          notificationCount={notificationCount}
          messageCount={messageCount}
        />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-left">
                {!hasRoleAccess && (
                  <div className="mb-2">
                    <strong>{t("Accès refusé", "Access Denied")}</strong>
                    <p className="text-sm mt-1">
                      {t(
                        "Vous n'avez pas les permissions nécessaires pour accéder à cette section.",
                        "You don't have the necessary permissions to access this section."
                      )}
                    </p>
                  </div>
                )}
                {!hasSubscriptionAccess && (
                  <div>
                    <strong>{t("Abonnement requis", "Subscription Required")}</strong>
                    <p className="text-sm mt-1">
                      {t(
                        "Cette fonctionnalité nécessite un abonnement premium.",
                        "This feature requires a premium subscription."
                      )}
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
            
            {fallbackComponent && (
              <div className="mt-6">
                {fallbackComponent}
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Unified Navigation */}
      <UnifiedNavigation
        userRole={userRole}
        subscriptionTier={subscriptionTier}
        currentSection={currentSection}
        userName={userName}
        userEmail={userEmail}
        notificationCount={notificationCount}
        messageCount={messageCount}
      />

      {/* Main Content */}
      <main className={cn("flex-1", contentClassName)}>
        {/* Breadcrumbs */}
        {showBreadcrumbs && (
          <div className="border-b bg-muted/30">
            <div className={cn("container mx-auto px-4 py-3", getMaxWidthClass(maxWidth))}>
              <BreadcrumbNavigation />
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className={cn("container mx-auto px-4 py-6", getMaxWidthClass(maxWidth))}>
          <Suspense fallback={<SectionLayoutSkeleton />}>
            {children}
          </Suspense>
        </div>
      </main>

      {/* Floating AI Assistant */}
      {showAIAssistant && <FloatingAIButton />}
    </div>
  )
}

// Loading skeleton for section layout
function SectionLayoutSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>

      {/* Additional content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    </div>
  )
}

// Specialized layout variants for different sections
export function StudentSectionLayout(props: Omit<SectionLayoutProps, 'currentSection'>) {
  return (
    <SectionLayout
      {...props}
      currentSection="student"
      maxWidth="xl"
      showAIAssistant={true}
    />
  )
}

export function ManagerSectionLayout(props: Omit<SectionLayoutProps, 'currentSection'>) {
  return (
    <SectionLayout
      {...props}
      currentSection="manager"
      maxWidth="full"
      requiredRole={['JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN']}
      showAIAssistant={true}
    />
  )
}

export function AdminSectionLayout(props: Omit<SectionLayoutProps, 'currentSection'>) {
  return (
    <SectionLayout
      {...props}
      currentSection="admin"
      maxWidth="full"
      requiredRole={['ADMIN']}
      showAIAssistant={true}
    />
  )
}

// Hook for getting current section info
export function useCurrentSection(): {
  section: 'student' | 'manager' | 'admin' | 'unknown'
  isStudentSection: boolean
  isManagerSection: boolean
  isAdminSection: boolean
} {
  const pathname = usePathname()
  
  let section: 'student' | 'manager' | 'admin' | 'unknown' = 'unknown'
  
  if (pathname.startsWith('/admin')) {
    section = 'admin'
  } else if (pathname.startsWith('/manager') || pathname.startsWith('/senior-manager') || pathname.startsWith('/junior-manager')) {
    section = 'manager'
  } else {
    section = 'student'
  }
  
  return {
    section,
    isStudentSection: section === 'student',
    isManagerSection: section === 'manager',
    isAdminSection: section === 'admin'
  }
}

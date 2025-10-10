"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/components/use-session"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'ADMIN' | 'JUNIOR_MANAGER' | 'SENIOR_MANAGER' | 'USER'
  allowedRoles?: ('ADMIN' | 'JUNIOR_MANAGER' | 'SENIOR_MANAGER' | 'USER')[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  allowedRoles, 
  redirectTo = '/welcome' 
}: ProtectedRouteProps) {
  const { user, ready, isAuthenticated } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!ready) return

    // Not authenticated - redirect to appropriate login page
    if (!isAuthenticated) {
      // Prevent circular redirects
      const currentPath = window.location.pathname
      if (currentPath === redirectTo) {
        return // Don't redirect if already on the target page
      }
      
      // Redirect to appropriate login page based on current path
      if (currentPath.startsWith('/admin')) {
        router.replace('/admin/login')
      } else if (currentPath.startsWith('/manager')) {
        router.replace('/manager')
      } else {
        router.replace(redirectTo)
      }
      return
    }

    // Check role requirements
    if (requiredRole && user?.role !== requiredRole) {
      router.replace('/unauthorized')
      return
    }

    if (allowedRoles && !allowedRoles.includes(user?.role as any)) {
      router.replace('/unauthorized')
      return
    }
  }, [user, ready, isAuthenticated, requiredRole, allowedRoles, router, redirectTo])

  // Show loading while checking authentication
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Not authenticated or wrong role
  if (!isAuthenticated || 
      (requiredRole && user?.role !== requiredRole) ||
      (allowedRoles && !allowedRoles.includes(user?.role as any))) {
    return null
  }

  return <>{children}</>
}

// Specific protected route components
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="ADMIN" redirectTo="/admin/login">
      {children}
    </ProtectedRoute>
  )
}

export function ManagerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute 
      allowedRoles={['ADMIN', 'JUNIOR_MANAGER', 'SENIOR_MANAGER']} 
      redirectTo="/manager"
    >
      {children}
    </ProtectedRoute>
  )
}

export function UserRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute 
      allowedRoles={['ADMIN', 'JUNIOR_MANAGER', 'SENIOR_MANAGER', 'USER']} 
      redirectTo="/connexion"
    >
      {children}
    </ProtectedRoute>
  )
}

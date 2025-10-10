"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

interface RouteGuardProps {
  children: React.ReactNode
  requiredRoles?: string[]
  requireAuth?: boolean
  redirectTo?: string
  allowUnauthenticated?: boolean
}

export function RouteGuard({ 
  children, 
  requiredRoles = [], 
  requireAuth = true,
  redirectTo,
  allowUnauthenticated = false
}: RouteGuardProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (loading) return

    // If authentication is not required, allow access
    if (!requireAuth || allowUnauthenticated) {
      setIsAuthorized(true)
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Determine redirect based on the current path
      if (pathname.startsWith('/admin')) {
        router.replace('/admin/login')
      } else if (pathname.startsWith('/manager')) {
        router.replace('/manager')  // Manager login page is /manager
      } else {
        router.replace(redirectTo || '/connexion')  // Students go to /connexion
      }
      return
    }

    // Check role-based access
    if (requiredRoles.length > 0 && user) {
      const hasRequiredRole = requiredRoles.includes(user.role)
      if (!hasRequiredRole) {
        // Redirect based on user's actual role
        switch (user.role) {
          case 'ADMIN':
            router.replace('/admin')
            break
          case 'SENIOR_MANAGER':
          case 'JUNIOR_MANAGER':
            router.replace('/manager/dashboard')
            break
          case 'USER':
            router.replace('/accueil')
            break
          default:
            router.replace('/welcome')
        }
        return
      }
    }

    setIsAuthorized(true)
  }, [loading, isAuthenticated, user, requiredRoles, requireAuth, allowUnauthenticated, pathname, router, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}





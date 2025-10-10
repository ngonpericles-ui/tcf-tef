"use client"

import React, { useMemo, Suspense } from "react"
import { useState, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/contexts/AuthContext"
import { ManagerLogoutButton } from "@/components/auth/LogoutButton"
import NotificationIndicator from "@/components/notification-indicator"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BookOpen,
  Video,
  Users,
  Settings,
  Bell,
  User,
  Menu,
  X,
  Crown,
  Shield,
  BarChart3,
  Rss,
  UserPlus,
  Globe,
  Sun,
  Moon,
  MessageSquare,
  Store,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ManagerRole {
  role: "junior" | "content" | "senior" | "admin"
  name: string
  email: string
  permissions: {
    createCourses: boolean
    createTests: boolean
    createTestCorrections: boolean
    hostLiveSessions: boolean
    moderateContent: boolean
    manageUsers: boolean
    viewAnalytics: boolean
    exportData: boolean
  }
}

function ManagerLayoutInner({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, loading, isManager, isAdmin } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentManager, setCurrentManager] = useState<ManagerRole | null>(null)
  const [notificationCount, setNotificationCount] = useState(2)

  // Define all functions and memoized values BEFORE any conditional returns
  const getRoleInfo = useMemo(() => (role: string) => {
    switch (role) {
      case "admin":
        return {
          label: t("manager.role.admin", "Admin"),
          icon: Crown,
          color: "from-red-500 to-pink-600",
          bgColor: "bg-red-500/10",
          textColor: "text-red-400",
        }
      case "senior":
        return {
          label: t("manager.role.senior", "Senior Manager"),
          icon: Crown,
          color: "from-purple-500 to-pink-600",
          bgColor: "bg-purple-500/10",
          textColor: "text-purple-400",
        }
      case "content":
        return {
          label: t("manager.role.content", "Content Manager"),
          icon: BookOpen,
          color: "from-blue-500 to-cyan-600",
          bgColor: "bg-blue-500/10",
          textColor: "text-blue-400",
        }
      case "junior":
        return {
          label: t("manager.role.junior", "Junior Manager"),
          icon: User,
          color: "from-green-500 to-emerald-600",
          bgColor: "bg-green-500/10",
          textColor: "text-green-400",
        }
      default:
        return {
          label: t("manager.title", "Manager"),
          icon: User,
          color: "from-muted to-muted-foreground",
          bgColor: "bg-muted/10",
          textColor: "text-muted-foreground",
        }
    }
  }, [t])

  const navigationItems = useMemo(() => [
    {
      name: t("manager.nav.dashboard", "Dashboard"),
      href: "/manager/dashboard",
      icon: BarChart3,
      current: pathname === "/manager/dashboard",
    },
    {
      name: t("manager.nav.content", "Content"),
      href: "/manager/content",
      icon: BookOpen,
      current: pathname.startsWith("/manager/content"),
      show: currentManager?.permissions.createCourses || currentManager?.permissions.createTests,
    },
    {
      name: t("manager.nav.sessions", "Live Sessions"),
      href: "/manager/sessions",
      icon: Video,
      current: pathname.startsWith("/manager/sessions"),
      show: currentManager?.permissions.hostLiveSessions,
    },
    {
      name: t("manager.nav.students", "Students"),
      href: "/manager/students",
      icon: Users,
      current: pathname.startsWith("/manager/students"),
    },
    {
      name: t("manager.nav.feed", "My Feed"),
      href: "/manager/feed",
      icon: Rss,
      current: pathname.startsWith("/manager/feed"),
      show: currentManager?.permissions.createCourses || currentManager?.permissions.createTests,
    },
    {
      name: t("manager.nav.moderation", "Moderation"),
      href: "/manager/moderation",
      icon: Shield,
      current: pathname.startsWith("/manager/moderation"),
      show: currentManager?.permissions.moderateContent,
    },
    {
      name: t("manager.nav.analytics", "Analytics"),
      href: "/manager/analytics",
      icon: BarChart3,
      current: pathname.startsWith("/manager/analytics"),
      show: currentManager?.permissions.viewAnalytics,
    },
    {
      name: t("manager.nav.createManager", "Create Manager"),
      href: "/manager/create-manager",
      icon: UserPlus,
      current: pathname.startsWith("/manager/create-manager"),
      show: currentManager?.role === "senior",
    },
    {
      name: t("manager.nav.marketplace", "Marketplace"),
      href: "/manager/marketplace",
      icon: Store,
      current: pathname.startsWith("/manager/marketplace"),
      show: currentManager?.role === "senior" || currentManager?.role === "admin",
    },
    {
      name: t("manager.nav.settings", "Settings"),
      href: "/manager/settings",
      icon: Settings,
      current: pathname.startsWith("/manager/settings"),
    },
  ], [pathname, currentManager, t])

  const effectiveRole = currentManager?.role || "junior"
  const roleInfo = useMemo(() => getRoleInfo(effectiveRole), [effectiveRole, getRoleInfo])

  // useEffect for setting currentManager
  useEffect(() => {
    if (!loading && user && (isManager || isAdmin)) {
      // Map user role to manager role
      const managerRole = user.role === 'SENIOR_MANAGER' ? 'senior' : 
                         user.role === 'JUNIOR_MANAGER' ? 'junior' : 
                         user.role === 'ADMIN' ? 'admin' : 'junior'
      
      setCurrentManager({
        role: managerRole,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'Manager',
        email: user.email || '',
        permissions: {
          createCourses: true,
          createTests: true,
          createTestCorrections: true,
          hostLiveSessions: true,
          moderateContent: user.role === 'SENIOR_MANAGER' || user.role === 'ADMIN',
          manageUsers: user.role === 'SENIOR_MANAGER' || user.role === 'ADMIN',
          viewAnalytics: user.role === 'ADMIN',
          exportData: user.role === 'SENIOR_MANAGER' || user.role === 'ADMIN',
        },
      })
    }
  }, [loading, user, isManager, isAdmin])

  // If no authenticated manager/admin user, just render children (login page)
  if (!user || (!isManager && !isAdmin)) {
    return <>{children}</>
  }
  const bypass = pathname === "/manager"

  if (loading || !currentManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">{t("common.loading", "Loading...")}</div>
      </div>
    )
  }
  const RoleIcon = roleInfo.icon

  if (bypass) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">TCF-TEF Manager</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Manager Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", roleInfo.bgColor)}>
                <RoleIcon className={cn("w-6 h-6", roleInfo.textColor)} />
              </div>
              <div>
                <p className="font-medium text-foreground">{currentManager.name}</p>
                <Badge
                  variant="outline"
                  className={cn("text-xs", roleInfo.bgColor, roleInfo.textColor, "border-current")}
                >
                  {roleInfo.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              if (item.show === false) return null

              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    item.current
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  prefetch={false}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <ManagerLogoutButton
              className="w-full justify-start"
              showIcon={true}
              showText={true}
              confirmLogout={true}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-card border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t("manager.nav.search", "Search in manager...")}
                  className="w-96 px-4 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Globe className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">{(language || "fr").toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-gray-200 dark:border-gray-700">
                <DropdownMenuItem onClick={() => setLanguage("fr")} className="text-foreground hover:bg-muted">
                  Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")} className="text-foreground hover:bg-muted">
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-gray-200 dark:border-gray-700">
                <DropdownMenuItem onClick={() => setTheme("light")} className="text-foreground hover:bg-muted">
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="text-foreground hover:bg-muted">
                  Dark
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications and Messages */}
            <div className="flex items-center gap-1">
              <NotificationIndicator type="notifications" />
              <NotificationIndicator type="messages" />
            </div>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <User className="w-5 h-5 mr-2" />
                  <span className="hidden md:inline">{currentManager.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-gray-200 dark:border-gray-700">
                <DropdownMenuItem asChild>
                  <Link href="/manager/profile" className="text-foreground hover:bg-muted">
                    <User className="w-4 h-4 mr-2" />
                    {t("manager.settings.profile", "Profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/manager/settings" className="text-foreground hover:bg-muted">
                    <Settings className="w-4 h-4 mr-2" />
                    {t("manager.nav.settings", "Settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem asChild>
                  <div className="w-full">
                    <ManagerLogoutButton
                      size="sm"
                      className="w-full justify-start text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600"
                      showIcon={true}
                      showText={true}
                      confirmLogout={false}
                    />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

const ManagerLayout = React.memo(function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    }>
      <ManagerLayoutInner>{children}</ManagerLayoutInner>
    </Suspense>
  )
})

export default ManagerLayout
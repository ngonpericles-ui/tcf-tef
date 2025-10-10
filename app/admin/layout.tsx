"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCheck,
  Video,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Globe,
  ChevronDown,
  Sun,
  Moon,
  Rss,
  Shield,
  BarChart3,
  MessageSquare,
  Store,
} from "lucide-react"
import { Suspense } from "react"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AdminLogoutButton } from "@/components/auth/LogoutButton"
import { useAuth } from "@/contexts/AuthContext"
import NotificationIndicator from "@/components/notification-indicator"
// RouteGuard not used in admin layout - remove to avoid extra client code

const navigation = [
  { name: "Tableau de bord", nameEn: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Utilisateurs", nameEn: "Users", href: "/admin/users", icon: Users },
  { name: "Contenu", nameEn: "Content", href: "/admin/content", icon: BookOpen },
  { name: "Mon Feed", nameEn: "My Feed", href: "/admin/feed", icon: Rss },
  { name: "Managers", nameEn: "Managers", href: "/admin/managers", icon: UserCheck },
  { name: "Sessions Live", nameEn: "Live Sessions", href: "/admin/live-sessions", icon: Video },
  { name: "Étudiants", nameEn: "Students", href: "/admin/students", icon: Users },
  { name: "Modération", nameEn: "Moderation", href: "/admin/moderation", icon: Shield },
  { name: "Analytics", nameEn: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Marketplace", nameEn: "Marketplace", href: "/admin/marketplace", icon: Store },
  { name: "Abonnements", nameEn: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Paramètres", nameEn: "Settings", href: "/admin/settings", icon: Settings },
]

function AdminLayoutInner({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated, isAdmin, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    const hasAuthCookie = typeof document !== 'undefined' && document.cookie.includes('auth=1')

    // If authenticated admin hits /admin/login, redirect to dashboard
    if (isAuthenticated && isAdmin && pathname === "/admin/login") {
      router.replace('/admin')
      return
    }

    // If authenticated but not admin → force to login
    if (isAuthenticated && !isAdmin && pathname !== "/admin/login") {
      router.replace('/admin/login')
      return
    }

    // If unauthenticated and no cookie, keep them on login only
    if (!isAuthenticated && pathname !== "/admin/login") {
      router.replace('/admin/login')
    }
  }, [loading, isAuthenticated, isAdmin, pathname, router])

  if (pathname === "/admin/login") {
    return <Suspense fallback={null}>{children}</Suspense>
  }

  // Show loading while checking authentication
  if (loading || (!isAuthenticated && pathname !== "/admin/login")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show loading if not admin and not on login page
  if (!isAdmin && pathname !== "/admin/login") {
    return null
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <Suspense fallback={null}>
      <div className="min-h-screen bg-background">
        {/* Mobile sidebar */}
        <div className={cn("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "block" : "hidden")}>
          <div className="fixed inset-0 bg-black/80" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-foreground">{t("TCF-TEF Admin", "TCF-TEF Admin")}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{language === "fr" ? item.name : item.nameEn}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:block">
          <div className="flex flex-col h-full bg-card border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{t("Admin", "Admin")}</h2>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{language === "fr" ? item.name : item.nameEn}</span>
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <AdminLogoutButton
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
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-muted-foreground hover:text-foreground"
                >
                  <Menu className="w-5 h-5" />
                </Button>

                {/* Search Bar */}
                <div className="hidden md:flex items-center bg-accent rounded-lg px-3 py-2 min-w-[300px]">
                  <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t("Rechercher dans l'admin...", "Search admin...")}
                    className="bg-transparent outline-none flex-1 text-sm text-foreground placeholder-muted-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </Button>

                {/* Language Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Globe className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium">{(language || "fr").toUpperCase()}</span>
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-gray-200 dark:border-gray-700">
                    <DropdownMenuItem
                      onClick={() => setLanguage("fr")}
                      className="cursor-pointer text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="mr-2">🇫🇷</span>
                      Français
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setLanguage("en")}
                      className="cursor-pointer text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="mr-2">🇺🇸</span>
                      English
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Notifications and Messages */}
                <div className="flex items-center gap-1">
                  <NotificationIndicator type="notifications" />
                  <NotificationIndicator type="messages" />
                </div>

                {/* Admin Profile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-xs text-white font-medium">
                          {(() => {
                            const name = (user?.firstName && user?.lastName)
                              ? `${user.firstName} ${user.lastName}`
                              : (user?.email || '').split('@')[0]
                                  .split(/[._-]+/)
                                  .filter(Boolean)
                                  .map((p: string) => p.charAt(0).toUpperCase())
                                  .join('')
                            return (name || 'A').charAt(0)
                          })()}
                        </span>
                      </div>
                      <span className="text-sm hidden sm:block">
                        {(() => {
                          if (user?.firstName || user?.lastName) {
                            const fn = user?.firstName || ''
                            const ln = user?.lastName || ''
                            // Avoid generic "Admin User"
                            const generic = `${fn} ${ln}`.trim().toLowerCase() === 'admin user'
                            if (!generic) return `${fn} ${ln}`.trim() || 'Admin'
                          }
                          const base = (user?.email || '').split('@')[0]
                          const parts = base.split(/[._-]+/).filter(Boolean)
                          const pretty = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
                          return pretty || 'Admin'
                        })()}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-gray-200 dark:border-gray-700">
                    <DropdownMenuItem className="cursor-pointer text-popover-foreground hover:bg-accent hover:text-accent-foreground">
                      <Link href="/admin/profile" className="w-full">
                        {t("Mon profil", "My Profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer text-popover-foreground hover:bg-accent hover:text-accent-foreground">
                      <Link href="/admin/settings" className="w-full">
                        {t("Paramètres", "Settings")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <div className="w-full">
                        <AdminLogoutButton
                          size="sm"
                          className="w-full justify-start text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                          showIcon={true}
                          showText={true}
                          confirmLogout={false}
                        />
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="bg-background">{children}</main>

          {/* Floating AI Assistant removed for admin section */}
        </div>
      </div>
    </Suspense>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutInner>{children}</AdminLayoutInner>
}
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
  FileText,
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
import AuraLogo from "@/components/aura-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { apiClient } from "@/lib/api-client"

const navigation = [
  { name: "Tableau de bord", nameEn: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Utilisateurs", nameEn: "Users", href: "/admin/users", icon: Users },
  { name: "Contenu", nameEn: "Content", href: "/admin/content", icon: FileText },
  { name: "Mon Feed", nameEn: "My Feed", href: "/admin/feed", icon: Rss },
  { name: "Managers", nameEn: "Managers", href: "/admin/managers", icon: UserCheck },
  { name: "Sessions Live", nameEn: "Live Sessions", href: "/admin/live-sessions", icon: Video },
  { name: "Étudiants", nameEn: "Students", href: "/admin/students", icon: Users },
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
  const [forceLoading, setForceLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated, isAdmin, loading } = useAuth()

  // Utility function to normalize image URLs to always use backend URL
  const normalizeImageUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    
    // If already absolute URL (http/https), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    
    // If relative URL starting with /uploads, prepend backend URL
    if (url.startsWith('/uploads')) {
      return `http://localhost:3001${url}`
    }
    
    // If relative URL starting with /, prepend backend URL
    if (url.startsWith('/')) {
      return `http://localhost:3001${url}`
    }
    
    // If no leading slash, prepend /uploads/
    return `http://localhost:3001/uploads/${url}`
  }

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !isAdmin) return
      
      try {
        const response = await apiClient.get('/users/profile') as any
        const responseData = response?.data || response
        
        let userData: any = null
        if (response.success && responseData) {
          if (responseData.user && typeof responseData.user === 'object') {
            userData = responseData.user
          } else if (responseData.firstName || responseData.email) {
            userData = responseData
          } else if ((response as any).firstName || (response as any).email) {
            userData = response
          }
        }
        
        if (userData) {
          setUserProfile({
            profileImage: normalizeImageUrl(userData.profileImage || userData.profilePicture || userData.avatar || userData.imageUrl || ''),
            firstName: userData.firstName || user?.firstName || '',
            lastName: userData.lastName || user?.lastName || '',
            email: userData.email || user?.email || ''
          })
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }
    
    fetchUserProfile()
  }, [user, isAdmin])

  // Force loading to stop after 2 seconds maximum
  useEffect(() => {
    setForceLoading(true)
    const timer = setTimeout(() => {
      setForceLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Simple authentication check
  if (!user || !isAdmin) {
    return <>{children}</>
  }

  if (loading && forceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement du panneau d'administration...</p>
        </div>
      </div>
    )
  }

  if (pathname === "/admin/login") {
    return <Suspense fallback={null}>{children}</Suspense>
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    }
    const emailBase = (user?.email || '').split('@')[0]
    const parts = emailBase.split(/[._-]+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    }
    return (parts[0]?.charAt(0) || 'A').toUpperCase()
  }

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.firstName || user?.lastName) {
      const fn = user?.firstName || ''
      const ln = user?.lastName || ''
      const fullName = `${fn} ${ln}`.trim()
      if (fullName && fullName.toLowerCase() !== 'admin user') {
        return fullName.toLowerCase()
      }
    }
    const emailBase = (user?.email || '').split('@')[0]
    const parts = emailBase.split(/[._-]+/).filter(Boolean)
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || 'Admin'
  }

  return (
    <Suspense fallback={null}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Mobile sidebar overlay */}
        <div className={cn("fixed inset-0 z-50 lg:hidden transition-opacity", sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none")}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className={cn(
            "fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 shadow-xl transform transition-transform",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <AuraLogo className="h-11 w-auto" width={280} height={84} />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("Admin", "Admin")}</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    pathname === item.href
                      ? "bg-gray-900 dark:bg-gray-800 text-white shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{language === "fr" ? item.name : item.nameEn}</span>
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
              <AdminLogoutButton
                className="w-full justify-start bg-red-500 hover:bg-red-600 text-white"
                showIcon={true}
                showText={true}
                confirmLogout={true}
              />
            </div>
          </div>
        </div>

        {/* Desktop Layout - Three Container Structure */}
        <div className="flex h-screen overflow-hidden">
          {/* Container 1: Left Sidebar Menu */}
          <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg">
            {/* Sidebar Header with Logo */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
              <AuraLogo className="h-14 w-auto" width={280} height={84} />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("Admin", "Admin")}</h2>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-gray-900 dark:bg-gray-800 text-white shadow-md"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{language === "fr" ? item.name : item.nameEn}</span>
                </Link>
                )
              })}
            </nav>

            {/* Logout Button at Bottom */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <AdminLogoutButton
                className="w-full justify-start bg-red-500 hover:bg-red-600 text-white rounded-lg"
                showIcon={true}
                showText={true}
                confirmLogout={true}
              />
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Container 2: Top Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4">
                {/* Left: Logo and Mobile Menu */}
                <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                    className="lg:hidden text-gray-600 dark:text-gray-400"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                </div>

                {/* Center: Search Bar */}
                <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                      placeholder={t("Rechercher dans l'admin...", "Search in admin...")}
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

                {/* Right: Utilities and Profile */}
                <div className="flex items-center gap-2">
                  {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </Button>

                {/* Language Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                      <Globe className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium">{(language || "fr").toUpperCase()}</span>
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <DropdownMenuItem
                      onClick={() => setLanguage("fr")}
                        className="cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Français
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setLanguage("en")}
                        className="cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      English
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                  {/* Notifications */}
                  <NotificationIndicator type="notifications" />

                  {/* Messages */}
                  <NotificationIndicator type="messages" />

                  {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
                      >
                        <Avatar className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700">
                          <AvatarImage 
                            src={userProfile?.profileImage || ''} 
                            alt={getUserDisplayName()}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-medium">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-base hidden sm:block text-gray-900 dark:text-white font-medium" style={{ fontSize: '1.4em' }}>
                          {getUserDisplayName()}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 w-56">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="w-10 h-10 border-2 border-gray-200 dark:border-gray-700">
                            <AvatarImage 
                              src={userProfile?.profileImage || ''} 
                              alt={getUserDisplayName()}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{getUserDisplayName()}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      <DropdownMenuItem className="cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Link href="/admin/profile" className="w-full flex items-center">
                        {t("Mon profil", "My Profile")}
                      </Link>
                    </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Link href="/admin/settings" className="w-full flex items-center">
                        {t("Paramètres", "Settings")}
                      </Link>
                    </DropdownMenuItem>
                      <div className="border-t border-gray-200 dark:border-gray-700 mt-1">
                    <DropdownMenuItem asChild>
                      <div className="w-full">
                        <AdminLogoutButton
                          size="sm"
                              className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          showIcon={true}
                          showText={true}
                          confirmLogout={false}
                        />
                      </div>
                    </DropdownMenuItem>
                      </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            </header>

            {/* Container 3: Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
              <div className="h-full p-6">
                {children}
              </div>
            </main>
          </div>
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
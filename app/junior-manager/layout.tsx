"use client"

import type React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { ManagerLogoutButton } from "@/components/auth/LogoutButton"
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
import { BookOpen, Video, Users, Settings, Bell, User, Menu, X, BarChart3, Rss, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

export default function JuniorManagerLayout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, t } = useLanguage()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(2)

  const currentManager = {
    name: "Marie Dubois",
    email: "marie.dubois@tcf-tef.com",
    role: "Junior Manager",
  }

  const navigationItems = [
    {
      name: t("Tableau de bord", "Dashboard"),
      href: "/manager/dashboard",
      icon: BarChart3,
      current: pathname === "/manager/dashboard", // Fixed dashboard highlighting
    },
    {
      name: t("Contenu", "Content"),
      href: "/manager/content",
      icon: BookOpen,
      current: pathname.startsWith("/manager/content"),
    },
    {
      name: t("Sessions Live", "Live Sessions"),
      href: "/manager/sessions",
      icon: Video,
      current: pathname.startsWith("/manager/sessions"),
    },
    {
      name: t("Étudiants", "Students"),
      href: "/manager/students",
      icon: Users,
      current: pathname.startsWith("/manager/students"),
    },
    {
      name: t("Mon Feed", "My Feed"),
      href: "/manager/feed",
      icon: Rss,
      current: pathname.startsWith("/manager/feed"),
    },
    {
      name: t("Paramètres", "Settings"),
      href: "/manager/settings",
      icon: Settings,
      current: pathname.startsWith("/manager/settings"),
    },
  ]



  return (
    <div className="min-h-screen bg-gray-950">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TCF-TEF Junior</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Manager Info */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-white">{currentManager.name}</p>
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
                  {currentManager.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    item.current ? "bg-green-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white",
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <ManagerLogoutButton
              className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
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
        <header className="bg-gray-900 border-b border-gray-800 h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t("Rechercher dans le manager...", "Search in manager...")}
                  className="w-96 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Globe className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium text-white">{(language || "fr").toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                <DropdownMenuItem
                  onClick={() => setLanguage("fr")}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  Français
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <Link href="/manager/notifications">
              {" "}
              {/* Updated to use original manager path */}
              <Button variant="ghost" size="sm" className="relative text-gray-400 hover:text-white">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <User className="w-5 h-5 mr-2" />
                  <span className="hidden md:inline text-white">{currentManager.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                <DropdownMenuItem asChild>
                  <Link href="/manager/profile" className="text-gray-300 hover:text-white hover:bg-gray-700">
                    {" "}
                    {/* Updated to use original manager path */}
                    <User className="w-4 h-4 mr-2" />
                    {t("Profil", "Profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/manager/settings" className="text-gray-300 hover:text-white hover:bg-gray-700">
                    {" "}
                    {/* Updated to use original manager path */}
                    <Settings className="w-4 h-4 mr-2" />
                    {t("Paramètres", "Settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem asChild>
                  <div className="w-full">
                    <ManagerLogoutButton
                      size="sm"
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
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

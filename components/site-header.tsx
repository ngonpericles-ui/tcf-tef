"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Flame, Moon, Search, Sun, UserRound, AlignJustify, Globe, BookOpen, Target, Video, Wifi, Heart, Trophy, Download, CreditCard, User, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/components/theme-provider"
import { useLang } from "./language-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSession } from "@/components/use-session"
import NotificationIndicator from "@/components/notification-indicator"

const SiteHeader = React.memo(function SiteHeader() {
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useLang()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, logout } = useSession()

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true)
  }, [])

  const links = useMemo(() => [
    { href: "/cours", label: t("nav.courses"), icon: BookOpen },
    { href: "/tests", label: t("nav.tests"), icon: Target },
    { href: "/live", label: t("nav.live"), icon: Video },
    { href: "/quoi-de-neuf", label: t("Actualités", "News"), icon: Wifi },
    { href: "/favoris", label: t("nav.favorites"), icon: Heart },
    { href: "/achievements", label: t("nav.achievements"), icon: Trophy },
    { href: "/download", label: t("nav.download"), icon: Download },
  ], [t])

  const isActive = useCallback((href: string) => pathname === href, [pathname])

  const cycleTheme = useCallback(() => {
    if (theme === "dark") {
      setTheme("light")
    } else {
      setTheme("dark")
    }
  }, [theme, setTheme])

  const getThemeIcon = useMemo(() => {
    return theme === "light" ? (
      <Sun className="h-5 w-5 transition-transform duration-200" />
    ) : (
      <Moon className="h-5 w-5 transition-transform duration-200" />
    )
  }, [theme])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-200">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand - Moved 1 inch to the left */}
        <div
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0 -ml-16"
          aria-label="Home"
          onClick={() => {
            // Only navigate if not already on home or root
            if (pathname !== "/home" && pathname !== "/") {
              router.push("/home")
            }
          }}
        >
          <Flame className="h-6 w-6 text-[#2ECC71]" aria-hidden="true" />
          <span className="font-[var(--font-poppins)] font-semibold tracking-tight text-lg">TCF•TEF</span>
        </div>

        {/* Desktop nav - Centered */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-2 text-sm flex-1 justify-center max-w-4xl">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative px-2 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#2ECC71]/20 dark:focus:ring-[#2ECC71]/30 flex items-center gap-1 ${
                isActive(l.href)
                  ? "font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
              style={isActive(l.href) ? { 
                backgroundColor: theme === 'dark' ? '#2ECC71' : 'transparent',
                color: theme === 'dark' ? 'white' : '#2ECC71'
              } : undefined}
              prefetch={true}
            >
              <l.icon className="h-4 w-4" />
              <span>{l.label}</span>
              {isActive(l.href) && (
                <div 
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: theme === 'dark' ? 'white' : '#2ECC71'
                  }}
                />
              )}
            </Link>
          ))}
          <Link
            href="/abonnement"
            className={`relative px-2 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#2ECC71]/20 dark:focus:ring-[#2ECC71]/30 flex items-center gap-1 ${
              isActive("/abonnement")
                ? "font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
            style={isActive("/abonnement") ? { 
              backgroundColor: theme === 'dark' ? '#2ECC71' : 'transparent',
              color: theme === 'dark' ? 'white' : '#2ECC71'
            } : undefined}
          >
            <CreditCard className="h-4 w-4" />
            <span>Abonnement</span>
            {isActive("/abonnement") && (
              <div 
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
                style={{
                  backgroundColor: theme === 'dark' ? 'white' : '#2ECC71'
                }}
              />
            )}
          </Link>
          <Link
            href="/profil"
            className={`px-1 py-1 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-[#2ECC71]/20 dark:focus:ring-[#2ECC71]/30 flex items-center gap-1 ${
              isActive("/profil") ? "font-medium" : "hover:text-primary hover:bg-accent"
            }`}
            style={isActive("/profil") ? { 
              backgroundColor: theme === 'dark' ? '#2ECC71' : 'transparent',
              color: theme === 'dark' ? 'white' : '#2ECC71'
            } : undefined}
          >
            <User className="h-4 w-4" />
            <span>Profil</span>
          </Link>
        </nav>

        {/* Right controls - Better spacing */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Mobile menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu" className="rounded-full">
                  <AlignJustify className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {links.map((l) => (
                  <DropdownMenuItem key={l.href} asChild>
                    <Link href={l.href} className={`flex items-center gap-2 ${isActive(l.href) ? "bg-accent" : ""}`}>
                      <l.icon className="h-4 w-4" />
                      {l.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search */}
          <div className="relative hidden sm:block">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => setSearchOpen((v) => !v)}
              className="rounded-full"
            >
              <Search className="h-5 w-5" />
            </Button>
            {searchOpen && (
              <div className="absolute right-0 top-12 w-72 p-2 rounded-lg border bg-popover shadow-lg">
                <Input
                  placeholder={lang === "fr" ? "Rechercher..." : "Search..."}
                  autoFocus
                  onBlur={() => setSearchOpen(false)}
                  className="h-9"
                />
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center border border-[#2ECC71] rounded-full overflow-hidden">
            <button
              aria-label="French"
              className={`px-3 py-1 text-xs transition-colors flex items-center gap-1 ${
                lang === "fr" ? "bg-[#2ECC71] text-black dark:text-white font-medium" : "hover:bg-[#2ECC71]/10 text-black dark:text-white"
              }`}
              style={{ color: 'var(--foreground)' }}
              onClick={() => setLang("fr")}
            >
              <Globe className="h-3 w-3" />
              FR
            </button>
            <button
              aria-label="English"
              className={`px-3 py-1 text-xs transition-colors flex items-center gap-1 ${
                lang === "en" ? "bg-[#2ECC71] text-black dark:text-white font-medium" : "hover:bg-[#2ECC71]/10 text-black dark:text-white"
              }`}
              style={{ color: 'var(--foreground)' }}
              onClick={() => setLang("en")}
            >
              <Globe className="h-3 w-3" />
              EN
            </button>
          </div>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Switch theme (current: ${theme})`}
            onClick={cycleTheme}
            className="rounded-full"
            disabled={!mounted}
          >
            {mounted && getThemeIcon}
          </Button>

          {/* Notifications and Messages */}
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <NotificationIndicator type="notifications" />
              <NotificationIndicator type="messages" />
            </div>
          )}

          {/* Auth buttons / Logout */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button
                className="h-9 bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black font-medium"
                onClick={async () => {
                  try {
                    await logout()
                    router.replace("/connexion")
                  } catch (error) {
                    console.error('Logout error:', error)
                    // Still redirect even if logout fails
                    router.replace("/connexion")
                  }
                }}
              >
                {lang === "fr" ? "Déconnexion" : "Logout"}
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/connexion">
                  <Button variant="outline" className="h-9 bg-transparent">
                    {t("auth.login")}
                  </Button>
                </Link>
                <Link href="/inscription">
                  <Button className="h-9 bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black">{t("auth.signup")}</Button>
                </Link>
              </div>
              <Link href="/connexion" className="sm:hidden" aria-label="Account">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserRound className="h-5 w-5" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
})

SiteHeader.displayName = 'SiteHeader'

export default SiteHeader

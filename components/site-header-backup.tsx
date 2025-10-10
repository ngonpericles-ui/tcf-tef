"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Flame, Moon, Search, Sun, UserRound, AlignJustify, Globe, BookOpen, Target, Video, Wifi, Heart, Trophy, Download, CreditCard, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/components/theme-provider"
import { useLang } from "./language-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSession } from "@/components/use-session"

const SiteHeader = React.memo(function SiteHeader() {
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useLang()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, user, logout } = useSession()

  // Simple test version - just return basic header
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-200">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-[#2ECC71]" />
          <span className="font-semibold">TCF•TEF</span>
        </div>
        <nav className="hidden md:flex items-center gap-4">
          <Link href="/cours">Cours</Link>
          <Link href="/tests">Tests</Link>
          <Link href="/live">Live</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
})

export default SiteHeader


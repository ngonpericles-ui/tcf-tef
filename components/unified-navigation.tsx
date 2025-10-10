"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Search,
  ChevronDown,
  Menu,
  X,
  Bell,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Zap,
  ArrowRight,
  Flame,
  Globe,
  Sun,
  Moon
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import { NavigationService, type UserRole, type SubscriptionTier } from "@/lib/services/navigationService"
import { cn } from "@/lib/utils"

interface UnifiedNavigationProps {
  userRole: UserRole
  subscriptionTier: SubscriptionTier
  currentSection: 'student' | 'manager' | 'admin'
  userName?: string
  userEmail?: string
  notificationCount?: number
  messageCount?: number
  className?: string
}

export default function UnifiedNavigation({
  userRole,
  subscriptionTier,
  currentSection,
  userName = "User",
  userEmail = "user@example.com",
  notificationCount = 0,
  messageCount = 0,
  className = ""
}: UnifiedNavigationProps) {
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSectionSwitcherOpen, setIsSectionSwitcherOpen] = useState(false)

  // Get navigation items for current section
  const navigationItems = useMemo(() => 
    NavigationService.getNavigationItems(userRole, currentSection),
    [userRole, currentSection]
  )

  // Get quick actions
  const quickActions = useMemo(() => 
    NavigationService.getQuickActions(userRole, currentSection),
    [userRole, currentSection]
  )

  // Get section switcher options
  const sectionSwitcher = useMemo(() => 
    NavigationService.getSectionSwitcher(userRole),
    [userRole]
  )

  // Get breadcrumbs
  const breadcrumbs = useMemo(() => 
    NavigationService.generateBreadcrumbs(pathname),
    [pathname]
  )

  // Filter navigation items for search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return []
    
    return navigationItems.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.labelEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.descriptionEn?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8)
  }, [navigationItems, searchQuery])

  // Check if current path is active
  const isActive = (href: string) => {
    if (href === '/home' && pathname === '/') return true
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Get current section info
  const currentSectionInfo = sectionSwitcher.find(section => {
    if (currentSection === 'student') return section.href === '/home'
    if (currentSection === 'manager') return section.href === '/manager'
    if (currentSection === 'admin') return section.href === '/admin'
    return false
  })

  // Handle section switch
  const handleSectionSwitch = (href: string) => {
    router.push(href)
    setIsSectionSwitcherOpen(false)
  }

  // Handle search selection
  const handleSearchSelect = (href: string) => {
    router.push(href)
    setIsSearchOpen(false)
    setSearchQuery("")
  }

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand & Section Switcher */}
        <div className="flex items-center gap-4">
          {/* Brand */}
          <Link href="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Flame className="h-6 w-6 text-primary" />
            <span className="font-semibold tracking-tight">TCF•TEF</span>
          </Link>

          {/* Section Switcher */}
          <Popover open={isSectionSwitcherOpen} onOpenChange={setIsSectionSwitcherOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
                {currentSectionInfo?.icon && <currentSectionInfo.icon className="h-4 w-4" />}
                <span>{language === 'fr' ? currentSectionInfo?.label : currentSectionInfo?.labelEn}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-1">
                {sectionSwitcher.map((section) => (
                  <Button
                    key={section.href}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleSectionSwitch(section.href)}
                  >
                    <section.icon className="h-4 w-4 mr-2" />
                    {language === 'fr' ? section.label : section.labelEn}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navigationItems.slice(0, 6).map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{language === 'fr' ? item.label : item.labelEn}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
                {item.isNew && (
                  <Badge variant="default" className="text-xs bg-green-500">
                    {t('Nouveau', 'New')}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Search className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Command>
                <CommandInput
                  placeholder={t("Rechercher...", "Search...")}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>
                    {t("Aucun résultat trouvé.", "No results found.")}
                  </CommandEmpty>
                  {filteredItems.length > 0 && (
                    <CommandGroup heading={t("Navigation", "Navigation")}>
                      {filteredItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <CommandItem
                            key={item.id}
                            onSelect={() => handleSearchSelect(item.href)}
                            className="flex items-center gap-2"
                          >
                            <Icon className="h-4 w-4" />
                            <div className="flex-1">
                              <div className="font-medium">
                                {language === 'fr' ? item.label : item.labelEn}
                              </div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground">
                                  {language === 'fr' ? item.description : item.descriptionEn}
                                </div>
                              )}
                            </div>
                            <ArrowRight className="h-3 w-3" />
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  )}
                  {quickActions.length > 0 && (
                    <CommandGroup heading={t("Actions rapides", "Quick Actions")}>
                      {quickActions.map((action) => {
                        const Icon = action.icon
                        return (
                          <CommandItem
                            key={action.id}
                            onSelect={() => handleSearchSelect(action.href)}
                            className="flex items-center gap-2"
                          >
                            <Icon className="h-4 w-4" />
                            <span>{language === 'fr' ? action.label : action.labelEn}</span>
                            <ArrowRight className="h-3 w-3 ml-auto" />
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <span className="text-xs">{language?.toUpperCase() || 'FR'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage("fr")}>
                <span className="mr-2">🇫🇷</span>
                Français
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("en")}>
                <span className="mr-2">🇺🇸</span>
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          {(userRole === 'JUNIOR_MANAGER' || userRole === 'SENIOR_MANAGER' || userRole === 'ADMIN') && (
            <>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    {notificationCount}
                  </Badge>
                )}
              </Button>

              <Button variant="ghost" size="icon" className="relative">
                <MessageSquare className="h-4 w-4" />
                {messageCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    {messageCount}
                  </Badge>
                )}
              </Button>
            </>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-medium">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:block text-sm">{userName}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {subscriptionTier}
                </Badge>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profil" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("Mon profil", "My Profile")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t("Paramètres", "Settings")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                {t("Déconnexion", "Logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Section Switcher Mobile */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t("Sections", "Sections")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {sectionSwitcher.map((section) => (
                  <Button
                    key={section.href}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => {
                      handleSectionSwitch(section.href)
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <section.icon className="h-4 w-4 mr-2" />
                    {language === 'fr' ? section.label : section.labelEn}
                  </Button>
                ))}
              </div>
            </div>

            {/* Navigation Items Mobile */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t("Navigation", "Navigation")}
              </p>
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{language === 'fr' ? item.label : item.labelEn}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Search Mobile */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t("Recherche", "Search")}
              </p>
              <Input
                placeholder={t("Rechercher...", "Search...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              {filteredItems.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {filteredItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          handleSearchSelect(item.href)
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {language === 'fr' ? item.label : item.labelEn}
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

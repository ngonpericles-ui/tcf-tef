"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { NavigationService } from "@/lib/services/navigationService"
import { cn } from "@/lib/utils"

interface BreadcrumbNavigationProps {
  className?: string
  showHome?: boolean
  maxItems?: number
}

export default function BreadcrumbNavigation({
  className = "",
  showHome = true,
  maxItems = 5
}: BreadcrumbNavigationProps) {
  const { language, t } = useLanguage()
  const pathname = usePathname()

  // Generate breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs = NavigationService.generateBreadcrumbs(pathname)
    
    // Limit number of items if specified
    if (maxItems && crumbs.length > maxItems) {
      return [
        crumbs[0], // Always keep home
        { label: '...', labelEn: '...', href: undefined }, // Ellipsis
        ...crumbs.slice(-(maxItems - 2)) // Keep last items
      ]
    }
    
    return crumbs
  }, [pathname, maxItems])

  // Don't show breadcrumbs on home page
  if (pathname === '/' || pathname === '/home') {
    return null
  }

  // Don't show if only home breadcrumb
  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav 
      aria-label={t("Fil d'Ariane", "Breadcrumb")}
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          const isEllipsis = crumb.label === '...'
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              )}
              
              {isEllipsis ? (
                <span className="px-2 py-1 text-muted-foreground/70">...</span>
              ) : crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className={cn(
                    "px-2 py-1 rounded-md transition-colors hover:text-foreground hover:bg-accent",
                    index === 0 && showHome && "flex items-center gap-1"
                  )}
                >
                  {index === 0 && showHome && <Home className="h-3 w-3" />}
                  <span>{language === 'fr' ? crumb.label : crumb.labelEn}</span>
                </Link>
              ) : (
                <span 
                  className={cn(
                    "px-2 py-1 font-medium",
                    isLast ? "text-foreground" : "text-muted-foreground",
                    index === 0 && showHome && "flex items-center gap-1"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {index === 0 && showHome && <Home className="h-3 w-3" />}
                  <span>{language === 'fr' ? crumb.label : crumb.labelEn}</span>
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

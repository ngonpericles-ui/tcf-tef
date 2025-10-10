"use client"

import { useLang } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Monitor, Globe } from "lucide-react"

export default function EnhancedFooter() {
  const { lang, setLang } = useLang()
  const { theme, setTheme } = useTheme()

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />
      case "dark":
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return t("Clair", "Light")
      case "dark":
        return t("Sombre", "Dark")
      default:
        return t("Système", "System")
    }
  }

  const cycleTheme = () => {
    if (theme === "dark") {
      setTheme("light")
    } else if (theme === "light") {
      setTheme("system")
    } else {
      setTheme("dark")
    }
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/10 dark:bg-black/10 backdrop-blur-xl border-t border-white/10 dark:border-white/5 shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left side - Brand and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-semibold text-foreground">TCF-TEF</span>
            </div>

            <nav className="hidden md:flex items-center space-x-6">
              <a
                href="/cours"
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
              >
                {t("Cours", "Courses")}
              </a>
              <a
                href="/tests"
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
              >
                {t("Tests", "Tests")}
              </a>
              <a
                href="/live"
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
              >
                {t("Live", "Live")}
              </a>
              <a
                href="/abonnement"
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
              >
                {t("Abonnement", "Subscription")}
              </a>
            </nav>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="h-9 px-3 text-sm font-medium bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
            >
              <Globe className="h-4 w-4 mr-2" />
              <span>{lang === "fr" ? "FR" : "EN"}</span>
            </Button>

            {/* Theme Selector */}
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleTheme}
              className="h-9 px-3 text-sm font-medium bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
            >
              <div className="mr-2 transition-transform duration-200 hover:scale-110">{getThemeIcon()}</div>
              <span>{getThemeLabel()}</span>
            </Button>

            {/* Copyright - Hidden on mobile */}
            <div className="hidden lg:block text-xs text-foreground/50 ml-4 pl-4 border-l border-white/10">
              © 2025 TCF-TEF
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Sun, Moon, Globe } from "lucide-react"
import { useLang } from "./language-provider"
import { useTheme } from "@/components/theme-provider"

export default function SiteFooter() {
  const { t, lang, setLang } = useLang()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const cycleTheme = () => {
    if (theme === "dark") {
      setTheme("light")
    } else {
      setTheme("dark")
    }
  }

  const getThemeDisplay = () => {
    return theme === "light"
      ? { icon: <Sun className="h-4 w-4" />, label: "Light" }
      : { icon: <Moon className="h-4 w-4" />, label: "Dark" }
  }

  const themeDisplay = getThemeDisplay()

  return (
    <footer className="border-t border-gray-200/50 dark:border-gray-800/30 bg-muted/30">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
        <div>
          <div className="mb-3 font-medium text-foreground">{t("footer.product")}</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link href="/cours" className="hover:text-foreground transition-colors">
                Cours
              </Link>
            </li>
            <li>
              <Link href="/tests" className="hover:text-foreground transition-colors">
                Tests
              </Link>
            </li>
            <li>
              <Link href="/live" className="hover:text-foreground transition-colors">
                Live
              </Link>
            </li>
            <li>
              <Link href="/abonnement" className="hover:text-foreground transition-colors">
                Abonnement
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-medium text-foreground">{t("footer.company")}</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                À propos
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                Carrières
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-medium text-foreground">{t("footer.legal")}</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                CGU
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors">
                Confidentialité
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-medium text-foreground">Controls</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center border border-[#2ECC71] rounded-full overflow-hidden bg-background">
              <button
                onClick={() => setLang("fr")}
                className={`px-3 py-2 text-xs transition-colors flex-1 flex items-center justify-center gap-1 ${
                  lang === "fr" ? "bg-[#2ECC71] text-black dark:text-white font-medium" : "hover:bg-[#2ECC71]/10 text-black dark:text-white"
                }`}
                style={{ color: 'var(--foreground)' }}
              >
                <Globe className="h-3 w-3" />
                FR
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-2 text-xs transition-colors flex-1 flex items-center justify-center gap-1 ${
                  lang === "en" ? "bg-[#2ECC71] text-black dark:text-white font-medium" : "hover:bg-[#2ECC71]/10 text-black dark:text-white"
                }`}
                style={{ color: 'var(--foreground)' }}
              >
                <Globe className="h-3 w-3" />
                EN
              </button>
            </div>
            {mounted && (
              <button
                onClick={cycleTheme}
                className="w-full rounded-lg border border-gray-200/50 dark:border-gray-800/30 px-4 py-2.5 text-left hover:bg-accent transition-all duration-200 bg-background text-foreground font-medium flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-[#2ECC71]/20 dark:focus:ring-[#2ECC71]/30"
              >
                {themeDisplay.icon} {themeDisplay.label}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="py-4 text-center text-xs text-muted-foreground border-t">
        © {new Date().getFullYear()} TCF•TEF — UI prototype
      </div>
    </footer>
  )
}

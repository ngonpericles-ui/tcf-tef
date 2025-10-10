"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Shield, Globe, Sun, Moon, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/contexts/AuthContext"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const { login, isAuthenticated, isAdmin, loading } = useAuth()
  const router = useRouter()

  // If already authenticated as admin, redirect to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      router.replace('/admin')
    }
  }, [loading, isAuthenticated, isAdmin, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const result = await login(username, password)

      if (result.success && result.user?.role === 'ADMIN') {
        // Show success message
        const userName = result.user.firstName && result.user.lastName
          ? `${result.user.firstName} ${result.user.lastName}`
          : result.user.email

        setSuccess(t("admin.login.success", `Connexion réussie! Bienvenue ${userName}`))

        // Immediate redirect to admin dashboard
        router.replace("/admin")
      } else if (result.success && result.user?.role !== 'ADMIN') {
        setError(t("Accès refusé. Seuls les administrateurs peuvent accéder à cette section.", "Access denied. Only administrators can access this section."))
      } else {
        setError(result.error || t("Identifiants incorrects", "Invalid credentials"))
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(t("Erreur de connexion. Veuillez réessayer.", "Connection error. Please try again."))
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Theme and Language Controls */}
      <div className="fixed top-4 right-4 flex items-center space-x-2 z-10">
        <Button variant="ghost" size="sm" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Globe className="w-4 h-4 mr-1" />
              <span className="text-xs font-medium">{(language || "fr").toUpperCase()}</span>
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
      </div>

      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t("admin.login.title", "Admin Login")}</h1>
            <p className="text-muted-foreground">{t("admin.login.subtitle", "Access the administration panel")}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="admin-email" className="block text-sm font-medium text-foreground">
                {t("admin.login.email", "Adresse email")}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                id="admin-email"
                type="email"
                placeholder={t("admin.login.emailPlaceholder", "admin@exemple.com")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 px-3 bg-background border border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 rounded-md"
                required
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.login.emailHint", "Utilisez l'email administrateur fourni")}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="block text-sm font-medium text-foreground">
                {t("auth.password", "Mot de passe")}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("admin.login.passwordPlaceholder", "Entrez votre mot de passe")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3 pr-12 bg-background border border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 rounded-md"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-destructive text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-green-800 dark:text-green-400 text-sm">{success}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  <span>{t("Connexion...", "Signing in...")}</span>
                </div>
              ) : (
                t("admin.login.signin", "Sign in")
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("Besoin d'aide ? Contactez le support technique", "Need help? Contact technical support")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

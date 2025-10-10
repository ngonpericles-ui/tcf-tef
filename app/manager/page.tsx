"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Shield, Eye, EyeOff, AlertCircle, Sun, Moon, Globe } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ManagerLoginPage() {
  const [selectedRole, setSelectedRole] = useState<"junior" | "senior" | null>(null)
  
  // Debug: Log selectedRole changes
  useEffect(() => {
    console.log('Selected role changed to:', selectedRole);
  }, [selectedRole]);
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({})
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setFieldErrors({})
    setIsLoading(true)

    const newFieldErrors: { username?: string; password?: string } = {}

    if (!username.trim()) {
      newFieldErrors.username = t("manager.login.emailRequired", "Email requis")
    }

    if (!password.trim()) {
      newFieldErrors.password = t("manager.login.passwordRequired", "Mot de passe requis")
    }

    if (!selectedRole) {
      setError(t("manager.login.selectRole", "Sélectionnez votre rôle"))
      setIsLoading(false)
      return
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors)
      setIsLoading(false)
      return
    }

    try {
      const result = await login(username, password)

      if (result.success && result.user) {
        const userRole = result.user.role

        // Check if user role matches selected role
        // ADMIN can log in as any manager type (full permissions)
        const roleMatches = (
          userRole === "ADMIN" ||
          (selectedRole === "junior" && userRole === "JUNIOR_MANAGER") ||
          (selectedRole === "senior" && userRole === "SENIOR_MANAGER")
        )

        if (roleMatches) {
          // Store manager role preference
          localStorage.setItem("managerRole", selectedRole)

          // Show success message
          const userName = result.user.firstName && result.user.lastName
            ? `${result.user.firstName} ${result.user.lastName}`
            : result.user.email

          setSuccess(`Connexion réussie! Bienvenue ${userName}`)
          setError("")

          // Immediate redirect to appropriate dashboard
          if (userRole === "ADMIN") {
            router.push("/admin")
          } else {
            router.push("/manager/dashboard")
          }
        } else {
          setError(t("manager.login.roleNotMatching", "Votre rôle ne correspond pas à la sélection"))
        }
      } else {
        setError(result.error || t("manager.login.incorrectCredentials", "Email ou mot de passe incorrect"))
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(t("manager.login.connectionError", "Erreur de connexion. Veuillez réessayer."))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-card/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-gray-200 dark:border-gray-700">
            <DropdownMenuItem onClick={() => setTheme("light")} className="text-foreground hover:bg-muted">
              {t("theme.light", "Light")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="text-foreground hover:bg-muted">
              {t("theme.dark", "Dark")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-card/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
              <Globe className="w-4 h-4 mr-2" />
              <span className="text-xs font-medium">{(language || "fr").toUpperCase()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-gray-200 dark:border-gray-700">
            <DropdownMenuItem onClick={() => setLanguage("fr")} className="text-foreground hover:bg-muted">
              Français
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage("en")} className="text-foreground hover:bg-muted">
              English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />

      <Card className="w-full max-w-md bg-card/80 border-gray-200 dark:border-gray-700 backdrop-blur-sm relative z-10 shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {t("manager.login.title", "Connexion Manager")}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t("manager.login.subtitle", "Accédez à votre espace de gestion")}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              {t("manager.login.selectRole", "Sélectionnez votre rôle")}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  console.log('Junior role clicked');
                  setSelectedRole("junior");
                }}
                className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                  selectedRole === "junior"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-input bg-background hover:border-ring hover:bg-accent"
                }`}
              >
                <User
                  className={`w-6 h-6 mx-auto mb-2 ${selectedRole === "junior" ? "text-green-600" : "text-muted-foreground"}`}
                />
                <div className="text-sm font-medium text-foreground">{t("manager.role.junior", "Manager Junior")}</div>
                <Badge variant="secondary" className={`mt-1 text-xs ${
                  selectedRole === "junior" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"
                }`}>
                  A1-B1
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => {
                  console.log('Senior role clicked');
                  setSelectedRole("senior");
                }}
                className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                  selectedRole === "senior"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-input bg-background hover:border-ring hover:bg-accent"
                }`}
              >
                <Shield
                  className={`w-6 h-6 mx-auto mb-2 ${selectedRole === "senior" ? "text-purple-600" : "text-muted-foreground"}`}
                />
                <div className="text-sm font-medium text-foreground">{t("manager.role.senior", "Manager Senior")}</div>
                <Badge variant="secondary" className={`mt-1 text-xs ${
                  selectedRole === "senior" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-muted text-muted-foreground"
                }`}>
                  A1-C2
                </Badge>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("manager.login.roleHint", "Choisissez le rôle correspondant à vos permissions")}
            </p>
            {selectedRole && (
              <div className="p-2 bg-accent rounded-md">
                <p className="text-sm text-foreground">
                  Rôle sélectionné: <span className="font-semibold">
                    {selectedRole === "junior" ? "Manager Junior" : "Manager Senior"}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="manager-email" className="text-sm font-medium text-foreground">
                {t("manager.login.email", "Adresse email")}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="manager-email"
                type="email"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: undefined }))
                  }
                }}
                placeholder={t("manager.login.emailPlaceholder", "exemple@domaine.com")}
                className={`w-full h-11 px-3 bg-background border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 rounded-md ${
                  fieldErrors.username ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-input"
                }`}
              />
              {fieldErrors.username && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{fieldErrors.username}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t("manager.login.emailHint", "Utilisez l'email fourni par l'administrateur")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager-password" className="text-sm font-medium text-foreground">
                {t("manager.login.password", "Mot de passe")}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="manager-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }))
                    }
                  }}
                  placeholder={t("manager.login.passwordPlaceholder", "Entrez votre mot de passe")}
                  className={`w-full h-11 px-3 pr-12 bg-background border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 rounded-md ${
                    fieldErrors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-input"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{fieldErrors.password}</span>
                </div>
              )}
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
              disabled={!selectedRole || isLoading}
              className={`w-full py-3 font-medium transition-all duration-200 ${
                selectedRole === "junior"
                  ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  : selectedRole === "senior"
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                    : "bg-muted text-muted-foreground"
              } disabled:opacity-50`}
            >
              {isLoading
                ? t("manager.login.signingin", "Connexion en cours...")
                : t("manager.login.signin", "Se connecter")}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Besoin d'aide ? Contactez l'administrateur
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLang } from "@/components/language-provider"
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { authService } from "@/lib/services/authService"
import { FcGoogle } from "react-icons/fc"
import { translateApiError } from "@/lib/errorTranslations"
import Image from "next/image"
import AuraLogo from "@/components/aura-logo"

export default function LoginPage() {
  const { lang } = useLang()
  const [clientMounted, setClientMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const router = useRouter()

  // Use AuthContext properly
  const { user, loading: authLoading, isAuthenticated, login: authLogin, signInWithGoogle } = useAuth()

  // Helper function to get redirect path based on user role
  const getRedirectPathForRole = (userRole: string) => {
    switch (userRole) {
      case 'USER':
      case 'STUDENT':
        return '/home'
      case 'ADMIN':
        return '/admin'
      case 'SENIOR_MANAGER':
      case 'JUNIOR_MANAGER':
        return '/manager/dashboard'
      default:
        return '/home'
    }
  }

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Set client mounted state and hasAccount cookie when user visits login page
  useEffect(() => {
    setClientMounted(true)
    if (typeof document !== 'undefined') {
      document.cookie = 'hasAccount=1; path=/'; // User is attempting to login (has an account)
    }

    // Force client mounted after a short delay as fallback
    const timer = setTimeout(() => {
      setClientMounted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Removed automatic redirect to prevent race conditions
  // Let the login handlers manage redirects explicitly

  // Handle traditional login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (!acceptTerms) {
      setError(t("Veuillez accepter les conditions d'utilisation", "Please accept the terms and conditions"))
      setIsLoading(false)
      return
    }

    try {
      const result = await authLogin(email, password)

      if (result.success) {
        const userData = result.user
        if (userData && userData.role) {
          // Validate that only students can login through this page
          if (!['USER', 'STUDENT'].includes(userData.role)) {
            let redirectMessage = ""
            let redirectPath = ""

            if (userData.role === 'ADMIN') {
              redirectMessage = t("Vous êtes administrateur. Veuillez utiliser la page de connexion admin.", "You are an administrator. Please use the admin login page.")
              redirectPath = "/admin/login"
            } else if (['SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(userData.role)) {
              redirectMessage = t("Vous êtes manager. Veuillez utiliser la page de connexion manager.", "You are a manager. Please use the manager login page.")
              redirectPath = "/manager"
            }

            setError(redirectMessage)
            setIsLoading(false)

            // Redirect to appropriate login page after a delay
            setTimeout(() => {
              router.push(redirectPath)
            }, 2000)
            return
          }

          setSuccess(t("Connexion réussie! Redirection...", "Login successful! Redirecting..."))
          console.log(`Student login successful for ${userData.email} with role ${userData.role}`)

          // Update cookies immediately to prevent middleware conflicts
          document.cookie = `auth=1; path=/`
          document.cookie = `role=${userData.role}; path=/`
          document.cookie = `hasAccount=1; path=/`

          // Redirect to student dashboard
          router.push('/home')
        } else {
          console.error('Login successful but no user data received')
          setError(t("Erreur de connexion - données utilisateur manquantes", "Login error - missing user data"))
        }
      } else {
        // Use proper French error translation
        const errorMessage = result.error
          ? translateApiError(result.error, lang === 'fr' ? 'fr' : 'en', 'student')
          : t("Erreur de connexion", "Login error")
        setError(errorMessage)
        setIsLoading(false)
      }
    } catch (err: any) {
      // Handle network errors and other exceptions with proper French translation
      let errorMessage = t("Erreur de connexion", "Login error")

      if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        errorMessage = t("Erreur de réseau. Vérifiez votre connexion internet et réessayez.", "Network error. Check your internet connection and try again.")
      } else if (err.message?.includes('fetch')) {
        errorMessage = t("Impossible de se connecter au serveur. Veuillez réessayer.", "Unable to connect to server. Please try again.")
      } else if (err.message) {
        errorMessage = translateApiError(err.message, lang === 'fr' ? 'fr' : 'en', 'student')
      }

      setError(errorMessage)
      setIsLoading(false)
    }
  }

  // Handle Google login
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (!acceptTerms) {
      setError(t("Veuillez accepter les conditions d'utilisation", "Please accept the terms and conditions"))
      setIsLoading(false)
      return
    }

    try {
      const result = await signInWithGoogle()

      if (result.success) {
        // Show appropriate success message based on whether it's a new user or existing user
        const successMessage = t("Connexion Google réussie! Redirection...", "Google login successful! Redirecting...")
        setSuccess(successMessage)

        // Get user data from result
        const userData = result.user

        // Students always go to /home, regardless of what the role says
        const redirectPath = userData && userData.role
          ? getRedirectPathForRole(userData.role)
          : '/home'

        console.log(`Google login successful for ${userData?.email}, redirecting to ${redirectPath}`)

        // Redirect immediately - no delay needed
        router.push(redirectPath)
      } else {
        // Handle specific Google login errors with clear French messages
        let errorMessage = result.error || t("Erreur de connexion Google", "Google login error")

        // The backend now creates accounts automatically, so this shouldn't happen
        // But we keep it for backwards compatibility
        if (result.error?.includes('user_not_found') || result.error?.includes('account_not_found')) {
          errorMessage = t(
            "Aucun compte trouvé avec cette adresse Google. Veuillez d'abord créer un compte en vous inscrivant, puis vous pourrez vous connecter avec Google.",
            "No account found with this Google address. Please create an account by registering first, then you can sign in with Google."
          )
        } else if (result.error?.includes('google_auth_failed')) {
          errorMessage = t(
            "Échec de l'authentification Google. Assurez-vous d'avoir un compte AURA.CA avant de vous connecter avec Google.",
            "Google authentication failed. Make sure you have an AURA.CA account before signing in with Google."
          )
        } else if (result.error) {
          errorMessage = translateApiError(result.error, lang === 'fr' ? 'fr' : 'en', 'student')
        }

        setError(errorMessage)
        setIsLoading(false)
      }
    } catch (err: any) {
      // Handle network errors and other exceptions with proper French translation
      let errorMessage = t(
        "Problème de connexion Google. Veuillez d'abord créer un compte AURA.CA, puis réessayer la connexion Google.",
        "Google connection problem. Please create an AURA.CA account first, then try Google sign-in again."
      )

      if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        errorMessage = t("Erreur de réseau lors de la connexion Google. Vérifiez votre connexion internet.", "Network error during Google login. Check your internet connection.")
      } else if (err.message?.includes('fetch')) {
        errorMessage = t("Impossible de se connecter au serveur Google. Veuillez réessayer.", "Unable to connect to Google server. Please try again.")
      }

      setError(errorMessage)
      setIsLoading(false)
    }
  }

  // Show loading while auth is being checked
  if (!clientMounted || authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Mesh Background */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(at 20% 20%, oklch(0.7 0.2 142 / 0.3) 0px, transparent 50%),
                         radial-gradient(at 80% 20%, oklch(0.6 0.18 220 / 0.25) 0px, transparent 50%),
                         radial-gradient(at 80% 80%, oklch(0.65 0.15 280 / 0.2) 0px, transparent 50%),
                         radial-gradient(at 20% 80%, oklch(0.75 0.17 40 / 0.15) 0px, transparent 50%)`
          }}
        />
        
        {/* Floating Background Elements */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-[#2ECC71]/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-20 right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        
        {/* Moving Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#2ECC71]/40 rounded-full animate-bounce" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-blue-500/40 rounded-full animate-bounce" style={{ animationDelay: "1.5s" }} />
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-purple-500/40 rounded-full animate-bounce" style={{ animationDelay: "2.5s" }} />
        <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-orange-500/40 rounded-full animate-bounce" style={{ animationDelay: "3.5s" }} />
      </div>

      <div className="flex min-h-screen relative z-10">
        {/* Left Column - Login Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-12 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md">
            <Card className="bg-card/80 dark:bg-card/80 border-gray-200 dark:border-gray-700 shadow-xl backdrop-blur-sm glass hover-lift animate-fade-in-up">
              <CardHeader className="text-center pb-6 space-y-2">
                <CardTitle className="text-3xl font-bold text-foreground">{t("Bon retour", "Welcome back")}</CardTitle>
                <p className="text-muted-foreground text-base">
                  {t("Connectez-vous à votre compte AURA.CA", "Login to your AURA.CA account")}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success Alert */}
                {success && (
                  <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}


                {/* Google Login Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base font-medium border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <FcGoogle className="w-5 h-5 mr-3" />
                  {t("Google", "Google")}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">
                      {t("ou", "or")}
                    </span>
                  </div>
                </div>

                {/* Traditional Login Form */}
                <form className="space-y-5" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="m@exemple.com"
                      className="h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#007BFF] focus:ring-[#007BFF]/20 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-foreground font-medium">
                        {t("Mot de passe", "Password")}
                      </Label>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-[#007BFF] hover:text-[#0056b3] transition-colors"
                      >
                        {t("Mot de passe oublié ?", "Forgot your password?")}
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pr-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#007BFF] focus:ring-[#007BFF]/20 transition-all duration-200"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Terms and Conditions Checkbox */}
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 text-[#007BFF] border-gray-300 rounded focus:ring-[#007BFF]"
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-muted-foreground">
                      {t("J'accepte les ", "I accept the ")}
                      <Link href="/terms" className="text-[#007BFF] hover:text-[#0056b3] font-medium">
                        {t("conditions d'utilisation", "terms of service")}
                      </Link>
                      {t(" et la ", " and the ")}
                      <Link href="/privacy" className="text-[#007BFF] hover:text-[#0056b3] font-medium">
                        {t("politique de confidentialité", "privacy policy")}
                      </Link>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-[#2ECC71] hover:bg-[#27AE60] text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t("Connexion...", "Logging in...")}
                      </div>
                    ) : (
                      t("Se connecter", "Login")
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground font-medium">
                      {t("ou", "or")}
                    </span>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  {t("Vous n'avez pas de compte ?", "Don't have an account?")}{" "}
                  <Link
                    href="/inscription"
                    className="text-[#007BFF] hover:text-[#0056b3] font-semibold transition-colors"
                  >
                    {t("S'inscrire", "Sign up")}
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Promotional Content */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
          {/* Animated Background with Multiple Layers */}
          <div className="absolute inset-0">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-black" />
            
            {/* Animated gradient overlays */}
            <div 
              className="absolute inset-0 opacity-40 animate-pulse"
              style={{
                background: `radial-gradient(at 30% 30%, oklch(0.6 0.2 280 / 0.4) 0px, transparent 50%),
                             radial-gradient(at 70% 70%, oklch(0.5 0.18 220 / 0.3) 0px, transparent 50%)`
              }}
            />
            
            {/* Floating orbs */}
            <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "0.5s" }} />
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1.5s" }} />
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-cyan-500/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2.5s" }} />
            
            {/* Background Image with enhanced effects */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
                filter: "blur(6px) brightness(0.7)",
                transform: "scale(1.05)"
              }}
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="relative z-10 flex flex-col justify-start items-center px-12 pt-16 pb-12 w-full">
            <div className="max-w-lg text-center">
              {/* AURA Logo */}
              <div className="mb-8">
                <AuraLogo
                  className="h-80 w-auto mx-auto"
                  width={8000}
                  height={2000}
                  priority={true}
                />
              </div>

              {/* Main Headline */}
              <h2 className="text-4xl font-bold text-white mb-6">
                {t("Révolutionnez l'apprentissage avec l'IA", "Revolutionize Learning with AI")}
              </h2>

              {/* Simple Description */}
              <p className="text-lg text-white/90 leading-relaxed mb-8">
                {t("Maîtrisez le français avec nos simulations vocales IA et nos tests adaptatifs. Une expérience d'apprentissage personnalisée qui s'adapte à votre niveau.", "Master French with our AI voice simulations and adaptive tests. A personalized learning experience that adapts to your level.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

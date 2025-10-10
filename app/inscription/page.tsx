"use client"

import type React from "react"
import { useLang } from "@/components/language-provider"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight } from "lucide-react"
import Image from "next/image"
import AuraLogo from "@/components/aura-logo"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { authService } from "@/lib/services/authService"
import { FcGoogle } from "react-icons/fc"

export default function SignupPage() {
  const { lang } = useLang()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  // Set hasAccount cookie when user visits registration page
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.cookie = 'hasAccount=1; path=/'; // User is attempting to create an account
    }
  }, [])

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    country: "",
    acceptTerms: false,
  })

  const {
    user,
    loading: authLoading,
    register,
    isAuthenticated,
    isStudent
  } = useAuth()

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Password strength validation function (matches backend)
  const validatePasswordStrength = (password: string) => {
    const errors: string[] = []

    // Check minimum length
    if (password.length < 6) {
      errors.push(t("Le mot de passe doit contenir au moins 6 caractères", "Password must be at least 6 characters long"))
    }

    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
      errors.push(t("Le mot de passe doit contenir au moins une lettre minuscule", "Password must contain at least one lowercase letter"))
    }

    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
      errors.push(t("Le mot de passe doit contenir au moins une lettre majuscule", "Password must contain at least one uppercase letter"))
    }

    // Check for numbers
    if (!/\d/.test(password)) {
      errors.push(t("Le mot de passe doit contenir au moins un chiffre", "Password must contain at least one number"))
    }

    // Check for special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push(t("Le mot de passe doit contenir au moins un caractère spécial", "Password must contain at least one special character"))
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Redirect logic for authenticated users - but allow them to stay on signup page if they want to create different accounts
  useEffect(() => {
    // Don't auto-redirect on signup pages - let users choose to create different accounts
    // Only redirect after successful registration
  }, [authLoading, isAuthenticated, isStudent, router])

  // Handle traditional registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear any previous errors/success messages immediately
    setError("")
    setSuccess("")
    setIsLoading(true)

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError(t("Veuillez remplir tous les champs obligatoires", "Please fill in all required fields"))
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t("Les mots de passe ne correspondent pas", "Passwords do not match"))
      setIsLoading(false)
      return
    }

    // Enhanced password validation to match backend requirements
    const passwordValidation = validatePasswordStrength(formData.password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join(", "))
      setIsLoading(false)
      return
    }

    if (!formData.acceptTerms) {
      setError(t("Veuillez accepter les conditions d'utilisation", "Please accept the terms and conditions"))
      setIsLoading(false)
      return
    }

    try {
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        country: formData.country
      }
      
      
      const result = await register(registrationData)

      if (result.success) {
        setSuccess(t("Inscription réussie! Redirection vers votre espace...", "Registration successful! Redirecting to your space..."))

        // Set cookies for immediate access
        if (typeof document !== 'undefined') {
          document.cookie = 'auth=1; path=/'
          document.cookie = 'role=STUDENT; path=/'
          document.cookie = 'hasAccount=1; path=/'
        }

        // Redirect directly to home page
        setTimeout(() => {
          router.push('/home')
        }, 1000)
      } else {
        setError(result.error || t("Erreur d'inscription", "Registration error"))
      }
    } catch (err: any) {
      setError(err.message || t("Erreur d'inscription", "Registration error"))
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Google signup
  const handleGoogleSignup = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const result = await authService.signInWithGoogle()

      if (result.success) {
        setSuccess(t("Inscription Google réussie! Redirection...", "Google signup successful! Redirecting..."))
        setTimeout(() => {
          router.push('/accueil')
        }, 1500)
      } else {
        setError(result.error?.message || t("Erreur d'inscription Google", "Google signup error"))
      }
    } catch (err: any) {
      setError(err.message || t("Erreur d'inscription Google", "Google signup error"))
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking auth state (temporarily bypassed for demo)
  if (false && authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t("Chargement...", "Loading...")}</p>
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
        {/* Left Column - Signup Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-12 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md">
            <Card className="bg-card/80 dark:bg-card/80 border-gray-200 dark:border-gray-700 shadow-xl backdrop-blur-sm glass hover-lift animate-fade-in-up">
              <CardHeader className="text-center pb-6 space-y-2">
                <CardTitle className="text-3xl font-bold text-foreground">{t("Créer un compte", "Create an account")}</CardTitle>
                <p className="text-muted-foreground text-base">
                  {t("Rejoignez AURA.CA et commencez votre parcours d'apprentissage", "Join AURA.CA and start your learning journey")}
                </p>
              </CardHeader>
          <CardContent className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Google Signup Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base font-medium border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200"
                onClick={handleGoogleSignup}
                disabled={isLoading}
              >
                <FcGoogle className="w-5 h-5 mr-3" />
                {t("Continuer avec Google", "Continue with Google")}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 dark:bg-gray-900 text-muted-foreground">
                    {t("OU", "OR")}
                  </span>
                </div>
              </div>

              {/* Traditional Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* First Name and Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("Prénom", "First name")}
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder={t("Votre prénom", "Your first name")}
                      className="h-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#007BFF] focus:ring-[#007BFF]/20"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("Nom", "Last name")}
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder={t("Votre nom", "Your last name")}
                      className="h-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#007BFF] focus:ring-[#007BFF]/20"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="m@exemple.com"
                    className="h-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20"
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("Mot de passe", "Password")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value })
                        if (error) setError("")
                      }}
                      className="h-10 pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20"
                      placeholder={t("Mot de passe sécurisé", "Secure password")}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("Confirmer le mot de passe", "Confirm password")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="h-10 pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Phone and Country (Optional) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("Téléphone", "Phone")} <span className="text-gray-500 text-xs">({t("optionnel", "optional")})</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={t("+33 6 12 34 56 78", "+1 234 567 8900")}
                      className="h-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#007BFF] focus:ring-[#007BFF]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="country" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("Pays", "Country")} <span className="text-gray-500 text-xs">({t("optionnel", "optional")})</span>
                    </Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder={t("France", "United States")}
                      className="h-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#007BFF] focus:ring-[#007BFF]/20"
                    />
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
                    className="border-gray-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300 leading-5 cursor-pointer">
                    {t(
                      "J'accepte les conditions d'utilisation et la politique de confidentialité",
                      "I agree to the Terms of Service and Privacy Policy",
                    )}
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!formData.acceptTerms || isLoading}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t("Création...", "Creating...")}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span>{t("Créer mon compte", "Create my account")}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("Déjà un compte ?", "Already have an account?")}{" "}
                  <Link href="/connexion" className="text-[#007BFF] hover:text-[#0056b3] font-semibold transition-colors duration-200 hover:underline">
                  {t("Se connecter", "Sign in")}
                </Link>
                </p>
              </div>
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

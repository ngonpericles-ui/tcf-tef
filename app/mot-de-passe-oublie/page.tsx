"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLang } from "@/components/language-provider"
import { AlertCircle, CheckCircle, Mail, Phone } from "lucide-react"
import AuraLogo from "@/components/aura-logo"

type Step = 1 | 2 | 3 | 4
type RecoveryMethod = 'email' | 'phone' | null

export default function ForgotPasswordPage() {
  const { lang } = useLang()
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [recoveryMethod, setRecoveryMethod] = useState<RecoveryMethod>(null)
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Progress calculation
  const progress = ((step - 1) / 3) * 100

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits are entered
    if (newCode.every(digit => digit !== '') && index === 5) {
      handleVerifyCode(newCode.join(''))
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''))
      setCode(newCode.slice(0, 6))
      const nextEmptyIndex = Math.min(pastedData.length, 5)
      inputRefs.current[nextEmptyIndex]?.focus()
    }
  }

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Step 1: Select recovery method and enter email/phone
  const handleMethodSelection = async () => {
    if (!recoveryMethod) {
      setError(t("Veuillez sélectionner une méthode de récupération", "Please select a recovery method"))
      return
    }

    if (recoveryMethod === 'email' && !email) {
      setError(t("Veuillez entrer votre adresse email", "Please enter your email address"))
      return
    }

    if (recoveryMethod === 'phone' && !phone) {
      setError(t("Veuillez entrer votre numéro de téléphone", "Please enter your phone number"))
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: recoveryMethod,
          email: recoveryMethod === 'email' ? email : undefined,
          phone: recoveryMethod === 'phone' ? phone : undefined,
          lang: lang
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(t("Code de réinitialisation envoyé avec succès", "Reset code sent successfully"))
        setStep(2)
        setResendCooldown(60) // 60 seconds cooldown
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.error?.message || t("Erreur lors de l'envoi du code", "Error sending code"))
      }
    } catch (err: any) {
      setError(t("Erreur de connexion. Veuillez réessayer.", "Connection error. Please try again."))
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Verify code
  const handleVerifyCode = async (codeValue?: string) => {
    const codeToVerify = codeValue || code.join('')
    
    if (codeToVerify.length !== 6) {
      setError(t("Veuillez entrer le code complet à 6 chiffres", "Please enter the complete 6-digit code"))
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeToVerify,
          method: recoveryMethod,
          email: recoveryMethod === 'email' ? email : undefined,
          phone: recoveryMethod === 'phone' ? phone : undefined
        })
      })

      const data = await response.json()

      if (data.success && data.data?.tokenId) {
        setTokenId(data.data.tokenId)
        setStep(3)
        setSuccess("")
      } else {
        setError(data.error?.message || t("Code invalide ou expiré", "Invalid or expired code"))
        // Clear code on error
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err: any) {
      setError(t("Erreur de connexion. Veuillez réessayer.", "Connection error. Please try again."))
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      setError(t("Veuillez remplir tous les champs", "Please fill all fields"))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t("Les mots de passe ne correspondent pas", "Passwords do not match"))
      return
    }

    if (newPassword.length < 8) {
      setError(t("Le mot de passe doit contenir au moins 8 caractères", "Password must be at least 8 characters"))
      return
    }

    if (!tokenId) {
      setError(t("Session expirée. Veuillez recommencer.", "Session expired. Please start over."))
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId,
          newPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        setStep(4)
        setSuccess(t("Mot de passe réinitialisé avec succès", "Password reset successfully"))
      } else {
        setError(data.error?.message || t("Erreur lors de la réinitialisation", "Error resetting password"))
      }
    } catch (err: any) {
      setError(t("Erreur de connexion. Veuillez réessayer.", "Connection error. Please try again."))
    } finally {
      setIsLoading(false)
    }
  }

  // Resend code
  const handleResendCode = async () => {
    if (resendCooldown > 0) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/auth/resend-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: recoveryMethod,
          email: recoveryMethod === 'email' ? email : undefined,
          phone: recoveryMethod === 'phone' ? phone : undefined,
          lang: lang
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(t("Code renvoyé avec succès", "Code resent successfully"))
        setResendCooldown(60)
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.error?.message || t("Erreur lors du renvoi du code", "Error resending code"))
      }
    } catch (err: any) {
      setError(t("Erreur de connexion. Veuillez réessayer.", "Connection error. Please try again."))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black relative overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Animated Background - Same as login page */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(at 20% 20%, oklch(0.7 0.2 142 / 0.3) 0px, transparent 50%),
                         radial-gradient(at 80% 20%, oklch(0.6 0.18 220 / 0.25) 0px, transparent 50%),
                         radial-gradient(at 80% 80%, oklch(0.65 0.15 280 / 0.2) 0px, transparent 50%),
                         radial-gradient(at 20% 80%, oklch(0.75 0.17 40 / 0.15) 0px, transparent 50%)`
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="bg-card/80 dark:bg-card/80 border-gray-200 dark:border-gray-700 shadow-xl backdrop-blur-sm">
          <CardHeader className="text-center pb-6 space-y-2">
            <CardTitle className="text-3xl font-bold text-foreground">
              {t("Mot de passe oublié ?", "Forgot password?")}
            </CardTitle>
            <p className="text-muted-foreground text-base">
              {step === 1 && t("Sélectionnez votre méthode de récupération", "Select your recovery method")}
              {step === 2 && t("Entrez le code de vérification", "Enter verification code")}
              {step === 3 && t("Définissez un nouveau mot de passe", "Set a new password")}
              {step === 4 && t("Mot de passe réinitialisé", "Password reset")}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="w-full">
              <div className="flex justify-between mb-2">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      s <= step
                        ? 'bg-[#2ECC71] text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}
                  >
                    {s < step ? '✓' : s}
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-[#2ECC71] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Step 1: Method Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setRecoveryMethod('email')}
                    className={`w-full p-4 border-2 rounded-lg transition-all ${
                      recoveryMethod === 'email'
                        ? 'border-[#2ECC71] bg-[#2ECC71]/10 dark:bg-[#2ECC71]/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-[#2ECC71]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Mail className={`h-6 w-6 ${recoveryMethod === 'email' ? 'text-[#2ECC71]' : 'text-muted-foreground'}`} />
                      <div className="text-left">
                        <div className="font-semibold text-foreground">{t("Email", "Email")}</div>
                        <div className="text-sm text-muted-foreground">{t("Recevoir le code par email", "Receive code via email")}</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecoveryMethod('phone')}
                    className={`w-full p-4 border-2 rounded-lg transition-all ${
                      recoveryMethod === 'phone'
                        ? 'border-[#2ECC71] bg-[#2ECC71]/10 dark:bg-[#2ECC71]/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-[#2ECC71]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Phone className={`h-6 w-6 ${recoveryMethod === 'phone' ? 'text-[#2ECC71]' : 'text-muted-foreground'}`} />
                      <div className="text-left">
                        <div className="font-semibold text-foreground">{t("Téléphone", "Phone")}</div>
                        <div className="text-sm text-muted-foreground">{t("Recevoir le code par SMS", "Receive code via SMS")}</div>
                      </div>
                    </div>
                  </button>
                </div>

                {recoveryMethod === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">
                      {t("Adresse email", "Email address")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("votre@email.com", "your@email.com")}
                      className="h-12 bg-white dark:bg-gray-800"
                    />
                  </div>
                )}

                {recoveryMethod === 'phone' && (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground font-medium">
                      {t("Numéro de téléphone", "Phone number")}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("+237 6XX XXX XXX", "+1 234 567 8900")}
                      className="h-12 bg-white dark:bg-gray-800"
                    />
                  </div>
                )}

                <Button
                  onClick={handleMethodSelection}
                  disabled={isLoading || !recoveryMethod || (recoveryMethod === 'email' && !email) || (recoveryMethod === 'phone' && !phone)}
                  className="w-full h-12 bg-[#2ECC71] hover:bg-[#27AE60] text-black font-semibold rounded-lg"
                >
                  {isLoading ? t("Envoi...", "Sending...") : t("Suivant", "Next")}
                </Button>
              </div>
            )}

            {/* Step 2: Code Verification */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-foreground">
                    {t("Nous avons envoyé un code à 6 chiffres à", "We sent a 6-digit code to")}
                  </p>
                  <p className="font-semibold text-[#2ECC71]">
                    {recoveryMethod === 'email' ? email : phone}
                  </p>
                </div>

                <div className="space-y-4">
                  <Label className="text-center block text-foreground font-medium">
                    {t("Code de vérification", "Verification code")}
                  </Label>
                  <div className="flex justify-center gap-3">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          if (el) {
                            inputRefs.current[index] = el
                          }
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        onPaste={index === 0 ? handleCodePaste : undefined}
                        className={`w-14 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all ${
                          digit
                            ? 'border-[#2ECC71] bg-[#2ECC71]/10 dark:bg-[#2ECC71]/20 text-[#2ECC71]'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground'
                        } focus:border-[#2ECC71] focus:ring-2 focus:ring-[#2ECC71]/20 outline-none`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => handleVerifyCode()}
                    disabled={isLoading || code.some(digit => !digit)}
                    className="w-full h-12 bg-[#2ECC71] hover:bg-[#27AE60] text-black font-semibold rounded-lg"
                  >
                    {isLoading ? t("Vérification...", "Verifying...") : t("Vérifier", "Verify")}
                  </Button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-sm text-center text-[#2ECC71] hover:text-[#27AE60] disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {resendCooldown > 0
                      ? t(`Renvoyer dans ${resendCooldown}s`, `Resend in ${resendCooldown}s`)
                      : t("Renvoyer le code", "Resend code")}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Reset Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-foreground font-medium">
                    {t("Nouveau mot de passe", "New password")}
                  </Label>
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 bg-white dark:bg-gray-800"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                    {t("Confirmer le mot de passe", "Confirm password")}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 bg-white dark:bg-gray-800"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full h-12 bg-[#2ECC71] hover:bg-[#27AE60] text-black font-semibold rounded-lg"
                >
                  {isLoading ? t("Mise à jour...", "Updating...") : t("Mettre à jour", "Update")}
                </Button>
              </form>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-[#2ECC71]/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-[#2ECC71]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    {t("Mot de passe réinitialisé !", "Password reset!")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.", "Your password has been reset successfully. You can now log in.")}
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/connexion')}
                  className="w-full h-12 bg-[#2ECC71] hover:bg-[#27AE60] text-black font-semibold rounded-lg"
                >
                  {t("Se connecter", "Login")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Sparkles, BookOpen, Users, Trophy } from "lucide-react"
import { useLang } from "@/components/language-provider"

export default function FreeTrialActivationPage() {
  const { lang } = useLang()
  const router = useRouter()
  const [isActivating, setIsActivating] = useState(false)
  const [isActivated, setIsActivated] = useState(false)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const handleActivation = async () => {
    setIsActivating(true)
    // Simulate activation process
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsActivated(true)
    setIsActivating(false)

    // Redirect to courses after 3 seconds
    setTimeout(() => {
      router.push("/cours")
    }, 3000)
  }

  const benefits = [
    {
      icon: <BookOpen className="h-6 w-6 text-[#007BFF]" />,
      title: t("Cours Premium Complets", "Complete Premium Courses"),
      description: t("Accès à tous les niveaux A1-C2", "Access to all levels A1-C2"),
    },
    {
      icon: <Users className="h-6 w-6 text-[#2ECC71]" />,
      title: t("Sessions Live Illimitées", "Unlimited Live Sessions"),
      description: t("Participez à toutes les sessions en direct", "Join all live sessions"),
    },
    {
      icon: <Trophy className="h-6 w-6 text-[#F39C12]" />,
      title: t("Tests Blancs Complets", "Full Mock Exams"),
      description: t("Évaluations complètes avec corrections", "Complete assessments with corrections"),
    },
  ]

  if (isActivated) {
    return (
      <PageShell>
        <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-[#2ECC71] rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              🎉 {t("Essai Gratuit Activé!", "Free Trial Activated!")}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {t(
                "Votre essai gratuit de 24h est maintenant actif. Profitez de tous nos contenus premium!",
                "Your 24-hour free trial is now active. Enjoy all our premium content!",
              )}
            </p>
            <Badge className="bg-[#2ECC71] text-black text-lg px-4 py-2 mb-8">
              <Clock className="h-4 w-4 mr-2" />
              {t("Expire dans 24h", "Expires in 24h")}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {t("Redirection vers les cours...", "Redirecting to courses...")}
            </p>
          </div>
        </main>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-[#2ECC71] to-[#007BFF] rounded-full flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("Activez Votre Essai Gratuit", "Activate Your Free Trial")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t(
              "Découvrez tous nos contenus premium pendant 24 heures gratuitement. Aucune carte de crédit requise.",
              "Discover all our premium content for 24 hours free. No credit card required.",
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  {benefit.icon}
                </div>
                <CardTitle className="text-lg text-foreground">{benefit.title}</CardTitle>
                <CardDescription className="text-muted-foreground">{benefit.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="max-w-md mx-auto bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">{t("Prêt à Commencer?", "Ready to Start?")}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t("Cliquez pour activer votre essai gratuit maintenant", "Click to activate your free trial now")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{t("Durée de l'essai", "Trial Duration")}</span>
                <Badge className="bg-[#2ECC71] text-black">24 {t("heures", "hours")}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t("Accès complet", "Full Access")}</span>
                <CheckCircle2 className="h-4 w-4 text-[#2ECC71]" />
              </div>
            </div>

            <Button
              onClick={handleActivation}
              disabled={isActivating}
              className="w-full bg-gradient-to-r from-[#2ECC71] to-[#007BFF] hover:from-[#2ECC71]/90 hover:to-[#007BFF]/90 text-white font-semibold py-3"
            >
              {isActivating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t("Activation en cours...", "Activating...")}
                </>
              ) : (
                t("Activer l'Essai Gratuit", "Activate Free Trial")
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              {t(
                "En activant l'essai, vous acceptez nos conditions d'utilisation",
                "By activating the trial, you agree to our terms of service",
              )}
            </p>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  )
}

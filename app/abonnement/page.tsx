"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PageShell from "@/components/page-shell"
import { CheckCircle2, Crown, Shield, Sparkles, Loader2, AlertCircle, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"
import apiClient from "@/lib/api-client"

type Period = "monthly" | "quarterly" | "yearly"
type PlanType = "essential" | "premium" | "pro+"

export default function SubscriptionPage() {
  const { lang } = useLang()
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [period, setPeriod] = useState<Period>("monthly")
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)
  const [hoveredPlan, setHoveredPlan] = useState<PlanType | null>(null)
  const [showFreeTrialBanner, setShowFreeTrialBanner] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load subscription data from backend
  useEffect(() => {
    const loadSubscriptionData = async () => {
      if (!isAuthenticated || !user) return

      try {
        setLoading(true)
        setError(null)

        // Load available subscription plans
        const plansResponse = await apiClient.get('/subscription-plans')
        if (plansResponse.success && plansResponse.data) {
          setPlans(Array.isArray(plansResponse.data) ? plansResponse.data : [])
        }

        // Load current user subscription
        const subscriptionResponse = await apiClient.get('/users/subscription')
        if (subscriptionResponse.success && subscriptionResponse.data) {
          setCurrentSubscription(subscriptionResponse.data)
        }

      } catch (error) {
        console.error('Error loading subscription data:', error)
        setError(t("Erreur lors du chargement des données", "Error loading data"))
      } finally {
        setLoading(false)
      }
    }

    loadSubscriptionData()
  }, [isAuthenticated, user, t])

  // Handle subscription selection and payment
  const handleSubscribe = async (planType: PlanType) => {
    if (!isAuthenticated || !user) {
      router.push('/connexion')
      return
    }

    try {
      setIsProcessingPayment(true)
      setError(null)

      // Create Stripe checkout session
      const response = await apiClient.post('/payments/create-checkout-session', {
        planType,
        period,
        userId: user.id,
        successUrl: `${window.location.origin}/payment/confirmation`,
        cancelUrl: `${window.location.origin}/abonnement`
      })

      if (response.success && response.data) {
        const responseData = response.data as any
        if (responseData.url) {
          // Redirect to Stripe checkout
          window.location.href = responseData.url
        }
      } else {
        setError(t("Erreur lors de la création de la session de paiement", "Error creating payment session"))
      }

    } catch (error) {
      console.error('Error creating checkout session:', error)
      setError(t("Erreur lors du traitement du paiement", "Error processing payment"))
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Handle free trial activation
  const handleFreeTrial = async () => {
    if (!isAuthenticated || !user) {
      router.push('/connexion')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.post('/subscriptions/free-trial', {
        userId: user.id
      })

      if (response.success) {
        router.push('/free-trial-activation')
      } else {
        setError(t("Erreur lors de l'activation de l'essai gratuit", "Error activating free trial"))
      }

    } catch (error) {
      console.error('Error activating free trial:', error)
      setError(t("Erreur lors de l'activation de l'essai gratuit", "Error activating free trial"))
    } finally {
      setLoading(false)
    }
  }

  const getPrice = (basePriceMonthly: number) => {
    switch (period) {
      case "quarterly":
        return Math.round(basePriceMonthly * 2.7) // 10% discount
      case "yearly":
        return Math.round(basePriceMonthly * 10) // 2 months free
      default:
        return basePriceMonthly
    }
  }

  const getNextBillingDate = () => {
    const today = new Date()
    switch (period) {
      case "quarterly":
        return new Date(today.setMonth(today.getMonth() + 3)).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")
      case "yearly":
        return new Date(today.setFullYear(today.getFullYear() + 1)).toLocaleDateString(
          lang === "fr" ? "fr-FR" : "en-US",
        )
      default:
        return new Date(today.setMonth(today.getMonth() + 1)).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")
    }
  }

  const staticPlans = [
    {
      id: "essential" as PlanType,
      icon: <Shield className="h-6 w-6" />,
      title: t("Essentiel", "Essential"),
      description: t("Base pour démarrer", "Basics to get started"),
      monthlyPrice: 4500,
      features: [
        t("Cours fondamentaux (A1–B1)", "Core courses (A1–B1)"),
        t("5 tests blancs par mois", "5 mock exams per month"),
        t("2 sessions live par mois", "2 live sessions per month"),
        t("Aperçu du fil social", "Social feed preview"),
        t("Support par email", "Email support"),
      ],
      popular: false,
    },
    {
      id: "premium" as PlanType,
      icon: <Crown className="h-6 w-6" />,
      title: "Premium",
      description: t("Tout inclus pour réussir", "All‑inclusive for success"),
      monthlyPrice: 9500,
      features: [
        t("Cours complets (A1–C2)", "Full courses (A1–C2)"),
        t("Tests blancs illimités", "Unlimited mock exams"),
        t("Sessions live illimitées", "Unlimited live sessions"),
        t("Coach IA et feedback détaillé", "AI coach and detailed feedback"),
        t("Analyses avancées", "Advanced analytics"),
        t("Certificats de réussite", "Completion certificates"),
        t("Support prioritaire", "Priority support"),
      ],
      popular: true,
    },
    {
      id: "pro+" as PlanType,
      icon: <Sparkles className="h-6 w-6" />,
      title: t("Pro+", "Pro+"),
      description: t("Pour objectifs intensifs", "For intensive goals"),
      monthlyPrice: 14500,
      features: [
        t("Parcours personnalisés", "Personalized paths"),
        t("Sessions 1-on-1 avec managers", "1-on-1 sessions with managers"),
        t("Correction prioritaire", "Priority grading"),
        t("Rapports détaillés", "Detailed reports"),
        t("Accès anticipé aux nouveautés", "Early access to new features"),
        t("Garantie de réussite", "Success guarantee"),
        t("Support téléphonique", "Phone support"),
      ],
      popular: false,
    },
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price)
  }

  const handleContinue = () => {
    if (selectedPlan) {
      // Store selection in localStorage for payment page
      localStorage.setItem(
        "selectedPlan",
        JSON.stringify({
          plan: selectedPlan,
          period: period,
          price: getPrice(plans.find((p) => p.id === selectedPlan)?.monthlyPrice || 0),
          nextBilling: getNextBillingDate(),
        }),
      )
      router.push("/payment")
    }
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
        {showFreeTrialBanner && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white relative">
            <button
              onClick={() => setShowFreeTrialBanner(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">🎉 {t("Essai Gratuit 1 Jour", "1 Day Free Trial")}</div>
              <div className="text-lg opacity-90 mb-4">
                {t(
                  "Testez tous nos cours premium gratuitement pendant 24h",
                  "Try all our premium courses free for 24 hours",
                )}
              </div>
              <div className="text-sm opacity-80 mb-4">
                {t(
                  "Vous devez avoir un compte pour profiter de cette offre",
                  "You must have an account to enjoy this offer",
                )}
              </div>
              <button
                onClick={() => router.push("/free-trial-activation")}
                className="inline-block text-white border-b-2 border-white/60 hover:border-white transition-colors duration-200 text-sm font-medium pb-1"
              >
                {t("Continuer", "Continue")}
              </button>
            </div>
          </div>
        )}

        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold font-[var(--font-poppins)] text-foreground">
            {t("Abonnement", "Subscription")}
          </h1>
          <p className="text-muted-foreground">
            {t(
              "Débloquez tous les parcours, tests blancs et sessions live. Essai gratuit de 1 jour inclus.",
              "Unlock all paths, mock exams, and live sessions. Includes a 1‑day free trial.",
            )}
          </p>
        </header>

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-2 py-1">
          <button
            onClick={() => setPeriod("monthly")}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              period === "monthly" ? "bg-[#007BFF] text-white" : "hover:bg-accent text-muted-foreground"
            }`}
          >
            {t("Mensuel", "Monthly")}
          </button>
          <button
            onClick={() => setPeriod("quarterly")}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              period === "quarterly" ? "bg-[#007BFF] text-white" : "hover:bg-accent text-muted-foreground"
            }`}
          >
            {t("Trimestriel", "Quarterly")}
          </button>
          <button
            onClick={() => setPeriod("yearly")}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              period === "yearly" ? "bg-[#007BFF] text-white" : "hover:bg-accent text-muted-foreground"
            }`}
          >
            {t("Annuel", "Annual")}
          </button>
          {period === "quarterly" && (
            <Badge className="bg-[#2ECC71] text-black ml-2">{t("10% de réduction", "10% off")}</Badge>
          )}
          {period === "yearly" && (
            <Badge className="bg-[#2ECC71] text-black ml-2">{t("2 mois gratuits", "2 months free")}</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(plans.length > 0 ? plans : staticPlans).map((plan) => {
            const isSelected = selectedPlan === plan.id
            const isHovered = hoveredPlan === plan.id
            const price = getPrice(plan.monthlyPrice)

            return (
              <PlanCard
                key={plan.id}
                icon={plan.icon}
                title={plan.title}
                description={plan.description}
                price={price}
                period={period}
                features={plan.features}
                highlight={plan.popular}
                selected={isSelected}
                hovered={isHovered}
                onSelect={() => setSelectedPlan(plan.id)}
                onHover={() => setHoveredPlan(plan.id)}
                onLeave={() => setHoveredPlan(null)}
                trial
                cta={t("Sélectionner", "Select Plan")}
              />
            )
          })}
        </div>

        {selectedPlan && (
          <div className="mt-8 p-6 rounded-lg bg-card border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t("Plan sélectionné:", "Selected plan:")} {plans.find((p) => p.id === selectedPlan)?.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t("Prochaine facturation:", "Next billing:")} {getNextBillingDate()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">
                  {formatPrice(getPrice(plans.find((p) => p.id === selectedPlan)?.monthlyPrice || 0))} CFA
                </div>
                <div className="text-sm text-muted-foreground">
                  /
                  {period === "monthly"
                    ? t("mois", "mo")
                    : period === "quarterly"
                      ? t("trimestre", "quarter")
                      : t("an", "yr")}
                </div>
              </div>
            </div>
            <Button
              onClick={handleContinue}
              className="w-full mt-4 bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black font-semibold"
            >
              {t("Continuer vers le paiement", "Continue to Payment")}
            </Button>
          </div>
        )}

        {/* Comparison Table */}
        <section className="mt-16">
          <h2 className="text-xl font-semibold font-[var(--font-poppins)] mb-6 text-center text-foreground">
            {t("Comparaison détaillée", "Detailed comparison")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 dark:border-gray-700 rounded-lg">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-gray-200 dark:border-gray-700 p-4 text-left text-foreground">
                    {t("Fonctionnalités", "Features")}
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 p-4 text-center">Essential</th>
                  <th className="border border-gray-200 dark:border-gray-700 p-4 text-center bg-[#007BFF]/10">Premium</th>
                  <th className="border border-gray-200 dark:border-gray-700 p-4 text-center">Pro+</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-foreground">
                    {t("Cours A1-A2 (gratuits)", "A1-A2 courses (free)")}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">✓</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">✓</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">✓</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-foreground">{t("Cours B1-C2", "B1-C2 courses")}</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">B1 {t("seulement", "only")}</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">✓</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">✓</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-foreground">
                    {t("Tests blancs complets", "Full mock exams")}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">{t("Limité B1", "B1 limited")}</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">{t("Illimité", "Unlimited")}</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">{t("Illimité", "Unlimited")}</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-foreground">{t("Sessions live", "Live sessions")}</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">{t("2/semaine (limite B1)", "2/week (B1 limit)")}</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">{t("5/semaine (tous niveaux)", "5/week (all levels)")}</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">{t("5/semaine (tous niveaux) + 1-on-1", "5/week (all levels) + 1-on-1")}</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-foreground">
                    {t("Feedback IA avancé", "Advanced AI feedback")}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">—</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">✓</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-4 text-center">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </PageShell>
  )
}

function PlanCard({
  icon,
  title,
  description,
  price,
  period,
  features,
  highlight,
  selected,
  hovered,
  onSelect,
  onHover,
  onLeave,
  trial,
  cta,
}: {
  icon: React.ReactNode
  title: string
  description: string
  price: number
  period: Period
  features: string[]
  highlight?: boolean
  selected?: boolean
  hovered?: boolean
  onSelect?: () => void
  onHover?: () => void
  onLeave?: () => void
  trial?: boolean
  cta: string
}) {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price)
  }

  return (
    <Card
      className={`relative cursor-pointer transition-all duration-300 bg-card border-gray-200 dark:border-gray-700 ${
        highlight ? "ring-2 ring-[#2ECC71] shadow-lg" : ""
      } ${selected ? "ring-2 ring-[#007BFF] shadow-lg scale-105" : ""} ${hovered ? "shadow-xl scale-102" : ""}`}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-[#2ECC71] text-black">{t("Plus populaire", "Most popular")}</Badge>
        </div>
      )}

      <CardHeader className="space-y-1">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted">{icon}</div>
        <CardTitle className="text-xl text-foreground">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="text-3xl font-semibold text-foreground">{formatPrice(price)} CFA</div>
          <div className="text-muted-foreground text-sm">
            /
            {period === "monthly"
              ? t("mois", "mo")
              : period === "quarterly"
                ? t("trimestre", "quarter")
                : t("an", "yr")}
          </div>
        </div>

        {trial && (
          <Badge className="bg-[#2ECC71] text-black w-fit" variant="default">
            1‑day free trial
          </Badge>
        )}

        <ul className="space-y-2 text-sm">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#2ECC71] flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className={`w-full transition-all duration-200 ${
            selected
              ? "bg-[#007BFF] hover:bg-[#007BFF]/90 text-white"
              : "bg-muted hover:bg-accent text-foreground border border-gray-200 dark:border-gray-700"
          }`}
        >
          {selected ? t("Sélectionné", "Selected") : cta}
        </Button>
      </CardContent>
    </Card>
  )
}

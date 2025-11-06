"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Star,
  Target,
  Clock,
  Globe,
  Award,
  Zap,
  TrendingUp,
  Crown,
  ArrowRight,
  Sparkles,
  BookOpen,
  Mic,
  Users,
  Shield
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { CircularProgressCounter } from "@/components/circular-progress-counter"
import { motion } from "framer-motion"

const testTiers = [
  {
    id: "essentiel",
    title: { fr: "Essentiel", en: "Essential" },
    subtitle: { fr: "Parfait pour commencer", en: "Perfect to start" },
    description: { fr: "Tests B1 avec analyse complète", en: "B1 tests with full analysis" },
    icon: Shield,
    level: "B1",
    gradient: "from-blue-500 to-cyan-500",
    popular: false,
    features: [
      { fr: "✓ Tests B1 uniquement", en: "✓ B1 tests only" },
      { fr: "✓ 5 tests blancs/mois", en: "✓ 5 mock tests/month" },
      { fr: "✓ Analyse détaillée des résultats", en: "✓ Detailed results analysis" },
      { fr: "✓ Support email sous 24h", en: "✓ Email support within 24h" }
    ],
    redirectUrl: "/test-niveau/simulations?tier=essentiel&level=B1"
  },
  {
    id: "premium",
    title: { fr: "Premium", en: "Premium" },
    subtitle: { fr: "Le plus populaire", en: "Most popular" },
    description: { fr: "Tests complets B1-C2 + Simulations vocales", en: "Complete B1-C2 tests + Voice simulations" },
    icon: Star,
    level: "B1-C2",
    gradient: "from-purple-500 to-pink-500",
    popular: true,
    features: [
      { fr: "✓ Tests illimités B1-C2", en: "✓ Unlimited B1-C2 tests" },
      { fr: "✓ Simulations vocales IA", en: "✓ AI voice simulations" },
      { fr: "✓ Coach IA personnalisé", en: "✓ Personalized AI coach" },
      { fr: "✓ Certificats officiels", en: "✓ Official certificates" },
      { fr: "✓ Support prioritaire", en: "✓ Priority support" }
    ],
    redirectUrl: "/test-niveau/simulations?tier=premium&level=B1-C2",
    hasVoiceSimulation: true
  },
  {
    id: "pro",
    title: { fr: "Pro+", en: "Pro+" },
    subtitle: { fr: "Excellence garantie", en: "Excellence guaranteed" },
    description: { fr: "Accompagnement complet + Immigration", en: "Complete coaching + Immigration" },
    icon: Crown,
    level: "B1-C2",
    gradient: "from-orange-500 to-red-500",
    popular: false,
    features: [
      { fr: "✓ Tout Premium inclus", en: "✓ Everything in Premium" },
      { fr: "✓ Simulations immigration", en: "✓ Immigration simulations" },
      { fr: "✓ Sessions 1-on-1 avec tuteurs", en: "✓ 1-on-1 tutor sessions" },
      { fr: "✓ Parcours personnalisés", en: "✓ Personalized paths" },
      { fr: "✓ Garantie de réussite", en: "✓ Success guarantee" },
      { fr: "✓ Support téléphonique", en: "✓ Phone support" }
    ],
    redirectUrl: "/test-niveau/simulations?tier=pro&level=B1-C2",
    hasVoiceSimulation: true,
    hasImmigrationSimulation: true
  }
]

interface LevelAssessment {
  currentLevel: string
  subLevel: number
  confidence: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  nextLevelRequirements: string[]
  estimatedTimeToNextLevel: string
}

interface FreeAttemptsInfo {
  freeAttemptsUsed: number
  remainingFreeAttempts: number
  isBlocked: boolean
  subscriptionTier: string
}

export default function TestNiveauPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [userSubscription, setUserSubscription] = useState<string>("FREE")
  const [loading, setLoading] = useState(false)
  const [currentLevel, setCurrentLevel] = useState<LevelAssessment | null>(null)
  const [levelLoading, setLevelLoading] = useState(true)
  const [freeAttemptsInfo, setFreeAttemptsInfo] = useState<FreeAttemptsInfo | null>(null)

  useEffect(() => {
    fetchUserSubscription()
    fetchCurrentLevel()
    fetchFreeAttemptsInfo()
  }, [])

  const fetchUserSubscription = async () => {
    try {
      const response = await apiClient.get('/subscriptions/active')
      if (response.success && response.data) {
        const tier = (response.data as any).subscription?.tier || "FREE"
        setUserSubscription(tier)
      }
    } catch (error) {
      console.error('Error fetching user subscription:', error)
    }
  }

  const fetchCurrentLevel = async () => {
    try {
      setLevelLoading(true)
      const response = await apiClient.get('/simulations/level-history') as any
      if (response.success && response.data && response.data.currentAssessment) {
        setCurrentLevel(response.data.currentAssessment as LevelAssessment)
      } else {
        setCurrentLevel(null)
      }
    } catch (error) {
      console.error('Error fetching current level:', error)
      setCurrentLevel(null)
    } finally {
      setLevelLoading(false)
    }
  }

  const fetchFreeAttemptsInfo = async () => {
    try {
      const response = await apiClient.get('/simulations/free-attempts/count') as any
      if (response.success && response.data) {
        setFreeAttemptsInfo(response.data as FreeAttemptsInfo)
      }
    } catch (error) {
      console.error('Error fetching free attempts info:', error)
    }
  }

  const handleTestSelection = (testId: string) => {
    setSelectedTest(testId)
  }

  const handleContinue = () => {
    if (!selectedTest) {
      toast.error(t("Veuillez sélectionner un test", "Please select a test"))
      return
    }

    const test = testTiers.find(t => t.id === selectedTest)
    if (!test) return

    setLoading(true)

    // Check if user is blocked due to free attempts limit
    if (freeAttemptsInfo?.isBlocked && userSubscription === 'FREE') {
      toast.error(t(
        "Vous avez utilisé vos 5 simulations gratuites. Veuillez vous abonner pour continuer.",
        "You have used your 5 free simulations. Please subscribe to continue."
      ))
      setLoading(false)
      router.push('/abonnement')
      return
    }

    // Redirect to simulations
    setTimeout(() => {
      router.push(test.redirectUrl)
    }, 500)
  }

  const checkSubscriptionAccess = (testId: string): boolean => {
    const tierHierarchy = {
      "FREE": 0,
      "ESSENTIAL": 1,
      "PREMIUM": 2,
      "PRO": 3
    }
    
    const testMap = {
      "essentiel": 1,
      "premium": 2,
      "pro": 3
    }
    
    const userLevel = tierHierarchy[userSubscription as keyof typeof tierHierarchy] || 0
    const requiredLevel = testMap[testId as keyof typeof testMap] || 0
    
    return userLevel >= requiredLevel
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      {/* Hero Section with Circular Counter */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t("Test de Niveau TCF/TEF", "TCF/TEF Level Test")}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t(
                "Évaluez votre niveau de français et choisissez le parcours adapté à vos objectifs",
                "Assess your French level and choose the path suited to your goals"
              )}
            </p>
          </motion.div>

          {/* Circular Progress Counter - Center Stage */}
          {freeAttemptsInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-16"
            >
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                <CircularProgressCounter
                  used={freeAttemptsInfo.freeAttemptsUsed}
                  total={5}
                  size={200}
                  strokeWidth={16}
                  label={t("Simulations gratuites", "Free simulations")}
                />
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t(
                      "Tous les nouveaux utilisateurs bénéficient de 5 simulations gratuites",
                      "All new users get 5 free simulations"
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Current Level Assessment - Modern Card */}
      {!levelLoading && currentLevel && (
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-6xl mx-auto"
          >
            <Card className="bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 border-2 border-blue-200/50 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-3xl font-bold">
                  {t("Votre Niveau Actuel", "Your Current Level")}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {t("Basé sur vos performances précédentes", "Based on your previous performance")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Current Level */}
                  <div className="text-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8" />
                    </div>
                    <div className="text-4xl font-bold mb-2">{currentLevel.currentLevel}</div>
                    <div className="text-blue-100 text-sm">{t("Niveau actuel", "Current level")}</div>
                    <div className="mt-4 text-xs bg-white/20 rounded-full py-1 px-3 inline-block">
                      {Math.round(currentLevel.confidence)}% {t("confiance", "confidence")}
                    </div>
                  </div>

                  {/* Strengths */}
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <h3 className="font-semibold text-green-600">{t("Points forts", "Strengths")}</h3>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {currentLevel.strengths?.slice(0, 3).map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Next Goal */}
                  <div className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5" />
                      <h3 className="font-semibold">{t("Prochain objectif", "Next goal")}</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">
                        {currentLevel.estimatedTimeToNextLevel}
                      </div>
                      <div className="text-purple-100 text-xs">
                        {t("pour atteindre le niveau supérieur", "to reach next level")}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Modern Test Tier Cards */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              {t("Choisissez votre parcours", "Choose your path")}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t("Sélectionnez le niveau adapté à vos besoins", "Select the level suited to your needs")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {testTiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              >
                <ModernTierCard
                  tier={tier}
                  selected={selectedTest === tier.id}
                  onSelect={() => handleTestSelection(tier.id)}
                  t={t}
                />
              </motion.div>
            ))}
          </div>

          {/* Continue Button */}
          {selectedTest && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-16 text-center"
            >
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 max-w-2xl mx-auto border border-white/20 shadow-2xl">
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  {t("Prêt à commencer ?", "Ready to start?")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t(
                    `Vous avez sélectionné le parcours ${testTiers.find(t => t.id === selectedTest)?.title.fr}`,
                    `You selected the ${testTiers.find(t => t.id === selectedTest)?.title.en} path`
                  )}
                </p>
                <Button
                  onClick={handleContinue}
                  disabled={loading}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-full"
                >
                  {loading ? (
                    <>
                      <Clock className="w-5 h-5 mr-2 animate-spin" />
                      {t("Chargement...", "Loading...")}
                    </>
                  ) : (
                    <>
                      {t("Commencer l'évaluation", "Start Assessment")}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Additional Info Section */}
      <div className="container mx-auto px-4 py-16 mb-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-2xl">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t("Tests Adaptatifs", "Adaptive Tests")}</h3>
                  <p className="text-blue-100 text-sm">{t("Les questions s'adaptent à votre niveau", "Questions adapt to your level")}</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t("Suivi de Progression", "Progress Tracking")}</h3>
                  <p className="text-blue-100 text-sm">{t("Visualisez votre évolution en temps réel", "Track your progress in real-time")}</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t("Certificats Officiels", "Official Certificates")}</h3>
                  <p className="text-blue-100 text-sm">{t("Obtenez des certificats reconnus", "Get recognized certificates")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Modern Tier Card Component
interface ModernTierCardProps {
  tier: typeof testTiers[0]
  selected: boolean
  onSelect: () => void
  t: (fr: string, en: string) => string
}

function ModernTierCard({ tier, selected, onSelect, t }: ModernTierCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const Icon = tier.icon

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full"
    >
      <Card
        onClick={onSelect}
        className={`
          relative h-full cursor-pointer transition-all duration-300 overflow-hidden
          ${selected 
            ? 'ring-4 ring-blue-500 shadow-2xl scale-105' 
            : 'hover:shadow-xl shadow-lg'
          }
          ${tier.popular ? 'border-2 border-yellow-400' : 'border border-gray-200 dark:border-gray-700'}
        `}
      >
        {/* Popular Badge */}
        {tier.popular && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
              <Sparkles className="w-3 h-3 mr-1" />
              {t("Populaire", "Popular")}
            </Badge>
          </div>
        )}

        {/* Gradient Header */}
        <div className={`bg-gradient-to-br ${tier.gradient} p-8 text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
              <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{tier.title.fr}</h3>
            <p className="text-sm opacity-90">{tier.subtitle.fr}</p>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            {tier.description.fr}
          </p>

          {/* Level Badge */}
          <div className="flex justify-center mb-6">
            <Badge variant="outline" className="px-4 py-1 text-sm font-semibold">
              {t("Niveau", "Level")}: {tier.level}
            </Badge>
          </div>

          {/* Features List */}
          <ul className="space-y-3 mb-6">
            {tier.features.map((feature, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-start gap-2 text-sm"
              >
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{feature.fr}</span>
              </motion.li>
            ))}
          </ul>

          {/* Special Features Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tier.hasVoiceSimulation && (
              <Badge className="bg-purple-100 text-purple-700 border-0">
                <Mic className="w-3 h-3 mr-1" />
                {t("Vocal", "Voice")}
              </Badge>
            )}
            {tier.hasImmigrationSimulation && (
              <Badge className="bg-green-100 text-green-700 border-0">
                <Globe className="w-3 h-3 mr-1" />
                {t("Immigration", "Immigration")}
              </Badge>
            )}
          </div>

          {/* Select Button */}
          <Button
            onClick={onSelect}
            className={`
              w-full py-6 rounded-xl font-semibold transition-all duration-300
              ${selected
                ? `bg-gradient-to-r ${tier.gradient} text-white shadow-lg`
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
              }
            `}
          >
            {selected ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                {t("Sélectionné", "Selected")}
              </>
            ) : (
              <>
                {t("Choisir ce parcours", "Choose this path")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </CardContent>

        {/* Hover Effect Overlay */}
        {isHovered && !selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-5 pointer-events-none`}
          />
        )}

        {/* Selected Ring Animation */}
        {selected && (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 border-4 border-blue-500/50 rounded-lg pointer-events-none"
          />
        )}
      </Card>
    </motion.div>
  )
}


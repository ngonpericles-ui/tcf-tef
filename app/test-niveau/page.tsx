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
  Shield,
  Crown,
  TrendingUp,
  BookOpen,
  Mic,
  Users,
  Zap,
  BarChart3,
  Sparkles
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { CircularProgressCounter } from "@/components/circular-progress-counter"
import { motion } from "framer-motion"

const testLevels = [
  {
    id: "essentiel",
    title: { fr: "Essentiel", en: "Essential" },
    description: { fr: "Tests B1 avec analyse", en: "B1 tests with analysis" },
    icon: Shield,
    level: "B1",
    popular: false,
    features: [
      { fr: "Tests B1 uniquement", en: "B1 tests only" },
      { fr: "5 tests blancs/mois", en: "5 mock tests/month" },
      { fr: "Analyse détaillée", en: "Detailed analysis" },
      { fr: "Support email", en: "Email support" }
    ],
    redirectUrl: "/test-niveau/simulations?tier=essentiel&level=B1"
  },
  {
    id: "premium",
    title: { fr: "Premium", en: "Premium" },
    description: { fr: "Tests complets B1-C2", en: "Complete B1-C2 tests" },
    icon: Star,
    level: "B1-C2",
    popular: true,
    features: [
      { fr: "Tests illimités B1-C2", en: "Unlimited B1-C2 tests" },
      { fr: "Coach IA", en: "AI Coach" },
      { fr: "Certificats officiels", en: "Official certificates" },
      { fr: "Support prioritaire", en: "Priority support" }
    ],
    redirectUrl: "/test-niveau/simulations?tier=premium&level=B1-C2"
  },
  {
    id: "pro",
    title: { fr: "Pro+", en: "Pro+" },
    description: { fr: "Accompagnement personnalisé", en: "Personalized coaching" },
    icon: Crown,
    level: "B1-C2",
    popular: false,
    features: [
      { fr: "Parcours personnalisés", en: "Personalized paths" },
      { fr: "Sessions 1-on-1", en: "1-on-1 sessions" },
      { fr: "Garantie de réussite", en: "Success guarantee" },
      { fr: "Support téléphonique", en: "Phone support" }
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
  totalSimulationsUsed: number
  remainingSimulations: number // -1 means unlimited
  maxSimulations: number // -1 means unlimited
  subscriptionTier: string
  isBlocked: boolean
  canAccessPaid: boolean
  // Legacy fields for backward compatibility
  freeAttemptsUsed?: number
  remainingFreeAttempts?: number
  userTier?: string
}

export default function TestNiveauPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [userSubscription, setUserSubscription] = useState<string>("FREE")
  const [loading, setLoading] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
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
      const response = await apiClient.get('/auth/profile')
      if (response.success && response.data) {
        // Handle both user.subscriptionTier and direct subscriptionTier
        const tier = (response.data as any).user?.subscriptionTier || (response.data as any).subscriptionTier || "FREE"
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
        // Use the complete assessment data from the new backend API structure
        const assessmentData = response.data.currentAssessment
        setCurrentLevel(assessmentData as LevelAssessment)
      } else {
        // No assessment exists yet - don't set fallback data
        setCurrentLevel(null)
      }
    } catch (error) {
      console.error('Error fetching current level:', error)
      // Don't set fallback data - user needs to take a test first
      setCurrentLevel(null)
    } finally {
      setLevelLoading(false)
    }
  }

  const fetchFreeAttemptsInfo = async () => {
    try {
      const response = await apiClient.get('/simulations/free-attempts/count') as any
      if (response.success && response.data) {
        console.log('🔍 Frontend received free attempts info:', response.data)
        console.log('🔍 Max simulations:', response.data.maxSimulations)
        console.log('🔍 Subscription tier:', response.data.subscriptionTier)
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
    if (!selectedTest) return

    const test = testLevels.find(t => t.id === selectedTest)
    if (!test) return

    setLoading(true)

    // Check if user is blocked (reached simulation limit)
    if (freeAttemptsInfo?.isBlocked) {
      const maxSims = freeAttemptsInfo.maxSimulations === -1 ? 'illimitées' : freeAttemptsInfo.maxSimulations
      toast.error(t(
        `Vous avez utilisé toutes vos simulations (${maxSims}). Veuillez vous abonner pour continuer.`,
        `You have used all your simulations (${maxSims}). Please subscribe to continue.`
      ))
      setLoading(false)
      router.push('/abonnement')
      return
    }

    // Check subscription access
    const hasAccess = checkSubscriptionAccess(test.id, userSubscription)

    if (!hasAccess) {
      toast.error(t(
        "Abonnement requis pour accéder à ce test",
        "Subscription required to access this test"
      ))
      setLoading(false)
      return
    }

    // Redirect to the test
    router.push(test.redirectUrl)
  }

  const checkSubscriptionAccess = (testId: string, userTier: string): boolean => {
    const tierHierarchy = {
      "FREE": 0,
      "ESSENTIAL": 1,
      "PREMIUM": 2,
      "PRO": 3
    }

    const testTierMap = {
      "essentiel": 1,
      "premium": 2,
      "pro": 3
    }

    const userLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0
    const requiredLevel = testTierMap[testId as keyof typeof testTierMap] || 0

    return userLevel >= requiredLevel
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Enhanced Hero Section with Visuals */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:32px_32px]"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
              >
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {t("Évaluation de Niveau", "Level Assessment")}
                </span>
              </motion.div>

              {/* Main Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent leading-tight">
                {t("Testez Votre Niveau de Français", "Test Your French Level")}
          </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                {t(
                  "Déterminez votre niveau de français (A1 à C2) avec nos tests TCF/TEF officiels. Obtenez une évaluation précise, des recommandations personnalisées et un certificat reconnu.",
                  "Determine your French level (A1 to C2) with our official TCF/TEF tests. Get accurate assessment, personalized recommendations, and a recognized certificate."
                )}
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: CheckCircle, text: t("Tests Officiels", "Official Tests"), desc: t("TCF/TEF", "TCF/TEF") },
                  { icon: Award, text: t("Certificat", "Certificate"), desc: t("Reconnu", "Recognized") },
                  { icon: BarChart3, text: t("Analyse Détaillée", "Detailed Analysis"), desc: t("Progression", "Progress") }
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="flex flex-col items-center lg:items-start gap-2 p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                  >
                    <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{feature.text}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{feature.desc}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side: Visual Element with Counter */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center justify-center"
            >
              {/* Visual Illustration */}
              <div className="relative w-full max-w-md mb-8">
                {/* SVG Illustration */}
                <svg viewBox="0 0 400 300" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background circles */}
                  <circle cx="200" cy="150" r="120" fill="url(#gradient1)" opacity="0.1"/>
                  <circle cx="200" cy="150" r="80" fill="url(#gradient2)" opacity="0.15"/>
                  
                  {/* Document/Test illustration */}
                  <rect x="140" y="80" width="120" height="140" rx="8" fill="white" stroke="#3B82F6" strokeWidth="2"/>
                  <rect x="150" y="100" width="100" height="4" rx="2" fill="#3B82F6" opacity="0.3"/>
                  <rect x="150" y="120" width="80" height="4" rx="2" fill="#3B82F6" opacity="0.3"/>
                  <rect x="150" y="140" width="90" height="4" rx="2" fill="#3B82F6" opacity="0.3"/>
                  <circle cx="200" cy="170" r="15" fill="#10B981"/>
                  <path d="M193 170 L198 175 L207 166" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  
                  {/* Level indicators */}
                  <circle cx="120" cy="80" r="25" fill="#8B5CF6" opacity="0.2"/>
                  <circle cx="280" cy="80" r="25" fill="#EC4899" opacity="0.2"/>
                  <circle cx="120" cy="220" r="25" fill="#F59E0B" opacity="0.2"/>
                  <circle cx="280" cy="220" r="25" fill="#06B6D4" opacity="0.2"/>
                  
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6"/>
                      <stop offset="100%" stopColor="#8B5CF6"/>
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6"/>
                      <stop offset="100%" stopColor="#EC4899"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Circular Progress Counter - Placed Below Visual */}
              {freeAttemptsInfo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="w-full max-w-sm"
                >
                  <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border-2 border-blue-100 dark:border-blue-900">
                    <CircularProgressCounter
                      used={freeAttemptsInfo.totalSimulationsUsed || 0}
                      total={freeAttemptsInfo.maxSimulations === -1 || freeAttemptsInfo.maxSimulations === null || freeAttemptsInfo.maxSimulations === undefined
                        ? Infinity
                        : (freeAttemptsInfo.maxSimulations || 5)}
                      size={180}
                      strokeWidth={14}
                      label={freeAttemptsInfo.subscriptionTier === 'FREE' 
                        ? t("Simulations gratuites", "Free simulations")
                        : t("Simulations disponibles", "Available simulations")}
                    />
                    <div className="mt-4 text-center">
                      {freeAttemptsInfo.isBlocked ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                            {t("Simulations épuisées", "Simulations exhausted")}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {freeAttemptsInfo.maxSimulations === -1 
                              ? t("Limite atteinte", "Limit reached")
                              : t(`Vous avez utilisé toutes vos ${freeAttemptsInfo.maxSimulations} simulations.`, 
                                  `You have used all your ${freeAttemptsInfo.maxSimulations} simulations.`)}
                          </p>
                          <Button 
                            onClick={() => router.push('/abonnement')} 
                            className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                            size="sm"
                          >
                            {t("S'abonner", "Subscribe")}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {freeAttemptsInfo.maxSimulations === -1 
                              ? t("Simulations illimitées", "Unlimited simulations")
                              : t(`Il vous reste ${freeAttemptsInfo.remainingSimulations} simulation${freeAttemptsInfo.remainingSimulations !== 1 ? "s" : ""}`, 
                                  `You have ${freeAttemptsInfo.remainingSimulations} simulation${freeAttemptsInfo.remainingSimulations !== 1 ? "s" : ""} left`)}
                          </p>
                          {freeAttemptsInfo.subscriptionTier !== 'FREE' && freeAttemptsInfo.remainingSimulations <= 5 && freeAttemptsInfo.remainingSimulations > 0 && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                              {t("Bientôt épuisé", "Running low")}
                            </p>
                          )}
                        </div>
                      )}
              </div>
            </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Current Level Assessment Section */}
      {!levelLoading && (
        <div className="relative py-16 md:py-24 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-4 max-w-6xl">
              {currentLevel ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                      {t("Votre Niveau Actuel", "Your Current Level")}
                    </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                      {t("Basé sur vos performances précédentes", "Based on your previous performance")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Current Level Card */}
                  <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-800">
                      <CardHeader>
                      <div className="mx-auto w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <Award className="w-8 h-8 text-white" />
                        </div>
                      <CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {currentLevel.currentLevel}
                        </CardTitle>
                      <CardDescription className="text-base mt-2">
                          {t("Niveau actuel", "Current level")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                      <Badge variant="secondary" className="mt-2">
                          {t("Confiance:", "Confidence:")} {Math.round(currentLevel.confidence)}%
                      </Badge>
                      </CardContent>
                    </Card>

                    {/* Strengths Card */}
                  <Card className="p-6 border-2 border-green-200 dark:border-green-800">
                      <CardHeader>
                      <CardTitle className="text-lg font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          {t("Points forts", "Strengths")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                      <ul className="space-y-3 text-sm">
                          {currentLevel.strengths && currentLevel.strengths.length > 0 ? (
                            currentLevel.strengths.slice(0, 3).map((strength, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                              </li>
                            ))
                          ) : (
                          <li className="text-gray-500 dark:text-gray-400 text-sm">
                            {t("Effectuez un test pour identifier vos forces", "Take a test to identify your strengths")}
                            </li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Next Level Card */}
                  <Card className="p-6 border-2 border-purple-200 dark:border-purple-800">
                      <CardHeader>
                      <CardTitle className="text-lg font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          {t("Objectif suivant", "Next goal")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {currentLevel.estimatedTimeToNextLevel}
                          </span>
                          </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {currentLevel.recommendations && currentLevel.recommendations.length > 0 
                              ? currentLevel.recommendations[0]
                            : t("Recommandations disponibles après le test", "Recommendations available after test")
                            }
                        </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
              </motion.div>
              ) : (
              // Modern empty state design
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center py-16"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                  <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {t("Prêt à commencer ?", "Ready to start?")}
                  </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                    {t(
                    "Vous n'avez pas encore effectué de test de niveau. Sélectionnez un parcours ci-dessous pour obtenir une évaluation personnalisée de votre niveau de français.",
                    "You haven't taken a level test yet. Select a path below to get a personalized assessment of your French level."
                    )}
                  </p>
                <div className="flex items-center justify-center gap-2 mt-8">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"
                    />
                  ))}
                </div>
              </motion.div>
              )}
          </div>
        </div>
      )}

      {/* Modern Test Cards Section */}
      <div className="relative py-20 md:py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t("Choisissez votre parcours", "Choose your path")}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t("Sélectionnez le niveau adapté à vos besoins et objectifs", "Select the level suited to your needs and goals")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testLevels.map((test, index) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
            <TestCard
              title={test.title.fr}
              description={test.description.fr}
              icon={test.icon}
              level={test.level}
              features={test.features.map(f => f.fr)}
              popular={test.popular}
              selected={selectedTest === test.id}
              hovered={hoveredCard === test.id}
              onSelect={() => handleTestSelection(test.id)}
              onHover={() => setHoveredCard(test.id)}
              onLeave={() => setHoveredCard(null)}
              tier={test.id}
                  hasVoiceSimulation={test.hasVoiceSimulation}
                  hasImmigrationSimulation={test.hasImmigrationSimulation}
            />
              </motion.div>
          ))}
        </div>

          {/* Selected Test Info - Modern Premium Design */}
        {selectedTest && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-16 max-w-6xl mx-auto"
            >
              <Card className="overflow-hidden border-0 shadow-2xl bg-white dark:bg-gray-900">
                {/* Premium Header with Gradient */}
                <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-8">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                        {(() => {
                          const selected = testLevels.find(t => t.id === selectedTest)
                          const IconComponent = selected?.icon || Crown
                          return <IconComponent className="w-8 h-8 text-white" />
                        })()}
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-1">
                          {testLevels.find(t => t.id === selectedTest)?.title.fr}
                        </h3>
                        <p className="text-blue-100 text-base">
                          {testLevels.find(t => t.id === selectedTest)?.description.fr}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border border-white/30 px-5 py-2 text-sm font-semibold shadow-lg">
                      {t("Niveau", "Level")} {testLevels.find(t => t.id === selectedTest)?.level}
                    </Badge>
                  </div>
                  
                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                </div>

              {/* Content Section */}
              <CardContent className="p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
                  {/* Features - Left Column */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t("Ce qui est inclus", "What's included")}
                      </h4>
                    </div>
                    <ul className="space-y-4">
                      {testLevels.find(t => t.id === selectedTest)?.features.map((feature, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-4 group"
                        >
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 text-base leading-relaxed flex-1">
                            {feature.fr}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits - Right Column */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t("Avantages", "Benefits")}
                      </h4>
                    </div>
                    <div className="space-y-4">
                      {selectedTest === 'essentiel' && (
                        <>
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                          >
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-base leading-relaxed flex-1 pt-1">
                              Tests B1 avec analyse détaillée
                            </span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                          >
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-base leading-relaxed flex-1 pt-1">
                              5 tests blancs par mois
                            </span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                          >
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-base leading-relaxed flex-1 pt-1">
                              Support par email
                            </span>
                          </motion.div>
                        </>
                      )}
                      {selectedTest === 'premium' && (
                        <>
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 transition-all group"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                              <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-base leading-relaxed flex-1 pt-1">
                              Tests complets B1-C2 illimités
                            </span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 transition-all group"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                              <Zap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-base leading-relaxed flex-1 pt-1">
                              Coach IA et feedback détaillé
                            </span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 transition-all group"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                              <Award className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-base leading-relaxed flex-1 pt-1">
                              Certificats de réussite officiels
                            </span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 transition-all group"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-base leading-relaxed flex-1 pt-1">
                              Support prioritaire
                            </span>
                          </motion.div>
                        </>
                      )}
                      {selectedTest === 'pro' && (
                        <>
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:via-indigo-900/30 dark:hover:to-purple-900/30 transition-all group"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                              <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-base leading-relaxed flex-1 pt-1">
                              Parcours personnalisés avec managers
                            </span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:via-indigo-900/30 dark:hover:to-purple-900/30 transition-all group"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-base leading-relaxed flex-1 pt-1">
                              Sessions 1-on-1 et correction prioritaire
                            </span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:via-indigo-900/30 dark:hover:to-purple-900/30 transition-all group"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                              <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-base leading-relaxed flex-1 pt-1">
                              Rapports détaillés et garantie de réussite
                            </span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:via-indigo-900/30 dark:hover:to-purple-900/30 transition-all group"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-base leading-relaxed flex-1 pt-1">
                              Support téléphonique et accès anticipé
                            </span>
                          </motion.div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Section - Modern Design */}
                <div className="pt-10 border-t-2 border-gray-100 dark:border-gray-800">
                  <div className="text-center space-y-6">
                    <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
                      {t(
                        "Prêt à commencer votre évaluation ? Cliquez sur Continuer pour accéder à vos tests.",
                        "Ready to start your assessment? Click Continue to access your tests."
                      )}
                    </p>

                    <div className="flex flex-col items-center gap-5">
                      <Button
                        onClick={handleContinue}
                        disabled={loading}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white px-16 py-7 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 rounded-2xl"
                      >
                        {loading ? (
                          <>
                            <Clock className="w-6 h-6 mr-3 animate-spin" />
                            {t("Chargement...", "Loading...")}
                          </>
                        ) : (
                          <>
                            <Target className="w-6 h-6 mr-3" />
                            {t("Continuer l'évaluation", "Continue Assessment")}
                          </>
                        )}
                      </Button>

                      {/* Additional Actions - Modern Button Design */}
                      {(selectedTest === 'premium' || selectedTest === 'pro') && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
                          <Button
                            onClick={() => router.push('/simulation-vocale')}
                            variant="outline"
                            size="lg"
                            className="border-2 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl px-8 py-6 transition-all group"
                          >
                            <Mic className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            {t("Simulation Vocale", "Voice Simulation")}
                          </Button>
                          {selectedTest === 'pro' && (
                            <Button
                              onClick={() => router.push('/immigration-simulations')}
                              variant="outline"
                              size="lg"
                              className="border-2 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl px-8 py-6 transition-all group"
                            >
                              <Globe className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                              {t("Simulation Immigration", "Immigration Simulation")}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
          </div>
      </div>
    </div>
  )
}

// Modern Test Card Component
interface TestCardProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  level: string
  features: string[]
  popular: boolean
  selected: boolean
  hovered: boolean
  onSelect: () => void
  onHover: () => void
  onLeave: () => void
  tier: string
  hasVoiceSimulation?: boolean
  hasImmigrationSimulation?: boolean
}

function TestCard({
  title,
  description,
  icon: IconComponent,
  level,
  features,
  popular,
  selected,
  hovered,
  onSelect,
  onHover,
  onLeave,
  tier,
  hasVoiceSimulation,
  hasImmigrationSimulation
}: TestCardProps) {
  const { t } = useLanguage()

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
    <Card
        className={`relative cursor-pointer transition-all duration-300 h-full flex flex-col ${
          selected
            ? "border-2 border-blue-500 shadow-xl ring-4 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20"
            : "border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg"
        } ${popular && !selected ? "border-green-300 dark:border-green-700" : ""}`}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
        {/* Popular Badge */}
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
            <Badge className="bg-green-500 text-white font-semibold px-3 py-1 shadow-lg border-0">
              <Sparkles className="w-3 h-3 mr-1.5" />
            {t("Plus populaire", "Most popular")}
          </Badge>
        </div>
      )}

        {/* Selected Indicator */}
          {selected && (
          <div className="absolute top-4 right-4 z-10">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            </div>
          )}

        <CardHeader className="p-6 pb-4">
          {/* Icon */}
          <div
            className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4 transition-colors ${
              selected
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            <IconComponent className="w-7 h-7" />
        </div>
        
          {/* Title & Description */}
        <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </CardDescription>
        </div>

        {/* Level Badge */}
          <div className="mt-4">
            <Badge
              variant="outline"
              className={`text-xs font-semibold ${
                selected
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            >
              {t("Niveau", "Level")} {level}
          </Badge>
        </div>
        </CardHeader>

        <CardContent className="p-6 pt-0 flex-1 flex flex-col">
        {/* Features List */}
          <div className="flex-1">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              {t("Inclus", "Included")}
          </h4>
            <ul className="space-y-2.5">
            {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <CheckCircle
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      selected
                        ? "text-blue-500"
                        : "text-green-500 dark:text-green-400"
                    }`}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {feature}
                  </span>
            </li>
          ))}
        </ul>
        </div>

          {/* Special Features */}
          {(hasVoiceSimulation || hasImmigrationSimulation) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
              {hasVoiceSimulation && (
                <Badge variant="secondary" className="text-xs">
                  <Mic className="w-3 h-3 mr-1" />
                  {t("Vocal", "Voice")}
                </Badge>
              )}
              {hasImmigrationSimulation && (
                <Badge variant="secondary" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  {t("Immigration", "Immigration")}
                </Badge>
              )}
            </div>
          )}

          {/* Selection Button */}
          <div className="mt-6">
            <Button
              className={`w-full ${
                selected
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
              }`}
              onClick={onSelect}
            >
              {selected ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t("Sélectionné", "Selected")}
                </>
              ) : (
                <>
                  {t("Choisir", "Select")}
                  <Target className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
      </CardContent>
    </Card>
    </motion.div>
  )
}

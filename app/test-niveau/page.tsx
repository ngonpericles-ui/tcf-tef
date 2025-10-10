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
  Award
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

const testLevels = [
  {
    id: "gratuit",
    title: { fr: "Gratuit", en: "Free" },
    description: { fr: "Tests de base A1-A2", en: "Basic A1-A2 tests" },
    icon: <Target className="w-6 h-6" />,
    level: "A1-A2",
    popular: false,
    features: [
      { fr: "Tests A1-A2 uniquement", en: "A1-A2 tests only" },
      { fr: "Résultats immédiats", en: "Immediate results" },
      { fr: "Support communautaire", en: "Community support" }
    ],
    redirectUrl: "/test-niveau/simulations?tier=gratuit&level=A1-A2"
  },
  {
    id: "essentiel",
    title: { fr: "Essentiel", en: "Essential" },
    description: { fr: "Tests A1-B1 avec analyse", en: "A1-B1 tests with analysis" },
    icon: <CheckCircle className="w-6 h-6" />,
    level: "A1-B1",
    popular: false,
    features: [
      { fr: "Tests A1-B1", en: "A1-B1 tests" },
      { fr: "5 tests blancs/mois", en: "5 mock tests/month" },
      { fr: "Analyse détaillée", en: "Detailed analysis" },
      { fr: "Support email", en: "Email support" }
    ],
    redirectUrl: "/test-niveau/simulations?tier=essentiel&level=A1-B1"
  },
  {
    id: "premium",
    title: { fr: "Premium", en: "Premium" },
    description: { fr: "Tests complets A1-C2", en: "Complete A1-C2 tests" },
    icon: <Star className="w-6 h-6" />,
    level: "A1-C2",
    popular: true,
    features: [
      { fr: "Tests illimités A1-C2", en: "Unlimited A1-C2 tests" },
      { fr: "Coach IA", en: "AI Coach" },
      { fr: "Certificats officiels", en: "Official certificates" },
      { fr: "Support prioritaire", en: "Priority support" }
    ],
    redirectUrl: "/test-niveau/simulations?tier=premium&level=A1-C2"
  },
  {
    id: "pro",
    title: { fr: "Pro+", en: "Pro+" },
    description: { fr: "Accompagnement personnalisé", en: "Personalized coaching" },
    icon: <Globe className="w-6 h-6" />,
    level: "A1-C2",
    popular: false,
    features: [
      { fr: "Parcours personnalisés", en: "Personalized paths" },
      { fr: "Sessions 1-on-1", en: "1-on-1 sessions" },
      { fr: "Garantie de réussite", en: "Success guarantee" },
      { fr: "Support téléphonique", en: "Phone support" }
    ],
    redirectUrl: "/test-niveau/simulations?tier=pro&level=A1-C2",
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

export default function TestNiveauPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [userSubscription, setUserSubscription] = useState<string>("FREE")
  const [loading, setLoading] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [currentLevel, setCurrentLevel] = useState<LevelAssessment | null>(null)
  const [levelLoading, setLevelLoading] = useState(true)

  useEffect(() => {
    fetchUserSubscription()
    fetchCurrentLevel()
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
      const response = await apiClient.get('/simulations/level-history')
      if (response.success && response.data) {
        // Set current level from the API response
        const currentLevelData = {
          level: response.data.currentLevel || 'A1',
          confidence: response.data.history.length > 0 ? response.data.history[0].confidence : 0.5,
          lastAssessment: response.data.history.length > 0 ? response.data.history[0].createdAt : null,
          totalAssessments: response.data.history.length
        }
        setCurrentLevel(currentLevelData as LevelAssessment)
      }
    } catch (error) {
      console.error('Error fetching current level:', error)
      // Set default level if API fails
      setCurrentLevel({
        level: 'A1',
        confidence: 0.5,
        lastAssessment: null,
        totalAssessments: 0
      } as LevelAssessment)
    } finally {
      setLevelLoading(false)
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
      "gratuit": 0,
      "essentiel": 1,
      "premium": 2,
      "pro": 3
    }

    const userLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0
    const requiredLevel = testTierMap[testId as keyof typeof testTierMap] || 0

    return userLevel >= requiredLevel
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="French language learning and assessment"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Target className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Test de Niveau
          </h1>

            <p className="text-xl md:text-2xl text-emerald-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              <strong className="text-white font-semibold">Évaluez votre niveau de français</strong> avec nos tests adaptés à vos objectifs.
              Découvrez votre niveau actuel, identifiez vos points forts et planifiez votre progression.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-emerald-200 mb-8">
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2 text-emerald-300" />
                Évaluation précise
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2 text-emerald-300" />
                Certificat de niveau
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-2 text-emerald-300" />
                Progression personnalisée
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Level Assessment Section */}
      {!levelLoading && currentLevel && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  {t("Votre Niveau Actuel", "Your Current Level")}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t("Basé sur vos performances précédentes", "Based on your previous performance")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Level Card */}
                <Card className="text-center p-6 bg-white/80 backdrop-blur-sm border-2 border-blue-200">
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Award className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-blue-600">
                      {currentLevel.currentLevel}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {t("Niveau actuel", "Current level")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {t("Confiance:", "Confidence:")} {Math.round(currentLevel.confidence)}%
                    </div>
                  </CardContent>
                </Card>

                {/* Strengths Card */}
                <Card className="p-6 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-green-600 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      {t("Points forts", "Strengths")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {currentLevel.strengths.slice(0, 3).map((strength, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Next Level Card */}
                <Card className="p-6 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-purple-600 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      {t("Objectif suivant", "Next goal")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <div className="font-medium">
                        {t("Temps estimé:", "Estimated time:")} {currentLevel.estimatedTimeToNextLevel}
                      </div>
                      <div className="text-muted-foreground">
                        {currentLevel.recommendations[0]}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Cards - Square-like design */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {testLevels.map((test) => (
            <TestCard
              key={test.id}
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
            />
          ))}
        </div>

        {/* Selected Test Info - Enhanced Design */}
        {selectedTest && (
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-blue-200 dark:border-blue-700 shadow-xl overflow-hidden">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {testLevels.find(t => t.id === selectedTest)?.title.fr}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {testLevels.find(t => t.id === selectedTest)?.description.fr}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/80 text-sm">Niveau</div>
                    <div className="text-white font-semibold text-lg">
                      {testLevels.find(t => t.id === selectedTest)?.level}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Features */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      Ce qui est inclus
                    </h4>
                    <ul className="space-y-3">
                      {testLevels.find(t => t.id === selectedTest)?.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-700 dark:text-gray-300">{feature.fr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Column - Benefits */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                      <Star className="w-5 h-5 text-yellow-500 mr-2" />
                      Avantages
                    </h4>
                    <div className="space-y-3">
                      {selectedTest === 'gratuit' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">Tests de base A1-A2 uniquement</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">Résultats immédiats sans analyse</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">Support communautaire uniquement</span>
                          </div>
                        </>
                      )}
                      {selectedTest === 'essentiel' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">Tests A1-B1 avec analyse détaillée</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">5 tests blancs par mois</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">Support par email</span>
                          </div>
                        </>
                      )}
                      {selectedTest === 'premium' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">Tests complets A1-C2 illimités</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">Coach IA et feedback détaillé</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">Certificats de réussite officiels</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">Support prioritaire</span>
                          </div>
                        </>
                      )}
                      {selectedTest === 'pro' && (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">Parcours personnalisés avec managers</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">Sessions 1-on-1 et correction prioritaire</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">Rapports détaillés et garantie de réussite</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">Support téléphonique et accès anticipé</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Section */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                {t(
                        "Prêt à commencer votre évaluation ? Cliquez sur Continuer pour accéder à vos tests.",
                        "Ready to start your assessment? Click Continue to access your tests."
                )}
              </p>

              {/* Main Continue Button */}
              <div className="space-y-4">
                <Button
                  onClick={handleContinue}
                  disabled={loading}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-12 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loading ? (
                    <>
                            <Clock className="w-5 h-5 mr-2 animate-spin" />
                      {t("Chargement...", "Loading...")}
                    </>
                  ) : (
                          <>
                            <Target className="w-5 h-5 mr-2" />
                            {t("Continuer l'évaluation", "Continue Assessment")}
                          </>
                  )}
                </Button>

                {/* Voice and Immigration Simulation Buttons for PREMIUM and PRO */}
                {(selectedTest === 'premium' || selectedTest === 'pro') && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                    {/* Voice Simulation Button */}
                    <Button
                      onClick={() => router.push('/simulation-vocale')}
                      variant="outline"
                      size="lg"
                      className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-8 py-3"
                    >
                      <Globe className="w-5 h-5 mr-2" />
                      {t("Simulation Vocale", "Voice Simulation")}
                    </Button>

                    {/* Immigration Simulation Button (PRO only) */}
                    {selectedTest === 'pro' && (
                      <Button
                        onClick={() => router.push('/immigration-simulations')}
                        variant="outline"
                        size="lg"
                        className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-8 py-3"
                      >
                        <Award className="w-5 h-5 mr-2" />
                        {t("Simulation Immigration", "Immigration Simulation")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Test Card Component (inspired by abonnement page)
interface TestCardProps {
  title: string
  description: string
  icon: React.ReactNode
  level: string
  features: string[]
  popular: boolean
  selected: boolean
  hovered: boolean
  onSelect: () => void
  onHover: () => void
  onLeave: () => void
  tier: string
}

function TestCard({
  title,
  description,
  icon,
  level,
  features,
  popular,
  selected,
  hovered,
  onSelect,
  onHover,
  onLeave,
  tier
}: TestCardProps) {
  const { t } = useLanguage()

  // Get subscription tier badge text
  const getTierBadge = (tier: string) => {
    const tierMap = {
      "gratuit": { fr: "Gratuit", en: "Free", color: "bg-gray-100 text-gray-800" },
      "essentiel": { fr: "Essentiel", en: "Essential", color: "bg-blue-100 text-blue-800" },
      "premium": { fr: "Premium", en: "Premium", color: "bg-purple-100 text-purple-800" },
      "pro": { fr: "Pro+", en: "Pro+", color: "bg-green-100 text-green-800" }
    }
    return tierMap[tier as keyof typeof tierMap] || tierMap.gratuit
  }

  const tierBadge = getTierBadge(tier)

  return (
    <Card
      className={`relative cursor-pointer transition-all duration-500 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 hover:shadow-2xl group aspect-square ${
        popular ? "ring-2 ring-[#2ECC71] shadow-lg border-[#2ECC71]" : "border-gray-200 dark:border-gray-700"
      } ${selected ? "ring-2 ring-[#007BFF] shadow-xl scale-105 border-blue-300" : ""} ${hovered ? "shadow-xl scale-102" : ""}`}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-[#2ECC71] to-green-500 text-white font-bold px-4 py-2 shadow-lg">
            <Star className="w-4 h-4 mr-1" />
            {t("Plus populaire", "Most popular")}
          </Badge>
        </div>
      )}

      <CardHeader className="space-y-4 p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
            selected ? "bg-blue-100 dark:bg-blue-900" : "bg-gray-100 dark:bg-gray-700"
          }`}>
          {icon}
          </div>
          {selected && (
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        
        <div>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{title}</CardTitle>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-400">{description}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6 pt-0">
        {/* Subscription Tier Badge */}
        <div className="flex items-center justify-center">
          <Badge className={`${tierBadge.color} font-semibold px-4 py-2 text-sm rounded-full shadow-sm`}>
            {tierBadge.fr}
          </Badge>
        </div>

        {/* Level Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="text-sm px-4 py-2 font-semibold border-2 rounded-full">
            Niveau {level}
          </Badge>
        </div>

        {/* Features List */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">
            Inclus dans ce plan
          </h4>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300">
                <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
            </li>
          ))}
        </ul>
        </div>

        {/* Selection Indicator */}
        {selected && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300">
              <Target className="w-4 h-4" />
              <span className="text-sm font-semibold">Sélectionné</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

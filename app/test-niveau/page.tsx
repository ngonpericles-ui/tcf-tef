"use client"

import React, { useState, useEffect, useRef } from "react"
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
  Sparkles,
  ThumbsUp,
  RefreshCw,
  Plane
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { CircularProgressCounter } from "@/components/circular-progress-counter"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"

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
  const cardsSectionRef = useRef<HTMLDivElement>(null)

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

  const scrollToCards = () => {
    if (cardsSectionRef.current) {
      cardsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleContinue = (testId?: string) => {
    const testToUse = testId ? testLevels.find(t => t.id === testId) : testLevels.find(t => t.id === selectedTest)
    if (!testToUse) {
      toast.error(t("Veuillez sélectionner un parcours d'abord", "Please select a path first"))
      return
    }

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

    // Check subscription access with proper validation
    const hasAccess = checkSubscriptionAccess(testToUse.id, userSubscription)

    if (!hasAccess) {
      toast.error(t(
        "Abonnement requis pour accéder à ce test. Veuillez vous abonner pour continuer.",
        "Subscription required to access this test. Please subscribe to continue."
      ))
      setLoading(false)
      router.push('/abonnement')
      return
    }

    // Redirect to the test
    router.push(testToUse.redirectUrl)
  }

  const handleVoiceSimulation = () => {
    // Check subscription access for voice simulation (PREMIUM or PRO required)
    const hasAccess = userSubscription === 'PREMIUM' || userSubscription === 'PRO'
    
    if (!hasAccess) {
      toast.error(t(
        "Les simulations vocales nécessitent un abonnement Premium ou Pro. Veuillez vous abonner pour continuer.",
        "Voice simulations require a Premium or Pro subscription. Please subscribe to continue."
      ))
      router.push('/abonnement')
      return
    }

    router.push('/simulation-vocale')
  }

  const handleImmigrationSimulation = () => {
    // Check subscription access for immigration simulation (PRO required)
    const hasAccess = userSubscription === 'PRO'
    
    if (!hasAccess) {
      toast.error(t(
        "Les simulations d'immigration nécessitent un abonnement Pro. Veuillez vous abonner pour continuer.",
        "Immigration simulations require a Pro subscription. Please subscribe to continue."
      ))
      router.push('/abonnement')
      return
    }

    router.push('/immigration-simulations')
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

    // Also check if user has valid subscription from API
    if (userTier === 'FREE' && !freeAttemptsInfo?.canAccessPaid) {
      return false
    }

    return userLevel >= requiredLevel
  }

  // Helper function to get next level
  const getNextLevel = (currentLevel: string): string => {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const currentIndex = levels.indexOf(currentLevel)
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : 'C2'
  }

  // Confetti function
  const triggerConfetti = () => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) {
        return clearInterval(interval)
      }
      const particleCount = 50 * (timeLeft / duration)
      // since particles fall down, start a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#00FF7F', '#FFFFFF', '#0A0A0A'] })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#00FF7F', '#FFFFFF', '#0A0A0A'] })
    }, 250)
  }

  // Trigger confetti when test is completed (listen for completion events)
  useEffect(() => {
    const handleTestCompletion = () => {
      triggerConfetti()
    }
    
    // Listen for custom event when test is completed
    window.addEventListener('testCompleted', handleTestCompletion)
    
    return () => {
      window.removeEventListener('testCompleted', handleTestCompletion)
    }
  }, [])

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-white dark:bg-[#0A0A0A] font-display text-[#0A0A0A] dark:text-white">
      {/* Material Symbols Font and Liquid Glass CSS */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        
        .liquid-glass {
          background-color: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(12px);
          --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .dark .liquid-glass {
          background-color: rgba(15, 35, 22, 0.4);
          border-color: rgba(245, 248, 246, 0.2);
        }
        .progress-ring-circle {
          transition: stroke-dashoffset 0.35s;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: 'liga';
          -webkit-font-smoothing: antialiased;
        }
      `}</style>
        {/* Background Blur Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-[#00FF7F]/20 dark:bg-[#00FF7F]/10 rounded-full filter blur-[150px]"></div>
          <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-[#0A0A0A]/5 dark:bg-[#00FF7F]/10 rounded-full filter blur-[150px]"></div>
        </div>

      {/* Test Confetti Button */}
      <div className="absolute top-4 right-4 z-50">
        <button 
          className="px-4 py-2 text-sm font-bold text-black bg-[#00FF7F] rounded-full hover:scale-105 transition-transform"
          onClick={triggerConfetti}
        >
          Test Confetti
        </button>
      </div>

      {/* Main Content */}
      <div className="container relative mx-auto max-w-screen-2xl px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <main className="w-full max-w-7xl mx-auto flex flex-col gap-16 md:gap-20">
          {/* Hero Section */}
          <section className="text-center py-16 md:py-24 lg:py-32 px-4 flex flex-col items-center">
            <div className="mx-auto max-w-4xl w-full">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tighter"
                style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '-0.03em' }}
            >
                Testez Votre <span className="text-[#00FF7F]">Niveau de Français</span>
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-8 md:mt-12 space-y-6"
              >
                <p className="text-xl md:text-2xl lg:text-3xl text-[#0A0A0A]/70 dark:text-white/70 font-medium leading-relaxed max-w-3xl mx-auto text-justify"
                  style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.7' }}
                >
                  Découvrez la précision des simulations officielles TCF/TEF et obtenez des recommandations personnalisées pour élever votre maîtrise à de nouveaux sommets.
                </p>
                <p className="text-lg md:text-xl lg:text-2xl text-[#0A0A0A]/60 dark:text-white/60 font-normal leading-relaxed max-w-3xl mx-auto text-justify"
                  style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.6' }}
                >
                  Nos tests sont conçus selon les standards officiels du TCF (Test de Connaissance du Français) et du TEF (Test d'Évaluation de Français). Chaque évaluation vous fournit une analyse détaillée de vos compétences en compréhension orale, compréhension écrite, expression orale et expression écrite, avec des recommandations personnalisées pour progresser efficacement.
                </p>
              </motion.div>
                  <motion.div
                initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex justify-center mt-10 md:mt-12"
              >
                <button 
                  onClick={scrollToCards}
                  className="flex items-center justify-center h-12 px-8 rounded-full bg-[#00FF7F] text-[#0A0A0A] text-base md:text-lg font-bold transition-transform hover:scale-105 shadow-lg shadow-[#00FF7F]/30"
                  style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                >
                  <span className="truncate">Commencer l'Évaluation Gratuite</span>
                </button>
                  </motion.div>
              </div>
          </section>

          {/* Free Simulations Card */}
          <div className="flex justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="liquid-glass flex items-center gap-6 rounded-xl p-6 md:p-8 lg:p-10 w-full max-w-4xl"
            >
              <div className="relative h-24 w-24 md:h-28 md:w-28 flex-shrink-0">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path 
                    className="text-gray-300/30 dark:text-gray-600/40" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3"
                  ></path>
                  <path 
                    className="progress-ring-circle text-[#00FF7F]" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeDasharray={`${freeAttemptsInfo ? (freeAttemptsInfo.remainingSimulations === -1 ? 100 : (freeAttemptsInfo.remainingSimulations / (freeAttemptsInfo.maxSimulations || 5)) * 100) : 67}, 100`}
                    strokeDashoffset={freeAttemptsInfo ? (freeAttemptsInfo.remainingSimulations === -1 ? 0 : ((freeAttemptsInfo.maxSimulations || 5) - freeAttemptsInfo.remainingSimulations) / (freeAttemptsInfo.maxSimulations || 5) * 100) : 33}
                    strokeLinecap="round" 
                    strokeWidth="3"
                    style={{ transition: 'stroke-dashoffset 0.35s', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  ></path>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-3xl md:text-4xl font-black text-[#0A0A0A] dark:text-white">
                  {freeAttemptsInfo 
                    ? (freeAttemptsInfo.remainingSimulations === -1 ? '∞' : freeAttemptsInfo.remainingSimulations) 
                    : 5}
              </div>
                        </div>
              <div className="flex flex-col flex-grow">
                <p className="text-2xl md:text-3xl font-black text-[#0A0A0A] dark:text-white mb-2">
                  Simulations {freeAttemptsInfo?.subscriptionTier && freeAttemptsInfo.subscriptionTier !== 'FREE' ? 'Disponibles' : 'Gratuites'}
                </p>
                <p className="text-base md:text-lg text-[#0A0A0A]/70 dark:text-white/70 mb-2">
                  {freeAttemptsInfo?.subscriptionTier && freeAttemptsInfo.subscriptionTier !== 'FREE' 
                    ? `Basé sur votre plan ${freeAttemptsInfo.subscriptionTier}: ${freeAttemptsInfo.remainingSimulations === -1 ? 'Simulations illimitées' : `${freeAttemptsInfo.remainingSimulations} simulation${freeAttemptsInfo.remainingSimulations > 1 ? 's' : ''} restante${freeAttemptsInfo.remainingSimulations > 1 ? 's' : ''}`}`
                    : 'Utilisez vos tentatives gratuites pour établir une base.'}
                </p>
                {freeAttemptsInfo?.maxSimulations && freeAttemptsInfo.maxSimulations !== -1 && (
                  <p className="text-sm md:text-base text-[#0A0A0A]/60 dark:text-white/60">
                    Maximum: {freeAttemptsInfo.maxSimulations} simulation{freeAttemptsInfo.maxSimulations > 1 ? 's' : ''} par mois
                            </p>
                          )}
            </div>
            </motion.div>
      </div>

          {/* Your Current Assessment Section */}
      {!levelLoading && (
            <section className="px-4">
              <h2 className="text-center text-3xl md:text-4xl xl:text-5xl font-black tracking-tight mb-12" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '-0.02em' }}>
                Votre <span className="text-[#00FF7F]">Évaluation Actuelle</span>
              </h2>
              {currentLevel ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto">
                  {/* Current Level Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                    className="liquid-glass flex flex-col gap-6 p-8 rounded-xl"
                  >
                    <span className="material-symbols-outlined text-[#00FF7F] text-5xl md:text-6xl">workspace_premium</span>
                    <div>
                      <p className="text-base md:text-lg text-[#0A0A0A]/70 dark:text-white/70 mb-2">Niveau Actuel</p>
                      <p className="text-5xl md:text-6xl font-black text-[#0A0A0A] dark:text-white mb-2">{currentLevel.currentLevel}</p>
                      <p className="text-base md:text-lg font-bold text-[#00FF7F]">
                        {Math.round(currentLevel.confidence)}% de confiance
                    </p>
                  </div>
                  </motion.div>

                  {/* Key Strengths Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="liquid-glass flex flex-col gap-6 p-8 rounded-xl"
                  >
                    <span className="material-symbols-outlined text-[#00FF7F] text-5xl md:text-6xl">thumb_up</span>
                    <div>
                      <p className="text-base md:text-lg text-[#0A0A0A]/70 dark:text-white/70 mb-3">Points Forts</p>
                          {currentLevel.strengths && currentLevel.strengths.length > 0 ? (
                        currentLevel.strengths.slice(0, 2).map((strength, index) => (
                          <p key={index} className="text-xl md:text-2xl font-black text-[#0A0A0A] dark:text-white mb-2">{strength}</p>
                            ))
                          ) : (
                        <p className="text-xl md:text-2xl font-black text-[#0A0A0A] dark:text-white">Aucun point fort identifié</p>
                      )}
                  </div>
              </motion.div>

                  {/* Next Level Goals Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="liquid-glass flex flex-col gap-6 p-8 rounded-xl"
                  >
                    <span className="material-symbols-outlined text-[#00FF7F] text-5xl md:text-6xl">track_changes</span>
                    <div>
                      <p className="text-base md:text-lg text-[#0A0A0A]/70 dark:text-white/70 mb-3">Objectifs du Niveau Suivant</p>
                      {currentLevel.recommendations && currentLevel.recommendations.length > 0 ? (
                        <p className="text-xl md:text-2xl font-black text-[#0A0A0A] dark:text-white mb-2">{currentLevel.recommendations[0]}</p>
                      ) : (
                        <p className="text-xl md:text-2xl font-black text-[#0A0A0A] dark:text-white mb-2">Améliorer le vocabulaire</p>
                      )}
                      <p className="text-base md:text-lg text-[#0A0A0A]/70 dark:text-white/70">
                        Est. {currentLevel.estimatedTimeToNextLevel || '3 mois'} pour {getNextLevel(currentLevel.currentLevel)}
                      </p>
                </div>
              </motion.div>
          </div>
              ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
                  className="text-center py-20"
                >
                  <p className="text-xl md:text-2xl text-[#0A0A0A]/70 dark:text-white/70 max-w-3xl mx-auto leading-relaxed">
                    Vous n'avez pas encore effectué de test de niveau. Sélectionnez un parcours ci-dessous pour obtenir une évaluation personnalisée de votre niveau de français.
            </p>
          </motion.div>
              )}
            </section>
          )}

          {/* Choose Your Path Section */}
          <section ref={cardsSectionRef} className="px-4">
            <h2 className="text-center text-3xl md:text-4xl xl:text-5xl font-black tracking-tight mb-12" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '-0.02em' }}>
              Choisissez <span className="text-[#00FF7F]">Votre Parcours</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto">
              {testLevels.map((test, index) => {
                const hasAccess = checkSubscriptionAccess(test.id, userSubscription)
                const detailedDescription = test.id === 'essentiel' 
                  ? 'Parfait pour débuter votre parcours d\'évaluation. Accédez aux tests de niveau B1 avec une analyse détaillée de vos compétences en compréhension orale et écrite. Idéal pour identifier vos points forts et vos axes d\'amélioration.'
                  : test.id === 'premium'
                  ? 'Accédez à une évaluation complète et approfondie avec des tests illimités pour tous les niveaux (B1 à C2). Bénéficiez d\'un coach IA personnalisé, de certificats officiels reconnus, et d\'un support prioritaire pour maximiser vos chances de réussite aux examens TCF/TEF.'
                  : 'L\'expérience ultime pour votre préparation. Profitez de parcours entièrement personnalisés, de sessions individuelles avec des experts certifiés, d\'une garantie de réussite, et d\'un support téléphonique dédié. Accédez également aux simulations vocales et d\'immigration pour une préparation complète.'

  return (
    <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`liquid-glass rounded-xl p-8 md:p-10 flex flex-col border transition-colors relative overflow-hidden ${
                    selectedTest === test.id 
                      ? 'ring-2 ring-[#00FF7F]' 
                      : 'border-transparent hover:border-[#00FF7F]/50'
                  }`}
                  onClick={() => handleTestSelection(test.id)}
                >
                  {/* Selected Badge */}
                  {selectedTest === test.id && (
                    <div className="absolute top-0 right-0 px-4 py-2 text-sm font-black text-[#0A0A0A] bg-[#00FF7F] rounded-bl-xl">
                      Sélectionné
        </div>
      )}

          {/* Icon */}
                  <span className={`material-symbols-outlined text-[#00FF7F] text-5xl md:text-6xl mb-6 ${
                    test.id === 'essentiel' ? 'description' :
                    test.id === 'premium' ? 'verified_user' :
                    'mic'
                  }`}>
                    {test.id === 'essentiel' ? 'description' :
                     test.id === 'premium' ? 'verified_user' :
                     'mic'}
                  </span>
                  
                  {/* Title */}
                  <h3 className="text-3xl md:text-4xl font-black text-[#0A0A0A] dark:text-white mb-4">{test.title.fr}</h3>
                  
                  {/* Detailed Description */}
                  <p className="text-base md:text-lg text-[#0A0A0A]/70 dark:text-white/70 mt-1 mb-6 flex-grow leading-relaxed">
                    {detailedDescription}
                  </p>
                  
        {/* Features List */}
                  <ul className="space-y-4 mb-8">
                    {test.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-4">
                        <span className="material-symbols-outlined text-[#00FF7F] text-2xl flex-shrink-0 mt-0.5">check_circle</span>
                        <span className="text-base md:text-lg font-medium">{feature.fr}</span>
            </li>
          ))}
        </ul>
                  
                  {/* Action Buttons */}
                  <div className="mt-auto space-y-3">
                    {/* Main Continue Button - on ALL cards */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleContinue(test.id)
                      }}
                      disabled={!hasAccess}
                      className={`w-full flex items-center justify-center h-14 px-6 rounded-full text-[#0A0A0A] text-base md:text-lg font-black transition-transform hover:scale-105 shadow-lg ${
                        hasAccess 
                          ? 'bg-[#00FF7F] shadow-[#00FF7F]/30' 
                          : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60'
                      }`}
                      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    >
                      {hasAccess ? "Commencer l'Évaluation" : "Abonnement Requis"}
                    </button>

                    {/* Voice Simulation Button - Premium and Pro+ */}
                    {(test.id === 'premium' || test.id === 'pro') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVoiceSimulation()
                        }}
                        className="w-full flex items-center justify-center gap-3 h-12 px-6 rounded-full bg-[#00FF7F]/90 hover:bg-[#00FF7F] text-[#0A0A0A] text-sm md:text-base font-bold transition-transform hover:scale-105 shadow-md shadow-[#00FF7F]/20"
                        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      >
                        <Mic className="w-5 h-5" />
                        Simulation Vocale
                      </button>
                    )}

                    {/* Immigration Simulation Button - Pro+ only */}
                    {test.id === 'pro' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleImmigrationSimulation()
                        }}
                        className="w-full flex items-center justify-center gap-3 h-12 px-6 rounded-full bg-[#00FF7F]/90 hover:bg-[#00FF7F] text-[#0A0A0A] text-sm md:text-base font-bold transition-transform hover:scale-105 shadow-md shadow-[#00FF7F]/20"
                        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      >
                        <Globe className="w-5 h-5" />
                        Simulation d'Immigration
                      </button>
                    )}
          </div>
    </motion.div>
                )
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

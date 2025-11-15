"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import confetti from "canvas-confetti"

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
  remainingSimulations: number
  maxSimulations: number
  subscriptionTier: string
  isBlocked: boolean
  canAccessPaid: boolean
}

const plans = [
  {
    id: "essentiel",
    title: "Essentiel",
    subtitle: "Focus Niveau B1",
    icon: "explore",
    description: "Parfait pour débuter votre parcours d'évaluation. Accédez aux tests de niveau B1 avec une analyse détaillée de vos compétences en compréhension orale et écrite. Idéal pour identifier vos points forts et vos axes d'amélioration.",
    features: [
      "Tests B1 uniquement avec analyse complète",
      "5 tests blancs par mois",
      "Analyse détaillée des compétences",
      "Rapport de progression personnalisé",
      "Support par email"
    ],
    redirectUrl: "/test-niveau/simulations?tier=essentiel&level=B1"
  },
  {
    id: "premium",
    title: "Premium",
    subtitle: "Certificat Officiel",
    icon: "verified",
    description: "Le choix parfait pour la certification officielle et l'analyse approfondie des compétences. Accédez à une évaluation complète avec des tests pour tous les niveaux (B1 à C2), incluant des simulations avancées et un coach IA personnalisé.",
    features: [
      "Tests illimités pour tous les niveaux (B1-C2)",
      "Certificat officiel TCF/TEF téléchargeable",
      "Accès complet aux simulations vocales",
      "Coach IA personnalisé pour votre progression",
      "Recommandations d'étude personnalisées",
      "Support prioritaire"
    ],
    redirectUrl: "/test-niveau/simulations?tier=premium&level=B1-C2"
  },
  {
    id: "pro",
    title: "Pro+",
    subtitle: "Tests Illimités",
    icon: "rocket_launch",
    description: "L'expérience ultime pour votre préparation. Profitez de tests illimités, de parcours entièrement personnalisés, de sessions individuelles avec des experts certifiés, et d'un accès exclusif aux simulations d'immigration pour une préparation complète.",
    features: [
      "Tests illimités pour tous les niveaux",
      "Parcours personnalisés adaptés à votre niveau",
      "Sessions 1-on-1 avec experts certifiés TCF/TEF",
      "Simulations d'immigration Canada",
      "Garantie de réussite",
      "Support téléphonique dédié"
    ],
    redirectUrl: "/test-niveau/simulations?tier=pro&level=B1-C2"
  }
]

export default function TestNiveauPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>("premium")
  const [userSubscription, setUserSubscription] = useState<string>("FREE")
  const [loading, setLoading] = useState(false)
  const [currentLevel, setCurrentLevel] = useState<LevelAssessment | null>(null)
  const [levelLoading, setLevelLoading] = useState(true)
  const [freeAttemptsInfo, setFreeAttemptsInfo] = useState<FreeAttemptsInfo | null>(null)
  const [simulationsLoading, setSimulationsLoading] = useState(true)

  useEffect(() => {
    fetchUserSubscription()
    fetchCurrentLevel()
    fetchFreeAttemptsInfo()
  }, [])

  const fetchUserSubscription = async () => {
    try {
      const response = await apiClient.get('/auth/profile')
      if (response.success && response.data) {
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
      setSimulationsLoading(true)
      const response = await apiClient.get('/simulations/free-attempts/count') as any
      if (response.success && response.data) {
        setFreeAttemptsInfo(response.data as FreeAttemptsInfo)
      } else {
        // Set default values if API fails
        setFreeAttemptsInfo({
          totalSimulationsUsed: 0,
          remainingSimulations: 5,
          maxSimulations: 5,
          subscriptionTier: 'FREE',
          isBlocked: false,
          canAccessPaid: false
        })
      }
    } catch (error) {
      console.error('Error fetching free attempts info:', error)
      // Set default values on error
      setFreeAttemptsInfo({
        totalSimulationsUsed: 0,
        remainingSimulations: 5,
        maxSimulations: 5,
        subscriptionTier: 'FREE',
        isBlocked: false,
        canAccessPaid: false
      })
    } finally {
      setSimulationsLoading(false)
    }
  }

  const checkSubscriptionAccess = (planId: string, userTier: string): boolean => {
    const tierHierarchy = {
      "FREE": 0,
      "ESSENTIAL": 1,
      "PREMIUM": 2,
      "PRO": 3
    }

    const planTierMap = {
      "essentiel": 1,
      "premium": 2,
      "pro": 3
    }

    const userLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0
    const requiredLevel = planTierMap[planId as keyof typeof planTierMap] || 0

    if (userTier === 'FREE' && !freeAttemptsInfo?.canAccessPaid) {
      return false
    }

    return userLevel >= requiredLevel
  }

  const getNextLevel = (currentLevel: string): string => {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const currentIndex = levels.indexOf(currentLevel)
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : 'C2'
  }

  const handleStartAssessment = () => {
    if (!selectedPlan) {
      toast.error("Veuillez sélectionner un plan d'abord")
      return
    }

    const plan = plans.find(p => p.id === selectedPlan)
    if (!plan) return

    setLoading(true)

    if (freeAttemptsInfo?.isBlocked) {
      const maxSims = freeAttemptsInfo.maxSimulations === -1 ? 'illimitées' : freeAttemptsInfo.maxSimulations
      toast.error(`Vous avez utilisé toutes vos simulations (${maxSims}). Veuillez vous abonner pour continuer.`)
      setLoading(false)
      router.push('/abonnement')
      return
    }

    const hasAccess = checkSubscriptionAccess(plan.id, userSubscription)

    if (!hasAccess) {
      toast.error("Abonnement requis pour accéder à ce test. Veuillez vous abonner pour continuer.")
      setLoading(false)
      router.push('/abonnement')
      return
    }

    router.push(plan.redirectUrl)
  }

  const handleVoiceSimulation = () => {
    const hasAccess = userSubscription === 'PREMIUM' || userSubscription === 'PRO'
    
    if (!hasAccess) {
      toast.error("Les simulations vocales nécessitent un abonnement Premium ou Pro. Veuillez vous abonner pour continuer.")
      router.push('/abonnement')
      return
    }

    router.push('/simulation-vocale')
  }

  const handleImmigrationSimulation = () => {
    const hasAccess = userSubscription === 'PRO'
    
    if (!hasAccess) {
      toast.error("Les simulations d'immigration nécessitent un abonnement Pro. Veuillez vous abonner pour continuer.")
      router.push('/abonnement')
      return
    }

    router.push('/immigration-simulations')
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
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#06f957', '#FFFFFF', '#0A0A0A'] })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#06f957', '#FFFFFF', '#0A0A0A'] })
    }, 250)
  }

  useEffect(() => {
    const handleTestCompletion = () => {
      triggerConfetti()
    }
    
    window.addEventListener('testCompleted', handleTestCompletion)
    
    return () => {
      window.removeEventListener('testCompleted', handleTestCompletion)
    }
  }, [])

  const selectedPlanData = plans.find(p => p.id === selectedPlan)
  
  // Calculate simulation counts - only use real data when loaded
  const remainingSims = simulationsLoading 
    ? null 
    : (freeAttemptsInfo?.remainingSimulations !== undefined && freeAttemptsInfo?.remainingSimulations !== null
        ? freeAttemptsInfo.remainingSimulations
        : null)
  
  const maxSims = simulationsLoading
    ? null
    : (freeAttemptsInfo?.maxSimulations !== undefined && freeAttemptsInfo?.maxSimulations !== null
        ? freeAttemptsInfo.maxSimulations
        : null)
  
  // Calculate progress percentage for circular progress
  const progressPercentage = (() => {
    if (simulationsLoading || maxSims === null || maxSims === -1) return 100
    if (remainingSims === null || remainingSims === undefined) return 0
    if (maxSims === 0) return 0
    return (remainingSims / maxSims) * 100
  })()
  
  const usedSims = maxSims !== null && remainingSims !== null && maxSims !== -1
    ? maxSims - remainingSims
    : 0

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-white font-display text-[#121212]">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined');
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;700;900&display=swap');
        
        .liquid-glass {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
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
        .font-display {
          font-family: 'Lexend', sans-serif;
        }
      `}</style>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="max-w-5xl mx-auto flex flex-col gap-16">
          {/* Hero Section */}
          <section className="relative text-center flex flex-col items-center justify-center min-h-[480px] rounded-xl overflow-hidden p-8">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-white"></div>
              <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-[#06f957]/20 rounded-full filter blur-3xl opacity-50"></div>
              <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[#06f957]/30 rounded-full filter blur-3xl opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-gray-900/5 rounded-full filter blur-2xl opacity-30"></div>
            </div>

            <div className="relative z-10 flex flex-col gap-6 items-center">
              <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter">
                <span className="text-[#121212]">Testez Votre</span>{" "}
                <span className="text-[#06f957]">Niveau de Français</span>
              </h1>
              <h2 className="text-base md:text-lg max-w-2xl text-gray-700">
                Découvrez la précision des simulations officielles TCF/TEF et obtenez des recommandations personnalisées pour élever votre maîtrise à de nouveaux sommets.
              </h2>

              {/* Free Simulations Counter */}
              <div className="liquid-glass shadow-lg rounded-lg p-4 mt-6 flex items-center gap-4 border border-gray-200/50">
                <div className="relative size-12">
                  {simulationsLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-[#06f957] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-[#06f957] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-[#06f957] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <svg className="size-full" height="36" viewBox="0 0 36 36" width="36" xmlns="http://www.w3.org/2000/svg">
                        <circle className="stroke-gray-200" cx="18" cy="18" fill="none" r="16" strokeWidth="3"></circle>
                        {freeAttemptsInfo && freeAttemptsInfo.maxSimulations !== -1 && (
                          <circle 
                            className="stroke-[#06f957]" 
                            cx="18" 
                            cy="18" 
                            fill="none" 
                            r="16" 
                            strokeDasharray={`${progressPercentage} 100`}
                            strokeLinecap="round" 
                            strokeWidth="3" 
                            transform="rotate(-90 18 18)"
                            style={{ transition: 'stroke-dasharray 0.5s ease' }}
                          ></circle>
                        )}
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#121212]">
                        {freeAttemptsInfo && freeAttemptsInfo.maxSimulations === -1 
                          ? '∞' 
                          : remainingSims !== null && maxSims !== null
                            ? `${remainingSims}/${maxSims}`
                            : '0/0'}
                      </span>
                    </>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-[#121212]">
                    {simulationsLoading ? (
                      <span className="flex items-center gap-1">
                        Chargement
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 bg-[#06f957] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1 h-1 bg-[#06f957] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
                          <span className="w-1 h-1 bg-[#06f957] rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
                        </span>
                      </span>
                    ) : (
                      freeAttemptsInfo?.subscriptionTier && freeAttemptsInfo.subscriptionTier !== 'FREE' 
                        ? 'Simulations Disponibles' 
                        : 'Simulations Gratuites'
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {simulationsLoading ? (
                      'Récupération de vos données...'
                    ) : freeAttemptsInfo?.subscriptionTier && freeAttemptsInfo.subscriptionTier !== 'FREE'
                      ? freeAttemptsInfo.remainingSimulations === -1
                        ? 'Simulations illimitées'
                        : remainingSims !== null
                          ? `${remainingSims} tentative${remainingSims > 1 ? 's' : ''} restante${remainingSims > 1 ? 's' : ''}`
                          : 'Aucune simulation disponible'
                      : remainingSims !== null
                        ? `${remainingSims} tentative${remainingSims > 1 ? 's' : ''} restante${remainingSims > 1 ? 's' : ''}`
                        : 'Aucune simulation disponible'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Current Assessment Section */}
          {!levelLoading && (
            <section className="flex flex-col gap-6">
              <h2 className="text-[#121212] text-3xl font-bold leading-tight tracking-tight">
                Votre Évaluation Actuelle
              </h2>
              {currentLevel ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="liquid-glass shadow-lg rounded-xl p-6 flex flex-col gap-3 hover:border-[#06f957]/50 transition-all duration-300 border border-gray-200/50">
                    <span className="material-symbols-outlined text-[#06f957] text-3xl">workspace_premium</span>
                    <div>
                      <p className="text-[#121212] text-lg font-bold">Niveau Actuel</p>
                      <p className="text-[#06f957] font-bold text-2xl">
                        {currentLevel.currentLevel} - {Math.round(currentLevel.confidence)}% Confiance
                      </p>
                      <a className="text-gray-600 text-sm font-medium hover:text-[#06f957] transition-colors cursor-pointer" href="#">
                        Voir le rapport détaillé →
                      </a>
                    </div>
                  </div>

                  <div className="liquid-glass shadow-lg rounded-xl p-6 flex flex-col gap-3 hover:border-[#06f957]/50 transition-all duration-300 border border-gray-200/50">
                    <span className="material-symbols-outlined text-[#06f957] text-3xl">thumb_up</span>
                    <div>
                      <p className="text-[#121212] dark:text-white text-lg font-bold">Points Forts</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {currentLevel.strengths && currentLevel.strengths.length > 0
                          ? currentLevel.strengths.slice(0, 2).join(", ")
                          : "Aucun point fort identifié"}
                      </p>
                      <a className="text-gray-600 text-sm font-medium hover:text-[#06f957] transition-colors cursor-pointer" href="#">
                        Voir les compétences maîtrisées →
                      </a>
                    </div>
                  </div>

                  <div className="liquid-glass shadow-lg rounded-xl p-6 flex flex-col gap-3 hover:border-[#06f957]/50 transition-all duration-300 border border-gray-200/50">
                    <span className="material-symbols-outlined text-[#06f957] text-3xl">flag</span>
                    <div>
                      <p className="text-[#121212] dark:text-white text-lg font-bold">Objectifs du Niveau Suivant</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {currentLevel.recommendations && currentLevel.recommendations.length > 0
                          ? currentLevel.recommendations[0]
                          : "Améliorer l'expression écrite"}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                        Est. {currentLevel.estimatedTimeToNextLevel || '3 mois'} pour {getNextLevel(currentLevel.currentLevel)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Vous n'avez pas encore effectué de test de niveau. Sélectionnez un parcours ci-dessous pour obtenir une évaluation personnalisée.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Choose Your Path Section */}
          <section className="flex flex-col gap-8">
            <h2 className="text-[#121212] dark:text-white text-3xl font-bold leading-tight tracking-tight text-center">
              <span className="text-[#121212] dark:text-white">Choisissez Votre</span>{" "}
              <span className="text-[#06f957]">Parcours</span>
            </h2>

            {/* Plan Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id
                const hasAccess = checkSubscriptionAccess(plan.id, userSubscription)

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`liquid-glass shadow-lg rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'border-2 border-[#06f957] bg-[#06f957]/10 dark:bg-[#06f957]/20 ring-4 ring-[#06f957]/20'
                        : 'border border-gray-200/50 dark:border-white/5 hover:border-[#06f957]/50'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[#06f957] text-4xl mx-auto block`}>
                      {plan.icon}
                    </span>
                    <h3 className="text-xl font-bold mt-3 text-[#121212] dark:text-white">{plan.title}</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{plan.subtitle}</p>
                  </div>
                )
              })}
            </div>

            {/* Dynamic Details Box */}
            {selectedPlanData && (
              <div className="liquid-glass shadow-lg rounded-xl p-8 mt-4 flex flex-col md:flex-row items-center gap-8 border border-gray-200/50 dark:border-white/5">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-[#121212] dark:text-white">
                    Détails du Plan {selectedPlanData.title}
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">{selectedPlanData.description}</p>
                  <ul className="mt-6 space-y-3">
                    {selectedPlanData.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#06f957]">check_circle</span>
                        <span className="text-[#121212] dark:text-gray-200">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-4 w-full md:w-auto self-stretch md:self-center">
                  <button
                    onClick={handleStartAssessment}
                    disabled={loading || !checkSubscriptionAccess(selectedPlanData.id, userSubscription)}
                    className="w-full flex min-w-[180px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-[#06f957] text-[#121212] text-base font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">
                      {loading ? "Chargement..." : "Commencer l'Évaluation"}
                    </span>
                  </button>
                  {(selectedPlanData.id === 'premium' || selectedPlanData.id === 'pro') && (
                    <button
                      onClick={handleVoiceSimulation}
                      className="w-full flex min-w-[180px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-transparent text-[#121212] border-2 border-gray-300 font-bold hover:bg-gray-100 transition-colors"
                    >
                      <span className="truncate">Essayer la Simulation Vocale</span>
                    </button>
                  )}
                  {selectedPlanData.id === 'pro' && (
                    <button
                      onClick={handleImmigrationSimulation}
                      className="w-full flex min-w-[180px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-transparent text-[#121212] border-2 border-gray-300 font-bold hover:bg-gray-100 transition-colors"
                    >
                      <span className="truncate">Simulation d'Immigration</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

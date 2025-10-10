"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CheckCircle,
  Star,
  Target,
  Clock,
  Globe,
  Mic,
  Search,
  Filter,
  PlayCircle,
  BookOpen,
  Users,
  Award,
  ArrowLeft
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface Simulation {
  id: string
  title: string
  description: string
  type: string
  level: string
  duration: number
  totalQuestions: number
  sections: number
  difficulty: number
  requiredTier: string
  category: string
  language: string
  createdAt: string
}

export default function FilteredSimulationsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get filter parameters from URL
  const tier = searchParams.get('tier') || 'gratuit'
  const level = searchParams.get('level') || 'A1-A2'
  
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterLevel, setFilterLevel] = useState(level)
  const [filterType, setFilterType] = useState("all")
  const [userSubscription, setUserSubscription] = useState<string>("FREE")

  useEffect(() => {
    fetchUserSubscription()
    fetchSimulations()
  }, [tier, filterLevel, filterType])

  const fetchUserSubscription = async () => {
    try {
      const response = await apiClient.get('/auth/profile')
      if (response.success && response.data) {
        const userTier = (response.data as any).user?.subscriptionTier || (response.data as any).subscriptionTier || "FREE"
        setUserSubscription(userTier)
      }
    } catch (error) {
      console.error('Error fetching user subscription:', error)
    }
  }

  const fetchSimulations = async () => {
    try {
      setLoading(true)
      // Fetch from the same source as tcf-tef-simulation page
      const response = await apiClient.get('/content-management/simulations')

      if (response.success && response.data) {
        let allSimulations = response.data.content || []

        // Filter by subscription tier access
        const filteredSimulations = filterSimulationsByTier(allSimulations, tier)
        
        // Filter by level if specified
        if (filterLevel !== "all") {
          const levelFiltered = filteredSimulations.filter(sim => 
            sim.level === filterLevel || sim.level.includes(filterLevel)
          )
          setSimulations(levelFiltered)
        } else {
          setSimulations(filteredSimulations)
        }
      }
    } catch (error) {
      console.error('Error fetching simulations:', error)
      toast.error(t("Erreur lors du chargement des simulations", "Error loading simulations"))
    } finally {
      setLoading(false)
    }
  }

  const filterSimulationsByTier = (simulations: Simulation[], selectedTier: string): Simulation[] => {
    const tierHierarchy = {
      "gratuit": ["free"],
      "essentiel": ["free", "essential"],
      "premium": ["free", "essential", "premium"],
      "pro": ["free", "essential", "premium", "pro"]
    }

    const allowedTiers = tierHierarchy[selectedTier as keyof typeof tierHierarchy] || ["free"]
    
    return simulations.filter(sim => 
      allowedTiers.includes(sim.requiredTier.toLowerCase())
    )
  }

  const filteredSimulations = simulations.filter(sim => {
    const matchesSearch = sim.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sim.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filterType === "all" || sim.type.toLowerCase() === filterType.toLowerCase()
    
    return matchesSearch && matchesType
  })

  const handleSimulationStart = (simulation: Simulation) => {
    // Check if user has access to this simulation
    const hasAccess = checkSubscriptionAccess(simulation.requiredTier, userSubscription)
    
    if (!hasAccess) {
      toast.error(t(
        "Abonnement requis pour accéder à cette simulation",
        "Subscription required to access this simulation"
      ))
      return
    }

    // Redirect to simulation
    router.push(`/tcf-tef-simulation/${simulation.id}`)
  }

  const checkSubscriptionAccess = (requiredTier: string, userTier: string): boolean => {
    const tierHierarchy = {
      "FREE": 0,
      "ESSENTIAL": 1,
      "PREMIUM": 2,
      "PRO": 3
    }

    const tierMap = {
      "free": 0,
      "essential": 1,
      "premium": 2,
      "pro": 3
    }

    const userLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0
    const requiredLevel = tierMap[requiredTier.toLowerCase() as keyof typeof tierMap] || 0

    return userLevel >= requiredLevel
  }

  const getTierDisplayName = (tier: string) => {
    const tierNames = {
      "gratuit": t("Gratuit", "Free"),
      "essentiel": t("Essentiel", "Essential"),
      "premium": t("Premium", "Premium"),
      "pro": t("Pro+", "Pro+")
    }
    return tierNames[tier as keyof typeof tierNames] || tier
  }

  const getTierColor = (tier: string) => {
    const colors = {
      "gratuit": "bg-green-100 text-green-800",
      "essentiel": "bg-blue-100 text-blue-800",
      "premium": "bg-purple-100 text-purple-800",
      "pro": "bg-orange-100 text-orange-800"
    }
    return colors[tier as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 dark:from-violet-900 dark:via-violet-800 dark:to-purple-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Test simulations and assessments"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/90 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Simulations {getTierDisplayName(tier)}
            </h1>

            <p className="text-xl md:text-2xl text-violet-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              <strong className="text-white font-semibold">Accédez aux simulations {getTierDisplayName(tier)}</strong> pour votre niveau {level}.
              Pratiquez avec des tests authentiques et améliorez vos compétences en français.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-violet-200 mb-8">
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-violet-300" />
                Tests authentiques
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-violet-300" />
                Conditions réelles
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2 text-violet-300" />
                Certificats officiels
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t("Rechercher une simulation...", "Search for a simulation...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-full md:w-48 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder={t("Niveau", "Level")} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 z-50">
              <SelectItem value="all" className="hover:bg-gray-100 dark:hover:bg-gray-700">{t("Tous niveaux", "All levels")}</SelectItem>
              <SelectItem value="A1" className="hover:bg-gray-100 dark:hover:bg-gray-700">A1</SelectItem>
              <SelectItem value="A2" className="hover:bg-gray-100 dark:hover:bg-gray-700">A2</SelectItem>
              <SelectItem value="B1" className="hover:bg-gray-100 dark:hover:bg-gray-700">B1</SelectItem>
              <SelectItem value="B2" className="hover:bg-gray-100 dark:hover:bg-gray-700">B2</SelectItem>
              <SelectItem value="C1" className="hover:bg-gray-100 dark:hover:bg-gray-700">C1</SelectItem>
              <SelectItem value="C2" className="hover:bg-gray-100 dark:hover:bg-gray-700">C2</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder={t("Type", "Type")} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 z-50">
              <SelectItem value="all" className="hover:bg-gray-100 dark:hover:bg-gray-700">{t("Tous types", "All types")}</SelectItem>
              <SelectItem value="tcf" className="hover:bg-gray-100 dark:hover:bg-gray-700">TCF</SelectItem>
              <SelectItem value="tef" className="hover:bg-gray-100 dark:hover:bg-gray-700">TEF</SelectItem>
              <SelectItem value="delf" className="hover:bg-gray-100 dark:hover:bg-gray-700">DELF</SelectItem>
              <SelectItem value="dalf" className="hover:bg-gray-100 dark:hover:bg-gray-700">DALF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pro+ Special Buttons */}
        {tier === "pro" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Button
              onClick={() => router.push('/simulation-vocale')}
              className="bg-green-600 hover:bg-green-700 text-white p-6 h-auto"
            >
              <div className="flex items-center gap-3">
                <Mic className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">{t("Simulation Vocale", "Voice Simulation")}</div>
                  <div className="text-sm opacity-90">{t("Entraînement oral avec VAPI", "Oral training with VAPI")}</div>
                </div>
              </div>
            </Button>
            
            <Button
              onClick={() => router.push('/immigration-simulation')}
              className="bg-orange-600 hover:bg-orange-700 text-white p-6 h-auto"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">{t("Simulation Immigration", "Immigration Simulation")}</div>
                  <div className="text-sm opacity-90">{t("Tests spécialisés immigration", "Specialized immigration tests")}</div>
                </div>
              </div>
            </Button>
          </div>
        )}

        {/* Simulations Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSimulations.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("Aucune simulation trouvée", "No simulations found")}
            </h3>
            <p className="text-muted-foreground">
              {t("Essayez de modifier vos filtres de recherche", "Try modifying your search filters")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSimulations.map((simulation) => (
              <SimulationCard
                key={simulation.id}
                simulation={simulation}
                onStart={() => handleSimulationStart(simulation)}
                userSubscription={userSubscription}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Simulation Card Component
interface SimulationCardProps {
  simulation: Simulation
  onStart: () => void
  userSubscription: string
  t: (fr: string, en: string) => string
}

function SimulationCard({ simulation, onStart, userSubscription, t }: SimulationCardProps) {
  const hasAccess = checkSubscriptionAccess(simulation.requiredTier, userSubscription)

  return (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 group-hover:text-blue-600 transition-colors">
              {simulation.title}
            </CardTitle>
            <CardDescription className="text-sm">
              {simulation.description}
            </CardDescription>
          </div>
          <Badge className={getTierBadgeColor(simulation.requiredTier)}>
            {simulation.requiredTier}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{simulation.duration} min</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span>{simulation.totalQuestions} questions</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span>{simulation.level}</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-muted-foreground" />
            <span>{simulation.type.toUpperCase()}</span>
          </div>
        </div>

        <Button
          onClick={onStart}
          disabled={!hasAccess}
          className="w-full"
          variant={hasAccess ? "default" : "outline"}
        >
          {hasAccess ? (
            <>
              <PlayCircle className="w-4 h-4 mr-2" />
              {t("Commencer", "Start")}
            </>
          ) : (
            <>
              <Star className="w-4 h-4 mr-2" />
              {t("Abonnement requis", "Subscription required")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

function checkSubscriptionAccess(requiredTier: string, userTier: string): boolean {
  const tierHierarchy = {
    "FREE": 0,
    "ESSENTIAL": 1,
    "PREMIUM": 2,
    "PRO": 3
  }

  const tierMap = {
    "free": 0,
    "essential": 1,
    "premium": 2,
    "pro": 3
  }

  const userLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0
  const requiredLevel = tierMap[requiredTier.toLowerCase() as keyof typeof tierMap] || 0

  return userLevel >= requiredLevel
}

function getTierBadgeColor(tier: string) {
  const colors = {
    "free": "bg-green-100 text-green-800",
    "essential": "bg-blue-100 text-blue-800",
    "premium": "bg-purple-100 text-purple-800",
    "pro": "bg-orange-100 text-orange-800"
  }
  return colors[tier.toLowerCase() as keyof typeof colors] || "bg-gray-100 text-gray-800"
}

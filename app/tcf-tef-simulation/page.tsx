"use client"

import { useState, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  Clock,
  Play,
  Target,
  BookOpen,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  Search,
  Filter,
  Lock,
  Crown,
  Shield,
  Sparkles,
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import Image from "next/image"
import { useSubscriptionAccess } from "@/components/subscription-access"
import SubscriptionAccess from "@/components/subscription-access"
import { apiClient } from "@/lib/api-client"
import SimulationPreviewModal from "@/components/simulation-preview-modal"

const simulationTypes = [
  {
    id: "tcf-complete",
    type: "TCF",
    level: "B2",
    levelRange: "A2-C2",
    title: "Simulation TCF Complète",
    titleEn: "Complete TCF Simulation",
    description: "Test complet avec toutes les sections du TCF officiel",
    descriptionEn: "Complete test with all official TCF sections",
    duration: 180,
    sections: 4,
    questions: 76,
    difficulty: 4,
    aiPowered: true,
    requiredTier: "premium", // TCF B2+ requires Premium
    price: "Premium",
    features: [
      "Compréhension orale (29 questions)",
      "Compréhension écrite (29 questions)",
      "Structure de la langue (18 questions)",
      "Correction automatique par IA GPT-5",
      "Feedback personnalisé détaillé",
      "Certificat de réussite",
    ],
    image: "/placeholder.svg?height=300&width=400&text=TCF+Simulation+IA",
    color: "#007BFF",
  },
  {
    id: "tef-complete",
    type: "TEF",
    level: "B2",
    levelRange: "B1-C2",
    title: "Simulation TEF Avancée",
    titleEn: "Advanced TEF Simulation",
    description: "Préparation intensive au TEF avec IA de pointe",
    descriptionEn: "Intensive TEF preparation with cutting-edge AI",
    duration: 210,
    sections: 4,
    questions: 60,
    difficulty: 5,
    aiPowered: true,
    requiredTier: "premium", // TEF B2+ requires Premium
    price: "Premium",
    features: [
      "Compréhension orale (40 min)",
      "Compréhension écrite (60 min)",
      "Expression écrite (60 min)",
      "Expression orale (35 min)",
      "Évaluation IA en temps réel",
      "Rapport de performance détaillé",
    ],
    image: "/placeholder.svg?height=300&width=400&text=TEF+Simulation+IA",
    color: "#2ECC71",
  },
  {
    id: "tcf-express",
    type: "TCF",
    level: "A2",
    levelRange: "A1-B2",
    title: "TCF Express - IA Rapide",
    titleEn: "TCF Express - Quick AI",
    description: "Version accélérée avec analyse IA instantanée",
    descriptionEn: "Accelerated version with instant AI analysis",
    duration: 45,
    sections: 3,
    questions: 30,
    difficulty: 3,
    aiPowered: true,
    requiredTier: "free", // A1-A2 levels are free
    price: "Gratuit",
    features: [
      "Test adaptatif intelligent",
      "Questions personnalisées par IA",
      "Résultats instantanés",
      "Recommandations d'apprentissage",
      "Suivi de progression",
      "Interface moderne et intuitive",
    ],
    image: "/placeholder.svg?height=300&width=400&text=TCF+Express+IA",
    color: "#F39C12",
  },
  {
    id: "tef-oral",
    type: "TEF",
    level: "C1",
    levelRange: "B2-C2",
    title: "TEF Expression Orale - IA Conversationnelle",
    titleEn: "TEF Oral Expression - Conversational AI",
    description: "Simulation d'entretien oral avec IA conversationnelle avancée",
    descriptionEn: "Oral interview simulation with advanced conversational AI",
    duration: 35,
    sections: 2,
    questions: 6,
    difficulty: 5,
    aiPowered: true,
    requiredTier: "pro", // C1+ requires Pro+
    price: "Pro+",
    features: [
      "Conversation avec IA GPT-5",
      "Reconnaissance vocale avancée",
      "Évaluation de la prononciation",
      "Feedback sur la fluidité",
      "Simulation d'entretien réel",
      "Enregistrement et analyse",
    ],
    image: "/placeholder.svg?height=300&width=400&text=TEF+Oral+IA",
    color: "#8E44AD",
  },
]

const mockStats = {
  totalSimulations: 15420,
  averageScore: 78,
  successRate: 85,
  aiAccuracy: 96,
}

export default function TCFTEFSimulationPage() {
  const { lang } = useLang()
  const { userTier, canAccess, canAccessTCFTEF } = useSubscriptionAccess()
  const [selectedSimulation, setSelectedSimulation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  // Default level filter starts from B1 as requested
  const [filterLevel, setFilterLevel] = useState("B1")
  const [filterSubscription, setFilterSubscription] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [backendSimulations, setBackendSimulations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [previewSimulation, setPreviewSimulation] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Fetch simulations from backend
  useEffect(() => {
    const fetchSimulations = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/content-management/simulations')
        if ((response.data as any).success) {
          setBackendSimulations((response.data as any).data.content || [])
        }
      } catch (error) {
        console.error('Error fetching simulations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSimulations()
  }, [])

  // Combine backend simulations with mock data for now
  const allSimulations = [...simulationTypes, ...backendSimulations.map(sim => ({
    id: sim.id,
    type: sim.contentType || 'tcf',
    level: sim.level,
    levelRange: sim.level,
    title: sim.title,
    titleEn: sim.titleEn || sim.title,
    description: sim.description,
    descriptionEn: sim.descriptionEn || sim.description,
    duration: sim.duration,
    sections: 4,
    questions: sim.questionCount || 50,
    price: sim.subscriptionTier === 'FREE' ? 'Gratuit' : 'Premium',
    requiredTier: sim.subscriptionTier?.toLowerCase() || 'free',
    features: ['Timer automatique', 'Correction IA', 'Feedback détaillé'],
    isOfficial: sim.isOfficial || false,
    difficulty: sim.difficulty || 'Intermédiaire',
    completionRate: 85,
    averageScore: 78,
    color: 'from-blue-500 to-purple-600',
    icon: Brain
  }))]

  const filteredSimulations = allSimulations.filter((simulation) => {
    const matchesSearch =
      searchQuery === "" ||
      (lang === "fr" ? simulation.title : simulation.titleEn).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lang === "fr" ? simulation.description : simulation.descriptionEn)
        .toLowerCase()
        .includes(searchQuery.toLowerCase())

    const matchesLevel = filterLevel === "all" || simulation.levelRange.includes(filterLevel)

    const matchesSubscription =
      filterSubscription === "all" ||
      (filterSubscription === "free" && (simulation.price === "Gratuit" || simulation.price === "Free")) ||
      (filterSubscription === "essential" && simulation.requiredTier === "essential") ||
      (filterSubscription === "premium" && simulation.requiredTier === "premium") ||
      (filterSubscription === "pro" && simulation.requiredTier === "pro")

    const matchesType = filterType === "all" || simulation.type === filterType

    return matchesSearch && matchesLevel && matchesSubscription && matchesType
  })

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-green-500 text-white"
      case "essential":
        return "bg-blue-500 text-white"
      case "premium":
        return "bg-orange-500 text-white"
      case "pro":
        return "bg-purple-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "free":
        return Shield
      case "essential":
        return Shield
      case "premium":
        return Crown
      case "pro":
        return Sparkles
      default:
        return Shield
    }
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <section className="relative text-center mb-12 overflow-hidden rounded-2xl">
          {/* Background Image */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#007BFF]/5 via-[#2ECC71]/5 to-[#F39C12]/5">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=600&fit=crop&crop=center')"
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/60 to-background/70" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 py-16 px-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#007BFF]/10 to-[#2ECC71]/10 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
              <Brain className="h-5 w-5 text-[#007BFF]" />
              <span className="text-sm font-medium text-[#007BFF]">
                {t("Propulsé par IA GPT-5", "Powered by AI GPT-5")}
              </span>
            </div>

          <h1 className="text-3xl md:text-4xl font-bold font-[var(--font-poppins)] mb-4 bg-gradient-to-r from-[#007BFF] to-[#2ECC71] bg-clip-text text-transparent">
            {t(
              "Simulations TCF/TEF avec Intelligence Artificielle",
              "TCF/TEF Simulations with Artificial Intelligence",
            )}
          </h1>

          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {t(
              "Préparez-vous aux examens officiels avec nos simulations alimentées par l'IA la plus avancée. Feedback personnalisé, correction instantanée et analyse détaillée de vos performances.",
              "Prepare for official exams with our simulations powered by the most advanced AI. Personalized feedback, instant correction and detailed analysis of your performance.",
            )}
          </p>

          {/* Dynamic animated text based on user choices */}
          <div className="mb-8 text-center">
            <div className="inline-block">
              <span className="text-lg text-muted-foreground">
                {filterLevel === "all" ? (
                  <span className="animate-pulse">
                    {t("Choisissez votre niveau pour voir les simulations disponibles", "Choose your level to see available simulations")}
                  </span>
                ) : filterLevel === "B1" ? (
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {t("Niveau B1 - Parfait pour débuter votre parcours TCF/TEF", "B1 Level - Perfect to start your TCF/TEF journey")}
                  </span>
                ) : filterLevel === "B2" ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {t("Niveau B2 - Simulations avancées avec feedback détaillé", "B2 Level - Advanced simulations with detailed feedback")}
                  </span>
                ) : filterLevel === "C1" ? (
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    {t("Niveau C1 - Maîtrise experte avec évaluation complète", "C1 Level - Expert mastery with complete evaluation")}
                  </span>
                ) : filterLevel === "C2" ? (
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    {t("Niveau C2 - Excellence native avec certification", "C2 Level - Native excellence with certification")}
                  </span>
                ) : (
                  <span className="animate-bounce">
                    {t("Sélectionnez un niveau pour commencer", "Select a level to begin")}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Dynamic Learning Features Based on User Selection */}
          <div className="mb-8 text-center">
            <div className="inline-block">
              <span className="text-lg text-muted-foreground">
                {filterSubscription === "all" ? (
                  <span className="animate-pulse">
                    {t("Sélectionnez votre abonnement pour découvrir les fonctionnalités", "Select your subscription to discover features")}
                  </span>
                ) : filterSubscription === "essential" ? (
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {t("Essential - Accès aux tests de base avec feedback IA", "Essential - Access to basic tests with AI feedback")}
                  </span>
                ) : filterSubscription === "premium" ? (
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    {t("Premium - Tests avancés avec analyse détaillée", "Premium - Advanced tests with detailed analysis")}
                  </span>
                ) : filterSubscription === "pro" ? (
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    {t("Pro+ - Accès complet avec suivi personnalisé", "Pro+ - Full access with personalized tracking")}
                  </span>
                ) : (
                  <span className="animate-bounce">
                    {t("Choisissez votre plan pour commencer", "Choose your plan to begin")}
                  </span>
                )}
              </span>
            </div>
          </div>
          </div>
        </section>

        {/* Dynamic Content Based on User Selection */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-[#007BFF]/5 via-[#2ECC71]/5 to-[#F39C12]/5 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold font-[var(--font-poppins)] mb-4">
                {filterType === "all" ? (
                  <span className="text-[#007BFF]">
                    {t("Choisissez votre type de test", "Choose your test type")}
                  </span>
                ) : filterType === "TCF" ? (
                  <span className="text-[#007BFF]">
                    {t("Test de Connaissance du Français (TCF)", "Test de Connaissance du Français (TCF)")}
                  </span>
                ) : filterType === "TEF" ? (
                  <span className="text-[#2ECC71]">
                    {t("Test d'Évaluation de Français (TEF)", "Test d'Évaluation de Français (TEF)")}
                  </span>
                ) : (
                  <span className="text-[#F39C12]">
                    {t("Préparez-vous à l'excellence", "Prepare for excellence")}
                  </span>
                )}
              </h2>
              
              <div className="max-w-3xl mx-auto">
                {filterType === "all" ? (
                  <p className="text-muted-foreground leading-relaxed">
                    {t(
                      "Découvrez nos deux types de simulations : TCF pour l'évaluation générale et TEF pour l'immigration. Chaque test est adapté à votre niveau et vos objectifs.",
                      "Discover our two types of simulations: TCF for general assessment and TEF for immigration. Each test is adapted to your level and goals."
                    )}
                  </p>
                ) : filterType === "TCF" ? (
                  <p className="text-muted-foreground leading-relaxed">
                    {t(
                      "Le TCF évalue vos compétences en français dans un contexte général. Parfait pour les études, le travail ou l'immigration au Canada. Notre IA analyse votre compréhension orale, écrite et votre maîtrise de la langue.",
                      "The TCF evaluates your French skills in a general context. Perfect for studies, work or immigration to Canada. Our AI analyzes your listening, reading and language mastery."
                    )}
                  </p>
                ) : filterType === "TEF" ? (
                  <p className="text-muted-foreground leading-relaxed">
                    {t(
                      "Le TEF est spécialement conçu pour l'immigration au Canada et au Québec. Il évalue vos compétences pratiques en français avec des situations réelles. Notre IA vous prépare aux défis spécifiques de l'immigration.",
                      "The TEF is specially designed for immigration to Canada and Quebec. It evaluates your practical French skills with real situations. Our AI prepares you for the specific challenges of immigration."
                    )}
                  </p>
                ) : (
                  <p className="text-muted-foreground leading-relaxed">
                    {t(
                      "Que vous visiez l'immigration, les études ou le travail, nos simulations IA vous donnent l'avantage. Feedback instantané, progression personnalisée et suivi de votre évolution.",
                      "Whether you're aiming for immigration, studies or work, our AI simulations give you the advantage. Instant feedback, personalized progress and tracking of your evolution."
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="mb-8">
          <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="h-5 w-5 text-[#007BFF]" />
              <h2 className="text-lg font-semibold text-foreground">
                {t("Rechercher et filtrer", "Search and filter")}
              </h2>
            </div>

            {/* Segmented control for type (Coursera-like) */}
            <Tabs value={filterType} onValueChange={setFilterType} className="mb-6">
              <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-grid">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t("Tous", "All")}</TabsTrigger>
                <TabsTrigger value="TCF" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">TCF</TabsTrigger>
                <TabsTrigger value="TEF" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">TEF</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("Rechercher une simulation...", "Search simulation...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                />
              </div>

              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder={t("Niveau", "Level")} />
                </SelectTrigger>
                <SelectContent>
                  {/* Only B1, B2, C1, C2 are eligible for TCF/TEF simulations */}
                  <SelectItem value="B1">B1</SelectItem>
                  <SelectItem value="B2">B2</SelectItem>
                  <SelectItem value="C1">C1</SelectItem>
                  <SelectItem value="C2">C2</SelectItem>
                  <SelectItem value="all">{t("Tous les niveaux", "All levels")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSubscription} onValueChange={setFilterSubscription}>
                <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder={t("Abonnement", "Subscription")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="essential">{t("Essentiel", "Essential")}</SelectItem>
                  <SelectItem value="premium">{t("Premium", "Premium")}</SelectItem>
                  <SelectItem value="pro">{t("Pro+", "Pro+")}</SelectItem>
                  <SelectItem value="all">{t("Tous les abonnements", "All subscriptions")}</SelectItem>
                </SelectContent>
              </Select>
              {/* Removed old Type select in favor of segmented control above */}
            </div>

            {/* Results Counter */}
            <div className="mt-4 text-sm text-foreground">
              {t(
                `${filteredSimulations.length} simulation(s) trouvée(s)`,
                `${filteredSimulations.length} simulation(s) found`,
              )}
            </div>
          </div>
        </section>

        {/* Simulation Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold font-[var(--font-poppins)] mb-6 text-foreground">
            {t("Choisissez votre simulation", "Choose your simulation")}
          </h2>

          {filteredSimulations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Search className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {t("Aucune simulation trouvée", "No simulations found")}
              </h3>
              <p className="text-muted-foreground">
                {t("Essayez de modifier vos critères de recherche", "Try modifying your search criteria")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredSimulations.map((simulation) => {
                const hasAccess = canAccess(simulation.requiredTier as any)
                const isTCFTEFRestricted =
                  ["B2", "C1", "C2"].includes(simulation.level) && !canAccessTCFTEF(simulation.level)
                const TierIcon = getTierIcon(simulation.requiredTier)

                return (
                  <div key={simulation.id}>
                    <SubscriptionAccess
                      requiredTier={simulation.requiredTier as any}
                      userTier={userTier}
                      contentType="test"
                      showUpgrade={!hasAccess}
                    >
                      <Card
                        className={`group hover:shadow-xl transition-all duration-300 border-2 hover:border-opacity-50 overflow-hidden ${
                          !hasAccess ? "opacity-60" : ""
                        }`}
                        style={{
                          borderColor: selectedSimulation === simulation.id ? simulation.color : "transparent",
                        }}
                      >
                        <div className="relative aspect-video overflow-hidden">
                          <Image
                            src={`https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop&crop=center`}
                            alt={lang === "fr" ? simulation.title : simulation.titleEn}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                          <div className="absolute top-4 left-4 flex items-center gap-2">
                            <Badge
                              className="text-white border-0 font-semibold"
                              style={{ backgroundColor: simulation.color }}
                            >
                              {simulation.type} {simulation.level}
                            </Badge>
                            <Badge className="bg-black/50 text-white border-0 gap-1">
                              <Brain className="h-3 w-3" />
                              IA
                            </Badge>
                            {!hasAccess && (
                              <Badge className="bg-red-500/80 text-white border-0 gap-1">
                                <Lock className="h-3 w-3" />
                                {t("Verrouillé", "Locked")}
                              </Badge>
                            )}
                          </div>

                          <div className="absolute top-4 right-4">
                            <Badge className={getTierBadgeStyle(simulation.requiredTier)}>
                              <TierIcon className="h-3 w-3 mr-1" />
                              {simulation.price}
                            </Badge>
                          </div>

                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-white font-bold text-lg mb-1">
                              {lang === "fr" ? simulation.title : simulation.titleEn}
                            </h3>
                            <p className="text-white/90 text-sm">
                              {lang === "fr" ? simulation.description : simulation.descriptionEn}
                            </p>
                          </div>
                        </div>

                        <CardContent className="p-6">
                          <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {simulation.duration} min
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {simulation.questions} {t("questions", "questions")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {simulation.sections} {t("sections", "sections")}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-muted-foreground">{t("Difficulté:", "Difficulty:")}</span>
                              {Array.from({ length: simulation.difficulty }).map((_, i) => (
                                <div key={i} className="w-2 h-2 rounded-full bg-[#007BFF]" />
                              ))}
                              {Array.from({ length: 5 - simulation.difficulty }).map((_, i) => (
                                <div key={i} className="w-2 h-2 rounded-full bg-muted" />
                              ))}
                            </div>
                            <div className="flex items-center gap-1 text-[#2ECC71]">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">{t("IA Certifiée", "AI Certified")}</span>
                            </div>
                          </div>

                          <div className="space-y-2 mb-6">
                            <h4 className="font-semibold text-sm">
                              {t("Fonctionnalités incluses:", "Included features:")}
                            </h4>
                            <div className="grid grid-cols-1 gap-1">
                              {simulation.features
                                .slice(0, 3)
                                .map((feature: string, index: number) => (
                                  <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CheckCircle className="h-3 w-3 text-[#2ECC71] flex-shrink-0" />
                                    <span>{feature}</span>
                                  </div>
                                ))}
                              {simulation.features.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{simulation.features.length - 3}{" "}
                                  {t("autres fonctionnalités", "more features")}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              className="flex-1 gap-2"
                              style={{ backgroundColor: hasAccess ? simulation.color : "#6B7280" }}
                              onClick={() => {
                                if (hasAccess) {
                                  setPreviewSimulation({
                                    id: simulation.id,
                                    title: simulation.title,
                                    description: simulation.description,
                                    level: simulation.level,
                                    duration: simulation.duration,
                                    totalQuestions: simulation.questions,
                                    difficulty: simulation.difficulty === 5 ? 'HARD' : simulation.difficulty >= 3 ? 'MEDIUM' : 'EASY',
                                    type: simulation.type === 'tcf' ? 'OFFICIAL' : 'PRACTICE',
                                    requiredTier: simulation.requiredTier.toUpperCase(),
                                    sections: [
                                      {
                                        name: t("Compréhension écrite", "Reading Comprehension"),
                                        duration: Math.floor(simulation.duration * 0.4),
                                        questionCount: Math.floor(simulation.questions * 0.4),
                                        hasAudio: false,
                                        description: t("Questions de compréhension de texte", "Text comprehension questions")
                                      },
                                      {
                                        name: t("Compréhension orale", "Listening Comprehension"),
                                        duration: Math.floor(simulation.duration * 0.3),
                                        questionCount: Math.floor(simulation.questions * 0.3),
                                        hasAudio: true,
                                        description: t("Questions d'écoute et compréhension", "Listening and comprehension questions")
                                      },
                                      {
                                        name: t("Expression écrite", "Written Expression"),
                                        duration: Math.floor(simulation.duration * 0.2),
                                        questionCount: Math.floor(simulation.questions * 0.2),
                                        hasAudio: false,
                                        description: t("Rédaction et expression écrite", "Writing and written expression")
                                      },
                                      {
                                        name: t("Expression orale", "Oral Expression"),
                                        duration: Math.floor(simulation.duration * 0.1),
                                        questionCount: Math.floor(simulation.questions * 0.1),
                                        hasAudio: true,
                                        description: t("Expression et communication orale", "Oral expression and communication")
                                      }
                                    ],
                                    tags: simulation.features || [],
                                    instructions: [
                                      t("Lisez attentivement chaque question", "Read each question carefully"),
                                      t("Gérez votre temps efficacement", "Manage your time effectively"),
                                      t("Répondez à toutes les questions", "Answer all questions"),
                                      t("Vérifiez vos réponses avant de soumettre", "Check your answers before submitting")
                                    ],
                                    requirements: [
                                      t("Connexion internet stable", "Stable internet connection"),
                                      t("Navigateur moderne", "Modern browser"),
                                      t("Environnement calme", "Quiet environment"),
                                      t("Mode plein écran requis", "Fullscreen mode required")
                                    ],
                                    createdBy: "TCF/TEF Platform",
                                    createdAt: new Date().toISOString()
                                  })
                                  setIsPreviewOpen(true)
                                }
                              }}
                              disabled={!hasAccess}
                            >
                              {hasAccess ? (
                                <>
                                  <Play className="h-4 w-4" />
                                  {t("Commencer", "Start")}
                                </>
                              ) : (
                                <>
                                  <Lock className="h-4 w-4" />
                                  {t("Passer à", "Upgrade to")} {simulation.price}
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSelectedSimulation(selectedSimulation === simulation.id ? null : simulation.id)
                              }
                            >
                              {t("Détails", "Details")}
                            </Button>
                          </div>

                          {selectedSimulation === simulation.id && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <h4 className="font-semibold text-sm mb-3">
                                {t("Toutes les fonctionnalités:", "All features:")}
                              </h4>
                              <div className="grid grid-cols-1 gap-2">
                                {simulation.features.map((feature: string, index: number) => (
                                  <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <CheckCircle className="h-3 w-3 text-[#2ECC71] flex-shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </SubscriptionAccess>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Learning Progress Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-[#007BFF]/5 via-[#2ECC71]/5 to-[#8E44AD]/5 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-8">
              <Brain className="h-16 w-16 text-[#007BFF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold font-[var(--font-poppins)] mb-4">
                {t("Apprentissage Personnalisé", "Personalized Learning")}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t(
                  "Notre intelligence artificielle GPT-5 analyse vos réponses en temps réel et fournit un feedback personnalisé pour améliorer votre niveau de français.",
                  "Our GPT-5 artificial intelligence analyzes your responses in real-time and provides personalized feedback to improve your French level.",
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <MessageSquare className="h-12 w-12 text-[#007BFF] mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{t("Analyse Linguistique", "Linguistic Analysis")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "Évaluation précise de votre grammaire, vocabulaire et structure",
                      "Precise evaluation of your grammar, vocabulary and structure",
                    )}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <TrendingUp className="h-12 w-12 text-[#2ECC71] mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{t("Suivi Adaptatif", "Adaptive Tracking")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "Questions qui s'adaptent à votre niveau en temps réel",
                      "Questions that adapt to your level in real-time",
                    )}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <Target className="h-12 w-12 text-[#F39C12] mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{t("Progression Continue", "Continuous Progress")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "Suivi de votre évolution et recommandations personnalisées",
                      "Tracking your progress and personalized recommendations",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-[#007BFF] to-[#2ECC71] rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold font-[var(--font-poppins)] mb-4">
              {t("Prêt à révolutionner votre préparation ?", "Ready to revolutionize your preparation?")}
            </h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              {t(
                "Rejoignez des milliers d'étudiants qui ont déjà amélioré leur niveau de français grâce à notre IA. Commencez votre apprentissage personnalisé dès maintenant.",
                "Join thousands of students who have already improved their French level thanks to our AI. Start your personalized learning now.",
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-[#007BFF] hover:bg-white/90 gap-2">
                <Play className="h-5 w-5" />
                {t("Commencer gratuitement", "Start for free")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 gap-2 bg-transparent"
              >
                <Brain className="h-5 w-5" />
                {t("Découvrir l'IA", "Discover AI")}
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Simulation Preview Modal */}
      <SimulationPreviewModal
        simulation={previewSimulation}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        userTier={userTier}
        onStart={(simulationId) => {
          // Navigate to exam runner
          window.location.href = `/tcf-tef-simulation/exam-runner/${simulationId}`
        }}
      />
    </PageShell>
  )
}

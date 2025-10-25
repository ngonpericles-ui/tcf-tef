"use client"

import React, { useState, useMemo, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Lock, Play, FileText, Crown } from "lucide-react"
import { useLang } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"

interface Simulation {
  id: string
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  level: string
  type: "EPREUVE" | "SIMULATION_REEL"
  category: string // TCF, TEF, or "Épreuve typique"
  requiredTier: string
  duration: number
  questions?: number
  difficulty?: number
  image?: string
  tags: string[]
  isPublished: boolean
  createdAt: string
}

export default function TCFTEFSimulationPage() {
  const { lang } = useLang()
  const { user } = useAuth()
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [activeTab, setActiveTab] = useState<"epreuve" | "simulation">("epreuve")
  
  const heroImages = useMemo(() => [
    "/images/tests/hero1.jpg",
    "/images/tests/hero2.jpg",
    "/images/tests/hero3.jpg",
  ], [])
  const [heroIndex, setHeroIndex] = useState(0)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  useEffect(() => {
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % heroImages.length), 15000)
    return () => clearInterval(id)
  }, [heroImages.length])

  // Fetch simulations from backend
  useEffect(() => {
    const fetchSimulations = async () => {
      try {
        const response = await apiClient.get('/content-management/management?contentType=SIMULATION')
        if ((response as any).success) {
          const content = (response as any).data?.content || []
          setSimulations(Array.isArray(content) ? content : [])
        }
      } catch (error) {
        console.error('Error fetching simulations:', error)
        setSimulations([])
      }
    }

    fetchSimulations()
  }, [])

  // Filter simulations based on active tab
  const filteredSimulations = useMemo(() => {
    let filtered = simulations.filter(sim => {
      if (activeTab === "epreuve") {
        return sim.type === "EPREUVE" && (sim.category === "TCF" || sim.category === "TEF")
      } else {
        return sim.type === "SIMULATION_REEL" && sim.category === "Épreuve typique"
      }
    })

    if (selectedLevel !== "all") {
      filtered = filtered.filter(sim => sim.level === selectedLevel)
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(sim => sim.category === selectedCategory)
    }

    return filtered
  }, [simulations, activeTab, selectedLevel, selectedCategory])

  const canAccessSimulation = (requiredTier: string) => {
    if (!user) return requiredTier === "FREE"
    const tierHierarchy: Record<string, number> = {
      "FREE": 0,
      "ESSENTIAL": 1,
      "PREMIUM": 2,
      "PRO": 3,
    }
    const userTierLevel = tierHierarchy[user.subscriptionTier || "FREE"] || 0
    const requiredLevel = tierHierarchy[requiredTier] || 0
    return userTierLevel >= requiredLevel
  }

  const SimulationCard = ({ sim }: { sim: Simulation }) => {
    const isLocked = !canAccessSimulation(sim.requiredTier)
    
    return (
      <div className="group relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-card hover:shadow-lg transition-all duration-300">
        {/* Image */}
        <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
          {sim.image && (
            <Image
              src={sim.image}
              alt={sim.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          {isLocked && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Lock className="h-8 w-8 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-foreground line-clamp-2">{sim.title}</h3>
            {isLocked && <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0 ml-2" />}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{sim.description}</p>

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="text-xs">{sim.category}</Badge>
            <Badge variant="outline" className="text-xs">{sim.level}</Badge>
            {sim.difficulty && <Badge variant="outline" className="text-xs">{t("Difficulté", "Difficulty")}: {sim.difficulty}/5</Badge>}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            {sim.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {sim.duration} min
              </div>
            )}
            {sim.questions && (
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {sim.questions} questions
              </div>
            )}
          </div>

          <Button
            className="w-full"
            disabled={isLocked}
            variant={isLocked ? "outline" : "default"}
          >
            {isLocked ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                {t("Abonnement requis", "Subscription required")}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {t("Commencer", "Start")}
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PageShell>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8 min-h-[55vh]">
        <div className="absolute inset-0 -z-10">
          <Image
            key={heroImages[heroIndex]}
            src={heroImages[heroIndex]}
            alt={t("Simulation TCF/TEF", "TCF/TEF Simulation")}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-b from-black/35 via-black/15 to-transparent" />
        <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br from-transparent via-transparent to-blue-800/40" />

        <div className="max-w-7xl mx-auto text-center flex flex-col justify-center min-h-[40vh]">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            {t("Simulations TCF & TEF", "TCF & TEF Simulations")}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            {t(
              "Préparez-vous aux examens TCF et TEF avec des épreuves authentiques et des simulations réalistes. Entraînez-vous à votre rythme et suivez votre progression.",
              "Prepare for TCF and TEF exams with authentic papers and realistic simulations. Practice at your own pace and track your progress."
            )}
          </p>

          <div className="grid grid-cols-3 gap-8 mt-10 max-w-md mx-auto">
            <div>
              <div className="text-2xl font-bold text-white">100+</div>
              <div className="text-sm text-white/85">{t("Épreuves", "Papers")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">IA</div>
              <div className="text-sm text-white/85">{t("Correction", "Correction")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">A1–C2</div>
              <div className="text-sm text-white/85">{t("Tous niveaux", "All levels")}</div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
        {/* Tabs for Épreuves and Simulations */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "epreuve" | "simulation")} className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="epreuve">{t("Épreuves", "Papers")}</TabsTrigger>
            <TabsTrigger value="simulation">{t("Simulations réelles", "Real Simulations")}</TabsTrigger>
          </TabsList>

          <TabsContent value="epreuve" className="space-y-6">
            {/* Level Filter */}
            <div>
              <h3 className="text-sm font-medium mb-3">{t("Niveau", "Level")}</h3>
              <Tabs value={selectedLevel} onValueChange={setSelectedLevel} className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="all">{t("Tous", "All")}</TabsTrigger>
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                    <TabsTrigger key={level} value={level}>{level}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-medium mb-3">{t("Type", "Type")}</h3>
              <div className="flex gap-2 flex-wrap">
                {["all", "TCF", "TEF"].map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat)}
                    size="sm"
                  >
                    {cat === "all" ? t("Tous", "All") : cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Simulations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSimulations.map((sim) => (
                <SimulationCard key={sim.id} sim={sim} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="simulation" className="space-y-6">
            {/* Level Filter for Real Simulations (B1-C2 only) */}
            <div>
              <h3 className="text-sm font-medium mb-3">{t("Niveau", "Level")}</h3>
              <Tabs value={selectedLevel} onValueChange={setSelectedLevel} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">{t("Tous", "All")}</TabsTrigger>
                  {["B1", "B2", "C1", "C2"].map((level) => (
                    <TabsTrigger key={level} value={level}>{level}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Simulations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSimulations.map((sim) => (
                <SimulationCard key={sim.id} sim={sim} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </PageShell>
  )
}


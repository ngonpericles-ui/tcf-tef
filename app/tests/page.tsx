"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Users, Star, Lock, Play, Award, Target, BookOpen, Brain, TrendingUp, SpellCheck, Headphones, FileText, PenSquare, Mic, Puzzle } from "lucide-react"
import { useLang } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import Image from "next/image"
import Link from "next/link"

const testTypeColors = {
  tcf: "#007BFF",
  tef: "#2ECC71",
  delf: "#F39C12",
  dalf: "#8E44AD",
}

// Removed mock data - using only real backend data

interface Test {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  level: string;
  category: string;
  subscriptionTier: string;
  requiredTier: string;
  contentType: string;
  type: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  image?: string;
  duration: number;
  tags: string[];
  isPublished: boolean;
  isOfficial?: boolean;
  questionCount?: number;
  completionCount?: number;
  averageScore?: number;
  difficulty?: string;
  hasAIFeedback?: boolean;
  createdAt: string;
  updatedAt: string;
}

const TestsPage = React.memo(function TestsPage() {
  const { lang } = useLang()
  const [chip, setChip] = useState<3 | 5 | 10 | 20 | 30>(30)
  const [userTier] = useState<string>("FREE") // Mock user subscription
  const [selectedTier, setSelectedTier] = useState<string>("all")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  // Category selection controls the grid below
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const heroImages = useMemo(() => [
    "/images/tests/hero1.jpg",
    "/images/tests/hero2.jpg",
    "/images/tests/hero3.jpg",
    "/images/tests/hero4.jpg",
    "/images/tests/hero5.jpg",
  ], [])
  const [heroIndex, setHeroIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % heroImages.length), 15000)
    return () => clearInterval(id)
  }, [heroImages.length])

  // Fetch tests from backend
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/content-management/tests')
        if ((response.data as any).success) {
          const transformedTests = (response.data as any).data.content.map((test: any) => ({
            id: test.id,
            title: test.title,
            titleEn: test.titleEn || test.title,
            description: test.description,
            descriptionEn: test.descriptionEn || test.description,
            level: test.level,
            category: test.category,
            subscriptionTier: test.subscriptionTier,
            requiredTier: test.subscriptionTier?.toLowerCase() || 'free',
            contentType: test.contentType,
            type: test.contentType?.toLowerCase() || 'test',
            fileUrl: test.fileUrl,
            thumbnailUrl: test.thumbnailUrl,
            image: test.thumbnailUrl || '/placeholder.svg',
            duration: test.duration,
            tags: test.tags || [],
            isPublished: test.isPublished,
            isOfficial: test.isOfficial || false,
            questionCount: test.questionCount || 20,
            completionCount: test.completionCount || 0,
            averageScore: test.averageScore || 0,
            difficulty: test.difficulty || '3',
            hasAIFeedback: test.hasAIFeedback || false,
            createdAt: test.createdAt,
            updatedAt: test.updatedAt
          }))
          setTests(transformedTests)
        } else {
          // No tests available from backend
          setTests([])
        }
      } catch (error) {
        console.error('Error fetching tests:', error)
        // Set empty array if backend fails
        setTests([])
      } finally {
        setLoading(false)
      }
    }

    fetchTests()
  }, [])

  const t = useCallback((fr: string, en: string) => (lang === "fr" ? fr : en), [lang])

  // Filter tests based on selected criteria
  const filteredTests = useMemo(() => {
    let filtered = tests

    // Filter by tier
    if (selectedTier !== "all") {
      filtered = filtered.filter(test => test.subscriptionTier === selectedTier.toUpperCase())
    }

    // Filter by level
    if (selectedLevel !== "all") {
      filtered = filtered.filter(test => test.level === selectedLevel.toUpperCase())
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(test => test.category.toLowerCase() === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by user tier access
    const tierHierarchy = { "FREE": 0, "ESSENTIAL": 1, "PREMIUM": 2, "PRO": 3 }
    const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0
    filtered = filtered.filter(test => {
      const testTierLevel = tierHierarchy[test.subscriptionTier as keyof typeof tierHierarchy] || 0
      return testTierLevel <= userTierLevel
    })

    return filtered
  }, [tests, selectedTier, selectedLevel, selectedCategory, searchTerm, userTier])

  // Helper function to get active card styles based on color class
  const getActiveCardStyles = useCallback((colorClass: string) => {
    const styles = {
      gray: "border-gray-500 bg-gray-50 dark:!bg-gray-700 dark:!border-gray-600 dark:!text-white shadow-md",
      purple: "border-purple-500 bg-purple-100 dark:bg-purple-900/20 dark:border-purple-600 dark:text-white shadow-md",
      blue: "border-blue-500 bg-blue-100 dark:bg-blue-900/20 dark:border-blue-600 dark:text-white shadow-md",
      emerald: "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-600 dark:text-white shadow-md",
      green: "border-green-500 bg-green-100 dark:bg-green-900/20 dark:border-green-600 dark:text-white shadow-md",
      orange: "border-orange-500 bg-orange-100 dark:bg-orange-900/20 dark:border-orange-600 dark:text-white shadow-md",
      red: "border-red-500 bg-red-100 dark:bg-red-900/20 dark:border-red-600 dark:text-white shadow-md"
    }
    return styles[colorClass as keyof typeof styles] || styles.gray
  }, [])

  // Additional filtering by duration
  const finalFilteredTests = useMemo(() => {
    let filtered = filteredTests

    // Duration filter
    if (chip === 3) filtered = filtered.filter(test => test.duration <= 5)
    else if (chip === 5) filtered = filtered.filter(test => test.duration <= 15)
    else if (chip === 10) filtered = filtered.filter(test => test.duration <= 30)
    else if (chip === 20) filtered = filtered.filter(test => test.duration <= 60)
    else filtered = filtered.filter(test => test.duration <= 120)

    return filtered
  }, [filteredTests, chip])

  const getTierOptions = (tier: string) => {
    switch (tier) {
      case "free":
        return ["A1", "A2"]
      case "essential":
        return ["A1", "A2", "B1"]
      case "premium":
        return ["A1", "A2", "B1", "B2", "C1", "C2"]
      case "pro":
        return ["A1", "A2", "B1", "B2", "C1", "C2"]
      default:
        return []
    }
  }

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level)
  }

  return (
    <PageShell>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8 min-h-[55vh]">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <Image
            key={heroImages[heroIndex]}
            src={heroImages[heroIndex]}
            alt={t("Étudiant se préparant à un test", "Student preparing for a test")}
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* Readability overlays */}
        <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-b from-black/35 via-black/15 to-transparent" />
        <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br from-transparent via-transparent to-purple-800/40" />

        <div className="max-w-7xl mx-auto text-center flex flex-col justify-center min-h-[40vh]">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            {t("Tests & Simulations", "Tests & Simulations")}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            {t(
              "Évaluez votre niveau avec nos tests TCF, TEF. Entraînez-vous avec des simulations réalistes et suivez votre progression.",
              "Assess your level with TCF, TEF tests. Practice with realistic simulations and track your progress."
            )}
          </p>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-8 mt-10 max-w-md mx-auto">
            <div>
              <div className="text-2xl font-bold text-white">120+</div>
              <div className="text-sm text-white/85">{t("Tests", "Tests")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">IA</div>
              <div className="text-sm text-white/85">{t("Feedback instantané", "Instant feedback")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">A1–C2</div>
              <div className="text-sm text-white/85">{t("Tous niveaux", "All levels")}</div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">

        {/* Quick Test Panel */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold font-[var(--font-poppins)] mb-4 text-foreground">
            {t("Démarrage rapide", "Quick Start")}
          </h2>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="text-sm font-medium text-foreground">{t("Test rapide", "Quick test")}:</span>
                <div className="flex items-center gap-2 flex-wrap">
              {([3, 5, 10, 20, 30] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setChip(m)}
                      className={`h-9 rounded-full border px-4 text-sm font-medium transition-all active:scale-95 ${
                    chip === m
                          ? "bg-[#007BFF] text-white border-[#007BFF] shadow-md"
                          : "bg-background text-foreground border-gray-200 dark:border-gray-700 hover:bg-accent"
                  }`}
                  aria-pressed={chip === m}
                >
                  {m} min
                </button>
              ))}
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Link href="/test-niveau" aria-label={t("Test de niveau", "Level test")}>
                  <Button className="bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black gap-2 shadow-md">
                <Target className="h-4 w-4" />
                {t("Test de niveau", "Level test")}
              </Button>
                </Link>
              <Link href="/tests/all">
                  <Button variant="outline" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    {t("Tous les tests", "All tests")}
                  </Button>
              </Link>
              <Link href="/expertise" aria-label={t("Avis d'expert", "Expert review")}>
                  <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-md">
                    <Brain className="h-4 w-4" />
                    {t("Avis d'expert", "Expert review")}
                  </Button>
              </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold font-[var(--font-poppins)] mb-4 text-foreground">
            {t("Filtrer par niveau", "Filter by level")}
          </h2>
          <Tabs value={selectedLevel} onValueChange={setSelectedLevel} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">{t("Tous", "All")}</TabsTrigger>
              <TabsTrigger value="A1">A1</TabsTrigger>
              <TabsTrigger value="A2">A2</TabsTrigger>
              <TabsTrigger value="B1">B1</TabsTrigger>
              <TabsTrigger value="B2">B2</TabsTrigger>
              <TabsTrigger value="C1">C1</TabsTrigger>
              <TabsTrigger value="C2">C2</TabsTrigger>
            </TabsList>
          </Tabs>
        </section>

        {/* Tests par abonnement */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold font-[var(--font-poppins)] mb-6 text-foreground">
            {t("Tests par abonnement", "Tests by subscription")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { key: "free", labelFr: "Tout gratuit", labelEn: "All Free", color: "#2ECC71" },
              { key: "essential", labelFr: "Essentiel", labelEn: "Essential", color: "#007BFF" },
              { key: "premium", labelFr: "Premium", labelEn: "Premium", color: "#F39C12" },
              { key: "pro", labelFr: "Pro+", labelEn: "Pro+", color: "#8E44AD" },
            ].map(({ key, labelFr, labelEn, color }) => (
              <div
                key={key}
                className="group relative rounded-xl border bg-card p-6 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                onClick={() => setSelectedTier(key)}
              >
                <div className="absolute left-0 top-0 h-2 w-full rounded-t-xl" style={{ backgroundColor: color }} />
                <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="h-6 w-6" style={{ color }} />
                  <span className="font-semibold text-base text-foreground">{lang === "fr" ? labelFr : labelEn}</span>
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  <span className="text-lg font-semibold text-foreground">{tests.filter((test) => {
                    const tierHierarchy = { "FREE": 0, "ESSENTIAL": 1, "PREMIUM": 2, "PRO": 3 }
                    const keyTierLevel = tierHierarchy[key.toUpperCase() as keyof typeof tierHierarchy] || 0
                    const testTierLevel = tierHierarchy[test.subscriptionTier as keyof typeof tierHierarchy] || 0
                    return testTierLevel <= keyTierLevel
                  }).length}</span> {t("tests disponibles", "available tests")}
                </div>

                {selectedTier === key && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-card border rounded-lg shadow-lg z-10">
                    <div className="text-xs font-medium mb-2 text-foreground">
                      {t("Niveaux disponibles:", "Available levels:")}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {getTierOptions(key).map((level) => (
                        <button
                          key={level}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLevelSelect(level)
                            setSelectedTier("all") // Close dropdown after selection
                          }}
                          className={`px-2 py-1 text-xs border rounded transition-colors ${
                            selectedLevel === level
                              ? "bg-primary text-primary-foreground border-primary"
                              : "hover:bg-accent text-muted-foreground hover:text-foreground border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
            }
          </div>
        </section>

        {/* Tests par catégorie */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold font-[var(--font-poppins)] text-foreground">
              {t("Tests par catégorie", "Tests by category")}
            </h2>
            <div className="text-sm text-muted-foreground">
              {filteredTests.length} {t("tests disponibles", "available tests")}
            </div>
                    </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4" key={`category-grid-${selectedCategory}`}>
            {[
              { key: "all", labelFr: "Tous", labelEn: "All", Icon: BookOpen, color: "#111827", colorClass: "gray" },
              { key: "grammar", labelFr: "Grammaire", labelEn: "Grammar", Icon: SpellCheck, color: "#8E44AD", colorClass: "purple" },
              { key: "listening", labelFr: "Compréhension orale", labelEn: "Listening", Icon: Headphones, color: "#007BFF", colorClass: "blue" },
              { key: "reading", labelFr: "Compréhension écrite", labelEn: "Reading", Icon: FileText, color: "#16A085", colorClass: "emerald" },
              { key: "vocabulary", labelFr: "Vocabulaire", labelEn: "Vocabulary", Icon: BookOpen, color: "#2ECC71", colorClass: "green" },
              { key: "writing", labelFr: "Expression écrite", labelEn: "Writing", Icon: PenSquare, color: "#F39C12", colorClass: "orange" },
              { key: "oral", labelFr: "Expression orale", labelEn: "Oral Expression", Icon: Mic, color: "#9B59B6", colorClass: "purple" },
              { key: "simulation", labelFr: "Simulation TCF/TEF", labelEn: "TCF/TEF Simulation", Icon: Puzzle, color: "#E74C3C", colorClass: "red" },
            ].map(({ key, labelFr, labelEn, Icon, color, colorClass }) => (
              key === "simulation" ? (
                <Link key={key} href="/tcf-tef-simulation">
                  <button
                    className={`w-full group relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                      selectedCategory === key
                        ? getActiveCardStyles(colorClass)
                        : "border-gray-200 dark:border-gray-700 bg-card hover:bg-accent"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Icon className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" style={{ color }} />
                      <div className="text-xs font-medium text-foreground">{lang === "fr" ? labelFr : labelEn}</div>
                    </div>
                  </button>
                    </Link>
              ) : (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`group relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    selectedCategory === key
                      ? (key === "all" 
                          ? "border-gray-500 bg-gray-50 dark:!bg-gray-700 dark:!border-gray-600 dark:!text-white shadow-md"
                          : getActiveCardStyles(colorClass))
                      : "border-gray-200 dark:border-gray-700 bg-card hover:bg-accent"
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Icon className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" style={{ color }} />
                    <div className="text-xs font-medium text-foreground">{lang === "fr" ? labelFr : labelEn}</div>
                  </div>
                </button>
              )
            ))}
          </div>
        </section>

        {/* Test Grid */}
        <section className="mt-6">
            <TestGrid tests={filteredTests} userTier={userTier} />
        </section>

        {/* Enhanced Statistics Section */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold font-[var(--font-poppins)] text-foreground">
              {t("Statistiques des tests", "Test statistics")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl border p-6 text-center bg-gradient-to-br from-[#007BFF]/10 to-[#007BFF]/5 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-[#007BFF] mb-2">{filteredTests.length}</div>
              <div className="text-sm font-medium text-muted-foreground">{t("Tests disponibles", "Available tests")}</div>
            </div>
            <div className="rounded-xl border p-6 text-center bg-gradient-to-br from-[#2ECC71]/10 to-[#2ECC71]/5 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-[#2ECC71] mb-2">
                {filteredTests.filter((test) => test.subscriptionTier === "FREE").length}
              </div>
              <div className="text-sm font-medium text-muted-foreground">{t("Tests gratuits", "Free tests")}</div>
            </div>
            <div className="rounded-xl border p-6 text-center bg-gradient-to-br from-[#F39C12]/10 to-[#F39C12]/5 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-[#F39C12] mb-2">
                {filteredTests.length}
              </div>
              <div className="text-sm font-medium text-muted-foreground">{t("Tests disponibles", "Available tests")}</div>
            </div>
            <div className="rounded-xl border p-6 text-center bg-gradient-to-br from-[#8E44AD]/10 to-[#8E44AD]/5 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-[#8E44AD] mb-2">
                {Math.round(filteredTests.reduce((acc, test) => acc + test.duration, 0) / 60)}h
              </div>
              <div className="text-sm font-medium text-muted-foreground">{t("Temps total", "Total time")}</div>
            </div>
          </div>
        </section>

        {/* Action Buttons Section */}
        <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tests/results">
              <Button className="gap-2 bg-[#007BFF] hover:bg-[#007BFF]/90">
                <TrendingUp className="h-4 w-4" />
                {t("Voir mes résultats", "View my test results")}
              </Button>
            </Link>
            <Link href="/tests/corrections">
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                {t("Voir les corrigés des tests", "View test corrections")}
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </PageShell>
  )
})

TestsPage.displayName = 'TestsPage'

export default TestsPage

function TestGrid({ tests, userTier }: { tests: Test[]; userTier: string }) {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const tierHierarchy = {
    "FREE": 0,
    "ESSENTIAL": 1,
    "PREMIUM": 2,
    "PRO": 3
  }

  const canAccess = (testRequiredTier: string) => {
    const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0
    const testTierLevel = tierHierarchy[testRequiredTier as keyof typeof tierHierarchy] || 0
    return testTierLevel <= userTierLevel
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-[#2ECC71] text-black font-medium"
      case "essential":
        return "bg-[#007BFF] text-white font-medium"
      case "premium":
        return "bg-[#F39C12] text-black font-medium"
      case "pro":
        return "bg-[#8E44AD] text-white font-medium"
      default:
        return "bg-neutral-500 text-white font-medium"
    }
  }

  if (tests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          {t("Aucun test disponible", "No tests available")}
        </h3>
        <p className="text-muted-foreground">
          {t("Les tests seront bientôt disponibles", "Tests will be available soon")}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tests.map((test) => {
        const hasAccess = canAccess(test.subscriptionTier)
        const testTypeColor = testTypeColors[test.category as keyof typeof testTypeColors] || "#007BFF"

        return (
          <div
            key={test.id}
            className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={test.image || "/placeholder.svg"}
                alt={lang === "fr" ? test.title : (test.titleEn || test.title)}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {!hasAccess && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white text-sm font-medium">
                    <Lock className="h-4 w-4" />
                    <span>
                      {test.requiredTier === "essential"
                        ? "Essential"
                        : test.requiredTier === "premium"
                          ? "Premium"
                          : "Pro"}
                    </span>
                  </div>
                </div>
              )}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <Badge className="text-white border-0 font-medium" style={{ backgroundColor: testTypeColor }}>
                  {test.type.toUpperCase()} {test.level}
                </Badge>
                <Badge className={`${getTierBadgeColor(test.requiredTier)} border-0 shadow-sm`}>
                  {test.requiredTier === "free" ? t("Gratuit", "Free") : test.requiredTier}
                </Badge>
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {test.isOfficial && (
                  <Badge variant="outline" className="bg-background/95 text-foreground border-0 font-medium shadow-sm">
                    <Award className="h-3 w-3 mr-1" />
                    {t("Officiel", "Official")}
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-4 mb-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {test.duration} min
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {test.questionCount} {t("questions", "questions")}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {test.completionCount}
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-foreground">
                {lang === "fr" ? test.title : (test.titleEn || test.title)}
              </h3>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {lang === "fr" ? test.description : (test.descriptionEn || test.description)}
              </p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-foreground">
                    {test.averageScore}% {t("réussite", "success")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: parseInt(test.difficulty || '3') }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#007BFF]" />
                  ))}
                  {Array.from({ length: 5 - parseInt(test.difficulty || '3') }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-muted" />
                  ))}
                </div>
              </div>

              {test.hasAIFeedback && (
                <div className="mb-3 text-xs text-[#2ECC71] flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  {t("Feedback IA inclus", "AI feedback included")}
                </div>
              )}

              <Button className="w-full gap-2" disabled={!hasAccess} variant={hasAccess ? "default" : "outline"}>
                {hasAccess ? (
                  <>
                    <Play className="h-4 w-4" />
                    {t("Démarrer le test", "Start test")}
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    {t("Passer en", "Upgrade to")}{" "}
                    {test.requiredTier === "essential"
                      ? "Essential"
                      : test.requiredTier === "premium"
                        ? "Premium"
                        : "Pro"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

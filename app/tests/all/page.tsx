"use client"

import { useState, useMemo, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Users, Star, Lock, Play, Award, BookOpen, Brain, Search, Filter, TrendingUp, FileText } from "lucide-react"
import { useLang } from "@/components/language-provider"
import { type SubscriptionTier } from "@/components/test-data"
import { apiClient } from "@/lib/api-client"
import Image from "next/image"
import Link from "next/link"

interface Test {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  level: string;
  category: string;
  requiredTier: string;
  type: string;
  duration: number;
  questionCount: number;
  completionCount: number;
  averageScore: number;
  difficulty: number;
  hasAIFeedback: boolean;
  isOfficial: boolean;
  image?: string;
}

const testTypeColors = {
  tcf: "#007BFF",
  tef: "#2ECC71",
  delf: "#F39C12",
  dalf: "#8E44AD",
}

export default function AllTestsPage() {
  const { lang } = useLang()
  const [userTier] = useState<SubscriptionTier>("free")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [selectedTier, setSelectedTier] = useState<string>("all")
  const [selectedDuration, setSelectedDuration] = useState<string>("all")
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Fetch tests from backend
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/content-management/tests')
        if (response.success && response.data?.content) {
          const transformedTests = (response.data.content as any[]).map((test: any) => ({
            id: test.id,
            title: test.title,
            titleEn: test.titleEn || test.title,
            description: test.description,
            descriptionEn: test.descriptionEn || test.description,
            level: test.level,
            category: test.category,
            requiredTier: String(test.requiredTier || 'free').toLowerCase(),
            type: String(test.type || 'practice').toLowerCase(),
            duration: Number(test.duration ?? 30),
            questionCount: Number(test.questionCount ?? 20),
            completionCount: Number(test.completionCount ?? Math.floor(Math.random() * 1000)),
            averageScore: Number(test.averageScore ?? (Math.floor(Math.random() * 40) + 60)),
            difficulty: test.level === 'A1' ? 1 : test.level === 'A2' ? 2 : test.level === 'B1' ? 3 : test.level === 'B2' ? 4 : 5,
            hasAIFeedback: Boolean(test.hasAIFeedback ?? (Math.random() > 0.5)),
            isOfficial: Boolean(test.isOfficial || false),
            image: `/images/tests/test-${Math.floor(Math.random() * 5) + 1}.jpg`,
            tags: (test.tags ?? []) as string[]
          }))
          setTests(transformedTests)
        }
      } catch (error) {
        console.error('Error fetching tests:', error)
        setTests([])
      } finally {
        setLoading(false)
      }
    }

    fetchTests()
  }, [])

  const tierHierarchy: Record<SubscriptionTier, SubscriptionTier[]> = {
    free: ["free"],
    essential: ["free", "essential"],
    premium: ["free", "essential", "premium"],
    pro: ["free", "essential", "premium", "pro"],
  }

  const canAccess = (testRequiredTier: SubscriptionTier) => {
    return tierHierarchy[userTier].includes(testRequiredTier)
  }

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const matchesSearch =
        searchQuery === "" ||
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesType = selectedType === "all" || test.type === selectedType
      const matchesLevel = selectedLevel === "all" || test.level === selectedLevel
      const matchesTier = selectedTier === "all" || test.requiredTier === selectedTier
      const matchesDuration =
        selectedDuration === "all" ||
        (selectedDuration === "quick" && test.duration <= 15) ||
        (selectedDuration === "medium" && test.duration > 15 && test.duration <= 60) ||
        (selectedDuration === "long" && test.duration > 60)

      return matchesSearch && matchesType && matchesLevel && matchesTier && matchesDuration
    })
  }, [searchQuery, selectedType, selectedLevel, selectedTier, selectedDuration])

  const groupedTests = useMemo(() => {
    const groups = {
      free: filteredTests.filter((t) => t.requiredTier === "free"),
      essential: filteredTests.filter((t) => t.requiredTier === "essential"),
      premium: filteredTests.filter((t) => t.requiredTier === "premium"),
      pro: filteredTests.filter((t) => t.requiredTier === "pro"),
    }
    return groups
  }, [filteredTests])

  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold font-[var(--font-poppins)] mb-2">
                {t("Tous les tests", "All tests")}
              </h1>
              <p className="text-neutral-600 dark:text-neutral-300">
                {t(
                  "Découvrez notre collection complète de plus de 150 tests",
                  "Discover our complete collection of 150+ tests",
                )}
              </p>
            </div>
            <div className="flex gap-3">
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
          </div>

          {/* Search and Filters */}
          <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("Rechercher un test...", "Search for a test...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Type", "Type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Tous les types", "All types")}</SelectItem>
                  <SelectItem value="tcf">TCF</SelectItem>
                  <SelectItem value="tef">TEF</SelectItem>
                  <SelectItem value="delf">DELF</SelectItem>
                  <SelectItem value="dalf">DALF</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Niveau", "Level")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Tous niveaux", "All levels")}</SelectItem>
                  <SelectItem value="A1">A1</SelectItem>
                  <SelectItem value="A2">A2</SelectItem>
                  <SelectItem value="B1">B1</SelectItem>
                  <SelectItem value="B2">B2</SelectItem>
                  <SelectItem value="C1">C1</SelectItem>
                  <SelectItem value="C2">C2</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Abonnement", "Subscription")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Tous", "All")}</SelectItem>
                  <SelectItem value="free">{t("Gratuit", "Free")}</SelectItem>
                  <SelectItem value="essential">Essential</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Durée", "Duration")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Toutes durées", "All durations")}</SelectItem>
                  <SelectItem value="quick">{t("Rapide (≤15min)", "Quick (≤15min)")}</SelectItem>
                  <SelectItem value="medium">{t("Moyen (15-60min)", "Medium (15-60min)")}</SelectItem>
                  <SelectItem value="long">{t("Long (>60min)", "Long (>60min)")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-muted-foreground">
                {filteredTests.length} {t("tests trouvés", "tests found")}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedType("all")
                  setSelectedLevel("all")
                  setSelectedTier("all")
                  setSelectedDuration("all")
                }}
                className="gap-2"
              >
                <Filter className="h-3 w-3" />
                {t("Réinitialiser", "Reset")}
              </Button>
            </div>
          </div>
        </header>

        {/* Grouped Test Results */}
        <div className="space-y-12">
          {Object.entries(groupedTests).map(([tier, tests]) => {
            if (tests.length === 0) return null

            const tierInfo = {
              free: { labelFr: "Tests Gratuits", labelEn: "Free Tests", color: "#2ECC71" },
              essential: { labelFr: "Tests Essentiels", labelEn: "Essential Tests", color: "#007BFF" },
              premium: { labelFr: "Tests Premium", labelEn: "Premium Tests", color: "#F39C12" },
              pro: { labelFr: "Tests Pro", labelEn: "Pro Tests", color: "#8E44AD" },
            }[tier as keyof typeof groupedTests]

            return (
              <section key={tier}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: tierInfo?.color }} />
                  <div>
                    <h2 className="text-xl font-semibold font-[var(--font-poppins)]">
                      {lang === "fr" ? tierInfo?.labelFr : tierInfo?.labelEn}
                    </h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      {tests.length} {t("tests disponibles", "tests available")}
                    </p>
                  </div>
                </div>

                <TestGrid tests={tests} userTier={userTier} />
              </section>
            )
          })}
        </div>

        {filteredTests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-neutral-400 mb-4">
              <Search className="h-12 w-12 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("Aucun test trouvé", "No tests found")}</h3>
            <p className="text-neutral-600 dark:text-neutral-300 mb-4">
              {t("Essayez de modifier vos critères de recherche", "Try adjusting your search criteria")}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSelectedType("all")
                setSelectedLevel("all")
                setSelectedTier("all")
                setSelectedDuration("all")
              }}
            >
              {t("Réinitialiser les filtres", "Reset filters")}
            </Button>
          </div>
        )}
      </main>
    </PageShell>
  )
}

function TestGrid({ tests, userTier }: { tests: any[]; userTier: SubscriptionTier }) {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const tierHierarchy: Record<SubscriptionTier, SubscriptionTier[]> = {
    free: ["free"],
    essential: ["free", "essential"],
    premium: ["free", "essential", "premium"],
    pro: ["free", "essential", "premium", "pro"],
  }

  const canAccess = (testRequiredTier: SubscriptionTier) => {
    return tierHierarchy[userTier].includes(testRequiredTier)
  }

  const getTierBadgeColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case "free":
        return "bg-[#2ECC71] text-black"
      case "essential":
        return "bg-[#007BFF] text-white"
      case "premium":
        return "bg-[#F39C12] text-black"
      case "pro":
        return "bg-[#8E44AD] text-white"
      default:
        return "bg-neutral-500 text-white"
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tests.map((test) => {
        const hasAccess = canAccess(test.requiredTier)
        const testTypeColor = testTypeColors[test.type as keyof typeof testTypeColors]

        return (
          <div
            key={test.id}
            className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-card overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={test.image || "/placeholder.svg"}
                alt={lang === "fr" ? test.title : test.titleEn}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {!hasAccess && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white text-sm">
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
                <Badge className="text-white border-0" style={{ backgroundColor: testTypeColor }}>
                  {test.type.toUpperCase()} {test.level}
                </Badge>
                <Badge className={getTierBadgeColor(test.requiredTier)}>
                  {test.requiredTier === "free" ? t("Gratuit", "Free") : test.requiredTier}
                </Badge>
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {test.isOfficial && (
                  <Badge variant="outline" className="bg-white/90 text-black border-0">
                    <Award className="h-3 w-3 mr-1" />
                    {t("Officiel", "Official")}
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-4 mb-2 text-xs text-neutral-500">
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

              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{lang === "fr" ? test.title : test.titleEn}</h3>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {lang === "fr" ? test.description : test.descriptionEn}
              </p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">
                    {test.averageScore}% {t("réussite", "success")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: test.difficulty }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#007BFF]" />
                  ))}
                  {Array.from({ length: 5 - test.difficulty }).map((_, i) => (
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

"use client"

import { useState, useMemo, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Clock, Calendar, TrendingUp, Search, Filter, Brain, BarChart3, Award, Download, Eye } from "lucide-react"
import { useLang } from "@/components/language-provider"
import type { SubscriptionTier } from "@/components/test-data"
import { apiClient } from "@/lib/api-client"
import Link from "next/link"

// Interface for test results
interface TestResult {
  id: string;
  testId: string;
  testTitle: string;
  testType: string;
  level: string;
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: string;
  startedAt: string;
  completedAt?: string;
  duration: number;
  correctAnswers: number;
  totalQuestions: number;
}

const testTypeColors = {
  tcf: "#007BFF",
  tef: "#2ECC71",
  delf: "#F39C12",
  dalf: "#8E44AD",
  grammaire: "#8E44AD",
  "expression-ecrite": "#F39C12",
  "expression-orale": "#9B59B6",
  vocabulaire: "#2ECC71",
}

const categoryLabels = {
  tcf: { fr: "TCF", en: "TCF" },
  tef: { fr: "TEF", en: "TEF" },
  delf: { fr: "DELF", en: "DELF" },
  dalf: { fr: "DALF", en: "DALF" },
  grammaire: { fr: "Grammaire", en: "Grammar" },
  "expression-ecrite": { fr: "Expression écrite", en: "Written Expression" },
  "expression-orale": { fr: "Expression orale", en: "Oral Expression" },
  vocabulaire: { fr: "Vocabulaire", en: "Vocabulary" },
}

export default function TestResultsPage() {
  const { lang } = useLang()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedTier, setSelectedTier] = useState<string>("all")
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Fetch test results from backend
  useEffect(() => {
    const fetchTestResults = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/tests/attempts')
        if (response.success && Array.isArray(response.data)) {
          const transformedResults = (response.data as any[]).map((attempt: any) => ({
            id: attempt.id,
            testId: attempt.testId,
            testTitle: attempt.test?.title || 'Unknown Test',
            testTitleEn: attempt.test?.titleEn || attempt.test?.title || 'Unknown Test',
            type: String(attempt.test?.type || 'practice').toLowerCase(),
            level: attempt.test?.level || 'A1',
            category: String(attempt.test?.category || 'general').toLowerCase(),
            score: Number(attempt.score ?? 0),
            maxScore: Number(attempt.maxScore ?? 100),
            percentage: Number(attempt.percentage ?? 0),
            status: attempt.status,
            startedAt: attempt.startedAt,
            completedAt: attempt.completedAt,
            duration: Number(attempt.duration ?? 0),
            correctAnswers: Number(attempt.correctAnswers ?? 0),
            totalQuestions: Number(attempt.test?.questionCount ?? 0),
            sections: Array.isArray(attempt.sections) ? attempt.sections : [],
            hasAIFeedback: Boolean(attempt.hasAIFeedback ?? false),
            feedback: attempt.feedback || '',
            feedbackEn: attempt.feedbackEn || attempt.feedback || '',
            requiredTier: 'free' as const
          }))
          setTestResults(transformedResults)
        }
      } catch (error) {
        console.error('Error fetching test results:', error)
        // Use empty array if backend fails
        setTestResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchTestResults()
  }, [])

  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes([...selectedTypes, type])
    } else {
      setSelectedTypes(selectedTypes.filter(t => t !== type))
    }
  }

  const handleLevelChange = (level: string, checked: boolean) => {
    if (checked) {
      setSelectedLevels([...selectedLevels, level])
    } else {
      setSelectedLevels(selectedLevels.filter(l => l !== level))
    }
  }

  const filteredResults = useMemo(() => {
    return testResults.filter((result) => {
      const matchesSearch =
        searchQuery === "" ||
        result.testTitle.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = selectedTypes.length === 0 ||
        selectedTypes.includes(result.type) ||
        selectedTypes.includes(result.category)

      const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(result.level)
      const matchesTier = selectedTier === "all" || result.category === selectedTier

      return matchesSearch && matchesType && matchesLevel && matchesTier
    })
  }, [searchQuery, selectedTypes, selectedLevels, selectedTier, testResults])

  const groupedResults = useMemo(() => {
    const groups = {
      free: filteredResults.filter((r) => r.requiredTier === "free"),
      essential: filteredResults.filter((r) => r.requiredTier === "essential"),
      premium: filteredResults.filter((r) => r.requiredTier === "premium"),
      pro: filteredResults.filter((r) => r.requiredTier === "pro"),
    }
    return groups
  }, [filteredResults])

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "#2ECC71"
    if (percentage >= 60) return "#F39C12"
    return "#E74C3C"
  }

  const getScoreLabel = (percentage: number) => {
    if (percentage >= 80) return t("Excellent", "Excellent")
    if (percentage >= 60) return t("Bien", "Good")
    return t("À améliorer", "Needs improvement")
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold font-[var(--font-poppins)] mb-2 text-foreground">
                {t("Mes résultats des tests", "My test results")}
          </h1>
          <p className="text-muted-foreground">
            {t("Consultez vos performances et suivez vos progrès", "Review your performance and track your progress")}
          </p>
            </div>
            <div className="flex gap-3">
              <Link href="/tests/corrections">
                <Button variant="outline" className="gap-2">
                  <Eye className="h-4 w-4" />
                  {t("Voir corrections", "View corrections")}
                </Button>
              </Link>
              <Link href="/tests">
                <Button className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t("Nouveaux tests", "New tests")}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Enhanced Statistics Overview */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-card p-6 text-center">
              <div className="text-3xl font-bold text-[#007BFF] mb-2">{testResults.length}</div>
              <div className="text-sm text-muted-foreground">{t("Tests complétés", "Tests completed")}</div>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <div className="text-3xl font-bold text-[#2ECC71] mb-2">
                {testResults.length > 0 ? Math.round(testResults.reduce((acc, r) => acc + r.percentage, 0) / testResults.length) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">{t("Score moyen", "Average score")}</div>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <div className="text-3xl font-bold text-[#F39C12] mb-2">
                {testResults.length > 0 ? Math.max(...testResults.map((r) => r.percentage)) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">{t("Meilleur score", "Best score")}</div>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <div className="text-3xl font-bold text-[#8E44AD] mb-2">
                {testResults.filter((r) => r.status === 'COMPLETED').length}
              </div>
              <div className="text-sm text-muted-foreground">{t("Tests terminés", "Completed tests")}</div>
            </div>
          </div>
        </section>

        {/* Enhanced Search and Filters */}
        <section className="mb-8">
          <div className="bg-card border rounded-xl p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Search */}
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">
                  {t("Rechercher", "Search")}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("Rechercher un résultat...", "Search for a result...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              {/* Type Multi-Select */}
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">
                  {t("Types et catégories", "Types and categories")}
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {Object.entries(categoryLabels).map(([key, labels]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={selectedTypes.includes(key)}
                        onCheckedChange={(checked) => handleTypeChange(key, checked as boolean)}
                      />
                      <label htmlFor={key} className="text-sm cursor-pointer">
                        {lang === "fr" ? labels.fr : labels.en}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level Multi-Select */}
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">
                  {t("Niveaux", "Levels")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={level}
                        checked={selectedLevels.includes(level)}
                        onCheckedChange={(checked) => handleLevelChange(level, checked as boolean)}
                      />
                      <label htmlFor={level} className="text-sm cursor-pointer font-medium">
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Subscription Filter */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">
                    {t("Abonnement", "Subscription")}
                  </label>
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
            </div>
                <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {filteredResults.length} {t("résultats trouvés", "results found")}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                      setSelectedTypes([])
                      setSelectedLevels([])
                  setSelectedTier("all")
                }}
                className="gap-2"
              >
                <Filter className="h-3 w-3" />
                {t("Réinitialiser", "Reset")}
              </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Grouped Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">{t("Chargement des résultats...", "Loading results...")}</p>
          </div>
        ) : testResults.length > 0 ? (
          <div className="space-y-12">
            {Object.entries(groupedResults).map(([tier, results]) => {
              if (results.length === 0) return null

              const tierInfo = {
                free: { labelFr: "Résultats Gratuits", labelEn: "Free Results", color: "#2ECC71" },
                essential: { labelFr: "Résultats Essentiels", labelEn: "Essential Results", color: "#007BFF" },
                premium: { labelFr: "Résultats Premium", labelEn: "Premium Results", color: "#F39C12" },
                pro: { labelFr: "Résultats Pro", labelEn: "Pro Results", color: "#8E44AD" },
              }[tier as keyof typeof groupedResults]

              return (
                <section key={tier}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 rounded-full" style={{ backgroundColor: tierInfo?.color }} />
                    <div>
                      <h2 className="text-xl font-semibold font-[var(--font-poppins)] text-foreground">
                        {lang === "fr" ? tierInfo?.labelFr : tierInfo?.labelEn}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {results.length} {t("résultats", "results")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {results.map((result) => {
                      const testTypeColor = testTypeColors[result.type as keyof typeof testTypeColors] || 
                                           testTypeColors[result.category as keyof typeof testTypeColors]
                      const scoreColor = getScoreColor(result.percentage)

                      return (
                        <div
                          key={result.id}
                          className="rounded-xl border bg-card p-6 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Badge className="text-white border-0 font-medium" style={{ backgroundColor: testTypeColor }}>
                                {result.type.toUpperCase()} {result.level}
                              </Badge>
                              {result.hasAIFeedback && (
                                <Badge variant="outline" className="gap-1">
                                  <Brain className="h-3 w-3" />
                                  IA
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold" style={{ color: scoreColor }}>
                                {result.percentage}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {result.score}/{result.maxScore}
                              </div>
                            </div>
                          </div>

                          <h3 className="font-semibold text-lg mb-2 text-foreground">
                            {lang === "fr" ? result.testTitle : result.testTitleEn}
                          </h3>

                          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {result.duration} min
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(result.completedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}
                            </div>
                            <Badge variant="outline" style={{ color: scoreColor }}>
                              {getScoreLabel(result.percentage)}
                            </Badge>
                          </div>

                          <div className="space-y-2 mb-4">
                            {result.sections.map((section, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm text-foreground">{lang === "fr" ? section.name : section.nameEn}</span>
                                <div className="flex items-center gap-2">
                                  <Progress value={(section.score / section.maxScore) * 100} className="w-20 h-2" />
                                  <span className="text-sm font-medium w-12 text-right text-foreground">
                                    {section.score}/{section.maxScore}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {result.hasAIFeedback && (
                            <div className="bg-muted/50 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="h-4 w-4 text-[#2ECC71]" />
                                <span className="text-sm font-medium text-[#2ECC71]">
                                  {t("Feedback IA", "AI Feedback")}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {lang === "fr" ? result.feedback : result.feedbackEn}
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-2">
                            <Button variant="outline" size="sm" className="gap-1">
                              <Eye className="h-3 w-3" />
                              {t("Détails", "Details")}
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1">
                              <Download className="h-3 w-3" />
                              {t("PDF", "PDF")}
                            </Button>
                            <Button size="sm" className="gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {t("Refaire", "Retake")}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {t("Aucun résultat disponible", "No results available")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("Commencez par passer des tests pour voir vos résultats ici", "Start by taking tests to see your results here")}
            </p>
            <Link href="/tests">
              <Button className="gap-2">
                <BarChart3 className="h-4 w-4" />
                {t("Passer un test", "Take a test")}
              </Button>
            </Link>
          </div>
        )}

      </main>
    </PageShell>
  )
}
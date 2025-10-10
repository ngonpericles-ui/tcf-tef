"use client"

import { useState, useMemo, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Users, Star, Lock, Download, Award, BookOpen, Brain, Search, Filter, FileText, CheckCircle2, Eye } from "lucide-react"
import { useLang } from "@/components/language-provider"
import { type SubscriptionTier } from "@/components/test-data"
import { apiClient } from "@/lib/api-client"
import Image from "next/image"
import Link from "next/link"

const testTypeColors = {
  tcf: "#007BFF",
  tef: "#2ECC71", 
  delf: "#F39C12",
  dalf: "#8E44AD",
}

export default function TestCorrectionsPage() {
  const { lang } = useLang()
  const [userTier] = useState<SubscriptionTier>("free")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [selectedTier, setSelectedTier] = useState<string>("all")
  const [selectedDuration, setSelectedDuration] = useState<string>("all")
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Fetch test corrections from backend
  useEffect(() => {
    const fetchCorrections = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/content-management/tests?type=corrections')
        if (response.success && response.data) {
          const content = (response.data as any).content
          setTests(Array.isArray(content) ? content : [])
        }
      } catch (error) {
        console.error('Error fetching test corrections:', error)
        setTests([])
      } finally {
        setLoading(false)
      }
    }

    fetchCorrections()
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

  // Filter tests that have corrections available
  const testsWithCorrections = useMemo(() => {
    return tests.filter((test) => {
      // Only include tests that the user has access to and have completed
      return canAccess(test.requiredTier) && (test.completionCount > 0 || test.type === 'CORRECTION')
    })
  }, [tests, userTier])

  const filteredTests = useMemo(() => {
    return testsWithCorrections.filter((test) => {
      const matchesSearch =
        searchQuery === "" ||
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesType = selectedType === "all" || test.type === selectedType || test.category === selectedType
      const matchesLevel = selectedLevel === "all" || test.level === selectedLevel
      const matchesTier = selectedTier === "all" || test.requiredTier === selectedTier
      const matchesDuration =
        selectedDuration === "all" ||
        (selectedDuration === "quick" && test.duration <= 15) ||
        (selectedDuration === "medium" && test.duration > 15 && test.duration <= 60) ||
        (selectedDuration === "long" && test.duration > 60)

      return matchesSearch && matchesType && matchesLevel && matchesTier && matchesDuration
    })
  }, [testsWithCorrections, searchQuery, selectedType, selectedLevel, selectedTier, selectedDuration])

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
              <h1 className="text-2xl md:text-3xl font-semibold font-[var(--font-poppins)] mb-2 text-foreground">
                {t("Corrections des tests", "Test corrections")}
              </h1>
              <p className="text-muted-foreground">
                {t(
                  "Accédez aux corrections détaillées de vos tests complétés selon votre abonnement",
                  "Access detailed corrections for your completed tests based on your subscription",
                )}
              </p>
            </div>
            <Link href="/tests/all">
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                {t("Retour aux tests", "Back to tests")}
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("Rechercher une correction...", "Search for a correction...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Type & Catégorie", "Type & Category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Tous les types", "All types")}</SelectItem>
                  <SelectItem value="tcf">TCF</SelectItem>
                  <SelectItem value="tef">TEF</SelectItem>
                  <SelectItem value="delf">DELF</SelectItem>
                  <SelectItem value="dalf">DALF</SelectItem>
                  <SelectItem value="grammar">{t("Grammaire", "Grammar")}</SelectItem>
                  <SelectItem value="vocabulary">{t("Vocabulaire", "Vocabulary")}</SelectItem>
                  <SelectItem value="writing">{t("Expression écrite", "Written Expression")}</SelectItem>
                  <SelectItem value="oral">{t("Expression orale", "Oral Expression")}</SelectItem>
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
                {filteredTests.length} {t("corrections disponibles", "corrections available")}
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

        {/* Grouped Test Corrections */}
        <div className="space-y-12">
          {Object.entries(groupedTests).map(([tier, tests]) => {
            if (tests.length === 0) return null

            const tierInfo = {
              free: { labelFr: "Corrections Gratuites", labelEn: "Free Corrections", color: "#2ECC71" },
              essential: { labelFr: "Corrections Essentielles", labelEn: "Essential Corrections", color: "#007BFF" },
              premium: { labelFr: "Corrections Premium", labelEn: "Premium Corrections", color: "#F39C12" },
              pro: { labelFr: "Corrections Pro", labelEn: "Pro Corrections", color: "#8E44AD" },
            }[tier as keyof typeof groupedTests]

            return (
              <section key={tier}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: tierInfo?.color }} />
                  <div>
                    <h2 className="text-xl font-semibold font-[var(--font-poppins)] text-foreground">
                      {lang === "fr" ? tierInfo?.labelFr : tierInfo?.labelEn}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {tests.length} {t("corrections disponibles", "corrections available")}
                    </p>
                  </div>
                </div>

                <CorrectionsGrid tests={tests} userTier={userTier} />
              </section>
            )
          })}
        </div>

        {filteredTests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <FileText className="h-12 w-12 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">{t("Aucune correction trouvée", "No corrections found")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("Complétez d'abord des tests pour accéder aux corrections", "Complete tests first to access corrections")}
            </p>
            <Link href="/tests">
              <Button>
                {t("Voir les tests disponibles", "View available tests")}
              </Button>
            </Link>
          </div>
        )}
      </main>
    </PageShell>
  )
}

function CorrectionsGrid({ tests, userTier }: { tests: any[]; userTier: SubscriptionTier }) {
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
                <Badge className={getTierBadgeColor(test.requiredTier)}>
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
                <Badge className="bg-[#2ECC71] text-black font-medium">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t("Complété", "Completed")}
                </Badge>
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
                {lang === "fr" ? test.title : test.titleEn}
              </h3>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {lang === "fr" ? test.description : test.descriptionEn}
              </p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-foreground">
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

              <div className="grid grid-cols-2 gap-2">
                <Button className="gap-2" disabled={!hasAccess} variant={hasAccess ? "default" : "outline"}>
                  {hasAccess ? (
                    <>
                      <Eye className="h-4 w-4" />
                      {t("Voir", "View")}
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      {t("Verrouillé", "Locked")}
                    </>
                  )}
                </Button>
                <Button variant="outline" className="gap-2" disabled={!hasAccess}>
                  {hasAccess ? (
                    <>
                      <Download className="h-4 w-4" />
                      {t("PDF", "PDF")}
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      {t("PDF", "PDF")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

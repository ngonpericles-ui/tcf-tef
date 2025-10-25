"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import PageShell from "@/components/page-shell"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Trophy,
  Star,
  Target,
  Flame,
  Calendar,
  BookOpen,
  CheckCircle,
  Lock,
  BarChart3,
  Award,
  Brain,
  Clock,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Lightbulb,
  ChevronRight,
} from "lucide-react"
import { useLang } from "@/components/language-provider"

// Default empty data structure
const defaultStats = {
  totalPoints: 0,
  successfulTests: 0,
  totalTests: 0,
  completionPercentage: 0,
  weeklyPoints: 0,
  currentCEFRLevel: "A1",
  cefrSubLevel: 1,
  skillLevels: {
    grammar: { level: "A1", sublevel: 1 },
    vocabulary: { level: "A1", sublevel: 1 },
    listening: { level: "A1", sublevel: 1 },
    reading: { level: "A1", sublevel: 1 }
  }
}

const defaultPerformanceMetrics = {
  averageScore: 0,
  improvementTrend: 0,
  timeSpent: 0,
  platformAverage: 0,
  testsCompleted: 0,
  successRate: 0,
}

const defaultLearningAnalytics = {
  totalTimeSpent: 0,
  currentStreak: 0,
  longestStreak: 0,
  weeklyAverage: 0,
  subjectDistribution: []
}

// CEFR Level System
const cefrLevels = [
  { code: "A1", name: { fr: "Débutant", en: "Beginner" }, pointsRequired: 0, color: "#2ECC71" },
  { code: "A2", name: { fr: "Élémentaire", en: "Elementary" }, pointsRequired: 100, color: "#3498DB" },
  { code: "B1", name: { fr: "Intermédiaire", en: "Intermediate" }, pointsRequired: 250, color: "#F39C12" },
  { code: "B2", name: { fr: "Intermédiaire Avancé", en: "Upper Intermediate" }, pointsRequired: 450, color: "#E67E22" },
  { code: "C1", name: { fr: "Avancé", en: "Advanced" }, pointsRequired: 700, color: "#9B59B6" },
  { code: "C2", name: { fr: "Maîtrise", en: "Mastery" }, pointsRequired: 1000, color: "#E74C3C" },
]

const getCurrentCEFRLevel = (points: number) => {
  for (let i = cefrLevels.length - 1; i >= 0; i--) {
    if (points >= cefrLevels[i].pointsRequired) {
      return {
        current: cefrLevels[i],
        next: cefrLevels[i + 1] || null,
        subLevel: Math.min(3, Math.floor((points - cefrLevels[i].pointsRequired) /
          ((cefrLevels[i + 1]?.pointsRequired || points + 100) - cefrLevels[i].pointsRequired) * 3) + 1)
      }
    }
  }
  return { current: cefrLevels[0], next: cefrLevels[1], subLevel: 1 }
}



// Remove mock data - using real data from backend



export default function AchievementsPage() {
  const { lang } = useLang()
  const [activeTab, setActiveTab] = useState<string>("progres")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(defaultStats)
  const [performanceMetrics, setPerformanceMetrics] = useState(defaultPerformanceMetrics)
  const [learningAnalytics, setLearningAnalytics] = useState(defaultLearningAnalytics)
  const [progressData, setProgressData] = useState<any[]>([])
  const [strengths, setStrengths] = useState<any[]>([])
  const [weaknesses, setWeaknesses] = useState<any[]>([])
  const [successfulTests, setSuccessfulTests] = useState<any[]>([])
  const [pointsHistory, setPointsHistory] = useState<any[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([])


  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  useEffect(() => {
    fetchAchievementsData()
  }, [])

  const fetchAchievementsData = async () => {
    try {
      setLoading(true)

      // Fetch dashboard stats and level assessment data in parallel
      const [dashboardResponse, levelHistoryResponse] = await Promise.all([
        apiClient.get('/users/dashboard'),
        apiClient.get('/simulations/level-history')
      ])

      // Process dashboard data
      if ((dashboardResponse.data as any)?.success) {
        const data = (dashboardResponse.data as any)?.data

        // Update stats with real data or keep defaults
        setStats(data.stats || defaultStats)
        setPerformanceMetrics(data.performanceMetrics || defaultPerformanceMetrics)
        setLearningAnalytics(data.learningAnalytics || defaultLearningAnalytics)
        setProgressData(data.progressData || [])
        setStrengths(data.strengths || [])
        setWeaknesses(data.weaknesses || [])
        setSuccessfulTests(data.successfulTests || [])
        setPointsHistory(data.pointsHistory || [])
      }

      // Process level assessment data for AI recommendations
      if ((levelHistoryResponse.data as any)?.success) {
        const levelData = (levelHistoryResponse.data as any)?.data

        // Extract AI recommendations from recent level assessments
        const recentAssessments = levelData.history?.slice(0, 3) || []
        const aiRecommendations = recentAssessments.flatMap((assessment: any) => {
          if (!assessment.recommendations || !assessment.strengths || !assessment.weaknesses) return []

          return assessment.recommendations.map((rec: string, index: number) => ({
            id: `${assessment.id}-${index}`,
            title: rec,
            description: `Basé sur votre évaluation du ${new Date(assessment.createdAt).toLocaleDateString()}`,
            currentLevel: assessment.determinedLevel,
            cefrTarget: getNextLevel(assessment.determinedLevel),
            confidence: Math.round(assessment.confidence * 100),
            priority: assessment.confidence >= 0.9 ? "high" : "medium",
            type: "level_assessment_recommendation",
            action: "Commencer la pratique",
            strengths: assessment.strengths,
            weaknesses: assessment.weaknesses
          }))
        })

        setAiRecommendations(aiRecommendations)

        // Update current level in stats
        if (levelData.currentLevel) {
          setStats(prevStats => ({
            ...prevStats,
            currentCEFRLevel: levelData.currentLevel,
            cefrSubLevel: recentAssessments[0]?.subLevel || 2
          }))
        }
      }

    } catch (error) {
      console.error('Error fetching achievements data:', error)
      toast.error(t("Erreur lors du chargement", "Error loading achievements"))
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get next CEFR level
  const getNextLevel = (currentLevel: string): string => {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const currentIndex = levels.indexOf(currentLevel)
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : 'C2+'
  }



  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t("Chargement...", "Loading...")}</p>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-[#F39C12]" />
            <h1 className="text-2xl md:text-3xl font-semibold font-[var(--font-poppins)] text-foreground">
              {t("Réussites", "Achievements")}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t(
              "Suivez vos progrès et débloquez des récompenses en apprenant le français",
              "Track your progress and unlock rewards while learning French",
            )}
          </p>
        </header>

        {/* CEFR-Based Stats Overview */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-[#F39C12]/5 to-[#F39C12]/10 rounded-xl p-6 border border-[#F39C12]/20">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-6 w-6 text-[#F39C12]" />
                <span className="text-sm font-medium text-[#F39C12]">{t("Points totaux", "Total Points")}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.totalPoints}</div>
              <div className="text-xs text-muted-foreground">
                {(() => {
                  const levelInfo = getCurrentCEFRLevel(stats.totalPoints)
                  const nextLevelPoints = levelInfo.next?.pointsRequired || stats.totalPoints + 100
                  return `${nextLevelPoints - stats.totalPoints} ${t("pour", "to")} ${levelInfo.next?.code || "C2+"}`
                })()}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#2ECC71]/5 to-[#2ECC71]/10 rounded-xl p-6 border border-[#2ECC71]/20">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-6 w-6 text-[#2ECC71]" />
                <span className="text-sm font-medium text-[#2ECC71]">{t("Réussites", "Success")}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {stats.successfulTests}/{stats.totalTests}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.completionPercentage.toFixed(1)}% {t("complété", "completed")}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#F39C12]/5 to-[#F39C12]/10 rounded-xl p-6 border border-[#F39C12]/20">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-6 w-6 text-[#F39C12]" />
                <span className="text-sm font-medium text-[#F39C12]">{t("Niveau CECRL", "CEFR Level")}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {stats.currentCEFRLevel}.{stats.cefrSubLevel}
              </div>
              <div className="text-xs text-muted-foreground">
                {(() => {
                  const levelInfo = getCurrentCEFRLevel(stats.totalPoints)
                  return lang === "fr" ? levelInfo.current.name.fr : levelInfo.current.name.en
                })()}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#8E44AD]/5 to-[#8E44AD]/10 rounded-xl p-6 border border-[#8E44AD]/20">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-6 w-6 text-[#8E44AD]" />
                <span className="text-sm font-medium text-[#8E44AD]">{t("Cette semaine", "This week")}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.weeklyPoints}</div>
              <div className="text-xs text-muted-foreground">{t("points gagnés", "points earned")}</div>
            </div>
          </div>
        </section>

        {/* CEFR Progress to Next Level */}
        <section className="mb-8">
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">
                  {(() => {
                    const levelInfo = getCurrentCEFRLevel(stats.totalPoints)
                    const nextLevel = levelInfo.next?.code || "C2+"
                    return `${t("Progression vers", "Progress to")} ${nextLevel}`
                  })()}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const levelInfo = getCurrentCEFRLevel(stats.totalPoints)
                    const nextLevelPoints = levelInfo.next?.pointsRequired || stats.totalPoints + 100
                    return `${stats.totalPoints}/${nextLevelPoints} points`
                  })()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className="text-white"
                  style={{ backgroundColor: getCurrentCEFRLevel(stats.totalPoints).current.color }}
                >
                  {stats.currentCEFRLevel}.{stats.cefrSubLevel}
                </Badge>
                <Button variant="outline" size="sm" asChild>
                  <a href="/test-niveau">
                    <Target className="h-4 w-4 mr-2" />
                    {t("Test de niveau", "Level Test")}
                  </a>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Progress
                value={(() => {
                  const levelInfo = getCurrentCEFRLevel(stats.totalPoints)
                  const currentLevelPoints = levelInfo.current.pointsRequired
                  const nextLevelPoints = levelInfo.next?.pointsRequired || stats.totalPoints + 100
                  return ((stats.totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100
                })()}
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stats.currentCEFRLevel}.{stats.cefrSubLevel}</span>
                <span>{getCurrentCEFRLevel(stats.totalPoints).next?.code || "C2+"}</span>
              </div>
            </div>

            {/* Integration Notice */}
            <div className="mt-4 p-3 bg-[#007BFF]/5 border border-[#007BFF]/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Lightbulb className="h-4 w-4 text-[#007BFF]" />
                <span className="text-[#007BFF] font-medium">
                  {t("Nouveau !", "New!")}
                </span>
                <span className="text-muted-foreground">
                  {t("Vos résultats de test de niveau sont maintenant intégrés à vos réussites",
                      "Your level test results are now integrated with your achievements")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* New Tab System */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="progres">{t("Progrès", "Progress")}</TabsTrigger>
            <TabsTrigger value="reussite">{t("Réussite", "Success")}</TabsTrigger>
            <TabsTrigger value="points">{t("Points Accumulés", "Accumulated Points")}</TabsTrigger>
            <TabsTrigger value="performance">{t("Performance", "Performance")}</TabsTrigger>
            <TabsTrigger value="niveau">{t("Niveau", "Level")}</TabsTrigger>
            <TabsTrigger value="apprentissage">{t("Apprentissage", "Learning")}</TabsTrigger>
          </TabsList>

          {/* Progrès Tab */}
          <TabsContent value="progres" className="mt-6">
            <div className="space-y-6">
              {/* Progress Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#2ECC71]" />
                    {t("Évolution CECRL", "CEFR Evolution")}
                  </CardTitle>
                  <CardDescription>
                    {t("Votre progression à travers les niveaux CECRL", "Your progression through CEFR levels")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Simple progress visualization */}
                  <div className="space-y-4">
                    {progressData.length === 0 ? (
                      <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2 text-foreground">
                          {t("Aucune donnée de progression", "No progress data")}
                        </h3>
                        <p className="text-muted-foreground">
                          {t("Vos données de progression apparaîtront ici", "Your progress data will appear here")}
                        </p>
                      </div>
                    ) : (
                      progressData.map((data: any) => (
                        <div key={data.month} className="flex items-center gap-4">
                          <div className="w-12 text-sm text-muted-foreground">{data.month}</div>
                          <div className="flex-1">
                            <Progress value={data.score} className="h-3" />
                          </div>
                          <div className="w-12 text-sm font-medium">{data.score}%</div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#2ECC71]">
                      <ArrowUp className="h-5 w-5" />
                      {t("Points forts", "Strengths")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {strengths.length === 0 ? (
                      <div className="text-center py-6">
                        <ArrowUp className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                        <h3 className="text-sm font-medium text-foreground mb-1">
                          {t("Aucun point fort identifié", "No strengths identified")}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {t("Passez des tests pour identifier vos forces", "Take tests to identify your strengths")}
                        </p>
                      </div>
                    ) : (
                      strengths.map((strength: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[#2ECC71]/5 rounded-lg border border-[#2ECC71]/20">
                          <div>
                            <div className="font-medium text-foreground">{strength.area}</div>
                            <div className="text-sm text-muted-foreground">{strength.score}% {t("de réussite", "success rate")}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {strength.trend === "up" && <ArrowUp className="h-4 w-4 text-[#2ECC71]" />}
                            <Badge className="bg-[#2ECC71] text-white">{strength.score}%</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Weaknesses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#E74C3C]">
                      <ArrowDown className="h-5 w-5" />
                      {t("Points faibles", "Weaknesses")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {weaknesses.length === 0 ? (
                      <div className="text-center py-6">
                        <ArrowDown className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                        <h3 className="text-sm font-medium text-foreground mb-1">
                          {t("Aucun point faible identifié", "No weaknesses identified")}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {t("Passez des tests pour identifier vos axes d'amélioration", "Take tests to identify areas for improvement")}
                        </p>
                      </div>
                    ) : (
                      weaknesses.map((weakness: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[#E74C3C]/5 rounded-lg border border-[#E74C3C]/20">
                          <div>
                            <div className="font-medium text-foreground">{weakness.area}</div>
                            <div className="text-sm text-muted-foreground">{weakness.score}% {t("de réussite", "success rate")}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {weakness.trend === "down" && <ArrowDown className="h-4 w-4 text-[#E74C3C]" />}
                            {weakness.trend === "up" && <ArrowUp className="h-4 w-4 text-[#2ECC71]" />}
                            <Badge variant="outline" className="border-[#E74C3C] text-[#E74C3C]">{weakness.score}%</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Réussite Tab */}
          <TabsContent value="reussite" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-[#F39C12]" />
                    {t("Tests réussis (80%+)", "Successful Tests (80%+)")}
                  </CardTitle>
                  <CardDescription>
                    {t("Tous vos tests avec un score de 80% ou plus", "All your tests with 80% or higher score")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {successfulTests.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2 text-foreground">
                        {t("Aucun test réussi", "No successful tests")}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {t("Passez des tests pour voir vos réussites ici", "Take tests to see your successes here")}
                      </p>
                      <Button asChild>
                        <a href="/tests">
                          <Target className="h-4 w-4 mr-2" />
                          {t("Commencer un test", "Start a test")}
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {successfulTests.map((test: any) => (
                        <div key={test.id} className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-foreground">{test.name}</h4>
                                <Badge
                                  className="text-white text-xs"
                                  style={{ backgroundColor: cefrLevels.find(l => l.code === test.cefrLevel)?.color }}
                                >
                                  {test.cefrLevel}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {test.skillArea} • {new Date(test.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}
                              </p>
                            </div>
                            <Badge className="bg-[#2ECC71] text-white">
                              {test.score}%
                            </Badge>
                          </div>
                          <div className="mb-3">
                            <Progress value={test.score} className="h-2" />
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              {t("Refaire", "Retake")}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Award className="h-4 w-4 mr-2" />
                              {t("Certificat", "Certificate")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Points Accumulés Tab */}
          <TabsContent value="points" className="mt-6">
            <div className="space-y-6">
              {/* Total Points Display */}
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-4xl font-bold text-[#F39C12] mb-2">
                    {stats.totalPoints}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {t("Points totaux accumulés", "Total Points Accumulated")}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Points History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#007BFF]" />
                    {t("Historique des points", "Points History")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pointsHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2 text-foreground">
                        {t("Aucun historique de points", "No points history")}
                      </h3>
                      <p className="text-muted-foreground">
                        {t("Votre historique de points apparaîtra ici", "Your points history will appear here")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pointsHistory.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium text-foreground">{entry.activity}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-[#F39C12]" />
                            <span className="font-bold text-[#F39C12]">+{entry.points}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t("Score moyen", "Average Score")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{performanceMetrics.averageScore}%</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t("Amélioration", "Improvement")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-[#2ECC71]">+{performanceMetrics.improvementTrend}%</div>
                      <ArrowUp className="h-4 w-4 text-[#2ECC71]" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t("Tests complétés", "Tests Completed")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{performanceMetrics.testsCompleted}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t("Taux de réussite", "Success Rate")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#2ECC71]">{performanceMetrics.successRate}%</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t("Comparaison avec la moyenne", "Platform Comparison")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>{t("Votre score", "Your Score")}</span>
                        <span className="font-medium">{performanceMetrics.averageScore}%</span>
                      </div>
                      <Progress value={performanceMetrics.averageScore} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>{t("Moyenne plateforme", "Platform Average")}</span>
                        <span className="font-medium">{performanceMetrics.platformAverage}%</span>
                      </div>
                      <Progress value={performanceMetrics.platformAverage} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CEFR Niveau Tab */}
          <TabsContent value="niveau" className="mt-6">
            <div className="space-y-6">
              {/* Current CEFR Level Display */}
              <Card className="text-center">
                <CardHeader>
                  <div
                    className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4"
                    style={{
                      background: `linear-gradient(135deg, ${getCurrentCEFRLevel(stats.totalPoints).current.color}, ${getCurrentCEFRLevel(stats.totalPoints).current.color}dd)`
                    }}
                  >
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-foreground">
                    {stats.currentCEFRLevel}.{stats.cefrSubLevel}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {(() => {
                      const levelInfo = getCurrentCEFRLevel(stats.totalPoints)
                      return lang === "fr" ? levelInfo.current.name.fr : levelInfo.current.name.en
                    })()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>{t("Progression vers", "Progress to")} {getCurrentCEFRLevel(stats.totalPoints).next?.code || "C2+"}</span>
                        <span>
                          {stats.totalPoints}/{getCurrentCEFRLevel(stats.totalPoints).next?.pointsRequired || stats.totalPoints + 100}
                        </span>
                      </div>
                      <Progress
                        value={(() => {
                          const levelInfo = getCurrentCEFRLevel(stats.totalPoints)
                          const currentLevelPoints = levelInfo.current.pointsRequired
                          const nextLevelPoints = levelInfo.next?.pointsRequired || stats.totalPoints + 100
                          return ((stats.totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100
                        })()}
                        className="h-3"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <Button variant="outline" asChild>
                        <a href="/test-niveau">
                          <Target className="h-4 w-4 mr-2" />
                          {t("Passer un test de niveau", "Take Level Test")}
                        </a>
                      </Button>
                      <Button variant="outline">
                        <Award className="h-4 w-4 mr-2" />
                        {t("Voir certificat", "View Certificate")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CEFR Level Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {cefrLevels.map((level) => {
                  const isCurrentLevel = level.code === stats.currentCEFRLevel
                  const isCompleted = stats.totalPoints >= level.pointsRequired
                  const isNext = level.code === getCurrentCEFRLevel(stats.totalPoints).next?.code

                  return (
                    <Card
                      key={level.code}
                      className={`text-center p-4 transition-all duration-200 ${
                        isCurrentLevel ? 'ring-2 ring-offset-2 scale-105' : ''
                      } ${!isCompleted && !isCurrentLevel ? 'opacity-60' : ''}`}
                      style={{
                        '--tw-ring-color': isCurrentLevel ? level.color : 'transparent',
                        borderColor: isCurrentLevel ? level.color : undefined
                      } as React.CSSProperties}
                    >
                      <div
                        className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
                        style={{ backgroundColor: `${level.color}20` }}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6" style={{ color: level.color }} />
                        ) : isCurrentLevel ? (
                          <Target className="h-6 w-6" style={{ color: level.color }} />
                        ) : (
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-foreground">{level.code}</h3>
                      <p className="text-xs text-muted-foreground">
                        {lang === "fr" ? level.name.fr : level.name.en}
                      </p>
                      {isCurrentLevel && (
                        <Badge className="mt-2 text-white" style={{ backgroundColor: level.color }}>
                          {t("Actuel", "Current")}
                        </Badge>
                      )}
                      {isNext && !isCurrentLevel && (
                        <Badge variant="outline" className="mt-2" style={{ borderColor: level.color, color: level.color }}>
                          {t("Suivant", "Next")}
                        </Badge>
                      )}
                    </Card>
                  )
                })}
              </div>

              {/* Skill-specific CEFR Levels */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#007BFF]" />
                    {t("Niveaux par compétence", "Skill-specific Levels")}
                  </CardTitle>
                  <CardDescription>
                    {t("Votre niveau CECRL dans chaque compétence linguistique", "Your CEFR level in each language skill")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(stats.skillLevels).map(([skill, data]) => {
                      const skillNames = {
                        grammar: { fr: "Grammaire", en: "Grammar" },
                        vocabulary: { fr: "Vocabulaire", en: "Vocabulary" },
                        listening: { fr: "Compréhension orale", en: "Listening" },
                        reading: { fr: "Compréhension écrite", en: "Reading" },
                        speaking: { fr: "Expression orale", en: "Speaking" },
                        writing: { fr: "Expression écrite", en: "Writing" },
                      }

                      return (
                        <div key={skill} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">
                              {(skillNames as any)[skill][lang]}
                            </span>
                            <Badge variant="outline">
                              {data.level}.{(data as any).subLevel || data.sublevel}
                            </Badge>
                          </div>
                          <Progress value={(data as any).progress || 0} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">
                            {(data as any).progress || 0}% {t("vers", "to")} {data.level}.{Math.min(3, ((data as any).subLevel || data.sublevel) + 1)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* Apprentissage Tab */}
          <TabsContent value="apprentissage" className="mt-6">
            <div className="space-y-6">
              {/* Learning Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t("Temps total", "Total Time")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{learningAnalytics.totalTimeSpent}h</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t("Série actuelle", "Current Streak")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-[#E74C3C]">{learningAnalytics.currentStreak}</div>
                      <Flame className="h-5 w-5 text-[#E74C3C]" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t("Record de série", "Longest Streak")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{learningAnalytics.longestStreak} {t("jours", "days")}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t("Moyenne hebdo", "Weekly Average")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{learningAnalytics.weeklyAverage}h</div>
                  </CardContent>
                </Card>
              </div>

              {/* Subject Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[#007BFF]" />
                    {t("Répartition par matière", "Subject Distribution")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {learningAnalytics.subjectDistribution.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2 text-foreground">
                        {t("Aucune donnée de répartition", "No distribution data")}
                      </h3>
                      <p className="text-muted-foreground">
                        {t("Vos données de répartition par matière apparaîtront ici", "Your subject distribution data will appear here")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {learningAnalytics.subjectDistribution.map((subject: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{subject.subject}</span>
                            <span className="text-muted-foreground">{subject.hours}h ({subject.percentage}%)</span>
                          </div>
                          <Progress value={subject.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CEFR-Aware AI Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-[#8E44AD]" />
                    {t("Recommandations IA CECRL", "CEFR AI Recommendations")}
                  </CardTitle>
                  <CardDescription>
                    {t("Suggestions personnalisées basées sur votre niveau CECRL actuel", "Personalized suggestions based on your current CEFR level")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aiRecommendations.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2 text-foreground">
                        {t("Aucune recommandation disponible", "No recommendations available")}
                      </h3>
                      <p className="text-muted-foreground">
                        {t("Passez des tests pour recevoir des recommandations personnalisées", "Take tests to receive personalized recommendations")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiRecommendations.map((recommendation: any) => (
                        <div key={recommendation.id} className={`p-4 rounded-lg border ${
                          recommendation.priority === "high"
                            ? "border-[#E74C3C]/30 bg-[#E74C3C]/5"
                            : "border-[#F39C12]/30 bg-[#F39C12]/5"
                        }`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Lightbulb className="h-4 w-4 text-[#F39C12]" />
                                <h4 className="font-semibold text-foreground">{recommendation.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {recommendation.confidence}% {t("confiance", "confidence")}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {t("Actuel", "Current")}: {recommendation.currentLevel}
                                </Badge>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <Badge
                                  className="text-xs text-white"
                                  style={{ backgroundColor: cefrLevels.find(l => l.code === recommendation.cefrTarget)?.color }}
                                >
                                  {t("Objectif", "Target")}: {recommendation.cefrTarget}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {recommendation.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              {recommendation.action}
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                            {recommendation.type === "test_recommendation" && (
                              <Button variant="outline" size="sm" asChild>
                                <a href="/test-niveau">
                                  <Target className="h-4 w-4 mr-2" />
                                  {t("Test", "Test")}
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>


      </main>
    </PageShell>
  )
}

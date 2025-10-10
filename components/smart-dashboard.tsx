"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  Brain, 
  Target, 
  Award, 
  Calendar,
  BookOpen,
  Clock,
  Zap,
  Star,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  PlayCircle
} from "lucide-react"
import { useLang } from "./language-provider"
import { useSession } from "./use-session"
import { apiClient } from "@/lib/api-client"
import Link from "next/link"

// Analytics data - will be populated from API
const analytics = {
  weeklyProgress: 0,
  improvementRate: 0,
  studyStreak: 0,
  completedTests: 0,
  averageScore: 0,
  timeStudied: "0h 0m",
  weakAreas: [],
  strongAreas: [],
  nextRecommendations: []
}

export default function SmartDashboard() {
  const { t, lang } = useLang()
  const { user, isAuthenticated } = useSession()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'recommendations'>('overview')
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Function declarations (moved before useEffect to avoid hoisting issues)
  const fetchDashboardData = async () => {
    try {
      const [dashboardResponse, achievementsResponse] = await Promise.all([
        apiClient.get('/home/dashboard'),
        apiClient.get('/achievements/recent')
      ])
      
      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data)
      }
      
      // Store achievements data for display
      if (achievementsResponse.success) {
        const realAchievements = achievementsResponse.data
        if (Array.isArray(realAchievements) && realAchievements.length > 0) {
          setAchievements(realAchievements.map((achievement: any) => ({
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon || "🏆",
            earnedAt: achievement.earnedAt,
            points: achievement.points
          })))
        } else {
          // Fallback to empty array if no achievements
          setAchievements([])
        }
        console.log('Achievements loaded:', realAchievements)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData()
    }
  }, [isAuthenticated, user])

  if (!mounted) {
    return null
  }

  const tabs = [
    { 
      id: 'overview' as const, 
      label: lang === "fr" ? "Vue d'ensemble" : "Overview", 
      icon: <BarChart3 className="h-4 w-4" /> 
    },
    { 
      id: 'analytics' as const, 
      label: lang === "fr" ? "Analytiques" : "Analytics", 
      icon: <TrendingUp className="h-4 w-4" /> 
    },
    { 
      id: 'recommendations' as const, 
      label: lang === "fr" ? "Recommandations IA" : "AI Recommendations", 
      icon: <Brain className="h-4 w-4" /> 
    }
  ]

  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold font-[var(--font-poppins)] mb-2">
          {lang === "fr" ? "Tableau de bord intelligent" : "Smart Dashboard"}
        </h2>
        <p className="text-muted-foreground">
          {lang === "fr" 
            ? "Suivez vos progrès et découvrez des recommandations personnalisées"
            : "Track your progress and discover personalized recommendations"
          }
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-muted rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Weekly Progress */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-[#2ECC71]/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-[#2ECC71]" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  +{dashboardData?.analytics?.improvementRate || 0}%
                </Badge>
              </div>
              <h3 className="font-semibold mb-2">
                {lang === "fr" ? "Progrès hebdomadaire" : "Weekly Progress"}
              </h3>
              <div className="text-2xl font-bold text-[#2ECC71] mb-2">
                {dashboardData?.analytics?.weeklyProgress || 0}%
              </div>
              <Progress value={dashboardData?.analytics?.weeklyProgress || 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {lang === "fr" ? "Amélioration cette semaine" : "Improvement this week"}
              </p>
            </CardContent>
          </Card>

          {/* Study Streak */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Target className="h-6 w-6 text-orange-500" />
                </div>
                <Badge variant="outline" className="text-xs border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400">
                  {lang === "fr" ? "Actif" : "Active"}
                </Badge>
              </div>
              <h3 className="font-semibold mb-2">
                {lang === "fr" ? "Série d'étude" : "Study Streak"}
              </h3>
              <div className="text-2xl font-bold text-orange-500 mb-2">
                {dashboardData?.analytics?.studyStreak || 0} {lang === "fr" ? "jours" : "days"}
              </div>
              <p className="text-xs text-muted-foreground">
                {lang === "fr" ? "Continue comme ça!" : "Keep it up!"}
              </p>
            </CardContent>
          </Card>

          {/* Average Score */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Award className="h-6 w-6 text-blue-500" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  TCF/TEF
                </Badge>
              </div>
              <h3 className="font-semibold mb-2">
                {lang === "fr" ? "Score moyen" : "Average Score"}
              </h3>
              <div className="text-2xl font-bold text-blue-500 mb-2">
                {dashboardData?.analytics?.averageScore || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {lang === "fr" ? "Sur les derniers tests" : "On recent tests"}
              </p>
            </CardContent>
          </Card>

          {/* Study Time */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-500" />
                </div>
                <Badge variant="outline" className="text-xs border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">
                  {lang === "fr" ? "Cette semaine" : "This week"}
                </Badge>
              </div>
              <h3 className="font-semibold mb-2">
                {lang === "fr" ? "Temps d'étude" : "Study Time"}
              </h3>
              <div className="text-2xl font-bold text-purple-500 mb-2">
                {dashboardData?.analytics?.timeStudied || '0h 0m'}
              </div>
              <p className="text-xs text-muted-foreground">
                {lang === "fr" ? "Temps total investi" : "Total time invested"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strengths & Weaknesses */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#2ECC71]" />
                {lang === "fr" ? "Forces et faiblesses" : "Strengths & Weaknesses"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Strong Areas */}
              <div>
                <h4 className="font-semibold text-[#2ECC71] mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {lang === "fr" ? "Points forts" : "Strong Areas"}
                </h4>
                <div className="space-y-2">
                  {(!dashboardData?.analytics?.strongAreas || dashboardData.analytics.strongAreas.length === 0) ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">{lang === "fr" ? "Aucune donnée disponible" : "No data available"}</p>
                    </div>
                  ) : (
                    dashboardData.analytics.strongAreas.map((area: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-[#2ECC71]/5 rounded-lg">
                        <span className="text-sm">{area}</span>
                        <Badge variant="outline" className="text-xs border-[#2ECC71]/20 text-[#2ECC71]">
                          85%+
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Weak Areas */}
              <div>
                <h4 className="font-semibold text-orange-500 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {lang === "fr" ? "À améliorer" : "Areas to Improve"}
                </h4>
                <div className="space-y-2">
                  {(!dashboardData?.analytics?.weakAreas || dashboardData.analytics.weakAreas.length === 0) ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">{lang === "fr" ? "Aucune donnée disponible" : "No data available"}</p>
                    </div>
                  ) : (
                    dashboardData.analytics.weakAreas.map((area: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-orange-500/5 rounded-lg">
                        <span className="text-sm">{area}</span>
                        <Badge variant="outline" className="text-xs border-orange-200 dark:border-orange-800 text-orange-500 dark:text-orange-400">
                          {lang === "fr" ? "Focus" : "Focus"}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                {lang === "fr" ? "Réussites récentes" : "Recent Achievements"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.length > 0 ? (
                  achievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{achievement.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(achievement.earnedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {achievement.points && (
                        <Badge variant="secondary" className="text-xs">
                          +{achievement.points}
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{lang === "fr" ? "Aucune réussite récente" : "No recent achievements"}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-[#2ECC71]/5 to-blue-500/5 border-[#2ECC71]/20 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-[#2ECC71]" />
                {lang === "fr" ? "Recommandations personnalisées par IA" : "AI-Powered Personal Recommendations"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {lang === "fr" 
                  ? "Basées sur vos performances récentes et vos objectifs d'apprentissage"
                  : "Based on your recent performance and learning goals"
                }
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {(!dashboardData?.analytics?.nextRecommendations || dashboardData.analytics.nextRecommendations.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{lang === "fr" ? "Aucune recommandation disponible" : "No recommendations available"}</p>
                  </div>
                ) : (
                  dashboardData.analytics.nextRecommendations.map((rec: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-background rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#2ECC71]/10 rounded-lg">
                          {rec.type === 'test' ? <Zap className="h-4 w-4 text-[#2ECC71]" /> :
                           rec.type === 'course' ? <BookOpen className="h-4 w-4 text-blue-500" /> :
                           <PlayCircle className="h-4 w-4 text-orange-500" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{rec.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {rec.difficulty}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {rec.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" className="bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                      {lang === "fr" ? "Conseil IA du jour" : "AI Tip of the Day"}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {lang === "fr" 
                        ? "Pratiquez l'expression orale 10 minutes par jour pour améliorer votre fluidité de 40% en 2 semaines."
                        : "Practice speaking for 10 minutes daily to improve your fluency by 40% in 2 weeks."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}

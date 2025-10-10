"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Trophy,
  Star,
  ArrowRight,
  Zap,
  Target,
  MessageCircle,
  Video,
  Award,
  CheckCircle,
  Timer,
  Flame,
  BarChart3,
  Play
} from "lucide-react"
import { useLang } from "./language-provider"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api-client"
import Link from "next/link"

interface DashboardData {
  weeklyProgress: number
  studyStreak: number
  averageScore: number
  totalStudyTime: number
  strongAreas: string[]
  weakAreas: string[]
  recommendations: string[]
}

interface Achievement {
  id: string
  title: { fr: string; en: string }
  description: { fr: string; en: string }
  date: string
  xp: number
  color: string
  icon: any
}

export default function Snapshot() {
  const { t, lang } = useLang()
  const { isAuthenticated } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated) return
      
      try {
        setLoading(true)
        const [dashboardResponse, achievementsResponse] = await Promise.all([
          apiClient.get('/home/dashboard'),
          apiClient.get('/achievements/recent')
        ])
        
        if ((dashboardResponse.data as any)?.success) {
          setDashboardData((dashboardResponse.data as any).data)
        }
        
        if ((achievementsResponse.data as any)?.success) {
          const realAchievements = (achievementsResponse.data as any).data
          if (Array.isArray(realAchievements) && realAchievements.length > 0) {
            // Use real achievement data from API
            setRecentAchievements(realAchievements.map((achievement: any) => ({
              id: achievement.id.toString(),
              title: { fr: achievement.title, en: achievement.title },
              description: { fr: achievement.description, en: achievement.description },
              date: new Date(achievement.earnedAt).toLocaleDateString(),
              xp: achievement.points || 0,
              color: "#2ECC71",
              icon: achievement.icon || "🏆"
            })))
          } else {
            // Fallback to mock data if no real achievements
            setRecentAchievements([
              { id: "1", title: { fr: "Premier Test", en: "First Test" }, description: { fr: "Vous avez terminé votre premier test", en: "You completed your first test" }, date: "2024-01-15", xp: 100, color: "#2ECC71", icon: "🎯" },
              { id: "2", title: { fr: "Série de 5", en: "Series of 5" }, description: { fr: "5 tests consécutifs réussis", en: "5 consecutive tests passed" }, date: "2024-01-14", xp: 200, color: "#E74C3C", icon: "🔥" },
              { id: "3", title: { fr: "Régularité", en: "Regularity" }, description: { fr: "Connexion quotidienne pendant 7 jours", en: "Daily connection for 7 days" }, date: "2024-01-13", xp: 150, color: "#3498DB", icon: "📅" },
              { id: "4", title: { fr: "Perfectionniste", en: "Perfectionist" }, description: { fr: "Score parfait sur un test", en: "Perfect score on a test" }, date: "2024-01-12", xp: 300, color: "#F39C12", icon: "💯" },
              { id: "5", title: { fr: "Explorateur", en: "Explorer" }, description: { fr: "Découverte de 3 nouvelles leçons", en: "Discovered 3 new lessons" }, date: "2024-01-11", xp: 75, color: "#9B59B6", icon: "🔍" }
            ])
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [isAuthenticated])

  // Calculate weekly stats from dashboard data
  const weeklyStats = dashboardData ? {
    testsCompleted: Math.floor(dashboardData.weeklyProgress / 10), // Convert progress to test count
    averageScore: Math.round(dashboardData.averageScore),
    streak: dashboardData.studyStreak,
    xpEarned: Math.floor(dashboardData.totalStudyTime / 60) * 10 // XP based on study time
  } : {
    testsCompleted: 0,
    averageScore: 0,
    streak: 0,
    xpEarned: 0
  }

  const loggedIn = isAuthenticated

  if (!loggedIn) {
    return (
      <section aria-labelledby="snapshot-title" className="py-6">
        <h2 id="snapshot-title" className="sr-only">
          Snapshot
        </h2>
        <div className="rounded-xl border bg-card p-6 flex items-center justify-between hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {lang === "fr" ? "Prêt à commencer ?" : "Ready to start?"}
              </h3>
              <p className="text-sm text-muted-foreground">
            {lang === "fr"
              ? "Commencez un exercice rapide pour lancer votre progression."
              : "Start a quick drill to kick off your progress."}
              </p>
            </div>
          </div>
          <Link href="/test-niveau">
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Play className="h-4 w-4" />
              {lang === "fr" ? "Démarrer" : "Quick start"}
            </Button>
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="snapshot-heading" className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 id="snapshot-heading" className="text-2xl md:text-3xl font-bold font-[var(--font-poppins)] mb-2">
            {lang === "fr" ? "Votre activité" : "Your Activity"}
      </h2>
          <p className="text-muted-foreground">
            {lang === "fr" ? "Suivez vos progrès et découvrez vos dernières réussites" : "Track your progress and discover your latest achievements"}
          </p>
        </div>
        <Link href="/achievements">
          <Button variant="outline" size="sm" className="gap-2 hover:scale-105 transition-transform">
            <Trophy className="h-4 w-4" />
            {lang === "fr" ? "Voir tout" : "View all"}
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Weekly Stats Overview */}
        <div className="lg:col-span-3 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-6 w-6 text-green-500 dark:text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {loading ? "..." : weeklyStats.testsCompleted}
                </div>
                <div className="text-xs text-muted-foreground">{lang === "fr" ? "Tests complétés" : "Tests completed"}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <BarChart3 className="h-6 w-6 text-purple-500 dark:text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {loading ? "..." : `${weeklyStats.averageScore}%`}
                </div>
                <div className="text-xs text-muted-foreground">{lang === "fr" ? "Score moyen" : "Average score"}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Flame className="h-6 w-6 text-orange-500 dark:text-orange-400" />
              </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {loading ? "..." : weeklyStats.streak}
                </div>
                <div className="text-xs text-muted-foreground">{lang === "fr" ? "Jours de suite" : "Day streak"}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-6 w-6 text-pink-500 dark:text-pink-400" />
            </div>
                <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  {loading ? "..." : weeklyStats.xpEarned}
                </div>
                <div className="text-xs text-muted-foreground">{lang === "fr" ? "XP gagnés" : "XP earned"}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Achievements */}
        <Card className="lg:col-span-2 hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2ECC71] via-[#F39C12] to-[#8E44AD]" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-[#F39C12]/10 rounded-lg">
                  <Trophy className="h-5 w-5 text-[#F39C12]" />
              </div>
                {lang === "fr" ? "Réussites récentes" : "Recent Achievements"}
              </h3>
              <Badge variant="secondary" className="bg-[#F39C12]/10 text-[#F39C12] border-[#F39C12]/20">
                {recentAchievements.length} {lang === "fr" ? "nouvelles" : "new"}
              </Badge>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F39C12] mx-auto mb-2"></div>
                  <p className="text-sm">{lang === "fr" ? "Chargement des réussites..." : "Loading achievements..."}</p>
                </div>
              ) : recentAchievements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{lang === "fr" ? "Aucune réussite récente" : "No recent achievements"}</p>
                </div>
              ) : (
                recentAchievements.map((achievement, index) => {
                const Icon = achievement.icon
                return (
                  <div 
                    key={achievement.id} 
                    className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/30 transition-all duration-300 hover:scale-[1.02] border border-gray-200/30 dark:border-gray-800/10"
                  >
                    <div 
                      className="p-3 rounded-xl shadow-sm"
                      style={{ backgroundColor: `${achievement.color}20` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: achievement.color }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {lang === "fr" ? achievement.title.fr : achievement.title.en}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {lang === "fr" ? achievement.description.fr : achievement.description.en}
                      </p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(achievement.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#F39C12]/10 rounded-full">
                      <Star className="h-4 w-4 text-[#F39C12] fill-current" />
                      <span className="text-sm font-semibold text-[#F39C12]">+{achievement.xp} XP</span>
            </div>
          </div>
                )
                })
              )}
              
              <div className="pt-4 border-t border-gray-200/30 dark:border-gray-800/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-[#2ECC71]" />
                    {lang === "fr" ? "Progression cette semaine" : "Weekly progress"}
                  </div>
                  <div className="text-sm font-medium text-[#2ECC71]">
                    {loading ? "..." : `+${dashboardData?.weeklyProgress || 0}% XP`}
                  </div>
              </div>
                <Progress 
                  value={loading ? 0 : (dashboardData?.weeklyProgress || 0)} 
                  className="mt-2 h-2" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#007BFF] to-[#E74C3C]" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="p-2 bg-[#007BFF]/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-[#007BFF]" />
                </div>
                {lang === "fr" ? "À venir" : "Upcoming"}
              </h3>
            </div>
            
            <div className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{lang === "fr" ? "Aucun événement à venir" : "No upcoming events"}</p>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700/50 hover:shadow-md transition-all duration-300 hover:border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {event.type === "live" ? (
                        <Video className="h-4 w-4 text-[#E74C3C]" />
                      ) : (
                        <Target className="h-4 w-4 text-[#007BFF]" />
                      )}
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          borderColor: event.color + "40",
                          color: event.color 
                        }}
                      >
                        {event.level}
                      </Badge>
                    </div>
                    {event.type === "live" && (
                      <Badge className="bg-[#E74C3C] text-white text-xs animate-pulse">
                        LIVE
                      </Badge>
                    )}
                  </div>
                  
                  <h4 className="font-medium text-sm mb-2 leading-tight">
                    {lang === "fr" ? event.title.fr : event.title.en}
                  </h4>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {lang === "fr" ? event.date.fr : event.date.en}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {event.participants}/{event.maxParticipants}
                    </div>
                    <Progress 
                      value={(event.participants / event.maxParticipants) * 100} 
                      className="w-16 h-1.5" 
                    />
                  </div>
                </div>
                ))
              )}
              
              <Link href="/live">
                <Button variant="outline" className="w-full gap-2 mt-4">
                  <ArrowRight className="h-4 w-4" />
                  {lang === "fr" ? "Voir tous les événements" : "View all events"}
                </Button>
            </Link>
          </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">
          {lang === "fr" ? "Actions rapides" : "Quick Actions"}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/test-niveau">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="p-3 bg-[#2ECC71]/10 rounded-full inline-flex mb-3 group-hover:scale-110 transition-transform">
                  <Target className="h-6 w-6 text-[#2ECC71]" />
                </div>
                <h4 className="font-medium text-sm">
                  {lang === "fr" ? "Test de niveau" : "Level test"}
                </h4>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tests">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="p-3 bg-[#007BFF]/10 rounded-full inline-flex mb-3 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-6 w-6 text-[#007BFF]" />
                </div>
                <h4 className="font-medium text-sm">
                  {lang === "fr" ? "Exercices" : "Practice"}
                </h4>
              </CardContent>
            </Card>
          </Link>

          <Link href="/live">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="p-3 bg-[#E74C3C]/10 rounded-full inline-flex mb-3 group-hover:scale-110 transition-transform">
                  <Video className="h-6 w-6 text-[#E74C3C]" />
                </div>
                <h4 className="font-medium text-sm">
                  {lang === "fr" ? "Sessions live" : "Live sessions"}
                </h4>
              </CardContent>
            </Card>
          </Link>

          <Link href="/achievements">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="p-3 bg-[#F39C12]/10 rounded-full inline-flex mb-3 group-hover:scale-110 transition-transform">
                  <Trophy className="h-6 w-6 text-[#F39C12]" />
                </div>
                <h4 className="font-medium text-sm">
                  {lang === "fr" ? "Réussites" : "Achievements"}
                </h4>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </section>
  )
}
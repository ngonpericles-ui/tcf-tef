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
          apiClient.get('/home/dashboard').catch(() => ({ success: false, data: null })),
          apiClient.get('/achievements/recent').catch(() => ({ success: false, data: [] })) // Catch ALL errors - NO MOCK DATA
        ])
        
        if (dashboardResponse.success && dashboardResponse.data) {
          setDashboardData(dashboardResponse.data)
        }
        
        if (achievementsResponse.success && achievementsResponse.data) {
          const realAchievements = achievementsResponse.data
          if (Array.isArray(realAchievements) && realAchievements.length > 0) {
            // Use real achievement data from API only
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
            // No achievements - show empty state
            setRecentAchievements([])
          }
        } else {
          // API failed or no data - show empty state
          setRecentAchievements([])
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

  // Calculate weekly stats from dashboard data with safe fallbacks
  const weeklyProgress = dashboardData?.weeklyProgress ?? 0
  const averageScore = dashboardData?.averageScore ?? 0
  const studyStreak = dashboardData?.studyStreak ?? 0
  const totalStudyTime = dashboardData?.totalStudyTime ?? 0
  
  // Calculate stats with proper number validation
  const weeklyStats = {
    testsCompleted: Math.floor(Math.max(0, Number(weeklyProgress) || 0) / 10),
    averageScore: Math.round(Math.max(0, Number(averageScore) || 0)),
    streak: Math.max(0, Number(studyStreak) || 0),
    xpEarned: Math.floor(Math.max(0, Number(totalStudyTime) || 0) / 60) * 10
  }
  
  // Ensure all values are valid numbers (not NaN)
  const safeStats = {
    testsCompleted: isNaN(weeklyStats.testsCompleted) ? 0 : weeklyStats.testsCompleted,
    averageScore: isNaN(weeklyStats.averageScore) ? 0 : weeklyStats.averageScore,
    streak: isNaN(weeklyStats.streak) ? 0 : weeklyStats.streak,
    xpEarned: isNaN(weeklyStats.xpEarned) ? 0 : weeklyStats.xpEarned
  }

  // Simulation Count Card Component
  const SimulationCountCard = () => {
    const [simData, setSimData] = useState<{
      remaining: number
      total: number
      tier: string
      daysRemaining?: number
    } | null>(null)
    const [loadingSim, setLoadingSim] = useState(true)

    useEffect(() => {
      // Only fetch when component mounts or when authentication status changes
      if (!isAuthenticated) {
        setLoadingSim(false)
        return
      }

      const fetchSimulationData = async () => {
        try {
          const response = await apiClient.get('/simulations/free-attempts/count')
          if (response.success && response.data) {
            const data = response.data
            setSimData({
              remaining: data.remainingSimulations === -1 ? Infinity : data.remainingSimulations || 0,
              total: data.maxSimulations === -1 ? Infinity : data.maxSimulations || 5,
              tier: data.subscriptionTier || 'FREE',
              daysRemaining: data.daysRemaining
            })
          }
        } catch (error) {
          console.error('Error fetching simulation count:', error)
        } finally {
          setLoadingSim(false)
        }
      }

      // Fetch immediately on mount
      fetchSimulationData()
      
      // Refresh every 5 minutes (reasonable interval to avoid unnecessary API calls)
      const refreshInterval = setInterval(() => {
        if (isAuthenticated) {
          fetchSimulationData()
        }
      }, 5 * 60 * 1000) // 5 minutes

      return () => clearInterval(refreshInterval)
    }, [isAuthenticated]) // Only depend on isAuthenticated, not on hasFetched

    if (loadingSim || !simData) {
      return (
        <>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ...
          </div>
          <div className="text-xs text-muted-foreground">{lang === "fr" ? "Simulations" : "Simulations"}</div>
        </>
      )
    }

    const getTierName = (tier: string) => {
      switch (tier) {
        case 'FREE': return lang === "fr" ? "Gratuit" : "Free"
        case 'ESSENTIAL': return lang === "fr" ? "Essentiel" : "Essential"
        case 'PREMIUM': return "Premium"
        case 'PRO': return "Pro+"
        default: return tier
      }
    }

    const remainingText = simData.remaining === Infinity 
      ? (lang === "fr" ? "Illimité" : "Unlimited")
      : simData.remaining

    return (
      <>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {remainingText} {simData.total !== Infinity && `/${simData.total}`}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {lang === "fr" 
            ? `Il vous reste ${simData.remaining === Infinity ? "un nombre illimité de" : simData.remaining} simulation${simData.remaining !== 1 && simData.remaining !== Infinity ? "s" : ""}`
            : `You have ${simData.remaining === Infinity ? "unlimited" : simData.remaining} simulation${simData.remaining !== 1 && simData.remaining !== Infinity ? "s" : ""} left`}
        </div>
        <div className="text-xs text-blue-500 dark:text-blue-400 mt-1 font-medium">
          {getTierName(simData.tier)}
        </div>
        {simData.daysRemaining !== undefined && simData.daysRemaining > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            {simData.daysRemaining} {lang === "fr" ? "j restants" : "d left"}
          </div>
        )}
      </>
    )
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
                  {loading ? "..." : safeStats.testsCompleted}
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
                  {loading ? "..." : `${safeStats.averageScore}%`}
                </div>
                <div className="text-xs text-muted-foreground">{lang === "fr" ? "Score moyen" : "Average score"}</div>
              </CardContent>
            </Card>

            <Card className="bg-card border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-6 w-6 text-blue-500 dark:text-blue-400" />
              </div>
                <SimulationCountCard />
              </CardContent>
            </Card>

            <Card className="bg-card border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-6 w-6 text-pink-500 dark:text-pink-400" />
            </div>
                <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  {loading ? "..." : safeStats.xpEarned}
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
                // Handle icon - can be React component or emoji string
                const Icon = typeof achievement.icon === 'string' ? null : achievement.icon
                const iconEmoji = typeof achievement.icon === 'string' ? achievement.icon : null
                
                return (
                  <div 
                    key={achievement.id} 
                    className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/30 transition-all duration-300 hover:scale-[1.02] border border-gray-200/30 dark:border-gray-800/10"
                  >
                    <div 
                      className="p-3 rounded-xl shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: `${achievement.color}20` }}
                    >
                      {Icon ? (
                      <Icon className="h-6 w-6" style={{ color: achievement.color }} />
                      ) : (
                        <span className="text-2xl" style={{ color: achievement.color }}>{iconEmoji}</span>
                      )}
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
                    {loading ? "..." : `+${safeStats.testsCompleted || 0}% XP`}
                  </div>
              </div>
                <Progress 
                  value={loading ? 0 : Math.max(0, Math.min(100, safeStats.testsCompleted || 0))} 
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
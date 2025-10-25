"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Target,
  Video,
  TrendingUp,
  Clock,
  Users,
  Award,
  Zap,
  ArrowRight,
  Calendar,
  Play,
  CheckCircle,
  AlertCircle,
  Star,
  Flame,
  Eye,
  MessageSquare,
  Bell,
  RefreshCw
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useSharedData, useCrossSectionData, useQuickStats, useRecommendations } from "@/components/shared-data-provider"
import { cn } from "@/lib/utils"

interface CrossSectionDashboardProps {
  userRole: 'STUDENT' | 'JUNIOR_MANAGER' | 'SENIOR_MANAGER' | 'ADMIN'
  currentSection: 'student' | 'manager' | 'admin'
  className?: string
}

export default function CrossSectionDashboard({
  userRole,
  currentSection,
  className = ""
}: CrossSectionDashboardProps) {
  const { t } = useLanguage()
  const { loading, error, isOnline, lastUpdated } = useSharedData()
  const { crossSectionData, refresh } = useCrossSectionData()
  const { quickStats } = useQuickStats()
  const { recommendations } = useRecommendations()
  
  const [refreshing, setRefreshing] = useState(false)

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  // Get priority color for recommendations
  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800 border-red-200'
    if (priority >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  // Format time duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("text-center py-8", className)}>
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('Réessayer', 'Retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t('Tableau de bord unifié', 'Unified Dashboard')}
          </h2>
          <p className="text-muted-foreground">
            {t('Vue d\'ensemble de toutes vos activités', 'Overview of all your activities')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <Badge variant="destructive" className="text-xs">
              {t('Hors ligne', 'Offline')}
            </Badge>
          )}
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              {t('Mis à jour', 'Updated')}: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {quickStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Temps d\'étude aujourd\'hui', 'Study time today')}
                  </p>
                  <p className="text-2xl font-bold">
                    {formatDuration(quickStats.todayStudyTime)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Progression hebdomadaire', 'Weekly progress')}
                  </p>
                  <p className="text-2xl font-bold">
                    {quickStats.weeklyProgress}%
                  </p>
                  <Progress value={quickStats.weeklyProgress} className="mt-2" />
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Série actuelle', 'Current streak')}
                  </p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    <Flame className="h-6 w-6 text-orange-500" />
                    {quickStats.currentStreak}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('jours', 'days')}
                  </p>
                </div>
                <Award className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Score moyen', 'Average score')}
                  </p>
                  <p className="text-2xl font-bold">
                    {quickStats.averageScore}%
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < Math.floor(quickStats.averageScore / 20)
                            ? "text-yellow-500 fill-current"
                            : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('Vue d\'ensemble', 'Overview')}</TabsTrigger>
          <TabsTrigger value="courses">{t('Cours', 'Courses')}</TabsTrigger>
          <TabsTrigger value="live-sessions">{t('Sessions Live', 'Live Sessions')}</TabsTrigger>
          <TabsTrigger value="tests">{t('Tests', 'Tests')}</TabsTrigger>
          <TabsTrigger value="recommendations">{t('Recommandations', 'Recommendations')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Courses */}
            {crossSectionData?.recentCourses && crossSectionData.recentCourses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {t('Cours récents', 'Recent Courses')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {crossSectionData.recentCourses.slice(0, 3).map((course) => (
                    <div key={course.courseId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {t(course.title, course.titleEn)}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={course.progress} className="flex-1 h-2" />
                          <span className="text-xs text-muted-foreground">
                            {course.progress}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('Dernière visite', 'Last accessed')}: {new Date(course.lastAccessed).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/cours/${course.courseId}`}>
                          <Play className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/cours">
                      {t('Voir tous les cours', 'View all courses')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Live Sessions */}
            {crossSectionData?.upcomingLiveSessions && crossSectionData.upcomingLiveSessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    {t('Sessions Live à venir', 'Upcoming Live Sessions')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {crossSectionData.upcomingLiveSessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {t(session.title, session.titleEn)}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(session.scheduledAt).toLocaleString()}</span>
                          <Users className="h-3 w-3 ml-2" />
                          <span>{session.participants}/{session.maxParticipants}</span>
                        </div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {session.level}
                        </Badge>
                      </div>
                      <Button 
                        variant={session.isRegistered ? "default" : "outline"} 
                        size="sm"
                        asChild
                      >
                        <Link href={`/live/${session.id}`}>
                          {session.isRegistered ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t('Inscrit', 'Registered')}
                            </>
                          ) : (
                            <>
                              <Users className="h-4 w-4 mr-1" />
                              {t('S\'inscrire', 'Register')}
                            </>
                          )}
                        </Link>
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/live">
                      {t('Voir toutes les sessions', 'View all sessions')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {recommendations && recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((recommendation) => (
                <Card key={recommendation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">
                          {t(recommendation.title, recommendation.titleEn)}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {t(recommendation.description, recommendation.descriptionEn)}
                        </p>
                        <Badge className={getPriorityColor(recommendation.priority)} variant="outline">
                          {t('Priorité', 'Priority')}: {recommendation.priority}/10
                        </Badge>
                      </div>
                      {recommendation.thumbnail && (
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center ml-3">
                          <Eye className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <strong>{t('Pourquoi', 'Why')}:</strong> {t(recommendation.reason, recommendation.reasonEn)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={recommendation.actionUrl}>
                        {t(recommendation.actionLabel, recommendation.actionLabelEn)}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t('Aucune recommandation disponible pour le moment', 'No recommendations available at the moment')}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Other tabs would be implemented similarly */}
      </Tabs>
    </div>
  )
}

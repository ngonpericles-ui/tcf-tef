"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ReferenceLine
} from "recharts"
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BookOpen,
  Award,
  Zap,
  Eye,
  ArrowRight,
  Download
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { 
  FrenchLearningAnalyticsService,
  type LearningRecommendation,
  type StudentEngagementMetrics,
  type ContentEffectivenessData,
  type WeaknessData
} from "@/lib/services/frenchLearningAnalytics"

interface LearningInsightsDashboardProps {
  timeframe: string
  userRole: 'ADMIN' | 'SENIOR_MANAGER' | 'JUNIOR_MANAGER'
  className?: string
}

export default function LearningInsightsDashboard({
  timeframe,
  userRole,
  className = ""
}: LearningInsightsDashboardProps) {
  const { t } = useLanguage()
  
  const [engagementData, setEngagementData] = useState<StudentEngagementMetrics | null>(null)
  const [contentData, setContentData] = useState<ContentEffectivenessData[]>([])
  const [weaknessData, setWeaknessData] = useState<WeaknessData[]>([])
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContentType, setSelectedContentType] = useState<string>("all")

  // Load learning insights data
  useEffect(() => {
    const loadInsightsData = async () => {
      try {
        setLoading(true)

        const [
          engagementResponse,
          contentResponse,
          recommendationsResponse
        ] = await Promise.allSettled([
          FrenchLearningAnalyticsService.getStudentEngagementMetrics(timeframe),
          FrenchLearningAnalyticsService.getContentEffectiveness(timeframe, selectedContentType === "all" ? undefined : selectedContentType),
          FrenchLearningAnalyticsService.getLearningRecommendations(userRole.toLowerCase())
        ])

        // Process engagement data
        if (engagementResponse.status === 'fulfilled' && engagementResponse.value.success) {
          setEngagementData(engagementResponse.value.data)
        }

        // Process content effectiveness data
        if (contentResponse.status === 'fulfilled' && contentResponse.value.success) {
          setContentData(contentResponse.value.data)
        }

        // Process recommendations
        if (recommendationsResponse.status === 'fulfilled' && recommendationsResponse.value.success) {
          setRecommendations(recommendationsResponse.value.data)
        }

        // Generate weakness data from content effectiveness
        if (contentResponse.status === 'fulfilled' && contentResponse.value.success) {
          const weakContent = contentResponse.value.data
            .filter(content => content.learningOutcome < 70)
            .map(content => ({
              area: content.title,
              studentsAffected: Math.floor(content.views * 0.3), // Estimate
              averageScore: content.learningOutcome,
              improvementPotential: 100 - content.learningOutcome,
              recommendedResources: [`Améliorer ${content.title}`, "Contenu supplémentaire", "Exercices pratiques"],
              priority: content.learningOutcome < 50 ? 'high' as const : content.learningOutcome < 70 ? 'medium' as const : 'low' as const
            }))
          setWeaknessData(weakContent)
        }

      } catch (error) {
        console.error('Failed to load learning insights:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInsightsData()
  }, [timeframe, selectedContentType, userRole])

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-500 bg-green-50 border-green-200'
      default: return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  // Get recommendation icon
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'content': return BookOpen
      case 'method': return Brain
      case 'pacing': return Clock
      case 'support': return Users
      default: return Lightbulb
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          {t("Chargement des insights d'apprentissage...", "Loading learning insights...")}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            {t('Insights d\'apprentissage', 'Learning Insights')}
          </h2>
          <p className="text-muted-foreground">
            {t('Analyses approfondies pour optimiser l\'apprentissage', 'Deep analytics to optimize learning')}
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t('Rapport détaillé', 'Detailed Report')}
        </Button>
      </div>

      {/* Engagement Overview */}
      {engagementData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Étudiants actifs quotidiens', 'Daily Active Students')}
                  </p>
                  <p className="text-2xl font-bold">{engagementData.dailyActiveStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Durée moyenne de session', 'Avg Session Duration')}
                  </p>
                  <p className="text-2xl font-bold">{Math.round(engagementData.averageSessionDuration / 60)}m</p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Leçons complétées', 'Lessons Completed')}
                  </p>
                  <p className="text-2xl font-bold">{engagementData.lessonsCompleted}</p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Score d\'engagement', 'Engagement Score')}
                  </p>
                  <p className="text-2xl font-bold">{engagementData.engagementScore}/100</p>
                </div>
                <Zap className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">{t('Efficacité du contenu', 'Content Effectiveness')}</TabsTrigger>
          <TabsTrigger value="weaknesses">{t('Points faibles', 'Weak Areas')}</TabsTrigger>
          <TabsTrigger value="recommendations">{t('Recommandations', 'Recommendations')}</TabsTrigger>
        </TabsList>

        {/* Content Effectiveness Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('Efficacité du contenu', 'Content Effectiveness')}</h3>
            <Select value={selectedContentType} onValueChange={setSelectedContentType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Tous les types', 'All types')}</SelectItem>
                <SelectItem value="lesson">{t('Leçons', 'Lessons')}</SelectItem>
                <SelectItem value="exercise">{t('Exercices', 'Exercises')}</SelectItem>
                <SelectItem value="quiz">{t('Quiz', 'Quizzes')}</SelectItem>
                <SelectItem value="video">{t('Vidéos', 'Videos')}</SelectItem>
                <SelectItem value="audio">{t('Audio', 'Audio')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contentData.length > 0 ? (
            <div className="space-y-4">
              {/* Content Effectiveness Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('Performance vs Engagement', 'Performance vs Engagement')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart data={contentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="engagement" 
                        name={t('Engagement', 'Engagement')}
                        domain={[0, 100]}
                      />
                      <YAxis 
                        dataKey="learningOutcome" 
                        name={t('Résultat d\'apprentissage', 'Learning Outcome')}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${value}%`,
                          name === 'engagement' ? t('Engagement', 'Engagement') : t('Résultat', 'Outcome')
                        ]}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.title || ''}
                      />
                      <ReferenceLine x={50} stroke="#ef4444" strokeDasharray="5 5" />
                      <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="5 5" />
                      <Scatter dataKey="engagement" fill="#3b82f6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top and Bottom Performing Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      {t('Contenu le plus efficace', 'Most Effective Content')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {contentData
                        .sort((a, b) => b.learningOutcome - a.learningOutcome)
                        .slice(0, 5)
                        .map((content, index) => (
                          <div key={content.contentId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{content.title}</p>
                              <p className="text-xs text-muted-foreground capitalize">{content.contentType}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600">{content.learningOutcome}%</div>
                              <div className="text-xs text-muted-foreground">{content.views} {t('vues', 'views')}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      {t('Contenu à améliorer', 'Content Needs Improvement')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {contentData
                        .sort((a, b) => a.learningOutcome - b.learningOutcome)
                        .slice(0, 5)
                        .map((content, index) => (
                          <div key={content.contentId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{content.title}</p>
                              <p className="text-xs text-muted-foreground capitalize">{content.contentType}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-red-600">{content.learningOutcome}%</div>
                              <div className="text-xs text-muted-foreground">{content.views} {t('vues', 'views')}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('Aucune donnée de contenu disponible', 'No content data available')}</p>
            </div>
          )}
        </TabsContent>

        {/* Weak Areas Tab */}
        <TabsContent value="weaknesses" className="space-y-4">
          <h3 className="text-lg font-semibold">{t('Domaines nécessitant une attention', 'Areas Requiring Attention')}</h3>
          
          {weaknessData.length > 0 ? (
            <div className="space-y-4">
              {weaknessData.map((weakness, index) => (
                <Card key={index} className={`border-l-4 ${
                  weakness.priority === 'high' ? 'border-l-red-500' :
                  weakness.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{weakness.area}</h4>
                          <Badge className={getPriorityColor(weakness.priority)}>
                            {weakness.priority === 'high' ? t('Priorité haute', 'High Priority') :
                             weakness.priority === 'medium' ? t('Priorité moyenne', 'Medium Priority') :
                             t('Priorité basse', 'Low Priority')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {weakness.studentsAffected} {t('étudiants affectés', 'students affected')} • 
                          {t('Score moyen', 'Average score')}: {weakness.averageScore}%
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>{t('Potentiel d\'amélioration', 'Improvement potential')}</span>
                            <span className="font-medium">+{weakness.improvementPotential}%</span>
                          </div>
                          <Progress value={weakness.improvementPotential} className="h-2" />
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
              <p>{t('Aucun point faible identifié', 'No weak areas identified')}</p>
              <p className="text-sm">{t('Excellent travail !', 'Great work!')}</p>
            </div>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <h3 className="text-lg font-semibold">{t('Recommandations personnalisées', 'Personalized Recommendations')}</h3>
          
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((recommendation, index) => {
                const RecommendationIcon = getRecommendationIcon(recommendation.type)
                return (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${
                          recommendation.priority === 'high' ? 'bg-red-100 text-red-600' :
                          recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <RecommendationIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{recommendation.title}</h4>
                            <Badge variant="outline" className="capitalize">
                              {recommendation.type}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{recommendation.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4 text-blue-500" />
                              <span>{t('Impact attendu', 'Expected impact')}: {recommendation.expectedImpact}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-purple-500" />
                              <span className="capitalize">{recommendation.implementationEffort} {t('effort', 'effort')}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline">
                          {t('Appliquer', 'Apply')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('Aucune recommandation disponible', 'No recommendations available')}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

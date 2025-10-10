"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Clock,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Eye,
  Hand,
  Mic,
  Video,
  Activity,
  BarChart3,
  Lightbulb,
  RefreshCw
} from "lucide-react"
import { useLang } from "@/components/language-provider"

interface AISessionInsightsProps {
  sessionId: string
  participants?: any[]
  sessionData?: any
  realTimeData?: {
    chatMessages: number
    handRaises: number
    averageEngagement: number
    participationRate: number
    attentionLevel: number
  }
  className?: string
}

interface AIInsight {
  id: string
  type: 'engagement' | 'participation' | 'learning' | 'technical' | 'recommendation'
  title: string
  description: string
  score: number
  trend: 'up' | 'down' | 'stable'
  priority: 'low' | 'medium' | 'high' | 'critical'
  actionable: boolean
  recommendation?: string
}

interface LearningMetrics {
  comprehensionLevel: number
  participationQuality: number
  questionFrequency: number
  responseAccuracy: number
  engagementConsistency: number
}

export default function AISessionInsights({
  sessionId,
  participants = [],
  sessionData,
  realTimeData,
  className = ""
}: AISessionInsightsProps) {
  const { lang } = useLang()
  
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics>({
    comprehensionLevel: 0,
    participationQuality: 0,
    questionFrequency: 0,
    responseAccuracy: 0,
    engagementConsistency: 0
  })
  const [overallScore, setOverallScore] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Generate AI insights based on real-time data
  useEffect(() => {
    if (realTimeData) {
      generateAIInsights()
    }
  }, [realTimeData, participants])

  // Update insights every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (realTimeData) {
        generateAIInsights()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [realTimeData])

  const generateAIInsights = async () => {
    setIsAnalyzing(true)
    
    try {
      const newInsights: AIInsight[] = []
      const metrics: LearningMetrics = {
        comprehensionLevel: 0,
        participationQuality: 0,
        questionFrequency: 0,
        responseAccuracy: 0,
        engagementConsistency: 0
      }

      if (realTimeData) {
        // Engagement Analysis
        const engagementScore = realTimeData.averageEngagement
        if (engagementScore < 40) {
          newInsights.push({
            id: 'engagement-low',
            type: 'engagement',
            title: t('Engagement faible', 'Low Engagement'),
            description: t(
              'Le niveau d\'engagement est en dessous de la moyenne. Considérez une activité interactive.',
              'Engagement level is below average. Consider an interactive activity.'
            ),
            score: engagementScore,
            trend: 'down',
            priority: 'high',
            actionable: true,
            recommendation: t(
              'Lancez un sondage rapide ou posez une question ouverte pour relancer l\'interaction.',
              'Launch a quick poll or ask an open question to restart interaction.'
            )
          })
        } else if (engagementScore > 80) {
          newInsights.push({
            id: 'engagement-high',
            type: 'engagement',
            title: t('Excellent engagement', 'Excellent Engagement'),
            description: t(
              'Les participants sont très engagés. Profitez-en pour approfondir le sujet.',
              'Participants are highly engaged. Take advantage to deepen the topic.'
            ),
            score: engagementScore,
            trend: 'up',
            priority: 'low',
            actionable: true,
            recommendation: t(
              'C\'est le moment idéal pour introduire des concepts plus complexes.',
              'This is the perfect time to introduce more complex concepts.'
            )
          })
        }

        // Participation Analysis
        const participationRate = realTimeData.participationRate
        metrics.participationQuality = participationRate

        if (participationRate < 30) {
          newInsights.push({
            id: 'participation-low',
            type: 'participation',
            title: t('Participation limitée', 'Limited Participation'),
            description: t(
              'Seulement ${participationRate}% des participants sont actifs.',
              `Only ${participationRate}% of participants are active.`
            ),
            score: participationRate,
            trend: 'down',
            priority: 'medium',
            actionable: true,
            recommendation: t(
              'Utilisez des techniques d\'appel nominal ou créez des groupes plus petits.',
              'Use name-calling techniques or create smaller groups.'
            )
          })
        }

        // Chat Activity Analysis
        const chatActivity = realTimeData.chatMessages
        if (chatActivity > 20) {
          newInsights.push({
            id: 'chat-active',
            type: 'learning',
            title: t('Chat très actif', 'Very Active Chat'),
            description: t(
              'Les participants utilisent beaucoup le chat. Cela indique un bon engagement.',
              'Participants are using chat a lot. This indicates good engagement.'
            ),
            score: Math.min(chatActivity * 2, 100),
            trend: 'up',
            priority: 'low',
            actionable: false
          })
        }

        // Hand Raises Analysis
        const handRaises = realTimeData.handRaises
        metrics.questionFrequency = Math.min(handRaises * 10, 100)

        if (handRaises > 5) {
          newInsights.push({
            id: 'questions-high',
            type: 'learning',
            title: t('Beaucoup de questions', 'Many Questions'),
            description: t(
              'Les participants posent beaucoup de questions. Excellent signe d\'engagement.',
              'Participants are asking many questions. Excellent sign of engagement.'
            ),
            score: Math.min(handRaises * 15, 100),
            trend: 'up',
            priority: 'low',
            actionable: true,
            recommendation: t(
              'Prenez le temps de répondre à toutes les questions pour maintenir l\'engagement.',
              'Take time to answer all questions to maintain engagement.'
            )
          })
        }

        // Attention Level Analysis
        const attentionLevel = realTimeData.attentionLevel
        metrics.engagementConsistency = attentionLevel

        if (attentionLevel < 50) {
          newInsights.push({
            id: 'attention-low',
            type: 'engagement',
            title: t('Attention en baisse', 'Declining Attention'),
            description: t(
              'Le niveau d\'attention diminue. Il est temps de changer de rythme.',
              'Attention level is declining. Time to change pace.'
            ),
            score: attentionLevel,
            trend: 'down',
            priority: 'high',
            actionable: true,
            recommendation: t(
              'Faites une pause de 2 minutes ou changez d\'activité pour relancer l\'attention.',
              'Take a 2-minute break or change activity to restart attention.'
            )
          })
        }

        // Calculate overall metrics
        metrics.comprehensionLevel = Math.round((engagementScore + participationRate + attentionLevel) / 3)
        metrics.responseAccuracy = Math.round((engagementScore + attentionLevel) / 2)

        // Technical Insights
        if (participants.length > 10 && participationRate < 40) {
          newInsights.push({
            id: 'group-size',
            type: 'technical',
            title: t('Groupe nombreux', 'Large Group'),
            description: t(
              'Avec ${participants.length} participants, la participation peut être difficile.',
              `With ${participants.length} participants, participation can be challenging.`
            ),
            score: 100 - participants.length * 2,
            trend: 'stable',
            priority: 'medium',
            actionable: true,
            recommendation: t(
              'Utilisez des salles de discussion pour diviser le groupe.',
              'Use breakout rooms to divide the group.'
            )
          })
        }
      }

      // Calculate overall session score
      const avgScore = newInsights.length > 0 
        ? newInsights.reduce((sum, insight) => sum + insight.score, 0) / newInsights.length
        : 75 // Default score if no insights

      setInsights(newInsights)
      setLearningMetrics(metrics)
      setOverallScore(Math.round(avgScore))
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error generating AI insights:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'engagement':
        return <Activity className="h-4 w-4" />
      case 'participation':
        return <Users className="h-4 w-4" />
      case 'learning':
        return <Brain className="h-4 w-4" />
      case 'technical':
        return <Zap className="h-4 w-4" />
      case 'recommendation':
        return <Lightbulb className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: AIInsight['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return <Activity className="h-3 w-3 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-600 bg-red-50 dark:bg-red-900/20'
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              {t("Insights IA en temps réel", "Real-time AI Insights")}
              {isAnalyzing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getScoreColor(overallScore)}>
                {t("Score", "Score")}: {overallScore}%
              </Badge>
              <Button variant="ghost" size="sm" onClick={generateAIInsights}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(learningMetrics.comprehensionLevel)}`}>
                {learningMetrics.comprehensionLevel}%
              </div>
              <div className="text-xs text-muted-foreground">
                {t("Compréhension", "Comprehension")}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(learningMetrics.participationQuality)}`}>
                {learningMetrics.participationQuality}%
              </div>
              <div className="text-xs text-muted-foreground">
                {t("Participation", "Participation")}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(learningMetrics.questionFrequency)}`}>
                {learningMetrics.questionFrequency}%
              </div>
              <div className="text-xs text-muted-foreground">
                {t("Questions", "Questions")}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(learningMetrics.responseAccuracy)}`}>
                {learningMetrics.responseAccuracy}%
              </div>
              <div className="text-xs text-muted-foreground">
                {t("Précision", "Accuracy")}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(learningMetrics.engagementConsistency)}`}>
                {learningMetrics.engagementConsistency}%
              </div>
              <div className="text-xs text-muted-foreground">
                {t("Constance", "Consistency")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              {t("Recommandations IA", "AI Recommendations")}
            </div>
            <Badge variant="outline">
              {insights.length} {t("insights", "insights")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t("Analyse en cours...", "Analyzing...")}</p>
                <p className="text-xs">{t("Les insights apparaîtront bientôt", "Insights will appear soon")}</p>
              </div>
            ) : (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`border-l-4 rounded-lg p-4 ${getPriorityColor(insight.priority)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.type)}
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      {getTrendIcon(insight.trend)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {insight.score}%
                      </Badge>
                      <Badge 
                        variant={insight.priority === 'high' || insight.priority === 'critical' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                  {insight.recommendation && (
                    <div className="bg-secondary/50 rounded p-2 mt-2">
                      <p className="text-xs font-medium text-primary mb-1">
                        {t("Recommandation:", "Recommendation:")}
                      </p>
                      <p className="text-xs">{insight.recommendation}</p>
                    </div>
                  )}
                  {insight.actionable && (
                    <div className="flex justify-end mt-2">
                      <Button variant="outline" size="sm" className="text-xs">
                        {t("Appliquer", "Apply")}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {insights.length > 0 && (
            <div className="mt-4 pt-3 border-t text-center">
              <p className="text-xs text-muted-foreground">
                {t("Dernière mise à jour:", "Last updated:")} {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

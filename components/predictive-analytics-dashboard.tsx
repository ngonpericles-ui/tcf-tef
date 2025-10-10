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
  ReferenceLine,
  AreaChart,
  Area
} from "recharts"
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
  Zap,
  Eye,
  Clock,
  Award,
  Lightbulb,
  Shield,
  Activity,
  ArrowRight,
  RefreshCw,
  Download,
  Bot,
  Sparkles,
  Gauge
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { 
  AIPredictionService,
  type StudentSuccessPrediction,
  type LearningOutcomeForecast,
  type ContentOptimizationSuggestion,
  type RiskAssessment,
  type AIInsight
} from "@/lib/services/aiPredictionService"

interface PredictiveAnalyticsDashboardProps {
  timeframe: string
  userRole: 'ADMIN' | 'SENIOR_MANAGER' | 'JUNIOR_MANAGER'
  className?: string
}

export default function PredictiveAnalyticsDashboard({
  timeframe,
  userRole,
  className = ""
}: PredictiveAnalyticsDashboardProps) {
  const { t } = useLanguage()
  
  const [studentPredictions, setStudentPredictions] = useState<StudentSuccessPrediction[]>([])
  const [outcomeForecast, setOutcomeForecast] = useState<LearningOutcomeForecast | null>(null)
  const [contentSuggestions, setContentSuggestions] = useState<ContentOptimizationSuggestion[]>([])
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([])
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("all")
  const [refreshing, setRefreshing] = useState(false)

  // Load predictive analytics data
  useEffect(() => {
    const loadPredictiveData = async () => {
      try {
        setLoading(true)

        const [
          predictionsResponse,
          forecastResponse,
          suggestionsResponse,
          riskResponse,
          insightsResponse
        ] = await Promise.allSettled([
          AIPredictionService.getStudentSuccessPredictions(timeframe, selectedRiskLevel === "all" ? undefined : selectedRiskLevel),
          AIPredictionService.getLearningOutcomeForecasts(timeframe),
          AIPredictionService.getContentOptimizationSuggestions(),
          AIPredictionService.getRiskAssessments(),
          AIPredictionService.getAIInsights()
        ])

        // Process student predictions
        if (predictionsResponse.status === 'fulfilled' && predictionsResponse.value.success) {
          setStudentPredictions(predictionsResponse.value.data)
        }

        // Process outcome forecasts
        if (forecastResponse.status === 'fulfilled' && forecastResponse.value.success) {
          setOutcomeForecast(forecastResponse.value.data)
        }

        // Process content suggestions
        if (suggestionsResponse.status === 'fulfilled' && suggestionsResponse.value.success) {
          setContentSuggestions(suggestionsResponse.value.data)
        }

        // Process risk assessments
        if (riskResponse.status === 'fulfilled' && riskResponse.value.success) {
          setRiskAssessments(riskResponse.value.data)
        }

        // Process AI insights
        if (insightsResponse.status === 'fulfilled' && insightsResponse.value.success) {
          setAIInsights(insightsResponse.value.data)
        }

      } catch (error) {
        console.error('Failed to load predictive analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPredictiveData()
  }, [timeframe, selectedRiskLevel])

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    // Reload data
    setRefreshing(false)
  }

  // Get risk level badge color
  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'critical': return 'bg-red-200 text-red-900 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get prediction confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <Bot className="h-8 w-8 animate-pulse mx-auto mb-4 text-primary" />
          {t("Chargement des prédictions IA...", "Loading AI predictions...")}
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
            <Brain className="h-6 w-6 text-primary" />
            {t('Analyses prédictives IA', 'AI Predictive Analytics')}
          </h2>
          <p className="text-muted-foreground">
            {t('Prédictions et recommandations basées sur l\'intelligence artificielle', 'AI-powered predictions and recommendations')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('Rapport IA', 'AI Report')}
          </Button>
        </div>
      </div>

      {/* AI Insights Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('Étudiants à risque', 'At-Risk Students')}
                </p>
                <p className="text-2xl font-bold text-red-500">
                  {riskAssessments.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('Prédictions de succès', 'Success Predictions')}
                </p>
                <p className="text-2xl font-bold text-green-500">
                  {studentPredictions.filter(p => p.successProbability >= 70).length}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('Optimisations suggérées', 'Optimization Suggestions')}
                </p>
                <p className="text-2xl font-bold text-blue-500">
                  {contentSuggestions.length}
                </p>
              </div>
              <Lightbulb className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('Insights IA', 'AI Insights')}
                </p>
                <p className="text-2xl font-bold text-purple-500">
                  {aiInsights.length}
                </p>
              </div>
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions">{t('Prédictions', 'Predictions')}</TabsTrigger>
          <TabsTrigger value="forecasts">{t('Prévisions', 'Forecasts')}</TabsTrigger>
          <TabsTrigger value="risks">{t('Évaluation des risques', 'Risk Assessment')}</TabsTrigger>
          <TabsTrigger value="optimization">{t('Optimisation', 'Optimization')}</TabsTrigger>
          <TabsTrigger value="insights">{t('Insights IA', 'AI Insights')}</TabsTrigger>
        </TabsList>

        {/* Student Success Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('Prédictions de succès étudiant', 'Student Success Predictions')}</h3>
            <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Tous les niveaux', 'All levels')}</SelectItem>
                <SelectItem value="low">{t('Risque faible', 'Low risk')}</SelectItem>
                <SelectItem value="medium">{t('Risque moyen', 'Medium risk')}</SelectItem>
                <SelectItem value="high">{t('Risque élevé', 'High risk')}</SelectItem>
                <SelectItem value="critical">{t('Risque critique', 'Critical risk')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {studentPredictions.length > 0 ? (
            <div className="space-y-4">
              {studentPredictions.slice(0, 10).map((prediction) => (
                <Card key={prediction.studentId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="font-semibold">{prediction.studentName}</h4>
                          <Badge className={getRiskBadgeColor(prediction.riskLevel)}>
                            {prediction.riskLevel === 'low' ? t('Risque faible', 'Low risk') :
                             prediction.riskLevel === 'medium' ? t('Risque moyen', 'Medium risk') :
                             prediction.riskLevel === 'high' ? t('Risque élevé', 'High risk') :
                             t('Risque critique', 'Critical risk')}
                          </Badge>
                          <Badge variant="outline">
                            {prediction.currentLevel} → {prediction.targetLevel}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">{t('Probabilité de succès', 'Success probability')}</p>
                            <div className="flex items-center gap-2">
                              <Progress value={prediction.successProbability} className="flex-1" />
                              <span className="font-semibold">{prediction.successProbability}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t('Confiance', 'Confidence')}</p>
                            <p className={`font-semibold ${getConfidenceColor(prediction.confidenceScore)}`}>
                              {AIPredictionService.getConfidenceDescription(prediction.confidenceScore)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t('Fin prévue', 'Predicted completion')}</p>
                            <p className="font-semibold">
                              {new Date(prediction.predictedCompletionDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {prediction.keyFactors.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-2">{t('Facteurs clés', 'Key factors')}:</p>
                            <div className="flex flex-wrap gap-2">
                              {prediction.keyFactors.slice(0, 3).map((factor, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {factor.factor} ({factor.impact > 0 ? '+' : ''}{factor.impact}%)
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {prediction.interventionNeeded && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <p className="text-sm font-medium text-yellow-800">
                                {t('Intervention recommandée', 'Intervention recommended')}
                              </p>
                            </div>
                            <ul className="text-sm text-yellow-700 space-y-1">
                              {prediction.recommendations.slice(0, 2).map((rec, index) => (
                                <li key={index}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
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
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('Aucune prédiction disponible', 'No predictions available')}</p>
            </div>
          )}
        </TabsContent>

        {/* Learning Outcome Forecasts Tab */}
        <TabsContent value="forecasts" className="space-y-4">
          <h3 className="text-lg font-semibold">{t('Prévisions des résultats d\'apprentissage', 'Learning Outcome Forecasts')}</h3>
          
          {outcomeForecast ? (
            <div className="space-y-6">
              {/* Forecast Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('Tendances prédites', 'Predicted Trends')}</CardTitle>
                  <CardDescription>
                    {t('Confiance', 'Confidence')}: {outcomeForecast.confidence}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={outcomeForecast.predictions.map(p => ({
                      metric: p.metric,
                      current: p.currentValue,
                      predicted: p.predictedValue,
                      change: p.change
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="current" 
                        stackId="1"
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.6}
                        name={t('Actuel', 'Current')}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="predicted" 
                        stackId="2"
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.6}
                        name={t('Prédit', 'Predicted')}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Scenarios */}
              {outcomeForecast.scenarios.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('Scénarios possibles', 'Possible Scenarios')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {outcomeForecast.scenarios.map((scenario, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{scenario.scenario}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{scenario.probability}% {t('probabilité', 'probability')}</Badge>
                              <Badge className={scenario.impact > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {scenario.impact > 0 ? '+' : ''}{scenario.impact}% {t('impact', 'impact')}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                          {scenario.actions.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1">{t('Actions recommandées', 'Recommended actions')}:</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {scenario.actions.map((action, actionIndex) => (
                                  <li key={actionIndex}>• {action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('Aucune prévision disponible', 'No forecasts available')}</p>
            </div>
          )}
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risks" className="space-y-4">
          <h3 className="text-lg font-semibold">{t('Évaluation des risques', 'Risk Assessment')}</h3>

          {riskAssessments.length > 0 ? (
            <div className="space-y-4">
              {riskAssessments.map((risk, index) => (
                <Card key={index} className={`border-l-4 ${
                  risk.riskLevel === 'critical' ? 'border-l-red-600' :
                  risk.riskLevel === 'high' ? 'border-l-red-400' :
                  risk.riskLevel === 'medium' ? 'border-l-yellow-400' : 'border-l-green-400'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{t('Étudiant', 'Student')} #{risk.studentId}</h4>
                          <Badge className={getRiskBadgeColor(risk.riskLevel)}>
                            {risk.riskLevel === 'low' ? t('Risque faible', 'Low risk') :
                             risk.riskLevel === 'medium' ? t('Risque moyen', 'Medium risk') :
                             risk.riskLevel === 'high' ? t('Risque élevé', 'High risk') :
                             t('Risque critique', 'Critical risk')}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {risk.riskCategory}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{t('Score de risque', 'Risk score')}:</span>
                            <span className="font-semibold">{risk.riskScore}/100</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{risk.timeline}</span>
                          </div>
                        </div>
                        <Progress value={risk.riskScore} className="mb-4" />
                      </div>
                    </div>

                    {risk.indicators.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">{t('Indicateurs de risque', 'Risk indicators')}:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {risk.indicators.map((indicator, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{indicator.indicator}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{indicator.severity}%</span>
                                {indicator.trend === 'worsening' ? (
                                  <TrendingUp className="h-3 w-3 text-red-500" />
                                ) : indicator.trend === 'improving' ? (
                                  <TrendingDown className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Activity className="h-3 w-3 text-gray-500" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {risk.interventions.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          {t('Interventions recommandées', 'Recommended interventions')}:
                        </p>
                        <div className="space-y-2">
                          {risk.interventions.slice(0, 3).map((intervention, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Badge variant="outline" className="text-xs">
                                {intervention.type === 'immediate' ? t('Immédiat', 'Immediate') :
                                 intervention.type === 'short_term' ? t('Court terme', 'Short term') :
                                 t('Long terme', 'Long term')}
                              </Badge>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-blue-800">{intervention.action}</p>
                                <p className="text-xs text-blue-600">{intervention.expectedOutcome}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
              <p>{t('Aucun risque identifié', 'No risks identified')}</p>
            </div>
          )}
        </TabsContent>

        {/* Content Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <h3 className="text-lg font-semibold">{t('Suggestions d\'optimisation du contenu', 'Content Optimization Suggestions')}</h3>

          {contentSuggestions.length > 0 ? (
            <div className="space-y-4">
              {contentSuggestions.map((suggestion, index) => (
                <Card key={suggestion.contentId}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{suggestion.contentTitle}</h4>
                          <Badge className={
                            suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                            suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {suggestion.priority === 'high' ? t('Priorité haute', 'High priority') :
                             suggestion.priority === 'medium' ? t('Priorité moyenne', 'Medium priority') :
                             t('Priorité basse', 'Low priority')}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">{t('Performance actuelle', 'Current performance')}</p>
                            <p className="font-semibold">{suggestion.currentPerformance}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t('Amélioration prédite', 'Predicted improvement')}</p>
                            <p className="font-semibold text-green-600">+{suggestion.predictedImprovement}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t('Effort d\'implémentation', 'Implementation effort')}</p>
                            <Badge variant="outline" className="capitalize">
                              {suggestion.implementationEffort}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium">{t('Actions d\'optimisation', 'Optimization actions')}:</p>
                          {suggestion.optimizationActions.map((action, actionIndex) => (
                            <div key={actionIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{action.action}</p>
                                <p className="text-xs text-muted-foreground">{action.description}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-green-600">+{action.expectedImpact}%</div>
                                <div className="text-xs text-muted-foreground capitalize">{action.effort} {t('effort', 'effort')}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline">
                        {t('Appliquer', 'Apply')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('Aucune suggestion d\'optimisation', 'No optimization suggestions')}</p>
            </div>
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <h3 className="text-lg font-semibold">{t('Insights IA', 'AI Insights')}</h3>

          {aiInsights.length > 0 ? (
            <div className="space-y-4">
              {aiInsights.map((insight) => (
                <Card key={insight.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        insight.type === 'alert' ? 'bg-red-100 text-red-600' :
                        insight.type === 'recommendation' ? 'bg-blue-100 text-blue-600' :
                        insight.type === 'prediction' ? 'bg-purple-100 text-purple-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {insight.type === 'alert' ? <AlertTriangle className="h-6 w-6" /> :
                         insight.type === 'recommendation' ? <Lightbulb className="h-6 w-6" /> :
                         insight.type === 'prediction' ? <Brain className="h-6 w-6" /> :
                         <TrendingUp className="h-6 w-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge variant="outline" className="capitalize">
                            {insight.type}
                          </Badge>
                          <Badge className={
                            insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                            insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {insight.impact} {t('impact', 'impact')}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{insight.description}</p>
                        <div className="flex items-center gap-4 text-sm mb-3">
                          <div className="flex items-center gap-1">
                            <Gauge className="h-4 w-4 text-blue-500" />
                            <span>{t('Confiance', 'Confidence')}: {insight.confidence}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-purple-500" />
                            <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {insight.actionable && insight.actions.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-800 mb-2">
                              {t('Actions recommandées', 'Recommended actions')}:
                            </p>
                            <ul className="text-sm text-blue-700 space-y-1">
                              {insight.actions.map((action, actionIndex) => (
                                <li key={actionIndex}>• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('Aucun insight IA disponible', 'No AI insights available')}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

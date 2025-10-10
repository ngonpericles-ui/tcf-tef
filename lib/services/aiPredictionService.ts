import { apiClient, ApiResponse } from '@/lib/api-client'

// AI Prediction Types
export interface StudentSuccessPrediction {
  studentId: string
  studentName: string
  currentLevel: string
  targetLevel: string
  successProbability: number // 0-100
  riskLevel: 'low' | 'medium' | 'high'
  predictedCompletionDate: string
  confidenceScore: number // 0-100
  keyFactors: PredictionFactor[]
  recommendations: string[]
  interventionNeeded: boolean
}

export interface PredictionFactor {
  factor: string
  impact: number // -100 to +100
  description: string
  category: 'engagement' | 'performance' | 'behavior' | 'external'
}

export interface LearningOutcomeForecast {
  timeframe: string
  predictions: OutcomePrediction[]
  trends: TrendPrediction[]
  scenarios: ScenarioPrediction[]
  confidence: number
}

export interface OutcomePrediction {
  metric: string
  currentValue: number
  predictedValue: number
  change: number
  changePercent: number
  trend: 'increasing' | 'decreasing' | 'stable'
  factors: string[]
}

export interface TrendPrediction {
  category: string
  direction: 'up' | 'down' | 'stable'
  strength: number // 0-100
  duration: number // days
  description: string
}

export interface ScenarioPrediction {
  scenario: string
  probability: number
  impact: number
  description: string
  actions: string[]
}

export interface ContentOptimizationSuggestion {
  contentId: string
  contentTitle: string
  currentPerformance: number
  predictedImprovement: number
  optimizationActions: OptimizationAction[]
  priority: 'high' | 'medium' | 'low'
  estimatedImpact: number
  implementationEffort: 'low' | 'medium' | 'high'
}

export interface OptimizationAction {
  action: string
  description: string
  expectedImpact: number
  effort: 'low' | 'medium' | 'high'
  timeline: string
}

export interface RiskAssessment {
  studentId: string
  riskScore: number // 0-100
  riskCategory: 'dropout' | 'performance' | 'engagement' | 'completion'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  indicators: RiskIndicator[]
  interventions: InterventionRecommendation[]
  timeline: string
}

export interface RiskIndicator {
  indicator: string
  severity: number // 0-100
  trend: 'improving' | 'worsening' | 'stable'
  description: string
}

export interface InterventionRecommendation {
  type: 'immediate' | 'short_term' | 'long_term'
  action: string
  description: string
  expectedOutcome: string
  priority: number
}

export interface AIInsight {
  id: string
  type: 'prediction' | 'recommendation' | 'alert' | 'trend'
  title: string
  description: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  category: string
  data: any
  actionable: boolean
  actions: string[]
  createdAt: string
  expiresAt?: string
}

export interface PredictiveModel {
  modelId: string
  modelName: string
  modelType: 'classification' | 'regression' | 'clustering'
  accuracy: number
  lastTrained: string
  features: string[]
  target: string
  status: 'active' | 'training' | 'deprecated'
}

export class AIPredictionService {
  /**
   * Get student success predictions
   */
  static async getStudentSuccessPredictions(
    timeframe: string = '30d',
    riskLevel?: string,
    limit: number = 50
  ): Promise<ApiResponse<StudentSuccessPrediction[]>> {
    try {
      const params = new URLSearchParams({ timeframe, limit: limit.toString() })
      if (riskLevel) params.append('riskLevel', riskLevel)
      
      return await apiClient.get(`/ai/predictions/student-success?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch student success predictions:', error)
      throw error
    }
  }

  /**
   * Get learning outcome forecasts
   */
  static async getLearningOutcomeForecasts(
    timeframe: string = '90d',
    metrics?: string[]
  ): Promise<ApiResponse<LearningOutcomeForecast>> {
    try {
      const params = new URLSearchParams({ timeframe })
      if (metrics) {
        metrics.forEach(metric => params.append('metrics', metric))
      }
      
      return await apiClient.get(`/ai/predictions/learning-outcomes?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch learning outcome forecasts:', error)
      throw error
    }
  }

  /**
   * Get content optimization suggestions
   */
  static async getContentOptimizationSuggestions(
    contentType?: string,
    priority?: string
  ): Promise<ApiResponse<ContentOptimizationSuggestion[]>> {
    try {
      const params = new URLSearchParams()
      if (contentType) params.append('contentType', contentType)
      if (priority) params.append('priority', priority)
      
      return await apiClient.get(`/ai/predictions/content-optimization?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch content optimization suggestions:', error)
      throw error
    }
  }

  /**
   * Get risk assessments for students
   */
  static async getRiskAssessments(
    riskCategory?: string,
    riskLevel?: string
  ): Promise<ApiResponse<RiskAssessment[]>> {
    try {
      const params = new URLSearchParams()
      if (riskCategory) params.append('riskCategory', riskCategory)
      if (riskLevel) params.append('riskLevel', riskLevel)
      
      return await apiClient.get(`/ai/predictions/risk-assessment?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch risk assessments:', error)
      throw error
    }
  }

  /**
   * Get AI insights and recommendations
   */
  static async getAIInsights(
    type?: string,
    category?: string,
    limit: number = 20
  ): Promise<ApiResponse<AIInsight[]>> {
    try {
      const params = new URLSearchParams({ limit: limit.toString() })
      if (type) params.append('type', type)
      if (category) params.append('category', category)
      
      return await apiClient.get(`/ai/insights?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch AI insights:', error)
      throw error
    }
  }

  /**
   * Get predictive models information
   */
  static async getPredictiveModels(): Promise<ApiResponse<PredictiveModel[]>> {
    try {
      return await apiClient.get('/ai/models')
    } catch (error) {
      console.error('Failed to fetch predictive models:', error)
      throw error
    }
  }

  /**
   * Trigger model retraining
   */
  static async retrainModel(modelId: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post(`/ai/models/${modelId}/retrain`)
    } catch (error) {
      console.error('Failed to retrain model:', error)
      throw error
    }
  }

  /**
   * Get prediction for specific student
   */
  static async getStudentPrediction(
    studentId: string,
    predictionType: string = 'success'
  ): Promise<ApiResponse<StudentSuccessPrediction>> {
    try {
      return await apiClient.get(`/ai/predictions/student/${studentId}?type=${predictionType}`)
    } catch (error) {
      console.error('Failed to fetch student prediction:', error)
      throw error
    }
  }

  /**
   * Generate automated report
   */
  static async generateAutomatedReport(
    reportType: 'weekly' | 'monthly' | 'quarterly',
    includesPredictions: boolean = true,
    format: 'pdf' | 'xlsx' | 'json' = 'pdf'
  ): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post('/ai/reports/generate', {
        reportType,
        includesPredictions,
        format
      })
    } catch (error) {
      console.error('Failed to generate automated report:', error)
      throw error
    }
  }

  /**
   * Get prediction accuracy metrics
   */
  static async getPredictionAccuracy(
    modelType?: string,
    timeframe: string = '30d'
  ): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams({ timeframe })
      if (modelType) params.append('modelType', modelType)
      
      return await apiClient.get(`/ai/accuracy?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch prediction accuracy:', error)
      throw error
    }
  }

  /**
   * Submit feedback on prediction accuracy
   */
  static async submitPredictionFeedback(
    predictionId: string,
    actualOutcome: any,
    feedback: string
  ): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post('/ai/feedback', {
        predictionId,
        actualOutcome,
        feedback
      })
    } catch (error) {
      console.error('Failed to submit prediction feedback:', error)
      throw error
    }
  }

  /**
   * Utility: Get risk level color
   */
  static getRiskLevelColor(riskLevel: string): string {
    const colors = {
      'low': '#22c55e',      // green
      'medium': '#f59e0b',   // amber
      'high': '#ef4444',     // red
      'critical': '#dc2626'  // dark red
    }
    return colors[riskLevel as keyof typeof colors] || '#6b7280'
  }

  /**
   * Utility: Get confidence level description
   */
  static getConfidenceDescription(confidence: number): string {
    if (confidence >= 90) return 'Very High'
    if (confidence >= 75) return 'High'
    if (confidence >= 60) return 'Medium'
    if (confidence >= 40) return 'Low'
    return 'Very Low'
  }

  /**
   * Utility: Format prediction timeline
   */
  static formatPredictionTimeline(days: number): string {
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`
    if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) !== 1 ? 's' : ''}`
    if (days < 365) return `${Math.round(days / 30)} month${Math.round(days / 30) !== 1 ? 's' : ''}`
    return `${Math.round(days / 365)} year${Math.round(days / 365) !== 1 ? 's' : ''}`
  }

  /**
   * Utility: Calculate trend strength
   */
  static calculateTrendStrength(data: number[]): number {
    if (data.length < 2) return 0
    
    let increases = 0
    let decreases = 0
    
    for (let i = 1; i < data.length; i++) {
      if (data[i] > data[i - 1]) increases++
      else if (data[i] < data[i - 1]) decreases++
    }
    
    const total = data.length - 1
    const dominantDirection = Math.max(increases, decreases)
    
    return Math.round((dominantDirection / total) * 100)
  }
}

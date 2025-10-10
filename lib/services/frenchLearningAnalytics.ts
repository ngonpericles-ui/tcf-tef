import { apiClient, ApiResponse } from '@/lib/api-client'

// French Learning Specific Analytics Types
export interface FrenchLearningAnalytics {
  proficiencyDistribution: ProficiencyLevel[]
  tcfTefPerformance: TCFTEFAnalytics
  learningPathProgress: LearningPathData[]
  skillDevelopment: SkillProgressData[]
  cohortAnalysis: CohortData[]
  weaknessAnalysis: WeaknessData[]
  recommendations: LearningRecommendation[]
}

export interface ProficiencyLevel {
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  students: number
  percentage: number
  averageProgress: number
  completionRate: number
  averageTimeToComplete: number // in days
  retentionRate: number
}

export interface TCFTEFAnalytics {
  totalTests: number
  averageScore: number
  passRate: number
  sectionPerformance: TCFTEFSection[]
  scoreDistribution: ScoreRange[]
  improvementTrends: ImprovementData[]
  predictedScores: PredictionData[]
}

export interface TCFTEFSection {
  section: 'comprehension_orale' | 'comprehension_ecrite' | 'expression_orale' | 'expression_ecrite' | 'maitrise_langue'
  averageScore: number
  difficulty: 'easy' | 'medium' | 'hard'
  improvementRate: number
  commonMistakes: string[]
}

export interface ScoreRange {
  range: string
  count: number
  percentage: number
  level: string
}

export interface ImprovementData {
  month: string
  averageImprovement: number
  studentsImproved: number
  studentsDeclined: number
}

export interface PredictionData {
  studentId: string
  currentScore: number
  predictedScore: number
  confidence: number
  timeToTarget: number // days
  recommendedActions: string[]
}

export interface LearningPathData {
  pathName: string
  totalStudents: number
  completionRate: number
  averageCompletionTime: number // days
  successRate: number
  dropoffPoints: DropoffPoint[]
  effectiveness: number // 0-100
}

export interface DropoffPoint {
  lessonId: string
  lessonName: string
  dropoffRate: number
  commonReasons: string[]
}

export interface SkillProgressData {
  skill: 'grammaire' | 'vocabulaire' | 'comprehension_orale' | 'comprehension_ecrite' | 'expression_orale' | 'expression_ecrite' | 'prononciation' | 'culture'
  averageScore: number
  improvement: number
  studentsCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  engagementLevel: number
  timeSpent: number // minutes
}

export interface CohortData {
  cohortId: string
  cohortName: string
  startDate: string
  studentsCount: number
  completionRate: number
  averageProgress: number
  retentionRate: number
  performanceComparison: number // vs platform average
  topPerformers: StudentPerformance[]
  strugglingStudents: StudentPerformance[]
}

export interface StudentPerformance {
  studentId: string
  studentName: string
  currentLevel: string
  progress: number
  lastActivity: string
  strengths: string[]
  weaknesses: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

export interface WeaknessData {
  area: string
  studentsAffected: number
  averageScore: number
  improvementPotential: number
  recommendedResources: string[]
  priority: 'high' | 'medium' | 'low'
}

export interface LearningRecommendation {
  type: 'content' | 'method' | 'pacing' | 'support'
  title: string
  description: string
  targetAudience: string[]
  expectedImpact: number
  implementationEffort: 'low' | 'medium' | 'high'
  priority: 'high' | 'medium' | 'low'
  metrics: string[]
}

export interface StudentEngagementMetrics {
  dailyActiveStudents: number
  weeklyActiveStudents: number
  monthlyActiveStudents: number
  averageSessionDuration: number
  lessonsCompleted: number
  exercisesCompleted: number
  streakDays: number
  engagementScore: number
}

export interface ContentEffectivenessData {
  contentId: string
  contentType: 'lesson' | 'exercise' | 'quiz' | 'video' | 'audio'
  title: string
  views: number
  completions: number
  averageRating: number
  timeSpent: number
  learningOutcome: number
  difficulty: number
  engagement: number
}

export class FrenchLearningAnalyticsService {
  /**
   * Get comprehensive French learning analytics
   */
  static async getFrenchLearningAnalytics(
    timeframe: string = '30d',
    level?: string,
    cohort?: string
  ): Promise<ApiResponse<FrenchLearningAnalytics>> {
    try {
      const params = new URLSearchParams({ timeframe })
      if (level) params.append('level', level)
      if (cohort) params.append('cohort', cohort)
      
      return await apiClient.get(`/analytics/french-learning?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch French learning analytics:', error)
      throw error
    }
  }

  /**
   * Get proficiency level distribution
   */
  static async getProficiencyDistribution(
    timeframe: string = '30d'
  ): Promise<ApiResponse<ProficiencyLevel[]>> {
    try {
      return await apiClient.get(`/analytics/proficiency-distribution?timeframe=${timeframe}`)
    } catch (error) {
      console.error('Failed to fetch proficiency distribution:', error)
      throw error
    }
  }

  /**
   * Get TCF/TEF performance analytics
   */
  static async getTCFTEFAnalytics(
    timeframe: string = '30d',
    testType?: 'TCF' | 'TEF'
  ): Promise<ApiResponse<TCFTEFAnalytics>> {
    try {
      const params = new URLSearchParams({ timeframe })
      if (testType) params.append('testType', testType)
      
      return await apiClient.get(`/analytics/tcf-tef?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch TCF/TEF analytics:', error)
      throw error
    }
  }

  /**
   * Get learning path analytics
   */
  static async getLearningPathAnalytics(
    timeframe: string = '30d'
  ): Promise<ApiResponse<LearningPathData[]>> {
    try {
      return await apiClient.get(`/analytics/learning-paths?timeframe=${timeframe}`)
    } catch (error) {
      console.error('Failed to fetch learning path analytics:', error)
      throw error
    }
  }

  /**
   * Get skill development analytics
   */
  static async getSkillDevelopmentAnalytics(
    timeframe: string = '30d',
    skill?: string
  ): Promise<ApiResponse<SkillProgressData[]>> {
    try {
      const params = new URLSearchParams({ timeframe })
      if (skill) params.append('skill', skill)
      
      return await apiClient.get(`/analytics/skill-development?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch skill development analytics:', error)
      throw error
    }
  }

  /**
   * Get cohort analysis
   */
  static async getCohortAnalysis(
    timeframe: string = '30d',
    cohortId?: string
  ): Promise<ApiResponse<CohortData[]>> {
    try {
      const params = new URLSearchParams({ timeframe })
      if (cohortId) params.append('cohortId', cohortId)
      
      return await apiClient.get(`/analytics/cohorts?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch cohort analysis:', error)
      throw error
    }
  }

  /**
   * Get student engagement metrics
   */
  static async getStudentEngagementMetrics(
    timeframe: string = '30d'
  ): Promise<ApiResponse<StudentEngagementMetrics>> {
    try {
      return await apiClient.get(`/analytics/student-engagement?timeframe=${timeframe}`)
    } catch (error) {
      console.error('Failed to fetch student engagement metrics:', error)
      throw error
    }
  }

  /**
   * Get content effectiveness data
   */
  static async getContentEffectiveness(
    timeframe: string = '30d',
    contentType?: string
  ): Promise<ApiResponse<ContentEffectivenessData[]>> {
    try {
      const params = new URLSearchParams({ timeframe })
      if (contentType) params.append('contentType', contentType)
      
      return await apiClient.get(`/analytics/content-effectiveness?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch content effectiveness:', error)
      throw error
    }
  }

  /**
   * Get learning recommendations
   */
  static async getLearningRecommendations(
    userRole: string,
    targetAudience?: string[]
  ): Promise<ApiResponse<LearningRecommendation[]>> {
    try {
      const params = new URLSearchParams({ userRole })
      if (targetAudience) {
        targetAudience.forEach(audience => params.append('targetAudience', audience))
      }
      
      return await apiClient.get(`/analytics/recommendations?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch learning recommendations:', error)
      throw error
    }
  }

  /**
   * Generate learning insights report
   */
  static async generateLearningInsightsReport(
    reportConfig: {
      timeframe: string
      includeStudentData: boolean
      includePredictions: boolean
      format: 'pdf' | 'xlsx' | 'csv'
    }
  ): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post('/analytics/learning-insights-report', reportConfig)
    } catch (error) {
      console.error('Failed to generate learning insights report:', error)
      throw error
    }
  }

  /**
   * Utility: Get CEFR level color
   */
  static getCEFRLevelColor(level: string): string {
    const colors = {
      'A1': '#22c55e', // green
      'A2': '#84cc16', // lime
      'B1': '#eab308', // yellow
      'B2': '#f97316', // orange
      'C1': '#ef4444', // red
      'C2': '#8b5cf6'  // purple
    }
    return colors[level as keyof typeof colors] || '#6b7280'
  }

  /**
   * Utility: Format skill name for display
   */
  static formatSkillName(skill: string, language: 'fr' | 'en' = 'fr'): string {
    const translations = {
      'grammaire': { fr: 'Grammaire', en: 'Grammar' },
      'vocabulaire': { fr: 'Vocabulaire', en: 'Vocabulary' },
      'comprehension_orale': { fr: 'Compréhension orale', en: 'Listening Comprehension' },
      'comprehension_ecrite': { fr: 'Compréhension écrite', en: 'Reading Comprehension' },
      'expression_orale': { fr: 'Expression orale', en: 'Speaking' },
      'expression_ecrite': { fr: 'Expression écrite', en: 'Writing' },
      'prononciation': { fr: 'Prononciation', en: 'Pronunciation' },
      'culture': { fr: 'Culture française', en: 'French Culture' }
    }
    
    return translations[skill as keyof typeof translations]?.[language] || skill
  }

  /**
   * Utility: Calculate learning velocity
   */
  static calculateLearningVelocity(
    currentLevel: string,
    startLevel: string,
    daysSinceStart: number
  ): number {
    const levelValues = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 }
    const current = levelValues[currentLevel as keyof typeof levelValues] || 1
    const start = levelValues[startLevel as keyof typeof levelValues] || 1
    
    return daysSinceStart > 0 ? (current - start) / daysSinceStart : 0
  }
}

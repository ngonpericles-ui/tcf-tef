"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts"
import {
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Target,
  Brain,
  Globe,
  MessageCircle,
  Headphones,
  PenTool,
  Eye,
  Mic,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { 
  FrenchLearningAnalyticsService,
  type FrenchLearningAnalytics,
  type ProficiencyLevel,
  type TCFTEFAnalytics,
  type SkillProgressData,
  type CohortData
} from "@/lib/services/frenchLearningAnalytics"

interface FrenchLearningAnalyticsProps {
  timeframe: string
  userRole: 'ADMIN' | 'SENIOR_MANAGER' | 'JUNIOR_MANAGER'
  className?: string
}

export default function FrenchLearningAnalytics({
  timeframe,
  userRole,
  className = ""
}: FrenchLearningAnalyticsProps) {
  const { t } = useLanguage()
  
  const [analyticsData, setAnalyticsData] = useState<FrenchLearningAnalytics | null>(null)
  const [proficiencyData, setProficiencyData] = useState<ProficiencyLevel[]>([])
  const [tcfTefData, setTcfTefData] = useState<TCFTEFAnalytics | null>(null)
  const [skillsData, setSkillsData] = useState<SkillProgressData[]>([])
  const [cohortData, setCohortData] = useState<CohortData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load French learning analytics
  useEffect(() => {
    const loadFrenchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)

        const [
          analyticsResponse,
          proficiencyResponse,
          tcfTefResponse,
          skillsResponse,
          cohortResponse
        ] = await Promise.allSettled([
          FrenchLearningAnalyticsService.getFrenchLearningAnalytics(timeframe),
          FrenchLearningAnalyticsService.getProficiencyDistribution(timeframe),
          FrenchLearningAnalyticsService.getTCFTEFAnalytics(timeframe),
          FrenchLearningAnalyticsService.getSkillDevelopmentAnalytics(timeframe),
          FrenchLearningAnalyticsService.getCohortAnalysis(timeframe)
        ])

        // Process analytics data
        if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value.success) {
          setAnalyticsData(analyticsResponse.value.data)
        }

        // Process proficiency data
        if (proficiencyResponse.status === 'fulfilled' && proficiencyResponse.value.success) {
          setProficiencyData(proficiencyResponse.value.data)
        }

        // Process TCF/TEF data
        if (tcfTefResponse.status === 'fulfilled' && tcfTefResponse.value.success) {
          setTcfTefData(tcfTefResponse.value.data)
        }

        // Process skills data
        if (skillsResponse.status === 'fulfilled' && skillsResponse.value.success) {
          setSkillsData(skillsResponse.value.data)
        }

        // Process cohort data
        if (cohortResponse.status === 'fulfilled' && cohortResponse.value.success) {
          setCohortData(cohortResponse.value.data)
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : t('Erreur inconnue', 'Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    loadFrenchAnalytics()
  }, [timeframe, t])

  // Get skill icon
  const getSkillIcon = (skill: string) => {
    const icons = {
      'grammaire': Brain,
      'vocabulaire': BookOpen,
      'comprehension_orale': Headphones,
      'comprehension_ecrite': Eye,
      'expression_orale': Mic,
      'expression_ecrite': PenTool,
      'prononciation': MessageCircle,
      'culture': Globe
    }
    return icons[skill as keyof typeof icons] || BookOpen
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          {t("Chargement des analyses d'apprentissage...", "Loading learning analytics...")}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive ${className}`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* CEFR Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t('Répartition par niveau CECRL', 'CEFR Level Distribution')}
          </CardTitle>
          <CardDescription>
            {t('Distribution des étudiants selon les niveaux du Cadre européen', 'Student distribution by European Framework levels')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {proficiencyData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={proficiencyData.map(level => ({
                      name: level.level,
                      value: level.students,
                      percentage: level.percentage,
                      color: FrenchLearningAnalyticsService.getCEFRLevelColor(level.level)
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {proficiencyData.map((level, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={FrenchLearningAnalyticsService.getCEFRLevelColor(level.level)} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any, props: any) => [
                      `${value} ${t('étudiants', 'students')} (${props.payload.percentage}%)`,
                      `Niveau ${name}`
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Level Details */}
              <div className="space-y-4">
                {proficiencyData.map((level) => (
                  <div key={level.level} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        style={{ 
                          borderColor: FrenchLearningAnalyticsService.getCEFRLevelColor(level.level),
                          color: FrenchLearningAnalyticsService.getCEFRLevelColor(level.level)
                        }}
                      >
                        {level.level}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {level.students} {t('étudiants', 'students')} ({level.percentage}%)
                      </span>
                    </div>
                    <Progress 
                      value={level.averageProgress} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t('Progression moyenne', 'Average progress')}: {level.averageProgress}%</span>
                      <span>{t('Taux de réussite', 'Success rate')}: {level.completionRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('Aucune donnée de niveau disponible', 'No level data available')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TCF/TEF Performance */}
      {tcfTefData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {t('Performance TCF/TEF', 'TCF/TEF Performance')}
            </CardTitle>
            <CardDescription>
              {t('Analyse des résultats aux tests officiels', 'Official test results analysis')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-500">{tcfTefData.totalTests}</div>
                  <p className="text-sm text-muted-foreground">{t('Tests passés', 'Tests taken')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-500">{tcfTefData.averageScore}</div>
                  <p className="text-sm text-muted-foreground">{t('Score moyen', 'Average score')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-500">{tcfTefData.passRate}%</div>
                  <p className="text-sm text-muted-foreground">{t('Taux de réussite', 'Pass rate')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Section Performance */}
            {tcfTefData.sectionPerformance && tcfTefData.sectionPerformance.length > 0 && (
              <div>
                <h4 className="font-semibold mb-4">{t('Performance par section', 'Performance by section')}</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tcfTefData.sectionPerformance.map(section => ({
                    section: FrenchLearningAnalyticsService.formatSkillName(section.section),
                    score: section.averageScore,
                    improvement: section.improvementRate
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="section" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Skills Development Radar */}
      {skillsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {t('Développement des compétences', 'Skills Development')}
            </CardTitle>
            <CardDescription>
              {t('Progression dans les différentes compétences linguistiques', 'Progress in different language skills')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={skillsData.map(skill => ({
                  skill: FrenchLearningAnalyticsService.formatSkillName(skill.skill),
                  score: skill.averageScore,
                  improvement: skill.improvement
                }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name={t('Score moyen', 'Average score')}
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>

              {/* Skills List */}
              <div className="space-y-4">
                {skillsData.map((skill) => {
                  const SkillIcon = getSkillIcon(skill.skill)
                  return (
                    <div key={skill.skill} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <SkillIcon className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">
                            {FrenchLearningAnalyticsService.formatSkillName(skill.skill)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {skill.studentsCount} {t('étudiants', 'students')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{skill.averageScore}/100</div>
                        <div className={`text-sm flex items-center gap-1 ${
                          skill.improvement > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {skill.improvement > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingUp className="h-3 w-3 rotate-180" />
                          )}
                          {Math.abs(skill.improvement)}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cohort Analysis */}
      {cohortData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('Analyse des cohortes', 'Cohort Analysis')}
            </CardTitle>
            <CardDescription>
              {t('Performance comparative des groupes d\'étudiants', 'Comparative performance of student groups')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cohortData.map((cohort) => (
                <div key={cohort.cohortId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{cohort.cohortName}</h4>
                    <Badge variant={cohort.performanceComparison > 0 ? "default" : "secondary"}>
                      {cohort.performanceComparison > 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{cohort.performanceComparison}%
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                          {cohort.performanceComparison}%
                        </>
                      )}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t('Étudiants', 'Students')}</p>
                      <p className="font-semibold">{cohort.studentsCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('Taux de réussite', 'Completion rate')}</p>
                      <p className="font-semibold">{cohort.completionRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('Progression', 'Progress')}</p>
                      <p className="font-semibold">{cohort.averageProgress}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('Rétention', 'Retention')}</p>
                      <p className="font-semibold">{cohort.retentionRate}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

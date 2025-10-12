"use client"

import { useState, useEffect } from "react"

// Generate static params for static export
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Share2,
  RotateCcw,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  Lightbulb,
  FileText
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface SectionResult {
  name: string
  score: number
  maxScore: number
  percentage: number
  timeSpent: number
  questions: QuestionResult[]
}

interface QuestionResult {
  id: string
  questionText: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  points: number
  explanation?: string
  section: string
}

interface SimulationResult {
  id: string
  simulationTitle: string
  totalScore: number
  maxScore: number
  percentage: number
  grade: string
  level: string
  timeSpent: number
  completedAt: string
  sections: SectionResult[]
  overallFeedback: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  certificateUrl?: string
  teacherFeedbackId?: string
}

interface AITeacherFeedback {
  id: string
  overallScore: number
  maxScore: number
  confidence: number
  canGradeTo100Percent: boolean
  overallFeedback: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  detailedAnalysis: {
    questionAnalysis: Array<{
      questionId: string
      studentAnswer: string
      correctAnswer?: string
      isCorrect: boolean
      points: number
      maxPoints: number
      teacherComments: string
      mistakeType?: string
      correction?: string
      explanation?: string
    }>
    sectionAnalysis: Array<{
      section: string
      score: number
      maxScore: number
      feedback: string
    }>
    unclearResponses: string[]
    uniqueLanguageStyles: string[]
    grammarErrors: Array<{
      error: string
      correction: string
      explanation: string
    }>
    vocabularyNotes: Array<{
      word: string
      usage: string
      suggestion: string
    }>
  }
  status: string
  createdAt: string
}

interface APIResponse<T> {
  success: boolean
  data: T
  error?: string
  message?: string
}

interface TeacherFeedbackResponse {
  id: string
  overallScore: number
  maxScore: number
  confidence: number
  canGradeTo100Percent: boolean
  overallFeedback: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  detailedAnalysis: any
  status: string
  createdAt: string
}

interface LevelAssessmentResponse {
  id: string
  determinedLevel: string
  confidence: number
  subLevel: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  detailedAnalysis: any
}

export default function SimulationResultsPage() {
  const params = useParams()
  const router = useRouter()
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const [result, setResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [aiAssessment, setAiAssessment] = useState<any>(null)
  const [assessmentLoading, setAssessmentLoading] = useState(false)
  const [teacherFeedback, setTeacherFeedback] = useState<AITeacherFeedback | null>(null)
  const [teacherFeedbackLoading, setTeacherFeedbackLoading] = useState(false)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get(`/simulations/results/${params.id}`)
        const apiResponse = response.data as APIResponse<SimulationResult>
        if (apiResponse.success) {
          const resultData = apiResponse.data
          setResult(resultData)

          // Trigger AI Level Assessment after fetching results
          await performLevelAssessment(resultData)

          // Load AI Teacher Feedback if available
          if (resultData.teacherFeedbackId) {
            await loadTeacherFeedback(resultData.teacherFeedbackId)
          }
        }
      } catch (error) {
        console.error('Error fetching results:', error)
        toast.error(t("Erreur lors du chargement des résultats", "Error loading results"))
        router.push('/tcf-tef-simulation')
      } finally {
        setLoading(false)
      }
    }

    const performLevelAssessment = async (resultData: any) => {
      try {
        console.log('🎯 Starting AI Level Assessment for simulation:', params.id)

        // Prepare assessment data
        const assessmentData = {
          simulationId: params.id,
          testLevel: resultData.level || 'B1', // Level of the test taken
          score: resultData.percentage || 0,
          totalQuestions: resultData.sections?.reduce((total: number, section: any) => total + (section.totalQuestions || 0), 0) || 0,
          correctAnswers: resultData.sections?.reduce((total: number, section: any) => total + (section.correctAnswers || 0), 0) || 0,
          timeSpent: resultData.timeSpent || 0,
          answers: [], // Could be enhanced to include detailed answers
          sectionScores: resultData.sections?.reduce((scores: any, section: any) => {
            scores[section.name] = {
              score: section.score || 0,
              percentage: section.percentage || 0,
              correctAnswers: section.correctAnswers || 0,
              totalQuestions: section.totalQuestions || 0
            }
            return scores
          }, {}) || {}
        }

        // Call AI Level Assessment API
        const assessmentResponse = await apiClient.post('/simulations/assess-level', assessmentData)
        const assessmentApiResponse = assessmentResponse as APIResponse<{ assessment: LevelAssessmentResponse }>

        if (assessmentApiResponse.success) {
          console.log('✅ AI Level Assessment completed successfully:', assessmentApiResponse.data)
          setAiAssessment(assessmentApiResponse.data.assessment)
          toast.success(t(
            "Votre niveau a été évalué par notre IA ! Consultez les détails ci-dessous.",
            "Your level has been assessed by our AI! Check the details below."
          ))
        } else {
          console.warn('⚠️ Level assessment completed but with warnings:', assessmentResponse)
        }
      } catch (error) {
        console.error('❌ Error during level assessment:', error)
        // Don't show error to user as this is a background process
        // The main results are still displayed successfully
      }
    }

    const loadTeacherFeedback = async (feedbackId: string) => {
      try {
        setTeacherFeedbackLoading(true)
        const response = await apiClient.get(`/ai/feedbacks/${feedbackId}`)
        const apiResponse = response.data as APIResponse<TeacherFeedbackResponse>
        if (apiResponse.success) {
          setTeacherFeedback(apiResponse.data)
        }
      } catch (error) {
        console.error('Error loading teacher feedback:', error)
        // Don't show error to user as this is supplementary data
      } finally {
        setTeacherFeedbackLoading(false)
      }
    }

    if (params.id) {
      fetchResults()
    }
  }, [params.id, router, t])

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-blue-600"
    if (percentage >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const getGradeBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default"
    if (percentage >= 60) return "secondary"
    return "destructive"
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  const downloadCertificate = async () => {
    if (!result?.certificateUrl) return
    
    try {
      const response = await fetch(result.certificateUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificat-${result.simulationTitle}-${result.completedAt}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(t("Certificat téléchargé", "Certificate downloaded"))
    } catch (error) {
      toast.error(t("Erreur lors du téléchargement", "Download error"))
    }
  }

  const shareResults = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("Mes résultats TCF/TEF", "My TCF/TEF Results"),
          text: t(`J'ai obtenu ${result?.percentage}% à la simulation ${result?.simulationTitle}`, 
                  `I scored ${result?.percentage}% on the ${result?.simulationTitle} simulation`),
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success(t("Lien copié dans le presse-papiers", "Link copied to clipboard"))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("Chargement des résultats...", "Loading results...")}</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("Résultats non trouvés", "Results not found")}</h2>
          <p className="text-muted-foreground mb-4">{t("Les résultats demandés n'existent pas", "The requested results do not exist")}</p>
          <Button onClick={() => router.push('/tcf-tef-simulation')}>
            {t("Retour aux simulations", "Back to simulations")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => router.push('/tcf-tef-simulation')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour aux simulations", "Back to simulations")}
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={shareResults}>
                <Share2 className="w-4 h-4 mr-2" />
                {t("Partager", "Share")}
              </Button>
              
              {result.certificateUrl && (
                <Button onClick={downloadCertificate}>
                  <Download className="w-4 h-4 mr-2" />
                  {t("Certificat", "Certificate")}
                </Button>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">{result.simulationTitle}</h1>
            <p className="text-muted-foreground">{t("Résultats de simulation", "Simulation Results")}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <Trophy className={`w-12 h-12 mx-auto mb-4 ${getGradeColor(result.percentage)}`} />
              <div className="text-3xl font-bold mb-2">{result.percentage}%</div>
              <Badge variant={getGradeBadgeVariant(result.percentage)} className="mb-2">
                {result.grade}
              </Badge>
              <p className="text-sm text-muted-foreground">{t("Score global", "Overall Score")}</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Target className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <div className="text-3xl font-bold mb-2">{result.level}</div>
              <p className="text-sm text-muted-foreground">{t("Niveau atteint", "Level achieved")}</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Clock className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <div className="text-3xl font-bold mb-2">{formatTime(result.timeSpent)}</div>
              <p className="text-sm text-muted-foreground">{t("Temps passé", "Time spent")}</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <div className="text-3xl font-bold mb-2">{result.totalScore}/{result.maxScore}</div>
              <p className="text-sm text-muted-foreground">{t("Points obtenus", "Points earned")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">{t("Vue d'ensemble", "Overview")}</TabsTrigger>
            <TabsTrigger value="sections">{t("Par section", "By Section")}</TabsTrigger>
            <TabsTrigger value="questions">{t("Questions", "Questions")}</TabsTrigger>
            <TabsTrigger value="ai-assessment" className="relative">
              {t("Évaluation IA", "AI Assessment")}
              {aiAssessment && (
                <Badge className="ml-2 bg-green-500 text-white text-xs px-1 py-0">
                  {t("Nouveau", "New")}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="teacher-feedback" className="relative">
              {t("Feedback Professeur", "Teacher Feedback")}
              {teacherFeedback && (
                <Badge className="ml-2 bg-blue-500 text-white text-xs px-1 py-0">
                  {t("IA", "AI")}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="feedback">{t("Conseils", "Feedback")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {t("Performance par section", "Performance by Section")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.sections.map((section, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{section.name}</span>
                        <span className={`font-semibold ${getGradeColor(section.percentage)}`}>
                          {section.percentage}%
                        </span>
                      </div>
                      <Progress value={section.percentage} className="h-2" />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{section.score}/{section.maxScore} {t("points", "points")}</span>
                        <span>{formatTime(section.timeSpent)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Commentaire général", "Overall Feedback")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{result.overallFeedback}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6">
            {result.sections.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{section.name}</CardTitle>
                    <Badge variant={getGradeBadgeVariant(section.percentage)}>
                      {section.percentage}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{section.score}/{section.maxScore}</div>
                      <p className="text-sm text-muted-foreground">{t("Points", "Points")}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatTime(section.timeSpent)}</div>
                      <p className="text-sm text-muted-foreground">{t("Temps", "Time")}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{section.questions.length}</div>
                      <p className="text-sm text-muted-foreground">{t("Questions", "Questions")}</p>
                    </div>
                  </div>
                  
                  <Progress value={section.percentage} className="h-3" />
                  
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{section.questions.filter(q => q.isCorrect).length} {t("correctes", "correct")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>{section.questions.filter(q => !q.isCorrect).length} {t("incorrectes", "incorrect")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            {result.sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h3 className="text-lg font-semibold mb-4">{section.name}</h3>
                <div className="space-y-4">
                  {section.questions.map((question, questionIndex) => (
                    <Card key={question.id} className={question.isCorrect ? "border-green-200" : "border-red-200"}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {question.isCorrect ? (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                              <XCircle className="w-6 h-6 text-red-600" />
                            )}
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {t("Question", "Question")} {questionIndex + 1}
                              </span>
                              <Badge variant="outline">{question.points} {t("pts", "pts")}</Badge>
                            </div>
                            
                            <p className="text-sm">{question.questionText}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">{t("Votre réponse:", "Your answer:")}</span>
                                <p className={question.isCorrect ? "text-green-600" : "text-red-600"}>
                                  {question.userAnswer || t("Pas de réponse", "No answer")}
                                </p>
                              </div>
                              
                              {!question.isCorrect && (
                                <div>
                                  <span className="font-medium">{t("Réponse correcte:", "Correct answer:")}</span>
                                  <p className="text-green-600">{question.correctAnswer}</p>
                                </div>
                              )}
                            </div>
                            
                            {question.explanation && (
                              <div className="bg-muted p-3 rounded-lg">
                                <span className="font-medium text-sm">{t("Explication:", "Explanation:")}</span>
                                <p className="text-sm mt-1">{question.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="ai-assessment" className="space-y-6">
            {aiAssessment ? (
              <div className="space-y-6">
                {/* AI Level Determination */}
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Brain className="w-5 h-5" />
                      {t("Niveau déterminé par l'IA", "AI-Determined Level")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {aiAssessment.determinedLevel}.{aiAssessment.subLevel}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t("Niveau CECRL", "CEFR Level")}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {Math.round(aiAssessment.confidence * 100)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t("Confiance", "Confidence")}
                        </div>
                      </div>
                    </div>
                    <Progress
                      value={aiAssessment.confidence * 100}
                      className="h-3 mb-2"
                    />
                    <div className="text-sm text-muted-foreground text-center">
                      {aiAssessment.confidence >= 0.9 ?
                        t("Évaluation très fiable", "Very reliable assessment") :
                        aiAssessment.confidence >= 0.8 ?
                        t("Évaluation fiable", "Reliable assessment") :
                        t("Évaluation modérée", "Moderate assessment")
                      }
                    </div>
                  </CardContent>
                </Card>

                {/* Strengths and Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        {t("Points forts identifiés", "Identified Strengths")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {aiAssessment.strengths?.map((strength: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="w-5 h-5" />
                        {t("Axes d'amélioration", "Areas for Improvement")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {aiAssessment.weaknesses?.map((weakness: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-600">
                      <Lightbulb className="w-5 h-5" />
                      {t("Recommandations personnalisées", "Personalized Recommendations")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-purple-600">
                          {t("Actions recommandées", "Recommended Actions")}
                        </h4>
                        <ul className="space-y-2">
                          {aiAssessment.recommendations?.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-blue-600">
                          {t("Pour atteindre le niveau suivant", "To reach the next level")}
                        </h4>
                        <ul className="space-y-2">
                          {aiAssessment.nextLevelRequirements?.map((req: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{req}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <div className="text-sm font-medium text-blue-600 mb-1">
                            {t("Temps estimé", "Estimated Time")}
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            {aiAssessment.estimatedTimeToNext}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Analysis */}
                {aiAssessment.detailedAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-600">
                        <FileText className="w-5 h-5" />
                        {t("Analyse détaillée", "Detailed Analysis")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {aiAssessment.detailedAnalysis.reasoning && (
                          <div>
                            <h4 className="font-medium mb-2">{t("Raisonnement", "Reasoning")}</h4>
                            <p className="text-sm text-muted-foreground">
                              {aiAssessment.detailedAnalysis.reasoning}
                            </p>
                          </div>
                        )}
                        {aiAssessment.detailedAnalysis.confidenceFactors && (
                          <div>
                            <h4 className="font-medium mb-2">{t("Facteurs de confiance", "Confidence Factors")}</h4>
                            <div className="flex flex-wrap gap-2">
                              {aiAssessment.detailedAnalysis.confidenceFactors.map((factor: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    {assessmentLoading ?
                      t("Évaluation en cours...", "Assessment in progress...") :
                      t("Évaluation IA en attente", "AI Assessment Pending")
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {assessmentLoading ?
                      t("Notre IA analyse votre performance...", "Our AI is analyzing your performance...") :
                      t("L'évaluation IA sera disponible sous peu.", "AI assessment will be available shortly.")
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    {t("Points forts", "Strengths")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="w-5 h-5" />
                    {t("Points à améliorer", "Areas for Improvement")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  {t("Recommandations", "Recommendations")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm leading-relaxed">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teacher-feedback" className="space-y-6">
            {teacherFeedback ? (
              <div className="space-y-6">
                {/* AI Teacher Overview */}
                <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-600">
                      <BookOpen className="w-5 h-5" />
                      {t("Feedback de votre Professeur IA", "AI Teacher Feedback")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-1">
                          {teacherFeedback.overallScore}/{teacherFeedback.maxScore}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t("Score du professeur", "Teacher Score")}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {Math.round(teacherFeedback.confidence * 100)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t("Confiance IA", "AI Confidence")}
                        </div>
                      </div>
                      <div className="text-center">
                        <Badge variant={teacherFeedback.canGradeTo100Percent ? "default" : "secondary"}>
                          {teacherFeedback.canGradeTo100Percent
                            ? t("Notation complète", "Full Grading")
                            : t("Révision humaine", "Human Review")
                          }
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                      <h4 className="font-semibold mb-2 text-purple-600">
                        {t("Commentaire général du professeur", "Teacher's Overall Comment")}
                      </h4>
                      <p className="text-sm leading-relaxed">{teacherFeedback.overallFeedback}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Teacher's Detailed Analysis */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        {t("Ce que vous faites bien", "What you do well")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {teacherFeedback.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="w-5 h-5" />
                        {t("Points à travailler", "Areas to work on")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {teacherFeedback.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Grammar Errors */}
                {teacherFeedback.detailedAnalysis.grammarErrors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-5 h-5" />
                        {t("Erreurs de grammaire", "Grammar Errors")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {teacherFeedback.detailedAnalysis.grammarErrors.map((error, index) => (
                          <div key={index} className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200">
                            <div className="flex items-start gap-2">
                              <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                  {t("Erreur", "Error")}: {error.error}
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                  {t("Correction", "Correction")}: {error.correction}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {error.explanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Teacher's Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Lightbulb className="w-5 h-5" />
                      {t("Conseils du professeur", "Teacher's Advice")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {teacherFeedback.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm leading-relaxed">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Submission to Tutor Option */}
                {!teacherFeedback.canGradeTo100Percent && teacherFeedback.confidence >= 0.9 && (
                  <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-600">
                        <FileText className="w-5 h-5" />
                        {t("Révision par un tuteur humain", "Human Tutor Review")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">
                        {t(
                          "Ce travail nécessite une révision humaine pour une évaluation complète. Vous pouvez soumettre ce feedback à un tuteur sur notre marketplace.",
                          "This work requires human review for complete evaluation. You can submit this feedback to a tutor on our marketplace."
                        )}
                      </p>
                      <Button
                        onClick={() => router.push(`/expertise?feedbackId=${teacherFeedback.id}`)}
                        className="w-full"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {t("Soumettre à un tuteur", "Submit to Tutor")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : teacherFeedbackLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  {t("Chargement du feedback du professeur...", "Loading teacher feedback...")}
                </p>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {t("Aucun feedback de professeur disponible pour cette simulation.", "No teacher feedback available for this simulation.")}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button variant="outline" onClick={() => router.push('/tcf-tef-simulation')}>
            <RotateCcw className="w-4 h-4 mr-2" />
            {t("Nouvelle simulation", "New Simulation")}
          </Button>
          
          <Button onClick={() => router.push('/tests/results')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            {t("Tous mes résultats", "All my results")}
          </Button>
        </div>
      </div>
    </div>
  )
}

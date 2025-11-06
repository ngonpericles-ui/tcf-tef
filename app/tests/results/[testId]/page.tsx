"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Trophy, 
  Clock, 
  Target, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  BarChart3,
  Brain,
  Award,
  BookOpen
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"

interface TestResult {
  id: string
  testId: string
  testTitle: string
  testDescription: string
  score: number
  maxScore: number
  percentage: number
  status: string
  startedAt: string
  completedAt: string
  duration: number
  correctAnswers: number
  totalQuestions: number
  feedback?: string
  questions: Array<{
    id: string
    questionText: string
    type: string
    options?: string[]
    correctAnswer: any
    userAnswer: any
    isCorrect: boolean
    points: number
    explanation?: string
  }>
}

export default function TestResultsPage() {
  const params = useParams()
  const router = useRouter()
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        const attemptId = params?.testId as string // This is actually the attempt ID now
        if (!attemptId) return
        
        console.log('🔍 Fetching test results for attempt:', attemptId)
        console.log('🔍 API endpoint:', `/tests/attempts/${attemptId}`)
        const response = await apiClient.get(`/tests/attempts/${attemptId}`)
        console.log('🔍 Test results response:', response)
        
        if (response.success) {
          const attempt = response.data.attempt
          console.log('🔍 Attempt data:', attempt)
          console.log('🔍 Attempt score:', attempt.score)
          console.log('🔍 Attempt percentage:', attempt.percentage)
          console.log('🔍 Attempt questions:', attempt.questions)
          console.log('🔍 Questions structure:', attempt.questions?.map(q => ({ 
            questionId: q.question?.id, 
            questionText: q.question?.questionText,
            userAnswer: q.userAnswer,
            isCorrect: q.isCorrect 
          })))
          
          // Calculate values from the attempt data
          const totalQuestions = attempt.questions?.length || 0
          const correctAnswers = attempt.questions?.filter((qa: any) => qa.isCorrect).length || 0
          const totalPoints = attempt.questions?.reduce((sum: number, qa: any) => sum + (qa.question?.points || 0), 0) || 0
          const earnedPoints = attempt.questions?.reduce((sum: number, qa: any) => sum + (qa.isCorrect ? (qa.question?.points || 0) : 0), 0) || 0
          const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
          
          console.log('🔍 Calculated values:', {
            totalQuestions,
            correctAnswers,
            totalPoints,
            earnedPoints,
            percentage,
            timeSpent: attempt.timeSpent,
            startedAt: attempt.startedAt,
            completedAt: attempt.completedAt
          })
          
          // Transform the attempt data to match our TestResult interface
          const testResult: TestResult = {
            id: attempt.id,
            testId: attempt.testId,
            testTitle: attempt.test.title,
            testDescription: attempt.test.description || '',
            score: earnedPoints,
            maxScore: totalPoints,
            percentage: percentage,
            status: attempt.status,
            startedAt: attempt.startedAt,
            completedAt: attempt.completedAt || new Date().toISOString(),
            duration: attempt.timeSpent || 0,
            correctAnswers: correctAnswers,
            totalQuestions: totalQuestions,
            feedback: attempt.feedback,
            questions: attempt.questions?.map((qa: any) => {
              // Convert user answer from index to actual text for display
              let displayUserAnswer = qa.userAnswer;
              if (qa.question?.type === 'multiple-choice' && qa.question?.options && typeof qa.userAnswer === 'string') {
                const answerIndex = parseInt(qa.userAnswer);
                if (!isNaN(answerIndex) && qa.question.options[answerIndex]) {
                  displayUserAnswer = qa.question.options[answerIndex];
                }
              }
              
              return {
                id: qa.question?.id,
                questionText: qa.question?.questionText,
                type: qa.question?.type,
                options: qa.question?.options,
                correctAnswer: qa.question?.correctAnswer,
                userAnswer: displayUserAnswer,
                isCorrect: qa.isCorrect,
                points: qa.question?.points,
                explanation: qa.question?.explanation
              };
            }) || []
          }
          
          console.log('🔍 Final test result:', testResult)
          setResult(testResult)
        }
      } catch (error) {
        console.error('Error fetching test results:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params?.testId) {
      fetchResults()
    }
  }, [params?.testId])

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default"
    if (percentage >= 60) return "secondary"
    return "destructive"
  }

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return "Excellent"
    if (percentage >= 80) return "Très bien"
    if (percentage >= 70) return "Bien"
    if (percentage >= 60) return "Satisfaisant"
    return "À améliorer"
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t("Chargement des résultats...", "Loading results...")}</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">{t("Résultats non trouvés", "Results not found")}</p>
          <Button onClick={() => router.back()}>{t("Retour", "Back")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{result.testTitle}</h1>
              <p className="text-muted-foreground">{result.testDescription}</p>
            </div>
          </div>
          <Badge variant={getScoreBadgeVariant(result.percentage)} className="text-lg px-4 py-2">
            {result.percentage}%
          </Badge>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <Trophy className={`w-12 h-12 mx-auto mb-4 ${getScoreColor(result.percentage)}`} />
              <div className="text-3xl font-bold mb-2">{result.percentage}%</div>
              <Badge variant={getScoreBadgeVariant(result.percentage)} className="mb-2">
                {getGrade(result.percentage)}
              </Badge>
              <p className="text-sm text-muted-foreground">{t("Score global", "Overall Score")}</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Target className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <div className="text-3xl font-bold mb-2">{result.correctAnswers}/{result.totalQuestions}</div>
              <p className="text-sm text-muted-foreground">{t("Bonnes réponses", "Correct answers")}</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Clock className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <div className="text-3xl font-bold mb-2">{formatTime(result.duration)}</div>
              <p className="text-sm text-muted-foreground">{t("Temps passé", "Time spent")}</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <div className="text-3xl font-bold mb-2">{result.score}/{result.maxScore}</div>
              <p className="text-sm text-muted-foreground">{t("Points obtenus", "Points earned")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        <Tabs defaultValue="questions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="questions">
              <BookOpen className="w-4 h-4 mr-2" />
              {t("Questions", "Questions")}
            </TabsTrigger>
            <TabsTrigger value="analysis">
              <Brain className="w-4 h-4 mr-2" />
              {t("Analyse", "Analysis")}
            </TabsTrigger>
            {result.feedback && (
              <TabsTrigger value="feedback">
                <Award className="w-4 h-4 mr-2" />
                {t("Retour IA", "AI Feedback")}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="questions" className="space-y-6">
            <div className="space-y-4">
              {result.questions.map((question, index) => (
                <Card key={question.id} className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-foreground">
                        {t("Question", "Question")} {index + 1}
                      </span>
                      <div className="flex items-center space-x-2">
                        {question.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <Badge variant={question.isCorrect ? "default" : "destructive"}>
                          {question.points} {t("pts", "pts")}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-foreground">
                      <p className="font-medium mb-3">{question.questionText}</p>
                      
                      {/* User's Answer Section */}
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium mb-1">
                          {t("Votre réponse:", "Your answer:")}
                        </p>
                        <p className="text-blue-900">
                          {question.userAnswer || t("Aucune réponse", "No answer")}
                        </p>
                      </div>
                      
                      {question.type === "multiple-choice" && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => {
                            const isCorrectOption = optionIndex === question.correctAnswer
                            const isUserChoice = question.userAnswer === option
                            
                            return (
                              <div
                                key={optionIndex}
                                className={`p-3 rounded-lg border ${
                                  isCorrectOption
                                    ? "bg-green-50 border-green-200 text-green-800"
                                    : isUserChoice && !isCorrectOption
                                    ? "bg-red-50 border-red-200 text-red-800"
                                    : "bg-muted border-border text-foreground"
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span>
                                  <span>{option}</span>
                                  {isCorrectOption && (
                                    <Badge variant="default" className="bg-green-600 text-white ml-2">
                                      {t("Correct", "Correct")}
                                    </Badge>
                                  )}
                                  {isUserChoice && !isCorrectOption && (
                                    <Badge variant="destructive" className="ml-2">
                                      {t("Votre choix", "Your choice")}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {question.type === "true-false" && (
                        <div className="space-y-2">
                          <div className={`p-3 rounded-lg border ${
                            question.correctAnswer === "true"
                              ? "bg-green-50 border-green-200 text-green-800"
                              : "bg-muted border-border text-foreground"
                          }`}>
                            <div className="flex items-center space-x-2">
                              <span>Vrai</span>
                              {question.correctAnswer === "true" && (
                                <Badge variant="default" className="bg-green-600 text-white ml-2">
                                  {t("Correct", "Correct")}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className={`p-3 rounded-lg border ${
                            question.correctAnswer === "false"
                              ? "bg-green-50 border-green-200 text-green-800"
                              : "bg-muted border-border text-foreground"
                          }`}>
                            <div className="flex items-center space-x-2">
                              <span>Faux</span>
                              {question.correctAnswer === "false" && (
                                <Badge variant="default" className="bg-green-600 text-white ml-2">
                                  {t("Correct", "Correct")}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 p-2 bg-muted rounded">
                            <span className="text-sm text-muted-foreground">
                              {t("Votre réponse:", "Your answer:")} {question.userAnswer === "true" ? "Vrai" : "Faux"}
                            </span>
                          </div>
                        </div>
                      )}

                      {(question.type === "short-answer" || question.type === "essay") && (
                        <div className="space-y-3">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">{t("Votre réponse:", "Your answer:")}</p>
                            <p className="text-foreground">{question.userAnswer || t("Aucune réponse", "No answer")}</p>
                          </div>
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800 mb-1">{t("Réponse correcte:", "Correct answer:")}</p>
                            <p className="text-green-800">{question.correctAnswer}</p>
                          </div>
                        </div>
                      )}

                      {question.explanation && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">{t("Explication:", "Explanation:")}</h4>
                          <p className="text-blue-800">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>{t("Analyse de performance", "Performance Analysis")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">{t("Répartition des points", "Score Distribution")}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>{t("Points obtenus", "Points earned")}</span>
                        <span className="font-medium">{result.score}/{result.maxScore}</span>
                      </div>
                      <Progress value={(result.score / result.maxScore) * 100} className="h-2" />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">{t("Taux de réussite", "Success Rate")}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>{t("Questions correctes", "Correct questions")}</span>
                        <span className="font-medium">{result.correctAnswers}/{result.totalQuestions}</span>
                      </div>
                      <Progress value={(result.correctAnswers / result.totalQuestions) * 100} className="h-2" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">{t("Recommandations", "Recommendations")}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {result.percentage >= 80 ? (
                      <li>• {t("Excellent travail! Continuez à pratiquer pour maintenir ce niveau.", "Excellent work! Keep practicing to maintain this level.")}</li>
                    ) : result.percentage >= 60 ? (
                      <li>• {t("Bon travail! Concentrez-vous sur les domaines où vous avez eu des difficultés.", "Good work! Focus on areas where you had difficulties.")}</li>
                    ) : (
                      <li>• {t("Continuez à pratiquer! Revoyez les concepts de base et refaites des exercices.", "Keep practicing! Review basic concepts and do more exercises.")}</li>
                    )}
                    <li>• {t("Prenez le temps de lire les explications pour mieux comprendre.", "Take time to read explanations for better understanding.")}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {result.feedback && (
            <TabsContent value="feedback" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5" />
                    <span>{t("Retour IA personnalisé", "Personalized AI Feedback")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-900 whitespace-pre-wrap leading-relaxed">
                      {result.feedback}
                    </p>
                  </div>
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-medium text-amber-900 mb-2">{t("Conseil", "Tip")}</h4>
                    <p className="text-sm text-amber-800">
                      {t(
                        "Ce retour a été généré par une intelligence artificielle basée sur vos réponses. Pour une évaluation plus détaillée, consultez un instructeur.",
                        "This feedback was generated by artificial intelligence based on your answers. For a more detailed evaluation, consult an instructor."
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button onClick={() => router.push('/tests')} variant="outline">
            {t("Voir tous les tests", "View all tests")}
          </Button>
          <Button onClick={() => router.push(`/tests/take/${result.testId}`)}>
            {t("Refaire le test", "Retake test")}
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  AlertTriangle,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface Question {
  id: string
  type: 'MCQ' | 'FILL_IN' | 'TRUE_FALSE' | 'ESSAY' | 'AUDIO_RESPONSE'
  questionText: string
  options?: string[]
  correctAnswer?: string
  points: number
  section: string
  order: number
  audioUrl?: string
  imageUrl?: string
}

interface ExamSession {
  id: string
  simulationId: string
  title: string
  duration: number
  sections: {
    name: string
    duration: number
    questions: Question[]
  }[]
  timeRemaining: number
  currentSection: number
  currentQuestion: number
  answers: Record<string, string>
  isFullscreen: boolean
  autoSave: boolean
}

export default function ExamRunnerPage() {
  const params = useParams()
  const router = useRouter()
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const [session, setSession] = useState<ExamSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize exam session
  useEffect(() => {
    const initializeExam = async () => {
      try {
        setLoading(true)
        const response = await apiClient.post(`/simulations/${params.id}/start`)
        const responseData = response.data as any
        if (responseData.success) {
          const examData = responseData.data
          setSession(examData)
          setTimeRemaining(examData.timeRemaining)
          
          // Request fullscreen
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen()
          }
        }
      } catch (error) {
        console.error('Error starting exam:', error)
        toast.error(t("Erreur lors du démarrage de l'examen", "Error starting exam"))
        router.push('/tcf-tef-simulation')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      initializeExam()
    }
  }, [params.id, router, t])

  // Timer countdown
  useEffect(() => {
    if (!session || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1
        
        // Show warnings at 10, 5, and 1 minute marks
        if (newTime === 600 || newTime === 300 || newTime === 60) {
          setShowWarning(true)
          setTimeout(() => setShowWarning(false), 5000)
        }
        
        // Auto-submit when time runs out
        if (newTime <= 0) {
          handleSubmitExam()
          return 0
        }
        
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [session, timeRemaining])

  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (!session?.autoSave) return

    const autoSave = setInterval(() => {
      saveProgress()
    }, 30000)

    return () => clearInterval(autoSave)
  }, [session])

  // Prevent right-click and copy/paste
  useEffect(() => {
    const preventRightClick = (e: MouseEvent) => e.preventDefault()
    const preventCopy = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a')) {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', preventRightClick)
    document.addEventListener('keydown', preventCopy)

    return () => {
      document.removeEventListener('contextmenu', preventRightClick)
      document.removeEventListener('keydown', preventCopy)
    }
  }, [])

  const saveProgress = async () => {
    if (!session) return
    
    try {
      await apiClient.put(`/simulations/sessions/${session.id}/progress`, {
        answers: session.answers,
        currentSection: session.currentSection,
        currentQuestion: session.currentQuestion,
        timeRemaining
      })
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    if (!session) return

    setSession(prev => ({
      ...prev!,
      answers: {
        ...prev!.answers,
        [questionId]: answer
      }
    }))
  }

  const handleNextQuestion = () => {
    if (!session) return

    const currentSectionData = session.sections[session.currentSection]
    const isLastQuestion = session.currentQuestion >= currentSectionData.questions.length - 1
    const isLastSection = session.currentSection >= session.sections.length - 1

    if (isLastQuestion && isLastSection) {
      // Last question of last section
      return
    }

    if (isLastQuestion) {
      // Move to next section
      setSession(prev => ({
        ...prev!,
        currentSection: prev!.currentSection + 1,
        currentQuestion: 0
      }))
    } else {
      // Move to next question
      setSession(prev => ({
        ...prev!,
        currentQuestion: prev!.currentQuestion + 1
      }))
    }

    saveProgress()
  }

  const handlePreviousQuestion = () => {
    if (!session) return

    if (session.currentQuestion > 0) {
      setSession(prev => ({
        ...prev!,
        currentQuestion: prev!.currentQuestion - 1
      }))
    } else if (session.currentSection > 0) {
      const prevSection = session.sections[session.currentSection - 1]
      setSession(prev => ({
        ...prev!,
        currentSection: prev!.currentSection - 1,
        currentQuestion: prevSection.questions.length - 1
      }))
    }
  }

  const handleSubmitExam = async () => {
    if (!session || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await apiClient.post(`/simulations/sessions/${session.id}/submit`, {
        answers: session.answers,
        timeSpent: session.duration * 60 - timeRemaining
      })

      const responseData = response.data as any
      if (responseData.success) {
        toast.success(t("Examen soumis avec succès", "Exam submitted successfully"))

        // Show AI teacher feedback notification
        if (responseData.data.teacherFeedbackId) {
          toast.info(t(
            "Feedback de votre professeur IA généré avec succès !",
            "AI teacher feedback generated successfully!"
          ))
        }

        router.push(`/tcf-tef-simulation/results/${responseData.data.resultId}`)
      }
    } catch (error) {
      console.error('Error submitting exam:', error)
      toast.error(t("Erreur lors de la soumission", "Error submitting exam"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getCurrentQuestion = (): Question | null => {
    if (!session) return null
    const currentSectionData = session.sections[session.currentSection]
    return currentSectionData?.questions[session.currentQuestion] || null
  }

  const getTotalQuestions = () => {
    if (!session) return 0
    return session.sections.reduce((total, section) => total + section.questions.length, 0)
  }

  const getCurrentQuestionNumber = () => {
    if (!session) return 0
    let questionNumber = 0
    for (let i = 0; i < session.currentSection; i++) {
      questionNumber += session.sections[i].questions.length
    }
    return questionNumber + session.currentQuestion + 1
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("Chargement de l'examen...", "Loading exam...")}</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("Examen non trouvé", "Exam not found")}</h2>
          <p className="text-muted-foreground mb-4">{t("L'examen demandé n'existe pas ou n'est plus disponible", "The requested exam does not exist or is no longer available")}</p>
          <Button onClick={() => router.push('/tcf-tef-simulation')}>
            {t("Retour aux simulations", "Back to simulations")}
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = getCurrentQuestion()
  const currentSectionData = session.sections[session.currentSection]
  const progress = (getCurrentQuestionNumber() / getTotalQuestions()) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Warning overlay */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-destructive text-destructive-foreground">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {timeRemaining <= 60 ? t("1 minute restante!", "1 minute remaining!") :
                 timeRemaining <= 300 ? t("5 minutes restantes!", "5 minutes remaining!") :
                 t("10 minutes restantes!", "10 minutes remaining!")}
              </h3>
              <p>{t("Dépêchez-vous de terminer!", "Hurry up to finish!")}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{session.title}</h1>
            <Badge variant="outline">{currentSectionData.name}</Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span className={timeRemaining <= 300 ? "text-destructive font-semibold" : ""}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {getCurrentQuestionNumber()} / {getTotalQuestions()}
            </div>
            
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleSubmitExam}
              disabled={isSubmitting}
            >
              <Flag className="w-4 h-4 mr-2" />
              {t("Terminer", "Finish")}
            </Button>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-4">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto p-6">
        {currentQuestion && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {t("Question", "Question")} {session.currentQuestion + 1}
                </CardTitle>
                <Badge variant="secondary">{currentQuestion.points} {t("points", "points")}</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Question text */}
              <div className="prose prose-sm max-w-none">
                <p className="text-base leading-relaxed">{currentQuestion.questionText}</p>
              </div>

              {/* Audio player for audio questions */}
              {currentQuestion.audioUrl && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (audioRef) {
                          if (isPlaying) {
                            audioRef.pause()
                          } else {
                            audioRef.play()
                          }
                          setIsPlaying(!isPlaying)
                        }
                      }}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (audioRef) {
                          audioRef.currentTime = 0
                          if (isPlaying) {
                            audioRef.play()
                          }
                        }
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    
                    <span className="text-sm text-muted-foreground">
                      {t("Cliquez pour écouter l'audio", "Click to listen to audio")}
                    </span>
                  </div>
                  
                  <audio
                    ref={setAudioRef}
                    src={currentQuestion.audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>
              )}

              {/* Answer input based on question type */}
              <div className="space-y-4">
                {currentQuestion.type === 'MCQ' && currentQuestion.options && (
                  <RadioGroup
                    value={session.answers[currentQuestion.id] || ""}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  >
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === 'TRUE_FALSE' && (
                  <RadioGroup
                    value={session.answers[currentQuestion.id] || ""}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="true" />
                      <Label htmlFor="true" className="cursor-pointer">{t("Vrai", "True")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="false" />
                      <Label htmlFor="false" className="cursor-pointer">{t("Faux", "False")}</Label>
                    </div>
                  </RadioGroup>
                )}

                {(currentQuestion.type === 'ESSAY' || currentQuestion.type === 'FILL_IN') && (
                  <Textarea
                    placeholder={t("Tapez votre réponse ici...", "Type your answer here...")}
                    value={session.answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="min-h-[120px]"
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={session.currentSection === 0 && session.currentQuestion === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {t("Précédent", "Previous")}
                </Button>

                <div className="flex items-center gap-2">
                  {session.answers[currentQuestion.id] && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {session.answers[currentQuestion.id] ? 
                      t("Réponse enregistrée", "Answer saved") : 
                      t("Pas de réponse", "No answer")
                    }
                  </span>
                </div>

                <Button
                  onClick={handleNextQuestion}
                  disabled={
                    session.currentSection >= session.sections.length - 1 &&
                    session.currentQuestion >= currentSectionData.questions.length - 1
                  }
                >
                  {t("Suivant", "Next")}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

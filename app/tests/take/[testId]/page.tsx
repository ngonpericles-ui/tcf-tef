"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import { ChevronLeft, ChevronRight, Send, X, Clock, AlertTriangle, CheckCircle, Volume2 } from "lucide-react"
import UniversalContentViewer from "@/components/universal-content-viewer"
import AudioRecorder from "@/components/audio-recorder"
import ExamModeIndicator from "@/components/exam-mode-indicator"

interface Question {
  id: string
  text: string
  type: string
  options?: string[]
  correctAnswer?: string
  audioUrl?: string
  videoUrl?: string
  imageUrl?: string
  allowPause?: boolean
  allowRewind?: boolean
  timeLimit?: number
}

interface TestData {
  id: string
  title: string
  description: string
  duration: number
  questions: Question[]
  fileUrl?: string
}

export default function TakeTestPage() {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)
  const params = useParams()
  const router = useRouter()
  const testId = params?.testId as string

  const [test, setTest] = useState<TestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showConfirmEnd, setShowConfirmEnd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [testStarted, setTestStarted] = useState(false)
  const [timeWarning, setTimeWarning] = useState(false)

  useEffect(() => {
    if (!testId) return;
    
    const fetchTest = async () => {
      try {
        setLoading(true)
        // Fetch test details
        const testResponse = await apiClient.get(`/tests/${testId}`)
        if ((testResponse as any).success) {
          const testData = (testResponse as any).data.test
          setTest(testData)
          // Initialize timer if test has duration
          if (testData.duration) {
            setTimeLeft(testData.duration * 60) // Convert minutes to seconds
          }
        }
      } catch (error) {
        console.error('Error loading test:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTest()
  }, [testId])

  // Timer effect
  useEffect(() => {
    if (!testStarted || timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) {
          // Auto-submit when time runs out
          handleSubmitTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [testStarted, timeLeft])

  // Time warning effect
  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 300 && timeLeft > 0) { // 5 minutes warning
      setTimeWarning(true)
    } else {
      setTimeWarning(false)
    }
  }, [timeLeft])

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const startTest = () => {
    setTestStarted(true)
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

  const handleSubmitTest = async () => {
    try {
      setSubmitting(true)
      // First start the test attempt
      const startResponse = await apiClient.post(`/tests/${testId}/start`)
      if ((startResponse as any).success) {
        const attemptId = (startResponse as any).data.attemptId
        // Then submit the answers
        const response = await apiClient.post(`/tests/submit`, {
          attemptId,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer
          }))
        })

        if ((response as any).success) {
          // Redirect to results page
          router.push(`/tests/results/${testId}`)
        }
      }
    } catch (error) {
      console.error('Error submitting test:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t("Chargement du test...", "Loading test...")}</p>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">{t("Test non trouvé", "Test not found")}</p>
          <Button onClick={() => router.back()}>{t("Retour", "Back")}</Button>
        </div>
      </div>
    )
  }

  if (!test.questions || test.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">{t("Ce test n'a pas encore de questions", "This test has no questions yet")}</p>
          <p className="text-sm text-muted-foreground mb-4">{t("Veuillez contacter l'administrateur pour ajouter des questions à ce test", "Please contact the administrator to add questions to this test")}</p>
          <Button onClick={() => router.back()}>{t("Retour", "Back")}</Button>
        </div>
      </div>
    )
  }

  const currentQuestion = test.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{test.title}</h1>
            <p className="text-sm text-muted-foreground">
              {t("Question", "Question")} {currentQuestionIndex + 1} {t("sur", "of")} {test.questions.length}
            </p>
          </div>
          
          {/* Timer and Controls */}
          <div className="flex items-center gap-4">
            {timeLeft !== null && testStarted && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                timeWarning ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono text-sm">
                  {formatTime(timeLeft)}
                </span>
                {timeWarning && <AlertTriangle className="h-4 w-4" />}
              </div>
            )}
            
            {!testStarted ? (
              <Button onClick={startTest} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                {t("Commencer le test", "Start Test")}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmEnd(true)}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                {t("Terminer", "End")}
              </Button>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!testStarted ? (
          /* Start Screen */
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-4">{test.title}</h1>
                <p className="text-lg text-muted-foreground mb-6">{test.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold mb-1">{t("Durée", "Duration")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {test.duration ? `${test.duration} ${t("minutes", "minutes")}` : t("Pas de limite de temps", "No time limit")}
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold mb-1">{t("Questions", "Questions")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {test.questions.length} {t("questions", "questions")}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-semibold mb-1">{t("Instructions", "Instructions")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("Lisez attentivement chaque question", "Read each question carefully")}
                  </p>
                </div>
              </div>
              
              <Button onClick={startTest} size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                <CheckCircle className="h-5 w-5 mr-2" />
                {t("Commencer le test", "Start the test")}
              </Button>
            </Card>
          </div>
        ) : (
          /* Test Interface */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side - Questions/PDF */}
            <div className="lg:col-span-2">
              <Card className="p-6 min-h-[500px] flex flex-col">
                {test.fileUrl && (
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">{t("Document de référence", "Reference document")}</p>
                    <iframe
                      src={test.fileUrl}
                      className="w-full h-96 rounded border"
                      title="Test document"
                    />
                  </div>
                )}

                <div className="flex-1 space-y-6">
                  {/* Exam Mode Indicator */}
                  <ExamModeIndicator
                    allowPause={currentQuestion.allowPause !== false}
                    allowRewind={currentQuestion.allowRewind !== false}
                    timeLimit={currentQuestion.timeLimit}
                    questionType={currentQuestion.type}
                  />

                  {/* Media Content */}
                  {(currentQuestion.audioUrl || currentQuestion.videoUrl || currentQuestion.imageUrl) && (
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      {currentQuestion.audioUrl && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                              <Volume2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{t("Compréhension Orale", "Listening Comprehension")}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{t("Écoutez attentivement l'audio ci-dessous", "Listen carefully to the audio below")}</p>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                            <UniversalContentViewer
                              url={currentQuestion.audioUrl}
                              title="Question Audio"
                              className="w-full"
                              allowDownload={false}
                              autoPlay={false}
                            />
                          </div>
                        </div>
                      )}
                      {currentQuestion.videoUrl && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-full">
                              <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{t("Vidéo", "Video")}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{t("Regardez la vidéo ci-dessous", "Watch the video below")}</p>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                            <UniversalContentViewer
                              url={currentQuestion.videoUrl}
                              title="Question Video"
                              className="w-full"
                              allowDownload={false}
                            />
                          </div>
                        </div>
                      )}
                      {currentQuestion.imageUrl && (
                        <div>
                          <p className="text-sm font-semibold mb-3">{t("Image", "Image")}</p>
                          <img
                            src={currentQuestion.imageUrl}
                            alt="Question"
                            className="max-w-full h-auto rounded"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question Text */}
                  <h2 className="text-lg font-semibold">{currentQuestion.text}</h2>

                  {/* Question Type: Multiple Choice */}
                  {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, idx) => (
                        <label key={idx} className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-muted ${
                          answers[currentQuestion.id] === option
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}>
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={option}
                            checked={answers[currentQuestion.id] === option}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            className="mr-4 h-4 w-4 text-blue-600"
                          />
                          <span className="flex-1">{option}</span>
                          {answers[currentQuestion.id] === option && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Question Type: Short Answer / Written Expression */}
                  {(currentQuestion.type === "short_answer" || currentQuestion.type === "expression_ecrite") && (
                    <div className="space-y-4">
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-2">
                          {t("✍️ Expression Écrite", "✍️ Writing")}
                        </p>
                        <p className="text-sm text-orange-800 dark:text-orange-400">
                          {t("Écrivez une réponse complète et bien structurée. Vérifiez la grammaire et l'orthographe.", "Write a complete and well-structured response. Check grammar and spelling.")}
                        </p>
                      </div>
                      <Textarea
                        placeholder={t("Écrivez votre réponse ici...", "Write your answer here...")}
                        value={answers[currentQuestion.id] || ""}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="min-h-40 border-2 focus:border-orange-500 resize-none"
                      />
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <div className="flex gap-4">
                          <span>{t("Mots:", "Words:")} {(answers[currentQuestion.id] || "").split(/\s+/).filter(w => w.length > 0).length}</span>
                          <span>{t("Caractères:", "Characters:")} {(answers[currentQuestion.id] || "").length}</span>
                        </div>
                        {(answers[currentQuestion.id] || "").length > 0 && (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span>{t("Réponse en cours", "Response in progress")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Question Type: Oral Expression */}
                  {currentQuestion.type === "expression_orale" && (
                    <div className="space-y-4">
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
                          {t("🎤 Expression Orale", "🎤 Speaking")}
                        </p>
                        <p className="text-sm text-purple-800 dark:text-purple-400 mb-3">
                          {t("Enregistrez votre réponse orale. Vous avez jusqu'à 3 minutes pour répondre.", "Record your oral response. You have up to 3 minutes to answer.")}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
                          <Clock className="w-4 h-4" />
                          <span>{t("Durée maximale:", "Maximum duration:")} {currentQuestion.timeLimit ? Math.floor(currentQuestion.timeLimit / 60) : 3} {t("minutes", "minutes")}</span>
                        </div>
                      </div>
                      <AudioRecorder
                        onRecordingComplete={(blob: Blob) => {
                          handleAnswerChange(currentQuestion.id, JSON.stringify({
                            type: 'audio',
                            size: blob.size,
                            timestamp: new Date().toISOString()
                          }))
                        }}
                        maxDuration={currentQuestion.timeLimit || 180}
                      />
                      {answers[currentQuestion.id] && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="text-sm text-green-700 dark:text-green-300">
                            {t("Réponse enregistrée avec succès", "Response recorded successfully")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question Type: Comprehension Orale */}
                  {currentQuestion.type === "comprehension_orale" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                          {t("💡 Conseil", "💡 Tip")}
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-400">
                          {t("Écoutez l'audio attentivement et répondez aux questions basées sur ce que vous avez entendu.", "Listen to the audio carefully and answer the questions based on what you heard.")}
                        </p>
                      </div>
                      <Textarea
                        placeholder={t("Écrivez votre réponse ici...", "Write your answer here...")}
                        value={answers[currentQuestion.id] || ""}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="min-h-32 border-2 focus:border-blue-500"
                      />
                      <div className="text-xs text-muted-foreground">
                        {t("Caractères:", "Characters:")} {(answers[currentQuestion.id] || "").length}
                      </div>
                    </div>
                  )}

                  {/* Question Type: Comprehension Ecrite */}
                  {currentQuestion.type === "comprehension_ecrite" && (
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                          {t("📖 Conseil", "📖 Tip")}
                        </p>
                        <p className="text-sm text-green-800 dark:text-green-400">
                          {t("Lisez le texte attentivement et répondez aux questions basées sur votre compréhension.", "Read the text carefully and answer the questions based on your understanding.")}
                        </p>
                      </div>
                      {currentQuestion.options ? (
                        <div className="space-y-3">
                          {currentQuestion.options.map((option, idx) => (
                            <label key={idx} className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-muted ${
                              answers[currentQuestion.id] === option
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}>
                              <input
                                type="radio"
                                name={`question-${currentQuestion.id}`}
                                value={option}
                                checked={answers[currentQuestion.id] === option}
                                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                className="mr-4 h-4 w-4 text-green-600"
                              />
                              <span className="flex-1">{option}</span>
                              {answers[currentQuestion.id] === option && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <Textarea
                          placeholder={t("Écrivez votre réponse ici...", "Write your answer here...")}
                          value={answers[currentQuestion.id] || ""}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          className="min-h-32 border-2 focus:border-green-500"
                        />
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right side - Answer space */}
            <div>
              <Card className="p-6 sticky top-24">
                <h3 className="font-semibold mb-4">{t("Votre réponse", "Your answer")}</h3>
                <div className="bg-muted p-4 rounded-lg min-h-32 mb-4 text-sm">
                  {answers[currentQuestion.id] ? (
                    <p className="whitespace-pre-wrap">{answers[currentQuestion.id]}</p>
                  ) : (
                    <p className="text-muted-foreground italic">{t("Aucune réponse", "No answer yet")}</p>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="flex-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentQuestionIndex(Math.min(test.questions.length - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === test.questions.length - 1}
                    className="flex-1"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {currentQuestionIndex === test.questions.length - 1 && (
                  <Button
                    onClick={handleSubmitTest}
                    disabled={submitting}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t("Envoi...", "Submitting...")}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t("Soumettre le test", "Submit test")}
                      </>
                    )}
                  </Button>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Confirm end dialog */}
      {showConfirmEnd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-sm">
            <h2 className="text-lg font-semibold mb-4">{t("Terminer le test?", "End test?")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("Êtes-vous sûr de vouloir terminer le test? Vos réponses seront perdues.", "Are you sure you want to end the test? Your answers will be lost.")}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowConfirmEnd(false)} className="flex-1">
                {t("Continuer", "Continue")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => router.back()}
                className="flex-1"
              >
                {t("Terminer", "End")}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}


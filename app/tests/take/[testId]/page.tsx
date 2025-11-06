"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import { ChevronLeft, ChevronRight, Send, X, Clock, AlertTriangle, CheckCircle, Volume2, Flag, ChevronDown, ChevronUp, MoreVertical, Type, Wifi, Battery } from "lucide-react"
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
  // Backend field names
  questionText?: string
  questionTextEn?: string
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
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set())
  const [showTimer, setShowTimer] = useState(true)
  const [showQuestionList, setShowQuestionList] = useState(false)

  useEffect(() => {
    if (!testId) return;
    
    const fetchTest = async () => {
      try {
        setLoading(true)
        // Fetch test details
        const testResponse = await apiClient.get(`/tests/${testId}`)
        console.log('🔍 Test response:', testResponse)
        if ((testResponse as any).success) {
          const testData = (testResponse as any).data.test
          console.log('🔍 Test data:', testData)
          console.log('🔍 Test questions:', testData?.questions)
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
    console.log('🔍 Answer changed:', { questionId, answer, currentAnswers: answers })
    setAnswers({ ...answers, [questionId]: answer })
  }

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const getQuestionStatus = (index: number) => {
    const question = test?.questions[index]
    if (!question) return 'unanswered'
    const hasAnswer = answers[question.id]
    const isMarked = markedForReview.has(question.id)
    
    if (hasAnswer && isMarked) return 'answered-marked'
    if (hasAnswer) return 'answered'
    if (isMarked) return 'marked'
    return 'unanswered'
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
        const answersToSubmit = Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer
        }))
        
        console.log('🔍 Submitting answers:', {
          attemptId,
          answers: answersToSubmit,
          answersCount: answersToSubmit.length
        })
        
        const response = await apiClient.post(`/tests/submit`, {
          attemptId,
          answers: answersToSubmit
        })

        if ((response as any).success) {
          // Redirect to results page using attempt ID
          console.log('🔍 Test submitted successfully, redirecting to:', `/tests/results/${attemptId}`)
          router.push(`/tests/results/${attemptId}`)
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
    console.log('🔍 No test data available')
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
    console.log('🔍 No questions available:', { questions: test.questions, testId: test.id })
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
    <div className="min-h-screen bg-white">
      {/* Bluebook-Style Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-6 py-3">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-3">
            {/* Left: Section Info */}
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {t("Section 1, Module 1", "Section 1, Module 1")}: {test.title}
                </h1>
                <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mt-1">
                  {t("Directions", "Directions")}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
          </div>
          
            {/* Center: Timer */}
            <div className="flex flex-col items-center">
              {timeLeft !== null && testStarted && showTimer && (
                <>
                  <div className={`text-2xl font-semibold ${
                    timeWarning ? 'text-red-600' : 'text-gray-900'
              }`}>
                  {formatTime(timeLeft)}
              </div>
                  <button
                    onClick={() => setShowTimer(false)}
                    className="text-xs text-gray-600 hover:text-gray-900 mt-1"
                  >
                    {t("Hide", "Hide")}
                  </button>
                </>
              )}
              {!showTimer && (
                <button
                  onClick={() => setShowTimer(true)}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  {t("Show Timer", "Show Timer")}
                </button>
              )}
            </div>

            {/* Right: Tools */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">100%</span>
              <Wifi className="h-4 w-4 text-gray-600" />
              <Battery className="h-4 w-4 text-gray-600" />
              <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                <Type className="h-4 w-4" />
                {t("Annotate", "Annotate")}
              </button>
              <button className="text-gray-600 hover:text-gray-900">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress Indicator - Bluebook Style with Colored Segments */}
          <div className="flex gap-1 h-1">
            {test.questions.map((_, index) => {
              const status = getQuestionStatus(index)
              let bgColor = 'bg-gray-300'
              if (status === 'answered') bgColor = 'bg-blue-500'
              else if (status === 'marked') bgColor = 'bg-yellow-500'
              else if (status === 'answered-marked') bgColor = 'bg-green-500'
              
              return (
                <div
                  key={index}
                  className={`flex-1 ${bgColor} rounded-full`}
                  style={{ height: '4px' }}
                />
              )
            })}
          </div>
        </div>
      </header>

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
          /* Bluebook-Style Test Interface - Split Pane Layout */
          <div className="flex h-[calc(100vh-120px)]">
            {/* Left Pane - Reading Passage/Text */}
            <div className="flex-1 border-r border-gray-200 overflow-y-auto bg-white">
              <div className="p-6">
                {test.fileUrl && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {t("Passage", "Passage")}
                      </h3>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Type className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <iframe
                      src={test.fileUrl}
                        className="w-full h-[600px]"
                      title="Test document"
                    />
                    </div>
                  </div>
                )}

                {/* Reading Passage Text (if no PDF) */}
                {!test.fileUrl && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {t("Passage", "Passage")}
                      </h3>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Type className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-gray-700 leading-relaxed">
                  {/* Media Content */}
                  {(currentQuestion.audioUrl || currentQuestion.videoUrl || currentQuestion.imageUrl) && (
                        <div className="mb-6 space-y-4">
                      {currentQuestion.audioUrl && (
                            <div className="bg-gray-50 rounded-lg p-4">
                            <UniversalContentViewer
                              url={currentQuestion.audioUrl}
                              title="Question Audio"
                              className="w-full"
                              allowDownload={false}
                              autoPlay={false}
                            />
                        </div>
                      )}
                      {currentQuestion.videoUrl && (
                            <div className="bg-gray-50 rounded-lg p-4">
                            <UniversalContentViewer
                              url={currentQuestion.videoUrl}
                              title="Question Video"
                              className="w-full"
                              allowDownload={false}
                            />
                        </div>
                      )}
                      {currentQuestion.imageUrl && (
                          <img
                            src={currentQuestion.imageUrl}
                            alt="Question"
                              className="max-w-full h-auto rounded-lg"
                          />
                          )}
                        </div>
                      )}
                      
                      {/* Question Text as Passage */}
                      <p className="text-base leading-relaxed whitespace-pre-wrap">
                        {currentQuestion.text || currentQuestion.questionText || ''}
                      </p>
                    </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Right Pane - Question and Answer Choices */}
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="p-6">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-900 text-white w-8 h-8 rounded flex items-center justify-center font-semibold text-sm">
                      {currentQuestionIndex + 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleMarkForReview(currentQuestion.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                          markedForReview.has(currentQuestion.id)
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <Flag className={`h-4 w-4 ${markedForReview.has(currentQuestion.id) ? 'fill-red-600 text-red-600' : ''}`} />
                        {t("Mark for Review", "Mark for Review")}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-gray-600 hover:text-gray-900">
                      <Type className="h-4 w-4" />
                    </button>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>

                {/* Question Prompt */}
                <div className="mb-6">
                  <h2 className="text-base font-medium text-gray-900 mb-4">
                    {currentQuestion.type === "multiple-choice" 
                      ? t("Which choice completes the text with the most logical and precise word or phrase?", "Which choice completes the text with the most logical and precise word or phrase?")
                      : currentQuestion.text || currentQuestion.questionText
                    }
                  </h2>
                </div>

                {/* Answer Choices */}
                <div className="space-y-3">

                  {/* Multiple Choice Options - Bluebook Style */}
                  {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
                    <>
                      {currentQuestion.options.map((option, idx) => {
                        const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']
                        const isSelected = answers[currentQuestion.id] === idx.toString()
                        return (
                          <button
                            key={idx}
                            onClick={() => handleAnswerChange(currentQuestion.id, idx.toString())}
                            className={`w-full text-left flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-400'
                            }`}>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-gray-900 mr-2">
                                ({optionLabels[idx]})
                              </span>
                              <span className="text-gray-700">{option}</span>
                    </div>
                          </button>
                        )
                      })}
                    </>
                  )}

                  {/* True/False Options */}
                  {currentQuestion.type === "true-false" && (
                      <div className="space-y-3">
                      {[
                        { value: "true", label: t("Vrai", "True"), color: "green" },
                        { value: "false", label: t("Faux", "False"), color: "red" }
                      ].map((option) => {
                        const isSelected = answers[currentQuestion.id] === option.value
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleAnswerChange(currentQuestion.id, option.value)}
                            className={`w-full text-left flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                              isSelected
                                ? `border-${option.color}-500 bg-${option.color}-50`
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? `border-${option.color}-500 bg-${option.color}-500`
                                : 'border-gray-400'
                            }`}>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                      </div>
                            <span className="font-medium text-gray-900">{option.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Short Answer / Written Expression */}
                  {(currentQuestion.type === "short-answer" || currentQuestion.type === "essay") && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder={t("Écrivez votre réponse ici...", "Write your answer here...")}
                        value={answers[currentQuestion.id] || ""}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="min-h-48 border-2 border-gray-200 focus:border-blue-500 resize-none rounded-lg p-4"
                      />
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <div className="flex gap-4">
                          <span>{t("Mots:", "Words:")} {(answers[currentQuestion.id] || "").split(/\s+/).filter(w => w.length > 0).length}</span>
                          <span>{t("Caractères:", "Characters:")} {(answers[currentQuestion.id] || "").length}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          {/* Bluebook-Style Bottom Navigation Bar */}
          {testStarted && !loading && !submitting && (
          <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
            <div className="px-6 py-3 flex items-center justify-between">
              {/* Left: Question Number */}
              <button
                onClick={() => setShowQuestionList(!showQuestionList)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold">
                  {t("Question", "Question")} {currentQuestionIndex + 1} {t("of", "of")} {test.questions.length}
                </span>
                {showQuestionList ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                  )}
              </button>

              {/* Right: Navigation Buttons */}
              <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                  className="border-gray-300"
                  >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {t("Back", "Back")}
                  </Button>
                {currentQuestionIndex === test.questions.length - 1 ? (
                  <Button
                    onClick={handleSubmitTest}
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t("Submitting...", "Submitting...")}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t("Submit", "Submit")}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentQuestionIndex(Math.min(test.questions.length - 1, currentQuestionIndex + 1))}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t("Next", "Next")}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>

            {/* Question List Dropdown */}
            {showQuestionList && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-10 gap-2">
                  {test.questions.map((q, idx) => {
                    const status = getQuestionStatus(idx)
                    let bgColor = 'bg-gray-200 text-gray-700'
                    if (status === 'answered') bgColor = 'bg-blue-500 text-white'
                    else if (status === 'marked') bgColor = 'bg-yellow-500 text-white'
                    else if (status === 'answered-marked') bgColor = 'bg-green-500 text-white'
                    
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setCurrentQuestionIndex(idx)
                          setShowQuestionList(false)
                        }}
                        className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
                          idx === currentQuestionIndex
                            ? 'ring-2 ring-blue-600 ring-offset-2'
                            : ''
                        } ${bgColor} hover:opacity-80`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
            </div>
          </div>
            )}
          </footer>
          )}
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


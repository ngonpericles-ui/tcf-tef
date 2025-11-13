"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import { ChevronLeft, ChevronRight, Send, X, Clock, AlertTriangle, CheckCircle, Volume2, Flag, ChevronDown, ChevronUp, MoreVertical, Type, Wifi, Battery, BookOpen } from "lucide-react"
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
  passage?: string | null // Reading passage or context (separate from question text) - can be long (500-2000+ words)
  fileUrl?: string | null // PDF URL for question-level documents
  minWords?: number | null // Minimum word count for Expression Écrite
  maxWords?: number | null // Maximum word count for Expression Écrite
  writingType?: string | null // Writing type: "article", "essay", "letter"
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
  category?: string // Test category (ORAL, READING, etc.)
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
  const [audioPlayed, setAudioPlayed] = useState<Set<string>>(new Set()) // Track which audio has been played
  const [videoPlayed, setVideoPlayed] = useState<Set<string>>(new Set()) // Track which video has been played
  const [passagePage, setPassagePage] = useState<number>(1) // Pagination for long passages
  const PASSAGE_WORDS_PER_PAGE = 1000 // Words per page for pagination

  // Helper function to split passage into pages
  const getPassagePages = (passage: string | null | undefined): string[] => {
    if (!passage) return []
    const words = passage.split(/\s+/)
    const pages: string[] = []
    for (let i = 0; i < words.length; i += PASSAGE_WORDS_PER_PAGE) {
      pages.push(words.slice(i, i + PASSAGE_WORDS_PER_PAGE).join(' '))
    }
    return pages
  }

  // Helper function to get current passage page
  const getCurrentPassagePage = (): string => {
    if (!currentQuestion.passage) return ''
    const pages = getPassagePages(currentQuestion.passage)
    return pages[passagePage - 1] || currentQuestion.passage
  }

  // Helper function to get total pages for passage
  const getTotalPassagePages = (): number => {
    if (!currentQuestion.passage) return 1
    const pages = getPassagePages(currentQuestion.passage)
    return Math.max(1, pages.length)
  }

  // Helper function to count words
  const countWords = (text: string): number => {
    return text.split(/\s+/).filter(w => w.length > 0).length
  }

  // Reset passage page when question changes
  useEffect(() => {
    setPassagePage(1)
  }, [currentQuestionIndex])

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
      
      // Validate Expression Écrite word counts before submission
      if (test && test.category === "WRITING") {
        for (const question of test.questions) {
          if (question.minWords && question.maxWords) {
            const answer = answers[question.id] || ""
            const wordCount = countWords(answer)
            if (wordCount < question.minWords) {
              alert(`Question ${test.questions.indexOf(question) + 1}: Minimum ${question.minWords} mots requis. Vous avez écrit ${wordCount} mots.`)
              setSubmitting(false)
              return
            }
            if (wordCount > question.maxWords) {
              alert(`Question ${test.questions.indexOf(question) + 1}: Maximum ${question.maxWords} mots autorisés. Vous avez écrit ${wordCount} mots.`)
              setSubmitting(false)
              return
            }
          }
        }
      }
      
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
                {/* PDF Viewer for Compréhension Écrite (test-level PDF) */}
                {test.fileUrl && test.category === "READING" && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        📄 Document à lire (Compréhension Écrite)
                      </h3>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Type className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <iframe
                        src={`${test.fileUrl}#toolbar=1`}
                        className="w-full h-[600px]"
                        title="Reading comprehension document"
                        style={{ border: 'none' }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Lisez attentivement le document ci-dessus, puis répondez aux questions à droite.
                    </p>
                  </div>
                )}
                
                {/* PDF Viewer for Expression Écrite (question-level PDF) */}
                {currentQuestion?.fileUrl && test.category === "WRITING" && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        📄 Document de référence
                      </h3>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <iframe
                        src={`${currentQuestion.fileUrl}#toolbar=1`}
                        className="w-full h-[400px]"
                        title="Writing reference document"
                        style={{ border: 'none' }}
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
                            <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              🎧 Audio - Écoutez attentivement (une seule fois)
                            </div>
                            <audio
                              src={currentQuestion.audioUrl}
                              controls
                              className="w-full"
                              onPlay={() => {
                                if (!audioPlayed.has(currentQuestion.id)) {
                                  setAudioPlayed((prev: Set<string>) => new Set(prev).add(currentQuestion.id));
                                }
                              }}
                              onEnded={() => {
                                if (!audioPlayed.has(currentQuestion.id)) {
                                  setAudioPlayed((prev: Set<string>) => new Set(prev).add(currentQuestion.id));
                                }
                              }}
                            />
                            {audioPlayed.has(currentQuestion.id) && (
                              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                                ⚠️ Audio déjà écouté - pas de réécoute possible
                              </p>
                            )}
                        </div>
                      )}
                      {currentQuestion.videoUrl && (
                            <div className="bg-gray-50 rounded-lg p-4">
                            <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              🎬 Vidéo - Regardez attentivement (une seule fois)
                            </div>
                            <video
                              src={currentQuestion.videoUrl}
                              controls
                              className="w-full rounded-lg"
                              onPlay={() => {
                                if (!videoPlayed.has(currentQuestion.id)) {
                                  setVideoPlayed((prev: Set<string>) => new Set(prev).add(currentQuestion.id));
                                }
                              }}
                              onEnded={() => {
                                if (!videoPlayed.has(currentQuestion.id)) {
                                  setVideoPlayed((prev: Set<string>) => new Set(prev).add(currentQuestion.id));
                                }
                              }}
                            />
                            {videoPlayed.has(currentQuestion.id) && (
                              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                                ⚠️ Vidéo déjà regardée - pas de relecture possible
                              </p>
                            )}
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
                      
                      {/* Reading Passage - Separate from Question (for Reading Comprehension) */}
                      {currentQuestion.passage && test.category === "READING" ? (
                        <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                📖 Passage à lire (Compréhension Écrite)
                              </h4>
                            </div>
                            {/* Pagination for long passages */}
                            {getTotalPassagePages() > 1 && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setPassagePage(prev => Math.max(1, prev - 1))}
                                  disabled={passagePage === 1}
                                  className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm text-blue-900 dark:text-blue-100 px-2">
                                  Page {passagePage} sur {getTotalPassagePages()}
                                </span>
                                <button
                                  onClick={() => setPassagePage(prev => Math.min(getTotalPassagePages(), prev + 1))}
                                  disabled={passagePage === getTotalPassagePages()}
                                  className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="p-4 bg-white dark:bg-gray-800 rounded border border-blue-100 dark:border-blue-900 max-h-[600px] overflow-y-auto">
                            <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                              {getCurrentPassagePage()}
                            </p>
                          </div>
                        </div>
                      ) : null}
                      
                      {/* Question Text - Only if different from passage */}
                      {!currentQuestion.passage && (currentQuestion.text || currentQuestion.questionText) ? (
                        <p className="text-base leading-relaxed whitespace-pre-wrap">
                          {currentQuestion.text || currentQuestion.questionText}
                        </p>
                      ) : null}
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
                    {test.category === "WRITING" && currentQuestion.writingType ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                            📝 Expression Écrite - {currentQuestion.writingType === "article" ? "Article" : currentQuestion.writingType === "essay" ? "Essai" : "Lettre"}
                          </p>
                          <p className="text-sm text-gray-800 dark:text-gray-200">
                            {currentQuestion.questionText || currentQuestion.text || "Écrivez votre texte en vous basant sur le passage fourni."}
                          </p>
                          {currentQuestion.minWords && currentQuestion.maxWords && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                              Longueur requise: {currentQuestion.minWords}-{currentQuestion.maxWords} mots
                            </p>
                          )}
                        </div>
                      </div>
                    ) : currentQuestion.type === "multiple-choice" 
                      ? t("Which choice completes the text with the most logical and precise word or phrase?", "Which choice completes the text with the most logical and precise word or phrase?")
                      : (currentQuestion.type === "oral" || currentQuestion.type === "expression_orale" || test.category === "ORAL")
                      ? (
                        <div className="space-y-3">
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                              📝 Sujet d'Expression Orale:
                            </p>
                            <p className="text-base text-gray-800 dark:text-gray-200">
                              {currentQuestion.text || currentQuestion.questionText || "Sujet d'expression orale"}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Enregistrez votre réponse audio sur ce sujet. Votre réponse sera évaluée par un expert selon les critères TCF/TEF.
                          </p>
                        </div>
                      )
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

                  {/* Expression Orale (Speaking) - Audio Recording */}
                  {(currentQuestion.type === "oral" || currentQuestion.type === "expression_orale" || test.category === "ORAL") && (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                        <div className="mb-3 flex items-center space-x-2">
                          <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                            🎤 Expression Orale - Enregistrez votre réponse
                          </h4>
                        </div>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mb-4">
                          {test.duration ? `Durée maximale: ${test.duration} minutes` : "Enregistrez votre réponse audio sur le sujet donné"}
                        </p>
                        <AudioRecorder
                          onRecordingComplete={async (blob) => {
                            try {
                              // Upload audio to get URL
                              const formData = new FormData();
                              formData.append('file', blob, 'recording.webm');
                              formData.append('category', 'TEST');
                              formData.append('title', `Expression_Orale_${currentQuestion.id}`);
                              
                              const uploadResponse = await apiClient.post('/upload', formData, {
                                headers: { 'Content-Type': 'multipart/form-data' }
                              });
                              
                              if (uploadResponse.success && (uploadResponse.data as any)?.url) {
                                const audioUrl = (uploadResponse.data as any).url;
                                
                                // Transcribe audio using AI
                                const transcriptionResponse = await apiClient.post('/ai/transcription', {
                                  videoUrl: audioUrl,
                                  lessonTitle: currentQuestion.questionText || 'Expression Orale',
                                  courseTitle: test.title
                                });
                                
                                const transcription = (transcriptionResponse as any)?.data?.transcription || (transcriptionResponse as any)?.transcription || '';
                                
                                // Store transcription as answer
                                handleAnswerChange(currentQuestion.id, transcription);
                                
                                // Also store audio URL for evaluation
                                const currentAnswer = answers[currentQuestion.id] || '';
                                if (currentAnswer) {
                                  handleAnswerChange(currentQuestion.id, `${currentAnswer}|AUDIO_URL:${audioUrl}`);
                                } else {
                                  handleAnswerChange(currentQuestion.id, `${transcription}|AUDIO_URL:${audioUrl}`);
                                }
                              }
                            } catch (error) {
                              console.error('Error uploading/transcribing audio:', error);
                            }
                          }}
                          maxDuration={test.duration ? test.duration * 60 : 300} // Convert minutes to seconds
                        />
                        {answers[currentQuestion.id] && !answers[currentQuestion.id].includes('AUDIO_URL:') && (
                          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-800">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transcription:</p>
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                              {answers[currentQuestion.id].split('|')[0]}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Short Answer / Written Expression / Expression Écrite */}
                  {(currentQuestion.type === "short-answer" || currentQuestion.type === "essay" || test.category === "WRITING") && (
                    <div className="space-y-3">
                      {/* Expression Écrite: Show passage if available */}
                      {test.category === "WRITING" && currentQuestion.passage && (
                        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                          <div className="mb-2 flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                              📝 Contexte pour votre écriture
                            </h4>
                          </div>
                          <div className="p-3 bg-white dark:bg-gray-800 rounded border border-green-100 dark:border-green-900 max-h-[300px] overflow-y-auto">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                              {currentQuestion.passage}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Writing Type Indicator for Expression Écrite */}
                      {test.category === "WRITING" && currentQuestion.writingType && (
                        <div className="mb-2 p-2 bg-green-100 dark:bg-green-900/30 rounded text-sm text-green-900 dark:text-green-100">
                          Type d'écriture: {currentQuestion.writingType === "article" ? "Article" : currentQuestion.writingType === "essay" ? "Essai" : "Lettre"}
                        </div>
                      )}
                      
                      <Textarea
                        placeholder={
                          test.category === "WRITING" 
                            ? t("Écrivez votre texte ici (article, essai ou lettre)...", "Write your text here (article, essay or letter)...")
                            : t("Écrivez votre réponse ici...", "Write your answer here...")
                        }
                        value={answers[currentQuestion.id] || ""}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className={`border-2 border-gray-200 focus:border-blue-500 resize-none rounded-lg p-4 ${
                          test.category === "WRITING" ? "min-h-96" : "min-h-48"
                        }`}
                      />
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex gap-4">
                          <span className={(() => {
                            const wordCount = countWords(answers[currentQuestion.id] || "")
                            const minWords = currentQuestion.minWords || 0
                            const maxWords = currentQuestion.maxWords || Infinity
                            if (test.category === "WRITING") {
                              if (wordCount < minWords) {
                                return "text-orange-600 font-semibold"
                              } else if (wordCount > maxWords) {
                                return "text-red-600 font-semibold"
                              } else {
                                return "text-green-600 font-semibold"
                              }
                            }
                            return "text-gray-600"
                          })()}>
                            {t("Mots:", "Words:")} {countWords(answers[currentQuestion.id] || "")}
                            {test.category === "WRITING" && currentQuestion.minWords && currentQuestion.maxWords && (
                              <span className="ml-1">
                                ({currentQuestion.minWords}-{currentQuestion.maxWords} requis)
                              </span>
                            )}
                          </span>
                          <span className="text-gray-600">{t("Caractères:", "Characters:")} {(answers[currentQuestion.id] || "").length}</span>
                        </div>
                        {/* Word count validation message */}
                        {test.category === "WRITING" && currentQuestion.minWords && currentQuestion.maxWords && (() => {
                          const wordCount = countWords(answers[currentQuestion.id] || "")
                          if (wordCount < currentQuestion.minWords!) {
                            return (
                              <span className="text-orange-600 text-xs font-medium">
                                ⚠️ Minimum {currentQuestion.minWords} mots requis
                              </span>
                            )
                          } else if (wordCount > currentQuestion.maxWords!) {
                            return (
                              <span className="text-red-600 text-xs font-medium">
                                ⚠️ Maximum {currentQuestion.maxWords} mots autorisés
                              </span>
                            )
                          } else {
                            return (
                              <span className="text-green-600 text-xs font-medium">
                                ✅ Nombre de mots valide
                              </span>
                            )
                          }
                        })()}
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


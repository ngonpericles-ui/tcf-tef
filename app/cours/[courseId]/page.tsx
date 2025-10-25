"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from '@/contexts/AuthContext'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UniversalContentViewer from "@/components/universal-content-viewer"
import { detectContentType } from "@/lib/content-type-utils"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  SkipBack, 
  SkipForward,
  Settings,
  Download,
  Share2,
  BookOpen,
  Brain,
  MessageSquare,
  Star,
  Clock,
  Users,
  ArrowLeft,
  Send,
  Loader2,
  Sparkles,
  Lightbulb,
  Bookmark,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import { type Course } from "@/components/course-data"

export default function CourseMediaPage() {
  const params = useParams()
  const router = useRouter()
  const { lang } = useLang()
  const { user, isAuthenticated } = useAuth()
  const courseId = params?.courseId as string
  
  // Handle case when courseId is not available
  if (!courseId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Cours non trouvé</h1>
          <p className="text-white/80 mb-6">L'identifiant du cours est manquant.</p>
          <Button onClick={() => router.push('/cours')} className="bg-red-600 hover:bg-red-700">
            Retour aux cours
          </Button>
        </div>
      </div>
    )
  }
  
  // ALL STATE DECLARATIONS MUST BE BEFORE ANY CONDITIONAL RETURNS
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [volume, setVolume] = useState(1) // HTML5 video max volume is 1
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [selectedResolution, setSelectedResolution] = useState<string>('auto')
  const [availableResolutions, setAvailableResolutions] = useState<Array<{label: string, value: string, url: string}>>([])

  // AI Features
  const [aiNotes, setAiNotes] = useState<string[]>([])
  const [aiQuestions, setAiQuestions] = useState<string[]>([])
  const [aiChat, setAiChat] = useState<Array<{type: 'user' | 'ai', message: string, timestamp: Date}>>([])
  const [chatInput, setChatInput] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [transcription, setTranscription] = useState<string>("")
  const [showTranscription, setShowTranscription] = useState(false)

  // NOW WE CAN DO CONDITIONAL RETURNS
  // Add loading state check
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-900">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Chargement du cours...</h1>
          <p className="text-gray-600">Veuillez patienter pendant que nous chargeons le contenu.</p>
        </div>
      </div>
    )
  }

  // Add error state check
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-900">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Erreur de chargement</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white">
              Réessayer
            </Button>
            <Button onClick={() => router.push('/cours')} className="bg-gray-600 hover:bg-gray-700 text-white">
              Retour aux cours
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Add course not found check
  if (!course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-900">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Cours non trouvé</h1>
          <p className="text-gray-600 mb-6">Le cours demandé n'existe pas ou a été supprimé.</p>
          <Button onClick={() => router.push('/cours')} className="bg-red-600 hover:bg-red-700 text-white">
            Retour aux cours
          </Button>
        </div>
      </div>
    )
  }
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Fetch transcription for video
  const fetchTranscription = async (videoUrl: string) => {
    if (!isAuthenticated) {
      console.log('❌ Cannot fetch transcription: not authenticated')
      setTranscription(t("Veuillez vous connecter pour utiliser la transcription.", "Please log in to use transcription."))
      return
    }
    
    try {
      console.log('🎤 Fetching transcription for video:', videoUrl)
      
      // Create better context for transcription
      const transcriptionContext = `
        Vidéo: ${videoUrl}
        Leçon: ${currentLesson?.title || ''}
        Cours: ${course?.title || ''}
        Type: Vidéo éducative de français
        Niveau: ${course?.level || 'A1'}
        Durée: ${course?.duration || '60 minutes'}
        
        Cette vidéo fait partie d'une leçon de français sur le thème "${currentLesson?.title || ''}".
        Le contenu est adapté pour l'apprentissage du français et couvre les aspects linguistiques,
        culturels et pédagogiques nécessaires à la maîtrise de la langue.
      `
      
      // Call the backend transcription API
      const response = await apiClient.generateTranscription(
        transcriptionContext,
        currentLesson?.title || '',
        course?.title || ''
      )
      
      console.log('📝 Transcription Response:', response)
      
      if ((response as any).success) {
        const transcriptionText = (response as any).data.transcription || (response as any).data
        setTranscription(transcriptionText)
        console.log('✅ Transcription received:', transcriptionText)
      } else {
        throw new Error('Transcription service returned unsuccessful response')
      }
    } catch (error) {
      console.error('❌ Error fetching transcription:', error)
      // Show error message instead of mock transcription
      setTranscription(t(
        "Erreur lors du chargement de la transcription. Veuillez réessayer.",
        "Error loading transcription. Please try again."
      ))
    }
  }

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('🔍 Fetching course with ID:', courseId)

        const response = await apiClient.get(`/courses/${courseId}`)

        console.log('🔍 API Response:', response)

        if ((response as any).success && (response as any).data) {
          const courseData = (response as any).data.course || (response as any).data

          if (!courseData) {
            throw new Error('No course data in response')
          }

          // Transform backend data to match frontend Course interface
          const transformedCourse: Course = {
            id: courseData.id,
            title: courseData.title,
            titleEn: courseData.titleEn || courseData.title,
            description: courseData.description,
            descriptionEn: courseData.descriptionEn || courseData.description,
            level: courseData.level,
            requiredTier: (courseData.requiredTier || courseData.subscriptionTier || 'FREE').toLowerCase() as 'free' | 'essential' | 'premium' | 'pro',
            type: courseData.category?.toLowerCase() || 'grammar',
            duration: courseData.duration ? `${courseData.duration} min` : '0 min',
            lessons: courseData.lessons || 1,
            progress: 0,
            image: courseData.image || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop&q=80",
            authorName: courseData.createdBy?.firstName + ' ' + courseData.createdBy?.lastName || 'Instructeur',
            tags: courseData.tags || [],
            createdBy: courseData.createdBy?.role === 'ADMIN' ? 'admin' : 'manager',
            createdAt: courseData.createdAt,
            rating: courseData.rating || 0,
            enrolledCount: courseData.enrolledCount ? `${courseData.enrolledCount}+` : '0',
            difficulty: courseData.level === 'A1' ? 1 : courseData.level === 'A2' ? 2 : courseData.level === 'B1' ? 3 : courseData.level === 'B2' ? 4 : 5,
            lessonsData: courseData.lessons_data || []
          }

          setCourse(transformedCourse)

          // Set current lesson (find first with video or content)
          const lessons = courseData.lessons_data || []
          const videoLesson = lessons.find((lesson: any) => lesson.videoUrl && lesson.videoUrl.trim() !== '')
          const contentLesson = lessons.find((lesson: any) => lesson.content && lesson.content.trim() !== '')
          const selectedLesson = videoLesson || contentLesson || lessons[0]

          if (!selectedLesson) {
            throw new Error('No lessons found in course')
          }

          console.log('📚 Course data:', courseData)
          console.log('📚 Course title:', courseData.title)
          console.log('📚 Transformed course:', transformedCourse)
          console.log('📚 Lessons data:', lessons)
          console.log('📚 Selected lesson:', selectedLesson)
          console.log('📚 Video URL:', selectedLesson?.videoUrl)
          console.log('📚 Content URL:', selectedLesson?.content)

          setCurrentLesson(selectedLesson)

          // Fetch transcription if available
          if (videoLesson?.videoUrl) {
            fetchTranscription(videoLesson.videoUrl)
          }
        } else {
          throw new Error('API Response not successful')
        }
      } catch (error) {
        console.error('❌ Error fetching course:', error)
        setError(error instanceof Error ? error.message : 'Erreur lors du chargement du cours')
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchCourse()
    }
  }, [courseId])

  // Video controls
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video) return
    
    const newTime = (value[0] / 100) * totalDuration
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    
    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const changeVolume = (newVolume: number) => {
    const video = videoRef.current
    if (!video) return
    
    // Clamp volume between 0 and 1 (HTML5 video limit)
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    video.volume = clampedVolume
    setVolume(clampedVolume)
    
    // Unmute if volume is increased
    if (clampedVolume > 0 && video.muted) {
      video.muted = false
      setIsMuted(false)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current
    if (!video) return
    
    video.playbackRate = rate
    setPlaybackRate(rate)
  }

  // Resolution handling
  const detectAvailableResolutions = () => {
    const video = videoRef.current
    if (!video) return

    // For Cloudinary videos, we can generate different resolution URLs
    if (currentLesson?.videoUrl?.includes('cloudinary.com')) {
      const baseUrl = currentLesson.videoUrl
      const resolutions = [
        { label: 'Auto', value: 'auto', url: baseUrl },
        { label: '1080p', value: '1080p', url: baseUrl.replace('/upload/', '/upload/q_auto,f_auto,w_1920/') },
        { label: '720p', value: '720p', url: baseUrl.replace('/upload/', '/upload/q_auto,f_auto,w_1280/') },
        { label: '480p', value: '480p', url: baseUrl.replace('/upload/', '/upload/q_auto,f_auto,w_854/') },
        { label: '360p', value: '360p', url: baseUrl.replace('/upload/', '/upload/q_auto,f_auto,w_640/') }
      ]
      setAvailableResolutions(resolutions)
    } else {
      // For other videos, just show auto
      setAvailableResolutions([{ label: 'Auto', value: 'auto', url: currentLesson?.videoUrl || '' }])
    }
  }

  const changeResolution = (resolution: string) => {
    const video = videoRef.current
    if (!video || !currentLesson) return

    setSelectedResolution(resolution)
    
    if (resolution === 'auto') {
      video.src = currentLesson.videoUrl
    } else {
      const selectedRes = availableResolutions.find(r => r.value === resolution)
      if (selectedRes) {
        video.src = selectedRes.url
      }
    }
    
    // Reload the video with new source
    video.load()
  }

  // AI Features
  const generateAiNotes = async () => {
    if (!currentLesson || !isAuthenticated) {
      console.log('❌ Cannot generate AI notes: not authenticated or no lesson')
      setAiNotes([t("Veuillez vous connecter pour utiliser l'IA.", "Please log in to use AI.")])
      return
    }
    
    setIsAiLoading(true)
    try {
      console.log('🤖 Generating AI notes for:', currentLesson.title)
      console.log('📊 Lesson data:', {
        title: currentLesson.title,
        content: currentLesson.content,
        videoUrl: currentLesson.videoUrl,
        courseTitle: course?.title
      })
      
      // Create better content for AI based on available data
      let contentForAI = currentLesson.content || ''
      
      // If content is empty or just a URL, create descriptive content
      if (!contentForAI || contentForAI.includes('http') || contentForAI.length < 50) {
        contentForAI = `
          Leçon: ${currentLesson.title}
          Cours: ${course?.title || ''}
          Type de contenu: ${currentLesson.videoUrl ? 'Vidéo éducative' : 'Contenu textuel'}
          ${currentLesson.videoUrl ? `URL de la vidéo: ${currentLesson.videoUrl}` : ''}
          ${currentLesson.content && !currentLesson.content.includes('http') ? `Contenu: ${currentLesson.content}` : ''}
          
          Cette leçon fait partie du cours "${course?.title || ''}" et couvre le sujet "${currentLesson.title}".
          Le contenu est adapté pour l'apprentissage du français et suit les standards pédagogiques.
        `
      }
      
      const response = await apiClient.generateNotes(
        contentForAI,
        currentLesson.title,
        course?.title || ''
      )
      
      console.log('📝 AI Notes Response:', response)
      
      if ((response as any).success) {
        const notes = (response as any).data.notes || (response as any).data
        setAiNotes(Array.isArray(notes) ? notes : [notes])
        console.log('✅ AI Notes generated successfully:', notes)
      } else {
        throw new Error('AI service returned unsuccessful response')
      }
    } catch (error) {
      console.error('❌ Error generating AI notes:', error)
      // Provide fallback notes based on lesson content
      const fallbackNotes = [
        t(`Points clés de la leçon: ${currentLesson.title}`, `Key points of the lesson: ${currentLesson.title}`),
        t("Concepts fondamentaux à retenir", "Fundamental concepts to remember"),
        t("Applications pratiques", "Practical applications"),
        t("Points d'attention importants", "Important points to pay attention to"),
        t("Résumé de la leçon", "Lesson summary")
      ]
      setAiNotes(fallbackNotes)
    } finally {
      setIsAiLoading(false)
    }
  }

  const generateAiQuestions = async () => {
    if (!currentLesson || !isAuthenticated) {
      console.log('❌ Cannot generate AI questions: not authenticated or no lesson')
      setAiQuestions([t("Veuillez vous connecter pour utiliser l'IA.", "Please log in to use AI.")])
      return
    }
    
    setIsAiLoading(true)
    try {
      console.log('🤖 Generating AI questions for:', currentLesson.title)
      
      // Create better content for AI based on available data
      let contentForAI = currentLesson.content || ''
      
      // If content is empty or just a URL, create descriptive content
      if (!contentForAI || contentForAI.includes('http') || contentForAI.length < 50) {
        contentForAI = `
          Leçon: ${currentLesson.title}
          Cours: ${course?.title || ''}
          Type de contenu: ${currentLesson.videoUrl ? 'Vidéo éducative' : 'Contenu textuel'}
          ${currentLesson.videoUrl ? `URL de la vidéo: ${currentLesson.videoUrl}` : ''}
          ${currentLesson.content && !currentLesson.content.includes('http') ? `Contenu: ${currentLesson.content}` : ''}
          
          Cette leçon fait partie du cours "${course?.title || ''}" et couvre le sujet "${currentLesson.title}".
          Le contenu est adapté pour l'apprentissage du français et suit les standards pédagogiques.
        `
      }
      
      const response = await apiClient.generateQuestions(
        contentForAI,
        currentLesson.title,
        course?.title || ''
      )
      
      console.log('❓ AI Questions Response:', response)
      
      if ((response as any).success) {
        const questions = (response as any).data.questions || (response as any).data
        setAiQuestions(Array.isArray(questions) ? questions : [questions])
        console.log('✅ AI Questions generated successfully:', questions)
      } else {
        throw new Error('AI service returned unsuccessful response')
      }
    } catch (error) {
      console.error('❌ Error generating AI questions:', error)
      // Provide fallback questions based on lesson content
      const fallbackQuestions = [
        t(`Quels sont les points principaux de "${currentLesson.title}" ?`, `What are the main points of "${currentLesson.title}"?`),
        t("Comment pouvez-vous appliquer ces concepts ?", "How can you apply these concepts?"),
        t("Quelles sont les difficultés potentielles ?", "What are the potential difficulties?"),
        t("Comment évaluez-vous votre compréhension ?", "How do you evaluate your understanding?"),
        t("Quelles questions avez-vous sur ce sujet ?", "What questions do you have about this topic?")
      ]
      setAiQuestions(fallbackQuestions)
    } finally {
      setIsAiLoading(false)
    }
  }

  const sendAiChat = async () => {
    if (!chatInput.trim() || !currentLesson || !isAuthenticated) {
      if (!isAuthenticated) {
        setAiChat([...aiChat, { type: 'ai', message: t("Veuillez vous connecter pour utiliser l'IA.", "Please log in to use AI."), timestamp: new Date() }])
      }
      return
    }
    
    const userMessage = chatInput.trim()
    setChatInput("")
    
    // Add user message to chat
    const newChat = [...aiChat, { type: 'user' as const, message: userMessage, timestamp: new Date() }]
    setAiChat(newChat)
    setIsAiLoading(true)
    
    try {
      console.log('🤖 Sending AI chat message:', userMessage)
      // Use the same method as home page AI assistant
      const response = await apiClient.sendChatMessage(userMessage)
      
      console.log('💬 AI Chat Response:', response)
      
      if ((response as any).success) {
        const aiResponse = (response as any).data.response || (response as any).data.message
        setAiChat([...newChat, { type: 'ai', message: aiResponse, timestamp: new Date() }])
        console.log('✅ AI Chat response received:', aiResponse)
      } else {
        throw new Error('AI service returned unsuccessful response')
      }
    } catch (error) {
      console.error('❌ Error with AI chat:', error)
      // Show error message instead of fallback
      const errorMessage = t(
        "Erreur de connexion avec l'IA. Veuillez réessayer.",
        "AI connection error. Please try again."
      )
      setAiChat([...newChat, { type: 'ai', message: errorMessage, timestamp: new Date() }])
    } finally {
      setIsAiLoading(false)
    }
  }

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiChat])

  // Apply volume to video when it changes
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.volume = volume
    }
  }, [volume])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t("Chargement du cours...", "Loading course...")}</p>
        </div>
      </div>
    )
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">{t("Cours non trouvé", "Course not found")}</h2>
          <p className="text-muted-foreground mb-4">{t("Ce cours n'existe pas ou n'est pas accessible.", "This course doesn't exist or is not accessible.")}</p>
          <Button onClick={() => router.push('/cours')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("Retour aux cours", "Back to courses")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Netflix-Style Header */}
      <div className="bg-gradient-to-b from-black/90 via-black/50 to-transparent backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/cours')}
                className="text-white hover:bg-white/20 transition-all duration-200 rounded-full p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white truncate max-w-md">
                    {lang === "fr" ? (course.title || course.titleEn) : (course.titleEn || course.title)}
                  </h1>
                  <p className="text-sm text-white/80 truncate max-w-md">{currentLesson.title}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-600 text-white border-0 text-xs font-medium px-2 py-1">
                  {course.level}
                </Badge>
                <span className="text-white/80 text-sm">{course.duration}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAiPanel(!showAiPanel)}
                className={`transition-all duration-200 rounded-full px-4 py-2 ${
                  showAiPanel 
                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                    : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                }`}
              >
                <Brain className="h-4 w-4 mr-2" />
                {t("IA", "AI")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Video Player - Netflix/YouTube Style */}
          <div className="xl:col-span-3 min-w-0">
            <div className="relative group">
              <div
                className="relative bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video w-full"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                  {currentLesson.videoUrl && currentLesson.videoUrl.trim() !== '' ? (
                    <UniversalContentViewer
                      url={currentLesson.videoUrl}
                      title={currentLesson.title}
                      className="w-full h-full"
                      allowDownload={false}
                    />
                  ) : currentLesson.content ? (
                    <UniversalContentViewer
                      url={currentLesson.content}
                      title={currentLesson.title}
                      className="w-full h-full"
                      allowDownload={false}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-800 to-slate-900 p-8">
                      <div className="text-center max-w-2xl">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                          <BookOpen className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-4">{currentLesson.title}</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                          <p className="text-white/90 text-lg leading-relaxed">
                            {t("Aucun contenu disponible", "No content available")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Netflix/YouTube Style Controls */}
                {currentLesson.videoUrl && currentLesson.videoUrl.trim() !== '' && showControls && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 flex flex-col justify-between p-6 transition-opacity duration-300">
                    {/* Top Controls */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-red-600 text-white border-0">
                          {course.level}
                        </Badge>
                        <span className="text-white/80 text-sm">{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-white hover:bg-white/20 transition-all"
                          onClick={toggleFullscreen}
                        >
                          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Center Play Button */}
                    <div className="flex items-center justify-center">
                      <Button
                        size="lg"
                        variant="ghost"
                        className="text-white hover:bg-white/20 h-20 w-20 rounded-full transition-all duration-200 hover:scale-110"
                        onClick={togglePlay}
                      >
                        {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
                      </Button>
                    </div>

                    {/* Bottom Controls */}
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div className="flex items-center gap-3">
                        <span className="text-white text-sm font-mono">
                          {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
                        </span>
                        <div className="flex-1 bg-white/20 rounded-full h-1 cursor-pointer group" onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const x = e.clientX - rect.left
                          const percentage = x / rect.width
                          const newTime = percentage * totalDuration
                          if (videoRef.current) {
                            videoRef.current.currentTime = newTime
                            setCurrentTime(newTime)
                          }
                        }}>
                          <div 
                            className="bg-white rounded-full h-1 transition-all duration-200 group-hover:h-2"
                            style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                          />
                        </div>
                        <span className="text-white text-sm font-mono">
                          {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toFixed(0).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 transition-all">
                            <SkipBack className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 transition-all" onClick={togglePlay}>
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 transition-all">
                            <SkipForward className="w-4 h-4" />
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 transition-all" onClick={toggleMute}>
                              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </Button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={volume}
                              onChange={(e) => changeVolume(Number(e.target.value))}
                              className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                              style={{
                                background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`,
                                WebkitAppearance: 'none',
                                outline: 'none'
                              }}
                            />
                            <span className="text-white text-xs font-mono w-8">
                              {Math.round(volume * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <select 
                            value={playbackRate} 
                            onChange={(e) => changePlaybackRate(Number(e.target.value))}
                            className="bg-black/50 text-white text-sm border border-white/20 rounded-lg px-3 py-1 backdrop-blur-sm"
                          >
                            <option value={0.5}>0.5x</option>
                            <option value={0.75}>0.75x</option>
                            <option value={1}>1x</option>
                            <option value={1.25}>1.25x</option>
                            <option value={1.5}>1.5x</option>
                            <option value={2}>2x</option>
                          </select>
                          {availableResolutions.length > 1 && (
                            <select 
                              value={selectedResolution} 
                              onChange={(e) => changeResolution(e.target.value)}
                              className="bg-black/50 text-white text-sm border border-white/20 rounded-lg px-3 py-1 backdrop-blur-sm"
                            >
                              {availableResolutions.map((res) => (
                                <option key={res.value} value={res.value}>{res.label}</option>
                              ))}
                            </select>
                          )}
                          <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 transition-all">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Course Information - Spotify/Netflix Style */}
            <div className="mt-8 space-y-6">
              {/* Course Title & Description */}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  {lang === "fr" ? (course.title || course.titleEn) : (course.titleEn || course.title)}
                </h2>
                <p className="text-white/80 text-lg leading-relaxed">
                  {lang === "fr" ? (course.description || course.descriptionEn) : (course.descriptionEn || course.description)}
                </p>
              </div>

              {/* Course Stats - Netflix Style */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.floor(course.rating || 0) ? 'text-yellow-400 fill-current' : 'text-white/30'}`} />
                    ))}
                  </div>
                  <span className="text-white/80 text-sm">{(course.rating || 0).toFixed(1)}/5</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Users className="h-4 w-4" />
                  <span>{course.enrolledCount} {t("étudiants", "students")}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.lessons} {t("leçons", "lessons")}</span>
                </div>
              </div>

              {/* Course Tags */}
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20 transition-all">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Transcription Section */}
              {currentLesson.videoUrl && currentLesson.videoUrl.trim() !== '' && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {t("Transcription", "Transcription")}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTranscription(!showTranscription)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all"
                    >
                      {showTranscription ? t("Masquer", "Hide") : t("Afficher", "Show")}
                    </Button>
                  </div>
                  
                  {showTranscription && (
                    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                      {transcription ? (
                        <div className="space-y-4">
                          <p className="text-white/90 leading-relaxed whitespace-pre-line">
                            {transcription}
                          </p>
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>{t("Transcription automatique", "Auto-generated transcription")}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-white/80">{t("Transcription en cours de génération...", "Transcription is being generated...")}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Panel - Modern Design */}
          {showAiPanel && (
            <div className="xl:col-span-1 min-w-[320px] max-w-[400px]">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 h-fit sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{t("Assistant IA", "AI Assistant")}</h3>
                </div>

                <Tabs defaultValue="chat" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3 bg-white/10 border-white/20">
                    <TabsTrigger value="chat" className="text-white data-[state=active]:bg-white/20">{t("Chat", "Chat")}</TabsTrigger>
                    <TabsTrigger value="notes" className="text-white data-[state=active]:bg-white/20">{t("Notes", "Notes")}</TabsTrigger>
                    <TabsTrigger value="questions" className="text-white data-[state=active]:bg-white/20">{t("Questions", "Questions")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="chat" className="space-y-4">
                    <div className="h-80 overflow-y-auto space-y-3 pr-2">
                      {aiChat.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] p-3 rounded-2xl ${
                              message.type === 'user'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                : 'bg-white/10 text-white backdrop-blur-sm'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isAiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                              <span className="text-sm text-white">{t("L'IA réfléchit...", "AI is thinking...")}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={t("Posez une question...", "Ask a question...")}
                        onKeyPress={(e) => e.key === 'Enter' && sendAiChat()}
                        disabled={isAiLoading}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
                      />
                      <Button 
                        onClick={sendAiChat} 
                        disabled={!chatInput.trim() || isAiLoading}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4">
                    <div className="h-80 overflow-y-auto">
                      {aiNotes.length > 0 ? (
                        <div className="space-y-3">
                          {aiNotes.map((note, index) => (
                            <div key={index} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs font-bold text-white">{index + 1}</span>
                                </div>
                                <p className="text-sm text-white leading-relaxed">{note}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lightbulb className="h-8 w-8 text-white" />
                          </div>
                          <p className="text-white/80 mb-4">{t("Générez des notes automatiques", "Generate automatic notes")}</p>
                          <Button 
                            onClick={generateAiNotes} 
                            disabled={isAiLoading}
                            className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white border-0"
                          >
                            {isAiLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            {t("Générer", "Generate")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="questions" className="space-y-4">
                    <div className="h-80 overflow-y-auto">
                      {aiQuestions.length > 0 ? (
                        <div className="space-y-3">
                          {aiQuestions.map((question, index) => (
                            <div key={index} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs font-bold text-white">?</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white mb-1">{t("Question", "Question")} {index + 1}</p>
                                  <p className="text-sm text-white/80 leading-relaxed">{question}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="h-8 w-8 text-white" />
                          </div>
                          <p className="text-white/80 mb-4">{t("Générez des questions de révision", "Generate review questions")}</p>
                          <Button 
                            onClick={generateAiQuestions} 
                            disabled={isAiLoading}
                            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white border-0"
                          >
                            {isAiLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            {t("Générer", "Generate")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

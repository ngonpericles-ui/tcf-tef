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
  ThumbsDown,
  Bot,
  User,
  Copy,
  CheckCircle2,
  Zap,
  FileText,
  HelpCircle,
  X,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Globe
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import { type Course } from "@/components/course-data"
import { toast } from "sonner"

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
  const [videoLoading, setVideoLoading] = useState(true)
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
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']))
  const [showNotes, setShowNotes] = useState(false)

  // Removed early returns - they violate React rules of hooks
  // Loading/error checks are now at the end of the component
  // Removed early return for !course - violates React rules of hooks

  const videoRef = useRef<HTMLVideoElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Format time display helper
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Fetch transcription for video
  const fetchTranscription = async (videoUrl: string) => {
    // Always try to fetch transcription - the backend will handle authentication
    // Don't block on frontend authentication check
    try {
      console.log('🎤 Fetching transcription for video:', videoUrl)
      console.log('🔑 User authenticated:', isAuthenticated, 'User:', user)
      
      // Call the backend transcription API with video URL
      // Backend will handle authentication properly
      const response = await apiClient.generateTranscription(
        videoUrl, // Use actual video URL, not context
        currentLesson?.title || '',
        course?.title || ''
      )
      
      console.log('📝 Transcription Response:', response)
      
      if ((response as any).success) {
        const transcriptionText = (response as any).data.transcription || (response as any).data
        setTranscription(transcriptionText)
        console.log('✅ Transcription received:', transcriptionText)
      } else {
        // If transcription fails, show helpful message but don't block
        const errorMsg = (response as any).error?.message || 'Transcription service returned unsuccessful response'
        console.warn('⚠️ Transcription failed:', errorMsg)
        setTranscription(t(
          "La transcription n'est pas disponible pour le moment. Veuillez réessayer plus tard.",
          "Transcription is not available at the moment. Please try again later."
        ))
      }
    } catch (error: any) {
      console.error('❌ Error fetching transcription:', error)
      // Show helpful error message
      const errorMsg = error?.response?.data?.error?.message || error?.message || 'Unknown error'
      console.error('❌ Transcription error details:', errorMsg)
      
      // Don't show authentication error if user is authenticated
      if (errorMsg.includes('authenticated') || errorMsg.includes('authentication')) {
        setTranscription(t(
          "Erreur d'authentification. Veuillez vous reconnecter.",
          "Authentication error. Please log in again."
        ))
      } else {
      setTranscription(t(
        "Erreur lors du chargement de la transcription. Veuillez réessayer.",
        "Error loading transcription. Please try again."
      ))
      }
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
            // Duration is stored in minutes, format it properly
            duration: courseData.duration ? (() => {
              const durationMinutes = typeof courseData.duration === 'number' ? courseData.duration : parseInt(courseData.duration) || 0;
              // If duration is suspiciously large (likely in seconds), convert it
              if (durationMinutes > 1000) {
                // Likely stored in seconds, convert to minutes
                const actualMinutes = Math.round(durationMinutes / 60);
                return `${actualMinutes} min`;
              }
              return `${durationMinutes} min`;
            })() : '0 min',
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
          setSelectedLessonId(selectedLesson.id)

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
    setVideoLoading(true)
    
    if (resolution === 'auto') {
      video.src = currentLesson.videoUrl
    } else {
      const selectedRes = availableResolutions.find(r => r.value === resolution)
      if (selectedRes) {
        video.src = selectedRes.url
      }
    }
    
    // Reload the video with new source and wait for metadata
    video.load()
    
    // Wait for metadata to update duration
    video.addEventListener('loadedmetadata', () => {
      if (video) {
        setTotalDuration(video.duration)
        setVideoLoading(false)
      }
    }, { once: true })
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

  // Group lessons for navigation sidebar
  const groupedLessons = course?.lessonsData?.reduce((acc: any, lesson: any) => {
    const section = 'Course Content'
    if (!acc[section]) {
      acc[section] = []
    }
    acc[section].push(lesson)
    return acc
  }, {}) || {}

  // Handle lesson selection
  const handleLessonSelect = (lesson: any) => {
    setCurrentLesson(lesson)
    setSelectedLessonId(lesson.id)
    if (lesson.videoUrl) {
      fetchTranscription(lesson.videoUrl)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Coursera-Style Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/cours')}
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("Retour", "Back")}
              </Button>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer">{t("Cours", "Courses")}</span>
                <ChevronRight className="h-4 w-4" />
                <span className="text-gray-900 dark:text-white font-medium">{course?.title || ''}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotes(!showNotes)}
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Bookmark className="h-4 w-4 mr-2" />
                {t("Notes", "Notes")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAiPanel(!showAiPanel)}
                className={`transition-all ${
                  showAiPanel 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Brain className="h-4 w-4 mr-2" />
                {t("IA", "AI")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Coursera-Style Three Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Course Navigation (Coursera Style) */}
        <aside className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("Navigation du cours", "Course Navigation")}
            </h2>
            
            {/* Course Introduction */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {course?.title || ''}
              </h3>
      </div>

            {/* Lessons List */}
            <nav className="space-y-1">
              {Object.entries(groupedLessons).map(([section, lessons]: [string, any]) => (
                <div key={section} className="mb-4">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedSections)
                      if (newExpanded.has(section)) {
                        newExpanded.delete(section)
                      } else {
                        newExpanded.add(section)
                      }
                      setExpandedSections(newExpanded)
                    }}
                    className="flex items-center justify-between w-full text-left text-sm font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span>{section}</span>
                    {expandedSections.has(section) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  
                  {expandedSections.has(section) && (
                    <div className="ml-4 space-y-1">
                      {lessons.map((lesson: any, index: number) => (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonSelect(lesson)}
                          className={`w-full text-left flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            selectedLessonId === lesson.id
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {lesson.videoUrl ? (
                              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <FileText className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium mb-0.5 text-gray-500 dark:text-gray-400">
                              {lesson.videoUrl ? t("Vidéo", "Video") : t("Lecture", "Reading")}
                            </div>
                            <div className="text-sm font-medium truncate">{lesson.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {lesson.duration ? formatTime(lesson.duration * 60) : '0 min'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Center Column - Video Player (Coursera Style) */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          <div className="max-w-5xl mx-auto p-6">
            {/* Lesson Title */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {currentLesson?.title || course?.title || ''}
              </h1>
            </div>

            {/* Video Player - Coursera Style */}
            <div className="mb-6">
              <div className="relative bg-black rounded-lg overflow-hidden shadow-lg aspect-video w-full">
                <div
                  className="relative w-full h-full"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                  {currentLesson.videoUrl && currentLesson.videoUrl.trim() !== '' ? (
                    <>
                      <video
                        ref={videoRef}
                        src={currentLesson.videoUrl}
                        className="w-full h-full object-contain bg-black"
                        onLoadedMetadata={() => {
                          const video = videoRef.current
                          if (video) {
                            setTotalDuration(video.duration)
                            detectAvailableResolutions()
                            setVideoLoading(false)
                          }
                        }}
                        onTimeUpdate={() => {
                          const video = videoRef.current
                          if (video) {
                            setCurrentTime(video.currentTime)
                          }
                        }}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        onWaiting={() => setVideoLoading(true)}
                        onCanPlay={() => setVideoLoading(false)}
                        onError={(e) => {
                          console.error('Video error:', e)
                          setError('Failed to load video')
                          setVideoLoading(false)
                        }}
                        playsInline
                        preload="metadata"
                        crossOrigin="anonymous"
                      />
                      {videoLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                          <div className="text-center">
                            <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
                            <p className="text-white text-sm">{t("Chargement de la vidéo...", "Loading video...")}</p>
                          </div>
                        </div>
                      )}
                    </>
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

                {/* Coursera-Style Video Controls */}
                {currentLesson.videoUrl && currentLesson.videoUrl.trim() !== '' && (
                  <>
                    {/* Center Play Button (when paused) */}
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="lg"
                        variant="ghost"
                          className="text-white hover:bg-white/10 h-16 w-16 rounded-full bg-black/50 backdrop-blur-sm"
                        onClick={togglePlay}
                      >
                          <Play className="h-8 w-8 ml-1" />
                      </Button>
                    </div>
                    )}

                    {/* Bottom Controls */}
                    {showControls && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                      {/* Progress Bar */}
                        <div className="px-4 py-2">
                      <div className="flex items-center gap-3">
                            <span className="text-white text-sm font-medium">
                              {formatTime(currentTime)}
                        </span>
                            <div 
                              className="flex-1 bg-gray-600 rounded-full h-1 cursor-pointer group relative" 
                              onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const x = e.clientX - rect.left
                          const percentage = x / rect.width
                          const newTime = percentage * totalDuration
                          if (videoRef.current) {
                            videoRef.current.currentTime = newTime
                            setCurrentTime(newTime)
                          }
                              }}
                            >
                          <div 
                                className="bg-blue-500 rounded-full h-1 transition-all duration-200 group-hover:h-2"
                                style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
                          />
                        </div>
                            <span className="text-white text-sm font-medium">
                              {formatTime(totalDuration)}
                        </span>
                          </div>
                      </div>

                        {/* Control Bar */}
                        <div className="px-4 py-3 flex items-center justify-between bg-black/70">
                          <div className="flex items-center gap-3">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-white hover:bg-white/10 h-8 w-8 p-0"
                              onClick={togglePlay}
                            >
                              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-white hover:bg-white/10 h-8 w-8 p-0"
                                onClick={toggleMute}
                              >
                                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={volume}
                              onChange={(e) => changeVolume(Number(e.target.value))}
                                className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                              style={{
                                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #4b5563 ${volume * 100}%, #4b5563 100%)`,
                                WebkitAppearance: 'none',
                                outline: 'none'
                              }}
                            />
                          </div>
                        </div>
                          <div className="flex items-center gap-2">
                          <select 
                            value={playbackRate} 
                            onChange={(e) => changePlaybackRate(Number(e.target.value))}
                              className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-2 py-1"
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
                                className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-2 py-1"
                            >
                              {availableResolutions.map((res) => (
                                <option key={res.value} value={res.value}>{res.label}</option>
                              ))}
                            </select>
                          )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-white hover:bg-white/10 h-8 w-8 p-0"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-white hover:bg-white/10 h-8 w-8 p-0"
                              onClick={toggleFullscreen}
                            >
                              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      </div>
                    )}
                  </>
                )}
                </div>
              </div>
            </div>

            {/* Action Buttons - Coursera Style */}
            {currentLesson.videoUrl && currentLesson.videoUrl.trim() !== '' && (
              <div className="mb-6 flex items-center gap-3">
                <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                  <Bookmark className="h-4 w-4 mr-2" />
                  {t("Enregistrer une note", "Save Note")}
                </Button>
                <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t("Discuter", "Discuss")}
                </Button>
                <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                  <Download className="h-4 w-4 mr-2" />
                  {t("Télécharger", "Download")}
                </Button>
                <div className="flex items-center gap-2 ml-auto">
                  <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300">
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300">
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                    </div>
                  </div>
                )}

            {/* Transcript Section - Coursera Style */}
            {currentLesson.videoUrl && currentLesson.videoUrl.trim() !== '' && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t("Transcription", "Transcript")}
                  </h3>
                  <div className="flex items-center gap-2">
                    <select className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800">
                      <option>{t("Français", "French")}</option>
                      <option>{t("Anglais", "English")}</option>
                    </select>
                    <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">
                      {t("Aider à traduire", "Help Us Translate")}
                    </Button>
              </div>
            </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {transcription ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {transcription}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                      {t("Transcription en cours de génération...", "Transcription is being generated...")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Course Information - Coursera Style */}
            <div className="space-y-4">
              {/* Course Title & Description */}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {lang === "fr" ? (course.title || course.titleEn) : (course.titleEn || course.title)}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {lang === "fr" ? (course.description || course.descriptionEn) : (course.descriptionEn || course.description)}
                </p>
              </div>

              {/* Course Stats - Clean Style */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.floor(course.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                    ))}
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 text-sm">{(course.rating || 0).toFixed(1)}/5</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Users className="h-4 w-4" />
                  <span>{course.enrolledCount} {t("étudiants", "students")}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.lessons} {t("leçons", "lessons")}</span>
                </div>
              </div>

              {/* Course Tags */}
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Transcription Section */}
              {currentLesson.videoUrl && currentLesson.videoUrl.trim() !== '' && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {t("Transcription", "Transcription")}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTranscription(!showTranscription)}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      {showTranscription ? t("Masquer", "Hide") : t("Afficher", "Show")}
                    </Button>
                  </div>
                  
                  {showTranscription && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                      {transcription ? (
                        <div className="space-y-4">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                            {transcription}
                          </p>
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>{t("Transcription automatique", "Auto-generated transcription")}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">{t("Transcription en cours de génération...", "Transcription is being generated...")}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Notes/AI Panel (Coursera Style) */}
          {showAiPanel && (
          <aside className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto flex-shrink-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("Notes", "Notes")}
                </h2>
                <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">
                  {t("Toutes les notes", "All notes")}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
                  </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Bookmark className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t("Enregistrer une note", "Save Note")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("Cliquez sur le bouton pour capturer une capture d'écran.", "Click the button to capture a screenshot.")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t("Ajouter vos propres notes", "Add your own notes")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("Vous pouvez également surligner et enregistrer des lignes de la transcription ci-dessous.", "You can also highlight and save lines from the transcript below.")}
                    </p>
                  </div>
                </div>
                </div>

              {/* AI Assistant Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t("Assistant IA", "AI Assistant")}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("Votre assistant d'apprentissage", "Your learning assistant")}</p>
                  </div>
                </div>
                
                <div className="bg-[#343541] rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg h-[calc(100vh-400px)] flex flex-col">
                {/* ChatGPT Style Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{t("Assistant IA", "AI Assistant")}</h3>
                      <p className="text-xs text-gray-400">{t("Votre assistant d'apprentissage", "Your learning assistant")}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAiPanel(false)}
                    className="text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tabs - ChatGPT Style */}
                <Tabs defaultValue="chat" className="flex-1 flex flex-col">
                  <div className="px-4 pt-4 border-b border-gray-700">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 p-1 rounded-lg">
                      <TabsTrigger 
                        value="chat" 
                        className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white text-xs font-medium"
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                        {t("Chat", "Chat")}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="notes" 
                        className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white text-xs font-medium"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        {t("Notes", "Notes")}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="questions" 
                        className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white text-xs font-medium"
                      >
                        <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                        {t("Questions", "Questions")}
                      </TabsTrigger>
                  </TabsList>
                  </div>

                  {/* Chat Tab - ChatGPT Style */}
                  <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0 mt-0">
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                      {aiChat.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <Bot className="h-8 w-8 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-white mb-2">{t("Démarrez une conversation", "Start a conversation")}</h4>
                          <p className="text-sm text-gray-400 mb-6 max-w-sm">
                            {t("Posez des questions sur le cours, demandez des explications ou obtenez de l'aide.", "Ask questions about the course, request explanations, or get help.")}
                          </p>
                          <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                            {[
                              t("Expliquez ce concept", "Explain this concept"),
                              t("Résumez cette leçon", "Summarize this lesson"),
                              t("Donnez des exemples", "Give examples"),
                              t("Quelle est la signification?", "What is the meaning?")
                            ].map((suggestion, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setChatInput(suggestion)
                                  setTimeout(() => sendAiChat(), 100)
                                }}
                                className="justify-start text-left text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white text-xs h-auto py-2 px-3"
                              >
                                <Zap className="h-3 w-3 mr-2 flex-shrink-0" />
                                <span className="truncate">{suggestion}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                      {aiChat.map((message, index) => (
                        <div
                          key={index}
                              className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                              {message.type === 'ai' && (
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Bot className="h-4 w-4 text-white" />
                                </div>
                              )}
                          <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                              message.type === 'user'
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-gray-800 text-gray-100'
                            }`}
                          >
                                <div className="flex items-start gap-2">
                                  {message.type === 'user' && (
                                    <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <User className="h-3.5 w-3.5 text-white" />
                          </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(message.message)
                                          toast.success(t("Copié!", "Copied!"))
                                        }}
                                        className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
                                      >
                                        <Copy className="h-3 w-3" />
                                        {t("Copier", "Copy")}
                                      </button>
                                      <span className="text-xs text-gray-500">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {message.type === 'user' && (
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-white" />
                                </div>
                              )}
                        </div>
                      ))}
                      {isAiLoading && (
                            <div className="flex gap-4">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="h-4 w-4 text-white" />
                              </div>
                              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                                  <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                  </div>
                                  <span className="text-xs text-gray-400 ml-2">{t("L'IA écrit...", "AI is typing...")}</span>
                            </div>
                          </div>
                        </div>
                          )}
                        </>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    
                    {/* Input Area - ChatGPT Style */}
                    <div className="border-t border-gray-700 p-4">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                            placeholder={t("Message...", "Message...")}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                sendAiChat()
                              }
                            }}
                        disabled={isAiLoading}
                            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-gray-500 focus:ring-gray-500 pr-10"
                      />
                          {chatInput.trim() && (
                      <Button 
                              size="sm"
                              variant="ghost"
                              onClick={() => sendAiChat()}
                              disabled={isAiLoading}
                              className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white hover:bg-gray-600 h-7 w-7 p-0"
                      >
                              <Send className="h-3.5 w-3.5" />
                      </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        {t("L'IA peut faire des erreurs. Vérifiez les informations importantes.", "AI can make mistakes. Check important info.")}
                      </p>
                    </div>
                  </TabsContent>

                  {/* Notes Tab - ChatGPT Style */}
                  <TabsContent value="notes" className="flex-1 flex flex-col p-0 m-0 mt-0">
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                      {aiNotes.length > 0 ? (
                        <div className="space-y-3">
                          {aiNotes.map((note, index) => (
                            <div key={index} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Lightbulb className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-400">{t("Note", "Note")} {index + 1}</span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(note)
                                        toast.success(t("Copié!", "Copied!"))
                                      }}
                                      className="text-gray-500 hover:text-gray-300"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <p className="text-sm text-gray-100 leading-relaxed">{note}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
                            <Lightbulb className="h-10 w-10 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-white mb-2">{t("Générer des notes automatiques", "Generate automatic notes")}</h4>
                          <p className="text-sm text-gray-400 mb-6 max-w-sm">
                            {t("L'IA analysera le contenu et créera des notes structurées pour vous.", "AI will analyze the content and create structured notes for you.")}
                          </p>
                          <Button 
                            onClick={generateAiNotes} 
                            disabled={isAiLoading}
                            className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white border-0"
                          >
                            {isAiLoading ? (
                              <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("Génération...", "Generating...")}
                              </>
                            ) : (
                              <>
                              <Sparkles className="h-4 w-4 mr-2" />
                                {t("Générer des notes", "Generate notes")}
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Questions Tab - ChatGPT Style */}
                  <TabsContent value="questions" className="flex-1 flex flex-col p-0 m-0 mt-0">
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                      {aiQuestions.length > 0 ? (
                        <div className="space-y-3">
                          {aiQuestions.map((question, index) => (
                            <div key={index} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <HelpCircle className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-400">{t("Question", "Question")} {index + 1}</span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(question)
                                        toast.success(t("Copié!", "Copied!"))
                                      }}
                                      className="text-gray-500 hover:text-gray-300"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <p className="text-sm text-gray-100 leading-relaxed font-medium">{question}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4">
                            <HelpCircle className="h-10 w-10 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-white mb-2">{t("Générer des questions de révision", "Generate review questions")}</h4>
                          <p className="text-sm text-gray-400 mb-6 max-w-sm">
                            {t("L'IA créera des questions pour tester votre compréhension du cours.", "AI will create questions to test your understanding of the course.")}
                          </p>
                          <Button 
                            onClick={generateAiQuestions} 
                            disabled={isAiLoading}
                            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white border-0"
                          >
                            {isAiLoading ? (
                              <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("Génération...", "Generating...")}
                              </>
                            ) : (
                              <>
                              <Sparkles className="h-4 w-4 mr-2" />
                                {t("Générer des questions", "Generate questions")}
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
          </aside>
          )}
      </div>
    </div>
  )
}

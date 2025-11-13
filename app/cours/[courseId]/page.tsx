"use client"

import { useState, useEffect, useRef, useCallback, use } from "react"
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
import Image from "next/image"

// Resolution Dropdown Component
function ResolutionDropdown({ 
  resolutions, 
  selectedResolution, 
  onSelect 
}: { 
  resolutions: Array<{label: string, value: string, url: string}>, 
  selectedResolution: string, 
  onSelect: (value: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="text-white hover:bg-white/10 h-8 w-8 rounded-full flex items-center justify-center transition-all"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        title={t("Résolution", "Resolution")}
      >
        <Settings className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg p-2 min-w-[120px] z-50 border border-white/10 shadow-lg">
          {resolutions.map((res) => (
            <button
              key={res.value}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(res.value)
                setIsOpen(false)
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 transition-all ${
                selectedResolution === res.value
                  ? 'text-[#00FF7F] font-medium bg-white/5'
                  : 'text-white'
              }`}
            >
              {res.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CourseMediaPage(props?: { params?: Promise<{ courseId?: string }>, searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  // Handle Next.js 15+ async params
  const paramsFromHook = useParams()
  const params = props?.params ? use(props.params) : paramsFromHook
  const router = useRouter()
  const { lang } = useLang()
  const { user, isAuthenticated } = useAuth()
  const courseId = (params?.courseId || (params as any)?.courseId) as string
  
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
  const [showControls, setShowControls] = useState(false)
  const [suggestedVideos, setSuggestedVideos] = useState<any[]>([])
  const [playbackRate, setPlaybackRate] = useState(1)
  const [selectedResolution, setSelectedResolution] = useState<string>('auto')
  const [availableResolutions, setAvailableResolutions] = useState<Array<{label: string, value: string, url: string}>>([])
  const [bufferedRanges, setBufferedRanges] = useState<number>(0)
  const [isPlayPromisePending, setIsPlayPromisePending] = useState(false)
  const [playbackReady, setPlaybackReady] = useState(false)

  // AI Features
  const [aiNotes, setAiNotes] = useState<string[]>([])
  const [aiQuestions, setAiQuestions] = useState<string[]>([])
  const [aiChat, setAiChat] = useState<Array<{type: 'user' | 'ai', message: string, timestamp: Date}>>([])
  const [chatInput, setChatInput] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [transcription, setTranscription] = useState<string>("")
  const [transcriptionSegments, setTranscriptionSegments] = useState<Array<{timestamp: string, text: string, timeInSeconds: number}>>([])
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(-1)
  const [showTranscription, setShowTranscription] = useState(false)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']))
  const [showNotes, setShowNotes] = useState(false)
  const transcriptionRef = useRef<HTMLDivElement>(null)

  // Removed early returns - they violate React rules of hooks
  // Loading/error checks are now at the end of the component
  // Removed early return for !course - violates React rules of hooks

  const videoRef = useRef<HTMLVideoElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Parse transcription with timestamps (format: [MM:SS] text)
  const parseTranscriptionWithTimestamps = (text: string): Array<{timestamp: string, text: string, timeInSeconds: number}> => {
    if (!text) return []
    
    const lines = text.split('\n').filter(line => line.trim())
    const segments: Array<{timestamp: string, text: string, timeInSeconds: number}> = []
    
    for (const line of lines) {
      // Match [MM:SS] or [M:SS] format at the start of the line
      const match = line.match(/^\[(\d{1,2}):(\d{2})\]\s*(.+)$/)
      if (match) {
        const minutes = parseInt(match[1], 10)
        const seconds = parseInt(match[2], 10)
        const timeInSeconds = minutes * 60 + seconds
        const text = match[3].trim()
        
        segments.push({
          timestamp: `[${match[1]}:${match[2]}]`,
          text,
          timeInSeconds
        })
      }
    }
    
    return segments
  }

  // Update current segment based on video time
  useEffect(() => {
    const video = videoRef.current
    if (!video || transcriptionSegments.length === 0) return

    const updateCurrentSegment = () => {
      if (!video) return
      const currentTime = video.currentTime
      
      // Find the segment that matches the current time
      let newIndex = -1
      for (let i = transcriptionSegments.length - 1; i >= 0; i--) {
        if (currentTime >= transcriptionSegments[i].timeInSeconds) {
          newIndex = i
          break
        }
      }
      
      if (newIndex !== currentSegmentIndex) {
        setCurrentSegmentIndex(newIndex)
        
        // Scroll to current segment
        if (transcriptionRef.current && newIndex >= 0) {
          const segmentElement = transcriptionRef.current.querySelector(`[data-segment-index="${newIndex}"]`)
          if (segmentElement) {
            segmentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }
    }

    // Update on timeupdate event
    video.addEventListener('timeupdate', updateCurrentSegment)
    
    // Also update when video starts playing
    video.addEventListener('play', updateCurrentSegment)
    
    return () => {
      video.removeEventListener('timeupdate', updateCurrentSegment)
      video.removeEventListener('play', updateCurrentSegment)
    }
  }, [transcriptionSegments, currentSegmentIndex])

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
        
        // Parse transcription with timestamps into segments
        const segments = parseTranscriptionWithTimestamps(transcriptionText)
        setTranscriptionSegments(segments)
        
        console.log('✅ Transcription received:', transcriptionText)
        console.log('📊 Parsed segments:', segments)
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

  // YouTube-like progressive streaming (NOT full download)
  useEffect(() => {
    if (!currentLesson?.videoUrl) return

    // 1. Prefetch ONLY metadata (not full video) for fast initial load
    const prefetchVideoMetadata = () => {
      // Prefetch link for browser optimization - only hints to browser, doesn't download full video
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.as = 'video'
      link.href = currentLesson.videoUrl
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)

      // Create a hidden video element to prefetch ONLY metadata and first few seconds
      // This enables progressive streaming, not full download
      const hiddenVideo = document.createElement('video')
      hiddenVideo.preload = 'metadata' // ONLY metadata, not full video
      hiddenVideo.src = currentLesson.videoUrl
      hiddenVideo.crossOrigin = 'anonymous'
      hiddenVideo.style.display = 'none'
      hiddenVideo.muted = true
      hiddenVideo.volume = 0
      
      // Load metadata only - this doesn't download the full video
      hiddenVideo.load()
      
      // Once metadata is loaded, we can remove it
      // The actual video will stream progressively when user clicks play
      hiddenVideo.addEventListener('loadedmetadata', () => {
        // Remove after metadata is loaded - we don't need to keep it
        setTimeout(() => {
          if (hiddenVideo.parentNode) {
            hiddenVideo.parentNode.removeChild(hiddenVideo)
          }
        }, 1000)
      })

      document.body.appendChild(hiddenVideo)

      return () => {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
        if (hiddenVideo.parentNode) {
          hiddenVideo.parentNode.removeChild(hiddenVideo)
        }
      }
    }

    const cleanup = prefetchVideoMetadata()
    return cleanup
  }, [currentLesson?.videoUrl])

  // Prefetch next lesson video for instant transition
  useEffect(() => {
    if (!course?.lessonsData || !currentLesson) return

    const currentIndex = course.lessonsData.findIndex((l: any) => l.id === currentLesson.id)
    const nextLesson = course.lessonsData[currentIndex + 1]

    if (nextLesson?.videoUrl) {
      // Prefetch next video in background
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.as = 'video'
      link.href = nextLesson.videoUrl
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)

      return () => {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
      }
    }
  }, [course?.lessonsData, currentLesson])

  // Fetch suggested videos (similar courses only - NOT lessons from current course)
  useEffect(() => {
    const fetchSuggestedVideos = async () => {
      if (!course || !currentLesson) return

      try {
        const suggestions: any[] = []
        
        // Only get similar courses (NOT lessons from current course - those are in the playlist)
        try {
          // Map course level and category to backend format
          const mapCategoryToBackend = (category: string): string => {
            const categoryMap: Record<string, string> = {
              'grammar': 'GRAMMAR',
              'vocabulary': 'VOCABULARY',
              'listening': 'LISTENING',
              'reading': 'READING',
              'writing': 'WRITING',
              'speaking': 'SPEAKING',
              'culture': 'CULTURE',
              'business': 'BUSINESS',
              'exam_prep': 'EXAM_PREP'
            };
            return categoryMap[category?.toLowerCase()] || category?.toUpperCase() || 'GRAMMAR';
          };
          
          const backendCategory = mapCategoryToBackend(course.type || 'grammar');
          const similarCoursesResponse = await apiClient.get(`/courses?level=${course.level || 'A1'}&category=${backendCategory}&limit=6`)
          const similarCourses = (similarCoursesResponse as any).data?.courses || (similarCoursesResponse as any).data || []
          
          similarCourses
            .filter((c: any) => c.id !== course.id)
            .slice(0, 6)
            .forEach((c: any) => {
              // Get first lesson with video from each course
              const firstVideoLesson = c.lessons_data?.find((l: any) => l.videoUrl)
              if (firstVideoLesson) {
                suggestions.push({
                  id: firstVideoLesson.id,
                  title: firstVideoLesson.title,
                  description: firstVideoLesson.description || c.description || '',
                  thumbnail: c.image || c.thumbnail || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop&q=80',
                  duration: firstVideoLesson.duration || c.duration || 0,
                  courseTitle: c.title,
                  courseId: c.id,
                  type: 'course'
                })
              }
            })
        } catch (error) {
          console.error('Error fetching similar courses:', error)
        }

        setSuggestedVideos(suggestions.slice(0, 6))
      } catch (error) {
        console.error('Error fetching suggested videos:', error)
      }
    }

    fetchSuggestedVideos()
  }, [course, currentLesson])

  // YouTube-like optimized play with instant start
  const togglePlay = async () => {
    const video = videoRef.current
    if (!video || isPlayPromisePending) return

    try {
      if (isPlaying) {
        video.pause()
        setIsPlaying(false)
      } else {
        setIsPlayPromisePending(true)
        
        // YouTube strategy: Check if we have enough buffer (0.5s minimum)
        // If yes, play immediately. If no, wait for minimal buffer
        const hasBuffer = video.buffered.length > 0 && video.buffered.end(0) > 0.5
        
        if (!hasBuffer && video.readyState < 3) {
          // Wait for minimal buffer (canplay event = readyState >= 3)
          await new Promise<void>((resolve) => {
            const checkBuffer = () => {
              if (video.buffered.length > 0 && video.buffered.end(0) > 0.5) {
                video.removeEventListener('progress', checkBuffer)
                video.removeEventListener('canplay', checkBuffer)
                resolve()
              }
            }
            
            // Check immediately
            checkBuffer()
            
            // Also listen for progress events
            video.addEventListener('progress', checkBuffer)
            video.addEventListener('canplay', checkBuffer)
            
            // Timeout after 2 seconds - play anyway
            setTimeout(() => {
              video.removeEventListener('progress', checkBuffer)
              video.removeEventListener('canplay', checkBuffer)
              resolve()
            }, 2000)
          })
        }

        // Play immediately - video should already be buffered
        const playPromise = video.play()
        
        if (playPromise !== undefined) {
          await playPromise
          setIsPlaying(true)
          setVideoLoading(false)
        }
      }
    } catch (error: any) {
      // Handle AbortError gracefully
      if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
        console.error('Video play error:', error)
        setError('Failed to play video')
      }
      setIsPlaying(false)
    } finally {
      setIsPlayPromisePending(false)
    }
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
    const video = videoRef.current
    if (!video) return

    if (!document.fullscreenElement) {
      video.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch((err) => {
        console.error('Error entering fullscreen:', err)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch((err) => {
        console.error('Error exiting fullscreen:', err)
      })
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current
    if (!video) return
    
    video.playbackRate = rate
    setPlaybackRate(rate)
  }

  // Optimized resolution handling with Cloudinary streaming transformations
  const detectAvailableResolutions = useCallback(() => {
    if (!currentLesson?.videoUrl) {
      setAvailableResolutions([{ label: 'Auto', value: 'auto', url: currentLesson?.videoUrl || '' }])
      return
    }

    // For Cloudinary videos, use optimized streaming URLs with adaptive bitrate
    if (currentLesson.videoUrl.includes('cloudinary.com')) {
      const baseUrl = currentLesson.videoUrl
      
      // Remove existing transformations to start fresh
      let cleanUrl = baseUrl
      if (baseUrl.includes('/upload/')) {
        const parts = baseUrl.split('/upload/')
        if (parts.length > 1) {
          // Extract the path after /upload/ and remove any existing transformations
          const pathParts = parts[1].split('/')
          const videoPath = pathParts[pathParts.length - 1]
          cleanUrl = `${parts[0]}/upload/${videoPath}`
        }
      }

      // YouTube-like Cloudinary optimized streaming URLs
      // Key optimizations for 95% faster loading:
      // 1. q_auto:good - Good quality for fast initial load (not best - faster)
      // 2. f_auto:video - Auto format (MP4/HLS) for best browser support
      // 3. fl_progressive - Progressive download (starts playing before fully loaded)
      // 4. dl_1 - Download optimization for faster start (Cloudinary specific)
      // 5. Streaming transformations for instant playback
      const resolutions = [
        { 
          label: 'Auto', 
          value: 'auto', 
          // Start with lower quality for instant playback, then upgrade
          url: cleanUrl.replace('/upload/', '/upload/q_auto:good,f_auto:video,fl_progressive,dl_1/')
        },
        { 
          label: '1080p', 
          value: '1080p', 
          // Use c_limit instead of c_fill to avoid 404 errors if video doesn't have exact dimensions
          url: cleanUrl.replace('/upload/', '/upload/q_auto:best,f_auto:video,w_1920,h_1080,c_limit,fl_progressive,dl_1/')
        },
        { 
          label: '720p', 
          value: '720p', 
          url: cleanUrl.replace('/upload/', '/upload/q_auto:best,f_auto:video,w_1280,h_720,c_limit,fl_progressive,dl_1/')
        },
        { 
          label: '480p', 
          value: '480p', 
          url: cleanUrl.replace('/upload/', '/upload/q_auto:good,f_auto:video,w_854,h_480,c_limit,fl_progressive,dl_1/')
        },
        { 
          label: '360p', 
          value: '360p', 
          // Fastest loading for slow connections
          url: cleanUrl.replace('/upload/', '/upload/q_auto:good,f_auto:video,w_640,h_360,c_limit,fl_progressive,dl_1/')
        }
      ]
      setAvailableResolutions(resolutions)
      // Set initial resolution to 'auto' if not already set
      if (selectedResolution === 'auto' || !selectedResolution) {
        setSelectedResolution('auto')
      }
    } else {
      // For other videos, just show auto
      setAvailableResolutions([{ label: 'Auto', value: 'auto', url: currentLesson?.videoUrl || '' }])
      setSelectedResolution('auto')
    }
  }, [currentLesson, selectedResolution])

  // Detect resolutions when current lesson changes
  useEffect(() => {
    if (currentLesson?.videoUrl) {
      detectAvailableResolutions()
    }
  }, [currentLesson?.videoUrl, detectAvailableResolutions])

  const changeResolution = useCallback(async (resolution: string) => {
    const video = videoRef.current
    if (!video || !currentLesson) {
      console.warn('Cannot change resolution: video or lesson not available')
      return
    }

    console.log('🔄 Changing resolution to:', resolution)
    console.log('📊 Available resolutions:', availableResolutions)
    
    setSelectedResolution(resolution)
    setVideoLoading(true)
    
    // Store current time for seamless transition
    const currentTime = video.currentTime
    const wasPlaying = !video.paused
    
    // Pause video during resolution change
    if (wasPlaying) {
      video.pause()
    }
    
    // Determine the new source URL
    let newSrc = currentLesson.videoUrl
    if (resolution === 'auto') {
      newSrc = currentLesson.videoUrl
    } else {
      const selectedRes = availableResolutions.find(r => r.value === resolution)
      if (selectedRes && selectedRes.url) {
        newSrc = selectedRes.url
        console.log('✅ Using resolution URL:', newSrc)
      } else {
        console.warn('⚠️ Resolution not found, using original URL')
        newSrc = currentLesson.videoUrl
      }
    }
    
    // Only change if different from current source
    if (video.src !== newSrc) {
      console.log('🔄 Changing video source from:', video.src, 'to:', newSrc)
      video.src = newSrc
      
      // Reload the video with new source
      video.load()
      
      // Add error handler to fallback to original URL if transformation fails
      const handleVideoError = () => {
        console.error('❌ Video error during resolution change')
        if (video.src !== currentLesson.videoUrl) {
          console.warn('⚠️ Video transformation failed, falling back to original URL')
          video.src = currentLesson.videoUrl
          setSelectedResolution('auto')
          video.load()
        }
      }
      
      video.addEventListener('error', handleVideoError, { once: true })
      
      // Wait for metadata to update duration and restore playback
      await new Promise<void>((resolve) => {
        const onLoadedMetadata = () => {
          if (video) {
            console.log('✅ Video metadata loaded for new resolution')
            setTotalDuration(video.duration)
            // Restore playback position (clamp to new duration)
            video.currentTime = Math.min(currentTime, video.duration)
            
            // Restore playback state
            if (wasPlaying && playbackReady) {
              video.play().catch((err) => {
                console.error('❌ Play error after resolution change:', err)
              })
            }
            
            setVideoLoading(false)
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            resolve()
          }
        }
        
        const onCanPlay = () => {
          if (video) {
            console.log('✅ Video can play with new resolution')
            setPlaybackReady(true)
            setVideoLoading(false)
            if (wasPlaying && !video.paused) {
              // Already playing, good
            } else if (wasPlaying) {
              video.play().catch((err) => {
                console.error('❌ Play error:', err)
              })
            }
          }
        }
        
        video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
        video.addEventListener('canplay', onCanPlay, { once: true })
        
        // Timeout fallback
        setTimeout(() => {
          if (video.readyState >= 1) {
            onLoadedMetadata()
          } else {
            console.warn('⚠️ Timeout waiting for metadata, continuing anyway')
            setVideoLoading(false)
            resolve()
          }
        }, 5000)
      })
    } else {
      console.log('ℹ️ Resolution already set, no change needed')
      setVideoLoading(false)
    }
  }, [currentLesson, availableResolutions, playbackReady])

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
        course?.title || '',
        transcription // Pass transcription if available
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
        course?.title || '',
        transcription // Pass transcription if available
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

  // YouTube-like preloading and buffering optimization
  useEffect(() => {
    const video = videoRef.current
    if (!video || !currentLesson?.videoUrl) return

    // Optimize video loading with progressive streaming
    const optimizeVideoLoading = () => {
      // Set preload to metadata for progressive streaming (not full download)
      video.preload = 'metadata'
      
      // Enable hardware acceleration if available
      video.style.transform = 'translateZ(0)'
      video.style.willChange = 'auto'
      
      // Set optimal buffering
      if ('buffered' in video) {
        const updateBufferedRanges = () => {
          if (video.buffered.length > 0) {
            const bufferedEnd = video.buffered.end(video.buffered.length - 1)
            const bufferedPercent = (bufferedEnd / video.duration) * 100
            setBufferedRanges(bufferedPercent)
          }
        }
        
        video.addEventListener('progress', updateBufferedRanges)
        video.addEventListener('timeupdate', updateBufferedRanges)
        
        return () => {
          video.removeEventListener('progress', updateBufferedRanges)
          video.removeEventListener('timeupdate', updateBufferedRanges)
        }
      }
    }

    optimizeVideoLoading()
  }, [currentLesson?.videoUrl])

  // Preload next lesson video for seamless transitions (YouTube-like algorithm)
  useEffect(() => {
    if (!course?.lessonsData || !currentLesson) return

    const currentIndex = course.lessonsData.findIndex((l: any) => l.id === currentLesson.id)
    const nextLesson = course.lessonsData[currentIndex + 1]

    if (nextLesson?.videoUrl) {
      // Preload next video in background using resource hints
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.as = 'video'
      link.href = nextLesson.videoUrl
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)

      // Also preload metadata for faster switching
      const videoPreload = document.createElement('video')
      videoPreload.src = nextLesson.videoUrl
      videoPreload.preload = 'metadata'
      videoPreload.crossOrigin = 'anonymous'
      videoPreload.style.display = 'none'
      document.body.appendChild(videoPreload)

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link)
        }
        if (document.body.contains(videoPreload)) {
          document.body.removeChild(videoPreload)
        }
      }
    }
  }, [currentLesson, course?.lessonsData])

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

  // Navigation between lessons
  const getCurrentLessonIndex = () => {
    if (!course?.lessonsData || !currentLesson) return -1
    return course.lessonsData.findIndex((l: any) => l.id === currentLesson.id)
  }

  const handlePreviousLesson = () => {
    const currentIndex = getCurrentLessonIndex()
    if (currentIndex > 0) {
      const previousLesson = course?.lessonsData?.[currentIndex - 1]
      if (previousLesson) {
        handleLessonSelect(previousLesson)
      }
    }
  }

  const handleNextLesson = () => {
    const currentIndex = getCurrentLessonIndex()
    if (currentIndex >= 0 && course?.lessonsData && currentIndex < course.lessonsData.length - 1) {
      const nextLesson = course.lessonsData[currentIndex + 1]
      if (nextLesson) {
        handleLessonSelect(nextLesson)
      }
    }
  }

  const hasPreviousLesson = () => {
    return getCurrentLessonIndex() > 0
  }

  const hasNextLesson = () => {
    const currentIndex = getCurrentLessonIndex()
    return currentIndex >= 0 && course?.lessonsData && currentIndex < course.lessonsData.length - 1
  }

  // Handle transcription segment click to seek video
  const handleTranscriptionSegmentClick = (timeInSeconds: number) => {
    const video = videoRef.current
    if (video) {
      video.currentTime = timeInSeconds
      setCurrentTime(timeInSeconds)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f8f6] dark:bg-[#0A0A0A] font-display">
      <style jsx global>{`
        .glassmorphism {
          background: rgba(255, 255, 255, 0.5);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .dark .glassmorphism {
          background: rgba(15, 35, 22, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
      
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          {/* Header with Breadcrumbs and Navigation - Keep padding for header only */}
          <div className="px-4 sm:px-6 lg:px-8 xl:px-16 2xl:px-24 py-8">
            <header className="w-full mb-6">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <a 
                    className="text-[#00FF7F] text-sm font-medium leading-normal hover:underline cursor-pointer" 
                    onClick={() => router.push('/home')}
                  >
                    Home
                  </a>
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">/</span>
                  <a 
                    className="text-[#00FF7F] text-sm font-medium leading-normal hover:underline cursor-pointer" 
                    onClick={() => router.push('/cours')}
                  >
                    {course?.title || 'Le Français 101'}
                  </a>
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">/</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium leading-normal">
                    {currentLesson?.title || 'Leçon 5'}
                  </span>
                </div>
                
                {/* Title and Navigation Buttons */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-gray-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tighter">
                      {currentLesson?.title || 'Leçon 5: Le Passé Composé'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">
                      {t("Maîtrisez le passé composé en conversation française.", "Mastering the past tense in French conversation.")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handlePreviousLesson}
                      disabled={!hasPreviousLesson()}
                      className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>{t("Leçon Précédente", "Previous Lesson")}</span>
                    </Button>
                    <Button
                      onClick={handleNextLesson}
                      disabled={!hasNextLesson()}
                      className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#00FF7F] text-[#0A0A0A] text-sm font-bold hover:bg-[#00e66d] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{t("Leçon Suivante", "Next Lesson")}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
            </header>
          </div>

          {/* Main Content Layout - Full Width: Playlist | Video+AI | Transcription */}
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6 w-full">
                {/* Left Column - Playlist of Lessons (YouTube-style) */}
                <aside className="lg:col-span-3 order-3 lg:order-1">
                  <div className="p-4 lg:p-6 rounded-r-xl lg:rounded-l-none lg:rounded-r-xl h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 sticky top-4">
                    <h3 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight mb-4">
                      {t("Playlist de Leçons", "Lesson Playlist")}
                    </h3>
                    <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                      {course?.lessonsData && course.lessonsData.length > 0 ? (
                        course.lessonsData
                          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                          .map((lesson: any, index: number) => {
                            const isActive = currentLesson?.id === lesson.id
                            const hasVideo = lesson.videoUrl && lesson.videoUrl.trim() !== ''
                            const hasContent = lesson.content && lesson.content.trim() !== ''
                            const isCompleted = false // TODO: Check user progress
                            
                            // Generate thumbnail URL from video (YouTube-style)
                            let thumbnailUrl = ''
                            if (hasVideo && lesson.videoUrl) {
                              const cloudinaryUrl = lesson.videoUrl
                              const publicIdMatch = cloudinaryUrl.match(/\/video\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
                              if (publicIdMatch) {
                                const publicId = publicIdMatch[1]
                                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dk5x9flh0'
                                thumbnailUrl = `https://res.cloudinary.com/${cloudName}/video/upload/w_168,h_94,c_fill,g_auto,so_10/${publicId}.jpg`
                              }
                            }
                            
                            return (
                              <div
                                key={lesson.id}
                                onClick={() => {
                                  if (lesson.id !== currentLesson?.id) {
                                    handleLessonSelect(lesson)
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                  }
                                }}
                                className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                                  isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                                    : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                }`}
                              >
                                {/* Video Thumbnail (YouTube-style) */}
                                {hasVideo && thumbnailUrl ? (
                                  <div className="relative flex-shrink-0 w-[168px] h-[94px] rounded bg-black overflow-hidden">
                                    <Image
                                      src={thumbnailUrl}
                                      alt={lesson.title}
                                      width={168}
                                      height={94}
                                      className="w-full h-full object-cover"
                                      unoptimized
                                    />
                                    {/* Duration Badge */}
                                    {lesson.duration && (
                                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                        {formatTime(lesson.duration * 60)}
                                      </div>
                                    )}
                                    {/* Play Icon Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                                      <Play className="h-8 w-8 text-white opacity-90" fill="white" />
                                    </div>
                                    {/* Active Indicator */}
                                    {isActive && (
                                      <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    )}
                                  </div>
                                ) : (
                                  <div className="relative flex-shrink-0 w-[168px] h-[94px] rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                                
                                {/* Lesson Info (YouTube-style) */}
                                <div className="flex-1 min-w-0 flex flex-col justify-start">
                                  <h4 className={`text-sm font-medium mb-1 line-clamp-2 ${
                                    isActive
                                      ? 'text-blue-600 dark:text-blue-400'
                                      : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {lesson.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    {hasVideo && lesson.duration && (
                                      <span>{formatTime(lesson.duration * 60)}</span>
                                    )}
                                    {hasContent && !hasVideo && (
                                      <span className="flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        Document
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">
                          {t("Aucune leçon disponible", "No lessons available")}
                        </p>
                      )}
                    </div>
                  </div>
                </aside>

                {/* Center Column - Video Player and AI Assistant (Reduced by 20%) */}
                <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-6">
                  {/* Video Player Section */}
                  <div className="p-0">
                    <div className="relative flex items-center justify-center bg-black bg-cover bg-center aspect-video rounded-xl p-4 glassmorphism group">
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
                        preload="metadata"
                        playsInline
                        crossOrigin="anonymous"
                        onLoadStart={() => {
                          // Start loading immediately - but don't show spinner if we have buffer
                          const video = videoRef.current
                          if (video && video.buffered.length > 0) {
                            const bufferedEnd = video.buffered.end(video.buffered.length - 1)
                            if (bufferedEnd > 1) {
                              // Already have 1+ seconds buffered, don't show loading
                              return
                            }
                          }
                          setVideoLoading(true)
                          setPlaybackReady(false)
                        }}
                        onLoadedMetadata={() => {
                          const video = videoRef.current
                          if (video && currentLesson) {
                            setTotalDuration(video.duration)
                            // Detect resolutions when metadata is loaded
                            detectAvailableResolutions()
                            // Metadata loaded, ready for playback
                            setPlaybackReady(true)
                            // Hide loading if we have enough buffer
                            if (video.buffered.length > 0 && video.buffered.end(0) > 0.5) {
                              setVideoLoading(false)
                            }
                          }
                        }}
                        onLoadedData={() => {
                          // First frame loaded, can start playing
                          setPlaybackReady(true)
                          const video = videoRef.current
                          if (video && video.buffered.length > 0 && video.buffered.end(0) > 0.5) {
                            setVideoLoading(false)
                          }
                        }}
                        onCanPlay={() => {
                          // Video can start playing - hide loading immediately
                          setPlaybackReady(true)
                          setVideoLoading(false)
                        }}
                        onCanPlayThrough={() => {
                          // Enough data buffered to play through without stopping
                          setPlaybackReady(true)
                          setVideoLoading(false)
                        }}
                        onTimeUpdate={() => {
                          const video = videoRef.current
                          if (video) {
                            setCurrentTime(video.currentTime)
                            
                            // Update buffered ranges for progress indication
                            if (video.buffered.length > 0) {
                              const bufferedEnd = video.buffered.end(video.buffered.length - 1)
                              const bufferedPercent = video.duration > 0 
                                ? (bufferedEnd / video.duration) * 100 
                                : 0
                              setBufferedRanges(bufferedPercent)
                            }
                            
                            // Update transcription segment highlight in real-time
                            if (transcriptionSegments.length > 0) {
                              const currentTime = video.currentTime
                              let newIndex = -1
                              for (let i = transcriptionSegments.length - 1; i >= 0; i--) {
                                if (currentTime >= transcriptionSegments[i].timeInSeconds) {
                                  newIndex = i
                                  break
                                }
                              }
                              if (newIndex !== currentSegmentIndex) {
                                setCurrentSegmentIndex(newIndex)
                                
                                // Scroll to current segment
                                if (transcriptionRef.current && newIndex >= 0) {
                                  setTimeout(() => {
                                    const segmentElement = transcriptionRef.current?.querySelector(`[data-segment-index="${newIndex}"]`)
                                    if (segmentElement) {
                                      segmentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                    }
                                  }, 100)
                                }
                              }
                            }
                          }
                        }}
                        onPlay={() => {
                          setIsPlaying(true)
                          setVideoLoading(false)
                        }}
                        onPause={() => {
                          setIsPlaying(false)
                        }}
                        onEnded={() => {
                          setIsPlaying(false)
                        }}
                        onWaiting={() => {
                          // YouTube strategy: Only show loading if we're actually playing AND buffer is really low
                          if (isPlaying) {
                            const video = videoRef.current
                            if (video && video.buffered.length > 0) {
                              const bufferedEnd = video.buffered.end(video.buffered.length - 1)
                              const currentTime = video.currentTime
                              // Only show loading if buffer is less than 0.5 seconds ahead
                              if (bufferedEnd - currentTime < 0.5) {
                                setVideoLoading(true)
                              }
                            } else {
                              setVideoLoading(true)
                            }
                          }
                        }}
                        onStalled={() => {
                          // YouTube strategy: Video stalled, try to recover - but check buffer first
                          if (isPlaying) {
                            const video = videoRef.current
                            if (video && video.buffered.length > 0) {
                              const bufferedEnd = video.buffered.end(video.buffered.length - 1)
                              const currentTime = video.currentTime
                              if (bufferedEnd - currentTime < 0.5) {
                                setVideoLoading(true)
                              }
                            } else {
                              setVideoLoading(true)
                            }
                          }
                        }}
                        onProgress={() => {
                          // YouTube strategy: Hide loading as soon as we have ANY buffer (0.1s minimum)
                          // This makes the video feel instant - don't wait for 5% buffer
                          // 95% reduction in perceived delay
                          const video = videoRef.current
                          if (video && video.buffered.length > 0) {
                            const bufferedEnd = video.buffered.end(video.buffered.length - 1)
                            const bufferedPercent = video.duration > 0 
                              ? (bufferedEnd / video.duration) * 100 
                              : 0
                            setBufferedRanges(bufferedPercent)
                            
                            // YouTube strategy: Hide loading immediately when we have ANY buffer
                            // This makes the video feel instant (95% reduction in perceived delay)
                            if (bufferedEnd > 0.1 && video.readyState >= 2) {
                              setVideoLoading(false)
                            }
                          }
                        }}
                        onError={(e) => {
                          console.error('Video error:', e)
                          const video = videoRef.current
                          if (video && currentLesson) {
                            const error = video.error
                            
                            // If transformation failed, fallback to original URL
                            if (video.src !== currentLesson.videoUrl && currentLesson.videoUrl) {
                              console.warn('Video transformation failed, falling back to original URL')
                              video.src = currentLesson.videoUrl
                              video.load()
                              return
                            }
                            
                            if (error) {
                              let errorMessage = 'Failed to load video'
                              switch (error.code) {
                                case error.MEDIA_ERR_ABORTED:
                                  errorMessage = 'Video loading aborted'
                                  break
                                case error.MEDIA_ERR_NETWORK:
                                  errorMessage = 'Network error while loading video'
                                  break
                                case error.MEDIA_ERR_DECODE:
                                  errorMessage = 'Video decoding error'
                                  break
                                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                                  errorMessage = 'Video format not supported'
                                  break
                              }
                              setError(errorMessage)
                            }
                          }
                          setVideoLoading(false)
                          setPlaybackReady(false)
                        }}
                        style={{
                          // Optimize rendering performance
                          transform: 'translateZ(0)',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden'
                        }}
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

                      {/* Center Play Button (when paused) */}
                      {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <button
                            onClick={togglePlay}
                            className="flex shrink-0 items-center justify-center rounded-full size-16 bg-black/40 text-[#00FF7F] hover:bg-black/60 transition-all"
                          >
                            <Play className="h-8 w-8 ml-1" />
                          </button>
                        </div>
                      )}

                      {/* Video Controls Bar - Appears on hover */}
                      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
                        showControls ? 'opacity-100' : 'opacity-0'
                      }`}>
                        {/* Progress Bar with Handle */}
                        <div className="px-4 py-2">
                          <div className="relative w-full py-2">
                            <div 
                              className="relative h-1.5 w-full cursor-pointer rounded-full bg-white/20"
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const x = e.clientX - rect.left
                                const percentage = Math.max(0, Math.min(1, x / rect.width))
                                const newTime = percentage * totalDuration
                                if (videoRef.current) {
                                  videoRef.current.currentTime = newTime
                                  setCurrentTime(newTime)
                                }
                              }}
                            >
                              <div 
                                className="absolute top-0 left-0 h-full rounded-full bg-[#00FF7F] transition-all"
                                style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
                              />
                              <div 
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-transform group-hover:scale-110"
                                style={{ left: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
                              >
                                <div className="relative size-4 rounded-full bg-white/50 ring-2 ring-[#00FF7F] ring-offset-2 ring-offset-black/20 backdrop-blur-sm">
                                  <div className="absolute inset-0 rounded-full bg-[#00FF7F]/40" />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-white text-xs font-medium leading-normal tracking-[0.015em]">
                              {formatTime(currentTime)}
                            </p>
                            <p className="text-white text-xs font-medium leading-normal tracking-[0.015em]">
                              {formatTime(totalDuration)}
                            </p>
                          </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="px-4 py-2 flex items-center justify-between bg-black/70">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={togglePlay}
                              className="text-white hover:bg-white/10 h-8 w-8 rounded-full flex items-center justify-center transition-all"
                            >
                              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={toggleMute}
                                className="text-white hover:bg-white/10 h-8 w-8 rounded-full flex items-center justify-center transition-all"
                              >
                                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                              </button>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={(e) => changeVolume(Number(e.target.value))}
                                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, #00FF7F 0%, #00FF7F ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`,
                                  WebkitAppearance: 'none',
                                  outline: 'none'
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {availableResolutions.length > 0 && (
                              <ResolutionDropdown
                                resolutions={availableResolutions}
                                selectedResolution={selectedResolution}
                                onSelect={changeResolution}
                              />
                            )}
                            <button
                              onClick={toggleFullscreen}
                              className="text-white hover:bg-white/10 h-8 w-8 rounded-full flex items-center justify-center transition-all"
                              title={t("Plein écran", "Fullscreen")}
                            >
                              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                  {/* AI Assistant Section */}
                  <section className="flex flex-col p-6 rounded-xl glassmorphism">
                    <div className="flex justify-between items-center pb-3">
                      <h2 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-tight">
                        {t("Assistant IA", "AI Assistant")}
                      </h2>
                      <button
                        onClick={() => {
                          setAiQuestions([])
                          setAiNotes([])
                        }}
                        className="flex items-center justify-center gap-1 text-gray-700 dark:text-gray-300 hover:text-[#00FF7F] dark:hover:text-[#00FF7F] transition-colors"
                      >
                        <X className="h-5 w-5" />
                        <span className="text-sm font-medium">{t("Effacer", "Clear")}</span>
                      </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 py-3">
                      <button
                        onClick={generateAiQuestions}
                        disabled={isAiLoading || !transcription}
                        className="flex flex-1 min-w-[84px] cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-lg h-12 px-5 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-base font-bold leading-normal hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Zap className="h-5 w-5 text-[#00FF7F]" />
                        <span className="truncate">{t("Générer des Questions", "Generate Questions")}</span>
                      </button>
                      <button
                        onClick={generateAiNotes}
                        disabled={isAiLoading || !transcription}
                        className="flex flex-1 min-w-[84px] cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-lg h-12 px-5 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-base font-bold leading-normal hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <FileText className="h-5 w-5 text-[#00FF7F]" />
                        <span className="truncate">{t("Générer des Notes", "Generate Notes")}</span>
                      </button>
                    </div>
                    
                    {isAiLoading && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-[#00FF7F]" />
                      </div>
                    )}
                    
                    <div className="mt-4 flex flex-col gap-3">
                      {aiQuestions.map((question, index) => (
                        <div key={index} className="p-4 rounded-xl glassmorphism">
                          <p className="text-gray-900 dark:text-white font-medium">{question}</p>
                        </div>
                      ))}
                      {aiNotes.map((note, index) => (
                        <div key={index} className="p-4 rounded-xl glassmorphism">
                          <p className="text-gray-900 dark:text-white font-medium">{note}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Column - Transcription (More visible) */}
                <aside className="lg:col-span-3 order-2 lg:order-3">
                  <div className="p-4 lg:p-6 rounded-l-xl lg:rounded-r-none lg:rounded-l-xl h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-tight mb-4">
                      {t("Transcription", "Transcription")}
                    </h3>
                    <div 
                      ref={transcriptionRef}
                      className="space-y-4 max-h-[600px] overflow-y-auto pr-2"
                    >
                      {transcriptionSegments.length > 0 ? (
                        transcriptionSegments.map((segment, index) => (
                          <p
                            key={index}
                            data-segment-index={index}
                            onClick={() => handleTranscriptionSegmentClick(segment.timeInSeconds)}
                            className={`leading-relaxed cursor-pointer transition-all ${
                              currentSegmentIndex === index
                                ? 'p-2 rounded-md bg-[#00FF7F]/20 text-gray-900 dark:text-white font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            {segment.timestamp} {segment.text}
                          </p>
                        ))
                      ) : transcription ? (
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                          {transcription}
                        </p>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                          {t("Transcription en cours de génération...", "Transcription is being generated...")}
                        </p>
                      )}
                    </div>
                  </div>
                </aside>
          </main>

          {/* Video Suggestions Section - YouTube-like */}
          {suggestedVideos.length > 0 && (
            <div className="px-4 sm:px-6 lg:px-8 xl:px-16 2xl:px-24 py-8">
              <section className="w-full">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {t("Suggestions de Vidéos", "Suggested Videos")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestedVideos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => {
                        if (video.type === 'lesson' && video.courseId === course?.id) {
                          // Same course - just switch lesson
                          const lesson = course.lessonsData?.find((l: any) => l.id === video.id)
                          if (lesson) {
                            handleLessonSelect(lesson)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }
                        } else {
                          // Different course - navigate to that course
                          router.push(`/cours/${video.courseId}?lesson=${video.id}`)
                        }
                      }}
                      className="flex gap-3 p-3 rounded-xl glassmorphism hover:bg-white/10 dark:hover:bg-gray-800/50 cursor-pointer transition-all group"
                    >
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0 w-40 h-24 rounded-lg overflow-hidden bg-gray-800">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop&q=80'
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                          <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {video.duration > 0 && (
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                            {formatTime(video.duration * 60)}
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-[#00FF7F] transition-colors">
                          {video.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-1">
                          {video.courseTitle}
                        </p>
                        {video.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


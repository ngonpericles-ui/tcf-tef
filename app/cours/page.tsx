"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Progress } from "@/components/ui/progress"
import { Lock, Play, Star, Users, Clock, BookOpen, Headphones, PenSquare, Puzzle, SpellCheck, Mic, FileText, Search, Bookmark, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLang } from "@/components/language-provider"
import { type CourseType, type SubscriptionTier, type Course } from "@/components/course-data"
import { apiClient } from "@/lib/api-client"
import { getCourseImage, getImageAltText } from "@/lib/imageUtils"
import { toast } from "sonner"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
// import ProfessionalMediaPlayer from "@/components/professional-media-player"

const courseTypeIcons = {
  grammar: SpellCheck,
  listening: Headphones,
  reading: FileText,
  vocabulary: BookOpen,
  writing: PenSquare,
  oral: Mic,
  simulation: Puzzle,
}

const courseTypeColors = {
  grammar: "#8E44AD",      // Purple
  listening: "#007BFF",    // Blue
  reading: "#16A085",      // Emerald
  vocabulary: "#2ECC71",   // Green
  writing: "#F39C12",      // Orange
  oral: "#9B59B6",        // Purple
  simulation: "#E74C3C",   // Red
}

// Map backend category to frontend course type
const mapCategoryToType = (category: string): CourseType => {
  const mapping: { [key: string]: CourseType } = {
    'GRAMMAR': 'grammar',
    'LISTENING': 'listening',
    'READING': 'reading',
    'VOCABULARY': 'vocabulary',
    'WRITING': 'writing',
    'ORAL': 'oral',
    'TCF_TEF': 'simulation'
  }
  return mapping[category] || 'grammar'
}

// Removed mock data - using only real backend data

// Beautiful real images for each course type
const getCourseImageByCourseType = (type: CourseType) => {
  const images = {
    grammar: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop&q=80", // Books and grammar
    listening: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop&q=80", // Person with headphones
    reading: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=450&fit=crop&q=80", // Reading in library
    vocabulary: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=450&fit=crop&q=80", // Dictionary/words
    writing: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=450&fit=crop&q=80", // Writing/notebook
    oral: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=450&fit=crop&q=80", // People speaking/conversation
    simulation: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop&q=80", // Exam/test preparation
  }
  return images[type] || images.grammar
}

export default function CoursesPage() {
  const { lang } = useLang()
  const { user } = useAuth()
  const [selectedType, setSelectedType] = useState<CourseType | "all">("all")
  // Get real user subscription tier (convert from backend format: FREE -> free)
  const userTier: SubscriptionTier = user?.subscriptionTier 
    ? (user.subscriptionTier.toLowerCase() as SubscriptionTier)
    : "free"
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [courses, setCourses] = useState<Course[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([]) // Store all courses before filtering
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [loadingCourse, setLoadingCourse] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCourses, setTotalCourses] = useState(0)
  const itemsPerPage = 12
  
  const t = useCallback((fr: string, en: string) => (lang === "fr" ? fr : en), [lang])

  // Handle course selection with loading state
  const handleCourseSelect = async (course: Course) => {
    setLoadingCourse(course.id)
    try {
      // Simulate loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Redirect to media player page
      window.location.href = `/cours/${course.id}`
    } finally {
      setLoadingCourse(null)
    }
  }

  // Fetch courses from backend

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get(`/courses?page=${currentPage}&limit=${itemsPerPage}`)

        // Debug: Log the actual API response
        console.log('🔍 API Response:', {
          success: (response as any).success,
          hasData: !!(response as any).data,
          dataType: Array.isArray((response as any).data) ? 'array' : typeof (response as any).data,
          dataLength: Array.isArray((response as any).data) ? (response as any).data.length : 'N/A',
          fullResponse: response
        });

        if ((response as any).success && (response as any).data && Array.isArray((response as any).data)) {
          const coursesData = (response as any).data
          const pagination = (response as any).pagination
          
          console.log('✅ Courses received from API:', coursesData.length);
          console.log('📚 Courses data:', coursesData.map((c: any) => ({
            id: c.id,
            title: c.title,
            requiredTier: c.requiredTier,
            hasAccess: c.hasAccess,
            availableSubscriptions: c.availableSubscriptions
          })));
          
          // Update pagination state
          if (pagination) {
            setTotalPages(pagination.totalPages || 1)
            setTotalCourses(pagination.total || 0)
          }

          // Transform backend data to match frontend Course interface
          const transformedCourses = coursesData.map((course: any) => {
            const mappedType = mapCategoryToType(course.category)
            // Backend returns subscriptionTier in uppercase (FREE, ESSENTIAL, etc)
            const tierValue = (course.subscriptionTier || 'FREE').toLowerCase() as SubscriptionTier
            
            // Get lessons_data - check multiple possible locations
            const lessonsData = course.lessons_data || course.lessonsData || []
            
            // ALWAYS calculate duration from lessons_data - NEVER use stored course.duration
            let totalMinutes = 0
            if (lessonsData && Array.isArray(lessonsData) && lessonsData.length > 0) {
              // Calculate from lessons_data - sum all lesson durations
              totalMinutes = lessonsData.reduce((sum: number, lesson: any) => {
                const lessonDuration = lesson.duration || 0
                return sum + lessonDuration
              }, 0)
            }
            
            // Debug: Log if duration seems wrong
            if (course.duration && course.duration > 100 && totalMinutes === 0) {
              console.warn('⚠️ Course duration mismatch:', {
                courseId: course.id,
                title: course.title,
                storedDuration: course.duration,
                calculatedDuration: totalMinutes,
                lessonsCount: lessonsData.length,
                lessonsData: lessonsData
              })
            }
            
            const hasVideoContent = lessonsData && lessonsData.some((lesson: any) => lesson.videoUrl)
            const isPDFContent = course.contentType === 'NOTE' || (!hasVideoContent && lessonsData && lessonsData.some((lesson: any) => lesson.content && !lesson.videoUrl))
            
            // Get video thumbnail from first lesson (YouTube-style)
            let courseImage = getCourseImageByCourseType(mappedType);
            if (hasVideoContent && lessonsData && lessonsData.length > 0) {
              // Find first video lesson with thumbnail or videoUrl
              const firstVideoLesson = lessonsData.find((lesson: any) => lesson.videoUrl);
              if (firstVideoLesson) {
                // Use Cloudinary thumbnail if available (stored in course.thumbnail)
                if (course.thumbnail) {
                  courseImage = course.thumbnail;
                } else if (firstVideoLesson.videoUrl) {
                  // Generate Cloudinary thumbnail URL from video public_id (YouTube-style)
                  // Extract public_id from Cloudinary URL
                  const cloudinaryUrl = firstVideoLesson.videoUrl;
                  // Cloudinary URL format: https://res.cloudinary.com/cloud_name/video/upload/v1234567/folder/file.mp4
                  const publicIdMatch = cloudinaryUrl.match(/\/video\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
                  if (publicIdMatch) {
                    const publicId = publicIdMatch[1];
                    // Generate thumbnail URL using Cloudinary transformation (like YouTube)
                    // w_400: width, h_300: height, c_fill: crop fill, g_auto: gravity auto, so_10: start offset 10%
                    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dk5x9flh0';
                    courseImage = `https://res.cloudinary.com/${cloudName}/video/upload/w_400,h_300,c_fill,g_auto,so_10/${publicId}.jpg`;
                  }
                }
              }
            }
            
            // Get available levels and subscriptions from course (for filtering and access control)
            const availableLevels = (course as any).availableLevels && Array.isArray((course as any).availableLevels) && (course as any).availableLevels.length > 0
              ? (course as any).availableLevels
              : [course.level];
            
            // Get available subscriptions (convert from backend format: FREE -> free)
            const availableSubscriptions = (course as any).availableSubscriptions && Array.isArray((course as any).availableSubscriptions) && (course as any).availableSubscriptions.length > 0
              ? (course as any).availableSubscriptions.map((tier: string) => tier.toLowerCase() as SubscriptionTier)
              : [tierValue];
            
            // Get access information from backend
            const hasAccess = (course as any).hasAccess !== undefined ? (course as any).hasAccess : true;
            const requiredTierForAccess = (course as any).requiredTierForAccess 
              ? ((course as any).requiredTierForAccess as string).toLowerCase() as SubscriptionTier
              : tierValue;
            
            return {
              id: course.id,
              title: course.title,
              titleEn: course.titleEn || course.title,
              description: course.description,
              descriptionEn: course.descriptionEn || course.description,
              level: course.level,
              availableLevels: availableLevels, // Add for filtering
              availableSubscriptions: availableSubscriptions, // Add for access control
              requiredTier: tierValue,
              requiredTierForAccess: requiredTierForAccess, // Minimum tier needed for access
              hasAccess: hasAccess, // Whether user can access this course
              type: mappedType,
              duration: (() => {
                if (isPDFContent) {
                  return 'PDF'
                }
                // Return actual calculated duration in minutes (from lessons_data only)
                return totalMinutes > 0 ? `${totalMinutes} min` : '0 min'
              })(),
              lessons: course.lessons || 1,
              progress: 0,
              image: courseImage, // Use video thumbnail or fallback
              authorName: course.createdBy?.firstName + ' ' + course.createdBy?.lastName || 'Instructeur',
              tags: course.tags || [],
              createdBy: course.createdBy?.role === 'ADMIN' ? 'admin' : 'manager',
              createdAt: course.createdAt,
              rating: course.rating || 0,
              enrolledCount: course.enrolledCount || 0, // Use actual number, not string
              difficulty: course.level === 'A1' ? 1 : course.level === 'A2' ? 2 : course.level === 'B1' ? 3 : course.level === 'B2' ? 4 : 5,
              lessonsData: lessonsData
            }
          })
          setCourses(transformedCourses)
          setAllCourses(transformedCourses) // Store all courses for access check
        } else {
          console.error('❌ API response not successful or no content:', response)
          setCourses([])
        }
      } catch (error: any) {
        console.error('❌ Error fetching courses:', error.message)
        console.error('Error details:', error.response?.data || error)
        console.error('Full error object:', error)
        console.error('Error stack:', error.stack)
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [currentPage])

  // Helper function to get active card styles based on color class
  const getActiveCardStyles = useCallback((colorClass: string) => {
    const styles = {
      purple: "border-purple-500 bg-purple-100 dark:bg-purple-900/10 dark:text-white shadow-md",
      blue: "border-blue-500 bg-blue-100 dark:bg-blue-900/10 dark:text-white shadow-md",
      emerald: "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/10 dark:text-white shadow-md",
      green: "border-green-500 bg-green-100 dark:bg-green-900/10 dark:text-white shadow-md",
      orange: "border-orange-500 bg-orange-100 dark:bg-orange-900/10 dark:text-white shadow-md",
      red: "border-red-500 bg-red-100 dark:bg-red-900/10 dark:text-white shadow-md"
    }
    return styles[colorClass as keyof typeof styles] || styles.purple
  }, [])

  // Filter courses based on user tier, type, level, and search term
  const filteredCourses = useMemo(() => {
    let filtered = courses

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(course => course.type === selectedType)
    }

    // Filter by level - check availableLevels array (new system) or single level (old system)
    if (selectedLevel !== "all") {
      if (selectedLevel === "free") {
        filtered = filtered.filter(course => course.requiredTier === "free")
      } else if (selectedLevel === "beginner") {
        // Check if course has A1 or A2 in availableLevels array
        filtered = filtered.filter(course => {
          const availableLevels = (course as any).availableLevels && Array.isArray((course as any).availableLevels) && (course as any).availableLevels.length > 0
            ? (course as any).availableLevels
            : [course.level];
          return availableLevels.some((level: string) => level === "A1" || level === "A2");
        });
      } else if (selectedLevel === "intermediate") {
        // Check if course has B1 or B2 in availableLevels array
        filtered = filtered.filter(course => {
          const availableLevels = (course as any).availableLevels && Array.isArray((course as any).availableLevels) && (course as any).availableLevels.length > 0
            ? (course as any).availableLevels
            : [course.level];
          return availableLevels.some((level: string) => level === "B1" || level === "B2");
        });
      } else if (selectedLevel === "advanced") {
        // Check if course has C1 or C2 in availableLevels array
        filtered = filtered.filter(course => {
          const availableLevels = (course as any).availableLevels && Array.isArray((course as any).availableLevels) && (course as any).availableLevels.length > 0
            ? (course as any).availableLevels
            : [course.level];
          return availableLevels.some((level: string) => level === "C1" || level === "C2");
        });
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // IMPORTANT: Don't filter by subscription here - show ALL courses
    // The backend already sets hasAccess flag correctly using hierarchy logic
    // Frontend will use hasAccess to show/hide upgrade prompts, not filter courses out
    // This allows PRO users to see all courses (with upgrade prompts for inaccessible ones)

    return filtered
  }, [courses, selectedType, selectedLevel, searchTerm, userTier])

  const courseTypes = useMemo(() => [
    { key: "grammar" as CourseType, labelFr: "Grammaire", labelEn: "Grammar", colorClass: "purple" },
    { key: "listening" as CourseType, labelFr: "Compréhension orale", labelEn: "Listening", colorClass: "blue" },
    { key: "reading" as CourseType, labelFr: "Compréhension écrite", labelEn: "Reading", colorClass: "emerald" },
    { key: "vocabulary" as CourseType, labelFr: "Vocabulaire", labelEn: "Vocabulary", colorClass: "green" },
    { key: "writing" as CourseType, labelFr: "Expression écrite", labelEn: "Writing", colorClass: "orange" },
    { key: "oral" as CourseType, labelFr: "Expression orale", labelEn: "Oral Expression", colorClass: "purple" },
    { key: "simulation" as CourseType, labelFr: "Méthodologie TCF/TEF", labelEn: "TCF/TEF Methodology", colorClass: "red" },
  ], [])

  const heroImages = useMemo(() => [
    "/images/cours/hero1.jpg",
    "/images/cours/hero2.jpg",
    "/images/cours/hero3.jpg",
    "/images/cours/hero4.jpg",
  ], [])

  // Calculate hero index based on 24-hour cycle
  // Changes every 24 hours by using the number of days since a fixed date
  const [heroIndex, setHeroIndex] = useState(() => {
    const now = new Date()
    // Get the number of days since epoch (rounded down)
    const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24))
    // Use modulo to cycle through images
    return daysSinceEpoch % heroImages.length
  })

  // Update hero index every hour to check if day has changed
  useEffect(() => {
    const updateHeroIndex = () => {
      const now = new Date()
      const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24))
      setHeroIndex(daysSinceEpoch % heroImages.length)
    }
    
    // Update immediately and then every hour
    updateHeroIndex()
    const interval = setInterval(updateHeroIndex, 60 * 60 * 1000) // Check every hour
    
    return () => clearInterval(interval)
  }, [heroImages.length])

  return (
    <PageShell>
      <main>
        {/* Enhanced Hero Section */}
        <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
          <div className="absolute inset-0 -z-10">
            <Image
              key={heroImages[heroIndex]}
              src={heroImages[heroIndex]}
              alt="Étudiant(e) en train d'apprendre avec un cahier et un ordinateur"
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Overlays: subtle vignette + brand gradient so text remains readable */}
          <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-b from-black/30 via-black/10 to-transparent" />
          <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br from-transparent via-transparent to-purple-800/40" />

          <div className="max-w-7xl mx-auto text-center flex flex-col justify-center min-h-[50vh]">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 text-white">
              {t("Découvrez l'excellence", "Discover Excellence")}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto text-white/90 leading-relaxed">
              {t("Explorez notre collection de cours de français conçus par des experts pour tous les niveaux. Apprenez avec des méthodes modernes et interactives adaptées à votre rythme.", "Explore our collection of French courses designed by experts for all levels. Learn with modern and interactive methods adapted to your pace.")}
            </p>

            {/* Stats or Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">500+</div>
                <div className="text-sm text-white/80">{t("Cours disponibles", "Available courses")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">50k+</div>
                <div className="text-sm text-white/80">{t("Étudiants actifs", "Active students")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">4.8★</div>
                <div className="text-sm text-white/80">{t("Note moyenne", "Average rating")}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">

        {/* Search Bar */}
        <section className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={t("Rechercher des cours...", "Search courses...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t("Chargement des cours...", "Loading courses...")}</p>
          </div>
        )}

        {/* Course Type Explorer */}
        {!loading && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold font-[var(--font-poppins)] mb-4 text-foreground">
            {t("Explorer par domaine", "Explore by domain")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {courseTypes.map(({ key, labelFr, labelEn, colorClass }) => {
              const Icon = courseTypeIcons[key]
              const color = courseTypeColors[key]
              const isActive = selectedType === key

              return (
                <button
                  key={key}
                  onClick={() => setSelectedType(key)}
                  className={`group relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    isActive 
                      ? getActiveCardStyles(colorClass)
                      : "border-gray-200 dark:border-gray-700 bg-card hover:bg-accent"
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Icon
                      className="h-6 w-6 transition-transform duration-200 group-hover:scale-110"
                      style={{ color }}
                    />
                    <div className="text-xs font-medium text-foreground">
                      {lang === "fr" ? labelFr : labelEn}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
        )}

        {/* Course Content */}
        {!loading && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold font-[var(--font-poppins)] text-foreground">
              {t(
                `Cours de ${courseTypes.find((t) => t.key === selectedType)?.labelFr}`,
                `${courseTypes.find((t) => t.key === selectedType)?.labelEn} Courses`,
              )}
            </h2>
            <div className="text-sm text-muted-foreground">
              {filteredCourses.length} {t("cours disponibles", "courses available")}
            </div>
          </div>

          <Tabs value={selectedLevel} onValueChange={setSelectedLevel} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-muted rounded-lg">
              <TabsTrigger value="all" className="text-foreground">
                {t("Tous", "All")}
              </TabsTrigger>
              <TabsTrigger value="free" className="text-foreground">
                {t("Gratuit", "Free")}
              </TabsTrigger>
              <TabsTrigger value="beginner" className="text-foreground">
                A1-A2
              </TabsTrigger>
              <TabsTrigger value="intermediate" className="text-foreground">
                B1-B2
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-foreground">
                C1-C2
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <CourseGrid courses={filteredCourses} allCourses={allCourses} userTier={userTier} onCourseSelect={handleCourseSelect} loadingCourse={loadingCourse} />
            </TabsContent>

            <TabsContent value="free" className="mt-6">
              <CourseGrid courses={filteredCourses.filter((c) => c.requiredTier === "free")} allCourses={allCourses} userTier={userTier} onCourseSelect={handleCourseSelect} loadingCourse={loadingCourse} />
            </TabsContent>

            <TabsContent value="beginner" className="mt-6">
              <CourseGrid
                courses={filteredCourses.filter((c) => c.level === "A1" || c.level === "A2")}
                allCourses={allCourses}
                userTier={userTier}
                onCourseSelect={handleCourseSelect} loadingCourse={loadingCourse}
              />
            </TabsContent>

            <TabsContent value="intermediate" className="mt-6">
              <CourseGrid
                courses={filteredCourses.filter((c) => c.level === "B1" || c.level === "B2")}
                allCourses={allCourses}
                userTier={userTier}
                onCourseSelect={handleCourseSelect} loadingCourse={loadingCourse}
              />
            </TabsContent>

            <TabsContent value="advanced" className="mt-6">
              <CourseGrid
                courses={filteredCourses.filter((c) => c.level === "C1" || c.level === "C2")}
                allCourses={allCourses}
                userTier={userTier}
                onCourseSelect={handleCourseSelect} loadingCourse={loadingCourse}
              />
            </TabsContent>
        </Tabs>
        
        {/* Pagination Controls */}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalCourses={totalCourses}
          itemsPerPage={itemsPerPage}
          t={t}
        />
      </section>
      )}

        {/* Media Player for Selected Course */}
        {selectedCourse && (
          <section className="mt-8">
            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {t("Cours sélectionné", "Selected Course")}: {lang === "fr" ? selectedCourse.title : selectedCourse.titleEn}
                </h3>
                <Button variant="outline" size="sm" onClick={() => setSelectedCourse(null)}>
                  {t("Fermer", "Close")}
                </Button>
              </div>
              {selectedCourse.lessonsData && selectedCourse.lessonsData.length > 0 ? (
                <>
                  {(() => {
                    // Find the first lesson with a video URL
                    const videoLesson = selectedCourse.lessonsData.find(lesson => lesson.videoUrl)
                    const pdfLesson = selectedCourse.lessonsData.find(lesson => lesson.content && lesson.content.endsWith('.pdf'))
                    const textLesson = selectedCourse.lessonsData.find(lesson => lesson.content && !lesson.content.endsWith('.pdf'))
                    
                    if (videoLesson && videoLesson.videoUrl) {
                      return (
                        <div className="bg-gray-100 p-8 rounded-lg text-center">
                          <p className="text-gray-600">Video player temporarily disabled</p>
                          <p className="text-sm text-gray-500 mt-2">Video URL: {videoLesson.videoUrl}</p>
                        </div>
                      )
                    } else if (pdfLesson) {
                      return (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">{t("Matériel de cours", "Course Material")}</p>
                          <iframe
                            src={pdfLesson.content}
                            className="w-full h-96 rounded-lg border"
                            title={t("Matériel PDF", "PDF Material")}
                          />
                          <a
                            href={pdfLesson.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-primary hover:underline text-sm"
                          >
                            {t("Télécharger le PDF", "Download PDF")} ↗
                          </a>
                        </div>
                      )
                    } else if (textLesson) {
                      return (
                        <div className="bg-muted rounded-lg p-6 mt-4">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {textLesson.content}
                          </p>
                        </div>
                      )
                    } else {
                      return (
                        <div className="bg-muted rounded-lg p-8 text-center">
                          <p className="text-muted-foreground">
                            {t("Aucun contenu disponible pour ce cours", "No content available for this course")}
                          </p>
                        </div>
                      )
                    }
                  })()}
                </>
              ) : (
                <div className="bg-muted rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">
                    {t("Aucun contenu disponible pour ce cours", "No content available for this course")}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
        </div>
      </main>
    </PageShell>
  )
}

function CourseGrid({ courses, allCourses, userTier, onCourseSelect, loadingCourse }: { courses: any[]; allCourses: any[]; userTier: SubscriptionTier; onCourseSelect?: (course: Course) => void; loadingCourse?: string | null }) {
  const { lang } = useLang()
  const t = useCallback((fr: string, en: string) => (lang === "fr" ? fr : en), [lang])
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Load existing favorites on component mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const response = await apiClient.get('/favorites?contentType=COURSE')
        if ((response as any).success && (response as any).data?.favorites) {
          const favoriteIds = new Set<string>((response as any).data.favorites.map((fav: any) => fav.contentId))
          setFavorites(favoriteIds)
        }
      } catch (error) {
        console.error('Error loading favorites:', error)
      }
    }
    loadFavorites()
  }, [])

  const handleEnrollAndSelect = async (course: Course) => {
    try {
      setEnrolling(course.id)
      // Call enrollment endpoint
      const response = await apiClient.post(`/courses/${course.id}/enroll`)
      if ((response as any).success) {
        console.log('✅ Enrolled in course:', course.title)
      }
    } catch (error: any) {
      // If already enrolled, that's fine - just select the course
      if (error.response?.status === 409) {
        console.log('Already enrolled in this course')
      } else {
        console.error('Error enrolling in course:', error)
      }
    } finally {
      setEnrolling(null)
      // Always select the course to show the media player
      onCourseSelect?.(course)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation()
    try {
      const isFavorited = favorites.has(courseId)
      if (isFavorited) {
        // Remove from favorites
        const response = await apiClient.get(`/favorites/check?contentId=${courseId}&contentType=COURSE`)
        if ((response as any).success && (response as any).data?.isFavorited) {
          // Get the favorite ID and delete it
          const favResponse = await apiClient.get(`/favorites?contentType=COURSE`)
          const fav = (favResponse as any).data?.favorites?.find((f: any) => f.contentId === courseId)
          if (fav) {
            await apiClient.delete(`/favorites/${fav.id}`)
          }
        }
      } else {
        // Add to favorites
        await apiClient.post(`/favorites`, {
          contentId: courseId,
          contentType: 'COURSE',
          folder: 'Mes Cours',
          tags: ['course'],
          notes: ''
        })
      }
      // Toggle local state
      const newFavorites = new Set(favorites)
      if (isFavorited) {
        newFavorites.delete(courseId)
      } else {
        newFavorites.add(courseId)
      }
      setFavorites(newFavorites)
      
      // Show success message
      if (isFavorited) {
        toast.success(t("Retiré des favoris", "Removed from favorites"))
      } else {
        toast.success(t("Ajouté aux favoris", "Added to favorites"))
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error(t("Erreur lors de la mise à jour des favoris", "Error updating favorites"))
    }
  }

  const tierHierarchy: Record<SubscriptionTier, SubscriptionTier[]> = useMemo(() => ({
    free: ["free"],
    essential: ["free", "essential"],
    premium: ["free", "essential", "premium"],
    pro: ["free", "essential", "premium", "pro"],
  }), [])

  const canAccess = useCallback((course: any) => {
    // Use hasAccess from backend if available (most reliable - uses hierarchy logic)
    if (course.hasAccess !== undefined) {
      return course.hasAccess;
    }
    
    // IMPORTANT: FREE courses are always accessible to everyone
    const isFreeCourse = course.requiredTier === "free" || 
      (course.availableSubscriptions && Array.isArray(course.availableSubscriptions) && course.availableSubscriptions.includes("free"));
    
    if (isFreeCourse) {
      return true; // Everyone can access FREE courses
    }
    
    // Fallback: For paid courses, check if user's subscription tier is in course's availableSubscriptions array
    const courseSubscriptions = course.availableSubscriptions && Array.isArray(course.availableSubscriptions) && course.availableSubscriptions.length > 0
      ? course.availableSubscriptions
      : [course.requiredTier];
    
    // Use tier hierarchy: pro can access all, premium can access premium/essential, etc.
    return tierHierarchy[userTier].some(tier => courseSubscriptions.includes(tier));
  }, [userTier, tierHierarchy])

  const getTierBadgeColor = useCallback((tier: SubscriptionTier) => {
    switch (tier) {
      case "free":
        return "bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 font-medium"
      case "essential":
        return "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 font-medium"
      case "premium":
        return "bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 font-medium"
      case "pro":
        return "bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 font-medium"
      default:
        return "bg-gray-50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 font-medium"
    }
  }, [])

  // Check if there are courses in database but user doesn't have access (subscription issue)
  // This happens when filteredCourses is empty but allCourses has courses that require higher subscription
  const hasCoursesButNoAccess = useMemo(() => {
    if (allCourses.length === 0) return false; // No courses in database
    
    // Check if any course in allCourses has hasAccess=false (uses backend's hierarchy logic)
    const hasInaccessibleCourses = allCourses.some((course: any) => {
      // Use hasAccess from backend if available (most reliable)
      if (course.hasAccess !== undefined) {
        return !course.hasAccess;
      }
      
      // Fallback: Check using hierarchy
      const isFreeCourse = course.requiredTier === "free" || 
        (course.availableSubscriptions && Array.isArray(course.availableSubscriptions) && course.availableSubscriptions.includes("free"));
      
      if (isFreeCourse) return false; // FREE courses are accessible
      
      // Use tier hierarchy to check access
      const courseSubscriptions = course.availableSubscriptions && Array.isArray(course.availableSubscriptions) && course.availableSubscriptions.length > 0
        ? course.availableSubscriptions
        : [course.requiredTier];
      
      // Check if user's tier can access any of the course's subscription tiers
      return !tierHierarchy[userTier].some(tier => courseSubscriptions.includes(tier));
    });
    
    return hasInaccessibleCourses && courses.length === 0;
  }, [allCourses, courses, userTier, tierHierarchy]);
  
  // Show courses even if filteredCourses is empty (they might be filtered by type/level)
  // Only show "no courses" if there are truly no courses from API
  if (courses.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        {hasCoursesButNoAccess ? (
          <>
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {t("Votre abonnement ne vous permet pas d'avoir accès à ce contenu", "Your subscription does not allow you to access this content")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("Mettez à niveau votre abonnement pour accéder à plus de cours", "Upgrade your subscription to access more courses")}
            </p>
            <Button
              onClick={() => window.location.href = '/abonnement'}
              className="bg-green-600 hover:bg-green-700 text-black font-medium"
            >
              {t("Changer de plan", "Change plan")}
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {t("Aucun cours disponible", "No courses available")}
            </h3>
            <p className="text-muted-foreground">
              {t("Les cours seront bientôt disponibles", "Courses will be available soon")}
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => {
        const hasAccess = canAccess(course)

        return (
          <div
            key={course.id}
            className="group rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary dark:hover:border-primary"
          >
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={getCourseImage(course)}
                alt={getImageAltText('course', lang === "fr" ? course.title : course.titleEn, course.category, course.level)}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {!hasAccess && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center p-4">
                    <Lock className="h-8 w-8 mx-auto mb-2 text-white" />
                    <p className="text-white font-semibold mb-2 text-sm">
                      {t("Abonnement requis", "Subscription required")}
                    </p>
                    <p className="text-white/80 text-xs">
                      {(() => {
                        const requiredTier = course.requiredTierForAccess || course.requiredTier;
                        return requiredTier === "essential"
                          ? t("Nécessite Essentiel", "Requires Essential")
                          : requiredTier === "premium"
                          ? t("Nécessite Premium", "Requires Premium")
                          : requiredTier === "pro"
                          ? t("Nécessite Pro+", "Requires Pro+")
                          : t("Abonnement requis", "Subscription required");
                      })()}
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <Badge className="bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white font-medium shadow-sm">
                  {course.level}
                </Badge>
                {course.requiredTier === "free" && (
                  <Badge variant="outline" className={getTierBadgeColor(course.requiredTier)}>{t("Gratuit", "Free")}</Badge>
                )}
              </div>
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 rounded-full px-2 py-1 text-xs font-medium shadow-sm">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-gray-900 dark:text-white">{course.rating}</span>
                </div>
                <button
                  onClick={(e) => handleToggleFavorite(e, course.id)}
                  className={`p-2 rounded-full shadow-sm transition-all ${
                    favorites.has(course.id)
                      ? 'bg-yellow-400 text-white'
                      : 'bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white hover:bg-yellow-400 hover:text-white'
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${favorites.has(course.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {course.duration}
                </div>
                <div className="text-xs flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {course.enrolledCount}
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-foreground">
                {lang === "fr" ? course.title : course.titleEn}
              </h3>

              <p className="text-sm mb-3 line-clamp-2 text-muted-foreground">
                {lang === "fr" ? course.description : course.descriptionEn}
              </p>

              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-muted-foreground">
                  {t("Par", "By")} {course.authorName}
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full ${
                        i < Math.floor(course.rating) 
                          ? 'bg-yellow-400' 
                          : 'bg-gray-200 dark:bg-gray-500'
                      }`} 
                    />
                  ))}
                </div>
              </div>

              {course.progress > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t("Progression", "Progress")}</span>
                    <span className="text-muted-foreground">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} />
                </div>
              )}

              <Button
                className={`w-full gap-2 ${hasAccess ? 'bg-green-600 hover:bg-green-700 text-black font-medium' : ''}`}
                disabled={!hasAccess || enrolling === course.id || loadingCourse === course.id}
                variant={hasAccess ? "default" : "outline"}
                onClick={() => hasAccess && handleEnrollAndSelect(course)}
              >
                {loadingCourse === course.id ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("Chargement...", "Loading...")}
                  </>
                ) : enrolling === course.id ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("Inscription...", "Enrolling...")}
                  </>
                ) : hasAccess ? (
                  <>
                    <Play className="h-4 w-4" />
                    {course.progress > 0 ? t("Continuer", "Continue") : t("Commencer", "Start")}
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    {t("Passer en", "Upgrade to")}{" "}
                    {(() => {
                      const requiredTier = course.requiredTierForAccess || course.requiredTier;
                      return requiredTier === "essential"
                        ? t("Essentiel", "Essential")
                        : requiredTier === "premium"
                        ? t("Premium", "Premium")
                        : requiredTier === "pro"
                        ? t("Pro+", "Pro+")
                        : t("Premium", "Premium");
                    })()}
                  </>
                )}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Pagination Component
const PaginationControls = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalCourses,
  itemsPerPage,
  t 
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalCourses: number
  itemsPerPage: number
  t: (fr: string, en: string) => string
}) => {
  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        {t(
          `Affichage de ${Math.min((currentPage - 1) * itemsPerPage + 1, totalCourses)} à ${Math.min(currentPage * itemsPerPage, totalCourses)} sur ${totalCourses} cours`,
          `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, totalCourses)} to ${Math.min(currentPage * itemsPerPage, totalCourses)} of ${totalCourses} courses`
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("Précédent", "Previous")}
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`w-8 h-8 p-0 ${
                page === currentPage 
                  ? 'bg-primary text-primary-foreground' 
                  : page === '...' 
                    ? 'cursor-default' 
                    : 'hover:bg-muted'
              }`}
            >
              {page}
            </Button>
          ))}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1"
        >
          {t("Suivant", "Next")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}


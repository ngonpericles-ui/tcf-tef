"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Progress } from "@/components/ui/progress"
import { Lock, Play, Star, Users, Clock, BookOpen, Headphones, PenSquare, Puzzle, SpellCheck, Mic, FileText, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLang } from "@/components/language-provider"
import { type CourseType, type SubscriptionTier, type Course } from "@/components/course-data"
import { apiClient } from "@/lib/api-client"
import Image from "next/image"
import ProfessionalMediaPlayer from "@/components/professional-media-player"

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
  const [selectedType, setSelectedType] = useState<CourseType | "all">("grammar")
  const [userTier] = useState<SubscriptionTier>("free") // Mock user subscription
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const t = useCallback((fr: string, en: string) => (lang === "fr" ? fr : en), [lang])

  // Fetch courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/content-management/courses')
        console.log('API Response:', response.data)
        if ((response.data as any).success) {
          // Transform backend data to match frontend Course interface
          const transformedCourses = (response.data as any).data.content.map((course: any) => ({
            id: course.id,
            title: course.title,
            titleEn: course.titleEn || course.title,
            description: course.description,
            descriptionEn: course.descriptionEn || course.description,
            level: course.level,
            requiredTier: course.requiredTier.toLowerCase(),
            type: mapCategoryToType(course.category),
            duration: `${course.duration} min`,
            lessons: course.lessons || 1,
            progress: 0,
            image: getCourseImageByCourseType(mapCategoryToType(course.category)),
            authorName: course.createdBy?.firstName + ' ' + course.createdBy?.lastName || 'Instructeur',
            tags: course.tags || [],
            createdBy: course.createdBy?.role === 'ADMIN' ? 'admin' : 'manager',
            createdAt: course.createdAt,
            rating: 4.5,
            enrolledCount: '150+',
            difficulty: course.level === 'A1' ? 1 : course.level === 'A2' ? 2 : course.level === 'B1' ? 3 : course.level === 'B2' ? 4 : 5
          }))
          setCourses(transformedCourses)
        } else {
          // No courses available from backend
          setCourses([])
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
        // Set empty array if backend fails
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

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

    // Filter by level
    if (selectedLevel !== "all") {
      if (selectedLevel === "free") {
        filtered = filtered.filter(course => course.requiredTier === "free")
      } else if (selectedLevel === "beginner") {
        filtered = filtered.filter(course => course.level === "A1" || course.level === "A2")
      } else if (selectedLevel === "intermediate") {
        filtered = filtered.filter(course => course.level === "B1" || course.level === "B2")
      } else if (selectedLevel === "advanced") {
        filtered = filtered.filter(course => course.level === "C1" || course.level === "C2")
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

    // Filter by user tier access
    const tierHierarchy: Record<SubscriptionTier, SubscriptionTier[]> = {
      free: ["free"],
      essential: ["free", "essential"],
      premium: ["free", "essential", "premium"],
      pro: ["free", "essential", "premium", "pro"],
    }
    const allowedTiers = tierHierarchy[userTier] || ["free"]
    filtered = filtered.filter(course => allowedTiers.includes(course.requiredTier))

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

  const [heroIndex, setHeroIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroImages.length)
    }, 15000)
    return () => clearInterval(id)
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
              <CourseGrid courses={filteredCourses} userTier={userTier} onCourseSelect={setSelectedCourse} />
            </TabsContent>

            <TabsContent value="free" className="mt-6">
              <CourseGrid courses={filteredCourses.filter((c) => c.requiredTier === "free")} userTier={userTier} onCourseSelect={setSelectedCourse} />
            </TabsContent>

            <TabsContent value="beginner" className="mt-6">
              <CourseGrid
                courses={filteredCourses.filter((c) => c.level === "A1" || c.level === "A2")}
                userTier={userTier}
                onCourseSelect={setSelectedCourse}
              />
            </TabsContent>

            <TabsContent value="intermediate" className="mt-6">
              <CourseGrid
                courses={filteredCourses.filter((c) => c.level === "B1" || c.level === "B2")}
                userTier={userTier}
                onCourseSelect={setSelectedCourse}
              />
            </TabsContent>

            <TabsContent value="advanced" className="mt-6">
              <CourseGrid
                courses={filteredCourses.filter((c) => c.level === "C1" || c.level === "C2")}
                userTier={userTier}
                onCourseSelect={setSelectedCourse}
              />
            </TabsContent>
          </Tabs>
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
              <ProfessionalMediaPlayer
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                title={lang === "fr" ? selectedCourse.title : selectedCourse.titleEn}
                description={lang === "fr" ? selectedCourse.description : selectedCourse.descriptionEn}
                level={selectedCourse.level}
                duration={selectedCourse.duration}
                onProgress={(progress) => {
                  console.log('Course progress:', progress);
                }}
              />
            </div>
          </section>
        )}
        </div>
      </main>
    </PageShell>
  )
}

function CourseGrid({ courses, userTier, onCourseSelect }: { courses: any[]; userTier: SubscriptionTier; onCourseSelect?: (course: Course) => void }) {
  const { lang } = useLang()
  const t = useCallback((fr: string, en: string) => (lang === "fr" ? fr : en), [lang])

  const tierHierarchy: Record<SubscriptionTier, SubscriptionTier[]> = useMemo(() => ({
    free: ["free"],
    essential: ["free", "essential"],
    premium: ["free", "essential", "premium"],
    pro: ["free", "essential", "premium", "pro"],
  }), [])

  const canAccess = useCallback((courseRequiredTier: SubscriptionTier) => {
    return tierHierarchy[userTier].includes(courseRequiredTier)
  }, [tierHierarchy, userTier])

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

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          {t("Aucun cours disponible", "No courses available")}
        </h3>
        <p className="text-muted-foreground">
          {t("Les cours seront bientôt disponibles", "Courses will be available soon")}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => {
        const hasAccess = canAccess(course.requiredTier)

        return (
          <div
            key={course.id}
            className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-card overflow-hidden transition-shadow duration-200 hover:shadow-md"
          >
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={course.image || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop&q=80"}
                alt={lang === "fr" ? course.title : course.titleEn}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {!hasAccess && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white text-sm font-medium">
                    <Lock className="h-4 w-4" />
                    <span>
                      {course.requiredTier === "essential"
                        ? "Essential"
                        : course.requiredTier === "premium"
                          ? "Premium"
                          : "Pro"}
                    </span>
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
              <div className="absolute top-3 right-3">
                <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 rounded-full px-2 py-1 text-xs font-medium shadow-sm">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-gray-900 dark:text-white">{course.rating}</span>
                </div>

              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {course.duration} min
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
                  {Array.from({ length: course.difficulty }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-blue-500" />
                  ))}
                  {Array.from({ length: 5 - course.difficulty }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-500" />
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
                className="w-full gap-2"
                disabled={!hasAccess}
                variant={hasAccess ? "default" : "outline"}
                onClick={() => hasAccess && onCourseSelect?.(course)}
              >
                {hasAccess ? (
                  <>
                    <Play className="h-4 w-4" />
                    {course.progress > 0 ? t("Continuer", "Continue") : t("Commencer", "Start")}
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    {t("Passer en", "Upgrade to")}{" "}
                    {course.requiredTier === "essential"
                      ? "Essential"
                      : course.requiredTier === "premium"
                        ? "Premium"
                        : "Pro"}
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


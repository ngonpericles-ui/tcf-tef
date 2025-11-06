"use client"

import { useState, useEffect } from "react"
import { BookOpen, Clock, Users, ArrowRight, Play } from "lucide-react"
import Link from "next/link"
import { useLang } from "./language-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/contexts/AuthContext"

interface InProgressCourse {
  id: string
  title: string
  description: string
  category: string
  level: string
  thumbnail?: string
  progress?: {
    percentage: number
    completedLessons: number
    totalLessons: number
  }
  duration?: number
  _count?: {
    lessons_data?: number
  }
}

export default function CourseExplorer() {
  const { t, lang } = useLang()
  const { isAuthenticated } = useAuth()
  const [inProgressCourses, setInProgressCourses] = useState<InProgressCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInProgressCourses = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // Fetch enrolled courses
        const response = await apiClient.get('/courses/enrolled?limit=8')
        
        if (response.success && response.data) {
          const courses = response.data.courses || response.data || []
          
          // Filter for in-progress courses (progress > 0 and < 100)
          const inProgress = courses.filter((course: any) => {
            const progressPercentage = course.progress?.percentage || 
                                     course.userProgress?.progressPercentage || 
                                     0
            return progressPercentage > 0 && progressPercentage < 100
          })
          
          setInProgressCourses(inProgress)
        }
      } catch (error) {
        console.error('Error fetching in-progress courses:', error)
        setInProgressCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchInProgressCourses()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return null
  }

  return (
    <section id="cours" aria-labelledby="continuer-title" className="py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            id="continuer-title"
            className="text-2xl md:text-3xl font-bold font-[var(--font-poppins)] mb-2 text-foreground"
          >
            {lang === "fr" ? "Continuer les parcours" : "Continue Learning"}
          </h2>
          <p className="text-muted-foreground">
            {lang === "fr" 
              ? "Reprenez où vous vous êtes arrêté"
              : "Resume where you left off"
            }
          </p>
        </div>
        <Link href="/cours">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2ECC71]/10 hover:bg-[#2ECC71]/20 border border-[#2ECC71]/20 rounded-lg text-[#2ECC71] font-medium transition-all hover:scale-105">
            {lang === "fr" ? "Voir tout" : "View all"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded-lg mb-4" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : inProgressCourses.length === 0 ? (
        <Card className="p-12 text-center">
          <CardContent>
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              {lang === "fr" ? "Pas de cours pour le moment" : "No courses at the moment"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {lang === "fr" 
                ? "Commencez un nouveau parcours pour le voir apparaître ici"
                : "Start a new course to see it appear here"
              }
            </p>
            <Link href="/cours">
              <button className="px-6 py-3 bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-white rounded-lg font-medium transition-all">
                {lang === "fr" ? "Explorer les cours" : "Explore Courses"}
              </button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {inProgressCourses.map((course) => {
            const progressPercentage = course.progress?.percentage || 0
            const totalLessons = course.progress?.totalLessons || course._count?.lessons_data || 0
            const completedLessons = course.progress?.completedLessons || 0

            return (
              <Link key={course.id} href={`/cours/${course.id}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full flex flex-col">
                  <div className="relative">
                    {course.thumbnail ? (
                      <div className="relative h-40 w-full overflow-hidden">
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-40 w-full bg-gradient-to-br from-[#2ECC71]/20 to-[#007BFF]/20 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-[#2ECC71]" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex-1">
                      {/* Category Badge */}
                      <Badge variant="secondary" className="mb-3 text-xs">
                        {course.category}
                      </Badge>

                      {/* Title */}
                      <h3 className="font-semibold text-lg mb-2 text-foreground line-clamp-2">
                        {course.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {course.description}
                      </p>

                      {/* Progress */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {lang === "fr" ? "Progression" : "Progress"}
                          </span>
                          <span className="font-medium">
                            {Math.round(progressPercentage)}%
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {completedLessons} / {totalLessons} {lang === "fr" ? "leçons" : "lessons"}
                        </div>
                      </div>
                    </div>

                    {/* Continue Button */}
                    <button 
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-white transition-all text-sm font-medium group-hover:shadow-md"
                    >
                      <Play className="h-4 w-4" />
                      {lang === "fr" ? "Continuer" : "Continue"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

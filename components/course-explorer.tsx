"use client"

import { useMemo, useState, useEffect } from "react"
import { BookOpen, Headphones, PenSquare, Brain, GraduationCap, Mic, FileText, ArrowRight, Star, Clock, Users } from "lucide-react"
import Link from "next/link"
import { useLang } from "./language-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"

const baseTiles = [
  {
    key: "grammar",
    icon: GraduationCap,
    color: "#8E44AD",
    filter: "grammaire",
    category: "GRAMMAR",
    courses: 0,
    level: "A1-C2",
    description: { fr: "Maîtrisez la grammaire française", en: "Master French grammar" }
  },
  {
    key: "listening",
    icon: Headphones,
    color: "#007BFF",
    filter: "comprehension-orale",
    category: "LISTENING",
    courses: 0,
    level: "A2-C1",
    description: { fr: "Développez votre compréhension orale", en: "Develop your listening skills" }
  },
  {
    key: "reading",
    icon: FileText,
    color: "#16A085",
    filter: "comprehension-ecrite",
    category: "READING",
    courses: 0,
    level: "A1-C2",
    description: { fr: "Améliorez votre lecture", en: "Improve your reading" }
  },
  {
    key: "vocab",
    icon: BookOpen,
    color: "#2ECC71",
    filter: "vocabulaire",
    category: "VOCABULARY",
    courses: 0,
    level: "A1-C2",
    description: { fr: "Enrichissez votre vocabulaire", en: "Expand your vocabulary" }
  },
  {
    key: "writing",
    icon: PenSquare,
    color: "#F39C12",
    filter: "expression-ecrite",
    category: "WRITING",
    courses: 0,
    level: "B1-C2",
    description: { fr: "Perfectionnez votre écriture", en: "Perfect your writing" }
  },
  {
    key: "oral",
    icon: Mic,
    color: "#9B59B6",
    filter: "expression-orale",
    category: "ORAL",
    courses: 0,
    level: "A2-C2",
    description: { fr: "Parlez avec confiance", en: "Speak with confidence" }
  },
  {
    key: "sims",
    icon: Brain,
    color: "#E74C3C",
    filter: "tcf-tef",
    category: "TCF_TEF",
    courses: 0,
    level: "B1-C2",
    description: { fr: "Méthodologie complète TCF/TEF", en: "Complete TCF/TEF methodology" }
  },
] as const

export default function CourseExplorer() {
  const { t, lang } = useLang()
  const [tiles, setTiles] = useState(baseTiles)

  // Fetch course counts for each category
  useEffect(() => {
    const fetchCourseCounts = async () => {
      try {
        console.log('🔄 Fetching courses for explorer...')
        const response = await apiClient.get('/courses')
        console.log('📡 Explorer API Response:', response)
        if ((response as any).success) {
          const courses = (response as any).data || []
          console.log('📚 Courses fetched:', courses.length)

          // Count courses by category
          const categoryCounts: Record<string, number> = {}
          courses.forEach((course: any) => {
            const category = course.category
            categoryCounts[category] = (categoryCounts[category] || 0) + 1
          })
          console.log('📊 Category counts:', categoryCounts)

          // Update tiles with actual course counts
          const updatedTiles = baseTiles.map(tile => ({
            ...tile,
            courses: categoryCounts[tile.category] || 0
          }))
          console.log('✅ Updated tiles:', updatedTiles)
          setTiles(updatedTiles as any)
        } else {
          console.error('❌ API response not successful')
        }
      } catch (error) {
        console.error('❌ Error fetching course counts:', error)
        // Keep default tiles if fetch fails
      }
    }

    fetchCourseCounts()
  }, [])

  const memoizedTiles = useMemo(() => tiles, [tiles])
  
  return (
    <section id="cours" aria-labelledby="explorer-title" className="py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
      <h2
        id="explorer-title"
            className="text-2xl md:text-3xl font-bold font-[var(--font-poppins)] mb-2 text-foreground"
      >
        {t("explorer.title")}
      </h2>
          <p className="text-muted-foreground">
            {lang === "fr" 
              ? "Découvrez nos parcours d'apprentissage structurés et progressifs"
              : "Discover our structured and progressive learning paths"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {memoizedTiles.map(({ key, icon: Icon, color, filter, courses, level, description }) => (
          <Link key={key} href="/cours">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
              <div className="relative">
                <div className="absolute top-0 left-0 w-full h-1 rounded-t-lg" style={{ backgroundColor: color }} />
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Icon and Level Badge */}
                    <div className="flex items-center justify-between">
                      <div 
                        className="p-3 rounded-xl bg-opacity-10"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="h-6 w-6" style={{ color }} />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {level}
                      </Badge>
                    </div>

                    {/* Title and Description */}
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-foreground">
                        {t(`explorer.${key}`)}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {lang === "fr" ? description.fr : description.en}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {courses} {lang === "fr" ? "cours" : "courses"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          0
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {lang === "fr" ? "Progression" : "Progress"}
                        </span>
                        <span className="font-medium">
                          0%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                            backgroundColor: color,
                            width: `0%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Continue Button */}
                    <button 
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-background hover:bg-muted transition-all text-sm font-medium group-hover:border-opacity-80"
                      style={{ borderColor: `${color}30` }}
                    >
                      <Clock className="h-4 w-4" style={{ color }} />
                      {lang === "fr" ? "Continuer" : "Continue"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
                </CardContent>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

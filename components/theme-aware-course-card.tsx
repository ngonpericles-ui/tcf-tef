"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Lock, Play, Star, Users, Clock } from "lucide-react"
import Image from "next/image"
import { useLang } from "./language-provider"

interface CourseCardProps {
  course: {
    id: string
    title: string
    titleEn: string
    description: string
    descriptionEn: string
    image?: string
    level: string
    duration: number
    enrolledCount: number
    rating: number
    difficulty: number
    progress?: number
    requiredTier: "free" | "essential" | "premium" | "pro"
    authorName: string
  }
  userTier: "free" | "essential" | "premium" | "pro"
  canAccess: boolean
}

export function ThemeAwareCourseCard({ course, userTier, canAccess }: CourseCardProps) {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const getTierBadgeColor = (tier: typeof course.requiredTier) => {
    const colors = {
      free: "bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700",
      essential: "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
      premium: "bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700",
      pro: "bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
    }
    return colors[tier]
  }

  const getTierLabel = (tier: typeof course.requiredTier) => {
    const labels = {
      free: t("Gratuit", "Free"),
      essential: "Essential",
      premium: "Premium",
      pro: "Pro"
    }
    return labels[tier]
  }

  return (
    <Card className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-card overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={course.image || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop&q=80"}
          alt={lang === "fr" ? course.title : course.titleEn}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
        />
        
        {/* Lock overlay for inaccessible courses */}
        {!canAccess && (
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

        {/* Top left badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge className="bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white font-medium shadow-sm">
            {course.level}
          </Badge>
          {course.requiredTier === "free" && (
            <Badge variant="outline" className={`${getTierBadgeColor(course.requiredTier)} font-medium`}>
              {getTierLabel(course.requiredTier)}
            </Badge>
          )}
        </div>

        {/* Top right rating */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 rounded-full px-2 py-1 text-xs font-medium shadow-sm">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-gray-900 dark:text-white">{course.rating}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-5">
        {/* Course metadata */}
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

        {/* Course title */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-foreground">
          {lang === "fr" ? course.title : course.titleEn}
        </h3>

        {/* Course description */}
        <p className="text-sm mb-3 line-clamp-2 text-muted-foreground">
          {lang === "fr" ? course.description : course.descriptionEn}
        </p>

        {/* Author and difficulty */}
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

        {/* Progress bar */}
        {course.progress && course.progress > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{t("Progression", "Progress")}</span>
              <span className="text-muted-foreground">{course.progress}%</span>
            </div>
            <Progress value={course.progress} />
          </div>
        )}

        {/* Action button */}
        <Button className="w-full gap-2" disabled={!canAccess} variant={canAccess ? "default" : "outline"}>
          {canAccess ? (
            <>
              <Play className="h-4 w-4" />
              {course.progress && course.progress > 0 ? t("Continuer", "Continue") : t("Commencer", "Start")}
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              {t("Passer en", "Upgrade to")}{" "}
              {getTierLabel(course.requiredTier)}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

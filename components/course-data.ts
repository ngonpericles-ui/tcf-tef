// Re-export SubscriptionTier for components that import it from here
export type { SubscriptionTier } from "./types"

export type CourseType = "grammar" | "listening" | "reading" | "vocabulary" | "writing" | "oral" | "simulation"

import type { CourseLevel, SubscriptionTier } from "./types"

export interface Course {
  id: string
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  level: CourseLevel
  requiredTier: SubscriptionTier // renamed from subscriptionTier to match component usage
  type: CourseType
  duration: string
  lessons: number
  progress?: number
  image: string
  authorName: string // renamed from instructor to match component usage
  tags: string[]
  createdBy: "admin" | "manager"
  createdAt: string
  rating: number // added rating field
  enrolledCount: string // added enrolled count
  difficulty: number // added difficulty level (1-5)
}

export const courses: Course[] = []

export function getCoursesByTier(tier: SubscriptionTier): Course[] {
  const tierHierarchy: Record<SubscriptionTier, SubscriptionTier[]> = {
    free: ["free"],
    essential: ["free", "essential"],
    premium: ["free", "essential", "premium"],
    pro: ["free", "essential", "premium", "pro"],
  }

  const allowedTiers = tierHierarchy[tier] || ["free"]
  return courses.filter((course) => allowedTiers.includes(course.requiredTier))
}

export function getCoursesByType(type: CourseType): Course[] {
  return courses.filter((course) => course.type === type)
}

export function getCoursesByLevel(level: CourseLevel): Course[] {
  return courses.filter((course) => course.level === level)
}

export function getCourseById(id: string): Course | undefined {
  return courses.find((course) => course.id === id)
}

export function getFreeCourses(): Course[] {
  return courses.filter((course) => course.requiredTier === "free")
}

export function getPremiumCourses(): Course[] {
  return courses.filter((course) => course.requiredTier !== "free")
}

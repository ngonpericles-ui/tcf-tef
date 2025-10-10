import type { CourseLevel } from "./types"

// Re-export SubscriptionTier for components that import it from here
export type { SubscriptionTier } from "./types"

import type { SubscriptionTier } from "./types"

export type TestLevel = CourseLevel

export type TestType = "quick" | "mock" | "practice" | "official" | "simulation"

export interface Test {
  id: string
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  type: TestType
  level: TestLevel
  requiredTier: SubscriptionTier // Updated property name to match usage in components
  duration: number // Changed to number for easier filtering
  questionCount: number // Updated property name to match usage
  category: string
  difficulty: 1 | 2 | 3 | 4 | 5 // Changed to numeric scale for difficulty dots
  tags: string[]
  createdBy: "admin" | "manager"
  createdAt: string
  aiPowered?: boolean
  hasAIFeedback?: boolean // Added for AI feedback indicator
  image: string
  averageScore: number // Added for statistics
  completionCount: number // Added for statistics
  isOfficial?: boolean // Added for official badge
}

export const allTests: Test[] = []

export function getTestsByTier(tier: SubscriptionTier): Test[] {
  const tierHierarchy: Record<SubscriptionTier, SubscriptionTier[]> = {
    free: ["free"],
    essential: ["free", "essential"],
    premium: ["free", "essential", "premium"],
    pro: ["free", "essential", "premium", "pro"],
  }

  const allowedTiers = tierHierarchy[tier] || ["free"]
  return allTests.filter((test) => allowedTiers.includes(test.requiredTier))
}

export function getTestsByLevel(level: TestLevel): Test[] {
  return allTests.filter((test) => test.level === level)
}

export function getTestsByType(type: TestType): Test[] {
  return allTests.filter((test) => test.type === type)
}

export function getTestsByCategory(category: string): Test[] {
  return allTests.filter((test) => test.category === category)
}

export function getQuickTests(): Test[] {
  return allTests.filter((test) => test.type === "quick")
}

export function getMockTests(): Test[] {
  return allTests.filter((test) => test.type === "mock")
}

export function getAIPoweredTests(): Test[] {
  return allTests.filter((test) => test.aiPowered === true)
}

export function getFreeTests(): Test[] {
  return allTests.filter((test) => test.requiredTier === "free")
}

export function getTestById(id: string): Test | undefined {
  return allTests.find((test) => test.id === id)
}

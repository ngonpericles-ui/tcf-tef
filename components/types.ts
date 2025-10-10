export type CourseLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2"

export type SubscriptionTier = "free" | "essential" | "premium" | "pro"

export type CourseCategory = "grammaire" | "comprehension-orale" | "vocabulaire" | "expression-ecrite" | "tcf-tef"

export type TestType = "practice" | "mock" | "official" | "simulation"

export type SessionType = "workshop" | "masterclass" | "conversation" | "exam-prep"

export interface Course {
  id: string
  title: string
  description: string
  category: CourseCategory
  level: CourseLevel
  duration: number
  image: string
  createdBy: string
  createdByRole: "admin" | "manager"
  subscriptionTier: SubscriptionTier
  progress?: number
  isCompleted?: boolean
  tags: string[]
  createdAt: string
}

export interface Test {
  id: string
  title: string
  description: string
  category: CourseCategory
  level: CourseLevel
  duration: number
  questions: number
  type: TestType
  subscriptionTier: SubscriptionTier
  difficulty: "easy" | "medium" | "hard"
  tags: string[]
  createdAt: string
}

export interface LiveSession {
  id: string
  title: string
  description: string
  type: SessionType
  date: string
  time: string
  duration: number
  instructor: string
  instructorRole: "admin" | "manager"
  participants: number
  maxParticipants: number
  level: CourseLevel
  subscriptionTier: SubscriptionTier
  price?: number
  isLive: boolean
  tags: string[]
}

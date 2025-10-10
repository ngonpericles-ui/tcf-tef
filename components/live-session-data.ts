// Re-export SubscriptionTier for components that import it from here
export type { SubscriptionTier } from "./types"

import type { SubscriptionTier } from "./types"

export type LiveSessionStatus = "upcoming" | "live" | "ended"

export interface LiveSession {
  id: string
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  instructor: string
  coInstructors?: string[]
  date: string
  time: string
  duration: string
  participants: number
  maxParticipants: number
  price: number
  currency: "CFA"
  subscriptionTier: SubscriptionTier
  status: LiveSessionStatus
  image: string
  tags: string[]
  createdBy: "admin" | "manager"
  createdAt: string
  notifyFollowers: boolean
}

export const liveSessionData: LiveSession[] = [
  {
    id: "tcf-prep-intensive",
    title: "Préparation intensive TCF",
    titleEn: "Intensive TCF Preparation",
    description: "Session intensive de préparation au TCF avec exercices pratiques",
    descriptionEn: "Intensive TCF preparation session with practical exercises",
    instructor: "Aïcha Dubois",
    coInstructors: ["Julien Martin"],
    date: "2024-12-20",
    time: "14:00",
    duration: "2h 30min",
    participants: 45,
    maxParticipants: 50,
    price: 7500,
    currency: "CFA",
    subscriptionTier: "essential",
    status: "upcoming",
    image: "/placeholder.svg?height=200&width=300",
    tags: ["TCF", "préparation", "intensif"],
    createdBy: "manager",
    createdAt: "2024-12-01",
    notifyFollowers: true,
  },
  {
    id: "conversation-b2",
    title: "Atelier conversation B2",
    titleEn: "B2 Conversation Workshop",
    description: "Pratiquez la conversation française niveau B2",
    descriptionEn: "Practice French conversation at B2 level",
    instructor: "Julien Martin",
    date: "2024-12-18",
    time: "19:00",
    duration: "1h 30min",
    participants: 28,
    maxParticipants: 30,
    price: 0,
    currency: "CFA",
    subscriptionTier: "free",
    status: "live",
    image: "/placeholder.svg?height=200&width=300",
    tags: ["conversation", "B2", "pratique"],
    createdBy: "manager",
    createdAt: "2024-12-05",
    notifyFollowers: true,
  },
  {
    id: "grammar-masterclass",
    title: "Masterclass grammaire avancée",
    titleEn: "Advanced Grammar Masterclass",
    description: "Maîtrisez les subtilités de la grammaire française",
    descriptionEn: "Master the subtleties of French grammar",
    instructor: "Admin",
    coInstructors: ["Aïcha Dubois", "Julien Martin"],
    date: "2024-12-22",
    time: "16:00",
    duration: "3h 00min",
    participants: 67,
    maxParticipants: 80,
    price: 12000,
    currency: "CFA",
    subscriptionTier: "premium",
    status: "upcoming",
    image: "/placeholder.svg?height=200&width=300",
    tags: ["grammaire", "masterclass", "avancé"],
    createdBy: "admin",
    createdAt: "2024-11-28",
    notifyFollowers: true,
  },
  {
    id: "tef-simulation",
    title: "Simulation TEF en direct",
    titleEn: "Live TEF Simulation",
    description: "Simulation complète du TEF avec correction en temps réel",
    descriptionEn: "Complete TEF simulation with real-time correction",
    instructor: "Aïcha Dubois",
    date: "2024-12-25",
    time: "10:00",
    duration: "4h 00min",
    participants: 23,
    maxParticipants: 40,
    price: 15000,
    currency: "CFA",
    subscriptionTier: "pro",
    status: "upcoming",
    image: "/placeholder.svg?height=200&width=300",
    tags: ["TEF", "simulation", "examen"],
    createdBy: "manager",
    createdAt: "2024-12-02",
    notifyFollowers: true,
  },
  {
    id: "pronunciation-workshop",
    title: "Atelier prononciation",
    titleEn: "Pronunciation Workshop",
    description: "Améliorez votre prononciation française",
    descriptionEn: "Improve your French pronunciation",
    instructor: "Julien Martin",
    date: "2024-12-19",
    time: "18:00",
    duration: "1h 15min",
    participants: 35,
    maxParticipants: 40,
    price: 0,
    currency: "CFA",
    subscriptionTier: "free",
    status: "upcoming",
    image: "/placeholder.svg?height=200&width=300",
    tags: ["prononciation", "phonétique", "oral"],
    createdBy: "manager",
    createdAt: "2024-12-08",
    notifyFollowers: true,
  },
  {
    id: "business-french",
    title: "Français des affaires",
    titleEn: "Business French",
    description: "Apprenez le vocabulaire et les expressions du monde professionnel",
    descriptionEn: "Learn professional vocabulary and expressions",
    instructor: "Admin",
    date: "2024-12-27",
    time: "14:30",
    duration: "2h 00min",
    participants: 42,
    maxParticipants: 50,
    price: 9000,
    currency: "CFA",
    subscriptionTier: "premium",
    status: "upcoming",
    image: "/placeholder.svg?height=200&width=300",
    tags: ["affaires", "professionnel", "vocabulaire"],
    createdBy: "admin",
    createdAt: "2024-12-03",
    notifyFollowers: true,
  },
  {
    id: "culture-francophone",
    title: "Culture francophone",
    titleEn: "Francophone Culture",
    description: "Découvrez la richesse de la culture francophone",
    descriptionEn: "Discover the richness of Francophone culture",
    instructor: "Aïcha Dubois",
    coInstructors: ["Julien Martin"],
    date: "2024-12-21",
    time: "20:00",
    duration: "1h 45min",
    participants: 38,
    maxParticipants: 45,
    price: 0,
    currency: "CFA",
    subscriptionTier: "free",
    status: "upcoming",
    image: "/placeholder.svg?height=200&width=300",
    tags: ["culture", "francophone", "découverte"],
    createdBy: "manager",
    createdAt: "2024-12-06",
    notifyFollowers: true,
  },
  {
    id: "writing-intensive",
    title: "Intensif expression écrite",
    titleEn: "Intensive Writing Workshop",
    description: "Perfectionnez vos compétences en expression écrite",
    descriptionEn: "Perfect your written expression skills",
    instructor: "Julien Martin",
    date: "2024-12-30",
    time: "15:00",
    duration: "2h 45min",
    participants: 29,
    maxParticipants: 35,
    price: 11000,
    currency: "CFA",
    subscriptionTier: "premium",
    status: "upcoming",
    image: "/placeholder.svg?height=200&width=300",
    tags: ["écriture", "expression", "intensif"],
    createdBy: "manager",
    createdAt: "2024-12-04",
    notifyFollowers: true,
  },
]

export function getSessionsByTier(tier: SubscriptionTier): LiveSession[] {
  const tierHierarchy: Record<SubscriptionTier, SubscriptionTier[]> = {
    free: ["free"],
    essential: ["free", "essential"],
    premium: ["free", "essential", "premium"],
    pro: ["free", "essential", "premium", "pro"],
  }

  const allowedTiers = tierHierarchy[tier] || ["free"]
  return liveSessionData.filter((session) => allowedTiers.includes(session.subscriptionTier))
}

export function getUpcomingSessions(): LiveSession[] {
  return liveSessionData.filter((session) => session.status === "upcoming")
}

export function getLiveSessions(): LiveSession[] {
  return liveSessionData.filter((session) => session.status === "live")
}

export function getSessionById(id: string): LiveSession | undefined {
  return liveSessionData.find((session) => session.id === id)
}

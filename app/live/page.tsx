"use client"

import { useState, useMemo, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, Video, Lock, UserCheck, MessageCircle, Star, Crown, Shield, UserPlus, Loader2, AlertCircle, ChevronDown, Check } from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"
import { liveSessionService, type LiveSession } from "@/lib/services/liveSessionService"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

const sessionTypeColors = {
  workshop: "#2ECC71",
  masterclass: "#8E44AD",
  practice: "#007BFF",
  "exam-prep": "#F39C12",
  conversation: "#E74C3C",
}

export default function LivePage() {
  const { lang } = useLang()
  const { user } = useAuth()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // State for real API data
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [reminderLoading, setReminderLoading] = useState<string | null>(null)

  // Load sessions from API
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load all sessions
      const allSessionsResponse = await liveSessionService.getAllSessions(
        { page: 1, limit: 50, sortBy: 'date', sortOrder: 'asc' },
        { status: 'SCHEDULED,LIVE' }
      )

      // Load upcoming sessions
      const upcomingResponse = await liveSessionService.getUpcomingSessions(
        { page: 1, limit: 20, sortBy: 'date', sortOrder: 'asc' }
      )

      if (allSessionsResponse.success && allSessionsResponse.data) {
        setSessions(allSessionsResponse.data.sessions || [])
      }

      if (upcomingResponse.success && upcomingResponse.data) {
        setUpcomingSessions(upcomingResponse.data.sessions || [])
      }

    } catch (err: any) {
      console.error('Failed to load sessions:', err)
      setError(t("Erreur lors du chargement des sessions", "Error loading sessions"))
    } finally {
      setLoading(false)
    }
  }

  // Get user subscription tier
  const userTier = user?.subscriptionTier?.toLowerCase() || 'free'

  const tierHierarchy: Record<string, string[]> = {
    free: ["FREE"],
    essential: ["FREE", "ESSENTIAL"],
    premium: ["FREE", "ESSENTIAL", "PREMIUM"],
    pro: ["FREE", "ESSENTIAL", "PREMIUM", "PRO"],
  }

  const canAccess = (sessionRequiredTier: string) => {
    return tierHierarchy[userTier]?.includes(sessionRequiredTier) || false
  }

  // Handle joining a session with subscription check
  const handleJoinSession = async (session: LiveSession) => {
    if (!user) {
      toast.error(t("Vous devez être connecté pour rejoindre une session", "You must be logged in to join a session"))
      return
    }

    if (!canAccess(session.requiredTier)) {
      toast.error(t("Upgradez votre abonnement pour accéder à cette session", "Upgrade your subscription to access this session"))
      // Redirect to subscription page
      window.location.href = "/abonnement"
      return
    }

    try {
      await liveSessionService.joinSession(session.id)
      toast.success(t("Vous avez rejoint la session avec succès!", "Successfully joined the session!"))
      // Redirect to session or show success
    } catch (error: any) {
      console.error('Failed to join session:', error)
      toast.error(error.message || t("Erreur lors de la connexion à la session", "Error joining session"))
    }
  }

  // Handle setting reminder
  const handleSetReminder = async (sessionId: string, reminderTime: '5min' | '10min') => {
    if (!user) {
      toast.error(t("Vous devez être connecté pour programmer un rappel", "You must be logged in to set a reminder"))
      return
    }

    setReminderLoading(sessionId)
    
    try {
      // Call backend API to set reminder
      const response = await fetch('/api/live-sessions/reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          sessionId,
          reminderTime
        })
      })

      if (response.ok) {
        toast.success(t(
          `Rappel programmé! Vous recevrez un email ${reminderTime === '5min' ? '5 minutes' : '10 minutes'} avant la session.`,
          `Reminder set! You will receive an email ${reminderTime === '5min' ? '5 minutes' : '10 minutes'} before the session.`
        ))
      } else {
        throw new Error('Failed to set reminder')
      }
    } catch (error: any) {
      console.error('Failed to set reminder:', error)
      toast.error(t("Erreur lors de la programmation du rappel", "Error setting reminder"))
    } finally {
      setReminderLoading(null)
    }
  }

  // Filter sessions based on search and filters
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (!session.title.toLowerCase().includes(searchLower) &&
            !session.description.toLowerCase().includes(searchLower)) {
          return false
        }
      }

      // Level filter
      if (selectedLevel !== "all" && session.level !== selectedLevel) {
        return false
      }

      // Category filter
      if (selectedCategory !== "all" && session.category !== selectedCategory) {
        return false
      }

      return true
    })
  }, [sessions, searchTerm, selectedLevel, selectedCategory])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return t("Aujourd'hui", "Today")
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t("Demain", "Tomorrow")
    } else {
      return date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const categories = [
    "grammaire",
    "vocabulaire",
    "expression ecrite",
    "expression orale",
    "comprehension orale",
    "comprehension ecrite",
    "tcf/tef",
  ]
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]

  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")

  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      className={`rounded-full text-xs px-3 py-1.5 font-medium border transition-colors ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-secondary hover:bg-accent border-gray-200 dark:border-gray-700"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )

  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-12 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 mb-6">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("En direct", "Live")}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              {t("Sessions Live Interactives", "Interactive Live Sessions")}
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-white max-w-3xl mx-auto leading-relaxed">
              {t(
                "Rejoignez nos sessions en direct animées par des experts certifiés. Apprenez, pratiquez et progressez en temps réel.",
                "Join our live sessions led by certified experts. Learn, practice and progress in real time.",
              )}
            </p>
            
            {/* Statistiques simples */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">24/7</div>
                <div className="text-sm text-slate-600 dark:text-white">{t("Disponibilité", "Availability")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">15+</div>
                <div className="text-sm text-slate-600 dark:text-white">{t("Experts", "Experts")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">500+</div>
                <div className="text-sm text-slate-600 dark:text-white">{t("Sessions", "Sessions")}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg text-muted-foreground">
                {t("Chargement des sessions...", "Loading sessions...")}
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <span className="text-lg">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSessions}
                className="ml-4"
              >
                {t("Réessayer", "Retry")}
              </Button>
            </div>
          </div>
        )}

        {/* Content - only show when not loading */}
        {!loading && !error && (
          <>
        {/* Live Session Banner - Show first LIVE session if available */}
        {sessions.filter(s => s.status === 'LIVE').length > 0 && (
          <section className="mb-10">
            {(() => {
              const liveSession = sessions.filter(s => s.status === 'LIVE')[0]
              return (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  {/* Simple live indicator */}
                  <div className="bg-red-500 h-1"></div>
                  
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Video className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-red-500 text-white text-xs px-2 py-1">LIVE</Badge>
                            <Badge
                              variant="outline"
                              className="border-slate-300 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800"
                            >
                              {t("En cours", "Ongoing")}
                            </Badge>
                          </div>
                          
                          <h2 className="text-xl md:text-2xl font-bold mb-3 text-slate-900 dark:text-white">
                            {liveSession.title}
                          </h2>
                          
                          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{liveSession.participantCount} {t("participants actifs", "active participants")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              <span>
                                {t("Animé par", "Led by")} {liveSession.createdBy ? `${liveSession.createdBy.firstName} ${liveSession.createdBy.lastName}` : t("Instructeur", "Instructor")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{t("Commencé il y a", "Started")} {Math.floor((Date.now() - new Date(liveSession.date).getTime()) / (1000 * 60))} {t("min", "min ago")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          size="lg"
                          onClick={() => handleJoinSession(liveSession)}
                          className="bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <Video className="h-5 w-5 mr-2" />
                          {t("Rejoindre maintenant", "Join now")}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="lg"
                              variant="outline"
                              className="border-slate-300 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200"
                            >
                              <Calendar className="h-5 w-5 mr-2" />
                              {t("Programmer un rappel", "Set reminder")}
                              <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleSetReminder(liveSession.id, '5min')}
                              disabled={reminderLoading === liveSession.id}
                            >
                              {reminderLoading === liveSession.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Clock className="h-4 w-4 mr-2" />
                              )}
                              {t("5 minutes avant", "5 minutes before")}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleSetReminder(liveSession.id, '10min')}
                              disabled={reminderLoading === liveSession.id}
                            >
                              {reminderLoading === liveSession.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Clock className="h-4 w-4 mr-2" />
                              )}
                              {t("10 minutes avant", "10 minutes before")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </section>
        )}

        {/* Sessions Privées 1-on-1 - Pro+ Only */}
        <section className="mb-10">
          <div className="relative overflow-hidden rounded-2xl border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-orange-50/50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-orange-950/30 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-orange-500/5" />
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg">
                      <Crown className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 shadow-lg">
                        PRO+
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                        {t("Sessions Privées", "Private Sessions")}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-purple-300 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/20"
                      >
                        {t("1-on-1", "1-on-1")}
                      </Badge>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                      {t("Sessions Privées avec Encadreurs", "Private Sessions with Instructors")}
                    </h2>
                    <p className="text-slate-600 dark:text-white mb-3 max-w-2xl">
                      {t(
                        "Réservez des sessions personnalisées 1-on-1 avec nos experts certifiés. Accès exclusif aux élèves Pro+ pour un apprentissage sur mesure.",
                        "Book personalized 1-on-1 sessions with our certified experts. Exclusive access for Pro+ students for tailored learning."
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-white">
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-4 w-4" />
                        <span>{t("15+ encadreurs disponibles", "15+ instructors available")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        <span>{t("4.9/5 évaluation moyenne", "4.9/5 average rating")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{t("Chat intégré", "Integrated chat")}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {userTier === "pro" ? (
                    <>
                      <Button
                        size="lg"
                        onClick={() => {
                          // Use proper navigation for Pro users
                          window.location.href = "/avantages-pro"
                        }}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <UserPlus className="h-5 w-5 mr-2" />
                        {t("Voir les encadreurs", "View instructors")}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors duration-200 bg-transparent"
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        {t("Mes sessions", "My sessions")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={() => window.location.href = "/abonnement"}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Crown className="h-5 w-5 mr-2" />
                        {t("Passer en Pro", "Upgrade to Pro")}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => {
                          // Check if user is authenticated before redirecting
                          if (!user) {
                            toast.error(t("Vous devez être connecté pour accéder à cette page", "You must be logged in to access this page"))
                            return
                          }

                          // Check subscription tier
                          if (userTier === "pro") {
                            // Pro user - redirect to avantages-pro page
                            window.location.href = "/avantages-pro"
                          } else {
                            // Non-pro user - show upgrade message and redirect to subscription page
                            toast.info(t(
                              "Cette fonctionnalité est réservée aux abonnés Pro+. Découvrez nos offres !",
                              "This feature is reserved for Pro+ subscribers. Discover our offers!"
                            ))
                            setTimeout(() => {
                              window.location.href = "/abonnement"
                            }, 2000)
                          }
                        }}
                        className="border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors duration-200 bg-transparent"
                      >
                        <Shield className="h-5 w-5 mr-2" />
                        {t("Découvrir les avantages", "Discover benefits")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Liste des encadreurs disponibles (visible uniquement pour Pro) */}
              {userTier === "pro" && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
                    {t("Encadreurs Disponibles", "Available Instructors")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: "Aïcha Dubois", role: "Manager", rating: 4.9, students: 127, subjects: ["Grammaire", "Expression Orale"], online: true },
                      { name: "Julien Martin", role: "Manager", rating: 4.8, students: 98, subjects: ["Vocabulaire", "Compréhension"], online: true },
                      { name: "Marie Laurent", role: "Admin", rating: 5.0, students: 156, subjects: ["TCF/TEF", "Exam Prep"], online: false },
                      { name: "Pierre Dubois", role: "Manager", rating: 4.7, students: 89, subjects: ["Expression Écrite", "Culture"], online: true },
                      { name: "Sophie Moreau", role: "Admin", rating: 4.9, students: 134, subjects: ["Phonétique", "Conversation"], online: true },
                      { name: "Thomas Bernard", role: "Manager", rating: 4.8, students: 112, subjects: ["Littérature", "Histoire"], online: false }
                    ].map((instructor, index) => (
                      <div
                        key={index}
                        className="group relative rounded-xl border border-gray-200 dark:border-gray-700 bg-card p-4 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg">
                              {instructor.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${instructor.online ? 'bg-green-500' : 'bg-gray-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-900 dark:text-white truncate">{instructor.name}</h4>
                              <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 dark:text-purple-300">
                                {instructor.role}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span className="text-sm text-slate-600 dark:text-white">{instructor.rating}</span>
                              <span className="text-xs text-slate-600 dark:text-white">({instructor.students} élèves)</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {instructor.subjects.slice(0, 2).map((subject, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs border-gray-200 dark:border-gray-700 text-slate-600 dark:text-white">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              {t("Contacter", "Contact")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Filter bar - pill groups */}
        <section className="w-full mb-8">
          <div className="w-full flex flex-wrap gap-3 bg-secondary rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Chip active={selectedCategory === "all"} onClick={() => setSelectedCategory("all")}>
                {t("Toutes", "All")}
              </Chip>
              {categories.map((c) => (
                <Chip key={c} active={selectedCategory === c} onClick={() => setSelectedCategory(c)}>
                  {c}
                </Chip>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {levels.map((l) => (
                <Chip key={l} active={selectedLevel === l} onClick={() => setSelectedLevel(l)}>
                  {l}
                </Chip>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="mb-10">
          <div className="grid grid-cols-1 gap-6">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <Video className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {t("Aucune session trouvée", "No sessions found")}
                </h3>
                <p className="text-slate-600 dark:text-white">
                  {t("Essayez de modifier vos filtres ou revenez plus tard", "Try adjusting your filters or check back later")}
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div key={session.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-center min-w-[100px] p-3 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40 border border-gray-200 dark:border-gray-700">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatDate(session.date)}
                        </div>
                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          {formatTime(session.date)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            {session.title}
                          </h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-white mb-3 line-clamp-2">
                          {session.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-white">
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-4 w-4" />
                            <span>{session.createdBy ? `${session.createdBy.firstName} ${session.createdBy.lastName}` : t("Instructeur", "Instructor")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>
                              {session.participantCount}/{session.maxParticipants} {t("participants", "participants")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{session.duration} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            className="text-white border-0 font-medium shadow-sm"
                            style={{ backgroundColor: (sessionTypeColors as any)[session.category?.toLowerCase() || "workshop"] }}
                          >
                            {session.level || session.tags?.[0]?.toUpperCase() || "B1"}
                          </Badge>
                          {session.requiredTier !== "FREE" ? (
                            <Badge variant="outline" className="text-xs border-gray-200 dark:border-gray-700">
                              {session.requiredTier}
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500 text-white text-xs shadow-sm">{t("Gratuit", "Free")}</Badge>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            className="gap-2"
                            disabled={!canAccess(session.requiredTier)}
                            variant={canAccess(session.requiredTier) ? "default" : "outline"}
                            onClick={() => canAccess(session.requiredTier) && handleJoinSession(session)}
                          >
                            {!canAccess(session.requiredTier) ? (
                              <>
                                <Lock className="h-4 w-4" />
                                {t("Upgrade", "Upgrade")}
                              </>
                            ) : session.status === "LIVE" ? (
                              <>
                                <Video className="h-4 w-4" />
                                {t("Rejoindre", "Join")}
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4" />
                                {t("S'inscrire", "Register")}
                              </>
                            )}
                          </Button>
                          {session.status === "SCHEDULED" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {t("Rappel", "Reminder")}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleSetReminder(session.id, '5min')}
                                  disabled={reminderLoading === session.id}
                                >
                                  {reminderLoading === session.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Clock className="h-4 w-4 mr-2" />
                                  )}
                                  {t("5 min avant", "5 min before")}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleSetReminder(session.id, '10min')}
                                  disabled={reminderLoading === session.id}
                                >
                                  {reminderLoading === session.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Clock className="h-4 w-4 mr-2" />
                                  )}
                                  {t("10 min avant", "10 min before")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-[var(--font-poppins)] text-slate-900 dark:text-white">
              {t("Programme de la semaine", "This week's schedule")}
            </h2>
            <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-700 hover:bg-secondary bg-transparent">
              {t("Voir tout", "View all")}
            </Button>
          </div>
          <div className="space-y-4">
            {upcomingSessions.slice(0, 5).map((session, index) => (
              <div
                key={session.id}
                className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-card p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-center min-w-[100px] p-3 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40 border border-gray-200 dark:border-gray-700">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatDate(session.date)}
                      </div>
                      <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        {formatTime(session.date)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                          {session.title}
                        </h3>
                        {/* Supprimer la vérification isRecorded car elle n'existe pas */}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-white">
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-4 w-4" />
                          <span>{session.createdBy ? `${session.createdBy.firstName} ${session.createdBy.lastName}` : t("Instructeur", "Instructor")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>
                            {session.participantCount}/{session.maxParticipants} {t("participants", "participants")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{session.duration} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        className="text-white border-0 font-medium shadow-sm"
                        style={{ backgroundColor: (sessionTypeColors as any)[session.category?.toLowerCase() || "workshop"] }}
                      >
                        {session.level || session.tags?.[0]?.toUpperCase() || "B1"}
                      </Badge>
                      {session.requiredTier !== "FREE" ? (
                        <Badge variant="outline" className="text-xs border-gray-200 dark:border-gray-700">
                          {session.requiredTier}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500 text-white text-xs shadow-sm">{t("Gratuit", "Free")}</Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90"
                    >
                      {t("Rejoindre", "Join")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
          </>
        )}
      </main>
    </PageShell>
  )
}

"use client"

import { useState, useMemo, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, Users, Video, Lock, UserCheck, MessageCircle, Star, Crown, Shield, UserPlus, Loader2, AlertCircle, ChevronDown, Check, MoreVertical, BookmarkPlus, Bell, Search, PlayCircle, XCircle } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"
import { getComprehensiveProfilePictureUrl } from "@/lib/utils/profilePicture"
import apiClient from "@/lib/api-client"

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
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showLevelDropdown, setShowLevelDropdown] = useState(false)
  const [reminderLoading, setReminderLoading] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second for timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCategoryDropdown || showLevelDropdown) {
        const target = event.target as Node
        const categoryButton = document.querySelector('[data-category-dropdown]')
        const levelButton = document.querySelector('[data-level-dropdown]')
        
        if (categoryButton && !categoryButton.contains(target) && !(target as Element).closest('[data-category-dropdown-menu]')) {
          setShowCategoryDropdown(false)
        }
        if (levelButton && !levelButton.contains(target) && !(target as Element).closest('[data-level-dropdown-menu]')) {
          setShowLevelDropdown(false)
        }
      }
    }

    if (showCategoryDropdown || showLevelDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCategoryDropdown, showLevelDropdown])

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

      let sessionsData: LiveSession[] = []
      if (allSessionsResponse.success && allSessionsResponse.data) {
        // Handle both response formats: data.sessions or data directly
        sessionsData = Array.isArray(allSessionsResponse.data) 
          ? allSessionsResponse.data 
          : allSessionsResponse.data.sessions || []
        setSessions(sessionsData)
      }

      if (upcomingResponse.success && upcomingResponse.data) {
        // Handle both response formats: data.sessions or data directly
        const upcomingData = Array.isArray(upcomingResponse.data) 
          ? upcomingResponse.data 
          : upcomingResponse.data.sessions || []
        setUpcomingSessions(upcomingData)
      }

      // Tutor profiles (email and profileImage) are now included directly in session.createdBy

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

    // Check if already registered
    if (session.isRegistered) {
      toast.info(t("Vous êtes déjà inscrit à cette session", "You are already registered for this session"))
      // Redirect to session page
      window.location.href = `/live-session/${session.id}`
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
      // Redirect to session page
      window.location.href = `/live-session/${session.id}`
    } catch (error: any) {
      console.error('Failed to join session:', error)
      if (error.response?.status === 409) {
        toast.info(t("Vous êtes déjà inscrit à cette session", "You are already registered for this session"))
        // Redirect to session page
        window.location.href = `/live-session/${session.id}`
      } else {
        toast.error(error.message || t("Erreur lors de la connexion à la session", "Error joining session"))
      }
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
      // Call backend API to set reminder using apiClient
      const response = await apiClient.post('/live-sessions/reminder', {
          sessionId,
          reminderTime
      })

      if (response.success) {
        toast.success(t(
          `Rappel programmé! Vous recevrez un email ${reminderTime === '5min' ? '5 minutes' : '10 minutes'} avant la session.`,
          `Reminder set! You will receive an email ${reminderTime === '5min' ? '5 minutes' : '10 minutes'} before the session.`
        ))
      } else {
        throw new Error(response.error?.message || 'Failed to set reminder')
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

  // Format date for display (Today, Tomorrow, or date)
  const formatDisplayDate = (dateString: string) => {
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
        month: "short",
        day: "numeric",
      })
    }
  }

  // Format time with EST
  const formatDisplayTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }) + " EST"
  }

  // Get comprehensive session status (status changes to LIVE 5 minutes before start)
  const getSessionStatus = (session: LiveSession) => {
    const now = currentTime
    const sessionDate = new Date(session.date)
    const sessionEnd = new Date(sessionDate.getTime() + session.duration * 60000)
    const earlyStartTime = new Date(sessionDate.getTime() - 5 * 60000) // 5 minutes before
    const slotsLeft = session.maxParticipants - session.participantCount
    const minutesUntilStart = Math.floor((sessionDate.getTime() - now.getTime()) / 60000)
    
    // Check if expired
    if (now > sessionEnd) {
      return { 
        type: 'expired',
        text: t("Expiré", "Expired"), 
        color: "bg-gray-400/50 dark:bg-gray-600/50",
        icon: XCircle
      }
    }
    
    // Check if live (status changes 5 minutes before scheduled time)
    if (session.status === 'LIVE' || (now >= earlyStartTime && now < sessionEnd)) {
      return { 
        type: 'live',
        text: t("LIVE", "LIVE"), 
        color: "bg-[#06f957] text-black",
        icon: PlayCircle,
        pulse: true
      }
    }
    
    // Check if starting soon (within 15 minutes)
    if (minutesUntilStart > 0 && minutesUntilStart <= 15) {
      return { 
        type: 'starting',
        text: t(`Démarre dans ${minutesUntilStart} min`, `Starts in ${minutesUntilStart} min`), 
        color: "bg-orange-400/50 dark:bg-orange-600/50",
        icon: Clock
      }
    }
    
    // Check slots
    if (slotsLeft === 0) {
      return { 
        type: 'full',
        text: t("Complet", "Full"), 
        color: "bg-red-400/50 dark:bg-zinc-600/50",
        icon: XCircle
      }
    }
    
    if (slotsLeft <= 5) {
      return { 
        type: 'limited',
        text: t(`${slotsLeft} places restantes`, `${slotsLeft} spots left`), 
        color: "bg-yellow-400/50",
        icon: Users
      }
    }
    
    // Scheduled
    return { 
      type: 'scheduled',
      text: t("Programmé", "Scheduled"), 
      color: "bg-blue-400/50 dark:bg-blue-600/50",
      icon: Calendar
    }
  }

  // Get timer display for session
  const getSessionTimer = (session: LiveSession) => {
    const now = currentTime
    const sessionDate = new Date(session.date)
    const sessionEnd = new Date(sessionDate.getTime() + session.duration * 60000)
    const earlyStartTime = new Date(sessionDate.getTime() - 5 * 60000) // 5 minutes before
    
    // If session is live (5 min before or after start)
    if (now >= earlyStartTime && now < sessionEnd) {
      const elapsed = Math.floor((now.getTime() - earlyStartTime.getTime()) / 1000)
      const hours = Math.floor(elapsed / 3600)
      const minutes = Math.floor((elapsed % 3600) / 60)
      const seconds = elapsed % 60
      
      // Format with leading zeros: 00h 15m 32s
      const formattedHours = hours.toString().padStart(2, '0')
      const formattedMinutes = minutes.toString().padStart(2, '0')
      const formattedSeconds = seconds.toString().padStart(2, '0')
      
      return {
        type: 'active',
        text: t(
          `Active depuis ${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s`,
          `Active For ${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s`
        ),
        formatted: `${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s`,
        hours,
        minutes,
        seconds
      }
    }
    
    // If session is upcoming, show countdown
    const timeUntilStart = sessionDate.getTime() - now.getTime()
    
    if (timeUntilStart > 0) {
      const totalSeconds = Math.floor(timeUntilStart / 1000)
      const days = Math.floor(totalSeconds / 86400)
      const hours = Math.floor((totalSeconds % 86400) / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      
      // Format based on time remaining
      let formatted: string
      let text: string
      
      if (days > 0) {
        // Show days: 02d 09h 45m
        const formattedDays = days.toString().padStart(2, '0')
        const formattedHours = hours.toString().padStart(2, '0')
        const formattedMinutes = minutes.toString().padStart(2, '0')
        formatted = `${formattedDays}d ${formattedHours}h ${formattedMinutes}m`
        text = t(
          `Démarre dans ${formattedDays}d ${formattedHours}h ${formattedMinutes}m`,
          `Starts In ${formattedDays}d ${formattedHours}h ${formattedMinutes}m`
        )
      } else if (hours > 0) {
        // Show hours and minutes: 2h 30m 05s
        const formattedHours = hours.toString().padStart(2, '0')
        const formattedMinutes = minutes.toString().padStart(2, '0')
        const formattedSeconds = seconds.toString().padStart(2, '0')
        formatted = `${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s`
        text = t(
          `Démarre dans ${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s`,
          `Starts In ${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s`
        )
      } else {
        // Show minutes and seconds: 15m 32s
        const formattedMinutes = minutes.toString().padStart(2, '0')
        const formattedSeconds = seconds.toString().padStart(2, '0')
        formatted = `${formattedMinutes}m ${formattedSeconds}s`
        text = t(
          `Démarre dans ${formattedMinutes}m ${formattedSeconds}s`,
          `Starts In ${formattedMinutes}m ${formattedSeconds}s`
        )
      }
      
      return {
        type: 'starts',
        text,
        formatted,
        days,
        hours,
        minutes,
        seconds
      }
    }
    
    return null
  }
  
  // Get tutor profile image - prioritize DB profileImage, fallback to email-based avatar
  const getTutorProfileImage = (session: LiveSession) => {
    if (!session.createdBy) return null
    
    const tutorEmail = session.createdBy.email || ''
    const profileImage = session.createdBy.profileImage || ''
    
    // If profileImage exists in DB, use it directly (it's already an absolute URL from backend)
    if (profileImage && profileImage.trim() !== '') {
      // Backend saves absolute URLs, but handle both absolute and relative for safety
      if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
        return profileImage // Already absolute URL
      } else if (profileImage.startsWith('/uploads') || profileImage.startsWith('/')) {
        // Relative URL - convert to absolute
        const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'
        return `${backendUrl}${profileImage.startsWith('/') ? '' : '/'}${profileImage}`
      } else {
        // No leading slash - assume it's a relative path
        const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'
        return `${backendUrl}/uploads/${profileImage}`
      }
    }
    
    // Fallback to email-based avatar (Gravatar, DiceBear, etc.)
    return getComprehensiveProfilePictureUrl(tutorEmail, '')
  }

  // Get weekly schedule data
  const getWeeklySchedule = () => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
    
    const weekDays = []
    for (let i = 0; i < 5; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      weekDays.push(day)
    }

    return weekDays.map(day => {
      const daySessions = upcomingSessions.filter(session => {
        const sessionDate = new Date(session.date)
        return sessionDate.toDateString() === day.toDateString()
      })
      return { day, sessions: daySessions }
    })
  }

  const weeklySchedule = getWeeklySchedule()

  return (
    <PageShell>
      <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f5f8f6] dark:bg-[#0f2316]">

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <main className="py-16 sm:py-24">
          <div className="text-center mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 mb-6">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("En direct", "Live")}
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
              <span className="text-[#1A1A1A] dark:text-[#E0E0E0]">Aura</span>
              <span className="text-[#06f957]"> Live</span>
              <span className="text-[#1A1A1A] dark:text-[#E0E0E0]"> Sessions</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-[#555555] dark:text-[#AAAAAA]">
              {t(
                "Découvrez l'avenir de l'apprentissage interactif avec nos experts certifiés, en direct et directement chez vous.",
                "Experience the future of interactive learning with our certified experts, live and direct to you."
              )}
            </p>
          </div>
        </div>

          {/* Search/Filter Bar - Sticky Glass Card */}
          <section className="px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 mb-12">
            <div className="mx-auto max-w-5xl">
              <div className="glass-card rounded-2xl p-4 shadow-xl border border-white/30 dark:border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search Input */}
                  <label className="flex flex-col w-full">
                    <div className="flex w-full flex-1 items-stretch rounded-xl h-12">
                      <div className="text-black dark:text-white flex bg-black/5 dark:bg-white/5 items-center justify-center pl-4 rounded-l-xl">
                        <Search className="w-5 h-5" />
              </div>
                      <Input
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl text-black dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#2ECC71] border-none bg-black/5 dark:bg-white/5 h-full placeholder:text-[#5f8c6e] dark:placeholder:text-gray-400 px-4 text-base font-normal leading-normal"
                        placeholder={t("Rechercher des sessions ou experts...", "Search for sessions or experts...")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      />
              </div>
                  </label>

                  {/* Category Dropdown */}
                  <div className="relative">
                    <button
                      data-category-dropdown
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="flex h-12 w-full items-center justify-between gap-x-2 rounded-xl bg-black/5 dark:bg-white/5 px-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-white/30 dark:border-white/10"
                    >
                      <p className="text-black dark:text-white text-base font-medium leading-normal" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {selectedCategory === "all" ? t("Catégorie", "Category") : selectedCategory}
                      </p>
                      <ChevronDown className={`w-5 h-5 text-black dark:text-white transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Category Dropdown */}
                    {showCategoryDropdown && (
                      <div data-category-dropdown-menu className="absolute top-full left-0 mt-2 w-full bg-white/90 dark:bg-background-dark/90 backdrop-blur-xl rounded-xl border border-[#2ECC71]/18 dark:border-[#2ECC71]/12 shadow-xl z-50">
                        <div className="p-2">
                          <button
                            onClick={() => {
                              setSelectedCategory("all")
                              setShowCategoryDropdown(false)
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              selectedCategory === "all"
                                ? 'bg-[#2ECC71]/20 text-[#2ECC71] font-medium'
                                : 'text-black dark:text-white hover:bg-[#2ECC71]/10'
                            }`}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {t("Toutes", "All")}
                          </button>
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => {
                                setSelectedCategory(cat)
                                setShowCategoryDropdown(false)
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                selectedCategory === cat
                                  ? 'bg-[#2ECC71]/20 text-[#2ECC71] font-medium'
                                  : 'text-black dark:text-white hover:bg-[#2ECC71]/10'
                              }`}
                              style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                              {cat}
                            </button>
                          ))}
              </div>
            </div>
                    )}
          </div>
                  
                  {/* Level Dropdown */}
                  <div className="relative">
                    <button
                      data-level-dropdown
                      onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                      className="flex h-12 w-full items-center justify-between gap-x-2 rounded-xl bg-black/5 dark:bg-white/5 px-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-white/30 dark:border-white/10"
                    >
                      <p className="text-black dark:text-white text-base font-medium leading-normal" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {selectedLevel === "all" ? t("Niveau", "Level") : selectedLevel}
                      </p>
                      <ChevronDown className={`w-5 h-5 text-black dark:text-white transition-transform ${showLevelDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Level Dropdown */}
                    {showLevelDropdown && (
                      <div data-level-dropdown-menu className="absolute top-full left-0 mt-2 w-full bg-white/90 dark:bg-background-dark/90 backdrop-blur-xl rounded-xl border border-[#2ECC71]/18 dark:border-[#2ECC71]/12 shadow-xl z-50">
                        <div className="p-2">
                          <button
                            onClick={() => {
                              setSelectedLevel("all")
                              setShowLevelDropdown(false)
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              selectedLevel === "all"
                                ? 'bg-[#2ECC71]/20 text-[#2ECC71] font-medium'
                                : 'text-black dark:text-white hover:bg-[#2ECC71]/10'
                            }`}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {t("Tous", "All")}
                          </button>
                          {levels.map((level) => (
                            <button
                              key={level}
                              onClick={() => {
                                setSelectedLevel(level)
                                setShowLevelDropdown(false)
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                selectedLevel === level
                                  ? 'bg-[#2ECC71]/20 text-[#2ECC71] font-medium'
                                  : 'text-black dark:text-white hover:bg-[#2ECC71]/10'
                              }`}
                              style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href="/avantages-pro">
                    <Button className="bg-[#2ECC71] text-white font-bold hover:bg-[#2ECC71]/90 transition-colors whitespace-nowrap">
                      {t("Avantages PRO", "PRO Benefits")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

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
          {/* Available Live Sessions Section */}
          <h2 className="text-3xl font-bold tracking-tight px-4 pb-3 pt-5 mb-6 text-[#1A1A1A] dark:text-[#E0E0E0]">
            {t("Sessions Live Disponibles", "Available")} <span className="text-[#06f957]">{t("Live", "Live")}</span> {t("Sessions", "Sessions")}
          </h2>

          {/* Session Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {filteredSessions.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Video className="h-12 w-12 text-[#555555] dark:text-[#AAAAAA] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#1A1A1A] dark:text-[#E0E0E0] mb-2">
                  {t("Aucune session trouvée", "No sessions found")}
                </h3>
                <p className="text-[#555555] dark:text-[#AAAAAA]">
                  {t("Essayez de modifier vos filtres ou revenez plus tard", "Try adjusting your filters or check back later")}
                </p>
              </div>
            ) : (
              filteredSessions.slice(0, 6).map((session) => {
                const status = getSessionStatus(session)
                const slotsPercentage = (session.participantCount / session.maxParticipants) * 100
                const slotsLeft = session.maxParticipants - session.participantCount
                const instructorName = session.createdBy ? `${session.createdBy.firstName} ${session.createdBy.lastName}` : t("Instructeur", "Instructor")
                const instructorInitials = session.createdBy ? `${session.createdBy.firstName[0]}${session.createdBy.lastName[0]}` : "IN"
                const tutorProfileImage = getTutorProfileImage(session)
                const StatusIcon = status?.icon || Calendar
                
                return (
                  <div key={session.id} className="glass-card rounded-xl p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                    {/* Instructor & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {tutorProfileImage ? (
                            <Image
                              src={tutorProfileImage}
                              alt={instructorName}
                              width={40}
                              height={40}
                              className="rounded-full border-2 border-[#06f957]/30 object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = `<div class="w-10 h-10 rounded-full border-2 border-[#06f957]/30 bg-[#06f957]/20 flex items-center justify-center text-[#06f957] font-bold text-sm">${instructorInitials}</div>`
                                }
                              }}
                            />
                          ) : (
                            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-[#06f957]/30 bg-[#06f957]/20 flex items-center justify-center">
                              <span className="text-[#06f957] font-bold text-sm">{instructorInitials}</span>
                          </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#1A1A1A] dark:text-[#E0E0E0]">{instructorName}</p>
                          <p className="text-xs text-[#555555] dark:text-[#AAAAAA]">{t("Expert", "Expert")}</p>
                          </div>
                            </div>
                      {status && (
                        <div className={`flex items-center gap-1.5 ${status.type === 'live' ? 'bg-[#06f957] text-black' : status.color} text-black dark:text-white font-bold text-xs py-1 px-3 rounded-full ${status.pulse ? 'pulse-live' : ''}`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{status.text}</span>
                            </div>
                      )}
                            </div>

                    {/* Session Title */}
                    <h3 className="text-xl font-bold text-[#1A1A1A] dark:text-[#E0E0E0]">{session.title}</h3>

                    {/* Date/Time */}
                    <div className="flex items-center gap-2 text-sm text-[#06f957] font-medium">
                      <Calendar className="h-4 w-4" />
                      <p>{formatDisplayDate(session.date)}, {formatDisplayTime(session.date)}</p>
                      </div>
                      
                    {/* Timer Display */}
                    {(() => {
                      const timer = getSessionTimer(session)
                      if (timer) {
                        return (
                          <div className="flex items-center gap-2 text-lg font-bold text-[#06f957]">
                            <Clock className="h-5 w-5" />
                            <span>{timer.type === 'active' ? t("Active depuis", "Active For") : t("Démarre dans", "Starts In")} {timer.formatted || timer.text}</span>
                </div>
              )
                      }
                      return null
            })()}

                    {/* Tags */}
                    <div className="flex items-center gap-2">
                      <span className="glass-chip text-xs font-medium py-1 px-3 rounded-full text-[#1A1A1A] dark:text-[#E0E0E0]">
                        {session.category || t("Général", "General")}
                      </span>
                      <span className="glass-chip text-xs font-medium py-1 px-3 rounded-full text-[#1A1A1A] dark:text-[#E0E0E0]">
                        {session.level || "B1"}
                      </span>
                    </div>

                    {/* Slots Progress */}
                  <div>
                      <div className="flex justify-between text-xs font-medium text-[#555555] dark:text-[#AAAAAA] mb-1">
                        <span>{t("Places remplies", "Slots Filled")}</span>
                        <span className={slotsLeft === 0 ? 'text-red-500 font-bold' : slotsLeft <= 5 ? 'text-yellow-500 font-bold' : ''}>
                          {session.participantCount} / {session.maxParticipants} {slotsLeft > 0 && `(${slotsLeft} ${t("restantes", "left")})`}
                        </span>
                    </div>
                      <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${slotsLeft === 0 ? 'bg-red-500' : slotsLeft <= 5 ? 'bg-yellow-500' : 'bg-[#06f957]'}`} 
                          style={{ width: `${slotsPercentage}%` }}
                        ></div>
                      </div>
                      </div>

                    {/* Action Buttons */}
                    <div className="mt-2 flex items-center gap-3">
                      {status?.type === 'expired' ? (
                      <Button
                          disabled
                          className="flex-1 flex max-w-full cursor-not-allowed items-center justify-center overflow-hidden rounded-lg h-11 bg-gray-400/50 text-gray-600 gap-2 text-sm font-bold tracking-wide"
                      >
                          <XCircle className="h-4 w-4" />
                          {t("Session terminée", "Session Ended")}
                      </Button>
                      ) : status?.type === 'live' ? (
                      <Button
                          onClick={() => handleJoinSession(session)}
                          className="flex-1 flex max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 bg-red-500 hover:bg-red-600 text-white gap-2 text-sm font-bold tracking-wide transition-transform hover:scale-105"
                      >
                          <PlayCircle className="h-4 w-4" />
                          {t("Rejoindre maintenant", "Join Now")}
                      </Button>
                      ) : status?.type === 'full' ? (
                      <Button
                          disabled
                          className="flex-1 flex max-w-full cursor-not-allowed items-center justify-center overflow-hidden rounded-lg h-11 bg-red-400/50 text-red-700 gap-2 text-sm font-bold tracking-wide"
                      >
                          <XCircle className="h-4 w-4" />
                          {t("Complet", "Full")}
                      </Button>
                      ) : canAccess(session.requiredTier) ? (
                      <Button
                          onClick={() => handleJoinSession(session)}
                          className="flex-1 flex max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 bg-[#06f957] text-black gap-2 text-sm font-bold tracking-wide transition-transform hover:scale-105"
                        >
                          {status?.type === 'starting' ? (
                            <>
                            <Clock className="h-4 w-4" />
                              {t("Rejoindre bientôt", "Join Soon")}
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4" />
                                {t("S'inscrire", "Register")}
                              </>
                            )}
                          </Button>
                      ) : (
                                <Button
                          onClick={() => {
                            toast.error(t("Upgradez votre abonnement", "Upgrade your subscription"))
                            window.location.href = "/abonnement"
                          }}
                          className="flex-1 flex max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 bg-[#06f957]/20 text-[#06f957] gap-2 text-sm font-bold tracking-wide transition-colors hover:bg-[#06f957]/30"
                        >
                          <Lock className="h-4 w-4" />
                          {t("Upgrade requis", "Upgrade Required")}
                                </Button>
                      )}
                      {status?.type !== 'expired' && status?.type !== 'live' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg glass-chip hover:bg-white/70 dark:hover:bg-black/50 transition-colors">
                              <MoreVertical className="h-5 w-5 text-[#1A1A1A] dark:text-[#E0E0E0]" />
                            </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSetReminder(session.id, '5min')}>
                                    <Clock className="h-4 w-4 mr-2" />
                                  {t("5 min avant", "5 min before")}
                                </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSetReminder(session.id, '10min')}>
                                    <Clock className="h-4 w-4 mr-2" />
                                  {t("10 min avant", "10 min before")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                )
              })
            )}
          </div>

            {/* Weekly Schedule Section */}
            <div className="mt-24">
            <div className="flex items-center justify-between px-4 pb-3 pt-5 mb-6">
              <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A] dark:text-[#E0E0E0]">
                {t("Programme", "Weekly")} <span className="text-[#06f957]">{t("Hebdomadaire", "Schedule")}</span>
            </h2>
              <div className="flex items-center gap-2">
                <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full glass-chip hover:bg-white/70 dark:hover:bg-black/50 transition-colors">
                  <ChevronDown className="h-5 w-5 text-[#1A1A1A] dark:text-[#E0E0E0] rotate-90" />
                </button>
                <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full glass-chip hover:bg-white/70 dark:hover:bg-black/50 transition-colors">
                  <ChevronDown className="h-5 w-5 text-[#1A1A1A] dark:text-[#E0E0E0] -rotate-90" />
                </button>
          </div>
                      </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {weeklySchedule.map((dayData, index) => {
                const dayName = dayData.day.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { weekday: "long" })
                const dayDate = dayData.day.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { month: "short", day: "numeric" })
                const hasSessions = dayData.sessions.length > 0
                const isToday = dayData.day.toDateString() === new Date().toDateString()

                return (
                  <div key={index} className={`glass-card rounded-xl p-4 flex flex-col gap-4 ${isToday ? 'bg-[#06f957]/20 dark:bg-[#06f957]/20 border-[#06f957]/50' : ''}`}>
                    {/* Day Header */}
                    <div className={`text-center pb-3 border-b ${isToday ? 'border-[#06f957]/40 dark:border-[#06f957]/40' : 'border-white/30 dark:border-white/10'}`}>
                      <p className="font-bold text-lg text-[#1A1A1A] dark:text-[#E0E0E0]">{dayName}</p>
                      <p className="text-sm text-[#555555] dark:text-[#AAAAAA]">{dayDate}</p>
                      </div>

                    {/* Sessions */}
                    <div className="space-y-3 flex-1">
                      {hasSessions ? (
                        dayData.sessions.map((session) => {
                          const sessionStatus = getSessionStatus(session)
                          const isFull = sessionStatus?.text === t("Complet", "Full")
                          const instructorName = session.createdBy ? `${session.createdBy.firstName} ${session.createdBy.lastName}` : t("Instructeur", "Instructor")
                          
                          return (
                            <div key={session.id} className="glass-chip rounded-lg p-3 relative">
                              {isFull && (
                                <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-400/50 dark:bg-zinc-600/50 text-black dark:text-white font-bold text-[10px] py-0.5 px-2 rounded-full">
                                  {t("Complet", "Full")}
                    </div>
                              )}
                              <p className="text-sm font-bold text-[#1A1A1A] dark:text-[#E0E0E0] pr-16">{session.title}</p>
                              <p className="text-xs text-[#555555] dark:text-[#AAAAAA] mt-1">
                                {formatTime(session.date)} - {t("par", "by")} {instructorName}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs font-bold py-1 px-2 rounded-full bg-[#06f957]/20 text-[#06f957]">
                                  {session.category || t("Général", "General")}
                          </span>
                                <button 
                                  className={`flex items-center justify-center size-7 rounded-full ${isFull ? 'bg-zinc-400/50 dark:bg-zinc-700/50 text-[#555555] dark:text-[#AAAAAA] cursor-not-allowed' : 'bg-[#06f957]/20 hover:bg-[#06f957]/30 text-[#06f957] transition-colors'}`}
                                  onClick={() => !isFull && handleSetReminder(session.id, '5min')}
                                  disabled={isFull}
                                >
                                  <Bell className="h-4 w-4" />
                                </button>
                        </div>
                        </div>
                          )
                        })
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-center text-sm text-[#555555] dark:text-[#AAAAAA] font-medium">
                            {t("Aucune session programmée.", "No sessions scheduled.")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
                </div>
              </div>
          </>
        )}
      </main>
        </div>
      </div>
    </PageShell>
  )
}

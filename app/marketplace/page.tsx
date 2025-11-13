"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  MessageCircle,
  Calendar,
  Clock,
  Filter,
  ChevronDown,
  Loader2
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getComprehensiveProfilePictureUrl } from "@/lib/utils/profilePicture"
import SiteHeader from "@/components/site-header"
import Image from "next/image"

// Type definitions
interface TutorProfile {
  id: string
  name: string
  firstName: string
  lastName: string
  specialities: string[]
  subjects?: string[]
  location: string | null
  languages: string[]
  availability: string[]
  workingHours?: string[]
  isAvailable: boolean
  isOnline?: boolean
  availabilityStatus?: string
  profileImage?: string | null
  bio?: string
  title?: string
  phone?: string
  website?: string
  acceptsMessages?: boolean
  status?: 'ONLINE' | 'OFFLINE' | 'ACTIVE'
}

interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: any
}

export default function MarketplacePage() {
  const { lang } = useLang()
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const [instructors, setInstructors] = useState<TutorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpeciality, setSelectedSpeciality] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [availableSpecialities, setAvailableSpecialities] = useState<string[]>(["all"])
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false)
  const [showLevelDropdown, setShowLevelDropdown] = useState(false)
  const specialtyDropdownRef = useRef<HTMLDivElement>(null)
  const levelDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (specialtyDropdownRef.current && !specialtyDropdownRef.current.contains(event.target as Node)) {
        setShowSpecialtyDropdown(false)
      }
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(event.target as Node)) {
        setShowLevelDropdown(false)
      }
    }

    if (showSpecialtyDropdown || showLevelDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSpecialtyDropdown, showLevelDropdown])

  // Get profile picture
  const profileImageUrl = user?.profileImage
    ? (() => {
        const img = user.profileImage || ''
        if (img.startsWith('http')) return img
        return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}${img.startsWith('/') ? '' : '/'}${img}`
      })()
    : user?.email
      ? getComprehensiveProfilePictureUrl(user.email, '')
      : ''

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U'

  // Fetch available specialties from backend
  useEffect(() => {
    const fetchSpecialities = async () => {
      if (!isAuthenticated) return
      
      try {
        const response = await apiClient.get('/marketplace/specialties') as ApiResponse<string[]>
        if (response.success && Array.isArray(response.data)) {
          setAvailableSpecialities(["all", ...response.data])
        } else {
          setAvailableSpecialities(["all", "TCF", "TEF"])
        }
      } catch (err: any) {
        console.error('Error fetching specialties:', err)
        setAvailableSpecialities(["all", "TCF", "TEF"])
      }
    }
    
    fetchSpecialities()
  }, [isAuthenticated])

  // Fetch tutors from backend
  useEffect(() => {
    if (!isAuthenticated) {
      setInstructors([])
      return
    }

    let isMounted = true

    const fetchTutors = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiClient.get('/marketplace/tutors') as ApiResponse<any[]>

        if (!isMounted) return

        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to fetch tutors')
        }

        if (!response.data) {
          setInstructors([])
          return
        }

        const tutorsData = Array.isArray(response.data) ? response.data : []
        
        console.log('📋 Tutors fetched from API:', {
          count: tutorsData.length,
          tutors: tutorsData.map((t: any) => ({
            id: t.id,
            name: t.fullName || `${t.firstName} ${t.lastName}`,
            email: t.email,
            role: t.role,
            isActive: t.isActive,
            status: t.status
          }))
        })
        
        const processedTutors: TutorProfile[] = tutorsData.map((tutor: any) => {
          const fullName = tutor.fullName || `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() || 'Formateur'
          
          const specialties = Array.isArray(tutor.specialties) 
            ? tutor.specialties 
            : tutor.specialties 
            ? [tutor.specialties] 
            : []
          
          const languages = Array.isArray(tutor.languages) 
            ? tutor.languages 
            : tutor.languages 
            ? [tutor.languages] 
            : ['Français']
          
          const availability = Array.isArray(tutor.availability) 
            ? tutor.availability 
            : tutor.availability 
            ? [tutor.availability] 
            : ['Disponible']
          
          // Status logic: ONLY ONLINE means user is currently online
          // ACTIVE = user has account (not necessarily online)
          // ONLINE = user is currently logged in/online on platform
          // OFFLINE = user has account but not online
          const isOnline = tutor.status === 'ONLINE'
          const availabilityStatus = isOnline ? 'Online Now' : (tutor.status === 'ACTIVE' ? 'Active' : 'Offline')
          
          const subjects = Array.isArray(tutor.subjects) 
            ? tutor.subjects 
            : tutor.subjects 
            ? [tutor.subjects] 
            : []

          const workingHours = Array.isArray(tutor.workingHours) 
            ? tutor.workingHours 
            : tutor.workingHours 
            ? [tutor.workingHours] 
            : []

          return {
            id: tutor.id || tutor.userId || '',
            name: fullName,
            firstName: tutor.firstName || '',
            lastName: tutor.lastName || '',
            specialities: specialties,
            subjects: subjects,
            location: tutor.location || null,
            languages,
            availability,
            workingHours: workingHours,
            isAvailable: tutor.isActive === true,
            isOnline,
            availabilityStatus,
            status: tutor.status || 'OFFLINE', // Include status from backend
            profileImage: (tutor.profileImage || tutor.profilePicture)
              ? (() => {
                  const profileImg = tutor.profileImage || tutor.profilePicture || ''
                  if (profileImg.startsWith('http://') || profileImg.startsWith('https://')) {
                    return profileImg // Already absolute URL
                  } else if (profileImg.startsWith('/uploads') || profileImg.startsWith('/')) {
                    // Relative URL - convert to absolute
                    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'
                    return `${backendUrl}${profileImg.startsWith('/') ? '' : '/'}${profileImg}`
                  } else {
                    // No leading slash - assume it's a relative path
                    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'
                    return `${backendUrl}/uploads/${profileImg}`
                  }
                })()
              : null,
            bio: tutor.bio || '',
            title: tutor.title || undefined,
            phone: tutor.phone || undefined,
            website: tutor.website || undefined,
            acceptsMessages: tutor.acceptsMessages !== false
          }
        })

        setInstructors(processedTutors)
      } catch (err: any) {
        if (!isMounted) return
        
        console.error('❌ Error fetching tutors:', err)
        const errorMessage = err.response?.data?.error?.message 
          || err.response?.data?.message 
          || err.message 
          || 'Failed to load tutors'
        
        setError(errorMessage)
        toast.error(errorMessage)
        setInstructors([])
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTutors()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  // Filtering logic
  const filteredInstructors = useMemo(() => {
    if (!instructors.length) return []

    return instructors.filter(instructor => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        instructor.name?.toLowerCase().includes(searchLower) ||
        instructor.specialities?.some((s: string) => s.toLowerCase().includes(searchLower))
      
      const matchesSpeciality = selectedSpeciality === "all" || 
        (instructor.specialities && Array.isArray(instructor.specialities) && 
         instructor.specialities.includes(selectedSpeciality))
      
      const matchesLevel = selectedLevel === "all" || true // Level filtering can be added later if needed
      
      return matchesSearch && matchesSpeciality && matchesLevel
    })
  }, [instructors, searchQuery, selectedSpeciality, selectedLevel])

  // Handle card click - navigate to profile page
  const handleCardClick = (instructorId: string) => {
    router.push(`/marketplace/${instructorId}`)
  }

  // Handle Submit Expertise Request button click (for AI review submission)
  const handleSubmitExpertise = async (e: React.MouseEvent, instructor: TutorProfile) => {
    e.stopPropagation()
    
    try {
      // Try to get the student's latest AI feedback that can be submitted for review
      let feedbackId: string | undefined = undefined
      try {
        const feedbackResponse = await apiClient.get('/ai/feedback')
        if (feedbackResponse.success && feedbackResponse.data) {
          const feedbacks = Array.isArray(feedbackResponse.data) 
            ? feedbackResponse.data 
            : (feedbackResponse.data as any)?.feedbacks || []
          // Get the most recent feedback that can be reviewed
          const latestFeedback = feedbacks.find((f: any) => 
            f.status === 'COMPLETED' || f.status === 'PENDING' || !f.status
          ) || feedbacks[0]
          feedbackId = latestFeedback?.id
        }
      } catch (feedbackError) {
        // If we can't get feedback, continue without it - the request can still be created
        console.log('Could not fetch feedback, creating request without feedbackId')
      }
      
      // Create EXPERTISE request (not SESSION request)
      const response = await apiClient.post('/marketplace/requests', {
        tutorId: instructor.id,
        requestType: 'EXPERTISE',
        subject: t("Demande d'expertise - Révision AI", "Expertise Request - AI Review"),
        description: t("Je souhaite soumettre mon feedback AI pour révision par un expert", "I would like to submit my AI feedback for expert review"),
        urgency: 'MEDIUM',
        feedbackId: feedbackId // Include feedbackId if available
      })
      
      if (response.success) {
        toast.success(t("Demande d'expertise envoyée avec succès", "Expertise request sent successfully"))
      } else {
        toast.error(response.error?.message || t("Erreur lors de l'envoi", "Error sending request"))
      }
    } catch (error: any) {
      console.error('Error submitting expertise request:', error)
      toast.error(t("Erreur lors de l'envoi de la demande d'expertise", "Error sending expertise request"))
    }
  }

  // Handle Message button click
  const handleMessage = async (e: React.MouseEvent, instructor: TutorProfile) => {
    e.stopPropagation()
    
    try {
      const acceptsMessages = instructor.acceptsMessages !== false
      if (!acceptsMessages) {
        toast.error(t("Ce tuteur n'accepte pas les messages", "This tutor does not accept messages"))
        return
      }
      
      const loadingToast = toast.loading(t("Création de la conversation...", "Creating conversation..."))
      
      try {
        const messageResponse = await apiClient.post('/messages', {
          receiverId: instructor.id,
          content: t("Bonjour ! Je souhaite commencer une conversation avec vous.", "Hello! I would like to start a conversation with you."),
          subject: t("Nouvelle conversation", "New conversation")
        })
        
        toast.dismiss(loadingToast)
        if (messageResponse.success) {
          toast.success(t("Conversation créée avec succès", "Conversation created successfully"))
        }
        router.push(`/messages?contact=${instructor.id}`)
      } catch (messageError: any) {
        toast.dismiss(loadingToast)
        router.push(`/messages?contact=${instructor.id}`)
      }
    } catch (error: any) {
      console.error('Error creating conversation:', error)
      toast.error(t("Erreur lors de la création de la conversation", "Error creating conversation"))
    }
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-background-light dark:bg-background-dark">
      {/* Site Header */}
      <SiteHeader />
      

      <div className="relative z-10 layout-container flex h-full grow flex-col">
        <div className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40 flex flex-1 justify-center py-5 pt-24">
          <div className="layout-content-container flex flex-col w-full max-w-[1200px] flex-1">

            {/* Hero Section */}
            <div className="text-center py-16 md:py-24 px-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-text-light dark:text-text-dark text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tighter"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                Marketplace <span className="text-[#2ECC71]">Premium</span> Instructeurs
              </motion.h1>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-4 max-w-2xl mx-auto text-text-muted-light dark:text-text-muted-dark text-base sm:text-lg font-normal leading-normal"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                Accédez à des sessions personnalisées en tête-à-tête avec nos instructeurs certifiés de premier plan. Exclusivement pour les abonnés Pro+.
              </motion.h2>
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
                          placeholder={t("Rechercher par nom d'instructeur...", "Search by instructor name...")}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                      </div>
                    </label>

                    {/* Filter by Specialty */}
                    <div className="relative" ref={specialtyDropdownRef}>
                      <button
                        onClick={() => setShowSpecialtyDropdown(!showSpecialtyDropdown)}
                        className="flex h-12 w-full items-center justify-between gap-x-2 rounded-xl bg-black/5 dark:bg-white/5 px-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-white/30 dark:border-white/10"
                      >
                        <p className="text-black dark:text-white text-base font-medium leading-normal" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {selectedSpeciality === "all" ? t("Spécialité", "Specialty") : selectedSpeciality}
                        </p>
                        <ChevronDown className={`w-5 h-5 text-black dark:text-white transition-transform ${showSpecialtyDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Specialty Dropdown */}
                      {showSpecialtyDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-white/90 dark:bg-background-dark/90 backdrop-blur-xl rounded-xl border border-[#2ECC71]/18 dark:border-[#2ECC71]/12 shadow-xl z-50">
                          <div className="p-2">
                            <button
                              onClick={() => {
                                setSelectedSpeciality("all")
                                setShowSpecialtyDropdown(false)
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                selectedSpeciality === "all"
                                  ? 'bg-[#2ECC71]/20 text-[#2ECC71] font-medium'
                                  : 'text-black dark:text-white hover:bg-[#2ECC71]/10'
                              }`}
                              style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                              {t("Toutes", "All")}
                            </button>
                            {availableSpecialities.slice(1).map((speciality) => (
                              <button
                                key={speciality}
                                onClick={() => {
                                  setSelectedSpeciality(speciality)
                                  setShowSpecialtyDropdown(false)
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                  selectedSpeciality === speciality
                                    ? 'bg-[#2ECC71]/20 text-[#2ECC71] font-medium'
                                    : 'text-black dark:text-white hover:bg-[#2ECC71]/10'
                                }`}
                                style={{ fontFamily: 'Inter, sans-serif' }}
                              >
                                {speciality}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Filter by Level */}
                    <div className="relative" ref={levelDropdownRef}>
                      <button
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
                        <div className="absolute top-full left-0 mt-2 w-full bg-white/90 dark:bg-background-dark/90 backdrop-blur-xl rounded-xl border border-[#2ECC71]/18 dark:border-[#2ECC71]/12 shadow-xl z-50">
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
                </div>
              </div>
            </section>

            {/* Action Panel - Feedback Section */}
            <div className="p-4 mb-8">
              <div className="flex flex-1 flex-col items-start justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center glassmorphism bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-[#2ECC71]/18 dark:border-[#2ECC71]/12 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center justify-center size-10 bg-[#2ECC71]/20 rounded-full text-[#2ECC71] border border-[#2ECC71]/30">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-text-light dark:text-text-dark text-base font-bold leading-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      {t("Vous avez des commentaires sur une évaluation IA ?", "Have feedback on an AI review?")}
                    </p>
                    <p className="text-text-muted-light dark:text-text-muted-dark text-sm sm:text-base font-normal leading-normal" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      {t("Aidez-nous à améliorer en la soumettant pour analyse humaine.", "Help us improve by submitting it for human analysis.")}
                    </p>
                  </div>
                </div>
                <Button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#2ECC71] text-white text-sm font-medium leading-normal hover:opacity-90 transition-opacity border border-[#2ECC71]/60">
                  <span className="truncate">{t("Soumettre un commentaire", "Submit Feedback")}</span>
                </Button>
              </div>
            </div>

            {/* Instructor Grid */}
            <div className="p-4">
              <h3 className="text-2xl font-bold tracking-tight text-text-light dark:text-text-dark mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {t("Instructeurs Disponibles", "Available Instructors")}
              </h3>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-[#2ECC71]" />
                  <span className="ml-3 text-lg text-text-muted-light dark:text-text-muted-dark">
                    {t("Chargement des instructeurs...", "Loading instructors...")}
                  </span>
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : filteredInstructors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredInstructors.map((instructor) => {
                    const instructorInitials = `${instructor.firstName?.[0] || ''}${instructor.lastName?.[0] || ''}`
                    const profileImageUrl = instructor.profileImage || getComprehensiveProfilePictureUrl(instructor.name, '')
                    
                    return (
                      <div
                        key={instructor.id}
                        onClick={() => handleCardClick(instructor.id)}
                        className="glass-card rounded-xl p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                      >
                        {/* Instructor & Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {profileImageUrl ? (
                                <Image
                                  src={profileImageUrl}
                                  alt={instructor.name}
                                  width={40}
                                  height={40}
                                  className="rounded-full border-2 border-[#06f957]/30 object-cover"
                                  onError={(e) => {
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
                              {/* Online indicator - only show for ONLINE status */}
                              {instructor.status === 'ONLINE' && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#06f957] rounded-full border-2 border-white dark:border-gray-900">
                                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#06f957] opacity-75 animate-ping" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#1A1A1A] dark:text-[#E0E0E0]">{instructor.name}</p>
                              {instructor.title && (
                                <p className="text-xs text-[#555555] dark:text-[#AAAAAA]">{instructor.title}</p>
                              )}
                              {!instructor.title && (
                                <p className="text-xs text-[#555555] dark:text-[#AAAAAA]">{t("Expert", "Expert")}</p>
                              )}
                            </div>
                          </div>
                          {/* Status Badge - Show correct status based on user.status */}
                          {instructor.status === 'ONLINE' && (
                            <div className="flex items-center gap-1.5 bg-[#06f957]/20 text-[#06f957] text-black dark:text-white font-bold text-xs py-1 px-3 rounded-full">
                              <span className="w-2 h-2 bg-[#06f957] rounded-full animate-pulse" />
                              <span>{t("En ligne", "Online")}</span>
                            </div>
                          )}
                          {instructor.status === 'ACTIVE' && !instructor.isOnline && (
                            <div className="flex items-center gap-1.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs py-1 px-3 rounded-full">
                              <span className="w-2 h-2 bg-blue-500 rounded-full" />
                              <span>{t("Actif", "Active")}</span>
                            </div>
                          )}
                          {instructor.status === 'OFFLINE' && (
                            <div className="flex items-center gap-1.5 bg-gray-500/20 text-gray-600 dark:text-gray-400 font-bold text-xs py-1 px-3 rounded-full">
                              <span className="w-2 h-2 bg-gray-500 rounded-full" />
                              <span>{t("Hors ligne", "Offline")}</span>
                            </div>
                          )}
                        </div>

                        {/* Bio */}
                        {instructor.bio && (
                          <p className="text-sm text-[#555555] dark:text-[#AAAAAA] line-clamp-2">{instructor.bio}</p>
                        )}

                        {/* Availability */}
                        {instructor.availability && instructor.availability.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-[#06f957] font-medium">
                            <Calendar className="h-4 w-4" />
                            <p>{instructor.availability[0]}</p>
                          </div>
                        )}

                        {/* Working Hours */}
                        {instructor.workingHours && instructor.workingHours.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-[#555555] dark:text-[#AAAAAA]">
                            <Clock className="h-4 w-4" />
                            <p>{instructor.workingHours[0]}</p>
                          </div>
                        )}

                        {/* Location */}
                        {instructor.location && (
                          <p className="text-xs text-[#555555] dark:text-[#AAAAAA]">{instructor.location}</p>
                        )}

                        {/* Tags/Specialties */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {instructor.specialities?.slice(0, 3).map((speciality: string, index: number) => (
                            <span
                              key={index}
                              className="glass-chip text-xs font-medium py-1 px-3 rounded-full text-[#1A1A1A] dark:text-[#E0E0E0]"
                            >
                              {speciality}
                            </span>
                          ))}
                          {instructor.subjects && instructor.subjects.length > 0 && instructor.subjects.slice(0, 2).map((subject: string, index: number) => (
                            <span
                              key={`subject-${index}`}
                              className="glass-chip text-xs font-medium py-1 px-3 rounded-full text-[#1A1A1A] dark:text-[#E0E0E0]"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>

                        {/* Languages */}
                        {instructor.languages && instructor.languages.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-[#555555] dark:text-[#AAAAAA]">{t("Langues", "Languages")}:</span>
                            {instructor.languages.slice(0, 3).map((lang: string, index: number) => (
                              <span key={index} className="text-xs text-[#06f957]">{lang}</span>
                            ))}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-2 flex items-center gap-3">
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMessage(e, instructor)
                            }}
                            disabled={instructor.acceptsMessages === false}
                            className="flex-1 flex max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 bg-white/50 dark:bg-black/30 text-black dark:text-white gap-2 text-sm font-bold tracking-wide hover:bg-white/70 dark:hover:bg-black/50 transition-colors border border-white/30 dark:border-white/10"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {t("Message", "Message")}
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSubmitExpertise(e, instructor)
                            }}
                            className="flex-1 flex max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 bg-[#06f957] text-black gap-2 text-sm font-bold tracking-wide transition-transform hover:scale-105"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {t("Soumettre", "Submit")}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-text-muted-light dark:text-text-muted-dark">
                  {t("Aucun instructeur trouvé", "No instructors found")}
                </p>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .glassmorphism {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(46, 204, 113, 0.18);
        }
        .dark .glassmorphism {
          background: rgba(15, 35, 22, 0.2);
          border: 1px solid rgba(46, 204, 113, 0.12);
        }
        .animate-pulse-green {
          animation: pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-green {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 0 8px rgba(46, 204, 113, 0);
          }
        }
        :root {
          --primary: #2ECC71;
          --background-light: #f5f8f6;
          --background-dark: #0f2316;
          --content-light: #ffffff;
          --content-dark: #1a2b20;
          --text-light: #111813;
          --text-dark: #e1e8e3;
          --text-muted-light: #5f8c6e;
          --text-muted-dark: #9cb4a4;
        }
      `}</style>
    </div>
  )
}

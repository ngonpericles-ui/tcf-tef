"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useAuth } from "@/hooks/useAuth"
import apiClient from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getComprehensiveProfilePictureUrl } from "@/lib/utils/profilePicture"
import SiteHeader from "@/components/site-header"
import Image from "next/image"

interface Manager {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  specialties: string[]
  subjects?: string[]
  rating: number
  totalSessions: number
  languages: string[]
  availability: string[]
  workingHours?: string[]
  bio: string
  title?: string
  phone?: string
  website?: string
  location?: string | null
  profileImage?: string
  isOnline?: boolean
  status?: string
  acceptsMessages?: boolean
}

interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: any
}

export default function AvantagesProPage() {
  const { lang } = useLang()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [selectedAvailability, setSelectedAvailability] = useState("all")
  const [dataLoaded, setDataLoaded] = useState(false)

  // Dynamic filters from backend
  const [subjects, setSubjects] = useState<string[]>([])
  const [availabilityOptions, setAvailabilityOptions] = useState<string[]>([])
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false)
  const subjectDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target as Node)) {
        setShowSubjectDropdown(false)
      }
    }

    if (showSubjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSubjectDropdown])

  // Fetch dynamic filters from backend
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const subjectsResponse = await apiClient.get('/marketplace/subjects') as any
        if (subjectsResponse.success && Array.isArray(subjectsResponse.data)) {
          setSubjects(subjectsResponse.data)
        } else {
          setSubjects(["Grammaire", "Expression Orale", "Méthodologie TCF/TEF", "Vocabulaire", "Phonétique", "Conversation", "Compréhension Orale", "Compréhension Écrite", "Expression Écrite"])
        }

        const availabilityResponse = await apiClient.get('/marketplace/availability-options') as any
        if (availabilityResponse.success && Array.isArray(availabilityResponse.data)) {
          setAvailabilityOptions(availabilityResponse.data)
        } else {
          setAvailabilityOptions(["Lun-Ven", "Mar-Sam", "Lun-Dim", "Mer-Dim", "Lun-Sam", "Lun-Ven 18h-23h"])
        }
      } catch (error) {
        console.error('Error fetching filters:', error)
        setSubjects(["Grammaire", "Expression Orale", "Méthodologie TCF/TEF", "Vocabulaire", "Phonétique", "Conversation", "Compréhension Orale", "Compréhension Écrite", "Expression Écrite"])
        setAvailabilityOptions(["Lun-Ven", "Mar-Sam", "Lun-Dim", "Mer-Dim", "Lun-Sam", "Lun-Ven 18h-23h"])
      }
    }

    fetchFilters()
  }, [])

  // Load managers
  useEffect(() => {
    if (authLoading) return
    if (dataLoaded && user?.email) return

    const loadData = async () => {
      if (!user && !authLoading && !isAuthenticated) {
        const storedUser = localStorage.getItem('user')
        if (!storedUser) {
          setError(t("Vous devez être connecté pour accéder à cette page", "You must be logged in to access this page"))
          setLoading(false)
          return
        }
      }

      if (authLoading) return
      if (!user) {
        console.log('⚠️ No user object but proceeding with subscription check')
      }

      try {
        setLoading(true)
        setError(null)

        let currentUser = user
        if (!currentUser) {
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            try {
              currentUser = JSON.parse(storedUser)
            } catch (error) {
              console.error('Failed to parse stored user:', error)
            }
          }
        }

        // Check if user has Pro+ subscription
        try {
          const subscriptionResponse = await apiClient.get('/subscriptions/active')
          const subscriptionData = subscriptionResponse.data as any
          
          if (!subscriptionResponse.success || !subscriptionData?.subscription?.tier) {
            setError(t("Erreur lors de la vérification de l'abonnement", "Error checking subscription"))
            return
          }
          
          const userTier = subscriptionData.subscription.tier
          const isProUser = userTier && (
            userTier.toUpperCase() === 'PRO' ||
            userTier.toUpperCase() === 'PRO+'
          )
          
          if (!isProUser) {
            const currentTier = userTier || 'Free'
            setError(t(
              `Vous avez un abonnement ${currentTier}. Vous devez avoir un abonnement Pro pour accéder aux sessions individuelles. Upgradez vers Pro pour débloquer cette fonctionnalité.`,
              `You have a ${currentTier} subscription. You need a Pro subscription to access one-on-one sessions. Upgrade to Pro to unlock this feature.`
            ))
            return
          }
        } catch (error: any) {
          if (error.response?.status === 401) {
            if (!isAuthenticated) {
              setError(t("Vous devez être connecté pour accéder à cette page", "You must be logged in to access this page"))
            } else {
              setError(t("Erreur lors de la vérification de l'abonnement", "Error checking subscription"))
            }
          } else {
                    if (currentUser?.subscriptionTier) {
                      const userTier = currentUser.subscriptionTier
              const isProUser = userTier && (
                userTier.toUpperCase() === 'PRO' ||
                userTier.toUpperCase() === 'PRO+'
              )
              
              if (!isProUser) {
                const currentTier = userTier || 'Free'
                setError(t(
                  `Vous avez un abonnement ${currentTier}. Vous devez avoir un abonnement Pro pour accéder aux sessions individuelles. Upgradez vers Pro pour débloquer cette fonctionnalité.`,
                  `You have a ${currentTier} subscription. You need a Pro subscription to access one-on-one sessions. Upgrade to Pro to unlock this feature.`
                ))
                return
              }
            } else {
              setError(t("Erreur lors de la vérification de l'abonnement", "Error checking subscription"))
              return
            }
          }
        }

        // Fetch available tutors from marketplace
        const tutorsResponse = await apiClient.get('/marketplace/tutors')

        if (tutorsResponse.success && tutorsResponse.data) {
          const tutorsData = Array.isArray(tutorsResponse.data) ? tutorsResponse.data : []
          
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

            // Backend already filters by isActive, but keep this as safety check
            const transformedManagers: Manager[] = tutorsData
            .filter((tutor: any) => {
              // Backend should already filter, but double-check
              const isActive = tutor.isActive === true
              if (!isActive) {
                console.log(`⚠️ Filtering out ${tutor.email || tutor.id}: isActive=${tutor.isActive}`)
              }
              return isActive
            })
              .map((tutor: any) => {
                const fullName = tutor.fullName || `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() || 'Formateur'
                
                const specialties = Array.isArray(tutor.specialties) 
                  ? tutor.specialties 
                  : tutor.specialties 
                  ? [tutor.specialties] 
                  : []
                
                const subjects = Array.isArray(tutor.subjects) 
                  ? tutor.subjects 
                  : tutor.subjects 
                  ? [tutor.subjects] 
                  : []
                
                const languages = Array.isArray(tutor.languages) 
                  ? tutor.languages 
                  : tutor.languages 
                  ? [tutor.languages] 
                  : ['Français', 'Anglais']
                
                const availability = Array.isArray(tutor.availability) 
                  ? tutor.availability 
                  : tutor.availability 
                  ? [tutor.availability] 
                  : ['Disponible']
                
                const workingHours = Array.isArray(tutor.workingHours) 
                  ? tutor.workingHours 
                  : tutor.workingHours 
                  ? [tutor.workingHours] 
                  : []
                
                // Status logic: ONLY ONLINE means user is currently online
                // ACTIVE = user has account (not necessarily online)
                // ONLINE = user is currently logged in/online on platform
                // OFFLINE = user has account but not online
                const isOnline = tutor.status === 'ONLINE'
                
                const profileImage = (tutor.profileImage || tutor.profilePicture)
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
                  : null
            
            return {
                  id: tutor.id || tutor.userId || '',
                  firstName: tutor.firstName || '',
                  lastName: tutor.lastName || '',
              email: tutor.email || tutor.userId || `tutor${tutor.id}@aura.ca`,
              role: tutor.role || 'TEACHER',
                specialties: specialties,
                subjects: subjects,
                rating: 4.8,
                totalSessions: 0,
                  languages: languages,
                availability: availability,
                workingHours: workingHours,
              bio: tutor.bio || t("Expert certifié en français", "Certified French expert"),
                  title: tutor.title || undefined,
                  phone: tutor.phone || undefined,
                  website: tutor.website || undefined,
                  location: tutor.location || null,
                  profileImage: profileImage,
                  isOnline: isOnline,
                  status: tutor.status || 'OFFLINE', // Include status from backend
                acceptsMessages: tutor.acceptsMessages !== false
            };
          })

          setManagers(transformedManagers)
        }
        
        setDataLoaded(true)
      } catch (error) {
        console.error('Error loading data:', error)
        setError(t("Erreur lors du chargement des données", "Error loading data"))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated, authLoading])

  // Filter trainers
  const filteredTrainers = useMemo(() => {
    return managers.filter(manager => {
    const fullName = `${manager.firstName} ${manager.lastName}`
    
    const matchesSearch = !searchTerm || searchTerm.trim() === "" ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (manager.specialties && Array.isArray(manager.specialties) && manager.specialties.some((specialty: string) => specialty.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (manager.subjects && Array.isArray(manager.subjects) && manager.subjects.some((subject: string) => subject.toLowerCase().includes(searchTerm.toLowerCase())))
    
    const matchesSubject = selectedSubject === "all" || 
      !selectedSubject ||
      (manager.specialties && Array.isArray(manager.specialties) && manager.specialties.includes(selectedSubject)) ||
      (manager.subjects && Array.isArray(manager.subjects) && manager.subjects.includes(selectedSubject))
    
    const matchesAvailability = selectedAvailability === "all" || 
      !selectedAvailability ||
      (manager.availability && Array.isArray(manager.availability) && manager.availability.includes(selectedAvailability))

    return matchesSearch && matchesSubject && matchesAvailability
  })
  }, [managers, searchTerm, selectedSubject, selectedAvailability])

  const handleBooking = async (trainer: Manager) => {
    try {
      const response = await apiClient.post('/marketplace/requests', {
        tutorId: trainer.id,
        requestType: 'SESSION',
        subject: t("Demande de session 1-on-1", "One-on-one session request"),
        description: t("Demande de session individuelle avec {name}", `Individual session request with ${trainer.firstName} ${trainer.lastName}`),
        urgency: 'MEDIUM',
        requestedDate: new Date().toISOString()
      })
      
      if (response.success) {
        toast.success(t("Demande de session envoyée avec succès", "Session request sent successfully"))
      } else {
        toast.error(response.error?.message || t("Erreur lors de l'envoi de la demande", "Error sending request"))
      }
    } catch (error: any) {
      console.error('Error creating session request:', error)
      toast.error(t("Erreur lors de l'envoi de la demande", "Error sending request"))
    }
  }

  const handleMessage = async (trainer: Manager) => {
      try {
      const acceptsMessages = trainer.acceptsMessages !== false
      if (!acceptsMessages) {
        toast.error(t("Ce tuteur n'accepte pas les messages", "This tutor does not accept messages"))
        return
      }
      
      const loadingToast = toast.loading(t("Création de la conversation...", "Creating conversation..."))
      
      try {
        const messageResponse = await apiClient.post('/messages', {
          receiverId: trainer.id,
          content: t("Bonjour ! Je souhaite commencer une conversation avec vous.", "Hello! I would like to start a conversation with you."),
          subject: t("Nouvelle conversation", "New conversation")
        })
        
        toast.dismiss(loadingToast)
        if (messageResponse.success) {
          toast.success(t("Conversation créée avec succès", "Conversation created successfully"))
        }
        router.push(`/messages?contact=${trainer.id}`)
      } catch (messageError: any) {
        toast.dismiss(loadingToast)
        router.push(`/messages?contact=${trainer.id}`)
          }
    } catch (error: any) {
      console.error('Error creating conversation:', error)
      toast.error(t("Erreur lors de la création de la conversation", "Error creating conversation"))
    }
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2ECC71]" />
            </div>
    )
  }

  // Authentication error
  if (error && error.includes('connecté')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("Connexion Requise", "Login Required")}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/connexion')}>
                {t("Se connecter", "Login")}
              </Button>
            </div>
          </div>
    )
  }

  // Subscription error
  if (error && error.includes('abonnement')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-2xl px-6">
          <h1 className="text-3xl font-bold mb-4">{t("Upgradez vers Pro", "Upgrade to Pro")}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
              <Button 
            onClick={() => router.push('/abonnement')}
            className="bg-[#2ECC71] hover:bg-[#27c066] text-white"
              >
                {t("Upgrader vers Pro", "Upgrade to Pro")}
              </Button>
            </div>
          </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-background-light dark:bg-background-dark">
      {/* Site Header */}
      <SiteHeader />
      
      {/* Background - Same as marketplace page (no blur) */}
            
      <main className="relative z-10 flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
          <div className="relative z-10 mx-auto max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl font-black leading-tight tracking-tighter"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span className="text-black dark:text-white">Pro+ Certifiés </span>
              <span className="text-[#2ECC71]">Formateurs</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-[#5f8c6e] dark:text-gray-300 text-lg md:text-xl max-w-2xl mx-auto"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {t(
                "Accès exclusif pour les membres Pro+ pour réserver des sessions personnalisées en tête-à-tête avec des formateurs experts et certifiés.",
                "Exclusive access for Pro+ members to book personalized 1-on-1 sessions with expert, certified trainers."
              )}
            </motion.p>
          </div>
        </section>

        {/* Search & Filter Bar */}
        <section className="px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
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
                      placeholder={t("Rechercher par nom...", "Search by name...")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  </div>
                </label>
                
                {/* Filter by Subject */}
                <div className="relative" ref={subjectDropdownRef}>
                  <button
                    onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                    className="flex h-12 w-full items-center justify-between gap-x-2 rounded-xl bg-black/5 dark:bg-white/5 px-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-white/30 dark:border-white/10"
                >
                    <p className="text-black dark:text-white text-base font-medium leading-normal" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {t("Filtrer par Sujet", "Filter by Subject")}
                    </p>
                    <ChevronDown className={`w-5 h-5 text-black dark:text-white transition-transform ${showSubjectDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Subject Dropdown */}
                  {showSubjectDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white/90 dark:bg-background-dark/90 backdrop-blur-xl rounded-xl border border-[#2ECC71]/18 dark:border-[#2ECC71]/12 shadow-xl z-50">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setSelectedSubject("all")
                            setShowSubjectDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedSubject === "all"
                              ? 'bg-[#2ECC71]/20 text-[#2ECC71] font-medium'
                              : 'text-black dark:text-white hover:bg-[#2ECC71]/10'
                          }`}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {t("Tous", "All")}
                        </button>
                        {subjects.map(subject => (
                          <button
                            key={subject}
                            onClick={() => {
                              setSelectedSubject(subject)
                              setShowSubjectDropdown(false)
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              selectedSubject === subject
                                ? 'bg-[#2ECC71]/20 text-[#2ECC71] font-medium'
                                : 'text-black dark:text-white hover:bg-[#2ECC71]/10'
                            }`}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {subject}
                          </button>
                  ))}
                      </div>
                    </div>
                  )}
              </div>
              
                {/* Filter by Availability */}
                <button
                  onClick={() => setSelectedAvailability(selectedAvailability === "available" ? "all" : "available")}
                  className={`flex h-12 w-full items-center justify-between gap-x-2 rounded-xl px-4 transition-colors border border-white/30 dark:border-white/10 ${
                    selectedAvailability === "available"
                      ? "bg-[#2ECC71]/20 text-[#2ECC71] border-[#2ECC71]/30"
                      : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  <p className="text-black dark:text-white text-base font-medium leading-normal" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {t("Filtrer par Disponibilité", "Filter by Availability")}
                  </p>
                  <ChevronDown className="w-5 h-5 text-black dark:text-white" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Trainers Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-black dark:text-white text-3xl font-bold leading-tight tracking-tight px-4 pb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                {t("Formateurs Disponibles", "Available Trainers")}
              </h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#2ECC71]" />
                <span className="ml-3 text-lg text-[#5f8c6e] dark:text-gray-300">
                  {t("Chargement des formateurs...", "Loading trainers...")}
                </span>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500">{error}</p>
                  </div>
            ) : filteredTrainers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredTrainers.map((trainer) => {
                  const trainerName = `${trainer.firstName} ${trainer.lastName}`
                  const trainerInitials = `${trainer.firstName?.[0] || ''}${trainer.lastName?.[0] || ''}`
                  const profileImageUrl = trainer.profileImage || getComprehensiveProfilePictureUrl(trainer.email, '')
                  
                  return (
                    <div
                      key={trainer.id}
                      className="glass-card rounded-xl p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
                    >
                      {/* Trainer & Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {profileImageUrl ? (
                              <Image
                                src={profileImageUrl}
                                alt={trainerName}
                                width={40}
                                height={40}
                                className="rounded-full border-2 border-[#06f957]/30 object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent) {
                                    parent.innerHTML = `<div class="w-10 h-10 rounded-full border-2 border-[#06f957]/30 bg-[#06f957]/20 flex items-center justify-center text-[#06f957] font-bold text-sm">${trainerInitials}</div>`
                                  }
                                }}
                              />
                            ) : (
                              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-[#06f957]/30 bg-[#06f957]/20 flex items-center justify-center">
                                <span className="text-[#06f957] font-bold text-sm">{trainerInitials}</span>
                              </div>
                            )}
                            {/* Online indicator - only show for ONLINE status */}
                            {trainer.status === 'ONLINE' && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#06f957] rounded-full border-2 border-white dark:border-gray-900">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-[#06f957] opacity-75 animate-ping" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#1A1A1A] dark:text-[#E0E0E0]">{trainerName}</p>
                            {trainer.title && (
                              <p className="text-xs text-[#555555] dark:text-[#AAAAAA]">{trainer.title}</p>
                            )}
                            {!trainer.title && (
                              <p className="text-xs text-[#555555] dark:text-[#AAAAAA]">{t("Expert", "Expert")}</p>
                            )}
                          </div>
                        </div>
                        {/* Status Badge - Show correct status based on user.status */}
                        {trainer.status === 'ONLINE' && (
                          <div className="flex items-center gap-1.5 bg-[#06f957]/20 text-[#06f957] text-black dark:text-white font-bold text-xs py-1 px-3 rounded-full">
                            <span className="w-2 h-2 bg-[#06f957] rounded-full animate-pulse" />
                            <span>{t("En ligne", "Online")}</span>
                          </div>
                        )}
                        {trainer.status === 'ACTIVE' && !trainer.isOnline && (
                          <div className="flex items-center gap-1.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs py-1 px-3 rounded-full">
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span>{t("Actif", "Active")}</span>
                          </div>
                        )}
                        {trainer.status === 'OFFLINE' && (
                          <div className="flex items-center gap-1.5 bg-gray-500/20 text-gray-600 dark:text-gray-400 font-bold text-xs py-1 px-3 rounded-full">
                            <span className="w-2 h-2 bg-gray-500 rounded-full" />
                            <span>{t("Hors ligne", "Offline")}</span>
                          </div>
                        )}
                      </div>

                      {/* Bio */}
                      {trainer.bio && (
                        <p className="text-sm text-[#555555] dark:text-[#AAAAAA] line-clamp-2">{trainer.bio}</p>
                      )}

                      {/* Availability */}
                      {trainer.availability && trainer.availability.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-[#06f957] font-medium">
                          <Calendar className="h-4 w-4" />
                          <p>{trainer.availability[0]}</p>
                        </div>
                      )}

                      {/* Working Hours */}
                      {trainer.workingHours && trainer.workingHours.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-[#555555] dark:text-[#AAAAAA]">
                          <Clock className="h-4 w-4" />
                          <p>{trainer.workingHours[0]}</p>
                        </div>
                      )}

                      {/* Location */}
                      {trainer.location && (
                        <p className="text-xs text-[#555555] dark:text-[#AAAAAA]">{trainer.location}</p>
                      )}

                      {/* Tags/Specialties */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {trainer.specialties?.slice(0, 3).map((specialty: string, index: number) => (
                          <span
                            key={index}
                            className="glass-chip text-xs font-medium py-1 px-3 rounded-full text-[#1A1A1A] dark:text-[#E0E0E0]"
                          >
                            {specialty}
                          </span>
                        ))}
                        {trainer.subjects && trainer.subjects.length > 0 && trainer.subjects.slice(0, 2).map((subject: string, index: number) => (
                          <span
                            key={`subject-${index}`}
                            className="glass-chip text-xs font-medium py-1 px-3 rounded-full text-[#1A1A1A] dark:text-[#E0E0E0]"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>

                      {/* Languages */}
                      {trainer.languages && trainer.languages.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-[#555555] dark:text-[#AAAAAA]">{t("Langues", "Languages")}:</span>
                          {trainer.languages.slice(0, 3).map((lang: string, index: number) => (
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
                            handleMessage(trainer)
                          }}
                          disabled={trainer.acceptsMessages === false}
                          className="flex-1 flex max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 bg-white/50 dark:bg-black/30 text-black dark:text-white gap-2 text-sm font-bold tracking-wide hover:bg-white/70 dark:hover:bg-black/50 transition-colors border border-white/30 dark:border-white/10"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {t("Message", "Message")}
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBooking(trainer)
                          }}
                          className="flex-1 flex max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 bg-[#06f957] text-black gap-2 text-sm font-bold tracking-wide transition-transform hover:scale-105"
                        >
                          <Calendar className="h-4 w-4" />
                          {t("Réserver Session", "Book Session")}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#5f8c6e] dark:text-gray-300">
                        {t("Aucun formateur trouvé", "No trainers found")}
                </p>
              </div>
            )}

            {/* Load More Button */}
            {filteredTrainers.length > 0 && filteredTrainers.length >= 9 && (
              <div className="flex justify-center mt-16">
                <Button className="flex min-w-[120px] max-w-sm cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-black/5 dark:bg-white/5 text-black dark:text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-black/10 dark:hover:bg-white/10 transition-colors border-none">
                  <span className="truncate">{t("Charger plus", "Load More")}</span>
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Global Styles */}
      <style jsx global>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .dark .glass-card {
          background: rgba(15, 35, 22, 0.6);
          border: 1px solid rgba(245, 248, 246, 0.1);
        }
        :root {
          --primary: #2ECC71;
          --background-light: #f5f8f6;
          --background-dark: #0f2316;
        }
      `}</style>
      
      {/* Font Import */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet" />
                </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Star,
  MessageCircle,
  Calendar as CalendarIcon,
  Clock,
  Users,
  BookOpen,
  Award,
  CheckCircle,
  Target,
  Zap,
  Crown,
  Shield,
  UserCheck,
  Brain,
  Clock3,
  TrendingUp,
  Heart,
  Filter,
  SortAsc,
  X,
  Check,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"
import apiClient from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Manager {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  specialties: string[]
  subjects?: string[] // Sujets (Grammaire, Expression Orale, etc.)
  rating: number
  totalSessions: number
  languages: string[]
  availability: string[] // Working time periods (disponibilité) - e.g., ["Lun-Ven"]
  workingHours?: string[] // Specific time slots - e.g., ["Lundi: 09:00-12:00", "Mardi: 14:00-17:00"]
  bio: string
  profileImage?: string
  isOnline?: boolean // Online status
  status?: string // 'ONLINE' | 'OFFLINE'
  acceptsMessages?: boolean // Whether tutor accepts messages from students
}

// Horaires disponibles
const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
]

export default function AvantagesProPage() {
  const { lang } = useLang()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // State for managers and sessions
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userSessions, setUserSessions] = useState<any[]>([])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [selectedAvailability, setSelectedAvailability] = useState("all")
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("")
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  // Dynamic filters from backend
  const [subjects, setSubjects] = useState<string[]>([])
  const [availabilityOptions, setAvailabilityOptions] = useState<string[]>([])
  const [loadingFilters, setLoadingFilters] = useState(false)

  // Track if data has been loaded to prevent multiple loads
  const [dataLoaded, setDataLoaded] = useState(false)

  // Fetch dynamic filters from backend
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoadingFilters(true)
        
        // Fetch subjects
        const subjectsResponse = await apiClient.get('/marketplace/subjects') as any
        if (subjectsResponse.success && Array.isArray(subjectsResponse.data)) {
          setSubjects(subjectsResponse.data)
        } else {
          // Fallback to default subjects
          setSubjects(["Grammaire", "Expression Orale", "Méthodologie TCF/TEF", "Vocabulaire", "Phonétique", "Conversation", "Compréhension Orale", "Compréhension Écrite", "Expression Écrite"])
        }

        // Fetch availability options
        const availabilityResponse = await apiClient.get('/marketplace/availability-options') as any
        if (availabilityResponse.success && Array.isArray(availabilityResponse.data)) {
          setAvailabilityOptions(availabilityResponse.data)
        } else {
          // Fallback to default availability
          setAvailabilityOptions(["Lun-Ven", "Mar-Sam", "Lun-Dim", "Mer-Dim", "Lun-Sam", "Lun-Ven 18h-23h"])
        }
      } catch (error) {
        console.error('Error fetching filters:', error)
        // Use fallback values
        setSubjects(["Grammaire", "Expression Orale", "Méthodologie TCF/TEF", "Vocabulaire", "Phonétique", "Conversation", "Compréhension Orale", "Compréhension Écrite", "Expression Écrite"])
        setAvailabilityOptions(["Lun-Ven", "Mar-Sam", "Lun-Dim", "Mer-Dim", "Lun-Sam", "Lun-Ven 18h-23h"])
      } finally {
        setLoadingFilters(false)
      }
    }

    fetchFilters()
  }, [])

  // Load managers and user sessions
  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) {
      console.log('⏳ Auth still loading, skipping data load...')
      return
    }

    // Skip if already loaded and user hasn't changed
    if (dataLoaded && user?.email) {
      console.log('✅ Data already loaded, skipping...')
      return
    }

    const loadData = async () => {
      console.log('🔍 Avantages Pro - Auth State:', {
        user: !!user,
        isAuthenticated,
        authLoading,
        userEmail: user?.email,
        userRole: user?.role
      })

      // CRITICAL FIX: Preserve existing user state during navigation
      // Only show auth error if we're absolutely certain the user is not authenticated
      if (!user && !authLoading && !isAuthenticated) {
        // Double-check localStorage before showing error
        const storedUser = localStorage.getItem('user')
        if (!storedUser) {
          console.log('🚫 No user found anywhere, setting authentication error')
          setError(t("Vous devez être connecté pour accéder à cette page", "You must be logged in to access this page"))
          setLoading(false)
          return
        } else {
          console.log('🔄 Found stored user, preserving session during navigation')
          // Don't set error, let the component continue with stored user
        }
      }

      // If still loading auth, wait but don't clear existing state
      if (authLoading) {
        console.log('⏳ Still loading authentication, preserving existing state...')
        return
      }

      // If no user but we're not loading, try to proceed anyway (might be a timing issue)
      if (!user) {
        console.log('⚠️ No user object but proceeding with subscription check')
      }

      try {
        setLoading(true)
        setError(null)

        // CRITICAL FIX: Use stored user data if user object is not available
        let currentUser = user
        if (!currentUser) {
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            try {
              currentUser = JSON.parse(storedUser)
              console.log('🔄 Using stored user data for subscription check:', currentUser?.email)
            } catch (error) {
              console.error('Failed to parse stored user:', error)
            }
          }
        }

        // Check if user has Pro+ subscription
        try {
          console.log('🔍 Making subscription API call...')
          const subscriptionResponse = await apiClient.get('/subscriptions/active')
          const subscriptionData = subscriptionResponse.data as any
          
          console.log('🔍 Subscription Check Response:', {
            success: subscriptionResponse.success,
            data: subscriptionData,
            subscription: subscriptionData?.subscription,
            tier: subscriptionData?.subscription?.tier
          })
          
          if (!subscriptionResponse.success || !subscriptionData?.subscription?.tier) {
            setError(t("Erreur lors de la vérification de l'abonnement", "Error checking subscription"))
            return
          }
          
          // Check for Pro subscription (case insensitive)
          // Pro is the highest tier that grants access to /avantages-pro
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
          console.error('Subscription check error:', error)
          // Check if it's an authentication error (401) vs other errors
          if (error.response?.status === 401) {
            // Only show auth error if we're sure user is not authenticated
            if (!isAuthenticated) {
              setError(t("Vous devez être connecté pour accéder à cette page", "You must be logged in to access this page"))
            } else {
              // User is authenticated but API call failed - show subscription error
              setError(t("Erreur lors de la vérification de l'abonnement", "Error checking subscription"))
            }
          } else {
                    // If API fails but user is authenticated, try to get subscription from user object
                    if (currentUser?.subscriptionTier) {
                      console.log('🔄 API failed, using user object subscription tier:', currentUser.subscriptionTier)
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
              // If user has PRO subscription, continue with the flow
            } else {
              setError(t("Erreur lors de la vérification de l'abonnement", "Error checking subscription"))
              return
            }
          }
        }

        // Fetch available tutors from marketplace (same source as marketplace page)
        // Don't pass search/filter params on initial load - filtering is done client-side
        console.log('🔍 Fetching tutors from /marketplace/tutors...')
        try {
        const tutorsResponse = await apiClient.get('/marketplace/tutors')

          console.log('📋 Tutors response:', {
            success: tutorsResponse.success,
            dataLength: tutorsResponse.data ? (Array.isArray(tutorsResponse.data) ? tutorsResponse.data.length : 1) : 0,
            error: (tutorsResponse as any).error
          })

        if (tutorsResponse.success && tutorsResponse.data) {
          const tutorsData = Array.isArray(tutorsResponse.data) ? tutorsResponse.data : []
            console.log(`✅ Received ${tutorsData.length} tutors from API (same endpoint as student marketplace)`)

            // Process tutors EXACTLY like student marketplace page
            // Backend already filters for active profiles, so we just process the data
            const transformedManagers: Manager[] = tutorsData
              .filter((tutor: any) => tutor.isActive === true) // Only active profiles
              .map((tutor: any) => {
                // Use EXACT same processing logic as student marketplace
                const fullName = tutor.fullName || `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() || 'Formateur'
                
                // Backend sends 'specialties' (not 'specialities') - match exactly
                const specialties = Array.isArray(tutor.specialties) 
                  ? tutor.specialties 
                  : tutor.specialties 
                  ? [tutor.specialties] 
                  : []
                
                // Backend sends subjects (sujets)
                const subjects = Array.isArray(tutor.subjects) 
                  ? tutor.subjects 
                  : tutor.subjects 
                  ? [tutor.subjects] 
                  : []
                
                // Backend sends languages as array
                const languages = Array.isArray(tutor.languages) 
                  ? tutor.languages 
                  : tutor.languages 
                  ? [tutor.languages] 
                  : ['Français', 'Anglais']
                
                // Backend sends availability as array
                const availability = Array.isArray(tutor.availability) 
                  ? tutor.availability 
                  : tutor.availability 
                  ? [tutor.availability] 
                  : ['Disponible']
                
                // Backend sends working hours (specific time slots)
                const workingHours = Array.isArray(tutor.workingHours) 
                  ? tutor.workingHours 
                  : tutor.workingHours 
                  ? [tutor.workingHours] 
                  : []
                
                // Status from backend - backend sends 'ONLINE' or 'OFFLINE'
                const isOnline = tutor.status === 'ONLINE'
                
                // Profile image URL handling (same as student marketplace)
                const profileImage = tutor.profilePicture 
                  ? (() => {
                      if (tutor.profilePicture.startsWith('http')) return tutor.profilePicture
                      let cleanPath = tutor.profilePicture.replace(/^\/+/, '')
                      if (cleanPath.startsWith('uploads/')) {
                        return `http://localhost:3001/${cleanPath}`
                      } else {
                        return `http://localhost:3001/uploads/${cleanPath}`
                      }
                    })()
                  : null
            
            return {
                  id: tutor.id || tutor.userId || '',
                  firstName: tutor.firstName || '',
                  lastName: tutor.lastName || '',
              email: tutor.email || tutor.userId || `tutor${tutor.id}@aura.ca`,
              role: tutor.role || 'TEACHER',
                  specialties: specialties, // Same field name as backend
                  subjects: subjects, // Sujets
                  rating: 4.8, // Default rating - can be enhanced later
                  totalSessions: 0, // Default - can be enhanced later
                  languages: languages,
                  availability: availability, // Working time periods (disponibilité)
                  workingHours: workingHours, // Specific time slots
              bio: tutor.bio || t("Expert certifié en français", "Certified French expert"),
                  profileImage: profileImage,
                  isOnline: isOnline,
                  status: tutor.status || 'OFFLINE',
                  acceptsMessages: tutor.acceptsMessages !== false // Default to true if not set
            };
          })

            console.log(`✅ Processed ${transformedManagers.length} managers (same processing as student marketplace)`)
          setManagers(transformedManagers)
          } else {
            console.error('❌ Failed to fetch tutors:', {
              success: tutorsResponse.success,
              error: (tutorsResponse as any).error,
              data: tutorsResponse.data
            })
            // Don't set error here - let the component show empty state
          }
        } catch (tutorsError: any) {
          console.error('❌ Error fetching tutors:', tutorsError)
          // Only set error if it's not an auth error (which is handled above)
          if (tutorsError.response?.status !== 401 && tutorsError.response?.status !== 403) {
            setError(t("Erreur lors du chargement des formateurs", "Error loading trainers"))
          }
        }

        // Fetch user's one-on-one sessions
        const sessionsResponse = await apiClient.get('/live-sessions/registered', {
          params: { type: 'one-on-one' }
        })

        if (sessionsResponse.success && sessionsResponse.data) {
          setUserSessions(Array.isArray(sessionsResponse.data) ? sessionsResponse.data : [])
        }

        // Mark data as loaded
        setDataLoaded(true)

      } catch (error) {
        console.error('Error loading data:', error)
        setError(t("Erreur lors du chargement des données", "Error loading data"))
      } finally {
        setLoading(false)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]) // Only depend on auth state, not user object which changes frequently
  
  // Options pour la réservation
  const categoryOptions = ["Méthodologie TCF/TEF", "Vocabulaire", "Grammaire"]
  const levelOptions = ["B1", "B2", "C1", "C2"]

  const filteredTrainers = managers.filter(manager => {
    const fullName = `${manager.firstName} ${manager.lastName}`
    
    // Search term filter - if empty, match all
    const matchesSearch = !searchTerm || searchTerm.trim() === "" ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (manager.specialties && Array.isArray(manager.specialties) && manager.specialties.some((specialty: string) => specialty.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (manager.subjects && Array.isArray(manager.subjects) && manager.subjects.some((subject: string) => subject.toLowerCase().includes(searchTerm.toLowerCase())))
    
    // Match subject - check both specialties and subjects
    const matchesSubject = selectedSubject === "all" || 
      !selectedSubject ||
      (manager.specialties && Array.isArray(manager.specialties) && manager.specialties.includes(selectedSubject)) ||
      (manager.subjects && Array.isArray(manager.subjects) && manager.subjects.includes(selectedSubject))
    
    // Match availability - check working time
    const matchesAvailability = selectedAvailability === "all" || 
      !selectedAvailability ||
      (manager.availability && Array.isArray(manager.availability) && manager.availability.includes(selectedAvailability))

    return matchesSearch && matchesSubject && matchesAvailability
  })

  console.log('🔍 Filtering trainers:', {
    totalManagers: managers.length,
    filteredCount: filteredTrainers.length,
    searchTerm,
    selectedSubject,
    selectedAvailability
  })

  // Use filtered trainers directly without sorting
  const sortedTrainers = filteredTrainers



  const handleBooking = async (trainer: Manager) => {
    // Create one-on-one session request directly
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
        // Refresh trainers list to update request count if needed
      } else {
        toast.error(response.error?.message || t("Erreur lors de l'envoi de la demande", "Error sending request"))
      }
    } catch (error: any) {
      console.error('Error creating session request:', error)
      toast.error(t("Erreur lors de l'envoi de la demande", "Error sending request"))
    }
  }

  const confirmBooking = async () => {
    if (selectedDate && selectedTime && selectedCategory && selectedLevel && selectedTrainer) {
      try {
        setLoading(true)

        // Create one-on-one session booking
        const sessionData = {
          title: `Session individuelle - ${selectedCategory}`,
          description: `Session privée avec ${selectedTrainer.firstName} ${selectedTrainer.lastName}`,
          date: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(),
                        parseInt(selectedTime.split(':')[0]), parseInt(selectedTime.split(':')[1])).toISOString(),
          duration: 60, // 1 hour
          maxParticipants: 1,
          requiredTier: 'PRO',
          level: selectedLevel as any,
          category: 'CONVERSATION',
          tags: [selectedCategory, 'one-on-one'],
                  managerId: selectedTrainer.id,
                  studentId: user?.id
        }

        const response = await apiClient.post(`/teachers/${selectedTrainer.id}/book`, {
          date: selectedDate.toISOString(),
          time: selectedTime,
          duration: 60,
          subject: selectedCategory,
          level: selectedLevel,
          notes: `Session avec ${selectedTrainer.firstName} ${selectedTrainer.lastName}`
        })

        if (response.success) {
          console.log(`Réservation confirmée avec ${selectedTrainer.firstName} ${selectedTrainer.lastName}`)
          // Refresh user sessions
          const sessionsResponse = await apiClient.get('/live-sessions/registered', {
            params: { type: 'one-on-one' }
          })
          if (sessionsResponse.success) {
            setUserSessions(Array.isArray(sessionsResponse.data) ? sessionsResponse.data : [])
          }
        } else {
          console.error('Erreur lors de la réservation:', response.error)
        }
      } catch (error) {
        console.error('Erreur lors de la réservation:', error)
      } finally {
        setLoading(false)
        setIsBookingOpen(false)
        setSelectedDate(undefined)
        setSelectedTime("")
        setSelectedCategory("")
        setSelectedLevel("")
        setSelectedTrainer(null)
      }
    }
  }

  // Conditional rendering logic - moved after all hooks
  // Show loading while checking authentication
  if (authLoading) {
    return (
      <PageShell>
        <main className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-6 py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">{t("Vérification de l'authentification...", "Checking authentication...")}</p>
            </div>
          </div>
        </main>
      </PageShell>
    )
  }

  // Show authentication error if user is not logged in
  if (error && error.includes('connecté')) {
    return (
      <PageShell>
        <main className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-6 py-20">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-8">
                <AlertCircle className="h-4 w-4" />
                {t("AUTHENTIFICATION REQUISE", "AUTHENTICATION REQUIRED")}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                {t("Connexion Requise", "Login Required")}
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                {error}
              </p>
              
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
                onClick={() => window.location.href = '/connexion'}
              >
                {t("Se connecter", "Login")}
              </Button>
            </div>
          </div>
        </main>
      </PageShell>
    )
  }

  // Show upgrade message if user doesn't have PRO subscription
  if (error && error.includes('abonnement')) {
    return (
      <PageShell>
        <main className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-6 py-20">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-8">
                <AlertCircle className="h-4 w-4" />
                {t("ACCÈS RESTREINT", "RESTRICTED ACCESS")}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                {t("Upgradez vers Pro", "Upgrade to Pro")}
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                {error}
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {t("Avantages de l'abonnement Pro", "Pro Subscription Benefits")}
                </h2>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{t("Sessions 1-on-1 avec formateurs certifiés", "1-on-1 sessions with certified trainers")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{t("Accès prioritaire aux créneaux", "Priority access to time slots")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{t("Feedback personnalisé", "Personalized feedback")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{t("Suivi de progression détaillé", "Detailed progress tracking")}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
                onClick={() => window.location.href = '/abonnement'}
              >
                <Crown className="h-5 w-5 mr-2" />
                {t("Upgrader vers Pro", "Upgrade to Pro")}
              </Button>
            </div>
          </div>
        </main>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <main className="min-h-screen bg-background">
        {/* Hero Section - Explication claire du service */}
        <section className="bg-background py-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
            {/* Badge Pro+ */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-sm font-medium mb-8">
              <Crown className="h-4 w-4" />
              {t("ACCÈS EXCLUSIF PRO+", "EXCLUSIVE PRO+ ACCESS")}
            </div>
            
            {/* Titre principal */}
            <h1 className="text-6xl md:text-7xl font-black text-foreground mb-8 leading-tight">
              {t("Formateurs Certifiés", "Certified Trainers")}
            </h1>
            
            {/* Sous-titre explicatif */}
            <p className="text-2xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
              {t(
                "Sessions 1-on-1 pro avec nos experts certifiés. Choisissez votre formateur, réservez votre créneau, progressez à votre rythme.",
                "Pro 1-on-1 sessions with our certified experts. Choose your trainer, book your slot, progress at your own pace."
              )}
            </p>
            
            {/* Comment ça marche - 3 étapes simples */}
            {/* Comment utiliser ce service - Explication textuelle */}
            <div className="max-w-4xl mx-auto mb-16">
              <h3 className="text-2xl font-bold text-foreground mb-8">Comment utiliser ce service :</h3>
              <div className="text-left space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">1. Choisissez votre formateur</h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Parcourez la liste des formateurs certifiés disponibles. Consultez leurs spécialités, leurs expériences 
                    et leurs disponibilités. Tous sont qualifiés pour vous accompagner dans votre apprentissage du français.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">2. Réservez votre session</h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Cliquez sur "Réserver" pour choisir directement un créneau dans son planning. 
                    La réservation est simple et se fait en quelques clics.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">3. Progressez avec un expert</h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Avec votre abonnement Pro+, toutes les sessions 1-on-1 sont entièrement gratuites. Pas de frais 
                    supplémentaires, pas de limite. Apprenez à votre rythme avec un accompagnement personnalisé.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-1">{managers.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{t("Formateurs", "Trainers")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-1">
                  {managers.length > 0 ? Math.round(managers.reduce((sum, m) => sum + m.rating, 0) / managers.length * 20) : 0}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{t("Satisfaction", "Satisfaction")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-1">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{t("Réservation", "Booking")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-1">plans pro</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{t("Sessions", "Sessions")}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Filtres et recherche */}
        <section className="py-12 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-6">
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-green-500/20">
              <div className="grid md:grid-cols-4 gap-4">
                {/* Recherche */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      placeholder={t("Rechercher un formateur...", "Search for a trainer...")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-green-500 focus:ring-green-500 dark:focus:border-green-400"
                    />
                  </div>
                </div>
                
                {/* Filtre par sujet */}
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:border-green-500 focus:ring-green-500 dark:focus:border-green-400"
                >
                  <option value="all">{t("Tous les sujets", "All subjects")}</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                
                {/* Filtre par disponibilité */}
                <select
                  value={selectedAvailability}
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:border-green-500 focus:ring-green-500 dark:focus:border-green-400"
                >
                  <option value="all">{t("Toutes disponibilités", "All availability")}</option>
                  {availabilityOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
            </div>
          </div>
        </section>

        {/* Grille des formateurs */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-foreground">
                {t("Formateurs Disponibles", "Available Trainers")}
              </h2>
              <span className="text-gray-600">
                {managers.length > 0 ? sortedTrainers.length : 0} {t("formateurs", "trainers")}
              </span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">{t("Chargement des formateurs...", "Loading trainers...")}</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <p className="text-red-500 mb-4">{error}</p>
                {error.includes("abonnement Pro") || error.includes("Pro subscription") || error.includes("Upgradez vers Pro") || error.includes("Upgrade to Pro") ? (
                  <div className="space-y-4">
                    <Button 
                      onClick={() => window.location.href = '/abonnement'} 
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {t("Upgrader vers Pro", "Upgrade to Pro")}
                    </Button>
                    <Button onClick={() => window.location.reload()} variant="outline" className="ml-4">
                      {t("Réessayer", "Retry")}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => window.location.reload()} variant="outline">
                    {t("Réessayer", "Retry")}
                  </Button>
                )}
              </div>
            ) : managers.length === 0 ? (
              <div className="text-center py-12">
                <Card className="bg-white dark:bg-gray-800 shadow-sm">
                  <CardContent className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {t("Aucun formateur disponible", "No trainers available")}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {t("Aucun formateur disponible pour le moment. Les formateurs certifiés apparaîtront ici lorsqu'ils activeront leurs profils marketplace.", "No trainers available at the moment. Certified trainers will appear here when they activate their marketplace profiles.")}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : sortedTrainers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedTrainers.map((trainer) => (
                  <div
                    key={trainer.id}
                    className="bg-card rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-green-200 transition-all duration-300 group"
                  >
                    {/* Header avec image et statut */}
                    <div className="relative p-6 pb-4">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                            {trainer.profileImage ? (
                              <img src={trainer.profileImage} alt={`${trainer.firstName} ${trainer.lastName}`} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              `${trainer.firstName[0]}${trainer.lastName[0]}`
                            )}
                          </div>
                          {/* Online/Offline status indicator */}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${trainer.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-foreground truncate">{`${trainer.firstName} ${trainer.lastName}`}</h3>
                            <Shield className="h-4 w-4 text-green-600" />
                          </div>

                          <p className="text-sm text-gray-600 mb-2">{trainer.role}</p>

                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium text-foreground">{trainer.rating}</span>
                            </div>
                            <span className="text-sm text-gray-500">({trainer.totalSessions} sessions)</span>
                          </div>
                          
                          {/* Online status */}
                          <div className="flex items-center gap-1 text-xs">
                            <div className={`w-2 h-2 rounded-full ${trainer.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className={trainer.isOnline ? 'text-green-600' : 'text-gray-500'}>
                              {trainer.isOnline ? t("En ligne", "Online") : t("Hors ligne", "Offline")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contenu principal */}
                    <div className="px-6 pb-4">
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {trainer.bio}
                      </p>
                      
                      {/* Spécialisations et Sujets */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {trainer.specialties?.slice(0, 2).map((spec: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                            {spec}
                          </Badge>
                        ))}
                        {trainer.subjects && trainer.subjects.length > 0 && trainer.subjects.slice(0, 3).map((subject: string, idx: number) => (
                          <Badge key={`subject-${idx}`} variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Informations pratiques */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        {/* Working time periods (disponibilité) */}
                        {trainer.availability && trainer.availability.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 mt-0.5" />
                            <div className="flex-1">
                              <span className="text-xs font-medium mb-1 block">{t("Périodes", "Periods")}:</span>
                              <div className="flex flex-wrap gap-1">
                                {trainer.availability.slice(0, 2).map((avail: string, idx: number) => (
                                  <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                    {avail}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Working hours (specific time slots) */}
                        {trainer.workingHours && trainer.workingHours.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 mt-0.5" />
                            <div className="flex-1">
                              <span className="text-xs font-medium mb-1 block">{t("Horaires", "Hours")}:</span>
                              <div className="flex flex-wrap gap-1">
                                {trainer.workingHours.slice(0, 2).map((hours: string, idx: number) => (
                                  <span key={idx} className="text-xs bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                                    {hours}
                                  </span>
                                ))}
                                {trainer.workingHours.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{trainer.workingHours.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {(!trainer.availability || trainer.availability.length === 0) && (!trainer.workingHours || trainer.workingHours.length === 0) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-4 w-4" />
                            <span>{t("Non spécifié", "Not specified")}</span>
                        </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          <span>{trainer.totalSessions} sessions</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer avec prix et actions */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">plans pro</div>
                          <div className="text-xs text-gray-500">{t("Inclus Pro+", "Included in Pro+")}</div>
                        </div>
                        <div className="text-xs text-gray-500 line-through">15000 CFA/h</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          onClick={async () => {
                            try {
                              // Check if trainer accepts messages
                              const acceptsMessages = trainer.acceptsMessages !== false
                              if (!acceptsMessages) {
                                toast.error(t("Ce formateur n'accepte pas les messages", "This trainer does not accept messages"))
                                return
                              }
                              
                              // Show loading state
                              const loadingToast = toast.loading(t("Création de la conversation...", "Creating conversation..."))
                              
                              // Fetch trainer profile to ensure they exist and accept messages
                              const tutorsResponse = await apiClient.get('/marketplace/tutors')
                              if (!tutorsResponse.success || !tutorsResponse.data) {
                                toast.dismiss(loadingToast)
                                toast.error(t("Impossible de récupérer les informations du formateur", "Unable to fetch trainer information"))
                                return
                              }
                              
                              const tutors = Array.isArray(tutorsResponse.data) ? tutorsResponse.data : []
                              const foundTrainer = tutors.find((t: any) => t.id === trainer.id)
                              
                              if (!foundTrainer) {
                                toast.dismiss(loadingToast)
                                toast.error(t("Formateur introuvable", "Trainer not found"))
                                return
                              }
                              
                              // Verify trainer accepts messages
                              const trainerAcceptsMessages = foundTrainer.acceptsMessages !== false
                              if (!trainerAcceptsMessages) {
                                toast.dismiss(loadingToast)
                                toast.error(t("Ce formateur n'accepte pas les messages", "This trainer does not accept messages"))
                                return
                              }
                              
                              // Send an initial greeting message to create the conversation properly
                              try {
                                const messageResponse = await apiClient.post('/messages', {
                                  receiverId: trainer.id,
                                  content: t("Bonjour ! Je souhaite commencer une conversation avec vous.", "Hello! I would like to start a conversation with you."),
                                  subject: t("Nouvelle conversation", "New conversation")
                                })
                                
                                if (messageResponse.success) {
                                  toast.dismiss(loadingToast)
                                  toast.success(t("Conversation créée avec succès", "Conversation created successfully"))
                                  router.push(`/messages?contact=${trainer.id}`)
                                } else {
                                  // Even if message fails, redirect anyway
                                  toast.dismiss(loadingToast)
                                  console.warn('Initial message failed, but redirecting anyway:', messageResponse.error)
                                  router.push(`/messages?contact=${trainer.id}`)
                                }
                              } catch (messageError: any) {
                                // If sending message fails, still redirect - conversation will be created on first message
                                toast.dismiss(loadingToast)
                                console.warn('Error sending initial message, but redirecting anyway:', messageError)
                                router.push(`/messages?contact=${trainer.id}`)
                              }
                            } catch (error: any) {
                              console.error('Error creating conversation:', error)
                              toast.error(t("Erreur lors de la création de la conversation", "Error creating conversation"))
                            }
                          }}
                          disabled={trainer.acceptsMessages === false}
                        >
                          <MessageCircle className="h-4 w-4" />
                          {trainer.acceptsMessages === false 
                            ? t("Messages désactivés", "Messages disabled")
                            : t("Message", "Message")
                          }
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                          onClick={() => handleBooking(trainer)}
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {t("Réserver", "Book")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                  <Card className="bg-white dark:bg-gray-800 shadow-sm">
                    <CardContent className="text-center py-12">
                      <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {t("Aucun formateur trouvé", "No trainers found")}
                </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {t("Aucun formateur ne correspond à vos critères de filtrage. Essayez de modifier vos filtres.", "No trainers match your filtering criteria. Try modifying your filters.")}
                      </p>
                      <Button 
                        onClick={() => {
                          setSearchTerm("")
                          setSelectedSubject("all")
                          setSelectedAvailability("all")
                        }}
                        variant="outline"
                      >
                        {t("Réinitialiser les filtres", "Reset filters")}
                      </Button>
                    </CardContent>
                  </Card>
              </div>
              )
            }
          </div>
        </section>

        {/* Section CTA - Design simple */}
        <section className="py-20 bg-background">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight text-foreground">
              {t("Prêt à commencer ?", "Ready to start?")}
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              {t(
                "Sessions 1-on-1 pro avec nos formateurs certifiés Pro+",
                "Pro 1-on-1 sessions with our certified Pro+ trainers"
              )}
            </p>
          </div>
        </section>

        {/* Dialog de réservation */}
        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-center">
                {t("Réserver une session avec", "Book a session with")} {selectedTrainer?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Calendrier */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">
                  {t("Choisir une date", "Choose a date")}
                </h3>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border border-gray-200 dark:border-gray-700 bg-card"
                    disabled={(date) => date < new Date()}
                  />
                </div>
              </div>
              
              {/* Sélection de la catégorie */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">
                  {t("Choisir une catégorie", "Choose a category")}
                </h3>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("Sélectionner une catégorie", "Select a category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Sélection du niveau */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">
                  {t("Choisir un niveau", "Choose a level")}
                </h3>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("Sélectionner un niveau", "Select a level")} />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Sélection de l'heure */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">
                  {t("Choisir une heure", "Choose a time")}
                </h3>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("Sélectionner une heure", "Select a time")} />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Informations de la session */}
              {selectedDate && selectedTime && selectedCategory && selectedLevel && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">
                    {t("Résumé de la réservation", "Booking summary")}
                  </h4>
                  <div className="space-y-2 text-sm text-green-700">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{selectedTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      <span>{selectedTrainer?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{selectedCategory}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>Niveau {selectedLevel}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Boutons d'action */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsBookingOpen(false)}
                  className="flex-1"
                >
                  {t("Annuler", "Cancel")}
                </Button>
                
                <Button
                  onClick={confirmBooking}
                  disabled={!selectedDate || !selectedTime || !selectedCategory || !selectedLevel}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {t("Confirmer", "Confirm")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </PageShell>
  )
}

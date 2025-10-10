"use client"

import { useState, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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

interface Manager {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  specialties: string[]
  rating: number
  totalSessions: number
  languages: string[]
  availability: string[]
  bio: string
  profileImage?: string
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
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // State for managers and sessions
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userSessions, setUserSessions] = useState<any[]>([])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [selectedAvailability, setSelectedAvailability] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("")
  const [isBookingOpen, setIsBookingOpen] = useState(false)


  // Load managers and user sessions
  useEffect(() => {
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
        const tutorsResponse = await apiClient.get('/marketplace/tutors', {
          params: {
            search: searchTerm,
            specialties: selectedSubject !== 'all' ? selectedSubject : undefined,
            availability: selectedAvailability !== 'all' ? selectedAvailability : undefined,
            sortBy: sortBy
          }
        })

        if (tutorsResponse.success && tutorsResponse.data) {
          const tutorsData = Array.isArray(tutorsResponse.data) ? tutorsResponse.data : []

          // Filter for only active marketplace profiles (admin + senior managers with isActive: true)
          const activeTutors = tutorsData.filter((tutor: any) =>
            tutor.isActive === true &&
            (tutor.role === 'ADMIN' || tutor.role === 'SENIOR_MANAGER')
          )

          // Transform tutor data to match component expectations
          const transformedManagers: Manager[] = activeTutors.map((tutor: any) => ({
            id: tutor.id,
            firstName: tutor.title?.includes('Admin') ? 'Admin' :
                      tutor.title?.includes('Senior') ? 'Senior Manager' : 'Manager',
            lastName: tutor.title || '',
            email: tutor.userId || `tutor${tutor.id}@aura.ca`,
            role: tutor.role || 'TEACHER',
            specialties: tutor.specialties || ['Grammaire', 'Expression Orale'],
            rating: tutor.rating || 4.8,
            totalSessions: tutor.totalSessions || 0,
            languages: tutor.languages || ['Français', 'Anglais'],
            availability: tutor.availability || ['Lun-Ven'],
            bio: tutor.bio || t("Expert certifié en français", "Certified French expert"),
            profileImage: tutor.profileImage
          }))

          setManagers(transformedManagers)
        }

        // Fetch user's one-on-one sessions
        const sessionsResponse = await apiClient.get('/live-sessions/registered', {
          params: { type: 'one-on-one' }
        })

        if (sessionsResponse.success && sessionsResponse.data) {
          setUserSessions(Array.isArray(sessionsResponse.data) ? sessionsResponse.data : [])
        }

      } catch (error) {
        console.error('Error loading data:', error)
        setError(t("Erreur lors du chargement des données", "Error loading data"))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, t])

  const subjects = ["Grammaire", "Expression Orale", "Methodologie TCF/TEF", "Vocabulaire", "Phonétique", "Conversation", "Compréhension Orale", "Compréhension Ecrite", "Expression Ecrite"]
  const availabilityOptions = ["Lun-Ven", "Mar-Sam", "Lun-Dim", "Mer-Dim", "Lun-Sam", "Lun-Ven 18h-23h"]
  
  // Options pour la réservation
  const categoryOptions = ["Méthodologie TCF/TEF", "Vocabulaire", "Grammaire"]
  const levelOptions = ["B1", "B2", "C1", "C2"]

  const filteredTrainers = managers.filter(manager => {
    const fullName = `${manager.firstName} ${manager.lastName}`
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manager.specialties.some(specialty => specialty.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSubject = selectedSubject === "all" || manager.specialties.includes(selectedSubject)
    const matchesAvailability = selectedAvailability === "all" || manager.availability.includes(selectedAvailability)

    return matchesSearch && matchesSubject && matchesAvailability
  })

  const sortedTrainers = [...filteredTrainers].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating
      case "experience":
        return b.totalSessions - a.totalSessions
      case "students":
        return b.totalSessions - a.totalSessions
      default:
        return 0
    }
  })



  const handleBooking = (trainer: Manager) => {
    setSelectedTrainer(trainer)
    setIsBookingOpen(true)
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
              
              {/* Tri */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-300">{t("Trier par:", "Sort by:")}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="rating">{t("Note", "Rating")}</option>
                  <option value="experience">{t("Expérience", "Experience")}</option>
                  <option value="students">{t("Élèves", "Students")}</option>
                  <option value="price">{t("Prix", "Price")}</option>
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
                {sortedTrainers.length} {t("formateurs", "trainers")}
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
            ) : managers.length > 0 ? (
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
                            {`${trainer.firstName[0]}${trainer.lastName[0]}`}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-green-500" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-foreground truncate">{`${trainer.firstName} ${trainer.lastName}`}</h3>
                            <Shield className="h-4 w-4 text-green-600" />
                          </div>

                          <p className="text-sm text-gray-600 mb-2">{trainer.role}</p>

                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium text-foreground">{trainer.rating}</span>
                            </div>
                            <span className="text-sm text-gray-500">({trainer.totalSessions} sessions)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contenu principal */}
                    <div className="px-6 pb-4">
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {trainer.bio}
                      </p>
                      
                      {/* Spécialisations */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {trainer.specialties?.slice(0, 2).map((spec: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Informations pratiques */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{trainer.availability || "Non spécifié"}</span>
                        </div>
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
                      
                      <div className="flex justify-center">
                        <Button
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg"
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
                <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                  <UserCheck className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {t("Aucun formateur disponible", "No trainers available")}
                </h3>
                <p className="text-muted-foreground">
                  {t("Les formateurs seront bientôt disponibles", "Trainers will be available soon")}
                </p>
              </div>
            )}
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

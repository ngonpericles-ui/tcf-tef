"use client"

import { useState, useMemo, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Star,
  MessageCircle,
  Calendar,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  TrendingUp,
  Filter,
  UserCheck,
  Shield,
  Crown,
  Loader2,
  FileText,
  Send
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// Type definitions
interface TutorProfile {
  id: string
  name: string
  firstName: string
  lastName: string
  specialities: string[]
  subjects?: string[] // Sujets (Grammaire, Expression Orale, etc.)
  location: string | null
  languages: string[]
  availability: string[] // Working time periods (disponibilité) - e.g., ["Lun-Ven"]
  workingHours?: string[] // Specific time slots - e.g., ["Lundi: 09:00-12:00", "Mardi: 14:00-17:00"]
  isAvailable: boolean
  isOnline?: boolean // NEW: Online status
  availabilityStatus?: string // NEW: Status label ("En ligne" / "Hors ligne")
  profileImage?: string | null
  bio?: string
  acceptsMessages?: boolean // Whether tutor accepts messages from students
}

interface AIFeedback {
  id: string
  simulationTitle: string
  submissionDate: string
  aiScore: number
  maxScore: number
  percentage: number
  status: string
  aiConfidence: number
  feedback: {
    overall: string
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    detailedAnalysis: any
  }
  originalWork: {
    type: string
    content: string
    fileUrl?: string
  }
  humanReview?: {
    tutorName: string
    tutorFeedback: string
    reviewDate: string
    finalScore: number
  }
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
  const [availableSpecialities, setAvailableSpecialities] = useState<string[]>(["all"])

  // Review request state
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null)
  const [reviewMessage, setReviewMessage] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)
  const [userFeedbacks, setUserFeedbacks] = useState<AIFeedback[]>([])
  const [availabilityFilter, setAvailabilityFilter] = useState("all")

  // Fetch available specialties from backend (TCF, TEF)
  useEffect(() => {
    const fetchSpecialities = async () => {
      if (!isAuthenticated) return
      
      try {
        const response = await apiClient.get('/marketplace/specialties') as ApiResponse<string[]>
        if (response.success && Array.isArray(response.data)) {
          // Add "Tous" (All) option at the beginning, then TCF, TEF
          setAvailableSpecialities(["all", ...response.data])
        } else {
          // Fallback to TCF, TEF if API fails
          setAvailableSpecialities(["all", "TCF", "TEF"])
        }
      } catch (err: any) {
        console.error('Error fetching specialties:', err)
        // Fallback to TCF, TEF if API fails
        setAvailableSpecialities(["all", "TCF", "TEF"])
      }
    }
    
    fetchSpecialities()
  }, [isAuthenticated])

  // Fetch tutors from backend - Simple and direct approach
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

        console.log('🔍 Fetching marketplace tutors...')
        const response = await apiClient.get('/marketplace/tutors') as ApiResponse<any[]>

        if (!isMounted) return

        console.log('📋 API Response:', {
          success: response.success,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          dataLength: Array.isArray(response.data) ? response.data.length : 0
        })

        // Direct validation - no complex array manipulation
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to fetch tutors')
        }

        if (!response.data) {
          console.warn('⚠️ No data in response')
          setInstructors([])
          return
        }

        // Simple type check and conversion
        const tutorsData = Array.isArray(response.data) ? response.data : []
        
        console.log(`📊 Processing ${tutorsData.length} tutors from backend`)

        // DIRECT MAPPING - Match backend response structure EXACTLY
        const processedTutors: TutorProfile[] = tutorsData.map((tutor: any) => {
          // Backend sends: firstName, lastName, fullName, specialties, languages, availability, isActive, status, location, profilePicture, bio
          const fullName = tutor.fullName || `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() || 'Formateur'
          
          // Backend sends 'specialties' (not 'specialities') - match exactly
          const specialties = Array.isArray(tutor.specialties) 
            ? tutor.specialties 
            : tutor.specialties 
            ? [tutor.specialties] 
            : []
          
          // Backend sends languages as array
          const languages = Array.isArray(tutor.languages) 
            ? tutor.languages 
            : tutor.languages 
            ? [tutor.languages] 
            : ['Français']
          
          // Backend sends availability as array
          const availability = Array.isArray(tutor.availability) 
            ? tutor.availability 
            : tutor.availability 
            ? [tutor.availability] 
            : ['Disponible']
          
          // Status from backend - backend now sends 'ONLINE' or 'OFFLINE' based on activity
          // Backend logic: ONLINE if status === 'ONLINE' OR (status === 'ACTIVE' && recently active)
          // Backend returns status as 'ONLINE' or 'OFFLINE' in the status field
          const isOnline = tutor.status === 'ONLINE'
          const availabilityStatus = isOnline ? 'En ligne' : 'Hors ligne'
          
          // Debug log to see what status backend is sending
          if (tutorsData.indexOf(tutor) === 0) {
            console.log(`📊 Sample tutor status from backend:`, {
              id: tutor.id,
              name: fullName,
              status: tutor.status,
              isOnline,
              location: tutor.location
            })
          }

          // Backend sends subjects (sujets)
          const subjects = Array.isArray(tutor.subjects) 
            ? tutor.subjects 
            : tutor.subjects 
            ? [tutor.subjects] 
            : []

          // Backend sends working hours (specific time slots)
          const workingHours = Array.isArray(tutor.workingHours) 
            ? tutor.workingHours 
            : tutor.workingHours 
            ? [tutor.workingHours] 
            : []

          // Return EXACT structure frontend expects
          return {
            id: tutor.id || tutor.userId || '',
            name: fullName,
            firstName: tutor.firstName || '',
            lastName: tutor.lastName || '',
            specialities: specialties, // Map backend's 'specialties' to frontend's 'specialities'
            subjects: subjects, // Sujets (Grammaire, Expression Orale, etc.)
            location: tutor.location || null,
            languages,
            availability, // Working time periods (disponibilité)
            workingHours: workingHours, // Specific time slots
            isAvailable: tutor.isActive === true,
            isOnline,
            availabilityStatus,
            profileImage: tutor.profilePicture 
              ? (() => {
                  if (tutor.profilePicture.startsWith('http')) return tutor.profilePicture
                  let cleanPath = tutor.profilePicture.replace(/^\/+/, '')
                  if (cleanPath.startsWith('uploads/')) {
                    return `http://localhost:3001/${cleanPath}`
                  } else {
                    return `http://localhost:3001/uploads/${cleanPath}`
                  }
                })()
              : null,
            bio: tutor.bio || '',
            acceptsMessages: tutor.acceptsMessages !== false // Default to true if not set
          }
        })

        console.log(`✅ Processed ${processedTutors.length} tutors successfully`)
        if (processedTutors.length > 0) {
          console.log('📋 Sample tutor processed:', {
            id: processedTutors[0].id,
            name: processedTutors[0].name,
            specialities: processedTutors[0].specialities,
            isActive: processedTutors[0].isAvailable,
            isOnline: processedTutors[0].isOnline,
            status: processedTutors[0].availabilityStatus,
            location: processedTutors[0].location,
            rawStatus: tutorsData[0]?.status
          })
        } else {
          console.warn('⚠️ No tutors processed - check backend response structure')
          console.log('📋 Raw response.data sample:', tutorsData[0])
        }

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

  // Skip AI feedbacks for marketplace - this is for tutor selection, not feedback review
  useEffect(() => {
    const fetchUserFeedbacks = async () => {
      if (!isAuthenticated) return

      try {
        console.log('🔍 Marketplace: AI feedbacks not implemented for this page - skipping...')
        // AI feedbacks are for simulation pages, not marketplace
        // This marketplace is for students to select tutors for one-on-one sessions
        setUserFeedbacks([])
      } catch (err: any) {
        console.error('❌ Error in fetchUserFeedbacks:', err)
        setUserFeedbacks([])
      }
    }

    fetchUserFeedbacks()
  }, [isAuthenticated])

  // Handle review request submission
  const handleSubmitReviewRequest = async (feedbackId: string) => {
    if (!selectedTutor || !reviewMessage.trim()) {
      toast.error(t("Veuillez sélectionner un tuteur et ajouter un message", "Please select a tutor and add a message"))
      return
    }

    setSubmittingReview(true)
    try {
      const response = await apiClient.post(`/ai/feedback/${feedbackId}/submit-for-review`, {
        selectedTutorId: selectedTutor.id,
        message: reviewMessage
      })

      if (response.success) {
        toast.success(t("Demande de révision envoyée avec succès", "Review request sent successfully"))
        setShowReviewDialog(false)
        setReviewMessage("")
        setSelectedTutor(null)

        // Refresh feedbacks to update status
        const feedbackResponse = await apiClient.get('/ai/feedbacks') as ApiResponse<AIFeedback[]>
        if (feedbackResponse.success && feedbackResponse.data) {
          const reviewableFeedbacks = feedbackResponse.data.filter((feedback: AIFeedback) =>
            feedback.status === 'ai_completed' &&
            (feedback.percentage < 80 || (feedback.aiConfidence && feedback.aiConfidence < 0.8))
          )
          setUserFeedbacks(reviewableFeedbacks)
        }
      } else {
        toast.error(t("Erreur lors de l'envoi de la demande", "Error sending request"))
      }
    } catch (err: any) {
      console.error('Error submitting review request:', err)
      toast.error(t("Erreur lors de l'envoi de la demande", "Error sending request"))
    } finally {
      setSubmittingReview(false)
    }
  }

  // Simple filtering - direct and clear
  const filteredInstructors = useMemo(() => {
    if (!instructors.length) return []

    return instructors.filter(instructor => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        instructor.name?.toLowerCase().includes(searchLower) ||
        instructor.specialities?.some((s: string) => s.toLowerCase().includes(searchLower))
      
      // Specialty filter - "all" shows all activated profiles, otherwise filter by specialty
      const matchesSpeciality = selectedSpeciality === "all" || 
        (instructor.specialities && Array.isArray(instructor.specialities) && 
         instructor.specialities.includes(selectedSpeciality))
      
      // Availability filter - NEW: Handle online/offline status
      let matchesAvailability = true
      if (availabilityFilter === "online") {
        matchesAvailability = instructor.isOnline === true
      } else if (availabilityFilter === "available") {
        matchesAvailability = instructor.isAvailable === true && 
          (instructor.availability?.includes("maintenant") || instructor.isOnline === true)
      }
      
      return matchesSearch && matchesSpeciality && matchesAvailability
    })
  }, [instructors, searchQuery, selectedSpeciality, availabilityFilter])

  return (
    <PageShell>
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-background py-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <Badge className="mb-6 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-4 py-2 text-sm font-semibold">
              <Crown className="h-4 w-4 mr-2" />
              {t("MARKETPLACE PRO+", "PRO+ MARKETPLACE")}
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
              {t("Marketplace", "Marketplace")} <br />
              <span className="text-green-600 dark:text-green-400">Instructeurs</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              {t(
                "Connectez-vous avec nos instructeurs certifiés pour des sessions personnalisées. Disponible uniquement pour les abonnés Pro+.",
                "Connect with our certified instructors for personalized sessions. Available only for Pro+ subscribers."
              )}
            </p>

            {/* Features */}
            <div className="max-w-4xl mx-auto mb-16">
              <h3 className="text-2xl font-bold text-foreground mb-8">Fonctionnalités :</h3>
              <div className="text-left space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">1. Sessions 1-on-1</h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Planifiez des sessions individuelles avec nos instructeurs certifiés. 
                    Choisissez votre instructeur, réservez votre créneau, et progressez à votre rythme.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">2. Instructeurs Non Payés</h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Nos instructeurs participent volontairement au marketplace. Ils ne sont pas rémunérés 
                    mais partagent leur expertise pour aider les étudiants Pro+.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">3. Accès Pro+ Exclusif</h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Cette fonctionnalité est réservée aux abonnés Pro+. Connectez-vous avec des experts 
                    pour un accompagnement personnalisé dans votre apprentissage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-card rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-800/50">
              <div className="flex flex-col lg:flex-row gap-6 items-center">
                {/* Search */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder={t("Rechercher un instructeur...", "Search for an instructor...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-800/50 rounded-lg dark:bg-gray-800 dark:text-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 dark:focus:border-green-400 dark:focus:ring-green-400/20"
                  />
                </div>
                
                {/* Speciality Filter */}
                <div className="w-full lg:w-auto">
                  <select 
                    value={selectedSpeciality}
                    onChange={(e) => setSelectedSpeciality(e.target.value)}
                    className="w-full lg:w-auto px-4 py-3 border border-gray-200 dark:border-gray-800/50 rounded-lg dark:bg-gray-800 dark:text-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 dark:focus:border-green-400 dark:focus:ring-green-400/20"
                  >
                    <option value="all">{t("Tous", "All")}</option>
                    {availableSpecialities.slice(1).map(speciality => (
                      <option key={speciality} value={speciality}>{speciality}</option>
                    ))}
                  </select>
                </div>
                
                
                {/* Availability Filter */}
                <div className="w-full lg:w-auto">
                  <select 
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="w-full lg:w-auto px-4 py-3 border border-gray-200 dark:border-gray-800/50 rounded-lg dark:bg-gray-800 dark:text-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 dark:focus:border-green-400 dark:focus:ring-green-400/20"
                  >
                    <option value="all">{t("Toutes disponibilités", "All availability")}</option>
                    <option value="online">{t("En ligne", "Online")}</option>
                    <option value="available">{t("Disponible maintenant", "Available now")}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Instructors Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
                {t("Instructeurs Disponibles", "Available Instructors")}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {t(
                  "Découvrez nos instructeurs certifiés et planifiez vos sessions personnalisées",
                  "Discover our certified instructors and schedule your personalized sessions"
                )}
              </p>
            </div>

            {/* Review Request Section */}
            {userFeedbacks.length > 0 && !loading && (
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-foreground">
                    {t("Demandes de révision IA", "AI Review Requests")}
                  </h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  {t(
                    "Vous avez des feedbacks IA qui nécessitent une révision humaine. Sélectionnez un expert pour une analyse approfondie.",
                    "You have AI feedbacks that need human review. Select an expert for in-depth analysis."
                  )}
                </p>
                <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <FileText className="h-4 w-4 mr-2" />
                      {t("Soumettre pour révision", "Submit for Review")} ({userFeedbacks.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {t("Demander une révision humaine", "Request Human Review")}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Feedback Selection */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          {t("Sélectionner le feedback à réviser", "Select feedback to review")}
                        </label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {userFeedbacks.map((feedback) => (
                            <div key={feedback.id} className="p-3 border rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{feedback.simulationTitle}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Score: {feedback.percentage}% | Confiance IA: {Math.round((feedback.aiConfidence || 0) * 100)}%
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleSubmitReviewRequest(feedback.id)}
                                  disabled={submittingReview || !selectedTutor}
                                >
                                  {submittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tutor Selection */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          {t("Sélectionner un expert", "Select an expert")}
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                          {instructors.map((instructor) => (
                            <div
                              key={instructor.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedTutor?.id === instructor.id
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                              onClick={() => setSelectedTutor(instructor)}
                            >
                              <p className="font-medium">{instructor.name}</p>
                              <p className="text-sm text-muted-foreground">{instructor.specialities?.join(', ')}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          {t("Message pour l'expert", "Message for the expert")}
                        </label>
                        <Textarea
                          value={reviewMessage}
                          onChange={(e) => setReviewMessage(e.target.value)}
                          placeholder={t(
                            "Décrivez pourquoi vous souhaitez une révision humaine...",
                            "Describe why you want a human review..."
                          )}
                          rows={3}
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                <span className="ml-3 text-lg text-gray-600 dark:text-gray-300">
                  {t("Chargement des instructeurs...", "Loading instructors...")}
                </span>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="text-red-500 mb-4">
                  <Shield className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {t("Erreur de chargement", "Loading Error")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{error}</p>
                </div>
              </div>
            ) : instructors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInstructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    className="bg-card rounded-2xl border border-gray-200 dark:border-gray-800/30 overflow-hidden hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
                  >
                    {/* Instructor Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          {instructor.profileImage ? (
                            <img 
                              src={instructor.profileImage} 
                              alt={instructor.name}
                              className="h-16 w-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                              onError={(e) => {
                                // If image fails to load, show fallback
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const fallback = target.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div 
                            className={`h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl ${instructor.profileImage ? 'hidden' : ''}`}
                          >
                              {instructor.name?.charAt(0) || "?"}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-foreground truncate">
                              {instructor.name || "Instructeur"}
                            </h3>
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {/* Availability Status Badge */}
                            <Badge 
                              variant={instructor.isOnline ? "default" : "secondary"} 
                              className={`text-xs ${
                                instructor.isOnline 
                                  ? "bg-green-500 hover:bg-green-600 text-white" 
                                  : "bg-gray-400 hover:bg-gray-500 text-white"
                              }`}
                            >
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  instructor.isOnline ? "bg-white animate-pulse" : "bg-white"
                                }`} />
                                {instructor.availabilityStatus || (instructor.isOnline ? "En ligne" : "Hors ligne")}
                              </div>
                            </Badge>
                            {instructor.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{instructor.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Specialities and Subjects */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {instructor.specialities?.slice(0, 2).map((speciality: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {speciality}
                          </Badge>
                        ))}
                        {instructor.subjects && instructor.subjects.length > 0 && instructor.subjects.slice(0, 3).map((subject: string, index: number) => (
                          <Badge key={`subject-${index}`} variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                            {subject}
                          </Badge>
                        ))}
                        {instructor.specialities?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{instructor.specialities.length - 2}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Working time (disponibilité) */}
                      {instructor.availability && instructor.availability.length > 0 && (
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="font-medium">{t("Périodes", "Periods")}:</span>
                          <div className="flex flex-wrap gap-1">
                            {instructor.availability.slice(0, 2).map((avail: string, index: number) => (
                              <span key={index} className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                {avail}
                              </span>
                            ))}
                            {instructor.availability.length > 2 && (
                              <span className="text-muted-foreground">
                                +{instructor.availability.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Working hours (specific time slots) */}
                      {instructor.workingHours && instructor.workingHours.length > 0 && (
                        <div className="flex items-start gap-2 mb-4 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-medium mb-1 block">{t("Horaires", "Hours")}:</span>
                            <div className="flex flex-wrap gap-1">
                              {instructor.workingHours.slice(0, 3).map((hours: string, index: number) => (
                                <span key={index} className="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                  {hours}
                                </span>
                              ))}
                              {instructor.workingHours.length > 3 && (
                                <span className="text-muted-foreground">
                                  +{instructor.workingHours.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Instructor Footer */}
                    <div className="px-6 pb-6">

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          onClick={async () => {
                            try {
                              // Check if tutor accepts messages
                              const acceptsMessages = instructor.acceptsMessages !== false
                              if (!acceptsMessages) {
                                toast.error(t("Ce tuteur n'accepte pas les messages", "This tutor does not accept messages"))
                                return
                              }
                              
                              // Show loading state
                              const loadingToast = toast.loading(t("Création de la conversation...", "Creating conversation..."))
                              
                              // Fetch tutor profile to ensure they exist and accept messages
                              // Use marketplace tutors endpoint which is public and returns tutor info
                              const tutorsResponse = await apiClient.get('/marketplace/tutors')
                              if (!tutorsResponse.success || !tutorsResponse.data) {
                                toast.dismiss(loadingToast)
                                toast.error(t("Impossible de récupérer les informations du tuteur", "Unable to fetch tutor information"))
                                return
                              }
                              
                              const tutors = Array.isArray(tutorsResponse.data) ? tutorsResponse.data : []
                              const tutor = tutors.find((t: any) => t.id === instructor.id)
                              
                              if (!tutor) {
                                toast.dismiss(loadingToast)
                                toast.error(t("Tuteur introuvable", "Tutor not found"))
                                return
                              }
                              
                              // Verify tutor accepts messages
                              const tutorAcceptsMessages = tutor.acceptsMessages !== false
                              if (!tutorAcceptsMessages) {
                                toast.dismiss(loadingToast)
                                toast.error(t("Ce tuteur n'accepte pas les messages", "This tutor does not accept messages"))
                                return
                              }
                              
                              // Send an initial greeting message to create the conversation properly
                              try {
                                const messageResponse = await apiClient.post('/messages', {
                                  receiverId: instructor.id,
                                  content: t("Bonjour ! Je souhaite commencer une conversation avec vous.", "Hello! I would like to start a conversation with you."),
                                  subject: t("Nouvelle conversation", "New conversation")
                                })
                                
                                if (messageResponse.success) {
                                  toast.dismiss(loadingToast)
                                  toast.success(t("Conversation créée avec succès", "Conversation created successfully"))
                                  // Redirect to messages page with tutor ID
                                  router.push(`/messages?contact=${instructor.id}`)
                                } else {
                                  // Even if message fails, redirect anyway - the conversation can be created when student sends first message
                                  toast.dismiss(loadingToast)
                                  console.warn('Initial message failed, but redirecting anyway:', messageResponse.error)
                                  router.push(`/messages?contact=${instructor.id}`)
                                }
                              } catch (messageError: any) {
                                // If sending message fails, still redirect - conversation will be created on first message
                                toast.dismiss(loadingToast)
                                console.warn('Error sending initial message, but redirecting anyway:', messageError)
                                router.push(`/messages?contact=${instructor.id}`)
                              }
                            } catch (error: any) {
                              console.error('Error creating conversation:', error)
                              toast.error(t("Erreur lors de la création de la conversation", "Error creating conversation"))
                            }
                          }}
                          disabled={instructor.acceptsMessages === false}
                        >
                          <MessageCircle className="h-4 w-4" />
                          {instructor.acceptsMessages === false 
                            ? t("Messages désactivés", "Messages disabled")
                            : t("Message", "Message")
                          }
                        </Button>
                        <Button 
                          className="flex-1 gap-2 bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black"
                          onClick={async () => {
                            // Submit session request
                            try {
                              const response = await apiClient.post('/marketplace/requests', {
                                tutorId: instructor.id,
                                requestType: 'SESSION',
                                subject: t("Demande de session 1-on-1", "One-on-one session request"),
                                description: t("Demande de session individuelle avec {name}", `Individual session request with ${instructor.name}`),
                                urgency: 'MEDIUM'
                              })
                              
                              if (response.success) {
                                toast.success(t("Demande envoyée avec succès", "Request sent successfully"))
                              } else {
                                toast.error(response.error?.message || t("Erreur lors de l'envoi", "Error sending request"))
                              }
                            } catch (error: any) {
                              toast.error(t("Erreur lors de l'envoi de la demande", "Error sending request"))
                            }
                          }}
                        >
                          <Calendar className="h-4 w-4" />
                          {t("Soumettre", "Submit")}
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
                  {t("Aucun instructeur disponible", "No instructors available")}
                </h3>
                <p className="text-muted-foreground">
                  {t("Les instructeurs seront bientôt disponibles", "Instructors will be available soon")}
                </p>
              </div>
            )}

            {filteredInstructors.length === 0 && instructors.length > 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {t("Aucun instructeur trouvé", "No instructors found")}
                </h3>
                <p className="text-muted-foreground">
                  {t("Essayez de modifier vos critères de recherche", "Try adjusting your search criteria")}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </PageShell>
  )
}

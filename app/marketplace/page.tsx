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
  DollarSign,
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

// Type definitions
interface TutorProfile {
  id: string
  name: string
  firstName: string
  lastName: string
  specialities: string[]
  rating: number
  reviews: number
  hourlyRate: number
  location: string
  languages: string[]
  availability: string[]
  isAvailable: boolean
  profileImage?: string
  bio?: string
  online?: boolean
  verified?: boolean
  completedSessions?: number
  responseTime?: string
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
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const [instructors, setInstructors] = useState<TutorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpeciality, setSelectedSpeciality] = useState("all")
  const [priceRange, setPriceRange] = useState("all")

  // Review request state
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null)
  const [reviewMessage, setReviewMessage] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)
  const [userFeedbacks, setUserFeedbacks] = useState<AIFeedback[]>([])
  const [availabilityFilter, setAvailabilityFilter] = useState("all")

  const specialities = ["all", "Grammaire avancée", "Expression écrite", "Compréhension orale", "Préparation TCF", "Business French", "Français médical"]

  // Fetch tutors from backend
  useEffect(() => {
    const fetchTutors = async () => {
      if (!isAuthenticated) return

      try {
        setLoading(true)
        setError(null)

        const response = await apiClient.get('/marketplace/tutors') as ApiResponse<any[]>

        if (response.success && response.data) {
          // Transform backend data to match frontend expectations
          const transformedTutors: TutorProfile[] = response.data.map((tutor: any) => ({
            id: tutor.id,
            name: `${tutor.userId}`, // Will be replaced with actual name
            firstName: tutor.title?.includes('Admin') ? 'Admin' :
                      tutor.title?.includes('Senior') ? 'Senior Manager' : 'Manager',
            lastName: 'User',
            specialities: tutor.specialties || ['TCF', 'TEF'],
            rating: tutor.rating || 4.8,
            reviews: tutor.totalStudents || 0,
            hourlyRate: tutor.hourlyRate || 0,
            location: tutor.location || 'Non spécifié',
            languages: tutor.languages || ['Français'],
            availability: tutor.availability || [],
            isAvailable: tutor.isActive || false,
            profileImage: undefined,
            bio: tutor.bio || '',
            online: tutor.online || false,
            verified: tutor.verified || false,
            completedSessions: tutor.experience || 0,
            responseTime: '< 1h'
          }))

          setInstructors(transformedTutors)
        }
      } catch (err: any) {
        console.error('Error fetching tutors:', err)
        setError(err.message || 'Failed to load tutors')
      } finally {
        setLoading(false)
      }
    }

    fetchTutors()
  }, [isAuthenticated])

  // Fetch user's AI feedbacks for review requests
  useEffect(() => {
    const fetchUserFeedbacks = async () => {
      if (!isAuthenticated) return

      try {
        const response = await apiClient.get('/ai/feedbacks') as ApiResponse<AIFeedback[]>
        if (response.success && response.data) {
          // Filter feedbacks that can be submitted for review (AI completed with low confidence)
          const reviewableFeedbacks = response.data.filter((feedback: AIFeedback) =>
            feedback.status === 'ai_completed' &&
            (feedback.percentage < 80 || (feedback.aiConfidence && feedback.aiConfidence < 0.8))
          )
          setUserFeedbacks(reviewableFeedbacks)
        }
      } catch (err) {
        console.error('Error fetching user feedbacks:', err)
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

  const filteredInstructors = useMemo(() => {
    return instructors.filter(instructor => {
      const matchesSearch = instructor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           instructor.specialities?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesSpeciality = selectedSpeciality === "all" || instructor.specialities?.includes(selectedSpeciality)
      const matchesPrice = priceRange === "all" || 
                          (priceRange === "low" && instructor.hourlyRate <= 35) ||
                          (priceRange === "medium" && instructor.hourlyRate > 35 && instructor.hourlyRate <= 45) ||
                          (priceRange === "high" && instructor.hourlyRate > 45)
      const matchesAvailability = availabilityFilter === "all" || 
                                 (availabilityFilter === "online" && instructor.online) ||
                                 (availabilityFilter === "available" && instructor.availability?.includes("maintenant"))
      
      return matchesSearch && matchesSpeciality && matchesPrice && matchesAvailability
    })
  }, [searchQuery, selectedSpeciality, priceRange, availabilityFilter])

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
                    <option value="all">{t("Toutes spécialités", "All specialities")}</option>
                    {specialities.slice(1).map(speciality => (
                      <option key={speciality} value={speciality}>{speciality}</option>
                    ))}
                  </select>
                </div>
                
                {/* Price Filter */}
                <div className="w-full lg:w-auto">
                  <select 
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full lg:w-auto px-4 py-3 border border-gray-200 dark:border-gray-800/50 rounded-lg dark:bg-gray-800 dark:text-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 dark:focus:border-green-400 dark:focus:ring-green-400/20"
                  >
                    <option value="all">{t("Tous prix", "All prices")}</option>
                    <option value="low">{t("35 CFA/h et moins", "35 CFA/h and less")}</option>
                    <option value="medium">{t("35-45 CFA/h", "35-45 CFA/h")}</option>
                    <option value="high">{t("45 CFA/h et plus", "45 CFA/h and more")}</option>
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
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                            {instructor.name?.charAt(0) || "?"}
                          </div>
                          {instructor.online && (
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-background"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-foreground truncate">
                              {instructor.name || "Instructeur"}
                            </h3>
                            {instructor.verified && (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium text-foreground">{instructor.rating || "0"}</span>
                              <span className="text-sm text-muted-foreground">({instructor.reviews || 0})</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{instructor.location || "Non spécifié"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Specialities */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {instructor.specialities?.slice(0, 2).map((speciality: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {speciality}
                          </Badge>
                        ))}
                        {instructor.specialities?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{instructor.specialities.length - 2}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-foreground">{instructor.completedSessions || 0}</div>
                          <div className="text-xs text-muted-foreground">{t("Sessions", "Sessions")}</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-foreground">{instructor.reviews || 0}</div>
                          <div className="text-xs text-muted-foreground">{t("Avis", "Reviews")}</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-foreground">{instructor.responseTime || "—"}</div>
                          <div className="text-xs text-muted-foreground">{t("Réponse", "Response")}</div>
                        </div>
                      </div>
                    </div>

                    {/* Instructor Footer */}
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-bold text-foreground">{instructor.hourlyRate || 0} CFA/h</span>
                        </div>
                        <Badge
                          variant={instructor.online ? "default" : "secondary"}
                          className={instructor.online ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : ""}
                        >
                          {instructor.online ? t("En ligne", "Online") : t("Hors ligne", "Offline")}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {t("Message", "Message")}
                        </Button>
                        <Button 
                          className="flex-1 gap-2 bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black"
                        >
                          <Calendar className="h-4 w-4" />
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

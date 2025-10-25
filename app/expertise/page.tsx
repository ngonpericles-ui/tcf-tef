"use client"

import { useState, useEffect, useCallback } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Brain,
  Clock,
  User,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Users,
  MessageCircle,
  Calendar,
  Star,
  Search,
  Loader2,
  FileText,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Upload,
  Mic,
  Video,
  Image as ImageIcon,
  X
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"
import { apiClient } from "@/lib/api-client"

interface AIFeedback {
  id: string
  studentId: string
  studentName: string
  testType: 'TCF' | 'TEF' | 'PRACTICE'
  section: 'ORAL' | 'WRITTEN' | 'LISTENING' | 'READING'
  submissionDate: string
  status: 'ai_completed' | 'pending_human' | 'human_completed'
  aiScore: number
  aiConfidence: number
  aiComments: string
  humanReviewer?: string
  humanScore?: number
  humanComments?: string
  mediaUrl?: string
  mediaType?: 'audio' | 'video' | 'image' | 'document'
  cloudinaryUrl?: string
  subject?: string
  submittedText?: string
  aiFeedback?: string
  humanFeedback?: string
  reviewedBy?: string
  detailedFeedback: {
    strengths: string[]
    weaknesses: string[]
    suggestions: string[]
    grammarErrors: Array<{
      error: string
      correction: string
      explanation: string
    }>
    pronunciationNotes?: Array<{
      word: string
      issue: string
      improvement: string
    }>
  }
}

export default function ExpertisePage() {
  const { lang } = useLang()
  const { user, isAuthenticated } = useAuth()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // State management
  const [feedbacks, setFeedbacks] = useState<AIFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFeedback, setSelectedFeedback] = useState<AIFeedback | null>(null)
  const [showReviewerSelection, setShowReviewerSelection] = useState(false)
  const [selectedReviewer, setSelectedReviewer] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [availableReviewers, setAvailableReviewers] = useState<any[]>([])
  const [success, setSuccess] = useState<string | null>(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  // Load AI feedbacks from backend
  useEffect(() => {
    const loadFeedbacks = async () => {
      if (!isAuthenticated || !user) return

      try {
        setLoading(true)
        setError(null)

        const response = await apiClient.get('/ai/feedbacks', {
          params: {
            studentId: user.id,
            includeMedia: true
          }
        })

        if (response.success && response.data) {
          const responseData = response.data as any
          const feedbackData = Array.isArray(responseData) ? responseData :
                              Array.isArray(responseData.feedbacks) ? responseData.feedbacks : []

          // Transform data to match interface
          const transformedFeedbacks: AIFeedback[] = feedbackData.map((item: any) => ({
            id: item.id,
            studentId: item.studentId,
            studentName: item.studentName || `${user.firstName} ${user.lastName}`,
            testType: item.testType || 'PRACTICE',
            section: item.section || 'ORAL',
            submissionDate: item.submissionDate || item.createdAt,
            status: item.status || 'ai_completed',
            aiScore: item.aiScore || 0,
            aiConfidence: item.aiConfidence || 0,
            aiComments: item.aiComments || '',
            humanReviewer: item.humanReviewer,
            humanScore: item.humanScore,
            humanComments: item.humanComments,
            mediaUrl: item.mediaUrl,
            mediaType: item.mediaType,
            cloudinaryUrl: item.cloudinaryUrl,
            subject: item.subject || `${item.testType} - ${item.section}`,
            submittedText: item.submittedText || '',
            aiFeedback: item.aiFeedback || item.aiComments || '',
            humanFeedback: item.humanFeedback || item.humanComments || '',
            reviewedBy: item.reviewedBy || item.humanReviewer || '',
            detailedFeedback: item.detailedFeedback || {
              strengths: [],
              weaknesses: [],
              suggestions: [],
              grammarErrors: [],
              pronunciationNotes: []
            }
          }))

          setFeedbacks(transformedFeedbacks)
        }
      } catch (error) {
        console.error('Error loading AI feedbacks:', error)
        setError(t("Erreur lors du chargement des retours IA", "Error loading AI feedback"))
      } finally {
        setLoading(false)
      }
    }

    loadFeedbacks()
  }, [isAuthenticated, user, t, reloadTrigger])

  // Filter feedbacks based on search and filters
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = feedback.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.section.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || feedback.status === filterStatus
    const matchesType = filterType === "all" || feedback.testType === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: string) => {
    const badges = {
      ai_completed: { label: "IA Terminé", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle },
      pending_human: { label: "Révision en cours", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: Clock },
      human_completed: { label: "Révisé par expert", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: Users }
    }
    return badges[status as keyof typeof badges] || badges.ai_completed
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600 dark:text-green-400"
    if (confidence >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const handleMoreClick = (feedback: AIFeedback) => {
    setSelectedFeedback(feedback)
  }

  // Old function removed - using the new one below

  const handleDownloadMedia = async (feedback: AIFeedback) => {
    if (!feedback.cloudinaryUrl && !feedback.mediaUrl) return

    try {
      const url = feedback.cloudinaryUrl || feedback.mediaUrl
      const link = document.createElement('a')
      link.href = url!
      link.download = `feedback-${feedback.id}-media`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading media:', error)
      setError(t("Erreur lors du téléchargement", "Error downloading media"))
    }
  }

  const handleViewMedia = (feedback: AIFeedback) => {
    if (!feedback.cloudinaryUrl && !feedback.mediaUrl) return

    const url = feedback.cloudinaryUrl || feedback.mediaUrl
    window.open(url, '_blank')
  }

  const refreshFeedbacks = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/ai/feedbacks', {
        params: {
          studentId: user?.id,
          includeMedia: true
        }
      })

      if (response.success && response.data) {
        const responseData = response.data as any
        const feedbackData = Array.isArray(responseData) ? responseData :
                            Array.isArray(responseData.feedbacks) ? responseData.feedbacks : []

        const transformedFeedbacks: AIFeedback[] = feedbackData.map((item: any) => ({
          id: item.id,
          studentId: item.studentId,
          studentName: item.studentName || `${user?.firstName} ${user?.lastName}`,
          testType: item.testType || 'PRACTICE',
          section: item.section || 'ORAL',
          submissionDate: item.submissionDate || item.createdAt,
          status: item.status || 'ai_completed',
          aiScore: item.aiScore || 0,
          aiConfidence: item.aiConfidence || 0,
          aiComments: item.aiComments || '',
          humanReviewer: item.humanReviewer,
          humanScore: item.humanScore,
          humanComments: item.humanComments,
          mediaUrl: item.mediaUrl,
          mediaType: item.mediaType,
          cloudinaryUrl: item.cloudinaryUrl,
          detailedFeedback: item.detailedFeedback || {
            strengths: [],
            weaknesses: [],
            suggestions: [],
            grammarErrors: [],
            pronunciationNotes: []
          }
        }))

        setFeedbacks(transformedFeedbacks)
      }
    } catch (error) {
      console.error('Error refreshing feedbacks:', error)
      setError(t("Erreur lors du rafraîchissement", "Error refreshing data"))
    } finally {
      setLoading(false)
    }
  }

  // Submit feedback for human review
  const handleSubmitForReview = async () => {
    if (!selectedFeedback) return

    try {
      setError(null)
      const response = await apiClient.post(`/ai/feedback/${selectedFeedback.id}/submit-for-review`)
      if (response.success) {
        setSuccess(t("Feedback soumis pour révision humaine", "Feedback submitted for human review"))
        setReloadTrigger(prev => prev + 1) // Trigger reload
      } else {
        setError(t("Erreur lors de la soumission", "Error submitting for review"))
      }
    } catch (error) {
      console.error('Error submitting for review:', error)
      setError(t("Erreur lors de la soumission", "Error submitting for review"))
    }
  }

  // Handle reviewer selection
  const handleReviewerSelect = (reviewer: any) => {
    setSelectedReviewer(reviewer)
  }

  // Check if feedback can be submitted (90%+ confidence and not 100% gradable)
  const canSubmitFeedback = (feedback: AIFeedback) => {
    return feedback.aiConfidence >= 0.9 && feedback.status === 'pending_human'
  }

  // Confirm submission to selected reviewer
  const handleConfirmSubmission = async () => {
    if (!selectedFeedback || !selectedReviewer) return

    // Validate submission criteria
    if (!canSubmitFeedback(selectedFeedback)) {
      setError(t(
        "Ce feedback ne peut pas être soumis. Il doit avoir une confiance IA ≥90% et nécessiter une révision humaine.",
        "This feedback cannot be submitted. It must have AI confidence ≥90% and require human review."
      ))
      return
    }

    try {
      setError(null)
      const response = await apiClient.post(`/ai/feedback/${selectedFeedback.id}/submit-for-review`, {
        selectedTutorId: selectedReviewer.id,
        message: t(
          "Demande de révision pour ce feedback IA avec confiance élevée.",
          "Review request for this high-confidence AI feedback."
        )
      })
      if (response.success) {
        setSuccess(t("Feedback soumis au tuteur avec succès", "Feedback submitted to tutor successfully"))
        setShowReviewerSelection(false)
        setSelectedReviewer(null)
        setReloadTrigger(prev => prev + 1) // Trigger reload
      } else {
        setError(t("Erreur lors de la soumission", "Error submitting feedback"))
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setError(t("Erreur lors de la soumission", "Error submitting feedback"))
    }
  }

  return (
    <PageShell>
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-background py-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <Badge className="mb-6 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-4 py-2 text-sm font-semibold">
              <Brain className="h-4 w-4 mr-2" />
              {t("CORRECTION INTELLIGENTE", "SMART CORRECTION")}
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
              {t("Mes Feedbacks", "My Feedbacks")} <br />
              <span className="text-green-600 dark:text-green-400">IA + Humains</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              {t(
                "Tous vos feedbacks IA sont ici. L'IA corrige 80% automatiquement, les cas complexes sont envoyés à nos experts humains.",
                "All your AI feedbacks are here. AI corrects 80% automatically, complex cases are sent to our human experts."
              )}
            </p>

            {/* Comment ça marche - Explication textuelle */}
            <div className="max-w-4xl mx-auto mb-16">
              <h3 className="text-2xl font-bold text-foreground mb-8">Comment ça marche :</h3>
              <div className="text-left space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">1. IA Instantanée</h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    L'intelligence artificielle analyse votre texte en temps réel et corrige automatiquement 80% des erreurs : 
                    grammaire, orthographe, syntaxe, conjugaison. Cette première correction est instantanée et gratuite.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">2. Révision Humaine</h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Pour les 20% de cas complexes (nuances stylistiques, expressions idiomatiques, contexte culturel), 
                    le système envoie automatiquement votre texte à nos experts humains certifiés. Vous recevez une 
                    notification "Envoyé pour révision humaine".
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">3. Résultat Final</h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Vous recevez une correction complète sous 24h maximum, combinant la rapidité de l'IA et 
                    l'expertise humaine. Le système apprend de chaque correction pour s'améliorer continuellement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-6">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="bg-card rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-800/50">
              <div className="flex flex-col lg:flex-row gap-6 items-center">
                {/* Search */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder={t("Rechercher un feedback...", "Search feedback...")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-800/50 rounded-lg dark:bg-gray-800 dark:text-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 dark:focus:border-green-400 dark:focus:ring-green-400/20"
                  />
                </div>

                {/* Status Filter */}
                <div className="w-full lg:w-auto">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full lg:w-auto px-4 py-3 border border-gray-200 dark:border-gray-800/50 rounded-lg dark:bg-gray-800 dark:text-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 dark:focus:border-green-400 dark:focus:ring-green-400/20"
                  >
                    <option value="all">{t("Tous les statuts", "All statuses")}</option>
                    <option value="ai_completed">IA Terminé</option>
                    <option value="pending_human">Révision en cours</option>
                    <option value="human_completed">Révisé par expert</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div className="w-full lg:w-auto">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full lg:w-auto px-4 py-3 border border-gray-200 dark:border-gray-800/50 rounded-lg dark:bg-gray-800 dark:text-white focus:border-green-500 focus:ring-1 focus:ring-green-500/20 dark:focus:border-green-400 dark:focus:ring-green-400/20"
                  >
                    <option value="all">{t("Tous les types", "All types")}</option>
                    <option value="TCF">TCF</option>
                    <option value="TEF">TEF</option>
                    <option value="PRACTICE">Pratique</option>
                  </select>
                </div>

                {/* Refresh Button */}
                <div className="w-full lg:w-auto">
                  <Button
                    onClick={refreshFeedbacks}
                    disabled={loading}
                    variant="outline"
                    className="w-full lg:w-auto flex items-center space-x-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>{t("Actualiser", "Refresh")}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feedbacks Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
                {t("Vos Feedbacks", "Your Feedbacks")}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {t(
                  "Consultez tous vos feedbacks IA et soumettez les cas complexes pour révision humaine",
                  "View all your AI feedbacks and submit complex cases for human review"
                )}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">{t("Chargement des feedbacks...", "Loading feedbacks...")}</span>
              </div>
            ) : filteredFeedbacks.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredFeedbacks.map((feedback) => {
                  const statusBadge = getStatusBadge(feedback.status)
                  const StatusIcon = statusBadge.icon
                  
                  return (
                    <div key={feedback.id} className="bg-card rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800/30 hover:shadow-lg transition-all duration-300 group">
                      <div className="flex items-start justify-between mb-4">
                        <Badge className={`${statusBadge.color} text-xs font-medium flex items-center gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusBadge.label}
                        </Badge>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {feedback.testType} - {feedback.section}
                        </h3>
                        
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                          {feedback.aiComments?.substring(0, 100)}...
                        </p>
                        
                        {/* Métadonnées */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(feedback.submissionDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Brain className="h-3 w-3" />
                            <span className={getConfidenceColor(feedback.aiConfidence)}>
                              {feedback.aiConfidence}% confiance
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {feedback.aiScore}/100
                          </div>
                        </div>
                        
                        {/* Action */}
                        <Button 
                          onClick={() => handleMoreClick(feedback)}
                          className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 flex items-center justify-center gap-2"
                          size="sm"
                        >
                          {t("Voir plus", "See more")}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                  <Brain className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {t("Aucun feedback disponible", "No feedback available")}
                </h3>
                <p className="text-muted-foreground">
                  {t("Vos feedbacks IA apparaîtront ici après avoir passé des tests", "Your AI feedbacks will appear here after taking tests")}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Modal détail feedback */}
        {selectedFeedback && (
          <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedFeedback.subject}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Texte soumis - Preview complet */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Réponse complète soumise :</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedFeedback.submittedText}</p>
                  </div>
                </div>

                {/* Feedback IA */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-green-600" />
                    Feedback IA (Confiance: <span className={getConfidenceColor(selectedFeedback.aiConfidence)}>{selectedFeedback.aiConfidence}%</span>)
                  </h4>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800/30">
                    <p className="text-gray-700 dark:text-gray-300">{selectedFeedback.aiFeedback}</p>
                  </div>
                </div>

                {/* Feedback humain si disponible */}
                {selectedFeedback.humanFeedback && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      Feedback Expert ({selectedFeedback.reviewedBy})
                    </h4>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30">
                      <p className="text-gray-700 dark:text-gray-300">{selectedFeedback.humanFeedback}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  {canSubmitFeedback(selectedFeedback) ? (
                    <Button onClick={handleSubmitForReview} className="bg-blue-600 hover:bg-blue-700">
                      <Users className="h-4 w-4 mr-2" />
                      {t("Soumettre à un tuteur", "Submit to Tutor")}
                    </Button>
                  ) : selectedFeedback.aiConfidence < 0.9 ? (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {t(
                          "Confiance IA insuffisante (< 90%) pour soumettre à un tuteur.",
                          "AI confidence too low (< 90%) to submit to tutor."
                        )}
                      </p>
                    </div>
                  ) : selectedFeedback.status === 'ai_completed' ? (
                    <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        {t(
                          "L'IA a pu évaluer ce travail à 100%. Aucune révision humaine nécessaire.",
                          "AI was able to grade this work to 100%. No human review needed."
                        )}
                      </p>
                    </div>
                  ) : null}
                  
                  <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
                    Fermer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal sélection encadreur */}
        {showReviewerSelection && (
          <Dialog open={showReviewerSelection} onOpenChange={() => setShowReviewerSelection(false)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Choisir un encadreur</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Sélectionnez un expert pour réviser votre texte :
                </p>
                
                {availableReviewers.map((reviewer) => (
                  <div 
                    key={reviewer.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedReviewer?.id === reviewer.id 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 dark:border-gray-800/30 hover:border-gray-300 dark:hover:border-gray-700/50'
                    } ${!reviewer.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => reviewer.available && handleReviewerSelect(reviewer)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{reviewer.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{reviewer.specialty}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs">{reviewer.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">{reviewer.responseTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {reviewer.available ? (
                          <Badge className="bg-green-100 text-green-800">Disponible</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Occupé</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleConfirmSubmission}
                    disabled={!selectedReviewer}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Confirmer la soumission
                  </Button>
                  <Button variant="outline" onClick={() => setShowReviewerSelection(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </PageShell>
  )
}
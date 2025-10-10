"use client"

import { useState, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  FileText,
  User,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Star,
  Calendar,
  Loader2,
  Eye,
  Send
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import { toast } from "sonner"

interface ReviewRequest {
  id: string
  status: string
  requestType: string
  message: string
  response?: string
  createdAt: string
  updatedAt: string
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
  }
  tutor: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  feedback: {
    id: string
    submissionType: string
    aiScore: number
    maxScore: number
    aiConfidence: number
    overallFeedback: string
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    createdAt: string
  }
}

export default function AdminReviewRequestsPage() {
  const { lang } = useLang()
  const { user } = useAuth()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<ReviewRequest | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [responseMessage, setResponseMessage] = useState("")
  const [humanFeedback, setHumanFeedback] = useState("")
  const [humanScore, setHumanScore] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchReviewRequests()
  }, [])

  const fetchReviewRequests = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/admin/review-requests')
      if (response.success) {
        setReviewRequests(response.data)
      } else {
        setError('Failed to load review requests')
      }
    } catch (err: any) {
      console.error('Error fetching review requests:', err)
      setError(err.message || 'Failed to load review requests')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (requestId: string, action: 'accept' | 'reject' | 'complete') => {
    setSubmitting(true)
    try {
      const payload: any = {
        action,
        response: responseMessage
      }

      if (action === 'complete') {
        payload.humanFeedback = humanFeedback
        payload.humanScore = humanScore
      }

      const response = await apiClient.post(`/admin/review-requests/${requestId}/action`, payload)
      
      if (response.success) {
        toast.success(t(
          `Demande ${action === 'accept' ? 'acceptée' : action === 'reject' ? 'rejetée' : 'complétée'} avec succès`,
          `Request ${action}ed successfully`
        ))
        
        // Refresh the list
        await fetchReviewRequests()
        
        // Close dialogs and reset form
        setShowResponseDialog(false)
        setResponseMessage("")
        setHumanFeedback("")
        setHumanScore(0)
        setSelectedRequest(null)
      } else {
        toast.error(t("Erreur lors du traitement de la demande", "Error processing request"))
      }
    } catch (err: any) {
      console.error('Error handling request:', err)
      toast.error(t("Erreur lors du traitement de la demande", "Error processing request"))
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">En attente</Badge>
      case 'accepted':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Acceptée</Badge>
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600">Complétée</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejetée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-lg">
            {t("Chargement des demandes...", "Loading requests...")}
          </span>
        </div>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell>
        <div className="text-center py-20">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">{t("Erreur", "Error")}</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchReviewRequests} className="mt-4">
            {t("Réessayer", "Retry")}
          </Button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {t("Demandes de révision", "Review Requests")}
          </h1>
          <p className="text-muted-foreground">
            {t(
              "Gérez les demandes de révision humaine des feedbacks IA",
              "Manage human review requests for AI feedbacks"
            )}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {reviewRequests.filter(r => r.status === 'PENDING').length}
                  </p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {reviewRequests.filter(r => r.status === 'COMPLETED').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Complétées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {reviewRequests.filter(r => r.status === 'REJECTED').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Rejetées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{reviewRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review Requests List */}
        <div className="space-y-4">
          {reviewRequests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {t("Aucune demande de révision", "No review requests")}
                </h3>
                <p className="text-muted-foreground">
                  {t("Les demandes de révision apparaîtront ici", "Review requests will appear here")}
                </p>
              </CardContent>
            </Card>
          ) : (
            reviewRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <User className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold">
                          {request.student.firstName} {request.student.lastName}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Type de soumission</p>
                          <p className="font-medium">{request.feedback.submissionType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Score IA</p>
                          <p className="font-medium">
                            {request.feedback.aiScore}/{request.feedback.maxScore} 
                            ({Math.round((request.feedback.aiScore / request.feedback.maxScore) * 100)}%)
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Confiance IA</p>
                          <p className="font-medium">{Math.round(request.feedback.aiConfidence * 100)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Date de demande</p>
                          <p className="font-medium">
                            {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        <strong>Message:</strong> {request.message}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request)
                          setShowDetailsDialog(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                      
                      {request.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAction(request.id, 'accept')}
                            disabled={submitting}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accepter
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(request.id, 'reject')}
                            disabled={submitting}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                        </>
                      )}
                      
                      {request.status === 'ACCEPTED' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowResponseDialog(true)
                          }}
                          disabled={submitting}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Compléter
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails du feedback IA</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Étudiant</h4>
                    <p>{selectedRequest.student.firstName} {selectedRequest.student.lastName}</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.student.email}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Score IA</h4>
                    <p className="text-2xl font-bold">
                      {selectedRequest.feedback.aiScore}/{selectedRequest.feedback.maxScore}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Confiance: {Math.round(selectedRequest.feedback.aiConfidence * 100)}%
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Feedback général</h4>
                  <p className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    {selectedRequest.feedback.overallFeedback}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">Points forts</h4>
                    <ul className="space-y-1">
                      {selectedRequest.feedback.strengths.map((strength, index) => (
                        <li key={index} className="text-sm">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">Points à améliorer</h4>
                    <ul className="space-y-1">
                      {selectedRequest.feedback.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm">• {weakness}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-blue-600">Recommandations</h4>
                  <ul className="space-y-1">
                    {selectedRequest.feedback.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Response Dialog */}
        <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Compléter la révision</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Score humain (0-100)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={humanScore}
                  onChange={(e) => setHumanScore(Number(e.target.value))}
                  placeholder="Score final après révision humaine"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Feedback humain
                </label>
                <Textarea
                  value={humanFeedback}
                  onChange={(e) => setHumanFeedback(e.target.value)}
                  placeholder="Votre analyse et feedback détaillé..."
                  rows={6}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Message de réponse (optionnel)
                </label>
                <Textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Message pour l'étudiant..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowResponseDialog(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => selectedRequest && handleAction(selectedRequest.id, 'complete')}
                  disabled={submitting || !humanFeedback.trim() || humanScore === 0}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Compléter la révision
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  )
}

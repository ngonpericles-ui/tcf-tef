"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Clock, 
  Target, 
  BookOpen, 
  Users, 
  Star,
  Play,
  Lock,
  CheckCircle,
  AlertTriangle,
  Volume2,
  FileText,
  Zap
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface SimulationSection {
  name: string
  duration: number
  questionCount: number
  hasAudio: boolean
  description: string
}

interface Simulation {
  id: string
  title: string
  description: string
  level: string
  duration: number
  totalQuestions: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  type: 'PRACTICE' | 'OFFICIAL' | 'MOCK'
  requiredTier: 'FREE' | 'ESSENTIAL' | 'PREMIUM' | 'PRO'
  sections: SimulationSection[]
  averageScore?: number
  completionCount?: number
  rating?: number
  tags: string[]
  instructions: string[]
  requirements: string[]
  createdBy: string
  createdAt: string
}

interface SimulationPreviewModalProps {
  simulation: Simulation | null
  isOpen: boolean
  onClose: () => void
  userTier: string
  onStart?: (simulationId: string) => void
}

export default function SimulationPreviewModal({
  simulation,
  isOpen,
  onClose,
  userTier,
  onStart
}: SimulationPreviewModalProps) {
  const router = useRouter()
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const [isStarting, setIsStarting] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [fullscreenAgreed, setFullscreenAgreed] = useState(false)

  if (!simulation) return null

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600'
      case 'MEDIUM': return 'text-yellow-600'
      case 'HARD': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'default'
      case 'MEDIUM': return 'secondary'
      case 'HARD': return 'destructive'
      default: return 'outline'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PRACTICE': return <BookOpen className="w-4 h-4" />
      case 'OFFICIAL': return <Target className="w-4 h-4" />
      case 'MOCK': return <Zap className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const isAccessible = () => {
    const tierHierarchy = ['FREE', 'ESSENTIAL', 'PREMIUM', 'PRO']
    const userTierIndex = tierHierarchy.indexOf(userTier)
    const requiredTierIndex = tierHierarchy.indexOf(simulation.requiredTier)
    return userTierIndex >= requiredTierIndex
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}min`
    }
    return `${mins}min`
  }

  const handleStartSimulation = async () => {
    if (!agreedToTerms || !fullscreenAgreed) {
      toast.error(t("Veuillez accepter les conditions", "Please accept the terms"))
      return
    }

    setIsStarting(true)
    try {
      const response = await apiClient.post(`/simulations/${simulation.id}/start`)
      if (response.data.success) {
        const sessionId = response.data.data.sessionId
        if (onStart) {
          onStart(simulation.id)
        } else {
          router.push(`/tcf-tef-simulation/exam-runner/${sessionId}`)
        }
        onClose()
      }
    } catch (error) {
      console.error('Error starting simulation:', error)
      toast.error(t("Erreur lors du démarrage", "Error starting simulation"))
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold mb-2">{simulation.title}</DialogTitle>
              <DialogDescription className="text-base">
                {simulation.description}
              </DialogDescription>
            </div>
            
            <div className="flex flex-col items-end gap-2 ml-4">
              <Badge variant={getDifficultyBadge(simulation.difficulty)}>
                {t(
                  simulation.difficulty === 'EASY' ? 'Facile' : 
                  simulation.difficulty === 'MEDIUM' ? 'Moyen' : 'Difficile',
                  simulation.difficulty
                )}
              </Badge>
              
              <Badge variant="outline" className="flex items-center gap-1">
                {getTypeIcon(simulation.type)}
                {t(
                  simulation.type === 'PRACTICE' ? 'Entraînement' :
                  simulation.type === 'OFFICIAL' ? 'Officiel' : 'Simulation',
                  simulation.type
                )}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="font-semibold">{formatDuration(simulation.duration)}</div>
              <div className="text-sm text-muted-foreground">{t("Durée", "Duration")}</div>
            </div>
            
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="font-semibold">{simulation.level}</div>
              <div className="text-sm text-muted-foreground">{t("Niveau", "Level")}</div>
            </div>
            
            <div className="text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="font-semibold">{simulation.totalQuestions}</div>
              <div className="text-sm text-muted-foreground">{t("Questions", "Questions")}</div>
            </div>
            
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="font-semibold">{simulation.completionCount || 0}</div>
              <div className="text-sm text-muted-foreground">{t("Complétions", "Completions")}</div>
            </div>
          </div>

          {/* Rating and Stats */}
          {(simulation.rating || simulation.averageScore) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {simulation.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="font-semibold">{simulation.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">/5</span>
                    </div>
                  )}
                  
                  {simulation.averageScore && (
                    <div className="text-sm text-muted-foreground">
                      {t("Score moyen:", "Average score:")} <span className="font-semibold">{simulation.averageScore}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sections */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("Sections de l'examen", "Exam Sections")}</h3>
            <div className="space-y-3">
              {simulation.sections.map((section, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{section.name}</h4>
                          {section.hasAudio && (
                            <Volume2 className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold">{formatDuration(section.duration)}</div>
                        <div className="text-sm text-muted-foreground">
                          {section.questionCount} {t("questions", "questions")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tags */}
          {simulation.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">{t("Mots-clés", "Tags")}</h3>
              <div className="flex flex-wrap gap-2">
                {simulation.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div>
            <h3 className="text-lg font-semibold mb-3">{t("Instructions", "Instructions")}</h3>
            <ul className="space-y-2">
              {simulation.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{instruction}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div>
            <h3 className="text-lg font-semibold mb-3">{t("Prérequis", "Requirements")}</h3>
            <ul className="space-y-2">
              {simulation.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Access Control */}
          {!isAccessible() && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-orange-600" />
                  <div>
                    <h4 className="font-semibold text-orange-800">
                      {t("Abonnement requis", "Subscription Required")}
                    </h4>
                    <p className="text-sm text-orange-700">
                      {t(
                        `Cette simulation nécessite un abonnement ${simulation.requiredTier}`,
                        `This simulation requires a ${simulation.requiredTier} subscription`
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms Agreement */}
          {isAccessible() && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  {t(
                    "J'accepte les conditions d'examen et comprends que cette simulation sera chronométrée et surveillée",
                    "I accept the exam conditions and understand that this simulation will be timed and monitored"
                  )}
                </Label>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox
                  id="fullscreen"
                  checked={fullscreenAgreed}
                  onCheckedChange={setFullscreenAgreed}
                />
                <Label htmlFor="fullscreen" className="text-sm leading-relaxed">
                  {t(
                    "J'accepte que l'examen se déroule en mode plein écran et que toute tentative de quitter sera enregistrée",
                    "I agree that the exam will run in fullscreen mode and any attempt to exit will be recorded"
                  )}
                </Label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            {t("Créé par", "Created by")} {simulation.createdBy} • {new Date(simulation.createdAt).toLocaleDateString()}
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              {t("Annuler", "Cancel")}
            </Button>
            
            {isAccessible() ? (
              <Button
                onClick={handleStartSimulation}
                disabled={!agreedToTerms || !fullscreenAgreed || isStarting}
                className="min-w-[120px]"
              >
                {isStarting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t("Démarrage...", "Starting...")}
                  </div>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {t("Commencer", "Start")}
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={() => router.push('/subscription')}>
                {t("Mettre à niveau", "Upgrade")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Label component for checkbox
function Label({ htmlFor, children, className }: { htmlFor: string; children: React.ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  )
}

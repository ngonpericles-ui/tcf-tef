"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import {
  Brain,
  ArrowLeft,
  CheckCircle,
  Clock,
  Video,
  ImageIcon,
  Zap,
  Target,
  Sparkles,
  AlertTriangle,
  File,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ProcessingFile {
  id: string
  name: string
  title: string
  type: string
  size: number
  level: string
  subscription: string
  category: string
  contentType: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  aiAnalysis?: {
    contentType: string
    difficulty: string
    topics: string[]
    suggestedQuestions: number
    estimatedDuration: string
    qualityScore: number
  }
}

export default function AIProcessingPage() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const router = useRouter()
  const [files, setFiles] = useState<ProcessingFile[]>([])
  const [overallProgress, setOverallProgress] = useState(0)
  const [currentPhase, setCurrentPhase] = useState<"analyzing" | "generating" | "optimizing" | "completed">("analyzing")
  const [isProcessing, setIsProcessing] = useState(false)
  const [contentType, setContentType] = useState("")

  useEffect(() => {
    const uploadedFiles = localStorage.getItem("uploadedFiles")
    const type = localStorage.getItem("contentType")

    if (uploadedFiles && type) {
      const parsedFiles = JSON.parse(uploadedFiles)
      setFiles(
        parsedFiles.map((file: any) => ({
          ...file,
          status: "pending",
          progress: 0,
        })),
      )
      setContentType(type)
    } else {
      router.push("/admin/content/create")
    }
  }, [router])

  const startProcessing = async () => {
    setIsProcessing(true)

    const phases = [
      {
        name: "analyzing",
        duration: 4000,
        description: t("Analyse du contenu par IA GPT-5", "Content analysis by GPT-5 AI"),
      },
      {
        name: "generating",
        duration: 5000,
        description: t("Génération de questions et exercices", "Generating questions and exercises"),
      },
      {
        name: "optimizing",
        duration: 3000,
        description: t("Optimisation et finalisation", "Optimization and finalization"),
      },
    ]

    for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
      const phase = phases[phaseIndex]
      setCurrentPhase(phase.name as any)

      // Process each file in this phase
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        setFiles((prev) => prev.map((file, index) => (index === fileIndex ? { ...file, status: "processing" } : file)))

        // Simulate processing time with progress updates
        const steps = 25
        for (let step = 0; step <= steps; step++) {
          await new Promise((resolve) => setTimeout(resolve, phase.duration / steps))

          const progress = (step / steps) * 100
          setFiles((prev) => prev.map((file, index) => (index === fileIndex ? { ...file, progress } : file)))

          // Update overall progress
          const totalSteps = files.length * phases.length * steps
          const currentStep = phaseIndex * files.length * steps + fileIndex * steps + step
          setOverallProgress((currentStep / totalSteps) * 100)
        }

        setFiles((prev) =>
          prev.map((file, index) =>
            index === fileIndex
              ? {
                  ...file,
                  status: "completed",
                  aiAnalysis: {
                    contentType: getContentTypeAnalysis(file.type),
                    difficulty: file.level,
                    topics: generateTopics(file.category),
                    suggestedQuestions: Math.floor(Math.random() * 20) + 10,
                    estimatedDuration: `${Math.floor(Math.random() * 45) + 15} min`,
                    qualityScore: Math.floor(Math.random() * 15) + 85,
                  },
                }
              : file,
          ),
        )
      }
    }

    setCurrentPhase("completed")
    setOverallProgress(100)
    setIsProcessing(false)
  }

  const getContentTypeAnalysis = (fileType: string) => {
    if (fileType.startsWith("video/")) return t("Contenu vidéo interactif", "Interactive video content")
    if (fileType.startsWith("image/")) return t("Support visuel éducatif", "Educational visual support")
    if (fileType.includes("pdf")) return t("Document pédagogique", "Educational document")
    return t("Ressource textuelle", "Text resource")
  }

  const generateTopics = (category: string) => {
    const topicMap: { [key: string]: string[] } = {
      Grammaire: [
        t("Conjugaison", "Conjugation"),
        t("Syntaxe", "Syntax"),
        t("Temps verbaux", "Verb tenses"),
        t("Accord", "Agreement"),
      ],
      Vocabulaire: [
        t("Lexique professionnel", "Professional lexicon"),
        t("Expressions idiomatiques", "Idiomatic expressions"),
        t("Synonymes", "Synonyms"),
      ],
      "Compréhension orale": [
        t("Écoute active", "Active listening"),
        t("Intonation", "Intonation"),
        t("Compréhension globale", "Global comprehension"),
      ],
      "Expression écrite": [
        t("Rédaction", "Writing"),
        t("Structure textuelle", "Text structure"),
        t("Argumentation", "Argumentation"),
      ],
      "TCF/TEF": [
        t("Format officiel", "Official format"),
        t("Stratégies d'examen", "Exam strategies"),
        t("Gestion du temps", "Time management"),
      ],
      Général: [
        t("Culture française", "French culture"),
        t("Communication", "Communication"),
        t("Pratique linguistique", "Language practice"),
      ],
    }
    return (
      topicMap[category] || [
        t("Apprentissage général", "General learning"),
        t("Pratique", "Practice"),
        t("Évaluation", "Assessment"),
      ]
    )
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("video/")) return Video
    if (type.startsWith("image/")) return ImageIcon
    return File
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "processing":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getPhaseDescription = () => {
    switch (currentPhase) {
      case "analyzing":
        return t("L'IA GPT-5 analyse le contenu de vos fichiers...", "GPT-5 AI is analyzing your file content...")
      case "generating":
        return t("Génération de questions et exercices adaptés...", "Generating adapted questions and exercises...")
      case "optimizing":
        return t("Optimisation finale et préparation du contenu...", "Final optimization and content preparation...")
      case "completed":
        return t("Analyse terminée ! Votre contenu est prêt.", "Analysis complete! Your content is ready.")
      default:
        return ""
    }
  }

  const handleContinue = () => {
    const processedData = {
      files: files,
      contentType: contentType,
      processedAt: new Date().toISOString(),
      totalFiles: files.length,
      averageQuality: Math.round(
        files.reduce((acc, file) => acc + (file.aiAnalysis?.qualityScore || 0), 0) / files.length,
      ),
    }

    localStorage.setItem("processedFiles", JSON.stringify(processedData))
    router.push("/admin/content/success")
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              disabled={isProcessing}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("Analyse IA en cours", "AI Analysis in Progress")}
              </h1>
              <p className="text-sm mt-1 text-muted-foreground">{getPhaseDescription()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-500" />
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              GPT-5 {t("Activé", "Enabled")}
            </Badge>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-foreground">
                <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                {t("Progression globale", "Overall Progress")}
              </CardTitle>
              <span className="text-2xl font-bold text-foreground">{Math.round(overallProgress)}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={overallProgress} className="h-3" />

            {/* Phase Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: "analyzing", icon: Brain, label: t("Analyse", "Analysis"), color: "blue" },
                { key: "generating", icon: Zap, label: t("Génération", "Generation"), color: "orange" },
                { key: "optimizing", icon: Target, label: t("Optimisation", "Optimization"), color: "green" },
              ].map((phase) => {
                const PhaseIcon = phase.icon
                const isActive = currentPhase === phase.key
                const isCompleted =
                  ["analyzing", "generating", "optimizing"].indexOf(currentPhase) >
                  ["analyzing", "generating", "optimizing"].indexOf(phase.key)

                return (
                  <div
                    key={phase.key}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg transition-colors border",
                      isActive
                        ? "bg-blue-500/10 border-blue-500/20"
                        : isCompleted
                          ? "bg-green-500/10 border-green-500/20"
                          : "bg-muted border-gray-200 dark:border-gray-700",
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        isActive ? "bg-blue-500/20" : isCompleted ? "bg-green-500/20" : "bg-muted",
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <PhaseIcon className={cn("w-5 h-5", isActive ? "text-blue-500" : "text-muted-foreground")} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{phase.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {isCompleted
                          ? t("Terminé", "Completed")
                          : isActive
                            ? t("En cours", "In progress")
                            : t("En attente", "Pending")}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Files Processing Status */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground">
              {t("Fichiers en traitement", "Files Processing")} ({files.length})
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t("Suivi détaillé de l'analyse de chaque fichier", "Detailed tracking of each file analysis")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type)
              return (
                <div
                  key={file.id}
                  className={cn("flex items-center space-x-4 p-4 rounded-lg border", "border-gray-200 dark:border-gray-700 bg-muted")}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-12 h-12 rounded flex items-center justify-center bg-background">
                      <FileIcon className="w-6 h-6 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate text-foreground">{file.title}</h4>
                        {getStatusIcon(file.status)}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-4 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {file.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {file.subscription}
                          </Badge>
                          <span className="text-muted-foreground">{file.category}</span>
                        </div>

                        {file.status === "processing" && <Progress value={file.progress} className="h-2" />}

                        {file.aiAnalysis && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="font-medium text-foreground">{t("Type:", "Type:")}</span>
                              <p className="text-muted-foreground">{file.aiAnalysis.contentType}</p>
                            </div>
                            <div>
                              <span className="font-medium text-foreground">{t("Questions:", "Questions:")}</span>
                              <p className="text-muted-foreground">{file.aiAnalysis.suggestedQuestions}</p>
                            </div>
                            <div>
                              <span className="font-medium text-foreground">{t("Durée:", "Duration:")}</span>
                              <p className="text-muted-foreground">{file.aiAnalysis.estimatedDuration}</p>
                            </div>
                            <div>
                              <span className="font-medium text-foreground">{t("Qualité:", "Quality:")}</span>
                              <p className="text-green-500 font-medium">{file.aiAnalysis.qualityScore}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!isProcessing && overallProgress === 0 && (
              <Button onClick={startProcessing} className="text-white bg-blue-600 hover:bg-blue-700">
                <Brain className="w-4 h-4 mr-2" />
                {t("Démarrer l'analyse IA", "Start AI Analysis")}
              </Button>
            )}
          </div>

          {currentPhase === "completed" && (
            <Button onClick={handleContinue} className="text-white bg-green-600 hover:bg-green-700">
              {t("Publier le contenu", "Publish Content")}
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* AI Processing Info */}
        <Card className={cn("border-2 border-dashed", "bg-muted border-gray-200 dark:border-gray-700")}>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Brain className="w-8 h-8 text-purple-500" />
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {t("Analyse Intelligente GPT-5", "GPT-5 Intelligent Analysis")}
            </h3>
            <p className="text-sm max-w-2xl mx-auto text-muted-foreground">
              {t(
                "Notre IA analyse profondément vos contenus pour générer automatiquement des questions pertinentes, identifier les concepts clés, et optimiser l'expérience d'apprentissage selon le niveau CECRL.",
                "Our AI deeply analyzes your content to automatically generate relevant questions, identify key concepts, and optimize the learning experience according to CEFR levels.",
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

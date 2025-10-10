"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ReviewSection from "./review-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  FileText,
  Video,
  ImageIcon,
  Zap,
  Brain,
  Target,
  BarChart3,
  Clock,
  Users,
} from "lucide-react"

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  title: string
  level: string
  subscription: string
  category: string
  uploadDate: string
  status: string
  contentType: string
  managerRole?: string
  difficulty?: string
  tags?: string[]
  assignedManagers?: string[]
  publishDate?: string
  priority?: string
  targetAudience?: string[]
}

export default function ManagerProcessPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [contentType, setContentType] = useState("course")
  const [managerRole, setManagerRole] = useState("junior")

  const steps = [
    { name: t("Validation des fichiers", "File Validation"), duration: 2000 },
    { name: t("Analyse IA du contenu", "AI Content Analysis"), duration: 4000 },
    { name: t("Optimisation pédagogique", "Educational Optimization"), duration: 3000 },
    { name: t("Génération des métadonnées", "Metadata Generation"), duration: 2000 },
    { name: t("Préparation pour publication", "Publication Preparation"), duration: 1000 },
  ]

  useEffect(() => {
    // Load data from localStorage
    const storedFiles = localStorage.getItem("uploadedFiles")
    const storedContentType = localStorage.getItem("contentType")
    const storedManagerRole = localStorage.getItem("managerRole")

    if (storedFiles) {
      setUploadedFiles(JSON.parse(storedFiles))
    }
    if (storedContentType) {
      setContentType(storedContentType)
    }
    if (storedManagerRole) {
      setManagerRole(storedManagerRole)
    }

    // Start processing simulation
    let totalDuration = 0
    steps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index)
        setProgress(((index + 1) / steps.length) * 100)
      }, totalDuration)
      totalDuration += step.duration
    })

    // Complete processing
    setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        router.push("/manager/content/success")
      }, 1000)
    }, totalDuration)
  }, [router])

  const getFileIcon = (type: string) => {
    if (type.startsWith("video/")) return Video
    if (type.startsWith("image/")) return ImageIcon
    return FileText
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "senior":
        return "purple"
      case "content":
        return "blue"
      case "junior":
        return "green"
      default:
        return "gray"
    }
  }

  const roleColor = getRoleColor(managerRole)

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Review section extracted to reduce file size and avoid duplicate use client */}
        <ReviewSection />
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("Analyse IA en cours", "AI Analysis in Progress")}
              </h1>
              <p className="text-sm mt-1 text-muted-foreground">
                {t("Traitement intelligent de votre contenu", "Intelligent processing of your content")}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`bg-${roleColor}-500/10 text-${roleColor}-400 border-${roleColor}-500/20`}
          >
            {managerRole === "senior"
              ? t("Senior Manager", "Senior Manager")
              : managerRole === "content"
                ? t("Content Manager", "Content Manager")
                : t("Junior Manager", "Junior Manager")}
          </Badge>
        </div>

        {/* Progress Section */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Brain className="w-5 h-5 mr-2 text-blue-400" />
              {t("Analyse IA GPT-5", "GPT-5 AI Analysis")}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t(
                "Traitement avancé avec intelligence artificielle",
                "Advanced processing with artificial intelligence",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("Progression globale", "Overall Progress")}</span>
                <span className="text-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                    index < currentStep
                      ? "bg-green-500/10 border border-green-500/20"
                      : index === currentStep
                        ? "bg-blue-500/10 border border-blue-500/20"
                        : "bg-muted/50 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : index === currentStep ? (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                  )}
                  <span
                    className={`font-medium ${
                      index < currentStep
                        ? "text-green-400"
                        : index === currentStep
                          ? "text-blue-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.name}
                  </span>
                  {index === currentStep && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 ml-auto">
                      {t("En cours", "Processing")}
                    </Badge>
                  )}
                  {index < currentStep && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 ml-auto">
                      {t("Terminé", "Complete")}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Files Being Processed */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground">
              {t("Fichiers en traitement", "Files Being Processed")} ({uploadedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedFiles.map((file) => {
                const FileIcon = getFileIcon(file.type)
                return (
                  <div
                    key={file.id}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="w-10 h-10 rounded flex items-center justify-center bg-muted">
                      <FileIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.title || file.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{file.level}</span>
                        <span>•</span>
                        <span>{file.subscription}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {progress >= 100 ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis Insights */}
        {currentStep >= 1 && (
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                {t("Insights IA", "AI Insights")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">{t("Niveau détecté", "Detected Level")}</span>
                  </div>
                  <p className="text-foreground font-bold">
                    {uploadedFiles.length > 0 ? uploadedFiles[0].level : "B1"}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("Correspondance: 94%", "Match: 94%")}</p>
                </div>

                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">{t("Score qualité", "Quality Score")}</span>
                  </div>
                  <p className="text-foreground font-bold">
                    {managerRole === "senior" ? "95%" : managerRole === "content" ? "87%" : "78%"}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("Excellent contenu", "Excellent content")}</p>
                </div>

                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-400">
                      {t("Audience estimée", "Estimated Audience")}
                    </span>
                  </div>
                  <p className="text-foreground font-bold">
                    {managerRole === "senior" ? "8.2k" : managerRole === "content" ? "2.4k" : "1.2k"}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("utilisateurs potentiels", "potential users")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-muted-foreground">
                {currentStep < steps.length
                  ? t("Traitement en cours...", "Processing...")
                  : t("Finalisation...", "Finalizing...")}
              </span>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  {t("Temps estimé:", "Estimated time:")} {Math.max(0, 12 - Math.round((progress / 100) * 12))}s
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

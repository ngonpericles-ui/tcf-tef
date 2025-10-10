"use client"

import type React from "react"
import { useState, useCallback, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/language-provider"
import {
  Upload,
  File,
  Video,
  ArrowLeft,
  Plus,
  Settings,
  CheckCircle,
  FileText,
  GraduationCap,
  Edit2,
  Trash2,
  Check,
  X,
  Target,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import apiClient from "@/lib/api-client"

interface UploadedFile {
  id: string
  file: File
  name: string
  type: string
  size: number
  preview?: string
}

interface ManagerRole {
  role: "junior" | "content" | "senior"
  levelRestrictions: string[]
  subscriptionRestrictions: string[]
}

interface BulkSettings {
  title: string
  levels: string[]
  subscription: string
  category: string
}

function ManagerBulkUploadPageContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const contentType = searchParams.get("type") || "course"

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [currentManager, setCurrentManager] = useState<ManagerRole | null>(null)
  const [showUploadAnimation, setShowUploadAnimation] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [uploading, setUploading] = useState(false)
  const [bulkSettings, setBulkSettings] = useState<BulkSettings>({
    title: "",
    levels: [],
    subscription: "",
    category: "",
  })

  // Simulation builder state
  const [simulationConfig, setSimulationConfig] = useState({
    durationMinutes: 90,
    targetLevel: "B1",
    realMode: false,
    sections: [
      { key: "comprehension_orale", labelFr: "Compréhension orale", questions: 20, minutes: 25 },
      { key: "comprehension_ecrite", labelFr: "Compréhension écrite", questions: 20, minutes: 45 },
      { key: "expression_orale", labelFr: "Expression orale", questions: 3, minutes: 10 },
      { key: "expression_ecrite", labelFr: "Expression écrite", questions: 1, minutes: 30 },
      { key: "lexique_structure", labelFr: "Lexique & structure", questions: 20, minutes: 20 },
    ],
  })
  const [simMode, setSimMode] = useState<'simple'|'advanced'>("advanced")
  const [simStep, setSimStep] = useState<1|2>(1)

  // Assessment builder state
  type EvalQuestionType = "mcq" | "true-false" | "short" | "long"
  interface EvalQuestion {
    id: string
    type: EvalQuestionType
    points: number
    fr: { prompt: string; options?: string[] }
    en: { prompt: string; options?: string[] }
    correctIndex?: number
    correctText?: string
  }
  const [evaluationConfig, setEvaluationConfig] = useState({
    title: "",
    timeLimitMinutes: 0,
    randomize: false,
    defaultPoints: 1,
    questions: [] as EvalQuestion[],
    bank: [] as EvalQuestion[],
  })

  // Corrections builder state
  interface CorrectionItem {
    id: string
    question: string
    chosenAnswer: string
    correctAnswer: string
    explanation: string
  }
  const [corrections, setCorrections] = useState<CorrectionItem[]>([])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const roleParam = urlParams.get("role") || localStorage.getItem("managerRole") || "junior"

    const mockManagers = {
      junior: {
        role: "junior" as const,
        levelRestrictions: ["A1", "A2", "B1"], // Junior: A1-B1 only
        subscriptionRestrictions: ["Gratuit", "Essentiel"], // Junior: Gratuit and Essentiel only
      },
      content: {
        role: "content" as const,
        levelRestrictions: ["A1", "A2", "B1", "B2", "C1"],
        subscriptionRestrictions: ["Gratuit", "Essentiel", "Premium"],
      },
      senior: {
        role: "senior" as const,
        levelRestrictions: ["A1", "A2", "B1", "B2", "C1", "C2"], // Senior: A1-C2 full access
        subscriptionRestrictions: ["Gratuit", "Essentiel", "Premium", "Pro+"], // Senior: All subscription tiers
      },
    }

    setCurrentManager(mockManagers[roleParam as keyof typeof mockManagers] || mockManagers.junior)
  }, [])

  // Load question bank for evaluation
  useEffect(() => {
    try {
      const stored = localStorage.getItem("evaluationQuestionBank")
      if (stored) {
        setEvaluationConfig((prev) => ({ ...prev, bank: JSON.parse(stored) }))
      }
    } catch {}
  }, [])

  const saveBank = () => {
    localStorage.setItem("evaluationQuestionBank", JSON.stringify(evaluationConfig.bank))
  }

  const contentTypeConfig = {
    course: {
      title: t("Cours", "Course"),
      description: t("Créez des cours de base pour les niveaux A1-B1", "Create basic courses for A1-B1 levels"),
      icon: FileText,
      color: "blue",
    },
    test: {
      title: t("Test", "Test"),
      description: t(
        "Téléchargez des questions et ressources pour créer un test",
        "Upload questions and resources to create a test",
      ),
      icon: File,
      color: "green",
    },
    "simulation-paper": {
      title: t("Épreuve TCF (mode simple)", "TCF paper (simple mode)"),
      description: t("Uploader un PDF/Word/Audio pour entraînement libre", "Upload PDF/Word/Audio for free practice"),
      icon: FileText,
      color: "orange",
    },
    "simulation-files": {
      title: t("Fichiers Simulation TCF/TEF", "TCF/TEF Simulation Files"),
      description: t("Télécharger des fichiers de simulation pour les étudiants", "Upload simulation files for students"),
      icon: Target,
      color: "cyan",
    },
    "test-corrections": {
      title: t("Corriger TCF/TEF", "Correct TCF/TEF"),
      description: t("Uploader uniquement des corrections TCF/TEF", "Upload TCF/TEF corrections only"),
      icon: GraduationCap,
      color: "orange",
    },
    note: {
      title: t("Note/Document", "Note/Document"),
      description: t("Téléchargez des documents de référence", "Upload reference documents"),
      icon: FileText,
      color: "teal",
    },
    video: {
      title: t("Contenu Vidéo", "Video Content"),
      description: t("Téléchargez des vidéos éducatives", "Upload educational videos"),
      icon: Video,
      color: "pink",
    },
  }

  const currentConfig = contentTypeConfig[contentType as keyof typeof contentTypeConfig] || contentTypeConfig.course

  const handleFileUpload = useCallback((files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    setShowUploadAnimation(true)
    setTimeout(() => setShowUploadAnimation(false), 2000)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFileUpload(files)
      }
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInputClick = () => {
    const fileInput = document.getElementById("file-upload") as HTMLInputElement
    if (fileInput) {
      fileInput.click()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getTotalSize = () => {
    return uploadedFiles.reduce((total, file) => total + file.size, 0)
  }

  const handleContinue = async () => {
    if (uploadedFiles.length === 0) return

    setUploading(true)

    try {
      // Upload each file to the backend
      for (const file of uploadedFiles) {
        const formData = new FormData()
        formData.append('file', file.file)
        formData.append('title', bulkSettings.title || file.name.replace(/\.[^/.]+$/, ""))
        formData.append('description', `Manager uploaded ${contentType} content`)
        formData.append('level', bulkSettings.levels.length > 0 ? bulkSettings.levels[0] : "A1")
        formData.append('subscriptionTier', mapSubscriptionTier(bulkSettings.subscription || "Gratuit"))
        formData.append('category', mapCategory(bulkSettings.category || "GENERAL"))
        formData.append('contentType', mapContentType(contentType))
        formData.append('duration', '60')

        await apiClient.post('/content-management/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }

      // Redirect to content management page
      router.push("/manager/content")
    } catch (error) {
      console.error('Error uploading files:', error)
      alert(t("Erreur lors du téléchargement", "Error uploading files"))
    } finally {
      setUploading(false)
    }
  }

  const mapSubscriptionTier = (subscription: string) => {
    const mapping: { [key: string]: string } = {
      "Gratuit": "FREE",
      "Free": "FREE",
      "Essentiel": "ESSENTIAL",
      "Essential": "ESSENTIAL",
      "Premium": "PREMIUM",
      "Pro": "PRO"
    }
    return mapping[subscription] || "FREE"
  }

  const mapCategory = (category: string) => {
    const mapping: { [key: string]: string } = {
      "Général": "GENERAL",
      "General": "GENERAL",
      "Grammaire": "GRAMMAR",
      "Grammar": "GRAMMAR",
      "Vocabulaire": "VOCABULARY",
      "Vocabulary": "VOCABULARY",
      "Compréhension écrite": "READING",
      "Reading": "READING",
      "Compréhension orale": "LISTENING",
      "Listening": "LISTENING",
      "Expression écrite": "WRITING",
      "Writing": "WRITING",
      "Expression orale": "SPEAKING",
      "Speaking": "SPEAKING"
    }
    return mapping[category] || "GENERAL"
  }

  const mapContentType = (type: string) => {
    const mapping: { [key: string]: string } = {
      "course": "COURSE",
      "test": "TEST",
      "video": "VIDEO",
      "note": "NOTE",
      "simulation": "SIMULATION",
      "test-corrections": "TEST_CORRECTION",
      "simulation-paper": "SIMULATION",
      "simulation-files": "SIMULATION"
    }
    return mapping[type] || "COURSE"
  }

  const handleFileSelect = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles((prev) => [...prev, fileId])
    } else {
      setSelectedFiles((prev) => prev.filter((id) => id !== fileId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(uploadedFiles.map((file) => file.id))
    } else {
      setSelectedFiles([])
    }
  }

  const handleDeleteSelected = () => {
    setUploadedFiles((prev) => prev.filter((file) => !selectedFiles.includes(file.id)))
    setSelectedFiles([])
  }

  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
    setSelectedFiles((prev) => prev.filter((id) => id !== fileId))
  }

  const handleEditFileName = (fileId: string, currentName: string) => {
    setEditingFile(fileId)
    setEditingName(currentName.replace(/\.[^/.]+$/, "")) // Remove extension for editing
  }

  const handleSaveFileName = (fileId: string) => {
    const fileExtension = uploadedFiles
      .find((f) => f.id === fileId)
      ?.name.split(".")
      .pop()
    const newName = editingName + (fileExtension ? `.${fileExtension}` : "")

    setUploadedFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, name: newName } : file)))
    setEditingFile(null)
    setEditingName("")
  }

  const handleCancelEdit = () => {
    setEditingFile(null)
    setEditingName("")
  }

  if (!currentManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  const ConfigIcon = currentConfig.icon

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/manager/content/create")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("Téléchargement en lot", "Bulk Upload")} - {currentConfig.title}
              </h1>
              <p className="text-sm mt-1 text-muted-foreground">{currentConfig.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {contentType === "test-corrections" && (
              <Button onClick={handleFileInputClick} className="bg-blue-600 hover:bg-blue-700 text-white">
                {t("Commencer", "Start")}
              </Button>
            )}
            <Badge variant="secondary" className="bg-green-500/10 text-green-400">
              {uploadedFiles.length} {t("fichiers", "files")}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Area */}
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg text-center transition-colors relative overflow-hidden",
                    "p-24", // Restored larger padding for version 48 design
                    isDragging ? "border-blue-500 bg-blue-500/5" : "border-gray-200 dark:border-gray-700 hover:border-muted-foreground",
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {showUploadAnimation && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                      <div className="bg-green-500/90 text-white rounded-full p-3 transition-opacity duration-300">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                    </div>
                  )}

                  <Upload className="w-12 h-12 mx-auto mb-3 text-foreground" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {t("Glissez-déposez vos fichiers ici", "Drag and drop your files here")}
                  </h3>
                  <p className="text-sm mb-6 text-muted-foreground">
                    {t("Ou cliquez pour sélectionner jusqu'à 20 fichiers", "Or click to select up to 20 files")}
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="*/*"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <div className="flex justify-center">
                    <Button onClick={handleFileInputClick} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("Sélectionner des fichiers", "Select Files")}
                    </Button>
                  </div>
                  <p className="text-xs mt-3 text-muted-foreground">
                    {t(
                      "Formats supportés: PDF, DOC, MP4, MP3, JPG, PNG (Max: 100MB par fichier)",
                      "Supported formats: PDF, DOC, MP4, MP3, JPG, PNG (Max: 100MB per file)",
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Conditional builder areas */}
            {contentType === "simulation" && (
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground">{t("Simulation TCF/TEF", "TCF/TEF Simulation")}</CardTitle>
                    <div className="flex items-center gap-2 text-xs">
                      <Button
                        variant={simMode === 'simple' ? 'default' : 'outline'}
                        size="sm"
                        className={simMode === 'simple' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-gray-200 dark:border-gray-700'}
                        onClick={() => { setSimMode('simple'); setSimStep(1) }}
                      >
                        {t("Uploader épreuve TCF", "Upload TCF paper")}
                      </Button>
                      <Button
                        variant={simMode === 'advanced' ? 'default' : 'outline'}
                        size="sm"
                        className={simMode === 'advanced' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'border-gray-200 dark:border-gray-700'}
                        onClick={() => { setSimMode('advanced'); setSimStep(1) }}
                      >
                        {t("Simulation avancée", "Advanced simulation")}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant={simStep === 1 ? 'default' : 'outline'} className={simStep === 1 ? 'bg-primary text-primary-foreground' : ''}>1. {t("Upload", "Upload")}</Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant={simStep === 2 ? 'default' : 'outline'} className={simStep === 2 ? 'bg-primary text-primary-foreground' : ''}>2. {t("Paramétrage", "Setup")}</Badge>
                  </div>

                  {simStep === 1 && (
                    <div className="flex justify-end">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setSimStep(2)}>
                        {t("Continuer vers le paramétrage", "Continue to setup")}
                      </Button>
                    </div>
                  )}

                  {simStep === 2 && (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-foreground">{t("Durée (minutes)", "Duration (minutes)")}</Label>
                      <Input
                        type="number"
                        value={simulationConfig.durationMinutes}
                        onChange={(e) => setSimulationConfig((p) => ({ ...p, durationMinutes: Number(e.target.value || 0) }))}
                        className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground">{t("Niveau ciblé", "Target level")}</Label>
                      <Select
                        value={simulationConfig.targetLevel}
                        onValueChange={(v) => setSimulationConfig((p) => ({ ...p, targetLevel: v }))}
                      >
                        <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                          {["A1", "A2", "B1", "B2", "C1", "C2"].map((lv) => (
                            <SelectItem key={lv} value={lv} className="text-foreground hover:bg-muted">
                              {lv}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-foreground">
                        <Checkbox
                          checked={simulationConfig.realMode}
                          onCheckedChange={(c) => setSimulationConfig((p) => ({ ...p, realMode: Boolean(c) }))}
                          className="border-gray-200 dark:border-gray-700"
                        />
                        {t("Mode simulation réelle (chronométrée)", "Real exam mode (timed)")}
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">{t("Sections et paramètres", "Sections and parameters")}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {simulationConfig.sections.map((s, idx) => (
                        <div key={s.key} className="p-3 rounded-md border bg-muted space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground">{s.labelFr}</span>
                            <Input
                              type="number"
                              value={s.questions}
                              onChange={(e) => {
                                const val = Number(e.target.value || 0)
                                setSimulationConfig((p) => ({
                                  ...p,
                                  sections: p.sections.map((x, i) => (i === idx ? { ...x, questions: val } : x)),
                                }))
                              }}
                              className="w-24 h-8 bg-input border-gray-200 dark:border-gray-700 text-foreground"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{t("Temps (min)", "Time (min)")}</span>
                            <Input
                              type="number"
                              value={(s as any).minutes}
                              onChange={(e) => {
                                const val = Number(e.target.value || 0)
                                setSimulationConfig((p) => ({
                                  ...p,
                                  sections: p.sections.map((x, i) => (i === idx ? { ...x, minutes: val } as any : x)),
                                }))
                              }}
                              className="w-24 h-8 bg-input border-gray-200 dark:border-gray-700 text-foreground"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  </>
                  )}
                </CardContent>
              </Card>
            )}

            {contentType === "assessment" && (
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("Constructeur d'évaluation", "Assessment Builder")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-foreground">{t("Titre", "Title")}</Label>
                      <Input
                        value={evaluationConfig.title}
                        onChange={(e) => setEvaluationConfig((p) => ({ ...p, title: e.target.value }))}
                        className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground">{t("Limite de temps (min)", "Time limit (min)")}</Label>
                      <Input
                        type="number"
                        value={evaluationConfig.timeLimitMinutes}
                        onChange={(e) => setEvaluationConfig((p) => ({ ...p, timeLimitMinutes: Number(e.target.value || 0) }))}
                        className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-foreground">
                        <Checkbox
                          checked={evaluationConfig.randomize}
                          onCheckedChange={(c) => setEvaluationConfig((p) => ({ ...p, randomize: Boolean(c) }))}
                          className="border-gray-200 dark:border-gray-700"
                        />
                        {t("Questions aléatoires", "Randomize questions")}
                      </label>
                    </div>
                  </div>

                  <div className="p-3 rounded-md border bg-muted">
                    <div className="flex items-center gap-2 mb-3">
                      <Label className="text-foreground">{t("Ajouter une question", "Add question")}</Label>
                      <Select
                        onValueChange={(type) => {
                          const q: EvalQuestion = {
                            id: Math.random().toString(36).slice(2),
                            type: type as EvalQuestionType,
                            points: evaluationConfig.defaultPoints,
                            fr: { prompt: "" },
                            en: { prompt: "" },
                          }
                          if (type === "mcq" || type === "true-false") {
                            q.fr.options = ["", "", "", ""]
                            q.en.options = ["", "", "", ""]
                            q.correctIndex = 0
                          } else {
                            q.correctText = ""
                          }
                          setEvaluationConfig((p) => ({ ...p, questions: [...p.questions, q] }))
                        }}
                      >
                        <SelectTrigger className="h-8 w-48 bg-input border-gray-200 dark:border-gray-700 text-foreground">
                          <SelectValue placeholder={t("Type de question", "Question type")} />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                          <SelectItem value="mcq">QCM</SelectItem>
                          <SelectItem value="true-false">Vrai/Faux</SelectItem>
                          <SelectItem value="short">Réponse courte</SelectItem>
                          <SelectItem value="long">Réponse longue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      {evaluationConfig.questions.map((q, i) => (
                        <div key={q.id} className="p-3 rounded-md border bg-card space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">{q.type.toUpperCase()} • {t("Points", "Points")} {q.points}</Badge>
                            <Button size="sm" variant="ghost" onClick={() => setEvaluationConfig((p) => ({ ...p, questions: p.questions.filter((x) => x.id !== q.id) }))}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <Label className="text-foreground">FR</Label>
                              <Textarea value={q.fr.prompt} onChange={(e) => {
                                const v = e.target.value
                                setEvaluationConfig((p) => ({ ...p, questions: p.questions.map((x) => x.id === q.id ? { ...x, fr: { ...x.fr, prompt: v } } : x) }))
                              }} className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                            </div>
                            <div>
                              <Label className="text-foreground">EN</Label>
                              <Textarea value={q.en.prompt} onChange={(e) => {
                                const v = e.target.value
                                setEvaluationConfig((p) => ({ ...p, questions: p.questions.map((x) => x.id === q.id ? { ...x, en: { ...x.en, prompt: v } } : x) }))
                              }} className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                            </div>
                          </div>
                          {(q.type === "mcq" || q.type === "true-false") && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {(q.fr.options || []).map((_, idx) => (
                                <div key={idx} className="p-2 rounded-md border bg-muted">
                                  <div className="flex items-center gap-2">
                                    <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === idx} onChange={() => setEvaluationConfig((p) => ({ ...p, questions: p.questions.map((x) => x.id === q.id ? { ...x, correctIndex: idx } : x) }))} />
                                    <Input value={q.fr.options?.[idx] || ""} onChange={(e) => {
                                      const v = e.target.value
                                      setEvaluationConfig((p) => ({ ...p, questions: p.questions.map((x) => x.id === q.id ? { ...x, fr: { ...x.fr, options: (x.fr.options || []).map((o, j) => j === idx ? v : o) } } : x) }))
                                    }} placeholder={`FR • ${t("Option", "Option")} ${idx + 1}`} className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                                  </div>
                                  <Input value={q.en.options?.[idx] || ""} onChange={(e) => {
                                    const v = e.target.value
                                    setEvaluationConfig((p) => ({ ...p, questions: p.questions.map((x) => x.id === q.id ? { ...x, en: { ...x.en, options: (x.en.options || []).map((o, j) => j === idx ? v : o) } } : x) }))
                                  }} placeholder={`EN • ${t("Option", "Option")} ${idx + 1}`} className="mt-2 bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                                </div>
                              ))}
                            </div>
                          )}
                          {(q.type === "short" || q.type === "long") && (
                            <div>
                              <Label className="text-foreground">{t("Réponse correcte (texte)", "Correct answer (text)")}</Label>
                              <Input value={q.correctText || ""} onChange={(e) => setEvaluationConfig((p) => ({ ...p, questions: p.questions.map((x) => x.id === q.id ? { ...x, correctText: e.target.value } : x) }))} className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setEvaluationConfig((p) => ({ ...p, bank: [...p.bank, ...p.questions] }))}>{t("Ajouter à la banque", "Add to bank")}</Button>
                      <Button size="sm" variant="outline" className="border-gray-200 dark:border-gray-700" onClick={saveBank}>{t("Sauvegarder la banque", "Save bank")}</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* test-corrections: upload only, no extra builder */}

            {/* Uploaded Files Management Section */}
            {uploadedFiles.length > 0 && (
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center">
                      <File className="w-5 h-5 mr-2" />
                      {t("Fichiers téléchargés", "Uploaded Files")} ({uploadedFiles.length})
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedFiles.length === uploadedFiles.length && uploadedFiles.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="border-gray-200 dark:border-gray-700"
                      />
                      <span className="text-sm text-foreground">{t("Tout sélectionner", "Select All")}</span>
                      {contentType !== "test-corrections" && selectedFiles.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="ml-4">
                          <Trash2 className="w-4 h-4 mr-1" />
                          {t("Supprimer", "Delete")} ({selectedFiles.length})
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        selectedFiles.includes(file.id)
                          ? "bg-blue-500/10 border-blue-500/30"
                          : "bg-muted border-gray-200 dark:border-gray-700 hover:border-muted-foreground",
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedFiles.includes(file.id)}
                          onCheckedChange={(checked) => handleFileSelect(file.id, checked as boolean)}
                          className="border-gray-200 dark:border-gray-700"
                        />
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            {file.type.startsWith("image/") ? (
                              <img
                                src={file.preview || "/placeholder.svg"}
                                alt=""
                                className="w-8 h-8 object-cover rounded"
                              />
                            ) : file.type.startsWith("video/") ? (
                              <Video className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <FileText className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            {editingFile === file.id ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="bg-input border-gray-200 dark:border-gray-700 text-foreground text-sm w-48"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveFileName(file.id)
                                    if (e.key === "Escape") handleCancelEdit()
                                  }}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveFileName(file.id)}
                                  className="text-green-400 hover:text-green-300"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <p className="font-medium text-foreground text-sm">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {editingFile !== file.id && (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditFileName(file.id, file.name)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Paramètres en lot */}
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  {t("Paramètres en lot", "Bulk Settings")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("Appliquez ces paramètres à plusieurs fichiers", "Apply these settings to multiple files")}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Titre par défaut", "Default Title")}</Label>
                  <Input
                    value={bulkSettings.title}
                    onChange={(e) => setBulkSettings((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder={t("Titre pour tous les fichiers sélectionnés", "Title for all selected files")}
                    className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  />
                </div>

                {contentType !== "test-corrections" && (
                  <div className="space-y-2">
                    <Label className="text-foreground">{t("Niveaux par défaut", "Default Levels")}</Label>
                    <div className="space-y-2">
                      {currentManager.levelRestrictions.map((level) => (
                        <div key={level} className="flex items-center space-x-2">
                          <Checkbox
                            id={`level-${level}`}
                            checked={bulkSettings.levels.includes(level)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setBulkSettings((prev) => ({ ...prev, levels: [...prev.levels, level] }))
                              } else {
                                setBulkSettings((prev) => ({ ...prev, levels: prev.levels.filter((l) => l !== level) }))
                              }
                            }}
                            className="border-gray-200 dark:border-gray-700"
                          />
                          <Label htmlFor={`level-${level}`} className="text-sm text-foreground cursor-pointer">
                            {level} - {
                              level === "A1" ? t("Débutant", "Beginner") :
                              level === "A2" ? t("Élémentaire", "Elementary") :
                              level === "B1" ? t("Intermédiaire", "Intermediate") :
                              level === "B2" ? t("Intermédiaire supérieur", "Upper Intermediate") :
                              level === "C1" ? t("Avancé", "Advanced") :
                              t("Maîtrise", "Mastery")
                            }
                          </Label>
                        </div>
                      ))}
                    </div>
                    {bulkSettings.levels.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t("Niveaux sélectionnés", "Selected levels")}: {bulkSettings.levels.join(", ")}
                      </p>
                    )}
                  </div>
                )}

                {contentType !== "test-corrections" && (
                  <div className="space-y-2">
                    <Label className="text-foreground">{t("Abonnement par défaut", "Default Subscription")}</Label>
                    <Select
                      value={bulkSettings.subscription}
                      onValueChange={(value) => setBulkSettings((prev) => ({ ...prev, subscription: value }))}
                    >
                      <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                        <SelectValue placeholder={t("Sélectionner un abonnement", "Select a subscription")} />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                        {currentManager.subscriptionRestrictions.map((sub) => (
                          <SelectItem key={sub} value={sub} className="text-foreground hover:bg-muted">
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-foreground">{t("Catégorie", "Category")}</Label>
                  {contentType === "test-corrections" ? (
                    <Input value="corriger tcf/tef" readOnly className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                  ) : (
                    <Select
                      value={bulkSettings.category}
                      onValueChange={(value) => setBulkSettings((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                        <SelectValue placeholder={t("Sélectionner une catégorie", "Select a category")} />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                        {contentType === "simulation-paper" ? (
                          <>
                            <SelectItem value="Épreuve TCF" className="text-foreground hover:bg-muted">
                              {t("Épreuve TCF", "TCF paper")}
                            </SelectItem>
                            <SelectItem value="Épreuve TEF" className="text-foreground hover:bg-muted">
                              {t("Épreuve TEF", "TEF paper")}
                            </SelectItem>
                            <SelectItem value="Épreuve FLS" className="text-foreground hover:bg-muted">
                              {t("Épreuve FLS", "FLS paper")}
                            </SelectItem>
                            <SelectItem value="Épreuve FLE" className="text-foreground hover:bg-muted">
                              {t("Épreuve FLE", "FLE paper")}
                            </SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="Compréhension écrite" className="text-foreground hover:bg-muted">
                              {t("Compréhension écrite", "Reading Comprehension")}
                            </SelectItem>
                            <SelectItem value="Compréhension orale" className="text-foreground hover:bg-muted">
                              {t("Compréhension orale", "Listening Comprehension")}
                            </SelectItem>
                            <SelectItem value="Expression écrite" className="text-foreground hover:bg-muted">
                              {t("Expression écrite", "Written Expression")}
                            </SelectItem>
                            <SelectItem value="Expression orale" className="text-foreground hover:bg-muted">
                              {t("Expression orale", "Oral Expression")}
                            </SelectItem>
                            <SelectItem value="Vocabulaire" className="text-foreground hover:bg-muted">
                              {t("Vocabulaire", "Vocabulary")}
                            </SelectItem>
                            <SelectItem value="Grammaire" className="text-foreground hover:bg-muted">
                              {t("Grammaire", "Grammar")}
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>


            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Résumé", "Summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("Fichiers totaux", "Total Files")}</span>
                  <span className="font-medium text-foreground">{uploadedFiles.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("Taille totale", "Total Size")}</span>
                  <span className="font-medium text-foreground">{formatFileSize(getTotalSize())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("Type de contenu", "Content Type")}</span>
                  <Badge className={`bg-${currentConfig.color}-500/10 text-${currentConfig.color}-400`}>
                    {currentConfig.title}
                  </Badge>
                </div>
                <Button
                  onClick={handleContinue}
                  disabled={uploadedFiles.length === 0 || uploading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t("Téléchargement...", "Uploading...")}
                    </>
                  ) : (
                    <>
                      {contentType === "test-corrections" ? t("Publier les corrections", "Publish corrections") : t("Télécharger vers le serveur", "Upload to Server")}
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ManagerBulkUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    }>
      <ManagerBulkUploadPageContent />
    </Suspense>
  )
}

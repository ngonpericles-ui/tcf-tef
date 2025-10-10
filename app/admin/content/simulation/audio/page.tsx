"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Upload, Mic, Headphones, CheckCircle, AlertCircle, Loader2, Play, Pause, Volume2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface AudioQuestion {
  id: string
  audioUrl: string
  transcript: string
  question: string
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"
  options?: string[]
  correctAnswer: string
  points: number
  duration: number
}

export default function AdminAudioSimulationPage() {
  const { t } = useLanguage()
  const { user, isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState<"idle" | "uploading" | "transcribing" | "extracting" | "complete" | "error">("idle")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [extractedQuestions, setExtractedQuestions] = useState<AudioQuestion[]>([])
  
  // Simulation configuration
  const [simulationConfig, setSimulationConfig] = useState({
    title: "",
    description: "",
    type: "TCF" as "TCF" | "TEF",
    level: "B1",
    section: "comprehension_orale",
    duration: 30,
    targetTier: "PRO" as "FREE" | "ESSENTIAL" | "PREMIUM" | "PRO",
  })

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push("/admin/login")
    }
  }, [isAuthenticated, isAdmin, router])

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"]
    if (!validTypes.includes(file.type)) {
      alert(t("Veuillez sélectionner un fichier audio (MP3, WAV, OGG)", "Please select an audio file (MP3, WAV, OGG)"))
      return
    }

    setAudioFile(file)
    setProcessingStatus("uploading")
    setUploadProgress(0)

    try {
      // Upload audio to Cloudinary
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", "aura_simulations")
      formData.append("folder", "simulations/audio")
      formData.append("resource_type", "video") // Cloudinary uses 'video' for audio files

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: "POST",
          body: formData,
        }
      )

      if (!cloudinaryResponse.ok) {
        throw new Error("Failed to upload audio")
      }

      const cloudinaryData = await cloudinaryResponse.json()
      setUploadProgress(33)

      // Transcribe audio using AI
      setProcessingStatus("transcribing")
      const transcriptionResponse = await apiClient.post("/simulations/transcribe-audio", {
        audioUrl: cloudinaryData.secure_url,
      })

      if (!transcriptionResponse.success || !transcriptionResponse.data) {
        throw new Error("Failed to transcribe audio")
      }

      setUploadProgress(66)

      // Extract questions from transcript using AI
      setProcessingStatus("extracting")
      const extractionResponse = await apiClient.post("/simulations/extract-audio-questions", {
        audioUrl: cloudinaryData.secure_url,
        transcript: transcriptionResponse.data.transcript,
        simulationType: simulationConfig.type,
        level: simulationConfig.level,
        section: simulationConfig.section,
      })

      if (extractionResponse.success && extractionResponse.data) {
        setExtractedQuestions(extractionResponse.data.questions || [])
        setProcessingStatus("complete")
        setUploadProgress(100)
      } else {
        throw new Error("Failed to extract questions")
      }
    } catch (error) {
      console.error("Error processing audio:", error)
      setProcessingStatus("error")
      alert(t("Erreur lors du traitement de l'audio", "Error processing audio"))
    }
  }

  const handleSaveSimulation = async () => {
    if (!simulationConfig.title || extractedQuestions.length === 0) {
      alert(t("Veuillez remplir tous les champs requis", "Please fill all required fields"))
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.post("/simulations/audio", {
        ...simulationConfig,
        questions: extractedQuestions,
        questionCount: extractedQuestions.length,
        createdById: user?.id,
      })

      if (response.success) {
        alert(t("Simulation audio créée avec succès!", "Audio simulation created successfully!"))
        router.push("/admin/content")
      } else {
        throw new Error("Failed to create audio simulation")
      }
    } catch (error) {
      console.error("Error saving audio simulation:", error)
      alert(t("Erreur lors de la sauvegarde", "Error saving simulation"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("Créateur de Simulation Audio", "Audio Simulation Builder")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t(
                "Créez des simulations de compréhension orale avec extraction AI",
                "Create listening comprehension simulations with AI extraction",
              )}
            </p>
          </div>
          <Badge variant="outline" className="bg-pink-500/10 text-pink-500 border-pink-500/20">
            <Mic className="h-3 w-3 mr-1" />
            {t("Audio AI", "Audio AI")}
          </Badge>
        </div>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">{t("Configuration", "Configuration")}</TabsTrigger>
            <TabsTrigger value="upload">{t("Extraction Audio", "Audio Extraction")}</TabsTrigger>
            <TabsTrigger value="questions">{t("Questions", "Questions")} ({extractedQuestions.length})</TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("Configuration de la Simulation Audio", "Audio Simulation Configuration")}</CardTitle>
                <CardDescription>
                  {t("Définissez les paramètres de base", "Define basic parameters")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t("Titre", "Title")} *</Label>
                    <Input
                      id="title"
                      value={simulationConfig.title}
                      onChange={(e) => setSimulationConfig({ ...simulationConfig, title: e.target.value })}
                      placeholder={t("Ex: Compréhension Orale B1", "Ex: Listening Comprehension B1")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">{t("Type d'examen", "Exam Type")}</Label>
                    <Select
                      value={simulationConfig.type}
                      onValueChange={(value: "TCF" | "TEF") =>
                        setSimulationConfig({ ...simulationConfig, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TCF">TCF</SelectItem>
                        <SelectItem value="TEF">TEF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">{t("Niveau", "Level")}</Label>
                    <Select
                      value={simulationConfig.level}
                      onValueChange={(value) => setSimulationConfig({ ...simulationConfig, level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1</SelectItem>
                        <SelectItem value="A2">A2</SelectItem>
                        <SelectItem value="B1">B1</SelectItem>
                        <SelectItem value="B2">B2</SelectItem>
                        <SelectItem value="C1">C1</SelectItem>
                        <SelectItem value="C2">C2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">{t("Durée (minutes)", "Duration (minutes)")}</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={simulationConfig.duration}
                      onChange={(e) =>
                        setSimulationConfig({ ...simulationConfig, duration: parseInt(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tier">{t("Abonnement requis", "Required Tier")}</Label>
                    <Select
                      value={simulationConfig.targetTier}
                      onValueChange={(value: any) =>
                        setSimulationConfig({ ...simulationConfig, targetTier: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE">{t("Gratuit", "Free")}</SelectItem>
                        <SelectItem value="ESSENTIAL">{t("Essentiel", "Essential")}</SelectItem>
                        <SelectItem value="PREMIUM">Premium</SelectItem>
                        <SelectItem value="PRO">Pro+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("Description", "Description")}</Label>
                  <Textarea
                    id="description"
                    value={simulationConfig.description}
                    onChange={(e) => setSimulationConfig({ ...simulationConfig, description: e.target.value })}
                    placeholder={t("Décrivez la simulation audio...", "Describe the audio simulation...")}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audio Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("Extraction de Questions depuis Audio", "Question Extraction from Audio")}</CardTitle>
                <CardDescription>
                  {t(
                    "Téléchargez un fichier audio et l'IA extraira automatiquement les questions",
                    "Upload an audio file and AI will automatically extract questions",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Headphones className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <Label htmlFor="audio-upload" className="cursor-pointer">
                    <div className="text-lg font-medium mb-2">
                      {audioFile
                        ? audioFile.name
                        : t("Cliquez pour télécharger un fichier audio", "Click to upload an audio file")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("MP3, WAV, OGG - max 100MB", "MP3, WAV, OGG - max 100MB")}
                    </div>
                  </Label>
                  <Input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleAudioUpload}
                  />
                </div>

                {processingStatus !== "idle" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {processingStatus === "uploading" && (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("Téléchargement...", "Uploading...")}
                          </span>
                        )}
                        {processingStatus === "transcribing" && (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("Transcription en cours...", "Transcribing...")}
                          </span>
                        )}
                        {processingStatus === "extracting" && (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("Extraction des questions...", "Extracting questions...")}
                          </span>
                        )}
                        {processingStatus === "complete" && (
                          <span className="text-green-500 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            {t("Extraction terminée!", "Extraction complete!")}
                          </span>
                        )}
                        {processingStatus === "error" && (
                          <span className="text-red-500 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {t("Erreur de traitement", "Processing error")}
                          </span>
                        )}
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                {/* AI Processing Info */}
                <Card className="bg-pink-500/5 border-pink-500/20">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      {t("Traitement IA Audio", "AI Audio Processing")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1 text-muted-foreground">
                    <p>1. {t("Transcription automatique de l'audio", "Automatic audio transcription")}</p>
                    <p>2. {t("Analyse du contenu et du contexte", "Content and context analysis")}</p>
                    <p>3. {t("Génération de questions pertinentes", "Relevant question generation")}</p>
                    <p>4. {t("Création des réponses et options", "Answer and option creation")}</p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("Questions Extraites", "Extracted Questions")}</CardTitle>
                <CardDescription>
                  {t("Vérifiez et modifiez les questions générées", "Review and edit generated questions")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {extractedQuestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Headphones className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t("Aucune question extraite", "No questions extracted")}</p>
                    <p className="text-sm">
                      {t("Téléchargez un fichier audio pour commencer", "Upload an audio file to get started")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <p className="text-lg font-medium text-green-600">
                        {extractedQuestions.length} {t("questions générées", "questions generated")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("Prêt à sauvegarder", "Ready to save")}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            {t("Annuler", "Cancel")}
          </Button>
          <Button onClick={handleSaveSimulation} disabled={loading || extractedQuestions.length === 0}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("Sauvegarder la Simulation Audio", "Save Audio Simulation")}
          </Button>
        </div>
      </div>
    </div>
  )
}


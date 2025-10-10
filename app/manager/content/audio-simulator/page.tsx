"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"
import { Volume2, Play, Pause, Upload, ArrowLeft, Plus, Trash2, FileText, Brain, Mic, Settings, Zap } from "lucide-react"
import apiClient from "@/lib/api-client"
import { toast } from "sonner"

export default function AudioSimulatorPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const basePath = pathname.startsWith("/admin") ? "/admin" : "/manager"

  const [audioFiles, setAudioFiles] = useState<File[]>([])
  const [pdfFiles, setPdfFiles] = useState<File[]>([])
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [vapiConfig, setVapiConfig] = useState<any>(null)
  const [voiceOptions, setVoiceOptions] = useState<any[]>([])
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([])
  const [simulatorConfig, setSimulatorConfig] = useState({
    title: "",
    description: "",
    level: "B1",
    category: "ORAL",
    duration: 420, // 7 minutes default
    voicePreference: "france_female_1",
    questions: []
  })

  // Load VAPI configuration and voice options
  useEffect(() => {
    const loadVapiConfig = async () => {
      try {
        const [configResponse, voicesResponse] = await Promise.all([
          apiClient.get('/voice-simulation/vapi-config'),
          apiClient.get('/voice-simulation/voices')
        ])

        if ((configResponse.data as any)?.success) {
          setVapiConfig((configResponse.data as any).data)
        }

        if ((voicesResponse.data as any)?.success) {
          setVoiceOptions((voicesResponse.data as any).data)
        }
      } catch (error) {
        console.error('Error loading VAPI config:', error)
        toast.error(t("Erreur lors du chargement de la configuration VAPI", "Error loading VAPI configuration"))
      }
    }

    loadVapiConfig()
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const audioFiles = files.filter(file => file.type.startsWith('audio/'))
    setAudioFiles(prev => [...prev, ...audioFiles])
  }

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const pdfFiles = files.filter(file => file.type === 'application/pdf')

    if (pdfFiles.length === 0) {
      toast.error(t("Veuillez sélectionner un fichier PDF", "Please select a PDF file"))
      return
    }

    setPdfFiles(prev => [...prev, ...pdfFiles])

    // Extract questions from PDF
    for (const file of pdfFiles) {
      await extractQuestionsFromPdf(file)
    }
  }

  const extractQuestionsFromPdf = async (file: File) => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('pdf', file)
      formData.append('title', simulatorConfig.title || file.name)
      formData.append('description', simulatorConfig.description || '')
      formData.append('level', simulatorConfig.level)
      formData.append('category', simulatorConfig.category)

      const response = await apiClient.post('/voice-simulation/question-bank/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if ((response.data as any)?.success) {
        const questions = (response.data as any).data.questions || []
        setExtractedQuestions(prev => [...prev, ...questions])
        toast.success(t(
          `${questions.length} questions extraites avec succès`,
          `${questions.length} questions extracted successfully`
        ))
      }
    } catch (error) {
      console.error('Error extracting questions from PDF:', error)
      toast.error(t("Erreur lors de l'extraction des questions", "Error extracting questions"))
    } finally {
      setLoading(false)
    }
  }

  const removeFile = (index: number, type: 'audio' | 'pdf') => {
    if (type === 'audio') {
      setAudioFiles(prev => prev.filter((_, i) => i !== index))
    } else {
      setPdfFiles(prev => prev.filter((_, i) => i !== index))
    }
  }

  const togglePlay = (file: File) => {
    const fileId = file.name + file.size
    if (isPlaying === fileId) {
      setIsPlaying(null)
    } else {
      setIsPlaying(fileId)
    }
  }

  const createVapiSimulation = async () => {
    try {
      setLoading(true)

      if (!simulatorConfig.title || !simulatorConfig.description) {
        toast.error(t("Veuillez remplir tous les champs requis", "Please fill in all required fields"))
        return
      }

      if (extractedQuestions.length === 0) {
        toast.error(t("Veuillez ajouter des questions via un PDF", "Please add questions via PDF upload"))
        return
      }

      // Create VAPI assistant with extracted questions
      const assistantData = {
        name: simulatorConfig.title,
        voice: simulatorConfig.voicePreference,
        questions: extractedQuestions.slice(0, 8), // Limit to 8 questions for 7-minute session
        level: simulatorConfig.level,
        category: simulatorConfig.category
      }

      const response = await apiClient.post('/voice-simulation/create-assistant', assistantData)

      if ((response.data as any)?.success) {
        toast.success(t("Simulation VAPI créée avec succès", "VAPI simulation created successfully"))

        // Reset form
        setSimulatorConfig({
          title: "",
          description: "",
          level: "B1",
          category: "ORAL",
          duration: 420,
          voicePreference: "france_female_1",
          questions: []
        })
        setExtractedQuestions([])
        setPdfFiles([])
        setAudioFiles([])
      }
    } catch (error) {
      console.error('Error creating VAPI simulation:', error)
      toast.error(t("Erreur lors de la création de la simulation", "Error creating simulation"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="border-gray-200 dark:border-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t("Simulateur Audio", "Audio Simulator")}</h1>
                <p className="text-muted-foreground">{t("Créer des exercices audio interactifs", "Create interactive audio exercises")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration */}
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-foreground">{t("Configuration", "Configuration")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">{t("Titre", "Title")}</Label>
                <Input
                  value={simulatorConfig.title}
                  onChange={(e) => setSimulatorConfig(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t("Titre de l'exercice audio", "Audio exercise title")}
                  className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{t("Description", "Description")}</Label>
                <Textarea
                  value={simulatorConfig.description}
                  onChange={(e) => setSimulatorConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t("Description de l'exercice", "Exercise description")}
                  className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Niveau", "Level")}</Label>
                  <Select
                    value={simulatorConfig.level}
                    onValueChange={(value) => setSimulatorConfig(prev => ({ ...prev, level: value }))}
                  >
                    <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                      <SelectValue placeholder={t("Sélectionner un niveau", "Select a level")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                      <SelectItem value="A1" className="text-foreground hover:bg-muted">A1</SelectItem>
                      <SelectItem value="A2" className="text-foreground hover:bg-muted">A2</SelectItem>
                      <SelectItem value="B1" className="text-foreground hover:bg-muted">B1</SelectItem>
                      <SelectItem value="B2" className="text-foreground hover:bg-muted">B2</SelectItem>
                      <SelectItem value="C1" className="text-foreground hover:bg-muted">C1</SelectItem>
                      <SelectItem value="C2" className="text-foreground hover:bg-muted">C2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">{t("Catégorie", "Category")}</Label>
                  <Select
                    value={simulatorConfig.category}
                    onValueChange={(value) => setSimulatorConfig(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                      <SelectValue placeholder={t("Sélectionner une catégorie", "Select a category")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                      <SelectItem value="Compréhension orale" className="text-foreground hover:bg-muted">
                        {t("Compréhension orale", "Listening Comprehension")}
                      </SelectItem>
                      <SelectItem value="Expression orale" className="text-foreground hover:bg-muted">
                        {t("Expression orale", "Oral Expression")}
                      </SelectItem>
                      <SelectItem value="Prononciation" className="text-foreground hover:bg-muted">
                        {t("Prononciation", "Pronunciation")}
                      </SelectItem>
                      <SelectItem value="Dialogue" className="text-foreground hover:bg-muted">
                        {t("Dialogue", "Dialogue")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audio Files */}
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-foreground">{t("Fichiers Audio", "Audio Files")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {t("Glissez-déposez vos fichiers audio ici", "Drag and drop your audio files here")}
                </p>
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="audio-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('audio-upload')?.click()}
                  className="border-gray-200 dark:border-gray-700"
                >
                  {t("Sélectionner des fichiers", "Select files")}
                </Button>
              </div>

              {audioFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">{t("Fichiers sélectionnés", "Selected files")}</h4>
                  {audioFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePlay(file)}
                          className="border-gray-200 dark:border-gray-700"
                        >
                          {isPlaying === file.name + file.size ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFile(index, 'audio')}
                          className="border-red-200 dark:border-red-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PDF Question Bank Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-purple-200 dark:border-purple-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <FileText className="w-5 h-5" />
                {t("Banque de questions PDF", "PDF Question Bank")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pdf-upload" className="text-sm font-medium">
                  {t("Télécharger un PDF avec des questions", "Upload PDF with questions")}
                </Label>
                <div className="mt-2">
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handlePdfUpload}
                    className="border-purple-200 dark:border-purple-700"
                  />
                </div>
              </div>

              {pdfFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("Fichiers PDF téléchargés", "Uploaded PDF files")}
                  </Label>
                  {pdfFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFile(index, 'pdf')}
                        className="border-red-200 dark:border-red-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {extractedQuestions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                    {t("Questions extraites", "Extracted questions")} ({extractedQuestions.length})
                  </Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {extractedQuestions.slice(0, 5).map((question, index) => (
                      <div key={index} className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                        {question.text?.substring(0, 100)}...
                      </div>
                    ))}
                    {extractedQuestions.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center">
                        {t("et", "and")} {extractedQuestions.length - 5} {t("autres questions", "more questions")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* VAPI Configuration */}
          <Card className="border-blue-200 dark:border-blue-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Mic className="w-5 h-5" />
                {t("Configuration VAPI", "VAPI Configuration")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="voice-preference" className="text-sm font-medium">
                  {t("Voix préférée", "Preferred voice")}
                </Label>
                <Select
                  value={simulatorConfig.voicePreference}
                  onValueChange={(value) => setSimulatorConfig(prev => ({ ...prev, voicePreference: value }))}
                >
                  <SelectTrigger className="border-blue-200 dark:border-blue-700">
                    <SelectValue placeholder={t("Sélectionner une voix", "Select a voice")} />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceOptions.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name} ({voice.gender}, {voice.accent})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration" className="text-sm font-medium">
                  {t("Durée (secondes)", "Duration (seconds)")}
                </Label>
                <Input
                  id="duration"
                  type="number"
                  value={simulatorConfig.duration}
                  onChange={(e) => setSimulatorConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 420 }))}
                  className="border-blue-200 dark:border-blue-700"
                  min="60"
                  max="1800"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("Recommandé: 420 secondes (7 minutes)", "Recommended: 420 seconds (7 minutes)")}
                </p>
              </div>

              {vapiConfig && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {t("VAPI connecté", "VAPI connected")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("Clé publique configurée", "Public key configured")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-gray-200 dark:border-gray-700"
          >
            {t("Annuler", "Cancel")}
          </Button>
          <Button
            onClick={createVapiSimulation}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={!simulatorConfig.title || extractedQuestions.length === 0 || loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("Création...", "Creating...")}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {t("Créer simulation VAPI", "Create VAPI simulation")}
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

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
  const basePath = pathname?.startsWith("/admin") ? "/admin" : "/manager"

  const [audioFiles, setAudioFiles] = useState<File[]>([])
  const [pdfFiles, setPdfFiles] = useState<File[]>([])
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [vapiConfig, setVapiConfig] = useState<any>(null)
  const [voiceOptions, setVoiceOptions] = useState<any[]>([])
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([])
  const [allQuestions, setAllQuestions] = useState<any[]>([])
  const [sujets, setSujets] = useState<string[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [simulatorConfig, setSimulatorConfig] = useState({
    title: "",
    description: "",
    level: "B1",
    category: "ORAL", // Default to ORAL for voice simulation
    duration: 420, // 7 minutes default
    voicePreference: "france_female_1",
    questions: [],
    sujet: "" // Selected sujet from question bank
  })

  // Voice options for audio simulator (7-8 options)
  const voicePreferences = [
    { id: "france_female_1", label: "Voix Féminine France 1", gender: "female", accent: "france" },
    { id: "france_female_2", label: "Voix Féminine France 2", gender: "female", accent: "france" },
    { id: "france_male_1", label: "Voix Masculine France 1", gender: "male", accent: "france" },
    { id: "france_male_2", label: "Voix Masculine France 2", gender: "male", accent: "france" },
    { id: "quebec_female_1", label: "Voix Féminine Québec", gender: "female", accent: "quebec" },
    { id: "quebec_male_1", label: "Voix Masculine Québec", gender: "male", accent: "quebec" },
    { id: "belgium_female_1", label: "Voix Féminine Belgique", gender: "female", accent: "belgium" },
    { id: "belgium_male_1", label: "Voix Masculine Belgique", gender: "male", accent: "belgium" }
  ]

  // Load VAPI configuration, voice options, and all questions/sujets
  useEffect(() => {
    const loadData = async () => {
      try {
        const [configResponse, voicesResponse, questionsResponse, sujetsResponse] = await Promise.all([
          apiClient.get('/voice-simulation/vapi-config'),
          apiClient.get('/voice-simulation/voices'),
          apiClient.get('/simulations/questions'),
          apiClient.get('/voice-simulation/question-bank/sujets') // Fetch sujets from question bank
        ])

        if ((configResponse.data as any)?.success) {
          setVapiConfig((configResponse.data as any).data)
        }

        if ((voicesResponse.data as any)?.success) {
          setVoiceOptions((voicesResponse.data as any).data)
        }

        if ((questionsResponse.data as any)?.success) {
          setAllQuestions((questionsResponse.data as any).data.questions || [])
        }

        if ((sujetsResponse.data as any)?.success) {
          setSujets((sujetsResponse.data as any).data.sujets || [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error(t("Erreur lors du chargement des données", "Error loading data"))
      }
    }

    loadData()
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const audioFiles = files.filter(file => file.type.startsWith('audio/'))

    // Check file limit (max 20 files)
    const totalFiles = audioFiles.length + audioFiles.length
    if (totalFiles > 20) {
      toast.error(t("Maximum 20 fichiers autorisés", "Maximum 20 files allowed"))
      return
    }

    setAudioFiles(prev => {
      const newFiles = [...prev, ...audioFiles]
      if (newFiles.length > 20) {
        toast.error(t("Maximum 20 fichiers autorisés", "Maximum 20 files allowed"))
        return prev
      }
      return newFiles
    })
  }

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const pdfFiles = files.filter(file => file.type === 'application/pdf')

    if (pdfFiles.length === 0) {
      toast.error(t("Veuillez sélectionner un fichier PDF", "Please select a PDF file"))
      return
    }

    // Check file limit (max 20 files)
    setPdfFiles(prev => {
      const newFiles = [...prev, ...pdfFiles]
      if (newFiles.length > 20) {
        toast.error(t("Maximum 20 fichiers autorisés", "Maximum 20 files allowed"))
        return prev
      }
      return newFiles
    })

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

  const extractQuestionsFromAudio = async (file: File) => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('audio', file)
      formData.append('title', simulatorConfig.title || file.name)
      formData.append('description', simulatorConfig.description || '')
      formData.append('level', simulatorConfig.level)
      formData.append('category', simulatorConfig.category)

      const response = await apiClient.post('/ai/extract-audio-content', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if ((response.data as any)?.success) {
        const questions = (response.data as any).data.questions || []
        setExtractedQuestions(prev => [...prev, ...questions])
        toast.success(t(
          `${questions.length} questions extraites du fichier audio`,
          `${questions.length} questions extracted from audio file`
        ))
      }
    } catch (error) {
      console.error('Error extracting questions from audio:', error)
      toast.error(t("Erreur lors de l'extraction audio", "Error extracting audio"))
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

  // Filter questions based on selected category and level
  const getFilteredQuestions = () => {
    return allQuestions.filter(q => {
      const categoryMatch = selectedCategory === "all" || q.category === selectedCategory
      const levelMatch = selectedLevel === "all" || q.level === selectedLevel
      return categoryMatch && levelMatch
    })
  }

  // Get unique categories and levels from all questions
  const getUniqueCategories = () => {
    const categories = new Set(allQuestions.map(q => q.category))
    return Array.from(categories).sort()
  }

  const getUniqueLevels = () => {
    const levels = new Set(allQuestions.map(q => q.level))
    return Array.from(levels).sort()
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
          questions: [],
          sujet: ""
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
                      <SelectItem value="ORAL" className="text-foreground hover:bg-muted">
                        {t("Expression orale", "Oral Expression")}
                      </SelectItem>
                      <SelectItem value="LISTENING" className="text-foreground hover:bg-muted">
                        {t("Compréhension orale", "Listening Comprehension")}
                      </SelectItem>
                      <SelectItem value="IMMIGRATION" className="text-foreground hover:bg-muted">
                        {t("Immigration", "Immigration")}
                      </SelectItem>
                      <SelectItem value="GENERAL" className="text-foreground hover:bg-muted">
                        {t("Général", "General")}
                      </SelectItem>
                      <SelectItem value="WORK" className="text-foreground hover:bg-muted">
                        {t("Travail", "Work")}
                      </SelectItem>
                      <SelectItem value="DAILY_LIFE" className="text-foreground hover:bg-muted">
                        {t("Vie quotidienne", "Daily Life")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Voice Selection - 7-8 options */}
              <div className="space-y-2">
                <Label className="text-foreground">{t("Sélection de la Voix", "Voice Selection")}</Label>
                <Select
                  value={simulatorConfig.voicePreference}
                  onValueChange={(value) => setSimulatorConfig(prev => ({ ...prev, voicePreference: value }))}
                >
                  <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                    <SelectValue placeholder={t("Sélectionner une voix", "Select a voice")} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                    {voicePreferences.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id} className="text-foreground hover:bg-muted">
                        {voice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sujet Selection from Question Bank */}
              {sujets.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Sélectionner un Sujet", "Select a Subject")}</Label>
                  <Select
                    value={simulatorConfig.sujet}
                    onValueChange={(value) => setSimulatorConfig(prev => ({ ...prev, sujet: value }))}
                  >
                    <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                      <SelectValue placeholder={t("Sélectionner un sujet", "Select a subject")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                      {sujets.map((sujet, idx) => (
                        <SelectItem key={idx} value={sujet} className="text-foreground hover:bg-muted">
                          {sujet}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Duration Display (7 minutes) */}
              <div className="space-y-2">
                <Label className="text-foreground">{t("Durée", "Duration")}</Label>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <p className="text-sm text-indigo-900 dark:text-indigo-100">
                    ⏱️ {t("Durée fixe: 7 minutes", "Fixed duration: 7 minutes")}
                  </p>
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
                          onClick={() => extractQuestionsFromAudio(file)}
                          disabled={loading}
                          className="border-purple-200 dark:border-purple-700 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        >
                          {loading ? (
                            <span className="text-xs">{t("Extraction...", "Extracting...")}</span>
                          ) : (
                            <span className="text-xs">{t("Extraire", "Extract")}</span>
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

        {/* Question Bank Table */}
        <Card className="border-green-200 dark:border-green-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <FileText className="w-5 h-5" />
              {t("Banque de questions", "Question Bank")} ({allQuestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("Catégorie", "Category")}
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="border-green-200 dark:border-green-700">
                    <SelectValue placeholder={t("Toutes les catégories", "All categories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("Toutes les catégories", "All categories")}</SelectItem>
                    {getUniqueCategories().map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("Niveau", "Level")}
                </Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="border-green-200 dark:border-green-700">
                    <SelectValue placeholder={t("Tous les niveaux", "All levels")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("Tous les niveaux", "All levels")}</SelectItem>
                    {getUniqueLevels().map(level => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Questions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 font-medium text-foreground">{t("Question", "Question")}</th>
                    <th className="text-left py-2 px-3 font-medium text-foreground">{t("Type", "Type")}</th>
                    <th className="text-left py-2 px-3 font-medium text-foreground">{t("Catégorie", "Category")}</th>
                    <th className="text-left py-2 px-3 font-medium text-foreground">{t("Niveau", "Level")}</th>
                    <th className="text-left py-2 px-3 font-medium text-foreground">{t("Test", "Test")}</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredQuestions().length > 0 ? (
                    getFilteredQuestions().slice(0, 10).map((question, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-muted/50">
                        <td className="py-2 px-3 text-foreground max-w-xs truncate">
                          {question.questionText?.substring(0, 50)}...
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                            {question.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                            {question.category}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                            {question.level}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground text-xs">
                          {question.testTitle || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 px-3 text-center text-muted-foreground">
                        {t("Aucune question trouvée", "No questions found")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {getFilteredQuestions().length > 10 && (
              <div className="text-center text-sm text-muted-foreground">
                {t("Affichage de 10 sur", "Showing 10 of")} {getFilteredQuestions().length} {t("questions", "questions")}
              </div>
            )}
          </CardContent>
        </Card>

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

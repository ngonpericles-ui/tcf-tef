"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, Eye, ArrowLeft, BookOpen, CheckCircle, Sparkles, Loader, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

export default function QuestionnaireCreator() {
  const router = useRouter()
  const [questionnaire, setQuestionnaire] = useState({
    title: "",
    description: "",
    level: "",
    subscription: "",
    duration: "",
    category: "",
    instructions: "",
  })

  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([])

  const [questions, setQuestions] = useState([
    {
      id: 1,
      type: "multiple-choice",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0 as number | string,
      explanation: "",
      points: 1,
    },
  ])

  const [activeTab, setActiveTab] = useState("settings")
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [questionCount, setQuestionCount] = useState(5)
  const [difficultyLevel, setDifficultyLevel] = useState("medium")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null)
  const [audioPreview, setAudioPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  // Expression Orale specific state
  const [expressionOralePdf, setExpressionOralePdf] = useState<File | null>(null)
  const [selectedSujets, setSelectedSujets] = useState<string[]>([])
  const [voiceSelection, setVoiceSelection] = useState<"random" | "male" | "female">("random")
  const [maxDuration, setMaxDuration] = useState(3) // in minutes
  const [extractedSujets, setExtractedSujets] = useState<string[]>([])

  // Available options
  const availableLevels = ["A1", "A2", "B1", "B2", "C1", "C2"]
  const availableSubscriptions = ["Gratuit", "Essentiel", "Premium", "Pro+"]

  // Helper functions for multi-selection
  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }

  const toggleSubscription = (subscription: string) => {
    setSelectedSubscriptions(prev =>
      prev.includes(subscription)
        ? prev.filter(s => s !== subscription)
        : [...prev, subscription]
    )
  }

  // Mapping function for subscription names (French to English)
  const mapSubscriptionToBackend = (frenchName: string): string => {
    const subscriptionMap: Record<string, string> = {
      "Gratuit": "FREE",
      "Essentiel": "ESSENTIAL",
      "Premium": "PREMIUM",
      "Pro+": "PRO"
    }
    return subscriptionMap[frenchName] || frenchName
  }

  const selectAllLevels = () => {
    setSelectedLevels([...availableLevels])
  }

  const clearAllLevels = () => {
    setSelectedLevels([])
  }

  const selectAllSubscriptions = () => {
    setSelectedSubscriptions([...availableSubscriptions])
  }

  const clearAllSubscriptions = () => {
    setSelectedSubscriptions([])
  }

  const addQuestion = (type: string) => {
    const newQuestion = {
      id: Date.now(),
      type,
      question: "",
      options: type === "multiple-choice" ? ["", "", "", ""] : [],
      correctAnswer: type === "multiple-choice" ? 0 as number | string : "" as number | string,
      explanation: "",
      points: 1,
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (id: number, field: string, value: any) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  const deleteQuestion = (id: number) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleSave = async () => {
    try {
      // Validate questionnaire data
      if (!questionnaire.title.trim()) {
        toast.error("Veuillez saisir un titre pour le questionnaire")
        return
      }
      
      if (!questionnaire.description.trim()) {
        toast.error("Veuillez saisir une description pour le questionnaire")
        return
      }
      
      if (selectedLevels.length === 0) {
        toast.error("Veuillez sélectionner au moins un niveau")
        return
      }
      
      if (selectedSubscriptions.length === 0) {
        toast.error("Veuillez sélectionner au moins un abonnement")
        return
      }
      
      if (questions.length === 0) {
        toast.error("Veuillez ajouter au moins une question")
        return
      }

      // Validate questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i]
        if (!question.question.trim()) {
          toast.error(`Veuillez saisir le texte de la question ${i + 1}`)
          return
        }
        
        if (question.type === "multiple-choice") {
          const hasValidOptions = question.options.some(opt => opt.trim())
          if (!hasValidOptions) {
            toast.error(`Veuillez saisir au moins une option pour la question ${i + 1}`)
            return
          }
          if (question.correctAnswer === undefined || question.correctAnswer === null) {
            toast.error(`Veuillez sélectionner la bonne réponse pour la question ${i + 1}`)
            return
          }
        }
        
        if (question.type === "true-false") {
          if (!question.correctAnswer || (question.correctAnswer !== "true" && question.correctAnswer !== "false")) {
            toast.error(`Veuillez sélectionner la bonne réponse (Vrai/Faux) pour la question ${i + 1}`)
            return
          }
        }
        
        if (question.type === "short-answer" || question.type === "essay") {
          if (!question.correctAnswer || !question.correctAnswer.toString().trim()) {
            toast.error(`Veuillez saisir la réponse correcte pour la question ${i + 1}`)
            return
          }
        }
      }

      // Validate required fields
      if (!questionnaire.title.trim()) {
        throw new Error('Le titre du questionnaire est requis')
      }
      if (!questionnaire.description.trim()) {
        throw new Error('La description du questionnaire est requise')
      }
      if (selectedLevels.length === 0) {
        throw new Error('Veuillez sélectionner au moins un niveau')
      }
      if (selectedSubscriptions.length === 0) {
        throw new Error('Veuillez sélectionner au moins un abonnement')
      }
      if (!questionnaire.category) {
        throw new Error('Veuillez sélectionner une catégorie')
      }
      if (questions.length === 0) {
        throw new Error('Veuillez ajouter au moins une question')
      }

      // For expression orale, validate specific requirements
      if (questionnaire.category === "oral") {
        if (!expressionOralePdf) {
          throw new Error('Veuillez uploader un PDF avec les sujets pour l\'expression orale')
        }
        if (selectedSujets.length === 0) {
          throw new Error('Veuillez sélectionner au moins un sujet')
        }
      }

      // Prepare test data
      const testData = {
        title: questionnaire.title.trim(),
        description: questionnaire.description.trim(),
        type: "PRACTICE" as const,
        level: selectedLevels[0] as any, // Use first selected level as primary
        category: questionnaire.category as any,
        requiredTier: mapSubscriptionToBackend(selectedSubscriptions[0] || "FREE"), // Map French to English
        duration: questionnaire.category === "oral" ? maxDuration : (parseInt(questionnaire.duration) || 30),
        questionCount: questions.length,
        difficulty: 1,
        passingScore: 60,
        tags: [questionnaire.category, ...selectedLevels],
        aiPowered: false,
        hasAIFeedback: false,
        isOfficial: false,
        // Add multi-selection data
        levels: selectedLevels,
        subscriptions: selectedSubscriptions.map(mapSubscriptionToBackend), // Map all subscriptions
        // Expression orale specific data
        ...(questionnaire.category === "oral" && {
          voiceSelection,
          maxDuration,
          sujets: selectedSujets
        })
      }

      // Prepare questions data
      const questionsData = questions.map((q, index) => ({
        questionText: q.question,
        type: q.type,
        options: q.type === "multiple-choice" ? q.options : null,
        correctAnswer: q.correctAnswer,
        points: q.points,
        explanation: q.explanation,
        order: index + 1,
        level: selectedLevels[0] as any,
        category: questionnaire.category as any
      }))

      // Save to database using apiClient
      const response = await apiClient.post('/tests', {
        test: testData,
        questions: questionsData
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to save questionnaire')
      }

      // Show success message with toast notification
      toast.success("✅ Questionnaire sauvegardé avec succès! Le quiz a été uploadé sur Cloudinary et est maintenant disponible dans la section Tests des étudiants.")
      console.log("Questionnaire saved:", response.data)
      
      // Reset form after successful save
      setQuestionnaire({
        title: "",
        description: "",
        level: "",
        subscription: "",
        duration: "",
        category: "",
        instructions: "",
      })
      setQuestions([{
        id: 1,
        type: "multiple-choice",
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0 as number | string,
        explanation: "",
        points: 1,
      }])
      // Reset expression orale state
      setExpressionOralePdf(null)
      setSelectedSujets([])
      setExtractedSujets([])
      setVoiceSelection("random")
      setMaxDuration(3)
      
    } catch (error: any) {
      console.error("Error saving questionnaire:", error)
      toast.error(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`)
    }
  }

  const handlePreview = () => {
    // Validate questionnaire data for preview
    if (!questionnaire.title.trim()) {
      toast.error("Veuillez saisir un titre pour le questionnaire")
      return
    }
    
    if (questions.length === 0) {
      toast.error("Veuillez ajouter au moins une question")
      return
    }

    // Open preview in new window
    const previewData = {
      questionnaire,
      questions
    }
    
    const previewWindow = window.open('', '_blank', 'width=800,height=600')
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Aperçu du Questionnaire</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { border-bottom: 2px solid #e0e0e0; padding-bottom: 15px; margin-bottom: 20px; }
              .question { margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px; }
              .question-title { font-weight: bold; margin-bottom: 10px; }
              .options { margin-left: 20px; }
              .option { margin: 5px 0; }
              .explanation { margin-top: 10px; font-style: italic; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${questionnaire.title}</h1>
                <p>${questionnaire.description}</p>
                <p><strong>Durée:</strong> ${questionnaire.duration} minutes</p>
                <p><strong>Niveau:</strong> ${questionnaire.level}</p>
                <p><strong>Catégorie:</strong> ${questionnaire.category}</p>
              </div>
              ${questions.map((q, index) => `
                <div class="question">
                  <div class="question-title">Question ${index + 1}: ${q.question}</div>
                  ${q.type === "multiple-choice" ? `
                    <div class="options">
                      ${q.options.map((opt, optIndex) => `
                        <div class="option">${String.fromCharCode(65 + optIndex)}. ${opt}</div>
                      `).join('')}
                    </div>
                  ` : ''}
                  ${q.explanation ? `<div class="explanation">Explication: ${q.explanation}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `)
      previewWindow.document.close()
    }
  }

  // Simple prompt change handler - no auto-generation
  const handlePromptChange = (value: string) => {
    setAiPrompt(value)
  }

  const handleGenerateQuestionsWithAI = async () => {
    try {
      if (!questionnaire.title.trim()) {
        toast.error("Veuillez saisir un titre pour le questionnaire")
        return
      }

      if (!questionnaire.description.trim()) {
        toast.error("Veuillez saisir une description pour le questionnaire")
        return
      }

      if (selectedLevels.length === 0) {
        toast.error("Veuillez sélectionner au moins un niveau")
        return
      }

      if (!aiPrompt.trim()) {
        toast.error("Veuillez saisir une description pour générer les questions")
        return
      }


      setIsGeneratingQuestions(true)

      // Call AI API to generate questions
      const response = await apiClient.post('/ai/generate-questions', {
        content: aiPrompt,
        lessonTitle: questionnaire.title,
        courseTitle: questionnaire.description,
        level: selectedLevels[0],
        category: questionnaire.category,
        difficulty: difficultyLevel,
        questionCount: questionCount,
        questionTypes: questionnaire.category === "listening" 
          ? ["multiple-choice", "true-false"] 
          : ["multiple-choice", "true-false", "short-answer"]
      })

      if (!response.success) {
        throw new Error((response as any).message || 'Failed to generate questions')
      }

      // Parse generated questions and add them to the list
      const generatedQuestions = (response.data as any)?.questions || []

      if (generatedQuestions.length === 0) {
        toast.error("Aucune question n'a pu être générée. Veuillez réessayer.")
        return
      }

      // Add generated questions to the questions list
      const newQuestions = generatedQuestions.map((q: any, index: number) => ({
        id: Date.now() + index,
        type: q.type || "multiple-choice",
        question: q.questionText || q.question || "",
        options: q.options || (q.type === "multiple-choice" ? ["", "", "", ""] : []),
        correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
        explanation: q.explanation || "",
        points: q.points || 1,
      }))

      setQuestions([...questions, ...newQuestions])
      setAiPrompt("")
      toast.success(`✅ ${newQuestions.length} questions générées avec succès!`)
    } catch (error: any) {
      console.error("Error generating questions:", error)
      toast.error(`Erreur lors de la génération: ${error.message || 'Erreur inconnue'}`)
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      if (!file) {
        toast.error("Veuillez sélectionner un fichier")
        return
      }

      // Validate file type
      const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        toast.error("Format de fichier non supporté. Veuillez utiliser PDF, DOCX ou TXT")
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Le fichier est trop volumineux. Taille maximale: 10MB")
        return
      }

      // Create preview for text files
      if (file.type === 'text/plain') {
        const text = await file.text()
        setFilePreview(text.substring(0, 1000) + (text.length > 1000 ? '...' : ''))
      } else {
        // Display file size in appropriate units
        const formatFileSize = (bytes: number) => {
          if (bytes === 0) return '0 Bytes'
          const k = 1024
          const sizes = ['Bytes', 'KB', 'MB', 'GB']
          const i = Math.floor(Math.log(bytes) / Math.log(k))
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
        }
        setFilePreview(`Fichier: ${file.name} (${formatFileSize(file.size)})`)
      }

      setUploadedFile(file)
      setIsProcessingFile(true)

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('lessonTitle', questionnaire.title || 'Untitled')
      formData.append('courseTitle', questionnaire.description || 'Course')
      formData.append('level', selectedLevels[0] || 'A1')
      formData.append('category', questionnaire.category || 'grammar')
      formData.append('questionCount', questionCount.toString())

      // Call backend API to process file and generate questions
      const response = await apiClient.post('/ai/generate-questions-from-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (!response.success) {
        throw new Error((response as any).message || 'Failed to process file')
      }

      // Parse generated questions
      const generatedQuestions = (response.data as any)?.questions || []

      if (generatedQuestions.length === 0) {
        toast.error("Aucune question n'a pu être générée à partir du fichier. Veuillez réessayer.")
        return
      }

      // Add generated questions to the questions list
      const newQuestions = generatedQuestions.map((q: any, index: number) => ({
        id: Date.now() + index,
        type: q.type || "multiple-choice",
        question: q.questionText || q.question || "",
        options: q.options || (q.type === "multiple-choice" ? ["", "", "", ""] : []),
        correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
        explanation: q.explanation || "",
        points: q.points || 1,
      }))

      setQuestions([...questions, ...newQuestions])
      setUploadedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      toast.success(`✅ ${newQuestions.length} questions générées à partir du fichier!`)
    } catch (error: any) {
      console.error("Error processing file:", error)
      toast.error(`Erreur lors du traitement du fichier: ${error.message || 'Erreur inconnue'}`)
    } finally {
      setIsProcessingFile(false)
    }
  }

  const handleAudioUpload = async (file: File) => {
    try {
      if (!file) {
        toast.error("Veuillez sélectionner un fichier audio")
        return
      }

      // Validate audio file type
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a']
      if (!allowedTypes.includes(file.type)) {
        toast.error("Format de fichier audio non supporté. Veuillez utiliser MP3, WAV, OGG ou M4A")
        return
      }

      // Validate file size (max 50MB for audio)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Le fichier audio est trop volumineux. Taille maximale: 50MB")
        return
      }

      // Create audio preview URL
      const audioUrl = URL.createObjectURL(file)
      setAudioPreview(audioUrl)
      setUploadedAudio(file)

      toast.success("Fichier audio uploadé avec succès!")
    } catch (error: any) {
      console.error("Error uploading audio:", error)
      toast.error(`Erreur lors de l'upload audio: ${error.message || 'Erreur inconnue'}`)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleAudioUpload(files[0])
    }
  }

  const extractSujetsFromPdf = async (file: File) => {
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('extractType', 'sujets')

      // Call backend API to extract sujets from PDF
      const response = await apiClient.post('/ai/extract-sujets-from-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if ((response as any).success && (response as any).data?.sujets) {
        setExtractedSujets((response as any).data.sujets)
        toast.success(`✅ ${(response as any).data.sujets.length} sujets extraits du PDF!`)
      } else {
        throw new Error("Impossible d'extraire les sujets du PDF")
      }
    } catch (error: any) {
      console.error("Error extracting sujets:", error)
      toast.error(`Erreur lors de l'extraction: ${error.message || 'Erreur inconnue'}`)
      setExtractedSujets([])
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Créateur de Questionnaire</h1>
              <p className="text-muted-foreground">Créez des questionnaires interactifs et personnalisés</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handlePreview} className="border-border text-foreground bg-card hover:bg-muted">
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border-border">
            <TabsTrigger value="settings" className="data-[state=active]:bg-muted">
              <BookOpen className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
            <TabsTrigger value="ai-generate" className="data-[state=active]:bg-muted">
              <Sparkles className="w-4 h-4 mr-2" />
              Générer avec IA
            </TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-muted">
              <CheckCircle className="w-4 h-4 mr-2" />
              Questions ({questions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Configuration du Questionnaire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-foreground">
                      Titre du questionnaire
                    </Label>
                    <Input
                      id="title"
                      value={questionnaire.title}
                      onChange={(e) => setQuestionnaire({ ...questionnaire, title: e.target.value })}
                      placeholder="Ex: Test de Grammaire Française A2"
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-foreground">
                      Durée (minutes)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      value={questionnaire.duration}
                      onChange={(e) => setQuestionnaire({ ...questionnaire, duration: e.target.value })}
                      placeholder="30"
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={questionnaire.description}
                    onChange={(e) => setQuestionnaire({ ...questionnaire, description: e.target.value })}
                    placeholder="Décrivez le contenu et les objectifs de ce questionnaire..."
                    className="bg-background border-input text-foreground min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Multi-Level Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground font-medium">Niveaux CEFR</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllLevels}
                          className="text-xs"
                        >
                          Tout sélectionner
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearAllLevels}
                          className="text-xs"
                        >
                          Tout désélectionner
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {availableLevels.map((level) => (
                        <label
                          key={level}
                          className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all hover:bg-muted ${
                            selectedLevels.includes(level)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedLevels.includes(level)}
                            onChange={() => toggleLevel(level)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="text-sm font-medium">{level}</span>
                        </label>
                      ))}
                    </div>
                    {selectedLevels.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedLevels.map((level) => (
                          <Badge key={level} variant="secondary" className="text-xs">
                            {level}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Multi-Subscription Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground font-medium">Abonnements</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllSubscriptions}
                          className="text-xs"
                        >
                          Tout sélectionner
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearAllSubscriptions}
                          className="text-xs"
                        >
                          Tout désélectionner
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {availableSubscriptions.map((subscription) => (
                        <label
                          key={subscription}
                          className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all hover:bg-muted ${
                            selectedSubscriptions.includes(subscription)
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSubscriptions.includes(subscription)}
                            onChange={() => toggleSubscription(subscription)}
                            className="h-4 w-4 text-green-600"
                          />
                          <span className="text-sm font-medium">{subscription}</span>
                        </label>
                      ))}
                    </div>
                    {selectedSubscriptions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedSubscriptions.map((subscription) => (
                          <Badge key={subscription} variant="secondary" className="text-xs">
                            {subscription}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-foreground">Catégorie</Label>
                    <Select
                      value={questionnaire.category}
                      onValueChange={(value) => setQuestionnaire({ ...questionnaire, category: value })}
                    >
                      <SelectTrigger className="bg-background border-input text-foreground">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="grammar">Grammaire</SelectItem>
                        <SelectItem value="listening">Compréhension orale</SelectItem>
                        <SelectItem value="reading">Compréhension écrite</SelectItem>
                        <SelectItem value="vocabulary">Vocabulaire</SelectItem>
                        <SelectItem value="oral">Expression orale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Niveau de difficulté</Label>
                    <Select
                      value={difficultyLevel}
                      onValueChange={setDifficultyLevel}
                    >
                      <SelectTrigger className="bg-background border-input text-foreground">
                        <SelectValue placeholder="Sélectionner la difficulté" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="easy">Facile</SelectItem>
                        <SelectItem value="medium">Moyen</SelectItem>
                        <SelectItem value="hard">Difficile</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions" className="text-foreground">
                    Instructions pour les étudiants
                  </Label>
                  <Textarea
                    id="instructions"
                    value={questionnaire.instructions}
                    onChange={(e) => setQuestionnaire({ ...questionnaire, instructions: e.target.value })}
                    placeholder="Consignes et instructions pour réaliser ce questionnaire..."
                    className="bg-background border-input text-foreground"
                  />
                </div>

                {/* Summary Section */}
                {(selectedLevels.length > 0 || selectedSubscriptions.length > 0) && (
                  <Card className="bg-muted/50 border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground text-lg">Résumé de la Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedLevels.length > 0 && (
                        <div>
                          <Label className="text-foreground font-medium">Niveaux sélectionnés:</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedLevels.map((level) => (
                              <Badge key={level} variant="secondary" className="text-sm">
                                {level}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedSubscriptions.length > 0 && (
                        <div>
                          <Label className="text-foreground font-medium">Abonnements sélectionnés:</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedSubscriptions.map((subscription) => (
                              <Badge key={subscription} variant="secondary" className="text-sm">
                                {subscription}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground">
                        <p>Ce questionnaire sera disponible pour {selectedLevels.length} niveau(s) et {selectedSubscriptions.length} abonnement(s).</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <div className="space-y-6">
              {/* Add Question Buttons */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Ajouter une Question</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      onClick={() => addQuestion("multiple-choice")}
                      variant="outline"
                      className="border-border text-foreground hover:bg-muted"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      QCM
                    </Button>
                    <Button
                      onClick={() => addQuestion("true-false")}
                      variant="outline"
                      className="border-border text-foreground hover:bg-muted"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Vrai/Faux
                    </Button>
                    <Button
                      onClick={() => addQuestion("short-answer")}
                      variant="outline"
                      className="border-border text-foreground hover:bg-muted"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Réponse Courte
                    </Button>
                    <Button
                      onClick={() => addQuestion("essay")}
                      variant="outline"
                      className="border-border text-foreground hover:bg-muted"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Rédaction
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Questions List */}
              {questions.map((question, index) => (
                <Card key={question.id} className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-foreground text-lg">
                      Question {index + 1}
                      <Badge variant="outline" className="ml-2 border-border text-foreground">
                        {question.type === "multiple-choice" && "QCM"}
                        {question.type === "true-false" && "Vrai/Faux"}
                        {question.type === "short-answer" && "Réponse Courte"}
                        {question.type === "essay" && "Rédaction"}
                      </Badge>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuestion(question.id)}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Question</Label>
                      <Textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                        placeholder="Tapez votre question ici..."
                        className="bg-background border-input text-foreground"
                      />
                    </div>

                    {question.type === "multiple-choice" && (
                      <div className="space-y-3">
                        <Label className="text-foreground">Options de réponse</Label>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === optionIndex}
                              onChange={() => updateQuestion(question.id, "correctAnswer", optionIndex)}
                              className="text-primary"
                            />
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options]
                                newOptions[optionIndex] = e.target.value
                                updateQuestion(question.id, "options", newOptions)
                              }}
                              placeholder={`Option ${optionIndex + 1}`}
                              className="bg-background border-input text-foreground flex-1"
                            />
                            {question.correctAnswer === optionIndex && (
                              <Badge variant="default" className="bg-green-600 text-white">
                                Correct
                              </Badge>
                            )}
                          </div>
                        ))}
                        <div className="text-sm text-muted-foreground">
                          💡 Sélectionnez la bonne réponse en cliquant sur le bouton radio
                        </div>
                      </div>
                    )}

                    {question.type === "true-false" && (
                      <div className="space-y-2">
                        <Label className="text-foreground">Réponse correcte</Label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2 text-foreground">
                            <input
                              type="radio"
                              name={`tf-${question.id}`}
                              checked={String(question.correctAnswer) === "true"}
                              onChange={() => updateQuestion(question.id, "correctAnswer", "true")}
                              className="text-primary"
                            />
                            <span>Vrai</span>
                            {String(question.correctAnswer) === "true" && (
                              <Badge variant="default" className="bg-green-600 text-white ml-2">
                                Correct
                              </Badge>
                            )}
                          </label>
                          <label className="flex items-center space-x-2 text-foreground">
                            <input
                              type="radio"
                              name={`tf-${question.id}`}
                              checked={String(question.correctAnswer) === "false"}
                              onChange={() => updateQuestion(question.id, "correctAnswer", "false")}
                              className="text-primary"
                            />
                            <span>Faux</span>
                            {String(question.correctAnswer) === "false" && (
                              <Badge variant="default" className="bg-green-600 text-white ml-2">
                                Correct
                              </Badge>
                            )}
                          </label>
                        </div>
                      </div>
                    )}

                    {(question.type === "short-answer" || question.type === "essay") && (
                      <div className="space-y-2">
                        <Label className="text-foreground">Réponse correcte (pour l'évaluation)</Label>
                        <Textarea
                          value={question.correctAnswer || ""}
                          onChange={(e) => updateQuestion(question.id, "correctAnswer", e.target.value)}
                          placeholder="Tapez la réponse correcte ou les mots-clés acceptés..."
                          className="bg-background border-input text-foreground"
                        />
                        <div className="text-sm text-muted-foreground">
                          💡 Pour les questions ouvertes, indiquez la réponse attendue ou les mots-clés importants
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">Explication (optionnel)</Label>
                        <Textarea
                          value={question.explanation}
                          onChange={(e) => updateQuestion(question.id, "explanation", e.target.value)}
                          placeholder="Expliquez la réponse correcte..."
                          className="bg-background border-input text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Points</Label>
                        <Input
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(question.id, "points", Number.parseInt(e.target.value) || 1)}
                          min="1"
                          className="bg-background border-input text-foreground"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {questions.length === 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Aucune question ajoutée</h3>
                    <p className="text-muted-foreground mb-6">Commencez par ajouter des questions à votre questionnaire</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai-generate">
            <div className="space-y-6">
              {/* File Upload Section - Only for Grammar and Vocabulary */}
              {(questionnaire.category === "grammar" || questionnaire.category === "vocabulary") && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-foreground">
                      <Upload className="w-5 h-5 text-blue-500" />
                      <span>Télécharger un Fichier PDF</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Téléchargez un fichier PDF contenant des règles de grammaire ou du vocabulaire pour générer automatiquement des questions
                    </p>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-all"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0])
                        }
                      }}
                      className="hidden"
                    />
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-foreground font-medium">Glissez-déposez votre fichier ici</p>
                        <p className="text-sm text-muted-foreground">ou</p>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 border-border text-foreground hover:bg-muted"
                        >
                          Parcourir les fichiers
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Formats supportés: PDF, DOCX, TXT (Max 10MB)
                      </p>
                    </div>
                  </div>
                  {uploadedFile && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <span className="text-sm text-green-900 dark:text-green-100">
                          ✅ {uploadedFile.name}
                        </span>
                        <button
                          onClick={() => {
                            setUploadedFile(null)
                            setFilePreview(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {filePreview && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
                          <h4 className="text-sm font-medium text-foreground mb-2">Aperçu du fichier:</h4>
                          <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto">
                            {filePreview}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              )}

              {/* Audio Upload Section - Only for Listening Comprehension */}
              {questionnaire.category === "listening" && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-foreground">
                      <Upload className="w-5 h-5 text-blue-500" />
                      <span>Upload Audio pour Compréhension Orale</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Uploadez des fichiers audio (conversations, interviews, annonces) pour générer des questions de compréhension orale
                    </p>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleAudioDrop}
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors"
                  >
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleAudioUpload(e.target.files[0])
                        }
                      }}
                      className="hidden"
                    />
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-foreground font-medium">Glissez-déposez votre fichier audio ici</p>
                        <p className="text-sm text-muted-foreground">ou</p>
                        <Button
                          variant="outline"
                          onClick={() => audioInputRef.current?.click()}
                          className="mt-2 border-border text-foreground hover:bg-muted"
                        >
                          Parcourir les fichiers audio
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Formats supportés: MP3, WAV, OGG, M4A (Max 50MB)
                      </p>
                    </div>
                  </div>
                  {uploadedAudio && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <span className="text-sm text-blue-900 dark:text-blue-100">
                          🎵 {uploadedAudio.name}
                        </span>
                        <button
                          onClick={() => {
                            setUploadedAudio(null)
                            if (audioPreview) URL.revokeObjectURL(audioPreview)
                            setAudioPreview(null)
                            if (audioInputRef.current) audioInputRef.current.value = ''
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {audioPreview && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
                          <h4 className="text-sm font-medium text-foreground mb-2">Aperçu audio:</h4>
                          <audio controls className="w-full">
                            <source src={audioPreview} type={uploadedAudio.type} />
                            Votre navigateur ne supporte pas l'élément audio.
                          </audio>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              )}

              {/* Expression Orale Section - Only for Speaking */}
              {questionnaire.category === "oral" && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-foreground">
                      <Upload className="w-5 h-5 text-purple-500" />
                      <span>Configuration Expression Orale</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Uploadez un PDF avec les sujets de discussion, configurez les voix et la durée maximale
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* PDF Upload for Sujets */}
                    <div className="space-y-3">
                      <Label className="text-foreground font-medium">Uploadez PDF avec les Sujets</Label>
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => {
                          e.preventDefault()
                          if (e.dataTransfer.files?.[0]) {
                            const file = e.dataTransfer.files[0]
                            if (file.type === 'application/pdf') {
                              setExpressionOralePdf(file)
                              extractSujetsFromPdf(file)
                            } else {
                              toast.error("Veuillez sélectionner un fichier PDF")
                            }
                          }
                        }}
                        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors"
                      >
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setExpressionOralePdf(e.target.files[0])
                              extractSujetsFromPdf(e.target.files[0])
                            }
                          }}
                          className="hidden"
                          id="oral-pdf-input"
                        />
                        <div className="space-y-2">
                          <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                          <div>
                            <p className="text-foreground font-medium">Glissez-déposez votre PDF ici</p>
                            <p className="text-sm text-muted-foreground">ou</p>
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('oral-pdf-input')?.click()}
                              className="mt-2 border-border text-foreground hover:bg-muted"
                            >
                              Parcourir les fichiers
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Format supporté: PDF (Max 50MB)
                          </p>
                        </div>
                      </div>
                      {expressionOralePdf && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                          <span className="text-sm text-purple-900 dark:text-purple-100">
                            📄 {expressionOralePdf.name}
                          </span>
                          <button
                            onClick={() => {
                              setExpressionOralePdf(null)
                              setExtractedSujets([])
                              setSelectedSujets([])
                            }}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Extracted Sujets Selection */}
                    {extractedSujets.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-foreground font-medium">Sélectionnez les Sujets</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {extractedSujets.map((sujet, idx) => (
                            <label
                              key={idx}
                              className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all ${
                                selectedSujets.includes(sujet)
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedSujets.includes(sujet)}
                                onChange={() => {
                                  setSelectedSujets(prev =>
                                    prev.includes(sujet)
                                      ? prev.filter(s => s !== sujet)
                                      : [...prev, sujet]
                                  )
                                }}
                                className="h-4 w-4 text-purple-600"
                              />
                              <span className="text-sm">{sujet}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Voice Selection */}
                    <div className="space-y-3">
                      <Label className="text-foreground font-medium">Sélection de la Voix</Label>
                      <Select value={voiceSelection} onValueChange={(value: any) => setVoiceSelection(value)}>
                        <SelectTrigger className="bg-background border-input text-foreground">
                          <SelectValue placeholder="Sélectionner le type de voix" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="random">Aléatoire (Homme/Femme)</SelectItem>
                          <SelectItem value="male">Voix Masculine</SelectItem>
                          <SelectItem value="female">Voix Féminine</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Max Duration */}
                    <div className="space-y-3">
                      <Label className="text-foreground font-medium">Durée Maximale (minutes)</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={maxDuration}
                          onChange={(e) => setMaxDuration(Math.max(1, parseInt(e.target.value) || 3))}
                          className="bg-background border-input text-foreground w-24"
                        />
                        <span className="text-sm text-muted-foreground">
                          {maxDuration === 3 ? "(Recommandé: 3 minutes)" : `(${maxDuration} minutes)`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Text Prompt Section - Category-specific (NOT for Expression Orale) */}
              {questionnaire.category !== "oral" && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <span>Générer des Questions avec l'IA</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    {questionnaire.category === "listening" 
                      ? "Décrivez le contenu audio pour générer des questions de compréhension orale"
                      : questionnaire.category === "grammar"
                      ? "Décrivez les règles de grammaire pour générer des questions d'exercice"
                      : questionnaire.category === "vocabulary"
                      ? "Décrivez le vocabulaire thématique pour générer des questions de vocabulaire"
                      : "Utilisez l'intelligence artificielle pour générer automatiquement des questions basées sur votre description"
                    }
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ai-prompt" className="text-foreground font-medium">
                    Description du contenu
                  </Label>
                  <Textarea
                    id="ai-prompt"
                    value={aiPrompt}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    placeholder={
                      questionnaire.category === "listening"
                        ? "Ex: Conversation entre deux amis discutant de leurs vacances. Questions sur les détails, l'opinion, et la compréhension générale..."
                        : questionnaire.category === "grammar"
                        ? "Ex: Générez des questions sur les temps du passé en français (passé composé, imparfait, plus-que-parfait) pour un niveau B1..."
                        : questionnaire.category === "vocabulary"
                        ? "Ex: Vocabulaire de la famille, des professions, des émotions. Questions de définition, synonymes, et usage contextuel..."
                        : "Ex: Décrivez le contenu pour générer des questions appropriées..."
                    }
                    className="bg-background border-input text-foreground min-h-[120px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="question-count" className="text-foreground">
                      Nombre de questions à générer
                    </Label>
                    <Input
                      id="question-count"
                      type="number"
                      min="1"
                      max="30"
                      value={questionCount}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1
                        setQuestionCount(Math.min(30, Math.max(1, value)))
                      }}
                      placeholder="Entrez le nombre de questions (1-30)"
                      className="bg-background border-input text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">
                      Niveau sélectionné
                    </Label>
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg border border-border">
                      <Badge variant="default">
                        {selectedLevels.length > 0 ? selectedLevels[0] : "Aucun"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {selectedLevels.length > 1 && `+${selectedLevels.length - 1} autres`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    💡 <strong>Conseil:</strong> Décrivez précisément le sujet, le niveau de difficulté et les types de questions que vous souhaitez. Plus votre description est détaillée, meilleures seront les questions générées.
                  </p>
                </div>

                <Button
                  onClick={handleGenerateQuestionsWithAI}
                  disabled={isGeneratingQuestions || !aiPrompt.trim() || selectedLevels.length === 0}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                >
                  {isGeneratingQuestions ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer {questionCount} question{questionCount > 1 ? 's' : ''} avec l'IA
                    </>
                  )}
                </Button>

                {questions.length > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-900 dark:text-green-100">
                      ✅ Vous avez actuellement <strong>{questions.length} question(s)</strong> dans votre questionnaire. Les nouvelles questions générées seront ajoutées à la fin.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

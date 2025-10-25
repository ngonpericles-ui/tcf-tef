"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, Eye, ArrowLeft, BookOpen, CheckCircle, Sparkles, Loader, Upload, X, Mic, Volume2, Clock, Settings, Brain, FileText } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

export default function AudioSimulatorCreator() {
  const router = useRouter()
  
  const [simulator, setSimulator] = useState({
    title: "",
    description: "",
    level: "",
    subscription: "",
    duration: "",
    category: "GENERAL", // Default to GENERAL for voice simulation
    instructions: "",
  })

  // VAPI manages levels automatically - no need for level selection
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([])

  const [activeTab, setActiveTab] = useState("settings")
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  // VAPI manages questions dynamically - no need for question count or difficulty
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null)
  const [audioPreview, setAudioPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  // Voice simulation specific state
  const [selectedSujets, setSelectedSujets] = useState<string[]>([])
  const [maxDuration, setMaxDuration] = useState(7) // in minutes
  const [extractedSujets, setExtractedSujets] = useState<string[]>([])
  const [availableSujets, setAvailableSujets] = useState<string[]>([])
  const [isLoadingSujets, setIsLoadingSujets] = useState(false)

  // Available options
  // VAPI manages levels automatically
  const availableSubscriptions = ["Gratuit", "Essentiel", "Premium", "Pro+"]
  
  // Voice options for audio simulator
  const voiceOptions = [
    { id: "france_female_1", label: "Voix Féminine France 1", gender: "female", accent: "france" },
    { id: "france_female_2", label: "Voix Féminine France 2", gender: "female", accent: "france" },
    { id: "france_male_1", label: "Voix Masculine France 1", gender: "male", accent: "france" },
    { id: "france_male_2", label: "Voix Masculine France 2", gender: "male", accent: "france" },
    { id: "quebec_female_1", label: "Voix Féminine Québec", gender: "female", accent: "quebec" },
    { id: "quebec_male_1", label: "Voix Masculine Québec", gender: "male", accent: "quebec" },
    { id: "belgium_female_1", label: "Voix Féminine Belgique", gender: "female", accent: "belgium" },
    { id: "belgium_male_1", label: "Voix Masculine Belgique", gender: "male", accent: "belgium" }
  ]

  // Helper functions for multi-selection
  const toggleSubscription = (subscription: string) => {
    setSelectedSubscriptions(prev =>
      prev.includes(subscription)
        ? prev.filter(s => s !== subscription)
        : [...prev, subscription]
    )
  }

  const selectAllSubscriptions = () => {
    setSelectedSubscriptions([...availableSubscriptions])
  }

  const clearAllSubscriptions = () => {
    setSelectedSubscriptions([])
  }

  // Load available sujets from database
  const loadSujets = async () => {
    setIsLoadingSujets(true)
    try {
      const response = await apiClient.get('/voice-simulation/question-bank/sujets')
      if ((response.data as any)?.success) {
        const sujets = (response.data as any).data.sujets || []
        setAvailableSujets(sujets)
        toast.success(`${sujets.length} sujets chargés avec succès`)
        console.log('Loaded sujets:', sujets)
      } else {
        toast.error('Aucun sujet trouvé')
      }
    } catch (error) {
      console.error('Error loading sujets:', error)
      toast.error('Erreur lors du chargement des sujets')
    } finally {
      setIsLoadingSujets(false)
    }
  }

  // Load sujets on component mount
  useEffect(() => {
    loadSujets()
  }, [])

  // File upload handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    
    // Create preview for text files
    if (file.type === 'text/plain' || file.type === 'application/pdf') {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsText(file)
    } else {
      setFilePreview(`Fichier: ${file.name} (${formatFileSize(file.size)})`)
    }
  }

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('audio/')) {
      toast.error('Veuillez sélectionner un fichier audio')
      return
    }

    setUploadedAudio(file)
    
    // Create audio preview
    const audioUrl = URL.createObjectURL(file)
    setAudioPreview(audioUrl)
  }

  const handleAudioDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('audio/')) {
      setUploadedAudio(file)
      const audioUrl = URL.createObjectURL(file)
      setAudioPreview(audioUrl)
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const clearAudio = () => {
    setUploadedAudio(null)
    setAudioPreview(null)
    if (audioInputRef.current) {
      audioInputRef.current.value = ''
    }
  }

  // Upload topics/sujets to question bank for VAPI to use
  const handleUploadTopicsToQuestionBank = async () => {
    if (!aiPrompt.trim() && !uploadedFile && !uploadedAudio) {
      toast.error('Veuillez fournir un prompt ou un fichier pour extraire les sujets')
      return
    }

    setIsGeneratingQuestions(true)
    try {
      const formData = new FormData()
      
      // Add required fields for AI endpoint
          formData.append('lessonTitle', simulator.title || 'Simulation Audio')
          formData.append('courseTitle', 'Simulation Vocale')
          formData.append('category', 'GENERAL')
          formData.append('prompt', aiPrompt)

      if (uploadedFile) {
        formData.append('file', uploadedFile)
      }

      if (uploadedAudio) {
        formData.append('audio', uploadedAudio)
      }

      const response = await apiClient.post('/ai/generate-questions-from-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

           if ((response.data as any)?.success) {
             const questions = (response.data as any).data.questions
             setExtractedSujets(questions.map((q: any) => q.question))
             toast.success(`Sujets extraits avec succès - VAPI gérera automatiquement les questions et la difficulté`)
           } else {
             toast.error('Erreur lors de l\'extraction des sujets')
           }
    } catch (error) {
      console.error('Error extracting topics:', error)
      toast.error('Erreur lors de l\'extraction des sujets')
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  // Save audio simulation
  const handleSaveSimulation = async () => {
    if (!simulator.title || !simulator.description || selectedSubscriptions.length === 0) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      const simulationData = {
        title: simulator.title,
        description: simulator.description,
        subscription: selectedSubscriptions,
        duration: parseInt(simulator.duration) || 420,
        category: 'GENERAL',
        instructions: simulator.instructions,
        // Voice preference is selected by students during booking
        maxDuration: maxDuration * 60, // Convert to seconds
        sujets: selectedSujets,
        extractedQuestions: extractedSujets
      }

      const response = await apiClient.post('/admin/audio-simulations', simulationData)
      
      if ((response.data as any)?.success) {
        toast.success('Simulation audio créée avec succès')
        router.push('/admin/content')
      } else {
        toast.error('Erreur lors de la création de la simulation')
      }
    } catch (error) {
      console.error('Error saving simulation:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Créer une Simulation Audio</h1>
          <p className="text-muted-foreground">Configurez une simulation vocale avec IA</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="ai-extraction" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Extraction IA
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Aperçu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Informations de base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre de la simulation *</Label>
                  <Input
                    id="title"
                    value={simulator.title}
                    onChange={(e) => setSimulator(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Simulation d'entretien professionnel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={simulator.duration}
                    onChange={(e) => setSimulator(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="420"
                    min="60"
                    max="1800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={simulator.description}
                  onChange={(e) => setSimulator(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez le contexte de la simulation..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions pour l'étudiant</Label>
                <Textarea
                  id="instructions"
                  value={simulator.instructions}
                  onChange={(e) => setSimulator(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Instructions spécifiques pour la simulation..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Configuration vocale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxDuration">Durée maximale (minutes)</Label>
                <Input
                  id="maxDuration"
                  type="number"
                  value={maxDuration}
                  onChange={(e) => setMaxDuration(parseInt(e.target.value) || 7)}
                  min="1"
                  max="30"
                />
                <p className="text-sm text-muted-foreground">
                  Les étudiants sélectionneront leur voix préférée lors de la réservation
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Niveaux et abonnements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Niveaux</Label>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Gestion automatique par VAPI:</strong> Les niveaux sont détectés et adaptés automatiquement selon le profil de l'étudiant lors de la simulation.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Abonnements *</Label>
                <div className="flex flex-wrap gap-2">
                  {availableSubscriptions.map((subscription) => (
                    <Badge
                      key={subscription}
                      variant={selectedSubscriptions.includes(subscription) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleSubscription(subscription)}
                    >
                      {subscription}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllSubscriptions}>
                    Tout sélectionner
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllSubscriptions}>
                    Tout désélectionner
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-extraction" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Extraction IA des sujets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sujets disponibles</Label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={loadSujets}
                    disabled={isLoadingSujets}
                  >
                    {isLoadingSujets ? <Loader className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                    Charger les sujets
                  </Button>
                </div>
                {availableSujets.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {availableSujets.map((sujet) => (
                      <Badge
                        key={sujet}
                        variant={selectedSujets.includes(sujet) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (selectedSujets.includes(sujet)) {
                            setSelectedSujets(prev => prev.filter(s => s !== sujet))
                          } else {
                            setSelectedSujets(prev => [...prev, sujet])
                          }
                        }}
                      >
                        {sujet}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload de fichier pour extraction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Fichier (PDF, TXT, DOC, DOCX)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file-upload"
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Glissez-déposez un fichier ou cliquez pour sélectionner
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Sélectionner un fichier
                    </Button>
                  </div>
                </div>
                {filePreview && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="text-sm">{filePreview}</span>
                    <Button variant="ghost" size="sm" onClick={clearFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="audio-upload">Fichier audio (MP3, WAV, M4A)</Label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6"
                  onDrop={handleAudioDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input
                    ref={audioInputRef}
                    type="file"
                    id="audio-upload"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                  />
                  <div className="text-center">
                    <Volume2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Glissez-déposez un fichier audio ou cliquez pour sélectionner
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => audioInputRef.current?.click()}
                    >
                      Sélectionner un audio
                    </Button>
                  </div>
                </div>
                {audioPreview && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <audio controls className="flex-1">
                      <source src={audioPreview} />
                    </audio>
                    <Button variant="ghost" size="sm" onClick={clearAudio}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Prompt IA pour extraction de sujets (optionnel)</Label>
                <Textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Décrivez les sujets/thèmes que vous souhaitez ajouter à la banque de questions pour VAPI..."
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  VAPI utilisera ces sujets pour générer des questions dynamiquement lors des simulations
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Brain className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Gestion intelligente par VAPI
                      </h3>
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                        <p>• VAPI génère automatiquement le nombre de questions optimal</p>
                        <p>• Commence par des questions faciles et progresse vers le difficile</p>
                        <p>• Gère intelligemment les 7 minutes disponibles par étudiant</p>
                        <p>• S'adapte au niveau et aux réponses de l'étudiant en temps réel</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleUploadTopicsToQuestionBank}
                disabled={isGeneratingQuestions || (!aiPrompt.trim() && !uploadedFile && !uploadedAudio)}
                className="w-full"
              >
                {isGeneratingQuestions ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Extraction en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Créer banque de sujets pour VAPI
                  </>
                )}
              </Button>

              {extractedSujets.length > 0 && (
                <div className="space-y-2">
                  <Label>Sujets extraits par l'IA:</Label>
                  <div className="flex flex-wrap gap-2">
                    {extractedSujets.map((sujet, index) => (
                      <Badge key={index} variant="secondary">
                        {sujet}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aperçu de la simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <p className="text-sm">{simulator.title || "Non défini"}</p>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <p className="text-sm">{simulator.description || "Non définie"}</p>
              </div>
              <div className="space-y-2">
                <Label>Durée</Label>
                <p className="text-sm">{simulator.duration ? `${simulator.duration} minutes` : "Non définie"}</p>
              </div>
              <div className="space-y-2">
                <Label>Voix</Label>
                <p className="text-sm text-muted-foreground">Sélectionnée par l'étudiant lors de la réservation</p>
              </div>
              <div className="space-y-2">
                <Label>Niveaux</Label>
                <p className="text-sm text-muted-foreground">Gérés automatiquement par VAPI selon le niveau de l'étudiant</p>
              </div>
              <div className="space-y-2">
                <Label>Abonnements sélectionnés</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedSubscriptions.map((subscription) => (
                    <Badge key={subscription} variant="outline">{subscription}</Badge>
                  ))}
                </div>
              </div>
              {selectedSujets.length > 0 && (
                <div className="space-y-2">
                  <Label>Sujets sélectionnés</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedSujets.map((sujet) => (
                      <Badge key={sujet} variant="secondary">{sujet}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {extractedSujets.length > 0 && (
                <div className="space-y-2">
                  <Label>Sujets extraits par l'IA</Label>
                  <div className="flex flex-wrap gap-2">
                    {extractedSujets.map((sujet, index) => (
                      <Badge key={index} variant="default">{sujet}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              onClick={handleSaveSimulation}
              className="flex items-center gap-2"
              disabled={!simulator.title || !simulator.description || selectedSubscriptions.length === 0}
            >
              <Save className="h-4 w-4" />
              Enregistrer la simulation
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("settings")}
            >
              Modifier les paramètres
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
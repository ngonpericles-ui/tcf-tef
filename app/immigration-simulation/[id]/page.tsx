"use client"

import React, { useState, useEffect, Suspense } from "react"

// Generate static params for static export
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Clock, Target, BookOpen, CheckCircle, ArrowLeft, Play, RotateCcw, Flag,
  Brain, Mic, MicOff, Video, VideoOff, AlertTriangle,
  Shield, User, Timer, Lock
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import FloatingAiAssistant from '@/components/FloatingAiAssistant';
import { useFloatingAiAssistant, PAGE_CONTEXTS } from '@/hooks/useFloatingAiAssistant';

function ImmigrationSimulationPageContent() {
  const { lang } = useLang()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Floating AI Assistant
  const { context: aiContext, isEnabled: aiEnabled, updateContext } = useFloatingAiAssistant({
    page: PAGE_CONTEXTS.IMMIGRATION_SIMULATION,
    simulationType: 'immigration',
    language: lang as 'fr' | 'en'
  });

  // State
  const [selectedCountry, setSelectedCountry] = useState<string>('france')
  const [isStarted, setIsStarted] = useState<boolean>(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [showAntiCheatingNotice, setShowAntiCheatingNotice] = useState<boolean>(true)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [cameraOn, setCameraOn] = useState<boolean>(true)
  const [vapiCall, setVapiCall] = useState<any>(null)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [callStatus, setCallStatus] = useState<string>('idle')
  const [voiceOptions, setVoiceOptions] = useState<any[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [immigrationQuestions, setImmigrationQuestions] = useState<any[]>([])
  const [vapiAssistant, setVapiAssistant] = useState<any>(null)

  const simulationId = params.id as string
  const countryParam = searchParams.get('country') || 'france'

  useEffect(() => {
    if (countryParam) {
      setSelectedCountry(countryParam)
    }
  }, [countryParam])

  // Update AI context when country changes
  useEffect(() => {
    updateContext({
      country: selectedCountry,
      immigrationType: 'general' // You can make this dynamic based on simulation type
    });
  }, [selectedCountry, updateContext])

  // Load VAPI configuration and immigration-specific data
  useEffect(() => {
    const loadImmigrationData = async () => {
      try {
        // Load voice options
        const voicesResponse = await apiClient.get('/voice-simulation/voices')
        if ((voicesResponse.data as any)?.success) {
          const voices = (voicesResponse.data as any).data
          setVoiceOptions(voices)

          // Set default voice based on country
          const defaultVoice = selectedCountry === 'france'
            ? voices.find((v: any) => v.accent === 'FRANCE' && v.gender === 'MALE') || voices[0]
            : voices.find((v: any) => v.accent === 'QUEBEC' && v.gender === 'FEMALE') || voices[1]

          setSelectedVoice(defaultVoice?.id || voices[0]?.id)
        }

        // Load immigration-specific questions
        const questionsResponse = await apiClient.get('/voice-simulation/questions/immigration')
        if ((questionsResponse.data as any)?.success) {
          const questions = (questionsResponse.data as any).data
          // Filter questions by country and immigration category
          const filteredQuestions = questions.filter((q: any) =>
            q.category === 'IMMIGRATION' &&
            (q.country === selectedCountry.toUpperCase() || q.country === 'BOTH')
          )
          setImmigrationQuestions(filteredQuestions)
        }
      } catch (error) {
        console.error('Error loading immigration data:', error)
        toast.error(t("Erreur lors du chargement des données", "Error loading data"))
      }
    }

    loadImmigrationData()
  }, [selectedCountry, t])

  useEffect(() => {
    if (isStarted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsStarted(false)
            endVapiCall()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isStarted, timeRemaining])

  // VAPI Integration Functions
  const startVapiCall = async () => {
    try {
      setIsConnecting(true)
      setCallStatus('connecting')

      if (immigrationQuestions.length === 0) {
        toast.error(t("Aucune question d'immigration disponible", "No immigration questions available"))
        setCallStatus('error')
        return
      }

      // Create VAPI assistant with immigration-specific configuration
      const assistantData = {
        name: `Immigration Officer - ${selectedCountry === 'france' ? 'France' : 'Canada'}`,
        voice: selectedVoice,
        questions: immigrationQuestions.slice(0, 8), // Limit to 8 questions for 30-minute session
        category: 'IMMIGRATION',
        country: selectedCountry.toUpperCase(),
        firstMessage: selectedCountry === 'france'
          ? "Bonjour, je suis l'officier d'immigration français. Nous allons procéder à votre entretien d'immigration. Êtes-vous prêt à commencer ?"
          : "Bonjour, je suis l'agent d'immigration canadien. Nous allons procéder à votre entretien d'immigration. Are you ready to begin?",
        systemPrompt: `You are an immigration officer for ${selectedCountry === 'france' ? 'France' : 'Canada'}.
          Conduct a realistic immigration interview using the provided questions.
          Speak in ${selectedCountry === 'france' ? 'French with a France accent' : 'French with a Quebec accent'}.
          Be professional but thorough. Ask follow-up questions based on responses.
          The interview should last approximately 25-30 minutes.`
      }

      // Create VAPI assistant
      const assistantResponse = await apiClient.post('/voice-simulation/create-immigration-assistant', assistantData)

      if ((assistantResponse.data as any)?.success) {
        const assistant = (assistantResponse.data as any).data
        setVapiAssistant(assistant)

        // Start voice simulation with the created assistant
        const response = await apiClient.post(`/voice-simulation/start/${simulationId}`, {
          assistantId: assistant.id,
          voicePreference: selectedVoice,
          category: 'IMMIGRATION',
          country: selectedCountry
        })

        if ((response.data as any)?.success) {
          const callData = (response.data as any).data
          setVapiCall(callData.call)
          setCallStatus('active')
          setIsRecording(true)
          toast.success(t("Simulation d'immigration démarrée", "Immigration simulation started"))
        }
      }
    } catch (error) {
      console.error('Error starting VAPI call:', error)
      toast.error(t("Erreur lors du démarrage de la simulation vocale", "Error starting voice simulation"))
      setCallStatus('error')
    } finally {
      setIsConnecting(false)
    }
  }

  const endVapiCall = async () => {
    try {
      if (vapiCall) {
        await apiClient.post(`/voice-simulation/end/${simulationId}`)
        setVapiCall(null)
        setCallStatus('ended')
        setIsRecording(false)
        toast.success(t("Simulation terminée", "Simulation ended"))
      }
    } catch (error) {
      console.error('Error ending VAPI call:', error)
      toast.error(t("Erreur lors de l'arrêt de la simulation", "Error ending simulation"))
    }
  }

  const handleStart = async () => {
    setIsStarted(true)
    setTimeRemaining(30 * 60) // 30 minutes
    setShowAntiCheatingNotice(false)

    // Start VAPI voice simulation
    await startVapiCall()
  }

  const handleReset = async () => {
    setIsStarted(false)
    setTimeRemaining(0)
    setShowAntiCheatingNotice(true)

    // End VAPI call if active
    await endVapiCall()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleMicrophoneToggle = () => {
    setIsRecording(!isRecording)
  }

  const handleCameraToggle = () => {
    setCameraOn(!cameraOn)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Anti-Cheating Notice */}
      {showAntiCheatingNotice && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <CardTitle className="text-lg">
                {t("Règles de la Simulation", "Simulation Rules")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <Video className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>{t("Votre caméra doit rester allumée", "Your camera must remain on")}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Lock className="w-4 h-4 text-red-600 mt-0.5" />
                  <span>{t("Ne quittez pas cette page", "Do not leave this page")}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Mic className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>{t("Parlez clairement dans votre microphone", "Speak clearly")}</span>
                </div>
              </div>
              <Button 
                onClick={() => setShowAntiCheatingNotice(false)}
                className="w-full"
              >
                {t("J'accepte et je commence", "I accept and start")}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/immigration-simulations")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("Retour", "Back")}
              </Button>
              <div>
                <h1 className="text-lg font-semibold">
                  {t("Simulation d'Immigration", "Immigration Simulation")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("Entretien avec un agent IA", "Interview with AI agent")}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Country Selection */}
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="france">
                    <div className="flex items-center space-x-2">
                      <Flag className="w-4 h-4" />
                      <span>France</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="canada">
                    <div className="flex items-center space-x-2">
                      <Flag className="w-4 h-4" />
                      <span>Canada</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Timer */}
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                <Timer className="w-4 h-4 text-gray-600" />
                <span className="font-mono font-medium">
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
                {!isStarted ? (
                  <Button
                    onClick={handleStart}
                    size="sm"
                    disabled={!selectedVoice || immigrationQuestions.length === 0 || isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {t("Connexion...", "Connecting...")}
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        {t("Commencer Simulation VAPI", "Start VAPI Simulation")}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t("Reset", "Reset")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!isStarted ? (
          // Pre-simulation screen
          <div className="space-y-6">
            {/* Voice Configuration */}
            <Card className="border-purple-200 dark:border-purple-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="w-5 h-5 text-purple-600" />
                  <span>{t("Configuration Vocale", "Voice Configuration")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">{t("Sélection de la Voix", "Voice Selection")}</h3>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger className="border-purple-200 dark:border-purple-700">
                        <SelectValue placeholder={t("Choisir une voix", "Choose a voice")} />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceOptions
                          .filter(voice =>
                            selectedCountry === 'france'
                              ? voice.accent === 'FRANCE'
                              : voice.accent === 'QUEBEC'
                          )
                          .map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.name} ({voice.gender}, {voice.accent})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      {selectedCountry === 'france'
                        ? t("Voix avec accent français authentique", "Authentic French accent voices")
                        : t("Voix avec accent québécois authentique", "Authentic Quebec accent voices")
                      }
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">{t("Questions Disponibles", "Available Questions")}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                        <span className="text-sm">{t("Questions d'immigration", "Immigration questions")}</span>
                        <Badge variant="secondary">{immigrationQuestions.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <span className="text-sm">{t("Pays sélectionné", "Selected country")}</span>
                        <Badge variant="outline">
                          {selectedCountry === 'france' ? 'France' : 'Canada'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{t("Aperçu de la Simulation", "Simulation Overview")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">{t("Sections", "Sections")}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{t("Présentation", "Presentation")}</p>
                          <p className="text-sm text-muted-foreground">{t("Informations personnelles", "Personal information")}</p>
                        </div>
                        <Badge variant="secondary">10 min</Badge>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{t("Expérience", "Experience")}</p>
                          <p className="text-sm text-muted-foreground">{t("Professionnelle et formation", "Professional and education")}</p>
                        </div>
                        <Badge variant="secondary">15 min</Badge>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          3
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{t("Motivation", "Motivation")}</p>
                          <p className="text-sm text-muted-foreground">{t("Projet d'immigration", "Immigration project")}</p>
                        </div>
                        <Badge variant="secondary">5 min</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">{t("Informations Importantes", "Important Information")}</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <Clock className="w-4 h-4 text-blue-600 mt-1" />
                        <div>
                          <p className="font-medium">{t("Durée totale", "Total duration")}</p>
                          <p className="text-sm text-muted-foreground">30 minutes</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Target className="w-4 h-4 text-green-600 mt-1" />
                        <div>
                          <p className="font-medium">{t("Niveau cible", "Target level")}</p>
                          <p className="text-sm text-muted-foreground">B2-C1</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Shield className="w-4 h-4 text-orange-600 mt-1" />
                        <div>
                          <p className="font-medium">{t("Règles strictes", "Strict rules")}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("Caméra obligatoire, pas de sortie de page", "Camera required")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Active simulation interface
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Panel - AI Agent */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>
                      {t("Agent IA", "AI Agent")} - {selectedCountry === 'france' ? 'France' : 'Canada'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* AI Avatar */}
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      <p className="font-medium">
                        {selectedCountry === 'france' ? 'Officier Immigration France' : 'Officier Immigration Canada'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedCountry === 'france' ? 'Accent français' : 'Accent québécois'}
                      </p>
                    </div>
                  </div>

                  {/* VAPI Status */}
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      {callStatus === 'connecting' && (
                        <div className="flex items-center gap-2 text-yellow-600">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                          <span className="text-sm">{t("Connexion VAPI...", "Connecting VAPI...")}</span>
                        </div>
                      )}
                      {callStatus === 'active' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm">{t("VAPI actif", "VAPI active")}</span>
                        </div>
                      )}
                      {callStatus === 'error' && (
                        <div className="flex items-center gap-2 text-red-600">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span className="text-sm">{t("Erreur VAPI", "VAPI error")}</span>
                        </div>
                      )}
                      {callStatus === 'ended' && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="w-2 h-2 bg-gray-500 rounded-full" />
                          <span className="text-sm">{t("VAPI terminé", "VAPI ended")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Current AI Response */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      {t("Message actuel", "Current message")}:
                    </p>
                    <p className="text-blue-800">
                      {selectedCountry === 'france' 
                        ? "Bonjour, je suis l'agent d'immigration. Pouvez-vous vous présenter ?"
                        : "Bonjour, je suis l'agent d'immigration canadien. Comment allez-vous ?"
                      }
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="space-y-3">
                    <Button
                      variant={isRecording ? "destructive" : "default"}
                      onClick={handleMicrophoneToggle}
                      className="w-full"
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4 mr-2" />
                          {t("Arrêter l'enregistrement", "Stop Recording")}
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          {t("Commencer à parler", "Start Speaking")}
                        </>
                      )}
                    </Button>

                    <Button
                      variant={cameraOn ? "default" : "outline"}
                      onClick={handleCameraToggle}
                      className="w-full"
                    >
                      {cameraOn ? (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          {t("Caméra Activée", "Camera On")}
                        </>
                      ) : (
                        <>
                          <VideoOff className="w-4 h-4 mr-2" />
                          {t("Caméra Désactivée", "Camera Off")}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Conversation and Navigation */}
            <div className="lg:col-span-2 space-y-6">
              {/* Conversation Transcript */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5" />
                    <span>{t("Simulation en Cours", "Simulation in Progress")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      {t("Simulation Active", "Active Simulation")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("Parlez avec l'agent IA via votre microphone", "Speak with the AI agent via your microphone")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Section Navigation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>{t("Progression des Sections", "Section Progress")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { id: 'presentation', title: t("Présentation", "Presentation"), duration: 10 },
                      { id: 'experience', title: t("Expérience", "Experience"), duration: 15 },
                      { id: 'motivation', title: t("Motivation", "Motivation"), duration: 5 }
                    ].map((section, index) => (
                      <div key={section.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-medium text-white">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{section.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {t("En cours...", "In progress...")}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">{section.duration} min</Badge>
                        </div>
                        <Progress value={33} className="w-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Floating AI Assistant */}
      {aiEnabled && <FloatingAiAssistant context={aiContext} />}
    </div>
  )
}

export default function ImmigrationSimulationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    }>
      <ImmigrationSimulationPageContent />
    </Suspense>
  )
}

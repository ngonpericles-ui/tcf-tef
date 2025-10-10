"use client"

import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

import { Upload, CheckCircle, FileText, Brain, Cloud, ArrowLeft, Loader2, Trash2, Eye } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import apiClient from "@/lib/api-client"
import { toast } from "sonner"

interface ExtractedQuestion {
  id: string
  question: string
  type: string
  options?: string[]
  correctAnswer: string
  category: string
  level: string
  points: number
}

interface SimulationConfig {
  title: string
  description: string
  type: string
  level: string
  category: string
  duration: number
  targetTier: string
}

export default function SimulationBuilderPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determine if admin or manager
  const isAdmin = pathname.startsWith('/admin')
  const basePath = isAdmin ? '/admin' : '/manager'

  // State
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [files, setFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<{url: string, name: string, type: string}[]>([])
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([])
  const [config, setConfig] = useState<SimulationConfig>({
    title: "",
    description: "",
    type: "TCF",
    level: "B1",
    category: "GENERAL",
    duration: 90,
    targetTier: "FREE"
  })
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showUploadAnimation, setShowUploadAnimation] = useState(false)

  // File handling functions
  const handleFileSelect = (fileList: FileList) => {
    const newFiles = Array.from(fileList).filter(file => {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'audio/mpeg', 'audio/wav', 'video/mp4']
      const maxSize = 100 * 1024 * 1024 // 100MB

      if (!validTypes.includes(file.type)) {
        toast.error(t(`Type de fichier non supporté: ${file.name}`, `Unsupported file type: ${file.name}`))
        return false
      }

      if (file.size > maxSize) {
        toast.error(t(`Fichier trop volumineux: ${file.name}`, `File too large: ${file.name}`))
        return false
      }

      return true
    })

    setFiles(prev => [...prev, ...newFiles])
    setShowUploadAnimation(true)
    setTimeout(() => setShowUploadAnimation(false), 1200)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'aura_ca_uploads') // You may need to create this preset
    formData.append('cloud_name', 'dk5x9flh0')

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dk5x9flh0/auto/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      return data.secure_url
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      throw error
    }
  }

  // Upload all files to Cloudinary
  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error(t("Veuillez sélectionner au moins un fichier", "Please select at least one file"))
      return false
    }

    setLoading(true)
    try {
      const uploadPromises = files.map(async (file) => {
        const url = await uploadToCloudinary(file)
        return {
          url,
          name: file.name,
          type: file.type
        }
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      setUploadedFiles(uploadedFiles)
      toast.success(t(`${uploadedFiles.length} fichiers téléchargés avec succès`, `${uploadedFiles.length} files uploaded successfully`))
      return true
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(t("Erreur lors du téléchargement", "Upload error"))
      return false
    } finally {
      setLoading(false)
    }
  }

  // AI Question Extraction
  const extractQuestions = async () => {
    if (uploadedFiles.length === 0) {
      toast.error(t("Veuillez d'abord télécharger des fichiers", "Please upload files first"))
      return
    }

    setExtracting(true)
    try {
      const allQuestions: ExtractedQuestion[] = []

      for (const file of uploadedFiles) {
        if (file.type === 'application/pdf') {
          const response = await apiClient.post('/simulations/extract-questions', {
            pdfUrl: file.url,
            simulationType: config.type,
            level: config.level
          })

          if (response.success && response.data) {
            const questions = response.data.questions || []
            allQuestions.push(...questions)
          }
        }
      }

      setExtractedQuestions(allQuestions)
      toast.success(t(`${allQuestions.length} questions extraites avec succès`, `${allQuestions.length} questions extracted successfully`))

      if (allQuestions.length > 0) {
        setStep(3)
      }
    } catch (error) {
      console.error('Question extraction error:', error)
      toast.error(t("Erreur lors de l'extraction des questions", "Question extraction error"))
    } finally {
      setExtracting(false)
    }
  }

  // Save simulation to database
  const saveSimulation = async () => {
    if (!config.title || !config.description) {
      toast.error(t("Veuillez remplir le titre et la description", "Please fill in title and description"))
      return
    }

    if (extractedQuestions.length === 0) {
      toast.error(t("Aucune question extraite", "No questions extracted"))
      return
    }

    setSaving(true)
    try {
      // Save simulation using upload-paper endpoint
      const response = await apiClient.post('/simulations/upload-paper', {
        title: config.title,
        description: config.description,
        type: config.type,
        level: config.level,
        category: config.category,
        targetTier: config.targetTier,
        fileName: `${config.title}.json`,
        fileUrl: uploadedFiles[0]?.url || '',
        fileType: 'simulation',
        createdById: 'current-user-id' // This should come from auth context
      })

      if (response.success) {
        toast.success(t("Simulation créée avec succès", "Simulation created successfully"))

        // Reset form
        setFiles([])
        setUploadedFiles([])
        setExtractedQuestions([])
        setConfig({
          title: "",
          description: "",
          type: "TCF",
          level: "B1",
          category: "GENERAL",
          duration: 90,
          targetTier: "FREE"
        })
        setStep(1)

        // Redirect back to content page
        router.push(`${basePath}/content/create`)
      }
    } catch (error) {
      console.error('Save simulation error:', error)
      toast.error(t("Erreur lors de la sauvegarde", "Save error"))
    } finally {
      setSaving(false)
    }
  }

  // Step navigation
  const handleContinueToConfig = async () => {
    const success = await uploadFiles()
    if (success) {
      setStep(2)
    }
  }

  const handleContinueToExtraction = () => {
    if (!config.title || !config.description) {
      toast.error(t("Veuillez remplir le titre et la description", "Please fill in title and description"))
      return
    }
    extractQuestions()
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`${basePath}/content/create`)}
              className="border-gray-200 dark:border-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t("Constructeur de Simulation", "Simulation Builder")}</h1>
              <p className="text-muted-foreground">{t("Créer une simulation TCF/TEF avec IA", "Create TCF/TEF simulation with AI")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant={step === 1 ? 'default' : 'outline'}>1. {t("Fichiers", "Files")}</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant={step === 2 ? 'default' : 'outline'}>2. {t("Configuration", "Config")}</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant={step === 3 ? 'default' : 'outline'}>3. {t("Questions", "Questions")}</Badge>
          </div>
        </div>

        {/* Step 1: File Upload */}
        {step === 1 && (
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                {t("Téléchargement des Fichiers", "File Upload")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg text-center relative p-16 ${isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-gray-200 dark:border-gray-700'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files) }}
              >
                {showUploadAnimation && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-10 animate-pulse">
                    <div className="bg-green-500 rounded-full p-4 animate-bounce">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}
                <Upload className="w-14 h-14 mx-auto mb-3 text-foreground" />
                <div className="text-foreground text-lg mb-1">{t("Glissez-déposez vos fichiers", "Drag and drop your files")}</div>
                <div className="text-sm text-muted-foreground mb-4">PDF, DOC, MP3, WAV, MP4 (max 100MB)</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.mp3,.wav,.mp4"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {t("Sélectionner des fichiers", "Select files")}
                </Button>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">{t("Fichiers sélectionnés", "Selected files")}</h4>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFile(index)}
                        className="border-red-200 dark:border-red-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleContinueToConfig}
                  disabled={files.length === 0 || loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("Téléchargement...", "Uploading...")}
                    </>
                  ) : (
                    t("Continuer", "Continue")
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Configuration */}
        {step === 2 && (
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                {t("Configuration de la Simulation", "Simulation Configuration")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Titre", "Title")}</Label>
                  <Input
                    value={config.title}
                    onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={t("Titre de la simulation", "Simulation title")}
                    className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Type", "Type")}</Label>
                  <Select value={config.type} onValueChange={(v) => setConfig(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TCF">TCF</SelectItem>
                      <SelectItem value="TEF">TEF</SelectItem>
                      <SelectItem value="DELF">DELF</SelectItem>
                      <SelectItem value="DALF">DALF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{t("Description", "Description")}</Label>
                <Textarea
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t("Description de la simulation", "Simulation description")}
                  className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  rows={3}
                />
              </div>

              {/* Advanced Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Niveau", "Level")}</Label>
                  <Select value={config.level} onValueChange={(v) => setConfig(prev => ({ ...prev, level: v }))}>
                    <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["A1", "A2", "B1", "B2", "C1", "C2"].map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Durée (minutes)", "Duration (minutes)")}</Label>
                  <Input
                    type="number"
                    value={config.duration}
                    onChange={(e) => setConfig(prev => ({ ...prev, duration: Number(e.target.value) || 90 }))}
                    className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Niveau requis", "Required tier")}</Label>
                  <Select value={config.targetTier} onValueChange={(v) => setConfig(prev => ({ ...prev, targetTier: v }))}>
                    <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE">{t("Gratuit", "Free")}</SelectItem>
                      <SelectItem value="ESSENTIAL">{t("Essentiel", "Essential")}</SelectItem>
                      <SelectItem value="PREMIUM">{t("Premium", "Premium")}</SelectItem>
                      <SelectItem value="PRO">{t("Pro+", "Pro+")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Uploaded Files Preview */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Fichiers téléchargés", "Uploaded files")}</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Cloud className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-foreground">{file.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-gray-200 dark:border-gray-700"
                >
                  {t("Retour", "Back")}
                </Button>
                <Button
                  onClick={handleContinueToExtraction}
                  disabled={!config.title || !config.description || extracting}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {extracting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("Extraction IA...", "AI Extracting...")}
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      {t("Extraire Questions IA", "Extract Questions with AI")}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Questions Review */}
        {step === 3 && (
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {t("Questions Extraites", "Extracted Questions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {extractedQuestions.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">
                      {t(`${extractedQuestions.length} questions extraites avec succès`, `${extractedQuestions.length} questions extracted successfully`)}
                    </p>
                    <Badge variant="secondary">
                      {config.type} - {config.level}
                    </Badge>
                  </div>

                  {/* Questions Preview */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {extractedQuestions.slice(0, 10).map((question, index) => (
                      <div key={question.id} className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {question.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {question.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {question.points} pts
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-foreground mb-2">
                              {index + 1}. {question.question}
                            </p>
                            {question.options && question.options.length > 0 && (
                              <div className="space-y-1">
                                {question.options.map((option, optIndex) => (
                                  <div key={optIndex} className="text-xs text-muted-foreground ml-4">
                                    {String.fromCharCode(65 + optIndex)}. {option}
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-green-600 mt-2">
                              {t("Réponse", "Answer")}: {question.correctAnswer}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {extractedQuestions.length > 10 && (
                      <p className="text-center text-muted-foreground text-sm">
                        {t(`... et ${extractedQuestions.length - 10} autres questions`, `... and ${extractedQuestions.length - 10} more questions`)}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="border-gray-200 dark:border-gray-700"
                    >
                      {t("Retour", "Back")}
                    </Button>
                    <Button
                      onClick={saveSimulation}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t("Sauvegarde...", "Saving...")}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {t("Créer Simulation", "Create Simulation")}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {t("Aucune question extraite. Veuillez vérifier vos fichiers PDF.", "No questions extracted. Please check your PDF files.")}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="mt-4"
                  >
                    {t("Retour", "Back")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
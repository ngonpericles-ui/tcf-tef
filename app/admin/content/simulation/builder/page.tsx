'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  Plus,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import axios from 'axios';
import { UploadProgressCard } from '@/components/upload-progress-card';

interface Question {
  id: string;
  question: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "ESSAY";
  options?: string[];
  correctAnswer: string;
  points: number;
  section: string;
}

interface SectionConfig {
  name: string;
  duration: number; // in minutes
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  uploadType: "text" | "audio" | "pdf";
  uploadedFile?: File | null;
}

interface ExtractionResponse {
  questions: Question[];
}

export default function AdminSimulationBuilderPage() {
  const { t } = useLanguage();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadProgressData, setUploadProgressData] = useState<{ fileId: string; progress: number; status: 'uploading' | 'completed' | 'error'; error?: string } | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<"idle" | "uploading" | "extracting" | "complete" | "error">("idle");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState("parameters");

  // Simulation configuration
  const [simulationConfig, setSimulationConfig] = useState({
    title: "",
    description: "",
    type: "Épreuve typique" as "Épreuve typique",
    level: "B1",
    targetTier: "PRO" as "FREE" | "ESSENTIAL" | "PREMIUM" | "PRO",
  });

  // Section configurations for real TCF/TEF exam format
  const [sectionConfigs, setSectionConfigs] = useState<Record<string, SectionConfig>>({
    comprehension_ecrite: {
      name: "Compréhension Écrite",
      duration: 60,
      questionCount: 25,
      difficulty: "medium",
      uploadType: "pdf",
      uploadedFile: null
    },
    comprehension_orale: {
      name: "Compréhension Orale",
      duration: 25,
      questionCount: 25,
      difficulty: "medium",
      uploadType: "audio",
      uploadedFile: null
    },
    expression_ecrite: {
      name: "Expression Écrite",
      duration: 60,
      questionCount: 2,
      difficulty: "medium",
      uploadType: "text",
      uploadedFile: null
    },
    expression_orale: {
      name: "Expression Orale",
      duration: 15,
      questionCount: 3,
      difficulty: "medium",
      uploadType: "pdf",
      uploadedFile: null
    }
  });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, isAdmin, router]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      alert(t("Veuillez sélectionner un fichier PDF", "Please select a PDF file"))
      return
    }

    setPdfFile(file)
    setExtractionStatus("uploading")
    setUploadProgress(0)

    const fileId = Math.random().toString(36).substring(2, 11)
    setUploadProgressData({
      fileId,
      progress: 0,
      status: 'uploading'
    })

    try {
      // Upload PDF to Cloudinary with progress tracking
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", "aura_simulations")
      formData.append("folder", "simulations/pdfs")

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${(typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) || 'ddhhzeewn'}/upload`
      
      const cloudinaryResponse = await axios.post(cloudinaryUrl, formData, {
        timeout: 0, // No timeout
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && progressEvent.total > 0) {
            const loaded = progressEvent.loaded || 0
            const total = progressEvent.total || 1
            const calculatedProgress = Math.min(Math.max(0, Math.round((loaded / total) * 100)), 99)
            
            setUploadProgress(calculatedProgress)
            setUploadProgressData({
              fileId,
              progress: calculatedProgress,
              status: 'uploading'
            })
          }
        }
      })

      if (!cloudinaryResponse.data) {
        throw new Error("Failed to upload PDF")
      }

      const cloudinaryData = cloudinaryResponse.data
      setUploadProgress(100)
      setUploadProgressData({
        fileId,
        progress: 100,
        status: 'completed'
      })

      // Extract questions using AI
      setExtractionStatus("extracting")
      const extractionResponse = await apiClient.post("/simulations/extract-questions", {
        pdfUrl: cloudinaryData.secure_url,
        simulationType: simulationConfig.type,
        level: simulationConfig.level,
      })

      if (extractionResponse.success && extractionResponse.data) {
        const data = extractionResponse.data as ExtractionResponse;
        setExtractedQuestions(data.questions || [])
        setExtractionStatus("complete")
        setUploadProgress(100)
      } else {
        throw new Error("Failed to extract questions")
      }
    } catch (error) {
      console.error("Error processing PDF:", error)
      setExtractionStatus("error")
      setUploadProgressData({
        fileId: fileId || 'unknown',
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload error'
      })
      alert(t("Erreur lors du traitement du PDF", "Error processing PDF"))
    }
  }

  const handleSaveSimulation = async () => {
    if (!simulationConfig.title || extractedQuestions.length === 0) {
      alert(t("Veuillez remplir tous les champs requis", "Please fill all required fields"))
      return
    }

    setLoading(true)
    try {
      // Prepare simulation data with section configurations
      const simulationData = {
        ...simulationConfig,
        questions: extractedQuestions,
        questionCount: extractedQuestions.length,
        createdById: user?.id,
        sections: Object.entries(sectionConfigs).map(([key, section]) => ({
          key,
          name: section.name,
          duration: section.duration,
          questionCount: section.questionCount,
          difficulty: section.difficulty,
          uploadType: section.uploadType,
          questionsInSection: extractedQuestions.filter(q => q.section === key).length
        })),
        totalDuration: Object.values(sectionConfigs).reduce((sum, s) => sum + s.duration, 0),
        isCloudinaryReady: true,
        uploadedAt: new Date().toISOString()
      }

      // Save to backend
      const response = await apiClient.post("/simulations", simulationData)

      if ((response as any).success) {
        alert(t("✅ Simulation créée avec succès et uploadée sur Cloudinary!", "✅ Simulation created successfully and uploaded to Cloudinary!"))
        router.push("/admin/content")
      } else {
        throw new Error((response as any).message || "Failed to create simulation")
      }
    } catch (error: any) {
      console.error("Error saving simulation:", error)
      alert(t(`Erreur lors de la sauvegarde: ${error.message}`, `Error saving simulation: ${error.message}`))
    } finally {
      setLoading(false)
    }
  }

  const addManualQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      question: "",
      type: "MULTIPLE_CHOICE",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1,
      section: "comprehension_ecrite",
    }
    setExtractedQuestions([...extractedQuestions, newQuestion])
  }

  const handleGenerateWithAI = async (sectionKey: string) => {
    const section = sectionConfigs[sectionKey]
    if (!section.uploadedFile) {
      alert(t("Veuillez d'abord uploader un fichier pour cette section", "Please upload a file for this section first"))
      return
    }

    setLoading(true)
    setExtractionStatus("extracting")
    try {
      const formData = new FormData()
      formData.append("file", section.uploadedFile)
      formData.append("section", sectionKey)
      formData.append("questionCount", section.questionCount.toString())
      formData.append("difficulty", section.difficulty)
      formData.append("simulationType", simulationConfig.type)
      formData.append("lessonTitle", section.name)
      formData.append("courseTitle", simulationConfig.title || "Simulation TCF/TEF")

      const response = await apiClient.post("/ai/generate-questions-from-file", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })

      if ((response as any).success && (response as any).data?.questions) {
        const generatedQuestions = (response as any).data.questions.map((q: any, idx: number) => {
          // Ensure options is an array for multiple-choice questions
          let options = q.options || [];
          if (!Array.isArray(options)) {
            options = [];
          }
          // Ensure at least 4 options for multiple-choice
          if (q.type === "multiple-choice" && options.length < 4) {
            while (options.length < 4) {
              options.push("");
            }
          }

          // Map question types
          let mappedType = "MULTIPLE_CHOICE";
          if (q.type === "true-false") {
            mappedType = "TRUE_FALSE";
          } else if (q.type === "short-answer") {
            mappedType = "FILL_BLANK";
          } else if (q.type === "essay") {
            mappedType = "ESSAY";
          } else if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE" || q.type === "FILL_BLANK" || q.type === "ESSAY") {
            mappedType = q.type;
          }

          return {
          id: `${sectionKey}_${Date.now()}_${idx}`,
          question: q.questionText || q.question || "",
            type: mappedType,
            options: options,
            correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : (mappedType === "MULTIPLE_CHOICE" ? 0 : ""),
          points: q.points || 1,
          section: sectionKey
          };
        })

        setExtractedQuestions([...extractedQuestions, ...generatedQuestions])
        alert(t(`✅ ${generatedQuestions.length} questions générées pour ${section.name}!`, `✅ ${generatedQuestions.length} questions generated for ${section.name}!`))
      } else {
        throw new Error("Failed to generate questions")
      }
    } catch (error: any) {
      console.error("Error generating questions:", error)
      alert(t("Erreur lors de la génération des questions", "Error generating questions"))
    } finally {
      setLoading(false)
      setExtractionStatus("idle")
    }
  }

  const handleSectionFileUpload = (sectionKey: string, file: File) => {
    setSectionConfigs({
      ...sectionConfigs,
      [sectionKey]: { ...sectionConfigs[sectionKey], uploadedFile: file }
    })
  }

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setExtractedQuestions(
      extractedQuestions.map(q => q.id === questionId ? { ...q, ...updates } : q)
    )
  }

  const deleteQuestion = (questionId: string) => {
    setExtractedQuestions(extractedQuestions.filter(q => q.id !== questionId))
  }

  const getQuestionsBySection = (sectionKey: string) => {
    return extractedQuestions.filter(q => q.section === sectionKey)
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("Créateur de Simulation - Épreuve Typique", "Simulation Builder - Typical Exam")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t(
                "Créez des simulations d'examen typiques avec extraction AI de questions depuis PDF",
                "Create typical exam simulations with AI question extraction from PDF",
              )}
            </p>
          </div>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            {t("Administrateur", "Administrator")}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="parameters">{t("Paramètres", "Parameters")}</TabsTrigger>
            <TabsTrigger value="config">{t("Configuration", "Configuration")}</TabsTrigger>
            <TabsTrigger value="generate">{t("Générer IA", "Generate AI")}</TabsTrigger>
            <TabsTrigger value="upload">{t("Extraction", "Extraction")}</TabsTrigger>
            <TabsTrigger value="questions">{t("Questions", "Questions")} ({extractedQuestions.length})</TabsTrigger>
          </TabsList>

          {/* Parameters Tab - Section Configuration */}
          <TabsContent value="parameters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("Paramètres des Sections", "Section Parameters")}</CardTitle>
                <CardDescription>
                  {t("Configurez chaque section pour créer une épreuve typique", "Configure each section to create a typical exam")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(sectionConfigs).map(([key, section]) => (
                  <Card key={key} className="bg-muted/50 border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">{section.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Duration */}
                        <div className="space-y-2">
                          <Label className="text-foreground font-medium">
                            {t("Durée (minutes)", "Duration (minutes)")}
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            max="120"
                            value={section.duration}
                            onChange={(e) => {
                              setSectionConfigs({
                                ...sectionConfigs,
                                [key]: { ...section, duration: parseInt(e.target.value) || 1 }
                              })
                            }}
                            className="bg-background border-input text-foreground"
                          />
                        </div>

                        {/* Question Count */}
                        <div className="space-y-2">
                          <Label className="text-foreground font-medium">
                            {t("Nombre de questions", "Question Count")}
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            max="30"
                            value={section.questionCount}
                            onChange={(e) => {
                              setSectionConfigs({
                                ...sectionConfigs,
                                [key]: { ...section, questionCount: parseInt(e.target.value) || 1 }
                              })
                            }}
                            className="bg-background border-input text-foreground"
                          />
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-2">
                          <Label className="text-foreground font-medium">
                            {t("Niveau de difficulté", "Difficulty Level")}
                          </Label>
                          <Select
                            value={section.difficulty}
                            onValueChange={(value: any) => {
                              setSectionConfigs({
                                ...sectionConfigs,
                                [key]: { ...section, difficulty: value }
                              })
                            }}
                          >
                            <SelectTrigger className="bg-background border-input text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="easy">{t("Facile", "Easy")}</SelectItem>
                              <SelectItem value="medium">{t("Moyen", "Medium")}</SelectItem>
                              <SelectItem value="hard">{t("Difficile", "Hard")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Upload Type */}
                        <div className="space-y-2">
                          <Label className="text-foreground font-medium">
                            {t("Type d'upload", "Upload Type")}
                          </Label>
                          <Select
                            value={section.uploadType}
                            onValueChange={(value: any) => {
                              setSectionConfigs({
                                ...sectionConfigs,
                                [key]: { ...section, uploadType: value }
                              })
                            }}
                          >
                            <SelectTrigger className="bg-background border-input text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="text">{t("Texte", "Text")}</SelectItem>
                              <SelectItem value="audio">{t("Audio", "Audio")}</SelectItem>
                              <SelectItem value="pdf">{t("PDF", "PDF")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("Configuration de la Simulation", "Simulation Configuration")}</CardTitle>
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
                      placeholder={t("Ex: Épreuve Typique B1", "Ex: Typical Exam B1")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">{t("Type de Simulation", "Simulation Type")}</Label>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {t("Épreuve typique", "Typical Exam")}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {t("Les simulations créées ici sont des épreuves typiques pour la section 'Simulations réelles'", "Simulations created here are typical exams for the 'Real Simulations' section")}
                      </p>
                    </div>
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
                    placeholder={t("Décrivez la simulation...", "Describe the simulation...")}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generate with AI Tab */}
          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("Générer des Questions avec IA", "Generate Questions with AI")}</CardTitle>
                <CardDescription>
                  {t(
                    "Uploadez des fichiers pour chaque section et générez les questions automatiquement",
                    "Upload files for each section and generate questions automatically",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(sectionConfigs).map(([key, section]) => (
                  <Card key={key} className="bg-muted/50 border-border">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{section.name}</span>
                        <Badge variant="outline">
                          {section.questionCount} {t("questions", "questions")}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* File Upload for Section */}
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <Label htmlFor={`file-${key}`} className="cursor-pointer">
                          <div className="text-sm font-medium mb-1">
                            {section.uploadedFile
                              ? section.uploadedFile.name
                              : t("Cliquez pour uploader un fichier", "Click to upload a file")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {section.uploadType === "pdf" && t("Format PDF, max 50MB", "PDF format, max 50MB")}
                            {section.uploadType === "audio" && t("Format audio (MP3, WAV), max 50MB", "Audio format (MP3, WAV), max 50MB")}
                            {section.uploadType === "text" && t("Texte ou document", "Text or document")}
                          </div>
                        </Label>
                        <input
                          id={`file-${key}`}
                          type="file"
                          accept={
                            section.uploadType === "pdf"
                              ? ".pdf"
                              : section.uploadType === "audio"
                              ? "audio/*"
                              : ".txt,.doc,.docx"
                          }
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleSectionFileUpload(key, e.target.files[0])
                            }
                          }}
                          className="hidden"
                        />
                        
                        {/* Audio Player for uploaded audio files */}
                        {section.uploadedFile && section.uploadType === "audio" && (
                          <div className="mt-4">
                            <audio
                              controls
                              className="w-full max-w-md mx-auto"
                              src={URL.createObjectURL(section.uploadedFile)}
                            >
                              {t("Votre navigateur ne supporte pas la lecture audio.", "Your browser does not support audio playback.")}
                            </audio>
                          </div>
                        )}
                      </div>

                      {/* Generate Button */}
                      <Button
                        onClick={() => handleGenerateWithAI(key)}
                        disabled={loading || !section.uploadedFile}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      >
                        {loading && extractionStatus === "extracting" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t("Génération en cours...", "Generating...")}
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            {t("Générer les questions", "Generate Questions")}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PDF Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("Extraction de Questions depuis PDF", "Question Extraction from PDF")}</CardTitle>
                <CardDescription>
                  {t(
                    "Téléchargez un PDF et l'IA extraira automatiquement les questions",
                    "Upload a PDF and AI will automatically extract questions",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <Label htmlFor="pdf-upload" className="cursor-pointer">
                    <div className="text-lg font-medium mb-2">
                      {pdfFile
                        ? pdfFile.name
                        : t("Cliquez pour télécharger un PDF", "Click to upload a PDF")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("Format PDF uniquement, max 50MB", "PDF format only, max 50MB")}
                    </div>
                  </Label>
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handlePdfUpload}
                  />
                </div>

                {/* Upload Progress Card */}
                {uploadProgressData && pdfFile && (
                  <UploadProgressCard
                    upload={uploadProgressData}
                    file={{
                      id: uploadProgressData.fileId,
                      file: pdfFile,
                      name: pdfFile.name,
                      size: pdfFile.size,
                      type: pdfFile.type
                    }}
                    onRemove={() => {
                      setUploadProgressData(null)
                      setPdfFile(null)
                      setExtractionStatus("idle")
                    }}
                    onPause={() => {}}
                    onResume={() => {}}
                  />
                )}

                {extractionStatus === "extracting" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-500 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("Extraction en cours...", "Extracting...")}
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                {extractionStatus === "complete" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-500 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {t("Extraction terminée!", "Extraction complete!")}
                      </span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab - Comprehensive Display */}
          <TabsContent value="questions" className="space-y-4">
            {extractedQuestions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-lg font-medium text-foreground">{t("Aucune question", "No questions")}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("Générez des questions avec l'IA ou ajoutez-les manuellement", "Generate questions with AI or add them manually")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Card */}
                <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t("Total", "Total")}</p>
                        <p className="text-2xl font-bold text-foreground">{extractedQuestions.length}</p>
                      </div>
                      {Object.entries(sectionConfigs).map(([key, section]) => (
                        <div key={key}>
                          <p className="text-sm text-muted-foreground">{section.name}</p>
                          <p className="text-2xl font-bold text-foreground">{getQuestionsBySection(key).length}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Questions by Section */}
                {Object.entries(sectionConfigs).map(([sectionKey, section]) => {
                  const sectionQuestions = getQuestionsBySection(sectionKey)
                  if (sectionQuestions.length === 0) return null

                  return (
                    <Card key={sectionKey} className="border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{section.name}</span>
                          <Badge variant="secondary">{sectionQuestions.length} {t("questions", "questions")}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {sectionQuestions.map((question, idx) => (
                          <Card key={question.id} className="bg-muted/50 border-border">
                            <CardContent className="pt-6">
                              <div className="space-y-3">
                                {/* Question Number and Type */}
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    {t("Question", "Question")} {idx + 1}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {question.type}
                                  </Badge>
                                </div>

                                {/* Question Text */}
                                <div>
                                  <p className="text-foreground font-medium">{question.question}</p>
                                </div>

                                {/* Options for Multiple Choice */}
                                {question.type === "MULTIPLE_CHOICE" && question.options && (
                                  <div className="space-y-2 ml-4">
                                    {question.options.map((option, optIdx) => (
                                      <div
                                        key={optIdx}
                                        className={`p-2 rounded text-sm ${
                                          optIdx === parseInt(question.correctAnswer as string)
                                            ? "bg-green-500/20 border border-green-500/50 text-green-700 dark:text-green-300"
                                            : "bg-muted text-muted-foreground"
                                        }`}
                                      >
                                        {String.fromCharCode(65 + optIdx)}) {option}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Points and Correct Answer */}
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {t("Points", "Points")}: <span className="font-medium text-foreground">{question.points}</span>
                                  </span>
                                  <span className="text-muted-foreground">
                                    {t("Réponse", "Answer")}: <span className="font-medium text-foreground">{question.correctAnswer}</span>
                                  </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deleteQuestion(question.id)}
                                    className="text-red-500 hover:text-red-600 border-red-500/20 hover:bg-red-500/10"
                                  >
                                    {t("Supprimer", "Delete")}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>
                  )
                })}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            {t("Annuler", "Cancel")}
          </Button>
          <Button onClick={handleSaveSimulation} disabled={loading || extractedQuestions.length === 0}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("Sauvegarder la Simulation", "Save Simulation")}
          </Button>
        </div>
      </div>
    </div>
  )
}


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

interface Question {
  id: string;
  question: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "ESSAY";
  options?: string[];
  correctAnswer: string;
  points: number;
  section: string;
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
  const [extractionStatus, setExtractionStatus] = useState<"idle" | "uploading" | "extracting" | "complete" | "error">("idle");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);

  // Simulation configuration
  const [simulationConfig, setSimulationConfig] = useState({
    title: "",
    description: "",
    type: "TCF" as "TCF" | "TEF",
    level: "B1",
    duration: 90,
    targetTier: "PRO" as "FREE" | "ESSENTIAL" | "PREMIUM" | "PRO",
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

    try {
      // Upload PDF to Cloudinary
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", "aura_simulations")
      formData.append("folder", "simulations/pdfs")

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: "POST",
          body: formData,
        }
      )

      if (!cloudinaryResponse.ok) {
        throw new Error("Failed to upload PDF")
      }

      const cloudinaryData = await cloudinaryResponse.json()
      setUploadProgress(50)

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
      const response = await apiClient.post("/simulations", {
        ...simulationConfig,
        questions: extractedQuestions,
        questionCount: extractedQuestions.length,
        createdById: user?.id,
      })

      if (response.success) {
        alert(t("Simulation créée avec succès!", "Simulation created successfully!"))
        router.push("/admin/content")
      } else {
        throw new Error("Failed to create simulation")
      }
    } catch (error) {
      console.error("Error saving simulation:", error)
      alert(t("Erreur lors de la sauvegarde", "Error saving simulation"))
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

  // TODO: Add updateQuestion and deleteQuestion functions when question editing UI is implemented

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("Créateur de Simulation TCF/TEF", "TCF/TEF Simulation Builder")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t(
                "Créez des simulations d'examen avec extraction AI de questions depuis PDF",
                "Create exam simulations with AI question extraction from PDF",
              )}
            </p>
          </div>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            {t("Administrateur", "Administrator")}
          </Badge>
        </div>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">{t("Configuration", "Configuration")}</TabsTrigger>
            <TabsTrigger value="upload">{t("Extraction PDF", "PDF Extraction")}</TabsTrigger>
            <TabsTrigger value="questions">{t("Questions", "Questions")} ({extractedQuestions.length})</TabsTrigger>
          </TabsList>

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
                      placeholder={t("Ex: Simulation TCF B1", "Ex: TCF B1 Simulation")}
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
                    placeholder={t("Décrivez la simulation...", "Describe the simulation...")}
                    rows={4}
                  />
                </div>
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

                {extractionStatus !== "idle" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {extractionStatus === "uploading" && t("Téléchargement...", "Uploading...")}
                        {extractionStatus === "extracting" && t("Extraction en cours...", "Extracting...")}
                        {extractionStatus === "complete" && (
                          <span className="text-green-500 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            {t("Extraction terminée!", "Extraction complete!")}
                          </span>
                        )}
                        {extractionStatus === "error" && (
                          <span className="text-red-500 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {t("Erreur d'extraction", "Extraction error")}
                          </span>
                        )}
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab - Will be extended in next edit */}
          <TabsContent value="questions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("Questions Extraites", "Extracted Questions")}</CardTitle>
                    <CardDescription>
                      {t("Vérifiez et modifiez les questions", "Review and edit questions")}
                    </CardDescription>
                  </div>
                  <Button onClick={addManualQuestion} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("Ajouter", "Add")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {extractedQuestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t("Aucune question extraite", "No questions extracted")}</p>
                    <p className="text-sm">
                      {t("Téléchargez un PDF ou ajoutez des questions manuellement", "Upload a PDF or add questions manually")}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-lg font-medium">{extractedQuestions.length} {t("questions", "questions")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("Utilisez l'onglet suivant pour les modifier", "Use next tab to edit them")}
                    </p>
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
            {t("Sauvegarder la Simulation", "Save Simulation")}
          </Button>
        </div>
      </div>
    </div>
  )
}


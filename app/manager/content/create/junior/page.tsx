"use client"

import type React from "react"
import { useSearchParams } from "next/navigation"
import { useState, useCallback, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import {
  Upload,
  File,
  Video,
  ImageIcon,
  X,
  ArrowLeft,
  Plus,
  AlertCircle,
  BookOpen,
  Lock,
  FileText,
  CheckCircle,
  Circle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadedFile {
  id: string
  file: File
  name: string
  type: string
  size: number
  preview?: string
  title: string
  level: string
  subscription: string
  category: string
}

function JuniorManagerUploadContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const contentType = searchParams.get("type") || "course"
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Junior Manager Limitations
  const allowedLevels = ["A1", "A2", "B1"] // Limited to basic levels
  const allowedSubscriptions = ["Gratuit", "Essentiel"] // Cannot create premium content
  const maxFiles = 5 // Limited file upload
  const maxFileSize = 50 * 1024 * 1024 // 50MB limit instead of 100MB

  const getContentConfig = () => {
    switch (contentType) {
      case "test":
        return {
          title: t("Créer un test", "Create Test"),
          description: t("Créez des tests de base pour les niveaux A1-B1", "Create basic tests for A1-B1 levels"),
          buttonText: t("Aller au créateur de test", "Go to Test Builder"),
          redirectPath: "/manager/content/create/test-builder?role=junior",
        }
      case "course":
      default:
        return {
          title: t("Créer un cours", "Create Course"),
          description: t("Créez des cours de base pour les niveaux A1-B1", "Create basic courses for A1-B1 levels"),
          buttonText: t("Continuer vers l'analyse IA", "Continue to AI Analysis"),
          redirectPath: "/manager/content/process",
        }
    }
  }

  const contentConfig = getContentConfig()

  const handleFileUpload = useCallback(
    (files: FileList) => {
      if (uploadedFiles.length + files.length > maxFiles) {
        alert(t(`Limite de ${maxFiles} fichiers atteinte`, `Limit of ${maxFiles} files reached`))
        return
      }

      const newFiles: UploadedFile[] = Array.from(files)
        .filter((file) => file.size <= maxFileSize)
        .map((file) => ({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          type: file.type,
          size: file.size,
          preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
          title: file.name.replace(/\.[^/.]+$/, ""),
          level: "A1", // Default to basic level
          subscription: "Gratuit", // Default to free
          category: "Général",
        }))

      setUploadedFiles((prev) => [...prev, ...newFiles])
    },
    [uploadedFiles.length, maxFiles, maxFileSize, t],
  )

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

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const updateFileSettings = (id: string, field: string, value: string) => {
    setUploadedFiles((prev) => prev.map((file) => (file.id === id ? { ...file, [field]: value } : file)))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("video/")) return Video
    if (type.startsWith("image/")) return ImageIcon
    return File
  }

  const handleContinue = () => {
    if (contentType === "test") {
      router.push(contentConfig.redirectPath)
      return
    }

    if (uploadedFiles.length === 0) return

    const fileData = uploadedFiles.map((file) => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      title: file.title || file.name.replace(/\.[^/.]+$/, ""),
      level: file.level,
      subscription: file.subscription,
      category: file.category,
      uploadDate: new Date().toISOString(),
      status: "pending",
      contentType: contentType,
      managerRole: "junior",
    }))

    localStorage.setItem("uploadedFiles", JSON.stringify(fileData))
    localStorage.setItem("contentType", contentType)
    localStorage.setItem("managerRole", "junior")

    router.push(contentConfig.redirectPath)
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {contentConfig.title} - {t("manager.role.junior", "Junior Manager")}
              </h1>
              <p className="text-sm mt-1 text-muted-foreground">{contentConfig.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
              {t("manager.role.junior", "Junior Manager")}
            </Badge>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
              {contentType === "test"
                ? t("Créateur de test", "Test Builder")
                : `${uploadedFiles.length}/${maxFiles} ${t("fichiers", "files")}`}
            </Badge>
          </div>
        </div>

        {contentType === "test" ? (
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {t("Créateur de test pour Junior Manager", "Test Builder for Junior Manager")}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t(
                  "Créez des tests avec des questions à choix multiples et vrai/faux pour les niveaux A1-B1",
                  "Create tests with multiple choice and true/false questions for A1-B1 levels",
                )}
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    <h4 className="font-medium text-foreground mb-1">{t("Choix multiple", "Multiple Choice")}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t("Questions avec options", "Questions with options")}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Circle className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                    <h4 className="font-medium text-foreground mb-1">{t("Vrai/Faux", "True/False")}</h4>
                    <p className="text-xs text-muted-foreground">{t("Questions binaires", "Binary questions")}</p>
                  </div>
                </div>
                <Button onClick={handleContinue} className="bg-green-600 hover:bg-green-700 text-white">
                  {contentConfig.buttonText}
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1 text-amber-400">
                      {t("Limitations du Manager Junior", "Junior Manager Limitations")}
                    </h4>
                    <ul className="text-sm space-y-1 text-amber-300">
                      <li>• {t("Maximum 5 fichiers par cours", "Maximum 5 files per course")}</li>
                      <li>• {t("Niveaux A1-B1 uniquement", "A1-B1 levels only")}</li>
                      <li>• {t("Contenu gratuit et essentiel seulement", "Free and essential content only")}</li>
                      <li>• {t("Taille maximale: 50MB par fichier", "Maximum size: 50MB per file")}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Area */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-card border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                        isDragging ? "border-green-500 bg-green-500/5" : "border-gray-200 dark:border-gray-700 hover:border-muted-foreground",
                      )}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2 text-foreground">
                        {t("Glissez-déposez vos fichiers ici", "Drag and drop your files here")}
                      </h3>
                      <p className="text-sm mb-4 text-muted-foreground">
                        {t(
                          `Ou cliquez pour sélectionner jusqu'à ${maxFiles} fichiers`,
                          `Or click to select up to ${maxFiles} files`,
                        )}
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="*/*"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        className="hidden"
                        id="file-upload"
                      />
                      <Label htmlFor="file-upload">
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                          <Plus className="w-4 h-4 mr-2" />
                          {t("Sélectionner des fichiers", "Select Files")}
                        </Button>
                      </Label>
                      <p className="text-xs mt-4 text-muted-foreground">
                        {t(
                          "Formats supportés: PDF, DOC, MP4, MP3, JPG, PNG (Max: 50MB par fichier)",
                          "Supported formats: PDF, DOC, MP4, MP3, JPG, PNG (Max: 50MB per file)",
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {uploadedFiles.length > 0 && (
                  <Card className="bg-card border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-foreground">
                        {t("Fichiers téléchargés", "Uploaded Files")} ({uploadedFiles.length}/{maxFiles})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {uploadedFiles.map((file) => {
                        const FileIcon = getFileIcon(file.type)
                        return (
                          <div
                            key={file.id}
                            className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-muted/50"
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              {file.preview ? (
                                <img
                                  src={file.preview || "/placeholder.svg"}
                                  alt={file.name}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded flex items-center justify-center bg-muted">
                                  <FileIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <Input
                                  value={file.title}
                                  onChange={(e) => updateFileSettings(file.id, "title", e.target.value)}
                                  className="font-medium mb-2 bg-input border-gray-200 dark:border-gray-700 text-foreground"
                                  placeholder={t("Titre du contenu", "Content title")}
                                />
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="text-muted-foreground">{file.name}</span>
                                  <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Select
                                  value={file.level}
                                  onValueChange={(value) => updateFileSettings(file.id, "level", value)}
                                >
                                  <SelectTrigger className="w-20 bg-input border-gray-200 dark:border-gray-700">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allowedLevels.map((level) => (
                                      <SelectItem key={level} value={level}>
                                        {level}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="B2" disabled>
                                      <div className="flex items-center space-x-2">
                                        <Lock className="w-3 h-3" />
                                        <span>B2 - {t("Verrouillé", "Locked")}</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="C1" disabled>
                                      <div className="flex items-center space-x-2">
                                        <Lock className="w-3 h-3" />
                                        <span>C1 - {t("Verrouillé", "Locked")}</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="C2" disabled>
                                      <div className="flex items-center space-x-2">
                                        <Lock className="w-3 h-3" />
                                        <span>C2 - {t("Verrouillé", "Locked")}</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>

                                <Select
                                  value={file.subscription}
                                  onValueChange={(value) => updateFileSettings(file.id, "subscription", value)}
                                >
                                  <SelectTrigger className="w-32 bg-input border-gray-200 dark:border-gray-700">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allowedSubscriptions.map((sub) => (
                                      <SelectItem key={sub} value={sub}>
                                        {sub}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="Premium" disabled>
                                      <div className="flex items-center space-x-2">
                                        <Lock className="w-3 h-3" />
                                        <span>Premium - {t("Verrouillé", "Locked")}</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="Pro+" disabled>
                                      <div className="flex items-center space-x-2">
                                        <Lock className="w-3 h-3" />
                                        <span>Pro+ - {t("Verrouillé", "Locked")}</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(file.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Settings Panel */}
              <div className="space-y-6">
                <Card className="bg-card border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center text-foreground">
                      <BookOpen className="w-5 h-5 mr-2" />
                      {t("Paramètres du cours", "Course Settings")}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {t("Configuration de base pour votre cours", "Basic configuration for your course")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">{t("Catégorie", "Category")}</Label>
                      <Select defaultValue="Général">
                        <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Général">Général</SelectItem>
                          <SelectItem value="Grammaire">Grammaire</SelectItem>
                          <SelectItem value="Vocabulaire">Vocabulaire</SelectItem>
                          <SelectItem value="Compréhension orale">Compréhension orale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">{t("Durée estimée", "Estimated Duration")}</Label>
                      <Select defaultValue="30">
                        <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 {t("minutes", "minutes")}</SelectItem>
                          <SelectItem value="30">30 {t("minutes", "minutes")}</SelectItem>
                          <SelectItem value="45">45 {t("minutes", "minutes")}</SelectItem>
                          <SelectItem value="60">1 {t("heure", "hour")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-foreground">{t("Résumé", "Summary")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("Fichiers", "Files")}</span>
                      <span className="font-medium text-foreground">
                        {uploadedFiles.length}/{maxFiles}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("Taille totale", "Total size")}</span>
                      <span className="font-medium text-foreground">
                        {formatFileSize(uploadedFiles.reduce((acc, file) => acc + file.size, 0))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("Type", "Type")}</span>
                      <Badge variant="outline" className="text-green-400 border-green-500/20">
                        {contentType === "test" ? t("Test de base", "Basic Test") : t("Cours de base", "Basic Course")}
                      </Badge>
                    </div>

                    <Button
                      onClick={handleContinue}
                      disabled={contentType === "course" && uploadedFiles.length === 0}
                      className="w-full text-white bg-green-600 hover:bg-green-700"
                    >
                      {contentConfig.buttonText}
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function JuniorManagerUpload() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    }>
      <JuniorManagerUploadContent />
    </Suspense>
  )
}

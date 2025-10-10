"use client"

import type React from "react"
import { useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  ArrowLeft,
  Plus,
  Settings,
  CheckCircle,
  FileText,
  GraduationCap,
  Edit2,
  Trash2,
  Check,
  X,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"
// import { useAuth } from "@/components/auth-provider"

interface UploadedFile {
  id: string
  file: File
  name: string
  type: string
  size: number
  preview?: string
}

function AdminBulkUploadPageContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  // const { user } = useAuth()
  const user = { id: 'admin', role: 'ADMIN' } // Placeholder for now
  const contentType = searchParams.get("type") || "course"

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showUploadAnimation, setShowUploadAnimation] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [uploading, setUploading] = useState(false)

  const [bulkSettings, setBulkSettings] = useState({
    title: "",
    level: "",
    subscription: "",
    category: "",
  })

  // Admin has full access to all levels and subscription tiers
  const adminLevelRestrictions = ["A1", "A2", "B1", "B2", "C1", "C2"]
  const adminSubscriptionRestrictions = ["Gratuit", "Essentiel", "Premium", "Pro+"]

  const contentTypeConfig = {
    course: {
      title: t("Cours", "Course"),
      description: t("Créez des cours complets pour tous les niveaux", "Create complete courses for all levels"),
      icon: FileText,
      color: "blue",
    },
    test: {
      title: t("Test", "Test"),
      description: t(
        "Téléchargez des questions et ressources pour créer un test",
        "Upload questions and resources to create a test",
      ),
      icon: File,
      color: "green",
    },
    "test-corrections": {
      title: t("Corrections TCF/TEF", "TCF/TEF Corrections"),
      description: t("Téléchargez des corrections et barèmes", "Upload corrections and scoring guides"),
      icon: GraduationCap,
      color: "orange",
    },
    note: {
      title: t("Note/Document", "Note/Document"),
      description: t("Téléchargez des documents de référence", "Upload reference documents"),
      icon: FileText,
      color: "teal",
    },
    video: {
      title: t("Contenu Vidéo", "Video Content"),
      description: t("Téléchargez des vidéos éducatives", "Upload educational videos"),
      icon: Video,
      color: "pink",
    },
    simulation: {
      title: t("Simulation TCF/TEF", "TCF/TEF Simulation"),
      description: t("Téléchargez du contenu pour la simulation IA", "Upload content for AI simulation"),
      icon: Settings,
      color: "purple",
    },
    "test-result": {
      title: t("Résultat de Test", "Test Result"),
      description: t("Téléchargez des corrections et barèmes", "Upload corrections and scoring guides"),
      icon: CheckCircle,
      color: "orange",
    },
  }

  const currentConfig = contentTypeConfig[contentType as keyof typeof contentTypeConfig] || contentTypeConfig.course

  const handleFileUpload = useCallback((files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    setShowUploadAnimation(true)
    setTimeout(() => setShowUploadAnimation(false), 2000)
  }, [])

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

  const handleFileInputClick = () => {
    const fileInput = document.getElementById("file-upload") as HTMLInputElement
    if (fileInput) {
      fileInput.click()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getTotalSize = () => {
    return uploadedFiles.reduce((total, file) => total + file.size, 0)
  }

  const handleContinue = async () => {
    if (uploadedFiles.length === 0 || !user) return

    setUploading(true)

    try {
      // Upload each file to the backend
      for (const file of uploadedFiles) {
        const formData = new FormData()
        formData.append('file', file.file)
        formData.append('title', bulkSettings.title || file.name.replace(/\.[^/.]+$/, ""))
        formData.append('description', `Uploaded ${contentType} content`)
        formData.append('level', bulkSettings.level || "A1")
        formData.append('subscriptionTier', mapSubscriptionTier(bulkSettings.subscription || "Gratuit"))
        formData.append('category', mapCategory(bulkSettings.category || "Général"))
        formData.append('contentType', mapContentType(contentType))
        formData.append('duration', '60')

        await apiClient.post('/content-management/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }

      // Redirect to content management page
      router.push("/admin/content")
    } catch (error) {
      console.error('Error uploading files:', error)
      alert(t("Erreur lors du téléchargement", "Error uploading files"))
    } finally {
      setUploading(false)
    }
  }

  const mapSubscriptionTier = (subscription: string) => {
    const mapping: { [key: string]: string } = {
      'Gratuit': 'FREE',
      'Essentiel': 'ESSENTIAL',
      'Premium': 'PREMIUM',
      'Pro+': 'PRO'
    }
    return mapping[subscription] || 'FREE'
  }

  const mapContentType = (type: string) => {
    const mapping: { [key: string]: string } = {
      'course': 'NOTE',
      'video': 'VIDEO',
      'test': 'TEST',
      'simulation': 'SIMULATION'
    }
    return mapping[type] || 'NOTE'
  }

  const mapCategory = (category: string) => {
    const mapping: { [key: string]: string } = {
      'Général': 'GRAMMAR',
      'Grammaire': 'GRAMMAR',
      'Écoute': 'LISTENING',
      'Lecture': 'READING',
      'Vocabulaire': 'VOCABULARY',
      'Écriture': 'WRITING',
      'Oral': 'ORAL',
      'TCF/TEF': 'TCF_TEF'
    }
    return mapping[category] || 'GRAMMAR'
  }

  const handleFileSelect = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles((prev) => [...prev, fileId])
    } else {
      setSelectedFiles((prev) => prev.filter((id) => id !== fileId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(uploadedFiles.map((file) => file.id))
    } else {
      setSelectedFiles([])
    }
  }

  const handleDeleteSelected = () => {
    setUploadedFiles((prev) => prev.filter((file) => !selectedFiles.includes(file.id)))
    setSelectedFiles([])
  }

  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
    setSelectedFiles((prev) => prev.filter((id) => id !== fileId))
  }

  const handleEditFileName = (fileId: string, currentName: string) => {
    setEditingFile(fileId)
    setEditingName(currentName.replace(/\.[^/.]+$/, "")) // Remove extension for editing
  }

  const handleSaveFileName = (fileId: string) => {
    const fileExtension = uploadedFiles
      .find((f) => f.id === fileId)
      ?.name.split(".")
      .pop()
    const newName = editingName + (fileExtension ? `.${fileExtension}` : "")

    setUploadedFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, name: newName } : file)))
    setEditingFile(null)
    setEditingName("")
  }

  const handleCancelEdit = () => {
    setEditingFile(null)
    setEditingName("")
  }

  // const ConfigIcon = currentConfig.icon

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/content")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("Téléchargement en lot", "Bulk Upload")} - {currentConfig.title}
              </h1>
              <p className="text-sm mt-1 text-foreground">{currentConfig.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-500/10 text-green-400">
            {uploadedFiles.length} {t("fichiers", "files")}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Area */}
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg text-center transition-colors relative overflow-hidden",
                    "p-24", // Version 48 design with larger padding
                    isDragging ? "border-blue-500 bg-blue-500/5" : "border-gray-200 dark:border-gray-700 hover:border-muted-foreground",
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {showUploadAnimation && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-10 animate-pulse">
                      <div className="bg-green-500 rounded-full p-4 animate-bounce">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}

                  <Upload className="w-16 h-16 mx-auto mb-4 text-foreground" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {t("Glissez-déposez vos fichiers ici", "Drag and drop your files here")}
                  </h3>
                  <p className="text-sm mb-6 text-foreground">
                    {t("Ou cliquez pour sélectionner jusqu'à 20 fichiers", "Or click to select up to 20 files")}
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="*/*"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <div className="flex justify-center">
                    <Button onClick={handleFileInputClick} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("Sélectionner des fichiers", "Select Files")}
                    </Button>
                  </div>
                  <p className="text-xs mt-4 text-foreground">
                    {t(
                      "Formats supportés: PDF, DOC, MP4, MP3, JPG, PNG (Max: 100MB par fichier)",
                      "Supported formats: PDF, DOC, MP4, MP3, JPG, PNG (Max: 100MB per file)",
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {uploadedFiles.length > 0 && (
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center">
                      <File className="w-5 h-5 mr-2" />
                      {t("Fichiers téléchargés", "Uploaded Files")} ({uploadedFiles.length})
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedFiles.length === uploadedFiles.length && uploadedFiles.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="border-gray-200 dark:border-gray-700"
                      />
                      <span className="text-sm text-foreground">{t("Tout sélectionner", "Select All")}</span>
                      {selectedFiles.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="ml-4">
                          <Trash2 className="w-4 h-4 mr-1" />
                          {t("Supprimer", "Delete")} ({selectedFiles.length})
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        selectedFiles.includes(file.id)
                          ? "bg-blue-500/10 border-blue-500/30"
                          : "bg-muted border-gray-200 dark:border-gray-700 hover:border-muted-foreground",
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedFiles.includes(file.id)}
                          onCheckedChange={(checked) => handleFileSelect(file.id, checked as boolean)}
                          className="border-gray-200 dark:border-gray-700"
                        />
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            {file.type.startsWith("image/") ? (
                              <img
                                src={file.preview || "/placeholder.svg"}
                                alt=""
                                className="w-8 h-8 object-cover rounded"
                              />
                            ) : file.type.startsWith("video/") ? (
                              <Video className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <FileText className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            {editingFile === file.id ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="bg-input border-gray-200 dark:border-gray-700 text-foreground text-sm w-48"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveFileName(file.id)
                                    if (e.key === "Escape") handleCancelEdit()
                                  }}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveFileName(file.id)}
                                  className="text-green-400 hover:text-green-300"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <p className="font-medium text-foreground text-sm">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {editingFile !== file.id && (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditFileName(file.id, file.name)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Paramètres en lot */}
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  {t("Paramètres en lot", "Bulk Settings")}
                </CardTitle>
                <p className="text-sm text-foreground">
                  {t("Appliquez ces paramètres à plusieurs fichiers", "Apply these settings to multiple files")}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Titre par défaut", "Default Title")}</Label>
                  <Input
                    value={bulkSettings.title}
                    onChange={(e) => setBulkSettings((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder={t("Titre pour tous les fichiers sélectionnés", "Title for all selected files")}
                    className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">{t("Niveau par défaut", "Default Level")}</Label>
                  <Select
                    value={bulkSettings.level}
                    onValueChange={(value) => setBulkSettings((prev) => ({ ...prev, level: value }))}
                  >
                    <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                      <SelectValue placeholder={t("Sélectionner un niveau", "Select a level")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                      {adminLevelRestrictions.map((level) => (
                        <SelectItem key={level} value={level} className="text-foreground hover:bg-muted">
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">{t("Abonnement par défaut", "Default Subscription")}</Label>
                  <Select
                    value={bulkSettings.subscription}
                    onValueChange={(value) => setBulkSettings((prev) => ({ ...prev, subscription: value }))}
                  >
                    <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                      <SelectValue placeholder={t("Sélectionner un abonnement", "Select a subscription")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                      {adminSubscriptionRestrictions.map((sub) => (
                        <SelectItem key={sub} value={sub} className="text-foreground hover:bg-muted">
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">{t("Catégorie", "Category")}</Label>
                  <Select
                    value={bulkSettings.category}
                    onValueChange={(value) => setBulkSettings((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                      <SelectValue placeholder={t("Sélectionner une catégorie", "Select a category")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                      <SelectItem value="Général" className="text-foreground hover:bg-muted">
                        {t("Général", "General")}
                      </SelectItem>
                      <SelectItem value="Grammaire" className="text-foreground hover:bg-muted">
                        {t("Grammaire", "Grammar")}
                      </SelectItem>
                      <SelectItem value="Vocabulaire" className="text-foreground hover:bg-muted">
                        {t("Vocabulaire", "Vocabulary")}
                      </SelectItem>
                      <SelectItem value="Compréhension" className="text-foreground hover:bg-muted">
                        {t("Compréhension", "Comprehension")}
                      </SelectItem>
                      <SelectItem value="TCF/TEF" className="text-foreground hover:bg-muted">
                        TCF/TEF
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Résumé", "Summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{t("Fichiers totaux", "Total Files")}</span>
                  <span className="font-medium text-foreground">{uploadedFiles.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{t("Taille totale", "Total Size")}</span>
                  <span className="font-medium text-foreground">{formatFileSize(getTotalSize())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{t("Type de contenu", "Content Type")}</span>
                  <Badge className={`bg-${currentConfig.color}-500/10 text-${currentConfig.color}-400`}>
                    {currentConfig.title}
                  </Badge>
                </div>
                <Button
                  onClick={handleContinue}
                  disabled={uploadedFiles.length === 0 || uploading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t("Téléchargement...", "Uploading...")}
                    </>
                  ) : (
                    <>
                      {t("Télécharger vers le serveur", "Upload to Server")}
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminBulkUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    }>
      <AdminBulkUploadPageContent />
    </Suspense>
  )
}

"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useLanguage } from "@/components/language-provider"
import {
  File,
  Video,
  ImageIcon,
  X,
  ArrowLeft,
  Plus,
  Settings,
  BookOpen,
  FileText,
  Zap,
  Target,
  Users,
  BarChart3,
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
  difficulty: string
  tags: string[]
}

export default function ContentManagerUpload() {
  const { t } = useLanguage()
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [contentType, setContentType] = useState("course")
  const [bulkSettings, setBulkSettings] = useState({
    level: "",
    subscription: "",
    category: "",
    difficulty: "",
    tags: [] as string[],
  })

  // Content Manager Capabilities - Full access
  const allowedLevels = ["A1", "A2", "B1", "B2", "C1", "C2"]
  const allowedSubscriptions = ["Gratuit", "Essentiel", "Premium", "Pro+"]
  const maxFiles = 20 // Full file upload capacity
  const maxFileSize = 100 * 1024 * 1024 // 100MB limit

  const contentTypes = [
    { value: "course", label: t("Cours", "Course"), icon: BookOpen, color: "blue" },
    { value: "test", label: t("Test", "Test"), icon: FileText, color: "green" },
    { value: "simulation", label: t("Simulation TCF/TEF", "TCF/TEF Simulation"), icon: Zap, color: "purple" },
    { value: "video", label: t("Contenu Vidéo", "Video Content"), icon: Video, color: "pink" },
    { value: "assessment", label: t("Évaluation", "Assessment"), icon: Target, color: "orange" },
  ]

  const difficultyLevels = [
    { value: "beginner", label: t("Débutant", "Beginner"), color: "green" },
    { value: "intermediate", label: t("Intermédiaire", "Intermediate"), color: "blue" },
    { value: "advanced", label: t("Avancé", "Advanced"), color: "purple" },
    { value: "expert", label: t("Expert", "Expert"), color: "red" },
  ]

  const availableTags = [
    "Grammaire",
    "Vocabulaire",
    "Compréhension orale",
    "Expression écrite",
    "TCF",
    "TEF",
    "DELF",
    "DALF",
    "Conversation",
    "Phonétique",
    "Culture française",
    "Français professionnel",
    "Préparation examen",
  ]

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
          level: bulkSettings.level || "B1",
          subscription: bulkSettings.subscription || "Essentiel",
          category: bulkSettings.category || "Général",
          difficulty: bulkSettings.difficulty || "intermediate",
          tags: [...bulkSettings.tags],
        }))

      setUploadedFiles((prev) => [...prev, ...newFiles])
    },
    [uploadedFiles.length, maxFiles, maxFileSize, bulkSettings, t],
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
    setSelectedFiles((prev) => prev.filter((fileId) => fileId !== id))
  }

  const updateFileSettings = (id: string, field: string, value: string | string[]) => {
    setUploadedFiles((prev) => prev.map((file) => (file.id === id ? { ...file, [field]: value } : file)))
  }

  const applyBulkSettings = () => {
    if (selectedFiles.length === 0) return

    setUploadedFiles((prev) =>
      prev.map((file) =>
        selectedFiles.includes(file.id)
          ? {
              ...file,
              level: bulkSettings.level || file.level,
              subscription: bulkSettings.subscription || file.subscription,
              category: bulkSettings.category || file.category,
              difficulty: bulkSettings.difficulty || file.difficulty,
              tags: bulkSettings.tags.length > 0 ? [...bulkSettings.tags] : file.tags,
            }
          : file,
      ),
    )
    setSelectedFiles([])
  }

  const selectAllFiles = () => {
    if (selectedFiles.length === uploadedFiles.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(uploadedFiles.map((file) => file.id))
    }
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

  const getDifficultyColor = (difficulty: string) => {
    const level = difficultyLevels.find((d) => d.value === difficulty)
    return level
      ? `bg-${level.color}-500/10 text-${level.color}-400 border-${level.color}-500/20`
      : "bg-gray-500/10 text-gray-400 border-gray-500/20"
  }

  const handleContinue = () => {
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
      difficulty: file.difficulty,
      tags: file.tags,
      uploadDate: new Date().toISOString(),
      status: "pending",
      contentType: contentType,
      managerRole: "content",
    }))

    localStorage.setItem("uploadedFiles", JSON.stringify(fileData))
    localStorage.setItem("contentType", contentType)
    localStorage.setItem("managerRole", "content")

    router.push("/manager/content/process")
  }

  const currentContentType = contentTypes.find((ct) => ct.value === contentType) || contentTypes[0]
  const ContentIcon = currentContentType.icon

  return (
    <div className="min-h-screen p-6 bg-gray-950">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 hover:text-gray-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {t("Créer du contenu", "Create Content")} - {t("Content Manager", "Content Manager")}
              </h1>
              <p className="text-sm mt-1 text-gray-400">
                {t("Créez du contenu avancé pour tous les niveaux", "Create advanced content for all levels")}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
              {t("Content Manager", "Content Manager")}
            </Badge>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              {uploadedFiles.length}/{maxFiles} {t("fichiers", "files")}
            </Badge>
          </div>
        </div>

        {/* Content Type Selection */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">{t("Type de contenu", "Content Type")}</CardTitle>
            <CardDescription className="text-gray-400">
              {t(
                "Sélectionnez le type de contenu que vous souhaitez créer",
                "Select the type of content you want to create",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {contentTypes.map((type) => {
                const TypeIcon = type.icon
                return (
                  <button
                    key={type.value}
                    onClick={() => setContentType(type.value)}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left",
                      contentType === type.value
                        ? `border-${type.color}-500 bg-${type.color}-500/10`
                        : "border-gray-700 bg-gray-800/50 hover:border-gray-600",
                    )}
                  >
                    <TypeIcon
                      className={cn(
                        "w-8 h-8 mb-2",
                        contentType === type.value ? `text-${type.color}-400` : "text-gray-400",
                      )}
                    />
                    <h3
                      className={cn(
                        "font-medium text-sm",
                        contentType === type.value ? `text-${type.color}-400` : "text-white",
                      )}
                    >
                      {type.label}
                    </h3>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Drag & Drop Zone */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                    isDragging ? "border-blue-500 bg-blue-500/5" : "border-gray-700 hover:border-gray-600",
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <ContentIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    {t("Glissez-déposez vos fichiers ici", "Drag and drop your files here")}
                  </h3>
                  <p className="text-sm mb-4 text-gray-400">
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
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("Sélectionner des fichiers", "Select Files")}
                    </Button>
                  </Label>
                  <p className="text-xs mt-4 text-gray-500">
                    {t(
                      "Formats supportés: PDF, DOC, MP4, MP3, JPG, PNG (Max: 100MB par fichier)",
                      "Supported formats: PDF, DOC, MP4, MP3, JPG, PNG (Max: 100MB per file)",
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">
                      {t("Fichiers téléchargés", "Uploaded Files")} ({uploadedFiles.length})
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllFiles}
                        className="border-gray-700 bg-transparent"
                      >
                        {selectedFiles.length === uploadedFiles.length
                          ? t("Désélectionner tout", "Deselect All")
                          : t("Sélectionner tout", "Select All")}
                      </Button>
                      {selectedFiles.length > 0 && (
                        <Button
                          size="sm"
                          onClick={applyBulkSettings}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {t("Appliquer aux sélectionnés", "Apply to Selected")} ({selectedFiles.length})
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {uploadedFiles.map((file) => {
                    const FileIcon = getFileIcon(file.type)
                    return (
                      <div
                        key={file.id}
                        className={cn(
                          "flex items-center space-x-4 p-4 rounded-lg border transition-all",
                          selectedFiles.includes(file.id)
                            ? "border-blue-500 bg-blue-500/5"
                            : "border-gray-700 bg-gray-800/50",
                        )}
                      >
                        <Checkbox
                          checked={selectedFiles.includes(file.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFiles((prev) => [...prev, file.id])
                            } else {
                              setSelectedFiles((prev) => prev.filter((id) => id !== file.id))
                            }
                          }}
                        />

                        <div className="flex items-center space-x-3 flex-1">
                          {file.preview ? (
                            <img
                              src={file.preview || "/placeholder.svg"}
                              alt={file.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded flex items-center justify-center bg-gray-700">
                              <FileIcon className="w-6 h-6 text-gray-500" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0 space-y-2">
                            <Input
                              value={file.title}
                              onChange={(e) => updateFileSettings(file.id, "title", e.target.value)}
                              className="font-medium bg-gray-800 border-gray-700 text-white"
                              placeholder={t("Titre du contenu", "Content title")}
                            />
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-gray-400">{file.name}</span>
                              <span className="text-gray-500">{formatFileSize(file.size)}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {file.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-gray-800 border-gray-600">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Select
                              value={file.level}
                              onValueChange={(value) => updateFileSettings(file.id, "level", value)}
                            >
                              <SelectTrigger className="w-20 bg-gray-800 border-gray-700">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {allowedLevels.map((level) => (
                                  <SelectItem key={level} value={level}>
                                    {level}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={file.subscription}
                              onValueChange={(value) => updateFileSettings(file.id, "subscription", value)}
                            >
                              <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {allowedSubscriptions.map((sub) => (
                                  <SelectItem key={sub} value={sub}>
                                    {sub}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Badge variant="outline" className={getDifficultyColor(file.difficulty)}>
                              {difficultyLevels.find((d) => d.value === file.difficulty)?.label || file.difficulty}
                            </Badge>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="text-red-500 hover:text-red-600"
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

          {/* Advanced Settings Panel */}
          <div className="space-y-6">
            {/* Bulk Settings */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Settings className="w-5 h-5 mr-2" />
                  {t("Paramètres avancés", "Advanced Settings")}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {t("Configuration détaillée pour votre contenu", "Detailed configuration for your content")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">{t("Niveau par défaut", "Default Level")}</Label>
                  <Select
                    value={bulkSettings.level}
                    onValueChange={(value) => setBulkSettings((prev) => ({ ...prev, level: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder={t("Sélectionner un niveau", "Select level")} />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level} -{" "}
                          {level === "A1"
                            ? t("Débutant", "Beginner")
                            : level === "A2"
                              ? t("Élémentaire", "Elementary")
                              : level === "B1"
                                ? t("Intermédiaire", "Intermediate")
                                : level === "B2"
                                  ? t("Intermédiaire supérieur", "Upper Intermediate")
                                  : level === "C1"
                                    ? t("Avancé", "Advanced")
                                    : t("Maîtrise", "Mastery")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">{t("Abonnement par défaut", "Default Subscription")}</Label>
                  <Select
                    value={bulkSettings.subscription}
                    onValueChange={(value) => setBulkSettings((prev) => ({ ...prev, subscription: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder={t("Sélectionner un abonnement", "Select subscription")} />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedSubscriptions.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          <div className="flex items-center space-x-2">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                sub === "Gratuit"
                                  ? "bg-green-500"
                                  : sub === "Essentiel"
                                    ? "bg-blue-500"
                                    : sub === "Premium"
                                      ? "bg-orange-500"
                                      : "bg-purple-500",
                              )}
                            />
                            <span>{sub}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">{t("Difficulté", "Difficulty")}</Label>
                  <Select
                    value={bulkSettings.difficulty}
                    onValueChange={(value) => setBulkSettings((prev) => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder={t("Sélectionner la difficulté", "Select difficulty")} />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">{t("Tags", "Tags")}</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {availableTags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={tag}
                          checked={bulkSettings.tags.includes(tag)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBulkSettings((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
                            } else {
                              setBulkSettings((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
                            }
                          }}
                        />
                        <Label htmlFor={tag} className="text-xs text-gray-300 cursor-pointer">
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Preview */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  {t("Aperçu Analytics", "Analytics Preview")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t("Audience estimée", "Estimated Audience")}</span>
                  <span className="font-medium text-white">
                    <Users className="w-4 h-4 inline mr-1" />
                    2.4k {t("utilisateurs", "users")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t("Engagement prévu", "Expected Engagement")}</span>
                  <span className="font-medium text-green-400">78%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t("Revenus potentiels", "Potential Revenue")}</span>
                  <span className="font-medium text-blue-400">12.5k CFA</span>
                </div>
              </CardContent>
            </Card>

            {/* Upload Summary */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">{t("Résumé", "Summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t("Fichiers", "Files")}</span>
                  <span className="font-medium text-white">
                    {uploadedFiles.length}/{maxFiles}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t("Taille totale", "Total size")}</span>
                  <span className="font-medium text-white">
                    {formatFileSize(uploadedFiles.reduce((acc, file) => acc + file.size, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t("Type", "Type")}</span>
                  <Badge
                    variant="outline"
                    className={`text-${currentContentType.color}-400 border-${currentContentType.color}-500/20`}
                  >
                    {currentContentType.label}
                  </Badge>
                </div>

                <Button
                  onClick={handleContinue}
                  disabled={uploadedFiles.length === 0}
                  className="w-full text-white bg-blue-600 hover:bg-blue-700"
                >
                  {t("Continuer vers l'analyse IA", "Continue to AI Analysis")}
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

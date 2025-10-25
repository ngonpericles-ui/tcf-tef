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
  BookOpen,
  FileText,
  Zap,
  Target,
  Users,
  BarChart3,
  Crown,
  Shield,
  Calendar,
  Clock,
  Globe,
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
  assignedManagers: string[]
  publishDate: string
  priority: string
  targetAudience: string[]
}

export default function SeniorManagerUpload() {
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
    assignedManagers: [] as string[],
    publishDate: "",
    priority: "medium",
    targetAudience: [] as string[],
  })

  // Senior Manager Capabilities - Full access + management features
  const allowedLevels = ["A1", "A2", "B1", "B2", "C1", "C2"]
  const allowedSubscriptions = ["Gratuit", "Essentiel", "Premium", "Pro+"]
  const maxFiles = 50 // Increased capacity for senior managers
  const maxFileSize = 500 * 1024 * 1024 // 500MB limit for large projects

  const contentTypes = [
    { value: "course", label: t("Cours", "Course"), icon: BookOpen, color: "blue" },
    { value: "test", label: t("Test", "Test"), icon: FileText, color: "green" },
    { value: "simulation", label: t("Simulation TCF/TEF", "TCF/TEF Simulation"), icon: Zap, color: "purple" },
    { value: "video", label: t("Contenu Vidéo", "Video Content"), icon: Video, color: "pink" },
    { value: "assessment", label: t("Évaluation", "Assessment"), icon: Target, color: "orange" },
    { value: "curriculum", label: t("Programme", "Curriculum"), icon: Crown, color: "gold" },
    { value: "certification", label: t("Certification", "Certification"), icon: Shield, color: "emerald" },
  ]

  const priorityLevels = [
    { value: "low", label: t("Faible", "Low"), color: "gray" },
    { value: "medium", label: t("Moyenne", "Medium"), color: "blue" },
    { value: "high", label: t("Élevée", "High"), color: "orange" },
    { value: "urgent", label: t("Urgente", "Urgent"), color: "red" },
  ]

  const availableManagers = [
    { id: "1", name: "Marie Dubois", role: "junior", email: "marie.dubois@tcf-tef.com" },
    { id: "2", name: "Julien Martin", role: "content", email: "julien.martin@tcf-tef.com" },
    { id: "3", name: "Sophie Laurent", role: "content", email: "sophie.laurent@tcf-tef.com" },
    { id: "4", name: "Pierre Moreau", role: "junior", email: "pierre.moreau@tcf-tef.com" },
  ]

  const targetAudiences = [
    "Étudiants universitaires",
    "Professionnels",
    "Immigrants",
    "Préparation aux examens",
    "Français général",
    "Français des affaires",
    "Enseignants FLE",
    "Adolescents",
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
    "Certification officielle",
    "Formation continue",
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
          level: bulkSettings.level || "B2",
          subscription: bulkSettings.subscription || "Premium",
          category: bulkSettings.category || "Général",
          difficulty: bulkSettings.difficulty || "intermediate",
          tags: [...bulkSettings.tags],
          assignedManagers: [...bulkSettings.assignedManagers],
          publishDate: bulkSettings.publishDate || new Date().toISOString().split("T")[0],
          priority: bulkSettings.priority || "medium",
          targetAudience: [...bulkSettings.targetAudience],
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
              assignedManagers:
                bulkSettings.assignedManagers.length > 0 ? [...bulkSettings.assignedManagers] : file.assignedManagers,
              publishDate: bulkSettings.publishDate || file.publishDate,
              priority: bulkSettings.priority || file.priority,
              targetAudience:
                bulkSettings.targetAudience.length > 0 ? [...bulkSettings.targetAudience] : file.targetAudience,
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

  const getPriorityColor = (priority: string) => {
    const level = priorityLevels.find((p) => p.value === priority)
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
      assignedManagers: file.assignedManagers,
      publishDate: file.publishDate,
      priority: file.priority,
      targetAudience: file.targetAudience,
      uploadDate: new Date().toISOString(),
      status: "pending",
      contentType: contentType,
      managerRole: "senior",
    }))

    localStorage.setItem("uploadedFiles", JSON.stringify(fileData))
    localStorage.setItem("contentType", contentType)
    localStorage.setItem("managerRole", "senior")

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
                {t("Gestion de contenu avancée", "Advanced Content Management")} -{" "}
                {t("Senior Manager", "Senior Manager")}
              </h1>
              <p className="text-sm mt-1 text-gray-400">
                {t(
                  "Créez et gérez du contenu avec des capacités de supervision complètes",
                  "Create and manage content with full supervisory capabilities",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              <Crown className="w-3 h-3 mr-1" />
              {t("Senior Manager", "Senior Manager")}
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
              {uploadedFiles.length}/{maxFiles} {t("fichiers", "files")}
            </Badge>
          </div>
        </div>

        {/* Management Features */}
        <Card className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Crown className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium mb-1 text-purple-400">
                  {t("Capacités Senior Manager", "Senior Manager Capabilities")}
                </h4>
                <ul className="text-sm space-y-1 text-purple-300">
                  <li>• {t("Jusqu'à 50 fichiers par projet", "Up to 50 files per project")}</li>
                  <li>• {t("Assignation d'équipes et collaboration", "Team assignment and collaboration")}</li>
                  <li>• {t("Planification et priorisation avancées", "Advanced scheduling and prioritization")}</li>
                  <li>• {t("Analytics et rapports détaillés", "Analytics and detailed reporting")}</li>
                  <li>• {t("Gestion multi-audiences", "Multi-audience management")}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
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
                        "w-6 h-6 mb-2",
                        contentType === type.value ? `text-${type.color}-400` : "text-gray-400",
                      )}
                    />
                    <h3
                      className={cn(
                        "font-medium text-xs",
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
                    isDragging ? "border-purple-500 bg-purple-500/5" : "border-gray-700 hover:border-gray-600",
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
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("Sélectionner des fichiers", "Select Files")}
                    </Button>
                  </Label>
                  <p className="text-xs mt-4 text-gray-500">
                    {t(
                      "Formats supportés: PDF, DOC, MP4, MP3, JPG, PNG (Max: 500MB par fichier)",
                      "Supported formats: PDF, DOC, MP4, MP3, JPG, PNG (Max: 500MB per file)",
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
                          className="bg-purple-600 hover:bg-purple-700 text-white"
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
                            ? "border-purple-500 bg-purple-500/5"
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
                              <Badge variant="outline" className={getPriorityColor(file.priority)}>
                                {priorityLevels.find((p) => p.value === file.priority)?.label || file.priority}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {file.assignedManagers.map((managerId) => {
                                const manager = availableManagers.find((m) => m.id === managerId)
                                return (
                                  <Badge
                                    key={managerId}
                                    variant="outline"
                                    className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  >
                                    <Users className="w-3 h-3 mr-1" />
                                    {manager?.name || managerId}
                                  </Badge>
                                )
                              })}
                              {file.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-gray-800 border-gray-600">
                                  {tag}
                                </Badge>
                              ))}
                              {file.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs bg-gray-800 border-gray-600">
                                  +{file.tags.length - 3}
                                </Badge>
                              )}
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

                            <div className="flex items-center space-x-1 text-xs text-gray-400">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(file.publishDate).toLocaleDateString()}</span>
                            </div>
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

          {/* Advanced Management Panel */}
          <div className="space-y-6">
            {/* Team Management */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Users className="w-5 h-5 mr-2" />
                  {t("Gestion d'équipe", "Team Management")}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {t("Assignez des managers à ce projet", "Assign managers to this project")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">{t("Managers assignés", "Assigned Managers")}</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                    {availableManagers.map((manager) => (
                      <div key={manager.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={manager.id}
                          checked={bulkSettings.assignedManagers.includes(manager.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBulkSettings((prev) => ({
                                ...prev,
                                assignedManagers: [...prev.assignedManagers, manager.id],
                              }))
                            } else {
                              setBulkSettings((prev) => ({
                                ...prev,
                                assignedManagers: prev.assignedManagers.filter((id) => id !== manager.id),
                              }))
                            }
                          }}
                        />
                        <Label htmlFor={manager.id} className="text-xs text-gray-300 cursor-pointer flex-1">
                          <div>
                            <span className="font-medium">{manager.name}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "ml-2 text-xs",
                                manager.role === "senior"
                                  ? "bg-purple-500/10 text-purple-400"
                                  : manager.role === "content"
                                    ? "bg-blue-500/10 text-blue-400"
                                    : "bg-green-500/10 text-green-400",
                              )}
                            >
                              {manager.role}
                            </Badge>
                          </div>
                          <div className="text-gray-500">{manager.email}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scheduling & Priority */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Calendar className="w-5 h-5 mr-2" />
                  {t("Planification", "Scheduling")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">{t("Date de publication", "Publish Date")}</Label>
                  <Input
                    type="date"
                    value={bulkSettings.publishDate}
                    onChange={(e) => setBulkSettings((prev) => ({ ...prev, publishDate: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">{t("Priorité", "Priority")}</Label>
                  <Select
                    value={bulkSettings.priority}
                    onValueChange={(value) => setBulkSettings((prev) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center space-x-2">
                            <div className={cn("w-2 h-2 rounded-full", `bg-${level.color}-500`)} />
                            <span>{level.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Target Audience */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Target className="w-5 h-5 mr-2" />
                  {t("Audience cible", "Target Audience")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {targetAudiences.map((audience) => (
                    <div key={audience} className="flex items-center space-x-2">
                      <Checkbox
                        id={audience}
                        checked={bulkSettings.targetAudience.includes(audience)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBulkSettings((prev) => ({ ...prev, targetAudience: [...prev.targetAudience, audience] }))
                          } else {
                            setBulkSettings((prev) => ({
                              ...prev,
                              targetAudience: prev.targetAudience.filter((a) => a !== audience),
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={audience} className="text-xs text-gray-300 cursor-pointer">
                        {audience}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Advanced Analytics */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  {t("Analytics avancées", "Advanced Analytics")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t("Audience estimée", "Estimated Audience")}</span>
                  <span className="font-medium text-white">
                    <Globe className="w-4 h-4 inline mr-1" />
                    8.2k {t("utilisateurs", "users")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t("ROI prévu", "Expected ROI")}</span>
                  <span className="font-medium text-green-400">+245%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t("Temps de production", "Production Time")}</span>
                  <span className="font-medium text-blue-400">
                    <Clock className="w-4 h-4 inline mr-1" />
                    14 {t("jours", "days")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t("Revenus potentiels", "Potential Revenue")}</span>
                  <span className="font-medium text-purple-400">45.8k CFA</span>
                </div>
              </CardContent>
            </Card>

            {/* Project Summary */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">{t("Résumé du projet", "Project Summary")}</CardTitle>
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
                  <span className="text-gray-400">{t("Équipe assignée", "Assigned Team")}</span>
                  <span className="font-medium text-white">{bulkSettings.assignedManagers.length} managers</span>
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
                  className="w-full text-white bg-purple-600 hover:bg-purple-700"
                >
                  {t("Lancer le projet", "Launch Project")}
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

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import {
  ArrowLeft,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Eye,
  Calendar,
  FileText,
  Video,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface HistoryFile {
  id: string
  name: string
  title: string
  type: string
  size: number
  level: string
  subscription: string
  category: string
  uploadDate: string
  status: "published" | "draft" | "processing"
  views?: number
  downloads?: number
}

export default function ContentHistoryPage() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const router = useRouter()

  const [files, setFiles] = useState<HistoryFile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLevel, setFilterLevel] = useState("all")
  const [filterSubscription, setFilterSubscription] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    // Load files from backend API
    const loadFiles = async () => {
      try {
        // In a real implementation, this would fetch from backend
        // For now, just set empty array
        setFiles([])
      } catch (error) {
        console.error('Error loading files:', error)
        setFiles([])
      }
    }

    loadFiles()
  }, [])

  // Remove mock data - keeping empty for backend integration
  const removeMockData = () => {
    if (false) {
      // Mock data for demonstration (removed for production)
      const mockFiles: HistoryFile[] = [
        {
          id: "1",
          name: "grammaire-a1-lesson1.pdf",
          title: "Introduction à la grammaire française A1",
          type: "application/pdf",
          size: 2048000,
          level: "A1",
          subscription: "Gratuit",
          category: "Grammaire",
          uploadDate: "2024-01-15T10:30:00Z",
          status: "published",
          views: 245,
          downloads: 89,
        },
        {
          id: "2",
          name: "comprehension-b1-video.mp4",
          title: "Compréhension orale B1 - Dialogue au restaurant",
          type: "video/mp4",
          size: 15728640,
          level: "B1",
          subscription: "Essentiel",
          category: "Compréhension orale",
          uploadDate: "2024-01-10T14:20:00Z",
          status: "published",
          views: 156,
          downloads: 34,
        },
        {
          id: "3",
          name: "tcf-simulation-c1.pdf",
          title: "Simulation TCF niveau C1 - Test complet",
          type: "application/pdf",
          size: 5242880,
          level: "C1",
          subscription: "Pro+",
          category: "TCF/TEF",
          uploadDate: "2024-01-08T09:15:00Z",
          status: "draft",
          views: 0,
          downloads: 0,
        }
      ]
      // Mock data removed for production
    }
  }

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = filterLevel === "all" || file.level === filterLevel
    const matchesSubscription = filterSubscription === "all" || file.subscription === filterSubscription
    const matchesStatus = filterStatus === "all" || file.status === filterStatus

    return matchesSearch && matchesLevel && matchesSubscription && matchesStatus
  })

  const getFileIcon = (type: string) => {
    if (type.startsWith("video/")) return Video
    if (type.startsWith("image/")) return ImageIcon
    return FileText
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return theme === "light"
          ? "bg-green-100 text-green-800 border-green-200"
          : "bg-green-500/10 text-green-400 border-green-500/20"
      case "draft":
        return theme === "light"
          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "processing":
        return theme === "light"
          ? "bg-blue-100 text-blue-800 border-blue-200"
          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
      default:
        return theme === "light"
          ? "bg-gray-100 text-gray-800 border-gray-200"
          : "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case "Gratuit":
        return theme === "light"
          ? "bg-green-100 text-green-800 border-green-200"
          : "bg-green-500/10 text-green-400 border-green-500/20"
      case "Essentiel":
        return theme === "light"
          ? "bg-blue-100 text-blue-800 border-blue-200"
          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "Premium":
        return theme === "light"
          ? "bg-orange-100 text-orange-800 border-orange-200"
          : "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "Pro+":
        return theme === "light"
          ? "bg-purple-100 text-purple-800 border-purple-200"
          : "bg-purple-500/10 text-purple-400 border-purple-500/20"
      default:
        return theme === "light"
          ? "bg-gray-100 text-gray-800 border-gray-200"
          : "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleEdit = (fileId: string) => {
    // Navigate to edit page
    router.push(`/admin/content/edit/${fileId}`)
  }

  const handleDelete = (fileId: string) => {
    if (confirm(t("Êtes-vous sûr de vouloir supprimer ce fichier ?", "Are you sure you want to delete this file?"))) {
      const updatedFiles = files.filter((file) => file.id !== fileId)
      setFiles(updatedFiles)
      localStorage.setItem("publishedFiles", JSON.stringify(updatedFiles))
    }
  }

  return (
    <div
      className={cn(
        "min-h-screen p-6",
        theme === "light" ? "bg-gradient-to-br from-blue-50 via-white to-indigo-50" : "bg-gray-950",
      )}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className={cn(
                theme === "light"
                  ? "text-gray-700 hover:text-gray-900 hover:bg-white/50"
                  : "text-gray-400 hover:text-gray-200",
              )}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className={cn("text-3xl font-bold", theme === "light" ? "text-gray-900" : "text-white")}>
                {t("Historique du contenu", "Content History")}
              </h1>
              <p className={cn("text-sm mt-1", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                {t("Gérez tous vos fichiers publiés", "Manage all your published files")}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              theme === "light" ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-blue-500/10 text-blue-400",
            )}
          >
            {filteredFiles.length} {t("fichiers", "files")}
          </Badge>
        </div>

        {/* Filters */}
        <Card
          className={cn(
            theme === "light"
              ? "bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg"
              : "bg-gray-900 border-gray-800",
          )}
        >
          <CardHeader>
            <CardTitle className={cn("flex items-center text-lg", theme === "light" ? "text-gray-900" : "text-white")}>
              <Filter className="w-5 h-5 mr-2" />
              {t("Filtres et recherche", "Filters and Search")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t("Rechercher...", "Search...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    "pl-10",
                    theme === "light" ? "bg-white border-gray-300" : "bg-gray-800 border-gray-700",
                  )}
                />
              </div>

              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger
                  className={cn(theme === "light" ? "bg-white border-gray-300" : "bg-gray-800 border-gray-700")}
                >
                  <SelectValue placeholder={t("Niveau", "Level")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Tous les niveaux", "All levels")}</SelectItem>
                  <SelectItem value="A1">A1</SelectItem>
                  <SelectItem value="A2">A2</SelectItem>
                  <SelectItem value="B1">B1</SelectItem>
                  <SelectItem value="B2">B2</SelectItem>
                  <SelectItem value="C1">C1</SelectItem>
                  <SelectItem value="C2">C2</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSubscription} onValueChange={setFilterSubscription}>
                <SelectTrigger
                  className={cn(theme === "light" ? "bg-white border-gray-300" : "bg-gray-800 border-gray-700")}
                >
                  <SelectValue placeholder={t("Abonnement", "Subscription")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Tous les abonnements", "All subscriptions")}</SelectItem>
                  <SelectItem value="Gratuit">Gratuit</SelectItem>
                  <SelectItem value="Essentiel">Essentiel</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Pro+">Pro+</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger
                  className={cn(theme === "light" ? "bg-white border-gray-300" : "bg-gray-800 border-gray-700")}
                >
                  <SelectValue placeholder={t("Statut", "Status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Tous les statuts", "All statuses")}</SelectItem>
                  <SelectItem value="published">{t("Publié", "Published")}</SelectItem>
                  <SelectItem value="draft">{t("Brouillon", "Draft")}</SelectItem>
                  <SelectItem value="processing">{t("En traitement", "Processing")}</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFilterLevel("all")
                  setFilterSubscription("all")
                  setFilterStatus("all")
                }}
                className={cn(theme === "light" ? "border-gray-300 bg-white hover:bg-gray-50" : "border-gray-700")}
              >
                {t("Réinitialiser", "Reset")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card
          className={cn(
            theme === "light"
              ? "bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg"
              : "bg-gray-900 border-gray-800",
          )}
        >
          <CardHeader>
            <CardTitle className={cn(theme === "light" ? "text-gray-900" : "text-white")}>
              {t("Fichiers", "Files")} ({filteredFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredFiles.map((file) => {
                const FileIcon = getFileIcon(file.type)
                return (
                  <div
                    key={file.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md",
                      theme === "light"
                        ? "border-gray-200 bg-white/50 hover:bg-white/80"
                        : "border-gray-700 bg-gray-800/50 hover:bg-gray-800/80",
                    )}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div
                        className={cn(
                          "w-12 h-12 rounded flex items-center justify-center",
                          theme === "light" ? "bg-gray-100" : "bg-gray-700",
                        )}
                      >
                        <FileIcon className="w-6 h-6 text-gray-500" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={cn("font-medium truncate", theme === "light" ? "text-gray-900" : "text-white")}>
                          {file.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm mt-1">
                          <span className={cn(theme === "light" ? "text-gray-600" : "text-gray-400")}>{file.name}</span>
                          <span className={cn(theme === "light" ? "text-gray-500" : "text-gray-500")}>
                            {formatFileSize(file.size)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(file.uploadDate)}</span>
                          </div>
                        </div>
                        {file.status === "published" && (
                          <div className="flex items-center space-x-4 text-xs mt-1">
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>
                                {file.views} {t("vues", "views")}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Download className="w-3 h-3" />
                              <span>
                                {file.downloads} {t("téléchargements", "downloads")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getStatusColor(file.status)}>
                          {file.status === "published"
                            ? t("Publié", "Published")
                            : file.status === "draft"
                              ? t("Brouillon", "Draft")
                              : t("En traitement", "Processing")}
                        </Badge>
                        <Badge variant="outline" className={getSubscriptionColor(file.subscription)}>
                          {file.level}
                        </Badge>
                        <Badge variant="outline" className={getSubscriptionColor(file.subscription)}>
                          {file.subscription}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(file.id)}
                        className={cn(
                          theme === "light"
                            ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            : "text-blue-400 hover:text-blue-300",
                        )}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}

              {filteredFiles.length === 0 && (
                <div className="text-center py-12">
                  <FileText
                    className={cn("w-16 h-16 mx-auto mb-4", theme === "light" ? "text-gray-400" : "text-gray-600")}
                  />
                  <h3 className={cn("text-lg font-medium mb-2", theme === "light" ? "text-gray-900" : "text-white")}>
                    {t("Aucun fichier trouvé", "No files found")}
                  </h3>
                  <p className={cn("text-sm", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                    {t("Essayez de modifier vos filtres de recherche", "Try adjusting your search filters")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

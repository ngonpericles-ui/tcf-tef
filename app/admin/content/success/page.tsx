"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import {
  CheckCircle,
  ArrowLeft,
  Eye,
  Share2,
  BarChart3,
  Users,
  Star,
  Plus,
  Sparkles,
  Trophy,
  Target,
  Zap,
  Search,
  FileText,
  Video,
  ImageIcon,
  File,
  Edit,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ProcessedFile {
  id: string
  name: string
  title: string
  type: string
  level: string
  subscription: string
  category: string
  contentType: string
  uploadDate: string
  status: string
  aiAnalysis: {
    contentType: string
    difficulty: string
    topics: string[]
    suggestedQuestions: number
    estimatedDuration: string
    qualityScore: number
  }
}

interface HistoryFile {
  id: string
  title: string
  type: string
  level: string
  subscription: string
  category: string
  uploadDate: string
  status: "published" | "draft" | "archived"
  views: number
  completions: number
  rating: number
}

export default function ContentSuccessPage() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const router = useRouter()
  const [files, setFiles] = useState<ProcessedFile[]>([])
  const [historyFiles, setHistoryFiles] = useState<HistoryFile[]>([])
  const [contentType, setContentType] = useState("")
  const [showCelebration, setShowCelebration] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterLevel, setFilterLevel] = useState("all")
  const [filterSubscription, setFilterSubscription] = useState("all")

  useEffect(() => {
    const processedData = localStorage.getItem("processedFiles")
    const type = localStorage.getItem("contentType")

    if (processedData && type) {
      const data = JSON.parse(processedData)
      setFiles(data.files || [])
      setContentType(type)

      const newHistoryEntries = (data.files || []).map((file: ProcessedFile) => ({
        id: file.id,
        title: file.title,
        type: file.type,
        level: file.level,
        subscription: file.subscription,
        category: file.category,
        uploadDate: file.uploadDate || new Date().toISOString(),
        status: "published" as const,
        views: Math.floor(Math.random() * 100) + 10,
        completions: Math.floor(Math.random() * 50) + 5,
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
      }))

      const existingHistory = JSON.parse(localStorage.getItem("contentHistory") || "[]")
      const updatedHistory = [...newHistoryEntries, ...existingHistory]
      localStorage.setItem("contentHistory", JSON.stringify(updatedHistory))
      setHistoryFiles(updatedHistory)
    } else {
      const existingHistory = JSON.parse(localStorage.getItem("contentHistory") || "[]")
      setHistoryFiles(existingHistory)
    }

    const timer = setTimeout(() => setShowCelebration(false), 3000)
    return () => clearTimeout(timer)
  }, [router])

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case "Gratuit":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "Essentiel":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "Premium":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "Pro+":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("video/")) return Video
    if (type.startsWith("image/")) return ImageIcon
    return File
  }

  const getTotalStats = () => {
    return {
      totalFiles: files.length,
      totalQuestions: files.reduce((acc, file) => acc + (file.aiAnalysis?.suggestedQuestions || 0), 0),
      averageQuality: Math.round(
        files.reduce((acc, file) => acc + (file.aiAnalysis?.qualityScore || 0), 0) / files.length,
      ),
      estimatedUsers: Math.floor(Math.random() * 500) + 100,
    }
  }

  const filteredHistory = historyFiles.filter((file) => {
    const matchesSearch =
      file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = filterLevel === "all" || file.level === filterLevel
    const matchesSubscription = filterSubscription === "all" || file.subscription === filterSubscription

    return matchesSearch && matchesLevel && matchesSubscription
  })

  const stats = getTotalStats()

  const handleCreateMore = () => {
    localStorage.removeItem("uploadedFiles")
    localStorage.removeItem("processedFiles")
    localStorage.removeItem("contentType")
    router.push("/admin/content/create")
  }

  const handleViewContent = () => {
    router.push("/admin/content")
  }

  const handleEditFile = (fileId: string) => {
    // Navigate to edit page (would be implemented)
    console.log("Edit file:", fileId)
  }

  const handleDeleteFile = (fileId: string) => {
    const updatedHistory = historyFiles.filter((file) => file.id !== fileId)
    setHistoryFiles(updatedHistory)
    localStorage.setItem("contentHistory", JSON.stringify(updatedHistory))
  }

  return (
    <div
      className={cn(
        "min-h-screen p-6",
        theme === "light" ? "bg-gradient-to-br from-blue-50 via-white to-indigo-50" : "bg-gray-950",
      )}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Celebration Header */}
        {showCelebration && (
          <div className="text-center py-8 relative overflow-hidden">
            <div
              className={cn(
                "absolute inset-0 rounded-2xl",
                theme === "light"
                  ? "bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10"
                  : "bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10",
              )}
            />
            <div className="relative">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Trophy className="w-12 h-12 text-yellow-500" />
                <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
              <h1 className={cn("text-4xl font-bold mb-2", theme === "light" ? "text-gray-900" : "text-white")}>
                {t("Félicitations !", "Congratulations!")}
              </h1>
              <p className={cn("text-lg", theme === "light" ? "text-gray-700" : "text-gray-300")}>
                {t("Votre contenu a été créé avec succès !", "Your content has been created successfully!")}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/content")}
              className={cn(
                theme === "light"
                  ? "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                  : "text-gray-400 hover:text-gray-200",
              )}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour au contenu", "Back to Content")}
            </Button>
            <div>
              <h2 className={cn("text-2xl font-bold", theme === "light" ? "text-gray-900" : "text-white")}>
                {t("Contenu publié avec succès", "Content Published Successfully")}
              </h2>
              <p className={cn("text-sm mt-1", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                {t(
                  "Votre contenu est maintenant disponible pour les utilisateurs",
                  "Your content is now available to users",
                )}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
            <CheckCircle className="w-4 h-4 mr-1" />
            {t("Publié", "Published")}
          </Badge>
        </div>

        {/* Success Stats */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card
              className={cn(
                theme === "light"
                  ? "bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg"
                  : "bg-gray-900 border-gray-800",
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={cn("p-3 rounded-lg", theme === "light" ? "bg-green-100" : "bg-green-900/20")}>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className={cn("text-2xl font-bold", theme === "light" ? "text-gray-900" : "text-white")}>
                      {stats.totalFiles}
                    </p>
                    <p className={cn("text-sm", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                      {t("Fichiers traités", "Files Processed")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                theme === "light"
                  ? "bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg"
                  : "bg-gray-900 border-gray-800",
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={cn("p-3 rounded-lg", theme === "light" ? "bg-blue-100" : "bg-blue-900/20")}>
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className={cn("text-2xl font-bold", theme === "light" ? "text-gray-900" : "text-white")}>
                      {stats.totalQuestions}
                    </p>
                    <p className={cn("text-sm", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                      {t("Questions générées", "Questions Generated")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                theme === "light"
                  ? "bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg"
                  : "bg-gray-900 border-gray-800",
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={cn("p-3 rounded-lg", theme === "light" ? "bg-purple-100" : "bg-purple-900/20")}>
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className={cn("text-2xl font-bold", theme === "light" ? "text-gray-900" : "text-white")}>
                      {stats.averageQuality}%
                    </p>
                    <p className={cn("text-sm", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                      {t("Qualité moyenne", "Average Quality")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                theme === "light"
                  ? "bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg"
                  : "bg-gray-900 border-gray-800",
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={cn("p-3 rounded-lg", theme === "light" ? "bg-orange-100" : "bg-orange-900/20")}>
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className={cn("text-2xl font-bold", theme === "light" ? "text-gray-900" : "text-white")}>
                      {stats.estimatedUsers}
                    </p>
                    <p className={cn("text-sm", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                      {t("Utilisateurs ciblés", "Target Users")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Published Content Details */}
        {files.length > 0 && (
          <Card
            className={cn(
              theme === "light"
                ? "bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg"
                : "bg-gray-900 border-gray-800",
            )}
          >
            <CardHeader>
              <CardTitle className={cn("flex items-center", theme === "light" ? "text-gray-900" : "text-white")}>
                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                {t("Détails du contenu publié", "Published Content Details")}
              </CardTitle>
              <CardDescription className={cn(theme === "light" ? "text-gray-600" : "text-gray-400")}>
                {t("Résumé de chaque fichier traité et publié", "Summary of each processed and published file")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    theme === "light" ? "border-gray-200 bg-white/50" : "border-gray-700 bg-gray-800/50",
                  )}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full",
                        theme === "light" ? "bg-green-100" : "bg-green-900/20",
                      )}
                    >
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>

                    <div className="flex-1">
                      <h4 className={cn("font-medium", theme === "light" ? "text-gray-900" : "text-white")}>
                        {file.title}
                      </h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {file.level}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", getSubscriptionColor(file.subscription))}>
                          {file.subscription}
                        </Badge>
                        <span className={cn("text-xs", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                          {file.category}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <p className={cn("font-medium", theme === "light" ? "text-gray-900" : "text-white")}>
                            {file.aiAnalysis?.suggestedQuestions}
                          </p>
                          <p className={cn("text-xs", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                            {t("Questions", "Questions")}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className={cn("font-medium", theme === "light" ? "text-gray-900" : "text-white")}>
                            {file.aiAnalysis?.estimatedDuration}
                          </p>
                          <p className={cn("text-xs", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                            {t("Durée", "Duration")}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-green-500">{file.aiAnalysis?.qualityScore}%</p>
                          <p className={cn("text-xs", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                            {t("Qualité", "Quality")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card
          className={cn(
            theme === "light"
              ? "bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg"
              : "bg-gray-900 border-gray-800",
          )}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={cn("flex items-center", theme === "light" ? "text-gray-900" : "text-white")}>
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  {t("Historique du contenu", "Content History")} ({historyFiles.length})
                </CardTitle>
                <CardDescription className={cn(theme === "light" ? "text-gray-600" : "text-gray-400")}>
                  {t(
                    "Tous vos contenus publiés avec possibilité de recherche et modification",
                    "All your published content with search and edit capabilities",
                  )}
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t("Rechercher dans l'historique...", "Search history...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "pl-10",
                    theme === "light" ? "bg-white border-gray-300" : "bg-gray-800 border-gray-700",
                  )}
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className={cn(
                    "px-3 py-2 rounded-md border text-sm",
                    theme === "light"
                      ? "bg-white border-gray-300 text-gray-900"
                      : "bg-gray-800 border-gray-700 text-white",
                  )}
                >
                  <option value="all">{t("Tous niveaux", "All levels")}</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
                <select
                  value={filterSubscription}
                  onChange={(e) => setFilterSubscription(e.target.value)}
                  className={cn(
                    "px-3 py-2 rounded-md border text-sm",
                    theme === "light"
                      ? "bg-white border-gray-300 text-gray-900"
                      : "bg-gray-800 border-gray-700 text-white",
                  )}
                >
                  <option value="all">{t("Tous abonnements", "All subscriptions")}</option>
                  <option value="Gratuit">Gratuit</option>
                  <option value="Essentiel">Essentiel</option>
                  <option value="Premium">Premium</option>
                  <option value="Pro+">Pro+</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <FileText
                  className={cn("w-12 h-12 mx-auto mb-4", theme === "light" ? "text-gray-400" : "text-gray-600")}
                />
                <p className={cn("text-lg font-medium", theme === "light" ? "text-gray-900" : "text-white")}>
                  {t("Aucun contenu trouvé", "No content found")}
                </p>
                <p className={cn("text-sm", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                  {t("Essayez de modifier vos filtres de recherche", "Try adjusting your search filters")}
                </p>
              </div>
            ) : (
              filteredHistory.map((file) => {
                const FileIcon = getFileIcon(file.type)
                return (
                  <div
                    key={file.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      theme === "light"
                        ? "border-gray-200 bg-white/50 hover:bg-white/80"
                        : "border-gray-700 bg-gray-800/50 hover:bg-gray-800/80",
                    )}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div
                        className={cn(
                          "w-10 h-10 rounded flex items-center justify-center",
                          theme === "light" ? "bg-gray-100" : "bg-gray-700",
                        )}
                      >
                        <FileIcon className="w-5 h-5 text-gray-500" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className={cn("font-medium truncate", theme === "light" ? "text-gray-900" : "text-white")}>
                          {file.title}
                        </h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {file.level}
                          </Badge>
                          <Badge variant="outline" className={cn("text-xs", getSubscriptionColor(file.subscription))}>
                            {file.subscription}
                          </Badge>
                          <span className={cn("text-xs", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                            {new Date(file.uploadDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <p className={cn("font-medium", theme === "light" ? "text-gray-900" : "text-white")}>
                            {file.views}
                          </p>
                          <p className={cn("text-xs", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                            {t("Vues", "Views")}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className={cn("font-medium", theme === "light" ? "text-gray-900" : "text-white")}>
                            {file.completions}
                          </p>
                          <p className={cn("text-xs", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                            {t("Complétions", "Completions")}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-yellow-500">★ {file.rating}</p>
                          <p className={cn("text-xs", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                            {t("Note", "Rating")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFile(file.id)}
                          className={cn(
                            "text-blue-500 hover:text-blue-600",
                            theme === "light" ? "hover:bg-blue-50" : "hover:bg-blue-900/20",
                          )}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id)}
                          className={cn(
                            "text-red-500 hover:text-red-600",
                            theme === "light" ? "hover:bg-red-50" : "hover:bg-red-900/20",
                          )}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={handleViewContent}
            className={cn(
              "text-white",
              theme === "light" ? "bg-blue-600 hover:bg-blue-700 shadow-lg" : "bg-blue-600 hover:bg-blue-700",
            )}
          >
            <Eye className="w-4 h-4 mr-2" />
            {t("Voir le contenu", "View Content")}
          </Button>

          <Button
            variant="outline"
            className={cn(theme === "light" ? "border-gray-300 bg-white hover:bg-gray-50" : "border-gray-700")}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {t("Voir les statistiques", "View Statistics")}
          </Button>

          <Button
            variant="outline"
            className={cn(theme === "light" ? "border-gray-300 bg-white hover:bg-gray-50" : "border-gray-700")}
          >
            <Share2 className="w-4 h-4 mr-2" />
            {t("Partager", "Share")}
          </Button>

          <Button
            onClick={handleCreateMore}
            variant="outline"
            className="border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 bg-transparent"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("Créer plus", "Create More")}
          </Button>
        </div>

        {/* Next Steps */}
        <Card
          className={cn(
            "border-2 border-dashed",
            theme === "light" ? "bg-white/50 backdrop-blur-sm border-gray-300" : "bg-gray-900/50 border-gray-700",
          )}
        >
          <CardContent className="p-6">
            <h3 className={cn("text-lg font-semibold mb-4", theme === "light" ? "text-gray-900" : "text-white")}>
              {t("Prochaines étapes recommandées", "Recommended Next Steps")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start space-x-3">
                <div className={cn("p-2 rounded-lg", theme === "light" ? "bg-blue-100" : "bg-blue-900/20")}>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className={cn("font-medium", theme === "light" ? "text-gray-900" : "text-white")}>
                    {t("Promouvoir le contenu", "Promote Content")}
                  </h4>
                  <p className={cn("text-sm", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                    {t("Partagez avec vos utilisateurs cibles", "Share with your target users")}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className={cn("p-2 rounded-lg", theme === "light" ? "bg-green-100" : "bg-green-900/20")}>
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className={cn("font-medium", theme === "light" ? "text-gray-900" : "text-white")}>
                    {t("Suivre les performances", "Track Performance")}
                  </h4>
                  <p className={cn("text-sm", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                    {t("Analysez l'engagement des utilisateurs", "Analyze user engagement")}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className={cn("p-2 rounded-lg", theme === "light" ? "bg-purple-100" : "bg-purple-900/20")}>
                  <Plus className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className={cn("font-medium", theme === "light" ? "text-gray-900" : "text-white")}>
                    {t("Créer plus de contenu", "Create More Content")}
                  </h4>
                  <p className={cn("text-sm", theme === "light" ? "text-gray-600" : "text-gray-400")}>
                    {t("Enrichissez votre bibliothèque", "Enrich your library")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </div>
          <h3 className={cn("text-xl font-semibold mb-2", theme === "light" ? "text-gray-900" : "text-white")}>
            {t("Mission accomplie !", "Mission Accomplished!")}
          </h3>
          <p className={cn("text-sm max-w-2xl mx-auto", theme === "light" ? "text-gray-600" : "text-gray-400")}>
            {t(
              "Votre contenu a été analysé par l'IA GPT-5, optimisé pour l'apprentissage, et est maintenant disponible pour vos utilisateurs. Continuez à créer du contenu exceptionnel !",
              "Your content has been analyzed by GPT-5 AI, optimized for learning, and is now available to your users. Keep creating exceptional content!",
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

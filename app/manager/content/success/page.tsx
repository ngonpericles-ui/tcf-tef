"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import {
  CheckCircle,
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  FileText,
  Video,
  ImageIcon,
  Crown,
  BookOpen,
  User,
  Eye,
  Edit,
  Trash2,
  Share2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PublishedContent {
  id: string
  title: string
  type: string
  levels: string[]
  subscription: string
  category: string
  size: number
  publishDate: string
  status: "published" | "draft" | "archived"
  views: number
  likes: number
  comments: number
  createdBy: string
}

interface ManagerRole {
  role: "junior" | "content" | "senior"
  permissions: {
    createCourses: boolean
    createTests: boolean
    hostLiveSessions: boolean
    moderateContent: boolean
    manageUsers: boolean
    viewAnalytics: boolean
    exportData: boolean
  }
}

export default function ManagerContentSuccessPage() {
  const { t } = useLanguage()
  const router = useRouter()

  const [publishedContent, setPublishedContent] = useState<PublishedContent[]>([])
  const [currentManager, setCurrentManager] = useState<ManagerRole | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterLevel, setFilterLevel] = useState("all")

  useEffect(() => {
    // Get newly published content from localStorage
    const newContent = localStorage.getItem("publishedContent")
    const existingHistory = localStorage.getItem("managerContentHistory") || "[]"

    if (newContent) {
      const parsedNewContent = JSON.parse(newContent)
      const parsedHistory = JSON.parse(existingHistory)

      const updatedHistory = [...parsedHistory, ...parsedNewContent]
      localStorage.setItem("managerContentHistory", JSON.stringify(updatedHistory))
      setPublishedContent(updatedHistory)

      // Clear the temporary published content
      localStorage.removeItem("publishedContent")
    } else {
      setPublishedContent(JSON.parse(existingHistory))
    }

    // Get manager role
    const roleParam = localStorage.getItem("managerRole") || "junior"
    const mockManagers = {
      junior: {
        role: "junior" as const,
        permissions: {
          createCourses: true,
          createTests: true,
          hostLiveSessions: true,
          moderateContent: false,
          manageUsers: false,
          viewAnalytics: false,
          exportData: false,
        },
      },
      content: {
        role: "content" as const,
        permissions: {
          createCourses: true,
          createTests: true,
          hostLiveSessions: true,
          moderateContent: true,
          manageUsers: false,
          viewAnalytics: true,
          exportData: false,
        },
      },
      senior: {
        role: "senior" as const,
        permissions: {
          createCourses: true,
          createTests: true,
          hostLiveSessions: true,
          moderateContent: true,
          manageUsers: true,
          viewAnalytics: true,
          exportData: true,
        },
      },
    }

    setCurrentManager(mockManagers[roleParam as keyof typeof mockManagers] || mockManagers.junior)
  }, [])

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "senior":
        return {
          label: t("Senior Manager", "Senior Manager"),
          icon: Crown,
          color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        }
      case "content":
        return {
          label: t("Content Manager", "Content Manager"),
          icon: BookOpen,
          color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        }
      case "junior":
        return {
          label: t("Junior Manager", "Junior Manager"),
          icon: User,
          color: "bg-green-500/10 text-green-400 border-green-500/20",
        }
      default:
        return {
          label: t("Manager", "Manager"),
          icon: User,
          color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        }
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes("video")) return Video
    if (type.includes("image")) return ImageIcon
    return FileText
  }

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const filteredContent = publishedContent.filter((content) => {
    const matchesSearch =
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || content.type === filterType
    const matchesLevel = filterLevel === "all" || content.levels.includes(filterLevel)

    return matchesSearch && matchesType && matchesLevel
  })

  const deleteContent = (id: string) => {
    const updatedContent = publishedContent.filter((content) => content.id !== id)
    setPublishedContent(updatedContent)
    localStorage.setItem("managerContentHistory", JSON.stringify(updatedContent))
  }

  if (!currentManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  const roleInfo = getRoleInfo(currentManager.role)
  const RoleIcon = roleInfo.icon
  const newlyPublished = publishedContent.slice(-5) // Show last 5 as newly published

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
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
                {t("Contenu publié avec succès", "Content Published Successfully")}
              </h1>
              <p className="text-sm mt-1 text-foreground">
                {t("Gérez votre contenu et consultez l'historique", "Manage your content and view history")}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className={cn("text-sm", roleInfo.color)}>
              <RoleIcon className="w-4 h-4 mr-2" />
              {roleInfo.label}
            </Badge>
            <Badge variant="secondary" className="bg-green-500/10 text-green-400">
              {publishedContent.length} {t("contenus", "contents")}
            </Badge>
          </div>
        </div>

        {/* Success Message for Newly Published Content */}
        {newlyPublished.length > 0 && (
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                {t("Contenu publié récemment", "Recently Published Content")}
              </CardTitle>
              <CardDescription className="text-foreground">
                {t("Voici le contenu que vous venez de publier", "Here's the content you just published")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {newlyPublished.map((content) => {
                  const FileIcon = getFileIcon(content.type)
                  return (
                    <div
                      key={content.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <FileIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{content.title}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex space-x-1">
                              {content.levels.map((level) => (
                                <Badge key={level} variant="outline" className="text-xs bg-blue-500/10 text-blue-400">
                                  {level}
                                </Badge>
                              ))}
                            </div>
                            <Badge
                              variant="outline"
                              className={cn("text-xs", getSubscriptionColor(content.subscription))}
                            >
                              {content.subscription}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{formatFileSize(content.size)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                          {t("Publié", "Published")}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content History */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">{t("Historique du contenu", "Content History")}</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("Rechercher...", "Search...")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-input border-gray-200 dark:border-gray-700 text-foreground w-64"
                  />
                </div>
                <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-700 bg-transparent text-foreground">
                  <Filter className="w-4 h-4 mr-2" />
                  {t("Filtrer", "Filter")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredContent.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2 text-foreground">
                  {t("Aucun contenu trouvé", "No content found")}
                </h3>
                <p className="text-muted-foreground">
                  {t(
                    "Commencez par créer du contenu pour le voir apparaître ici",
                    "Start creating content to see it appear here",
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredContent.map((content) => {
                  const FileIcon = getFileIcon(content.type)
                  return (
                    <div
                      key={content.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <FileIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{content.title}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex space-x-1">
                              {content.levels.map((level) => (
                                <Badge key={level} variant="outline" className="text-xs bg-blue-500/10 text-blue-400">
                                  {level}
                                </Badge>
                              ))}
                            </div>
                            <Badge
                              variant="outline"
                              className={cn("text-xs", getSubscriptionColor(content.subscription))}
                            >
                              {content.subscription}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{content.category}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{formatFileSize(content.size)}</span>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{content.views}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(content.publishDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteContent(content.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button onClick={() => router.push("/manager/content")} className="bg-blue-600 hover:bg-blue-700 text-white">
            {t("Créer plus de contenu", "Create More Content")}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/manager/feed")}
            className="border-gray-200 dark:border-gray-700 bg-transparent text-foreground"
          >
            {t("Voir mon feed", "View My Feed")}
          </Button>
        </div>
      </div>
    </div>
  )
}

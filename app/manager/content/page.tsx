"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import {
  BookOpen,
  FileText,
  Video,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Users,
  Clock,
  Star,
  Edit,
  Eye,
  MoreHorizontal,
  Calendar,
  Shield,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import apiClient from "@/lib/api-client"
import { useAuth } from "@/contexts/AuthContext"

export default function ManagerContentPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("courses")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<any[]>([])

  const basePath = pathname.startsWith("/admin") ? "/admin" : "/manager"

  // Separate content by type
  const courses = content.filter(item => item.contentType === 'NOTE' || item.contentType === 'VIDEO')
  const tests = content.filter(item => item.contentType === 'TEST')
  const videos = content.filter(item => item.contentType === 'VIDEO')
  const simulations = content.filter(item => item.contentType === 'SIMULATION')

  // Fetch content from backend
  useEffect(() => {
    const fetchContent = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await apiClient.get('/content-management/management')
        if (response.success && response.data) {
          // Handle both array and object responses from real API
          const contentData = response.data.content || response.data || []
          setContent(Array.isArray(contentData) ? contentData : [])
        } else {
          console.log('No content found or API error')
          setContent([])
        }
      } catch (error) {
        console.error('Error fetching content:', error)
        setContent([])
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [user])

  const getStatusColor = (isPublished: boolean) => {
    if (isPublished) {
      return "bg-green-500/10 text-green-400 border-green-500/20"
    } else {
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "A1":
      case "A2":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "B1":
      case "B2":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "C1":
      case "C2":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("Gestion du contenu", "Content Management")}</h1>
          <p className="text-muted-foreground">
            {t(
              "Créez et gérez vos cours, tests, vidéos et simulations TCF",
              "Create and manage your courses, tests, videos and TCF simulations",
            )}
          </p>
        </div>
        <div className="flex space-x-4">
          <Button
            onClick={() => router.push(`${basePath}/content/create`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("Créer du contenu", "Create Content")}
          </Button>
          <Button
            onClick={() => router.push(`${basePath}/posts/create`)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("Créer un Post", "Create Post")}
          </Button>
        </div>
      </div>

      {/* Action Rapide Section */}
      <Card className="bg-card border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-foreground">{t("Actions rapides", "Quick Actions")}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t("Créez rapidement du contenu avec ces raccourcis", "Quickly create content with these shortcuts")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => router.push(`${basePath}/content/upload?type=course`)}
              className="bg-teal-600 hover:bg-teal-700 text-white justify-start h-auto p-4"
            >
              <div className="flex flex-col items-start space-y-2">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-semibold">{t("Cours", "Course")}</span>
                </div>
                <span className="text-sm text-teal-100">
                  {t("Créer des cours complets", "Create complete courses")}
                </span>
              </div>
            </Button>

            <Button
              onClick={() => router.push(`${basePath}/content/upload?type=video`)}
              className="bg-pink-600 hover:bg-pink-700 text-white justify-start h-auto p-4"
            >
              <div className="flex flex-col items-start space-y-2">
                <div className="flex items-center space-x-2">
                  <Video className="w-5 h-5" />
                  <span className="font-semibold">{t("Contenu Vidéo", "Video Content")}</span>
                </div>
                <span className="text-sm text-pink-100">
                  {t("Télécharger des vidéos éducatives", "Upload educational videos")}
                </span>
              </div>
            </Button>

            <Button
              onClick={() => router.push(`${basePath}/content/upload?type=test`)}
              className="bg-green-600 hover:bg-green-700 text-white justify-start h-auto p-4"
            >
              <div className="flex flex-col items-start space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span className="font-semibold">{t("Créer des Quiz", "Create Quizzes")}</span>
                </div>
                <span className="text-sm text-green-100">
                  {t("Créer des quiz et évaluations", "Create quizzes and assessments")}
                </span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              {t("Cours publiés", "Published Courses")}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {courses.filter((c) => c.isPublished).length}
            </div>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {courses.length} {t("cours total", "total courses")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t("Tests actifs", "Active Tests")}</CardTitle>
            <FileText className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {tests.filter((t) => t.isPublished).length}
            </div>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {tests.length} {t("tests total", "total tests")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t("Vidéos", "Videos")}</CardTitle>
            <Video className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {videos.filter((v) => v.isPublished).length}
            </div>
            <p className="text-xs text-purple-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {videos.length} {t("vidéos total", "total videos")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t("Simulations", "Simulations")}</CardTitle>
            <Shield className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {simulations.filter((s) => s.isPublished).length}
            </div>
            <p className="text-xs text-orange-400 flex items-center mt-1">
              <Shield className="w-3 h-3 mr-1" />
              {simulations.length} {t("simulations total", "total simulations")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-card border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="courses" className="data-[state=active]:bg-muted text-foreground">
              <BookOpen className="w-4 h-4 mr-2" />
              {t("Cours", "Courses")}
            </TabsTrigger>
            <TabsTrigger value="tests" className="data-[state=active]:bg-muted text-foreground">
              <FileText className="w-4 h-4 mr-2" />
              {t("Tests", "Tests")}
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-muted text-foreground">
              <Video className="w-4 h-4 mr-2" />
              {t("Vidéos", "Videos")}
            </TabsTrigger>
            <TabsTrigger value="simulations" className="data-[state=active]:bg-muted text-foreground">
              <Shield className="w-4 h-4 mr-2" />
              {t("Simulations TCF", "TCF Simulations")}
            </TabsTrigger>
          </TabsList>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t("Rechercher du contenu...", "Search content...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-gray-200 dark:border-gray-700 text-foreground w-64"
              />
            </div>
            <Button variant="outline" className="border-gray-200 dark:border-gray-700 text-foreground bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              {t("Filtres", "Filters")}
            </Button>
          </div>
        </div>

        <TabsContent value="courses">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t("Chargement des cours...", "Loading courses...")}</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("Aucun cours", "No courses")}</h3>
              <p className="text-muted-foreground mb-4">{t("Commencez par créer votre premier cours", "Start by creating your first course")}</p>
              <Button onClick={() => router.push(`${basePath}/content/create`)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                {t("Créer un cours", "Create Course")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
              <Card key={course.id} className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-foreground text-lg">{course.title}</CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">{course.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-gray-200 dark:border-gray-700">
                        <DropdownMenuItem className="text-foreground hover:bg-muted">
                          <Edit className="w-4 h-4 mr-2" />
                          {t("Modifier", "Edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground hover:bg-muted">
                          <Eye className="w-4 h-4 mr-2" />
                          {t("Voir", "View")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Badge variant="outline" className={getLevelColor(course.level)}>
                      {course.level}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(course.isPublished)}>
                      {course.isPublished ? t("Publié", "Published") : t("Brouillon", "Draft")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Catégorie", "Category")}</span>
                      <span className="text-foreground">{course.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Type", "Type")}</span>
                      <span className="text-foreground">{course.contentType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Durée", "Duration")}</span>
                      <span className="text-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {course.duration}h
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Créé le", "Created")}</span>
                      <span className="text-foreground flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="simulations">
          {simulations.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("Aucune simulation", "No simulations")}</h3>
              <p className="text-muted-foreground mb-4">{t("Créez votre première simulation TCF/TEF", "Create your first TCF/TEF simulation")}</p>
              <Button onClick={() => router.push(`${basePath}/content/simulation`)} className="bg-orange-600 hover:bg-orange-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                {t("Créer une simulation", "Create Simulation")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {simulations.map((sim) => (
              <Card key={sim.id} className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-foreground text-lg">{sim.title}</CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">{sim.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-gray-200 dark:border-gray-700">
                        <DropdownMenuItem className="text-foreground hover:bg-muted">
                          <Edit className="w-4 h-4 mr-2" />
                          {t("Configurer", "Configure")}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground hover:bg-muted">
                          <Eye className="w-4 h-4 mr-2" />
                          {t("Voir", "View")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Badge variant="outline" className={getLevelColor(sim.level)}>
                      {sim.level}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(sim.isPublished)}>
                      {sim.isPublished ? t("Publié", "Published") : t("Brouillon", "Draft")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Catégorie", "Category")}</span>
                      <span className="text-foreground">{sim.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Durée", "Duration")}</span>
                      <span className="text-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {sim.duration} min
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Créé le", "Created")}</span>
                      <span className="text-foreground flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(sim.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tests">
          {tests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("Aucun test", "No tests")}</h3>
              <p className="text-muted-foreground mb-4">{t("Créez votre premier test d'évaluation", "Create your first assessment test")}</p>
              <Button onClick={() => router.push(`${basePath}/content/upload?type=test`)} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                {t("Créer un test", "Create Test")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test) => (
              <Card key={test.id} className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-foreground text-lg">{test.title}</CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">{test.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-gray-200 dark:border-gray-700">
                        <DropdownMenuItem className="text-foreground hover:bg-muted">
                          <Edit className="w-4 h-4 mr-2" />
                          {t("Modifier", "Edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground hover:bg-muted">
                          <Eye className="w-4 h-4 mr-2" />
                          {t("Résultats", "Results")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Badge variant="outline" className={getLevelColor(test.level)}>
                      {test.level}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(test.isPublished)}>
                      {test.isPublished ? t("Publié", "Published") : t("Brouillon", "Draft")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Catégorie", "Category")}</span>
                      <span className="text-foreground">{test.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Type", "Type")}</span>
                      <span className="text-blue-400">{test.contentType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Abonnement", "Subscription")}</span>
                      <span className="text-green-400">{test.subscriptionTier}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Durée", "Duration")}</span>
                      <span className="text-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {test.duration} min
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos">
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("Aucune vidéo", "No videos")}</h3>
              <p className="text-muted-foreground mb-4">{t("Téléchargez votre première vidéo éducative", "Upload your first educational video")}</p>
              <Button onClick={() => router.push(`${basePath}/content/upload?type=video`)} className="bg-pink-600 hover:bg-pink-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                {t("Télécharger une vidéo", "Upload Video")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
              <Card key={video.id} className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader className="p-0">
                  <div className="relative">
                    <img
                      src={video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      className="w-full h-32 object-cover rounded-t-lg"
                    />
                    <Badge variant="outline" className={`absolute top-2 right-2 ${getStatusColor(video.isPublished)}`}>
                      {video.isPublished ? t("Publié", "Published") : t("Brouillon", "Draft")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-foreground font-semibold">{video.title}</h3>
                      <p className="text-muted-foreground text-sm">{video.description}</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Durée", "Duration")}</span>
                      <span className="text-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {video.duration}h
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Niveau", "Level")}</span>
                      <span className="text-blue-400">{video.level}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Catégorie", "Category")}</span>
                      <span className="text-red-400">{video.category}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { ArrowLeft, BarChart3, Users, Eye, Heart, MessageCircle, Star, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ManagerStatsPageProps {
  role?: "admin" | "senior" | "content" | "junior"
}

export default function ManagerStatsPage({ role: propRole }: ManagerStatsPageProps = {}) {
  const { t } = useLanguage()
  const router = useRouter()
  const [timeRange, setTimeRange] = useState("30d")
  const [contentType, setContentType] = useState("all")
  
  // Determine current role
  const currentRole = propRole || "senior"

  // Empty data - ready for backend integration
  const statsData = {
    overview: {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      averageRating: 0,
      totalContent: 0,
      activeUsers: 0,
    },
    trends: {
      viewsGrowth: 0,
      likesGrowth: 0,
      commentsGrowth: 0,
      ratingGrowth: 0,
    },
    topContent: [],
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t("Statistiques détaillées", "Detailed Statistics")}</h1>
              <p className="text-muted-foreground mt-1">
                {t("Analyse complète de vos performances", "Complete analysis of your performance")}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-input border-gray-200 dark:border-gray-700 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                <SelectItem value="7d" className="text-foreground">
                  7 jours
                </SelectItem>
                <SelectItem value="30d" className="text-foreground">
                  30 jours
                </SelectItem>
                <SelectItem value="90d" className="text-foreground">
                  90 jours
                </SelectItem>
                <SelectItem value="1y" className="text-foreground">
                  1 an
                </SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Download className="w-4 h-4 mr-2" />
              {t("Exporter", "Export")}
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{statsData.overview.totalViews.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{t("Vues totales", "Total Views")}</p>
                  <p className="text-xs text-green-400">+{statsData.trends.viewsGrowth}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{statsData.overview.totalLikes.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{t("J'aime", "Likes")}</p>
                  <p className="text-xs text-green-400">+{statsData.trends.likesGrowth}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{statsData.overview.totalComments}</p>
                  <p className="text-sm text-muted-foreground">{t("Commentaires", "Comments")}</p>
                  <p className="text-xs text-green-400">+{statsData.trends.commentsGrowth}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{statsData.overview.averageRating}</p>
                  <p className="text-sm text-muted-foreground">{t("Note moyenne", "Avg Rating")}</p>
                  <p className="text-xs text-green-400">+{statsData.trends.ratingGrowth}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{statsData.overview.totalContent}</p>
                  <p className="text-sm text-muted-foreground">{t("Contenus", "Content")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{statsData.overview.activeUsers}</p>
                  <p className="text-sm text-muted-foreground">{t("Utilisateurs actifs", "Active Users")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Content */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground">{t("Contenu le plus performant", "Top Performing Content")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statsData.topContent.map((content, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <span className="text-blue-400 font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{content.title}</h4>
                      <p className="text-sm text-muted-foreground capitalize">{content.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span className="text-foreground">{content.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span className="text-foreground">{content.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-foreground">{content.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import {
  ArrowLeft,
  Users,
  UserPlus,
  UserMinus,
  Globe,
  Clock,
  TrendingUp,
  Mail,
  MessageSquare,
  Settings,
} from "lucide-react"

interface ManagerAudiencePageProps {
  role?: "admin" | "senior" | "content" | "junior"
}

export default function ManagerAudiencePage({ role: propRole }: ManagerAudiencePageProps = {}) {
  const { t } = useLanguage()
  const router = useRouter()
  
  // Determine current role
  const currentRole = propRole || "senior"

  // Empty data - ready for backend integration
  const audienceData = {
    overview: {
      totalFollowers: 0,
      newFollowers: 0,
      unfollowers: 0,
      engagementRate: 0,
    },
    demographics: {
      levels: [],
      subscriptions: [],
    },
    engagement: {
      mostActiveHours: [],
      topInteractions: [],
      averageSessionTime: "0m 0s",
    },
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
              <h1 className="text-3xl font-bold text-foreground">{t("Gestion de l'audience", "Audience Management")}</h1>
              <p className="text-muted-foreground mt-1">
                {t("Analysez et gérez votre communauté d'apprenants", "Analyze and manage your learning community")}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Mail className="w-4 h-4 mr-2" />
              {t("Envoyer message", "Send Message")}
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {audienceData.overview.totalFollowers.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("Abonnés totaux", "Total Followers")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">+{audienceData.overview.newFollowers}</p>
                  <p className="text-sm text-muted-foreground">{t("Nouveaux abonnés", "New Followers")}</p>
                  <p className="text-xs text-green-500">{t("Cette semaine", "This week")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <UserMinus className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">-{audienceData.overview.unfollowers}</p>
                  <p className="text-sm text-muted-foreground">{t("Désabonnements", "Unfollowers")}</p>
                  <p className="text-xs text-red-500">{t("Cette semaine", "This week")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{audienceData.overview.engagementRate}%</p>
                  <p className="text-sm text-muted-foreground">{t("Taux d'engagement", "Engagement Rate")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-foreground">{t("Répartition par niveau", "Level Distribution")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audienceData.demographics.levels.map((level) => (
                  <div key={level.level} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-foreground">
                        {level.level}
                      </Badge>
                      <span className="text-foreground">
                        {level.count} {t("apprenants", "learners")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${level.percentage}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground w-12">{level.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-foreground">
                {t("Répartition par abonnement", "Subscription Distribution")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audienceData.demographics.subscriptions.map((sub) => (
                  <div key={sub.plan} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant="outline"
                        className={`text-foreground ${
                          sub.plan === "Gratuit"
                            ? "border-green-500/20 text-green-500"
                            : sub.plan === "Essentiel"
                              ? "border-blue-500/20 text-blue-500"
                              : sub.plan === "Premium"
                                ? "border-orange-500/20 text-orange-500"
                                : "border-purple-500/20 text-purple-500"
                        }`}
                      >
                        {sub.plan}
                      </Badge>
                      <span className="text-foreground">
                        {sub.count} {t("utilisateurs", "users")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${sub.percentage}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground w-12">{sub.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Insights */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground">{t("Insights d'engagement", "Engagement Insights")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-3">{t("Heures les plus actives", "Most Active Hours")}</h4>
                <div className="space-y-2">
                  {audienceData.engagement.mostActiveHours.map((hour, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-foreground">{hour}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">{t("Interactions principales", "Top Interactions")}</h4>
                <div className="space-y-2">
                  {audienceData.engagement.topInteractions.map((interaction, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-green-400" />
                      <span className="text-foreground capitalize">{t(interaction, interaction)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">{t("Temps de session moyen", "Average Session Time")}</h4>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span className="text-foreground text-xl font-bold">{audienceData.engagement.averageSessionTime}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import PageShell from "@/components/page-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Download,
  FileText,
  Video,
  Headphones,
  BookOpen,
  Search,
  Filter,
  Crown,
  Shield,
  Sparkles,
  Lock,
} from "lucide-react"
import { useLang } from "@/components/language-provider"

type SubscriptionTier = "free" | "essential" | "premium" | "pro+"
type ContentType = "pdf" | "video" | "audio" | "exercise"

interface DownloadItem {
  id: string
  title: string
  description: string
  type: ContentType
  level: string
  size: string
  requiredTier: SubscriptionTier
  image: string
  downloadCount: number
  rating: number
}

export default function DownloadPage() {
  const { t } = useLang()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<ContentType | "all">("all")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")

  // Mock user subscription - in real app, this would come from user context
  const userSubscription: SubscriptionTier = "premium"

  const downloadItems: DownloadItem[] = []

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5" />
      case "video":
        return <Video className="h-5 w-5" />
      case "audio":
        return <Headphones className="h-5 w-5" />
      case "exercise":
        return <BookOpen className="h-5 w-5" />
    }
  }

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case "essential":
        return <Shield className="h-4 w-4" />
      case "premium":
        return <Crown className="h-4 w-4" />
      case "pro+":
        return <Sparkles className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case "essential":
        return "bg-[#007BFF] text-white"
      case "premium":
        return "bg-[#2ECC71] text-black"
      case "pro+":
        return "bg-[#8E44AD] text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const canDownload = (requiredTier: SubscriptionTier) => {
    const tierHierarchy = { free: 0, essential: 1, premium: 2, "pro+": 3 }
    return tierHierarchy[userSubscription] >= tierHierarchy[requiredTier]
  }

  const filteredItems = downloadItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === "all" || item.type === selectedType
    const matchesLevel = selectedLevel === "all" || item.level.includes(selectedLevel)

    return matchesSearch && matchesType && matchesLevel
  })

  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("download.title")}</h1>
          <p className="text-muted-foreground">{t("download.subtitle")}</p>
          <div className="mt-4 flex items-center gap-2">
            <Badge className={getTierColor(userSubscription)}>
              {getTierIcon(userSubscription)}
              <span className="ml-1 capitalize">{t(`subscription.${userSubscription}`)}</span>
            </Badge>
            <span className="text-sm text-muted-foreground">{t("download.subscription.current")}</span>
          </div>
        </header>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("download.search.placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{t("download.filters.category")}:</span>
              <div className="flex gap-1">
                {["all", "pdf", "video", "audio", "exercise"].map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type as ContentType | "all")}
                    className="h-8"
                  >
                    {type === "all" ? t("download.filters.all") : type.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{t("common.level")}:</span>
              <div className="flex gap-1">
                {["all", "A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                  <Button
                    key={level}
                    variant={selectedLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLevel(level)}
                    className="h-8"
                  >
                    {level === "all" ? t("download.filters.all") : level}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Download Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-muted/50 rounded-full flex items-center justify-center">
              <Download className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">
              {t("Aucun contenu disponible", "No content available")}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t("Les contenus téléchargeables seront bientôt disponibles. Revenez plus tard pour découvrir nos ressources d'apprentissage.", "Downloadable content will be available soon. Check back later to discover our learning resources.")}
            </p>
            <Button asChild>
              <a href="/abonnement">
                <Crown className="h-4 w-4 mr-2" />
                {t("Voir les abonnements", "View subscriptions")}
              </a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const hasAccess = canDownload(item.requiredTier)

              return (
                <Card key={item.id} className="bg-card border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="relative">
                    <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-48 object-cover" />
                    <div className="absolute top-2 left-2">
                      <Badge className={getTierColor(item.requiredTier)}>
                        {getTierIcon(item.requiredTier)}
                        <span className="ml-1 capitalize">{t(`subscription.${item.requiredTier}`)}</span>
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-background/80">
                        {getTypeIcon(item.type)}
                        <span className="ml-1">{item.type.toUpperCase()}</span>
                      </Badge>
                    </div>
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                        <Lock className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <CardHeader>
                    <CardTitle className="text-lg text-foreground line-clamp-2">{item.title}</CardTitle>
                    <CardDescription className="text-muted-foreground line-clamp-2">{item.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("common.level")}: <span className="font-medium">{item.level}</span>
                      </span>
                      <span className="text-muted-foreground">{item.size}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        ⭐ {item.rating} • {item.downloadCount.toLocaleString()} {t("download.downloads")}
                      </span>
                    </div>

                    <Button className="w-full" disabled={!hasAccess} variant={hasAccess ? "default" : "outline"}>
                      {hasAccess ? (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          {t("download.button")}
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          {t("download.locked")}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

      </main>
    </PageShell>
  )
}

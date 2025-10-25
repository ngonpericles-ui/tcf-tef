"use client"

import { useState, useEffect } from "react"
import PageShell from "@/components/page-shell"
import Link from "next/link"
import { Bookmark, ExternalLink, Trash2, Filter, Search, BookOpen, PenSquare, Video, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLang } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import Image from "next/image"

type FavoriteType = "COURSE" | "TEST" | "POST" | "LIVE_SESSION"

type Favorite = {
  id: string
  contentId: string
  contentType: FavoriteType
  title?: string
  titleEn?: string
  level?: string
  author?: string
  image?: string
  addedDate: string
  lastAccessed?: string
  progress?: number
  tags: string[]
  notes?: string
}

const typeIcons = {
  COURSE: BookOpen,
  TEST: Award,
  POST: PenSquare,
  LIVE_SESSION: Video,
}

const typeColors = {
  COURSE: "#2ECC71",
  TEST: "#007BFF",
  POST: "#8E44AD",
  LIVE_SESSION: "#F39C12",
}

export default function FavoritesPage() {
  const { lang } = useLang()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<FavoriteType | "all">("all")
  const [loading, setLoading] = useState(true)
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching favorites...')

      // Fetch all favorites with content type filter
      const response = await apiClient.get('/favorites?contentType=COURSE')
      console.log('🔍 Favorites API Response:', response)

      if ((response as any).success) {
        const favs = (response as any).data?.favorites || []
        console.log('📚 Favorites data:', favs)
        console.log('📚 Favorites count:', favs.length)

        // Fetch content details for each favorite
        const favoritesWithDetails = await Promise.all(
          favs.map(async (fav: any) => {
            try {
              if (fav.contentType === 'COURSE') {
                const courseResponse = await apiClient.get(`/courses/${fav.contentId}`)
                if ((courseResponse as any).success && (courseResponse as any).data) {
                  const course = (courseResponse as any).data.course || (courseResponse as any).data
                  return {
                    ...fav,
                    title: course.title,
                    titleEn: course.titleEn,
                    level: course.level,
                    author: course.createdBy?.firstName + ' ' + course.createdBy?.lastName || 'Unknown',
                    image: course.image || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop&q=80",
                    tags: course.tags || []
                  }
                }
              }
              return fav
            } catch (error) {
              console.error(`❌ Error fetching content for favorite ${fav.id}:`, error)
              return fav
            }
          })
        )

        setFavorites(favoritesWithDetails)

        if (favs.length === 0) {
          console.log('ℹ️ No favorites found for COURSE content type')
        }
      } else {
        console.error('❌ Favorites API not successful:', response)
        setFavorites([])
      }
    } catch (error) {
      console.error('❌ Error fetching favorites:', error)
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [])

  const filteredFavorites = favorites.filter((fav) => {
    const matchesSearch =
      searchQuery === "" ||
      (fav.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (fav.titleEn?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (fav.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ?? false)

    const matchesType = selectedType === "all" || fav.contentType === selectedType

    return matchesSearch && matchesType
  })

  const removeFavorite = async (id: string) => {
    try {
      await apiClient.delete(`/favorites/${id}`)
      setFavorites((prev) => prev.filter((fav) => fav.id !== id))
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  const getTypeLabel = (type: FavoriteType) => {
    switch (type) {
      case "COURSE":
        return t("Cours", "Course")
      case "TEST":
        return t("Test", "Test")
      case "POST":
        return t("Article", "Post")
      case "LIVE_SESSION":
        return t("Session", "Session")
    }
  }

  const getItemLink = (favorite: Favorite) => {
    switch (favorite.contentType) {
      case "COURSE":
        return "/cours"
      case "TEST":
        return "/tests"
      case "POST":
        return `/posts/${favorite.contentId}`
      case "LIVE_SESSION":
        return "/live"
      default:
        return "/"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold font-[var(--font-poppins)] mb-2 text-foreground">
                {t("Mes favoris", "My favorites")}
              </h1>
              <p className="text-muted-foreground">
                {t(
                  "Retrouvez tous vos contenus sauvegardés : cours, tests, articles et sessions.",
                  "Find all your saved content: courses, tests, articles and sessions.",
                )}
              </p>
            </div>
            <Button 
              onClick={fetchFavorites} 
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Bookmark className="h-4 w-4" />
              {loading ? t("Chargement...", "Loading...") : t("Actualiser", "Refresh")}
            </Button>
          </div>
        </header>

        {/* Search and Filter */}
        <section className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("Rechercher dans vos favoris...", "Search in your favorites...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as FavoriteType | "all")}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">{t("Tous types", "All types")}</option>
                <option value="COURSE">{t("Cours", "Courses")}</option>
                <option value="TEST">{t("Tests", "Tests")}</option>
                <option value="POST">{t("Articles", "Posts")}</option>
                <option value="LIVE_SESSION">{t("Sessions", "Sessions")}</option>
              </select>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(typeColors).map(([type, color]) => {
              const count = favorites.filter((f) => f.contentType === type).length
              const Icon = typeIcons[type as FavoriteType]

              return (
                <div key={type} className="rounded-lg border p-4 text-center bg-card">
                  <div className="flex items-center justify-center mb-2">
                    <Icon className="h-6 w-6" style={{ color }} />
                  </div>
                  <div className="text-2xl font-bold" style={{ color }}>
                    {count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getTypeLabel(type as FavoriteType)}
                    {count !== 1 && lang === "fr" ? "s" : count !== 1 && lang === "en" ? "s" : ""}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Favorites Grid */}
        <section>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
              <p className="mt-4 text-muted-foreground">{t("Chargement...", "Loading...")}</p>
            </div>
          ) : filteredFavorites.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-foreground">
                {searchQuery ? t("Aucun résultat trouvé", "No results found") : t("Aucun favori", "No favorites")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? t("Essayez avec d'autres mots-clés", "Try with different keywords")
                  : t("Commencez à sauvegarder vos contenus préférés", "Start saving your favorite content")}
              </p>
              {!searchQuery && (
                <Link href="/cours">
                  <Button>{t("Explorer les cours", "Explore courses")}</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavorites.map((favorite) => {
                const Icon = typeIcons[favorite.contentType]
                const typeColor = typeColors[favorite.contentType]

                return (
                  <div
                    key={favorite.id}
                    className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={favorite.image || "/placeholder.svg"}
                        alt={lang === "fr" ? (favorite.title || '') : (favorite.titleEn || '')}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <Badge className="text-white border-0" style={{ backgroundColor: typeColor }}>
                          <Icon className="h-3 w-3 mr-1" />
                          {getTypeLabel(favorite.contentType)}
                        </Badge>
                        {favorite.level && (
                          <Badge variant="outline" className="bg-white/90 text-black border-0">
                            {favorite.level}
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-3 right-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFavorite(favorite.id)}
                          className="h-8 w-8 bg-white/90 hover:bg-white text-black hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-foreground">
                        {lang === "fr" ? favorite.title : favorite.titleEn}
                      </h3>

                      <div className="text-sm text-muted-foreground mb-3">
                        {t("Par", "By")} {favorite.author}
                      </div>

                      {favorite.progress !== undefined && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{t("Progression", "Progress")}</span>
                            <span className="text-foreground">{favorite.progress}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-[#2ECC71] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${favorite.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>
                          {t("Ajouté le", "Added on")} {formatDate(favorite.addedDate)}
                        </span>
                        {favorite.lastAccessed && (
                          <span>
                            {t("Vu le", "Viewed on")} {formatDate(favorite.lastAccessed)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {favorite.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {favorite.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{favorite.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      <Link href={getItemLink(favorite)}>
                        <Button className="w-full gap-2">
                          <ExternalLink className="h-4 w-4" />
                          {t("Ouvrir", "Open")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </PageShell>
  )
}

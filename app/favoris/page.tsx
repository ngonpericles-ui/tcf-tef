"use client"

import { useState } from "react"
import PageShell from "@/components/page-shell"
import Link from "next/link"
import { Bookmark, ExternalLink, Trash2, Filter, Search, BookOpen, PenSquare, Video, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLang } from "@/components/language-provider"
import Image from "next/image"

type FavoriteType = "course" | "test" | "post" | "session"

type Favorite = {
  id: string
  title: string
  titleEn: string
  type: FavoriteType
  level?: string
  author: string
  image: string
  addedDate: string
  lastAccessed?: string
  progress?: number
  tags: string[]
}

const mockFavorites: Favorite[] = []

const typeIcons = {
  course: BookOpen,
  test: Award,
  post: PenSquare,
  session: Video,
}

const typeColors = {
  course: "#2ECC71",
  test: "#007BFF",
  post: "#8E44AD",
  session: "#F39C12",
}

export default function FavoritesPage() {
  const { lang } = useLang()
  const [favorites, setFavorites] = useState(mockFavorites)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<FavoriteType | "all">("all")
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const filteredFavorites = favorites.filter((fav) => {
    const matchesSearch =
      searchQuery === "" ||
      fav.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = selectedType === "all" || fav.type === selectedType

    return matchesSearch && matchesType
  })

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== id))
  }

  const getTypeLabel = (type: FavoriteType) => {
    switch (type) {
      case "course":
        return t("Cours", "Course")
      case "test":
        return t("Test", "Test")
      case "post":
        return t("Article", "Post")
      case "session":
        return t("Session", "Session")
    }
  }

  const getItemLink = (favorite: Favorite) => {
    switch (favorite.type) {
      case "course":
        return "/cours"
      case "test":
        return "/tests"
      case "post":
        return `/posts/${favorite.id}`
      case "session":
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
          <h1 className="text-2xl md:text-3xl font-semibold font-[var(--font-poppins)] mb-2 text-foreground">
            {t("Mes favoris", "My favorites")}
          </h1>
          <p className="text-muted-foreground">
            {t(
              "Retrouvez tous vos contenus sauvegardés : cours, tests, articles et sessions.",
              "Find all your saved content: courses, tests, articles and sessions.",
            )}
          </p>
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
                <option value="course">{t("Cours", "Courses")}</option>
                <option value="test">{t("Tests", "Tests")}</option>
                <option value="post">{t("Articles", "Posts")}</option>
                <option value="session">{t("Sessions", "Sessions")}</option>
              </select>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(typeColors).map(([type, color]) => {
              const count = favorites.filter((f) => f.type === type).length
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
          {filteredFavorites.length === 0 ? (
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
                const Icon = typeIcons[favorite.type]
                const typeColor = typeColors[favorite.type]

                return (
                  <div
                    key={favorite.id}
                    className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={favorite.image || "/placeholder.svg"}
                        alt={lang === "fr" ? favorite.title : favorite.titleEn}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <Badge className="text-white border-0" style={{ backgroundColor: typeColor }}>
                          <Icon className="h-3 w-3 mr-1" />
                          {getTypeLabel(favorite.type)}
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

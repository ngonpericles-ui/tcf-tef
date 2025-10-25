"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Users, BookOpen, Video, CreditCard, Clock, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"
import Link from "next/link"

interface SearchResult {
  id: string
  type: "user" | "content" | "session" | "subscription"
  title: string
  description: string
  category?: string
  status?: string
  date?: string
  url: string
}

// Search results will be loaded from backend
const searchResults: SearchResult[] = []

export default function AdminSearchPage() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("all")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsSearching(true)
      // Simulate search delay
      const timer = setTimeout(() => {
        const filteredResults = searchResults.filter((result) => {
          const matchesQuery =
            result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.description.toLowerCase().includes(searchQuery.toLowerCase())
          const matchesType = searchType === "all" || result.type === searchType
          return matchesQuery && matchesType
        })
        setResults(filteredResults)
        setIsSearching(false)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setResults([])
    }
  }, [searchQuery, searchType])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user":
        return <Users className="w-4 h-4" />
      case "content":
        return <BookOpen className="w-4 h-4" />
      case "session":
        return <Video className="w-4 h-4" />
      case "subscription":
        return <CreditCard className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "user":
        return t("Utilisateur", "User")
      case "content":
        return t("Contenu", "Content")
      case "session":
        return t("Session", "Session")
      case "subscription":
        return t("Abonnement", "Subscription")
      default:
        return type
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-600"
      case "published":
        return "bg-blue-600"
      case "scheduled":
        return "bg-orange-600"
      case "inactive":
        return "bg-gray-600"
      default:
        return "bg-slate-600"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">{t("Recherche avancée", "Advanced Search")}</h1>
        <p className="text-slate-400 mt-1">
          {t("Recherchez dans tous les éléments de la plateforme", "Search across all platform elements")}
        </p>
      </div>

      {/* Search Interface */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder={t(
                  "Rechercher des utilisateurs, contenus, sessions...",
                  "Search users, content, sessions...",
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
              />
            </div>

            {/* Type Filter */}
            <div className="w-full md:w-48">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-slate-300">
                    {t("Tout", "All")}
                  </SelectItem>
                  <SelectItem value="user" className="text-slate-300">
                    {t("Utilisateurs", "Users")}
                  </SelectItem>
                  <SelectItem value="content" className="text-slate-300">
                    {t("Contenu", "Content")}
                  </SelectItem>
                  <SelectItem value="session" className="text-slate-300">
                    {t("Sessions", "Sessions")}
                  </SelectItem>
                  <SelectItem value="subscription" className="text-slate-300">
                    {t("Abonnements", "Subscriptions")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchQuery.length > 2 && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {isSearching
                ? t("Recherche en cours...", "Searching...")
                : t(`${results.length} résultats trouvés`, `${results.length} results found`)}
            </h2>
            {results.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                <span>{t("Recherche effectuée en 0.3s", "Search completed in 0.3s")}</span>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isSearching && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Results List */}
          {!isSearching && results.length > 0 && (
            <div className="space-y-3">
              {results.map((result) => (
                <Link key={result.id} href={result.url}>
                  <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex items-center justify-center w-10 h-10 bg-slate-700 rounded-lg">
                            {getTypeIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-white font-medium truncate">{result.title}</h3>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getStatusColor(result.status)} text-white`}
                              >
                                {getTypeLabel(result.type)}
                              </Badge>
                              {result.status && (
                                <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                                  {result.status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-slate-400 text-sm line-clamp-2">{result.description}</p>
                            {result.date && (
                              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                                <span>
                                  {t("Modifié le", "Modified on")} {result.date}
                                </span>
                                {result.category && <span>• {result.category}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <TrendingUp className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isSearching && results.length === 0 && searchQuery.length > 2 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">{t("Aucun résultat trouvé", "No results found")}</h3>
                <p className="text-slate-400 text-sm">
                  {t(
                    "Essayez avec des mots-clés différents ou vérifiez l'orthographe",
                    "Try different keywords or check spelling",
                  )}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Search Tips */}
      {searchQuery.length <= 2 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Search className="w-5 h-5 mr-2" />
              {t("Conseils de recherche", "Search Tips")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="text-white font-medium mb-2">{t("Types de recherche", "Search Types")}</h4>
                <ul className="space-y-1 text-slate-400">
                  <li>• {t("Utilisateurs: nom, email, niveau", "Users: name, email, level")}</li>
                  <li>• {t("Contenu: titre, description, catégorie", "Content: title, description, category")}</li>
                  <li>• {t("Sessions: nom, animateur, date", "Sessions: name, host, date")}</li>
                  <li>• {t("Abonnements: utilisateur, plan, statut", "Subscriptions: user, plan, status")}</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">{t("Raccourcis", "Shortcuts")}</h4>
                <ul className="space-y-1 text-slate-400">
                  <li>• {t("Tapez au moins 3 caractères", "Type at least 3 characters")}</li>
                  <li>• {t("Utilisez les filtres pour affiner", "Use filters to refine")}</li>
                  <li>• {t("Recherche en temps réel", "Real-time search")}</li>
                  <li>• {t("Cliquez sur un résultat pour voir les détails", "Click result for details")}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

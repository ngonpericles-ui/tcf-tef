"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  Filter,
  Clock,
  TrendingUp,
  BookOpen,
  Target,
  Video,
  Users,
  FileText,
  Award,
  Bell,
  BarChart3,
  ChevronDown,
  X,
  Star,
  Eye,
  ThumbsUp,
  ExternalLink,
  Bookmark,
  Share2
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useSharedData } from "@/components/shared-data-provider"
import { 
  UnifiedSearchService,
  type SearchCategory,
  type SearchFilters,
  type SearchResult,
  type SearchResponse,
  type SearchSuggestion,
  type SearchScope
} from "@/lib/services/unifiedSearchService"
import { cn } from "@/lib/utils"

interface UnifiedSearchProps {
  defaultQuery?: string
  defaultFilters?: SearchFilters
  scope?: SearchScope
  categories?: SearchCategory[]
  placeholder?: string
  className?: string
  showFilters?: boolean
  showSuggestions?: boolean
  showRecent?: boolean
  showTrending?: boolean
  compact?: boolean
  onResultClick?: (result: SearchResult) => void
}

export default function UnifiedSearch({
  defaultQuery = "",
  defaultFilters = {},
  scope = "global",
  categories,
  placeholder,
  className = "",
  showFilters = true,
  showSuggestions = true,
  showRecent = true,
  showTrending = true,
  compact = false,
  onResultClick
}: UnifiedSearchProps) {
  const { t, language } = useLanguage()
  const { userProfile } = useSharedData()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Parse URL parameters
  const urlQuery = searchParams.get('q') || defaultQuery
  const urlFilters = useMemo(() => {
    const filters: SearchFilters = { ...defaultFilters }
    
    // Parse categories from URL
    const urlCategories = searchParams.getAll('categories') as SearchCategory[]
    if (urlCategories.length) filters.categories = urlCategories
    
    // Parse other filters...
    const urlScope = searchParams.get('scope') as SearchScope
    if (urlScope) filters.scope = urlScope
    
    return filters
  }, [searchParams, defaultFilters])

  // State
  const [query, setQuery] = useState(urlQuery)
  const [filters, setFilters] = useState<SearchFilters>(urlFilters)
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([])
  const [trendingSearches, setTrendingSearches] = useState<SearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Category icons
  const categoryIcons = {
    courses: BookOpen,
    tests: Target,
    live_sessions: Video,
    users: Users,
    content: FileText,
    achievements: Award,
    announcements: Bell,
    analytics: BarChart3,
    files: FileText,
    all: Search
  }

  // Perform search
  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters, page: number = 1) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await UnifiedSearchService.search(
        searchQuery,
        { ...searchFilters, scope },
        page,
        20
      )

      if (response.success) {
        setSearchResponse(response.data)
        setCurrentPage(page)
        
        // Update URL
        const url = UnifiedSearchService.buildSearchUrl(searchQuery, searchFilters)
        router.push(url, { scroll: false })
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [scope, router])

  // Get suggestions
  const getSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    setSuggestionsLoading(true)
    try {
      const response = await UnifiedSearchService.getSuggestions(searchQuery, scope, 8)
      if (response.success) {
        setSuggestions(response.data)
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error)
    } finally {
      setSuggestionsLoading(false)
    }
  }, [scope])

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load recent searches
        if (showRecent) {
          const recentResponse = await UnifiedSearchService.getRecentSearches(5)
          if (recentResponse.success) {
            setRecentSearches(recentResponse.data.map(r => ({
              text: r.query,
              category: 'all' as SearchCategory,
              count: r.resultCount,
              type: 'recent' as const
            })))
          }
        }

        // Load trending searches
        if (showTrending) {
          const trendingResponse = await UnifiedSearchService.getTrendingSearches(scope, 5)
          if (trendingResponse.success) {
            setTrendingSearches(trendingResponse.data)
          }
        }

        // Perform initial search if query exists
        if (urlQuery) {
          await performSearch(urlQuery, urlFilters)
        }
      } catch (error) {
        console.error('Failed to load initial search data:', error)
      }
    }

    loadInitialData()
  }, [urlQuery, urlFilters, performSearch, showRecent, showTrending, scope])

  // Handle search input change
  const handleInputChange = (value: string) => {
    setQuery(value)
    if (showSuggestions) {
      getSuggestions(value)
    }
  }

  // Handle search submit
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (finalQuery.trim()) {
      performSearch(finalQuery, filters)
      setShowSuggestionsDropdown(false)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    handleSearch(suggestion.text)
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    // Track interaction
    UnifiedSearchService.trackSearchInteraction(
      searchResponse?.query || '',
      result.id,
      'click'
    )

    if (onResultClick) {
      onResultClick(result)
    } else {
      router.push(result.url)
    }
  }

  // Handle filter change
  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters)
    if (query.trim()) {
      performSearch(query, newFilters)
    }
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (query.trim()) {
      performSearch(query, filters, page)
    }
  }

  // Format result
  const formatResult = (result: SearchResult) => {
    return UnifiedSearchService.formatSearchResult(result, language)
  }

  // Get placeholder text
  const getPlaceholder = () => {
    if (placeholder) return placeholder
    
    const scopeLabels = {
      student: t('Rechercher des cours, tests, sessions...', 'Search courses, tests, sessions...'),
      manager: t('Rechercher du contenu, étudiants, analytics...', 'Search content, students, analytics...'),
      admin: t('Rechercher dans toute la plateforme...', 'Search across the platform...'),
      global: t('Rechercher...', 'Search...')
    }
    
    return scopeLabels[scope] || scopeLabels.global
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <Popover open={showSuggestionsDropdown} onOpenChange={setShowSuggestionsDropdown}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  } else if (e.key === 'Escape') {
                    setShowSuggestionsDropdown(false)
                  }
                }}
                onFocus={() => setShowSuggestionsDropdown(true)}
                placeholder={getPlaceholder()}
                className="pl-10 pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {showFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                    className={cn(
                      "h-7 px-2",
                      showFiltersPanel && "bg-accent"
                    )}
                  >
                    <Filter className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch()}
                  className="h-7 px-2"
                >
                  <Search className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </PopoverTrigger>
          
          {/* Suggestions Dropdown */}
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandList>
                {/* Current query suggestions */}
                {suggestions.length > 0 && (
                  <CommandGroup heading={t("Suggestions", "Suggestions")}>
                    {suggestions.map((suggestion, index) => {
                      const Icon = categoryIcons[suggestion.category] || Search
                      return (
                        <CommandItem
                          key={index}
                          onSelect={() => handleSuggestionClick(suggestion)}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="flex-1">{suggestion.text}</span>
                          {suggestion.count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.count}
                            </Badge>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}

                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <CommandGroup heading={t("Recherches récentes", "Recent searches")}>
                    {recentSearches.map((search, index) => (
                      <CommandItem
                        key={index}
                        onSelect={() => handleSuggestionClick(search)}
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        <span className="flex-1">{search.text}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Trending searches */}
                {trendingSearches.length > 0 && (
                  <CommandGroup heading={t("Tendances", "Trending")}>
                    {trendingSearches.map((search, index) => (
                      <CommandItem
                        key={index}
                        onSelect={() => handleSuggestionClick(search)}
                        className="flex items-center gap-2"
                      >
                        <TrendingUp className="h-4 w-4" />
                        <span className="flex-1">{search.text}</span>
                        <Badge variant="secondary" className="text-xs">
                          {search.count}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Empty state */}
                {suggestions.length === 0 && recentSearches.length === 0 && trendingSearches.length === 0 && (
                  <CommandEmpty>
                    {t("Aucune suggestion disponible", "No suggestions available")}
                  </CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters */}
      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.categories?.map((category) => (
            <Badge key={category} variant="secondary" className="text-xs">
              {t(category, category)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => {
                  const newCategories = filters.categories?.filter(c => c !== category)
                  handleFilterChange({ ...filters, categories: newCategories })
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {/* Add other filter badges similarly */}
        </div>
      )}

      {/* Search Results */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : searchResponse ? (
        <div className="space-y-4">
          {/* Results header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t(
                `${searchResponse.total} résultats trouvés en ${searchResponse.searchTime}ms`,
                `${searchResponse.total} results found in ${searchResponse.searchTime}ms`
              )}
            </p>
          </div>

          {/* Results list */}
          <div className="space-y-3">
            {searchResponse.results.map((result) => {
              const formatted = formatResult(result)
              const Icon = categoryIcons[result.category] || FileText
              
              return (
                <Card 
                  key={result.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm truncate">
                            {formatted.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {formatted.categoryLabel}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {formatted.description}
                        </p>
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {result.metadata.stats?.views && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{result.metadata.stats.views}</span>
                            </div>
                          )}
                          {result.metadata.stats?.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              <span>{result.metadata.stats.rating}</span>
                            </div>
                          )}
                          {result.metadata.author && (
                            <span>{result.metadata.author.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {searchResponse.hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={loading}
              >
                {t('Charger plus', 'Load more')}
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

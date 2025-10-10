import { apiClient, ApiResponse } from '@/lib/api-client'

export type SearchCategory = 
  | 'courses' 
  | 'tests' 
  | 'live_sessions' 
  | 'content' 
  | 'users' 
  | 'analytics'
  | 'files'
  | 'announcements'
  | 'achievements'
  | 'all'

export type SearchScope = 'student' | 'manager' | 'admin' | 'global'

export interface SearchFilters {
  categories?: SearchCategory[]
  scope?: SearchScope
  dateRange?: {
    from: string
    to: string
  }
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[]
  level?: ('A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2')[]
  status?: ('active' | 'completed' | 'draft' | 'archived')[]
  tags?: string[]
  author?: string
  language?: ('fr' | 'en')[]
  subscription?: ('FREE' | 'ESSENTIAL' | 'PREMIUM' | 'PRO')[]
  sortBy?: 'relevance' | 'date' | 'popularity' | 'rating' | 'alphabetical'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult {
  id: string
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  category: SearchCategory
  type: string
  url: string
  thumbnail?: string
  score: number // Relevance score 0-100
  highlights: string[] // Highlighted text snippets
  metadata: SearchResultMetadata
  createdAt: string
  updatedAt: string
}

export interface SearchResultMetadata {
  author?: {
    id: string
    name: string
    avatar?: string
  }
  stats?: {
    views?: number
    likes?: number
    completions?: number
    rating?: number
    duration?: number // in minutes
  }
  tags?: string[]
  difficulty?: string
  level?: string
  status?: string
  subscription?: string[]
  section: SearchScope
  permissions?: {
    canView: boolean
    canEdit: boolean
    canDelete: boolean
  }
}

export interface SearchSuggestion {
  text: string
  category: SearchCategory
  count: number
  type: 'query' | 'filter' | 'recent'
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  suggestions: SearchSuggestion[]
  facets: SearchFacets
  searchTime: number // in milliseconds
  query: string
  filters: SearchFilters
}

export interface SearchFacets {
  categories: { [key in SearchCategory]?: number }
  difficulties: { [key: string]: number }
  levels: { [key: string]: number }
  tags: { [key: string]: number }
  authors: { [key: string]: number }
  statuses: { [key: string]: number }
}

export interface RecentSearch {
  id: string
  query: string
  filters: SearchFilters
  timestamp: string
  resultCount: number
}

export interface SavedSearch {
  id: string
  name: string
  nameEn: string
  query: string
  filters: SearchFilters
  notifications: boolean
  createdAt: string
  lastUsed: string
}

export class UnifiedSearchService {
  /**
   * Perform unified search across all platform sections
   */
  static async search(
    query: string,
    filters: SearchFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<SearchResponse>> {
    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        pageSize: pageSize.toString()
      })

      // Add filters to params
      if (filters.categories?.length) {
        filters.categories.forEach(cat => params.append('categories', cat))
      }
      if (filters.scope) params.append('scope', filters.scope)
      if (filters.dateRange?.from) params.append('dateFrom', filters.dateRange.from)
      if (filters.dateRange?.to) params.append('dateTo', filters.dateRange.to)
      if (filters.difficulty?.length) {
        filters.difficulty.forEach(diff => params.append('difficulty', diff))
      }
      if (filters.level?.length) {
        filters.level.forEach(level => params.append('level', level))
      }
      if (filters.status?.length) {
        filters.status.forEach(status => params.append('status', status))
      }
      if (filters.tags?.length) {
        filters.tags.forEach(tag => params.append('tags', tag))
      }
      if (filters.author) params.append('author', filters.author)
      if (filters.language?.length) {
        filters.language.forEach(lang => params.append('language', lang))
      }
      if (filters.subscription?.length) {
        filters.subscription.forEach(sub => params.append('subscription', sub))
      }
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

      return await apiClient.get(`/search?${params.toString()}`)
    } catch (error) {
      console.error('Search failed:', error)
      throw error
    }
  }

  /**
   * Get search suggestions as user types
   */
  static async getSuggestions(
    query: string,
    scope?: SearchScope,
    limit: number = 10
  ): Promise<ApiResponse<SearchSuggestion[]>> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString()
      })
      if (scope) params.append('scope', scope)

      return await apiClient.get(`/search/suggestions?${params.toString()}`)
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      throw error
    }
  }

  /**
   * Get popular/trending searches
   */
  static async getTrendingSearches(
    scope?: SearchScope,
    limit: number = 10
  ): Promise<ApiResponse<SearchSuggestion[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      })
      if (scope) params.append('scope', scope)

      return await apiClient.get(`/search/trending?${params.toString()}`)
    } catch (error) {
      console.error('Failed to get trending searches:', error)
      throw error
    }
  }

  /**
   * Get recent searches for current user
   */
  static async getRecentSearches(limit: number = 10): Promise<ApiResponse<RecentSearch[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      })

      return await apiClient.get(`/search/recent?${params.toString()}`)
    } catch (error) {
      console.error('Failed to get recent searches:', error)
      throw error
    }
  }

  /**
   * Save a search for later use
   */
  static async saveSearch(
    name: string,
    nameEn: string,
    query: string,
    filters: SearchFilters,
    notifications: boolean = false
  ): Promise<ApiResponse<SavedSearch>> {
    try {
      return await apiClient.post('/search/saved', {
        name,
        nameEn,
        query,
        filters,
        notifications
      })
    } catch (error) {
      console.error('Failed to save search:', error)
      throw error
    }
  }

  /**
   * Get saved searches for current user
   */
  static async getSavedSearches(): Promise<ApiResponse<SavedSearch[]>> {
    try {
      return await apiClient.get('/search/saved')
    } catch (error) {
      console.error('Failed to get saved searches:', error)
      throw error
    }
  }

  /**
   * Delete a saved search
   */
  static async deleteSavedSearch(searchId: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete(`/search/saved/${searchId}`)
    } catch (error) {
      console.error('Failed to delete saved search:', error)
      throw error
    }
  }

  /**
   * Advanced search with complex queries
   */
  static async advancedSearch(
    searchQuery: {
      must?: string[] // Terms that must be present
      should?: string[] // Terms that should be present (boost score)
      mustNot?: string[] // Terms that must not be present
      phrase?: string[] // Exact phrase matches
      fuzzy?: string[] // Fuzzy matching terms
      wildcard?: string[] // Wildcard patterns
    },
    filters: SearchFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<SearchResponse>> {
    try {
      return await apiClient.post('/search/advanced', {
        query: searchQuery,
        filters,
        page,
        pageSize
      })
    } catch (error) {
      console.error('Advanced search failed:', error)
      throw error
    }
  }

  /**
   * Search within a specific category
   */
  static async searchCategory(
    category: SearchCategory,
    query: string,
    filters: Omit<SearchFilters, 'categories'> = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<SearchResponse>> {
    return this.search(query, { ...filters, categories: [category] }, page, pageSize)
  }

  /**
   * Get search analytics (for managers/admins)
   */
  static async getSearchAnalytics(
    timeframe: string = '30d'
  ): Promise<ApiResponse<{
    totalSearches: number
    uniqueUsers: number
    topQueries: { query: string; count: number }[]
    topCategories: { category: SearchCategory; count: number }[]
    averageResultsPerSearch: number
    zeroResultQueries: { query: string; count: number }[]
    searchTrends: { date: string; searches: number }[]
  }>> {
    try {
      const params = new URLSearchParams({ timeframe })
      return await apiClient.get(`/search/analytics?${params.toString()}`)
    } catch (error) {
      console.error('Failed to get search analytics:', error)
      throw error
    }
  }

  /**
   * Track search interaction (click, view, etc.)
   */
  static async trackSearchInteraction(
    searchId: string,
    resultId: string,
    action: 'click' | 'view' | 'like' | 'share' | 'download',
    metadata?: any
  ): Promise<ApiResponse<void>> {
    try {
      return await apiClient.post('/search/track', {
        searchId,
        resultId,
        action,
        metadata,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to track search interaction:', error)
      throw error
    }
  }

  /**
   * Get personalized search recommendations
   */
  static async getSearchRecommendations(
    limit: number = 10
  ): Promise<ApiResponse<SearchResult[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      })

      return await apiClient.get(`/search/recommendations?${params.toString()}`)
    } catch (error) {
      console.error('Failed to get search recommendations:', error)
      throw error
    }
  }

  /**
   * Utility: Format search result for display
   */
  static formatSearchResult(result: SearchResult, language: 'fr' | 'en' = 'fr'): {
    title: string
    description: string
    categoryLabel: string
    url: string
  } {
    const categoryLabels = {
      'courses': { fr: 'Cours', en: 'Course' },
      'tests': { fr: 'Test', en: 'Test' },
      'live_sessions': { fr: 'Session Live', en: 'Live Session' },
      'content': { fr: 'Contenu', en: 'Content' },
      'users': { fr: 'Utilisateur', en: 'User' },
      'analytics': { fr: 'Analytics', en: 'Analytics' },
      'files': { fr: 'Fichier', en: 'File' },
      'announcements': { fr: 'Annonce', en: 'Announcement' },
      'achievements': { fr: 'Réussite', en: 'Achievement' },
      'all': { fr: 'Tout', en: 'All' }
    }

    return {
      title: language === 'fr' ? result.title : result.titleEn,
      description: language === 'fr' ? result.description : result.descriptionEn,
      categoryLabel: categoryLabels[result.category]?.[language] || result.category,
      url: result.url
    }
  }

  /**
   * Utility: Build search URL with filters
   */
  static buildSearchUrl(query: string, filters: SearchFilters = {}): string {
    const params = new URLSearchParams({ q: query })
    
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v.toString()))
      } else if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    return `/search?${params.toString()}`
  }

  /**
   * Utility: Parse search URL to extract query and filters
   */
  static parseSearchUrl(url: string): { query: string; filters: SearchFilters } {
    const urlObj = new URL(url, 'http://localhost')
    const params = urlObj.searchParams
    
    const query = params.get('q') || ''
    const filters: SearchFilters = {}

    // Parse array parameters
    const categories = params.getAll('categories') as SearchCategory[]
    if (categories.length) filters.categories = categories

    const difficulty = params.getAll('difficulty') as any[]
    if (difficulty.length) filters.difficulty = difficulty

    const level = params.getAll('level') as any[]
    if (level.length) filters.level = level

    const status = params.getAll('status') as any[]
    if (status.length) filters.status = status

    const tags = params.getAll('tags')
    if (tags.length) filters.tags = tags

    const language = params.getAll('language') as any[]
    if (language.length) filters.language = language

    const subscription = params.getAll('subscription') as any[]
    if (subscription.length) filters.subscription = subscription

    // Parse single parameters
    const scope = params.get('scope') as SearchScope
    if (scope) filters.scope = scope

    const author = params.get('author')
    if (author) filters.author = author

    const sortBy = params.get('sortBy') as any
    if (sortBy) filters.sortBy = sortBy

    const sortOrder = params.get('sortOrder') as any
    if (sortOrder) filters.sortOrder = sortOrder

    // Parse date range
    const dateFrom = params.get('dateFrom')
    const dateTo = params.get('dateTo')
    if (dateFrom || dateTo) {
      filters.dateRange = {
        from: dateFrom || '',
        to: dateTo || ''
      }
    }

    return { query, filters }
  }
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import {
  Rss,
  Plus,
  Search,
  FileText,
  Video,
  ImageIcon,
  File,
  Edit,
  Trash2,
  Eye,
  Share2,
  BarChart3,
  Users,
  Star,
  Crown,
  BookOpen,
  User,
  TrendingUp,
  Heart,
  MessageCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FeedItem {
  id: string
  title: string
  content?: string
  excerpt?: string
  type: string
  level: string
  subscription: string
  category: string
  uploadDate: string
  createdAt?: string
  updatedAt?: string
  status: "published" | "draft" | "archived" | "PUBLISHED" | "DRAFT" | "ARCHIVED"
  views: number
  completions: number
  rating: number
  likes: number
  likesCount?: number
  comments: number
  commentsCount?: number
  sharesCount?: number
  description: string
  thumbnail?: string
  media?: string
  contentType: "course" | "test" | "video" | "document" | "simulation" | "post"
  author?: {
    id: string
    firstName?: string
    lastName?: string
    email?: string
    profileImage?: string
  }
  tags?: string[]
  objectives?: string[]
  keyPoints?: string[]
  targetTier?: string
  visibility?: string
  isLiked?: boolean
  source: "posts" | "content" // Track data source
}

interface ManagerRole {
  role: "junior" | "content" | "senior" | "admin"
  name: string
  permissions: {
    createCourses: boolean
    createTests: boolean
  }
}

interface FeedStats {
  totalContent: number
  totalViews: number
  totalLikes: number
  averageRating: number
  totalPosts: number
  totalManagerContent: number
  engagement: number
}

interface ManagerFeedPageProps {
  role?: "admin" | "senior" | "content" | "junior"
}

export default function ManagerFeedPage({ role: propRole }: ManagerFeedPageProps = {}) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user, isAuthenticated, isManager, isAdmin } = useAuth()
  const [currentManager, setCurrentManager] = useState<ManagerRole | null>(null)
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterLevel, setFilterLevel] = useState("all")
  const [filterSubscription, setFilterSubscription] = useState("all")
  const [filterContentType, setFilterContentType] = useState("all")
  const [filterSource, setFilterSource] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [refreshing, setRefreshing] = useState(false)

  // Initialize manager role and permissions
  useEffect(() => {
    if (!user) return

    const roleParam = propRole || (user.role === 'ADMIN' ? 'admin' : 
                     user.role === 'SENIOR_MANAGER' ? 'senior' : 
                     user.role === 'JUNIOR_MANAGER' ? 'junior' : 'content')

    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                     user.email?.split('@')[0] || 'Manager'

    const managerConfig = {
      junior: {
        role: "junior" as const,
        name: userName,
        permissions: {
          createCourses: true,
          createTests: false,
        },
      },
      content: {
        role: "content" as const,
        name: userName,
        permissions: {
          createCourses: true,
          createTests: true,
        },
      },
      senior: {
        role: "senior" as const,
        name: userName,
        permissions: {
          createCourses: true,
          createTests: true,
        },
      },
      admin: {
        role: "admin" as const,
        name: userName,
        permissions: {
          createCourses: true,
          createTests: true,
        },
      },
    }

    setCurrentManager(managerConfig[roleParam as keyof typeof managerConfig] || managerConfig.content)
  }, [user, propRole])

  // Fetch feed data from backend
  const fetchFeedData = async () => {
    if (!isAuthenticated || (!isManager && !isAdmin)) return

    try {
      setError(null)
      const [postsResponse, contentResponse] = await Promise.all([
        // Fetch posts - available to all authenticated users
        apiClient.get('/posts', {
          params: {
            page: 1,
            limit: 50,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          }
        }).catch(() => ({ data: { data: [], pagination: { total: 0 } } })),
        
        // Fetch manager content - only for managers/admins
        apiClient.get('/manager/content').catch(() => ({ data: { data: [] } }))
      ])

      const posts = Array.isArray((postsResponse.data as any)?.data) ? (postsResponse.data as any).data : 
                   Array.isArray(postsResponse.data) ? postsResponse.data : []
      const managerContent = Array.isArray((contentResponse.data as any)?.data) ? (contentResponse.data as any).data : 
                            Array.isArray(contentResponse.data) ? contentResponse.data : []

      // Transform posts to feed items
      const postItems: FeedItem[] = posts.map((post: any) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || post.content?.substring(0, 200) + '...',
        description: post.excerpt || post.content?.substring(0, 200) + '...' || '',
        type: 'post',
        level: post.level || 'B1',
        subscription: post.targetTier === 'FREE' ? 'Gratuit' :
                     post.targetTier === 'ESSENTIAL' ? 'Essentiel' :
                     post.targetTier === 'PREMIUM' ? 'Premium' : 'Pro+',
        category: post.category || 'Général',
        uploadDate: post.createdAt || new Date().toISOString(),
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        status: (post.status?.toLowerCase() || 'published') as any,
        views: post.views || 0,
        completions: post.completions || 0,
        rating: post.rating || 0,
        likes: post.likesCount || 0,
        likesCount: post.likesCount,
        comments: post.commentsCount || 0,
        commentsCount: post.commentsCount,
        sharesCount: post.sharesCount || 0,
        thumbnail: post.media,
        media: post.media,
        contentType: 'post' as const,
        author: post.author,
        tags: post.tags,
        objectives: post.objectives,
        keyPoints: post.keyPoints,
        targetTier: post.targetTier,
        visibility: post.visibility,
        isLiked: post.isLiked,
        source: 'posts' as const
      }))

      // Transform manager content to feed items
      const contentItems: FeedItem[] = managerContent.map((content: any) => ({
        id: content.id,
        title: content.title,
        content: content.content,
        excerpt: content.excerpt || content.content?.substring(0, 200) + '...',
        description: content.excerpt || content.content?.substring(0, 200) + '...' || '',
        type: content.type || 'course',
        level: content.level || 'B1',
        subscription: content.targetTier === 'FREE' ? 'Gratuit' :
                     content.targetTier === 'ESSENTIAL' ? 'Essentiel' :
                     content.targetTier === 'PREMIUM' ? 'Premium' : 'Pro+',
        category: content.category || 'Contenu Manager',
        uploadDate: content.createdAt || new Date().toISOString(),
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
        status: (content.status?.toLowerCase() || 'published') as any,
        views: content.views || 0,
        completions: content.completions || 0,
        rating: content.rating || 0,
        likes: content.likes || 0,
        comments: content.comments || 0,
        thumbnail: content.media,
        media: content.media,
        contentType: content.type === 'course' ? 'course' : 
                    content.type === 'test' ? 'test' : 'document',
        tags: content.tags,
        targetTier: content.targetTier,
        source: 'content' as const
      }))

      // Combine and sort all items
      const allItems = [...postItems, ...contentItems]
      setFeedItems(allItems)
    } catch (err: any) {
      console.error('Failed to fetch feed data:', err)
      setError(err.message || 'Failed to load feed data')
      setFeedItems([]) // No fallback data - show empty state
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedData()
  }, [isAuthenticated, isManager, isAdmin])

  // Refresh feed data
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchFeedData()
    setRefreshing(false)
  }

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "admin":
        return {
          label: t("Admin", "Admin"),
          icon: Crown,
          color: "bg-red-500/10 text-red-400 border-red-500/20",
        }
      case "senior":
        return {
          label: t("Manager", "Manager"),
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

  const getFileIcon = (type: string) => {
    if (type.startsWith("video/")) return Video
    if (type.startsWith("image/")) return ImageIcon
    return File
  }

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case "video":
        return Video
      case "test":
        return FileText
      case "course":
        return BookOpen
      default:
        return File
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "draft":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "archived":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const filteredAndSortedItems = feedItems
    .filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      const matchesLevel = filterLevel === "all" || item.level === filterLevel
      const matchesSubscription = filterSubscription === "all" || item.subscription === filterSubscription
      const matchesContentType = filterContentType === "all" || item.contentType === filterContentType
      const matchesSource = filterSource === "all" || item.source === filterSource

      return matchesSearch && matchesLevel && matchesSubscription && matchesContentType && matchesSource
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        case "popular":
          return b.views - a.views
        case "rating":
          return b.rating - a.rating
        case "engagement":
          return b.likes + b.comments - (a.likes + a.comments)
        default:
          return 0
      }
    })

  const handleEditItem = (itemId: string) => {
    router.push(`/manager/content/edit/${itemId}`)
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      // Call backend API to delete the item
      await apiClient.delete(`/posts/${itemId}`)
      
      // Update local state
      const updatedItems = feedItems.filter((item) => item.id !== itemId)
      setFeedItems(updatedItems)
    } catch (error) {
      console.error('Failed to delete item:', error)
      setError('Failed to delete item')
    }
  }

  const handleCreateNew = () => {
    router.push("/manager/posts/create")
  }

  const getTotalStats = (): FeedStats => {
    const postItems = feedItems.filter(item => item.source === 'posts')
    const contentItems = feedItems.filter(item => item.source === 'content')
    
    return {
      totalContent: feedItems.length,
      totalPosts: postItems.length,
      totalManagerContent: contentItems.length,
      totalViews: feedItems.reduce((acc, item) => acc + item.views, 0),
      totalLikes: feedItems.reduce((acc, item) => acc + item.likes, 0),
      averageRating:
        feedItems.length > 0
          ? Math.round((feedItems.reduce((acc, item) => acc + item.rating, 0) / feedItems.length) * 10) / 10
          : 0,
      engagement: feedItems.length > 0 ? 
        Math.round((feedItems.reduce((acc, item) => acc + item.likes + item.comments, 0) / feedItems.length) * 10) / 10 : 0
    }
  }

  // Loading state
  if (loading || !currentManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <div className="text-foreground">Loading feed data...</div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && feedItems.length === 0) {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">Error Loading Feed</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700 text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!currentManager.permissions.createCourses && !currentManager.permissions.createTests) {
    const roleInfo = getRoleInfo(currentManager.role)
    const RoleIcon = roleInfo.icon

    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                <Rss className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">{t("Accès restreint", "Access Restricted")}</h2>
              <p className="text-muted-foreground mb-4">
                {t(
                  "Votre rôle ne vous permet pas d'accéder au feed personnel.",
                  "Your role does not allow access to personal feed.",
                )}
              </p>
              <Badge variant="outline" className={cn("text-sm", roleInfo.color)}>
                <RoleIcon className="w-4 h-4 mr-2" />
                {roleInfo.label}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const roleInfo = getRoleInfo(currentManager.role)
  const RoleIcon = roleInfo.icon
  const stats = getTotalStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Modern Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Rss className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
                    {t("Mon Feed", "My Feed")}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 mt-2 text-lg">
                    {t("Votre espace personnel de contenu créé", "Your personal content creation space")}
                  </p>
                  <div className="flex items-center space-x-2 mt-3">
                    <Badge variant="outline" className={cn("text-sm font-medium", roleInfo.color)}>
                      <RoleIcon className="w-4 h-4 mr-2" />
                      {roleInfo.label}
                    </Badge>
                    <span className="text-sm text-slate-500 dark:text-slate-400">•</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{currentManager?.name}</span>
                  </div>
                  {error && (
                    <div className="flex items-center space-x-2 mt-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm text-amber-700 dark:text-amber-300">
                        {t("Données partielles - erreur backend", "Partial data - backend error")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={handleRefresh} 
                  disabled={refreshing}
                  variant="outline"
                  className="border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
                  {t("Actualiser", "Refresh")}
                </Button>
                <Button 
                  onClick={() => router.push("/manager/posts/create")} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("Créer un post", "Create Post")}
                </Button>
                <Button
                  onClick={() => router.push("/manager/posts")}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t("Voir mes Posts", "View Posts")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Card className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/50 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalContent}</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("Total Contenu", "Total Content")}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {stats.totalPosts} posts + {stats.totalManagerContent} contenu
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Card className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 hover:border-emerald-300/50 dark:hover:border-emerald-600/50 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Eye className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalViews.toLocaleString()}</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("Vues totales", "Total Views")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Card className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 hover:border-red-300/50 dark:hover:border-red-600/50 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalLikes}</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("J'aime totaux", "Total Likes")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Card className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 hover:border-yellow-300/50 dark:hover:border-yellow-600/50 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Star className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.averageRating}</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("Note moyenne", "Average Rating")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Card className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 hover:border-purple-300/50 dark:hover:border-purple-600/50 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.engagement}</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("Engagement moy.", "Avg. Engagement")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modern Filters */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100/50 via-blue-50/50 to-indigo-100/50 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 rounded-2xl blur"></div>
          <Card className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/30 dark:border-slate-700/30">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      placeholder={t("Rechercher dans votre contenu...", "Search your content...")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-44 h-12 bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                      <SelectItem value="recent" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        {t("Plus récent", "Most Recent")}
                      </SelectItem>
                      <SelectItem value="popular" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        {t("Plus populaire", "Most Popular")}
                      </SelectItem>
                      <SelectItem value="rating" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        {t("Mieux noté", "Highest Rated")}
                      </SelectItem>
                      <SelectItem value="engagement" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        {t("Plus d'engagement", "Most Engagement")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-32 bg-input border-gray-200 dark:border-gray-700 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">
                      {t("Tous niveaux", "All Levels")}
                    </SelectItem>
                    <SelectItem value="A1" className="text-foreground hover:bg-muted">
                      A1
                    </SelectItem>
                    <SelectItem value="A2" className="text-foreground hover:bg-muted">
                      A2
                    </SelectItem>
                    <SelectItem value="B1" className="text-foreground hover:bg-muted">
                      B1
                    </SelectItem>
                    <SelectItem value="B2" className="text-foreground hover:bg-muted">
                      B2
                    </SelectItem>
                    <SelectItem value="C1" className="text-foreground hover:bg-muted">
                      C1
                    </SelectItem>
                    <SelectItem value="C2" className="text-foreground hover:bg-muted">
                      C2
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSubscription} onValueChange={setFilterSubscription}>
                  <SelectTrigger className="w-36 bg-input border-gray-200 dark:border-gray-700 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">
                      {t("Tous plans", "All Plans")}
                    </SelectItem>
                    <SelectItem value="Gratuit" className="text-foreground hover:bg-muted">
                      Gratuit
                    </SelectItem>
                    <SelectItem value="Essentiel" className="text-foreground hover:bg-muted">
                      Essentiel
                    </SelectItem>
                    <SelectItem value="Premium" className="text-foreground hover:bg-muted">
                      Premium
                    </SelectItem>
                    <SelectItem value="Pro+" className="text-foreground hover:bg-muted">
                      Pro+
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterContentType} onValueChange={setFilterContentType}>
                  <SelectTrigger className="w-32 bg-input border-gray-200 dark:border-gray-700 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">
                      {t("Tous types", "All Types")}
                    </SelectItem>
                    <SelectItem value="post" className="text-foreground hover:bg-muted">
                      {t("Post", "Post")}
                    </SelectItem>
                    <SelectItem value="course" className="text-foreground hover:bg-muted">
                      {t("Cours", "Course")}
                    </SelectItem>
                    <SelectItem value="test" className="text-foreground hover:bg-muted">
                      {t("Test", "Test")}
                    </SelectItem>
                    <SelectItem value="video" className="text-foreground hover:bg-muted">
                      {t("Vidéo", "Video")}
                    </SelectItem>
                    <SelectItem value="document" className="text-foreground hover:bg-muted">
                      {t("Document", "Document")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="w-36 bg-input border-gray-200 dark:border-gray-700 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                    <SelectItem value="all" className="text-foreground hover:bg-muted">
                      {t("Toutes sources", "All Sources")}
                    </SelectItem>
                    <SelectItem value="posts" className="text-foreground hover:bg-muted">
                      {t("Posts Publics", "Public Posts")}
                    </SelectItem>
                    <SelectItem value="content" className="text-foreground hover:bg-muted">
                      {t("Contenu Manager", "Manager Content")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feed Items */}
        <div className="space-y-4">
          {filteredAndSortedItems.length === 0 ? (
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardContent className="p-12 text-center">
                <Rss className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {t("Aucun contenu trouvé", "No Content Found")}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t(
                    "Commencez à créer des posts pour voir votre feed personnel",
                    "Start creating posts to see your personal feed",
                  )}
                </p>
                <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("Créer votre premier post", "Create Your First Post")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedItems.map((item) => {
              const ContentIcon = getContentTypeIcon(item.contentType)
              const FileIcon = getFileIcon(item.type)

              return (
                <Card
                  key={item.id}
                  className="bg-card border-gray-200 dark:border-gray-700 hover:border-muted-foreground/20 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <ContentIcon className="w-8 h-8 text-muted-foreground" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1">{item.title}</h3>
                            <p className="text-sm text-foreground mb-3 line-clamp-2">{item.description}</p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem(item.id)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 mb-4">
                          <Badge variant="outline" className="text-xs text-foreground">
                            {item.level}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("text-xs text-foreground", getSubscriptionColor(item.subscription))}
                          >
                            {item.subscription}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("text-xs text-foreground", getStatusColor(item.status))}
                          >
                            {(item.status === "published" || item.status === "PUBLISHED")
                              ? t("Publié", "Published")
                              : (item.status === "draft" || item.status === "DRAFT")
                                ? t("Brouillon", "Draft")
                                : t("Archivé", "Archived")}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", item.source === 'posts' ? 
                              "bg-blue-500/10 text-blue-400 border-blue-500/20" : 
                              "bg-green-500/10 text-green-400 border-green-500/20"
                            )}
                          >
                            {item.source === 'posts' ? t("Post Public", "Public Post") : t("Contenu Manager", "Manager Content")}
                          </Badge>
                          {item.author && (
                            <span className="text-xs text-muted-foreground">
                              par {item.author.firstName} {item.author.lastName}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.uploadDate || item.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{item.views}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{item.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{item.comments}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{item.rating}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="w-4 h-4" />
                              <span>
                                {item.completions} {t("complétions", "completions")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-200 dark:border-gray-700 bg-transparent text-foreground"
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              {t("Stats", "Stats")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-200 dark:border-gray-700 bg-transparent text-foreground"
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              {t("Partager", "Share")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Quick Actions */}
        {filteredAndSortedItems.length > 0 && (
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t("Actions rapides", "Quick Actions")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("Créer nouveau post", "Create New Post")}
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-200 dark:border-gray-700 bg-transparent justify-start text-foreground hover:bg-muted"
                  onClick={() => router.push("/manager/analytics/stats")}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {t("Voir toutes les stats", "View All Stats")}
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-200 dark:border-gray-700 bg-transparent justify-start text-foreground hover:bg-muted"
                  onClick={() => router.push("/manager/analytics/audience")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {t("Gérer l'audience", "Manage Audience")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </div>
  )
}


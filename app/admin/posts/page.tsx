"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import {
  ArrowLeft,
  Search,
  Filter,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Calendar,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ManagerPostsPageProps {
  role?: "admin" | "senior" | "content" | "junior"
}

interface Post {
  id: string
  title: string
  content: string
  excerpt?: string
  status: string
  privacy: string
  createdAt: string
  updatedAt: string
  views: number
  likes: number
  comments: number
  shares: number
  images: string[]
  author?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export default function AdminPostsPage({ role: propRole }: ManagerPostsPageProps = {}) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user, isAuthenticated, isManager, isAdmin } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Determine current role
  const currentRole = "admin" // Always admin for admin posts page

  // Fetch posts from backend
  const fetchPosts = async () => {
    if (!isAuthenticated || (!isManager && !isAdmin)) return

    try {
      setError(null)
      const response = await apiClient.get('/posts', {
        params: {
          page: 1,
          limit: 100,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      })

      const postsData = Array.isArray((response.data as any)?.data) ? (response.data as any).data : 
                       Array.isArray(response.data) ? response.data : []
      
      // Ensure all posts have required properties with defaults
      const normalizedPosts = postsData.map((post: any) => ({
        ...post,
        images: post.images || [],
        likes: post.likes || 0,
        comments: post.comments || 0,
        shares: post.shares || 0,
        views: post.views || 0,
        privacy: post.privacy || 'public',
        status: post.status || 'published'
      }))
      
      setPosts(normalizedPosts)
    } catch (err: any) {
      console.error('Failed to fetch posts:', err)
      setError(err.message || 'Failed to load posts')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [isAuthenticated, isManager, isAdmin])

  // Refresh posts
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchPosts()
    setRefreshing(false)
  }

  // Delete post
  const handleDeletePost = async (postId: string) => {
    try {
      await apiClient.delete(`/posts/${postId}`)
      setPosts(posts.filter(post => post.id !== postId))
    } catch (error) {
      console.error('Failed to delete post:', error)
      setError('Failed to delete post')
    }
  }

  const getPrivacyColor = (privacy: string) => {
    switch (privacy) {
      case "public":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "students":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "private":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Calculate stats
  const totalLikes = posts.reduce((acc, post) => acc + (post.likes || 0), 0)
  const totalComments = posts.reduce((acc, post) => acc + (post.comments || 0), 0)
  const totalViews = posts.reduce((acc, post) => acc + (post.views || 0), 0)

  // Filter posts based on search
  const filteredPosts = posts.filter(post => 
    (post.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.content || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <div className="text-foreground">Loading posts...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          <div className="flex items-center justify-center py-12">
            <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-foreground">Error Loading Posts</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-foreground hover:text-foreground hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
            <h1 className="text-2xl font-bold text-foreground">{t("Posts Administrateur", "Admin Posts")}</h1>
            <p className="text-muted-foreground">{t("Gérez tous les posts de la plateforme", "Manage all platform posts")}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              variant="outline"
              className="border-border text-foreground bg-background hover:bg-muted"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing && "animate-spin"}`} />
              {t("Actualiser", "Refresh")}
            </Button>
            <Button
              onClick={() => router.push("/admin/posts/create")}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              {t("Nouveau Post", "New Post")}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">{t("Posts Totaux", "Total Posts")}</CardTitle>
              <Edit className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{posts.length}</div>
              <p className="text-xs text-green-500 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                {posts.length} {t("posts au total", "total posts")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">{t("Total Likes", "Total Likes")}</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalLikes}</div>
              <p className="text-xs text-red-500 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                {totalLikes} {t("likes au total", "total likes")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">{t("Commentaires", "Comments")}</CardTitle>
              <MessageCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalComments}</div>
              <p className="text-xs text-blue-500 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                {totalComments} {t("commentaires au total", "total comments")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">{t("Vues Totales", "Total Views")}</CardTitle>
              <Eye className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalViews}</div>
              <p className="text-xs text-purple-500 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                {totalViews} {t("vues au total", "total views")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t("Rechercher dans mes posts...", "Search in my posts...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button variant="outline" className="border-border text-foreground bg-background hover:bg-muted">
            <Filter className="w-4 h-4 mr-2" />
            {t("Filtres", "Filters")}
          </Button>
        </div>

        {/* Posts List */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <Edit className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{t("Aucun post", "No posts")}</h3>
            <p className="text-muted-foreground mb-4">{t("Commencez par créer votre premier post", "Start by creating your first post")}</p>
            <Button
              onClick={() => router.push("/admin/posts/create")}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              {t("Créer un post", "Create Post")}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post) => (
            <Card key={post.id} className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">M</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-foreground font-semibold">
                        {currentRole === "admin" ? t("Admin", "Admin") : 
                         currentRole === "senior" ? t("Manager", "Manager") :
                         currentRole === "content" ? t("Content Manager", "Content Manager") :
                         t("Junior Manager", "Junior Manager")}
                      </span>
                      <Badge variant="outline" className={getPrivacyColor(post.privacy)}>
                        {t(post.privacy, post.privacy)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(post.createdAt || new Date().toISOString())}</span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem className="text-foreground hover:bg-muted">
                      <Edit className="w-4 h-4 mr-2" />
                      {t("Modifier", "Edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-foreground hover:bg-muted">
                      <Eye className="w-4 h-4 mr-2" />
                      {t("Voir", "View")}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-500 hover:bg-muted"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("Supprimer", "Delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Post Content */}
              <div className="space-y-2">
                <h3 className="text-foreground text-lg font-semibold">{post.title || 'Untitled Post'}</h3>
                <p className="text-muted-foreground">{post.content || 'No content available'}</p>
              </div>

              {/* Post Images */}
              {post.images && post.images.length > 0 && (
                <div className={`grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {post.images.map((image, index) => (
                    <img
                      key={index}
                      src={image || "/placeholder.svg"}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* Post Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2 text-foreground">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>{post.likes || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-foreground">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <span>{post.comments || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-foreground">
                    <Share2 className="w-4 h-4 text-green-500" />
                    <span>{post.shares || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-foreground">
                    <Eye className="w-4 h-4 text-purple-500" />
                    <span>{post.views || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

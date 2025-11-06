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
  Facebook,
  Twitter,
  Linkedin,
  Send,
  ThumbsUp,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
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
  visibility?: string
  createdAt: string
  updatedAt: string
  views: number
  likes: number
  comments: number
  shares: number
  images: string[]
  media?: string
  author?: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
    profilePicture?: string
  }
  isLiked?: boolean
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
  const [userLikedPosts, setUserLikedPosts] = useState<Set<string>>(new Set())
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [loadedComments, setLoadedComments] = useState<Record<string, any[]>>({})
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  
  // Determine current role
  const currentRole = "admin" // Always admin for admin posts page

  // Utility function to normalize image URLs
  const normalizeImageUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (url.startsWith('/uploads')) return `http://localhost:3001${url}`
    if (url.startsWith('/')) return `http://localhost:3001${url}`
    return `http://localhost:3001/uploads/${url}`
  }

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
        images: post.media ? [normalizeImageUrl(post.media)] : (post.images || []).map((img: string) => normalizeImageUrl(img)),
        media: normalizeImageUrl(post.media || ''),
        likes: post._count?.likes || post.likes || 0,
        comments: post._count?.comments || post.comments || 0,
        shares: post._count?.shares || post.shares || 0,
        views: post.viewCount || post.views || 0,
        privacy: post.visibility || post.privacy || 'PUBLIC',
        status: post.status || 'PUBLISHED',
        author: post.author ? {
          ...post.author,
          profileImage: normalizeImageUrl(post.author.profileImage || post.author.profilePicture || '')
        } : undefined
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

    // Set up auto-refresh every 10 seconds to show real-time updates
    const interval = setInterval(() => {
      fetchPosts()
    }, 10000)

    return () => clearInterval(interval)
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
      toast.success(t("Post supprimé", "Post deleted"))
    } catch (error) {
      console.error('Failed to delete post:', error)
      setError('Failed to delete post')
      toast.error(t("Erreur lors de la suppression", "Error deleting post"))
    }
  }

  // Like post
  const handleLike = async (postId: string) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/like`) as any
      if (response.success) {
        const { liked, likeCount } = response.data || {}
        setPosts(posts.map(post =>
          post.id === postId ? { ...post, likes: likeCount || 0, isLiked: liked } : post
        ))
        setUserLikedPosts(prev => {
          const newSet = new Set(prev)
          if (liked) newSet.add(postId)
          else newSet.delete(postId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error liking post:', error)
      toast.error(t("Erreur lors du like", "Error liking post"))
    }
  }

  // Share post
  const handleShare = async (postId: string) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/share`) as any
      if (response.success) {
        const { shared, shareCount } = response.data || {}
        setPosts(posts.map(post =>
          post.id === postId ? { ...post, shares: shareCount || 0 } : post
        ))
        toast.success(t("Post partagé", "Post shared"))
      }
    } catch (error) {
      console.error('Error sharing post:', error)
      toast.error(t("Erreur lors du partage", "Error sharing post"))
    }
  }

  // Toggle comments
  const handleToggleComments = async (postId: string) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
      // Fetch comments if not already loaded
      if (!loadedComments[postId]) {
        try {
          const response = await apiClient.get(`/posts/${postId}/comments`) as any
          if (response.success) {
            const comments = (response.data || []).map((comment: any) => ({
              id: comment.id,
              author: `${comment.author?.firstName || ''} ${comment.author?.lastName || ''}`.trim() || comment.author?.email || 'User',
              avatar: normalizeImageUrl(comment.author?.profileImage || comment.author?.profilePicture || ''),
              content: comment.content,
              createdAt: comment.createdAt,
              userId: comment.author?.id
            }))
            setLoadedComments({ ...loadedComments, [postId]: comments })
          }
        } catch (error) {
          console.error('Error fetching comments:', error)
        }
      }
    }
    setExpandedComments(newExpanded)
  }

  // Add comment
  const handleAddComment = async (postId: string) => {
    const text = commentText[postId]?.trim()
    if (!text) return

    try {
      const response = await apiClient.post(`/posts/${postId}/comments`, { content: text }) as any
      if (response.success) {
        setCommentText({ ...commentText, [postId]: '' })
        // Refresh comments
        const commentsResponse = await apiClient.get(`/posts/${postId}/comments`) as any
        if (commentsResponse.success) {
          const comments = (commentsResponse.data || []).map((comment: any) => ({
            id: comment.id,
            author: `${comment.author?.firstName || ''} ${comment.author?.lastName || ''}`.trim() || comment.author?.email || 'User',
            avatar: normalizeImageUrl(comment.author?.profileImage || comment.author?.profilePicture || ''),
            content: comment.content,
            createdAt: comment.createdAt,
            userId: comment.author?.id
          }))
          setLoadedComments({ ...loadedComments, [postId]: comments })
          // Update post comment count
          setPosts(posts.map(post =>
            post.id === postId ? { ...post, comments: (post.comments || 0) + 1 } : post
          ))
        }
        toast.success(t("Commentaire ajouté", "Comment added"))
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error(t("Erreur lors de l'ajout du commentaire", "Error adding comment"))
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
            <Card key={post.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg mb-4">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10 border-2 border-gray-200 dark:border-gray-700">
                    <AvatarImage 
                      src={normalizeImageUrl(post.author?.profileImage || post.author?.profilePicture || '')} 
                      alt={`${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim() || 'Admin'}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold">
                      {post.author?.firstName?.charAt(0) || post.author?.lastName?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-foreground font-semibold">
                        {post.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || post.author.email : 
                         currentRole === "admin" ? t("Admin", "Admin") : 
                         currentRole === "senior" ? t("Manager", "Manager") :
                         currentRole === "content" ? t("Content Manager", "Content Manager") :
                         t("Junior Manager", "Junior Manager")}
                      </span>
                      <Badge variant="outline" className={getPrivacyColor(post.visibility || post.privacy)}>
                        {(post.visibility || post.privacy || 'PUBLIC').toUpperCase()}
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
              {/* Full Post Content - Facebook Style */}
              <div className="space-y-3">
                {post.title && (
                  <h3 className="text-gray-900 dark:text-white text-xl font-bold leading-tight">
                    {post.title}
                  </h3>
                )}
                <div className="text-gray-800 dark:text-gray-200 text-[15px] leading-relaxed whitespace-pre-wrap">
                  {post.content || post.excerpt || 'No content available'}
                </div>
              </div>

              {/* Post Images - Social Media Style */}
              {post.images && post.images.length > 0 && (
                <div className={`grid gap-4 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {post.images.map((image, index) => (
                    <div key={index} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 group">
                    <img
                        src={normalizeImageUrl(image) || "/placeholder.svg"}
                      alt={`Post image ${index + 1}`}
                        className="w-full h-auto max-h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg"
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  ))}
                </div>
              )}

              {/* Interactive Actions - Facebook Style */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150 flex-1 justify-center ${
                      post.isLiked || userLikedPosts.has(post.id) 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                    }`}
                  >
                    <ThumbsUp className={`w-5 h-5 transition-transform duration-150 ${post.isLiked || userLikedPosts.has(post.id) ? 'fill-current' : ''}`} />
                    <span className="font-medium text-sm">{post.likes || 0}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleComments(post.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150 flex-1 justify-center"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium text-sm">{post.comments || 0}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150 flex-1 justify-center"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium text-sm">{post.shares || 0}</span>
                  </Button>
                  
                  <div className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400">
                    <Eye className="w-5 h-5" />
                    <span className="font-medium text-sm">{post.views || 0}</span>
                  </div>
                </div>
              </div>

              {/* Comments Section - Facebook Style */}
              {expandedComments.has(post.id) && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3 bg-gray-50 dark:bg-gray-900/50 px-4 py-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{t("Commentaires", "Comments")}</h4>
                  
                  {/* Add Comment */}
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={normalizeImageUrl(user?.profileImage || user?.profilePicture || '')} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                        {user?.firstName?.charAt(0) || user?.lastName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Input
                      placeholder={t("Ajouter un commentaire...", "Add a comment...")}
                      value={commentText[post.id] || ''}
                      onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleAddComment(post.id)
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(post.id)}
                      disabled={!commentText[post.id]?.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {loadedComments[post.id]?.map((comment: any) => (
                      <div key={comment.id} className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.avatar} />
                          <AvatarFallback className="bg-gray-300 dark:bg-gray-700 text-xs">
                            {comment.author?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-foreground">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-foreground mt-1">{comment.content}</p>
                        </div>
                  </div>
                    ))}
                    {(!loadedComments[post.id] || loadedComments[post.id].length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("Aucun commentaire", "No comments yet")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

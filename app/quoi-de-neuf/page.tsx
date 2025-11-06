"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Heart, MessageSquare, Share2, Lock, CheckCircle, Shield, Send, User, Camera, Smile, MoreHorizontal, Home, Users, UserPlus, ShoppingCart, Bookmark, Flag, Star, ChevronDown, X } from "lucide-react"
import dynamic from "next/dynamic"

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useLang } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import { Skeleton } from "@/components/ui/skeleton"
import SiteHeader from "@/components/site-header"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"

type Comment = {
  id: string
  author: string
  avatar?: string
  content: string
  createdAt: string
  userId?: string
}

type Post = {
  id: string
  author: string
  role: "Manager" | "Admin" | "SENIOR_MANAGER" | "JUNIOR_MANAGER" | "ADMIN"
  verified: boolean
  time: string
  title: string
  preview: string
  content?: string
  excerpt?: string
  media?: string
  public: boolean
  likes: number
  comments: number
  shares: number
  avatar?: string
  authorId?: string
  status?: string
  visibility?: string
  level?: string
  targetTier?: string
  createdAt?: string
  updatedAt?: string
  commentsList?: Comment[]
}


// Removed hardcoded SEED data - now fetching from backend




export default function QuoiDeNeufPage() {
  const { lang } = useLang()
  const { theme } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)
  
  // Fetch full user profile data including profileImage
  const [userProfile, setUserProfile] = useState<any>(null)
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return
      
      try {
        // Try to get user profile from /users/profile (which returns current user)
        const response = await apiClient.get(`/users/profile`).catch(async () => {
          // Fallback to /users/{id} if profile endpoint fails
          return await apiClient.get(`/users/${user.id}`)
        })
        
        if (response.success && response.data) {
          const responseData = response.data as any
          const profileData = responseData.user || responseData
          setUserProfile(profileData)
          console.log('✅ User profile fetched:', { 
            id: profileData?.id, 
            hasProfileImage: !!(profileData?.profileImage || profileData?.profilePicture) 
          })
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        // Fallback to user from auth context
        setUserProfile(user)
      }
    }
    
    if (user?.id) {
      fetchUserProfile()
    } else {
      setUserProfile(null)
    }
  }, [user?.id])

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostTitle, setNewPostTitle] = useState("")
  const [subscribed] = useState(true) // Mock subscription status
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [loadedComments, setLoadedComments] = useState<Record<string, Comment[]>>({})
  const [userLikedPosts, setUserLikedPosts] = useState<Set<string>>(new Set())
  const [userSharedPosts, setUserSharedPosts] = useState<Set<string>>(new Set())
  const [showEmojiPicker, setShowEmojiPicker] = useState<Record<string, boolean>>({})

  // Utility function to normalize image URLs
  const normalizeImageUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (url.startsWith('/uploads')) return `http://localhost:3001${url}`
    if (url.startsWith('/')) return `http://localhost:3001${url}`
    return `http://localhost:3001/uploads/${url}`
  }

  // Fetch posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      console.log('🔄 Fetching posts...')
      try {
        setLoading(true)
        const response = await apiClient.get('/posts', {
          params: {
            page: 1,
            limit: 50,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          }
        })

        if (response.success && response.data) {
          console.log('📡 Posts response:', response.data)
          const backendPosts = (response.data as any[]).map((post: any) => {
            console.log('📝 Post data:', { id: post.id, title: post.title, likes: post._count?.likes })
            return {
              id: post.id,
              author: `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim() || post.author?.email || 'Manager',
              role: (post.author?.role === 'ADMIN' ? 'Admin' : 'Manager') as "Manager" | "Admin" | "SENIOR_MANAGER" | "JUNIOR_MANAGER" | "ADMIN",
              verified: true,
              time: new Date(post.createdAt).toLocaleDateString('fr-FR'),
              title: post.title,
              preview: post.excerpt || post.content?.substring(0, 200) + '...' || '',
              content: post.content,
              excerpt: post.excerpt,
              media: post.media ? (post.media.startsWith('http') ? post.media : normalizeImageUrl(post.media)) : undefined,
              public: post.visibility === 'PUBLIC',
              likes: post._count?.likes || 0,
              comments: post._count?.comments || 0,
              shares: post._count?.shares || 0,
              avatar: normalizeImageUrl(post.author?.profileImage || post.author?.profilePicture || ''),
              authorId: post.authorId,
              status: post.status,
              visibility: post.visibility,
              level: post.level,
              targetTier: post.targetTier,
              createdAt: post.createdAt,
              updatedAt: post.updatedAt
            }
          })

          setPosts(backendPosts as Post[])

          console.log('✅ Posts loaded with like counts:', backendPosts.map(p => ({ id: p.id, title: p.title, likes: p.likes })))
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
        // No fallback data - show empty state
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    // Fetch user's liked posts if authenticated
    const fetchUserLikes = async () => {
      if (!isAuthenticated || !user) {
        setUserLikedPosts(new Set<string>())
        return
      }

      try {
        console.log('🔄 Fetching user liked posts...')
        const response = await apiClient.get('/likes/user', {
          params: {
            contentType: 'POST',
            limit: 1000
          }
        })

        if (response.success && response.data) {
          const likedPostIds = new Set<string>()
          const likes = (response.data as any).likes || []
          likes.forEach((like: any) => {
            // Handle both old format (contentId) and new format (postId/commentId)
            const postId = like.postId || like.contentId
            if (postId) {
              likedPostIds.add(postId)
            }
          })
          setUserLikedPosts(likedPostIds)
          console.log('✅ User liked posts loaded:', Array.from(likedPostIds))
        }
      } catch (error) {
        console.error('Error fetching user likes:', error)
        setUserLikedPosts(new Set<string>())
      }
    }

    fetchPosts()
    fetchUserLikes()
  }, [isAuthenticated, user])

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return

    // Only allow managers and admins to create posts
    if (!user || !['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(user.role)) {
      alert(t("Seuls les managers et administrateurs peuvent créer des posts", "Only managers and administrators can create posts"))
      return
    }

    try {
      const response = await apiClient.post('/posts', {
        title: newPostTitle,
        content: newPostContent,
        excerpt: newPostContent.substring(0, 200) + (newPostContent.length > 200 ? '...' : ''),
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        level: 'A1',
        targetTier: 'FREE'
      })

      if (response.success && response.data) {
        const newPost: Post = {
          id: (response.data as any).post.id,
          author: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Manager',
          role: user.role === 'ADMIN' ? 'Admin' : 'Manager',
          verified: true,
          time: "Maintenant",
          title: newPostTitle,
          preview: newPostContent,
          content: newPostContent,
          media: undefined,
          public: true,
          likes: 0,
          comments: 0,
          shares: 0,
          avatar: normalizeImageUrl((userProfile || user)?.profileImage || (userProfile || user)?.profilePicture || ''),
          authorId: user.id,
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
          createdAt: new Date().toISOString()
        }
        setPosts([newPost, ...posts])
        setNewPostTitle("")
        setNewPostContent("")
        setShowCreatePost(false)
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert(t("Erreur lors de la création du post", "Error creating post"))
    }
  }

  const handleLike = async (postId: string) => {
    try {
      console.log('🔄 Liking post:', postId)
      const response = await apiClient.post(`/posts/${postId}/like`)
      console.log('📡 Like response:', response)
      
      if ((response as any).success) {
        // Backend returns { liked: true/false, likeCount: number } in data
        const { liked, likeCount } = (response as any).data || {}
        console.log('💖 Like data:', { liked, likeCount })
        
        // Update like count in posts - ALWAYS use backend count
        setPosts(posts.map(post =>
          post.id === postId ? { ...post, likes: likeCount } : post
        ))
        
        // Update user liked posts state
        setUserLikedPosts(prev => {
          const newSet = new Set(prev)
          if (liked) {
            newSet.add(postId)
          } else {
            newSet.delete(postId)
          }
          return newSet
        })
      } else {
        console.error('❌ Like failed:', (response as any).message)
      }
    } catch (error) {
      console.error('❌ Error liking post:', error)
    }
  }

  const handleShare = async (postId: string) => {
    try {
      console.log('🔄 Sharing post:', postId)
      const response = await apiClient.post(`/posts/${postId}/share`)
      console.log('📡 Share response:', response)

      if ((response as any).success) {
        // Backend returns { shared: true/false, shareCount: number } in data
        const { shared, shareCount } = (response as any).data || {}
        console.log('📤 Share data:', { shared, shareCount })

        // Update share count in posts - ALWAYS use backend count
        setPosts(posts.map(post =>
          post.id === postId ? { ...post, shares: shareCount } : post
        ))

        // Update user shared posts state
        setUserSharedPosts(prev => {
          const newSet = new Set(prev)
          if (shared) {
            newSet.add(postId)
          } else {
            newSet.delete(postId)
          }
          return newSet
        })
      } else {
        console.error('❌ Share failed:', (response as any).message)
      }
    } catch (error) {
      console.error('❌ Error sharing post:', error)
    }
  }

  const handleToggleComments = async (postId: string) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
      // Fetch comments if not already loaded
      if (!loadedComments[postId]) {
        try {
          const response = await apiClient.get(`/posts/${postId}/comments`)
          if ((response as any).success) {
            const commentsData = (response as any).data?.comments || (response as any).data || []
            const comments = commentsData.map((comment: any) => {
              const author = comment.author || {}
              const profileImg = normalizeImageUrl(author.profileImage || author.profilePicture || '')
              const authorName = `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email || 'User'
              
              console.log('📝 Comment author data:', {
                id: comment.id,
                authorId: author.id,
                authorName,
                hasProfileImage: !!profileImg,
                profileImage: author.profileImage,
                profilePicture: author.profilePicture
              })
              
              return {
              id: comment.id,
                author: authorName,
                avatar: profileImg,
              content: comment.content,
              createdAt: comment.createdAt,
                userId: author.id
              }
            })
            console.log('✅ Loaded comments:', comments)
            setLoadedComments({ ...loadedComments, [postId]: comments })
          }
        } catch (error) {
          console.error('Error fetching comments:', error)
        }
      }
    }
    setExpandedComments(newExpanded)
  }

  const handleAddComment = async (postId: string) => {
    const text = commentText[postId]?.trim()
    if (!text) return

    try {
      const response = await apiClient.post(`/posts/${postId}/comments`, {
        content: text
      })
      if ((response as any).success) {
        // Update local state
        setPosts(posts.map(post =>
          post.id === postId ? { ...post, comments: post.comments + 1 } : post
        ))
        // Add new comment to loaded comments - use backend response data
        const commentData = (response as any).data?.comment || (response as any).data
        const author = commentData?.author || {}
        const profileImg = normalizeImageUrl(author.profileImage || author.profilePicture || (userProfile || user)?.profileImage || (userProfile || user)?.profilePicture || '')
        const authorName = `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email || (userProfile || user)?.firstName + ' ' + (userProfile || user)?.lastName || (userProfile || user)?.email || 'You'
        
        console.log('💬 New comment author data:', {
          commentId: commentData?.id,
          authorId: author.id,
          authorName,
          hasProfileImage: !!profileImg,
          profileImage: author.profileImage || author.profilePicture
        })
        
        const newComment: Comment = {
          id: commentData?.id || Date.now().toString(),
          author: authorName,
          avatar: profileImg,
          content: commentData?.content || text,
          createdAt: commentData?.createdAt || new Date().toISOString(),
          userId: author.id || (userProfile || user)?.id || user?.id
        }
        setLoadedComments({
          ...loadedComments,
          [postId]: [...(loadedComments[postId] || []), newComment]
        })
        // Clear comment text
        setCommentText({ ...commentText, [postId]: '' })
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }


  const shown = posts

  return (
    <div className="min-h-screen bg-background">
      {/* Site Header */}
      <SiteHeader />

      {/* Main Content - Three Column Layout */}
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-12 gap-6 relative">
          {/* Left Sidebar */}
          <aside className="hidden lg:block col-span-3 space-y-6 sticky top-6 h-fit" style={{ transform: 'translateX(calc(-50% - 12px))' }}>
            {/* Navigation Links */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <nav className="space-y-1">
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <Home className="h-5 w-5" />
                  <span className="font-medium">{t("Accueil", "Home")}</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">{t("Amis", "Friends")}</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <UserPlus className="h-5 w-5" />
                  <span className="font-medium">{t("Groupes", "Groups")}</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="font-medium">{t("Marketplace", "Marketplace")}</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <Bookmark className="h-5 w-5" />
                  <span className="font-medium">{t("Enregistrés", "Saved")}</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <Flag className="h-5 w-5" />
                  <span className="font-medium">{t("Pages", "Pages")}</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <Star className="h-5 w-5" />
                  <span className="font-medium">{t("Favoris", "Favourites")}</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <ChevronDown className="h-5 w-5" />
                  <span className="font-medium">{t("Voir plus", "See More")}</span>
                </a>
              </nav>
            </div>

            {/* My Groups Section */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="font-semibold text-foreground mb-3">{t("Mes Groupes", "My Groups")}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
                  <span className="text-sm font-medium">{t("AUCUNE ACTIVITÉ", "NO ACTIVITY")}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Center Feed */}
          <main className="col-span-12 lg:col-span-6 flex flex-col items-center">
        {/* Header with Tabs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  {t("Centre Communautaire", "Community Center")}
                </h1>
                {/* White circular dot indicator - only in light mode */}
                {theme === "light" && (
                  <div className="relative">
                    <div className="w-3 h-3 bg-white rounded-full border-2 border-[#2ECC71] shadow-sm animate-pulse"></div>
                  </div>
                )}
              </div>
                  <p className="text-muted-foreground font-bold text-lg">
                    {t("TOUTE LES ACTUALITER DE LA PLATEFORME", "ALL PLATFORM NEWS")}
              </p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t("Actualités", "News")}
            </h2>
            <p className="text-muted-foreground">
              {t("Restez informé des dernières actualités", "Stay informed with the latest news")}
            </p>
          </div>

            {/* Actualités - Social Media Style */}
              <div className="mt-8 w-full">
                <div className="max-w-4xl mx-auto w-full">
                {/* Create Post Section - Instagram Style */}
                <div className="bg-card rounded-2xl border border-border shadow-sm mb-6">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      {userProfile?.profileImage || user?.profileImage ? (
                        <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-border">
                          <Image
                            src={normalizeImageUrl(userProfile?.profileImage || user?.profileImage || '')}
                            alt={userProfile?.firstName || user?.firstName || 'User'}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=40&width=40&query=profile"
                            }}
                          />
                        </div>
                      ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      )}
                      <Button
                        onClick={() => setShowCreatePost(true)}
                        className="flex-1 justify-start bg-muted hover:bg-muted/80 text-muted-foreground rounded-full h-10"
                      >
                        {t("Partagez quelque chose...", "Share something...")}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Create Post Modal */}
                {showCreatePost && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">{t("Créer un post", "Create a post")}</h3>
                        <div className="space-y-4">
                          <input
                            type="text"
                            placeholder={t("Titre du post", "Post title")}
                            value={newPostTitle}
                            onChange={(e) => setNewPostTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          />
                          <Textarea
                            placeholder={t("Contenu du post", "Post content")}
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            className="min-h-[100px] resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                              {t("Annuler", "Cancel")}
                            </Button>
                            <Button 
                              onClick={handleCreatePost} 
                              disabled={!newPostTitle.trim() || !newPostContent.trim()}
                              className="bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {t("Publier", "Publish")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Posts Feed - Instagram Style */}
                <div className="space-y-6 w-full max-w-4xl">
                  {loading ? (
                    <>
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                    </>
                  ) : shown.length === 0 ? (
                    <EmptyState />
                  ) : (
                    shown.map((p, idx) => (
                      <article
                        key={p.id}
                        className="bg-card rounded-2xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden backdrop-blur-sm bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-800/90 w-full"
                        style={{ animation: `fadeUp 220ms ease-out ${idx * 60}ms both` as any }}
                      >
                        {/* Post Header */}
                        <div className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative">
                              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-border">
                                <Image
                                  src={p.avatar || "/placeholder.svg?height=56&width=56&query=profile"}
                                  alt={`${p.author} profile`}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              </div>
                              {p.verified && (
                                <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center border-2 border-background ${
                                  p.role === "Admin" ? "bg-purple-500" : "bg-[#2ECC71]"
                                }`}>
                                  {p.role === "Admin" ? (
                                    <Shield className="h-2.5 w-2.5 text-white" />
                                  ) : (
                                    <CheckCircle className="h-2.5 w-2.5 text-white" />
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{p.author}</span>
                                <Badge
                                  variant={p.role === "Admin" ? "default" : "secondary"}
                                  className={`text-xs ${
                                    p.role === "Admin"
                                      ? "bg-purple-500 text-white"
                                      : "bg-[#2ECC71]/10 text-[#2ECC71] border border-[#2ECC71]/20"
                                  }`}
                                >
                                  {p.role}
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">{p.time}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </div>

                          {/* Post Content - Facebook Style */}
                          <div className="space-y-2">
                            {p.title && (
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                              {p.title}
                            </h3>
                            )}
                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-[15px] whitespace-pre-wrap">
                              {p.preview || p.content}
                            </p>
                          </div>
                        </div>

                        {/* Post Media - Social Media Style */}
                        {p.media && (
                          <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                            <div className="relative w-full" style={{ minHeight: '300px', maxHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img
                                src={normalizeImageUrl(p.media) || "/placeholder.svg"}
                              alt={lang === "fr" ? "Aperçu du média" : "Media preview"}
                                className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-500 hover:scale-105"
                                style={{ maxHeight: '600px', objectFit: 'contain', display: 'block' }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg"
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                            {!p.public && !subscribed && (
                              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm grid place-items-center text-white">
                                <div className="flex flex-col items-center gap-4 text-center p-6">
                                  <div className="p-4 rounded-full bg-white/20">
                                    <Lock className="h-8 w-8" />
                                  </div>
                                  <div className="space-y-2">
                                    <span className="text-lg font-bold">
                                      {lang === "fr" ? "Contenu Premium" : "Premium Content"}
                                    </span>
                                    <span className="text-sm font-medium max-w-xs block">
                                      {lang === "fr" 
                                        ? "Abonnez-vous pour accéder à ce contenu exclusif" 
                                        : "Subscribe to access this exclusive content"
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                            </div>
                          </div>
                        )}

                        {/* Post Actions - Facebook Style */}
                        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 flex-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLike(p.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150 flex-1 justify-center ${
                                  userLikedPosts.has(p.id)
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                }`}
                              >
                                <Heart className={`h-5 w-5 transition-transform duration-150 ${userLikedPosts.has(p.id) ? "fill-current" : ""}`} />
                                <span className="font-medium text-sm">{p.likes}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleComments(p.id)}
                                className="flex items-center gap-2 px-4 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150 flex-1 justify-center"
                              >
                                <MessageSquare className="h-5 w-5" />
                                <span className="font-medium text-sm">{p.comments}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-2 px-4 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150 flex-1 justify-center"
                                onClick={() => handleShare(p.id)}
                              >
                                <Share2 className="h-5 w-5" />
                                <span className="font-medium text-sm">{p.shares}</span>
                              </Button>
                            </div>
                          </div>

                          {/* Comment Section - Dribbble Style */}
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {/* Comment Input - Always visible */}
                            <div className="relative">
                              <Input
                                placeholder={t("Écrivez votre commentaire", "Write your comment")}
                                value={commentText[p.id] || ''}
                                onChange={(e) => setCommentText({ ...commentText, [p.id]: e.target.value })}
                                className="pr-20 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && commentText[p.id]?.trim()) {
                                    handleAddComment(p.id)
                                  }
                                }}
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700">
                                  <Camera className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </Button>
                                <div className="relative">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    onClick={() => setShowEmojiPicker({ ...showEmojiPicker, [p.id]: !showEmojiPicker[p.id] })}
                                  >
                                    <Smile className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                  </Button>
                                  {showEmojiPicker[p.id] && (
                                    <div className="absolute bottom-full right-0 mb-2 z-50 shadow-lg rounded-lg overflow-hidden">
                                      <EmojiPicker
                                        onEmojiClick={(emojiData) => {
                                          setCommentText({ ...commentText, [p.id]: (commentText[p.id] || '') + emojiData.emoji })
                                          setShowEmojiPicker({ ...showEmojiPicker, [p.id]: false })
                                        }}
                                        theme={theme === 'dark' ? 'dark' as any : 'light' as any}
                                        width={320}
                                        height={400}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Display existing comments */}
                          {expandedComments.has(p.id) && (
                              <div className="mt-4 space-y-3">
                                {loadedComments[p.id] && loadedComments[p.id].length > 0 ? (
                                  <>
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                  {loadedComments[p.id].map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                      <div className="flex-shrink-0">
                                        {comment.avatar ? (
                                          <Image
                                                src={normalizeImageUrl(comment.avatar)}
                                            alt={comment.author}
                                            width={32}
                                            height={32}
                                                className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement
                                                  target.src = "/placeholder.svg?height=32&width=32&query=profile"
                                                }}
                                          />
                                        ) : (
                                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                            <User className="h-4 w-4 text-white" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-semibold text-sm text-foreground">{comment.author}</span>
                                            </div>
                                            <p className="text-sm text-foreground break-words">{comment.content}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    {loadedComments[p.id].length > 3 && (
                                      <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                        {t("Voir tous les commentaires", "View all comments")}
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-center py-4 text-sm text-muted-foreground">
                                    {t("Aucun commentaire", "No comments yet")}
                                </div>
                              )}
                              </div>
                            )}
                            </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="hidden lg:block col-span-3 space-y-6 sticky top-6 h-fit" style={{ transform: 'translateX(calc(50% + 12px))' }}>
            {/* Birthdays Section */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                    <span className="text-xl">🎂</span>
                  </div>
                  <span className="text-sm font-medium">{t("Anniversaires", "Birthdays")}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("AUCUNE ACTIVITÉ", "NO ACTIVITY")}
              </p>
            </div>

            {/* Latest Activity Section */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="font-semibold text-foreground mb-3">{t("Dernière Activité", "Latest Activity")}</h3>
              <div className="space-y-3">
                <div className="text-center py-4 text-sm text-muted-foreground">
                  {t("AUCUNE ACTIVITÉ", "NO ACTIVITY")}
                </div>
              </div>
            </div>

            {/* Active Friends Section */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="font-semibold text-foreground mb-3">{t("Amis Actifs", "Active Friends")}</h3>
              <div className="space-y-2">
                <div className="text-center py-4 text-sm text-muted-foreground">
                  {t("AUCUNE ACTIVITÉ", "NO ACTIVITY")}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-start gap-4 mb-5">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex items-center gap-6 pt-5 mt-6 border-t border-border">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}

function EmptyState() {
  const { lang } = useLang()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)
  
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {lang === "fr" ? "Aucun post pour le moment" : "No posts yet"}
      </h3>
      <p className="text-muted-foreground max-w-sm mx-auto">
        {lang === "fr" 
          ? "Soyez le premier à partager quelque chose avec la communauté !" 
          : "Be the first to share something with the community!"
        }
      </p>
    </div>
  )
}
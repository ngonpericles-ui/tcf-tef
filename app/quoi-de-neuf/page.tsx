"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import Image from "next/image"
import { Heart, MessageSquare, Share2, Send, User, Camera, Smile, MoreHorizontal, Home, Users, UserPlus, ShoppingCart, Bookmark, Flag, Star, ChevronDown, X, Verified, ThumbsUp } from "lucide-react"
import dynamic from "next/dynamic"
import { useLang } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import { Skeleton } from "@/components/ui/skeleton"
import SiteHeader from "@/components/site-header"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import { getComprehensiveProfilePictureUrl } from "@/lib/utils/profilePicture"

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })

type Comment = {
  id: string
  author: string
  avatar?: string
  content: string
  createdAt: string
  userId?: string
  likes?: number
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

export default function QuoiDeNeufPage() {
  const { lang } = useLang()
  const { theme } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)
  
  // Fetch full user profile data including profileImage
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userStatus, setUserStatus] = useState<'ONLINE' | 'OFFLINE' | 'ACTIVE'>('OFFLINE')
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return
      
      try {
        const response = await apiClient.get(`/users/profile`).catch(async () => {
          return await apiClient.get(`/users/${user.id}`)
        })
        
        if (response.success && response.data) {
          const responseData = response.data as any
          const profileData = responseData.user || responseData
          setUserProfile(profileData)
          // If user is authenticated, they are ONLINE. Otherwise check database status.
          const userStatusValue = isAuthenticated ? 'ONLINE' : (profileData?.status || user?.status || 'OFFLINE')
          setUserStatus(userStatusValue)
          console.log('✅ User profile fetched:', { 
            id: profileData?.id, 
            hasProfileImage: !!(profileData?.profileImage || profileData?.profilePicture),
            status: userStatusValue,
            profileDataStatus: profileData?.status,
            userStatus: user?.status,
            isAuthenticated
          })
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        // Fallback: use user from auth context and set status based on authentication
        setUserProfile(user)
        setUserStatus(isAuthenticated ? 'ONLINE' : 'OFFLINE')
      }
    }
    
    if (user?.id) {
      fetchUserProfile()
    } else {
      setUserProfile(null)
      setUserStatus('OFFLINE')
    }
  }, [user?.id, isAuthenticated])

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostTitle, setNewPostTitle] = useState("")
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [loadedComments, setLoadedComments] = useState<Record<string, Comment[]>>({})
  const [userLikedPosts, setUserLikedPosts] = useState<Set<string>>(new Set())
  const [userSharedPosts, setUserSharedPosts] = useState<Set<string>>(new Set())
  const [showEmojiPicker, setShowEmojiPicker] = useState<Record<string, boolean>>({})
  const emojiPickerRef = useRef<Record<string, HTMLDivElement | null>>({})

  // Utility function to normalize image URLs - works in both dev and production
  const normalizeImageUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (url.startsWith('data:')) return url
    
    // Use environment variable for API URL, fallback to localhost for dev
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'
    
    if (url.startsWith('/uploads')) return `${apiBaseUrl}${url}`
    if (url.startsWith('/')) return `${apiBaseUrl}${url}`
    return `${apiBaseUrl}/uploads/${url}`
  }

  // Get user profile picture
  const getUserProfilePicture = () => {
    if (!userProfile && !user) return ''
    const profileData = userProfile || user
    const profileImage = normalizeImageUrl(profileData?.profileImage || profileData?.profilePicture || '')
    if (profileImage) return profileImage
    return getComprehensiveProfilePictureUrl(profileData?.email || '', '')
  }

  // Get user display name
  const getUserDisplayName = () => {
    if (!userProfile && !user) return 'Utilisateur'
    const profileData = userProfile || user
    const name = `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim()
    return name || profileData?.email || 'Utilisateur'
  }

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return lang === 'fr' ? 'À l\'instant' : 'Just now'
    if (diffMins < 60) return lang === 'fr' ? `Il y a ${diffMins}m` : `${diffMins}m ago`
    if (diffHours < 24) return lang === 'fr' ? `Il y a ${diffHours}h` : `${diffHours}h ago`
    if (diffDays < 7) return lang === 'fr' ? `Il y a ${diffDays}j` : `${diffDays}d ago`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
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
            // Normalize author avatar
            const authorAvatar = normalizeImageUrl(post.author?.profileImage || post.author?.profilePicture || '') || getComprehensiveProfilePictureUrl(post.author?.email || '', '')
            
            // Normalize post media - ensure it works in production
            let postMedia = undefined
            if (post.media) {
              if (post.media.startsWith('http://') || post.media.startsWith('https://') || post.media.startsWith('data:')) {
                postMedia = post.media
              } else {
                postMedia = normalizeImageUrl(post.media)
              }
            }
            
            return {
              id: post.id,
              author: `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim() || post.author?.email || 'Manager',
              role: (post.author?.role === 'ADMIN' ? 'Admin' : 'Manager') as "Manager" | "Admin" | "SENIOR_MANAGER" | "JUNIOR_MANAGER" | "ADMIN",
              verified: true,
              time: formatTimeAgo(post.createdAt),
              title: post.title,
              preview: post.excerpt || post.content?.substring(0, 200) + '...' || '',
              content: post.content,
              excerpt: post.excerpt,
              media: postMedia,
              public: post.visibility === 'PUBLIC',
              likes: post._count?.likes || 0,
              comments: post._count?.comments || 0,
              shares: post._count?.shares || 0,
              avatar: authorAvatar,
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
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

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
  }, [isAuthenticated, user, lang])

  // Click outside handler for emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(showEmojiPicker).forEach(postId => {
        if (showEmojiPicker[postId] && emojiPickerRef.current[postId]) {
          if (!emojiPickerRef.current[postId]?.contains(event.target as Node)) {
            setShowEmojiPicker({ ...showEmojiPicker, [postId]: false })
          }
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker])

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return

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
          time: lang === 'fr' ? 'À l\'instant' : 'Just now',
          title: newPostTitle,
          preview: newPostContent,
          content: newPostContent,
          media: undefined,
          public: true,
          likes: 0,
          comments: 0,
          shares: 0,
          avatar: getUserProfilePicture(),
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
        const { liked, likeCount } = (response as any).data || {}
        console.log('💖 Like data:', { liked, likeCount })
        
        setPosts(posts.map(post =>
          post.id === postId ? { ...post, likes: likeCount } : post
        ))
        
        setUserLikedPosts(prev => {
          const newSet = new Set(prev)
          if (liked) {
            newSet.add(postId)
          } else {
            newSet.delete(postId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('❌ Error liking post:', error)
    }
  }

  const handleShare = async (postId: string) => {
    try {
      console.log('🔄 Sharing post:', postId)
      const response = await apiClient.post(`/posts/${postId}/share`)

      if ((response as any).success) {
        const { shared, shareCount } = (response as any).data || {}

        setPosts(posts.map(post =>
          post.id === postId ? { ...post, shares: shareCount } : post
        ))

        setUserSharedPosts(prev => {
          const newSet = new Set(prev)
          if (shared) {
            newSet.add(postId)
          } else {
            newSet.delete(postId)
          }
          return newSet
        })
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
              const profileImg = normalizeImageUrl(author.profileImage || author.profilePicture || '') || getComprehensiveProfilePictureUrl(author.email || '', '')
              const authorName = `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email || 'User'
              
              return {
                id: comment.id,
                author: authorName,
                avatar: profileImg,
                content: comment.content,
                createdAt: comment.createdAt,
                userId: author.id,
                likes: comment._count?.likes || 0
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
        setPosts(posts.map(post =>
          post.id === postId ? { ...post, comments: post.comments + 1 } : post
        ))
        const commentData = (response as any).data?.comment || (response as any).data
        const author = commentData?.author || {}
        const profileImg = normalizeImageUrl(author.profileImage || author.profilePicture || '') || getUserProfilePicture()
        const authorName = `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email || getUserDisplayName()
        
        const newComment: Comment = {
          id: commentData?.id || Date.now().toString(),
          author: authorName,
          avatar: profileImg,
          content: commentData?.content || text,
          createdAt: commentData?.createdAt || new Date().toISOString(),
          userId: author.id || user?.id,
          likes: 0
        }
        setLoadedComments({
          ...loadedComments,
          [postId]: [...(loadedComments[postId] || []), newComment]
        })
        setCommentText({ ...commentText, [postId]: '' })
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const shown = posts

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-text-light dark:text-text-dark">
      <SiteHeader />
      
      <div className="w-full mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-12 gap-8 py-8">
          {/* Left Sidebar */}
          <aside className="col-span-12 lg:col-span-3 sticky top-8 h-max">
            <div className="flex flex-col gap-6">
              {/* User Profile */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div 
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12" 
                    style={{
                      backgroundImage: `url("${getUserProfilePicture()}")`
                    }}
                  />
                  {userStatus === 'ONLINE' && (
                    <div className="absolute bottom-0 right-0 size-3 bg-primary rounded-full border-2 border-background-light dark:border-background-dark"></div>
                  )}
                </div>
                <div className="flex flex-col">
                  <h1 className="text-text-light dark:text-text-dark text-base font-bold leading-normal">
                    {getUserDisplayName()}
                  </h1>
                  <p className={`text-sm font-medium leading-normal ${
                    userStatus === 'ONLINE' ? 'text-[#06f957] dark:text-[#06f957]' : 'text-text-muted-light dark:text-text-muted-dark'
                  }`}>
                    {userStatus === 'ONLINE' ? t('En ligne', 'Online') : t('Hors ligne', 'Offline')}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex flex-col gap-2">
                <a className="flex items-center gap-4 px-4 py-3 rounded-lg bg-primary/20 dark:bg-primary/30" href="/quoi-de-neuf">
                  <Home className="h-5 w-5 text-primary" />
                  <p className="text-primary text-sm font-bold leading-normal">{t("Accueil", "Home")}</p>
                </a>
                <a className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" href="#">
                  <User className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                  <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal">{t("Mon Profil", "My Profile")}</p>
                </a>
                <a className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" href="#">
                  <Users className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                  <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal">{t("Amis", "Friends")}</p>
                </a>
                <a className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" href="#">
                  <UserPlus className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                  <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal">{t("Groupes", "Groups")}</p>
                </a>
                <a 
                  className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" 
                  href="/messages"
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.href = '/messages'
                  }}
                >
                  <MessageSquare className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                  <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal">{t("Messages", "Messages")}</p>
                </a>
                <a className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" href="#">
                  <Star className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark" />
                  <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal">{t("Paramètres", "Settings")}</p>
                </a>
              </nav>
            </div>
          </aside>

          {/* Main Feed */}
          <main className="col-span-12 lg:col-span-6 flex flex-col gap-8">
            {/* Post Composer */}
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div 
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0" 
                  style={{
                    backgroundImage: `url("${getUserProfilePicture()}")`
                  }}
                />
                <div className="flex-1">
                  <textarea
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-transparent text-text-light dark:text-text-dark focus:outline-0 focus:ring-0 border-0 p-0 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark text-base font-normal leading-normal"
                    placeholder={t("Partagez quelque chose avec la communauté...", "Share something with the community...")}
                    rows={2}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    onClick={() => setShowCreatePost(true)}
                  />
                  <div className="flex items-center gap-4 justify-between pt-3">
                    <div className="flex items-center gap-1">
                      <button className="flex items-center justify-center p-2 rounded-full hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors">
                        <Camera className="h-5 w-5 text-primary" />
                      </button>
                      <button className="flex items-center justify-center p-2 rounded-full hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors">
                        <Smile className="h-5 w-5 text-primary" />
                      </button>
                    </div>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPostTitle.trim() || !newPostContent.trim()}
                      className="min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-primary text-background-light dark:text-text-light text-sm font-bold leading-normal disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="truncate">{t("Publier", "Publish")}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Post Modal */}
            {showCreatePost && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="glass-card rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">{t("Créer un post", "Create a post")}</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder={t("Titre du post", "Post title")}
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-white/20 dark:border-white/10 rounded-lg bg-transparent text-text-light dark:text-text-dark"
                    />
                    <textarea
                      placeholder={t("Contenu du post", "Post content")}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="w-full px-3 py-2 border border-white/20 dark:border-white/10 rounded-lg bg-transparent text-text-light dark:text-text-dark min-h-[100px] resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowCreatePost(false)}
                        className="px-4 py-2 rounded-lg border border-white/20 dark:border-white/10 text-text-light dark:text-text-dark"
                      >
                        {t("Annuler", "Cancel")}
                      </button>
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPostTitle.trim() || !newPostContent.trim()}
                        className="px-4 py-2 rounded-full bg-primary text-background-light dark:text-text-light text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("Publier", "Publish")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : shown.length === 0 ? (
                <EmptyState />
              ) : (
                shown.map((p) => (
                  <article key={p.id} className="glass-card rounded-xl overflow-hidden">
                    {/* Post Header */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div 
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" 
                          style={{
                            backgroundImage: `url("${p.avatar || getComprehensiveProfilePictureUrl('', '')}")`
                          }}
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <p className="text-text-light dark:text-text-dark text-base font-bold leading-normal">{p.author}</p>
                            {p.verified && (
                              <Verified className="h-4 w-4 text-primary" />
                            )}
                            {p.role && (
                              <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                {p.role === 'Admin' ? t('Modérateur', 'Moderator') : p.role}
                              </span>
                            )}
                          </div>
                          <p className="text-text-muted-light dark:text-text-muted-dark text-sm font-normal leading-normal">{p.time}</p>
                        </div>
                      </div>

                      {/* Post Content */}
                      {p.title && (
                        <h2 className="text-[#06f957] dark:text-[#06f957] text-xl font-bold leading-tight tracking-tight mb-2">{p.title}</h2>
                      )}
                      <p className="text-text-light dark:text-text-dark text-base font-normal leading-normal mb-4">
                        {p.preview || p.content}
                      </p>
                    </div>

                    {/* Post Media */}
                    {p.media && (
                      <div className="w-full bg-center bg-no-repeat aspect-video bg-cover" style={{
                        backgroundImage: `url("${p.media}")`
                      }} />
                    )}

                    {/* Post Actions */}
                    <div className="p-5">
                      <div className="flex items-center justify-between text-text-muted-light dark:text-text-muted-dark">
                        <div className="flex items-center gap-6">
                          <button
                            onClick={() => handleLike(p.id)}
                            className="flex items-center gap-2 group"
                          >
                            <Heart className={`h-6 w-6 transition-colors ${
                              userLikedPosts.has(p.id)
                                ? 'text-primary fill-primary'
                                : 'group-hover:text-primary'
                            }`} style={{ fontVariationSettings: userLikedPosts.has(p.id) ? "'FILL' 1" : "'FILL' 0" }} />
                            <p className={`font-bold leading-normal tracking-wide text-sm ${
                              userLikedPosts.has(p.id) ? 'text-primary' : ''
                            }`}>{p.likes}</p>
                          </button>
                          <button
                            onClick={() => handleToggleComments(p.id)}
                            className="flex items-center gap-2 group"
                          >
                            <MessageSquare className="h-6 w-6 group-hover:text-text-light dark:group-hover:text-text-dark transition-colors" />
                            <p className="font-bold leading-normal tracking-wide text-sm">{p.comments}</p>
                          </button>
                          <button
                            onClick={() => handleShare(p.id)}
                            className="flex items-center gap-2 group"
                          >
                            <Share2 className="h-6 w-6 group-hover:text-text-light dark:group-hover:text-text-dark transition-colors" />
                            <p className="font-bold leading-normal tracking-wide text-sm">{p.shares}</p>
                          </button>
                        </div>
                      </div>

                      {/* Comment Section - Only show when expanded */}
                      {expandedComments.has(p.id) && (
                        <>
                          <div className="border-t border-white/20 dark:border-white/10 my-4"></div>
                          
                          {/* Comment Input */}
                          <div className="flex w-full flex-row items-start justify-start gap-3 mb-4">
                            <div 
                              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0" 
                              style={{
                                backgroundImage: `url("${getUserProfilePicture()}")`
                              }}
                            />
                            <div className="flex-1">
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder={t("Écrivez un commentaire...", "Write a comment...")}
                                  value={commentText[p.id] || ''}
                                  onChange={(e) => setCommentText({ ...commentText, [p.id]: e.target.value })}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && commentText[p.id]?.trim()) {
                                      handleAddComment(p.id)
                                    }
                                  }}
                                  className="w-full px-4 py-2 rounded-full bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/10 text-text-light dark:text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                  <button
                                    onClick={() => setShowEmojiPicker({ ...showEmojiPicker, [p.id]: !showEmojiPicker[p.id] })}
                                    className="p-1.5 rounded-full hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
                                  >
                                    <Smile className="h-4 w-4 text-text-muted-light dark:text-text-muted-dark" />
                                  </button>
                                  {showEmojiPicker[p.id] && (
                                    <div ref={(el) => { emojiPickerRef.current[p.id] = el }} className="absolute bottom-full right-0 mb-2 z-50">
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
                          </div>

                          {/* Comments List */}
                          <div className="flex w-full flex-col gap-4">
                            {loadedComments[p.id] && loadedComments[p.id].length > 0 ? (
                              loadedComments[p.id].map((comment) => (
                                <div key={comment.id} className="flex w-full flex-row items-start justify-start gap-3">
                                  <div 
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0" 
                                    style={{
                                      backgroundImage: `url("${comment.avatar || getComprehensiveProfilePictureUrl('', '')}")`
                                    }}
                                  />
                                  <div className="flex h-full flex-1 flex-col items-start justify-start">
                                    <div className="flex w-full flex-row items-center justify-start gap-x-3">
                                      <p className="text-text-light dark:text-text-dark text-sm font-bold leading-normal">{comment.author}</p>
                                      <p className="text-text-muted-light dark:text-text-muted-dark text-xs font-normal leading-normal">
                                        {formatTimeAgo(comment.createdAt)}
                                      </p>
                                    </div>
                                    <p className="text-text-light dark:text-text-dark text-sm font-normal leading-normal mt-0.5">{comment.content}</p>
                                    <div className="flex w-full flex-row items-center justify-start gap-4 pt-2">
                                      <button className="flex items-center gap-1.5 group">
                                        <ThumbsUp className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark group-hover:text-primary transition-colors" />
                                        <p className="text-text-muted-light dark:text-text-muted-dark text-sm font-medium leading-normal group-hover:text-primary transition-colors">
                                          {comment.likes || 0}
                                        </p>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-sm text-text-muted-light dark:text-text-muted-dark">
                                {t("Aucun commentaire", "No comments yet")}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="col-span-12 lg:col-span-3 sticky top-8 h-max flex-col gap-6 hidden lg:flex">
            {/* Birthdays Card */}
            <div className="glass-card rounded-xl p-5 w-full">
              <h3 className="text-[#06f957] dark:text-[#06f957] text-lg font-bold mb-4">{t("Anniversaires", "Birthdays")}</h3>
              <div className="flex flex-col gap-4">
                <div className="text-center py-4 text-sm text-text-muted-light dark:text-text-muted-dark">
                  {t("Aucune activité", "No activity")}
                </div>
              </div>
            </div>

            {/* Latest Activity */}
            <div className="glass-card rounded-xl p-5 w-full">
              <h3 className="text-[#06f957] dark:text-[#06f957] text-lg font-bold mb-4">{t("Activité Récente", "Recent Activity")}</h3>
              <div className="flex flex-col gap-4">
                <div className="text-center py-4 text-sm text-text-muted-light dark:text-text-muted-dark">
                  {t("Aucune activité", "No activity")}
                </div>
              </div>
            </div>

            {/* Active Friends */}
            <div className="glass-card rounded-xl p-5 w-full">
              <h3 className="text-[#06f957] dark:text-[#06f957] text-lg font-bold mb-4">{t("Amis Actifs", "Active Friends")}</h3>
              <div className="flex flex-col gap-4">
                <div className="text-center py-4 text-sm text-text-muted-light dark:text-text-muted-dark">
                  {t("Aucune activité", "No activity")}
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
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start gap-4 mb-5">
        <Skeleton className="h-10 w-10 rounded-full" />
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
      <div className="flex items-center gap-6 pt-5 mt-6 border-t border-white/20 dark:border-white/10">
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
        {t("Aucun post pour le moment", "No posts yet")}
      </h3>
      <p className="text-muted-foreground max-w-sm mx-auto">
        {t(
          "Soyez le premier à partager quelque chose avec la communauté !",
          "Be the first to share something with the community!"
        )}
      </p>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Heart, MessageSquare, Share2, Lock, CheckCircle, Shield, Send, User } from "lucide-react"
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
}


// Removed hardcoded SEED data - now fetching from backend




export default function QuoiDeNeufPage() {
  const { lang } = useLang()
  const { theme } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostTitle, setNewPostTitle] = useState("")
  const [subscribed] = useState(true) // Mock subscription status

  // Fetch posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
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
          const backendPosts = response.data.map((post: any) => ({
            id: post.id,
            author: `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim() || post.author?.email || 'Manager',
            role: post.author?.role === 'ADMIN' ? 'Admin' : 'Manager',
            verified: true,
            time: new Date(post.createdAt).toLocaleDateString('fr-FR'),
            title: post.title,
            preview: post.excerpt || post.content?.substring(0, 200) + '...' || '',
            content: post.content,
            excerpt: post.excerpt,
            media: post.media,
            public: post.visibility === 'PUBLIC',
            likes: post._count?.likes || 0,
            comments: post._count?.comments || 0,
            shares: post._count?.shares || 0,
            avatar: post.author?.profileImage || undefined,
            authorId: post.authorId,
            status: post.status,
            visibility: post.visibility,
            level: post.level,
            targetTier: post.targetTier,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt
          }))

          setPosts(backendPosts)
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
        // No fallback data - show empty state
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

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
          id: response.data.post.id,
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
          avatar: user.profileImage || undefined,
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

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ))
  }


  const shown = posts

  return (
    <div className="min-h-screen bg-background">
      {/* Site Header */}
      <SiteHeader />

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
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
              <p className="text-muted-foreground">
                {t("Actualités et marketplace des tuteurs", "News and tutor marketplace")}
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
            <div className="mt-8">
              <div className="max-w-2xl mx-auto">
                {/* Create Post Section - Instagram Style */}
                <div className="bg-card rounded-2xl border border-border shadow-sm mb-6">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
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
                    shown.map((p, idx) => (
                      <article
                        key={p.id}
                        className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
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
                          </div>

                          {/* Post Content */}
                          <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-foreground leading-tight">
                              {p.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">{p.preview}</p>
                          </div>
                        </div>

                        {/* Post Media */}
                        {p.media && (
                          <div className="relative aspect-video w-full overflow-hidden">
                            <Image
                              src={p.media || "/placeholder.svg"}
                              alt={lang === "fr" ? "Aperçu du média" : "Media preview"}
                              fill
                              className="object-cover"
                            />
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
                        )}

                        {/* Post Actions */}
                        <div className="p-4 pt-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLike(p.id)}
                                className="flex items-center gap-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-2"
                              >
                                <Heart className="h-5 w-5" />
                                <span className="font-medium">{p.likes}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 p-2"
                              >
                                <MessageSquare className="h-5 w-5" />
                                <span className="font-medium">{p.comments}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-2 text-muted-foreground hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 p-2"
                              >
                                <Share2 className="h-5 w-5" />
                                <span className="font-medium">{p.shares}</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
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
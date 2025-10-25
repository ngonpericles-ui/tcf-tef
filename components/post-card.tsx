"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Share, Eye, Calendar } from "lucide-react"
import LikeButton from "./like-button"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface Post {
  id: string
  title: string
  content: string
  excerpt?: string
  author: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  category?: string
  tags: string[]
  level?: string
  targetTier: string
  publishedAt: string
  viewCount: number
  _count: {
    likes: number
    comments: number
    shares: number
  }
}

interface PostCardProps {
  post: Post
  userId?: string
  onLike?: (postId: string, liked: boolean) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
}

export default function PostCard({ 
  post, 
  userId, 
  onLike, 
  onComment, 
  onShare 
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post._count.likes)
  const [isLoading, setIsLoading] = useState(false)

  // Check if user has liked this post
  useEffect(() => {
    if (userId) {
      checkLikeStatus()
    }
  }, [userId, post.id])

  const checkLikeStatus = async () => {
    try {
      const response = await apiClient.get(`/likes/status/${post.id}/POST`)
      const data = response.data as { success: boolean; liked: boolean; likeCount: number }
      if (data.success) {
        setIsLiked(data.liked)
        setLikeCount(data.likeCount)
      }
    } catch (error) {
      console.error('Error checking like status:', error)
    }
  }

  const handleLike = async () => {
    if (!userId) {
      toast.error("Vous devez être connecté pour aimer ce post")
      return
    }

    setIsLoading(true)
    try {
      const response = await apiClient.post('/likes/like', {
        contentId: post.id,
        contentType: 'POST'
      })

      const data = response.data as { success: boolean; liked: boolean; likeCount: number }
      if (data.success) {
        setIsLiked(data.liked)
        setLikeCount(data.likeCount)
        onLike?.(post.id, data.liked)
      }
    } catch (error: any) {
      console.error('Error liking post:', error)
      toast.error(error.response?.data?.message || "Erreur lors de l'ajout aux favoris")
    } finally {
      setIsLoading(false)
    }
  }

  const handleComment = () => {
    onComment?.(post.id)
  }

  const handleShare = () => {
    onShare?.(post.id)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'A1': return 'bg-green-100 text-green-800'
      case 'A2': return 'bg-blue-100 text-blue-800'
      case 'B1': return 'bg-yellow-100 text-yellow-800'
      case 'B2': return 'bg-orange-100 text-orange-800'
      case 'C1': return 'bg-red-100 text-red-800'
      case 'C2': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.profileImage} />
              <AvatarFallback>
                {post.author.firstName[0]}{post.author.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-semibold">
                {post.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Par {post.author.firstName} {post.author.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {post.level && (
              <Badge className={getLevelColor(post.level)}>
                {post.level}
              </Badge>
            )}
            <Badge variant="outline">
              {post.targetTier}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground line-clamp-3">
            {post.excerpt || post.content}
          </p>
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-4">
            <LikeButton
              contentId={post.id}
              contentType="POST"
              initialLiked={isLiked}
              initialLikeCount={likeCount}
              userId={userId}
              size="sm"
              showCount={true}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleComment}
              className="flex items-center space-x-1"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post._count.comments}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-1"
            >
              <Share className="h-4 w-4" />
              <span>{post._count.shares}</span>
            </Button>
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{post.viewCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

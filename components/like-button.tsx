"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, HeartIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface LikeButtonProps {
  contentId: string
  contentType: 'POST' | 'COMMENT'
  initialLiked?: boolean
  initialLikeCount?: number
  userId?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
}

export default function LikeButton({
  contentId,
  contentType,
  initialLiked = false,
  initialLikeCount = 0,
  userId,
  className,
  size = 'md',
  showCount = true
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleLike = async () => {
    if (!userId) {
      toast.error("Vous devez être connecté pour aimer ce contenu")
      return
    }

    setIsLoading(true)
    try {
      const response = await apiClient.post('/likes/like', {
        contentId,
        contentType
      })

      if (response.data.success) {
        setLiked(response.data.liked)
        setLikeCount(response.data.likeCount)
        
        if (response.data.liked) {
          toast.success("Contenu ajouté aux favoris!")
        } else {
          toast.success("Contenu retiré des favoris")
        }
      }
    } catch (error: any) {
      console.error('Error liking content:', error)
      toast.error(error.response?.data?.message || "Erreur lors de l'ajout aux favoris")
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={liked ? "default" : "outline"}
        size="icon"
        onClick={handleLike}
        disabled={isLoading}
        className={cn(
          "transition-all duration-200 hover:scale-105",
          liked && "bg-red-500 hover:bg-red-600 text-white",
          !liked && "hover:bg-red-50 hover:border-red-300",
          sizeClasses[size],
          className
        )}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        ) : (
          <Heart 
            className={cn(
              iconSizes[size],
              liked && "fill-current"
            )} 
          />
        )}
      </Button>
      
      {showCount && (
        <span className={cn(
          "text-sm font-medium",
          size === 'sm' && "text-xs",
          size === 'lg' && "text-base"
        )}>
          {likeCount}
        </span>
      )}
    </div>
  )
}

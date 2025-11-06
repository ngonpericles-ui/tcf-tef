"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMessagingRoute } from '@/hooks/useMessagingRoute'

interface MessageIconProps {
  contactId?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
}

export default function MessageIcon({ 
  contactId, 
  className = '', 
  size = 'md',
  variant = 'ghost'
}: MessageIconProps) {
  const router = useRouter()
  const { getMessagingRouteWithContact, getMessagingRoute } = useMessagingRoute()

  const handleClick = () => {
    const route = contactId 
      ? getMessagingRouteWithContact(contactId)
      : getMessagingRoute()
    
    router.push(route)
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleClick}
      className={`p-2 ${className}`}
      title="Send Message"
    >
      <MessageCircle className={sizeClasses[size]} />
    </Button>
  )
}

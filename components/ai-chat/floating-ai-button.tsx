"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, Bot, Sparkles } from 'lucide-react'
import AIChatWidget from './ai-chat-widget'
import { useAuth } from '@/hooks/useAuth'

interface FloatingAIButtonProps {
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export default function FloatingAIButton({ 
  className = '', 
  position = 'bottom-right' 
}: FloatingAIButtonProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // Don't show if user is not authenticated
  if (!user) return null

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  }

  return (
    <>
      {/* Floating Button */}
      <div className={`fixed ${positionClasses[position]} z-40 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-2xl transition-all duration-300 group animate-pulse hover:animate-none"
          size="lg"
        >
          <div className="relative">
            <Bot className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-bounce" />
          </div>
        </Button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Chat avec Aura.CA
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
        </div>
      </div>

      {/* AI Chat Widget */}
      <AIChatWidget 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  )
}

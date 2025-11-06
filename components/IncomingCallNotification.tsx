'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { getComprehensiveProfilePictureUrl, createProfilePictureWithFallback } from '@/lib/utils/profilePicture'

interface IncomingCallNotificationProps {
  isVisible: boolean
  callerName: string
  callerEmail: string
  callerRole: string
  onAccept: () => void
  onDecline: () => void
  onClose: () => void
}

export default function IncomingCallNotification({
  isVisible,
  callerName,
  callerEmail,
  callerRole,
  onAccept,
  onDecline,
  onClose
}: IncomingCallNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      // Auto-hide after 30 seconds if not answered
      const timeout = setTimeout(() => {
        onDecline()
      }, 30000)
      
      return () => clearTimeout(timeout)
    } else {
      setIsAnimating(false)
    }
  }, [isVisible, onDecline])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="text-center">
          {/* Caller Avatar */}
          <div className="mb-6">
            <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-green-500 ring-opacity-30">
              <AvatarImage 
                src={getComprehensiveProfilePictureUrl(callerEmail)} 
                onError={(e) => {
                  const fallback = createProfilePictureWithFallback(callerEmail);
                  if (e.currentTarget.src !== fallback.fallbackUrl) {
                    e.currentTarget.src = fallback.fallbackUrl;
                  }
                }}
              />
              <AvatarFallback className="text-2xl">
                {callerName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {callerName}
            </h2>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {callerRole === 'ADMIN' ? 'Administrateur' :
               callerRole === 'SENIOR_MANAGER' ? 'Gestionnaire Senior' :
               callerRole === 'JUNIOR_MANAGER' ? 'Gestionnaire Junior' :
               callerRole === 'INSTRUCTOR' ? 'Instructeur' : 'Utilisateur'}
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Appel vidéo entrant...</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={onDecline}
              variant="destructive"
              size="lg"
              className="rounded-full w-16 h-16 p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
              title="Rejeter l'appel"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            
            <Button
              onClick={onAccept}
              size="lg"
              className="rounded-full w-16 h-16 p-0 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              title="Accepter l'appel"
            >
              <Video className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Auto-decline notice */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            L'appel sera automatiquement rejeté dans 30 secondes
          </p>
        </div>
      </div>
    </div>
  )
}

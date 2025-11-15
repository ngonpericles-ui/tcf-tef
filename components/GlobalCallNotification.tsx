"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePusher } from '@/hooks/usePusher'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Video, PhoneOff } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface IncomingCallData {
  callerId: string
  callerName: string
  callerRole: string
  sessionId?: string
  secureLink?: string
  isDirectCall?: boolean
}

export default function GlobalCallNotification() {
  const router = useRouter()
  const { user } = useAuth()
  const { pusher, isConnected } = usePusher()
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Helper function to show notification from data
  const showNotification = useCallback((data: IncomingCallData) => {
    console.log('🔔 GlobalCallNotification: Showing notification:', data)
    
    // Request browser notification permission and show notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Session privée disponible', {
          body: `${data.callerName || 'Instructeur'} vous invite à une session privée`,
          icon: '/logo/AURA.CA.png',
          tag: `session-${data.sessionId}`,
          requireInteraction: true
        })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Session privée disponible', {
              body: `${data.callerName || 'Instructeur'} vous invite à une session privée`,
              icon: '/logo/AURA.CA.png',
              tag: `session-${data.sessionId}`,
              requireInteraction: true
            })
          }
        })
      }
    }
    
    setIncomingCall(data)
    setIsVisible(true)
    
    // Store session data for joining
    if (data.sessionId && data.secureLink) {
      localStorage.setItem('pendingSessionId', String(data.sessionId))
      localStorage.setItem('pendingSessionLink', String(data.secureLink))
      console.log('💾 GlobalCallNotification: Stored session data in localStorage')
    }
  }, [])

  // Poll for pending sessions when Pusher is not connected (fallback mechanism)
  const checkForPendingSessions = useCallback(async () => {
    if (!user?.id) return
    
    try {
      // Check localStorage first (in case notification was received but component wasn't mounted)
      const pendingSessionId = localStorage.getItem('pendingSessionId')
      const pendingSessionLink = localStorage.getItem('pendingSessionLink')
      
      if (pendingSessionId && pendingSessionLink && !isVisible) {
        console.log('📋 GlobalCallNotification: Found pending session in localStorage')
        // Validate the session token
        try {
          // Extract token from URL - handle both full URLs and relative paths
          let token = pendingSessionLink
          
          // If it's a full URL, extract the token part
          if (token.includes('/session/')) {
            token = token.split('/session/')[1]
          }
          
          // Remove query parameters and fragments if any
          token = token.split('?')[0].split('#')[0].trim()
          
          if (token) {
            // Double encode to handle special characters in JWT
            const encodedToken = encodeURIComponent(token)
            const response = await apiClient.get(`/messages/validate-secure-session/${encodedToken}`)
            
            if (response.success && response.data) {
              const session = response.data as any
              showNotification({
                callerId: session.instructorId || session.createdBy?.id || '',
                callerName: session.instructorName || 
                           (session.createdBy ? `${session.createdBy.firstName || ''} ${session.createdBy.lastName || ''}`.trim() : 'Instructeur') ||
                           'Instructeur',
                callerRole: 'INSTRUCTOR',
                sessionId: session.sessionId,
                secureLink: pendingSessionLink,
                isDirectCall: true
              })
              return
            }
          }
        } catch (error: any) {
          // Only log if it's not a 400/404 (expected for expired/invalid sessions)
          const status = error?.response?.status || error?.status
          if (status && status !== 400 && status !== 404) {
            console.warn('Failed to validate pending session:', error)
          }
          // Clear invalid/expired session data silently
          localStorage.removeItem('pendingSessionId')
          localStorage.removeItem('pendingSessionLink')
        }
      }
      
      // Poll messages API for recent session invitations (last 20 messages)
      const response = await apiClient.get(`/messages?limit=20`)
      
      if (response.success && response.data) {
        const messages = Array.isArray(response.data) ? response.data : (response.data.messages || [])
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
        
        // Look for messages with session links (from last 5 minutes)
        for (const message of messages) {
          // Only check messages from last 5 minutes
          const messageTime = new Date(message.createdAt || message.timestamp || 0).getTime()
          if (messageTime < fiveMinutesAgo) continue
          
          if (message.type === 'system' && message.content) {
            // Extract session link from message content - handle both markdown and plain text
            const linkMatch = message.content.match(/🔗\s*(https?:\/\/[^\s\n<]+|(?:\/session\/[^\s\n<]+))/)
            if (linkMatch && linkMatch[1]) {
              let secureLink = linkMatch[1]
              
              // If it's a relative path, make it absolute
              if (secureLink.startsWith('/session/')) {
                secureLink = `${typeof window !== 'undefined' ? window.location.origin : ''}${secureLink}`
              }
              
              // Extract token from URL
              const sessionIdMatch = secureLink.match(/\/session\/([^\/\s?<]+)/)
              
              if (sessionIdMatch && sessionIdMatch[1]) {
                const token = sessionIdMatch[1]
                // Extract sessionId from token by decoding JWT (just get the payload)
                let sessionId = token
                try {
                  // Try to decode JWT to get sessionId (first part after decoding payload)
                  const payload = JSON.parse(atob(token.split('.')[1]))
                  sessionId = payload.sessionId || token
                } catch {
                  // If decoding fails, use token as sessionId
                  sessionId = token
                }
                
                // Check if we've already shown this notification
                const lastShown = localStorage.getItem(`session-shown-${sessionId}`)
                if (lastShown) continue
                
                // Mark as shown
                localStorage.setItem(`session-shown-${sessionId}`, Date.now().toString())
                
                // Show notification with default instructor name (no API call needed to avoid 403 errors)
                // The session invitation message already contains the instructor name in the content
                showNotification({
                  callerId: message.senderId,
                  callerName: 'Instructeur', // Default name - avoids 403 permission errors
                  callerRole: 'INSTRUCTOR',
                  sessionId,
                  secureLink,
                  isDirectCall: true
                })
                
                break // Only show one notification at a time
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error checking for pending sessions (non-critical):', error)
    }
  }, [user?.id, isVisible, showNotification])

  // Set up polling when Pusher is not connected
  useEffect(() => {
    if (!user?.id) return
    
    // If Pusher is not connected, start polling
    if (!isConnected) {
      console.log('🔄 GlobalCallNotification: Pusher not connected, starting polling fallback')
      
      // Check immediately
      checkForPendingSessions()
      
      // Poll every 10 seconds when Pusher is not connected
      pollingIntervalRef.current = setInterval(() => {
        checkForPendingSessions()
      }, 10000) // Poll every 10 seconds
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    } else {
      // Stop polling when Pusher connects
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [user?.id, isConnected, checkForPendingSessions])

  // Listen for incoming call notifications via Pusher
  useEffect(() => {
    if (!user?.id || !pusher || !isConnected) return

    console.log('🔔 GlobalCallNotification: Setting up Pusher listener for user:', user.id)
    
    const privateChannel = pusher.subscribe(`private-${user.id}`)
    
    // Wait for subscription to be authorized
    privateChannel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ GlobalCallNotification: Private channel subscription succeeded')
      
      // Listen for video-call-incoming events
      privateChannel.bind('video-call-incoming', (data: any) => {
        console.log('🎉 GlobalCallNotification: VIDEO-CALL-INCOMING EVENT RECEIVED:', data)
        console.log('🔍 Event details:', {
          isDirectCall: data.isDirectCall,
          hasSecureLink: !!data.secureLink,
          callerId: data.callerId,
          callerName: data.callerName,
          sessionId: data.sessionId
        })
        
        // If this is a direct call with session link, show notification
        if (data.isDirectCall && data.secureLink) {
          console.log('✅ GlobalCallNotification: Showing notification card for one-on-one session')
          showNotification({
            callerId: data.callerId || data.sessionId || '',
            callerName: data.callerName || 'Instructeur',
            callerRole: data.callerRole || 'INSTRUCTOR',
            sessionId: data.sessionId,
            secureLink: data.secureLink,
            isDirectCall: true
          })
        } else {
          console.log('📞 GlobalCallNotification: Regular video call (not one-on-one session)')
          setIncomingCall({
            callerId: data.callerId || '',
            callerName: data.callerName || 'Instructeur',
            callerRole: data.callerRole || 'INSTRUCTOR',
            isDirectCall: false
          })
          setIsVisible(true)
        }
      })
    })
    
    // Log subscription errors
    privateChannel.bind('pusher:subscription_error', (error: any) => {
      // Only log as warning - Pusher is optional, don't show error to user
      console.warn('⚠️ GlobalCallNotification: Private channel subscription error (non-critical):', error?.error || error?.message || 'Unknown error')
    })

    // Cleanup on unmount
    return () => {
      try {
        privateChannel.unbind('video-call-incoming')
        privateChannel.unbind('pusher:subscription_succeeded')
        privateChannel.unbind('pusher:subscription_error')
        pusher.unsubscribe(`private-${user.id}`)
      } catch (e) {
        console.warn('Error cleaning up GlobalCallNotification:', e)
      }
    }
  }, [user?.id, pusher, isConnected])

  // Handle accepting the call
  const handleAccept = useCallback(() => {
    if (!incomingCall) return

    if (incomingCall.isDirectCall && incomingCall.secureLink) {
      // Redirect to the one-on-one session page
      // DON'T remove localStorage items here - let session page check and remove them
      // This allows session page to auto-start when coming from notification
      const sessionLink = incomingCall.secureLink.replace(window.location.origin, '')
      router.push(sessionLink)
    } else {
      // Regular video call - redirect to messages page
      router.push('/messages')
    }
    
    setIsVisible(false)
    setIncomingCall(null)
  }, [incomingCall, router])

  // Handle rejecting the call
  const handleReject = useCallback(() => {
    if (incomingCall?.sessionId) {
      localStorage.setItem(`session-shown-${incomingCall.sessionId}`, Date.now().toString())
    }
    localStorage.removeItem('pendingSessionLink')
    localStorage.removeItem('pendingSessionId')
    setIsVisible(false)
    setIncomingCall(null)
  }, [incomingCall?.sessionId])

  if (!isVisible || !incomingCall) return null

  const callerNameParts = incomingCall.callerName.split(' ')
  const firstName = callerNameParts[0] || 'Instructeur'
  const lastName = callerNameParts.slice(1).join(' ') || ''

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-in">
        <div className="text-center">
          <div className="mb-6">
            <Avatar className="h-20 w-20 mx-auto mb-4">
              <AvatarImage 
                src="" 
                alt={`${firstName} ${lastName}`}
              />
              <AvatarFallback className="bg-blue-600 text-white text-2xl">
                {firstName[0]}{lastName[0] || firstName[0]}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {firstName} {lastName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {incomingCall.isDirectCall && incomingCall.secureLink
                ? 'Session privée 1-on-1 disponible'
                : 'Appel vidéo entrant...'}
            </p>
            {incomingCall.isDirectCall && incomingCall.secureLink && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Cliquez sur "Accepter" pour rejoindre la session
              </p>
            )}
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleReject}
              variant="destructive"
              className="rounded-full w-14 h-14 p-0 flex items-center justify-center"
              title="Rejeter"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              onClick={handleAccept}
              className="rounded-full w-14 h-14 p-0 flex items-center justify-center bg-green-500 hover:bg-green-600"
              title={incomingCall.isDirectCall && incomingCall.secureLink 
                ? "Rejoindre la session" 
                : "Accepter l'appel"}
            >
              <Video className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


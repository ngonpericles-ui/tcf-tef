"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Users,
  Loader2,
  AlertCircle,
  Monitor,
  MonitorOff,
  Square,
  Circle,
  Settings,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  MoreVertical,
  Hand,
  MessageSquare,
  Share2
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"

// Agora RTC types
declare global {
  interface Window {
    AgoraRTC: any;
  }
}

interface AgoraVideoCallProps {
  channelName: string;
  sessionId: string;
  onParticipantCountChange?: (count: number) => void;
  onConnectionStatusChange?: (status: 'disconnected' | 'connecting' | 'connected') => void;
  onRecordingStatusChange?: (isRecording: boolean) => void;
  isHost?: boolean;
  className?: string;
}

interface RemoteUser {
  uid: string;
  videoTrack?: any;
  audioTrack?: any;
}

export default function AgoraVideoCall({
  channelName,
  sessionId,
  onParticipantCountChange,
  onConnectionStatusChange,
  onRecordingStatusChange,
  isHost = false,
  className = ""
}: AgoraVideoCallProps) {
  const { lang } = useLang()
  const { user } = useAuth()

  // Video call state
  const [isJoined, setIsJoined] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [agoraLoaded, setAgoraLoaded] = useState(false)

  // Enhanced video features state
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [volume, setVolume] = useState(100)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [chatVisible, setChatVisible] = useState(false)

  // Agora references
  const clientRef = useRef<any>(null)
  const localTracksRef = useRef<any>({ videoTrack: null, audioTrack: null, screenTrack: null })
  const remoteUsersRef = useRef<{ [key: string]: any }>({})
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load Agora SDK
  useEffect(() => {
    if (window.AgoraRTC) {
      setAgoraLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.20.2.js'
    script.async = true
    script.onload = () => {
      setAgoraLoaded(true)
      console.log('Agora SDK loaded successfully')
    }
    script.onerror = () => {
      setError(t("Erreur de chargement du SDK Agora", "Failed to load Agora SDK"))
    }
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // Update parent components
  useEffect(() => {
    onConnectionStatusChange?.(connectionStatus)
  }, [connectionStatus, onConnectionStatusChange])

  useEffect(() => {
    onParticipantCountChange?.(remoteUsers.length + (isJoined ? 1 : 0))
  }, [remoteUsers.length, isJoined, onParticipantCountChange])

  // Agora event handlers
  const handleUserJoined = useCallback((user: any) => {
    console.log('User joined:', user.uid)
  }, [])

  const handleUserLeft = useCallback((user: any) => {
    console.log('User left:', user.uid)
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
    
    // Clean up video container
    const playerContainer = document.getElementById(`player-${user.uid}`)
    if (playerContainer) {
      playerContainer.remove()
    }
    
    delete remoteUsersRef.current[user.uid]
  }, [])

  const handleUserPublished = useCallback(async (user: any, mediaType: string) => {
    if (!clientRef.current) return

    try {
      await clientRef.current.subscribe(user, mediaType)
      console.log(`Subscribed to ${user.uid} ${mediaType}`)

      if (mediaType === 'video') {
        // Create video container
        const remoteVideosContainer = document.getElementById('remote-videos-container')
        if (remoteVideosContainer) {
          let playerContainer = document.getElementById(`player-${user.uid}`)
          
          if (!playerContainer) {
            playerContainer = document.createElement('div')
            playerContainer.id = `player-${user.uid}`
            playerContainer.className = 'relative aspect-video bg-gray-900 rounded-lg overflow-hidden'
            
            // Add user label
            const userLabel = document.createElement('div')
            userLabel.className = 'absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm z-10'
            userLabel.textContent = user.uid.includes('admin') ? t('Hôte', 'Host') : t('Participant', 'Participant')
            playerContainer.appendChild(userLabel)
            
            remoteVideosContainer.appendChild(playerContainer)
          }
          
          user.videoTrack.play(playerContainer)
        }
      }

      if (mediaType === 'audio') {
        user.audioTrack.play()
      }

      remoteUsersRef.current[user.uid] = user
      setRemoteUsers(prev => {
        const existing = prev.find(u => u.uid === user.uid)
        if (existing) {
          return prev.map(u => u.uid === user.uid ? { ...u, [mediaType + 'Track']: user[mediaType + 'Track'] } : u)
        } else {
          return [...prev, { uid: user.uid, [mediaType + 'Track']: user[mediaType + 'Track'] }]
        }
      })

    } catch (error) {
      console.error(`Failed to subscribe to ${user.uid} ${mediaType}:`, error)
    }
  }, [t])

  const handleUserUnpublished = useCallback((user: any, mediaType: string) => {
    console.log(`User unpublished ${mediaType}:`, user.uid)
    
    if (mediaType === 'video') {
      const playerContainer = document.getElementById(`player-${user.uid}`)
      if (playerContainer) {
        playerContainer.remove()
      }
    }
  }, [])

  const initializeAgora = async () => {
    if (!window.AgoraRTC || !user || !agoraLoaded) {
      setError(t("SDK Agora non disponible", "Agora SDK not available"))
      return
    }

    try {
      setConnectionStatus('connecting')
      setError(null)

      // Get RTC token
      const tokenResponse = await fetch('/api/agora/rtc/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          channelName,
          uid: `${user.role.toLowerCase()}-${user.id}-${Date.now()}`,
          role: 'publisher',
          expiry: 3600
        })
      })

      const tokenData = await tokenResponse.json()
      if (!tokenData.success) {
        throw new Error(tokenData.error?.message || 'Failed to get RTC token')
      }

      // Initialize Agora client
      clientRef.current = window.AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
      
      // Set up event handlers
      clientRef.current.on("user-published", handleUserPublished)
      clientRef.current.on("user-unpublished", handleUserUnpublished)
      clientRef.current.on("user-joined", handleUserJoined)
      clientRef.current.on("user-left", handleUserLeft)

      // Create local tracks
      localTracksRef.current.audioTrack = await window.AgoraRTC.createMicrophoneAudioTrack()
      localTracksRef.current.videoTrack = await window.AgoraRTC.createCameraVideoTrack()

      // Play local video
      const localVideoContainer = document.getElementById('local-video-container')
      if (localVideoContainer) {
        localTracksRef.current.videoTrack.play(localVideoContainer)
      }

      // Join channel
      await clientRef.current.join(
        tokenData.data.appId,
        channelName,
        tokenData.data.token,
        `${user.role.toLowerCase()}-${user.id}-${Date.now()}`
      )

      // Publish local tracks
      await clientRef.current.publish([
        localTracksRef.current.audioTrack,
        localTracksRef.current.videoTrack
      ])

      setIsJoined(true)
      setConnectionStatus('connected')
      console.log('Successfully joined Agora channel:', channelName)

    } catch (error: any) {
      console.error('Failed to initialize Agora:', error)
      setConnectionStatus('disconnected')
      setError(error.message || t("Erreur de connexion vidéo", "Video connection error"))
    }
  }

  const leaveSession = async () => {
    try {
      // Stop local tracks
      if (localTracksRef.current.audioTrack) {
        localTracksRef.current.audioTrack.stop()
        localTracksRef.current.audioTrack.close()
        localTracksRef.current.audioTrack = null
      }
      if (localTracksRef.current.videoTrack) {
        localTracksRef.current.videoTrack.stop()
        localTracksRef.current.videoTrack.close()
        localTracksRef.current.videoTrack = null
      }

      // Clear video containers
      const localVideo = document.getElementById('local-video-container')
      const remoteVideos = document.getElementById('remote-videos-container')
      if (localVideo) localVideo.innerHTML = ''
      if (remoteVideos) remoteVideos.innerHTML = ''

      // Leave channel
      if (clientRef.current && isJoined) {
        await clientRef.current.leave()
      }

      setIsJoined(false)
      setConnectionStatus('disconnected')
      setRemoteUsers([])
      remoteUsersRef.current = {}

    } catch (error) {
      console.error('Error leaving session:', error)
    }
  }

  const toggleVideo = async () => {
    if (localTracksRef.current.videoTrack) {
      await localTracksRef.current.videoTrack.setEnabled(!isVideoEnabled)
      setIsVideoEnabled(!isVideoEnabled)
    }
  }

  const toggleAudio = async () => {
    if (localTracksRef.current.audioTrack) {
      await localTracksRef.current.audioTrack.setEnabled(!isAudioEnabled)
      setIsAudioEnabled(!isAudioEnabled)
    }
  }

  // Enhanced video functions
  const toggleScreenShare = async () => {
    if (!window.AgoraRTC || !clientRef.current) return

    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenTrack = await window.AgoraRTC.createScreenVideoTrack()
        localTracksRef.current.screenTrack = screenTrack

        // Replace video track with screen track
        if (localTracksRef.current.videoTrack) {
          await clientRef.current.unpublish(localTracksRef.current.videoTrack)
        }
        await clientRef.current.publish(screenTrack)

        setIsScreenSharing(true)

        // Handle screen share end
        screenTrack.on('track-ended', () => {
          stopScreenShare()
        })
      } else {
        await stopScreenShare()
      }
    } catch (error) {
      console.error('Screen share error:', error)
      setError(t("Erreur de partage d'écran", "Screen sharing error"))
    }
  }

  const stopScreenShare = async () => {
    try {
      if (localTracksRef.current.screenTrack) {
        await clientRef.current.unpublish(localTracksRef.current.screenTrack)
        localTracksRef.current.screenTrack.close()
        localTracksRef.current.screenTrack = null
      }

      // Restore camera video
      if (localTracksRef.current.videoTrack) {
        await clientRef.current.publish(localTracksRef.current.videoTrack)
      }

      setIsScreenSharing(false)
    } catch (error) {
      console.error('Stop screen share error:', error)
    }
  }

  const toggleRecording = async () => {
    if (!isHost) return

    try {
      if (!isRecording) {
        // Start recording via API
        const response = await fetch(`/api/live-sessions/${sessionId}/recording/start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          setIsRecording(true)
          onRecordingStatusChange?.(true)
        }
      } else {
        // Stop recording via API
        const response = await fetch(`/api/live-sessions/${sessionId}/recording/stop`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          setIsRecording(false)
          onRecordingStatusChange?.(false)
        }
      }
    } catch (error) {
      console.error('Recording error:', error)
      setError(t("Erreur d'enregistrement", "Recording error"))
    }
  }

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return

    if (!isFullscreen) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised)
    // TODO: Send hand raise event via Socket.IO
  }

  const adjustVolume = (newVolume: number) => {
    setVolume(newVolume)
    // Apply volume to all remote audio tracks
    Object.values(remoteUsersRef.current).forEach((user: any) => {
      if (user.audioTrack) {
        user.audioTrack.setVolume(newVolume)
      }
    })
  }

  // Auto-hide controls
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    setShowControls(true)
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveSession()
    }
  }, [])

  return (
    <div
      ref={videoContainerRef}
      className={`relative ${className}`}
      onMouseMove={resetControlsTimeout}
      onMouseEnter={() => setShowControls(true)}
    >
      <Card className="h-full">
        <CardContent className="p-4 h-full flex flex-col">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {/* Enhanced Status Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
              {connectionStatus === 'connected' ? t('Connecté', 'Connected') :
               connectionStatus === 'connecting' ? t('Connexion...', 'Connecting...') :
               t('Déconnecté', 'Disconnected')}
            </Badge>
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                <Circle className="h-2 w-2 mr-1 fill-current" />
                {t('REC', 'REC')}
              </Badge>
            )}
            {isScreenSharing && (
              <Badge variant="secondary">
                <Monitor className="h-3 w-3 mr-1" />
                {t('Partage', 'Sharing')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {remoteUsers.length + (isJoined ? 1 : 0)}
            </Badge>
            {isHandRaised && (
              <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
                <Hand className="h-3 w-3 mr-1" />
                {t('Main levée', 'Hand raised')}
              </Badge>
            )}
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 relative">
          <div className={`grid gap-4 h-full ${remoteUsers.length === 0 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {/* Local Video */}
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <div id="local-video-container" className="w-full h-full"></div>
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {t("Vous", "You")} ({user?.role === 'ADMIN' ? t('Hôte', 'Host') : t('Participant', 'Participant')})
            </div>
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Remote Videos Container */}
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <div id="remote-videos-container" className="w-full h-full grid gap-2 p-2"></div>
            {remoteUsers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t("En attente d'autres participants...", "Waiting for other participants...")}</p>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div
          className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ${
            showControls || !isJoined ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-3">
            {/* Basic Controls */}
            <Button
              variant={isAudioEnabled ? "secondary" : "destructive"}
              size="sm"
              onClick={toggleAudio}
              disabled={!isJoined}
              className="rounded-full w-10 h-10 p-0"
            >
              {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>

            <Button
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="sm"
              onClick={toggleVideo}
              disabled={!isJoined}
              className="rounded-full w-10 h-10 p-0"
            >
              {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>

            {/* Enhanced Controls */}
            <Button
              variant={isScreenSharing ? "default" : "secondary"}
              size="sm"
              onClick={toggleScreenShare}
              disabled={!isJoined}
              className="rounded-full w-10 h-10 p-0"
            >
              {isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
            </Button>

            {isHost && (
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                size="sm"
                onClick={toggleRecording}
                disabled={!isJoined}
                className="rounded-full w-10 h-10 p-0"
              >
                {isRecording ? <Square className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              </Button>
            )}

            <Button
              variant={isHandRaised ? "default" : "secondary"}
              size="sm"
              onClick={toggleHandRaise}
              disabled={!isJoined}
              className="rounded-full w-10 h-10 p-0"
            >
              <Hand className="h-4 w-4" />
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={toggleFullscreen}
              className="rounded-full w-10 h-10 p-0"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>

            {/* Join/Leave Button */}
            {!isJoined ? (
              <Button
                size="sm"
                onClick={initializeAgora}
                disabled={connectionStatus === 'connecting' || !agoraLoaded}
                className="bg-green-600 hover:bg-green-700 rounded-full px-4"
              >
                {connectionStatus === 'connecting' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Video className="h-4 w-4 mr-2" />
                )}
                {t("Rejoindre", "Join")}
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={leaveSession}
                className="rounded-full px-4"
              >
                <Phone className="h-4 w-4 mr-2" />
                {t("Quitter", "Leave")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VideoGrid } from "@/components/video-grid"
import { ChatPanel } from "@/components/chat-panel"
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  MessageSquare, 
  X,
  Monitor,
  MonitorOff,
  PenTool,
  Square,
  Circle,
  Hand,
  MoreVertical,
  Send
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { apiClient } from "@/lib/api-client"

// Dynamic import for AgoraRTC to avoid SSR issues
let AgoraRTC: any = null
if (typeof window !== 'undefined') {
  import("agora-rtc-sdk-ng").then((module) => {
    AgoraRTC = module.default
  })
}

interface OneOnOneVideoCallProps {
  contactId?: string
  contactName?: string
  contactRole?: string
  sessionId?: string
  onEndCall: () => void
  userRole?: string
  userId?: string
  userName?: string
  userProfileImage?: string
}

interface Participant {
  id: string
  name: string
  isMuted: boolean
  isVideoOn: boolean
  isPresenting: boolean
  hasHandRaised: boolean
  profilePicture?: string
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: Date
  isSystemMessage?: boolean
}

export function OneOnOneVideoCall({ 
  contactId, 
  contactName, 
  contactRole, 
  sessionId,
  onEndCall,
  userRole,
  userId,
  userName,
  userProfileImage
}: OneOnOneVideoCallProps) {
  const { user: authUser } = useAuth()
  
  // Use props if available, otherwise fall back to auth user
  const user = authUser || {
    id: userId || '',
    firstName: userName?.split(' ')[0] || '',
    lastName: userName?.split(' ').slice(1).join(' ') || '',
    role: userRole || 'USER',
    profileImage: userProfileImage || ''
  }
  
  // Video call states
  const [isMicOn, setIsMicOn] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [deviceError, setDeviceError] = useState<string | null>(null)
  const [hasAudioDevice, setHasAudioDevice] = useState(true)
  const [hasVideoDevice, setHasVideoDevice] = useState(true)
  
  // Group session features
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [localScreenTrack, setLocalScreenTrack] = useState<any>(null)
  const [isHandRaised, setIsHandRaised] = useState(false)
  
  // Chat functionality
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [newChatMessage, setNewChatMessage] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  
  // Agora related states
  const [agoraClient, setAgoraClient] = useState<any>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null)
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null)
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<any>(null)
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null)
  const [isAgoraInitialized, setIsAgoraInitialized] = useState(false)
  
  // Participants
  const [participants, setParticipants] = useState<Participant[]>([])
  
  // Refs
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)

  // Check if user has permission to call this contact
  const canInitiateCall = useCallback(() => {
    if (!user || !contactRole) return false
    
    // Admin can call anyone
    if (user.role === 'ADMIN') return true
    
    // Managers can call students and other managers
    if (user.role === 'SENIOR_MANAGER' || user.role === 'JUNIOR_MANAGER') {
      return contactRole === 'STUDENT' || contactRole === 'SENIOR_MANAGER' || contactRole === 'JUNIOR_MANAGER'
    }
    
    // Students can only call admins and managers
    if (user.role === 'STUDENT') {
      return contactRole === 'ADMIN' || contactRole === 'SENIOR_MANAGER' || contactRole === 'JUNIOR_MANAGER'
    }
    
    return false
  }, [user, contactRole])

  // Initialize Agora and join channel
  useEffect(() => {
    const initAgora = async () => {
      if ((!contactId && !sessionId) || !user?.id || isAgoraInitialized || typeof window === 'undefined') return

      // Check permissions
      if (contactId && !canInitiateCall()) {
        alert("Vous n'avez pas l'autorisation d'appeler cette personne.")
        onEndCall()
        return
      }

      try {
        setIsConnecting(true)
        console.log("Initializing one-on-one Agora call...")
        
        // Wait for AgoraRTC to be loaded
        if (!AgoraRTC) {
          const agoraModule = await import("agora-rtc-sdk-ng")
          AgoraRTC = agoraModule.default
        }

        // Create Agora client with unique configuration
        const client = AgoraRTC.createClient({ 
          mode: "rtc", 
          codec: "vp8",
          // Add unique client configuration to prevent conflicts
          clientId: `one-on-one-${user.id}-${Date.now()}`
        })
        setAgoraClient(client)

        // Generate unique UID for this user per session
        const uniqueUid = `${user.id}-${Date.now()}`

        // Get Agora token from backend
        const channelName = sessionId ? `session-${sessionId}` : `one-on-one-${user.id}-${contactId}`
        const tokenResponse = await apiClient.post(`/agora/rtc/token`, {
          channelName,
          role: "publisher",
          uid: uniqueUid,
        })

        if (!tokenResponse.success || !tokenResponse.data) {
          throw new Error("Failed to get Agora RTC token")
        }

        const tokenData = tokenResponse.data as { token: string }
        const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "dddd690283894422ac4f4336bac4a325"

        if (!APP_ID || APP_ID === "your-agora-app-id-here") {
          console.warn("⚠️ Agora App ID not configured")
          return
        }

        // Join channel first
        await client.join(APP_ID, channelName, tokenData.token, uniqueUid)
        console.log("✅ Successfully joined Agora channel")
        
        // Try to create tracks, but continue even if devices are not available
        let audioTrack = null
        let videoTrack = null
        
        // Try to create audio track
        try {
          console.log("Attempting to create audio track...")
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
            encoderConfig: "music_standard"
          })
          console.log("✅ Audio track created")
          setHasAudioDevice(true)
        } catch (audioError: any) {
          console.warn("⚠️ Could not create audio track:", audioError.message)
          setHasAudioDevice(false)
          // Continue without audio - don't log as error since it's expected
        }
        
        // Try to create video track
        try {
          console.log("Attempting to create video track...")
          videoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: "720p_1"
          })
          console.log("✅ Video track created")
          setHasVideoDevice(true)
        } catch (videoError: any) {
          console.warn("⚠️ Could not create video track:", videoError.message)
          setHasVideoDevice(false)
          // Continue without video - don't log as error since it's expected
        }
        
        // Set tracks (even if null)
        setLocalAudioTrack(audioTrack)
        setLocalVideoTrack(videoTrack)
        
        // Publish tracks (only if they exist)
        const tracksToPublish = []
        if (audioTrack) tracksToPublish.push(audioTrack)
        if (videoTrack) tracksToPublish.push(videoTrack)
        
        if (tracksToPublish.length > 0) {
          await client.publish(tracksToPublish)
          console.log("✅ Tracks published successfully")
        } else {
          console.log("ℹ️ No tracks to publish - continuing without audio/video")
        }
        
        // Set up event listeners
        client.on("user-published", async (user: any, mediaType: string) => {
          await client.subscribe(user, mediaType)
          
          if (mediaType === "video") {
            setRemoteVideoTrack(user.videoTrack)
          }
          if (mediaType === "audio") {
            setRemoteAudioTrack(user.audioTrack)
            user.audioTrack.play()
          }
        })

        client.on("user-unpublished", (user: any, mediaType: string) => {
          if (mediaType === "video") {
            setRemoteVideoTrack(null)
          }
          if (mediaType === "audio") {
            setRemoteAudioTrack(null)
          }
        })

        // Listen for data stream messages (chat)
        client.on("stream-message", (uid: any, data: any) => {
          try {
            const message = JSON.parse(data.text)
            if (message.type === 'chat-message') {
              console.log("Received chat message:", message.data)
              setChatMessages(prev => [...prev, message.data])
            }
          } catch (error) {
            console.warn("Failed to parse stream message:", error)
          }
        })

        // Update participants
        setParticipants([
          {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            isMuted: !isMicOn,
            isVideoOn: isVideoOn,
            isPresenting: false,
            hasHandRaised: false,
            profilePicture: user.profileImage
          },
          {
            id: contactId || 'unknown',
            name: contactName || 'Unknown',
            isMuted: true,
            isVideoOn: false,
            isPresenting: false,
            hasHandRaised: false
          }
        ])

        setIsAgoraInitialized(true)
        setIsConnected(true)
        setIsConnecting(false)
        
        // Play local video
        if (localVideoRef.current && localVideoTrack) {
          localVideoTrack.play(localVideoRef.current)
        }

        console.log("One-on-one call started successfully")
        
      } catch (error) {
        console.error("Failed to initialize Agora call:", error)
        setIsConnecting(false)
        // Show error to user
        alert("Failed to start video call. Please try again.")
      }
    }

    initAgora()

    // Cleanup on unmount
    return () => {
      if (agoraClient) {
        agoraClient.leave()
      }
      if (localAudioTrack) {
        localAudioTrack.close()
      }
      if (localVideoTrack) {
        localVideoTrack.close()
      }
    }
  }, [contactId, user?.id, isAgoraInitialized])

  // Cleanup effect to prevent UID conflicts
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (agoraClient) {
        agoraClient.leave().catch(console.warn)
      }
      if (localAudioTrack) {
        localAudioTrack.close()
      }
      if (localVideoTrack) {
        localVideoTrack.close()
      }
    }
  }, [agoraClient, localAudioTrack, localVideoTrack])

  // Handle video track changes
  useEffect(() => {
    if (remoteVideoTrack && remoteVideoRef.current) {
      remoteVideoTrack.play(remoteVideoRef.current)
    }
  }, [remoteVideoTrack])

  // Toggle microphone
  const toggleMic = async () => {
    if (!hasAudioDevice || !localAudioTrack) {
      console.warn("No audio track available")
      return
    }
    
    try {
      if (isMicOn) {
        await localAudioTrack.setEnabled(false)
        setIsMicOn(false)
        console.log("Microphone muted")
      } else {
        await localAudioTrack.setEnabled(true)
        setIsMicOn(true)
        console.log("Microphone unmuted")
      }
    } catch (error) {
      console.error("Error toggling microphone:", error)
    }
  }

  // Toggle video
  const toggleVideo = async () => {
    if (!hasVideoDevice || !localVideoTrack) {
      console.warn("No video track available")
      return
    }
    
    try {
      if (isVideoOn) {
        await localVideoTrack.setEnabled(false)
        setIsVideoOn(false)
        console.log("Video turned off")
      } else {
        await localVideoTrack.setEnabled(true)
        setIsVideoOn(true)
        console.log("Video turned on")
      }
    } catch (error) {
      console.error("Error toggling video:", error)
    }
  }

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (!agoraClient) return

    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (localScreenTrack) {
          await agoraClient.unpublish([localScreenTrack])
          localScreenTrack.close()
          setLocalScreenTrack(null)
        }
        setIsScreenSharing(false)
        console.log("Screen sharing stopped")
      } else {
        // Start screen sharing with proper error handling
        try {
          const screenTrack = await AgoraRTC.createScreenVideoTrack({
            encoderConfig: "1080p_1"
          })
          
          await agoraClient.publish([screenTrack])
          setLocalScreenTrack(screenTrack)
          setIsScreenSharing(true)
          console.log("Screen sharing started")
        } catch (screenError: any) {
          if (screenError.name === 'NotAllowedError') {
            console.warn("Screen sharing permission denied by user")
            alert("Screen sharing permission was denied. Please allow screen sharing in your browser settings and try again.")
          } else if (screenError.name === 'NotFoundError') {
            console.warn("Screen sharing not supported on this device")
            alert("Screen sharing is not supported on this device.")
          } else {
            console.error("Screen sharing error:", screenError)
            alert("Failed to start screen sharing. Please try again.")
          }
        }
      }
    } catch (error: any) {
      console.error("Error toggling screen share:", error)
    }
  }

  // Toggle recording
  const toggleRecording = async () => {
    try {
      if (isRecording) {
        // Stop recording
        setIsRecording(false)
        console.log("Recording stopped")
      } else {
        // Start recording
        setIsRecording(true)
        console.log("Recording started")
      }
    } catch (error) {
      console.error("Error toggling recording:", error)
    }
  }

  // Toggle hand raise
  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised)
    console.log(`Hand ${isHandRaised ? 'lowered' : 'raised'}`)
  }

  // Fetch chat messages
  const fetchChatMessages = useCallback(async () => {
    if (!sessionId) return
    
    try {
      const response = await apiClient.get(`/messages/session/${sessionId}/chat`)
      if (response.success && response.data) {
        setChatMessages(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      console.error('Failed to fetch chat messages:', error)
    }
  }, [sessionId])

  // Send chat message
  const sendChatMessage = useCallback(async (message: string) => {
    if (!sessionId || !message.trim() || isSendingMessage) return
    
    try {
      setIsSendingMessage(true)
      
      const response = await apiClient.post(`/messages/session/${sessionId}/chat`, {
        message: message.trim()
      })
      
      if (response.success && response.data) {
        setChatMessages(prev => [...prev, response.data])
        setNewChatMessage('')
      }
    } catch (error) {
      console.error('Failed to send chat message:', error)
    } finally {
      setIsSendingMessage(false)
    }
  }, [sessionId, isSendingMessage])

  // Load chat messages when component mounts
  useEffect(() => {
    if (sessionId) {
      fetchChatMessages()
    }
  }, [sessionId, fetchChatMessages])

  // End call
  const endCall = async () => {
    try {
      console.log("Ending one-on-one video call...")
      
      if (agoraClient) {
        // Unpublish tracks first
        if (localAudioTrack) {
          try {
            await agoraClient.unpublish([localAudioTrack])
            localAudioTrack.close()
            console.log("Audio track closed")
          } catch (error) {
            console.warn("Error closing audio track:", error)
          }
        }
        if (localVideoTrack) {
          try {
            await agoraClient.unpublish([localVideoTrack])
            localVideoTrack.close()
            console.log("Video track closed")
          } catch (error) {
            console.warn("Error closing video track:", error)
          }
        }
        if (localScreenTrack) {
          try {
            await agoraClient.unpublish([localScreenTrack])
            localScreenTrack.close()
            console.log("Screen track closed")
          } catch (error) {
            console.warn("Error closing screen track:", error)
          }
        }
        
        // Leave channel
        try {
          await agoraClient.leave()
          console.log("Left Agora channel")
        } catch (error) {
          console.warn("Error leaving channel:", error)
        }
        
        // Release Agora client
        try {
          agoraClient.removeAllListeners()
        } catch (error) {
          console.warn("Error removing listeners:", error)
        }
      }
      
      // Reset all states
      setAgoraClient(null)
      setLocalAudioTrack(null)
      setLocalVideoTrack(null)
      setLocalScreenTrack(null)
      setRemoteAudioTrack(null)
      setRemoteVideoTrack(null)
      setIsAgoraInitialized(false)
      setIsConnected(false)
      setIsConnecting(false)
      setDeviceError(null)
      setHasAudioDevice(true)
      setHasVideoDevice(true)
      setIsScreenSharing(false)
      setIsWhiteboardOpen(false)
      setIsRecording(false)
      setIsHandRaised(false)
      
      // Call onEndCall callback first
      if (onEndCall) {
        onEndCall()
      } else {
        // Fallback: role-based redirection if no callback
        const currentUser = user || authUser
        const currentUserRole = currentUser?.role || userRole
        
        // Use Next.js router if available, otherwise window.location
        if (typeof window !== 'undefined') {
          switch (currentUserRole) {
            case 'STUDENT':
            case 'USER':
              window.location.href = '/messages'
              break
            case 'ADMIN':
              window.location.href = '/admin/messages'
              break
            case 'SENIOR_MANAGER':
            case 'JUNIOR_MANAGER':
              window.location.href = '/messages'
              break
            default:
              window.location.href = '/messages'
              break
          }
        }
      }
    } catch (error) {
      console.error("Error ending call:", error)
      // Still redirect even on error
      if (onEndCall) {
        onEndCall()
      } else if (typeof window !== 'undefined') {
        window.location.href = '/messages'
      }
    }
  }

  if (isConnecting) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Connecting to {contactName}...</p>
          <p className="text-sm text-gray-500 mt-2">Requesting camera and microphone permissions...</p>
        </div>
      </div>
    )
  }

  // Show device status as a non-blocking notification instead of blocking modal
  const showDeviceWarning = !hasAudioDevice && !hasVideoDevice

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Device Warning Notification */}
      {showDeviceWarning && (
        <div className="bg-yellow-600 text-white p-3 text-center text-sm">
          <div className="flex items-center justify-center space-x-2">
            <VideoOff className="h-4 w-4" />
            <span>No microphone or camera detected. You can still join the call and use chat, whiteboard, and other features.</span>
            <Button
              onClick={() => setDeviceError(null)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-yellow-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">{(contactName || 'U')[0]}</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Call with {contactName || 'Unknown'}</h2>
            <p className="text-sm text-gray-300">
              {isConnected ? "Connected" : "Connecting..."}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={endCall}
          className="text-white hover:bg-red-600"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (Main) */}
        <div className="absolute inset-0 bg-gray-800">
          {remoteVideoTrack ? (
            <div ref={remoteVideoRef} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-medium">{(contactName || 'U')[0]}</span>
                </div>
                <p className="text-lg">{contactName || 'Unknown'}</p>
                <p className="text-sm text-gray-400">Waiting for video...</p>
                {!hasVideoDevice && (
                  <p className="text-sm text-yellow-400 mt-2">No camera detected on your device</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
          {localVideoTrack ? (
            <div ref={localVideoRef} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-700">
              <div className="text-center text-white">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-medium">You</span>
                </div>
                <p className="text-xs">Your video</p>
                {!hasVideoDevice && (
                  <p className="text-xs text-yellow-400 mt-1">No camera</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Screen Sharing Preview - Only show for teachers when sharing */}
        {isScreenSharing && (user?.role === 'ADMIN' || user?.role === 'SENIOR_MANAGER' || user?.role === 'JUNIOR_MANAGER') && (
          <div className="absolute top-4 left-4 w-64 h-48 bg-gray-800 rounded-lg border-2 border-blue-500 overflow-hidden">
            <div className="h-full w-full bg-gray-700 flex items-center justify-center">
              <div className="text-center text-white">
                <Monitor className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Screen Sharing</p>
                <p className="text-xs text-gray-400">Preview of shared content</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
          {/* Basic Controls */}
          <Button
            onClick={toggleMic}
            disabled={!hasAudioDevice}
            className={cn(
              "w-12 h-12 rounded-full",
              !hasAudioDevice ? "bg-gray-400 cursor-not-allowed" : 
              isMicOn ? "bg-gray-600 hover:bg-gray-700" : "bg-red-600 hover:bg-red-700"
            )}
            title={!hasAudioDevice ? "Microphone not available" : isMicOn ? "Mute microphone" : "Unmute microphone"}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            onClick={toggleVideo}
            disabled={!hasVideoDevice}
            className={cn(
              "w-12 h-12 rounded-full",
              !hasVideoDevice ? "bg-gray-400 cursor-not-allowed" :
              isVideoOn ? "bg-gray-600 hover:bg-gray-700" : "bg-red-600 hover:bg-red-700"
            )}
            title={!hasVideoDevice ? "Camera not available" : isVideoOn ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          {/* Screen Sharing */}
          <Button
            onClick={toggleScreenShare}
            className={cn(
              "w-12 h-12 rounded-full",
              isScreenSharing ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"
            )}
            title={isScreenSharing ? "Stop screen sharing" : "Start screen sharing"}
          >
            {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </Button>

          {/* Recording */}
          <Button
            onClick={toggleRecording}
            className={cn(
              "w-12 h-12 rounded-full",
              isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-gray-600 hover:bg-gray-700"
            )}
            title={isRecording ? "Stop recording" : "Start recording"}
          >
            <Square className="h-5 w-5" />
          </Button>

          {/* Hand Raise - Only show for students */}
          {user?.role === 'STUDENT' && (
            <Button
              onClick={toggleHandRaise}
              className={cn(
                "w-12 h-12 rounded-full",
                isHandRaised ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-600 hover:bg-gray-700"
              )}
              title={isHandRaised ? "Lower hand" : "Raise hand"}
            >
              <Hand className="h-5 w-5" />
            </Button>
          )}

          {/* Whiteboard */}
          <Button
            onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
            className={cn(
              "w-12 h-12 rounded-full",
              isWhiteboardOpen ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"
            )}
            title={isWhiteboardOpen ? "Close whiteboard" : "Open whiteboard"}
          >
            <PenTool className="h-5 w-5" />
          </Button>

          {/* Chat */}
          <Button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={cn(
              "w-12 h-12 rounded-full",
              isChatOpen ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"
            )}
            title={isChatOpen ? "Close chat" : "Open chat"}
          >
            <MessageSquare className="h-5 w-5" />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </Button>

          {/* End Call */}
          <Button
            onClick={endCall}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700"
            title="End call"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Whiteboard Panel */}
      {isWhiteboardOpen && (
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Whiteboard</h3>
              <Button
                onClick={() => setIsWhiteboardOpen(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <div className="bg-white border border-gray-300 rounded-lg h-96 relative overflow-hidden">
              <canvas
                className="w-full h-full cursor-crosshair"
                style={{ touchAction: 'none' }}
                onMouseDown={(e) => {
                  const canvas = e.currentTarget
                  const ctx = canvas.getContext('2d')
                  if (!ctx) return
                  
                  const rect = canvas.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const y = e.clientY - rect.top
                  
                  ctx.beginPath()
                  ctx.moveTo(x, y)
                  ctx.strokeStyle = '#000'
                  ctx.lineWidth = 2
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    const newX = e.clientX - rect.left
                    const newY = e.clientY - rect.top
                    ctx.lineTo(newX, newY)
                    ctx.stroke()
                  }
                  
                  const handleMouseUp = () => {
                    canvas.removeEventListener('mousemove', handleMouseMove)
                    canvas.removeEventListener('mouseup', handleMouseUp)
                  }
                  
                  canvas.addEventListener('mousemove', handleMouseMove)
                  canvas.addEventListener('mouseup', handleMouseUp)
                }}
              />
            </div>
            <div className="mt-4 flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  const canvas = document.querySelector('canvas')
                  if (canvas) {
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                      ctx.clearRect(0, 0, canvas.width, canvas.height)
                    }
                  }
                }}
              >
                Clear
              </Button>
              <Button size="sm" variant="outline">
                <PenTool className="h-4 w-4 mr-1" />
                Pen
              </Button>
              <Button size="sm" variant="outline">
                <Square className="h-4 w-4 mr-1" />
                Rectangle
              </Button>
              <Button size="sm" variant="outline">
                <Circle className="h-4 w-4 mr-1" />
                Circle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-black border-l border-gray-600">
          <div className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="bg-gray-900 text-white p-4 border-b border-gray-600 flex items-center justify-between">
              <h3 className="font-semibold">Chat</h3>
              <Button
                onClick={() => setIsChatOpen(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        message.senderId === user?.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Message Input */}
            <div className="p-4 border-t border-gray-600">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (newChatMessage.trim()) {
                    sendChatMessage(newChatMessage)
                  }
                }}
                className="flex space-x-2"
              >
                <Input
                  placeholder="Type a message..."
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  disabled={isSendingMessage}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!newChatMessage.trim() || isSendingMessage}
                >
                  {isSendingMessage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OneOnOneVideoCall

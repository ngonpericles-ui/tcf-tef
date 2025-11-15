"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { VideoGrid } from "@/components/video-grid"
import { ChatPanel } from "@/components/chat-panel"
import { SessionHeader } from "@/components/session-header"
import { Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, Hand, PhoneOff, Users } from "lucide-react"
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

interface LiveSession {
  id: string
  title: string
  instructor: string
  status: "SCHEDULED" | "LIVE" | "ENDED"
  startTime: Date
  endTime?: Date
  participantCount: number
  isRecording: boolean
}

interface Participant {
  id: string
  name: string
  isMuted: boolean
  isVideoOn: boolean
  isPresenting: boolean
  hasHandRaised: boolean
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: Date
  isSystemMessage?: boolean
}

interface StudentVideoSessionProps {
  onSessionEnd?: () => void
}

export function StudentVideoSession({ onSessionEnd }: StudentVideoSessionProps = {}) {
  const params = useParams()
  const { user } = useAuth()
  const sessionId = params?.id as string

  const [isMicOn, setIsMicOn] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [session, setSession] = useState<LiveSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Agora related states
  const [agoraClient, setAgoraClient] = useState<any>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null)
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null)
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null)
  const [isAgoraInitialized, setIsAgoraInitialized] = useState(false)
  const [isAgoraInitializing, setIsAgoraInitializing] = useState(false)
  
  // Refs for cleanup
  const agoraClientRef = useRef<any>(null)
  const localAudioTrackRef = useRef<any>(null)
  const localVideoTrackRef = useRef<any>(null)
  
  // Device detection states
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [hasMicrophone, setHasMicrophone] = useState<boolean | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [microphoneError, setMicrophoneError] = useState<string | null>(null)

  // Detect available devices
  useEffect(() => {
    const detectDevices = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const hasVideoInput = devices.some(device => device.kind === 'videoinput')
          const hasAudioInput = devices.some(device => device.kind === 'audioinput')
          
          setHasCamera(hasVideoInput)
          setHasMicrophone(hasAudioInput)
          
          if (!hasVideoInput) {
            setCameraError("No camera device found")
          }
          if (!hasAudioInput) {
            setMicrophoneError("No microphone device found")
          }
        }
      } catch (error) {
        console.error("Failed to detect devices:", error)
        setHasCamera(false)
        setHasMicrophone(false)
        setCameraError("Failed to detect camera")
        setMicrophoneError("Failed to detect microphone")
      }
    }
    
    detectDevices()
  }, [])

  // Load session data
  useEffect(() => {
    const loadSessionData = async () => {
      if (!sessionId) return

      try {
        setLoading(true)
        const response = await apiClient.get(`/live-sessions/${sessionId}`)
        
        if (response.success && response.data) {
          const sessionData = (response.data as any).session
          setSession({
            id: sessionData.id,
            title: sessionData.title || "Live Session",
            instructor: sessionData.createdBy ? `${sessionData.createdBy.firstName || ''} ${sessionData.createdBy.lastName || ''}`.trim() : "Instructor",
            status: (sessionData.status as "SCHEDULED" | "LIVE" | "ENDED") || "LIVE",
            startTime: new Date(sessionData.date),
            participantCount: sessionData._count?.participants || 0,
            isRecording: sessionData.isRecording || false
          })

          // Fetch participants
          const participantsResponse = await apiClient.get(`/live-sessions/${sessionId}/participants`)
          if (participantsResponse.success) {
            const participantsData = (participantsResponse.data as any[]) || []
            setParticipants(participantsData.map(p => ({
              id: p.id,
              name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
              isMuted: p.isMuted || false,
              isVideoOn: p.isVideoOn || false,
              isPresenting: p.isPresenting || false,
              hasHandRaised: p.hasHandRaised || false
            })))
          }

          // Fetch chat messages
          const messagesResponse = await apiClient.get(`/live-sessions/${sessionId}/messages`)
          if (messagesResponse.success) {
            const messages = (messagesResponse.data as ChatMessage[]) || []
            const messagesWithDates = messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
            setChatMessages(messagesWithDates)
          }

          setIsConnected(true)
        }
      } catch (error) {
        console.error("Failed to load session data:", error)
        setIsConnected(false)
      } finally {
        setLoading(false)
      }
    }

    loadSessionData()
  }, [sessionId])

  // Auto-refresh session data every 5 seconds
  useEffect(() => {
    if (!sessionId) return

    const refreshInterval = setInterval(async () => {
      try {
        // Refresh participants
        const participantsResponse = await apiClient.get(`/live-sessions/${sessionId}/participants`)
        if (participantsResponse.success) {
          const participantsData = (participantsResponse.data as any[]) || []
          setParticipants(participantsData.map(p => ({
            id: p.id,
            name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
            isMuted: p.isMuted || false,
            isVideoOn: p.isVideoOn || false,
            isPresenting: p.isPresenting || false,
            hasHandRaised: p.hasHandRaised || false
          })))
        }

        // Refresh messages (only update if there are new messages)
        const messagesResponse = await apiClient.get(`/live-sessions/${sessionId}/messages`)
        if (messagesResponse.success) {
          const messages = (messagesResponse.data as ChatMessage[]) || []
          const messagesWithDates = messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
          // Sort by timestamp and update only if there are new messages
          messagesWithDates.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          setChatMessages(prev => {
            // Only update if message count changed or if we have new messages
            if (prev.length !== messagesWithDates.length) {
              return messagesWithDates
            }
            // Check if any message IDs are different
            const prevIds = new Set(prev.map(m => m.id))
            const newIds = new Set(messagesWithDates.map(m => m.id))
            if (prevIds.size !== newIds.size || [...newIds].some(id => !prevIds.has(id))) {
              return messagesWithDates
            }
            return prev
          })
        }
      } catch (error) {
        console.error("Auto-refresh failed:", error)
      }
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(refreshInterval)
  }, [sessionId])

  // Cleanup: Leave session when component unmounts or user navigates away
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (sessionId && user?.id) {
        try {
          console.log("🚪 User navigating away, leaving session...")
          // Use sendBeacon for reliable cleanup on page unload
          navigator.sendBeacon(`/api/live-sessions/${sessionId}/leave`, JSON.stringify({}))
        } catch (error) {
          console.error("❌ Failed to leave session on unload:", error)
        }
      }
    }

    const handleUnload = async () => {
      if (sessionId && user?.id) {
        try {
          console.log("🚪 Component unmounting, leaving session...")
          await apiClient.post(`/live-sessions/${sessionId}/leave`)
          console.log("✅ Successfully left session on unmount")
        } catch (error) {
          console.error("❌ Failed to leave session on unmount:", error)
        }
      }
    }

    // Add event listeners for page unload
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handleUnload)

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handleUnload)
      
      // Also call leave on component unmount
      handleUnload()
    }
  }, [sessionId, user?.id])

  // Handle chat functionality
  const handleSendMessage = async (message: string) => {
    if (message.trim() && sessionId) {
      try {
        const response = await apiClient.post(`/live-sessions/${sessionId}/messages`, {
          message: message.trim()
        })
        
        if (response.success) {
          const newMessage = response.data as ChatMessage
          const messageWithDate = {
            ...newMessage,
            timestamp: new Date(newMessage.timestamp)
          }
          setChatMessages(prev => [...prev, messageWithDate])
        }
      } catch (error) {
        console.error("Failed to send message:", error)
      }
    }
  }

  // Initialize Agora RTC
  useEffect(() => {
    // Guard refs to prevent double initialization
    const initStartedRef = { current: false }
    const joiningRef = { current: false }
    const joinedRef = { current: false }
    
    const initAgora = async () => {
      if (!sessionId || !user?.id || isAgoraInitialized || isAgoraInitializing || typeof window === 'undefined') return
      if (initStartedRef.current || joiningRef.current || joinedRef.current) {
        console.log("⚠️ Agora initialization already in progress, skipping...")
        return
      }
      
      initStartedRef.current = true

      try {
        setIsAgoraInitializing(true)
        console.log("Initializing Agora RTC for student...")
        
        if (!AgoraRTC) {
          const agoraModule = await import("agora-rtc-sdk-ng")
          AgoraRTC = agoraModule.default
        }
        
        if (AgoraRTC && AgoraRTC.onAutoplayFailed) {
          AgoraRTC.onAutoplayFailed(() => {
            console.log("Autoplay failed - user interaction required")
          })
        }

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
        setAgoraClient(client)
        agoraClientRef.current = client

        // Get Agora token from backend
        const tokenResponse = await apiClient.post(`/agora/rtc/token`, {
          channelName: sessionId,
          role: "publisher",
          uid: user.id,
        })

        if (!tokenResponse.success || !tokenResponse.data) {
          throw new Error("Failed to get Agora RTC token")
        }

        const tokenData = tokenResponse.data as { token: string; uid: number; originalUid?: string | number }
        if (!tokenData.token) {
          throw new Error("No token received from server")
        }

        // Use numeric UID returned by backend (required by Agora)
        const numericUid = tokenData.uid || (typeof tokenData.originalUid === 'number' ? tokenData.originalUid : parseInt(String(tokenData.originalUid || user.id), 10))
        
        // Convert string UID to numeric if needed
        const finalNumericUid = typeof numericUid === 'number' ? numericUid : (() => {
          let hash = 0
          const uidStr = String(user.id)
          for (let i = 0; i < uidStr.length; i++) {
            const char = uidStr.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32-bit integer
          }
          return Math.abs(hash) % 2147483647
        })()

        const { token } = tokenData
        const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "dddd690283894422ac4f4336bac4a325"

        if (!APP_ID || APP_ID === "your-agora-app-id-here") {
          console.warn("⚠️ Agora App ID not configured. Please set NEXT_PUBLIC_AGORA_APP_ID in .env")
          setIsAgoraInitialized(false)
          return
        }

        console.log("Joining Agora channel:", sessionId, "with App ID:", APP_ID, "UID:", finalNumericUid)
        
        // Check if already joined
        if (joinedRef.current) {
          console.log("⚠️ Already joined, skipping join...")
          return
        }
        
        joiningRef.current = true
        try {
          await client.join(APP_ID, sessionId, token, finalNumericUid)
          joinedRef.current = true
          joiningRef.current = false
          console.log("✅ Agora client joined successfully")
          setIsAgoraInitialized(true)
          setIsAgoraInitializing(false)
          setIsConnected(true)
        } catch (joinError: any) {
          joiningRef.current = false
          if (joinError.code === 'UID_CONFLICT') {
            console.log("⚠️ UID_CONFLICT detected, leaving and rejoining...")
            try {
              await client.leave()
              await new Promise(resolve => setTimeout(resolve, 500)) // Wait before rejoining
              await client.join(APP_ID, sessionId, token, finalNumericUid)
              joinedRef.current = true
              console.log("✅ Successfully rejoined after UID_CONFLICT")
              setIsAgoraInitialized(true)
              setIsAgoraInitializing(false)
              setIsConnected(true)
            } catch (retryError) {
              console.error("❌ Failed to rejoin after UID_CONFLICT:", retryError)
              throw retryError
            }
          } else {
            throw joinError
          }
        }

        // Handle remote users
        client.on("user-published", async (user: any, mediaType: any) => {
          console.log("Remote user published:", user.uid, mediaType)
          try {
            await client.subscribe(user, mediaType)
            
            if (mediaType === "video") {
              const remoteVideoTrack = user.videoTrack
              if (remoteVideoTrack) {
                const remoteVideoContainer = document.createElement("div")
                remoteVideoContainer.id = `remote-video-${user.uid}`
                remoteVideoContainer.style.width = "100%"
                remoteVideoContainer.style.height = "100%"
                
                const videoGrid = document.querySelector('.grid')
                if (videoGrid) {
                  videoGrid.appendChild(remoteVideoContainer)
                  remoteVideoTrack.play(remoteVideoContainer)
                }
              }
            }
            
            if (mediaType === "audio") {
              const remoteAudioTrack = user.audioTrack
              if (remoteAudioTrack) {
                remoteAudioTrack.play()
              }
            }
          } catch (error) {
            console.error("Failed to handle remote user:", error)
          }
        })

        client.on("user-unpublished", (user: any, mediaType: any) => {
          console.log("Remote user unpublished:", user.uid, mediaType)
          if (mediaType === "video") {
            const remoteVideoContainer = document.getElementById(`remote-video-${user.uid}`)
            if (remoteVideoContainer) {
              remoteVideoContainer.remove()
            }
          }
        })
        
        // Handle existing users in channel (users who joined before us)
        const existingUsers = client.remoteUsers || []
        if (existingUsers.length > 0) {
          console.log(`👥 Found ${existingUsers.length} existing users in channel`)
          for (const remoteUser of existingUsers) {
            try {
              if (remoteUser.hasVideo) {
                await client.subscribe(remoteUser, "video")
                const remoteVideoTrack = remoteUser.videoTrack
                if (remoteVideoTrack) {
                  const remoteVideoContainer = document.createElement("div")
                  remoteVideoContainer.id = `remote-video-${remoteUser.uid}`
                  remoteVideoContainer.style.width = "100%"
                  remoteVideoContainer.style.height = "100%"
                  
                  const videoGrid = document.querySelector('.grid')
                  if (videoGrid) {
                    videoGrid.appendChild(remoteVideoContainer)
                    remoteVideoTrack.play(remoteVideoContainer)
                  }
                }
              }
              if (remoteUser.hasAudio) {
                await client.subscribe(remoteUser, "audio")
                const remoteAudioTrack = remoteUser.audioTrack
                if (remoteAudioTrack) {
                  remoteAudioTrack.play()
                }
              }
            } catch (error) {
              console.error("Failed to subscribe to existing user:", error)
            }
          }
        }

      } catch (error) {
        console.error("Failed to initialize Agora:", error)
        initStartedRef.current = false
        joiningRef.current = false
        joinedRef.current = false
        setIsAgoraInitialized(false)
        setIsAgoraInitializing(false)
      }
    }

    const timer = setTimeout(initAgora, 1000)
    
    return () => {
      clearTimeout(timer)
      const cleanupAgora = async () => {
        try {
          // Use refs for cleanup to avoid stale closures
          if (localAudioTrackRef.current) {
            localAudioTrackRef.current.close()
            localAudioTrackRef.current = null
            setLocalAudioTrack(null)
          }
          if (localVideoTrackRef.current) {
            localVideoTrackRef.current.close()
            localVideoTrackRef.current = null
            setLocalVideoTrack(null)
            setLocalVideoStream(null)
          }
          if (agoraClientRef.current) {
            try {
              // Only leave if we actually joined
              if (agoraClientRef.current.connectionState !== 'DISCONNECTED') {
                await agoraClientRef.current.leave()
              }
            } catch (leaveError) {
              console.warn("Error leaving channel:", leaveError)
            }
            agoraClientRef.current = null
            setAgoraClient(null)
            console.log("✅ Agora client left channel")
          }
          // Reset guard refs
          initStartedRef.current = false
          joiningRef.current = false
          joinedRef.current = false
          setIsAgoraInitialized(false)
          setIsAgoraInitializing(false)
        } catch (error) {
          console.error("Error during Agora cleanup:", error)
        }
      }
      cleanupAgora()
    }
  }, [sessionId, user?.id, isAgoraInitialized, isAgoraInitializing])

  // Handle participant management
  const handleMuteToggle = async () => {
    try {
      if (!AgoraRTC || !agoraClientRef.current || !isAgoraInitialized) {
        console.warn("Agora not initialized, cannot toggle microphone")
        return
      }
      
      if (!isMicOn && !localAudioTrackRef.current) {
        // Create audio track
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
        localAudioTrackRef.current = audioTrack
        setLocalAudioTrack(audioTrack)
        if (agoraClientRef.current.connectionState === 'CONNECTED') {
          await agoraClientRef.current.publish([audioTrack])
          console.log("✅ Student microphone track published")
        }
        setIsMicOn(true)
      } else if (localAudioTrackRef.current) {
        // Toggle mute
        await localAudioTrackRef.current.setMuted(isMicOn)
        setIsMicOn(!isMicOn)
        console.log("Student microphone toggled:", !isMicOn)
      }
    } catch (error: any) {
      console.error("Failed to toggle microphone:", error)
      if (error.code !== 'DEVICE_NOT_FOUND') {
        // Only show error if it's not a device not found error
        alert(`Failed to toggle microphone: ${error.message || error}`)
      }
    }
  }

  const handleVideoToggle = async () => {
    try {
      if (!AgoraRTC || !agoraClientRef.current || !isAgoraInitialized) {
        console.warn("Agora not initialized, cannot toggle video")
        return
      }
      
      if (!isVideoOn && !localVideoTrackRef.current) {
        // Create video track
        const videoTrack = await AgoraRTC.createCameraVideoTrack()
        localVideoTrackRef.current = videoTrack
        setLocalVideoTrack(videoTrack)
        
        // Create MediaStream from track for preview
        if (videoTrack.getMediaStreamTrack) {
          const stream = new MediaStream([videoTrack.getMediaStreamTrack()])
          setLocalVideoStream(stream)
        }
        
        if (agoraClientRef.current.connectionState === 'CONNECTED') {
          await agoraClientRef.current.publish([videoTrack])
          console.log("✅ Student video track published")
        }
        setIsVideoOn(true)
      } else if (localVideoTrackRef.current) {
        // Toggle video
        await localVideoTrackRef.current.setMuted(isVideoOn)
        setIsVideoOn(!isVideoOn)
        console.log("Student video toggled:", !isVideoOn)
      }
    } catch (error: any) {
      console.error("Failed to toggle video:", error)
      if (error.code !== 'DEVICE_NOT_FOUND') {
        // Only show error if it's not a device not found error
        alert(`Failed to toggle video: ${error.message || error}`)
      }
    }
  }

  const handleHandRaise = async () => {
    try {
      const newHandRaiseState = !isHandRaised
      setIsHandRaised(newHandRaiseState)
      // Update hand raise status via API
      if (sessionId) {
        await apiClient.put(`/live-sessions/${sessionId}/hand-raise`, {
          raised: newHandRaiseState
        })
      }
    } catch (error) {
      console.error("Failed to update hand raise:", error)
    }
  }

  const handleLeaveSession = async () => {
    try {
      // Call the backend to unregister from session
      if (sessionId && user?.id) {
        console.log("🚪 Leaving session...")
        await apiClient.post(`/live-sessions/${sessionId}/leave`)
        console.log("✅ Successfully left session")
      }
    } catch (error) {
      console.error("❌ Failed to leave session:", error)
    }

    // Call the onSessionEnd callback if provided
    if (onSessionEnd) {
      onSessionEnd()
    } else {
      // Fallback to home page
      window.location.href = "/"
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background dark">
      <SessionHeader 
        title={session?.title}
        instructor={session?.instructor}
        participantCount={session?.participantCount}
        isRecording={session?.isRecording}
        sessionStatus={session?.status}
        startTime={session?.startTime}
        currentUserRole="STUDENT"
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <VideoGrid 
            role="student" 
            participants={participants}
            localVideoStream={localVideoStream}
            isVideoOn={isVideoOn}
            hasCamera={hasCamera}
            cameraError={cameraError}
          />

          {/* Control Bar */}
          <div className="bg-card border-t border-border p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={isMicOn ? "default" : "destructive"}
                  size="lg"
                  className="rounded-full w-12 h-12 p-0"
                  onClick={handleMuteToggle}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
                <Button
                  variant={isVideoOn ? "default" : "destructive"}
                  size="lg"
                  className="rounded-full w-12 h-12 p-0"
                  onClick={handleVideoToggle}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="lg" className="gap-2">
                  <MonitorUp className="w-5 h-5" />
                  <span className="hidden sm:inline">Share Screen</span>
                </Button>

                <Button
                  variant={isHandRaised ? "default" : "secondary"}
                  size="lg"
                  className={cn("gap-2", isHandRaised && "bg-accent hover:bg-accent/90")}
                  onClick={handleHandRaise}
                >
                  <Hand className="w-5 h-5" />
                  <span className="hidden sm:inline">{isHandRaised ? "Lower Hand" : "Raise Hand"}</span>
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  className="gap-2 relative"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="hidden sm:inline">Chat</span>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </Button>

                <Button variant="secondary" size="lg" className="gap-2">
                  <Users className="w-5 h-5" />
                  <span className="hidden sm:inline">{session?.participantCount || 0}</span>
                </Button>
              </div>

              <Button 
                variant="destructive" 
                size="lg" 
                className="rounded-full w-12 h-12 p-0"
                onClick={handleLeaveSession}
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {isChatOpen && (
          <ChatPanel 
            onClose={() => setIsChatOpen(false)} 
            messages={chatMessages}
            currentUserId={user?.id}
            onSendMessage={handleSendMessage}
            isConnected={isConnected}
          />
        )}
      </div>
    </div>
  )
}

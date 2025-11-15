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
  Send,
  User
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
  const [isAgoraInitializing, setIsAgoraInitializing] = useState(false)
  
  // Participants
  const [participants, setParticipants] = useState<Participant[]>([])
  
  // Refs for preventing double initialization
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  const initStartedRef = useRef(false)
  const joiningRef = useRef(false)
  const joinedRef = useRef(false)
  const agoraClientRef = useRef<any>(null)
  const dataStreamIdRef = useRef<number | null>(null)

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
      // Guard against double initialization
      if ((!contactId && !sessionId) || !user?.id || isAgoraInitialized || isAgoraInitializing || typeof window === 'undefined') {
        return
      }

      // React Strict Mode protection
      if (initStartedRef.current) {
        console.log("⚠️ Initialization already started, skipping...")
        return
      }

      // Check permissions ONLY when initiating a new call (not when joining an existing session)
      // When sessionId is provided, it means the user was invited and has permission to join
      if (contactId && !sessionId && !canInitiateCall()) {
        alert("Vous n'avez pas l'autorisation d'appeler cette personne.")
        onEndCall()
        return
      }

      // Mark initialization as started
      initStartedRef.current = true
      setIsAgoraInitializing(true)

      try {
        setIsConnecting(true)
        console.log("Initializing one-on-one Agora call...")
        
        // Wait for AgoraRTC to be loaded
        if (!AgoraRTC) {
          const agoraModule = await import("agora-rtc-sdk-ng")
          AgoraRTC = agoraModule.default
        }

        // Helper function to convert string UID to numeric UID (same as backend)
        const stringToNumericUid = (str: string): number => {
          let hash = 0
          for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32-bit integer
          }
          // Ensure positive number and within Agora's valid range (0 to 2^32-1)
          return Math.abs(hash) % 2147483647
        }

        // Clean up any existing client first
        if (agoraClientRef.current) {
          try {
            await agoraClientRef.current.leave()
            agoraClientRef.current = null
          } catch (e) {
            console.warn("Error cleaning up existing client:", e)
          }
        }

        // Create Agora client with unique configuration
        const client = AgoraRTC.createClient({ 
          mode: "rtc", 
          codec: "vp8"
        })
        setAgoraClient(client)
        agoraClientRef.current = client

        // Generate consistent UID for this user (deterministic based on user ID and session)
        // This ensures the same user always gets the same UID for the same session
        const uidString = sessionId ? `${user.id}-${sessionId}` : `${user.id}-${contactId || 'call'}`
        const numericUid = stringToNumericUid(uidString)

        // Get Agora token from backend
        const channelName = sessionId ? `session-${sessionId}` : `one-on-one-${user.id}-${contactId}`
        const tokenResponse = await apiClient.post(`/agora/rtc/token`, {
          channelName,
          role: "publisher",
          uid: uidString, // Send string, backend will convert to numeric
        })

        if (!tokenResponse.success || !tokenResponse.data) {
          throw new Error("Failed to get Agora RTC token")
        }

        const tokenData = tokenResponse.data as { token: string; uid?: number }
        const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "dddd690283894422ac4f4336bac4a325"

        if (!APP_ID || APP_ID === "your-agora-app-id-here") {
          console.warn("⚠️ Agora App ID not configured")
          return
        }

        // Use numeric UID from response if available, otherwise use our calculated one
        const finalNumericUid = tokenData.uid || numericUid
        console.log(`🔢 Joining with numeric UID: ${finalNumericUid} (from string: ${uidString})`)

        // Guard against multiple join attempts
        if (joiningRef.current) {
          console.warn("⚠️ Already joining, skipping duplicate join attempt")
          return
        }
        if (joinedRef.current) {
          console.warn("⚠️ Already joined, skipping duplicate join attempt")
          return
        }

        joiningRef.current = true

        // Join channel with NUMERIC UID (required by Agora)
        try {
          await client.join(APP_ID, channelName, tokenData.token, finalNumericUid)
          console.log("✅ Successfully joined Agora channel")
          joinedRef.current = true
          joiningRef.current = false
        } catch (joinError: any) {
          joiningRef.current = false
          if (joinError?.code === 'UID_CONFLICT') {
            console.log("⚠️ UID conflict detected, leaving and rejoining...")
            try {
              await client.leave()
              // Wait a bit before rejoining
              await new Promise(resolve => setTimeout(resolve, 500))
              await client.join(APP_ID, channelName, tokenData.token, finalNumericUid)
              console.log("✅ Successfully rejoined Agora channel after UID conflict")
              joinedRef.current = true
            } catch (retryError) {
              console.error("❌ Failed to rejoin after UID conflict:", retryError)
              throw retryError
            }
          } else {
            throw joinError
          }
        }
        
        // Wait for connection to be fully established
        let connectionWaitCount = 0
        const maxWaitCount = 15 // Wait up to 7.5 seconds (15 * 500ms)
        while (client.connectionState !== 'CONNECTED' && connectionWaitCount < maxWaitCount) {
          await new Promise(resolve => setTimeout(resolve, 500))
          connectionWaitCount++
          const currentState = client.connectionState
          console.log(`⏳ Waiting for connection... (${connectionWaitCount}/${maxWaitCount}) State: ${currentState}`)
          
          // If we're stuck in DISCONNECTING or FAILED, break early
          if (currentState === 'DISCONNECTING' || currentState === 'FAILED') {
            console.warn(`⚠️ Connection in ${currentState} state, breaking wait loop`)
            break
          }
        }
        
        // Check final connection state
        const finalState = client.connectionState
        if (finalState === 'CONNECTED') {
          setIsConnected(true)
          setIsConnecting(false)
          console.log("✅ Connection fully established")
        } else {
          // Still mark as connected if we successfully joined (join succeeded)
          // The connection state might stabilize after join
          setIsConnected(true)
          setIsConnecting(false)
          console.warn(`⚠️ Connection state is ${finalState} after join, but join succeeded - connection may stabilize`)
          
          // Set up a listener to update when connection actually becomes CONNECTED
          const stateListener = (curState: string) => {
            if (curState === 'CONNECTED') {
              console.log("✅ Connection state updated to CONNECTED")
              setIsConnected(true)
              client.off("connection-state-change", stateListener)
            }
          }
          client.on("connection-state-change", stateListener)
        }
        
        // Try to create tracks, but continue even if devices are not available
        let audioTrack = null
        let videoTrack = null
        
        // Try to create audio track (silently handle device not found - it's normal)
        try {
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
            encoderConfig: "music_standard"
          })
          setHasAudioDevice(true)
        } catch (audioError: any) {
          // Silently handle device not found - it's expected and normal
          // Only log unexpected errors
          if (audioError?.code !== 'DEVICE_NOT_FOUND' && audioError?.name !== 'NotFoundError') {
            console.warn("⚠️ Could not create audio track:", audioError.message)
          }
          // Suppress DEVICE_NOT_FOUND errors completely - they're normal
          setHasAudioDevice(false)
          // Continue without audio
        }
        
        // Try to create video track (silently handle device not found - it's normal)
        try {
          videoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: "720p_1"
          })
          setHasVideoDevice(true)
        } catch (videoError: any) {
          // Silently handle device not found - it's expected and normal
          // Only log unexpected errors
          if (videoError?.code !== 'DEVICE_NOT_FOUND' && videoError?.name !== 'NotFoundError') {
            console.warn("⚠️ Could not create video track:", videoError.message)
          }
          // Suppress DEVICE_NOT_FOUND errors completely - they're normal
          setHasVideoDevice(false)
          // Continue without video
        }
        
        // Set tracks (even if null)
        setLocalAudioTrack(audioTrack)
        setLocalVideoTrack(videoTrack)
        
        // Wait a bit for connection to fully stabilize before publishing
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Check connection state before publishing (but don't fail if not connected - we already marked as connected)
        const currentConnectionState = client.connectionState
        if (currentConnectionState !== 'CONNECTED') {
          console.warn(`⚠️ Connection state is ${currentConnectionState}, will skip publishing tracks`)
          // Still continue - connection might stabilize, and we can receive remote media
        }
        
        // Publish tracks (only if they exist and connection is active)
        const tracksToPublish: any[] = []
        if (audioTrack) tracksToPublish.push(audioTrack)
        if (videoTrack) tracksToPublish.push(videoTrack)
        
        if (tracksToPublish.length > 0 && currentConnectionState === 'CONNECTED') {
          try {
            // Check if client is still valid
            if (!client || !client.publish) {
              throw new Error("Client is not valid for publishing")
            }
            await client.publish(tracksToPublish)
            console.log("✅ Tracks published successfully")
          } catch (publishError: any) {
            // Handle publish errors gracefully - don't fail the entire call
            const errorCode = publishError?.code || ''
            const errorMessage = publishError?.message || ''
            
            if (
              errorCode === 'UNEXPECTED_ERROR' || 
              errorMessage.includes('disconnected') ||
              errorMessage.includes('PeerConnection')
            ) {
              console.warn("⚠️ Connection lost during publish - continuing without local tracks")
              // Don't throw - allow call to continue (user can still receive remote media)
            } else {
              console.warn("⚠️ Failed to publish tracks:", errorMessage || publishError)
              // Still continue - user can participate without publishing
            }
          }
        } else if (tracksToPublish.length > 0) {
          console.log("ℹ️ Connection not ready yet, will publish tracks when connection stabilizes")
          // Try to publish later when connection is ready
          const publishWhenReady = async () => {
            const tracksToPublishLater: any[] = [...tracksToPublish] // Copy array for closure
            let attempts = 0
            const maxAttempts = 10
            while (attempts < maxAttempts && client.connectionState !== 'CONNECTED') {
              await new Promise(resolve => setTimeout(resolve, 500))
              attempts++
            }
            if (client.connectionState === 'CONNECTED' && tracksToPublishLater.length > 0) {
              try {
                await client.publish(tracksToPublishLater)
                console.log("✅ Tracks published successfully (delayed)")
              } catch (error) {
                console.warn("⚠️ Failed to publish tracks after delay:", error)
              }
            }
          }
          publishWhenReady() // Don't await - let it happen in background
        } else {
          console.log("ℹ️ No tracks to publish - continuing without audio/video")
        }
        
        // Set up event listeners
        client.on("user-published", async (user: any, mediaType: string) => {
          try {
            await client.subscribe(user, mediaType)
            
            if (mediaType === "video") {
              // Check if it's a screen track or regular video track
              const track = user.videoTrack
              if (track && track.trackMediaType === 'screen') {
                // Handle screen sharing from remote user
                console.log("📺 Remote user started screen sharing")
                setRemoteVideoTrack(track) // Use same state for now, or create separate state
              } else {
                setRemoteVideoTrack(track)
              }
            }
            if (mediaType === "audio") {
              setRemoteAudioTrack(user.audioTrack)
              user.audioTrack.play()
            }
          } catch (error) {
            console.warn("Failed to handle user-published:", error)
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

        // Listen for when remote user leaves the channel
        client.on("user-left", (user: any, reason: string) => {
          console.log("👋 Remote user left the call:", reason)
          setRemoteVideoTrack(null)
          setRemoteAudioTrack(null)
          
          // Show notification that the other person left
          if (reason === "Quit" || reason === "BecameAudience") {
            // User intentionally left
            alert(`${contactName || 'The other person'} has left the call.`)
          } else {
            // Connection issue
            alert(`${contactName || 'The other person'} disconnected from the call.`)
          }
          
          // Optionally end the call automatically after a delay
          setTimeout(() => {
            if (onEndCall) {
              onEndCall()
            }
          }, 3000) // Wait 3 seconds before ending
        })

        // Listen for connection state changes
        client.on("connection-state-change", (curState: string, revState: string) => {
          console.log(`🔄 Connection state changed: ${revState} -> ${curState}`)
          if (curState === 'CONNECTED') {
            setIsConnected(true)
            setIsConnecting(false)
            console.log("✅ Connection established - call is active")
          } else if (curState === 'DISCONNECTED' || curState === 'FAILED') {
            console.warn("⚠️ Connection lost")
            // Check current state before setting to false
            setIsConnected((prev) => {
              // Only set to false if we were previously connected
              if (prev) {
                return false
              }
              return prev
            })
            // Don't set isAgoraInitialized to false - allow UI to show reconnection state
          } else if (curState === 'CONNECTING' || curState === 'RECONNECTING') {
            // Keep isConnected true during reconnection to avoid UI flicker
            console.log(`⏳ Connection state: ${curState}`)
          }
        })

        // Create data stream for chat messages
        try {
          if (client.createDataStream) {
            const streamId = await client.createDataStream({ ordered: true })
            dataStreamIdRef.current = streamId
            console.log("✅ Data stream created for chat:", streamId)
          } else {
            console.warn("⚠️ createDataStream not available, chat will use API fallback")
          }
        } catch (streamError) {
          console.warn("⚠️ Failed to create data stream, chat will use API fallback:", streamError)
        }

        // Listen for data stream messages (chat and call events)
        client.on("stream-message", (uid: any, data: any) => {
          try {
            const message = JSON.parse(data.text)
            if (message.type === 'chat-message') {
              console.log("💬 Received chat message:", message.data)
              setChatMessages(prev => [...prev, message.data])
            } else if (message.type === 'call-ended') {
              console.log("📞 Call ended by remote user")
              alert(`${message.data?.senderName || contactName || 'The other person'} has ended the call.`)
              if (onEndCall) {
                setTimeout(() => onEndCall(), 1000)
              }
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

        // Mark as fully initialized - connection is established
        setIsAgoraInitialized(true)
        setIsAgoraInitializing(false)
        // isConnected is already set to true after join
        setIsConnecting(false)
        
        // Play local video (if available)
        if (localVideoRef.current && localVideoTrack) {
          try {
            localVideoTrack.play(localVideoRef.current)
          } catch (error) {
            console.warn("Failed to play local video:", error)
          }
        }

        console.log("One-on-one call started successfully")
        
      } catch (error) {
        console.error("Failed to initialize Agora call:", error)
        initStartedRef.current = false
        joiningRef.current = false
        joinedRef.current = false
        setIsAgoraInitializing(false)
        setIsConnecting(false)
        setIsAgoraInitialized(false)
        // Show error to user
        alert("Failed to start video call. Please try again.")
      }
    }

    // Delay initialization slightly to avoid React Strict Mode double calls
    const timer = setTimeout(() => {
      initAgora()
    }, 100)

    // Cleanup on unmount
    return () => {
      clearTimeout(timer)
      initStartedRef.current = false
      joiningRef.current = false
      joinedRef.current = false
      
      const cleanup = async () => {
        try {
          if (localAudioTrack) {
            localAudioTrack.close()
          }
          if (localVideoTrack) {
            localVideoTrack.close()
          }
          if (agoraClientRef.current) {
            await agoraClientRef.current.leave()
            agoraClientRef.current = null
          }
        } catch (error) {
          console.warn("Error during cleanup:", error)
        }
      }
      cleanup()
    }
  }, [contactId, sessionId, user?.id])

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
    const client = agoraClientRef.current
    if (!client) {
      console.warn("⚠️ Agora client not initialized, cannot toggle screen share")
      return
    }

    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (localScreenTrack) {
          try {
            if (client.connectionState === 'CONNECTED') {
              await client.unpublish([localScreenTrack])
            }
            localScreenTrack.close()
            setLocalScreenTrack(null)
            setIsScreenSharing(false)
            console.log("✅ Screen sharing stopped")
          } catch (error) {
            console.warn("Error stopping screen share:", error)
            // Still close the track even if unpublish fails
            localScreenTrack.close()
            setLocalScreenTrack(null)
            setIsScreenSharing(false)
          }
        } else {
          setIsScreenSharing(false)
        }
      } else {
        // Check if client has joined and is connected
        if (client.connectionState !== 'CONNECTED') {
          console.warn(`⚠️ Cannot start screen sharing: client not connected (state: ${client.connectionState})`)
          alert("Please wait for the call to connect before sharing your screen.")
          return
        }

        // Start screen sharing with proper error handling
        try {
          console.log("🖥️ Starting screen sharing...")
          const screenTrack = await AgoraRTC.createScreenVideoTrack({
            encoderConfig: "1080p_1"
          })
          
          // Verify connection state again before publishing
          if (client.connectionState !== 'CONNECTED') {
            screenTrack.close()
            throw new Error("Client disconnected while creating screen track")
          }
          
          await client.publish([screenTrack])
          setLocalScreenTrack(screenTrack)
          setIsScreenSharing(true)
          console.log("✅ Screen sharing started successfully")
        } catch (screenError: any) {
          console.error("❌ Screen sharing error:", screenError)
          if (screenError.name === 'NotAllowedError' || screenError.code === 'PERMISSION_DENIED') {
            console.warn("Screen sharing permission denied by user")
            alert("Screen sharing permission was denied. Please allow screen sharing in your browser settings and try again.")
          } else if (screenError.name === 'NotFoundError' || screenError.code === 'DEVICE_NOT_FOUND') {
            console.warn("Screen sharing not supported on this device")
            alert("Screen sharing is not supported on this device.")
          } else if (screenError.code === 'INVALID_OPERATION' || screenError.message?.includes("haven't joined")) {
            console.warn("Cannot publish: client not connected")
            alert("Please wait for the call to connect before sharing your screen.")
          } else {
            alert(`Failed to start screen sharing: ${screenError.message || screenError.code || 'Unknown error'}`)
          }
        }
      }
    } catch (error: any) {
      console.error("Error toggling screen share:", error)
      alert(`Error: ${error.message || 'Unknown error'}`)
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
    
    setIsSendingMessage(true)
    try {
      // Try API first
      try {
        const response = await apiClient.post(`/messages/session/${sessionId}/chat`, {
          message: message.trim()
        })
        
        if (response.success && response.data) {
          setChatMessages(prev => [...prev, response.data])
          setNewChatMessage('')
          return
        }
      } catch (apiError: any) {
        console.warn('API chat failed, trying Agora data stream:', apiError)
      }

      // Fallback: Use Agora data stream for real-time chat
      const client = agoraClientRef.current
      if (client && client.connectionState === 'CONNECTED' && dataStreamIdRef.current !== null) {
        try {
          const messageData = {
            type: 'chat-message',
            data: {
              id: `msg_${Date.now()}`,
              senderId: user?.id,
              senderName: userName || 'You',
              content: message.trim(),
              createdAt: new Date().toISOString()
            }
          }
          
          await client.sendStreamMessage(dataStreamIdRef.current, JSON.stringify(messageData))
          
          // Add to local messages immediately
          setChatMessages(prev => [...prev, messageData.data])
          setNewChatMessage('')
          console.log('✅ Chat message sent via Agora data stream')
        } catch (streamError) {
          console.error('Failed to send via Agora data stream:', streamError)
          // Still add message locally for better UX
          const localMessage = {
            id: `msg_${Date.now()}`,
            senderId: user?.id,
            senderName: userName || 'You',
            content: message.trim(),
            createdAt: new Date().toISOString()
          }
          setChatMessages(prev => [...prev, localMessage])
          setNewChatMessage('')
        }
      } else {
        // Client not connected, add message locally
        const localMessage = {
          id: `msg_${Date.now()}`,
          senderId: user?.id,
          senderName: userName || 'You',
          content: message.trim(),
          createdAt: new Date().toISOString()
        }
        setChatMessages(prev => [...prev, localMessage])
        setNewChatMessage('')
      }
    } catch (error) {
      console.error('Failed to send chat message:', error)
    } finally {
      setIsSendingMessage(false)
    }
  }, [sessionId, isSendingMessage, user?.id, userName])

  // Load chat messages when component mounts
  useEffect(() => {
    if (sessionId) {
      fetchChatMessages()
    }
  }, [sessionId, fetchChatMessages])

  // End call
  const endCall = async () => {
    try {
      console.log("📞 Ending one-on-one video call...")
      
      const client = agoraClientRef.current
      
      // Notify the other person that we're ending the call (via data stream)
      if (client && client.connectionState === 'CONNECTED' && dataStreamIdRef.current !== null) {
        try {
          const endCallMessage = {
            type: 'call-ended',
            data: {
              senderId: user?.id,
              senderName: userName || 'You',
              timestamp: new Date().toISOString()
            }
          }
          await client.sendStreamMessage(dataStreamIdRef.current, JSON.stringify(endCallMessage))
          console.log("✅ Sent call-ended notification to remote user")
        } catch (error) {
          console.warn("⚠️ Failed to send call-ended notification:", error)
        }
      }
      
      if (client || agoraClient) {
        const activeClient = client || agoraClient
        
        // Unpublish tracks first
        if (localAudioTrack) {
          try {
            if (activeClient.connectionState === 'CONNECTED') {
              await activeClient.unpublish([localAudioTrack])
            }
            localAudioTrack.close()
            console.log("✅ Audio track closed")
          } catch (error) {
            console.warn("⚠️ Error closing audio track:", error)
          }
        }
        if (localVideoTrack) {
          try {
            if (activeClient.connectionState === 'CONNECTED') {
              await activeClient.unpublish([localVideoTrack])
            }
            localVideoTrack.close()
            console.log("✅ Video track closed")
          } catch (error) {
            console.warn("⚠️ Error closing video track:", error)
          }
        }
        if (localScreenTrack) {
          try {
            if (activeClient.connectionState === 'CONNECTED') {
              await activeClient.unpublish([localScreenTrack])
            }
            localScreenTrack.close()
            console.log("✅ Screen track closed")
          } catch (error) {
            console.warn("⚠️ Error closing screen track:", error)
          }
        }
        
        // Leave channel
        try {
          if (activeClient.connectionState !== 'DISCONNECTED') {
            await activeClient.leave()
            console.log("✅ Left Agora channel")
          }
        } catch (error) {
          console.warn("⚠️ Error leaving channel:", error)
        }
        
        // Release Agora client
        try {
          activeClient.removeAllListeners()
        } catch (error) {
          console.warn("⚠️ Error removing listeners:", error)
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

      {/* Video Area - Improved Layout */}
      <div className="flex-1 relative bg-black">
        {/* Screen Sharing - Full Screen (Priority) */}
        {(isScreenSharing && localScreenTrack) && (
          <div className="absolute inset-0 bg-black z-10">
            <div 
              ref={(el) => {
                if (el && localScreenTrack) {
                  localScreenTrack.play(el).catch((error: any) => {
                    console.warn("Screen track play error:", error)
                  })
                }
              }} 
              className="w-full h-full"
            />
            <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 z-20">
              <Monitor className="h-5 w-5" />
              <span className="font-semibold">You are sharing your screen</span>
            </div>
            <Button
              onClick={toggleScreenShare}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white z-20"
            >
              Stop Sharing
            </Button>
          </div>
        )}

        {/* Remote Screen Sharing - Full Screen (Priority) */}
        {remoteVideoTrack && remoteVideoTrack.trackMediaType === 'screen' && !isScreenSharing && (
          <div className="absolute inset-0 bg-black z-10">
            <div 
              ref={(el) => {
                if (el && remoteVideoTrack) {
                  remoteVideoTrack.play(el).catch((error: any) => {
                    console.warn("Remote screen track play error:", error)
                  })
                }
              }} 
              className="w-full h-full"
            />
            <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 z-20">
              <Monitor className="h-5 w-5" />
              <span className="font-semibold">{contactName || 'Participant'} is sharing their screen</span>
            </div>
          </div>
        )}

        {/* Main Layout: Split View (Local Left, Remote Right) for Instructors */}
        {!isScreenSharing && !(remoteVideoTrack && remoteVideoTrack.trackMediaType === 'screen') && (user?.role === 'ADMIN' || user?.role === 'SENIOR_MANAGER' || user?.role === 'JUNIOR_MANAGER') && (
          <div className="h-full flex gap-4 p-4">
            {/* Left: Big Local Video Preview */}
            <div className="flex-1 min-w-0 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border-2 border-green-400 ring-4 ring-green-400/30 shadow-2xl">
              <div className="bg-gradient-to-r from-green-500/30 to-green-600/30 px-6 py-3 border-b border-green-400/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-green-400 font-bold text-lg">Your Camera</span>
                    <p className="text-green-300 text-sm">Live video feed</p>
                  </div>
                </div>
              </div>
              <div className="h-[calc(100%-80px)] bg-black relative">
                {localVideoTrack ? (
                  <div ref={localVideoRef} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-medium">You</span>
                      </div>
                      <p className="text-gray-400">Camera off</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  LIVE
                </div>
              </div>
            </div>

            {/* Right: Remote Participant */}
            <div className="w-96 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border-2 border-blue-400 ring-4 ring-blue-400/30 shadow-2xl">
              <div className="bg-gradient-to-r from-blue-500/30 to-blue-600/30 px-6 py-3 border-b border-blue-400/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-blue-400 font-bold text-lg">{contactName || 'Participant'}</span>
                    <p className="text-blue-300 text-sm">Remote video feed</p>
                  </div>
                </div>
              </div>
              <div className="h-[calc(100%-80px)] bg-black relative">
                {remoteVideoTrack ? (
                  <div ref={remoteVideoRef} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-medium">{(contactName || 'U')[0]}</span>
                      </div>
                      <p className="text-lg font-medium">{contactName || 'Unknown'}</p>
                      <p className="text-sm text-gray-400">Waiting for video...</p>
                    </div>
                  </div>
                )}
                {remoteVideoTrack && (
                  <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                    LIVE
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Student Layout: Local Top, Remote Bottom */}
        {!isScreenSharing && !(remoteVideoTrack && remoteVideoTrack.trackMediaType === 'screen') && user?.role === 'STUDENT' && (
          <div className="h-full flex flex-col gap-4 p-4">
            {/* Top: Big Local Video Preview */}
            <div className="flex-1 min-h-0 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border-2 border-green-400 ring-4 ring-green-400/30 shadow-2xl">
              <div className="bg-gradient-to-r from-green-500/30 to-green-600/30 px-6 py-3 border-b border-green-400/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-green-400 font-bold text-lg">Your Camera</span>
                    <p className="text-green-300 text-sm">Live video feed</p>
                  </div>
                </div>
              </div>
              <div className="h-[calc(100%-80px)] bg-black relative">
                {localVideoTrack ? (
                  <div ref={localVideoRef} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-medium">You</span>
                      </div>
                      <p className="text-gray-400">Camera off</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  LIVE
                </div>
              </div>
            </div>

            {/* Bottom: Remote Participant (Instructor) */}
            <div className="h-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border-2 border-blue-400 ring-4 ring-blue-400/30 shadow-2xl">
              <div className="bg-gradient-to-r from-blue-500/30 to-blue-600/30 px-6 py-3 border-b border-blue-400/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-blue-400 font-bold text-lg">{contactName || 'Instructor'}</span>
                    <p className="text-blue-300 text-sm">Remote video feed</p>
                  </div>
                </div>
              </div>
              <div className="h-[calc(100%-80px)] bg-black relative">
                {remoteVideoTrack ? (
                  <div ref={remoteVideoRef} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-xl font-medium">{(contactName || 'I')[0]}</span>
                      </div>
                      <p className="text-sm font-medium">{contactName || 'Instructor'}</p>
                      <p className="text-xs text-gray-400">Waiting for video...</p>
                    </div>
                  </div>
                )}
                {remoteVideoTrack && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold animate-pulse">
                    LIVE
                  </div>
                )}
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

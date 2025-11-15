"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { VideoGrid } from "@/components/video-grid"
import { ChatPanel } from "@/components/chat-panel"
import { SessionHeader } from "@/components/session-header"
import { WhiteboardPanel } from "@/components/whiteboard-panel"
import { ParticipantsPanel } from "@/components/participants-panel"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  PhoneOff,
  Users,
  Presentation,
  Circle,
  Hand,
} from "lucide-react"
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
  instructor: {
    id: string
    firstName: string
    lastName: string
    email: string
    profilePicture?: string
  }
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
  isHost: boolean
  role: "ADMIN" | "SENIOR_MANAGER" | "JUNIOR_MANAGER" | "STUDENT"
  profilePicture?: string
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderProfilePicture?: string
  message: string
  timestamp: Date
  isSystemMessage?: boolean
}

interface SessionApiResponse {
  session: {
    id: string
    title: string
    status: string
    date: string
    startTime?: string
    isRecording?: boolean
    createdBy?: {
      id: string
      firstName: string
      lastName: string
      email?: string
      profilePicture?: string
    }
    _count?: {
      participants: number
    }
  }
}

interface ParticipantsApiResponse {
  id: string
  name: string
  isMuted: boolean
  isVideoOn: boolean
  isPresenting: boolean
  hasHandRaised: boolean
  isHost: boolean
  role: string
  profilePicture?: string
}

interface TutorVideoSessionProps {
  onSessionEnd?: () => void
}

export function TutorVideoSession({ onSessionEnd }: TutorVideoSessionProps = {}) {
  const params = useParams()
  const { user } = useAuth()
  const sessionId = params?.id as string

  const [isMicOn, setIsMicOn] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null)
  
  // Agora related states
  const [agoraClient, setAgoraClient] = useState<any>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null)
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null)
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
  
  // Real data state
  const [session, setSession] = useState<LiveSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [loading, setLoading] = useState(true)

  // Detect available devices
  useEffect(() => {
    const detectDevices = async () => {
      if (typeof window === 'undefined') return

      try {
        // Check for camera
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
          setHasCamera(true)
          setCameraError(null)
          videoStream.getTracks().forEach(track => track.stop())
        } catch (error: any) {
          setHasCamera(false)
          if (error.name === 'NotFoundError') {
            setCameraError('No camera found')
          } else if (error.name === 'NotAllowedError') {
            setCameraError('Camera access denied')
          } else {
            setCameraError('Camera error')
          }
        }

        // Check for microphone
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
          setHasMicrophone(true)
          setMicrophoneError(null)
          audioStream.getTracks().forEach(track => track.stop())
        } catch (error: any) {
          setHasMicrophone(false)
          if (error.name === 'NotFoundError') {
            setMicrophoneError('No microphone found')
          } else if (error.name === 'NotAllowedError') {
            setMicrophoneError('Microphone access denied')
          } else {
            setMicrophoneError('Microphone error')
          }
        }
        
        // Auto-start will be handled in a separate useEffect
        
      } catch (error) {
        console.error("Device detection failed:", error)
      }
    }

    detectDevices()
  }, [])

  // Auto-start camera and microphone when devices are detected - DISABLED
  // useEffect(() => {
  //   if (hasCamera && hasMicrophone && !isVideoOn && !isMicOn) {
  //     setIsVideoOn(true)
  //     setIsMicOn(true)
  //     console.log("🎥 Auto-starting camera and microphone")
  //   }
  // }, [hasCamera, hasMicrophone, isVideoOn, isMicOn])

  // Load session data
  useEffect(() => {
    const loadSessionData = async () => {
      if (!sessionId) {
        console.log('❌ No session ID provided');
        return
      }

      console.log('🔄 Loading session data for session ID:', sessionId);
      try {
        setLoading(true)
        
        // Fetch actual session data from API
        const response = await apiClient.get(`/live-sessions/${sessionId}`)
        
        if (response.success && response.data) {
          const apiResponse = response.data as SessionApiResponse
          const sessionData = apiResponse.session
          console.log('📋 Session data loaded successfully:', {
            id: sessionData.id,
            title: sessionData.title,
            status: sessionData.status,
            createdBy: sessionData.createdBy?.firstName,
            participantCount: sessionData._count?.participants
          });
          
          setSession({
            id: sessionData.id,
            title: sessionData.title || "Live Session",
            instructor: {
              id: sessionData.createdBy?.id || "",
              firstName: sessionData.createdBy?.firstName || "Instructor",
              lastName: sessionData.createdBy?.lastName || "",
              email: sessionData.createdBy?.email || "",
              profilePicture: sessionData.createdBy?.profilePicture
            },
            status: (sessionData.status as "SCHEDULED" | "LIVE" | "ENDED") || "LIVE",
            startTime: new Date(sessionData.date),
            participantCount: sessionData._count?.participants || 0,
            isRecording: sessionData.isRecording || false
          })

          // Auto-start session if admin/manager/creator joins and session is SCHEDULED
          const isCreator = user?.id === sessionData.createdBy?.id;
          console.log('🔍 Session status check:', {
            sessionStatus: sessionData.status,
            userRole: user?.role,
            isCreator,
            userId: user?.id,
            creatorId: sessionData.createdBy?.id
          });
          
          if (sessionData.status === "SCHEDULED" && user?.role && (["ADMIN", "SENIOR_MANAGER", "JUNIOR_MANAGER"].includes(user.role) || isCreator)) {
            console.log('🚀 Attempting to update session status to LIVE...');
            try {
              const response = await apiClient.put(`/live-sessions/${sessionId}/status`, {
                status: 'LIVE'
              })
              console.log('✅ Session status update response:', response);
              console.log('Session status updated to LIVE by', isCreator ? 'creator' : user.role)
              // Update local session state to reflect the change
              setSession(prev => prev ? { ...prev, status: "LIVE" } : null)
            } catch (error) {
              console.error('❌ Failed to update session status:', error)
            }
          } else {
            console.log('⏸️ Session status update skipped:', {
              reason: sessionData.status !== "SCHEDULED" ? 'Session not SCHEDULED' : 'User not authorized'
            });
          }

          // Fetch participants
          const participantsResponse = await apiClient.get(`/live-sessions/${sessionId}/participants`)
          if (participantsResponse.success) {
            const participantsData = (participantsResponse.data as ParticipantsApiResponse[]) || []
            console.log("Fetched participants:", participantsData)
            const mappedParticipants = participantsData.map(p => ({
              ...p,
              role: p.role as "ADMIN" | "SENIOR_MANAGER" | "JUNIOR_MANAGER" | "STUDENT"
            }))
            console.log("Mapped participants:", mappedParticipants)
            setParticipants(mappedParticipants)
          }

          // Fetch chat messages
          const messagesResponse = await apiClient.get(`/live-sessions/${sessionId}/messages`)
          if (messagesResponse.success) {
            const messages = (messagesResponse.data as ChatMessage[]) || []
            // Ensure timestamps are Date objects
            const messagesWithDates = messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
            setChatMessages(messagesWithDates)
          }
        } else {
          throw new Error("Failed to fetch session data")
        }

        setIsConnected(true)
      } catch (error) {
        console.error("Failed to load session data:", error)
        setIsConnected(false)
        
        // Fallback data with proper error handling
        setSession({
          id: sessionId,
          title: "Live Session",
          instructor: {
            id: "",
            firstName: "Loading...",
            lastName: "",
            email: "",
            profilePicture: undefined
          },
          status: "LIVE",
          startTime: new Date(),
          participantCount: 0,
          isRecording: false
        })
      } finally {
        setLoading(false)
      }
    }

    loadSessionData()
  }, [sessionId])

  // Auto-refresh session data every 5 seconds for better real-time updates
  useEffect(() => {
    if (!sessionId) return

    const refreshInterval = setInterval(async () => {
      try {
        console.log("🔄 Auto-refreshing session data...")
        
        // Refresh participants
        const participantsResponse = await apiClient.get(`/live-sessions/${sessionId}/participants`)
        if (participantsResponse.success) {
          const participantsData = (participantsResponse.data as ParticipantsApiResponse[]) || []
          const mappedParticipants = participantsData.map(p => ({
            ...p,
            role: p.role as "ADMIN" | "SENIOR_MANAGER" | "JUNIOR_MANAGER" | "STUDENT"
          }))
          
          console.log(`👥 Fetched ${mappedParticipants.length} participants from API:`, mappedParticipants.map(p => p.name))
          
          setParticipants(prevParticipants => {
            const previousCount = prevParticipants.length
            const newCount = mappedParticipants.length
            
            if (previousCount !== newCount) {
              console.log(`👥 Participant count changed: ${previousCount} → ${newCount}`)
              console.log(`👥 Previous participants:`, prevParticipants.map(p => p.name))
              console.log(`👥 New participants:`, mappedParticipants.map(p => p.name))
            }
            
            return mappedParticipants
          })
        }

        // Refresh chat messages
        const messagesResponse = await apiClient.get(`/live-sessions/${sessionId}/messages`)
        if (messagesResponse.success) {
          const messages = (messagesResponse.data as ChatMessage[]) || []
          const messagesWithDates = messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
          // Sort by timestamp
          messagesWithDates.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          
          setChatMessages(prevMessages => {
            const previousCount = prevMessages.length
            const newCount = messagesWithDates.length
            
            // Only update if there are new messages
            if (newCount > previousCount) {
              console.log(`💬 New messages received: ${previousCount} → ${newCount}`)
              return messagesWithDates
            }
            // Check if any message IDs are different (in case messages were edited/deleted)
            const prevIds = new Set(prevMessages.map(m => m.id))
            const newIds = new Set(messagesWithDates.map(m => m.id))
            if (prevIds.size !== newIds.size || [...newIds].some(id => !prevIds.has(id))) {
              return messagesWithDates
            }
            // No changes, keep previous messages
            return prevMessages
          })
        }

        // Refresh session status
        const sessionResponse = await apiClient.get(`/live-sessions/${sessionId}`)
        if (sessionResponse.success) {
          const apiResponse = sessionResponse.data as SessionApiResponse
          const sessionData = apiResponse.session
          
          setSession(prev => {
            if (!prev) return null
            
            const newStatus = (sessionData.status as "SCHEDULED" | "LIVE" | "ENDED") || prev.status
            const newParticipantCount = sessionData._count?.participants || prev.participantCount
            const newIsRecording = sessionData.isRecording || prev.isRecording
            
            // Log status changes
            if (prev.status !== newStatus) {
              console.log(`📊 Session status changed: ${prev.status} → ${newStatus}`)
            }
            if (prev.participantCount !== newParticipantCount) {
              console.log(`👥 Session participant count changed: ${prev.participantCount} → ${newParticipantCount}`)
            }
            
            return {
              ...prev,
              status: newStatus,
              participantCount: newParticipantCount,
              isRecording: newIsRecording
            }
          })
        }
      } catch (error) {
        console.error("❌ Auto-refresh failed:", error)
      }
    }, 5000) // Refresh every 5 seconds for better real-time updates

    return () => clearInterval(refreshInterval)
  }, [sessionId]) // Fixed: removed participants.length and chatMessages.length from dependencies

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
          // Ensure timestamp is a Date object
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

  // Initialize Agora with proper error handling
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
        console.log("Initializing Agora RTC...")
        
        // Wait for AgoraRTC to be loaded
        if (!AgoraRTC) {
          const agoraModule = await import("agora-rtc-sdk-ng")
          AgoraRTC = agoraModule.default
        }
        
        // Set up autoplay failure handler (if available)
        if (AgoraRTC && AgoraRTC.onAutoplayFailed) {
          AgoraRTC.onAutoplayFailed(() => {
            console.log("Autoplay failed - user interaction required")
            // You can show a play button here
          })
        }

        // Create Agora client
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
        setAgoraClient(client)
        agoraClientRef.current = client

        // Get Agora token from backend
        const tokenResponse = await apiClient.post(`/agora/rtc/token`, {
          channelName: sessionId,
          role: user.role === "STUDENT" ? "subscriber" : "publisher",
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

        // Check if App ID is properly configured
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
            } catch (retryError) {
              console.error("❌ Failed to rejoin after UID_CONFLICT:", retryError)
              throw retryError
            }
          } else {
            throw joinError
          }
        }

        console.log("✅ Agora client joined successfully")
        
        // Wait for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Auto-publish video and audio tracks for tutor (instructor)
        if (user.role !== "STUDENT" && hasCamera !== false && hasMicrophone !== false) {
          try {
            const tracksToPublish: any[] = []
            
            // Create and publish video track
            if (hasCamera) {
              try {
                const videoTrack = await AgoraRTC.createCameraVideoTrack()
                localVideoTrackRef.current = videoTrack
                setLocalVideoTrack(videoTrack)
                
                // Create MediaStream from track for preview
                if (videoTrack.getMediaStreamTrack) {
                  const stream = new MediaStream([videoTrack.getMediaStreamTrack()])
                  setLocalVideoStream(stream)
                }
                
                tracksToPublish.push(videoTrack)
                setIsVideoOn(true)
                console.log("✅ Video track created")
              } catch (videoError: any) {
                if (videoError.code !== 'DEVICE_NOT_FOUND') {
                  console.warn("⚠️ Failed to create video track:", videoError)
                }
              }
            }
            
            // Create and publish audio track
            if (hasMicrophone) {
              try {
                const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
                localAudioTrackRef.current = audioTrack
                setLocalAudioTrack(audioTrack)
                tracksToPublish.push(audioTrack)
                setIsMicOn(true)
                console.log("✅ Audio track created")
              } catch (audioError: any) {
                if (audioError.code !== 'DEVICE_NOT_FOUND') {
                  console.warn("⚠️ Failed to create audio track:", audioError)
                }
              }
            }
            
            // Publish tracks if connection is ready
            if (tracksToPublish.length > 0 && client.connectionState === 'CONNECTED') {
              try {
                await client.publish(tracksToPublish)
                console.log("✅ Tracks published successfully")
              } catch (publishError) {
                console.warn("⚠️ Failed to publish tracks:", publishError)
              }
            }
          } catch (error) {
            console.warn("⚠️ Failed to auto-publish tracks:", error)
          }
        }
        
        setIsAgoraInitialized(true)
        setIsAgoraInitializing(false)

        // Handle remote users
        client.on("user-published", async (user: any, mediaType: any) => {
          console.log("Remote user published:", user.uid, mediaType)
          try {
            await client.subscribe(user, mediaType)
            
            if (mediaType === "video") {
              const remoteVideoTrack = user.videoTrack
              if (remoteVideoTrack) {
                // Create a container for remote video
                const remoteVideoContainer = document.createElement("div")
                remoteVideoContainer.id = `remote-video-${user.uid}`
                remoteVideoContainer.style.width = "100%"
                remoteVideoContainer.style.height = "100%"
                
                // Find the video grid container and append remote video
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

    // Add a small delay to ensure everything is ready
    const timer = setTimeout(initAgora, 1000)
    
    // Cleanup function
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
  }, [sessionId, user?.id, user?.role, hasCamera, hasMicrophone])

  // Handle camera and microphone controls
  const handleMicToggle = async () => {
    try {
      // Check if microphone is available
      if (hasMicrophone === false) {
        alert(`Microphone not available: ${microphoneError}`)
        return
      }

      if (isAgoraInitialized && AgoraRTC && agoraClientRef.current) {
        if (!localAudioTrackRef.current && !isMicOn) {
          // Create microphone track when turning ON
          const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
          localAudioTrackRef.current = audioTrack
          setLocalAudioTrack(audioTrack)
          if (agoraClientRef.current.connectionState === 'CONNECTED') {
            await agoraClientRef.current.publish([audioTrack])
            console.log("✅ Microphone track created and published")
          }
        } else if (localAudioTrackRef.current) {
          // Toggle existing track
          await localAudioTrackRef.current.setMuted(isMicOn)
          console.log("Microphone toggled via Agora:", !isMicOn)
        }
        setIsMicOn(!isMicOn)
      } else {
        // Fallback for non-Agora mode
        setIsMicOn(!isMicOn)
        console.log("Microphone toggled (fallback):", !isMicOn)
      }
    } catch (error) {
      console.error("Failed to toggle microphone:", error)
      // Fallback to state change only
      setIsMicOn(!isMicOn)
    }
  }

  const handleVideoToggle = async () => {
    try {
      // Check if camera is available
      if (hasCamera === false) {
        alert(`Camera not available: ${cameraError}`)
        return
      }

      if (isAgoraInitialized && AgoraRTC && agoraClientRef.current) {
        if (!localVideoTrackRef.current && !isVideoOn) {
          // Create camera track when turning ON
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
            console.log("✅ Camera track created and published")
          }
        } else if (localVideoTrackRef.current) {
          // Toggle existing track
          await localVideoTrackRef.current.setMuted(isVideoOn)
          console.log("Video toggled via Agora:", !isVideoOn)
        }
        setIsVideoOn(!isVideoOn)
      } else {
        // Fallback for non-Agora mode
        setIsVideoOn(!isVideoOn)
        console.log("Video toggled (fallback):", !isVideoOn)
      }
    } catch (error) {
      console.error("Failed to toggle video:", error)
      // Fallback to state change only
      setIsVideoOn(!isVideoOn)
    }
  }

  // Get local video stream for preview
  const getLocalVideoStream = async () => {
    try {
      if (isVideoOn) {
        // Check if camera is available
        if (hasCamera === false) {
          console.log("Camera not available:", cameraError)
          return
        }

        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.log("getUserMedia not supported")
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        })
        setLocalVideoStream(stream)
      } else {
        if (localVideoStream) {
          localVideoStream.getTracks().forEach(track => track.stop())
          setLocalVideoStream(null)
        }
      }
    } catch (error: any) {
      console.error("Failed to get local video stream:", error)
      if (error.name === 'NotAllowedError') {
        console.log("Camera access denied")
        setCameraError("Camera access denied")
        setHasCamera(false)
      } else if (error.name === 'NotFoundError') {
        console.log("No camera found")
        setCameraError("No camera found")
        setHasCamera(false)
      }
    }
  }

  // Update local video stream when video toggle changes
  useEffect(() => {
    getLocalVideoStream()
  }, [isVideoOn])

  // Cleanup local video stream on unmount
  useEffect(() => {
    return () => {
      if (localVideoStream) {
        localVideoStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [localVideoStream])

  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Check if screen sharing is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          alert("Screen sharing is not supported in this browser")
          return
        }

        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        })
        
        // Store the stream for preview
        setScreenShareStream(stream)
        setIsScreenSharing(true)
        
        // Integrate with Agora for screen sharing
        if (agoraClient && isAgoraInitialized && AgoraRTC) {
          try {
            // Create screen share track
            const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "disable")
            
            // Unpublish camera video and publish screen share
            if (localVideoTrack) {
              await agoraClient.unpublish([localVideoTrack])
            }
            await agoraClient.publish([screenTrack])
            
            console.log("✅ Screen sharing started with Agora")
            
            // Handle screen share end
            screenTrack.on('track-ended', async () => {
              try {
                // Stop screen sharing
                await agoraClient.unpublish([screenTrack])
                screenTrack.close()
                
                // Restore camera video
                if (localVideoTrack) {
                  await agoraClient.publish([localVideoTrack])
                }
                
                setIsScreenSharing(false)
                setScreenShareStream(null)
                console.log("Screen sharing ended")
              } catch (error) {
                console.error("Error ending screen share:", error)
              }
            })
          } catch (agoraError) {
            console.error("Agora screen sharing failed:", agoraError)
            // Continue with local preview only
            console.log("Falling back to local screen share preview")
          }
        } else {
          console.log("Screen sharing started (local preview only - Agora not available)")
        }
        
        // Handle stream end
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          setScreenShareStream(null)
          console.log("Screen sharing ended")
        }
      } else {
        // Stop screen sharing
        if (screenShareStream) {
          screenShareStream.getTracks().forEach(track => track.stop())
          setScreenShareStream(null)
        }
        setIsScreenSharing(false)
        console.log("Screen sharing stopped")
      }
    } catch (error: any) {
      console.error("Screen sharing failed:", error)
      // Show user-friendly error message
      if (error.name === 'NotAllowedError') {
        alert("Screen sharing was denied. Please allow screen sharing permissions.")
      } else if (error.name === 'NotFoundError') {
        alert("No screen sharing source found. Please try again.")
      } else {
        alert("Screen sharing failed. Please check your browser permissions.")
      }
    }
  }

  const handleRecordingToggle = async () => {
    try {
      if (!isRecording) {
        // Start recording
        // TODO: Implement actual recording with Agora
        console.log("Recording started")
        setIsRecording(true)
        
        // Update session recording status in backend
        await apiClient.put(`/live-sessions/${sessionId}/status`, {
          isRecording: true
        })
      } else {
        // Stop recording
        // TODO: Stop Agora recording
        console.log("Recording stopped")
        setIsRecording(false)
        
        // Update session recording status in backend
        await apiClient.put(`/live-sessions/${sessionId}/status`, {
          isRecording: false
        })
      }
    } catch (error) {
      console.error("Recording toggle failed:", error)
      alert("Recording operation failed. Please try again.")
    }
  }

  // Handle participant management
  const handleMuteParticipant = async (participantId: string) => {
    try {
      // TODO: Implement actual API call when endpoint is ready
      console.log("Muting participant:", participantId)
      setParticipants(prev => 
        prev.map(p => p.id === participantId ? { ...p, isMuted: !p.isMuted } : p)
      )
    } catch (error) {
      console.error("Failed to mute participant:", error)
    }
  }

  const handlePinParticipant = async (participantId: string) => {
    try {
      // TODO: Implement actual API call when endpoint is ready
      console.log("Pinning participant:", participantId)
    } catch (error) {
      console.error("Failed to pin participant:", error)
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      // TODO: Implement actual API call when endpoint is ready
      console.log("Removing participant:", participantId)
      setParticipants(prev => prev.filter(p => p.id !== participantId))
    } catch (error) {
      console.error("Failed to remove participant:", error)
    }
  }

  const handleRaiseHand = async () => {
    try {
      const newHandState = !isHandRaised
      setIsHandRaised(newHandState)
      
      // TODO: Implement actual API call when endpoint is ready
      console.log("Hand raised:", newHandState)
      
      // Update local participant state
      if (user?.id) {
        setParticipants(prev => 
          prev.map(p => p.id === user.id ? { ...p, hasHandRaised: newHandState } : p)
        )
      }
    } catch (error) {
      console.error("Failed to raise/lower hand:", error)
    }
  }

  const handleLowerHand = async (participantId: string) => {
    try {
      // TODO: Implement actual API call when endpoint is ready
      console.log("Lowering hand for participant:", participantId)
      
      // Update local participant state
      setParticipants(prev => 
        prev.map(p => p.id === participantId ? { ...p, hasHandRaised: false } : p)
      )
    } catch (error) {
      console.error("Failed to lower hand:", error)
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
      // Fallback to role-based redirection
      const userRole = user?.role
      
      switch (userRole) {
        case "STUDENT":
          window.location.href = "/live"
          break
        case "ADMIN":
          window.location.href = "/admin/live-sessions"
          break
        case "SENIOR_MANAGER":
        case "JUNIOR_MANAGER":
          window.location.href = "/manager/sessions"
          break
        default:
          // Fallback to home page
          window.location.href = "/"
          break
      }
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    const getBackUrl = () => {
      if (!user) return "/"
      if (user.role === "ADMIN") return "/admin/live-sessions"
      if (["SENIOR_MANAGER", "JUNIOR_MANAGER"].includes(user.role)) return "/manager/sessions"
      return "/live"
    }

    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">Session not found</p>
          <Button onClick={() => window.location.href = getBackUrl()}>
            Back to Sessions
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden">
      <SessionHeader
        title={session?.title || "Live Session"}
        instructor={session?.instructor ? `${session.instructor.firstName || ''} ${session.instructor.lastName || ''}`.trim() : "Instructor"}
        participantCount={session?.participantCount || 0}
        isRecording={session?.isRecording || false}
        sessionStatus={session?.status || "LIVE"}
        startTime={session?.startTime}
        currentUserRole={user?.role || "ADMIN"}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
                 <VideoGrid 
                   role="tutor" 
                   participants={participants} 
                   screenShareStream={screenShareStream}
                   isScreenSharing={isScreenSharing}
                   localVideoStream={localVideoStream}
                   isVideoOn={isVideoOn}
                   hasCamera={hasCamera}
                   cameraError={cameraError}
                 />

          {/* Professional Control Bar */}
          <div className="bg-black/80 backdrop-blur-lg border-t border-white/10 p-6">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
              {/* Left Controls - Audio/Video */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Button
                    variant={isMicOn ? "default" : "destructive"}
                    size="lg"
                    className={`rounded-full w-14 h-14 p-0 transition-all duration-300 hover:scale-110 hover:shadow-lg ${
                      isMicOn 
                        ? "bg-green-600 hover:bg-green-700 shadow-green-500/25" 
                        : "bg-red-600 hover:bg-red-700 shadow-red-500/25"
                    } shadow-lg`}
                    onClick={handleMicToggle}
                  >
                    {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  </Button>
                  {hasMicrophone === false && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Button
                    variant={isVideoOn ? "default" : "destructive"}
                    size="lg"
                    className={`rounded-full w-14 h-14 p-0 transition-all duration-300 hover:scale-110 hover:shadow-lg ${
                      isVideoOn 
                        ? "bg-green-600 hover:bg-green-700 shadow-green-500/25" 
                        : "bg-red-600 hover:bg-red-700 shadow-red-500/25"
                    } shadow-lg`}
                    onClick={handleVideoToggle}
                  >
                    {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  </Button>
                  {hasCamera === false && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Center Controls - Features */}
              <div className="flex items-center gap-3">
                <Button 
                  variant={isScreenSharing ? "default" : "secondary"}
                  size="lg" 
                  className={`gap-3 px-6 py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm ${
                    isScreenSharing 
                      ? "bg-black hover:bg-black/80 text-white border border-white/30 shadow-lg" 
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30"
                  }`}
                  onClick={handleScreenShare}
                >
                  <MonitorUp className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">{isScreenSharing ? "Stop Sharing" : "Share Screen"}</span>
                </Button>

                <Button
                  variant={isWhiteboardOpen ? "default" : "secondary"}
                  size="lg"
                  className={`gap-3 px-6 py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm ${
                    isWhiteboardOpen 
                      ? "bg-black hover:bg-black/80 text-white border border-white/30 shadow-lg" 
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30"
                  }`}
                  onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
                >
                  <Presentation className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">Whiteboard</span>
                </Button>

                <Button
                  variant={isRecording ? "destructive" : "secondary"}
                  size="lg"
                  className={`gap-3 px-6 py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm ${
                    isRecording 
                      ? "bg-black hover:bg-black/80 text-white border border-red-500/50 shadow-lg animate-pulse" 
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30"
                  }`}
                  onClick={handleRecordingToggle}
                >
                  <Circle className={isRecording ? "w-4 h-4 fill-current animate-pulse text-red-500" : "w-5 h-5"} />
                  <span className="hidden sm:inline font-medium">{isRecording ? "Stop Recording" : "Record"}</span>
                </Button>

                <Button
                  variant={isChatOpen ? "default" : "secondary"}
                  size="lg"
                  className={`gap-3 px-6 py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm relative ${
                    isChatOpen 
                      ? "bg-black hover:bg-black/80 text-white border border-white/30 shadow-lg" 
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30"
                  }`}
                  onClick={() => setIsChatOpen(!isChatOpen)}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">Chat</span>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                      {unreadMessages}
                    </span>
                  )}
                </Button>

                       <Button
                         variant={isParticipantsOpen ? "default" : "secondary"}
                         size="lg"
                         className={`gap-3 px-6 py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm ${
                           isParticipantsOpen 
                             ? "bg-black hover:bg-black/80 text-white border border-white/30 shadow-lg" 
                             : "bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30"
                         }`}
                         onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                       >
                         <Users className="w-5 h-5" />
                         <span className="hidden sm:inline font-medium">{session.participantCount}</span>
                       </Button>

                       {/* Raise Hand Button - Only for Students */}
                       {user?.role === "STUDENT" && (
                         <Button
                           variant={isHandRaised ? "default" : "secondary"}
                           size="lg"
                           className={`gap-3 px-6 py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm ${
                             isHandRaised 
                               ? "bg-yellow-600 hover:bg-yellow-700 text-white border border-yellow-500/50 shadow-lg animate-pulse" 
                               : "bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30"
                           }`}
                           onClick={handleRaiseHand}
                         >
                           <Hand className="w-5 h-5" />
                           <span className="hidden sm:inline font-medium">{isHandRaised ? "Lower Hand" : "Raise Hand"}</span>
                         </Button>
                       )}
              </div>

              {/* Right Control - Leave */}
              <Button 
                variant="destructive" 
                size="lg" 
                className="rounded-full w-14 h-14 p-0 bg-red-600 hover:bg-red-700 transition-all duration-300 hover:scale-110 hover:shadow-lg shadow-red-500/25"
                onClick={handleLeaveSession}
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        {isWhiteboardOpen && <WhiteboardPanel onClose={() => setIsWhiteboardOpen(false)} />}
        {isChatOpen && (
          <ChatPanel 
            onClose={() => setIsChatOpen(false)} 
            messages={chatMessages}
            currentUserId={user?.id}
            onSendMessage={handleSendMessage}
            isConnected={isConnected}
          />
        )}
               {isParticipantsOpen && (
                 <ParticipantsPanel 
                   onClose={() => setIsParticipantsOpen(false)} 
                   participants={participants}
                   currentUserRole={user?.role || "ADMIN"}
                   onMuteParticipant={handleMuteParticipant}
                   onPinParticipant={handlePinParticipant}
                   onRemoveParticipant={handleRemoveParticipant}
                   onLowerHand={handleLowerHand}
                 />
               )}
      </div>
    </div>
  )
}

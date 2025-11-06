"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { VideoGrid } from "@/components/video-grid"
import { ChatPanel } from "@/components/chat-panel"
import { SessionHeader } from "@/components/session-header"
import { Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, Hand, PhoneOff, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { apiClient } from "@/lib/api-client"

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

  // Load session data
  useEffect(() => {
    if (sessionId) {
      // TODO: Load session data from API
      // This will be replaced with actual API calls
      setSession({
        id: sessionId,
        title: "Live Session",
        instructor: "Instructor",
        status: "LIVE",
        startTime: new Date(),
        participantCount: 0,
        isRecording: false
      })
    }
  }, [sessionId])

  // Auto-refresh session data every 30 seconds
  useEffect(() => {
    if (!sessionId) return

    const refreshInterval = setInterval(async () => {
      try {
        // TODO: Add actual API calls for auto-refresh
        // This will refresh participants, messages, and session status
        console.log("Auto-refreshing session data...")
      } catch (error) {
        console.error("Auto-refresh failed:", error)
      }
    }, 30000) // Refresh every 30 seconds

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
  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      // TODO: Send message via WebSocket/API
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: user?.id || "",
        senderName: user?.firstName || "You",
        message: message.trim(),
        timestamp: new Date(),
        isSystemMessage: false
      }
      setChatMessages(prev => [...prev, newMessage])
    }
  }

  // Handle participant management
  const handleMuteToggle = () => {
    setIsMicOn(!isMicOn)
    // TODO: Update participant state via Agora/WebSocket
  }

  const handleVideoToggle = () => {
    setIsVideoOn(!isVideoOn)
    // TODO: Update participant state via Agora/WebSocket
  }

  const handleHandRaise = () => {
    setIsHandRaised(!isHandRaised)
    // TODO: Notify instructor via WebSocket
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
          <VideoGrid role="student" participants={participants} />

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

"use client"

import { useState, useEffect } from "react"

// Generate static params for static export
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  ArrowLeft,
  Loader2
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"
import AgoraVideoCall from "@/components/agora-video-call"
import LiveSessionControls from "@/components/live-session-controls"
import InteractiveWhiteboard from "@/components/interactive-whiteboard"
import AILiveAssistant from "@/components/ai-live-assistant"
import AISessionInsights from "@/components/ai-session-insights"
import AIContentSuggestions from "@/components/ai-content-suggestions"
import { liveSessionService, type LiveSession } from "@/lib/services/liveSessionService"

// Remove the old interface since we're using the one from the service

export default function LiveSessionPage() {
  const params = useParams()
  const router = useRouter()
  const { lang } = useLang()
  const { user } = useAuth()
  const sessionId = params.id as string

  // Session state
  const [session, setSession] = useState<LiveSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [isRegistered, setIsRegistered] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [showChat, setShowChat] = useState(false)

  // AI-related state
  const [showAIAssistant, setShowAIAssistant] = useState(true)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [showAIContent, setShowAIContent] = useState(false)
  const [realTimeData, setRealTimeData] = useState({
    chatMessages: 0,
    handRaises: 0,
    averageEngagement: 75,
    participationRate: 60,
    attentionLevel: 80
  })
  const [currentTopic, setCurrentTopic] = useState<string>()
  const [sessionProgress, setSessionProgress] = useState(0)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load session data
  useEffect(() => {
    loadSessionData()
  }, [sessionId])

  const loadSessionData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load session from API
      const response = await liveSessionService.getSessionById(sessionId)

      if (response.success && response.data) {
        setSession(response.data)
        setParticipantCount(response.data.participantCount || 0)
        setIsRegistered(response.data.isRegistered || false)
      } else {
        setError(response.error?.message || t("Session non trouvée", "Session not found"))
      }
    } catch (err: any) {
      console.error('Failed to load session:', err)
      setError(t("Erreur lors du chargement de la session", "Error loading session"))
    } finally {
      setLoading(false)
    }
  }

  const handleJoinSession = async () => {
    if (!session || isRegistered) return

    try {
      const response = await liveSessionService.joinSession(session.id)
      if (response.success) {
        setIsRegistered(true)
        setParticipantCount(prev => prev + 1)
      }
    } catch (err) {
      console.error('Failed to join session:', err)
    }
  }

  const handleLeaveSession = async () => {
    if (!session || !isRegistered) return

    try {
      const response = await liveSessionService.leaveSession(session.id)
      if (response.success) {
        setIsRegistered(false)
        setParticipantCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Failed to leave session:', err)
    }
  }

  // Enhanced session functions
  const handleToggleRecording = () => {
    setIsRecording(!isRecording)
    // Recording logic is handled in the AgoraVideoCall component
  }

  const handleToggleChat = () => {
    setShowChat(!showChat)
  }

  const handleInviteParticipants = () => {
    // TODO: Implement invite functionality
    const sessionUrl = `${window.location.origin}/live/${sessionId}`
    navigator.clipboard.writeText(sessionUrl)
    // Show toast notification
    console.log('Session URL copied to clipboard:', sessionUrl)
  }

  const handleEndSession = async () => {
    if (!session || !user) return

    const isHost = user.role === 'ADMIN' || user.role === 'SENIOR_MANAGER'
    if (!isHost) return

    try {
      const response = await liveSessionService.updateSessionStatus(sessionId, 'COMPLETED')

      if (response.success) {
        router.push('/live')
      }
    } catch (error) {
      console.error('Error ending session:', error)
    }
  }

  // AI-related functions
  const updateRealTimeData = () => {
    // Simulate real-time data updates
    setRealTimeData(prev => ({
      chatMessages: prev.chatMessages + Math.floor(Math.random() * 3),
      handRaises: prev.handRaises + Math.floor(Math.random() * 2),
      averageEngagement: Math.max(30, Math.min(100, prev.averageEngagement + (Math.random() - 0.5) * 10)),
      participationRate: Math.max(20, Math.min(100, prev.participationRate + (Math.random() - 0.5) * 8)),
      attentionLevel: Math.max(40, Math.min(100, prev.attentionLevel + (Math.random() - 0.5) * 12))
    }))

    // Update session progress based on time
    if (session) {
      const startTime = new Date(session.date).getTime()
      const currentTime = Date.now()
      const sessionDuration = session.duration * 60 * 1000 // Convert to milliseconds
      const progress = Math.min(100, ((currentTime - startTime) / sessionDuration) * 100)
      setSessionProgress(Math.max(0, progress))
    }
  }

  // Update real-time data periodically
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const interval = setInterval(updateRealTimeData, 10000) // Every 10 seconds
      return () => clearInterval(interval)
    }
  }, [connectionStatus, session])

  // Set current topic based on session data
  useEffect(() => {
    if (session) {
      setCurrentTopic(session.title)
    }
  }, [session])



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t("Chargement de la session...", "Loading session...")}</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500 mb-4">{error || t("Session non trouvée", "Session not found")}</p>
            <Button onClick={() => router.push('/live')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("Retour aux sessions", "Back to sessions")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/live')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="font-semibold text-lg">{session.title}</h1>
              <p className="text-sm text-gray-500">
                {session.createdBy ? `${session.createdBy.firstName} ${session.createdBy.lastName}` : t("Instructeur", "Instructor")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
              {connectionStatus === 'connected' ? t('Connecté', 'Connected') : t('Déconnecté', 'Disconnected')}
            </Badge>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {participantCount}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
          {/* Video Area */}
          <div className="xl:col-span-4 space-y-6">
            {/* Enhanced Video Call */}
            <AgoraVideoCall
              channelName={`live-session-${sessionId}`}
              sessionId={sessionId}
              onParticipantCountChange={setParticipantCount}
              onConnectionStatusChange={setConnectionStatus}
              onRecordingStatusChange={setIsRecording}
              isHost={user?.role === 'ADMIN' || user?.role === 'SENIOR_MANAGER'}
              className="h-96"
            />

            {/* Interactive Whiteboard */}
            {showWhiteboard && (
              <InteractiveWhiteboard
                sessionId={sessionId}
                isHost={user?.role === 'ADMIN' || user?.role === 'SENIOR_MANAGER'}
                canDraw={true}
              />
            )}

            {/* Feature Toggles */}
            <div className="flex justify-center gap-2 flex-wrap">
              <Button
                variant={showWhiteboard ? "default" : "outline"}
                onClick={() => setShowWhiteboard(!showWhiteboard)}
                size="sm"
              >
                {showWhiteboard ? t("Masquer le tableau", "Hide Whiteboard") : t("Afficher le tableau", "Show Whiteboard")}
              </Button>
              <Button
                variant={showAIInsights ? "default" : "outline"}
                onClick={() => setShowAIInsights(!showAIInsights)}
                size="sm"
              >
                {showAIInsights ? t("Masquer les insights", "Hide Insights") : t("Insights IA", "AI Insights")}
              </Button>
              <Button
                variant={showAIContent ? "default" : "outline"}
                onClick={() => setShowAIContent(!showAIContent)}
                size="sm"
              >
                {showAIContent ? t("Masquer suggestions", "Hide Suggestions") : t("Suggestions IA", "AI Suggestions")}
              </Button>
            </div>

            {/* AI Session Insights */}
            {showAIInsights && (
              <AISessionInsights
                sessionId={sessionId}
                participants={[]} // TODO: Pass real participants data
                sessionData={session}
                realTimeData={realTimeData}
              />
            )}

            {/* AI Content Suggestions */}
            {showAIContent && (
              <AIContentSuggestions
                sessionData={session}
                currentTopic={currentTopic}
                participantLevel={session?.level}
                sessionProgress={sessionProgress}
                engagementLevel={
                  realTimeData.averageEngagement > 80 ? 'high' :
                  realTimeData.averageEngagement > 50 ? 'medium' : 'low'
                }
              />
            )}
          </div>

          {/* Enhanced Sidebar */}
          <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-6">
            {/* Live Session Controls */}
            <LiveSessionControls
              sessionId={sessionId}
              isHost={user?.role === 'ADMIN' || user?.role === 'SENIOR_MANAGER'}
              participantCount={participantCount}
              isRecording={isRecording}
              onToggleRecording={handleToggleRecording}
              onToggleChat={handleToggleChat}
              onInviteParticipants={handleInviteParticipants}
              onEndSession={handleEndSession}
            />
            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("Informations", "Information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">{t("Instructeur", "Instructor")}</p>
                  <p className="font-medium">
                    {session.createdBy ? `${session.createdBy.firstName} ${session.createdBy.lastName}` : t("Instructeur", "Instructor")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("Durée", "Duration")}</p>
                  <p className="font-medium">{session.duration} {t("minutes", "minutes")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("Participants", "Participants")}</p>
                  <p className="font-medium">{participantCount}/{session.maxParticipants}</p>
                </div>
              </CardContent>
            </Card>

            {/* AI Live Assistant */}
            <div className="h-96">
              <AILiveAssistant
                sessionId={sessionId}
                sessionData={session}
                participants={[]} // TODO: Pass real participants data
                isHost={user?.role === 'ADMIN' || user?.role === 'SENIOR_MANAGER'}
                isVisible={showAIAssistant}
                onToggleVisibility={() => setShowAIAssistant(!showAIAssistant)}
                className="h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

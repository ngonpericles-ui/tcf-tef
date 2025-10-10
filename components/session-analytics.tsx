"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Eye,
  MessageSquare,
  Video,
  Mic,
  Hand,
  Award,
  Target,
  Activity
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"

interface SessionAnalyticsProps {
  sessionId: string
  className?: string
}

interface SessionMetrics {
  totalDuration: number
  averageAttendance: number
  peakAttendance: number
  totalParticipants: number
  engagementScore: number
  completionRate: number
  chatMessages: number
  handRaises: number
  screenShareTime: number
  recordingDuration: number
}

interface ParticipantAnalytics {
  id: string
  name: string
  joinTime: string
  leaveTime: string | null
  duration: number
  engagementScore: number
  chatMessages: number
  handRaises: number
  cameraOnTime: number
  micOnTime: number
}

interface TimelineEvent {
  timestamp: string
  type: 'join' | 'leave' | 'chat' | 'hand_raise' | 'screen_share' | 'recording'
  participant?: string
  description: string
}

export default function SessionAnalytics({
  sessionId,
  className = ""
}: SessionAnalyticsProps) {
  const { lang } = useLang()
  const { user } = useAuth()
  
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null)
  const [participants, setParticipants] = useState<ParticipantAnalytics[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'overview' | 'participants' | 'timeline'>('overview')

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load analytics data
  useEffect(() => {
    loadAnalytics()
  }, [sessionId])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // TODO: Replace with real API calls
      const mockMetrics: SessionMetrics = {
        totalDuration: 3600, // 1 hour
        averageAttendance: 8.5,
        peakAttendance: 12,
        totalParticipants: 15,
        engagementScore: 85,
        completionRate: 78,
        chatMessages: 45,
        handRaises: 23,
        screenShareTime: 1200, // 20 minutes
        recordingDuration: 3400 // 56 minutes
      }

      const mockParticipants: ParticipantAnalytics[] = [
        {
          id: '1',
          name: 'Marie Dubois',
          joinTime: '2024-01-15T14:00:00Z',
          leaveTime: '2024-01-15T15:00:00Z',
          duration: 3600,
          engagementScore: 92,
          chatMessages: 8,
          handRaises: 5,
          cameraOnTime: 3400,
          micOnTime: 2800
        },
        {
          id: '2',
          name: 'Jean Martin',
          joinTime: '2024-01-15T14:05:00Z',
          leaveTime: '2024-01-15T14:45:00Z',
          duration: 2400,
          engagementScore: 67,
          chatMessages: 3,
          handRaises: 2,
          cameraOnTime: 1800,
          micOnTime: 1200
        }
      ]

      const mockTimeline: TimelineEvent[] = [
        {
          timestamp: '2024-01-15T14:00:00Z',
          type: 'join',
          participant: 'Marie Dubois',
          description: 'Marie Dubois a rejoint la session'
        },
        {
          timestamp: '2024-01-15T14:05:00Z',
          type: 'join',
          participant: 'Jean Martin',
          description: 'Jean Martin a rejoint la session'
        },
        {
          timestamp: '2024-01-15T14:15:00Z',
          type: 'screen_share',
          participant: 'Marie Dubois',
          description: 'Partage d\'écran démarré'
        }
      ]

      setMetrics(mockMetrics)
      setParticipants(mockParticipants)
      setTimeline(mockTimeline)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const exportReport = () => {
    // TODO: Generate and download PDF report
    console.log('Exporting analytics report for session:', sessionId)
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            {t("Aucune donnée analytique disponible", "No analytics data available")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {t("Analytiques de session", "Session Analytics")}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            {t("Exporter", "Export")}
          </Button>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex gap-2">
        <Button
          variant={selectedView === 'overview' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('overview')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {t("Vue d'ensemble", "Overview")}
        </Button>
        <Button
          variant={selectedView === 'participants' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('participants')}
        >
          <Users className="h-4 w-4 mr-2" />
          {t("Participants", "Participants")}
        </Button>
        <Button
          variant={selectedView === 'timeline' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('timeline')}
        >
          <Activity className="h-4 w-4 mr-2" />
          {t("Chronologie", "Timeline")}
        </Button>
      </div>

      {/* Overview */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Key Metrics */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("Durée totale", "Total Duration")}</p>
                  <p className="text-2xl font-bold">{formatDuration(metrics.totalDuration)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("Participants", "Participants")}</p>
                  <p className="text-2xl font-bold">{metrics.totalParticipants}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("Pic:", "Peak:")} {metrics.peakAttendance}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("Engagement", "Engagement")}</p>
                  <p className={`text-2xl font-bold ${getEngagementColor(metrics.engagementScore)}`}>
                    {metrics.engagementScore}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("Taux de completion", "Completion Rate")}</p>
                  <p className="text-2xl font-bold">{metrics.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">{t("Détails d'engagement", "Engagement Details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{t("Messages chat", "Chat Messages")}</span>
                </div>
                <Badge variant="outline">{metrics.chatMessages}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hand className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{t("Mains levées", "Hand Raises")}</span>
                </div>
                <Badge variant="outline">{metrics.handRaises}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t("Partage d'écran", "Screen Share")}</span>
                </div>
                <Badge variant="outline">{formatDuration(metrics.screenShareTime)}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Chart */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">{t("Présence moyenne", "Average Attendance")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t("Présence moyenne", "Average Attendance")}</span>
                  <span>{metrics.averageAttendance} / {metrics.totalParticipants}</span>
                </div>
                <Progress value={(metrics.averageAttendance / metrics.totalParticipants) * 100} />
                
                <div className="flex justify-between text-sm">
                  <span>{t("Taux de completion", "Completion Rate")}</span>
                  <span>{metrics.completionRate}%</span>
                </div>
                <Progress value={metrics.completionRate} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Participants View */}
      {selectedView === 'participants' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("Analyse des participants", "Participant Analysis")} ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {participants.map((participant) => (
                <div key={participant.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{participant.name}</h3>
                    <Badge 
                      variant="outline" 
                      className={getEngagementColor(participant.engagementScore)}
                    >
                      {t("Engagement", "Engagement")}: {participant.engagementScore}%
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t("Durée", "Duration")}</p>
                      <p className="font-medium">{formatDuration(participant.duration)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("Messages", "Messages")}</p>
                      <p className="font-medium">{participant.chatMessages}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("Mains levées", "Hand Raises")}</p>
                      <p className="font-medium">{participant.handRaises}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("Caméra active", "Camera On")}</p>
                      <p className="font-medium">{Math.round((participant.cameraOnTime / participant.duration) * 100)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {selectedView === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("Chronologie de la session", "Session Timeline")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

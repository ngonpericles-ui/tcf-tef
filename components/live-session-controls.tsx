"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { 
  Settings,
  Volume2,
  VolumeX,
  Users,
  MessageSquare,
  Share2,
  Download,
  Eye,
  EyeOff,
  Palette,
  Grid3X3,
  Maximize2,
  MoreVertical,
  UserPlus,
  UserMinus,
  Shield,
  AlertTriangle
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"

interface LiveSessionControlsProps {
  sessionId: string
  isHost?: boolean
  participantCount: number
  isRecording: boolean
  onToggleRecording?: () => void
  onToggleChat?: () => void
  onInviteParticipants?: () => void
  onEndSession?: () => void
  className?: string
}

interface Participant {
  id: string
  name: string
  role: 'host' | 'participant'
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isHandRaised: boolean
}

export default function LiveSessionControls({
  sessionId,
  isHost = false,
  participantCount,
  isRecording,
  onToggleRecording,
  onToggleChat,
  onInviteParticipants,
  onEndSession,
  className = ""
}: LiveSessionControlsProps) {
  const { lang } = useLang()
  const { user } = useAuth()
  
  const [participants, setParticipants] = useState<Participant[]>([])
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'speaker' | 'gallery'>('grid')
  const [showParticipants, setShowParticipants] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load participants
  useEffect(() => {
    // TODO: Load participants from API
    const mockParticipants: Participant[] = [
      {
        id: '1',
        name: 'Marie Dubois',
        role: 'host',
        isAudioEnabled: true,
        isVideoEnabled: true,
        isHandRaised: false
      },
      {
        id: '2',
        name: 'Jean Martin',
        role: 'participant',
        isAudioEnabled: true,
        isVideoEnabled: false,
        isHandRaised: true
      }
    ]
    setParticipants(mockParticipants)
  }, [sessionId])

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(100)
      setIsMuted(false)
    } else {
      setVolume(0)
      setIsMuted(true)
    }
  }

  const handleKickParticipant = (participantId: string) => {
    if (!isHost) return
    // TODO: Implement kick participant
    console.log('Kick participant:', participantId)
  }

  const handleMuteParticipant = (participantId: string) => {
    if (!isHost) return
    // TODO: Implement mute participant
    console.log('Mute participant:', participantId)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Session Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            {t("Contrôles de session", "Session Controls")}
            <div className="flex items-center gap-2">
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full mr-1" />
                  {t("REC", "REC")}
                </Badge>
              )}
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {participantCount}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Volume Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {t("Volume", "Volume")}
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="h-8 w-8 p-0"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* View Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("Mode d'affichage", "View Mode")}
            </label>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                {t("Grille", "Grid")}
              </Button>
              <Button
                variant={viewMode === 'speaker' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('speaker')}
              >
                <Maximize2 className="h-4 w-4 mr-1" />
                {t("Orateur", "Speaker")}
              </Button>
              <Button
                variant={viewMode === 'gallery' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('gallery')}
              >
                <Eye className="h-4 w-4 mr-1" />
                {t("Galerie", "Gallery")}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleChat}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              {t("Chat", "Chat")}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <Users className="h-4 w-4 mr-1" />
              {t("Participants", "Participants")}
            </Button>

            {isHost && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onInviteParticipants}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  {t("Inviter", "Invite")}
                </Button>

                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={onToggleRecording}
                >
                  {isRecording ? (
                    <>
                      <div className="w-2 h-2 bg-white rounded-full mr-2" />
                      {t("Arrêter", "Stop")}
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                      {t("Enregistrer", "Record")}
                    </>
                  )}
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-1" />
              {t("Paramètres", "Settings")}
            </Button>
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="pt-2 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* TODO: Share session link */}}
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  {t("Partager", "Share")}
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onEndSession}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {t("Terminer", "End Session")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants Panel */}
      {showParticipants && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {t("Participants", "Participants")} ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {participant.role === 'host' && (
                        <Shield className="h-3 w-3 text-blue-500" />
                      )}
                      <span className="text-sm font-medium">{participant.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {!participant.isAudioEnabled && (
                        <Badge variant="secondary" className="text-xs">
                          {t("Muet", "Muted")}
                        </Badge>
                      )}
                      {!participant.isVideoEnabled && (
                        <Badge variant="secondary" className="text-xs">
                          {t("Caméra off", "Camera off")}
                        </Badge>
                      )}
                      {participant.isHandRaised && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700">
                          {t("Main levée", "Hand raised")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {isHost && participant.role !== 'host' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("Actions", "Actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleMuteParticipant(participant.id)}>
                          <VolumeX className="h-4 w-4 mr-2" />
                          {t("Couper le micro", "Mute")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleKickParticipant(participant.id)}>
                          <UserMinus className="h-4 w-4 mr-2" />
                          {t("Exclure", "Remove")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

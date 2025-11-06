"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { X, Search, Mic, MicOff, Video, VideoOff, MoreVertical, Crown, Hand } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Participant {
  id: string
  name: string
  isMuted: boolean
  isVideoOn: boolean
  hasHandRaised: boolean
  isHost: boolean
  role: "ADMIN" | "SENIOR_MANAGER" | "JUNIOR_MANAGER" | "STUDENT"
}

interface ParticipantsPanelProps {
  onClose: () => void
  participants?: Participant[]
  currentUserRole?: "ADMIN" | "SENIOR_MANAGER" | "JUNIOR_MANAGER" | "STUDENT"
  onMuteParticipant?: (participantId: string) => void
  onPinParticipant?: (participantId: string) => void
  onRemoveParticipant?: (participantId: string) => void
  onLowerHand?: (participantId: string) => void
}

export function ParticipantsPanel({ 
  onClose, 
  participants = [], 
  currentUserRole = "STUDENT",
  onMuteParticipant,
  onPinParticipant,
  onRemoveParticipant,
  onLowerHand
}: ParticipantsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredParticipants = participants.filter(participant =>
    participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const canManageParticipants = currentUserRole === "ADMIN" || currentUserRole === "SENIOR_MANAGER"

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Participants ({participants.length})</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search participants..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredParticipants.length > 0 ? (
            filteredParticipants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group"
              >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {participant.profilePicture ? (
                  <img 
                    src={participant.profilePicture} 
                    alt={participant.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-primary">{participant.name.charAt(0)}</span>
                  </div>
                )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{participant.name}</span>
                      {participant.isHost && <Crown className="w-3 h-3 text-accent flex-shrink-0" />}
                      {participant.hasHandRaised && <span className="text-xs">✋</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {participant.isMuted ? (
                    <MicOff className="w-4 h-4 text-destructive" />
                  ) : (
                    <Mic className="w-4 h-4 text-muted-foreground" />
                  )}
                  {participant.isVideoOn ? (
                    <Video className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <VideoOff className="w-4 h-4 text-muted-foreground" />
                  )}

                  {canManageParticipants && !participant.isHost && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onMuteParticipant?.(participant.id)}>
                          {participant.isMuted ? "Unmute participant" : "Mute participant"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPinParticipant?.(participant.id)}>
                          Pin video
                        </DropdownMenuItem>
                        {participant.hasHandRaised && onLowerHand && (
                          <DropdownMenuItem onClick={() => onLowerHand(participant.id)}>
                            <Hand className="w-4 h-4 mr-2" />
                            Lower hand
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onRemoveParticipant?.(participant.id)}
                        >
                          Remove from session
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center">
              <p className="text-muted-foreground text-sm">
                {searchTerm ? "No participants found" : "No participants yet"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

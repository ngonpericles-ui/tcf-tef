"use client"

import { User, Mic, MicOff, Video, VideoOff, Pin, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { memo, useRef, useEffect } from "react"

interface Participant {
  id: string
  name: string
  isMuted: boolean
  isVideoOn: boolean
  isPresenting: boolean
  hasHandRaised: boolean
  profilePicture?: string
}

interface VideoGridProps {
  role: "student" | "tutor"
  participants?: Participant[]
  screenShareStream?: MediaStream | null
  isScreenSharing?: boolean
  localVideoStream?: MediaStream | null
  isVideoOn?: boolean
}

const ParticipantCard = memo(({ participant, role }: { participant: Participant; role: "student" | "tutor" }) => {
  return (
    <div
      className={cn(
        "relative aspect-video bg-slate-800 rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl",
        participant.isPresenting ? "border-blue-400 ring-4 ring-blue-400/30 shadow-blue-400/20" : "border-white/20",
        participant.hasHandRaised && "ring-4 ring-yellow-400/50 shadow-yellow-400/20",
      )}
    >
      {/* Video placeholder or actual video */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
        {participant.isVideoOn ? (
          <div className="w-full h-full bg-black flex items-center justify-center">
            <div className="text-white/60 text-sm">Video Stream</div>
          </div>
        ) : (
          <>
            {participant.profilePicture ? (
              <img 
                src={participant.profilePicture} 
                alt={participant.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-lg"
              />
            ) : (
              <div className="bg-white/10 rounded-full p-8 backdrop-blur-sm border border-white/20">
                <User className="w-10 h-10 text-white/80" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Participant info overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-semibold truncate">{participant.name}</span>
            {participant.hasHandRaised && (
              <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-bold animate-pulse">✋</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {participant.isMuted ? (
              <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <MicOff className="w-3 h-3 text-red-400" />
              </div>
            ) : (
              <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                <Mic className="w-3 h-3 text-green-400" />
              </div>
            )}
            {!participant.isVideoOn && (
              <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <VideoOff className="w-3 h-3 text-red-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pin button for tutor */}
      {role === "tutor" && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-3 right-3 w-8 h-8 p-0 opacity-0 hover:opacity-100 transition-all duration-300 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm"
        >
          <Pin className="w-4 h-4 text-white" />
        </Button>
      )}

      {/* Presenting indicator */}
      {participant.isPresenting && (
        <div className="absolute top-3 left-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
          Presenting
        </div>
      )}
    </div>
  )
})

ParticipantCard.displayName = "ParticipantCard"

const ScreenSharePreview = memo(({ stream }: { stream: MediaStream }) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      // Add a small delay to prevent AbortError
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch((error) => {
            console.log("Video play error (handled):", error.name)
            // Try again after a short delay
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.play().catch(console.error)
              }
            }, 100)
          })
        }
      }, 100)
    }
  }, [stream])

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border-2 border-blue-400 ring-4 ring-blue-400/30 shadow-2xl shadow-blue-400/20">
      <div className="bg-gradient-to-r from-blue-500/30 to-blue-600/30 px-6 py-3 border-b border-blue-400/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Monitor className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-blue-400 font-bold text-lg">Screen Sharing</span>
            <p className="text-blue-300 text-sm">Live presentation in progress</p>
          </div>
        </div>
      </div>
      <div className="aspect-video bg-black relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain"
          style={{ maxHeight: '100%' }}
        />
        {/* Overlay indicator */}
        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
          LIVE
        </div>
      </div>
    </div>
  )
})

ScreenSharePreview.displayName = "ScreenSharePreview"

const LocalVideoPreview = memo(({ stream, isVideoOn }: { stream: MediaStream | null; isVideoOn: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream && isVideoOn) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(console.error)
    }
  }, [stream, isVideoOn])

  if (!isVideoOn) return null

  return (
    <div className="col-span-1">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden border-2 border-green-400 ring-2 ring-green-400/30 shadow-lg shadow-green-400/20">
        <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 px-4 py-2 border-b border-green-400/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-semibold text-sm">Your Camera</span>
          </div>
        </div>
        <div className="aspect-video bg-black relative">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white/60 text-sm">Loading camera...</div>
            </div>
          )}
          {/* Status indicator */}
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            ON
          </div>
        </div>
      </div>
    </div>
  )
})

LocalVideoPreview.displayName = "LocalVideoPreview"

interface VideoGridProps {
  role: "tutor" | "student"
  participants?: Participant[]
  screenShareStream?: MediaStream | null
  isScreenSharing?: boolean
  localVideoStream?: MediaStream | null
  isVideoOn?: boolean
  hasCamera?: boolean | null
  cameraError?: string | null
}

export function VideoGrid({ role, participants, screenShareStream, isScreenSharing, localVideoStream, isVideoOn, hasCamera, cameraError }: VideoGridProps) {
  // Use provided participants or show empty state
  const participantsToRender = participants || []

  // Debug logging
  console.log("VideoGrid - participants:", participants)
  console.log("VideoGrid - participantsToRender:", participantsToRender)

  // Determine if we should show the main camera view (like Google Meet)
  const hasMainVideo = (localVideoStream && isVideoOn) || (isVideoOn && hasCamera === false)
  const hasRemoteParticipants = participantsToRender.length > 0
  
  // If there are remote participants, show them in the main area (like Google Meet)
  // Only show local video in main area if no remote participants
  const shouldShowMainVideo = hasMainVideo && !hasRemoteParticipants

  console.log("VideoGrid - hasMainVideo:", hasMainVideo)
  console.log("VideoGrid - hasRemoteParticipants:", hasRemoteParticipants)

  return (
    <div className="flex-1 overflow-hidden bg-black">
      {/* Main Video Area - Big and Centered like Google Meet */}
      {shouldShowMainVideo && (
        <div className="h-full flex items-center justify-center p-4">
          <div className="w-full max-w-4xl aspect-video">
            {/* Local Video Preview - Main View */}
            {localVideoStream && isVideoOn && (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border-2 border-green-400 ring-4 ring-green-400/30 shadow-2xl shadow-green-400/20">
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
                <div className="aspect-video bg-black relative">
                  <video
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    ref={(video) => {
                      if (video && localVideoStream) {
                        video.srcObject = localVideoStream
                        video.play().catch(console.error)
                      }
                    }}
                  />
                  {/* Status indicator */}
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                    LIVE
                  </div>
                </div>
              </div>
            )}
            
            {/* Camera Error Display - Main View */}
            {isVideoOn && hasCamera === false && (
              <div className="w-full h-full bg-gradient-to-br from-red-900/50 to-red-800/50 rounded-2xl overflow-hidden border-2 border-red-500 ring-4 ring-red-500/30 shadow-2xl shadow-red-500/20">
                <div className="bg-gradient-to-r from-red-500/30 to-red-600/30 px-6 py-3 border-b border-red-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <VideoOff className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-red-400 font-bold text-lg">Camera Error</span>
                      <p className="text-red-300 text-sm">Device not available</p>
                    </div>
                  </div>
                </div>
                <div className="aspect-video bg-black relative flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <VideoOff className="w-10 h-10 text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-red-300 mb-2">Camera Not Available</h3>
                    <p className="text-red-400 text-lg font-medium">{cameraError || "No camera found"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen Share Preview - Full Screen */}
      {isScreenSharing && screenShareStream && (
        <div className="h-full flex items-center justify-center p-4">
          <div className="w-full max-w-6xl aspect-video">
            <ScreenSharePreview stream={screenShareStream} />
          </div>
        </div>
      )}

      {/* Participants Grid - Main video area like Google Meet */}
      {hasRemoteParticipants && (
        <div className="h-full flex items-center justify-center p-4">
          <div className="w-full max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Local video if on */}
              {hasMainVideo && (
                <div className="aspect-video bg-gradient-to-br from-green-900 to-green-800 rounded-xl overflow-hidden border-2 border-green-400 shadow-lg">
                  <LocalVideoPreview stream={localVideoStream || null} isVideoOn={isVideoOn} />
                </div>
              )}
              
              {/* Remote participants */}
              {participantsToRender.map((participant) => (
                <div key={participant.id} className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden border border-white/20 shadow-lg">
                  <ParticipantCard participant={participant} role={role} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Waiting for participants - Only show when no main video and no participants */}
      {!shouldShowMainVideo && !hasRemoteParticipants && (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/20">
              <User className="w-16 h-16 text-white/60" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">Waiting for participants</h3>
            <p className="text-white/60 text-lg">Participants will appear here when they join the session</p>
          </div>
        </div>
      )}
    </div>
  )
}

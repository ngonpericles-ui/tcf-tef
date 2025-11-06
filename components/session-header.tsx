import { Circle, Users, Clock } from "lucide-react"

interface SessionHeaderProps {
  title?: string
  instructor?: string
  participantCount?: number
  isRecording?: boolean
  sessionStatus?: "SCHEDULED" | "LIVE" | "ENDED"
  startTime?: Date
  endTime?: Date
  currentUserRole?: "ADMIN" | "SENIOR_MANAGER" | "JUNIOR_MANAGER" | "STUDENT"
}

export function SessionHeader({ 
  title = "Live Session",
  instructor = "Instructor",
  participantCount = 0,
  isRecording = false,
  sessionStatus = "LIVE",
  startTime,
  endTime,
  currentUserRole = "STUDENT"
}: SessionHeaderProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIVE":
        return "text-green-400 bg-green-500/20 border-green-500/30"
      case "SCHEDULED":
        return "text-blue-400 bg-blue-500/20 border-blue-500/30"
      case "ENDED":
        return "text-gray-400 bg-gray-500/20 border-gray-500/30"
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30"
    }
  }

  return (
    <header className="bg-black/60 backdrop-blur-lg border-b border-white/10 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
            <div className="flex items-center gap-6 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Instructor: <span className="font-medium text-white">{instructor}</span>
              </span>
              {startTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{formatTime(startTime)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(sessionStatus)} border border-white/20 backdrop-blur-sm`}>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>
              {sessionStatus}
            </span>
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full border border-red-500/30 backdrop-blur-sm">
              <Circle className="w-3 h-3 fill-current animate-pulse" />
              <span className="text-sm font-semibold">Recording</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-white/80 bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm">
            <Users className="w-4 h-4" />
            <span className="font-semibold">{participantCount} participants</span>
          </div>
        </div>
      </div>
    </header>
  )
}

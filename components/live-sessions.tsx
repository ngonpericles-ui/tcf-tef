"use client"

import { useState, useEffect } from "react"
import { useLang } from "./language-provider"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  Users, 
  Calendar, 
  Clock, 
  Play, 
  Star, 
  Heart, 
  MessageCircle, 
  Share2,
  Video,
  Mic,
  Radio,
  Eye,
  Timer,
  UserCheck,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { liveSessionService, type LiveSession } from "@/lib/services/liveSessionService"

export default function LiveSessions() {
  const { lang, t } = useLang()
  const { user } = useAuth()
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const router = useRouter()

  // Load live sessions
  useEffect(() => {
    loadLiveSessions()
  }, [])

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const loadLiveSessions = async () => {
    try {
      setLoading(true)

      // Load live and upcoming sessions
      const response = await liveSessionService.getAllSessions(
        { page: 1, limit: 10, sortBy: 'date', sortOrder: 'asc' },
        { status: 'LIVE,SCHEDULED' }
      )

      if (response.success && response.data) {
        setActiveSessions(response.data.sessions || [])
      }
    } catch (err) {
      console.error('Failed to load live sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter sessions that should be displayed (live, starting soon, or scheduled within 2 hours)
  const visibleSessions = activeSessions.filter(session => {
    if (session.status === "live" || session.status === "starting_soon") {
      return true
    }
    // Show scheduled sessions starting within 2 hours
    const sessionStart = new Date()
    const [hours, minutes] = session.startTime.split(':').map(Number)
    sessionStart.setHours(hours, minutes, 0, 0)
    const timeDiff = sessionStart.getTime() - currentTime.getTime()
    return timeDiff <= 2 * 60 * 60 * 1000 && timeDiff > 0 // Within 2 hours
  })

  // Show empty state if no active sessions
  if (visibleSessions.length === 0) {
    return (
      <section id="live-sessions" className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Video className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-[var(--font-poppins)]">
                {lang === "fr" ? "Sessions Live" : "Live Sessions"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {lang === "fr" ? "Rejoignez nos experts en temps réel" : "Join our experts in real-time"}
              </p>
            </div>
          </div>
          <Link href="/live">
            <Button variant="outline" className="gap-2">
              {lang === "fr" ? "Voir tout" : "View all"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            {lang === "fr" ? "Aucune session live" : "No live sessions"}
          </h3>
          <p className="text-muted-foreground">
            {lang === "fr" ? "Les sessions live seront bientôt disponibles" : "Live sessions will be available soon"}
          </p>
        </div>
      </section>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return (
          <Badge className="bg-red-500 text-white animate-pulse">
            <Radio className="h-3 w-3 mr-1" />
            LIVE
          </Badge>
        )
      case "starting_soon":
        return (
          <Badge className="bg-orange-500 text-white">
            <Timer className="h-3 w-3 mr-1" />
            {lang === "fr" ? "Bientôt" : "Starting Soon"}
          </Badge>
        )
      case "scheduled":
        return (
          <Badge variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            {lang === "fr" ? "Programmé" : "Scheduled"}
          </Badge>
        )
      default:
        return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "expression_orale": return "#E74C3C"
      case "grammaire": return "#8E44AD" 
      case "simulation": return "#2ECC71"
      case "vocabulaire": return "#F39C12"
      default: return "#007BFF"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "#2ECC71"
      case "intermediate": return "#F39C12"
      case "advanced": return "#E74C3C"
      default: return "#007BFF"
    }
  }

  return (
    <section id="live-sessions" className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <Video className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-[var(--font-poppins)]">
              {lang === "fr" ? "Sessions Live" : "Live Sessions"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {lang === "fr" ? "Rejoignez nos experts en temps réel" : "Join our experts in real-time"}
            </p>
          </div>
        </div>
        <Link href="/live">
          <Button variant="outline" className="gap-2">
            {lang === "fr" ? "Voir tout" : "View all"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {visibleSessions.map((session) => (
          <Card key={session.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div 
              className="absolute top-0 left-0 w-full h-1"
              style={{ backgroundColor: getTypeColor(session.type) }}
            />
            
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                
                {/* Session Info */}
                <div className="flex-1 space-y-4">
                  
                  {/* Header with status and badges */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(session.status)}
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: `${getDifficultyColor(session.difficulty)}40`,
                            color: getDifficultyColor(session.difficulty)
                          }}
                        >
                          {session.level}
                        </Badge>
                      </div>
                      
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {session.title}
                      </h3>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {session.description}
                      </p>
                    </div>
                  </div>

                  {/* Instructor Info */}
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{session.instructor}</p>
                      <p className="text-xs text-muted-foreground">
                        {lang === "fr" ? "Instructeur certifié" : "Certified instructor"}
                      </p>
                    </div>
                  </div>

                  {/* Session Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {lang === "fr" ? "Horaire" : "Time"}
                        </p>
                        <p className="text-sm font-medium">
                          {session.startTime} - {session.endTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                      <Users className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {lang === "fr" ? "Participants" : "Participants"}
                        </p>
                        <p className="text-sm font-medium">
                          {session.currentParticipants}/{session.maxParticipants}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                      <Timer className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {lang === "fr" ? "Durée" : "Duration"}
                        </p>
                        <p className="text-sm font-medium">
                          {session.duration} min
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {session.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Live Stats */}
                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">{session.viewers}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-muted-foreground">{session.likes}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">{session.comments}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 lg:min-w-[200px]">
                  {session.status === "live" && (
                    <Link href={`/live/${session.id}`}>
                      <Button 
                        className="w-full bg-red-500 hover:bg-red-600 text-white gap-2 animate-pulse"
                        size="lg"
                      >
                        <Play className="h-4 w-4" />
                        {lang === "fr" ? "Rejoindre maintenant" : "Join now"}
                      </Button>
                    </Link>
                  )}
                  
                  {session.status === "starting_soon" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          className="w-full gap-2"
                          style={{ backgroundColor: getTypeColor(session.type) }}
                          size="lg"
                        >
                          <Sparkles className="h-4 w-4" />
                          {lang === "fr" ? "Se préparer" : "Get ready"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="backdrop-blur bg-background/80 border-gray-200 dark:border-gray-700">
                        <DropdownMenuItem onClick={() => router.push('/tests')}>
                          {lang === 'fr' ? "Se préparer avec des tests" : "Prepare with tests"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/cours')}>
                          {lang === 'fr' ? "Réviser mes cours" : "Review my courses"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/tcf-tef-simulation')}>
                          {lang === 'fr' ? "Se préparer avec des simulations" : "Prepare with simulations"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                  {session.status === "scheduled" && (
                    <Link href={`/live/${session.id}`}>
                      <Button variant="outline" className="w-full gap-2" size="lg">
                        <Calendar className="h-4 w-4" />
                        {lang === "fr" ? "S'inscrire" : "Register"}
                      </Button>
                    </Link>
                  )}

                  <Link href={`/live/${session.id}/details`}>
                    <Button variant="ghost" className="w-full text-sm">
                      {lang === "fr" ? "Voir les détails" : "View details"}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

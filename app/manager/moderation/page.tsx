"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import {
  Video,
  Users,
  Shield,
  AlertTriangle,
  Eye,
  Mic,
  MicOff,
  VideoOff,
  UserX,
  Flag,
  Clock,
  Search,
  Crown,
  BookOpen,
  User,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LiveSession {
  id: number
  title: string
  instructor: string
  participants: number
  maxParticipants: number
  status: "live" | "scheduled" | "ended"
  startTime: string
  duration: number
  level: string
  type: string
  reports: number
  moderationNeeded: boolean
}

interface Participant {
  id: number
  name: string
  avatar: string
  role: "student" | "instructor" | "moderator"
  status: "active" | "muted" | "kicked" | "warned"
  joinTime: string
  reports: number
  micEnabled: boolean
  videoEnabled: boolean
}

interface ModerationAction {
  id: number
  sessionId: number
  participantId: number
  action: "mute" | "kick" | "warn" | "ban"
  reason: string
  timestamp: string
  moderator: string
}

interface ManagerRole {
  role: "junior" | "content" | "senior"
  permissions: {
    moderateContent: boolean
    manageUsers: boolean
    viewAnalytics: boolean
  }
}

export default function LiveModerationPage() {
  const { t } = useLanguage()
  const { user, isAuthenticated, isManager, isAdmin } = useAuth()
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith("/admin")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null)
  const [currentManager, setCurrentManager] = useState<ManagerRole | null>(null)
  const [moderationActions, setModerationActions] = useState<ModerationAction[]>([])
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  const [contentReports, setContentReports] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("sessions")

  useEffect(() => {
    if (!user) return

    // Set current manager from user data
    const manager = {
      role: user.role === 'SENIOR_MANAGER' ? 'senior' as const :
            user.role === 'JUNIOR_MANAGER' ? 'junior' as const :
            user.role === 'ADMIN' ? 'senior' as const : 'content' as const, // Default to content
      permissions: {
        moderateContent: user.role === 'SENIOR_MANAGER' || user.role === 'ADMIN',
        manageUsers: user.role === 'SENIOR_MANAGER' || user.role === 'ADMIN',
        viewAnalytics: user.role === 'ADMIN',
      },
    }
    setCurrentManager(manager)
  }, [user])

  // Fetch live sessions from backend
  useEffect(() => {
    const fetchLiveSessions = async () => {
      if (!isAuthenticated || (!isManager && !isAdmin)) return

      try {
        setLoading(true)
        const response = await apiClient.get('/live-sessions')

        if (response.success && response.data) {
          const responseData = response.data as any
          const sessions = Array.isArray(responseData) ? responseData :
                          Array.isArray(responseData.data) ? responseData.data : []

          // Transform backend data to match component expectations
          const transformedSessions: LiveSession[] = sessions.map((session: any) => ({
            id: session.id,
            title: session.title,
            instructor: session.instructor,
            participants: session.registrations?.length || 0,
            maxParticipants: session.maxParticipants,
            status: session.status?.toLowerCase() || 'scheduled',
            startTime: session.date,
            duration: session.duration,
            level: session.level || 'A1',
            type: session.category || 'General',
            reports: 0, // This would come from a moderation system
            moderationNeeded: false // This would be calculated based on reports
          }))

          setLiveSessions(transformedSessions)
        }
      } catch (error) {
        console.error('Error fetching live sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLiveSessions()
  }, [isAuthenticated, isManager, isAdmin])

  // Fetch reports and content moderation data
  useEffect(() => {
    const fetchModerationData = async () => {
      if (!isAuthenticated || (!isManager && !isAdmin)) return

      try {
        // Fetch user reports
        const reportsResponse = await apiClient.get('/admin/reports')
        if (reportsResponse.success && reportsResponse.data) {
          setReports(Array.isArray(reportsResponse.data) ? reportsResponse.data : [])
        }

        // Fetch content reports (posts, comments)
        const contentResponse = await apiClient.get('/admin/content/reports')
        if (contentResponse.success && contentResponse.data) {
          setContentReports(Array.isArray(contentResponse.data) ? contentResponse.data : [])
        }

        // Fetch moderation actions history
        const actionsResponse = await apiClient.get('/admin/moderation/actions')
        if (actionsResponse.success && actionsResponse.data) {
          setModerationActions(Array.isArray(actionsResponse.data) ? actionsResponse.data : [])
        }
      } catch (error) {
        console.error('Error fetching moderation data:', error)
      }
    }

    fetchModerationData()
  }, [isAuthenticated, isManager, isAdmin])

  // Participants will be fetched from backend when a session is selected
  const [participants, setParticipants] = useState<Participant[]>([])

  const getRoleInfo = (role: string) => {
    if (isAdminRoute) {
      return {
        label: t("Admin", "Admin"),
        icon: Crown,
        color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      }
    }
    switch (role) {
      case "senior":
        return {
          label: t("Senior Manager", "Senior Manager"),
          icon: Crown,
          color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        }
      case "content":
        return {
          label: t("Content Manager", "Content Manager"),
          icon: BookOpen,
          color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        }
      case "junior":
        return {
          label: t("Junior Manager", "Junior Manager"),
          icon: User,
          color: "bg-green-500/10 text-green-400 border-green-500/20",
        }
      default:
        return {
          label: t("Manager", "Manager"),
          icon: User,
          color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "scheduled":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "ended":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const getParticipantStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "muted":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "warned":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "kicked":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const handleModerationAction = async (participantId: number, action: string, reason: string) => {
    try {
      const newAction: ModerationAction = {
        id: Date.now(),
        sessionId: selectedSession?.id || 0,
        participantId,
        action: action as "mute" | "kick" | "warn" | "ban",
        reason,
        timestamp: new Date().toISOString(),
        moderator: currentManager?.role || "manager",
      }

      // Call backend API for moderation action
      const response = await apiClient.post(`/live-sessions/${selectedSession?.id}/moderate`, {
        participantId,
        action,
        reason,
        moderatorId: user?.id
      })

      if (response.success) {
        setModerationActions((prev) => [newAction, ...prev])
        console.log(`Moderation action ${action} applied successfully`)
      } else {
        console.error('Failed to apply moderation action:', response.error)
      }
    } catch (error) {
      console.error('Error applying moderation action:', error)
      // Still add to local state for UI feedback
      const newAction: ModerationAction = {
        id: Date.now(),
        sessionId: selectedSession?.id || 0,
        participantId,
        action: action as "mute" | "kick" | "warn" | "ban",
        reason,
        timestamp: new Date().toISOString(),
        moderator: currentManager?.role || "manager",
      }
      setModerationActions((prev) => [newAction, ...prev])
    }
  }

  const handleContentModeration = async (contentId: number, contentType: 'post' | 'comment', action: 'approve' | 'reject' | 'delete', reason?: string) => {
    try {
      const response = await apiClient.post(`/admin/content/${contentType}s/${contentId}/moderate`, {
        action,
        reason,
        moderatorId: user?.id
      })

      if (response.success) {
        // Update content reports list
        setContentReports(prev => prev.map(report =>
          report.contentId === contentId && report.contentType === contentType
            ? { ...report, status: action, moderatedAt: new Date().toISOString() }
            : report
        ))
        console.log(`Content ${action} applied successfully`)
      } else {
        console.error('Failed to moderate content:', response.error)
      }
    } catch (error) {
      console.error('Error moderating content:', error)
    }
  }

  const handleReportAction = async (reportId: number, action: 'resolve' | 'dismiss' | 'escalate', notes?: string) => {
    try {
      const response = await apiClient.post(`/admin/reports/${reportId}/action`, {
        action,
        notes,
        moderatorId: user?.id
      })

      if (response.success) {
        // Update reports list
        setReports(prev => prev.map(report =>
          report.id === reportId
            ? { ...report, status: action, resolvedAt: new Date().toISOString(), notes }
            : report
        ))
        console.log(`Report ${action} applied successfully`)
      } else {
        console.error('Failed to handle report:', response.error)
      }
    } catch (error) {
      console.error('Error handling report:', error)
    }
  }

  const getAvailableLevels = (role: string) => {
    switch (role) {
      case "junior":
        return ["A1", "A2", "B1"]
      case "content":
      case "senior":
        return ["A1", "A2", "B1", "B2", "C1", "C2"]
      default:
        return ["A1", "A2", "B1"]
    }
  }

  const toggleLevelSelection = (level: string) => {
    setSelectedLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]))
  }

  const filteredSessions = liveSessions.filter((session) => {
    const matchesSearch =
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || session.status === filterStatus
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(session.level)

    return matchesSearch && matchesStatus && matchesLevel
  })

  if (!currentManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  if (!currentManager.permissions.moderateContent) {
    const roleInfo = getRoleInfo(currentManager.role)
    const RoleIcon = roleInfo.icon

    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">{t("Accès restreint", "Access Restricted")}</h2>
              <p className="text-muted-foreground mb-4">
                {t(
                  "Votre rôle ne vous permet pas d'accéder à la modération live.",
                  "Your role does not allow access to live moderation.",
                )}
              </p>
              <Badge variant="outline" className={cn("text-sm", roleInfo.color)}>
                <RoleIcon className="w-4 h-4 mr-2" />
                {roleInfo.label}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const roleInfo = getRoleInfo(currentManager.role)
  const RoleIcon = roleInfo.icon

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("Centre de Modération", "Moderation Center")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("Surveillez et modérez les sessions, contenus et signalements", "Monitor and moderate sessions, content and reports")}
            </p>
          </div>
          <Badge variant="outline" className={cn("text-sm", roleInfo.color)}>
            <RoleIcon className="w-4 h-4 mr-2" />
            {roleInfo.label}
          </Badge>
        </div>

        {/* Moderation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="sessions" className="data-[state=active]:bg-background">
              <Video className="w-4 h-4 mr-2" />
              {t("Sessions Live", "Live Sessions")}
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-background">
              <Flag className="w-4 h-4 mr-2" />
              {t("Signalements", "Reports")} ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-background">
              <BookOpen className="w-4 h-4 mr-2" />
              {t("Contenu", "Content")} ({contentReports.length})
            </TabsTrigger>
            <TabsTrigger value="actions" className="data-[state=active]:bg-background">
              <Shield className="w-4 h-4 mr-2" />
              {t("Actions", "Actions")} ({moderationActions.length})
            </TabsTrigger>
          </TabsList>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{liveSessions.filter(s => s.status === 'live').length}</p>
                  <p className="text-sm text-muted-foreground">{t("Sessions actives", "Active Sessions")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{liveSessions.reduce((acc, s) => acc + s.participants, 0)}</p>
                  <p className="text-sm text-muted-foreground">{t("Participants totaux", "Total Participants")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Flag className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{reports.filter(r => r.status === 'pending').length}</p>
                  <p className="text-sm text-muted-foreground">{t("Signalements en attente", "Pending Reports")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{moderationActions.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length}</p>
                  <p className="text-sm text-muted-foreground">{t("Actions aujourd'hui", "Actions Today")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          {/* Enhanced Filters */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={t("Rechercher une session...", "Search session...")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48 bg-input border-gray-200 dark:border-gray-700 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                  <SelectItem value="all" className="text-foreground">
                    {t("Tous les statuts", "All Status")}
                  </SelectItem>
                  <SelectItem value="live" className="text-foreground">
                    {t("En direct", "Live")}
                  </SelectItem>
                  <SelectItem value="scheduled" className="text-foreground">
                    {t("Programmé", "Scheduled")}
                  </SelectItem>
                  <SelectItem value="ended" className="text-foreground">
                    {t("Terminé", "Ended")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("Filtrer par niveaux", "Filter by Levels")}</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {getAvailableLevels(currentManager?.role || "junior").map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleLevelSelection(level)}
                    className={`p-2 rounded-md border text-sm font-medium transition-colors ${
                      selectedLevels.includes(level)
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-input border-gray-200 dark:border-gray-700 text-foreground hover:bg-muted"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              {selectedLevels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedLevels.map((level) => (
                    <Badge key={level} className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {level}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("Aucune session trouvée", "No sessions found")}
            </h3>
            <p className="text-muted-foreground">
              {t("Aucune session ne correspond aux critères sélectionnés", "No sessions match the selected criteria")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSessions.map((session) => (
            <Card key={session.id} className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-foreground text-lg">{session.title}</CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">
                      {t("Par", "By")} {session.instructor}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getStatusColor(session.status)}>
                      {session.status === "live"
                        ? t("En direct", "Live")
                        : session.status === "scheduled"
                          ? t("Programmé", "Scheduled")
                          : t("Terminé", "Ended")}
                    </Badge>
                    {session.moderationNeeded && (
                      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {t("Attention", "Alert")}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>
                        {session.participants}/{session.maxParticipants}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{session.duration} min</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {session.level}
                    </Badge>
                  </div>
                  {session.reports > 0 && (
                    <div className="flex items-center space-x-1 text-orange-400">
                      <Flag className="w-4 h-4" />
                      <span>{session.reports}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {t("Commencé à", "Started at")} {session.startTime}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSession(session)}
                      className="border-gray-200 dark:border-gray-700 bg-transparent"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {t("Surveiller", "Monitor")}
                    </Button>
                    {session.status === "live" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Shield className="w-4 h-4 mr-2" />
                            {t("Modérer", "Moderate")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl bg-card border-gray-200 dark:border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="text-foreground">{session.title}</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              {t("Modération en temps réel", "Real-time moderation")}
                            </DialogDescription>
                          </DialogHeader>

                          <Tabs defaultValue="participants" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-muted">
                              <TabsTrigger value="participants" className="text-foreground">
                                {t("Participants", "Participants")}
                              </TabsTrigger>
                              <TabsTrigger value="chat" className="text-foreground">
                                {t("Chat", "Chat")}
                              </TabsTrigger>
                              <TabsTrigger value="actions" className="text-foreground">
                                {t("Actions", "Actions")}
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="participants" className="space-y-4">
                              <div className="max-h-96 overflow-y-auto space-y-3">
                                {participants.length === 0 ? (
                                  <div className="text-center py-8 text-muted-foreground">
                                    {t("Aucun participant pour le moment", "No participants at the moment")}
                                  </div>
                                ) : (
                                  participants.map((participant) => (
                                  <div
                                    key={participant.id}
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-foreground font-medium text-sm">{participant.avatar}</span>
                                      </div>
                                      <div>
                                        <p className="font-medium text-foreground">{participant.name}</p>
                                        <div className="flex items-center space-x-2">
                                          <Badge
                                            variant="outline"
                                            className={getParticipantStatusColor(participant.status)}
                                          >
                                            {participant.status}
                                          </Badge>
                                          {participant.reports > 0 && (
                                            <Badge
                                              variant="outline"
                                              className="bg-red-500/10 text-red-400 border-red-500/20"
                                            >
                                              {participant.reports} {t("signalements", "reports")}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <div className="flex items-center space-x-1">
                                        {participant.micEnabled ? (
                                          <Mic className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <MicOff className="w-4 h-4 text-red-500" />
                                        )}
                                        {participant.videoEnabled ? (
                                          <Video className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <VideoOff className="w-4 h-4 text-red-500" />
                                        )}
                                      </div>

                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-foreground"
                                          >
                                            <MoreHorizontal className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-card border-gray-200 dark:border-gray-700">
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleModerationAction(participant.id, "mute", "Disrupting session")
                                            }
                                            className="text-yellow-400 hover:bg-yellow-900/20"
                                          >
                                            <MicOff className="w-4 h-4 mr-2" />
                                            {t("Couper le micro", "Mute")}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleModerationAction(participant.id, "warn", "Inappropriate behavior")
                                            }
                                            className="text-orange-400 hover:bg-orange-900/20"
                                          >
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            {t("Avertir", "Warn")}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleModerationAction(participant.id, "kick", "Violation of rules")
                                            }
                                            className="text-red-400 hover:bg-red-900/20"
                                          >
                                            <UserX className="w-4 h-4 mr-2" />
                                            {t("Exclure", "Kick")}
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                  ))
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent value="chat" className="space-y-4">
                              <div className="h-64 bg-muted rounded-lg p-4 overflow-y-auto">
                                <p className="text-muted-foreground text-center">
                                  {t("Surveillance du chat en temps réel", "Real-time chat monitoring")}
                                </p>
                              </div>
                            </TabsContent>

                            <TabsContent value="actions" className="space-y-4">
                              <div className="max-h-64 overflow-y-auto space-y-2">
                                {moderationActions.slice(0, 10).map((action) => (
                                  <div
                                    key={action.id}
                                    className="flex items-center justify-between p-2 bg-muted rounded"
                                  >
                                    <div className="text-sm">
                                      <span className="text-foreground">{action.action}</span>
                                      <span className="text-muted-foreground ml-2">{action.reason}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(action.timestamp).toLocaleTimeString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-foreground">{t("Signalements d'utilisateurs", "User Reports")}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("Gérez les signalements d'utilisateurs et prenez les mesures appropriées", "Manage user reports and take appropriate actions")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t("Aucun signalement en attente", "No pending reports")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>
                                {report.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {t("Signalé par", "Reported by")} {report.reporterName}
                              </span>
                            </div>
                            <p className="font-medium text-foreground">{report.reason}</p>
                            <p className="text-sm text-muted-foreground">{report.description}</p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(report.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReportAction(report.id, 'resolve', 'Report resolved by moderator')}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              {t("Résoudre", "Resolve")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReportAction(report.id, 'dismiss', 'Report dismissed - no action needed')}
                              className="text-gray-600 border-gray-600 hover:bg-gray-50"
                            >
                              {t("Rejeter", "Dismiss")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReportAction(report.id, 'escalate', 'Report escalated to admin')}
                            >
                              {t("Escalader", "Escalate")}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Moderation Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-foreground">{t("Modération de contenu", "Content Moderation")}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("Modérez les posts, commentaires et autres contenus signalés", "Moderate posts, comments and other reported content")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contentReports.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t("Aucun contenu à modérer", "No content to moderate")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contentReports.map((content) => (
                    <Card key={content.id} className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{content.contentType}</Badge>
                              <Badge variant={content.status === 'pending' ? 'destructive' : 'secondary'}>
                                {content.status}
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(content.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-background p-3 rounded border">
                            <p className="text-foreground">{content.content}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {t("Par", "By")} {content.authorName} • {content.reports} {t("signalement(s)", "report(s)")}
                            </span>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleContentModeration(content.contentId, content.contentType, 'approve')}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                {t("Approuver", "Approve")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleContentModeration(content.contentId, content.contentType, 'reject', 'Content violates community guidelines')}
                                className="text-orange-600 border-orange-600 hover:bg-orange-50"
                              >
                                {t("Rejeter", "Reject")}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleContentModeration(content.contentId, content.contentType, 'delete', 'Content deleted for policy violation')}
                              >
                                {t("Supprimer", "Delete")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderation Actions History Tab */}
        <TabsContent value="actions" className="space-y-6">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-foreground">{t("Historique des actions", "Actions History")}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("Consultez l'historique de toutes les actions de modération", "View history of all moderation actions")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {moderationActions.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t("Aucune action de modération", "No moderation actions")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {moderationActions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <div className="flex items-center space-x-3">
                        <Badge variant={action.action === 'ban' ? 'destructive' : action.action === 'warn' ? 'secondary' : 'outline'}>
                          {action.action}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {t("Session", "Session")} #{action.sessionId} • {t("Participant", "Participant")} #{action.participantId}
                          </p>
                          <p className="text-xs text-muted-foreground">{action.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-foreground">{action.moderator}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(action.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


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
  Calendar,
  Clock,
  Users,
  Plus,
  Search,
  Play,
  Edit,
  Trash2,
  Crown,
  BookOpen,
  User,
  MessageSquare,
  FileText,

  PenSquare,
  Mic,
  Headphones,
} from "lucide-react"
import { cn } from "@/lib/utils"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface ManagerRole {
  role: "junior" | "content" | "senior" | "admin"
  name: string
  permissions: {
    hostLiveSessions: boolean
    createCourses: boolean
    createTests: boolean
  }
}

interface ManagerSessionsPageProps {
  role?: "admin" | "senior" | "content" | "junior"
}

interface LiveSession {
  id: number
  title: string
  description: string
  category:
    | "grammaire"
    | "vocabulaire"
    | "comprehension_ecrite"
    | "comprehension_orale"
    | "expression_ecrite"
    | "expression_orale"
    | "methodologie_tcf"
  levels: string[]
  subscriptions: string[]
  date: string
  time: string
  duration: number
  maxParticipants: number
  currentParticipants: number
  status: "scheduled" | "live" | "completed" | "cancelled"
  instructor: string
}

export default function ManagerSessionsPage({ role: propRole }: ManagerSessionsPageProps = {}) {
  const { t } = useLanguage()
  const { user, isAuthenticated, isManager, isAdmin } = useAuth()


  const [currentManager, setCurrentManager] = useState<ManagerRole | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterLevel, setFilterLevel] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false)
  const [isCreateOneOnOneOpen, setIsCreateOneOnOneOpen] = useState(false)
  const [liveSessions, setLiveSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([])
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    category: "grammaire" as const,
    levels: [] as string[],
    subscriptions: [] as string[],
    date: "",
    time: "",
    duration: 60,
    maxParticipants: 20,
  })
  const [newOneOnOneSession, setNewOneOnOneSession] = useState({
    title: "",
    description: "",
    category: "grammaire" as const,
    level: "",
    date: "",
    time: "",
    duration: 30,
    studentId: "",
  })
  const [oneOnOneSessions] = useState<any[]>([])
  const [proPlusStudents, setProPlusStudents] = useState<any[]>([])
  const [oneOnOneSearchTerm, setOneOnOneSearchTerm] = useState("")

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    // Determine manager role from props, URL params, or localStorage
    propRole || urlParams.get("role") || localStorage.getItem("managerRole") || "junior"

    if (!user) return

    // Set current manager from user data
    const manager = {
      role: user.role === 'SENIOR_MANAGER' ? 'senior' as const :
            user.role === 'JUNIOR_MANAGER' ? 'junior' as const :
            user.role === 'ADMIN' ? 'admin' as const : 'junior' as const,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'Manager',
      permissions: {
        hostLiveSessions: true,
        createCourses: true,
        createTests: user.role === 'SENIOR_MANAGER' || user.role === 'ADMIN',
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
        const response = await apiClient.get('/live-sessions/created')

        if (response.success && response.data) {
          const sessions = Array.isArray(response.data) ? response.data :
                          Array.isArray((response.data as any).data) ? (response.data as any).data : []
          setLiveSessions(sessions)
        }
      } catch (error) {
        console.error('Error fetching live sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLiveSessions()
  }, [isAuthenticated, isManager, isAdmin])

  // Fetch Pro+ students for one-on-one sessions
  useEffect(() => {
    const fetchProPlusStudents = async () => {
      if (!isAuthenticated || (!isManager && !isAdmin)) return

      try {
        // Fetch students with PRO+ subscription for one-on-one sessions
        // Use manager endpoint for managers, admin endpoint for admins
        const endpoint = isAdmin ? '/admin/users' : '/manager/students'
        const response = await apiClient.get(endpoint, {
          params: isAdmin ? { role: 'STUDENT', subscriptionTier: 'PRO' } : {}
        })

        if (response.success && response.data) {
          let students = Array.isArray(response.data) ? response.data :
                          Array.isArray((response.data as any).users) ? (response.data as any).users : []

          // Filter for PRO+ students if using manager endpoint
          if (!isAdmin) {
            students = students.filter((s: any) => s.subscriptionTier === 'PRO' || s.subscription === 'Pro+')
          }

          setProPlusStudents(students)
        }
      } catch (error) {
        console.error('Error fetching Pro+ students:', error)
      }
    }

    fetchProPlusStudents()
  }, [isAuthenticated, isManager, isAdmin])

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "admin":
        return {
          label: t("Admin", "Admin"),
          icon: Crown,
          color: "bg-red-500/10 text-red-400 border-red-500/20",
        }
      case "senior":
        return {
          label: t("Manager", "Manager"),
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

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case "grammaire":
        return {
          label: t("Grammaire", "Grammar"),
          icon: BookOpen,
          color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        }
      case "vocabulaire":
        return {
          label: t("Vocabulaire", "Vocabulary"),
          icon: MessageSquare,
          color: "bg-green-500/10 text-green-400 border-green-500/20",
        }
      case "comprehension_ecrite":
        return {
          label: t("Compréhension écrite", "Reading Comprehension"),
          icon: FileText,
          color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        }
      case "comprehension_orale":
        return {
          label: t("Compréhension orale", "Listening Comprehension"),
          icon: Headphones,
          color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        }
      case "expression_ecrite":
        return {
          label: t("Expression écrite", "Written Expression"),
          icon: PenSquare,
          color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        }
      case "expression_orale":
        return {
          label: t("Expression orale", "Oral Expression"),
          icon: Mic,
          color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
        }
      case "methodologie_tcf":
        return {
          label: t("Méthodologie TCF", "TCF Methodology "),
          icon: BookOpen,
          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        }
      default:
        return {
          label: category,
          icon: BookOpen,
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
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "cancelled":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const getLevelDescription = (level: string) => {
    const descriptions = {
      A1: t("Débutant", "Beginner"),
      A2: t("Élémentaire", "Elementary"),
      B1: t("Intermédiaire", "Intermediate"),
      B2: t("Avancé", "Advanced"),
      C1: t("Expert", "Expert"),
      C2: t("Niveau supérieur", "Advanced Level"),
    }
    return descriptions[level as keyof typeof descriptions] || level
  }

  const getAvailableLevels = (role: string) => {
    switch (role) {
      case "junior":
        return ["A1", "B1"] // Junior managers: A1-B1 only
      case "senior":
      case "admin":
        return ["A1", "A2", "B1", "B2", "C1", "C2"] // Admin & Senior: A1-C2 + one-on-one
      default:
        return ["A1", "B1"]
    }
  }

  const getAvailableSubscriptions = (role: string) => {
    switch (role) {
      case "junior":
        return ["Gratuit", "Essentiel"]
      case "content":
      case "senior":
        return ["Gratuit", "Essentiel", "Premium", "Pro+"]
      default:
        return ["Gratuit", "Essentiel"]
    }
  }

  const toggleLevelSelection = (level: string) => {
    setSelectedLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]))
  }

  const toggleSubscriptionSelection = (subscription: string) => {
    setSelectedSubscriptions((prev) =>
      prev.includes(subscription) ? prev.filter((s) => s !== subscription) : [...prev, subscription],
    )
  }

  const handleCreateSession = async () => {
    try {
      console.log("Creating session:", newSession)

      // Validate required fields
      if (!newSession.title || !newSession.date || !newSession.time) {
        alert(t("Veuillez remplir tous les champs obligatoires", "Please fill in all required fields"))
        return
      }

      // Create session via API
      const sessionData = {
        ...newSession,
        datetime: `${newSession.date}T${newSession.time}:00.000Z`,
        type: 'GROUP',
        status: 'SCHEDULED'
      }

      const response = await apiClient.post('/manager/sessions', sessionData)

      if (response.success) {
        // Add the new session to the list
        setLiveSessions(prev => [response.data, ...prev])

        // Close dialog and reset form
        setIsCreateSessionOpen(false)
        setNewSession({
          title: "",
          description: "",
          category: "grammaire",
          levels: [],
          subscriptions: [],
          date: "",
          time: "",
          duration: 60,
          maxParticipants: 20,
        })

        alert(t("Session créée avec succès!", "Session created successfully!"))
      } else {
        alert(t("Erreur lors de la création de la session", "Error creating session"))
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert(t("Erreur lors de la création de la session", "Error creating session"))
    }
  }

  const filteredSessions = (liveSessions || []).filter((session) => {
    if (!session) return false
    const matchesSearch = (session.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || session.category === filterCategory
    const matchesLevel = filterLevel === "all" || (session.level && session.level === filterLevel)
    const matchesStatus = filterStatus === "all" || session.status?.toLowerCase() === filterStatus

    return matchesSearch && matchesCategory && matchesLevel && matchesStatus
  })

  if (!currentManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  const roleInfo = getRoleInfo(currentManager.role)
  const RoleIcon = roleInfo.icon

  if (!currentManager.permissions.hostLiveSessions) {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                <Video className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">{t("Accès restreint", "Access Restricted")}</h2>
              <p className="text-muted-foreground mb-4">
                {t(
                  "Votre rôle ne vous permet pas d'organiser des sessions live.",
                  "Your role does not allow hosting live sessions.",
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
  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("Sessions Live", "Live Sessions")}</h1>
            <p className="text-muted-foreground mt-1">
              {currentManager?.role === "junior" 
                ? t("Organisez et gérez vos sessions de groupe (Essentiel à Pro+)", "Organize and manage your group sessions (Essential to Pro+)")
                : t("Organisez et gérez vos sessions d'apprentissage - Groupes (Essentiel à Pro+) et Individuelles (Pro+ uniquement)", "Organize and manage your learning sessions - Group (Essential to Pro+) and Individual (Pro+ only)")
              }
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className={cn("text-sm", roleInfo.color)}>
              <RoleIcon className="w-4 h-4 mr-2" />
              {roleInfo.label}
            </Badge>
            <Dialog open={isCreateSessionOpen} onOpenChange={setIsCreateSessionOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("Créer une session", "Create Session")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card border-gray-200 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    {t("Créer une nouvelle session", "Create New Session")}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {t("Configurez votre session d'apprentissage", "Configure your learning session")}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("Titre de la session", "Session Title")}
                      </label>
                      <Input
                        value={newSession.title}
                        onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                        placeholder={t("Ex: Les bases de la grammaire", "Ex: Grammar basics")}
                        className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">{t("Catégorie", "Category")}</label>
                      <Select
                        value={newSession.category}
                        onValueChange={(value) => setNewSession({ ...newSession, category: value as any })}
                      >
                        <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grammaire">{t("Grammaire", "Grammar")}</SelectItem>
                          <SelectItem value="vocabulaire">{t("Vocabulaire", "Vocabulary")}</SelectItem>
                          <SelectItem value="comprehension_ecrite">{t("Compréhension écrite", "Reading Comprehension")}</SelectItem>
                          <SelectItem value="comprehension_orale">{t("Compréhension orale", "Listening Comprehension")}</SelectItem>
                          <SelectItem value="expression_ecrite">{t("Expression écrite", "Written Expression")}</SelectItem>
                          <SelectItem value="expression_orale">{t("Expression orale", "Oral Expression")}</SelectItem>
                          <SelectItem value="methodologie_tcf">{t("Méthodologie TCF", "TCF Methodology")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("Description", "Description")}
                    </label>
                    <Textarea
                      value={newSession.description}
                      onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                      placeholder={t("Décrivez le contenu de votre session...", "Describe your session content...")}
                      className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {t("Niveaux disponibles", "Available Levels")}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
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

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {t("Abonnements autorisés", "Allowed Subscriptions")}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {getAvailableSubscriptions(currentManager?.role || "junior").map((subscription) => (
                          <button
                            key={subscription}
                            type="button"
                            onClick={() => toggleSubscriptionSelection(subscription)}
                            className={`p-2 rounded-md border text-sm font-medium transition-colors ${
                              selectedSubscriptions.includes(subscription)
                                ? "bg-green-600 border-green-500 text-white"
                                : "bg-input border-gray-200 dark:border-gray-700 text-foreground hover:bg-muted"
                            }`}
                          >
                            {subscription}
                          </button>
                        ))}
                      </div>
                      {selectedSubscriptions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedSubscriptions.map((subscription) => (
                            <Badge key={subscription} className="bg-green-500/10 text-green-400 border-green-500/20">
                              {subscription}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{t("Date", "Date")}</label>
                      <Input
                        type="date"
                        value={newSession.date}
                        onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                        className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{t("Heure", "Time")}</label>
                      <Input
                        type="time"
                        value={newSession.time}
                        onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                        className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {t("Durée (minutes)", "Duration (minutes)")}
                      </label>
                      <Select
                        value={newSession.duration.toString()}
                        onValueChange={(value) => setNewSession({ ...newSession, duration: Number.parseInt(value) })}
                      >
                        <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="90">90 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {t("Participants max", "Max Participants")}
                      </label>
                      <Select
                        value={newSession.maxParticipants.toString()}
                        onValueChange={(value) =>
                          setNewSession({ ...newSession, maxParticipants: Number.parseInt(value) })
                        }
                      >
                        <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 participants</SelectItem>
                          <SelectItem value="15">15 participants</SelectItem>
                          <SelectItem value="20">20 participants</SelectItem>
                          <SelectItem value="25">25 participants</SelectItem>
                          <SelectItem value="30">30 participants</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateSessionOpen(false)}
                      className="border-gray-200 dark:border-gray-700 bg-transparent"
                    >
                      {t("Annuler", "Cancel")}
                    </Button>
                    <Button onClick={handleCreateSession} className="bg-blue-600 hover:bg-blue-700 text-white">
                      {t("Créer la session", "Create Session")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">{t("Sessions programmées", "Scheduled Sessions")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">
                    {t("Participants inscrits", "Registered Participants")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">0h</p>
                  <p className="text-sm text-muted-foreground">
                    {t("Temps total cette semaine", "Total Time This Week")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">{t("Sessions terminées", "Completed Sessions")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Type Tabs - Only show for non-junior managers */}
        {currentManager?.role !== "junior" && (
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !isCreateOneOnOneOpen ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setIsCreateOneOnOneOpen(false)}
            >
              {t("Sessions de groupe (Essentiel à Pro+)", "Group Sessions (Essential to Pro+)")}
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isCreateOneOnOneOpen ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setIsCreateOneOnOneOpen(true)}
            >
              {t("Sessions individuelles (Pro+ uniquement)", "One-on-One Sessions (Pro+ only)")}
            </button>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
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
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-48 bg-input border-gray-200 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Toutes catégories", "All Categories")}</SelectItem>
                  <SelectItem value="grammaire">{t("Grammaire", "Grammar")}</SelectItem>
                  <SelectItem value="vocabulaire">{t("Vocabulaire", "Vocabulary")}</SelectItem>
                  <SelectItem value="comprehension_ecrite">{t("Compréhension écrite", "Reading Comprehension")}</SelectItem>
                  <SelectItem value="comprehension_orale">{t("Compréhension orale", "Listening Comprehension")}</SelectItem>
                  <SelectItem value="expression_ecrite">{t("Expression écrite", "Written Expression")}</SelectItem>
                  <SelectItem value="expression_orale">{t("Expression orale", "Oral Expression")}</SelectItem>
                  <SelectItem value="methodologie_tcf">{t("Méthodologie TCF ", "TCF Methodology ")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-full md:w-48 bg-input border-gray-200 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Tous niveaux", "All Levels")}</SelectItem>
                  <SelectItem value="A1">A1 - {getLevelDescription("A1")}</SelectItem>
                  <SelectItem value="A2">A2 - {getLevelDescription("A2")}</SelectItem>
                  <SelectItem value="B1">B1 - {getLevelDescription("B1")}</SelectItem>
                  <SelectItem value="B2">B2 - {getLevelDescription("B2")}</SelectItem>
                  <SelectItem value="C1">C1 - {getLevelDescription("C1")}</SelectItem>
                  <SelectItem value="C2">C2 - {getLevelDescription("C2")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48 bg-input border-gray-200 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Tous statuts", "All Status")}</SelectItem>
                  <SelectItem value="scheduled">{t("Programmé", "Scheduled")}</SelectItem>
                  <SelectItem value="live">{t("En direct", "Live")}</SelectItem>
                  <SelectItem value="completed">{t("Terminé", "Completed")}</SelectItem>
                  <SelectItem value="cancelled">{t("Annulé", "Cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        {currentManager?.role === "junior" || !isCreateOneOnOneOpen ? (
          <div className="space-y-6">
            {/* Group Sessions */}
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="bg-card border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
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
                  {t("Créez votre première session en direct", "Create your first live session")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredSessions.map((session) => {
                const categoryInfo = getCategoryInfo(session.category)
                const CategoryIcon = categoryInfo.icon

                return (
                  <Card key={session.id} className="bg-card border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-foreground text-lg">{session.title}</CardTitle>
                          <CardDescription className="text-muted-foreground mt-1">{session.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className={getStatusColor(session.status)}>
                          {session.status === "scheduled"
                            ? t("Programmé", "Scheduled")
                            : session.status === "live"
                              ? t("En direct", "Live")
                              : session.status === "completed"
                                ? t("Terminé", "Completed")
                                : t("Annulé", "Cancelled")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className={categoryInfo.color}>
                            <CategoryIcon className="w-3 h-3 mr-1" />
                            {categoryInfo.label}
                          </Badge>
                          {session.levels.map((level: string) => (
                            <Badge key={level} variant="outline" className="text-xs">
                              {level} - {getLevelDescription(level)}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">
                            {session.currentParticipants}/{session.maxParticipants}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{session.date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {session.time} ({session.duration}min)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {t("Instructeur:", "Instructor:")} {session.instructor}
                        </div>
                        <div className="flex items-center space-x-2">
                          {session.status === "scheduled" && (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                              <Play className="w-3 h-3 mr-1" />
                              {t("Démarrer", "Start")}
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="border-gray-200 dark:border-gray-700 bg-transparent">
                            <Edit className="w-3 h-3 mr-1" />
                            {t("Modifier", "Edit")}
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-700 text-red-400 bg-transparent">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
                })}
              </div>
            )}

            {/* Empty State for Group Sessions */}
            {!loading && filteredSessions.length === 0 && (
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardContent className="p-12 text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {t("Aucune session trouvée", "No sessions found")}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t("Créez votre première session pour commencer", "Create your first session to get started")}
                  </p>
                  <Button onClick={() => setIsCreateSessionOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    {t("Créer une session", "Create Session")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* One-on-One Sessions */
          <div className="space-y-6">
            {/* One-on-One Sessions Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{t("Sessions individuelles", "One-on-One Sessions")}</h2>
                <p className="text-muted-foreground mt-1">
                  {t("Sessions privées exclusivement pour les étudiants Pro+", "Private sessions exclusively for Pro+ students")}
                </p>
              </div>
              <Dialog open={isCreateOneOnOneOpen} onOpenChange={setIsCreateOneOnOneOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    {t("Créer une session individuelle", "Create One-on-One Session")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-card border-gray-200 dark:border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">
                      {t("Créer une session individuelle", "Create One-on-One Session")}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      {t("Configurez une session privée avec un étudiant Pro+", "Configure a private session with a Pro+ student")}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("Titre de la session", "Session Title")}
                        </label>
                        <Input
                          value={newOneOnOneSession.title}
                          onChange={(e) => setNewOneOnOneSession({ ...newOneOnOneSession, title: e.target.value })}
                          placeholder={t("Ex: Révision personnalisée", "Ex: Personalized review")}
                          className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">{t("Catégorie", "Category")}</label>
                        <Select
                          value={newOneOnOneSession.category}
                          onValueChange={(value) => setNewOneOnOneSession({ ...newOneOnOneSession, category: value as any })}
                        >
                          <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                            <SelectItem value="grammaire">{t("Grammaire", "Grammar")}</SelectItem>
                            <SelectItem value="vocabulaire">{t("Vocabulaire", "Vocabulary")}</SelectItem>
                            <SelectItem value="comprehension_ecrite">{t("Compréhension écrite", "Reading Comprehension")}</SelectItem>
                            <SelectItem value="comprehension_orale">{t("Compréhension orale", "Listening Comprehension")}</SelectItem>
                            <SelectItem value="expression_ecrite">{t("Expression écrite", "Written Expression")}</SelectItem>
                            <SelectItem value="expression_orale">{t("Expression orale", "Oral Expression")}</SelectItem>
                            <SelectItem value="methodologie_tcf">{t("Méthodologie TCF", "TCF Methodology")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("Description", "Description")}
                      </label>
                      <Textarea
                        value={newOneOnOneSession.description}
                        onChange={(e) => setNewOneOnOneSession({ ...newOneOnOneSession, description: e.target.value })}
                        placeholder={t("Décrivez le contenu de la session...", "Describe the session content...")}
                        className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">{t("Niveau", "Level")}</label>
                        <Select
                          value={newOneOnOneSession.level}
                          onValueChange={(value) => setNewOneOnOneSession({ ...newOneOnOneSession, level: value })}
                        >
                          <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                            <SelectValue placeholder={t("Sélectionner", "Select")} />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                            <SelectItem value="A1">A1</SelectItem>
                            <SelectItem value="A2">A2</SelectItem>
                            <SelectItem value="B1">B1</SelectItem>
                            <SelectItem value="B2">B2</SelectItem>
                            <SelectItem value="C1">C1</SelectItem>
                            <SelectItem value="C2">C2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">{t("Date", "Date")}</label>
                        <Input
                          type="date"
                          value={newOneOnOneSession.date}
                          onChange={(e) => setNewOneOnOneSession({ ...newOneOnOneSession, date: e.target.value })}
                          className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">{t("Heure", "Time")}</label>
                        <Input
                          type="time"
                          value={newOneOnOneSession.time}
                          onChange={(e) => setNewOneOnOneSession({ ...newOneOnOneSession, time: e.target.value })}
                          className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("Durée (minutes)", "Duration (minutes)")}
                        </label>
                        <Input
                          type="number"
                          value={newOneOnOneSession.duration}
                          onChange={(e) => setNewOneOnOneSession({ ...newOneOnOneSession, duration: parseInt(e.target.value) })}
                          className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                          min="15"
                          max="120"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("Étudiant Pro+", "Pro+ Student")}
                        </label>
                        <Select
                          value={newOneOnOneSession.studentId}
                          onValueChange={(value) => setNewOneOnOneSession({ ...newOneOnOneSession, studentId: value })}
                        >
                          <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                            <SelectValue placeholder={t("Sélectionner un étudiant", "Select a student")} />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                            {proPlusStudents.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name} - {student.level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateOneOnOneOpen(false)}
                        className="border-gray-200 dark:border-gray-700"
                      >
                        {t("Annuler", "Cancel")}
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            console.log("Creating one-on-one session:", newOneOnOneSession)

                            // Validate required fields
                            if (!newOneOnOneSession.title || !newOneOnOneSession.date || !newOneOnOneSession.time || !newOneOnOneSession.studentId) {
                              alert(t("Veuillez remplir tous les champs obligatoires", "Please fill in all required fields"))
                              return
                            }

                            // Create one-on-one session via API
                            const sessionData = {
                              ...newOneOnOneSession,
                              datetime: `${newOneOnOneSession.date}T${newOneOnOneSession.time}:00.000Z`,
                              type: 'ONE_ON_ONE',
                              status: 'SCHEDULED',
                              maxParticipants: 1
                            }

                            const response = await apiClient.post('/manager/sessions', sessionData)

                            if (response.success) {
                              // Close dialog and reset form
                              setIsCreateOneOnOneOpen(false)
                              setNewOneOnOneSession({
                                title: "",
                                description: "",
                                category: "grammaire",
                                level: "",
                                date: "",
                                time: "",
                                duration: 30,
                                studentId: "",
                              })

                              alert(t("Session individuelle créée avec succès!", "One-on-one session created successfully!"))
                            } else {
                              alert(t("Erreur lors de la création de la session", "Error creating session"))
                            }
                          } catch (error) {
                            console.error('Error creating one-on-one session:', error)
                            alert(t("Erreur lors de la création de la session", "Error creating session"))
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t("Créer la session", "Create Session")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Pro+ Students Search */}
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Étudiants Pro+ disponibles", "Available Pro+ Students")}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("Recherchez et sélectionnez un étudiant Pro+ pour une session individuelle", "Search and select a Pro+ student for a one-on-one session")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={t("Rechercher un étudiant Pro+...", "Search for a Pro+ student...")}
                      value={oneOnOneSearchTerm}
                      onChange={(e) => setOneOnOneSearchTerm(e.target.value)}
                      className="pl-10 bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    />
                  </div>

                  {proPlusStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        {t("Aucun étudiant Pro+ trouvé", "No Pro+ students found")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("Les étudiants Pro+ apparaîtront ici une fois inscrits", "Pro+ students will appear here once enrolled")}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {proPlusStudents
                        .filter((student) =>
                          student.name.toLowerCase().includes(oneOnOneSearchTerm.toLowerCase()) ||
                          student.email.toLowerCase().includes(oneOnOneSearchTerm.toLowerCase())
                        )
                        .map((student) => (
                          <Card key={student.id} className="bg-card border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-cyan-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {student.name?.split(' ').map((n: string) => n[0]).join('')}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">{student.name}</p>
                                  <p className="text-sm text-muted-foreground">{student.email}</p>
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {student.level}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* One-on-One Sessions List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {oneOnOneSessions.length === 0 ? (
                <Card className="bg-card border-gray-200 dark:border-gray-700 col-span-full">
                  <CardContent className="p-12 text-center">
                    <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      {t("Aucune session individuelle", "No one-on-one sessions")}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t("Créez votre première session individuelle", "Create your first one-on-one session")}
                    </p>
                    <Button onClick={() => setIsCreateOneOnOneOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("Créer une session individuelle", "Create One-on-One Session")}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                oneOnOneSessions.map((session) => (
                  <Card key={session.id} className="bg-card border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-foreground text-lg">{session.title}</CardTitle>
                          <CardDescription className="text-muted-foreground mt-1">{session.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                          {t("Individuelle", "One-on-One")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                            <User className="w-3 h-3 mr-1" />
                            {session.studentName}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {session.level}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{session.duration} min</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{session.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{session.time}</span>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-700">
                          <Edit className="w-4 h-4 mr-1" />
                          {t("Modifier", "Edit")}
                        </Button>
                        <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-700">
                          <Play className="w-4 h-4 mr-1" />
                          {t("Démarrer", "Start")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Mock sessions removed - now using backend data

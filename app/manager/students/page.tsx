"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import { Search, Mail, MessageCircle, Award, TrendingUp, Users, BookOpen } from "lucide-react"

export default function StudentManagement() {
  const { t } = useLanguage()
  const { user, isAuthenticated, isManager, isAdmin } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([])
  const [currentManager, setCurrentManager] = useState<string>("junior")
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    averageProgress: 0,
    totalEnrollments: 0
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roleParam = params.get("role")
    const stored = localStorage.getItem("managerRole")
    const role = (roleParam || stored || "junior").toLowerCase()
    setCurrentManager(["junior", "content", "senior"].includes(role) ? role : "junior")
  }, [])

  // Fetch students from backend
  useEffect(() => {
    const fetchStudents = async () => {
      if (!isAuthenticated || (!isManager && !isAdmin)) return

      try {
        setLoading(true)

        // Use manager students endpoint if available, otherwise use admin users endpoint
        const endpoint = isManager ? '/manager/students' : '/admin/users'
        const params = isManager ? {} : { role: 'STUDENT' }

        const response = await apiClient.get(endpoint, { params })

        if (response.success && response.data) {
          const studentsData = Array.isArray(response.data) ? response.data :
                              Array.isArray(response.data.users) ? response.data.users :
                              Array.isArray(response.data.data) ? response.data.data : []

          // Transform data to match component expectations
          const transformedStudents = studentsData.map((student: any) => ({
            id: student.id,
            name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email,
            email: student.email,
            level: student.level || 'A1',
            subscription: student.subscriptionTier || 'FREE',
            progress: student.progress || 0,
            lastActivity: student.lastLoginAt || student.lastActivityAt,
            enrollments: student._count?.courseEnrollments || 0,
            testAttempts: student._count?.testAttempts || 0,
            averageScore: student.averageScore || 0,
            status: student.status,
            createdAt: student.createdAt,
            achievements: student.achievements || []
          }))

          setStudents(transformedStudents)

          // Calculate stats
          const activeStudents = transformedStudents.filter((s: any) => s.status === 'ACTIVE').length
          const totalProgress = transformedStudents.reduce((acc: number, s: any) => acc + (s.progress || 0), 0)
          const totalEnrollments = transformedStudents.reduce((acc: number, s: any) => acc + (s.enrollments || 0), 0)

          setStats({
            totalStudents: transformedStudents.length,
            activeStudents,
            averageProgress: transformedStudents.length > 0 ? Math.round(totalProgress / transformedStudents.length) : 0,
            totalEnrollments
          })
        }
      } catch (error) {
        console.error('Error fetching students:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [isAuthenticated, isManager, isAdmin])

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case "Essential":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "Premium":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "Pro+":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "A1":
      case "A2":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "B1":
      case "B2":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "C1":
      case "C2":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
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

  const getAvailableSubscriptions = (role: string) => {
    switch (role) {
      case "junior":
        return ["Free", "Essential"]
      case "content":
      case "senior":
        return ["Free", "Essential", "Premium", "Pro+"]
      default:
        return ["Free", "Essential"]
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

  const filteredStudents = (students || []).filter((student) => {
    if (!student) return false
    const matchesSearch =
      (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(student.level)
    const matchesSubscription =
      selectedSubscriptions.length === 0 || selectedSubscriptions.includes(student.subscription)
    return matchesSearch && matchesLevel && matchesSubscription
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("Gestion des étudiants", "Student Management")}</h1>
          <p className="text-muted-foreground">
            {t("Suivez et gérez vos étudiants", "Track and manage your students")}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              const url = new URL("/manager/messages/bulk", window.location.origin)
              url.searchParams.set("role", currentManager)
              window.location.href = url.toString()
            }}
          >
            <Mail className="w-4 h-4 mr-2" />
            {t("Message groupé", "Bulk Message")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Étudiants totaux", "Total Students")}
            </CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{loading ? '...' : stats.totalStudents}</div>
            <p className="text-xs text-blue-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {stats.activeStudents} {t("actifs", "active")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Progression moyenne", "Average Progress")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '...' : `${stats.averageProgress}%`}
            </div>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {t("Progression globale", "Overall progress")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Cours complétés", "Courses Completed")}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '...' : stats.totalEnrollments}
            </div>
            <p className="text-xs text-purple-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {t("Inscriptions totales", "Total enrollments")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Simulations proposées", "Proposed Simulations")}
            </CardTitle>
            <Award className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {students.filter(s => s.level === "B1" || s.level === "B2" || s.level === "C1").length}
            </div>
            <p className="text-xs text-orange-400 flex items-center mt-1">
              <Award className="w-3 h-3 mr-1" />
              {t("Éligibles TCF/TEF", "TCF/TEF Eligible")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="bg-card border-gray-200 dark:border-gray-700">
        <CardContent className="p-6 space-y-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t("Rechercher un étudiant...", "Search student...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-gray-200 dark:border-gray-700 text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("Filtrer par niveaux", "Filter by Levels")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {getAvailableLevels(currentManager).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleLevelSelection(level)}
                    className={`p-2 rounded-md border text-sm font-medium transition-colors ${
                      selectedLevels.includes(level)
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-card border-gray-200 dark:border-gray-700 text-foreground hover:bg-muted"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("Filtrer par abonnements", "Filter by Subscriptions")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {getAvailableSubscriptions(currentManager).map((subscription) => (
                  <button
                    key={subscription}
                    type="button"
                    onClick={() => toggleSubscriptionSelection(subscription)}
                    className={`p-2 rounded-md border text-sm font-medium transition-colors ${
                      selectedSubscriptions.includes(subscription)
                        ? "bg-green-600 border-green-500 text-white"
                        : "bg-card border-gray-200 dark:border-gray-700 text-foreground hover:bg-muted"
                    }`}
                  >
                    {subscription}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(selectedLevels.length > 0 || selectedSubscriptions.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {selectedLevels.map((level) => (
                <Badge key={level} className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  {level}
                </Badge>
              ))}
              {selectedSubscriptions.map((subscription) => (
                <Badge key={subscription} className="bg-green-500/10 text-green-400 border-green-500/20">
                  {subscription}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                    <div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t("Aucun étudiant", "No students")}</h3>
          <p className="text-muted-foreground mb-4">{t("Aucun étudiant trouvé avec les critères sélectionnés", "No students found with the selected criteria")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={student.avatar || "/placeholder.svg"}
                    alt={student.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="text-foreground font-semibold">{student.name}</h3>
                    <p className="text-muted-foreground text-sm">{student.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={`text-xs ${getLevelColor(student.level)}`}>{student.level}</Badge>
                      <Badge className={`text-xs ${getSubscriptionColor(student.subscription)}`}>
                        {student.subscription}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <div className="text-foreground font-semibold">{student.progress}%</div>
                    <div className="text-muted-foreground text-xs">{t("Progression", "Progress")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-foreground font-semibold">{student.enrollments || 0}</div>
                    <div className="text-muted-foreground text-xs">{t("Cours", "Courses")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-foreground font-semibold">{student.testAttempts || 0}</div>
                    <div className="text-muted-foreground text-xs">{t("Tests", "Tests")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-semibold">{student.averageScore || 0}%</div>
                    <div className="text-muted-foreground text-xs">{t("Score", "Score")}</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      const url = new URL("/manager/messages/compose", window.location.origin)
                      url.searchParams.set("to", student.id)
                      url.searchParams.set("name", student.name)
                      url.searchParams.set("role", currentManager)
                      window.location.href = url.toString()
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {t("Message", "Message")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-200 dark:border-gray-700 text-foreground bg-transparent"
                    onClick={() => {
                      const url = new URL("/admin/users", window.location.origin)
                      url.searchParams.set("search", student.email)
                      window.location.href = url.toString()
                    }}
                  >
                    {t("Profil", "Profile")}
                  </Button>
                </div>
              </div>

              {student.achievements.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-muted-foreground text-sm">{t("Réalisations", "Achievements")}:</span>
                    <div className="flex space-x-2">
                      {student.achievements.map((achievement: string, index: number) => (
                        <Badge key={index} className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">
                          {achievement}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

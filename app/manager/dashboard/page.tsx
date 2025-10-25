"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import { BookOpen, Video, Users, Star, Award, Crown, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface ManagerRole {
  role: "junior" | "content" | "senior" | "admin"
  name: string
  permissions: {
    createCourses: boolean
    createTests: boolean
    createTestCorrections: boolean
    hostLiveSessions: boolean
    moderateContent: boolean
    manageUsers: boolean
    viewAnalytics: boolean
  }
}

export default function ManagerDashboard() {
  const { t } = useLanguage()
  const { user, loading, isAuthenticated, isManager } = useAuth()
  const router = useRouter()
  const [currentManager, setCurrentManager] = useState<ManagerRole | null>(null)
  const [stats, setStats] = useState({
    coursesCreated: 0,
    testsCreated: 0,
    liveSessionsHosted: 0,
    studentsManaged: 0,
    averageRating: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render if not authenticated or not a manager
  if (!isAuthenticated || (!isManager && user?.role !== 'ADMIN')) {
    return null
  }

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/manager')
        return
      } else if (!isManager && user?.role !== 'ADMIN') {
        // If authenticated but not a manager, redirect to appropriate dashboard
        if (user?.role === 'USER') {
          router.replace('/home')
        } else {
          router.replace('/welcome')
        }
        return
      }
    }

    if (!loading && user) {
      // Map user role to manager role
      const managerRole = user.role === 'SENIOR_MANAGER' ? 'senior' : 
                         user.role === 'JUNIOR_MANAGER' ? 'junior' : 
                         user.role === 'ADMIN' ? 'admin' : 'junior'
      
      setCurrentManager({
        role: managerRole,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'Manager',
        permissions: {
          createCourses: true,
          createTests: true,
          createTestCorrections: true,
          hostLiveSessions: true,
          moderateContent: user.role === 'SENIOR_MANAGER' || user.role === 'ADMIN',
          manageUsers: user.role === 'SENIOR_MANAGER' || user.role === 'ADMIN',
          viewAnalytics: user.role === 'ADMIN', // Only admins can view analytics
        },
      })

      // Fetch manager statistics
      fetchManagerStats()
    }
  }, [loading, user, isAuthenticated, isManager, router])

  const fetchManagerStats = async () => {
    try {
      setStatsLoading(true)
      // Use dedicated manager dashboard endpoint
      const response = await apiClient.get('/manager/dashboard')

      if (response.success && response.data) {
        const data = response.data as any
        setStats({
          coursesCreated: data.stats?.courses || 0,
          testsCreated: data.stats?.tests || 0,
          liveSessionsHosted: data.stats?.liveSessions || 0,
          studentsManaged: data.stats?.totalEnrollments || 0,
          averageRating: data.stats?.userSatisfaction || 0,
          totalRevenue: data.stats?.contentViews || 0,
          monthlyGrowth: data.stats?.completionRate || 0,
        })
      }
    } catch (error) {
      console.error('Error fetching manager stats:', error)
      // Keep default values (0) if API fails
    } finally {
      setStatsLoading(false)
    }
  }

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "senior":
        return {
          label: t("manager.role.senior", "Senior Manager"),
          icon: Crown,
          color: "from-purple-500 to-pink-600",
          bgColor: "bg-purple-500/10",
          textColor: "text-purple-400",
        }
      case "content":
        return {
          label: t("manager.role.content", "Content Manager"),
          icon: BookOpen,
          color: "from-blue-500 to-cyan-600",
          bgColor: "bg-blue-500/10",
          textColor: "text-blue-400",
        }
      case "junior":
        return {
          label: t("manager.role.junior", "Junior Manager"),
          icon: User,
          color: "from-green-500 to-emerald-600",
          bgColor: "bg-green-500/10",
          textColor: "text-green-400",
        }
      default:
        return {
          label: t("manager.title", "Manager"),
          icon: User,
          color: "from-muted to-muted-foreground",
          bgColor: "bg-muted/10",
          textColor: "text-muted-foreground",
        }
    }
  }

  const recentActivity: any[] = []

  const upcomingSessions: any[] = []

  const topCourses: any[] = []

  if (loading || !currentManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">{t("common.loading", "Loading...")}</div>
      </div>
    )
  }

  const roleInfo = getRoleInfo(currentManager.role)
  const RoleIcon = roleInfo.icon

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className={cn("bg-gradient-to-r rounded-2xl p-6 text-white", roleInfo.color)}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <RoleIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {t("manager.dashboard.welcome", "Welcome")}, {currentManager.name}
                  </h2>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-sm">
                    {roleInfo.label}
                  </Badge>
                </div>
              </div>
              <p className="text-white/80">
                {t("manager.dashboard.subtitle", "Manage your courses, sessions and students in one place")}
              </p>
            </div>
            <div className="hidden md:block">
              <Award className="w-16 h-16 text-white/60" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{t("manager.stats.coursesCreated", "Courses Created")}</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "..." : stats.coursesCreated}
                </p>
                <p className="text-green-400 text-sm">
                  {statsLoading ? "..." : `+${stats.monthlyGrowth}%`} {t("manager.stats.thisMonth", "this month")}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{t("manager.stats.testsCreated", "Tests Created")}</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "..." : stats.testsCreated}
                </p>
                <p className="text-green-400 text-sm">
                  {statsLoading ? "..." : `+${stats.monthlyGrowth}%`} {t("manager.stats.thisMonth", "this month")}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{t("manager.stats.liveSessions", "Live Sessions")}</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "..." : stats.liveSessionsHosted}
                </p>
                <p className="text-green-400 text-sm">
                  {statsLoading ? "..." : `+${stats.monthlyGrowth}%`} {t("manager.stats.thisMonth", "this month")}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{t("manager.students.title", "Students")}</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "..." : stats.studentsManaged.toLocaleString()}
                </p>
                <p className="text-green-400 text-sm">
                  {statsLoading ? "..." : `+${stats.monthlyGrowth}%`} {t("manager.stats.thisMonth", "this month")}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-card rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              {t("manager.dashboard.recentActivity", "Recent Activity")}
            </h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {t("Aucune activité récente", "No recent activity")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("Vos activités récentes apparaîtront ici", "Your recent activities will appear here")}
                  </p>
                </div>
              ) : (
                recentActivity.map((activity, index) => {
                  const ActivityIcon = activity.icon
                  return (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          activity.type === "course"
                            ? "bg-blue-500/10"
                            : activity.type === "session"
                              ? "bg-purple-500/10"
                              : activity.type === "student"
                                ? "bg-green-500/10"
                                : "bg-yellow-500/10",
                        )}
                      >
                        <ActivityIcon className={cn("w-5 h-5", activity.color)} />
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">{activity.title}</p>
                        <p className="text-muted-foreground text-sm">{activity.description}</p>
                      </div>
                      <span className="text-muted-foreground text-sm">{activity.time}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              {t("manager.dashboard.quickActions", "Quick Actions")}
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/manager/content/create')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg flex items-center space-x-3 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span>{t("manager.dashboard.createCourse", "Create Course")}</span>
              </button>
              <button
                onClick={() => router.push('/manager/sessions')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg flex items-center space-x-3 transition-colors"
              >
                <Video className="w-5 h-5" />
                <span>{t("manager.dashboard.scheduleSession", "Schedule Session")}</span>
              </button>
              <button
                onClick={() => router.push('/manager/content/create')}
                className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg flex items-center space-x-3 transition-colors"
              >
                <Award className="w-5 h-5" />
                <span>{t("manager.dashboard.createTest", "Create Test")}</span>
              </button>
              <button
                onClick={() => router.push('/manager/students')}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white p-3 rounded-lg flex items-center space-x-3 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>{t("manager.dashboard.viewStudents", "View Students")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sessions and Courses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Sessions */}
          <div className="bg-card rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              {t("manager.dashboard.upcomingSessions", "Upcoming Sessions")}
            </h3>
            <div className="space-y-4">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                    <Video className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {t("Aucune session programmée", "No upcoming sessions")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("Vos sessions programmées apparaîtront ici", "Your scheduled sessions will appear here")}
                  </p>
                </div>
              ) : (
                upcomingSessions.map((session) => (
                  <div key={session.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-foreground font-medium">{session.title}</h4>
                      <span className="text-muted-foreground text-sm">{session.time}</span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">{session.date}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        {session.participants}/{session.maxParticipants}{" "}
                        {t("manager.dashboard.participants", "participants")}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {session.duration} {t("manager.dashboard.minutes", "min")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Courses */}
          <div className="bg-card rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              {t("manager.dashboard.topCourses", "Top Courses")}
            </h3>
            <div className="space-y-4">
              {topCourses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {t("Aucun cours créé", "No courses created")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("Vos cours les plus populaires apparaîtront ici", "Your most popular courses will appear here")}
                  </p>
                </div>
              ) : (
                topCourses.map((course) => (
                  <div key={course.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-foreground font-medium">{course.title}</h4>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-muted-foreground text-sm">{course.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        {course.students} {t("manager.dashboard.students", "students")}
                      </span>
                      <span className="text-green-400 text-sm">+{course.growth}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            {t("manager.dashboard.performanceOverview", "Performance Overview")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {statsLoading ? "..." : stats.averageRating.toFixed(1)}
              </p>
              <p className="text-muted-foreground text-sm">{t("manager.stats.averageRating", "Average Rating")}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {statsLoading ? "..." : stats.studentsManaged.toLocaleString()}
              </p>
              <p className="text-muted-foreground text-sm">{t("manager.stats.activeStudents", "Active Students")}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {statsLoading ? "..." : `${stats.monthlyGrowth}%`}
              </p>
              <p className="text-muted-foreground text-sm">{t("manager.stats.monthlyGrowth", "Monthly Growth")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

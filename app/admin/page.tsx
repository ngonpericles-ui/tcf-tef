"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  BookOpen,
  TrendingUp,
  DollarSign,
  UserCheck,
  AlertCircle,
  Activity,
  Calendar,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import apiClient from "@/lib/api-client"

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin, loading, user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [statsData, setStatsData] = useState({
    onlineUsers: 0,
    totalUsers: 0,
    courses: 0,
    monthlyRevenue: 0,
    successRate: 0,
    system: 'operational'
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [onlineUsersList, setOnlineUsersList] = useState<any[]>([])
  
  // Debug panel state
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Redirect to admin login if not authenticated
        router.replace('/admin/login')
      } else if (!isAdmin) {
        // If authenticated but not admin, redirect to appropriate dashboard
        if (user?.role === 'USER') {
          router.replace('/home')
        } else if (user?.role === 'SENIOR_MANAGER' || user?.role === 'JUNIOR_MANAGER') {
          router.replace('/manager/dashboard')
        } else {
          router.replace('/welcome')
        }
      }
    }
  }, [isAuthenticated, isAdmin, loading, router, user])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  // Redirect to login (this shouldn't render due to useEffect redirect)
  if (!isAuthenticated || !isAdmin) {
    return null
  }

  const stats = useMemo(() => ([
    {
      title: "Utilisateurs en ligne",
      value: String(statsData.onlineUsers),
      change: "0%",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Utilisateurs Totaux",
      value: String(statsData.totalUsers ?? 0),
      change: "",
      icon: Users,
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-slate-50 dark:bg-slate-900/20",
    },
    {
      title: "Cours Disponibles",
      value: String(statsData.courses),
      change: "0",
      icon: BookOpen,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Revenus Mensuels",
      value: `${statsData.monthlyRevenue} CFA`,
      change: "0%",
      icon: DollarSign,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      title: "Taux de Réussite",
      value: `${statsData.successRate}%`,
      change: "0%",
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
  ]), [statsData])

  // Replace approvals with simple system status info panel
  const systemStatus = { status: statsData.system, lastUpdate: new Date().toLocaleTimeString() }

  // Get user name for welcome message
  const userName = useMemo(() => {
    if (user?.firstName || user?.lastName) {
      const full = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
      if (full.toLowerCase() !== 'admin user' && full !== '') return full
    }
    const base = (user?.email || '').split('@')[0]
    const parts = base.split(/[._-]+/).filter(Boolean)
    const pretty = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
    return pretty || (user?.email || 'Administrateur')
  }, [user])

  // Fetch stats periodically using existing backend endpoints
  useEffect(() => {
    let timer: any
    let isRateLimited = false
    
    const fetchStats = async () => {
      // Skip fetch if we're rate limited
      if (isRateLimited) {
        return
      }
      
      try {
        // Use real database endpoints
        const [usersRes, dashboardRes] = await Promise.all([
          apiClient.get<any>('/admin/users?limit=1000').catch(() => ({ success: false, data: [] })),
          apiClient.get<any>('/admin/dashboard').catch(() => ({ success: false, data: { stats: {}, recentActivities: [] } }))
        ])
        
        // Initialize with defaults
        let totalUsers = 0
        let onlineUsers = 0
        let courses = 0
        let monthlyRevenue = 0
        let successRate = 0

        // Get comprehensive data from dashboard response (primary source)
        if (dashboardRes.success && dashboardRes.data) {
          const dashData = dashboardRes.data;

          // Use real stats from backend - this is the authoritative source
          if (dashData.stats) {
            totalUsers = dashData.stats.totalUsers || 0;
            onlineUsers = dashData.stats.activeUsers || 0; // Backend activeUsers = users active in timeframe
            courses = dashData.stats.totalCourses || 0;
            monthlyRevenue = dashData.stats.totalRevenue || 0;
            successRate = dashData.stats.successRate || 0;
          }

          // Enhanced activities with logins, logouts, registrations, payments
          const activities = dashData.recentActivities || [];
          setRecentActivities(Array.isArray(activities) ? activities : []);
        }

        // Process users data for online users list (secondary source for UI list)
        if (usersRes.success && usersRes.data) {
          const users = Array.isArray(usersRes.data) ? usersRes.data : []

          // Create online users list (last activity within 5 minutes for detailed list)
          const now = new Date()
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
          const onlineUsersList = users.filter((user: any) => {
            const lastLogin = new Date(user.lastLoginAt || user.lastActivityAt || 0)
            return lastLogin > fiveMinutesAgo && user.status === 'ACTIVE'
          })

          setOnlineUsersList(onlineUsersList)

          // If dashboard didn't provide activeUsers, fallback to calculated value
          if (!dashboardRes.success || !dashboardRes.data?.stats?.activeUsers) {
            onlineUsers = onlineUsersList.length
            totalUsers = users.length
          }
        }

        setStatsData({
          onlineUsers,
          totalUsers,
          courses,
          monthlyRevenue: Math.round(monthlyRevenue),
          successRate,
          system: 'operational'
        })
        
        // Recent activities now come from enhanced backend method
        // They already include logins, registrations, payments
        // Just need to format them properly
        if (dashboardRes.success && dashboardRes.data && dashboardRes.data.recentActivities) {
          const apiActivities = Array.isArray(dashboardRes.data.recentActivities) ? dashboardRes.data.recentActivities : []
          const formattedActivities = apiActivities.map((activity: any) => ({
            user: activity.userName || activity.user || 'Système',
            action: activity.action || activity.description || activity.eventType,
            time: new Date(activity.timestamp || activity.createdAt).toLocaleString('fr-FR'),
            status: activity.status || 'info',
            type: activity.type
          }));
          
          setRecentActivities(formattedActivities.slice(0, 10)); // Show top 10
        }
        
        // Reset rate limit flag on successful fetch
        isRateLimited = false
      } catch (e: any) {
        console.error('Failed to fetch admin stats:', e)
        
        // Check if it's a rate limiting error
        if (e?.response?.status === 429 || e?.message?.includes('Too many requests')) {
          console.warn('Rate limited - will retry in next interval')
          isRateLimited = true
          // Reset after 15 minutes (rate limit window)
          setTimeout(() => { isRateLimited = false }, 15 * 60 * 1000)
        }
        
        setStatsData(prev => ({ ...prev, system: 'degraded' }))
      }
    }
    
    fetchStats()
    // Refresh every 2 minutes to avoid rate limiting (backend allows 100 requests per 15 minutes)
    timer = setInterval(fetchStats, 120000) // 2 minutes = 120,000ms
    return () => clearInterval(timer)
  }, [])

  // Lightweight activity ping so admin stays counted as online
  useEffect(() => {
    let pingTimer: any
    const ping = async () => {
      try {
        if (user?.id) {
          await apiClient.post('/auth/activity', {})
        }
      } catch {
        // ignore
      }
    }
    ping()
    pingTimer = setInterval(ping, 60_000)
    return () => clearInterval(pingTimer)
  }, [user?.id])

  // Test all dashboard cards functionality
  const testDashboardCards = async () => {
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    }
    
    try {
      // Test 1: Dashboard data
      const start1 = Date.now()
      const dashResponse = await apiClient.get('/admin/dashboard')
      const dashTime = Date.now() - start1
      results.tests.dashboard = {
        success: dashResponse.success,
        time: dashTime,
        data: dashResponse.data
      }
      
      // Test 2: Business metrics
      const start2 = Date.now()
      const metricsResponse = await apiClient.get('/admin/metrics/business?period=30d')
      const metricsTime = Date.now() - start2
      results.tests.businessMetrics = {
        success: metricsResponse.success,
        time: metricsTime,
        data: metricsResponse.data
      }
      
      // Test 3: System health
      const start3 = Date.now()
      const healthResponse = await apiClient.get('/admin/system/health')
      const healthTime = Date.now() - start3
      results.tests.systemHealth = {
        success: healthResponse.success,
        time: healthTime,
        data: healthResponse.data
      }
      
      // Test 4: Users list (all users from database)
      const start4 = Date.now()
      const usersResponse = await apiClient.get('/admin/users?limit=1000')
      const usersTime = Date.now() - start4
      results.tests.users = {
        success: usersResponse.success,
        time: usersTime,
        data: usersResponse.data,
        userCount: (usersResponse.data as any)?.users?.length || 0
      }
      
      // Test 5: Activity ping
      const start5 = Date.now()
      const activityResponse = await apiClient.post('/auth/activity', {})
      const activityTime = Date.now() - start5
      results.tests.activityPing = {
        success: activityResponse.success,
        time: activityTime,
        data: activityResponse.data
      }
      
      setTestResults(results)
      
    } catch (error) {
      results.error = error
      setTestResults(results)
      console.error('Dashboard test failed:', error)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Bienvenue, {userName}!</h2>
        <p className="text-muted-foreground">
          Tableau de bord administrateur - Accès complet à toutes les fonctionnalités de la plateforme TCF-TEF.
        </p>
        
        {/* Debug Panel */}
        <div className="mt-4 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Masquer Debug' : 'Afficher Debug'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testDashboardCards}
          >
            Tester Cartes
          </Button>
        </div>
        
        {showDebug && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <div className="text-sm space-y-1">
              <p><strong>Utilisateur ID:</strong> {user?.id}</p>
              <p><strong>Utilisateurs en ligne:</strong> {statsData.onlineUsers}</p>
              <p><strong>Total utilisateurs:</strong> {statsData.totalUsers}</p>
              <p><strong>Dernière actualisation:</strong> {new Date().toLocaleString('fr-FR')}</p>
            </div>
          </div>
        )}
        
        {testResults && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold mb-2">Résultats des Tests:</h3>
            <div className="text-sm space-y-1">
              {Object.entries(testResults.tests || {}).map(([key, test]: [string, any]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key}:</span>
                  <span className={test.success ? 'text-green-600' : 'text-red-600'}>
                    {test.success ? '✓' : '✗'} ({test.time}ms)
                  </span>
                </div>
              ))}
              {testResults.tests?.users && (
                <div className="mt-2 p-2 bg-white dark:bg-gray-700 rounded">
                  <strong>Tous les Utilisateurs de la Base de Données ({testResults.tests.users.userCount}):</strong>
                  <div className="mt-1 max-h-40 overflow-y-auto">
                    {(testResults.tests.users.data as any)?.users?.map((u: any, i: number) => (
                      <div key={i} className="text-xs border-b border-gray-200 py-1">
                        {i + 1}. {u.firstName} {u.lastName} ({u.email}) - {new Date(u.createdAt).toLocaleDateString('fr-FR')} - {u.role}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">Vue d'ensemble de la plateforme TCF-TEF</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400"
          >
            <Activity className="w-3 h-3 mr-1" />
            Système opérationnel
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                {stat.change} ce mois
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Activité Récente
            </CardTitle>
            <CardDescription className="text-muted-foreground">Dernières actions des utilisateurs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === "success"
                        ? "bg-green-500"
                        : activity.status === "warning"
                          ? "bg-yellow-500"
                          : activity.status === "error"
                            ? "bg-red-500"
                            : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune activité récente</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              État du Système
            </CardTitle>
            <CardDescription className="text-muted-foreground">Résumé temps réel — auto‑rafraîchissement 2min</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-accent rounded-lg flex items-center justify-between">
              <div className="text-sm text-foreground">Statut</div>
              <Badge variant="outline" className={systemStatus.status === 'operational' ? 'text-green-600 border-green-600' : 'text-yellow-600 border-yellow-600'}>
                {systemStatus.status === 'operational' ? 'Opérationnel' : 'Dégradé'}
                      </Badge>
                    </div>
            <div className="p-3 bg-accent rounded-lg flex items-center justify-between">
              <div className="text-sm text-foreground">Utilisateurs en ligne</div>
              <div className="text-sm font-semibold text-foreground">{statsData.onlineUsers}</div>
                  </div>
            <div className="text-xs text-muted-foreground text-right">Dernière mise à jour: {systemStatus.lastUpdate}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-foreground">Actions Rapides</CardTitle>
          <CardDescription className="text-muted-foreground">Raccourcis vers les tâches courantes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col space-y-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5" />
              <span className="text-sm">Nouveau Cours</span>
            </Button>
            <Button className="h-20 flex-col space-y-2 bg-green-600 hover:bg-green-700">
              <UserCheck className="w-5 h-5" />
              <span className="text-sm">Gérer Managers</span>
            </Button>
            <Button className="h-20 flex-col space-y-2 bg-purple-600 hover:bg-purple-700">
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm">Voir Statistiques</span>
            </Button>
            <Button className="h-20 flex-col space-y-2 bg-orange-600 hover:bg-orange-700">
              <Calendar className="w-5 h-5" />
              <span className="text-sm">Sessions Live</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
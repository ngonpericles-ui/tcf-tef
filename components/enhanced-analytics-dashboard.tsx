"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Award,
  Download,
  Filter,
  BarChart3,
  Eye,
  Clock,
  Target,
  Zap,
  RefreshCw,
  Calendar,
  Globe,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useAnalytics, useAnalyticsPageView } from "@/hooks/useAnalytics"
import { AnalyticsService } from "@/lib/services/analyticsService"
import FrenchLearningAnalytics from "@/components/french-learning-analytics"
import LearningInsightsDashboard from "@/components/learning-insights-dashboard"
import PredictiveAnalyticsDashboard from "@/components/predictive-analytics-dashboard"
import AutomatedReportingDashboard from "@/components/automated-reporting-dashboard"

interface EnhancedAnalyticsDashboardProps {
  userRole: 'ADMIN' | 'SENIOR_MANAGER' | 'JUNIOR_MANAGER' | 'USER'
  className?: string
}

export default function EnhancedAnalyticsDashboard({
  userRole,
  className = ""
}: EnhancedAnalyticsDashboardProps) {
  const { t } = useLanguage()

  // Use analytics hook for data management
  const {
    dashboardData,
    activityData,
    loading,
    error,
    refreshing,
    lastUpdated,
    refresh,
    setTimeRange: updateTimeRange,
    trackEvent
  } = useAnalytics({
    userRole,
    timeRange: "30d",
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000 // 5 minutes
  })

  // Track page view
  useAnalyticsPageView('analytics_dashboard')

  const [timeRange, setTimeRange] = useState("30d")



  // Handle time range change
  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange)
    updateTimeRange(newRange)
    trackEvent('time_range_change', { range: newRange })
  }

  // Export data
  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf' = 'csv') => {
    try {
      trackEvent('export_analytics', { format, timeRange })
      const response = await AnalyticsService.exportData(format, undefined, timeRange)
      if (response.success) {
        // Handle file download
        console.log('Export successful:', response.data)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }



  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        {t("Chargement des analyses...", "Loading analytics...")}
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
        <Button variant="outline" size="sm" onClick={refresh} className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("Réessayer", "Retry")}
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            {t('Tableau de bord analytique', 'Analytics Dashboard')}
          </h1>
          <p className="text-muted-foreground">
            {t('Dernière mise à jour', 'Last updated')}: {lastUpdated?.toLocaleTimeString() || t('Jamais', 'Never')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 {t('jours', 'days')}</SelectItem>
              <SelectItem value="30d">30 {t('jours', 'days')}</SelectItem>
              <SelectItem value="90d">90 {t('jours', 'days')}</SelectItem>
              <SelectItem value="1y">1 {t('an', 'year')}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            {t('Exporter', 'Export')}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Utilisateurs totaux', 'Total Users')}
                  </p>
                  <p className="text-2xl font-bold">
                    {AnalyticsService.formatNumber(dashboardData.totalUsers)}
                  </p>
                  {dashboardData.userGrowth && dashboardData.userGrowth.length >= 2 && (
                    <div className={`flex items-center gap-1 text-sm ${
                      dashboardData.userGrowth[dashboardData.userGrowth.length - 1].change &&
                      dashboardData.userGrowth[dashboardData.userGrowth.length - 1].change! > 0
                        ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {dashboardData.userGrowth[dashboardData.userGrowth.length - 1].change &&
                       dashboardData.userGrowth[dashboardData.userGrowth.length - 1].change! > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {dashboardData.userGrowth[dashboardData.userGrowth.length - 1].change
                        ? AnalyticsService.formatPercentage(dashboardData.userGrowth[dashboardData.userGrowth.length - 1].change!)
                        : '+0%'
                      }
                    </div>
                  )}
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Utilisateurs actifs', 'Active Users')}
                  </p>
                  <p className="text-2xl font-bold">
                    {AnalyticsService.formatNumber(dashboardData.activeUsers)}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-blue-500">
                    <TrendingUp className="h-3 w-3" />
                    {t('Ce mois', 'This month')}
                  </div>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Cours totaux', 'Total Courses')}
                  </p>
                  <p className="text-2xl font-bold">
                    {AnalyticsService.formatNumber(dashboardData.totalCourses)}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-green-500">
                    <BookOpen className="h-3 w-3" />
                    {t('Actifs', 'Active')}
                  </div>
                </div>
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Sessions live', 'Live Sessions')}
                  </p>
                  <p className="text-2xl font-bold">
                    {AnalyticsService.formatNumber(dashboardData.totalLiveSessions)}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-purple-500">
                    <Zap className="h-3 w-3" />
                    {t('En direct', 'Live')}
                  </div>
                </div>
                <Zap className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('Vue d\'ensemble', 'Overview')}</TabsTrigger>
          <TabsTrigger value="users">{t('Utilisateurs', 'Users')}</TabsTrigger>
          <TabsTrigger value="learning">{t('Apprentissage', 'Learning')}</TabsTrigger>
          <TabsTrigger value="insights">{t('Insights', 'Insights')}</TabsTrigger>
          <TabsTrigger value="predictions">{t('Prédictions IA', 'AI Predictions')}</TabsTrigger>
          <TabsTrigger value="courses">{t('Cours', 'Courses')}</TabsTrigger>
          {(userRole === 'SENIOR_MANAGER' || userRole === 'JUNIOR_MANAGER' || userRole === 'ADMIN') && (
            <TabsTrigger value="teaching">{t('Enseignement', 'Teaching')}</TabsTrigger>
          )}
          {userRole === 'ADMIN' && (
            <>
              <TabsTrigger value="reports">{t('Rapports', 'Reports')}</TabsTrigger>
              <TabsTrigger value="system">{t('Système', 'System')}</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* User Growth Chart */}
            {dashboardData?.userGrowth && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('Croissance des utilisateurs', 'User Growth')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dashboardData.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.6} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Subscription Distribution */}
            {dashboardData?.subscriptionDistribution && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('Répartition des abonnements', 'Subscription Distribution')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(dashboardData.subscriptionDistribution).map(([key, value]) => ({
                          name: key,
                          value,
                          color: key === 'FREE' ? '#10b981' : key === 'ESSENTIAL' ? '#3b82f6' : key === 'PREMIUM' ? '#f59e0b' : '#8b5cf6'
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Object.entries(dashboardData.subscriptionDistribution).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry[0] === 'FREE' ? '#10b981' : entry[0] === 'ESSENTIAL' ? '#3b82f6' : entry[0] === 'PREMIUM' ? '#f59e0b' : '#8b5cf6'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {activityData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-500">
                    {AnalyticsService.formatNumber(activityData.dailyActiveUsers)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('Utilisateurs actifs quotidiens', 'Daily Active Users')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-500">
                    {Math.round(activityData.sessionDuration / 60)}m
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('Durée moyenne de session', 'Avg Session Duration')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold text-purple-500">
                    {AnalyticsService.formatNumber(activityData.pageViews)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('Pages vues', 'Page Views')}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* French Learning Analytics Tab */}
        <TabsContent value="learning" className="space-y-4">
          <FrenchLearningAnalytics
            timeframe={timeRange}
            userRole={userRole as 'ADMIN' | 'SENIOR_MANAGER' | 'JUNIOR_MANAGER'}
            className="w-full"
          />
        </TabsContent>

        {/* Learning Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <LearningInsightsDashboard
            timeframe={timeRange}
            userRole={userRole as 'ADMIN' | 'SENIOR_MANAGER' | 'JUNIOR_MANAGER'}
            className="w-full"
          />
        </TabsContent>

        {/* AI Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <PredictiveAnalyticsDashboard
            timeframe={timeRange}
            userRole={userRole as 'ADMIN' | 'SENIOR_MANAGER' | 'JUNIOR_MANAGER'}
            className="w-full"
          />
        </TabsContent>

        {/* Automated Reports Tab (Admin only) */}
        {userRole === 'ADMIN' && (
          <TabsContent value="reports" className="space-y-4">
            <AutomatedReportingDashboard
              userRole={userRole as 'ADMIN' | 'SENIOR_MANAGER' | 'JUNIOR_MANAGER'}
              className="w-full"
            />
          </TabsContent>
        )}

        {/* Additional tabs will be implemented in the next step */}
      </Tabs>
    </div>
  )
}

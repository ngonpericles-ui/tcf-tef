"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  Share2,
  Users,
  Clock,
  HardDrive,
  FileText,
  Calendar,
  Activity,
  Target,
  Zap,
  Globe,
  Loader2,
  AlertCircle,
  RefreshCw,
  Filter
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { fileService, type FileItem } from "@/lib/services/fileService"

interface FileAnalyticsDashboardProps {
  fileId?: string
  timeRange?: '7d' | '30d' | '90d' | '1y'
  className?: string
}

interface FileAnalytics {
  fileId: string
  fileName: string
  totalViews: number
  totalDownloads: number
  totalShares: number
  uniqueUsers: number
  averageViewDuration: number
  peakUsageHour: number
  popularityScore: number
  engagementRate: number
  conversionRate: number
  lastAccessed: string
}

interface UsageMetrics {
  date: string
  views: number
  downloads: number
  shares: number
  uniqueUsers: number
}

interface UserEngagement {
  userId: string
  userName: string
  userEmail: string
  totalViews: number
  totalDownloads: number
  lastAccess: string
  engagementScore: number
}

interface GeographicData {
  country: string
  users: number
  percentage: number
}

export default function FileAnalyticsDashboard({
  fileId,
  timeRange = '30d',
  className = ""
}: FileAnalyticsDashboardProps) {
  const { lang } = useLang()
  
  const [analytics, setAnalytics] = useState<FileAnalytics | null>(null)
  const [usageData, setUsageData] = useState<UsageMetrics[]>([])
  const [userEngagement, setUserEngagement] = useState<UserEngagement[]>([])
  const [geographicData, setGeographicData] = useState<GeographicData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!fileId) {
        // Load general file statistics from your backend
        const statsResponse = await fileService.getFileStats()

        if (statsResponse.success && statsResponse.data) {
          const stats = statsResponse.data

          // Create analytics from your existing file stats
          const analyticsData: FileAnalytics = {
            fileId: 'general',
            fileName: t('Statistiques générales', 'General Statistics'),
            totalViews: stats.totalFiles * 10, // Estimate based on file count
            totalDownloads: stats.totalFiles * 3, // Estimate
            totalShares: Math.floor(stats.totalFiles * 0.5), // Estimate
            uniqueUsers: Math.floor(stats.totalFiles * 2), // Estimate
            averageViewDuration: 4.5,
            peakUsageHour: 14,
            popularityScore: 8.0,
            engagementRate: 0.25,
            conversionRate: 0.20,
            lastAccessed: new Date().toISOString()
          }

          setAnalytics(analyticsData)
        }
      } else {
        // Load specific file analytics (when backend supports it)
        // For now, create basic analytics from file data
        const fileResponse = await fileService.getFileById(fileId)

        if (fileResponse.success && fileResponse.data) {
          const file = fileResponse.data

          const analyticsData: FileAnalytics = {
            fileId: file.id,
            fileName: file.originalName,
            totalViews: Math.floor(Math.random() * 1000) + 100, // Placeholder until backend tracking
            totalDownloads: Math.floor(Math.random() * 300) + 50,
            totalShares: Math.floor(Math.random() * 50) + 10,
            uniqueUsers: Math.floor(Math.random() * 200) + 30,
            averageViewDuration: 4.5,
            peakUsageHour: 14,
            popularityScore: 7.5,
            engagementRate: 0.28,
            conversionRate: 0.22,
            lastAccessed: file.updatedAt
          }

          setAnalytics(analyticsData)
        }
      }

      const mockUsageData: UsageMetrics[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 50) + 10,
        downloads: Math.floor(Math.random() * 20) + 5,
        shares: Math.floor(Math.random() * 10) + 1,
        uniqueUsers: Math.floor(Math.random() * 30) + 5
      }))

      const mockUserEngagement: UserEngagement[] = [
        {
          userId: 'user1',
          userName: 'Marie Dupont',
          userEmail: 'marie.dupont@example.com',
          totalViews: 45,
          totalDownloads: 12,
          lastAccess: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          engagementScore: 9.2
        },
        {
          userId: 'user2',
          userName: 'Jean Martin',
          userEmail: 'jean.martin@example.com',
          totalViews: 38,
          totalDownloads: 8,
          lastAccess: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          engagementScore: 7.8
        },
        {
          userId: 'user3',
          userName: 'Sophie Leroy',
          userEmail: 'sophie.leroy@example.com',
          totalViews: 32,
          totalDownloads: 15,
          lastAccess: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          engagementScore: 8.5
        }
      ]

      const mockGeographicData: GeographicData[] = [
        { country: 'France', users: 156, percentage: 66.7 },
        { country: 'Canada', users: 45, percentage: 19.2 },
        { country: 'Belgique', users: 23, percentage: 9.8 },
        { country: 'Suisse', users: 10, percentage: 4.3 }
      ]

      setAnalytics(mockAnalytics)
      setUsageData(mockUsageData)
      setUserEngagement(mockUserEngagement)
      setGeographicData(mockGeographicData)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur inconnue', 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [fileId, selectedTimeRange, t])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  // Format number with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Format percentage
  const formatPercentage = (num: number): string => {
    return `${(num * 100).toFixed(1)}%`
  }

  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes.toFixed(1)}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins.toFixed(0)}min`
  }

  // Get trend indicator
  const getTrendIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100
    if (change > 0) {
      return { icon: TrendingUp, color: 'text-green-500', value: `+${change.toFixed(1)}%` }
    } else if (change < 0) {
      return { icon: TrendingDown, color: 'text-red-500', value: `${change.toFixed(1)}%` }
    }
    return { icon: Activity, color: 'text-gray-500', value: '0%' }
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
        <Button variant="outline" size="sm" onClick={loadAnalytics} className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("Réessayer", "Retry")}
        </Button>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            {t('Analyses de fichier', 'File Analytics')}
          </h2>
          <p className="text-muted-foreground">{analytics.fileName}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
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
          
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('Vues totales', 'Total Views')}</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalViews)}</p>
                <div className="flex items-center gap-1 text-sm text-green-500">
                  <TrendingUp className="h-3 w-3" />
                  +12.5%
                </div>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('Téléchargements', 'Downloads')}</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalDownloads)}</p>
                <div className="flex items-center gap-1 text-sm text-green-500">
                  <TrendingUp className="h-3 w-3" />
                  +8.3%
                </div>
              </div>
              <Download className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('Partages', 'Shares')}</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalShares)}</p>
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <TrendingDown className="h-3 w-3" />
                  -2.1%
                </div>
              </div>
              <Share2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('Utilisateurs uniques', 'Unique Users')}</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.uniqueUsers)}</p>
                <div className="flex items-center gap-1 text-sm text-green-500">
                  <TrendingUp className="h-3 w-3" />
                  +15.7%
                </div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">{t('Utilisation', 'Usage')}</TabsTrigger>
          <TabsTrigger value="engagement">{t('Engagement', 'Engagement')}</TabsTrigger>
          <TabsTrigger value="geographic">{t('Géographie', 'Geographic')}</TabsTrigger>
          <TabsTrigger value="performance">{t('Performance', 'Performance')}</TabsTrigger>
        </TabsList>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('Activité quotidienne', 'Daily Activity')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value, name) => [value, t(name === 'views' ? 'Vues' : name === 'downloads' ? 'Téléchargements' : 'Partages', name)]}
                    />
                    <Area type="monotone" dataKey="views" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="downloads" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="shares" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('Répartition des actions', 'Action Distribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: t('Vues', 'Views'), value: analytics.totalViews, color: '#3b82f6' },
                        { name: t('Téléchargements', 'Downloads'), value: analytics.totalDownloads, color: '#10b981' },
                        { name: t('Partages', 'Shares'), value: analytics.totalShares, color: '#f59e0b' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { name: t('Vues', 'Views'), value: analytics.totalViews, color: '#3b82f6' },
                        { name: t('Téléchargements', 'Downloads'), value: analytics.totalDownloads, color: '#10b981' },
                        { name: t('Partages', 'Shares'), value: analytics.totalShares, color: '#f59e0b' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm">{t('Vues', 'Views')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm">{t('Téléchargements', 'Downloads')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-sm">{t('Partages', 'Shares')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('Utilisateurs les plus actifs', 'Top Active Users')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {userEngagement.map((user, index) => (
                      <div key={user.userId} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium text-sm">{user.userName}</p>
                            <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{user.totalViews} {t('vues', 'views')}</p>
                          <p className="text-xs text-muted-foreground">{user.totalDownloads} {t('téléch.', 'downloads')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('Métriques d\'engagement', 'Engagement Metrics')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('Durée moyenne de vue', 'Average View Duration')}</span>
                    <span className="font-medium">{formatDuration(analytics.averageViewDuration)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('Taux d\'engagement', 'Engagement Rate')}</span>
                    <span className="font-medium">{formatPercentage(analytics.engagementRate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('Taux de conversion', 'Conversion Rate')}</span>
                    <span className="font-medium">{formatPercentage(analytics.conversionRate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('Score de popularité', 'Popularity Score')}</span>
                    <span className="font-medium">{analytics.popularityScore}/10</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('Heure de pointe', 'Peak Usage Hour')}</span>
                    <span className="font-medium">{analytics.peakUsageHour}:00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Répartition géographique', 'Geographic Distribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {geographicData.map((country) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${country.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{country.users}</span>
                      <span className="text-sm text-muted-foreground w-12 text-right">{country.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-green-500">{formatPercentage(analytics.conversionRate)}</p>
                <p className="text-sm text-muted-foreground">{t('Taux de conversion', 'Conversion Rate')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-blue-500">{analytics.popularityScore}/10</p>
                <p className="text-sm text-muted-foreground">{t('Score de popularité', 'Popularity Score')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold text-purple-500">{formatPercentage(analytics.engagementRate)}</p>
                <p className="text-sm text-muted-foreground">{t('Taux d\'engagement', 'Engagement Rate')}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

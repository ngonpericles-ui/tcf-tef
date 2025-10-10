"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import {
  HardDrive,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Upload,
  Download,
  Share2,
  Trash2,
  Plus,
  FolderOpen,
  Clock,
  TrendingUp,
  Users,
  Eye,
  Loader2
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { fileService, type FileItem, type FileStats } from "@/lib/services/fileService"

interface FileManagerDashboardProps {
  onUploadClick?: () => void
  onBrowseClick?: () => void
  className?: string
}

interface RecentActivity {
  id: string
  type: 'upload' | 'download' | 'share' | 'delete'
  fileName: string
  timestamp: string
  user?: string
}

export default function FileManagerDashboard({
  onUploadClick,
  onBrowseClick,
  className = ""
}: FileManagerDashboardProps) {
  const { lang } = useLang()
  
  const [stats, setStats] = useState<FileStats | null>(null)
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load storage stats
        const statsResponse = await fileService.getStorageStats()
        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data)
        }

        // Load recent files
        const filesResponse = await fileService.getFiles({}, { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
        if (filesResponse.success && filesResponse.data) {
          setRecentFiles(filesResponse.data.files)
        }

        // Mock recent activity (in real app, this would come from an activity log API)
        setRecentActivity([
          {
            id: '1',
            type: 'upload',
            fileName: 'presentation.pdf',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            user: 'John Doe'
          },
          {
            id: '2',
            type: 'download',
            fileName: 'course-material.docx',
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
            user: 'Jane Smith'
          },
          {
            id: '3',
            type: 'share',
            fileName: 'video-lesson.mp4',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            user: 'Mike Johnson'
          }
        ])

      } catch (err) {
        setError(err instanceof Error ? err.message : t('Erreur inconnue', 'Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [t])

  // Prepare chart data
  const categoryData = stats ? Object.entries(stats.filesByCategory).map(([category, count]) => ({
    name: category,
    value: count,
    color: getCategoryColor(category)
  })) : []

  const typeData = stats ? Object.entries(stats.filesByType).map(([type, count]) => ({
    name: type,
    count
  })) : []

  // Get category color
  function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'COURSE_MATERIAL': '#3b82f6',
      'DOCUMENT': '#10b981',
      'POST_MEDIA': '#f59e0b',
      'PROFILE_IMAGE': '#ef4444',
      'OTHER': '#6b7280'
    }
    return colors[category] || '#6b7280'
  }

  // Get activity icon
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'upload':
        return <Upload className="h-4 w-4 text-blue-500" />
      case 'download':
        return <Download className="h-4 w-4 text-green-500" />
      case 'share':
        return <Share2 className="h-4 w-4 text-purple-500" />
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Get file type icon
  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4 text-red-500" />
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4 text-green-500" />
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-4 w-4 text-yellow-500" />
    return <FileText className="h-4 w-4 text-gray-500" />
  }

  // Format time ago
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return t('À l\'instant', 'Just now')
    if (diffInMinutes < 60) return t(`Il y a ${diffInMinutes} min`, `${diffInMinutes}m ago`)
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return t(`Il y a ${diffInHours}h`, `${diffInHours}h ago`)
    
    const diffInDays = Math.floor(diffInHours / 24)
    return t(`Il y a ${diffInDays}j`, `${diffInDays}d ago`)
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        {t("Chargement du tableau de bord...", "Loading dashboard...")}
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive ${className}`}>
        {error}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("Gestionnaire de fichiers", "File Manager")}</h1>
          <p className="text-muted-foreground">
            {t("Gérez vos fichiers et documents", "Manage your files and documents")}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onUploadClick}>
            <Plus className="h-4 w-4 mr-2" />
            {t("Téléverser", "Upload")}
          </Button>
          <Button variant="outline" onClick={onBrowseClick}>
            <FolderOpen className="h-4 w-4 mr-2" />
            {t("Parcourir", "Browse")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("Total des fichiers", "Total Files")}
                </p>
                <p className="text-2xl font-bold">{stats?.totalFiles || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("Espace utilisé", "Storage Used")}
                </p>
                <p className="text-2xl font-bold">
                  {stats ? fileService.formatFileSize(stats.storageUsed) : '0 B'}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-muted-foreground" />
            </div>
            {stats && (
              <div className="mt-4">
                <Progress 
                  value={(stats.storageUsed / stats.storageLimit) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((stats.storageUsed / stats.storageLimit) * 100)}% {t("utilisé", "used")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("Fichiers récents", "Recent Files")}
                </p>
                <p className="text-2xl font-bold">{recentFiles.length}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("Activité", "Activity")}
                </p>
                <p className="text-2xl font-bold">{recentActivity.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Files by Category */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Fichiers par catégorie", "Files by Category")}</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                {t("Aucune donnée disponible", "No data available")}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {item.value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Files by Type */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Fichiers par type", "Files by Type")}</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                {t("Aucune donnée disponible", "No data available")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Files and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t("Fichiers récents", "Recent Files")}
              <Button variant="ghost" size="sm" onClick={onBrowseClick}>
                {t("Voir tout", "View all")}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {recentFiles.length > 0 ? (
                <div className="space-y-3">
                  {recentFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50">
                      <div className="text-muted-foreground">
                        {getFileTypeIcon(file.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.originalName}</p>
                        <p className="text-sm text-muted-foreground">
                          {fileService.formatFileSize(file.size)} • {formatTimeAgo(file.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {file.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2 opacity-50" />
                  <p>{t("Aucun fichier récent", "No recent files")}</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Activité récente", "Recent Activity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50">
                      <div>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {activity.type === 'upload' && t("Téléversé", "Uploaded")}
                          {activity.type === 'download' && t("Téléchargé", "Downloaded")}
                          {activity.type === 'share' && t("Partagé", "Shared")}
                          {activity.type === 'delete' && t("Supprimé", "Deleted")}
                          {" "}{activity.fileName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.user} • {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2 opacity-50" />
                  <p>{t("Aucune activité récente", "No recent activity")}</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Actions rapides", "Quick Actions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={onUploadClick}>
              <Upload className="h-6 w-6" />
              <span className="text-sm">{t("Téléverser", "Upload")}</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={onBrowseClick}>
              <FolderOpen className="h-6 w-6" />
              <span className="text-sm">{t("Parcourir", "Browse")}</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Share2 className="h-6 w-6" />
              <span className="text-sm">{t("Partager", "Share")}</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Eye className="h-6 w-6" />
              <span className="text-sm">{t("Aperçu", "Preview")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

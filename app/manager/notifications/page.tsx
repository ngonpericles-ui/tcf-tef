"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"
import apiClient from "@/lib/api-client"
import {
  Bell,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Info,
  Settings,
  User,
  Crown,
  BookOpen,
  Clock,
  Eye,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  priority: "low" | "medium" | "high"
  isRead: boolean
  createdAt: string
  category: string
  actionUrl?: string
  sender?: {
    name: string
    role: string
  }
}

interface ManagerRole {
  role: "junior" | "content" | "senior"
  name: string
}

export default function ManagerNotificationsPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [currentManager, setCurrentManager] = useState<ManagerRole | null>(null)
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!user) return

        // Set current manager from user data
        const manager = {
          role: user.role === 'SENIOR_MANAGER' ? 'senior' as const :
                user.role === 'JUNIOR_MANAGER' ? 'junior' as const : 'junior' as const,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'Manager'
        }
        setCurrentManager(manager)

        // Fetch notifications from backend
        const response = await apiClient.get('/manager/notifications')

        if (response.success && response.data) {
          const notifications = response.data.notifications || []

          // Filter notifications based on role
          const roleFilteredNotifications = notifications.filter((notif: any) => {
            if (manager.role === "junior") {
              return notif.category !== "advanced" // Junior managers don't get advanced notifications
            }
            return true
          })

          setNotifications(roleFilteredNotifications)
        } else {
          // Fallback to empty array if API fails
          setNotifications([])
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
        setNotifications([])
      }
    }

    if (user) {
      fetchNotifications()
    }
  }, [user, t])

  const getRoleInfo = (role: string) => {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-orange-400" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500/10 border-green-500/20"
      case "warning":
        return "bg-orange-500/10 border-orange-500/20"
      case "error":
        return "bg-red-500/10 border-red-500/20"
      default:
        return "bg-blue-500/10 border-blue-500/20"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "medium":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif)))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, isRead: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((notif) => notif.id !== id))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return t("À l'instant", "Just now")
    } else if (diffInHours < 24) {
      return t(`Il y a ${diffInHours}h`, `${diffInHours}h ago`)
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return t(`Il y a ${diffInDays}j`, `${diffInDays}d ago`)
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !notif.isRead) ||
      (filter === "read" && notif.isRead) ||
      notif.category === filter

    const matchesSearch =
      searchQuery === "" ||
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const unreadCount = notifications.filter((notif) => !notif.isRead).length

  if (!currentManager) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const roleInfo = getRoleInfo(currentManager.role)
  const RoleIcon = roleInfo.icon

  return (
    <div className="min-h-screen p-6 bg-gray-950">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{t("Notifications", "Notifications")}</h1>
              <p className="text-gray-400">
                {t("Restez informé des dernières mises à jour", "Stay informed about the latest updates")}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className={cn("text-sm", roleInfo.color)}>
              <RoleIcon className="w-4 h-4 mr-2" />
              {roleInfo.label}
            </Badge>
            {unreadCount > 0 && (
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                {unreadCount} {t("non lues", "unread")}
              </Badge>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t("Rechercher dans les notifications...", "Search notifications...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800 text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48 bg-gray-900 border-gray-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-gray-300">
                  {t("Toutes", "All")}
                </SelectItem>
                <SelectItem value="unread" className="text-gray-300">
                  {t("Non lues", "Unread")}
                </SelectItem>
                <SelectItem value="read" className="text-gray-300">
                  {t("Lues", "Read")}
                </SelectItem>
                <SelectItem value="course" className="text-gray-300">
                  {t("Cours", "Courses")}
                </SelectItem>
                <SelectItem value="session" className="text-gray-300">
                  {t("Sessions", "Sessions")}
                </SelectItem>
                <SelectItem value="system" className="text-gray-300">
                  {t("Système", "System")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="border-gray-700 bg-transparent text-white hover:bg-gray-800"
            >
              {t("Tout marquer comme lu", "Mark all as read")}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-12 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2 text-white">
                  {t("Aucune notification", "No notifications")}
                </h3>
                <p className="text-gray-400">
                  {searchQuery || filter !== "all"
                    ? t("Aucune notification ne correspond à vos critères", "No notifications match your criteria")
                    : t(
                        "Vous êtes à jour ! Aucune nouvelle notification",
                        "You're all caught up! No new notifications",
                      )}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={cn(
                  "bg-gray-900 border-gray-800 transition-all duration-200 hover:border-gray-700",
                  !notification.isRead && "border-l-4 border-l-blue-500",
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={cn("p-2 rounded-lg", getTypeColor(notification.type))}>
                      {getTypeIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className={cn("font-medium", notification.isRead ? "text-gray-300" : "text-white")}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <p className={cn("text-sm mb-3", notification.isRead ? "text-gray-400" : "text-gray-300")}>
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(notification.createdAt)}</span>
                          </div>
                          {notification.sender && (
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{notification.sender.name}</span>
                            </div>
                          )}
                          <Badge variant="outline" className="text-xs bg-gray-800 border-gray-600">
                            {notification.category}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-2">
                          {notification.actionUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800"
                              onClick={() => (window.location.href = notification.actionUrl!)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {t("Voir", "View")}
                            </Button>
                          )}
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {t("Marquer comme lu", "Mark as read")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Settings Link */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">{t("Paramètres de notification", "Notification Settings")}</p>
                  <p className="text-gray-400 text-sm">
                    {t("Gérez vos préférences de notification", "Manage your notification preferences")}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-gray-700 bg-transparent text-white hover:bg-gray-800"
                onClick={() => (window.location.href = "/manager/settings?tab=notifications")}
              >
                {t("Configurer", "Configure")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

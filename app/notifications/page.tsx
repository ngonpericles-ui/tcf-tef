"use client"

import { useState, useEffect } from "react"
import PageShell from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bell,
  Search,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  MoreHorizontal
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { fr, enUS } from "date-fns/locale"

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  createdAt: string
  read: boolean
}

export default function NotificationsPage() {
  const { lang, t } = useLang()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/notifications?limit=50')
      if ((response.data as any)?.success) {
        setNotifications((response.data as any).data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error(t("Erreur lors du chargement", "Error loading notifications"))
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      toast.success(t("Marqué comme lu", "Marked as read"))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error(t("Erreur", "Error"))
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      toast.success(t("Notification supprimée", "Notification deleted"))
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error(t("Erreur", "Error"))
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t("Chargement...", "Loading...")}</p>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("Notifications", "Notifications")}
              </h1>
              <p className="text-muted-foreground">
                {t("Gérez vos notifications", "Manage your notifications")}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCount} {t("non lues", "unread")}
            </Badge>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Rechercher des notifications...", "Search notifications...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {t("Aucune notification", "No notifications")}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? t("Aucune notification trouvée", "No notifications found")
                      : t("Vous n'avez aucune notification", "You have no notifications")
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card key={notification.id} className={`transition-all hover:shadow-md ${!notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">
                              {t("Nouveau", "New")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-3 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: lang === 'fr' ? fr : enUS
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs"
                        >
                          {t("Marquer comme lu", "Mark as read")}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PageShell>
  )
}

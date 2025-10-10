"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import MessengerIcon from "./icons/messenger-icon"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import apiClient from "@/lib/api-client"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import { formatDistanceToNow } from "date-fns"
import { fr, enUS } from "date-fns/locale"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  priority: string
  actionUrl?: string
  createdAt: string
}

interface UnreadCountResponse {
  count: number
}

interface NotificationsResponse {
  notifications: Notification[]
}

interface MessagesResponse {
  messages: any[]
}

interface NotificationIndicatorProps {
  type: 'notifications' | 'messages'
}

export default function NotificationIndicator({ type }: NotificationIndicatorProps) {
  const { lang } = useLang()
  const { isAuthenticated, user } = useAuth()
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Only fetch if user is authenticated
    if (isAuthenticated && user) {
      fetchUnreadCount()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    } else {
      // Clear data if not authenticated
      setNotifications([])
      setUnreadCount(0)
    }
  }, [type, isAuthenticated, user])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, type])

  const fetchUnreadCount = async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated || !user) {
      setUnreadCount(0)
      return
    }

    try {
      const endpoint = type === 'notifications' 
        ? '/notifications/unread-count' 
        : '/messages/unread-count'
      
      const response = await apiClient.get<UnreadCountResponse>(endpoint)
      if (response.success && response.data) {
        setUnreadCount(response.data.count)
      }
    } catch (error: any) {
      console.error('Error fetching unread count:', error)
      // If it's an auth error or any error, clear the count
      setUnreadCount(0)
    }
  }

  const fetchNotifications = async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated || !user) {
      setNotifications([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const endpoint = type === 'notifications' 
        ? '/notifications?limit=10' 
        : '/messages?limit=10'
      
      const response = await apiClient.get<NotificationsResponse | MessagesResponse>(endpoint)
      if (response.success && response.data) {
        if (type === 'notifications') {
          setNotifications((response.data as NotificationsResponse).notifications)
        } else {
          // Transform messages to notification format
          const messages = (response.data as MessagesResponse).messages.map((msg: any) => ({
            id: msg.id,
            type: 'MESSAGE',
            title: `${msg.sender.firstName} ${msg.sender.lastName}`,
            message: msg.subject || msg.content.substring(0, 100) + '...',
            isRead: msg.isRead,
            priority: 'MEDIUM',
            actionUrl: `/messages/${msg.id}`,
            createdAt: msg.createdAt
          }))
          setNotifications(messages)
        }
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
      // If it's an auth error, clear notifications
      if (error.response?.status === 401) {
        setNotifications([])
      }
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const endpoint = type === 'notifications' 
        ? `/notifications/${notificationId}/read`
        : `/messages/${notificationId}/read`
      
      await apiClient.put(endpoint)
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
    
    setIsOpen(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return 'text-red-600'
      case 'MEDIUM':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTypeIcon = (notificationType: string) => {
    switch (notificationType) {
      case 'MESSAGE':
        return <MessengerIcon className="w-4 h-4" />
      case 'REVIEW_REQUEST':
      case 'REVIEW_COMPLETED':
        return <Bell className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: lang === 'fr' ? fr : enUS
    })
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {type === 'notifications' ? (
            <Bell className="w-5 h-5" />
          ) : (
            <MessengerIcon className="w-5 h-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>
            {type === 'notifications' 
              ? t("Notifications", "Notifications")
              : t("Messages", "Messages")
            }
          </span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} {t("non lu(s)", "unread")}
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-80">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-2">
                {type === 'notifications' ? (
                  <Bell className="w-8 h-8 mx-auto opacity-50" />
                ) : (
                  <MessengerIcon className="w-8 h-8 mx-auto opacity-50" />
                )}
              </div>
              <p className="text-sm">
                {type === 'notifications' 
                  ? t("Aucune notification", "No notifications")
                  : t("Aucun message", "No messages")
                }
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.isRead ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2 w-full">
                  <div className={`mt-1 ${getPriorityColor(notification.priority)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-medium truncate ${
                        !notification.isRead ? 'font-semibold' : ''
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-center text-sm text-primary cursor-pointer"
              onClick={() => {
                const url = type === 'notifications' ? '/notifications' : '/messages'
                window.location.href = url
                setIsOpen(false)
              }}
            >
              {type === 'notifications' 
                ? t("Voir toutes les notifications", "View all notifications")
                : t("Voir tous les messages", "View all messages")
              }
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Bell,
  BellOff,
  Mail,
  MessageSquare,
  Smartphone,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Trash2,
  MailOpen,
  Filter,
  Search
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface NotificationCenterProps {
  className?: string
}

interface Notification {
  id: string
  type: 'session_reminder' | 'session_cancelled' | 'session_updated' | 'new_participant' | 'system' | 'achievement'
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  actionUrl?: string
  actionLabel?: string
  metadata?: any
}

interface NotificationSettings {
  email: {
    sessionReminders: boolean
    sessionUpdates: boolean
    newParticipants: boolean
    systemUpdates: boolean
    achievements: boolean
  }
  push: {
    sessionReminders: boolean
    sessionUpdates: boolean
    newParticipants: boolean
    systemUpdates: boolean
    achievements: boolean
  }
  sms: {
    urgentOnly: boolean
    sessionReminders: boolean
  }
  reminderTimes: number[] // minutes before session
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

export default function NotificationCenter({
  className = ""
}: NotificationCenterProps) {
  const { lang } = useLang()
  const { user } = useAuth()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      sessionReminders: true,
      sessionUpdates: true,
      newParticipants: true,
      systemUpdates: false,
      achievements: true
    },
    push: {
      sessionReminders: true,
      sessionUpdates: true,
      newParticipants: false,
      systemUpdates: true,
      achievements: true
    },
    sms: {
      urgentOnly: true,
      sessionReminders: false
    },
    reminderTimes: [60, 15], // 1 hour and 15 minutes
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  })
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'session' | 'system'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(true)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load notifications
  useEffect(() => {
    loadNotifications()
    loadSettings()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      // TODO: Replace with real API call
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'session_reminder',
          title: t('Rappel de session', 'Session Reminder'),
          message: t('Votre session "Conversation B2" commence dans 15 minutes', 'Your "B2 Conversation" session starts in 15 minutes'),
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          read: false,
          priority: 'high',
          actionUrl: '/live/session-123',
          actionLabel: t('Rejoindre', 'Join')
        },
        {
          id: '2',
          type: 'new_participant',
          title: t('Nouveau participant', 'New Participant'),
          message: t('Marie Dubois a rejoint votre session "Préparation TCF"', 'Marie Dubois joined your "TCF Preparation" session'),
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: 'medium'
        },
        {
          id: '3',
          type: 'achievement',
          title: t('Nouveau badge débloqué!', 'New Badge Unlocked!'),
          message: t('Félicitations! Vous avez obtenu le badge "Mentor dévoué" pour avoir animé 10 sessions', 'Congratulations! You earned the "Dedicated Mentor" badge for hosting 10 sessions'),
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: false,
          priority: 'medium'
        },
        {
          id: '4',
          type: 'session_cancelled',
          title: t('Session annulée', 'Session Cancelled'),
          message: t('La session "Grammaire A2" du 15 janvier a été annulée par manque de participants', 'The "A2 Grammar" session on January 15 was cancelled due to low attendance'),
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: 'high'
        }
      ]
      
      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      // TODO: Load user notification settings from API
      console.log('Loading notification settings...')
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    )
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'session_reminder':
        return <Calendar className="h-4 w-4 text-blue-500" />
      case 'session_cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'session_updated':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'new_participant':
        return <Users className="h-4 w-4 text-green-500" />
      case 'achievement':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
      case 'high':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10'
      case 'medium':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
      default:
        return 'border-l-gray-300 bg-gray-50 dark:bg-gray-900/10'
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    // Apply filter
    if (filter === 'unread' && notif.read) return false
    if (filter === 'session' && !['session_reminder', 'session_cancelled', 'session_updated'].includes(notif.type)) return false
    if (filter === 'system' && !['system', 'achievement'].includes(notif.type)) return false
    
    // Apply search
    if (searchQuery && !notif.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notif.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
    
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    // TODO: Save to API
    console.log('Updating notification settings:', newSettings)
  }

  if (showSettings) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('Paramètres de notification', 'Notification Settings')}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
              {t('Retour', 'Back')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t('Notifications par email', 'Email Notifications')}
            </h3>
            <div className="space-y-3">
              {Object.entries(settings.email).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`email-${key}`} className="text-sm">
                    {key === 'sessionReminders' && t('Rappels de session', 'Session Reminders')}
                    {key === 'sessionUpdates' && t('Mises à jour de session', 'Session Updates')}
                    {key === 'newParticipants' && t('Nouveaux participants', 'New Participants')}
                    {key === 'systemUpdates' && t('Mises à jour système', 'System Updates')}
                    {key === 'achievements' && t('Réussites', 'Achievements')}
                  </Label>
                  <Switch
                    id={`email-${key}`}
                    checked={value}
                    onCheckedChange={(checked) => 
                      updateSettings({ 
                        email: { ...settings.email, [key]: checked } 
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Push Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              {t('Notifications push', 'Push Notifications')}
            </h3>
            <div className="space-y-3">
              {Object.entries(settings.push).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`push-${key}`} className="text-sm">
                    {key === 'sessionReminders' && t('Rappels de session', 'Session Reminders')}
                    {key === 'sessionUpdates' && t('Mises à jour de session', 'Session Updates')}
                    {key === 'newParticipants' && t('Nouveaux participants', 'New Participants')}
                    {key === 'systemUpdates' && t('Mises à jour système', 'System Updates')}
                    {key === 'achievements' && t('Réussites', 'Achievements')}
                  </Label>
                  <Switch
                    id={`push-${key}`}
                    checked={value}
                    onCheckedChange={(checked) => 
                      updateSettings({ 
                        push: { ...settings.push, [key]: checked } 
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Reminder Times */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('Horaires de rappel', 'Reminder Times')}
            </h3>
            <div className="space-y-2">
              <Label className="text-sm">
                {t('Recevoir des rappels avant les sessions:', 'Receive reminders before sessions:')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {[5, 15, 30, 60, 120].map(minutes => (
                  <Button
                    key={minutes}
                    variant={settings.reminderTimes.includes(minutes) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newTimes = settings.reminderTimes.includes(minutes)
                        ? settings.reminderTimes.filter(t => t !== minutes)
                        : [...settings.reminderTimes, minutes]
                      updateSettings({ reminderTimes: newTimes })
                    }}
                  >
                    {minutes < 60 ? `${minutes}min` : `${minutes / 60}h`}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BellOff className="h-4 w-4" />
              {t('Heures silencieuses', 'Quiet Hours')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="quiet-hours" className="text-sm">
                  {t('Activer les heures silencieuses', 'Enable quiet hours')}
                </Label>
                <Switch
                  id="quiet-hours"
                  checked={settings.quietHours.enabled}
                  onCheckedChange={(checked) => 
                    updateSettings({ 
                      quietHours: { ...settings.quietHours, enabled: checked } 
                    })
                  }
                />
              </div>
              {settings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">{t('Début', 'Start')}</Label>
                    <Input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={(e) => 
                        updateSettings({ 
                          quietHours: { ...settings.quietHours, start: e.target.value } 
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{t('Fin', 'End')}</Label>
                    <Input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={(e) => 
                        updateSettings({ 
                          quietHours: { ...settings.quietHours, end: e.target.value } 
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('Centre de notifications', 'Notification Center')}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCircle className="h-4 w-4 mr-1" />
              {t('Tout marquer lu', 'Mark all read')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Rechercher des notifications...', 'Search notifications...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('Toutes', 'All')}</SelectItem>
              <SelectItem value="unread">{t('Non lues', 'Unread')}</SelectItem>
              <SelectItem value="session">{t('Sessions', 'Sessions')}</SelectItem>
              <SelectItem value="system">{t('Système', 'System')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t('Aucune notification', 'No notifications')}</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-l-4 rounded-lg p-4 transition-colors ${getPriorityColor(notification.priority)} ${
                  !notification.read ? 'ring-1 ring-primary/20' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>
                        {notification.actionUrl && (
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                            {notification.actionLabel || t('Voir', 'View')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <MailOpen className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

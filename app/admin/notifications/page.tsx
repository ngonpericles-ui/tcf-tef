"use client"

import { useState } from "react"
import { Bell, Plus, Send, Users, AlertCircle, CheckCircle, Clock, Trash2, Eye, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  priority: "low" | "medium" | "high"
  target: "all" | "premium" | "managers" | "specific"
  status: "draft" | "sent" | "scheduled"
  recipients: number
  sentAt?: string
  scheduledFor?: string
  readCount?: number
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Nouvelle fonctionnalité TCF/TEF",
    message: "Découvrez nos nouvelles simulations TCF/TEF alimentées par l'IA GPT-5 pour une préparation optimale.",
    type: "info",
    priority: "high",
    target: "all",
    status: "sent",
    recipients: 2847,
    sentAt: "2024-01-15 14:30",
    readCount: 1923,
  },
  {
    id: "2",
    title: "Maintenance programmée",
    message:
      "Une maintenance est prévue le 20 janvier de 2h à 4h du matin. Les services seront temporairement indisponibles.",
    type: "warning",
    priority: "medium",
    target: "all",
    status: "scheduled",
    recipients: 2847,
    scheduledFor: "2024-01-18 20:00",
  },
  {
    id: "3",
    title: "Promotion Premium -20%",
    message: "Profitez de notre offre de rentrée avec 20% de réduction sur l'abonnement Premium jusqu'au 30 septembre.",
    type: "success",
    priority: "high",
    target: "premium",
    status: "sent",
    recipients: 892,
    sentAt: "2024-01-10 09:15",
    readCount: 634,
  },
  {
    id: "4",
    title: "Nouvelle session live disponible",
    message: "Rejoignez la session 'Préparation TCF intensif' animée par Aïcha Benali le 25 janvier à 19h.",
    type: "info",
    priority: "medium",
    target: "all",
    status: "draft",
    recipients: 0,
  },
]

export default function AdminNotificationsPage() {
  const { t } = useLanguage()
  const [notifications, setNotifications] = useState(mockNotifications)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filter, setFilter] = useState("all")
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info" as const,
    priority: "medium" as const,
    target: "all" as const,
    scheduledFor: "",
  })

  const handleCreateNotification = () => {
    const notification: Notification = {
      id: Date.now().toString(),
      ...newNotification,
      status: newNotification.scheduledFor ? "scheduled" : "draft",
      recipients: newNotification.target === "all" ? 2847 : newNotification.target === "premium" ? 892 : 156,
    }
    setNotifications([notification, ...notifications])
    setNewNotification({
      title: "",
      message: "",
      type: "info",
      priority: "medium",
      target: "all",
      scheduledFor: "",
    })
    setShowCreateForm(false)
  }

  const handleSendNotification = (id: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id
          ? {
              ...notif,
              status: "sent" as const,
              sentAt: new Date().toLocaleString("fr-FR"),
              readCount: 0,
            }
          : notif,
      ),
    )
  }

  const handleDeleteNotification = (id: string) => {
    setNotifications(notifications.filter((notif) => notif.id !== id))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="w-4 h-4" />
      case "success":
        return <CheckCircle className="w-4 h-4" />
      case "error":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-orange-600"
      case "success":
        return "bg-green-600"
      case "error":
        return "bg-red-600"
      default:
        return "bg-blue-600"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-600"
      case "medium":
        return "bg-orange-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-600"
      case "scheduled":
        return "bg-blue-600"
      default:
        return "bg-gray-600"
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true
    return notif.status === filter
  })

  return (
    <div className="min-h-screen p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("Notifications", "Notifications")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("Gérez et envoyez des notifications aux utilisateurs", "Manage and send notifications to users")}
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {t("Nouvelle notification", "New Notification")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">24</p>
                <p className="text-sm text-muted-foreground">{t("Envoyées", "Sent")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">3</p>
                <p className="text-sm text-muted-foreground">{t("Programmées", "Scheduled")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">78%</p>
                <p className="text-sm text-muted-foreground">{t("Taux de lecture", "Read Rate")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">2,847</p>
                <p className="text-sm text-muted-foreground">{t("Utilisateurs actifs", "Active Users")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Notification Form */}
      {showCreateForm && (
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              {t("Créer une notification", "Create Notification")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">{t("Titre", "Title")}</label>
                <Input
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  placeholder={t("Titre de la notification", "Notification title")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">{t("Type", "Type")}</label>
                <Select
                  value={newNotification.type}
                  onValueChange={(value: any) => setNewNotification({ ...newNotification, type: value })}
                >
                  <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                    <SelectItem value="info" className="text-foreground">
                      {t("Information", "Information")}
                    </SelectItem>
                    <SelectItem value="warning" className="text-foreground">
                      {t("Avertissement", "Warning")}
                    </SelectItem>
                    <SelectItem value="success" className="text-foreground">
                      {t("Succès", "Success")}
                    </SelectItem>
                    <SelectItem value="error" className="text-foreground">
                      {t("Erreur", "Error")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{t("Message", "Message")}</label>
              <Textarea
                value={newNotification.message}
                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                placeholder={t("Contenu de la notification", "Notification content")}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">{t("Priorité", "Priority")}</label>
                <Select
                  value={newNotification.priority}
                  onValueChange={(value: any) => setNewNotification({ ...newNotification, priority: value })}
                >
                  <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                    <SelectItem value="low" className="text-foreground">
                      {t("Faible", "Low")}
                    </SelectItem>
                    <SelectItem value="medium" className="text-foreground">
                      {t("Moyenne", "Medium")}
                    </SelectItem>
                    <SelectItem value="high" className="text-foreground">
                      {t("Élevée", "High")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">{t("Cible", "Target")}</label>
                <Select
                  value={newNotification.target}
                  onValueChange={(value: any) => setNewNotification({ ...newNotification, target: value })}
                >
                  <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                    <SelectItem value="all" className="text-foreground">
                      {t("Tous les utilisateurs", "All Users")}
                    </SelectItem>
                    <SelectItem value="premium" className="text-foreground">
                      {t("Utilisateurs Premium", "Premium Users")}
                    </SelectItem>
                    <SelectItem value="managers" className="text-foreground">
                      {t("Managers", "Managers")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t("Programmer (optionnel)", "Schedule (optional)")}
                </label>
                <Input
                  type="datetime-local"
                  value={newNotification.scheduledFor}
                  onChange={(e) => setNewNotification({ ...newNotification, scheduledFor: e.target.value })}
                  className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateForm(false)} className="border-gray-200 dark:border-gray-700 bg-transparent">
                {t("Annuler", "Cancel")}
              </Button>
              <Button onClick={handleCreateNotification} className="bg-blue-600 hover:bg-blue-700 text-white">
                {newNotification.scheduledFor ? t("Programmer", "Schedule") : t("Créer le brouillon", "Create Draft")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t("Filtrer par:", "Filter by:")}</span>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48 bg-input border-gray-200 dark:border-gray-700 text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
            <SelectItem value="all" className="text-foreground">
              {t("Toutes", "All")}
            </SelectItem>
            <SelectItem value="sent" className="text-foreground">
              {t("Envoyées", "Sent")}
            </SelectItem>
            <SelectItem value="scheduled" className="text-foreground">
              {t("Programmées", "Scheduled")}
            </SelectItem>
            <SelectItem value="draft" className="text-foreground">
              {t("Brouillons", "Drafts")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <Card key={notification.id} className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div
                    className={`w-10 h-10 ${getTypeColor(notification.type)} rounded-lg flex items-center justify-center`}
                  >
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-foreground font-medium">{notification.title}</h3>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getPriorityColor(notification.priority)} text-white`}
                      >
                        {notification.priority}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(notification.status)} text-white`}>
                        {notification.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">{notification.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>
                        {t("Cible:", "Target:")} {notification.target} ({notification.recipients}{" "}
                        {t("utilisateurs", "users")})
                      </span>
                      {notification.sentAt && (
                        <span>
                          {t("Envoyé le", "Sent on")} {notification.sentAt}
                        </span>
                      )}
                      {notification.scheduledFor && (
                        <span>
                          {t("Programmé pour", "Scheduled for")} {notification.scheduledFor}
                        </span>
                      )}
                      {notification.readCount !== undefined && (
                        <span>
                          {notification.readCount}/{notification.recipients} {t("lus", "read")} (
                          {Math.round((notification.readCount / notification.recipients) * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {notification.status === "draft" && (
                    <Button
                      size="sm"
                      onClick={() => handleSendNotification(notification.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      {t("Envoyer", "Send")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground font-medium mb-2">{t("Aucune notification", "No notifications")}</h3>
            <p className="text-muted-foreground text-sm">
              {t(
                "Aucune notification ne correspond aux filtres sélectionnés",
                "No notifications match the selected filters",
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

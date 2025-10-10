"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"
import apiClient from "@/lib/api-client"
import { User, Bell, Shield, Globe, Save, Crown, BookOpen, AlertCircle, CheckCircle, Info, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ManagerRole {
  role: "junior" | "content" | "senior"
  name: string
  email: string
  levelRestrictions: string[]
  subscriptionRestrictions: string[]
  permissions: {
    createCourses: boolean
    createTests: boolean
    hostLiveSessions: boolean
    moderateContent: boolean
    manageUsers: boolean
    viewAnalytics: boolean
    exportData: boolean
  }
}

export default function ManagerSettings() {
  const { t } = useLanguage()
  const { user, isAuthenticated, isManager, isAdmin } = useAuth()
  const [currentManager, setCurrentManager] = useState<ManagerRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profile, setProfile] = useState({
    name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Manager",
    email: user?.email || "",
    role: user?.role || "MANAGER",
    phone: "",
    bio: "",
    avatar: "/placeholder.svg?height=100&width=100",
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    studentMessages: true,
    courseUpdates: true,
    systemAlerts: true,
    weeklyReports: false,
    testApprovals: true,
    contentModeration: false,
    userManagement: false,
    analyticsReports: false,
    systemMaintenance: true,
    newFeatures: true,
  })

  const [preferences, setPreferences] = useState({
    language: "fr",
    timezone: "Europe/Paris",
    dateFormat: "DD/MM/YYYY",
    currency: "CFA",
    theme: "dark",
    density: "comfortable",
    sidebar: "expanded",
    animations: "enabled",
    defaultLevel: "A1",
    defaultSubscription: "Gratuit",
    autoSave: "5",
    uploadQuality: "high",
    autoPreview: true,
    validateBeforePublishing: true,
    aiSuggestions: true,
  })

  const [showSavedDialog, setShowSavedDialog] = useState(false)
  const [lastSavedSummary, setLastSavedSummary] = useState("")

  // Load manager settings from backend
  useEffect(() => {
    const loadManagerSettings = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check authentication first
        if (!isAuthenticated || (!isManager && !isAdmin)) {
          setError(t("Accès non autorisé", "Unauthorized access"))
          return
        }

        // Load manager profile
        const profileResponse = await apiClient.get('/manager/profile')
        if (profileResponse.success && profileResponse.data) {
          const profileData = profileResponse.data as any
          setProfile({
            name: profileData.name || `${user?.firstName} ${user?.lastName}`,
            email: profileData.email || user?.email || "",
            role: profileData.role || user?.role || "MANAGER",
            phone: profileData.phone || "",
            bio: profileData.bio || "",
            avatar: profileData.avatar || "/placeholder.svg?height=100&width=100"
          })
        }

        // Load manager settings
        const settingsResponse = await apiClient.get('/manager/settings')
        if (settingsResponse.success && settingsResponse.data) {
          const settingsData = settingsResponse.data as any

          if (settingsData.notifications) {
            setNotifications(prev => ({ ...prev, ...settingsData.notifications }))
          }

          if (settingsData.preferences) {
            setPreferences(prev => ({ ...prev, ...settingsData.preferences }))
          }
        }

        // Load manager role and permissions
        const roleResponse = await apiClient.get('/manager/role')
        if (roleResponse.success && roleResponse.data) {
          const roleData = roleResponse.data as any
          setCurrentManager(roleData)
        }

      } catch (error) {
        console.error('Error loading manager settings:', error)
        setError(t("Erreur lors du chargement des paramètres", "Error loading settings"))
      } finally {
        setLoading(false)
      }
    }

    loadManagerSettings()
  }, [isAuthenticated, isManager, isAdmin, user, t])

  // Save settings to backend
  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const settingsData = {
        profile,
        notifications,
        preferences
      }

      const response = await apiClient.put('/manager/settings', settingsData)
      if (response.success) {
        setSuccess(t("Paramètres sauvegardés avec succès", "Settings saved successfully"))
        setShowSavedDialog(true)
        setLastSavedSummary(t("Profil, notifications et préférences mis à jour", "Profile, notifications and preferences updated"))
        setTimeout(() => {
          setSuccess(null)
          setShowSavedDialog(false)
        }, 5000)
      } else {
        setError(t("Erreur lors de la sauvegarde", "Error saving settings"))
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setError(t("Erreur lors de la sauvegarde", "Error saving settings"))
    } finally {
      setSaving(false)
    }
  }

  // Mock data removed - now using backend integration

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "senior":
        return {
          label: t("Senior Manager", "Senior Manager"),
          icon: Crown,
          color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          description: t("Accès complet à toutes les fonctionnalités", "Full access to all features"),
        }
      case "content":
        return {
          label: t("Content Manager", "Content Manager"),
          icon: BookOpen,
          color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          description: t("Gestion avancée du contenu et modération", "Advanced content management and moderation"),
        }
      case "junior":
        return {
          label: t("Junior Manager", "Junior Manager"),
          icon: User,
          color: "bg-green-500/10 text-green-400 border-green-500/20",
          description: t("Création de contenu de base", "Basic content creation"),
        }
      default:
        return {
          label: t("Manager", "Manager"),
          icon: User,
          color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
          description: "",
        }
    }
  }

  if (!currentManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  const roleInfo = getRoleInfo(currentManager.role)
  const RoleIcon = roleInfo.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("Paramètres", "Settings")}</h1>
          <p className="text-muted-foreground">
            {t("Gérez vos préférences et paramètres de compte", "Manage your account preferences and settings")}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className={cn("text-sm", roleInfo.color)}>
            <RoleIcon className="w-4 h-4 mr-2" />
            {roleInfo.label}
          </Badge>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("Sauvegarde...", "Saving...")}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t("Sauvegarder", "Save Changes")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-green-800 font-medium">{success}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">{t("Chargement des paramètres...", "Loading settings...")}</span>
        </div>
      ) : (
        <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card border border-gray-200 dark:border-gray-700">
          <TabsTrigger value="profile" className="data-[state=active]:bg-muted text-foreground">
            <User className="w-4 h-4 mr-2" />
            {t("Profil", "Profile")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-muted text-foreground">
            <Bell className="w-4 h-4 mr-2" />
            {t("Notifications", "Notifications")}
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-muted text-foreground">
            <Shield className="w-4 h-4 mr-2" />
            {t("Sécurité", "Security")}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-muted text-foreground">
            <Globe className="w-4 h-4 mr-2" />
            {t("Préférences", "Preferences")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-6">
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <RoleIcon className="w-5 h-5 mr-2" />
                  {t("Informations du rôle", "Role Information")}
                </CardTitle>
                <CardDescription className="text-muted-foreground">{roleInfo.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-foreground text-sm">{t("Niveaux autorisés", "Allowed Levels")}</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {currentManager.levelRestrictions.map((level) => (
                        <Badge
                          key={level}
                          variant="outline"
                          className="text-xs bg-green-500/10 text-green-400 border-green-500/20"
                        >
                          {level}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-foreground text-sm">
                      {t("Abonnements autorisés", "Allowed Subscriptions")}
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {currentManager.subscriptionRestrictions.map((sub) => (
                        <Badge
                          key={sub}
                          variant="outline"
                          className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20"
                        >
                          {sub}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-foreground text-sm">{t("Permissions", "Permissions")}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {Object.entries(currentManager.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        {value ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className={cn("text-xs", value ? "text-green-400" : "text-muted-foreground")}>
                          {key === "createCourses"
                            ? t("Créer cours", "Create courses")
                            : key === "createTests"
                              ? t("Créer tests", "Create tests")
                              : key === "hostLiveSessions"
                                ? t("Sessions live", "Live sessions")
                                : key === "moderateContent"
                                  ? t("Modération", "Moderation")
                                  : key === "manageUsers"
                                    ? t("Gestion utilisateurs", "User management")
                                    : key === "viewAnalytics"
                                      ? t("Analytics", "Analytics")
                                      : key === "exportData"
                                        ? t("Export données", "Export data")
                                        : key}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Informations du profil", "Profile Information")}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("Mettez à jour vos informations personnelles", "Update your personal information")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <img
                    src={profile.avatar || "/placeholder.svg"}
                    alt={profile.name}
                    className="w-20 h-20 rounded-full"
                  />
                  <div>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      {t("Changer la photo", "Change Photo")}
                    </Button>
                    <p className="text-muted-foreground text-sm mt-1">
                      {t("JPG, PNG ou GIF. Max 2MB.", "JPG, PNG or GIF. Max 2MB.")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">
                      {t("Nom complet", "Full Name")}
                    </Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      {t("Email", "Email")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-foreground">
                      {t("Rôle", "Role")}
                    </Label>
                    <Input
                      id="role"
                      value={profile.role}
                      disabled
                      className="bg-input border-gray-200 dark:border-gray-700 text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">
                      {t("Téléphone", "Phone")}
                    </Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-foreground">
                    {t("Biographie", "Bio")}
                  </Label>
                  <textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-md text-foreground resize-none"
                    placeholder={t("Parlez-nous de vous...", "Tell us about yourself...")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-foreground">
                {t("Préférences de notification", "Notification Preferences")}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("Choisissez comment vous souhaitez être notifié", "Choose how you want to be notified")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-foreground font-medium mb-4 flex items-center">
                    <Bell className="w-4 h-4 mr-2" />
                    {t("Notifications générales", "General Notifications")}
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">{t("Notifications par email", "Email Notifications")}</Label>
                        <p className="text-muted-foreground text-sm">
                          {t("Recevez des notifications par email", "Receive notifications via email")}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, emailNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">{t("Notifications push", "Push Notifications")}</Label>
                        <p className="text-muted-foreground text-sm">
                          {t("Recevez des notifications push", "Receive push notifications")}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, pushNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">{t("Messages d'étudiants", "Student Messages")}</Label>
                        <p className="text-muted-foreground text-sm">
                          {t("Notifications pour les nouveaux messages", "Notifications for new messages")}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.studentMessages}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, studentMessages: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">{t("Mises à jour de cours", "Course Updates")}</Label>
                        <p className="text-muted-foreground text-sm">
                          {t("Notifications pour les mises à jour de cours", "Notifications for course updates")}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.courseUpdates}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, courseUpdates: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">{t("Alertes système", "System Alerts")}</Label>
                        <p className="text-muted-foreground text-sm">
                          {t("Notifications importantes du système", "Important system notifications")}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.systemAlerts}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, systemAlerts: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">{t("Rapports hebdomadaires", "Weekly Reports")}</Label>
                        <p className="text-muted-foreground text-sm">
                          {t("Recevez un résumé hebdomadaire", "Receive weekly summary reports")}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.weeklyReports}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-foreground font-medium mb-4 flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    {t("Notifications spécialisées", "Specialized Notifications")}
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">{t("Approbations de tests", "Test Approvals")}</Label>
                        <p className="text-muted-foreground text-sm">
                          {t(
                            "Notifications quand vos tests sont approuvés",
                            "Notifications when your tests are approved",
                          )}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.testApprovals}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, testApprovals: checked })}
                      />
                    </div>

                    {currentManager.permissions.moderateContent && (
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-foreground">{t("Modération de contenu", "Content Moderation")}</Label>
                          <p className="text-muted-foreground text-sm">
                            {t("Notifications pour la modération de contenu", "Notifications for content moderation")}
                          </p>
                        </div>
                        <Switch
                          checked={notifications.contentModeration}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, contentModeration: checked })
                          }
                        />
                      </div>
                    )}

                    {currentManager.permissions.manageUsers && (
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-foreground">{t("Gestion des utilisateurs", "User Management")}</Label>
                          <p className="text-muted-foreground text-sm">
                            {t("Notifications pour la gestion des utilisateurs", "Notifications for user management")}
                          </p>
                        </div>
                        <Switch
                          checked={notifications.userManagement}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, userManagement: checked })}
                        />
                      </div>
                    )}

                    {currentManager.permissions.viewAnalytics && (
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-foreground">{t("Rapports d'analytics", "Analytics Reports")}</Label>
                          <p className="text-muted-foreground text-sm">
                            {t("Notifications pour les rapports d'analytics", "Notifications for analytics reports")}
                          </p>
                        </div>
                        <Switch
                          checked={notifications.analyticsReports}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, analyticsReports: checked })
                          }
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">{t("Maintenance système", "System Maintenance")}</Label>
                        <p className="text-muted-foreground text-sm">
                          {t("Notifications de maintenance programmée", "Scheduled maintenance notifications")}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.systemMaintenance}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, systemMaintenance: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">{t("Nouvelles fonctionnalités", "New Features")}</Label>
                        <p className="text-muted-foreground text-sm">
                          {t("Notifications sur les nouvelles fonctionnalités", "Notifications about new features")}
                        </p>
                      </div>
                      <Switch
                        checked={notifications.newFeatures}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, newFeatures: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Changer le mot de passe", "Change Password")}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("Mettez à jour votre mot de passe régulièrement", "Update your password regularly for security")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-foreground">
                    {t("Mot de passe actuel", "Current Password")}
                  </Label>
                  <Input id="current-password" type="password" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-foreground">
                    {t("Nouveau mot de passe", "New Password")}
                  </Label>
                  <Input id="new-password" type="password" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-foreground">
                    {t("Confirmer le mot de passe", "Confirm Password")}
                  </Label>
                  <Input id="confirm-password" type="password" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  {t("Mettre à jour le mot de passe", "Update Password")}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground">
                  {t("Authentification à deux facteurs", "Two-Factor Authentication")}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("Ajoutez une couche de sécurité supplémentaire", "Add an extra layer of security to your account")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground">
                      {t("Authentification à deux facteurs", "Two-Factor Authentication")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("Actuellement désactivée", "Currently disabled")}
                    </p>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">{t("Activer", "Enable")}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="space-y-6">
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Préférences générales", "General Preferences")}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("Personnalisez votre expérience", "Customize your experience")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-foreground">
                      {t("Langue", "Language")}
                    </Label>
                    <select
                      id="language"
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-md text-foreground"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-foreground">
                      {t("Fuseau horaire", "Timezone")}
                    </Label>
                    <select
                      id="timezone"
                      value={preferences.timezone}
                      onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-md text-foreground"
                    >
                      <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                      <option value="Africa/Abidjan">Africa/Abidjan (UTC+0)</option>
                      <option value="Africa/Dakar">Africa/Dakar (UTC+0)</option>
                      <option value="Africa/Casablanca">Africa/Casablanca (UTC+1)</option>
                      <option value="Africa/Tunis">Africa/Tunis (UTC+1)</option>
                      <option value="Africa/Algiers">Africa/Algiers (UTC+1)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat" className="text-foreground">
                      {t("Format de date", "Date Format")}
                    </Label>
                    <select
                      id="dateFormat"
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-md text-foreground"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                      <option value="DD-MM-YYYY">DD-MM-YYYY (31-12-2024)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-foreground">
                      {t("Devise", "Currency")}
                    </Label>
                    <select
                      id="currency"
                      value={preferences.currency}
                      onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-md text-foreground"
                    >
                      <option value="CFA">CFA Franc (XOF)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="MAD">Moroccan Dirham (MAD)</option>
                      <option value="TND">Tunisian Dinar (TND)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground">
                  {t("Préférences d'interface", "Interface Preferences")}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("Personnalisez l'apparence de votre interface", "Customize your interface appearance")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme" className="text-foreground">
                      {t("Thème", "Theme")}
                    </Label>
                    <select
                      id="theme"
                      className="w-full px-3 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-md text-foreground"
                      defaultValue="dark"
                    >
                      <option value="dark">{t("Sombre", "Dark")}</option>
                      <option value="system">{t("Système", "System")}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="density" className="text-foreground">
                      {t("Densité d'affichage", "Display Density")}
                    </Label>
                    <select
                      id="density"
                      className="w-full px-3 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-md text-foreground"
                      defaultValue="comfortable"
                    >
                      <option value="compact">{t("Compact", "Compact")}</option>
                      <option value="comfortable">{t("Confortable", "Comfortable")}</option>
                      <option value="spacious">{t("Spacieux", "Spacious")}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sidebar" className="text-foreground">
                      {t("Barre latérale", "Sidebar")}
                    </Label>
                    <select
                      id="sidebar"
                      className="w-full px-3 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-md text-foreground"
                      defaultValue="expanded"
                    >
                      <option value="expanded">{t("Étendue", "Expanded")}</option>
                      <option value="collapsed">{t("Réduite", "Collapsed")}</option>
                      <option value="auto">{t("Automatique", "Auto")}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="animations" className="text-foreground">
                      {t("Animations", "Animations")}
                    </Label>
                    <select
                      id="animations"
                      className="w-full px-3 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-md text-foreground"
                      defaultValue="enabled"
                    >
                      <option value="enabled">{t("Activées", "Enabled")}</option>
                      <option value="reduced">{t("Réduites", "Reduced")}</option>
                      <option value="disabled">{t("Désactivées", "Disabled")}</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Préférences de contenu", "Content Preferences")}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t(
                    "Configurez vos préférences de création de contenu",
                    "Configure your content creation preferences",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultLevel" className="text-foreground">
                      {t("Niveau par défaut", "Default Level")}
                    </Label>
                    <select
                      id="defaultLevel"
                      className="w-full px-3 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-md text-foreground"
                      defaultValue="A1"
                    >
                      {currentManager.levelRestrictions.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultSubscription" className="text-foreground">
                      {t("Abonnement par défaut", "Default Subscription")}
                    </Label>
                    <select
                      id="defaultSubscription"
                      className="w-full px-3 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-md text-foreground"
                      defaultValue="Gratuit"
                    >
                      {currentManager.subscriptionRestrictions.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="autoSave" className="text-foreground">
                      {t("Sauvegarde automatique", "Auto Save")}
                    </Label>
                    <select
                      id="autoSave"
                      className="w-full px-3 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-md text-foreground"
                      defaultValue="5"
                    >
                      <option value="1">{t("Chaque minute", "Every minute")}</option>
                      <option value="5">{t("Toutes les 5 minutes", "Every 5 minutes")}</option>
                      <option value="10">{t("Toutes les 10 minutes", "Every 10 minutes")}</option>
                      <option value="0">{t("Désactivée", "Disabled")}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uploadQuality" className="text-foreground">
                      {t("Qualité d'upload", "Upload Quality")}
                    </Label>
                    <select
                      id="uploadQuality"
                      className="w-full px-3 py-2 bg-input border border-gray-200 dark:border-gray-700 rounded-md text-foreground"
                      defaultValue="high"
                    >
                      <option value="original">{t("Originale", "Original")}</option>
                      <option value="high">{t("Haute", "High")}</option>
                      <option value="medium">{t("Moyenne", "Medium")}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">{t("Prévisualisation automatique", "Auto Preview")}</Label>
                      <p className="text-muted-foreground text-sm">
                        {t("Générer automatiquement les prévisualisations", "Automatically generate previews")}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">
                        {t("Validation avant publication", "Validate Before Publishing")}
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        {t("Vérifier le contenu avant publication", "Check content before publishing")}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">{t("Suggestions IA", "AI Suggestions")}</Label>
                      <p className="text-muted-foreground text-sm">
                        {t("Recevoir des suggestions d'amélioration", "Receive improvement suggestions")}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      )}

      {/* Saved dialog */}
      <Dialog open={showSavedDialog} onOpenChange={setShowSavedDialog}>
        <DialogContent className="bg-card border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("Modifications enregistrées", "Changes Saved")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("Profil mis à jour", "Profile updated")}
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-foreground">{lastSavedSummary}</div>
          <div className="flex justify-end">
            <Button onClick={() => setShowSavedDialog(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

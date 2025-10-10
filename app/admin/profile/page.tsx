"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Settings,
  Bell,
  Lock,
  Globe,
  Camera,
  Save,
  Eye,
  EyeOff,
  Activity,
  Users,
  BookOpen,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminProfilePage() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const { user } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    avatar: ''
  })

  const [adminData, setAdminData] = useState<any>(null)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      const response = await apiClient.get('/users/profile')
      if ((response.data as any)?.success) {
        const userData = (response.data as any).data.user
        setAdminData(userData)
        setProfileData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
          location: userData.city || '',
          avatar: userData.profileImage || ''
        })
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setLoading(true)
      const response = await apiClient.put('/users/profile', profileData)
      if ((response.data as any)?.success) {
        toast.success(t("Profil mis à jour avec succès", "Profile updated successfully"))
        fetchAdminData() // Refresh data
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(t("Erreur lors de la mise à jour", "Error updating profile"))
    } finally {
      setLoading(false)
    }
  }

  // Admin stats data
  const adminStats = {
      totalUsers: 12847,
      activeManagers: 23,
      contentCreated: 156,
      monthlyGrowth: 18.5,
  }

  return (
    <div className={cn("min-h-screen p-6", theme === "dark" ? "bg-gray-950" : "bg-gray-50")}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={cn("text-3xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
              {t("Mon Profil", "My Profile")}
            </h1>
            <p className={cn("text-sm mt-1", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
              {t(
                "Gérez vos informations personnelles et préférences",
                "Manage your personal information and preferences",
              )}
            </p>
          </div>
          <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            {adminData?.role || 'ADMIN'}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={cn(theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200")}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
                    {adminStats.totalUsers.toLocaleString()}
                  </p>
                  <p className={cn("text-xs", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                    {t("Utilisateurs totaux", "Total Users")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200")}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
                    {adminStats.activeManagers}
                  </p>
                  <p className={cn("text-xs", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                    {t("Managers actifs", "Active Managers")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200")}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
                    {adminStats.contentCreated}
                  </p>
                  <p className={cn("text-xs", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                    {t("Contenus créés", "Content Created")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200")}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
                    +{adminStats.monthlyGrowth}%
                  </p>
                  <p className={cn("text-xs", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                    {t("Croissance mensuelle", "Monthly Growth")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={cn("grid w-full grid-cols-4", theme === "dark" ? "bg-gray-900" : "bg-gray-100")}>
            <TabsTrigger value="profile">{t("Profil", "Profile")}</TabsTrigger>
            <TabsTrigger value="security">{t("Sécurité", "Security")}</TabsTrigger>
            <TabsTrigger value="preferences">{t("Préférences", "Preferences")}</TabsTrigger>
            <TabsTrigger value="activity">{t("Activité", "Activity")}</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className={cn(theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200")}>
              <CardHeader>
                <CardTitle className={cn(theme === "dark" ? "text-white" : "text-gray-900")}>
                  {t("Informations personnelles", "Personal Information")}
                </CardTitle>
                <CardDescription>
                  {t("Mettez à jour vos informations de profil", "Update your profile information")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <img
                      src={profileData.avatar || "/placeholder.svg"}
                      alt="Admin Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                    />
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <h3 className={cn("text-xl font-semibold", theme === "dark" ? "text-white" : "text-gray-900")}>
                      {`${profileData.firstName} ${profileData.lastName}`.trim() || user?.email?.split('@')[0] || 'Admin'}
                    </h3>
                    <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                      {t("Administrateur depuis", "Administrator since")}{" "}
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{t("Nom complet", "Full Name")}</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder={t("Prénom", "First Name")}
                      className={cn(theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{t("Email", "Email")}</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className={cn(theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{t("Téléphone", "Phone")}</span>
                    </Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className={cn(theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{t("Localisation", "Location")}</span>
                    </Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                      className={cn(theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t("Biographie", "Biography")}</Label>
                  <Textarea
                    id="bio"
                    placeholder={t("Parlez-nous de vous...", "Tell us about yourself...")}
                    className={cn(
                      "min-h-[100px]",
                      theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300",
                    )}
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? t("Sauvegarde...", "Saving...") : t("Sauvegarder les modifications", "Save Changes")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className={cn(theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200")}>
              <CardHeader>
                <CardTitle className={cn(theme === "dark" ? "text-white" : "text-gray-900")}>
                  {t("Sécurité du compte", "Account Security")}
                </CardTitle>
                <CardDescription>
                  {t("Gérez vos paramètres de sécurité", "Manage your security settings")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">{t("Mot de passe actuel", "Current Password")}</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPassword ? "text" : "password"}
                        className={cn(theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">{t("Nouveau mot de passe", "New Password")}</Label>
                    <Input
                      id="new-password"
                      type="password"
                      className={cn(theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{t("Confirmer le mot de passe", "Confirm Password")}</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      className={cn(theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300")}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className={cn("font-medium", theme === "dark" ? "text-white" : "text-gray-900")}>
                    {t("Authentification à deux facteurs", "Two-Factor Authentication")}
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={cn("text-sm", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                        {t("Activez l'authentification à deux facteurs", "Enable two-factor authentication")}
                      </p>
                      <p className={cn("text-xs", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                        {t(
                          "Sécurisez votre compte avec une couche supplémentaire",
                          "Secure your account with an extra layer",
                        )}
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Lock className="w-4 h-4 mr-2" />
                  {t("Mettre à jour la sécurité", "Update Security")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card className={cn(theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200")}>
              <CardHeader>
                <CardTitle className={cn(theme === "dark" ? "text-white" : "text-gray-900")}>
                  {t("Préférences", "Preferences")}
                </CardTitle>
                <CardDescription>
                  {t("Personnalisez votre expérience d'administration", "Customize your admin experience")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className={cn("font-medium", theme === "dark" ? "text-white" : "text-gray-900")}>
                          {t("Notifications par email", "Email Notifications")}
                        </p>
                        <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                          {t("Recevez des notifications importantes", "Receive important notifications")}
                        </p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-5 h-5 text-green-600" />
                      <div>
                        <p className={cn("font-medium", theme === "dark" ? "text-white" : "text-gray-900")}>
                          {t("Rapports d'activité", "Activity Reports")}
                        </p>
                        <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                          {t("Rapports hebdomadaires d'activité", "Weekly activity reports")}
                        </p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className={cn("font-medium", theme === "dark" ? "text-white" : "text-gray-900")}>
                          {t("Notifications multilingues", "Multilingual Notifications")}
                        </p>
                        <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                          {t("Notifications en français et anglais", "Notifications in French and English")}
                        </p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  {t("Sauvegarder les préférences", "Save Preferences")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className={cn(theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200")}>
              <CardHeader>
                <CardTitle className={cn(theme === "dark" ? "text-white" : "text-gray-900")}>
                  {t("Activité récente", "Recent Activity")}
                </CardTitle>
                <CardDescription>
                  {t("Votre activité d'administration récente", "Your recent admin activity")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "Création d'un nouveau cours A2", time: "Il y a 2 heures", type: "create" },
                    { action: "Approbation de 3 managers", time: "Il y a 4 heures", type: "approve" },
                    { action: "Mise à jour des paramètres de sécurité", time: "Il y a 1 jour", type: "update" },
                    { action: "Suppression d'un utilisateur inactif", time: "Il y a 2 jours", type: "delete" },
                    { action: "Création d'une session live", time: "Il y a 3 jours", type: "create" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          activity.type === "create"
                            ? "bg-green-500"
                            : activity.type === "approve"
                              ? "bg-blue-500"
                              : activity.type === "update"
                                ? "bg-orange-500"
                                : "bg-red-500",
                        )}
                      />
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium", theme === "dark" ? "text-white" : "text-gray-900")}>
                          {activity.action}
                        </p>
                        <p className={cn("text-xs", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

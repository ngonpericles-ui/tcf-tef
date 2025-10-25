"use client"

import { useState, useEffect } from "react"
import {
  Settings,
  Shield,
  Bell,
  Database,
  Server,
  Users,
  CreditCard,
  FileText,
  Save,
  RefreshCw,
  History,
  AlertCircle,
  CheckCircle,
  Loader2,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import Link from "next/link"

interface AdminSettings {
  general: {
    siteName: string
    siteDescription: string
    maintenanceMode: boolean
    registrationEnabled: boolean
    defaultLanguage: string
    timezone: string
  }
  users: {
    maxStudentsPerManager: number
    autoApproveRegistrations: boolean
    sessionTimeout: number
    passwordPolicy: {
      minLength: number
      requireSpecialChars: boolean
      requireNumbers: boolean
    }
  }
  content: {
    maxFileSize: number
    allowedFileTypes: string[]
    autoModeration: boolean
    contentApprovalRequired: boolean
  }
  billing: {
    currency: string
    taxRate: number
    stripePublicKey: string
    paymentMethods: string[]
  }
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
    pushEnabled: boolean
    adminNotifications: boolean
  }
  security: {
    twoFactorRequired: boolean
    sessionTimeout: number
    ipWhitelist: string[]
    auditLogging: boolean
  }
  system: {
    backupFrequency: string
    logLevel: string
    cacheEnabled: boolean
    cdnEnabled: boolean
  }
}

export default function AdminSettingsPage() {
  const { t } = useLanguage()
  const { user, isAuthenticated, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState("general")
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [settings, setSettings] = useState<AdminSettings>({
    general: {
      siteName: "TCF-TEF Learning Platform",
      siteDescription: "Plateforme d'apprentissage du français",
      maintenanceMode: false,
      registrationEnabled: true,
      defaultLanguage: "fr",
      timezone: "Europe/Paris"
    },
    users: {
      maxStudentsPerManager: 100,
      autoApproveRegistrations: false,
      sessionTimeout: 60,
      passwordPolicy: {
        minLength: 8,
        requireSpecialChars: true,
        requireNumbers: true
      }
    },
    content: {
      maxFileSize: 50,
      allowedFileTypes: ["pdf", "doc", "docx", "mp3", "mp4", "jpg", "png"],
      autoModeration: true,
      contentApprovalRequired: false
    },
    billing: {
      currency: "EUR",
      taxRate: 20,
      stripePublicKey: "",
      paymentMethods: ["card", "sepa"]
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      adminNotifications: true
    },
    security: {
      twoFactorRequired: false,
      sessionTimeout: 15,
      ipWhitelist: [],
      auditLogging: true
    },
    system: {
      backupFrequency: "daily",
      logLevel: "info",
      cacheEnabled: true,
      cdnEnabled: true
    }
  })

  // Load settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check authentication first
        if (!isAuthenticated || !isAdmin) {
          setError(t("Accès non autorisé", "Unauthorized access"))
          return
        }

        const response = await apiClient.get('/admin/settings')
        if (response.success && response.data) {
          const settingsData = response.data as any
          setSettings(prev => ({ ...prev, ...settingsData }))
        } else {
          setError(t("Erreur lors du chargement des paramètres", "Error loading settings"))
        }
      } catch (error) {
        console.error('Error loading admin settings:', error)
        setError(t("Erreur lors du chargement des paramètres", "Error loading settings"))
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [isAuthenticated, isAdmin, t])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)

      const response = await apiClient.put('/admin/settings', settings)
      if (response.success) {
        setSuccess(t("Paramètres sauvegardés avec succès", "Settings saved successfully"))
        setTimeout(() => setSuccess(null), 5000)
      } else {
        setError(t("Erreur lors de la sauvegarde", "Error saving settings"))
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setError(t("Erreur lors de la sauvegarde", "Error saving settings"))
    } finally {
      setIsSaving(false)
    }
  }

  const updateSettings = (section: keyof AdminSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  const tabs = [
    { id: "general", label: t("Général", "General"), icon: Settings },
    { id: "users", label: t("Utilisateurs", "Users"), icon: Users },
    { id: "content", label: t("Contenu", "Content"), icon: FileText },
    { id: "billing", label: t("Facturation", "Billing"), icon: CreditCard },
    { id: "notifications", label: t("Notifications", "Notifications"), icon: Bell },
    { id: "security", label: t("Sécurité", "Security"), icon: Shield },
    { id: "system", label: t("Système", "System"), icon: Server },
    { id: "history", label: t("Historique", "History"), icon: History },
  ]

  return (
    <div className="p-6 space-y-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("Paramètres d'administration", "Administration Settings")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Configurez les paramètres de la plateforme", "Configure platform settings")}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-600 text-white"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    {t("Paramètres généraux", "General Settings")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("Nom de la plateforme", "Platform Name")}
                      </label>
                      <Input
                        defaultValue="AURA.CA"
                        className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("Langue par défaut", "Default Language")}
                      </label>
                      <Select defaultValue="fr">
                        <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      {t("Description de la plateforme", "Platform Description")}
                    </label>
                    <Textarea
                      defaultValue="Plateforme d'apprentissage du français avec préparation aux examens TCF et TEF"
                      className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* User Management Settings */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    {t("Gestion des utilisateurs", "User Management")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-foreground font-medium">
                        {t("Inscription automatique", "Auto Registration")}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "Permettre aux utilisateurs de s'inscrire automatiquement",
                          "Allow users to register automatically",
                        )}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-foreground font-medium">{t("Vérification email", "Email Verification")}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t("Exiger la vérification de l'email", "Require email verification")}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("Limite d'utilisateurs", "User Limit")}
                      </label>
                      <Input type="number" defaultValue="10000" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("Période d'essai (jours)", "Trial Period (days)")}
                      </label>
                      <Input type="number" defaultValue="1" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Content Management Settings */}
          {activeTab === "content" && (
            <div className="space-y-6">
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    {t("Gestion du contenu", "Content Management")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-foreground font-medium">{t("Modération automatique", "Auto Moderation")}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t("Modération automatique du contenu utilisateur", "Automatic user content moderation")}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("Taille max fichier (MB)", "Max File Size (MB)")}
                      </label>
                      <Input type="text" defaultValue="Illimité" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("Formats autorisés", "Allowed Formats")}
                      </label>
                      <Input
                        defaultValue="jpg, png, pdf, mp3, mp4"
                        className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Billing Settings */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    {t("Paramètres de facturation", "Billing Settings")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("Devise", "Currency")}
                      </label>
                      <Select defaultValue="cfa">
                        <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cfa">CFA (XOF)</SelectItem>
                          <SelectItem value="eur">Euro (EUR)</SelectItem>
                          <SelectItem value="usd">Dollar (USD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("Taxe (%)", "Tax Rate (%)")}
                      </label>
                      <Input type="number" defaultValue="18" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-foreground font-medium">
                      {t("Prix des abonnements (CFA)", "Subscription Prices (CFA)")}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Essentiel</label>
                        <Input defaultValue="4500" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Premium</label>
                        <Input defaultValue="8500" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Pro+</label>
                        <Input defaultValue="14500" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">AURA.CA</label>
                        <Input defaultValue="25000" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    {t("Paramètres de notification", "Notification Settings")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-foreground font-medium">{t("Notifications email", "Email Notifications")}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t("Envoyer des notifications par email", "Send email notifications")}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-foreground font-medium">{t("Notifications push", "Push Notifications")}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t("Notifications push dans le navigateur", "Browser push notifications")}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("Email expéditeur", "Sender Email")}
                      </label>
                      <Input
                        type="email"
                        defaultValue="noreply@tcf-tef.com"
                        className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("Nom expéditeur", "Sender Name")}
                      </label>
                      <Input defaultValue="TCF-TEF Platform" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    {t("Paramètres de sécurité", "Security Settings")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-foreground font-medium">
                        {t("Authentification à deux facteurs", "Two-Factor Authentication")}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {t("Exiger 2FA pour les administrateurs", "Require 2FA for administrators")}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("Durée de session (heures)", "Session Duration (hours)")}
                      </label>
                      <Input type="number" defaultValue="8" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("Tentatives de connexion max", "Max Login Attempts")}
                      </label>
                      <Input type="number" defaultValue="5" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System Settings */}
          {activeTab === "system" && (
            <div className="space-y-6">
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Server className="w-5 h-5 mr-2" />
                    {t("Paramètres système", "System Settings")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-foreground font-medium">{t("Mode maintenance", "Maintenance Mode")}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t("Activer le mode maintenance", "Enable maintenance mode")}
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("Version de l'API", "API Version")}
                      </label>
                      <Input defaultValue="v2.1.0" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" readOnly />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("Dernière sauvegarde", "Last Backup")}
                      </label>
                      <Input
                        defaultValue="2024-01-15 14:30:00"
                        className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Button
                      variant="outline"
                      className="border-gray-200 dark:border-gray-700 text-muted-foreground hover:bg-muted hover:text-foreground bg-transparent"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      {t("Sauvegarder", "Backup Now")}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-200 dark:border-gray-700 text-muted-foreground hover:bg-muted hover:text-foreground bg-transparent"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t("Redémarrer", "Restart System")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* History Settings */}
          {activeTab === "history" && (
            <div className="space-y-6">
              <Card className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <History className="w-5 h-5 mr-2" />
                    {t("Historique du contenu", "Content History")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-foreground font-medium">
                        {t("Gestion de l'historique", "History Management")}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {t("Visualisez et gérez tout le contenu téléchargé", "View and manage all uploaded content")}
                      </p>
                    </div>
                    <Link href="/admin/settings/history">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <History className="w-4 h-4 mr-2" />
                        {t("Voir l'historique", "View History")}
                      </Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 rounded-lg bg-card">
                      <h5 className="text-foreground font-medium">{t("Fichiers totaux", "Total Files")}</h5>
                      <p className="text-2xl font-bold text-blue-400 mt-1">1,247</p>
                    </div>
                    <div className="p-4 rounded-lg bg-card">
                      <h5 className="text-foreground font-medium">{t("Taille totale", "Total Size")}</h5>
                      <p className="text-2xl font-bold text-green-400 mt-1">15.6 GB</p>
                    </div>
                    <div className="p-4 rounded-lg bg-card">
                      <h5 className="text-foreground font-medium">{t("Ce mois", "This Month")}</h5>
                      <p className="text-2xl font-bold text-purple-400 mt-1">89</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  )
}

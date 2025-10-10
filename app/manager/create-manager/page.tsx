"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import { Plus, ArrowLeft, Crown, BookOpen, User, Shield, Eye, EyeOff, RefreshCw, CheckCircle, Copy, History, AlertCircle, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface Manager {
  id: number
  name: string
  email: string
  password?: string
  phone?: string
  status: "active" | "pending" | "suspended"
  role: "junior" | "content" | "senior"
  joinDate: string
  lastActive: string
  coursesCreated: number
  testsCreated: number
  liveSessionsHosted: number
  studentsManaged: number
  averageRating: number
  totalRevenue: number
  followers: number
  specialties: string[]
  avatar: string
  permissions: {
    createCourses: boolean
    createTests: boolean
    hostLiveSessions: boolean
    moderateContent: boolean
    manageUsers: boolean
    viewAnalytics: boolean
    exportData: boolean
    manageBilling: boolean
  }
  performance: {
    contentQuality: number
    studentSatisfaction: number
    engagement: number
    reliability: number
  }
}

interface ManagerRole {
  role: "junior" | "content" | "senior" | "admin"
  permissions: {
    manageUsers: boolean
  }
}

interface CreateManagerPageProps {
  role?: "admin" | "senior" | "content" | "junior"
}

export default function CreateManagerPage({ role: propRole }: CreateManagerPageProps = {}) {
  const { t } = useLanguage()
  const { user, isAuthenticated, isAdmin, isManager } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith("/admin")
  const [currentManager, setCurrentManager] = useState<ManagerRole | null>(null)
  const [creationMode, setCreationMode] = useState<"manual" | "automatic">("automatic")
  const [showPassword, setShowPassword] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createdManager, setCreatedManager] = useState<Manager | null>(null)
  const [showCreatedDialog, setShowCreatedDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [managers, setManagers] = useState<Manager[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const [managerForm, setManagerForm] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    specialties: [] as string[],
  })

  // Load managers from backend
  useEffect(() => {
    const loadManagers = async () => {
      if (!isAuthenticated || (!isAdmin && !isManager)) return

      try {
        setLoading(true)
        setError(null)

        // Load current user role and permissions
        const roleResponse = await apiClient.get('/manager/role')
        if (roleResponse.success && roleResponse.data) {
          const roleData = roleResponse.data as any
          setCurrentManager(roleData)
        }

        // Load all managers (admin and senior managers only)
        const managersResponse = await apiClient.get('/admin/managers')
        if (managersResponse.success && managersResponse.data) {
          const responseData = managersResponse.data as any
          const managersData = Array.isArray(responseData) ? responseData :
                              Array.isArray(responseData.managers) ? responseData.managers : []

          // Transform data to match interface
          const transformedManagers: Manager[] = managersData.map((item: any) => ({
            id: item.id,
            name: item.name || `${item.firstName} ${item.lastName}`,
            email: item.email,
            phone: item.phone || "",
            status: item.status || "active",
            role: item.role?.toLowerCase() || "junior",
            joinDate: item.joinDate || item.createdAt,
            lastActive: item.lastActive || item.updatedAt,
            coursesCreated: item.coursesCreated || 0,
            testsCreated: item.testsCreated || 0,
            liveSessionsHosted: item.liveSessionsHosted || 0,
            studentsManaged: item.studentsManaged || 0,
            averageRating: item.averageRating || 0,
            totalRevenue: item.totalRevenue || 0,
            followers: item.followers || 0,
            specialties: item.specialties || [],
            avatar: item.avatar || "/placeholder.svg?height=40&width=40",
            permissions: item.permissions || {
              createCourses: true,
              createTests: true,
              hostLiveSessions: true,
              moderateContent: false,
              manageUsers: false,
              viewAnalytics: false,
              exportData: false,
              manageBilling: false
            },
            performance: item.performance || {
              contentQuality: 0,
              studentSatisfaction: 0,
              engagement: 0
            }
          }))

          setManagers(transformedManagers)
        }

      } catch (error) {
        console.error('Error loading managers:', error)
        setError(t("Erreur lors du chargement des managers", "Error loading managers"))
      } finally {
        setLoading(false)
      }
    }

    loadManagers()
  }, [isAuthenticated, isAdmin, isManager, t])

  // Create new manager
  const handleCreateManager = async () => {
    try {
      setIsCreating(true)
      setError(null)
      setSuccess(null)

      const managerData = {
        firstName: managerForm.name,
        lastName: managerForm.surname,
        email: managerForm.email,
        phone: managerForm.phone,
        role: managerForm.role.toUpperCase(),
        password: managerForm.password,
        specialties: managerForm.specialties
      }

      const response = await apiClient.post('/admin/managers', managerData)
      if (response.success && response.data) {
        const newManager = response.data as any
        setCreatedManager(newManager)
        setShowCreatedDialog(true)
        setSuccess(t("Manager créé avec succès", "Manager created successfully"))

        // Reset form
        setManagerForm({
          name: "",
          surname: "",
          email: "",
          phone: "",
          role: "",
          password: "",
          specialties: []
        })

        // Reload managers list
        const managersResponse = await apiClient.get('/admin/managers')
        if (managersResponse.success && managersResponse.data) {
          const responseData = managersResponse.data as any
          const managersData = Array.isArray(responseData) ? responseData :
                              Array.isArray(responseData.managers) ? responseData.managers : []
          setManagers(managersData)
        }

      } else {
        setError(t("Erreur lors de la création du manager", "Error creating manager"))
      }
    } catch (error) {
      console.error('Error creating manager:', error)
      setError(t("Erreur lors de la création du manager", "Error creating manager"))
    } finally {
      setIsCreating(false)
    }
  }

  // Set permissions based on user role
  useEffect(() => {
    if (!user) return

    const manager = {
      role: user.role === 'SENIOR_MANAGER' ? 'senior' as const :
            user.role === 'JUNIOR_MANAGER' ? 'junior' as const :
            user.role === 'ADMIN' ? 'admin' as const : 'content' as const,
      permissions: {
        manageUsers: user.role === 'SENIOR_MANAGER' || user.role === 'ADMIN',
      },
    }
    setCurrentManager(manager)
  }, [user])

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setManagerForm((prev) => ({ ...prev, password }))
  }

  const generatePhoneNumber = () => {
    // Simple pseudo-random local number: starts with 07 and 8 random digits
    const prefix = "07"
    let rest = ""
    for (let i = 0; i < 8; i++) {
      rest += Math.floor(Math.random() * 10).toString()
    }
    const phone = `${prefix}${rest}`
    setManagerForm((prev) => ({ ...prev, phone }))
  }

  const generateManagerCredentials = () => {
    if (managerForm.name && managerForm.surname && managerForm.role) {
      const email = `${managerForm.name.toLowerCase()}.${managerForm.surname.toLowerCase()}@tcf-tef.com`
      setManagerForm((prev) => ({ ...prev, email }))
      generateStrongPassword()
      generatePhoneNumber()
    }
  }

  // Auto mode: generate credentials and immediately create the manager
  const handleGenerateAndCreate = async () => {
    if (!managerForm.name || !managerForm.surname || !managerForm.role) return
    const email = `${managerForm.name.toLowerCase()}.${managerForm.surname.toLowerCase()}@tcf-tef.com`
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) password += chars.charAt(Math.floor(Math.random() * chars.length))
    const prefix = "07"
    let rest = ""
    for (let i = 0; i < 8; i++) rest += Math.floor(Math.random() * 10).toString()
    const phone = `${prefix}${rest}`

    const newManager: Manager = {
      id: Date.now(),
      name: `${managerForm.name} ${managerForm.surname}`,
      email,
      password,
      phone,
      status: "pending",
      role: managerForm.role as "junior" | "content" | "senior",
      joinDate: new Date().toISOString().split("T")[0],
      lastActive: new Date().toISOString().split("T")[0],
      coursesCreated: 0,
      testsCreated: 0,
      liveSessionsHosted: 0,
      studentsManaged: 0,
      averageRating: 0,
      totalRevenue: 0,
      followers: 0,
      specialties: [],
      avatar: "/placeholder.svg",
      permissions: getDefaultPermissions(managerForm.role as "junior" | "content" | "senior"),
      performance: { contentQuality: 0, studentSatisfaction: 0, engagement: 0, reliability: 0 },
    }

    const existingManagers = JSON.parse(localStorage.getItem("managers") || "[]")
    existingManagers.push(newManager)
    localStorage.setItem("managers", JSON.stringify(existingManagers))

    setManagerForm((prev) => ({ ...prev, email, phone, password }))
    setCreatedManager(newManager)
    setShowCreatedDialog(true)
  }

  const getDefaultPermissions = (role: "junior" | "content" | "senior") => {
    switch (role) {
      case "senior":
        return {
          createCourses: true,
          createTests: true,
          hostLiveSessions: true,
          moderateContent: true,
          manageUsers: true,
          viewAnalytics: true,
          exportData: true,
          manageBilling: false,
        }
      case "content":
        return {
          createCourses: true,
          createTests: true,
          hostLiveSessions: true,
          moderateContent: true,
          manageUsers: false,
          viewAnalytics: true,
          exportData: false,
          manageBilling: false,
        }
      case "junior":
        return {
          createCourses: true,
          createTests: true,
          hostLiveSessions: true,
          moderateContent: false,
          manageUsers: true,
          viewAnalytics: false,
          exportData: false,
          manageBilling: false,
        }
      default:
        return {
          createCourses: false,
          createTests: false,
          hostLiveSessions: false,
          moderateContent: false,
          manageUsers: false,
          viewAnalytics: false,
          exportData: false,
          manageBilling: false,
        }
    }
  }

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "senior":
        return {
          label: t("Senior Manager", "Senior Manager"),
          icon: Crown,
          color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          description: t("Accès complet avec gestion d'équipe", "Full access with team management"),
        }
      case "content":
        return {
          label: t("Content Manager", "Content Manager"),
          icon: BookOpen,
          color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          description: t("Création de contenu et modération", "Content creation and moderation"),
        }
      case "junior":
        return {
          label: t("Junior Manager", "Junior Manager"),
          icon: User,
          color: "bg-green-500/10 text-green-400 border-green-500/20",
          description: t("Création de cours basiques", "Basic course creation"),
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

  // Old handleCreateManager function removed - using backend integration above

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: t("Copié", "Copied"),
      description: t("Informations copiées dans le presse-papiers", "Information copied to clipboard"),
    })
  }

  const resetForm = () => {
    setManagerForm({ name: "", surname: "", email: "", phone: "", role: "", password: "", specialties: [] })
    setCreatedManager(null)
  }

  // After confirming dialog, forward to history page
  useEffect(() => {
    if (createdManager && !showCreatedDialog) {
      window.location.href = "/manager/create-manager/history"
    }
  }, [createdManager, showCreatedDialog])

  if (!currentManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  if (!currentManager.permissions.manageUsers) {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">{t("Accès restreint", "Access Restricted")}</h2>
              <p className="text-foreground mb-4">
                {t(
                  "Seuls les Senior Managers peuvent créer d'autres managers.",
                  "Only Senior Managers can create other managers.",
                )}
              </p>
              <Button onClick={() => router.back()} className="bg-blue-600 hover:bg-blue-700 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("Retour", "Back")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Removed the intermediate success page; we rely on the dialog + redirect

    return (
    <div className="min-h-screen p-6 bg-background">
        <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t("Créer un Manager", "Create Manager")}</h1>
              <p className="text-foreground/80 mt-1">
                {t(
                  "Créez un nouveau manager avec des permissions spécifiques",
                  "Create a new manager with specific permissions",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
              <Crown className="w-4 h-4 mr-2" />
              {currentManager?.role === "admin" ? t("Admin", "Admin") : 
               currentManager?.role === "senior" ? t("Manager", "Manager") :
               currentManager?.role === "content" ? t("Content Manager", "Content Manager") :
               t("Junior Manager", "Junior Manager")}
            </Badge>
            <Button
              variant="outline"
              className="border-gray-200 dark:border-gray-700 bg-transparent"
              onClick={() => (window.location.href = "/manager/create-manager/history")}
            >
              <History className="w-4 h-4 mr-2" />
              {t("Historique", "History")}
          </Button>
          </div>
        </div>

        {/* Creation Mode Selection */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground">{t("Mode de création", "Creation Mode")}</CardTitle>
            <CardDescription className="text-foreground/80">
              {t("Choisissez comment créer les informations du manager", "Choose how to create manager information")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  creationMode === "automatic"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 dark:border-gray-700 hover:border-muted-foreground",
                )}
                onClick={() => setCreationMode("automatic")}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t("Automatique", "Automatic")}</h3>
                    <p className="text-sm text-foreground/80">
                      {t("Génération automatique des identifiants", "Automatic credential generation")}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  creationMode === "manual" ? "border-primary bg-primary/5" : "border-gray-200 dark:border-gray-700 hover:border-muted-foreground",
                )}
                onClick={() => setCreationMode("manual")}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t("Manuel", "Manual")}</h3>
                    <p className="text-sm text-foreground/80">
                      {t("Saisie manuelle des informations", "Manual information entry")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manager Form */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground">{t("Informations du Manager", "Manager Information")}</CardTitle>
            <CardDescription className="text-foreground/80">
              {t(
                "Remplissez les informations de base du nouveau manager",
                "Fill in the new manager's basic information",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-foreground">{t("Prénom", "First Name")} *</Label>
                <Input
                  value={managerForm.name}
                  onChange={(e) => setManagerForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t("Entrez le prénom", "Enter first name")}
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{t("Nom", "Last Name")} *</Label>
                <Input
                  value={managerForm.surname}
                  onChange={(e) => setManagerForm((prev) => ({ ...prev, surname: e.target.value }))}
                  placeholder={t("Entrez le nom", "Enter last name")}
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Phone number in base manager information */}
            <div className="space-y-2">
              <Label className="text-foreground">{t("Numéro", "Phone Number")}</Label>
              <Input
                value={managerForm.phone}
                onChange={(e) => setManagerForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder={t("Entrez le numéro", "Enter phone number")}
                type="tel"
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">{t("Rôle", "Role")} *</Label>
              <Select
                value={managerForm.role}
                onValueChange={(value) => setManagerForm((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-foreground">
                  <SelectValue placeholder={t("Sélectionner un rôle", "Select a role")} />
                </SelectTrigger>
                <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                  <SelectItem value="junior">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="font-medium">{t("Junior Manager", "Junior Manager")}</p>
                        <p className="text-xs text-foreground/70">
                          {t("Création de cours basiques", "Basic course creation")}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                  {isAdminRoute && (
                    <SelectItem value="senior">
                    <div className="flex items-center space-x-2">
                        <Crown className="w-4 h-4 text-purple-500" />
                      <div>
                          <p className="font-medium">{t("Senior Manager", "Senior Manager")}</p>
                          <p className="text-xs text-foreground/70">
                            {t("Accès complet avec gestion d'équipe", "Full access with team management")}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {creationMode === "automatic" && managerForm.name && managerForm.surname && managerForm.role && (
              <div className="space-y-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-muted">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">{t("Génération automatique", "Automatic Generation")}</h3>
                  <Button
                    size="sm"
                    onClick={handleGenerateAndCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t("Générer", "Generate")}
                  </Button>
                </div>

                {managerForm.email && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-foreground text-sm">{t("Email généré", "Generated Email")}</Label>
                      <Input value={managerForm.email} readOnly className="bg-input border-gray-200 dark:border-gray-700 text-foreground mt-1" />
                    </div>
                    <div>
                      <Label className="text-foreground text-sm">{t("Numéro généré", "Generated Phone")}</Label>
                      <Input value={managerForm.phone} readOnly className="bg-input border-gray-200 dark:border-gray-700 text-foreground mt-1" />
                    </div>
                    <div>
                      <Label className="text-foreground text-sm">{t("Mot de passe généré", "Generated Password")}</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          value={managerForm.password}
                          type={showPassword ? "text" : "password"}
                          readOnly
                          className="bg-white dark:bg-input border-gray-200 dark:border-gray-700 text-foreground"
                        />
                        <Button
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="border-gray-200 dark:border-gray-700 bg-transparent"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {creationMode === "manual" && (
              <div className="space-y-4">
                {/* Phone number field shown earlier (base info) to avoid duplication in manual mode */}

                <div className="space-y-2">
                  <Label className="text-foreground">{t("Mot de passe", "Password")} *</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={managerForm.password}
                      onChange={(e) => setManagerForm((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder={t("Entrez le mot de passe", "Enter password")}
                      type={showPassword ? "text" : "password"}
                      className="bg-white dark:bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="border-gray-200 dark:border-gray-700 bg-transparent"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateStrongPassword}
                      className="border-gray-200 dark:border-gray-700 bg-transparent"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Role Permissions Preview */}
            {managerForm.role && (
              <div className="space-y-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-card">
                <h3 className="font-medium text-foreground">{t("Permissions du rôle", "Role Permissions")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(getDefaultPermissions(managerForm.role as "junior" | "content" | "senior")).map(
                    ([permission, enabled]) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox checked={enabled} disabled />
                        <span
                          className={cn(
                            "text-sm",
                            enabled ? "text-green-600 dark:text-green-400" : "text-foreground/70",
                          )}
                        >
                          {permission.replace(/([A-Z])/g, " $1").toLowerCase()}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => router.back()} className="border-gray-200 dark:border-gray-700 bg-transparent">
                {t("Annuler", "Cancel")}
              </Button>
              {creationMode === "manual" && (
              <Button
                onClick={handleCreateManager}
                disabled={isCreating || !managerForm.name || !managerForm.surname || !managerForm.role}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t("Création...", "Creating...")}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {t("Créer le Manager", "Create Manager")}
                  </>
                )}
              </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Creation credentials dialog */}
      <Dialog open={showCreatedDialog} onOpenChange={setShowCreatedDialog}>
        <DialogContent className="bg-card border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("Identifiants créés", "Credentials Created")}</DialogTitle>
            <DialogDescription className="text-foreground/80">
              {t(
                "Conservez ces identifiants pour l'accès du Junior Manager",
                "Keep these credentials for the Junior Manager login",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm text-foreground">
              <strong>Email:</strong> {createdManager?.email ?? managerForm.email}
            </div>
            <div className="text-sm text-foreground">
              <strong>{t("Mot de passe", "Password")}:</strong> {managerForm.password}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowCreatedDialog(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
              {t("OK", "OK")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import { ArrowLeft, User, Crown, Eye, EyeOff, Save, Loader2, AlertCircle, CheckCircle, History } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function AdminCreateManagerPage() {
  const { t } = useLanguage()
  const { user, isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdManager, setCreatedManager] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    password: "",
  })

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push("/login")
    }
  }, [isAuthenticated, isAdmin, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError(t("Le prénom est requis", "First name is required"))
      return false
    }
    if (!formData.lastName.trim()) {
      setError(t("Le nom est requis", "Last name is required"))
      return false
    }
    if (!formData.email.trim()) {
      setError(t("L'email est requis", "Email is required"))
      return false
    }
    if (!formData.email.includes("@")) {
      setError(t("Email invalide", "Invalid email"))
      return false
    }
    if (!formData.password || formData.password.length < 8) {
      setError(t("Le mot de passe doit contenir au moins 8 caractères", "Password must be at least 8 characters"))
      return false
    }
    if (!formData.role) {
      setError(t("Le rôle est requis", "Role is required"))
      return false
    }
    return true
  }

  const handleCreateManager = async () => {
    if (!validateForm()) return

    try {
      setIsCreating(true)
      setError(null)

      const managerData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role.toUpperCase(),
        password: formData.password,
      }

      const response = await apiClient.post('/admin/managers', managerData)
      
      if (response.success && response.data?.manager) {
        setCreatedManager({
          ...response.data.manager,
          password: formData.password // Store password for display
        })
        setShowSuccessDialog(true)
        
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          role: "",
          password: "",
        })

        toast({
          title: t("Succès", "Success"),
          description: t("Manager créé avec succès", "Manager created successfully"),
        })
      } else {
        setError(response.error?.message || t("Erreur lors de la création du manager", "Error creating manager"))
      }
    } catch (error: any) {
      console.error('Error creating manager:', error)
      setError(error.message || t("Erreur lors de la création du manager", "Error creating manager"))
      toast({
        title: t("Erreur", "Error"),
        description: error.message || t("Erreur lors de la création du manager", "Error creating manager"),
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getRoleInfo = (role: string) => {
    switch (role.toLowerCase()) {
      case "senior":
        return {
          label: t("Senior Manager", "Senior Manager"),
          Icon: Crown,
          color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          description: t("Accès complet avec gestion d'équipe", "Full access with team management"),
        }
      case "junior":
        return {
          label: t("Junior Manager", "Junior Manager"),
          Icon: User,
          color: "bg-green-500/10 text-green-400 border-green-500/20",
          description: t("Création de cours basiques", "Basic course creation"),
        }
      default:
        return {
          label: t("Manager", "Manager"),
          Icon: User,
          color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
          description: "",
        }
    }
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()} 
              className="text-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("Créer un Manager", "Create Manager")}
              </h1>
              <p className="text-foreground/80 mt-1">
                {t("Créez un nouveau manager avec des permissions spécifiques", "Create a new manager with specific permissions")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-gray-200 dark:border-gray-700 bg-transparent"
            onClick={() => router.push("/admin/create-manager/history")}
          >
            <History className="w-4 h-4 mr-2" />
            {t("Historique", "History")}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Manager Form */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground">
              {t("Informations du Manager", "Manager Information")}
            </CardTitle>
            <CardDescription className="text-foreground/80">
              {t("Remplissez les informations du nouveau manager", "Fill in the new manager's information")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-foreground">
                  {t("Prénom", "First Name")} *
                </Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder={t("Entrez le prénom", "Enter first name")}
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">
                  {t("Nom", "Last Name")} *
                </Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder={t("Entrez le nom", "Enter last name")}
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-foreground"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-foreground">
                {t("Email", "Email")} *
              </Label>
              <Input
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder={t("Entrez l'email", "Enter email")}
                type="email"
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-foreground"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="text-foreground">
                {t("Numéro de téléphone", "Phone Number")}
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder={t("Entrez le numéro", "Enter phone number")}
                type="tel"
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-foreground"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label className="text-foreground">
                {t("Rôle", "Role")} *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange("role", value)}
              >
                <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-foreground">
                  <SelectValue placeholder={t("Sélectionner un rôle", "Select a role")} />
                </SelectTrigger>
                <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                  <SelectItem value="junior_manager">
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
                  <SelectItem value="senior_manager">
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
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label className="text-foreground">
                {t("Mot de passe", "Password")} *
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder={t("Entrez le mot de passe (min. 8 caractères)", "Enter password (min. 8 characters)")}
                  type={showPassword ? "text" : "password"}
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-foreground"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="border-gray-200 dark:border-gray-700 bg-transparent"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-foreground/70">
                {t("Le mot de passe doit contenir au moins 8 caractères", "Password must be at least 8 characters long")}
              </p>
            </div>

            {/* Role Preview */}
            {formData.role && (
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-muted">
                {(() => {
                  const roleInfo = getRoleInfo(formData.role)
                  const Icon = roleInfo.Icon
                  return (
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${roleInfo.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{roleInfo.label}</p>
                        <p className="text-sm text-foreground/70">{roleInfo.description}</p>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={() => router.back()} 
                className="border-gray-200 dark:border-gray-700 bg-transparent"
              >
                {t("Annuler", "Cancel")}
              </Button>
              <Button
                onClick={handleCreateManager}
                disabled={
                  isCreating || 
                  !formData.firstName || 
                  !formData.lastName || 
                  !formData.email || 
                  !formData.role || 
                  !formData.password ||
                  formData.password.length < 8
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("Création...", "Creating...")}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t("Créer le Manager", "Create Manager")}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-card border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>{t("Manager créé avec succès", "Manager created successfully")}</span>
            </DialogTitle>
            <DialogDescription className="text-foreground/80">
              {t("Conservez ces identifiants pour l'accès du manager", "Keep these credentials for the manager login")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted">
              <Label className="text-sm text-foreground/70">{t("Email", "Email")}</Label>
              <p className="text-foreground font-mono">{createdManager?.email || formData.email}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <Label className="text-sm text-foreground/70">{t("Mot de passe", "Password")}</Label>
              <p className="text-foreground font-mono">{createdManager?.password || formData.password}</p>
            </div>
            {(() => {
              const roleInfo = getRoleInfo(createdManager?.role || formData.role)
              const Icon = roleInfo.Icon
              return (
                <div className="p-3 rounded-lg bg-muted">
                  <Label className="text-sm text-foreground/70">{t("Rôle", "Role")}</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Icon className="w-4 h-4" />
                    <p className="text-foreground">{roleInfo.label}</p>
                  </div>
                </div>
              )
            })()}
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => router.push("/admin/create-manager/history")}
              className="border-gray-200 dark:border-gray-700 bg-transparent"
            >
              {t("Voir l'historique", "View History")}
            </Button>
            <Button 
              onClick={() => setShowSuccessDialog(false)} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t("OK", "OK")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

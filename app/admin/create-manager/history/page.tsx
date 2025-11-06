"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import { ArrowLeft, History, User, Crown, Trash2, Edit, Save, X, Eye, EyeOff, RefreshCw, Loader2, Search, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

interface Manager {
  id: string | number
  firstName: string
  lastName: string
  name: string
  email: string
  password?: string
  phone?: string
  role: "JUNIOR_MANAGER" | "SENIOR_MANAGER" | "junior" | "senior"
  status: string
  createdAt: string
  joinDate: string
}

interface ManagerHistoryPageProps {
  isAdminSection?: boolean
}

export default function AdminManagerHistoryPage({ isAdminSection = true }: ManagerHistoryPageProps) {
  const { t } = useLanguage()
  const { user, isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [managers, setManagers] = useState<Manager[]>([])
  const [editing, setEditing] = useState<Manager | null>(null)
  const [editingPassword, setEditingPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchManagers = async () => {
      if (!isAuthenticated || !isAdmin) return

      try {
        setLoading(true)
        setError(null)

        const response = await apiClient.get('/admin/managers')

        if (response.success && response.data) {
          // Transform backend data
          const transformedManagers = (Array.isArray(response.data) ? response.data : []).map((manager: any) => ({
            id: manager.id,
            firstName: manager.firstName || '',
            lastName: manager.lastName || '',
            name: `${manager.firstName || ''} ${manager.lastName || ''}`.trim(),
            email: manager.email,
            phone: manager.phone || '',
            role: manager.role, // Keep as JUNIOR_MANAGER or SENIOR_MANAGER
            status: manager.status || 'ACTIVE',
            createdAt: manager.createdAt,
            joinDate: new Date(manager.createdAt).toLocaleDateString(),
          }))

          setManagers(transformedManagers)
        }
      } catch (err: any) {
        console.error('Error fetching managers:', err)
        setError(err.message || 'Failed to load managers')
        toast({
          title: t("Erreur", "Error"),
          description: err.message || t("Erreur lors du chargement des managers", "Error loading managers"),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchManagers()
  }, [isAuthenticated, isAdmin, t])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let filteredList = managers

    // Filter by role
    if (roleFilter !== "all") {
      filteredList = filteredList.filter((m) => {
        const role = m.role?.toUpperCase() || ''
        if (roleFilter === "senior") {
          return role === "SENIOR_MANAGER"
        } else if (roleFilter === "junior") {
          return role === "JUNIOR_MANAGER"
        }
        return true
      })
    }

    // Filter by search query
    if (q) {
      filteredList = filteredList.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.firstName?.toLowerCase().includes(q) ||
          m.lastName?.toLowerCase().includes(q)
      )
    }

    return filteredList
  }, [managers, query, roleFilter])

  const roleBadge = (role: string) => {
    const roleUpper = role?.toUpperCase() || ''
    if (roleUpper === "SENIOR_MANAGER" || roleUpper === "SENIOR") {
      return { 
        color: "bg-purple-500/10 text-purple-400 border-purple-500/20", 
        Icon: Crown, 
        label: t("Senior Manager", "Senior Manager"),
        description: t("Accès complet avec gestion d'équipe", "Full access with team management")
      }
    } else if (roleUpper === "JUNIOR_MANAGER" || roleUpper === "JUNIOR") {
      return { 
        color: "bg-green-500/10 text-green-400 border-green-500/20", 
        Icon: User, 
        label: t("Junior Manager", "Junior Manager"),
        description: t("Création de cours basiques", "Basic course creation")
      }
    }
    return { 
      color: "bg-gray-500/10 text-gray-400 border-gray-500/20", 
      Icon: User, 
      label: t("Manager", "Manager"),
      description: ""
    }
  }

  const startEditing = (manager: Manager) => {
    setEditing({
      ...manager,
      password: "" // Don't show existing password
    })
    setEditingPassword("")
    setShowPassword(false)
  }

  const cancelEditing = () => {
    setEditing(null)
    setEditingPassword("")
    setShowPassword(false)
  }

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setEditingPassword(password)
  }

  const saveManager = async () => {
    if (!editing) return

    try {
      setIsSaving(true)
      setError(null)

      const updateData: any = {
        firstName: editing.firstName,
        lastName: editing.lastName,
        email: editing.email,
      }

      // Always include phone field (even if empty/null) so backend knows to update it
      updateData.phone = (editing.phone && editing.phone.trim()) ? editing.phone.trim() : null

      // Only include password if it's being updated
      if (editingPassword && editingPassword.length >= 8) {
        updateData.password = editingPassword
      }

      const response = await apiClient.put(`/admin/managers/${editing.id}`, updateData)

      if (response.success) {
        console.log('✅ Manager updated successfully:', response.data)
        // Refresh managers list
        const managersResponse = await apiClient.get('/admin/managers')
        if (managersResponse.success && managersResponse.data) {
          console.log('📋 Refreshed managers list:', managersResponse.data)
          const transformedManagers = (Array.isArray(managersResponse.data) ? managersResponse.data : []).map((manager: any) => {
            const transformed = {
              id: manager.id,
              firstName: manager.firstName || '',
              lastName: manager.lastName || '',
              name: `${manager.firstName || ''} ${manager.lastName || ''}`.trim(),
              email: manager.email,
              phone: manager.phone ?? '',
              role: manager.role,
              status: manager.status || 'ACTIVE',
              createdAt: manager.createdAt,
              joinDate: new Date(manager.createdAt).toLocaleDateString(),
            }
            console.log(`📞 Manager ${transformed.name} phone:`, manager.phone, '->', transformed.phone)
            return transformed
          })
          setManagers(transformedManagers)
        }

        setEditing(null)
        setEditingPassword("")
        toast({
          title: t("Succès", "Success"),
          description: t("Manager mis à jour avec succès", "Manager updated successfully"),
        })
      } else {
        setError(response.error?.message || t("Erreur lors de la mise à jour", "Error updating manager"))
      }
    } catch (err: any) {
      console.error('Error updating manager:', err)
      setError(err.message || t("Erreur lors de la mise à jour", "Error updating manager"))
      toast({
        title: t("Erreur", "Error"),
        description: err.message || t("Erreur lors de la mise à jour", "Error updating manager"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteManager = async (id: string | number) => {
    if (!confirm(t("Êtes-vous sûr de vouloir supprimer ce manager ?", "Are you sure you want to delete this manager?"))) {
      return
    }

    try {
      setIsDeleting(String(id))
      setError(null)

      console.log('🗑️ Attempting to delete manager:', id)
      const response = await apiClient.delete(`/admin/managers/${id}`)
      
      console.log('🗑️ Delete response:', response)
      
      if (response.success) {
        setManagers(prev => prev.filter((m) => m.id !== id))
        toast({
          title: t("Succès", "Success"),
          description: t("Manager supprimé avec succès", "Manager deleted successfully"),
        })
      } else {
        const errorMsg = response.error?.message || t("Erreur lors de la suppression", "Error deleting manager")
        setError(errorMsg)
        toast({
          title: t("Erreur", "Error"),
          description: errorMsg,
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error('❌ Error deleting manager:', err)
      const errorMsg = err.message || err.response?.data?.error?.message || t("Erreur lors de la suppression", "Error deleting manager")
      setError(errorMsg)
      toast({
        title: t("Erreur", "Error"),
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              onClick={() => router.back()} 
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center">
                <History className="w-5 h-5 mr-2" /> 
                {t("Historique des Managers", "Managers History")}
              </h1>
              <p className="text-muted-foreground">
                {t("Gérer tous les managers créés et leurs identifiants", "Manage all created managers and their credentials")}
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/admin/create-manager")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("Créer un Manager", "Create Manager")}
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">{t("Rechercher", "Search")}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("Rechercher par nom ou email...", "Search by name or email...")}
                    className="bg-white dark:bg-input border-gray-200 dark:border-gray-700 text-foreground pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{t("Filtrer par rôle", "Filter by role")}</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="bg-white dark:bg-input border-gray-200 dark:border-gray-700 text-foreground">
                    <SelectValue placeholder={t("Tous les rôles", "All roles")} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                    <SelectItem value="all">{t("Tous les managers", "All managers")}</SelectItem>
                    <SelectItem value="senior">{t("Senior Managers", "Senior Managers")}</SelectItem>
                    <SelectItem value="junior">{t("Junior Managers", "Junior Managers")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Managers List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-lg text-foreground">
              {t("Chargement des managers...", "Loading managers...")}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((manager) => {
              const badge = roleBadge(manager.role)
              const Icon = badge.Icon
              return (
                <Card key={manager.id} className="bg-card border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-foreground text-lg">{manager.name}</CardTitle>
                        <CardDescription className="text-muted-foreground mt-1">{manager.email}</CardDescription>
                      </div>
                      <Badge variant="outline" className={badge.color}>
                        <Icon className="w-3 h-3 mr-1" /> 
                        {badge.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-foreground/70">
                      <p><strong>{t("Téléphone", "Phone")}:</strong> {(manager.phone && manager.phone.trim()) ? manager.phone : t("Non renseigné", "Not provided")}</p>
                      <p><strong>{t("Date de création", "Created")}:</strong> {manager.joinDate}</p>
                      <p><strong>{t("Statut", "Status")}:</strong> {manager.status}</p>
                    </div>
                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 border-gray-200 dark:border-gray-700 bg-transparent" 
                        onClick={() => startEditing(manager)}
                      >
                        <Edit className="w-4 h-4 mr-1" /> 
                        {t("Modifier", "Edit")}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-red-500/50 text-red-400 bg-transparent hover:bg-red-500/10" 
                        onClick={() => deleteManager(manager.id)}
                        disabled={isDeleting === String(manager.id)}
                      >
                        {isDeleting === String(manager.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {filtered.length === 0 && (
              <Card className="bg-card border-gray-200 dark:border-gray-700 col-span-full">
                <CardContent className="p-8 text-center text-muted-foreground">
                  {t("Aucun manager trouvé", "No managers found")}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && cancelEditing()}>
        <DialogContent className="bg-card border-gray-200 dark:border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {t("Modifier les identifiants", "Edit Credentials")}
            </DialogTitle>
            <DialogDescription className="text-foreground/70">
              {t("Modifiez les informations du manager", "Edit manager information")}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Prénom", "First Name")}</Label>
                  <Input
                    className="bg-white dark:bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    value={editing.firstName || ""}
                    onChange={(e) => setEditing({ ...editing, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Nom", "Last Name")}</Label>
                  <Input
                    className="bg-white dark:bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    value={editing.lastName || ""}
                    onChange={(e) => setEditing({ ...editing, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Email</Label>
                <Input
                  className="bg-white dark:bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  value={editing.email || ""}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{t("Numéro de téléphone", "Phone Number")}</Label>
                <Input
                  className="bg-white dark:bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  value={editing.phone || ""}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">
                  {t("Nouveau mot de passe", "New Password")} 
                  <span className="text-xs text-muted-foreground ml-2">
                    {t("(laisser vide pour ne pas changer)", "(leave empty to keep unchanged)")}
                  </span>
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    className="bg-white dark:bg-input border-gray-200 dark:border-gray-700 text-foreground flex-1"
                    type={showPassword ? "text" : "password"}
                    value={editingPassword}
                    onChange={(e) => setEditingPassword(e.target.value)}
                    placeholder={t("Entrez un nouveau mot de passe (min. 8 caractères)", "Enter new password (min. 8 characters)")}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-gray-200 dark:border-gray-700 bg-transparent" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-gray-200 dark:border-gray-700 bg-transparent" 
                    onClick={generateStrongPassword}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                {editingPassword && editingPassword.length > 0 && editingPassword.length < 8 && (
                  <p className="text-xs text-red-500">
                    {t("Le mot de passe doit contenir au moins 8 caractères", "Password must be at least 8 characters")}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  onClick={cancelEditing}
                  className="border-gray-200 dark:border-gray-700 bg-transparent"
                >
                  <X className="w-4 h-4 mr-1" /> 
                  {t("Annuler", "Cancel")}
                </Button>
                <Button 
                  onClick={saveManager}
                  disabled={isSaving || !editing.firstName || !editing.lastName || !editing.email || (editingPassword.length > 0 && editingPassword.length < 8)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      {t("Enregistrement...", "Saving...")}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" /> 
                      {t("Enregistrer", "Save")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

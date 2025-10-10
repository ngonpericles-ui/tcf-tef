"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import { ArrowLeft, History, User, Crown, BookOpen, Trash2, Edit, Save, X, Eye, EyeOff, RefreshCw, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface ManagerLite {
  id: number
  name: string
  email: string
  password?: string
  phone?: string
  role: "junior" | "content" | "senior"
  joinDate: string
}

export default function ManagerHistoryPage() {
  const { t } = useLanguage()
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [managers, setManagers] = useState<ManagerLite[]>([])
  const [editing, setEditing] = useState<ManagerLite | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchManagers = async () => {
      if (!isAuthenticated) return

      try {
        setLoading(true)
        setError(null)

        const response = await apiClient.get('/admin/managers')

        if (response.success && response.data) {
          // Transform backend data to match frontend expectations
          const transformedManagers = response.data.map((manager: any) => ({
            id: manager.id,
            name: `${manager.firstName} ${manager.lastName}`,
            email: manager.email,
            phone: manager.phone || '',
            role: manager.role === 'JUNIOR_MANAGER' ? 'junior' :
                  manager.role === 'SENIOR_MANAGER' ? 'senior' : 'content',
            joinDate: new Date(manager.createdAt).toLocaleDateString(),
          }))

          setManagers(transformedManagers)
        }
      } catch (err: any) {
        console.error('Error fetching managers:', err)
        setError(err.message || 'Failed to load managers')
      } finally {
        setLoading(false)
      }
    }

    fetchManagers()
  }, [isAuthenticated])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return managers
    return managers.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
  }, [managers, query])

  const roleBadge = (role: string) => {
    switch (role) {
      case "senior":
        return { color: "bg-purple-500/10 text-purple-400 border-purple-500/20", Icon: Crown, label: "Senior" }
      case "content":
        return { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", Icon: BookOpen, label: "Content" }
      default:
        return { color: "bg-green-500/10 text-green-400 border-green-500/20", Icon: User, label: "Junior" }
    }
  }

  const goToSettings = (id: number) => {
    const manager = managers.find((m) => m.id === id) || null
    setEditing(manager)
  }

  const deleteManager = async (id: number) => {
    try {
      const response = await apiClient.delete(`/admin/managers/${id}`)
      if (response.success) {
        setManagers(prev => prev.filter((m) => m.id !== id))
      }
    } catch (err: any) {
      console.error('Error deleting manager:', err)
      setError(err.message || 'Failed to delete manager')
    }
  }

  const saveEditing = async () => {
    if (!editing) return

    try {
      const response = await apiClient.put(`/admin/managers/${editing.id}`, {
        firstName: editing.name.split(' ')[0],
        lastName: editing.name.split(' ').slice(1).join(' '),
        email: editing.email,
        phone: editing.phone,
      })

      if (response.success) {
        setManagers(prev => prev.map((m) => (m.id === editing.id ? editing : m)))
        setEditing(null)
      }
    } catch (err: any) {
      console.error('Error updating manager:', err)
      setError(err.message || 'Failed to update manager')
    }
  }

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) password += chars.charAt(Math.floor(Math.random() * chars.length))
    setEditing((prev) => (prev ? { ...prev, password } : prev))
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Retour", "Back")}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center">
                <History className="w-5 h-5 mr-2" /> {t("Historique des managers", "Managers History")}
              </h1>
              <p className="text-muted-foreground">
                {t("Profils des Junior Managers créés, cliquables vers Paramètres", "Created Junior Manager profiles, clickable to Settings")}
              </p>
            </div>
          </div>
        </div>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground">{t("Rechercher", "Search")}</CardTitle>
            <CardDescription className="text-foreground/80">
              {t("Nom ou email du manager", "Manager name or email")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Chercher un manager...", "Search a manager...")}
              className="bg-white dark:bg-input border-gray-200 dark:border-gray-700 text-foreground"
            />
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            <span className="ml-3 text-lg text-gray-600 dark:text-gray-300">
              {t("Chargement des managers...", "Loading managers...")}
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-red-500 mb-4">
              <History className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {t("Erreur de chargement", "Loading Error")}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">{error}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((m) => {
            const badge = roleBadge(m.role)
            const Icon = badge.Icon
            return (
              <Card key={m.id} className="bg-card border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-lg cursor-pointer hover:underline" onClick={() => goToSettings(m.id)}>
                    {m.name}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">{m.email}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={badge.color}>
                      <Icon className="w-4 h-4 mr-1" /> {badge.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{m.phone || ""}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" className="border-gray-200 dark:border-gray-700 bg-transparent" onClick={() => goToSettings(m.id)}>
                      <Edit className="w-4 h-4 mr-1" /> {t("Ouvrir", "Open")}
                    </Button>
                    <Button variant="outline" className="border-red-700 text-red-400 bg-transparent" onClick={() => deleteManager(m.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {filtered.length === 0 && (
            <Card className="bg-card border-gray-200 dark:border-gray-700">
              <CardContent className="p-8 text-center text-muted-foreground">
                {t("Aucun junior manager créé pour le moment", "No junior manager created yet")}
              </CardContent>
            </Card>
          )}
          </div>
        )}
      </div>

      {/* Inline edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="bg-card border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("Modifier les identifiants", "Edit Credentials")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-foreground text-sm">{t("Nom complet", "Full name")}</Label>
              <Input
                className="bg-white dark:bg-input border-gray-200 dark:border-gray-700 text-foreground"
                value={editing?.name || ""}
                onChange={(e) => setEditing((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-foreground text-sm">Email</Label>
              <Input
                className="bg-white dark:bg-input border-gray-200 dark:border-gray-700 text-foreground"
                value={editing?.email || ""}
                onChange={(e) => setEditing((prev) => (prev ? { ...prev, email: e.target.value } : prev))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-foreground text-sm">{t("Numéro", "Phone")}</Label>
              <Input
                className="bg-white dark:bg-input border-gray-200 dark:border-gray-700 text-foreground"
                value={editing?.phone || ""}
                onChange={(e) => setEditing((prev) => (prev ? { ...prev, phone: e.target.value } : prev))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-foreground text-sm">{t("Mot de passe", "Password")}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  className="bg-white dark:bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  type={showPassword ? "text" : "password"}
                  value={editing?.password || ""}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, password: e.target.value } : prev))}
                />
                <Button variant="outline" className="border-gray-200 dark:border-gray-700 bg-transparent" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="outline" className="border-gray-200 dark:border-gray-700 bg-transparent" onClick={generateStrongPassword}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" className="border-gray-200 dark:border-gray-700 bg-transparent" onClick={() => setEditing(null)}>
              <X className="w-4 h-4 mr-1" /> {t("Annuler", "Cancel")}
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={saveEditing}>
              <Save className="w-4 h-4 mr-1" /> {t("Enregistrer", "Save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}



"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import {
  Search,
  Plus,
  MoreHorizontal,
  CreditCard,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Edit,
  Eye,
  RefreshCw,
  Settings,
  Star,
  BookOpen,
  MessageSquare,
  Award,
  Zap,
  Loader2,
  X
} from "lucide-react"

export default function SubscriptionBilling() {
  const { t } = useLanguage()
  const { user, isAuthenticated, isAdmin } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPlan, setFilterPlan] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false)
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    monthlyGrowth: 0,
    churnRate: 0
  })
  const [isCreateBannerOpen, setIsCreateBannerOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [banners, setBanners] = useState<any[]>([])

  // Load subscription data from backend
  useEffect(() => {
    const loadSubscriptionData = async () => {
      if (!isAuthenticated || !isAdmin) return

      try {
        setLoading(true)
        setError(null)

        // Load subscription plans
        const plansResponse = await apiClient.get('/admin/subscription-plans')
        if (plansResponse.success && plansResponse.data) {
          setPlans(Array.isArray(plansResponse.data) ? plansResponse.data : [])
        }

        // Load active subscriptions
        const subscriptionsResponse = await apiClient.get('/admin/subscriptions')
        if (subscriptionsResponse.success && subscriptionsResponse.data) {
          setSubscriptions(Array.isArray(subscriptionsResponse.data) ? subscriptionsResponse.data : [])
        }

        // Load subscription analytics
        const analyticsResponse = await apiClient.get('/admin/subscription-analytics')
        if (analyticsResponse.success && analyticsResponse.data) {
          setStats(analyticsResponse.data)
        }

        // Load promotional banners
        const bannersResponse = await apiClient.get('/admin/subscription-banners')
        if (bannersResponse.success && bannersResponse.data) {
          setBanners(Array.isArray(bannersResponse.data) ? bannersResponse.data : [])
        }

      } catch (error) {
        console.error('Error loading subscription data:', error)
        setError(t("Erreur lors du chargement des données", "Error loading data"))
      } finally {
        setLoading(false)
      }
    }

    loadSubscriptionData()
  }, [isAuthenticated, isAdmin, t])

  // Create new subscription plan
  const handleCreatePlan = async (planData: any) => {
    try {
      setError(null)
      setSuccess(null)

      const response = await apiClient.post('/admin/subscription-plans', planData)
      if (response.success) {
        setPlans(prev => [...prev, response.data])
        setSuccess(t("Plan créé avec succès", "Plan created successfully"))
        setIsCreatePlanOpen(false)
      } else {
        setError(t("Erreur lors de la création du plan", "Error creating plan"))
      }
    } catch (error) {
      console.error('Error creating plan:', error)
      setError(t("Erreur lors de la création du plan", "Error creating plan"))
    }
  }

  // Update subscription plan
  const handleUpdatePlan = async (planId: string, planData: any) => {
    try {
      setError(null)
      setSuccess(null)

      const response = await apiClient.put(`/admin/subscription-plans/${planId}`, planData)
      if (response.success) {
        setPlans(prev => prev.map(p => p.id === planId ? response.data : p))
        setSuccess(t("Plan mis à jour avec succès", "Plan updated successfully"))
        setIsEditPlanOpen(false)
      } else {
        setError(t("Erreur lors de la mise à jour du plan", "Error updating plan"))
      }
    } catch (error) {
      console.error('Error updating plan:', error)
      setError(t("Erreur lors de la mise à jour du plan", "Error updating plan"))
    }
  }

  const subscriptionPlans: any[] = plans

  const recentTransactions: any[] = subscriptions.slice(0, 10)

  const subscriptionAnalytics = {
    totalRevenue: stats.totalRevenue || 0,
    totalSubscribers: stats.activeSubscriptions || 0,
    monthlyGrowth: stats.monthlyGrowth || 0,
    churnRate: stats.churnRate || 0,
    averageRevenuePerUser: stats.totalRevenue && stats.activeSubscriptions ?
      Math.round(stats.totalRevenue / stats.activeSubscriptions) : 0,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const getPlanColor = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "blue":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "orange":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "purple":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan)
    setIsEditPlanOpen(true)
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("Gestion des Abonnements", "Subscription Management")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Gérez les plans d'abonnement et la facturation", "Manage subscription plans and billing")}
          </p>
        </div>
        <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t("Nouveau plan", "New Plan")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-gray-200 dark:border-gray-700 text-foreground max-w-4xl">
            <DialogHeader>
              <DialogTitle>{t("Créer un nouveau plan d'abonnement", "Create New Subscription Plan")}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("Définissez les caractéristiques du nouveau plan", "Define the characteristics of the new plan")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Nom du plan", "Plan Name")}</Label>
                  <Input
                    placeholder={t("Ex: Premium Plus", "Ex: Premium Plus")}
                    className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Prix (CFA)", "Price (CFA)")}</Label>
                  <Input type="number" placeholder="9500" className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{t("Description", "Description")}</Label>
                <Textarea
                  placeholder={t("Décrivez les avantages de ce plan...", "Describe the benefits of this plan...")}
                  className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Durée", "Duration")}</Label>
                  <Select>
                    <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                      <SelectValue placeholder={t("Sélectionner la durée", "Select duration")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                      <SelectItem value="monthly">{t("Mensuel", "Monthly")}</SelectItem>
                      <SelectItem value="quarterly">{t("Trimestriel", "Quarterly")}</SelectItem>
                      <SelectItem value="yearly">{t("Annuel", "Yearly")}</SelectItem>
                      <SelectItem value="permanent">{t("Permanent", "Permanent")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Couleur du badge", "Badge Color")}</Label>
                  <Select>
                    <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                      <SelectValue placeholder={t("Choisir une couleur", "Choose color")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                      <SelectItem value="green">🟢 {t("Vert", "Green")}</SelectItem>
                      <SelectItem value="blue">🔵 {t("Bleu", "Blue")}</SelectItem>
                      <SelectItem value="orange">🟠 {t("Orange", "Orange")}</SelectItem>
                      <SelectItem value="purple">🟣 {t("Violet", "Purple")}</SelectItem>
                      <SelectItem value="red">🔴 {t("Rouge", "Red")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-foreground flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {t("Niveaux de langue éligibles", "Eligible Language Levels")}
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox id={`level-${level}`} className="border-gray-200 dark:border-gray-700" />
                      <Label htmlFor={`level-${level}`} className="text-foreground">
                        {level} -{" "}
                        {level === "A1"
                          ? t("Débutant", "Beginner")
                          : level === "A2"
                            ? t("Élémentaire", "Elementary")
                            : level === "B1"
                              ? t("Intermédiaire", "Intermediate")
                              : level === "B2"
                                ? t("Inter. Supérieur", "Upper Inter.")
                                : level === "C1"
                                  ? t("Avancé", "Advanced")
                                  : t("Maîtrise", "Mastery")}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Nombre max de tests", "Max Tests")}</Label>
                  <Input
                    type="number"
                    placeholder={t("100 (ou -1 pour illimité)", "100 (or -1 for unlimited)")}
                    className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Sessions live par mois", "Live Sessions per Month")}</Label>
                  <Input
                    type="number"
                    placeholder={t("8 (ou -1 pour illimité)", "8 (or -1 for unlimited)")}
                    className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{t("Niveau de support", "Support Level")}</Label>
                <Select>
                  <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                    <SelectValue placeholder={t("Sélectionner le niveau", "Select level")} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                    <SelectItem value="community">
                      <div className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {t("Communautaire", "Community")}
                      </div>
                    </SelectItem>
                    <SelectItem value="priority">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        {t("Prioritaire", "Priority")}
                      </div>
                    </SelectItem>
                    <SelectItem value="premium">
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-2" />
                        {t("Premium", "Premium")}
                      </div>
                    </SelectItem>
                    <SelectItem value="vip">
                      <div className="flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        {t("VIP", "VIP")}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-foreground flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  {t("Fonctionnalités incluses", "Included Features")}
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="certificates" className="border-gray-200 dark:border-gray-700" />
                    <Label htmlFor="certificates" className="text-foreground">
                      {t("Certificats inclus", "Certificates Included")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="ai-simulations" className="border-gray-200 dark:border-gray-700" />
                    <Label htmlFor="ai-simulations" className="text-foreground">
                      {t("Simulations IA", "AI Simulations")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="personalized-feedback" className="border-gray-200 dark:border-gray-700" />
                    <Label htmlFor="personalized-feedback" className="text-foreground">
                      {t("Feedback personnalisé", "Personalized Feedback")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="live-sessions" className="border-gray-200 dark:border-gray-700" />
                    <Label htmlFor="live-sessions" className="text-foreground">
                      {t("Sessions live", "Live Sessions")}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)} className="border-gray-200 dark:border-gray-700">
                  {t("Annuler", "Cancel")}
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  {t("Créer le plan", "Create Plan")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
          <DialogContent className="bg-card border-gray-200 dark:border-gray-700 text-foreground max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {t("Modifier le plan", "Edit Plan")}: {selectedPlan?.name}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("Modifiez les paramètres du plan d'abonnement", "Modify subscription plan settings")}
              </DialogDescription>
            </DialogHeader>
            {selectedPlan && (
              <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">{t("Nom du plan", "Plan Name")}</Label>
                    <Input defaultValue={selectedPlan.name} className="bg-input border-gray-200 dark:border-gray-700 text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">{t("Prix (CFA)", "Price (CFA)")}</Label>
                    <Input
                      type="number"
                      defaultValue={selectedPlan.price}
                      className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">{t("Description", "Description")}</Label>
                  <Textarea
                    defaultValue={selectedPlan.description}
                    className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-foreground flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t("Niveaux éligibles", "Eligible Levels")}
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                      <div key={level} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-level-${level}`}
                          defaultChecked={selectedPlan.eligibleLevels?.includes(level)}
                          className="border-gray-200 dark:border-gray-700"
                        />
                        <Label htmlFor={`edit-level-${level}`} className="text-foreground">
                          {level}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">{t("Tests max", "Max Tests")}</Label>
                    <Input
                      type="number"
                      defaultValue={selectedPlan.maxTests === -1 ? "" : selectedPlan.maxTests}
                      placeholder={t("Illimité si vide", "Unlimited if empty")}
                      className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">{t("Sessions live", "Live Sessions")}</Label>
                    <Input
                      type="number"
                      defaultValue={selectedPlan.maxLiveSessions === -1 ? "" : selectedPlan.maxLiveSessions}
                      placeholder={t("Illimité si vide", "Unlimited if empty")}
                      className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditPlanOpen(false)} className="border-gray-200 dark:border-gray-700">
                    {t("Annuler", "Cancel")}
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    {t("Sauvegarder", "Save Changes")}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Banner Dialog */}
        <Dialog open={isCreateBannerOpen} onOpenChange={setIsCreateBannerOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white ml-2">
              <Plus className="w-4 h-4 mr-2" />
              {t("Nouvelle bannière", "New Banner")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-gray-200 dark:border-gray-700 text-foreground max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("Créer une bannière promotionnelle", "Create Promotion Banner")}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("Créez des bannières pour promouvoir des offres et des réductions", "Create banners to promote offers and discounts")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-foreground">{t("Titre de la bannière", "Banner Title")}</Label>
                <Input
                  placeholder={t("Ex: Réduction de 50% sur Premium", "Ex: 50% off Premium")}
                  className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{t("Description", "Description")}</Label>
                <Textarea
                  placeholder={t("Décrivez l'offre promotionnelle...", "Describe the promotional offer...")}
                  className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Type de réduction", "Discount Type")}</Label>
                  <Select>
                    <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                      <SelectValue placeholder={t("Sélectionner le type", "Select type")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                      <SelectItem value="percentage">{t("Pourcentage", "Percentage")}</SelectItem>
                      <SelectItem value="fixed">{t("Montant fixe", "Fixed Amount")}</SelectItem>
                      <SelectItem value="free">{t("Gratuit", "Free")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Valeur de la réduction", "Discount Value")}</Label>
                  <Input
                    type="number"
                    placeholder="50"
                    className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Date de début", "Start Date")}</Label>
                  <Input
                    type="date"
                    className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Date de fin", "End Date")}</Label>
                  <Input
                    type="date"
                    className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{t("Couleur de la bannière", "Banner Color")}</Label>
                <Select>
                  <SelectTrigger className="bg-input border-gray-200 dark:border-gray-700 text-foreground">
                    <SelectValue placeholder={t("Choisir une couleur", "Choose color")} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                    <SelectItem value="red">🔴 {t("Rouge", "Red")}</SelectItem>
                    <SelectItem value="blue">🔵 {t("Bleu", "Blue")}</SelectItem>
                    <SelectItem value="green">🟢 {t("Vert", "Green")}</SelectItem>
                    <SelectItem value="purple">🟣 {t("Violet", "Purple")}</SelectItem>
                    <SelectItem value="orange">🟠 {t("Orange", "Orange")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="isActive" className="border-gray-200 dark:border-gray-700" />
                <Label htmlFor="isActive" className="text-foreground">
                  {t("Bannière active", "Banner Active")}
                </Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateBannerOpen(false)} className="border-gray-200 dark:border-gray-700">
                  {t("Annuler", "Cancel")}
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  {t("Créer la bannière", "Create Banner")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Revenus Totaux", "Total Revenue")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {(subscriptionAnalytics.totalRevenue / 1000000).toFixed(1)}M CFA
            </div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />+{subscriptionAnalytics.monthlyGrowth}%{" "}
              {t("ce mois", "this month")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Abonnés Actifs", "Active Subscribers")}
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {subscriptionAnalytics.totalSubscribers.toLocaleString()}
            </div>
            <p className="text-xs text-blue-500 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% {t("ce mois", "this month")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("ARPU Moyen", "Average ARPU")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {subscriptionAnalytics.averageRevenuePerUser.toLocaleString()} CFA
            </div>
            <p className="text-xs text-purple-500 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +5% {t("ce mois", "this month")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Taux de Désabonnement", "Churn Rate")}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{subscriptionAnalytics.churnRate}%</div>
            <p className="text-xs text-yellow-500 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              -0.8% {t("ce mois", "this month")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border border-gray-200 dark:border-gray-700">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-muted text-muted-foreground data-[state=active]:text-foreground"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {t("Vue d'ensemble", "Overview")}
          </TabsTrigger>
          <TabsTrigger
            value="plans"
            className="data-[state=active]:bg-muted text-muted-foreground data-[state=active]:text-foreground"
          >
            <Users className="w-4 h-4 mr-2" />
            {t("Plans d'abonnement", "Subscription Plans")}
          </TabsTrigger>
          <TabsTrigger
            value="banners"
            className="data-[state=active]:bg-muted text-muted-foreground data-[state=active]:text-foreground"
          >
            <Zap className="w-4 h-4 mr-2" />
            {t("Bannières", "Banners")}
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="data-[state=active]:bg-muted text-muted-foreground data-[state=active]:text-foreground"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {t("Transactions", "Transactions")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subscription Plans Overview */}
            <Card className="bg-card border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">
                  {t("Répartition des Abonnements", "Subscription Distribution")}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("Distribution des utilisateurs par plan", "User distribution by plan")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionPlans.length > 0 ? (
                  <div className="space-y-4">
                    {subscriptionPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between p-4 bg-muted rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className={getPlanColor(plan.color)}>
                            {plan.name}
                          </Badge>
                          <div>
                            <p className="font-medium text-foreground">
                              {plan.subscribers.toLocaleString()} {t("abonnés", "subscribers")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {plan.price === 0 ? t("Gratuit", "Free") : `${plan.price.toLocaleString()} CFA/mois`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">
                            {plan.revenue === 0 ? "0" : `${(plan.revenue / 1000000).toFixed(1)}M`} CFA
                          </p>
                          <p className="text-sm text-muted-foreground">{t("Revenus", "Revenue")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Aucun plan d'abonnement</p>
                      <p className="text-sm">Les plans d'abonnement apparaîtront ici une fois créés</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-card border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Activité Récente", "Recent Activity")}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("Dernières transactions et abonnements", "Latest transactions and subscriptions")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {recentTransactions.slice(0, 5).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-gray-200 dark:border-gray-700/50"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              transaction.status === "completed"
                                ? "bg-green-500"
                                : transaction.status === "pending"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          />
                          <div>
                            <p className="font-medium text-foreground">{transaction.user}</p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.plan} • {transaction.method}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">{transaction.amount.toLocaleString()} CFA</p>
                          <Badge variant="outline" className={getStatusColor(transaction.status)}>
                            {transaction.status === "completed"
                              ? t("Complété", "Completed")
                              : transaction.status === "pending"
                                ? t("En attente", "Pending")
                                : t("Échoué", "Failed")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground">
                      <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Aucune transaction récente</p>
                      <p className="text-sm">Les transactions apparaîtront ici</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans">
          <Card className="bg-card border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">{t("Plans d'Abonnement", "Subscription Plans")}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("Gérez tous les plans disponibles", "Manage all available plans")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {subscriptionPlans.map((plan) => (
                  <Card key={plan.id} className="bg-muted border-gray-200 dark:border-gray-700 shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={getPlanColor(plan.color)}>
                          {plan.name}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-card border-gray-200 dark:border-gray-700">
                            <DropdownMenuItem
                              className="text-foreground hover:bg-muted"
                              onClick={() => handleEditPlan(plan)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              {t("Modifier", "Edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-foreground hover:bg-muted">
                              <Eye className="w-4 h-4 mr-2" />
                              {t("Voir détails", "View Details")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-foreground">
                          {plan.price === 0 ? t("Gratuit", "Free") : `${plan.price.toLocaleString()}`}
                        </div>
                        {plan.price > 0 && <div className="text-sm text-muted-foreground">CFA/mois</div>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-2xl font-bold text-foreground">{plan.subscribers.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">
                            {t("Abonnés actifs", "Active subscribers")}
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-foreground">
                            {plan.revenue === 0 ? "0" : `${(plan.revenue / 1000000).toFixed(1)}M`} CFA
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t("Revenus mensuels", "Monthly revenue")}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium text-foreground">
                            {t("Niveaux éligibles", "Eligible Levels")}:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {plan.eligibleLevels?.map((level) => (
                              <Badge key={level} variant="outline" className="text-xs bg-muted text-foreground">
                                {level}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium text-foreground">{t("Fonctionnalités", "Features")}:</div>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banners">
          <Card className="bg-card border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">{t("Bannières Promotionnelles", "Promotional Banners")}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("Gérez les bannières de promotion et de réduction", "Manage promotional and discount banners")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {banners.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {banners.map((banner) => (
                    <Card key={banner.id} className="bg-muted border-gray-200 dark:border-gray-700 shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={banner.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}>
                            {banner.isActive ? t("Actif", "Active") : t("Inactif", "Inactive")}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-card border-gray-200 dark:border-gray-700">
                              <DropdownMenuItem className="text-foreground hover:bg-muted">
                                <Edit className="w-4 h-4 mr-2" />
                                {t("Modifier", "Edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-foreground hover:bg-muted">
                                <Eye className="w-4 h-4 mr-2" />
                                {t("Aperçu", "Preview")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className={`p-4 rounded-lg bg-gradient-to-r ${
                          banner.color === 'red' ? 'from-red-500 to-pink-600' :
                          banner.color === 'blue' ? 'from-blue-500 to-cyan-600' :
                          banner.color === 'green' ? 'from-green-500 to-emerald-600' :
                          banner.color === 'purple' ? 'from-purple-500 to-violet-600' :
                          'from-orange-500 to-yellow-600'
                        } text-white`}>
                          <h3 className="font-bold text-lg">{banner.title}</h3>
                          <p className="text-sm opacity-90">{banner.description}</p>
                          <div className="mt-2">
                            <span className="text-xs bg-white/20 px-2 py-1 rounded">
                              {banner.discountType === 'percentage' ? `${banner.discountValue}%` : 
                               banner.discountType === 'fixed' ? `${banner.discountValue} CFA` : 
                               t("Gratuit", "Free")}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">
                            <strong>{t("Période", "Period")}:</strong> {banner.startDate} - {banner.endDate}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <strong>{t("Créé le", "Created on")}:</strong> {banner.createdAt}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Aucune bannière créée</p>
                    <p className="text-sm">Créez votre première bannière promotionnelle</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="bg-card border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">
                {t("Historique des Transactions", "Transaction History")}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("Toutes les transactions de paiement", "All payment transactions")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={t("Rechercher une transaction...", "Search transaction...")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-input border-gray-200 dark:border-gray-700 text-foreground"
                    />
                  </div>
                </div>
                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger className="w-full md:w-40 bg-input border-gray-200 dark:border-gray-700 text-foreground">
                    <SelectValue placeholder={t("Plan", "Plan")} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                    <SelectItem value="all">{t("Tous les plans", "All plans")}</SelectItem>
                    <SelectItem value="Essentiel">Essentiel</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Pro+">Pro+</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-40 bg-input border-gray-200 dark:border-gray-700 text-foreground">
                    <SelectValue placeholder={t("Statut", "Status")} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                    <SelectItem value="all">{t("Tous", "All")}</SelectItem>
                    <SelectItem value="completed">{t("Complété", "Completed")}</SelectItem>
                    <SelectItem value="pending">{t("En attente", "Pending")}</SelectItem>
                    <SelectItem value="failed">{t("Échoué", "Failed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 dark:border-gray-700">
                      <TableHead className="text-foreground">{t("Transaction", "Transaction")}</TableHead>
                      <TableHead className="text-foreground">{t("Utilisateur", "User")}</TableHead>
                      <TableHead className="text-foreground">{t("Plan", "Plan")}</TableHead>
                      <TableHead className="text-foreground">{t("Montant", "Amount")}</TableHead>
                      <TableHead className="text-foreground">{t("Méthode", "Method")}</TableHead>
                      <TableHead className="text-foreground">{t("Statut", "Status")}</TableHead>
                      <TableHead className="text-foreground">{t("Date", "Date")}</TableHead>
                      <TableHead className="text-foreground">{t("Actions", "Actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-gray-200 dark:border-gray-700 hover:bg-muted/50">
                        <TableCell className="font-mono text-sm text-foreground">{transaction.transactionId}</TableCell>
                        <TableCell className="text-foreground">{transaction.user}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getPlanColor(
                              subscriptionPlans.find((p) => p.name === transaction.plan)?.color || "gray",
                            )}
                          >
                            {transaction.plan}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {transaction.amount.toLocaleString()} CFA
                        </TableCell>
                        <TableCell className="text-foreground">{transaction.method}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(transaction.status)}>
                            {transaction.status === "completed"
                              ? t("Complété", "Completed")
                              : transaction.status === "pending"
                                ? t("En attente", "Pending")
                                : t("Échoué", "Failed")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">{transaction.date}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-card border-gray-200 dark:border-gray-700">
                              <DropdownMenuItem className="text-foreground hover:bg-muted">
                                <Eye className="w-4 h-4 mr-2" />
                                {t("Voir détails", "View Details")}
                              </DropdownMenuItem>
                              {transaction.status === "failed" && (
                                <DropdownMenuItem className="text-blue-400 hover:bg-muted">
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  {t("Relancer", "Retry")}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
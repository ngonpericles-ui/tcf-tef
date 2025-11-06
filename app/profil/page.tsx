"use client"

import { useState, useEffect } from "react"
import PageShell from "@/components/page-shell"
import FreeTrialTeaser from "@/components/free-trial-teaser"
import ProfileImageUpload from "@/components/profile-image-upload"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { useLang } from "@/components/language-provider"
import { User, Mail, Bell, Target, Award, BarChart3, Settings, Download, Eye, Calendar, Loader2, Crown, Shield, Sparkles, X, CheckCircle2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface UserProfile {
  id: string
  email: string
  firstName?: string
  lastName?: string
  bio?: string
  profilePicture?: string
  level?: string
  preferences?: {
    emailNotifications: boolean
    dailyGoalReminders: boolean
  }
}

interface UserStats {
  testsCompleted: number
  averageScore: number
  currentStreak: number
  totalStudyTime: string
  level: string | null // null when user hasn't taken any tests
  achievements: number
}

export default function ProfilePage() {
  const { lang } = useLang()
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats>({
    testsCompleted: 0,
    averageScore: 0,
    currentStreak: 0,
    totalStudyTime: "0h 0m",
    level: null, // No level until user takes a test
    achievements: 0,
  })
  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [availablePlans, setAvailablePlans] = useState<any[]>([])
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false)
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    emailNotifications: true,
    dailyGoalReminders: true
  })

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserProfile()
      fetchUserStats()
      fetchSubscriptionHistory()
      fetchCurrentSubscription()
      fetchAvailablePlans()
    }
  }, [isAuthenticated, user])

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get('/users/profile')
      // Backend returns data nested under data.user
      const profile = (response as any).data?.user as UserProfile
      setUserProfile(profile)
      setFormData({
        firstName: profile?.firstName || "",
        lastName: profile?.lastName || "",
        bio: profile?.bio || "",
        emailNotifications: profile?.preferences?.emailNotifications ?? true,
        dailyGoalReminders: profile?.preferences?.dailyGoalReminders ?? true
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast.error(t("Erreur lors du chargement du profil", "Error loading profile"))
    }
  }

  const fetchUserStats = async () => {
    try {
      // Only fetch level history since learning-session endpoint doesn't exist
      const levelHistoryResponse = await apiClient.get('/simulations/level-history')
      const levelData = ((levelHistoryResponse as any).data || {}) as any

      // Check if user has any actual assessments
      const hasAssessments = levelData.currentAssessment && levelData.history && levelData.history.length > 0
      const testsCompleted = hasAssessments ? levelData.history.length : 0
      
      // Only show level if user has taken tests and has assessments
      const currentLevel = hasAssessments ? levelData.currentLevel : null
      
      setUserStats({
        testsCompleted: testsCompleted,
        averageScore: 0, // Will be calculated from actual test results later
        currentStreak: 0, // Will be implemented when streak logic exists
        totalStudyTime: "0h 0m", // Will be implemented when study time tracking exists
        level: currentLevel, // null if no assessments
        achievements: 0 // Will be implemented when achievement system exists
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
      // For users with no assessments, don't show any hardcoded data
      setUserStats({
        testsCompleted: 0,
        averageScore: 0,
        currentStreak: 0,
        totalStudyTime: "0h 0m",
        level: null, // No level until they take a test
        achievements: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptionHistory = async () => {
    try {
      const response = await apiClient.get('/subscriptions/history')
      const data = (response as any).data
      setSubscriptionHistory(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching subscription history:', error)
      // Fallback to localStorage
      const history = JSON.parse(localStorage.getItem("subscriptionHistory") || "[]")
      setSubscriptionHistory(Array.isArray(history) ? history : [])
    }
  }

  const fetchCurrentSubscription = async () => {
    try {
      const response = await apiClient.get('/subscriptions/active')
      if (response.success && response.data) {
        const subscriptionData = response.data as any
        setCurrentSubscription(subscriptionData.subscription)
      } else {
        setCurrentSubscription(null)
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error)
      setCurrentSubscription(null)
    }
  }

  const fetchAvailablePlans = async () => {
    try {
      const response = await apiClient.get('/subscriptions/plans')
      if (response.success && response.data) {
        const plansData = (response.data as any).plans || response.data
        setAvailablePlans(Array.isArray(plansData) ? plansData : [])
      }
    } catch (error) {
      console.error('Error fetching available plans:', error)
      setAvailablePlans([])
    }
  }

  const handleCancelSubscription = async () => {
    if (!currentSubscription || !confirm(t("Êtes-vous sûr de vouloir annuler votre abonnement?", "Are you sure you want to cancel your subscription?"))) {
      return
    }

    try {
      setIsProcessingSubscription(true)
      const response = await apiClient.delete(`/subscriptions/${currentSubscription.id}`)
      if (response.success) {
        toast.success(t("Abonnement annulé avec succès", "Subscription cancelled successfully"))
        await fetchCurrentSubscription()
        setIsSubscriptionDialogOpen(false)
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error(t("Erreur lors de l'annulation", "Error cancelling subscription"))
    } finally {
      setIsProcessingSubscription(false)
    }
  }

  const handleUpgradeSubscription = async (tier: string) => {
    try {
      setIsProcessingSubscription(true)
      const response = await apiClient.put('/subscriptions/change', { tier, billingCycle: 'monthly' })
      if (response.success) {
        toast.success(t("Abonnement mis à jour avec succès", "Subscription updated successfully"))
        await fetchCurrentSubscription()
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      toast.error(t("Erreur lors de la mise à jour", "Error updating subscription"))
    } finally {
      setIsProcessingSubscription(false)
    }
  }

  const getSubscriptionIcon = (tier: string) => {
    const tierUpper = tier?.toUpperCase()
    if (tierUpper === 'ESSENTIAL') return <Shield className="h-5 w-5 text-blue-500" />
    if (tierUpper === 'PREMIUM') return <Crown className="h-5 w-5 text-yellow-500" />
    if (tierUpper === 'PRO') return <Sparkles className="h-5 w-5 text-purple-500" />
    return <Shield className="h-5 w-5" />
  }

  const getSubscriptionBadgeColor = (tier: string) => {
    const tierUpper = tier?.toUpperCase()
    if (tierUpper === 'ESSENTIAL') return "bg-blue-100 text-blue-800 border-blue-300"
    if (tierUpper === 'PREMIUM') return "bg-yellow-100 text-yellow-800 border-yellow-300"
    if (tierUpper === 'PRO') return "bg-purple-100 text-purple-800 border-purple-300"
    return "bg-gray-100 text-gray-800 border-gray-300"
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      await apiClient.put('/users/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        preferences: {
          emailNotifications: formData.emailNotifications,
          dailyGoalReminders: formData.dailyGoalReminders
        }
      })

      toast.success(t("Profil mis à jour avec succès", "Profile updated successfully"))
      await fetchUserProfile() // Refresh profile data
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error(t("Erreur lors de la sauvegarde", "Error saving profile"))
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Expired":
        return "bg-red-100 text-red-800"
      case "Cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const downloadInvoice = (subscription: any) => {
    console.log("Downloading invoice for:", subscription)
    alert(t("Facture téléchargée!", "Invoice downloaded!"))
  }

  if (loading) {
    return (
      <PageShell>
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t("Chargement du profil...", "Loading profile...")}</p>
            </div>
          </div>
        </main>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
          <ProfileImageUpload
            currentImage={userProfile?.profilePicture}
            userId={user?.id}
            onImageChange={(newUrl) => {
              if (userProfile) {
                setUserProfile({ ...userProfile, profilePicture: newUrl });
              }
            }}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold font-[var(--font-poppins)] mb-2 text-foreground">
                  {t("Profil", "Profile")}
                </h1>
                <p className="text-sm text-muted-foreground mb-4">
                  {t(
                    "Gérez vos informations et suivez vos progrès.",
                    "Manage your information and track your progress.",
                  )}
                </p>
              </div>
              <Link href="/settings">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-accent bg-card border-gray-200 dark:border-gray-700"
                >
                  <Settings className="w-4 h-4" />
                  {t("Paramètres", "Settings")}
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {userStats.level ? (
                <Badge variant="outline" className="bg-[#007BFF]/10 text-[#007BFF] border-[#007BFF]/20">
                  {t("Niveau", "Level")} {userStats.level}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                  {t("Niveau à déterminer", "Level pending")}
                </Badge>
              )}
              <span className="text-muted-foreground">
                {userStats.testsCompleted} {t("tests complétés", "tests completed")}
              </span>
              {userProfile?.firstName && userProfile.lastName ? (
                <span className="text-muted-foreground">
                  {userProfile.firstName} {userProfile.lastName}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {t("Complétez votre profil", "Complete your profile")}
                </span>
              )}
            </div>
          </div>
        </div>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card p-4 text-center hover:bg-accent/50 transition-colors">
            <BarChart3 className="w-6 h-6 text-[#007BFF] mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {userStats.averageScore === 0 ? "—" : `${userStats.averageScore}%`}
            </div>
            <div className="text-xs text-muted-foreground">{t("Score moyen", "Average score")}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card p-4 text-center hover:bg-accent/50 transition-colors">
            <Target className="w-6 h-6 text-[#2ECC71] mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {userStats.currentStreak === 0 ? "—" : userStats.currentStreak}
            </div>
            <div className="text-xs text-muted-foreground">{t("Jours consécutifs", "Day streak")}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card p-4 text-center hover:bg-accent/50 transition-colors">
            <Award className="w-6 h-6 text-[#F39C12] mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {userStats.achievements === 0 ? "—" : userStats.achievements}
            </div>
            <div className="text-xs text-muted-foreground">{t("Réussites", "Achievements")}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card p-4 text-center hover:bg-accent/50 transition-colors">
            <Settings className="w-6 h-6 text-[#8E44AD] mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {userStats.totalStudyTime === "0h 0m" ? "—" : userStats.totalStudyTime}
            </div>
            <div className="text-xs text-muted-foreground">{t("Temps d'étude", "Study time")}</div>
          </div>
        </section>

        <FreeTrialTeaser />

        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="w-5 h-5 rounded-full bg-[#2ECC71]" />
            <h2 className="text-lg font-semibold font-[var(--font-poppins)] text-foreground">
              {t("Abonnement", "Subscription")}
            </h2>
          </div>
          {currentSubscription ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-gray-200 dark:border-gray-700">
                {getSubscriptionIcon(currentSubscription.tier)}
                <div className="flex-1">
                  <Badge className={getSubscriptionBadgeColor(currentSubscription.tier)}>
                    {currentSubscription.tier}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("Actif depuis le", "Active since")} {new Date(currentSubscription.startDate).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}
                  </p>
                </div>
              </div>
              <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-to-r from-[#007BFF] to-[#8E44AD] hover:from-[#007BFF]/90 hover:to-[#8E44AD]/90 text-white">
                    {t("Gérer l'abonnement", "Manage subscription")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t("Gérer votre abonnement", "Manage your subscription")}</DialogTitle>
                    <DialogDescription>
                      {t("Visualisez, annulez ou modifiez votre abonnement", "View, cancel or modify your subscription")}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 mt-4">
                    {/* Current Subscription */}
                    <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                      <div className="flex items-center gap-3">
                        {getSubscriptionIcon(currentSubscription.tier)}
                        <div>
                          <h3 className="font-semibold text-foreground">{currentSubscription.tier}</h3>
                          <p className="text-sm text-muted-foreground">
                            {t("Statut", "Status")}: {currentSubscription.status}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("Date de début", "Start date")}:</span>
                          <span className="font-medium">{new Date(currentSubscription.startDate).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("Date de fin", "End date")}:</span>
                          <span className="font-medium">{new Date(currentSubscription.endDate).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}</span>
                        </div>
                      </div>
                      <Button
                        onClick={handleCancelSubscription}
                        disabled={isProcessingSubscription}
                        variant="destructive"
                        size="sm"
                        className="mt-3 w-full"
                      >
                        {isProcessingSubscription ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t("Annulation...", "Cancelling...")}
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            {t("Annuler l'abonnement", "Cancel subscription")}
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Available Plans */}
                    {availablePlans.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 text-foreground">{t("Autres plans disponibles", "Other available plans")}</h3>
                        <div className="space-y-3">
                          {availablePlans
                            .filter((plan: any) => plan.tier !== currentSubscription.tier)
                            .map((plan: any) => {
                              const tierUpper = plan.tier?.toUpperCase()
                              const canUpgrade = 
                                (currentSubscription.tier === 'ESSENTIAL' && ['PREMIUM', 'PRO'].includes(tierUpper)) ||
                                (currentSubscription.tier === 'PREMIUM' && tierUpper === 'PRO')
                              const isDowngrade = !canUpgrade && tierUpper !== currentSubscription.tier

                              return (
                                <div key={plan.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    {getSubscriptionIcon(plan.tier)}
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-foreground">{plan.name}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {plan.description || plan.descriptionEn}
                                      </p>
                                      {plan.price > 0 && (
                                        <p className="text-lg font-bold text-foreground mt-2">
                                          {plan.price.toLocaleString()} {plan.currency} / {t("mois", "month")}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      onClick={() => handleUpgradeSubscription(plan.tier)}
                                      disabled={isProcessingSubscription}
                                      variant={isDowngrade ? "outline" : "default"}
                                      size="sm"
                                    >
                                      {isDowngrade ? t("Rétrograder", "Downgrade") : t("Mettre à jour", "Upgrade")}
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
            )}
          </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{t("Aucun abonnement actif", "No active subscription")}</Badge>
              </div>
            <Link href="/abonnement">
                <Button className="w-full bg-gradient-to-r from-[#007BFF] to-[#8E44AD] hover:from-[#007BFF]/90 hover:to-[#8E44AD]/90 text-white">
                  {t("S'abonner maintenant", "Subscribe now")}
              </Button>
            </Link>
          </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold font-[var(--font-poppins)] text-foreground">
              {t("Historique des abonnements", "Subscription History")}
            </h2>
          </div>

          {subscriptionHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("Aucun historique d'abonnement", "No subscription history")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptionHistory.map((subscription) => (
                <Card key={subscription.id} className="bg-muted/50 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{subscription.plan.plan}</h3>
                          <Badge className={getStatusColor(subscription.status)}>{subscription.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">{t("Durée", "Duration")}</p>
                            <p className="font-medium">{subscription.plan.period}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t("Montant", "Amount")}</p>
                            <p className="font-medium">
                              {Math.round(subscription.plan.price * 1.1925).toLocaleString()} CFA
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t("Méthode", "Method")}</p>
                            <p className="font-medium">
                              {subscription.method === "card"
                                ? `${subscription.cardBrand?.toUpperCase()} •••• ${subscription.lastFour}`
                                : `${subscription.operator?.toUpperCase()} •••• ${subscription.phone}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t("Date", "Date")}</p>
                            <p className="font-medium">
                              {new Date(subscription.createdAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadInvoice(subscription)}
                          className="border-gray-200 dark:border-gray-700"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {t("Facture", "Invoice")}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold font-[var(--font-poppins)] text-foreground">
              {t("Informations personnelles", "Personal information")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {t("Prénom", "First Name")}
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder={t("Votre prénom", "Your first name")}
                className="h-11 bg-background border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {t("Nom de famille", "Last Name")}
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder={t("Votre nom de famille", "Your last name")}
                className="h-11 bg-background border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="h-11 bg-muted border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {t("Bio", "Bio")}
              </Label>
              <Input
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder={t("Parlez-nous de vous...", "Tell us about yourself...")}
                className="h-11 bg-background border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-base font-medium text-foreground">{t("Préférences", "Preferences")}</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">
                    {t("Notifications par email", "Email notifications")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("Recevez des mises à jour sur vos progrès", "Receive updates about your progress")}
                  </div>
                </div>
              </div>
              <Switch
                checked={formData.emailNotifications}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailNotifications: checked }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <Target className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">
                    {t("Rappels d'objectif quotidien", "Daily goal reminders")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("Restez motivé avec des rappels quotidiens", "Stay motivated with daily reminders")}
                  </div>
                </div>
              </div>
              <Switch
                checked={formData.dailyGoalReminders}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, dailyGoalReminders: checked }))}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("Sauvegarde...", "Saving...")}
                </>
              ) : (
                t("Sauvegarder les modifications", "Save changes")
              )}
            </Button>
          </div>
        </section>
      </main>
    </PageShell>
  )
}

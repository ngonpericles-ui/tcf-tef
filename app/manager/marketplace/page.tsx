"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, 
  Star, 
  MessageCircle, 
  Calendar, 
  Clock, 
  CheckCircle, 
  X, 
  Edit,
  Plus,
  Users,
  Award,
  BookOpen,
  Target,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  Check,
  AlertCircle,
  ArrowLeft
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"

interface TutorProfile {
  id: string
  name: string
  title: string
  bio: string
  specialties: string[]
  experience: number
  rating: number
  totalStudents: number
  languages: string[]
  availability: string
  location: string
  website?: string
  phone?: string
  email: string
  isActive: boolean
  joinedDate: string
  lastActive: string
}

interface StudentRequest {
  id: string
  studentName: string
  studentAvatar: string
  studentLevel: string
  requestType: 'session' | 'message' | 'expertise'
  subject: string
  description: string
  urgency: 'low' | 'medium' | 'high'
  requestedDate: string
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  createdAt: string
}

export default function MarketplaceProfilePage() {
  const { t } = useLanguage()
  const { user, isAuthenticated, isManager, isAdmin } = useAuth()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isProfileActive, setIsProfileActive] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'requests'>('profile')
  const [error, setError] = useState<string | null>(null)
  
  const [profile, setProfile] = useState<TutorProfile>({
    id: "",
    name: "",
    title: "",
    bio: "",
    specialties: [],
    experience: 0,
    rating: 0,
    totalStudents: 0,
    languages: [],
    availability: "",
    location: "",
    website: "",
    phone: "",
    email: "",
    isActive: false,
    joinedDate: "",
    lastActive: ""
  })

  const [studentRequests, setStudentRequests] = useState<StudentRequest[]>([])

  // Load marketplace profile and data
  useEffect(() => {
    const loadMarketplaceData = async () => {
      if (!isAuthenticated || (!isManager && !isAdmin)) {
        router.push("/unauthorized")
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Determine user role
        const pathname = window.location.pathname
        const currentRole = pathname.startsWith("/admin") ? "admin" : user?.role?.toLowerCase() || "manager"
        setUserRole(currentRole)

        // Check if user has access (admin or senior manager only)
        const hasAccess = isAdmin || user?.role === "SENIOR_MANAGER"
        if (!hasAccess) {
          router.push("/unauthorized")
          return
        }

        // Load marketplace profile
        const profileResponse = await apiClient.get('/manager/marketplace/profile')
        if (profileResponse.success && profileResponse.data) {
          const profileData = profileResponse.data as any
          setProfile({
            id: profileData.id || user?.id || "",
            name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
            title: profileData.title || "Formateur Expert",
            bio: profileData.bio || "",
            specialties: profileData.specialties || [],
            experience: profileData.experience || 0,
            rating: profileData.rating || 0,
            totalStudents: profileData.totalStudents || 0,
            languages: profileData.languages || ["Français"],
            availability: profileData.availability || "",
            location: profileData.location || "",
            website: profileData.website || "",
            phone: profileData.phone || "",
            email: user?.email || "",
            isActive: profileData.isActive || false,
            joinedDate: profileData.joinedDate || new Date().toISOString(),
            lastActive: profileData.lastActive || new Date().toISOString()
          })
          setIsProfileActive(profileData.isActive || false)
        }

        // Load student requests
        const requestsResponse = await apiClient.get('/manager/marketplace/requests')
        if (requestsResponse.success && requestsResponse.data) {
          setStudentRequests(Array.isArray(requestsResponse.data) ? requestsResponse.data : [])
        }

      } catch (error) {
        console.error("Error loading marketplace data:", error)
        setError(t("Erreur lors du chargement des données", "Error loading data"))
      } finally {
        setIsLoading(false)
      }
    }

    loadMarketplaceData()
  }, [isAuthenticated, isManager, isAdmin, user, router, t])

  const handleActivateProfile = async () => {
    try {
      const response = await apiClient.post('/manager/marketplace/activate', {
        isActive: !isProfileActive
      })

      if (response.success) {
        setIsProfileActive(!isProfileActive)
        setProfile(prev => ({ ...prev, isActive: !isProfileActive }))
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 5000)
      } else {
        setError(t("Erreur lors de l'activation du profil", "Error activating profile"))
      }
    } catch (error) {
      console.error("Error activating profile:", error)
      setError(t("Erreur lors de l'activation du profil", "Error activating profile"))
    }
  }

  const handleRequestAction = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const response = await apiClient.post(`/manager/marketplace/requests/${requestId}/action`, {
        action,
        managerId: user?.id
      })

      if (response.success) {
        setStudentRequests(prev =>
          prev.map(request =>
            request.id === requestId
              ? { ...request, status: action === 'accept' ? 'accepted' : 'declined' }
              : request
          )
        )
      } else {
        setError(t("Erreur lors du traitement de la demande", "Error processing request"))
      }
    } catch (error) {
      console.error("Error handling request:", error)
      setError(t("Erreur lors du traitement de la demande", "Error processing request"))
    }
  }

  const handleProfileUpdate = async (updatedProfile: Partial<TutorProfile>) => {
    try {
      const response = await apiClient.put('/manager/marketplace/profile', updatedProfile)

      if (response.success) {
        setProfile(prev => ({ ...prev, ...updatedProfile }))
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 5000)
      } else {
        setError(t("Erreur lors de la mise à jour du profil", "Error updating profile"))
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setError(t("Erreur lors de la mise à jour du profil", "Error updating profile"))
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200'
      case 'declined': return 'bg-red-100 text-red-800 border-red-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t("Marketplace Profile", "Marketplace Profile")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {t("Gérez votre profil de tuteur et les demandes d'expertise", "Manage your tutor profile and expertise requests")}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                <Shield className="w-4 h-4 mr-2" />
                {userRole === "admin" ? "Administrateur" : "Manager Senior"}
              </Badge>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("Retour", "Back")}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
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
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                {t("Profil activé avec succès", "Profile activated successfully")}
              </h3>
              <p className="text-sm text-green-700">
                {t("Vous avez ajouté votre profil avec succès. Vous êtes maintenant un tuteur qui peut examiner les feedbacks AI de nos étudiants.", "You have successfully added your profile. You are now a tutor who can review AI feedback from our students.")}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="w-4 h-4 mr-2 inline" />
                {t("Mon Profil", "My Profile")}
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="w-4 h-4 mr-2 inline" />
                {t("Demandes d'Expertise", "Expertise Requests")}
                {studentRequests.length > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-white">
                    {studentRequests.filter(r => r.status === 'pending').length}
                  </Badge>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Status Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>{t("Statut du Profil", "Profile Status")}</span>
                  </CardTitle>
                  <Badge className={isProfileActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {isProfileActive ? t("Actif", "Active") : t("Inactif", "Inactive")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("Mon profil marketplace me permet d'analyser les feedbacks AI de nos étudiants et de fournir des conseils d'expertise personnalisés. En tant que tuteur certifié, je peux aider les étudiants Pro+ à améliorer leurs performances.", "My marketplace profile allows me to analyze AI feedback from our students and provide personalized expertise advice. As a certified tutor, I can help Pro+ students improve their performance.")}
                  </p>
                  
                  {!isProfileActive && (
                    <Button
                      onClick={handleActivateProfile}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t("Ajouter mon profil sur le marketplace", "Add my profile to marketplace")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Information */}
            {isProfileActive && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Information */}
                <Card className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Edit className="w-5 h-5" />
                      <span>{t("Informations de base", "Basic Information")}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">{t("Nom complet", "Full Name")}</Label>
                        <Input
                          value={profile.name}
                          onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                          placeholder={t("Votre nom complet", "Your full name")}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">{t("Titre professionnel", "Professional Title")}</Label>
                        <Input
                          value={profile.title}
                          onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
                          placeholder={t("Ex: Expert TCF/TEF", "Ex: TCF/TEF Expert")}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">{t("Biographie", "Biography")}</Label>
                      <Textarea
                        value={profile.bio}
                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder={t("Parlez de votre expertise et de votre expérience...", "Talk about your expertise and experience...")}
                        className="mt-1"
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">{t("Années d'expérience", "Years of Experience")}</Label>
                        <Input
                          type="number"
                          value={profile.experience}
                          onChange={(e) => setProfile(prev => ({ ...prev, experience: Number(e.target.value) }))}
                          className="mt-1"
                          min="0"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">{t("Localisation", "Location")}</Label>
                        <Input
                          value={profile.location}
                          onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                          placeholder={t("Ville, Pays", "City, Country")}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">{t("Email", "Email")}</Label>
                        <Input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">{t("Téléphone", "Phone")}</Label>
                        <Input
                          value={profile.phone}
                          onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">{t("Site web", "Website")}</Label>
                      <Input
                        value={profile.website}
                        onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://votre-site.com"
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Stats and Specialties */}
                <div className="space-y-6">
                  {/* Stats */}
                  <Card className="bg-white dark:bg-gray-800 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5" />
                        <span>{t("Statistiques", "Statistics")}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t("Note moyenne", "Average Rating")}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">4.8</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t("Étudiants aidés", "Students Helped")}</span>
                        <span className="font-medium">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t("Sessions complétées", "Sessions Completed")}</span>
                        <span className="font-medium">0</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Specialties */}
                  <Card className="bg-white dark:bg-gray-800 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Award className="w-5 h-5" />
                        <span>{t("Spécialités", "Specialties")}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">TCF</Badge>
                          <Badge variant="outline">TEF</Badge>
                          <Badge variant="outline">Grammaire</Badge>
                          <Badge variant="outline">Expression Orale</Badge>
                        </div>
                        <Button size="sm" variant="outline" className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          {t("Ajouter une spécialité", "Add Specialty")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Requests Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t("Demandes d'Expertise", "Expertise Requests")}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t("Les étudiants Pro+ peuvent demander votre expertise pour analyser leurs feedbacks AI", "Pro+ students can request your expertise to analyze their AI feedback")}
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {studentRequests.filter(r => r.status === 'pending').length} {t("en attente", "pending")}
              </Badge>
            </div>

            {/* Requests List */}
            {studentRequests.length === 0 ? (
              <Card className="bg-white dark:bg-gray-800 shadow-sm">
                <CardContent className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t("Aucune demande", "No Requests")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t("Aucune demande d'expertise pour le moment. Les étudiants Pro+ apparaîtront ici lorsqu'ils demanderont votre aide.", "No expertise requests at the moment. Pro+ students will appear here when they request your help.")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {studentRequests.map((request) => (
                  <Card key={request.id} className="bg-white dark:bg-gray-800 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={request.studentAvatar} />
                            <AvatarFallback>{request.studentName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {request.studentName}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {request.studentLevel}
                              </Badge>
                              <Badge className={getUrgencyColor(request.urgency)}>
                                {request.urgency}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <strong>{t("Sujet", "Subject")}:</strong> {request.subject}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                              {request.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{request.requestedDate}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{request.createdAt}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleRequestAction(request.id, 'accept')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                {t("Accepter", "Accept")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRequestAction(request.id, 'decline')}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <X className="w-4 h-4 mr-1" />
                                {t("Refuser", "Decline")}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

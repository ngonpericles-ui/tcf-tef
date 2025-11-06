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

  // Utility function to normalize image URLs to always use backend URL
  const normalizeImageUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    
    // If already absolute URL (http/https), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    
    // If relative URL starting with /uploads, prepend backend URL
    if (url.startsWith('/uploads')) {
      return `http://localhost:3001${url}`
    }
    
    // If relative URL starting with /, prepend backend URL
    if (url.startsWith('/')) {
      return `http://localhost:3001${url}`
    }
    
    // If no leading slash, prepend /uploads/
    return `http://localhost:3001/uploads/${url}`
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  // Debug: Log profileData changes to track state updates
  useEffect(() => {
    console.log('🔍 Profile data state changed:', profileData)
  }, [profileData])

  const fetchAdminData = async () => {
    try {
      console.log('🔄 Fetching admin profile data...')
      const response = await apiClient.get('/users/profile') as any
      console.log('📥 Profile API Response (full):', JSON.stringify(response, null, 2))
      
      // FIXED: Handle different response structures with proper type checking
      // apiClient.get returns ApiResponse<T>, which has structure: { success, data, message }
      let userData: any = null
      const responseData = response?.data || response
      
      if (response.success && responseData) {
        // Check if data.user exists (nested structure: { data: { user: {...} } })
        if (responseData.user && typeof responseData.user === 'object') {
          userData = responseData.user
        } 
        // Check if data is the user object directly
        else if (responseData.firstName || responseData.email) {
          userData = responseData
        }
        // Check if the response itself is the user
        else if ((response as any).firstName || (response as any).email) {
          userData = response
        }
      }
      
      if (!userData || !userData.email) {
        console.error('❌ No user data found in response:', response)
        toast.error(t("Impossible de charger les données du profil", "Unable to load profile data"))
        return
      }
      
      console.log('✅ User data extracted:', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        bio: userData.bio,
        city: userData.city,
        location: userData.location,
        profileImage: userData.profileImage
      })
      
        setAdminData(userData)
      
      // FIXED: Populate all fields with proper fallbacks - use explicit values
      const newProfileData = {
        firstName: userData.firstName || userData.first_name || '',
        lastName: userData.lastName || userData.last_name || '',
          email: userData.email || '',
        phone: userData.phone || userData.phoneNumber || '',
        bio: userData.bio || userData.biography || '',
        location: userData.city || userData.location || userData.address || '',
        avatar: normalizeImageUrl(userData.profileImage || userData.profilePicture || userData.avatar || userData.imageUrl || '')
      }
      
      console.log('📝 Setting profile data state:', newProfileData)
      setProfileData(newProfileData)
      
      // Force a re-render by logging after state update (React batches updates, but this helps debug)
      setTimeout(() => {
        console.log('✅ Profile data state should be set. Check form fields now.')
      }, 100)
    } catch (error: any) {
      console.error('❌ Error fetching admin data:', error)
      toast.error(
        error?.response?.data?.error?.message || 
        error?.message || 
        t("Erreur lors du chargement du profil", "Error loading profile")
      )
    }
  }

  const handleSaveProfile = async () => {
    try {
      setLoading(true)
      console.log('💾 Saving profile data:', profileData)
      
      // FIXED: Ensure all fields are sent to backend
      const updatePayload = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        bio: profileData.bio,
        city: profileData.location, // Backend expects 'city' for location
        location: profileData.location,
        profileImage: profileData.avatar
      }
      
      console.log('📤 Sending update payload:', updatePayload)
      
      const response = await apiClient.put('/users/profile', updatePayload) as any
      console.log('📥 Update response:', response)
      
      if (response.success) {
        toast.success(t("Profil mis à jour avec succès", "Profile updated successfully"))
        // Refresh data after successful update
        await fetchAdminData()
      } else {
        throw new Error(response.error?.message || 'Failed to update profile')
      }
    } catch (error: any) {
      console.error('❌ Error updating profile:', error)
      toast.error(
        error?.response?.data?.error?.message || 
        error?.message || 
        t("Erreur lors de la mise à jour", "Error updating profile")
      )
    } finally {
      setLoading(false)
    }
  }

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient.post('/users/upload-profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // apiClient.post() returns ApiResponse<T> directly, where T is {file: UploadedFile}
      // Structure: {success: true, data: {file: {url: "...", ...}}, message: "..."}
      console.log('📷 Upload response full:', response)
      
      // Extract file data - apiClient already unwraps axios response.data
      const fileData = (response as any)?.data?.file || (response as any)?.file
      
      // Try multiple possible locations for the image URL
      let imageUrl = fileData?.url || 
                     fileData?.fileUrl || 
                     fileData?.path ||
                     (response as any)?.data?.imageUrl || 
                     (response as any)?.data?.url ||
                     (fileData?.id ? `/uploads/profiles/${fileData.id}` : null)
      
      console.log('📷 Extracted data:', { 
        success: (response as any)?.success,
        fileData,
        imageUrl 
      })
      
      if ((response as any)?.success && imageUrl) {
        // ALWAYS convert to absolute backend URL - backend serves files at http://localhost:3001/uploads/
        // Backend returns relative URLs like "/uploads/profiles/filename_resized.png"
        let finalImageUrl = imageUrl
        
        // If URL is relative, prepend backend URL
        if (imageUrl && !imageUrl.startsWith('http')) {
          // Ensure URL starts with /uploads
          if (!imageUrl.startsWith('/uploads')) {
            if (imageUrl.startsWith('/')) {
              finalImageUrl = `http://localhost:3001${imageUrl}`
            } else {
              finalImageUrl = `http://localhost:3001/uploads/${imageUrl}`
            }
          } else {
            // Already starts with /uploads - prepend backend URL
            finalImageUrl = `http://localhost:3001${imageUrl}`
          }
        }
        
        console.log('✅ Upload successful, setting avatar URL:', finalImageUrl)
        
        // Update profile immediately
        setProfileData(prev => ({ ...prev, avatar: finalImageUrl }))
        
        // Also update the user profile in backend to save this URL permanently
        try {
          await apiClient.put('/users/profile', {
            profileImage: finalImageUrl // Save absolute URL to backend
          })
          console.log('✅ Profile image URL saved to backend')
        } catch (saveError) {
          console.warn('⚠️ Failed to save profile image URL to backend:', saveError)
          // Don't fail the upload if saving URL fails
        }
        
        toast.success(t("Photo de profil mise à jour", "Profile picture updated"))
        
        // Refresh admin data to get updated profile
        setTimeout(() => {
        fetchAdminData()
        }, 500)
      } else {
        console.error('❌ Upload failed - missing imageUrl', { 
          success: (response as any)?.success, 
          imageUrl,
          fileData,
          fullResponse: response
        })
        toast.error(t("Erreur lors du téléchargement", "Error uploading image"))
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(t("Erreur lors du téléchargement", "Error uploading image"))
    } finally {
      setLoading(false)
    }
  }

  // Admin stats data - will be fetched from backend
  const [adminStats, setAdminStats] = useState({
      totalUsers: 0,
      activeManagers: 0,
      contentCreated: 0,
      monthlyGrowth: 0,
  })

  // Fetch admin statistics
  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        console.log('🔄 Fetching admin statistics...')
        const response = await apiClient.get('/admin/statistics') as any
        console.log('📊 Statistics response:', response)
        
        if (response.success && response.data) {
          const stats = response.data
          setAdminStats({
            totalUsers: stats.totalUsers || 0,
            activeManagers: stats.activeManagers || 0,
            contentCreated: stats.contentCreated || 0,
            monthlyGrowth: stats.monthlyGrowth || 0,
          })
          console.log('✅ Admin stats set:', {
            totalUsers: stats.totalUsers || 0,
            activeManagers: stats.activeManagers || 0,
            contentCreated: stats.contentCreated || 0,
            monthlyGrowth: stats.monthlyGrowth || 0,
          })
        } else {
          console.warn('⚠️ Statistics response missing data, using defaults')
          setAdminStats({
            totalUsers: 0,
            activeManagers: 0,
            contentCreated: 0,
            monthlyGrowth: 0,
          })
        }
      } catch (error: any) {
        console.error('❌ Error fetching admin stats:', error)
        // Set default values on error
        setAdminStats({
          totalUsers: 0,
          activeManagers: 0,
          contentCreated: 0,
          monthlyGrowth: 0,
        })
      }
    }
    fetchAdminStats()
  }, [])

  return (
    <div className={cn("min-h-screen", theme === "dark" ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" : "bg-gradient-to-br from-gray-50 via-white to-gray-50")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Modern Header - Dribbble Inspired */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className={cn("text-4xl font-bold tracking-tight", theme === "dark" ? "text-white" : "text-gray-900")}>
              {t("Mon Profil", "My Profile")}
            </h1>
            <p className={cn("text-base", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
              {t("Gérez vos informations personnelles et préférences", "Manage your personal information and preferences")}
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-4 py-2 text-sm font-semibold shadow-lg">
            {adminData?.role || 'ADMIN'}
          </Badge>
        </div>

        {/* Modern Stats Cards - Dribbble Inspired */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={cn(
            "relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300",
            theme === "dark" ? "bg-gradient-to-br from-blue-950/50 to-blue-900/30 border-blue-800/20" : "bg-gradient-to-br from-blue-50 to-blue-100/50"
          )}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className={cn("text-sm font-medium", theme === "dark" ? "text-blue-300" : "text-blue-600")}>
                    {t("Utilisateurs totaux", "Total Users")}
                  </p>
                  <p className={cn("text-3xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
                    {adminStats.totalUsers.toLocaleString()}
                  </p>
                </div>
                <div className={cn("p-3 rounded-xl", theme === "dark" ? "bg-blue-900/40" : "bg-blue-500/10")}>
                  <Users className={cn("w-6 h-6", theme === "dark" ? "text-blue-400" : "text-blue-600")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300",
            theme === "dark" ? "bg-gradient-to-br from-green-950/50 to-green-900/30 border-green-800/20" : "bg-gradient-to-br from-green-50 to-green-100/50"
          )}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className={cn("text-sm font-medium", theme === "dark" ? "text-green-300" : "text-green-600")}>
                    {t("Managers actifs", "Active Managers")}
                  </p>
                  <p className={cn("text-3xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
                    {adminStats.activeManagers}
                  </p>
                </div>
                <div className={cn("p-3 rounded-xl", theme === "dark" ? "bg-green-900/40" : "bg-green-500/10")}>
                  <Shield className={cn("w-6 h-6", theme === "dark" ? "text-green-400" : "text-green-600")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300",
            theme === "dark" ? "bg-gradient-to-br from-orange-950/50 to-orange-900/30 border-orange-800/20" : "bg-gradient-to-br from-orange-50 to-orange-100/50"
          )}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className={cn("text-sm font-medium", theme === "dark" ? "text-orange-300" : "text-orange-600")}>
                    {t("Contenus créés", "Content Created")}
                  </p>
                  <p className={cn("text-3xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
                    {adminStats.contentCreated}
                  </p>
                </div>
                <div className={cn("p-3 rounded-xl", theme === "dark" ? "bg-orange-900/40" : "bg-orange-500/10")}>
                  <BookOpen className={cn("w-6 h-6", theme === "dark" ? "text-orange-400" : "text-orange-600")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300",
            theme === "dark" ? "bg-gradient-to-br from-purple-950/50 to-purple-900/30 border-purple-800/20" : "bg-gradient-to-br from-purple-50 to-purple-100/50"
          )}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className={cn("text-sm font-medium", theme === "dark" ? "text-purple-300" : "text-purple-600")}>
                    {t("Croissance mensuelle", "Monthly Growth")}
                  </p>
                  <p className={cn("text-3xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
                    +{adminStats.monthlyGrowth}%
                  </p>
                </div>
                <div className={cn("p-3 rounded-xl", theme === "dark" ? "bg-purple-900/40" : "bg-purple-500/10")}>
                  <TrendingUp className={cn("w-6 h-6", theme === "dark" ? "text-purple-400" : "text-purple-600")} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Modern Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={cn(
            "grid w-full grid-cols-4 gap-2 p-1 rounded-xl",
            theme === "dark" ? "bg-gray-800/50 border border-gray-700" : "bg-gray-100 border border-gray-200"
          )}>
            <TabsTrigger 
              value="profile"
              className={cn(
                "rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md",
                theme === "dark" ? "data-[state=active]:shadow-blue-500/20" : "data-[state=active]:shadow-blue-500/30"
              )}
            >
              {t("Profil", "Profile")}
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className={cn(
                "rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md",
                theme === "dark" ? "data-[state=active]:shadow-blue-500/20" : "data-[state=active]:shadow-blue-500/30"
              )}
            >
              {t("Sécurité", "Security")}
            </TabsTrigger>
            <TabsTrigger 
              value="preferences"
              className={cn(
                "rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md",
                theme === "dark" ? "data-[state=active]:shadow-blue-500/20" : "data-[state=active]:shadow-blue-500/30"
              )}
            >
              {t("Préférences", "Preferences")}
            </TabsTrigger>
            <TabsTrigger 
              value="activity"
              className={cn(
                "rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md",
                theme === "dark" ? "data-[state=active]:shadow-blue-500/20" : "data-[state=active]:shadow-blue-500/30"
              )}
            >
              {t("Activité", "Activity")}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab - Modern Design */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card className={cn(
              "border-0 shadow-xl",
              theme === "dark" ? "bg-gray-900/50 backdrop-blur-sm border border-gray-800" : "bg-white border border-gray-100"
            )}>
              <CardHeader className="pb-4">
                <CardTitle className={cn("text-2xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
                  {t("Informations personnelles", "Personal Information")}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {t("Mettez à jour vos informations de profil", "Update your profile information")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Modern Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/50 dark:border-blue-800/30">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative">
                    <img
                        src={normalizeImageUrl(profileData.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.firstName + ' ' + profileData.lastName || 'Admin')}&background=6366f1&color=fff&size=128`}
                      alt="Admin Avatar"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-xl ring-4 ring-blue-500/20 dark:ring-blue-500/30"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.firstName + ' ' + profileData.lastName || 'Admin')}&background=6366f1&color=fff&size=128`
                        }}
                    />
                      <label className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 cursor-pointer flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 border-2 border-white dark:border-gray-800">
                        <Camera className="w-5 h-5 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <h3 className={cn("text-2xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
                      {`${profileData.firstName} ${profileData.lastName}`.trim() || user?.email?.split('@')[0] || 'Admin'}
                    </h3>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        {adminData?.role || 'ADMIN'}
                      </Badge>
                      <span className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                        •
                      </span>
                    <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                      {t("Administrateur depuis", "Administrator since")}{" "}
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                    </p>
                    </div>
                  </div>
                </div>

                {/* Modern Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className={cn("text-sm font-semibold flex items-center gap-2", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                      <User className="w-4 h-4" />
                      <span>{t("Prénom", "First Name")}</span>
                    </Label>
                    <Input
                      id="firstName"
                      key={`firstName-${profileData.firstName}`}
                      value={profileData.firstName || ''}
                      onChange={(e) => {
                        console.log('✏️ firstName onChange:', e.target.value)
                        setProfileData(prev => ({ ...prev, firstName: e.target.value }))
                      }}
                      placeholder={t("Votre prénom", "Your first name")}
                      className={cn(
                        "h-12 rounded-xl border-2 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                        theme === "dark" 
                          ? "bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" 
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="lastName" className={cn("text-sm font-semibold flex items-center gap-2", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                      <User className="w-4 h-4" />
                      <span>{t("Nom", "Last Name")}</span>
                    </Label>
                    <Input
                      id="lastName"
                      key={`lastName-${profileData.lastName}`}
                      value={profileData.lastName || ''}
                      onChange={(e) => {
                        console.log('✏️ lastName onChange:', e.target.value)
                        setProfileData(prev => ({ ...prev, lastName: e.target.value }))
                      }}
                      placeholder={t("Votre nom", "Your last name")}
                      className={cn(
                        "h-12 rounded-xl border-2 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                        theme === "dark" 
                          ? "bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" 
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="email" className={cn("text-sm font-semibold flex items-center gap-2", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                      <Mail className="w-4 h-4" />
                      <span>{t("Email", "Email")}</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      key={`email-${profileData.email}`}
                      value={profileData.email || ''}
                      onChange={(e) => {
                        console.log('✏️ email onChange:', e.target.value)
                        setProfileData(prev => ({ ...prev, email: e.target.value }))
                      }}
                      placeholder={t("votre@email.com", "your@email.com")}
                      className={cn(
                        "h-12 rounded-xl border-2 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                        theme === "dark" 
                          ? "bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" 
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="phone" className={cn("text-sm font-semibold flex items-center gap-2", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                      <Phone className="w-4 h-4" />
                      <span>{t("Téléphone", "Phone")}</span>
                    </Label>
                    <Input
                      id="phone"
                      key={`phone-${profileData.phone}`}
                      value={profileData.phone || ''}
                      onChange={(e) => {
                        console.log('✏️ phone onChange:', e.target.value)
                        setProfileData(prev => ({ ...prev, phone: e.target.value }))
                      }}
                      placeholder={t("+33 6 12 34 56 78", "+1 234 567 8900")}
                      className={cn(
                        "h-12 rounded-xl border-2 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                        theme === "dark" 
                          ? "bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" 
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                      )}
                    />
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="location" className={cn("text-sm font-semibold flex items-center gap-2", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                      <MapPin className="w-4 h-4" />
                      <span>{t("Localisation", "Location")}</span>
                    </Label>
                    <Input
                      id="location"
                      key={`location-${profileData.location}`}
                      value={profileData.location || ''}
                      onChange={(e) => {
                        console.log('✏️ location onChange:', e.target.value)
                        setProfileData(prev => ({ ...prev, location: e.target.value }))
                      }}
                      placeholder={t("Ville, Pays", "City, Country")}
                      className={cn(
                        "h-12 rounded-xl border-2 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                        theme === "dark" 
                          ? "bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" 
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="bio" className={cn("text-sm font-semibold", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                    {t("Biographie", "Biography")}
                  </Label>
                  <Textarea
                    id="bio"
                    key={`bio-${profileData.bio}`}
                    value={profileData.bio || ''}
                    onChange={(e) => {
                      console.log('✏️ bio onChange:', e.target.value)
                      setProfileData(prev => ({ ...prev, bio: e.target.value }))
                    }}
                    placeholder={t("Parlez-nous de vous...", "Tell us about yourself...")}
                    className={cn(
                      "min-h-[120px] rounded-xl border-2 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none",
                      theme === "dark" 
                        ? "bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" 
                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                    )}
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {loading ? t("Sauvegarde...", "Saving...") : t("Sauvegarder les modifications", "Save Changes")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab - Modern Design */}
          <TabsContent value="security" className="space-y-6 mt-6">
            <Card className={cn(
              "border-0 shadow-xl",
              theme === "dark" ? "bg-gray-900/50 backdrop-blur-sm border border-gray-800" : "bg-white border border-gray-100"
            )}>
              <CardHeader className="pb-4">
                <CardTitle className={cn("text-2xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
                  {t("Sécurité du compte", "Account Security")}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {t("Gérez vos paramètres de sécurité", "Manage your security settings")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Password Change Section */}
                <div className="space-y-6 p-6 rounded-2xl bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200/50 dark:border-red-800/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("p-2 rounded-xl", theme === "dark" ? "bg-red-900/40" : "bg-red-500/10")}>
                      <Lock className={cn("w-5 h-5", theme === "dark" ? "text-red-400" : "text-red-600")} />
                    </div>
                    <div>
                      <h4 className={cn("font-semibold", theme === "dark" ? "text-white" : "text-gray-900")}>
                        {t("Changer le mot de passe", "Change Password")}
                      </h4>
                      <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                        {t("Mettez à jour votre mot de passe pour plus de sécurité", "Update your password for better security")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-3">
                      <Label htmlFor="current-password" className={cn("text-sm font-semibold", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                        {t("Mot de passe actuel", "Current Password")}
                      </Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPassword ? "text" : "password"}
                          placeholder={t("Entrez votre mot de passe actuel", "Enter your current password")}
                          className={cn(
                            "h-12 rounded-xl border-2 transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 pr-12",
                            theme === "dark" 
                              ? "bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" 
                              : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                          )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                          {showPassword ? (
                            <EyeOff className={cn("w-5 h-5", theme === "dark" ? "text-gray-400" : "text-gray-500")} />
                          ) : (
                            <Eye className={cn("w-5 h-5", theme === "dark" ? "text-gray-400" : "text-gray-500")} />
                          )}
                      </Button>
                    </div>
                  </div>

                    <div className="space-y-3">
                      <Label htmlFor="new-password" className={cn("text-sm font-semibold", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                        {t("Nouveau mot de passe", "New Password")}
                      </Label>
                    <Input
                      id="new-password"
                      type="password"
                        placeholder={t("Entrez un nouveau mot de passe", "Enter a new password")}
                        className={cn(
                          "h-12 rounded-xl border-2 transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
                          theme === "dark" 
                            ? "bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" 
                            : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                        )}
                    />
                  </div>

                    <div className="space-y-3">
                      <Label htmlFor="confirm-password" className={cn("text-sm font-semibold", theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                        {t("Confirmer le mot de passe", "Confirm Password")}
                      </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                        placeholder={t("Confirmez votre nouveau mot de passe", "Confirm your new password")}
                        className={cn(
                          "h-12 rounded-xl border-2 transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
                          theme === "dark" 
                            ? "bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" 
                            : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                        )}
                    />
                    </div>
                  </div>
                </div>

                {/* Two-Factor Authentication Section */}
                <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/50 dark:border-blue-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl", theme === "dark" ? "bg-blue-900/40" : "bg-blue-500/10")}>
                        <Shield className={cn("w-5 h-5", theme === "dark" ? "text-blue-400" : "text-blue-600")} />
                      </div>
                    <div>
                        <h4 className={cn("font-semibold mb-1", theme === "dark" ? "text-white" : "text-gray-900")}>
                          {t("Authentification à deux facteurs", "Two-Factor Authentication")}
                        </h4>
                        <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                          {t("Sécurisez votre compte avec une couche supplémentaire", "Secure your account with an extra layer")}
                      </p>
                      </div>
                    </div>
                    <Switch className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600" />
                  </div>
                </div>

                <Button className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <Lock className="w-5 h-5 mr-2" />
                  {t("Mettre à jour la sécurité", "Update Security")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab - Modern Design */}
          <TabsContent value="preferences" className="space-y-6 mt-6">
            <Card className={cn(
              "border-0 shadow-xl",
              theme === "dark" ? "bg-gray-900/50 backdrop-blur-sm border border-gray-800" : "bg-white border border-gray-100"
            )}>
              <CardHeader className="pb-4">
                <CardTitle className={cn("text-2xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
                  {t("Préférences", "Preferences")}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {t("Personnalisez votre expérience d'administration", "Customize your admin experience")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Email Notifications */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200/50 dark:border-blue-800/30">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-xl", theme === "dark" ? "bg-blue-900/40" : "bg-blue-500/10")}>
                          <Bell className={cn("w-6 h-6", theme === "dark" ? "text-blue-400" : "text-blue-600")} />
                        </div>
                      <div>
                          <p className={cn("font-semibold mb-1", theme === "dark" ? "text-white" : "text-gray-900")}>
                          {t("Notifications par email", "Email Notifications")}
                        </p>
                        <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                          {t("Recevez des notifications importantes", "Receive important notifications")}
                        </p>
                      </div>
                    </div>
                      <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-cyan-600" />
                    </div>
                  </div>

                  {/* Activity Reports */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/50 dark:border-green-800/30">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-xl", theme === "dark" ? "bg-green-900/40" : "bg-green-500/10")}>
                          <Activity className={cn("w-6 h-6", theme === "dark" ? "text-green-400" : "text-green-600")} />
                        </div>
                      <div>
                          <p className={cn("font-semibold mb-1", theme === "dark" ? "text-white" : "text-gray-900")}>
                          {t("Rapports d'activité", "Activity Reports")}
                        </p>
                        <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                          {t("Rapports hebdomadaires d'activité", "Weekly activity reports")}
                        </p>
                      </div>
                    </div>
                      <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-600 data-[state=checked]:to-emerald-600" />
                    </div>
                  </div>

                  {/* Multilingual Notifications */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/30">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-xl", theme === "dark" ? "bg-purple-900/40" : "bg-purple-500/10")}>
                          <Globe className={cn("w-6 h-6", theme === "dark" ? "text-purple-400" : "text-purple-600")} />
                        </div>
                      <div>
                          <p className={cn("font-semibold mb-1", theme === "dark" ? "text-white" : "text-gray-900")}>
                          {t("Notifications multilingues", "Multilingual Notifications")}
                        </p>
                        <p className={cn("text-sm", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
                          {t("Notifications en français et anglais", "Notifications in French and English")}
                        </p>
                      </div>
                    </div>
                      <Switch className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-600 data-[state=checked]:to-pink-600" />
                    </div>
                  </div>
                </div>

                <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <Settings className="w-5 h-5 mr-2" />
                  {t("Sauvegarder les préférences", "Save Preferences")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}

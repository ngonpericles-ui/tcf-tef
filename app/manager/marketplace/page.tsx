"use client"

import { useState, useEffect } from "react"
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
  ArrowLeft,
  Camera,
  Save,
  Loader2,
  Trash2,
  PhoneCall
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface TutorProfile {
  id: string
  name: string
  title: string
  bio: string
  specialties: string[] // TCF, TEF
  subjects?: string[] // Sujets (Grammaire, Expression Orale, etc.)
  experience: number
  rating: number
  totalStudents: number
  languages: string[]
  availability: string[] // Working time periods (disponibilité) - e.g., ["Lun-Ven"]
  workingHours?: string[] // Specific time slots - e.g., ["09:00-12:00", "14:00-17:00"]
  location: string
  website?: string
  phone?: string
  email: string
  isActive: boolean
  joinedDate: string
  lastActive: string
  profileImage?: string
  acceptsMessages?: boolean // Whether tutor accepts messages from students
}

interface StudentRequest {
  id: string
  studentId: string // Student ID for message routing
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
  const { user, isAuthenticated, isManager, isAdmin, loading } = useAuth()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isProfileActive, setIsProfileActive] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'requests' | 'sessionRequests'>('profile')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddSpecialtyDialog, setShowAddSpecialtyDialog] = useState(false)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  
  // Subjects (sujets) management
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  
  // Working time (disponibilité) management
  const [showAddAvailabilityDialog, setShowAddAvailabilityDialog] = useState(false)
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<string[]>([])
  const [availableAvailabilities, setAvailableAvailabilities] = useState<string[]>([])
  
  // Working hours (specific time slots) management
  const [showAddWorkingHoursDialog, setShowAddWorkingHoursDialog] = useState(false)
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00")
  const [workingHoursEnd, setWorkingHoursEnd] = useState("17:00")
  const [selectedDay, setSelectedDay] = useState("")

  // Available specialties: TCF and TEF
  const availableSpecialties = ["TCF", "TEF"]
  
  // Days of the week
  const daysOfWeek = [
    { value: "Lundi", label: t("Lundi", "Monday") },
    { value: "Mardi", label: t("Mardi", "Tuesday") },
    { value: "Mercredi", label: t("Mercredi", "Wednesday") },
    { value: "Jeudi", label: t("Jeudi", "Thursday") },
    { value: "Vendredi", label: t("Vendredi", "Friday") },
    { value: "Samedi", label: t("Samedi", "Saturday") },
    { value: "Dimanche", label: t("Dimanche", "Sunday") }
  ]
  
  // Fetch available subjects and availability options from backend
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch subjects
        const subjectsResponse = await apiClient.get('/marketplace/subjects') as any
        if (subjectsResponse.success && Array.isArray(subjectsResponse.data)) {
          setAvailableSubjects(subjectsResponse.data)
        } else {
          setAvailableSubjects(["Grammaire", "Expression Orale", "Méthodologie TCF/TEF", "Vocabulaire", "Phonétique", "Conversation", "Compréhension Orale", "Compréhension Écrite", "Expression Écrite"])
        }

        // Fetch availability options
        const availabilityResponse = await apiClient.get('/marketplace/availability-options') as any
        if (availabilityResponse.success && Array.isArray(availabilityResponse.data)) {
          setAvailableAvailabilities(availabilityResponse.data)
        } else {
          setAvailableAvailabilities(["Lun-Ven", "Mar-Sam", "Lun-Dim", "Mer-Dim", "Lun-Sam", "Lun-Ven 18h-23h", "Week-end", "Soirées"])
        }
      } catch (error) {
        console.error('Error fetching options:', error)
        // Use fallback values
        setAvailableSubjects(["Grammaire", "Expression Orale", "Méthodologie TCF/TEF", "Vocabulaire", "Phonétique", "Conversation", "Compréhension Orale", "Compréhension Écrite", "Expression Écrite"])
        setAvailableAvailabilities(["Lun-Ven", "Mar-Sam", "Lun-Dim", "Mer-Dim", "Lun-Sam", "Lun-Ven 18h-23h", "Week-end", "Soirées"])
      }
    }

    fetchOptions()
  }, [])
  
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
    availability: [], // Working time periods as array
    workingHours: [], // Specific time slots as array
    location: "",
    website: "",
    phone: "",
    email: "",
    isActive: false,
    joinedDate: "",
    lastActive: "",
    acceptsMessages: false // Default to false (OFF state)
  })

  const [studentRequests, setStudentRequests] = useState<StudentRequest[]>([])
  const [sessionRequests, setSessionRequests] = useState<StudentRequest[]>([])

  // Load marketplace profile and data
  useEffect(() => {
    const loadMarketplaceData = async () => {
      // Wait for auth to finish loading before checking
      if (loading) {
        return; // Still loading auth state
      }

      if (!isAuthenticated || (!isManager && !isAdmin)) {
        router.push("/unauthorized")
        return
      }

      // Wait for user to be loaded
      if (!user) {
        return; // User not loaded yet
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
            title: profileData.title !== undefined && profileData.title !== null ? profileData.title : "Formateur Expert",
            bio: profileData.bio !== undefined && profileData.bio !== null ? profileData.bio : "",
            specialties: Array.isArray(profileData.specialties) ? profileData.specialties : (profileData.specialties !== undefined && profileData.specialties !== null ? [profileData.specialties] : []),
            subjects: Array.isArray(profileData.subjects) ? profileData.subjects : (profileData.subjects !== undefined && profileData.subjects !== null ? [profileData.subjects] : []), // Sujets
            experience: profileData.experience !== undefined && profileData.experience !== null ? profileData.experience : 0,
            rating: profileData.rating !== undefined && profileData.rating !== null ? profileData.rating : 0,
            totalStudents: profileData.totalStudents !== undefined && profileData.totalStudents !== null ? profileData.totalStudents : 0,
            languages: Array.isArray(profileData.languages) ? profileData.languages : (profileData.languages !== undefined && profileData.languages !== null ? [profileData.languages] : ["Français"]),
            availability: Array.isArray(profileData.availability) ? profileData.availability : (profileData.availability !== undefined && profileData.availability !== null ? [profileData.availability] : []), // Working time periods as array
            workingHours: Array.isArray(profileData.workingHours) ? profileData.workingHours : (profileData.workingHours !== undefined && profileData.workingHours !== null ? [profileData.workingHours] : []), // Working hours as array
            location: profileData.location !== undefined && profileData.location !== null ? profileData.location : "",
            website: profileData.website !== undefined && profileData.website !== null ? profileData.website : "",
            phone: profileData.phone !== undefined && profileData.phone !== null ? profileData.phone : "",
            email: user?.email || "",
            isActive: profileData.isActive || false,
            joinedDate: profileData.joinedDate || new Date().toISOString(),
            lastActive: profileData.lastActive || new Date().toISOString(),
            profileImage: (() => {
              const imgUrl = profileData.profilePicture || profileData.profileImage || ""
              if (imgUrl && imgUrl.startsWith('/uploads')) {
                const apiUrl = typeof window !== 'undefined'
                  ? (window as any).__NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
                  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
                const backendUrl = apiUrl.replace('/api', '')
                return `${backendUrl}${imgUrl}`
              }
              return imgUrl || ""
            })(), // Load profile image with full URL
            acceptsMessages: profileData.acceptsMessages === true // Explicitly check for true, default to false if undefined/null
          })
          // Explicitly check if isActive is true (not just truthy)
          const isActiveStatus = profileData.isActive === true;
          setIsProfileActive(isActiveStatus);
          console.log('📋 Frontend - Profile activation status:', {
            profileDataIsActive: profileData.isActive,
            isActiveStatus: isActiveStatus,
            profileData: profileData
          });
        }

        // Load student requests (expertise requests)
        const requestsResponse = await apiClient.get('/manager/marketplace/requests', {
          params: { requestType: 'EXPERTISE' }
        })
        if (requestsResponse.success && requestsResponse.data) {
          setStudentRequests(Array.isArray(requestsResponse.data) ? requestsResponse.data : [])
        }

        // Load session requests (one-on-one session requests)
        const sessionRequestsResponse = await apiClient.get('/manager/marketplace/requests', {
          params: { requestType: 'SESSION' }
        })
        if (sessionRequestsResponse.success && sessionRequestsResponse.data) {
          setSessionRequests(Array.isArray(sessionRequestsResponse.data) ? sessionRequestsResponse.data : [])
        }

      } catch (error) {
        console.error("Error loading marketplace data:", error)
        setError(t("Erreur lors du chargement des données", "Error loading data"))
      } finally {
        setIsLoading(false)
      }
    }

    loadMarketplaceData()
  }, [isAuthenticated, isManager, isAdmin, user, router, t, loading])

  const handleActivateProfile = async () => {
    try {
      const newActiveState = !isProfileActive;
      console.log('🔧 Frontend - Activating profile:', { newActiveState, currentState: isProfileActive });

      const response = await apiClient.post('/manager/marketplace/activate', {
        isActive: newActiveState
      })

      console.log('📋 Frontend - Activation response:', response);

      if (response.success) {
        // Update local state
        setIsProfileActive(newActiveState);
        setProfile(prev => ({ ...prev, isActive: newActiveState }));
        
        // Reload profile data to get fresh data from backend
        const profileResponse = await apiClient.get('/manager/marketplace/profile');
        if (profileResponse.success && profileResponse.data) {
          const profileData = profileResponse.data as any;
          const updatedIsActive = profileData.isActive === true;
          setIsProfileActive(updatedIsActive);
          setProfile(prev => ({ ...prev, ...profileData, isActive: updatedIsActive }));
          console.log('✅ Frontend - Profile refreshed after activation:', { updatedIsActive, profileData });
        }
        
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 5000);
        
        // Show toast message
        const { toast } = await import('sonner');
        toast.success(
          newActiveState 
            ? t("Profil activé avec succès", "Profile activated successfully")
            : t("Profil désactivé avec succès", "Profile deactivated successfully")
        );
      } else {
        const errorMessage = response.error?.message || t("Erreur lors de l'activation du profil", "Error activating profile");
        setError(errorMessage);
        const { toast } = await import('sonner');
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("❌ Error activating profile:", error);
      const errorMessage = error.response?.data?.error?.message || error.message || t("Erreur lors de l'activation du profil", "Error activating profile");
      setError(errorMessage);
      const { toast } = await import('sonner');
      toast.error(errorMessage);
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const response = await apiClient.delete(`/manager/marketplace/requests/${requestId}`)
      if (response.success) {
        // Remove from both lists
        setStudentRequests(prev => prev.filter(r => r.id !== requestId))
        setSessionRequests(prev => prev.filter(r => r.id !== requestId))
        toast.success(t("Demande supprimée avec succès", "Request deleted successfully"))
      } else {
        toast.error(response.error?.message || t("Erreur lors de la suppression", "Error deleting request"))
      }
    } catch (error: any) {
      console.error("Error deleting request:", error)
      toast.error(t("Erreur lors de la suppression", "Error deleting request"))
    }
  }

  const handleRequestAction = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const response = await apiClient.post(`/manager/marketplace/requests/${requestId}/action`, {
        action,
        managerId: user?.id
      })

      if (response.success) {
        // Update both studentRequests and sessionRequests
        setStudentRequests(prev =>
          prev.map(request =>
            request.id === requestId
              ? { ...request, status: action === 'accept' ? 'accepted' : 'declined' }
              : request
          )
        )
        setSessionRequests(prev =>
          prev.map(request =>
            request.id === requestId
              ? { ...request, status: action === 'accept' ? 'accepted' : 'declined' }
              : request
          )
        )
        toast.success(
          action === 'accept'
            ? t("Demande acceptée avec succès", "Request accepted successfully")
            : t("Demande refusée", "Request declined")
        )
      } else {
        setError(t("Erreur lors du traitement de la demande", "Error processing request"))
        toast.error(t("Erreur lors du traitement de la demande", "Error processing request"))
      }
    } catch (error) {
      console.error("Error handling request:", error)
      setError(t("Erreur lors du traitement de la demande", "Error processing request"))
    }
  }

  const handleProfileUpdate = async (updatedProfile: Partial<TutorProfile>) => {
    try {
      setIsSaving(true)
      setError(null)
      
      // Transform profile data for API
      // CRITICAL: Always send ALL fields explicitly, even if empty string or empty array
      // This ensures fields are properly saved and can be cleared
      const profileData: any = {
        // Always send these fields - use the updated value if provided, otherwise use current profile value
        // Preserve empty strings - don't convert with || operator
        bio: updatedProfile.bio !== undefined ? updatedProfile.bio : (profile.bio !== undefined ? profile.bio : ""),
        location: updatedProfile.location !== undefined ? updatedProfile.location : (profile.location !== undefined ? profile.location : ""),
        phone: updatedProfile.phone !== undefined ? updatedProfile.phone : (profile.phone !== undefined ? profile.phone : ""),
        website: updatedProfile.website !== undefined ? updatedProfile.website : (profile.website !== undefined ? profile.website : ""),
        title: updatedProfile.title !== undefined ? updatedProfile.title : (profile.title !== undefined ? profile.title : ""),
        specialties: updatedProfile.specialties !== undefined ? (updatedProfile.specialties || []) : (profile.specialties !== undefined ? profile.specialties : []),
        subjects: updatedProfile.subjects !== undefined ? (updatedProfile.subjects || []) : (profile.subjects !== undefined ? profile.subjects : []),
        languages: updatedProfile.languages !== undefined ? (updatedProfile.languages || []) : (profile.languages !== undefined ? profile.languages : []),
        availability: updatedProfile.availability !== undefined ? (updatedProfile.availability || []) : (profile.availability !== undefined ? profile.availability : []),
        workingHours: updatedProfile.workingHours !== undefined ? (updatedProfile.workingHours || []) : (profile.workingHours !== undefined ? profile.workingHours : []),
        acceptsMessages: updatedProfile.acceptsMessages !== undefined ? updatedProfile.acceptsMessages : (profile.acceptsMessages !== undefined ? profile.acceptsMessages : false)
      }
      
      console.log('💾 Frontend - Saving profile data:', {
        location: profileData.location,
        originalLocation: profile.location,
        updatedLocation: updatedProfile.location
      })

      console.log('💾 Saving profile:', profileData)
      
      const response = await apiClient.put('/manager/marketplace/profile', profileData)

      if (response.success) {
        // Reload profile to get fresh data from backend (including all fields)
        const updatedProfileResponse = await apiClient.get('/manager/marketplace/profile')
        if (updatedProfileResponse.success && updatedProfileResponse.data) {
          const updatedProfileData = updatedProfileResponse.data as any
          setProfile(prev => ({
            ...prev,
            // Always update from backend response - preserve empty strings and empty arrays
            bio: updatedProfileData.bio !== undefined && updatedProfileData.bio !== null ? updatedProfileData.bio : "",
            location: updatedProfileData.location !== undefined && updatedProfileData.location !== null ? updatedProfileData.location : "",
            phone: updatedProfileData.phone !== undefined && updatedProfileData.phone !== null ? updatedProfileData.phone : "",
            website: updatedProfileData.website !== undefined && updatedProfileData.website !== null ? updatedProfileData.website : "",
            title: updatedProfileData.title !== undefined && updatedProfileData.title !== null ? updatedProfileData.title : "",
            specialties: Array.isArray(updatedProfileData.specialties) ? updatedProfileData.specialties : (updatedProfileData.specialties !== undefined && updatedProfileData.specialties !== null ? [updatedProfileData.specialties] : []),
            subjects: Array.isArray(updatedProfileData.subjects) ? updatedProfileData.subjects : (updatedProfileData.subjects !== undefined && updatedProfileData.subjects !== null ? [updatedProfileData.subjects] : []),
            languages: Array.isArray(updatedProfileData.languages) ? updatedProfileData.languages : (updatedProfileData.languages !== undefined && updatedProfileData.languages !== null ? [updatedProfileData.languages] : []),
            availability: Array.isArray(updatedProfileData.availability) ? updatedProfileData.availability : (updatedProfileData.availability !== undefined && updatedProfileData.availability !== null ? [updatedProfileData.availability] : []),
            workingHours: Array.isArray(updatedProfileData.workingHours) ? updatedProfileData.workingHours : (updatedProfileData.workingHours !== undefined && updatedProfileData.workingHours !== null ? [updatedProfileData.workingHours] : []),
            profileImage: (() => {
              const imgUrl = updatedProfileData.profilePicture || updatedProfileData.profileImage || prev.profileImage || ""
              if (imgUrl && imgUrl.startsWith('/uploads')) {
                const apiUrl = typeof window !== 'undefined'
                  ? (window as any).__NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
                  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
                const backendUrl = apiUrl.replace('/api', '')
                return `${backendUrl}${imgUrl}`
              }
              return imgUrl || prev.profileImage || ""
            })(), // Keep profile image with full URL
            acceptsMessages: updatedProfileData.acceptsMessages !== undefined ? (updatedProfileData.acceptsMessages === true) : prev.acceptsMessages, // Explicitly check for true
          }))
        } else {
          // Fallback: update with what we sent
        setProfile(prev => ({ ...prev, ...profileData }))
        }
        setShowSuccessMessage(true)
        toast.success(t("Profil mis à jour avec succès", "Profile updated successfully"))
        setTimeout(() => setShowSuccessMessage(false), 5000)
      } else {
        const errorMsg = t("Erreur lors de la mise à jour du profil", "Error updating profile")
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error("Error updating profile:", error)
      const errorMessage = error.response?.data?.error?.message || error.message || t("Erreur lors de la mise à jour du profil", "Error updating profile")
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddSpecialties = async () => {
    if (selectedSpecialties.length === 0) {
      setError(t("Veuillez sélectionner au moins une spécialité", "Please select at least one specialty"))
      return
    }

    // Filter out specialties that already exist
    const newSpecialties = selectedSpecialties.filter(
      spec => !profile.specialties.includes(spec)
    )

    if (newSpecialties.length === 0) {
      setError(t("Toutes les spécialités sélectionnées sont déjà ajoutées", "All selected specialties are already added"))
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      // Add new specialties to existing list
      const updatedSpecialties = [...profile.specialties, ...newSpecialties]

      const profileData = {
        specialties: updatedSpecialties
      }

      console.log('💾 Adding specialties:', newSpecialties)
      
      const response = await apiClient.put('/manager/marketplace/profile', profileData)

      if (response.success) {
        setProfile(prev => ({ ...prev, specialties: updatedSpecialties }))
        setSelectedSpecialties([])
        setShowAddSpecialtyDialog(false)
        setShowSuccessMessage(true)
        toast.success(t("Spécialités ajoutées avec succès", "Specialties added successfully"))
        setTimeout(() => setShowSuccessMessage(false), 5000)
      } else {
        const errorMsg = t("Erreur lors de l'ajout des spécialités", "Error adding specialties")
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error("Error adding specialties:", error)
      const errorMessage = error.response?.data?.error?.message || error.message || t("Erreur lors de l'ajout des spécialités", "Error adding specialties")
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    )
  }

  const handleRemoveSpecialty = async (specialtyToRemove: string) => {
    try {
      setIsSaving(true)
      setError(null)

      // Remove specialty from list
      const updatedSpecialties = profile.specialties.filter(s => s !== specialtyToRemove)

      const profileData = {
        specialties: updatedSpecialties
      }

      console.log('💾 Removing specialty:', specialtyToRemove)
      
      const response = await apiClient.put('/manager/marketplace/profile', profileData)

      if (response.success) {
        setProfile(prev => ({ ...prev, specialties: updatedSpecialties }))
        setShowSuccessMessage(true)
        toast.success(t("Spécialité supprimée avec succès", "Specialty removed successfully"))
        setTimeout(() => setShowSuccessMessage(false), 5000)
      } else {
        const errorMsg = t("Erreur lors de la suppression de la spécialité", "Error removing specialty")
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error("Error removing specialty:", error)
      const errorMessage = error.response?.data?.error?.message || error.message || t("Erreur lors de la suppression de la spécialité", "Error removing specialty")
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle subjects (sujets) - similar to specialties
  const handleAddSubjects = async () => {
    if (selectedSubjects.length === 0) {
      setError(t("Veuillez sélectionner au moins un sujet", "Please select at least one subject"))
      return
    }

    const newSubjects = selectedSubjects.filter(
      subject => !profile.subjects?.includes(subject)
    )

    if (newSubjects.length === 0) {
      setError(t("Tous les sujets sélectionnés sont déjà ajoutés", "All selected subjects are already added"))
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const updatedSubjects = [...(profile.subjects || []), ...newSubjects]
      const profileData = { subjects: updatedSubjects }

      console.log('💾 Adding subjects:', newSubjects)
      
      const response = await apiClient.put('/manager/marketplace/profile', profileData)

      if (response.success) {
        setProfile(prev => ({ ...prev, subjects: updatedSubjects }))
        setSelectedSubjects([])
        setShowAddSubjectDialog(false)
        toast.success(t("Sujets ajoutés avec succès", "Subjects added successfully"))
      } else {
        const errorMsg = t("Erreur lors de l'ajout des sujets", "Error adding subjects")
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error("Error adding subjects:", error)
      const errorMessage = error.response?.data?.error?.message || error.message || t("Erreur lors de l'ajout des sujets", "Error adding subjects")
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    )
  }

  const handleRemoveSubject = async (subjectToRemove: string) => {
    try {
      setIsSaving(true)
      setError(null)

      const updatedSubjects = (profile.subjects || []).filter(s => s !== subjectToRemove)
      const profileData = { subjects: updatedSubjects }

      console.log('💾 Removing subject:', subjectToRemove)
      
      const response = await apiClient.put('/manager/marketplace/profile', profileData)

      if (response.success) {
        setProfile(prev => ({ ...prev, subjects: updatedSubjects }))
        toast.success(t("Sujet supprimé avec succès", "Subject removed successfully"))
      } else {
        const errorMsg = t("Erreur lors de la suppression du sujet", "Error removing subject")
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error("Error removing subject:", error)
      const errorMessage = error.response?.data?.error?.message || error.message || t("Erreur lors de la suppression du sujet", "Error removing subject")
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle working time (disponibilité)
  const handleAddAvailabilities = async () => {
    if (selectedAvailabilities.length === 0) {
      setError(t("Veuillez sélectionner au moins une disponibilité", "Please select at least one availability"))
      return
    }

    const newAvailabilities = selectedAvailabilities.filter(
      avail => !profile.availability.includes(avail)
    )

    if (newAvailabilities.length === 0) {
      setError(t("Toutes les disponibilités sélectionnées sont déjà ajoutées", "All selected availabilities are already added"))
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const updatedAvailabilities = [...profile.availability, ...newAvailabilities]
      const profileData = { availability: updatedAvailabilities }

      console.log('💾 Adding availabilities:', newAvailabilities)
      
      const response = await apiClient.put('/manager/marketplace/profile', profileData)

      if (response.success) {
        setProfile(prev => ({ ...prev, availability: updatedAvailabilities }))
        setSelectedAvailabilities([])
        setShowAddAvailabilityDialog(false)
        toast.success(t("Disponibilités ajoutées avec succès", "Availabilities added successfully"))
      } else {
        const errorMsg = t("Erreur lors de l'ajout des disponibilités", "Error adding availabilities")
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error("Error adding availabilities:", error)
      const errorMessage = error.response?.data?.error?.message || error.message || t("Erreur lors de l'ajout des disponibilités", "Error adding availabilities")
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleAvailability = (availability: string) => {
    setSelectedAvailabilities(prev => 
      prev.includes(availability)
        ? prev.filter(a => a !== availability)
        : [...prev, availability]
    )
  }

  const handleRemoveAvailability = async (availabilityToRemove: string) => {
    try {
      setIsSaving(true)
      setError(null)

      const updatedAvailabilities = profile.availability.filter(a => a !== availabilityToRemove)
      const profileData = { availability: updatedAvailabilities }

      console.log('💾 Removing availability:', availabilityToRemove)
      
      const response = await apiClient.put('/manager/marketplace/profile', profileData)

      if (response.success) {
        setProfile(prev => ({ ...prev, availability: updatedAvailabilities }))
        toast.success(t("Disponibilité supprimée avec succès", "Availability removed successfully"))
      } else {
        const errorMsg = t("Erreur lors de la suppression de la disponibilité", "Error removing availability")
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error("Error removing availability:", error)
      const errorMessage = error.response?.data?.error?.message || error.message || t("Erreur lors de la suppression de la disponibilité", "Error removing availability")
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle working hours (specific time slots)
  const handleAddWorkingHours = async () => {
    if (!selectedDay || !workingHoursStart || !workingHoursEnd) {
      setError(t("Veuillez remplir tous les champs", "Please fill all fields"))
      return
    }

    if (workingHoursStart >= workingHoursEnd) {
      setError(t("L'heure de début doit être avant l'heure de fin", "Start time must be before end time"))
      return
    }

    const timeSlot = `${selectedDay}: ${workingHoursStart}-${workingHoursEnd}`
    
    // Check if this exact time slot already exists
    if (profile.workingHours?.includes(timeSlot)) {
      setError(t("Ce créneau horaire existe déjà", "This time slot already exists"))
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const updatedWorkingHours = [...(profile.workingHours || []), timeSlot]
      const profileData = { workingHours: updatedWorkingHours }

      console.log('💾 Adding working hours:', timeSlot)
      
      const response = await apiClient.put('/manager/marketplace/profile', profileData)

      if (response.success) {
        setProfile(prev => ({ ...prev, workingHours: updatedWorkingHours }))
        setWorkingHoursStart("09:00")
        setWorkingHoursEnd("17:00")
        setSelectedDay("")
        setShowAddWorkingHoursDialog(false)
        toast.success(t("Créneau horaire ajouté avec succès", "Time slot added successfully"))
      } else {
        const errorMsg = t("Erreur lors de l'ajout du créneau horaire", "Error adding time slot")
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error("Error adding working hours:", error)
      const errorMessage = error.response?.data?.error?.message || error.message || t("Erreur lors de l'ajout du créneau horaire", "Error adding time slot")
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveWorkingHours = async (timeSlotToRemove: string) => {
    try {
      setIsSaving(true)
      setError(null)

      const updatedWorkingHours = (profile.workingHours || []).filter((slot: string) => slot !== timeSlotToRemove)
      const profileData = { workingHours: updatedWorkingHours }

      console.log('💾 Removing working hours:', timeSlotToRemove)
      
      const response = await apiClient.put('/manager/marketplace/profile', profileData)

      if (response.success) {
        setProfile(prev => ({ ...prev, workingHours: updatedWorkingHours }))
        toast.success(t("Créneau horaire supprimé avec succès", "Time slot removed successfully"))
      } else {
        const errorMsg = t("Erreur lors de la suppression du créneau horaire", "Error removing time slot")
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error("Error removing working hours:", error)
      const errorMessage = error.response?.data?.error?.message || error.message || t("Erreur lors de la suppression du créneau horaire", "Error removing time slot")
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'profile')

      const response = await apiClient.post('/manager/marketplace/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.success) {
        // The response structure from FileUploadController returns { file: { url, ... } }
        const responseData = response.data as any
        console.log('📷 Image upload response:', responseData)
        
        // Get image URL from response - check multiple possible structures
        let imageUrl = responseData?.file?.url || responseData?.file?.fileUrl || responseData?.imageUrl || responseData?.url
        
        // ALWAYS normalize to absolute backend URL - backend serves files at http://localhost:3001/uploads/
        if (imageUrl && !imageUrl.startsWith('http')) {
          if (imageUrl.startsWith('/uploads')) {
            imageUrl = `http://localhost:3001${imageUrl}`
          } else if (imageUrl.startsWith('/')) {
            imageUrl = `http://localhost:3001${imageUrl}`
          } else {
            imageUrl = `http://localhost:3001/uploads/${imageUrl}`
          }
        }
        
        console.log('📷 Final image URL:', imageUrl)
        
        if (imageUrl) {
          // Save the absolute URL to backend profile permanently
          try {
            await apiClient.put('/users/profile', {
              profileImage: imageUrl
            })
            console.log('✅ Profile image URL saved to backend')
          } catch (saveError) {
            console.warn('⚠️ Failed to save profile image URL:', saveError)
          }
          
          // Update profile immediately with new image URL
          setProfile(prev => ({ ...prev, profileImage: imageUrl }))
        setShowSuccessMessage(true)
          toast.success(t("Photo de profil mise à jour avec succès", "Profile picture updated successfully"))
        setTimeout(() => setShowSuccessMessage(false), 5000)
          
          // Also reload profile to ensure consistency
          setTimeout(async () => {
            try {
              const profileResponse = await apiClient.get('/manager/marketplace/profile')
              if (profileResponse.success && profileResponse.data) {
                const profileData = profileResponse.data as any
                const profileImageUrl = profileData.profilePicture || profileData.profileImage
                if (profileImageUrl) {
                  // Normalize URL to absolute backend URL
                  let finalUrl = profileImageUrl
                  if (profileImageUrl && !profileImageUrl.startsWith('http')) {
                    if (profileImageUrl.startsWith('/uploads')) {
                      finalUrl = `http://localhost:3001${profileImageUrl}`
                    } else if (profileImageUrl.startsWith('/')) {
                      finalUrl = `http://localhost:3001${profileImageUrl}`
      } else {
                      finalUrl = `http://localhost:3001/uploads/${profileImageUrl}`
                    }
                  }
                  setProfile(prev => ({ ...prev, profileImage: finalUrl }))
                }
      }
    } catch (error) {
              console.error('Error reloading profile after image upload:', error)
            }
          }, 1000)
        } else {
          // Try to get the updated profile to fetch the new image URL
          console.log('📷 No image URL in response, fetching profile...')
          const profileResponse = await apiClient.get('/manager/marketplace/profile')
          if (profileResponse.success && profileResponse.data) {
            const profileData = profileResponse.data as any
            console.log('📷 Profile data:', profileData)
            const profileImageUrl = profileData.profilePicture || profileData.profileImage
            if (profileImageUrl) {
              // Same URL handling
              let finalUrl = profileImageUrl
              if (profileImageUrl.startsWith('/uploads')) {
                const apiUrl = typeof window !== 'undefined'
                  ? (window as any).__NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
                  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
                const backendUrl = apiUrl.replace('/api', '') // Remove /api to get base URL
                finalUrl = `${backendUrl}${profileImageUrl}`
              }
              setProfile(prev => ({ ...prev, profileImage: finalUrl }))
              toast.success(t("Photo de profil mise à jour avec succès", "Profile picture updated successfully"))
            } else {
              toast.success(t("Image téléchargée avec succès", "Image uploaded successfully"))
            }
          } else {
            toast.success(t("Image téléchargée avec succès", "Image uploaded successfully"))
          }
        }
      } else {
        const errorMsg = t("Erreur lors du téléchargement de l'image", "Error uploading image")
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error("Error uploading image:", error)
      const errorMsg = error.response?.data?.error?.message || error.message || t("Erreur lors du téléchargement de l'image", "Error uploading image")
      setError(errorMsg)
      toast.error(errorMsg)
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
              <button
                onClick={() => setActiveTab('sessionRequests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sessionRequests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2 inline" />
                {t("Demandes de Session 1-on-1", "One-on-one Session Requests")}
                {sessionRequests.length > 0 && (
                  <Badge className="ml-2 bg-green-600 text-white">
                    {sessionRequests.filter(r => r.status === 'pending').length}
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
                  
                  {!isProfileActive ? (
                    <Button
                      onClick={handleActivateProfile}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t("Activer mon profil marketplace", "Activate my marketplace profile")}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleActivateProfile}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t("Désactiver mon profil marketplace", "Deactivate my marketplace profile")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Information */}
            {isProfileActive && (
              <div className="space-y-6">
                {/* Profile Picture and Basic Information Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Profile Picture Upload */}
                  <Card className="bg-white dark:bg-gray-800 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Camera className="w-5 h-5" />
                        <span>{t("Photo de profil", "Profile Picture")}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col items-center space-y-4">
                        <Avatar className="w-24 h-24">
                          <AvatarImage 
                            src={profile.profileImage || undefined} 
                            alt={profile.name}
                            onError={(e) => {
                              // Hide image on error, fallback will show
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white text-2xl font-bold">
                            {profile.name.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="w-full">
                          <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                            <div className="flex flex-col items-center space-y-1">
                              <Camera className="w-5 h-5 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {t("Télécharger une photo", "Upload photo")}
                              </span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfileImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

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

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={() => handleProfileUpdate(profile)}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t("Enregistrement...", "Saving...")}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {t("Sauvegarder", "Save")}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </div>

                {/* Stats and Specialties - Horizontally Aligned */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          {profile.specialties && profile.specialties.length > 0 ? (
                            profile.specialties.map((specialty: string, index: number) => (
                              <Badge 
                                key={index} 
                                variant="outline"
                                className="flex items-center gap-1 group"
                              >
                                {specialty}
                                <button
                                  onClick={() => handleRemoveSpecialty(specialty)}
                                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  disabled={isSaving}
                                >
                                  <X className="w-3 h-3 text-red-500 hover:text-red-700" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t("Aucune spécialité ajoutée", "No specialties added")}
                            </p>
                          )}
                        </div>
                        <Dialog open={showAddSpecialtyDialog} onOpenChange={setShowAddSpecialtyDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="w-full">
                              <Plus className="w-4 h-4 mr-2" />
                              {t("Ajouter une spécialité", "Add Specialty")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{t("Ajouter une spécialité", "Add Specialty")}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">
                                  {t("Sélectionner les spécialités", "Select Specialties")}
                                </Label>
                                <div className="space-y-2">
                                  {availableSpecialties.map((specialty) => {
                                    const isSelected = selectedSpecialties.includes(specialty)
                                    const alreadyAdded = profile.specialties.includes(specialty)
                                    return (
                                      <div
                                        key={specialty}
                                        onClick={() => !alreadyAdded && handleToggleSpecialty(specialty)}
                                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                                          alreadyAdded
                                            ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50'
                                            : isSelected
                                            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-500'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                          isSelected 
                                            ? 'bg-blue-600 border-blue-600' 
                                            : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                          {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="font-medium">{specialty}</span>
                                        {alreadyAdded && (
                                          <Badge variant="outline" className="ml-auto text-xs">
                                            {t("Déjà ajouté", "Already added")}
                                          </Badge>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowAddSpecialtyDialog(false)
                                    setSelectedSpecialties([])
                                  }}
                                >
                                  {t("Annuler", "Cancel")}
                                </Button>
                                <Button
                                  onClick={handleAddSpecialties}
                                  disabled={selectedSpecialties.length === 0 || isSaving}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      {t("Ajout...", "Adding...")}
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-4 h-4 mr-2" />
                                      {t("Ajouter", "Add")}
                            </>
                          )}
                                </Button>
                        </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subjects (Sujets) */}
                  <Card className="bg-white dark:bg-gray-800 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5" />
                        <span>{t("Sujets", "Subjects")}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {profile.subjects && profile.subjects.length > 0 ? (
                            profile.subjects.map((subject: string, index: number) => (
                              <Badge 
                                key={index} 
                                variant="outline"
                                className="flex items-center gap-1 group"
                              >
                                {subject}
                                <button
                                  onClick={() => handleRemoveSubject(subject)}
                                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  disabled={isSaving}
                                >
                                  <X className="w-3 h-3 text-red-500 hover:text-red-700" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t("Aucun sujet ajouté", "No subjects added")}
                            </p>
                          )}
                        </div>
                        <Dialog open={showAddSubjectDialog} onOpenChange={setShowAddSubjectDialog}>
                          <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                              {t("Ajouter un sujet", "Add Subject")}
                        </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{t("Ajouter des sujets", "Add Subjects")}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">
                                  {t("Sélectionner les sujets", "Select Subjects")}
                                </Label>
                                <div className="space-y-2">
                                  {availableSubjects.map((subject) => {
                                    const isSelected = selectedSubjects.includes(subject)
                                    const alreadyAdded = profile.subjects?.includes(subject)
                                    return (
                                      <div
                                        key={subject}
                                        onClick={() => !alreadyAdded && handleToggleSubject(subject)}
                                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                                          alreadyAdded
                                            ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50'
                                            : isSelected
                                            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-500'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                          isSelected 
                                            ? 'bg-blue-600 border-blue-600' 
                                            : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                          {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="font-medium">{subject}</span>
                                        {alreadyAdded && (
                                          <Badge variant="outline" className="ml-auto text-xs">
                                            {t("Déjà ajouté", "Already added")}
                                          </Badge>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowAddSubjectDialog(false)
                                    setSelectedSubjects([])
                                  }}
                                >
                                  {t("Annuler", "Cancel")}
                                </Button>
                                <Button
                                  onClick={handleAddSubjects}
                                  disabled={selectedSubjects.length === 0 || isSaving}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      {t("Ajout...", "Adding...")}
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-4 h-4 mr-2" />
                                      {t("Ajouter", "Add")}
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Message Acceptance Card - Add after Créneaux horaires */}
                  
                  {/* Working Time (Disponibilité) */}
                  <Card className="bg-white dark:bg-gray-800 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="w-5 h-5" />
                        <span>{t("Disponibilité", "Availability")}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {profile.availability && profile.availability.length > 0 ? (
                            profile.availability.map((avail: string, index: number) => (
                              <Badge 
                                key={index} 
                                variant="outline"
                                className="flex items-center gap-1 group"
                              >
                                {avail}
                                <button
                                  onClick={() => handleRemoveAvailability(avail)}
                                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  disabled={isSaving}
                                >
                                  <X className="w-3 h-3 text-red-500 hover:text-red-700" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t("Aucune disponibilité ajoutée", "No availability added")}
                            </p>
                          )}
                </div>
                        <Dialog open={showAddAvailabilityDialog} onOpenChange={setShowAddAvailabilityDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="w-full">
                              <Plus className="w-4 h-4 mr-2" />
                              {t("Ajouter une disponibilité", "Add Availability")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{t("Ajouter des disponibilités", "Add Availabilities")}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">
                                  {t("Sélectionner les disponibilités", "Select Availabilities")}
                                </Label>
                                <div className="space-y-2">
                                  {availableAvailabilities.map((availability) => {
                                    const isSelected = selectedAvailabilities.includes(availability)
                                    const alreadyAdded = profile.availability.includes(availability)
                                    return (
                                      <div
                                        key={availability}
                                        onClick={() => !alreadyAdded && handleToggleAvailability(availability)}
                                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                                          alreadyAdded
                                            ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50'
                                            : isSelected
                                            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-500'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                          isSelected 
                                            ? 'bg-blue-600 border-blue-600' 
                                            : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                          {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
                                        <span className="font-medium">{availability}</span>
                                        {alreadyAdded && (
                                          <Badge variant="outline" className="ml-auto text-xs">
                                            {t("Déjà ajouté", "Already added")}
                                          </Badge>
            )}
          </div>
                                    )
                                  })}
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowAddAvailabilityDialog(false)
                                    setSelectedAvailabilities([])
                                  }}
                                >
                                  {t("Annuler", "Cancel")}
                                </Button>
                                <Button
                                  onClick={handleAddAvailabilities}
                                  disabled={selectedAvailabilities.length === 0 || isSaving}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      {t("Ajout...", "Adding...")}
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-4 h-4 mr-2" />
                                      {t("Ajouter", "Add")}
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Working Hours (Specific Time Slots) */}
                  <Card className="bg-white dark:bg-gray-800 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="w-5 h-5" />
                        <span>{t("Créneaux horaires", "Working Hours")}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {t("Définissez vos heures de disponibilité spécifiques (ex: Lundi: 09:00-12:00)", "Define your specific available hours (e.g., Monday: 09:00-12:00)")}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {profile.workingHours && profile.workingHours.length > 0 ? (
                            profile.workingHours.map((timeSlot: string, index: number) => (
                              <Badge 
                                key={index} 
                                variant="outline"
                                className="flex items-center gap-1 group bg-blue-50 dark:bg-blue-950/20 border-blue-200"
                              >
                                <Clock className="w-3 h-3" />
                                {timeSlot}
                                <button
                                  onClick={() => handleRemoveWorkingHours(timeSlot)}
                                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  disabled={isSaving}
                                >
                                  <X className="w-3 h-3 text-red-500 hover:text-red-700" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t("Aucun créneau horaire défini", "No working hours defined")}
                            </p>
                          )}
                        </div>
                        <Dialog open={showAddWorkingHoursDialog} onOpenChange={setShowAddWorkingHoursDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="w-full">
                              <Plus className="w-4 h-4 mr-2" />
                              {t("Ajouter un créneau horaire", "Add Working Hours")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{t("Ajouter un créneau horaire", "Add Working Hours")}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">
                                  {t("Jour", "Day")} *
                                </Label>
                                <select
                                  value={selectedDay}
                                  onChange={(e) => setSelectedDay(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">{t("Sélectionner un jour", "Select a day")}</option>
                                  {daysOfWeek.map((day) => (
                                    <option key={day.value} value={day.value}>
                                      {day.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium mb-2 block">
                                    {t("Heure de début", "Start Time")} *
                                  </Label>
                                  <Input
                                    type="time"
                                    value={workingHoursStart}
                                    onChange={(e) => setWorkingHoursStart(e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium mb-2 block">
                                    {t("Heure de fin", "End Time")} *
                                  </Label>
                                  <Input
                                    type="time"
                                    value={workingHoursEnd}
                                    onChange={(e) => setWorkingHoursEnd(e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowAddWorkingHoursDialog(false)
                                    setSelectedDay("")
                                    setWorkingHoursStart("09:00")
                                    setWorkingHoursEnd("17:00")
                                  }}
                                >
                                  {t("Annuler", "Cancel")}
                                </Button>
                                <Button
                                  onClick={handleAddWorkingHours}
                                  disabled={!selectedDay || !workingHoursStart || !workingHoursEnd || isSaving}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      {t("Ajout...", "Adding...")}
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-4 h-4 mr-2" />
                                      {t("Ajouter", "Add")}
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Message Acceptance Card - In Créneaux horaires section */}
                  <Card className="bg-white dark:bg-gray-800 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MessageCircle className="w-5 h-5" />
                        <span>{t("Accepter les messages des élèves", "Accept messages from students")}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("Autorisez les étudiants à vous envoyer des messages via la marketplace et la page Avantages Pro. Les étudiants pourront vous contacter pour des questions ou des demandes de session.", "Allow students to send you messages via the marketplace and Avantages Pro page. Students will be able to contact you for questions or session requests.")}
                        </p>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-3">
                            <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {t("Statut", "Status")}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {profile.acceptsMessages === true
                                  ? t("Les étudiants peuvent vous envoyer des messages", "Students can send you messages")
                                  : t("Les messages des étudiants sont désactivés", "Student messages are disabled")
                                }
                              </p>
                            </div>
                          </div>
                          {/* Toggle Switch for Message Acceptance */}
                          <div className="flex items-center gap-3">
                            <div className="relative inline-flex items-center">
                              <button
                                type="button"
                                onClick={async () => {
                                  // Get current value - explicitly check if it's true (enabled)
                                  const currentValue = profile.acceptsMessages === true
                                  const newValue = !currentValue // Toggle: true -> false, false -> true
                                  
                                  console.log('🔄 Toggling acceptsMessages:', {
                                    currentValue,
                                    newValue,
                                    currentState: profile.acceptsMessages
                                  })
                                  
                                  try {
                                    setIsSaving(true)
                                    // Optimistically update UI first
                                    setProfile(prev => ({ ...prev, acceptsMessages: newValue }))
                                    
                                    // Use handleProfileUpdate to ensure proper update flow
                                    await handleProfileUpdate({ acceptsMessages: newValue })
                                    toast.success(
                                      newValue 
                                        ? t("Messages activés avec succès", "Messages enabled successfully")
                                        : t("Messages désactivés avec succès", "Messages disabled successfully")
                                    )
                                    // Reload profile to ensure consistency
                                    const profileResponse = await apiClient.get('/manager/marketplace/profile')
                                    if (profileResponse.success && profileResponse.data) {
                                      const profileData = profileResponse.data as any
                                      // Explicitly set acceptsMessages - check if it's true or false
                                      const acceptsMessagesValue = profileData.acceptsMessages === true
                                      console.log('✅ Profile reloaded:', {
                                        acceptsMessages: profileData.acceptsMessages,
                                        acceptsMessagesValue
                                      })
                                      setProfile(prev => ({ ...prev, acceptsMessages: acceptsMessagesValue }))
                                    }
                                  } catch (error: any) {
                                    // Revert optimistic update on error
                                    console.error('❌ Error updating acceptsMessages:', error)
                                    setProfile(prev => ({ ...prev, acceptsMessages: currentValue }))
                                    toast.error(t("Erreur lors de la mise à jour", "Error updating"))
                                  } finally {
                                    setIsSaving(false)
                                  }
                                }}
                                disabled={isSaving}
                                className={`
                                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#06f957] focus:ring-offset-2
                                  ${profile.acceptsMessages === true 
                                    ? 'bg-[#06f957]' 
                                    : 'bg-gray-300 dark:bg-gray-600'
                                  }
                                  ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                                role="switch"
                                aria-checked={profile.acceptsMessages === true}
                                aria-label={profile.acceptsMessages === true 
                                  ? t("Désactiver les messages", "Disable messages")
                                  : t("Activer les messages", "Enable messages")
                                }
                              >
                                <span
                                  className={`
                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                    ${profile.acceptsMessages === true ? 'translate-x-6' : 'translate-x-1'}
                                  `}
                                />
                              </button>
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {isSaving ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  {t("Chargement...", "Loading...")}
                                </span>
                              ) : profile.acceptsMessages === true ? (
                                <span className="text-green-600 dark:text-green-400 font-semibold">
                                  {t("Activé", "ON")}
                                </span>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400 font-semibold">
                                  {t("Désactivé", "OFF")}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
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
                          <div className="flex items-center gap-2">
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm(t("Êtes-vous sûr de vouloir supprimer cette demande ?", "Are you sure you want to delete this request?"))) {
                                  handleDeleteRequest(request.id)
                                }
                              }}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              title={t("Supprimer", "Delete")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Session Requests Tab */}
        {activeTab === 'sessionRequests' && (
          <div className="space-y-6">
            {/* Session Requests Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t("Demandes de Session 1-on-1", "One-on-one Session Requests")}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t("Les étudiants Pro+ peuvent demander des sessions individuelles avec vous. Vous pouvez accepter, planifier, appeler directement ou refuser.", "Pro+ students can request individual sessions with you. You can accept, schedule, call directly, or decline.")}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {sessionRequests.filter(r => r.status === 'pending').length} {t("en attente", "pending")}
              </Badge>
            </div>

            {/* Session Requests List */}
            {sessionRequests.length === 0 ? (
              <Card className="bg-white dark:bg-gray-800 shadow-sm">
                <CardContent className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t("Aucune demande de session", "No Session Requests")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t("Aucune demande de session 1-on-1 pour le moment. Les étudiants Pro+ apparaîtront ici lorsqu'ils demanderont une session.", "No one-on-one session requests at the moment. Pro+ students will appear here when they request a session.")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sessionRequests.map((request) => (
                  <Card key={request.id} className="bg-white dark:bg-gray-800 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
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
                                {request.studentLevel || 'Pro+'}
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
                                <span>{new Date(request.requestedDate || request.createdAt).toLocaleDateString()}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(request.createdAt).toLocaleString()}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {request.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Redirect to messages with student
                                    router.push(`/manager/messages?contact=${request.studentId}`)
                                  }}
                                  className="border-blue-200 hover:bg-blue-50"
                                  title={t("Message", "Message")}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Schedule session - open calendar/scheduler
                                    toast.info(t("Fonctionnalité de planification à venir", "Scheduling feature coming soon"))
                                  }}
                                  className="border-green-200 hover:bg-green-50"
                                  title={t("Planifier", "Schedule")}
                                >
                                  <Calendar className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Initiate call
                                    toast.info(t("Fonctionnalité d'appel à venir", "Call feature coming soon"))
                                  }}
                                  className="border-purple-200 hover:bg-purple-50"
                                  title={t("Appeler", "Call")}
                                >
                                  <PhoneCall className="w-4 h-4" />
                                </Button>
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
                            {request.status === 'accepted' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/manager/messages?contact=${request.studentId}`)}
                                  className="border-blue-200 hover:bg-blue-50"
                                >
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  {t("Message", "Message")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toast.info(t("Fonctionnalité à venir", "Feature coming soon"))}
                                  className="border-purple-200 hover:bg-purple-50"
                                >
                                  <PhoneCall className="w-4 h-4 mr-1" />
                                  {t("Appeler", "Call")}
                                </Button>
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm(t("Êtes-vous sûr de vouloir supprimer cette demande ?", "Are you sure you want to delete this request?"))) {
                                  handleDeleteRequest(request.id)
                                }
                              }}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              title={t("Supprimer", "Delete")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

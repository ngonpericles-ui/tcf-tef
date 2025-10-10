"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  Video,
  Users,
  Edit,
  Save,
  Camera,
  Crown,
  Star,
  Clock,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ManagerRole {
  role: "junior" | "content" | "senior"
  name: string
  email: string
  phone: string
  location: string
  joinDate: string
  bio: string
  avatar: string
  permissions: {
    createCourses: boolean
    createTests: boolean
    hostLiveSessions: boolean
    moderateContent: boolean
    manageUsers: boolean
    viewAnalytics: boolean
    exportData: boolean
  }
  levelRestrictions: string[]
  subscriptionRestrictions: string[]
  stats: {
    coursesCreated: number
    testsCreated: number
    liveSessionsHosted: number
    studentsManaged: number
    averageRating: number
    totalHours: number
  }
  achievements: Array<{
    id: string
    title: string
    description: string
    icon: string
    earnedDate: string
    color: string
  }>
  specialties: string[]
  certifications: Array<{
    name: string
    issuer: string
    date: string
    level: string
  }>
}

export default function ManagerProfilePage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [currentManager, setCurrentManager] = useState<ManagerRole | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Partial<ManagerRole>>({})

  useEffect(() => {
    const fetchManagerProfile = async () => {
      try {
        if (!user) return

        // Get manager profile from backend
        const response = await apiClient.get('/users/profile')

        if (response.success && response.data) {
          const profileData = response.data.user
          const managerProfile: ManagerRole = {
            role: user.role === 'SENIOR_MANAGER' ? 'senior' :
                  user.role === 'JUNIOR_MANAGER' ? 'junior' : 'junior',
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'Manager',
            email: user.email || '',
            phone: profileData.phone || '',
            location: profileData.location || '',
            joinDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            bio: profileData.bio || '',
            avatar: profileData.avatar || "/placeholder.svg?height=120&width=120",
            permissions: {
              createCourses: true,
              createTests: user.role === 'SENIOR_MANAGER',
              hostLiveSessions: true,
              moderateContent: user.role === 'SENIOR_MANAGER',
              manageUsers: user.role === 'SENIOR_MANAGER',
              viewAnalytics: user.role === 'SENIOR_MANAGER',
              exportData: user.role === 'SENIOR_MANAGER',
            },
            levelRestrictions: profileData.levelRestrictions || (user.role === 'SENIOR_MANAGER' ? ["A1", "A2", "B1", "B2", "C1", "C2"] : ["A1", "A2", "B1"]),
            subscriptionRestrictions: profileData.subscriptionRestrictions || (user.role === 'SENIOR_MANAGER' ? ["FREE", "ESSENTIAL", "PREMIUM", "PRO"] : ["FREE", "ESSENTIAL"]),
            stats: {
              coursesCreated: profileData.stats?.coursesCreated || 0,
              testsCreated: profileData.stats?.testsCreated || 0,
              liveSessionsHosted: profileData.stats?.liveSessionsHosted || 0,
              studentsManaged: profileData.stats?.studentsManaged || 0,
              averageRating: profileData.stats?.averageRating || 0,
              totalHours: profileData.stats?.totalHours || 0,
            },
            achievements: profileData.achievements || [],
            specialties: profileData.specialties || [],
            certifications: profileData.certifications || [],
          }

          setCurrentManager(managerProfile)
          setEditedProfile(managerProfile)
        } else {
          // Fallback if API fails
          const fallbackProfile: ManagerRole = {
            role: user.role === 'SENIOR_MANAGER' ? 'senior' : 'junior',
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'Manager',
            email: user.email || '',
            phone: '',
            location: '',
            joinDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            bio: '',
            avatar: "/placeholder.svg?height=120&width=120",
            permissions: {
              createCourses: true,
              createTests: user.role === 'SENIOR_MANAGER',
              hostLiveSessions: true,
              moderateContent: user.role === 'SENIOR_MANAGER',
              manageUsers: user.role === 'SENIOR_MANAGER',
              viewAnalytics: user.role === 'SENIOR_MANAGER',
              exportData: user.role === 'SENIOR_MANAGER',
            },
            levelRestrictions: user.role === 'SENIOR_MANAGER' ? ["A1", "A2", "B1", "B2", "C1", "C2"] : ["A1", "A2", "B1"],
            subscriptionRestrictions: user.role === 'SENIOR_MANAGER' ? ["FREE", "ESSENTIAL", "PREMIUM", "PRO"] : ["FREE", "ESSENTIAL"],
            stats: {
              coursesCreated: 0,
              testsCreated: 0,
              liveSessionsHosted: 0,
              studentsManaged: 0,
              averageRating: 0,
              totalHours: 0,
            },
            achievements: [],
            specialties: [],
            certifications: [],
          }

          setCurrentManager(fallbackProfile)
          setEditedProfile(fallbackProfile)
        }
      } catch (error) {
        console.error('Error fetching manager profile:', error)
        // Use fallback data if API fails
        const fallbackProfile: ManagerRole = {
          role: user?.role === 'SENIOR_MANAGER' ? 'senior' : 'junior',
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email?.split('@')[0] || 'Manager',
          email: user?.email || '',
          phone: '',
          location: '',
          joinDate: user?.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          bio: '',
          avatar: "/placeholder.svg?height=120&width=120",
          permissions: {
            createCourses: true,
            createTests: user?.role === 'SENIOR_MANAGER',
            hostLiveSessions: true,
            moderateContent: user?.role === 'SENIOR_MANAGER',
            manageUsers: user?.role === 'SENIOR_MANAGER',
            viewAnalytics: user?.role === 'SENIOR_MANAGER',
            exportData: user?.role === 'SENIOR_MANAGER',
          },
          levelRestrictions: user?.role === 'SENIOR_MANAGER' ? ["A1", "A2", "B1", "B2", "C1", "C2"] : ["A1", "A2", "B1"],
          subscriptionRestrictions: user?.role === 'SENIOR_MANAGER' ? ["FREE", "ESSENTIAL", "PREMIUM", "PRO"] : ["FREE", "ESSENTIAL"],
          stats: {
            coursesCreated: 0,
            testsCreated: 0,
            liveSessionsHosted: 0,
            studentsManaged: 0,
            averageRating: 0,
            totalHours: 0,
          },
          achievements: [],
          specialties: [],
          certifications: [],
        }

        setCurrentManager(fallbackProfile)
        setEditedProfile(fallbackProfile)
      }
    }

    if (user) {
      fetchManagerProfile()
    }
  }, [])

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "senior":
        return {
          label: t("Senior Manager", "Senior Manager"),
          icon: Crown,
          color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          gradient: "from-purple-500 to-pink-600",
        }
      case "content":
        return {
          label: t("Content Manager", "Content Manager"),
          icon: BookOpen,
          color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          gradient: "from-blue-500 to-cyan-600",
        }
      case "junior":
        return {
          label: t("Junior Manager", "Junior Manager"),
          icon: User,
          color: "bg-green-500/10 text-green-400 border-green-500/20",
          gradient: "from-green-500 to-emerald-600",
        }
      default:
        return {
          label: t("Manager", "Manager"),
          icon: User,
          color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
          gradient: "from-gray-500 to-gray-600",
        }
    }
  }

  const handleSave = () => {
    if (currentManager && editedProfile) {
      setCurrentManager({ ...currentManager, ...editedProfile })
      setIsEditing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (!currentManager) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const roleInfo = getRoleInfo(currentManager.role)
  const RoleIcon = roleInfo.icon

  return (
    <div className="min-h-screen p-6 bg-gray-950">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Profile Card */}
        <Card className="bg-gray-900 border-gray-800 overflow-hidden">
          <div className={cn("h-32 bg-gradient-to-r", roleInfo.gradient)} />
          <CardContent className="relative p-6">
            <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative -mt-16">
                <div className="w-24 h-24 rounded-full border-4 border-gray-900 overflow-hidden bg-gray-800">
                  <img
                    src={currentManager.avatar || "/placeholder.svg"}
                    alt={currentManager.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {isEditing && (
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 p-0"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    {isEditing ? (
                      <Input
                        value={editedProfile.name || ""}
                        onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                        className="text-2xl font-bold bg-gray-800 border-gray-700 text-white mb-2"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold text-white">{currentManager.name}</h1>
                    )}
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge variant="outline" className={cn("text-sm", roleInfo.color)}>
                        <RoleIcon className="w-4 h-4 mr-2" />
                        {roleInfo.label}
                      </Badge>
                      <div className="flex items-center text-yellow-400">
                        <Star className="w-4 h-4 mr-1" />
                        <span className="font-medium">{currentManager.stats.averageRating}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {currentManager.email}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {currentManager.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {t("Depuis", "Since")} {formatDate(currentManager.joinDate)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={() => setIsEditing(false)}
                          variant="outline"
                          className="border-gray-700 bg-transparent"
                        >
                          {t("Annuler", "Cancel")}
                        </Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Save className="w-4 h-4 mr-2" />
                          {t("Sauvegarder", "Save")}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Edit className="w-4 h-4 mr-2" />
                        {t("Modifier", "Edit")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Bio */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">{t("À propos", "About")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <textarea
                    value={editedProfile.bio || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white resize-none"
                  />
                ) : (
                  <p className="text-gray-300 leading-relaxed">{currentManager.bio}</p>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">{t("Informations de contact", "Contact Information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <Input
                      value={editedProfile.phone || ""}
                      onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  ) : (
                    <span className="text-gray-300">{currentManager.phone}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">{currentManager.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <Input
                      value={editedProfile.location || ""}
                      onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  ) : (
                    <span className="text-gray-300">{currentManager.location}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">{t("Permissions", "Permissions")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-gray-300 text-sm">{t("Niveaux autorisés", "Allowed Levels")}</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentManager.levelRestrictions.map((level) => (
                      <Badge key={level} variant="outline" className="text-xs bg-green-500/10 text-green-400">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">{t("Abonnements", "Subscriptions")}</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentManager.subscriptionRestrictions.map((sub) => (
                      <Badge key={sub} variant="outline" className="text-xs bg-blue-500/10 text-blue-400">
                        {sub}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column */}
          <div className="space-y-6">
            {/* Stats */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">{t("Statistiques", "Statistics")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                    <div className="text-2xl font-bold text-white">{currentManager.stats.coursesCreated}</div>
                    <div className="text-xs text-gray-400">{t("Cours créés", "Courses Created")}</div>
                  </div>
                  {currentManager.permissions.createTests && (
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <FileText className="w-6 h-6 mx-auto mb-2 text-green-400" />
                      <div className="text-2xl font-bold text-white">{currentManager.stats.testsCreated}</div>
                      <div className="text-xs text-gray-400">{t("Tests créés", "Tests Created")}</div>
                    </div>
                  )}
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <Video className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                    <div className="text-2xl font-bold text-white">{currentManager.stats.liveSessionsHosted}</div>
                    <div className="text-xs text-gray-400">{t("Sessions live", "Live Sessions")}</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <Users className="w-6 h-6 mx-auto mb-2 text-orange-400" />
                    <div className="text-2xl font-bold text-white">{currentManager.stats.studentsManaged}</div>
                    <div className="text-xs text-gray-400">{t("Étudiants", "Students")}</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg col-span-2">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-teal-400" />
                    <div className="text-2xl font-bold text-white">{currentManager.stats.totalHours}h</div>
                    <div className="text-xs text-gray-400">{t("Heures d'enseignement", "Teaching Hours")}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specialties */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">{t("Spécialités", "Specialties")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {currentManager.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">{t("Certifications", "Certifications")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentManager.certifications.map((cert, index) => (
                    <div key={index} className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-white">{cert.name}</h4>
                          <p className="text-sm text-gray-400">{cert.issuer}</p>
                          <p className="text-xs text-gray-500">{formatDate(cert.date)}</p>
                        </div>
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400">
                          {cert.level}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Achievements */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Award className="w-5 h-5 mr-2" />
                  {t("Réalisations", "Achievements")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentManager.achievements.map((achievement) => (
                    <div key={achievement.id} className="p-4 bg-gray-800/50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{achievement.title}</h4>
                          <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={cn("text-xs", achievement.color)}>
                              {formatDate(achievement.earnedDate)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">{t("Activité récente", "Recent Activity")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-2 bg-gray-800/50 rounded">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <div className="flex-1">
                      <p className="text-sm text-white">{t("Cours créé", "Course created")}</p>
                      <p className="text-xs text-gray-400">{t("Il y a 2 heures", "2 hours ago")}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 bg-gray-800/50 rounded">
                    <Video className="w-4 h-4 text-purple-400" />
                    <div className="flex-1">
                      <p className="text-sm text-white">{t("Session live terminée", "Live session completed")}</p>
                      <p className="text-xs text-gray-400">{t("Il y a 5 heures", "5 hours ago")}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 bg-gray-800/50 rounded">
                    <Users className="w-4 h-4 text-green-400" />
                    <div className="flex-1">
                      <p className="text-sm text-white">{t("Nouveaux étudiants", "New students")}</p>
                      <p className="text-xs text-gray-400">{t("Il y a 1 jour", "1 day ago")}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

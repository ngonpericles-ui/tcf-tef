"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BookOpen, 
  Edit, 
  Eye, 
  MoreHorizontal, 
  Calendar, 
  Clock, 
  Users, 
  Star,
  Settings,
  Check,
  X,
  Video
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface UnifiedCourse {
  id: string
  title: string
  description: string
  category: string
  contentType: string
  fileUrl?: string
  thumbnailUrl?: string
  duration: number // Duration in minutes (calculated from all lessons)
  totalVideoCount?: number // Total number of video lessons
  tags: string[]
  isPublished: boolean
  createdBy: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
  createdAt: string
  updatedAt: string
  // Unified levels and subscriptions
  levels: string[]
  subscriptions: string[]
}

interface UnifiedCourseCardProps {
  course: UnifiedCourse
  onUpdate: () => void
}

export default function UnifiedCourseCard({ course, onUpdate }: UnifiedCourseCardProps) {
  const { t } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedLevels, setSelectedLevels] = useState<string[]>(course.levels)
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>(course.subscriptions)
  const [saving, setSaving] = useState(false)

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const subscriptions = ['Gratuit', 'Essentiel', 'Premium', 'Pro+']

  const getStatusColor = (isPublished: boolean) => {
    if (isPublished) {
      return "bg-green-500/10 text-green-400 border-green-500/20"
    } else {
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "A1":
      case "A2":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "B1":
      case "B2":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "C1":
      case "C2":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case "Gratuit":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
      case "Essentiel":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "Premium":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      case "Pro+":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }

  const toggleSubscription = (subscription: string) => {
    setSelectedSubscriptions(prev => 
      prev.includes(subscription) 
        ? prev.filter(s => s !== subscription)
        : [...prev, subscription]
    )
  }

  const selectAllLevels = () => {
    setSelectedLevels(levels)
  }

  const clearAllLevels = () => {
    setSelectedLevels([])
  }

  const selectAllSubscriptions = () => {
    setSelectedSubscriptions(subscriptions)
  }

  const clearAllSubscriptions = () => {
    setSelectedSubscriptions([])
  }

  const handleSave = async () => {
    if (selectedLevels.length === 0 || selectedSubscriptions.length === 0) {
      toast.error(t("Veuillez sélectionner au moins un niveau et un abonnement", "Please select at least one level and one subscription"))
      return
    }

    setSaving(true)
    try {
      console.log('💾 Saving course:', course.id, { levels: selectedLevels, subscriptions: selectedSubscriptions })
      
      // Update course with new levels and subscriptions
      const response = await apiClient.put(`/content-management/${course.id}/levels-subscriptions`, {
        levels: selectedLevels,
        subscriptions: selectedSubscriptions
      })
      
      console.log('✅ Save response:', response)
      
      if (response.success) {
        toast.success(t("Cours mis à jour avec succès", "Course updated successfully"))
      setIsEditing(false)
        onUpdate() // Refresh the content list
      } else {
        throw new Error(response.error?.message || 'Failed to update course')
      }
    } catch (error: any) {
      console.error("❌ Error updating course:", error)
      const errorMessage = error?.response?.data?.error?.message || error?.message || t("Échec de la mise à jour du cours", "Failed to update course")
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setSelectedLevels(course.levels)
    setSelectedSubscriptions(course.subscriptions)
    setIsEditing(false)
  }

  return (
    <Card className="bg-card border-gray-200 dark:border-gray-700 hover:border-muted transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-foreground line-clamp-1">
                {course.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {course.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(course.isPublished)}>
              {course.isPublished ? t("Publié", "Published") : t("Brouillon", "Draft")}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  if (course.fileUrl) {
                    window.open(course.fileUrl, '_blank')
                  } else {
                    toast.error(t("Aucun fichier disponible", "No file available"))
                  }
                }}>
                  <Eye className="w-4 h-4 mr-2" />
                  {t("Voir", "View")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  {t("Modifier", "Edit")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Course Details */}
        <div className={`grid ${course.contentType === 'VIDEO' ? 'grid-cols-3' : 'grid-cols-1'} gap-4 text-sm`}>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {t("Créé le", "Created")}: {new Date(course.createdAt).toLocaleDateString()}
            </span>
          </div>
          {course.contentType === 'VIDEO' && (
            <>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                  {course.duration} {t("min", "min")} {t("durée", "duration")}
                </span>
              </div>
              {course.totalVideoCount !== undefined && (
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {course.totalVideoCount} {t("vidéo(s)", "video(s)")}
              </span>
            </div>
              )}
            </>
          )}
        </div>

        {/* Levels and Subscriptions */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-foreground">
              {t("Niveaux disponibles", "Available Levels")}
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {course.levels.map((level) => (
                <Badge key={level} className={getLevelColor(level)}>
                  {level}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground">
              {t("Abonnements éligibles", "Eligible Subscriptions")}
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {course.subscriptions.map((subscription) => (
                <Badge key={subscription} className={getSubscriptionColor(subscription)}>
                  {subscription}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Category and Type */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">{t("Catégorie", "Category")}:</span>
            <Badge variant="secondary">{course.category}</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">{t("Type", "Type")}:</span>
            <Badge variant="outline">{course.contentType}</Badge>
          </div>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>{t("Modifier les niveaux et abonnements", "Edit Levels and Subscriptions")}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Levels Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {t("Niveaux", "Levels")} ({selectedLevels.length})
                </Label>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={selectAllLevels}>
                    {t("Tout sélectionner", "Select All")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearAllLevels}>
                    {t("Tout désélectionner", "Clear All")}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {levels.map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`level-${level}`}
                      checked={selectedLevels.includes(level)}
                      onCheckedChange={() => toggleLevel(level)}
                    />
                    <Label htmlFor={`level-${level}`} className="text-sm">
                      {level}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscriptions Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {t("Abonnements", "Subscriptions")} ({selectedSubscriptions.length})
                </Label>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={selectAllSubscriptions}>
                    {t("Tout sélectionner", "Select All")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearAllSubscriptions}>
                    {t("Tout désélectionner", "Clear All")}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {subscriptions.map((subscription) => (
                  <div key={subscription} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subscription-${subscription}`}
                      checked={selectedSubscriptions.includes(subscription)}
                      onCheckedChange={() => toggleSubscription(subscription)}
                    />
                    <Label htmlFor={`subscription-${subscription}`} className="text-sm">
                      {subscription}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="w-4 h-4 mr-2" />
                {t("Annuler", "Cancel")}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t("Sauvegarde...", "Saving...")}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {t("Sauvegarder", "Save")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

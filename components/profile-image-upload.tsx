"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X, User } from "lucide-react"
import { useLang } from "@/components/language-provider"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface ProfileImageUploadProps {
  currentImage?: string
  onImageChange?: (imageUrl: string) => void
  userId?: string
  className?: string
}

export default function ProfileImageUpload({ 
  currentImage, 
  onImageChange, 
  userId,
  className = "" 
}: ProfileImageUploadProps) {
  const { t } = useLang()
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t("Veuillez sélectionner un fichier image", "Please select an image file"))
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("L'image doit faire moins de 5MB", "Image must be less than 5MB"))
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'profile-image')
      
      if (userId) {
        formData.append('userId', userId)
      }

      // Use unified upload endpoint for all users (admin/manager/student)
      const response = await apiClient.post('/users/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000 // 60 seconds for file uploads
      })

      // Handle response structure: {success: true, data: {file: {url: "..."}}}
      const fileData = (response as any)?.data?.file || (response as any)?.file
      const imageUrl = fileData?.url || (response as any)?.data?.url
      
      // Normalize to absolute backend URL
      let finalImageUrl = imageUrl
      if (imageUrl && !imageUrl.startsWith('http')) {
        if (imageUrl.startsWith('/uploads')) {
          finalImageUrl = `http://localhost:3001${imageUrl}`
        } else if (imageUrl.startsWith('/')) {
          finalImageUrl = `http://localhost:3001${imageUrl}`
        } else {
          finalImageUrl = `http://localhost:3001/uploads/${imageUrl}`
        }
      }

      if (response.success && finalImageUrl) {
        // Also save to backend profile permanently
        try {
          await apiClient.put('/users/profile', {
            profileImage: finalImageUrl
          })
        } catch (saveError) {
          console.warn('Failed to save profile image URL:', saveError)
        }
        
        onImageChange?.(finalImageUrl)
        toast.success(t("Image de profil mise à jour", "Profile image updated"))
      } else {
        throw new Error((response as any)?.error?.message || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(t("Erreur lors du téléchargement", "Upload error"))
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageChange?.('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const displayImage = previewUrl || currentImage

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative">
        <Avatar className="h-24 w-24">
          {displayImage ? (
            <AvatarImage src={displayImage} alt="Profile" />
          ) : null}
          <AvatarFallback className="text-lg">
            <User className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
          disabled={isUploading}
          className="flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>{t("Changer", "Change")}</span>
        </Button>

        {displayImage && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>{t("Supprimer", "Remove")}</span>
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground text-center">
        {t("JPG, PNG ou GIF. Max 5MB", "JPG, PNG or GIF. Max 5MB")}
      </p>
    </div>
  )
}

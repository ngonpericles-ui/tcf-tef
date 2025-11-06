"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/lib/api-client"
import { ArrowLeft, ImageIcon, Video, Smile, MapPin, Users, Globe, Lock, X, CheckCircle, AlertCircle } from "lucide-react"
import axios from "axios"
import { UploadProgressCard } from "@/components/upload-progress-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreatePostPageProps {
  role?: "admin" | "senior" | "content" | "junior"
}

export default function CreatePostPage({ role: propRole }: CreatePostPageProps = {}) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const [postContent, setPostContent] = useState("")
  const [postTitle, setPostTitle] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [privacy, setPrivacy] = useState("PUBLIC")
  const [isPosting, setIsPosting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState<{ fileId: string; progress: number; status: 'uploading' | 'completed' | 'error'; error?: string } | null>(null)

  // Determine current role
  const currentRole = propRole || "senior"

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedImages((prev) => [...prev, ...files].slice(0, 10)) // Max 10 images
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedVideo(file)
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeVideo = () => {
    setSelectedVideo(null)
  }

  const handlePost = async () => {
    if (!postContent.trim() && selectedImages.length === 0 && !selectedVideo) return

    setIsPosting(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      let mediaUrl: string | undefined = undefined

      // Upload images first if any
      if (selectedImages.length > 0 || selectedVideo) {
        try {
          const fileToUpload = selectedVideo || selectedImages[0]
          const fileId = Math.random().toString(36).substring(2, 11)
          
          // Initialize progress
          setUploadProgress({
            fileId,
            progress: 0,
            status: 'uploading'
          })

          const formData = new FormData()
          formData.append('files', fileToUpload)

          const apiUrl = typeof window !== 'undefined'
            ? (window as any).__NEXT_PUBLIC_API_URL__ || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
            : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

          const token = typeof window !== 'undefined'
            ? (localStorage.getItem('access_token') || 
               localStorage.getItem('tcf_tef_admin_session') ||
               localStorage.getItem('tcf_tef_session'))
            : null

          // Upload to post media endpoint with progress tracking
          const uploadResponse = await axios.post(`${apiUrl}/upload/post-media`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            timeout: 0, // No timeout
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total && progressEvent.total > 0) {
                const loaded = progressEvent.loaded || 0
                const total = progressEvent.total || 1
                const calculatedProgress = Math.min(Math.max(0, Math.round((loaded / total) * 100)), 99)
                
                setUploadProgress({
                  fileId,
                  progress: calculatedProgress,
                  status: 'uploading'
                })
              }
            }
          })

          // Update progress to completed
          setUploadProgress({
            fileId,
            progress: 100,
            status: 'completed'
          })

          if (uploadResponse.data?.success && uploadResponse.data.data?.files && uploadResponse.data.data.files.length > 0) {
            // Get the uploaded file URL
            const uploadedFile = uploadResponse.data.data.files[0]
            mediaUrl = uploadedFile.url || uploadedFile.path
            
            // If URL is relative, make it absolute
            if (mediaUrl && !mediaUrl.startsWith('http')) {
              if (mediaUrl.startsWith('/uploads')) {
                mediaUrl = `http://localhost:3001${mediaUrl}`
              } else {
                mediaUrl = `http://localhost:3001/uploads/${mediaUrl}`
              }
            }
          }
        } catch (uploadError: any) {
          console.error('Error uploading media:', uploadError)
          setUploadProgress({
            fileId: uploadProgress?.fileId || 'unknown',
            progress: 0,
            status: 'error',
            error: uploadError.response?.data?.error?.message || uploadError.message || 'Upload error'
          })
          // Continue with post creation even if upload fails
          setErrorMessage(t("Erreur lors de l'upload de l'image, mais le post sera créé", "Error uploading image, but post will be created"))
        }
      }

      // Create post data
      const postData = {
        title: postTitle || "Untitled Post",
        content: postContent,
        excerpt: postContent.substring(0, 200),
        media: mediaUrl, // Include uploaded media URL
        visibility: privacy as "PUBLIC" | "SUBSCRIBERS_ONLY" | "PRIVATE",
        status: "PUBLISHED", // Posts are published immediately
        category: "General",
        tags: [],
        level: "B1",
        targetTier: "FREE"
      }

      // Call backend API to create post
      const response = await apiClient.post("/posts", postData)

      if (response.success) {
        setSuccessMessage(t("Post créé avec succès!", "Post created successfully!"))

        // Clear form
        setPostContent("")
        setPostTitle("")
        setSelectedImages([])
        setSelectedVideo(null)
        setPrivacy("PUBLIC")

        // Redirect after 2 seconds
        setTimeout(() => {
          const redirectPath = currentRole === "admin" ? "/admin/feed" : "/manager/feed"
          router.push(redirectPath)
        }, 2000)
      } else {
        setErrorMessage(response.error?.message || t("Erreur lors de la création du post", "Error creating post"))
      }
    } catch (error: any) {
      console.error("Error creating post:", error)
      setErrorMessage(error.response?.data?.error?.message || error.message || t("Erreur lors de la création du post", "Error creating post"))
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-foreground hover:text-foreground hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("Retour", "Back")}
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("Créer un Post", "Create Post")}</h1>
          <p className="text-foreground">
            {t("Partagez du contenu avec la communauté", "Share content with the community")}
          </p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300">{successMessage}</span>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{errorMessage}</span>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress Card */}
      {uploadProgress && (selectedImages.length > 0 || selectedVideo) && (
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <ImageIcon className="w-5 h-5 mr-2" />
              {t("Progression du téléchargement", "Upload Progress")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UploadProgressCard
              upload={uploadProgress}
              file={{
                id: uploadProgress.fileId,
                file: selectedVideo || selectedImages[0],
                name: (selectedVideo || selectedImages[0])?.name || 'file',
                size: (selectedVideo || selectedImages[0])?.size || 0,
                type: (selectedVideo || selectedImages[0])?.type || 'image/jpeg'
              }}
              onRemove={() => setUploadProgress(null)}
              onPause={() => {}}
              onResume={() => {}}
            />
          </CardContent>
        </Card>
      )}

      {/* Create Post Card */}
      <Card className="bg-card border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">M</span>
            </div>
            <div>
              <CardTitle className="text-foreground text-lg">
                {currentRole === "admin" ? t("Admin", "Admin") :
                 currentRole === "senior" ? t("Manager", "Manager") :
                 currentRole === "content" ? t("Content Manager", "Content Manager") :
                 t("Junior Manager", "Junior Manager")}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Select value={privacy} onValueChange={setPrivacy}>
                  <SelectTrigger className="w-32 h-8 bg-input border-gray-200 dark:border-gray-700 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                    <SelectItem value="PUBLIC" className="text-foreground">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>{t("Public", "Public")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="SUBSCRIBERS_ONLY" className="text-foreground">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{t("Étudiants", "Students")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="PRIVATE" className="text-foreground">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4" />
                        <span>{t("Privé", "Private")}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title Input */}
          <input
            type="text"
            placeholder={t("Titre du post (optionnel)", "Post title (optional)")}
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            className="w-full px-4 py-2 bg-transparent border-b border-gray-200 dark:border-gray-700 text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:border-blue-500"
          />

          {/* Text Content */}
          <Textarea
            placeholder={t("Que voulez-vous partager ?", "What would you like to share?")}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="min-h-32 bg-transparent border-none text-foreground text-lg placeholder:text-muted-foreground resize-none focus:ring-0"
          />

          {/* Media Preview */}
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image) || "/placeholder.svg"}
                    alt={`Selected ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-6 h-6 p-0 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {selectedVideo && (
            <div className="relative group">
              <video
                src={URL.createObjectURL(selectedVideo)}
                className="w-full h-64 object-cover rounded-lg"
                controls
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={removeVideo}
                className="absolute top-2 right-2 w-6 h-6 p-0 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Media Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
              >
                <ImageIcon className="w-5 h-5 mr-2" />
                {t("Photo", "Photo")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
              >
                <Video className="w-5 h-5 mr-2" />
                {t("Vidéo", "Video")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
              >
                <Smile className="w-5 h-5 mr-2" />
                {t("Emoji", "Emoji")}
              </Button>
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                <MapPin className="w-5 h-5 mr-2" />
                {t("Lieu", "Location")}
              </Button>
            </div>

            <Button
              onClick={handlePost}
              disabled={(!postContent.trim() && selectedImages.length === 0 && !selectedVideo) || isPosting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {isPosting ? t("Publication...", "Posting...") : t("Publier", "Post")}
            </Button>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
        </CardContent>
      </Card>

      {/* Post Tips */}
      <Card className="bg-card border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <h3 className="text-foreground font-semibold mb-3">
            {t("Conseils pour un bon post", "Tips for a good post")}
          </h3>
          <div className="space-y-2 text-sm text-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{t("Utilisez des images de haute qualité", "Use high-quality images")}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>{t("Écrivez un contenu engageant", "Write engaging content")}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>{t("Interagissez avec votre audience", "Interact with your audience")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

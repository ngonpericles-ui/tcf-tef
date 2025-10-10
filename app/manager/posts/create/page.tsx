"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/language-provider"
import { ArrowLeft, ImageIcon, Video, Smile, MapPin, Users, Globe, Lock, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreatePostPageProps {
  role?: "admin" | "senior" | "content" | "junior"
}

export default function CreatePostPage({ role: propRole }: CreatePostPageProps = {}) {
  const { t } = useLanguage()
  const router = useRouter()
  const [postContent, setPostContent] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [privacy, setPrivacy] = useState("public")
  const [isPosting, setIsPosting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
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

    // Simulate posting delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Redirect to manager feed to see the new post
    router.push("/manager/feed")
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
                    <SelectItem value="public" className="text-foreground">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>{t("Public", "Public")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="students" className="text-foreground">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{t("Étudiants", "Students")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private" className="text-foreground">
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

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  X,
  Download,
  Share2,
  Edit,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  HardDrive
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { fileService, type FileItem } from "@/lib/services/fileService"

interface FileViewerProps {
  file: FileItem | null
  isOpen: boolean
  onClose: () => void
  onDelete?: (fileId: string) => void
  onShare?: (fileId: string) => void
  onDownload?: (fileId: string) => void
  className?: string
}

export default function FileViewer({
  file,
  isOpen,
  onClose,
  onDelete,
  onShare,
  onDownload,
  className = ""
}: FileViewerProps) {
  const { lang } = useLang()
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load preview when file changes
  useEffect(() => {
    if (file && isOpen && fileService.isPreviewable(file.mimeType)) {
      loadPreview()
    } else {
      setPreviewUrl(null)
      setError(null)
    }
  }, [file, isOpen])

  const loadPreview = async () => {
    if (!file) return

    try {
      setLoading(true)
      setError(null)

      // For images, use the direct URL
      if (file.mimeType.startsWith('image/')) {
        setPreviewUrl(file.url)
      } else {
        // For other files, get preview URL from service
        const response = await fileService.getPreviewUrl(file.id)
        if (response.success && response.data) {
          setPreviewUrl(response.data.url)
        } else {
          setError(response.message || t('Impossible de charger l\'aperçu', 'Unable to load preview'))
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur inconnue', 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  // Handle download
  const handleDownload = async () => {
    if (!file) return
    
    try {
      if (onDownload) {
        onDownload(file.id)
      } else {
        const response = await fileService.getDownloadUrl(file.id)
        if (response.success && response.data) {
          window.open(response.data.url, '_blank')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur de téléchargement', 'Download error'))
    }
  }

  // Handle share
  const handleShare = () => {
    if (!file) return
    if (onShare) {
      onShare(file.id)
    }
  }

  // Handle delete
  const handleDelete = () => {
    if (!file) return
    if (onDelete) {
      onDelete(file.id)
      onClose()
    }
  }

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25))
  const handleResetZoom = () => setZoom(100)

  // Rotation controls
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  // Get file type icon
  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-6 w-6 text-blue-500" />
    if (mimeType.startsWith('video/')) return <Video className="h-6 w-6 text-red-500" />
    if (mimeType.startsWith('audio/')) return <Music className="h-6 w-6 text-green-500" />
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-6 w-6 text-yellow-500" />
    return <FileText className="h-6 w-6 text-gray-500" />
  }

  // Render preview content
  const renderPreviewContent = () => {
    if (!file) return null

    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          {t("Chargement de l'aperçu...", "Loading preview...")}
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-center">{error}</p>
          <Button variant="outline" onClick={loadPreview} className="mt-4">
            {t("Réessayer", "Retry")}
          </Button>
        </div>
      )
    }

    if (!fileService.isPreviewable(file.mimeType)) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
          {getFileTypeIcon(file.mimeType)}
          <p className="mt-4 text-center">
            {t("Aperçu non disponible pour ce type de fichier", "Preview not available for this file type")}
          </p>
          <Button onClick={handleDownload} className="mt-4">
            <Download className="h-4 w-4 mr-2" />
            {t("Télécharger", "Download")}
          </Button>
        </div>
      )
    }

    // Image preview
    if (file.mimeType.startsWith('image/') && previewUrl) {
      return (
        <div className="flex items-center justify-center min-h-96 bg-secondary/20 rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt={file.originalName}
            className="max-w-full max-h-96 object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
            }}
          />
        </div>
      )
    }

    // PDF preview
    if (file.mimeType.includes('pdf') && previewUrl) {
      return (
        <div className="h-96 bg-secondary/20 rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title={file.originalName}
          />
        </div>
      )
    }

    // Text preview
    if (file.mimeType.startsWith('text/') && previewUrl) {
      return (
        <div className="h-96 bg-secondary/20 rounded-lg p-4 overflow-auto">
          <pre className="text-sm whitespace-pre-wrap font-mono">
            {/* Text content would be loaded here */}
            {t("Contenu du fichier texte...", "Text file content...")}
          </pre>
        </div>
      )
    }

    // Video preview
    if (file.mimeType.startsWith('video/') && previewUrl) {
      return (
        <div className="flex items-center justify-center h-96 bg-secondary/20 rounded-lg">
          <video
            src={previewUrl}
            controls
            className="max-w-full max-h-full"
            style={{
              transform: `scale(${zoom / 100})`
            }}
          >
            {t("Votre navigateur ne supporte pas la lecture vidéo.", "Your browser does not support video playback.")}
          </video>
        </div>
      )
    }

    // Audio preview
    if (file.mimeType.startsWith('audio/') && previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-secondary/20 rounded-lg">
          <Music className="h-16 w-16 text-muted-foreground mb-4" />
          <audio src={previewUrl} controls className="w-full max-w-md">
            {t("Votre navigateur ne supporte pas la lecture audio.", "Your browser does not support audio playback.")}
          </audio>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <EyeOff className="h-12 w-12 mb-4 opacity-50" />
        <p>{t("Aperçu non disponible", "Preview not available")}</p>
      </div>
    )
  }

  if (!file) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getFileTypeIcon(file.mimeType)}
            <span className="truncate">{file.originalName}</span>
            <Badge variant="outline" className="ml-auto">
              {file.category}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Preview Controls */}
            {file.mimeType.startsWith('image/') && (
              <div className="flex items-center gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 25}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm min-w-16 text-center">{zoom}%</span>
                <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 300}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetZoom}>
                  {t("Réinitialiser", "Reset")}
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="outline" size="sm" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Preview Content */}
            <ScrollArea className="h-full">
              {renderPreviewContent()}
            </ScrollArea>
          </div>

          {/* File Information */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("Informations", "Information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("Nom", "Name")}</p>
                  <p className="text-sm break-all">{file.originalName}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("Taille", "Size")}</p>
                  <p className="text-sm">{fileService.formatFileSize(file.size)}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("Type", "Type")}</p>
                  <p className="text-sm">{file.mimeType}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("Catégorie", "Category")}</p>
                  <Badge variant="secondary" className="text-xs">
                    {file.category}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("Créé le", "Created")}</p>
                  <p className="text-sm">{new Date(file.createdAt).toLocaleString()}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("Modifié le", "Modified")}</p>
                  <p className="text-sm">{new Date(file.updatedAt).toLocaleString()}</p>
                </div>

                {file.user && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("Propriétaire", "Owner")}</p>
                    <p className="text-sm">{file.user.firstName} {file.user.lastName}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("Actions", "Actions")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleDownload} className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  {t("Télécharger", "Download")}
                </Button>
                
                <Button variant="outline" onClick={handleShare} className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" />
                  {t("Partager", "Share")}
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  {t("Renommer", "Rename")}
                </Button>
                
                <Separator />
                
                <Button 
                  variant="destructive" 
                  onClick={handleDelete} 
                  className="w-full justify-start"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("Supprimer", "Delete")}
                </Button>
              </CardContent>
            </Card>

            {/* Metadata */}
            {file.metadata && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t("Métadonnées", "Metadata")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-32">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(file.metadata), null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Standalone File Viewer Trigger Component
interface FileViewerTriggerProps {
  file: FileItem
  children: React.ReactNode
  onDelete?: (fileId: string) => void
  onShare?: (fileId: string) => void
  onDownload?: (fileId: string) => void
}

export function FileViewerTrigger({
  file,
  children,
  onDelete,
  onShare,
  onDownload
}: FileViewerTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        {children}
      </div>
      <FileViewer
        file={file}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onDelete={onDelete}
        onShare={onShare}
        onDownload={onDownload}
      />
    </>
  )
}

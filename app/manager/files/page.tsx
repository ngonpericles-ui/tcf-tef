"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FolderOpen,
  Upload,
  BarChart3,
  Plus,
  FileText
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"
import FileBrowser from "@/components/file-browser"
import FileManagerDashboard from "@/components/file-manager-dashboard"
import FileUploadWidget from "@/components/file-upload-widget"
import FileViewer from "@/components/file-viewer"
import { type FileItem } from "@/lib/services/fileService"

export default function ManagerFilesPage() {
  const { lang } = useLang()
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [showFileViewer, setShowFileViewer] = useState(false)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Handle file selection from browser
  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file)
    setShowFileViewer(true)
  }

  // Handle upload completion
  const handleUploadComplete = (files: FileItem[]) => {
    setShowUploadDialog(false)
    // Optionally refresh the file browser or show success message
    console.log('Upload completed:', files)
  }

  // Handle upload error
  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
    // Show error toast or notification
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("Mes fichiers", "My Files")}</h1>
          <p className="text-muted-foreground">
            {t("Gérez vos fichiers et contenus pédagogiques", "Manage your files and educational content")}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("Téléverser", "Upload")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("Téléverser des fichiers", "Upload Files")}</DialogTitle>
              </DialogHeader>
              <FileUploadWidget
                category="COURSE_MATERIAL"
                maxFiles={10}
                maxFileSize={50 * 1024 * 1024} // 50MB
                allowedTypes={[
                  'application/pdf',
                  'video/mp4',
                  'audio/mp3',
                  'image/jpeg',
                  'image/png',
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                  'application/vnd.ms-powerpoint'
                ]}
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t("Tableau de bord", "Dashboard")}
          </TabsTrigger>
          <TabsTrigger value="browser" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            {t("Mes fichiers", "My Files")}
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t("Téléverser", "Upload")}
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <FileManagerDashboard
            onUploadClick={() => setActiveTab('upload')}
            onBrowseClick={() => setActiveTab('browser')}
          />
        </TabsContent>

        {/* Browser Tab */}
        <TabsContent value="browser" className="space-y-6">
          <FileBrowser
            onFileSelect={handleFileSelect}
            multiSelect={false}
            category="COURSE_MATERIAL"
            allowedTypes={[
              'application/pdf',
              'video/mp4',
              'audio/mp3',
              'image/jpeg',
              'image/png',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ]}
          />
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {t("Téléverser du contenu pédagogique", "Upload Educational Content")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploadWidget
                category="COURSE_MATERIAL"
                maxFiles={15}
                maxFileSize={100 * 1024 * 1024} // 100MB
                allowedTypes={[
                  'application/pdf',
                  'video/mp4',
                  'audio/mp3',
                  'image/jpeg',
                  'image/png',
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                  'application/vnd.ms-powerpoint',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ]}
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
              />
              
              {/* Upload Guidelines */}
              <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                <h4 className="font-semibold mb-2">
                  {t("Conseils pour le téléversement", "Upload Guidelines")}
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {t("Utilisez des noms de fichiers descriptifs", "Use descriptive file names")}</li>
                  <li>• {t("Organisez vos fichiers par niveau (A1, A2, B1, B2, C1, C2)", "Organize files by level (A1, A2, B1, B2, C1, C2)")}</li>
                  <li>• {t("Les vidéos doivent être en format MP4 pour une meilleure compatibilité", "Videos should be in MP4 format for better compatibility")}</li>
                  <li>• {t("Les documents PDF sont recommandés pour les supports de cours", "PDF documents are recommended for course materials")}</li>
                  <li>• {t("Vérifiez la qualité audio avant de téléverser", "Check audio quality before uploading")}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* File Viewer */}
      <FileViewer
        file={selectedFile}
        isOpen={showFileViewer}
        onClose={() => {
          setShowFileViewer(false)
          setSelectedFile(null)
        }}
        onDelete={(fileId) => {
          console.log('Delete file:', fileId)
          // Handle file deletion
        }}
        onShare={(fileId) => {
          console.log('Share file:', fileId)
          // Handle file sharing
        }}
        onDownload={(fileId) => {
          console.log('Download file:', fileId)
          // Handle file download
        }}
      />
    </div>
  )
}

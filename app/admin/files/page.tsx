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
  Settings,
  Plus,
  FileText
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { useAuth } from "@/hooks/useAuth"
import EnhancedFileBrowser from "@/components/enhanced-file-browser"
import FileManagerDashboard from "@/components/file-manager-dashboard"
import FileUploadWidget from "@/components/file-upload-widget"
import FileViewer from "@/components/file-viewer"
import FolderBrowser from "@/components/folder-browser"
import { type FileItem } from "@/lib/services/fileService"

export default function AdminFilesPage() {
  const { lang } = useLang()
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [showFileViewer, setShowFileViewer] = useState(false)
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined)

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
          <h1 className="text-3xl font-bold">{t("Gestionnaire de fichiers", "File Manager")}</h1>
          <p className="text-muted-foreground">
            {t("Gérez tous vos fichiers et documents", "Manage all your files and documents")}
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
                category="DOCUMENT"
                maxFiles={10}
                maxFileSize={50 * 1024 * 1024} // 50MB
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
              />
            </DialogContent>
          </Dialog>
          
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            {t("Paramètres", "Settings")}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t("Tableau de bord", "Dashboard")}
          </TabsTrigger>
          <TabsTrigger value="folders" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            {t("Dossiers", "Folders")}
          </TabsTrigger>
          <TabsTrigger value="browser" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t("Fichiers", "Files")}
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t("Téléverser", "Upload")}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t("Paramètres", "Settings")}
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <FileManagerDashboard
            onUploadClick={() => setActiveTab('upload')}
            onBrowseClick={() => setActiveTab('browser')}
          />
        </TabsContent>

        {/* Folders Tab */}
        <TabsContent value="folders" className="space-y-6">
          <FolderBrowser
            onFolderSelect={(folder) => console.log('Selected folder:', folder)}
            onFolderOpen={(folderId) => {
              setCurrentFolderId(folderId)
              setActiveTab('browser')
            }}
            currentFolderId={currentFolderId}
            showCreateButton={true}
          />
        </TabsContent>

        {/* Files Browser Tab */}
        <TabsContent value="browser" className="space-y-6">
          <EnhancedFileBrowser
            onFileSelect={handleFileSelect}
            multiSelect={true}
            folderId={currentFolderId}
            showFolders={true}
          />
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {t("Téléverser des fichiers", "Upload Files")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploadWidget
                category="DOCUMENT"
                maxFiles={20}
                maxFileSize={100 * 1024 * 1024} // 100MB
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Storage Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Paramètres de stockage", "Storage Settings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    {t("Limite de taille par fichier", "File size limit")}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {t("Taille maximale autorisée par fichier", "Maximum allowed file size")}
                  </p>
                  <p className="text-lg font-semibold mt-2">100 MB</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">
                    {t("Limite de stockage total", "Total storage limit")}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {t("Espace de stockage total disponible", "Total available storage space")}
                  </p>
                  <p className="text-lg font-semibold mt-2">10 GB</p>
                </div>
              </CardContent>
            </Card>

            {/* File Type Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Types de fichiers autorisés", "Allowed File Types")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("Images", "Images")}</span>
                    <span className="text-xs text-muted-foreground">JPG, PNG, GIF</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("Documents", "Documents")}</span>
                    <span className="text-xs text-muted-foreground">PDF, DOC, DOCX</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("Vidéos", "Videos")}</span>
                    <span className="text-xs text-muted-foreground">MP4, AVI, MOV</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("Audio", "Audio")}</span>
                    <span className="text-xs text-muted-foreground">MP3, WAV, OGG</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Paramètres de sécurité", "Security Settings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    {t("Analyse antivirus", "Virus scanning")}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {t("Tous les fichiers sont analysés automatiquement", "All files are automatically scanned")}
                  </p>
                  <p className="text-sm text-green-600 mt-2">✓ {t("Activé", "Enabled")}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">
                    {t("Chiffrement", "Encryption")}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {t("Les fichiers sont chiffrés au repos", "Files are encrypted at rest")}
                  </p>
                  <p className="text-sm text-green-600 mt-2">✓ {t("Activé", "Enabled")}</p>
                </div>
              </CardContent>
            </Card>

            {/* Backup Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Paramètres de sauvegarde", "Backup Settings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    {t("Sauvegarde automatique", "Automatic backup")}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {t("Sauvegarde quotidienne vers le cloud", "Daily backup to cloud storage")}
                  </p>
                  <p className="text-sm text-green-600 mt-2">✓ {t("Activé", "Enabled")}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">
                    {t("Rétention", "Retention")}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {t("Durée de conservation des sauvegardes", "Backup retention period")}
                  </p>
                  <p className="text-lg font-semibold mt-2">30 {t("jours", "days")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
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

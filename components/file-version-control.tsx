"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  History,
  Clock,
  User,
  Download,
  Eye,
  RotateCcw,
  GitBranch,
  FileText,
  Upload,
  MoreHorizontal,
  Trash2,
  Star,
  Tag,
  Calendar,
  HardDrive,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeftRight
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { fileService, type FileItem } from "@/lib/services/fileService"

interface FileVersionControlProps {
  file: FileItem
  isOpen: boolean
  onClose: () => void
  onVersionRestore?: (versionId: string) => void
  className?: string
}

interface FileVersion {
  id: string
  version: string
  fileId: string
  filename: string
  originalName: string
  size: number
  url: string
  mimeType: string
  checksum: string
  uploadedBy: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  uploadedAt: string
  comment?: string
  isCurrentVersion: boolean
  isMajorVersion: boolean
  tags: string[]
  downloadCount: number
  status: 'active' | 'archived' | 'deleted'
}

interface VersionComparison {
  oldVersion: FileVersion
  newVersion: FileVersion
  changes: {
    sizeChange: number
    checksumChanged: boolean
    nameChanged: boolean
    contentChanged: boolean
  }
}

export default function FileVersionControl({
  file,
  isOpen,
  onClose,
  onVersionRestore,
  className = ""
}: FileVersionControlProps) {
  const { lang } = useLang()
  
  const [versions, setVersions] = useState<FileVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadComment, setUploadComment] = useState('')
  const [isMajorVersion, setIsMajorVersion] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [versionToRestore, setVersionToRestore] = useState<FileVersion | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [comparison, setComparison] = useState<VersionComparison | null>(null)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load file versions
  const loadVersions = useCallback(async () => {
    if (!file.id) return

    try {
      setLoading(true)
      setError(null)

      // For now, show current file as the only version until backend versioning is implemented
      const currentVersion: FileVersion = {
        id: file.id,
        version: '1.0',
        fileId: file.id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        url: file.url,
        mimeType: file.mimeType,
        checksum: 'current',
        uploadedBy: {
          id: file.userId,
          name: file.user ? `${file.user.firstName} ${file.user.lastName}` : 'Unknown User',
          email: file.user?.email || '',
          avatar: ''
        },
        uploadedAt: file.createdAt,
        comment: t('Version actuelle', 'Current version'),
        isCurrentVersion: true,
        isMajorVersion: true,
        tags: ['current'],
        downloadCount: 0, // Will be tracked when analytics are implemented
        status: 'active'
      }

      setVersions([currentVersion])

      // TODO: When backend supports versioning:
      // const versionsResponse = await fileService.getFileVersions(file.id)
      // Process and set the real version data

    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur inconnue', 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [file.id, file.filename, file.originalName, file.size, file.url, file.mimeType, file.userId, file.user, file.createdAt, t])

  useEffect(() => {
    if (isOpen) {
      loadVersions()
    }
  }, [isOpen, loadVersions])

  // Handle version restore
  const handleRestore = async (version: FileVersion) => {
    try {
      // Mock restore - in real app, this would call API
      console.log('Restoring version:', version.id)
      
      // Update versions to mark the restored version as current
      setVersions(prev => prev.map(v => ({
        ...v,
        isCurrentVersion: v.id === version.id
      })))
      
      onVersionRestore?.(version.id)
      setShowRestoreDialog(false)
      setVersionToRestore(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur de restauration', 'Restore error'))
    }
  }

  // Handle version comparison
  const compareVersions = (version1Id: string, version2Id: string) => {
    const v1 = versions.find(v => v.id === version1Id)
    const v2 = versions.find(v => v.id === version2Id)
    
    if (!v1 || !v2) return

    const comparison: VersionComparison = {
      oldVersion: v1,
      newVersion: v2,
      changes: {
        sizeChange: v2.size - v1.size,
        checksumChanged: v1.checksum !== v2.checksum,
        nameChanged: v1.originalName !== v2.originalName,
        contentChanged: v1.checksum !== v2.checksum
      }
    }

    setComparison(comparison)
    setShowComparison(true)
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    return fileService.formatFileSize(bytes)
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  // Get version status color
  const getVersionStatusColor = (version: FileVersion) => {
    if (version.isCurrentVersion) return 'bg-green-500'
    if (version.isMajorVersion) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('Historique des versions', 'Version History')} - {file.originalName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            {t('Chargement...', 'Loading...')}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {versions.length} {t('versions', 'versions')}
                </Badge>
                {selectedVersions.length === 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => compareVersions(selectedVersions[0], selectedVersions[1])}
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    {t('Comparer', 'Compare')}
                  </Button>
                )}
              </div>
              
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                {t('Nouvelle version', 'New version')}
              </Button>
            </div>

            {/* Version Timeline */}
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <Card key={version.id} className={`${version.isCurrentVersion ? 'ring-2 ring-green-500' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Version Indicator */}
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${getVersionStatusColor(version)}`} />
                          {index < versions.length - 1 && (
                            <div className="w-0.5 h-16 bg-border mt-2" />
                          )}
                        </div>

                        {/* Version Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                {t('Version', 'Version')} {version.version}
                              </h4>
                              {version.isCurrentVersion && (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {t('Actuelle', 'Current')}
                                </Badge>
                              )}
                              {version.isMajorVersion && (
                                <Badge variant="secondary">
                                  <Star className="h-3 w-3 mr-1" />
                                  {t('Majeure', 'Major')}
                                </Badge>
                              )}
                              {version.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t('Aperçu', 'Preview')}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  {t('Télécharger', 'Download')}
                                </DropdownMenuItem>
                                {!version.isCurrentVersion && (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setVersionToRestore(version)
                                      setShowRestoreDialog(true)
                                    }}
                                  >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    {t('Restaurer', 'Restore')}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (selectedVersions.includes(version.id)) {
                                      setSelectedVersions(prev => prev.filter(id => id !== version.id))
                                    } else if (selectedVersions.length < 2) {
                                      setSelectedVersions(prev => [...prev, version.id])
                                    }
                                  }}
                                >
                                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                                  {selectedVersions.includes(version.id) 
                                    ? t('Désélectionner', 'Deselect')
                                    : t('Sélectionner pour comparaison', 'Select for comparison')
                                  }
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {version.uploadedBy.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(version.uploadedAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {formatFileSize(version.size)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {version.downloadCount} {t('téléchargements', 'downloads')}
                            </div>
                          </div>

                          {version.comment && (
                            <p className="text-sm bg-secondary/50 p-2 rounded">
                              {version.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Upload New Version Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Téléverser une nouvelle version', 'Upload New Version')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('Commentaire de version', 'Version comment')}</Label>
                <Textarea
                  placeholder={t('Décrivez les changements...', 'Describe the changes...')}
                  value={uploadComment}
                  onChange={(e) => setUploadComment(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="majorVersion"
                  checked={isMajorVersion}
                  onChange={(e) => setIsMajorVersion(e.target.checked)}
                />
                <Label htmlFor="majorVersion">
                  {t('Version majeure', 'Major version')}
                </Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  {t('Annuler', 'Cancel')}
                </Button>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('Téléverser', 'Upload')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Restore Confirmation Dialog */}
        <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('Restaurer la version', 'Restore Version')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  'Êtes-vous sûr de vouloir restaurer la version',
                  'Are you sure you want to restore version'
                )} {versionToRestore?.version}? {t(
                  'Cette action créera une nouvelle version basée sur la version sélectionnée.',
                  'This action will create a new version based on the selected version.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('Annuler', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => versionToRestore && handleRestore(versionToRestore)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('Restaurer', 'Restore')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Version Comparison Dialog */}
        <Dialog open={showComparison} onOpenChange={setShowComparison}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{t('Comparaison des versions', 'Version Comparison')}</DialogTitle>
            </DialogHeader>
            {comparison && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {t('Version', 'Version')} {comparison.oldVersion.version}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p>{t('Taille', 'Size')}: {formatFileSize(comparison.oldVersion.size)}</p>
                      <p>{t('Date', 'Date')}: {formatDate(comparison.oldVersion.uploadedAt)}</p>
                      <p>{t('Par', 'By')}: {comparison.oldVersion.uploadedBy.name}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {t('Version', 'Version')} {comparison.newVersion.version}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p>{t('Taille', 'Size')}: {formatFileSize(comparison.newVersion.size)}</p>
                      <p>{t('Date', 'Date')}: {formatDate(comparison.newVersion.uploadedAt)}</p>
                      <p>{t('Par', 'By')}: {comparison.newVersion.uploadedBy.name}</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{t('Changements', 'Changes')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      {comparison.changes.sizeChange !== 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm">
                        {t('Taille', 'Size')}: {comparison.changes.sizeChange > 0 ? '+' : ''}{formatFileSize(Math.abs(comparison.changes.sizeChange))}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {comparison.changes.contentChanged ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm">
                        {t('Contenu modifié', 'Content changed')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {comparison.changes.nameChanged ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm">
                        {t('Nom modifié', 'Name changed')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}

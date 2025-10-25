"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Folder,
  FolderPlus,
  Search,
  ArrowLeft,
  Home,
  MoreHorizontal,
  Edit,
  Trash2,
  Move,
  Share2,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { fileService, type FolderItem, type FolderFilters, type FilePagination } from "@/lib/services/fileService"

interface FolderBrowserProps {
  onFolderSelect?: (folder: FolderItem) => void
  onFolderOpen?: (folderId: string) => void
  currentFolderId?: string
  showCreateButton?: boolean
  className?: string
}

interface CreateFolderDialogProps {
  isOpen: boolean
  onClose: () => void
  parentId?: string
  onFolderCreated?: (folder: FolderItem) => void
}

function CreateFolderDialog({ isOpen, onClose, parentId, onFolderCreated }: CreateFolderDialogProps) {
  const { lang } = useLang()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState('#3b82f6')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)
  const colors = fileService.getFolderColors()

  const handleCreate = async () => {
    if (!name.trim()) {
      setError(t('Le nom du dossier est requis', 'Folder name is required'))
      return
    }

    try {
      setIsCreating(true)
      setError(null)

      const response = await fileService.createFolder(name.trim(), parentId, description.trim() || undefined, selectedColor)
      
      if (response.success && response.data) {
        onFolderCreated?.(response.data)
        onClose()
        setName('')
        setDescription('')
        setSelectedColor('#3b82f6')
      } else {
        setError(response.message || t('Erreur lors de la création', 'Error creating folder'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur inconnue', 'Unknown error'))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Créer un nouveau dossier', 'Create New Folder')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t('Nom du dossier', 'Folder Name')}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('Entrez le nom du dossier', 'Enter folder name')}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">{t('Description (optionnel)', 'Description (optional)')}</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('Entrez une description', 'Enter description')}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">{t('Couleur', 'Color')}</label>
            <div className="flex gap-2 mt-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-8 h-8 rounded-full ${color.class} ${
                    selectedColor === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          
          {error && (
            <div className="text-sm text-red-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isCreating}>
              {t('Annuler', 'Cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('Création...', 'Creating...')}
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  {t('Créer', 'Create')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function FolderBrowser({
  onFolderSelect,
  onFolderOpen,
  currentFolderId,
  showCreateButton = true,
  className = ""
}: FolderBrowserProps) {
  const { lang } = useLang()
  
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [breadcrumb, setBreadcrumb] = useState<FolderItem[]>([])

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load folders
  const loadFolders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: FolderFilters = {
        parentId: currentFolderId,
        search: searchQuery || undefined
      }

      const pagination: FilePagination = {
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }

      const response = await fileService.getFolders(filters, pagination)
      
      if (response.success && response.data) {
        setFolders(response.data.folders)
      } else {
        setError(response.message || t('Erreur lors du chargement', 'Error loading folders'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur inconnue', 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [currentFolderId, searchQuery, t])

  // Load breadcrumb path
  const loadBreadcrumb = useCallback(async () => {
    if (!currentFolderId) {
      setBreadcrumb([])
      return
    }

    try {
      const response = await fileService.getFolderPath(currentFolderId)
      if (response.success && response.data) {
        setBreadcrumb(response.data)
      }
    } catch (err) {
      console.error('Error loading breadcrumb:', err)
    }
  }, [currentFolderId])

  // Load data when dependencies change
  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  useEffect(() => {
    loadBreadcrumb()
  }, [loadBreadcrumb])

  // Handle folder double-click
  const handleFolderDoubleClick = (folder: FolderItem) => {
    onFolderOpen?.(folder.id)
  }

  // Handle folder selection
  const handleFolderClick = (folder: FolderItem) => {
    onFolderSelect?.(folder)
  }

  // Handle folder creation
  const handleFolderCreated = (folder: FolderItem) => {
    setFolders(prev => [folder, ...prev])
  }

  // Handle folder deletion
  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm(t('Êtes-vous sûr de vouloir supprimer ce dossier ?', 'Are you sure you want to delete this folder?'))) {
      return
    }

    try {
      const response = await fileService.deleteFolder(folderId, true) // Move files to parent
      if (response.success) {
        setFolders(prev => prev.filter(f => f.id !== folderId))
      } else {
        setError(response.message || t('Erreur lors de la suppression', 'Error deleting folder'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur inconnue', 'Unknown error'))
    }
  }

  // Navigate to parent folder
  const navigateToParent = () => {
    if (breadcrumb.length > 0) {
      const parent = breadcrumb[breadcrumb.length - 2]
      onFolderOpen?.(parent?.id)
    } else {
      onFolderOpen?.(undefined) // Go to root
    }
  }

  // Navigate to root
  const navigateToRoot = () => {
    onFolderOpen?.(undefined)
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        {t("Chargement des dossiers...", "Loading folders...")}
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
        <Button variant="outline" size="sm" onClick={loadFolders} className="mt-2">
          {t("Réessayer", "Retry")}
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={navigateToRoot}>
            <Home className="h-4 w-4" />
          </Button>
          
          {currentFolderId && (
            <Button variant="ghost" size="sm" onClick={navigateToParent}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-sm text-muted-foreground">{t("Accueil", "Home")}</span>
          {breadcrumb.map((folder, index) => (
            <div key={folder.id} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <button
                onClick={() => onFolderOpen?.(folder.id)}
                className="text-sm text-muted-foreground hover:text-foreground truncate"
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Rechercher des dossiers...", "Search folders...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          {showCreateButton && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              {t("Nouveau dossier", "New Folder")}
            </Button>
          )}
        </div>
      </div>

      {/* Folders Grid */}
      <ScrollArea className="h-96">
        {folders.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {folders.map((folder) => (
              <ContextMenu key={folder.id}>
                <ContextMenuTrigger>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleFolderClick(folder)}
                    onDoubleClick={() => handleFolderDoubleClick(folder)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="mb-2">
                        <Folder 
                          className="h-12 w-12 mx-auto" 
                          style={{ color: folder.color || '#3b82f6' }}
                        />
                      </div>
                      <h4 className="font-medium text-sm truncate" title={folder.name}>
                        {folder.name}
                      </h4>
                      <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{folder.fileCount} {t("fichiers", "files")}</span>
                        {folder.subfolderCount > 0 && (
                          <span>• {folder.subfolderCount} {t("dossiers", "folders")}</span>
                        )}
                      </div>
                      {folder.totalSize > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {fileService.formatFileSize(folder.totalSize)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </ContextMenuTrigger>
                
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleFolderDoubleClick(folder)}>
                    <Folder className="h-4 w-4 mr-2" />
                    {t("Ouvrir", "Open")}
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    {t("Renommer", "Rename")}
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <Move className="h-4 w-4 mr-2" />
                    {t("Déplacer", "Move")}
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <Share2 className="h-4 w-4 mr-2" />
                    {t("Partager", "Share")}
                  </ContextMenuItem>
                  <ContextMenuItem 
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("Supprimer", "Delete")}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Folder className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">
              {searchQuery 
                ? t("Aucun dossier trouvé", "No folders found")
                : t("Aucun dossier dans ce répertoire", "No folders in this directory")
              }
            </p>
            {showCreateButton && !searchQuery && (
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(true)}
                className="mt-4"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                {t("Créer le premier dossier", "Create first folder")}
              </Button>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        parentId={currentFolderId}
        onFolderCreated={handleFolderCreated}
      />
    </div>
  )
}

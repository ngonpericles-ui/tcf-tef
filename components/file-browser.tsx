"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Grid3X3,
  List,
  Search,
  Filter,
  Download,
  Share2,
  Trash2,
  MoreVertical,
  Eye,
  Edit,
  Calendar,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  RefreshCw,
  SortAsc,
  SortDesc,
  Loader2
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { fileService, type FileItem, type FileFilters, type FilePagination } from "@/lib/services/fileService"

interface FileBrowserProps {
  onFileSelect?: (file: FileItem) => void
  onFilesSelect?: (files: FileItem[]) => void
  multiSelect?: boolean
  allowedTypes?: string[]
  category?: FileItem['category']
  className?: string
}

type ViewMode = 'grid' | 'list'
type SortField = 'createdAt' | 'originalName' | 'size' | 'updatedAt'

export default function FileBrowser({
  onFileSelect,
  onFilesSelect,
  multiSelect = false,
  allowedTypes,
  category,
  className = ""
}: FileBrowserProps) {
  const { lang } = useLang()
  
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  
  // Filters and pagination
  const [filters, setFilters] = useState<FileFilters>({
    category: category
  })
  const [pagination, setPagination] = useState<FilePagination>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [totalFiles, setTotalFiles] = useState(0)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load files
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const searchFilters = {
        ...filters,
        search: searchQuery || undefined
      }
      
      const response = await fileService.getFiles(searchFilters, pagination)
      
      if (response.success && response.data) {
        setFiles(response.data.files)
        setTotalFiles(response.data.total)
      } else {
        setError(response.message || t('Erreur lors du chargement des fichiers', 'Error loading files'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur inconnue', 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [filters, pagination, searchQuery, t])

  // Load files on mount and when dependencies change
  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  // Handle file selection
  const handleFileSelect = (file: FileItem) => {
    if (multiSelect) {
      const newSelection = selectedFiles.includes(file.id)
        ? selectedFiles.filter(id => id !== file.id)
        : [...selectedFiles, file.id]
      
      setSelectedFiles(newSelection)
      
      const selectedFileObjects = files.filter(f => newSelection.includes(f.id))
      onFilesSelect?.(selectedFileObjects)
    } else {
      setSelectedFiles([file.id])
      onFileSelect?.(file)
    }
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([])
      onFilesSelect?.([])
    } else {
      const allIds = files.map(f => f.id)
      setSelectedFiles(allIds)
      onFilesSelect?.(files)
    }
  }

  // Handle delete
  const handleDelete = async (fileId: string) => {
    try {
      const response = await fileService.deleteFile(fileId)
      if (response.success) {
        setFiles(prev => prev.filter(f => f.id !== fileId))
        setSelectedFiles(prev => prev.filter(id => id !== fileId))
        setTotalFiles(prev => prev - 1)
      } else {
        setError(response.message || t('Erreur lors de la suppression', 'Error deleting file'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur inconnue', 'Unknown error'))
    }
    setShowDeleteDialog(false)
    setFileToDelete(null)
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      const response = await fileService.deleteMultipleFiles(selectedFiles)
      if (response.success) {
        setFiles(prev => prev.filter(f => !selectedFiles.includes(f.id)))
        setTotalFiles(prev => prev - selectedFiles.length)
        setSelectedFiles([])
        onFilesSelect?.([])
      } else {
        setError(response.message || t('Erreur lors de la suppression', 'Error deleting files'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur inconnue', 'Unknown error'))
    }
  }

  // Handle download
  const handleDownload = async (fileId: string) => {
    try {
      const response = await fileService.getDownloadUrl(fileId)
      if (response.success && response.data) {
        window.open(response.data.url, '_blank')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur de téléchargement', 'Download error'))
    }
  }

  // Handle sort change
  const handleSortChange = (field: SortField) => {
    setPagination(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }))
  }

  // Handle filter change
  const handleFilterChange = (key: keyof FileFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  // Filter files by allowed types
  const filteredFiles = allowedTypes 
    ? files.filter(file => allowedTypes.some(type => file.mimeType.includes(type)))
    : files

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {t("Gestionnaire de fichiers", "File Manager")}
          </h2>
          <Badge variant="secondary">
            {totalFiles} {t("fichiers", "files")}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Refresh */}
          <Button variant="outline" size="sm" onClick={loadFiles} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("Rechercher des fichiers...", "Search files...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Category Filter */}
          <Select
            value={filters.category || 'all'}
            onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("Catégorie", "Category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Toutes", "All")}</SelectItem>
              <SelectItem value="COURSE_MATERIAL">{t("Cours", "Course")}</SelectItem>
              <SelectItem value="DOCUMENT">{t("Documents", "Documents")}</SelectItem>
              <SelectItem value="POST_MEDIA">{t("Médias", "Media")}</SelectItem>
              <SelectItem value="PROFILE_IMAGE">{t("Images", "Images")}</SelectItem>
              <SelectItem value="OTHER">{t("Autres", "Other")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {t("Trier", "Sort")}
                {pagination.sortOrder === 'asc' ? <SortAsc className="h-4 w-4 ml-2" /> : <SortDesc className="h-4 w-4 ml-2" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSortChange('originalName')}>
                {t("Nom", "Name")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('createdAt')}>
                {t("Date de création", "Created Date")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('updatedAt')}>
                {t("Date de modification", "Modified Date")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('size')}>
                {t("Taille", "Size")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
          <span className="text-sm">
            {selectedFiles.length} {t("fichier(s) sélectionné(s)", "file(s) selected")}
          </span>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t("Supprimer", "Delete")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedFiles([])}>
              {t("Désélectionner", "Deselect")}
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Files Display */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              {t("Chargement...", "Loading...")}
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("Aucun fichier trouvé", "No files found")}</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
                  {multiSelect && (
                    <div className="col-span-full">
                      <Checkbox
                        checked={selectedFiles.length === filteredFiles.length}
                        onCheckedChange={handleSelectAll}
                        className="mr-2"
                      />
                      <span className="text-sm">{t("Tout sélectionner", "Select all")}</span>
                    </div>
                  )}
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`relative group cursor-pointer border rounded-lg p-3 hover:bg-secondary/50 transition-colors ${
                        selectedFiles.includes(file.id) ? 'bg-primary/10 border-primary' : ''
                      }`}
                      onClick={() => handleFileSelect(file)}
                    >
                      {multiSelect && (
                        <Checkbox
                          checked={selectedFiles.includes(file.id)}
                          className="absolute top-2 left-2 z-10"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-2 text-muted-foreground">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <p className="text-xs font-medium truncate w-full" title={file.originalName}>
                          {file.originalName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fileService.formatFileSize(file.size)}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleDownload(file.id)}>
                            <Download className="h-4 w-4 mr-2" />
                            {t("Télécharger", "Download")}
                          </DropdownMenuItem>
                          {fileService.isPreviewable(file.mimeType) && (
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              {t("Aperçu", "Preview")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            {t("Partager", "Share")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setFileToDelete(file.id)
                              setShowDeleteDialog(true)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("Supprimer", "Delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  {multiSelect && (
                    <div className="p-4 border-b">
                      <Checkbox
                        checked={selectedFiles.length === filteredFiles.length}
                        onCheckedChange={handleSelectAll}
                        className="mr-2"
                      />
                      <span className="text-sm">{t("Tout sélectionner", "Select all")}</span>
                    </div>
                  )}
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center gap-4 p-4 hover:bg-secondary/50 cursor-pointer ${
                        selectedFiles.includes(file.id) ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => handleFileSelect(file)}
                    >
                      {multiSelect && (
                        <Checkbox
                          checked={selectedFiles.includes(file.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      
                      <div className="text-muted-foreground">
                        {getFileIcon(file.mimeType)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.originalName}</p>
                        <p className="text-sm text-muted-foreground">
                          {fileService.formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {file.category}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleDownload(file.id)}>
                            <Download className="h-4 w-4 mr-2" />
                            {t("Télécharger", "Download")}
                          </DropdownMenuItem>
                          {fileService.isPreviewable(file.mimeType) && (
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              {t("Aperçu", "Preview")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            {t("Partager", "Share")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setFileToDelete(file.id)
                              setShowDeleteDialog(true)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("Supprimer", "Delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalFiles > (pagination.limit || 20) && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("Affichage", "Showing")} {((pagination.page || 1) - 1) * (pagination.limit || 20) + 1}-
            {Math.min((pagination.page || 1) * (pagination.limit || 20), totalFiles)} {t("sur", "of")} {totalFiles}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(pagination.page || 1) <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
            >
              {t("Précédent", "Previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(pagination.page || 1) * (pagination.limit || 20) >= totalFiles}
              onClick={() => setPagination(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
            >
              {t("Suivant", "Next")}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Confirmer la suppression", "Confirm Deletion")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.",
                "Are you sure you want to delete this file? This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Annuler", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && handleDelete(fileToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("Supprimer", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

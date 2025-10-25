"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  Grid3X3,
  List,
  Rows,
  Columns,
  LayoutGrid,
  Search,
  Filter,
  Download,
  Share2,
  Trash2,
  Eye,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  Settings,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Calendar,
  User,
  HardDrive,
  Tag,
  Folder,
  History,
  BarChart3,
  MessageSquare
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { fileService, type FileItem, type FileFilters, type FilePagination } from "@/lib/services/fileService"
import AdvancedSearchFilter from "./advanced-search-filter"
import FileTaggingSystem from "./file-tagging-system"
import FileSharingSystem from "./file-sharing-system"
import FileVersionControl from "./file-version-control"
import FileAnalyticsDashboard from "./file-analytics-dashboard"
import FileCollaboration from "./file-collaboration"

interface EnhancedFileBrowserProps {
  onFileSelect?: (file: FileItem) => void
  onFilesSelect?: (files: FileItem[]) => void
  multiSelect?: boolean
  allowedTypes?: string[]
  category?: FileItem['category']
  folderId?: string
  showFolders?: boolean
  className?: string
}

type ViewMode = 'grid' | 'list' | 'table' | 'tiles'
type SortField = 'originalName' | 'size' | 'createdAt' | 'updatedAt' | 'category'
type SortOrder = 'asc' | 'desc'

export default function EnhancedFileBrowser({
  onFileSelect,
  onFilesSelect,
  multiSelect = false,
  allowedTypes,
  category,
  folderId,
  showFolders = false,
  className = ""
}: EnhancedFileBrowserProps) {
  const { lang } = useLang()
  
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [filters, setFilters] = useState<FileFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [showTagging, setShowTagging] = useState(false)
  const [selectedFileForTagging, setSelectedFileForTagging] = useState<FileItem | null>(null)
  const [showSharing, setShowSharing] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [activeFile, setActiveFile] = useState<FileItem | null>(null)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load files
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const fileFilters: FileFilters = {
        ...filters,
        category,
        folderId,
        search: searchQuery || undefined
      }

      if (allowedTypes && allowedTypes.length > 0) {
        // For simplicity, use the first allowed type as mimeType filter
        fileFilters.mimeType = allowedTypes[0]
      }

      const pagination: FilePagination = {
        limit: 50,
        sortBy: sortField,
        sortOrder
      }

      const response = await fileService.getFiles(fileFilters, pagination)
      
      if (response.success && response.data) {
        setFiles(response.data.files)
      } else {
        setError(response.message || t('Erreur lors du chargement', 'Error loading files'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Erreur inconnue', 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [filters, category, folderId, searchQuery, allowedTypes, sortField, sortOrder, t])

  // Load files when dependencies change
  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  // Handle file selection
  const handleFileSelect = (file: FileItem) => {
    if (multiSelect) {
      const newSelected = new Set(selectedFiles)
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id)
      } else {
        newSelected.add(file.id)
      }
      setSelectedFiles(newSelected)
      
      const selectedFileObjects = files.filter(f => newSelected.has(f.id))
      onFilesSelect?.(selectedFileObjects)
    } else {
      onFileSelect?.(file)
    }
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set())
      onFilesSelect?.([])
    } else {
      const allIds = new Set(files.map(f => f.id))
      setSelectedFiles(allIds)
      onFilesSelect?.(files)
    }
  }

  // Handle sort change
  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Get file type icon
  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4 text-red-500" />
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4 text-green-500" />
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-4 w-4 text-yellow-500" />
    return <FileText className="h-4 w-4 text-gray-500" />
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    return fileService.formatFileSize(bytes)
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  // Render view mode selector
  const renderViewModeSelector = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {viewMode === 'grid' && <Grid3X3 className="h-4 w-4" />}
          {viewMode === 'list' && <List className="h-4 w-4" />}
          {viewMode === 'table' && <Rows className="h-4 w-4" />}
          {viewMode === 'tiles' && <LayoutGrid className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('Mode d\'affichage', 'View Mode')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={viewMode === 'grid'}
          onCheckedChange={() => setViewMode('grid')}
        >
          <Grid3X3 className="h-4 w-4 mr-2" />
          {t('Grille', 'Grid')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={viewMode === 'list'}
          onCheckedChange={() => setViewMode('list')}
        >
          <List className="h-4 w-4 mr-2" />
          {t('Liste', 'List')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={viewMode === 'table'}
          onCheckedChange={() => setViewMode('table')}
        >
          <Rows className="h-4 w-4 mr-2" />
          {t('Tableau', 'Table')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={viewMode === 'tiles'}
          onCheckedChange={() => setViewMode('tiles')}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          {t('Tuiles', 'Tiles')}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Render sort selector
  const renderSortSelector = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('Trier par', 'Sort by')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSortChange('originalName')}>
          <FileText className="h-4 w-4 mr-2" />
          {t('Nom', 'Name')}
          {sortField === 'originalName' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSortChange('size')}>
          <HardDrive className="h-4 w-4 mr-2" />
          {t('Taille', 'Size')}
          {sortField === 'size' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSortChange('createdAt')}>
          <Calendar className="h-4 w-4 mr-2" />
          {t('Date de création', 'Created')}
          {sortField === 'createdAt' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSortChange('updatedAt')}>
          <Calendar className="h-4 w-4 mr-2" />
          {t('Modifié', 'Modified')}
          {sortField === 'updatedAt' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSortChange('category')}>
          <Tag className="h-4 w-4 mr-2" />
          {t('Catégorie', 'Category')}
          {sortField === 'category' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {files.map((file) => (
        <ContextMenu key={file.id}>
          <ContextMenuTrigger>
            <Card 
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                selectedFiles.has(file.id) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleFileSelect(file)}
            >
              <CardContent className="p-4 text-center">
                {multiSelect && (
                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={selectedFiles.has(file.id)}
                      onChange={() => handleFileSelect(file)}
                    />
                  </div>
                )}
                <div className="mb-2">
                  {file.mimeType.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="w-16 h-16 mx-auto object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 mx-auto flex items-center justify-center bg-secondary rounded">
                      {getFileTypeIcon(file.mimeType)}
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-sm truncate" title={file.originalName}>
                  {file.originalName}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(file.size)}
                </p>
                <Badge variant="outline" className="text-xs mt-1">
                  {file.category}
                </Badge>
              </CardContent>
            </Card>
          </ContextMenuTrigger>
          
          <ContextMenuContent>
            <ContextMenuItem onClick={() => onFileSelect?.(file)}>
              <Eye className="h-4 w-4 mr-2" />
              {t('Aperçu', 'Preview')}
            </ContextMenuItem>
            <ContextMenuItem>
              <Download className="h-4 w-4 mr-2" />
              {t('Télécharger', 'Download')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setActiveFile(file)
                setShowSharing(true)
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {t('Partager', 'Share')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setActiveFile(file)
                setShowVersions(true)
              }}
            >
              <History className="h-4 w-4 mr-2" />
              {t('Versions', 'Versions')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setActiveFile(file)
                setShowAnalytics(true)
              }}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('Analyses', 'Analytics')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setActiveFile(file)
                setShowCollaboration(true)
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('Collaboration', 'Collaboration')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setSelectedFileForTagging(file)
                setShowTagging(true)
              }}
            >
              <Tag className="h-4 w-4 mr-2" />
              {t('Tags', 'Tags')}
            </ContextMenuItem>
            <ContextMenuItem className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('Supprimer', 'Delete')}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  )

  // Render list view
  const renderListView = () => (
    <div className="space-y-2">
      {files.map((file) => (
        <Card 
          key={file.id}
          className={`cursor-pointer hover:shadow-sm transition-shadow ${
            selectedFiles.has(file.id) ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => handleFileSelect(file)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {multiSelect && (
                <Checkbox
                  checked={selectedFiles.has(file.id)}
                  onChange={() => handleFileSelect(file)}
                />
              )}
              
              <div className="flex-shrink-0">
                {file.mimeType.startsWith('image/') ? (
                  <img
                    src={file.url}
                    alt={file.originalName}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-secondary rounded">
                    {getFileTypeIcon(file.mimeType)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{file.originalName}</h4>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span>{formatFileSize(file.size)}</span>
                  <span>{formatDate(file.createdAt)}</span>
                  <Badge variant="outline" className="text-xs">
                    {file.category}
                  </Badge>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onFileSelect?.(file)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('Aperçu', 'Preview')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    {t('Télécharger', 'Download')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('Partager', 'Share')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedFileForTagging(file)
                      setShowTagging(true)
                    }}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    {t('Tags', 'Tags')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('Supprimer', 'Delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        {t("Chargement des fichiers...", "Loading files...")}
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
        <Button variant="outline" size="sm" onClick={loadFiles} className="mt-2">
          {t("Réessayer", "Retry")}
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Advanced Search */}
      {showAdvancedSearch && (
        <AdvancedSearchFilter
          onFiltersChange={setFilters}
          onSearch={setSearchQuery}
          initialFilters={filters}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {multiSelect && selectedFiles.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedFiles.size} {t('sélectionné(s)', 'selected')}
              </span>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t('Télécharger', 'Download')}
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                {t('Supprimer', 'Delete')}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showAdvancedSearch ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t('Filtres', 'Filters')}
          </Button>
          
          {renderSortSelector()}
          {renderViewModeSelector()}
          
          {multiSelect && (
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedFiles.size === files.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* File Content */}
      <ScrollArea className="h-96">
        {files.length > 0 ? (
          <>
            {viewMode === 'grid' && renderGridView()}
            {(viewMode === 'list' || viewMode === 'table' || viewMode === 'tiles') && renderListView()}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">
              {searchQuery || Object.keys(filters).length > 0
                ? t("Aucun fichier trouvé", "No files found")
                : t("Aucun fichier dans ce dossier", "No files in this folder")
              }
            </p>
          </div>
        )}
      </ScrollArea>

      {/* File Tagging Dialog */}
      {showTagging && selectedFileForTagging && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {t('Gérer les tags', 'Manage Tags')} - {selectedFileForTagging.originalName}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowTagging(false)
                    setSelectedFileForTagging(null)
                  }}
                >
                  ×
                </Button>
              </div>
              
              <FileTaggingSystem
                fileId={selectedFileForTagging.id}
                fileTags={selectedFileForTagging.tags || []}
                onTagsChange={(tags) => {
                  // Update file tags in the local state
                  setFiles(prev => prev.map(f => 
                    f.id === selectedFileForTagging.id 
                      ? { ...f, tags }
                      : f
                  ))
                }}
                showManagement={true}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* File Sharing Dialog */}
      {activeFile && (
        <FileSharingSystem
          file={activeFile}
          isOpen={showSharing}
          onClose={() => {
            setShowSharing(false)
            setActiveFile(null)
          }}
        />
      )}

      {/* File Version Control Dialog */}
      {activeFile && (
        <FileVersionControl
          file={activeFile}
          isOpen={showVersions}
          onClose={() => {
            setShowVersions(false)
            setActiveFile(null)
          }}
          onVersionRestore={(versionId) => {
            console.log('Version restored:', versionId)
            // Refresh files list
            loadFiles()
          }}
        />
      )}

      {/* File Analytics Dialog */}
      {activeFile && (
        <Dialog open={showAnalytics} onOpenChange={(open) => {
          setShowAnalytics(open)
          if (!open) setActiveFile(null)
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <FileAnalyticsDashboard
              fileId={activeFile.id}
              className="p-0"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* File Collaboration Dialog */}
      {activeFile && (
        <FileCollaboration
          file={activeFile}
          isOpen={showCollaboration}
          onClose={() => {
            setShowCollaboration(false)
            setActiveFile(null)
          }}
        />
      )}
    </div>
  )
}

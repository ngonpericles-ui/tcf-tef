"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Tag,
  Plus,
  X,
  Search,
  Hash,
  Sparkles,
  Check,
  ChevronsUpDown,
  Loader2,
  AlertCircle,
  Palette,
  Edit,
  Trash2
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { fileService, type FileItem } from "@/lib/services/fileService"

interface FileTaggingSystemProps {
  fileId?: string
  fileTags?: string[]
  onTagsChange?: (tags: string[]) => void
  showManagement?: boolean
  className?: string
}

interface TagData {
  id: string
  name: string
  color: string
  description?: string
  usageCount: number
  createdAt: string
}

interface TagManagerProps {
  isOpen: boolean
  onClose: () => void
  onTagsUpdated?: () => void
}

function TagManager({ isOpen, onClose, onTagsUpdated }: TagManagerProps) {
  const { lang } = useLang()
  const [tags, setTags] = useState<TagData[]>([])
  const [loading, setLoading] = useState(true)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3b82f6')
  const [newTagDescription, setNewTagDescription] = useState('')
  const [editingTag, setEditingTag] = useState<TagData | null>(null)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  const tagColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#6366f1', '#06b6d4', '#84cc16', '#f97316'
  ]

  // Load all tags
  const loadTags = useCallback(async () => {
    try {
      setLoading(true)
      // Mock data - in real app, this would come from API
      const mockTags: TagData[] = [
        { id: '1', name: 'A1', color: '#10b981', description: 'Niveau débutant', usageCount: 45, createdAt: new Date().toISOString() },
        { id: '2', name: 'A2', color: '#3b82f6', description: 'Niveau élémentaire', usageCount: 38, createdAt: new Date().toISOString() },
        { id: '3', name: 'B1', color: '#f59e0b', description: 'Niveau intermédiaire', usageCount: 52, createdAt: new Date().toISOString() },
        { id: '4', name: 'B2', color: '#ef4444', description: 'Niveau intermédiaire avancé', usageCount: 41, createdAt: new Date().toISOString() },
        { id: '5', name: 'C1', color: '#8b5cf6', description: 'Niveau avancé', usageCount: 29, createdAt: new Date().toISOString() },
        { id: '6', name: 'C2', color: '#ec4899', description: 'Niveau maîtrise', usageCount: 18, createdAt: new Date().toISOString() },
        { id: '7', name: 'grammaire', color: '#06b6d4', description: 'Exercices de grammaire', usageCount: 67, createdAt: new Date().toISOString() },
        { id: '8', name: 'vocabulaire', color: '#84cc16', description: 'Exercices de vocabulaire', usageCount: 73, createdAt: new Date().toISOString() },
        { id: '9', name: 'oral', color: '#f97316', description: 'Exercices d\'expression orale', usageCount: 34, createdAt: new Date().toISOString() },
        { id: '10', name: 'écrit', color: '#6366f1', description: 'Exercices d\'expression écrite', usageCount: 42, createdAt: new Date().toISOString() }
      ]
      setTags(mockTags)
    } catch (error) {
      console.error('Error loading tags:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadTags()
    }
  }, [isOpen, loadTags])

  // Create new tag
  const createTag = async () => {
    if (!newTagName.trim()) return

    const newTag: TagData = {
      id: Date.now().toString(),
      name: newTagName.trim().toLowerCase(),
      color: newTagColor,
      description: newTagDescription.trim() || undefined,
      usageCount: 0,
      createdAt: new Date().toISOString()
    }

    setTags(prev => [newTag, ...prev])
    setNewTagName('')
    setNewTagDescription('')
    setNewTagColor('#3b82f6')
    onTagsUpdated?.()
  }

  // Update tag
  const updateTag = async (tag: TagData) => {
    setTags(prev => prev.map(t => t.id === tag.id ? tag : t))
    setEditingTag(null)
    onTagsUpdated?.()
  }

  // Delete tag
  const deleteTag = async (tagId: string) => {
    if (!confirm(t('Êtes-vous sûr de vouloir supprimer ce tag ?', 'Are you sure you want to delete this tag?'))) {
      return
    }
    setTags(prev => prev.filter(t => t.id !== tagId))
    onTagsUpdated?.()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {t('Gestionnaire de tags', 'Tag Manager')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create New Tag */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Créer un nouveau tag', 'Create New Tag')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('Nom du tag', 'Tag Name')}</label>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder={t('Ex: grammaire, A1, oral...', 'Ex: grammar, A1, oral...')}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">{t('Description (optionnel)', 'Description (optional)')}</label>
                <Input
                  value={newTagDescription}
                  onChange={(e) => setNewTagDescription(e.target.value)}
                  placeholder={t('Description du tag', 'Tag description')}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">{t('Couleur', 'Color')}</label>
                <div className="flex gap-2 mt-2">
                  {tagColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newTagColor === color ? 'border-foreground' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <Button onClick={createTag} disabled={!newTagName.trim()} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {t('Créer le tag', 'Create Tag')}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Tags existants', 'Existing Tags')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    {t('Chargement...', 'Loading...')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <div>
                            <p className="font-medium">{tag.name}</p>
                            {tag.description && (
                              <p className="text-xs text-muted-foreground">{tag.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {tag.usageCount}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTag(tag)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTag(tag.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Edit Tag Dialog */}
        {editingTag && (
          <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('Modifier le tag', 'Edit Tag')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t('Nom', 'Name')}</label>
                  <Input
                    value={editingTag.name}
                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('Description', 'Description')}</label>
                  <Input
                    value={editingTag.description || ''}
                    onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('Couleur', 'Color')}</label>
                  <div className="flex gap-2 mt-2">
                    {tagColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditingTag({ ...editingTag, color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          editingTag.color === color ? 'border-foreground' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingTag(null)}>
                    {t('Annuler', 'Cancel')}
                  </Button>
                  <Button onClick={() => updateTag(editingTag)}>
                    {t('Sauvegarder', 'Save')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function FileTaggingSystem({
  fileId,
  fileTags = [],
  onTagsChange,
  showManagement = false,
  className = ""
}: FileTaggingSystemProps) {
  const { lang } = useLang()
  
  const [selectedTags, setSelectedTags] = useState<string[]>(fileTags)
  const [availableTags, setAvailableTags] = useState<TagData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showTagManager, setShowTagManager] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Load available tags
  const loadAvailableTags = useCallback(async () => {
    try {
      setLoading(true)
      // Mock data - in real app, this would come from API
      const mockTags: TagData[] = [
        { id: '1', name: 'A1', color: '#10b981', description: 'Niveau débutant', usageCount: 45, createdAt: new Date().toISOString() },
        { id: '2', name: 'A2', color: '#3b82f6', description: 'Niveau élémentaire', usageCount: 38, createdAt: new Date().toISOString() },
        { id: '3', name: 'B1', color: '#f59e0b', description: 'Niveau intermédiaire', usageCount: 52, createdAt: new Date().toISOString() },
        { id: '4', name: 'B2', color: '#ef4444', description: 'Niveau intermédiaire avancé', usageCount: 41, createdAt: new Date().toISOString() },
        { id: '5', name: 'C1', color: '#8b5cf6', description: 'Niveau avancé', usageCount: 29, createdAt: new Date().toISOString() },
        { id: '6', name: 'C2', color: '#ec4899', description: 'Niveau maîtrise', usageCount: 18, createdAt: new Date().toISOString() },
        { id: '7', name: 'grammaire', color: '#06b6d4', description: 'Exercices de grammaire', usageCount: 67, createdAt: new Date().toISOString() },
        { id: '8', name: 'vocabulaire', color: '#84cc16', description: 'Exercices de vocabulaire', usageCount: 73, createdAt: new Date().toISOString() },
        { id: '9', name: 'oral', color: '#f97316', description: 'Exercices d\'expression orale', usageCount: 34, createdAt: new Date().toISOString() },
        { id: '10', name: 'écrit', color: '#6366f1', description: 'Exercices d\'expression écrite', usageCount: 42, createdAt: new Date().toISOString() }
      ]
      setAvailableTags(mockTags)
    } catch (error) {
      console.error('Error loading tags:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAvailableTags()
  }, [loadAvailableTags])

  // Update selected tags when fileTags prop changes
  useEffect(() => {
    setSelectedTags(fileTags)
  }, [fileTags])

  // Add tag
  const addTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      const newTags = [...selectedTags, tagName]
      setSelectedTags(newTags)
      onTagsChange?.(newTags)
    }
  }

  // Remove tag
  const removeTag = (tagName: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagName)
    setSelectedTags(newTags)
    onTagsChange?.(newTags)
  }

  // Get AI suggestions based on file content/name
  const getAISuggestions = () => {
    // Mock AI suggestions - in real app, this would use AI to analyze file content
    const suggestions = ['grammaire', 'A2', 'exercice', 'français']
    return suggestions.filter(tag => !selectedTags.includes(tag))
  }

  // Filter available tags based on search
  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedTags.includes(tag.name)
  )

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Tags */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            {t('Tags', 'Tags')}
          </label>
          {showManagement && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTagManager(true)}
            >
              <Palette className="h-4 w-4 mr-2" />
              {t('Gérer', 'Manage')}
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 min-h-[2rem] p-2 border rounded-lg">
          {selectedTags.length > 0 ? (
            selectedTags.map(tagName => {
              const tagData = availableTags.find(t => t.name === tagName)
              return (
                <Badge
                  key={tagName}
                  variant="secondary"
                  className="flex items-center gap-1"
                  style={{
                    backgroundColor: tagData?.color ? `${tagData.color}20` : undefined,
                    borderColor: tagData?.color,
                    color: tagData?.color
                  }}
                >
                  <Hash className="h-3 w-3" />
                  {tagName}
                  <button
                    onClick={() => removeTag(tagName)}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })
          ) : (
            <span className="text-sm text-muted-foreground">
              {t('Aucun tag sélectionné', 'No tags selected')}
            </span>
          )}
        </div>
      </div>

      {/* Add Tags */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-start">
                <Plus className="h-4 w-4 mr-2" />
                {t('Ajouter des tags...', 'Add tags...')}
                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Command>
                <CommandInput
                  placeholder={t('Rechercher des tags...', 'Search tags...')}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandEmpty>
                  {t('Aucun tag trouvé', 'No tags found')}
                </CommandEmpty>
                <CommandGroup>
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => {
                        addTag(tag.name)
                        setShowSuggestions(false)
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                        {tag.description && (
                          <span className="text-xs text-muted-foreground">
                            - {tag.description}
                          </span>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {tag.usageCount}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            onClick={() => {
              const suggestions = getAISuggestions()
              suggestions.forEach(tag => addTag(tag))
            }}
            disabled={getAISuggestions().length === 0}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t('IA', 'AI')}
          </Button>
        </div>

        {/* AI Suggestions */}
        {getAISuggestions().length > 0 && (
          <div className="p-3 bg-secondary/50 rounded-lg">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t('Suggestions IA', 'AI Suggestions')}
            </p>
            <div className="flex flex-wrap gap-2">
              {getAISuggestions().map(suggestion => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(suggestion)}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tag Manager */}
      {showManagement && (
        <TagManager
          isOpen={showTagManager}
          onClose={() => setShowTagManager(false)}
          onTagsUpdated={loadAvailableTags}
        />
      )}
    </div>
  )
}

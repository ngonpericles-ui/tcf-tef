"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Calendar,
  CalendarIcon,
  Search,
  Filter,
  X,
  Tag,
  FileType,
  FolderOpen,
  User,
  Calendar as CalendarIcon2,
  HardDrive,
  SlidersHorizontal
} from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { useLang } from "@/components/language-provider"
import { type FileFilters, type FileItem } from "@/lib/services/fileService"

interface AdvancedSearchFilterProps {
  onFiltersChange: (filters: FileFilters) => void
  onSearch: (query: string) => void
  initialFilters?: FileFilters
  className?: string
}

interface FilterChipProps {
  label: string
  value: string
  onRemove: () => void
}

function FilterChip({ label, value, onRemove }: FilterChipProps) {
  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <span className="text-xs">{label}: {value}</span>
      <button onClick={onRemove} className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}

export default function AdvancedSearchFilter({
  onFiltersChange,
  onSearch,
  initialFilters = {},
  className = ""
}: AdvancedSearchFilterProps) {
  const { lang } = useLang()
  
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '')
  const [filters, setFilters] = useState<FileFilters>(initialFilters)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialFilters.dateFrom ? new Date(initialFilters.dateFrom) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialFilters.dateTo ? new Date(initialFilters.dateTo) : undefined
  )
  const [tagInput, setTagInput] = useState('')

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // File categories
  const categories = [
    { value: 'PROFILE_IMAGE', label: t('Images de profil', 'Profile Images') },
    { value: 'COURSE_MATERIAL', label: t('Matériel de cours', 'Course Material') },
    { value: 'POST_MEDIA', label: t('Médias de publication', 'Post Media') },
    { value: 'DOCUMENT', label: t('Documents', 'Documents') },
    { value: 'OTHER', label: t('Autres', 'Other') }
  ]

  // File types
  const fileTypes = [
    { value: 'image/', label: t('Images', 'Images') },
    { value: 'video/', label: t('Vidéos', 'Videos') },
    { value: 'audio/', label: t('Audio', 'Audio') },
    { value: 'application/pdf', label: 'PDF' },
    { value: 'application/msword', label: t('Documents Word', 'Word Documents') },
    { value: 'application/vnd.ms-excel', label: t('Feuilles Excel', 'Excel Sheets') },
    { value: 'application/vnd.ms-powerpoint', label: t('Présentations', 'Presentations') },
    { value: 'text/', label: t('Fichiers texte', 'Text Files') },
    { value: 'application/zip', label: t('Archives', 'Archives') }
  ]

  // Size ranges
  const sizeRanges = [
    { value: 'small', label: t('Petit (< 1 MB)', 'Small (< 1 MB)'), min: 0, max: 1024 * 1024 },
    { value: 'medium', label: t('Moyen (1-10 MB)', 'Medium (1-10 MB)'), min: 1024 * 1024, max: 10 * 1024 * 1024 },
    { value: 'large', label: t('Grand (10-100 MB)', 'Large (10-100 MB)'), min: 10 * 1024 * 1024, max: 100 * 1024 * 1024 },
    { value: 'xlarge', label: t('Très grand (> 100 MB)', 'Very Large (> 100 MB)'), min: 100 * 1024 * 1024, max: undefined }
  ]

  // Update filters when state changes
  useEffect(() => {
    const newFilters: FileFilters = {
      ...filters,
      search: searchQuery || undefined,
      dateFrom: startDate ? startDate.toISOString() : undefined,
      dateTo: endDate ? endDate.toISOString() : undefined
    }
    
    onFiltersChange(newFilters)
  }, [filters, searchQuery, startDate, endDate, onFiltersChange])

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearch(value)
  }

  // Handle filter changes
  const updateFilter = (key: keyof FileFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Handle size range selection
  const handleSizeRangeChange = (rangeValue: string) => {
    const range = sizeRanges.find(r => r.value === rangeValue)
    if (range) {
      updateFilter('sizeMin', range.min)
      updateFilter('sizeMax', range.max)
    }
  }

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && (!filters.tags || !filters.tags.includes(tagInput.trim()))) {
      const newTags = [...(filters.tags || []), tagInput.trim()]
      updateFilter('tags', newTags)
      setTagInput('')
    }
  }

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    const newTags = (filters.tags || []).filter(tag => tag !== tagToRemove)
    updateFilter('tags', newTags.length > 0 ? newTags : undefined)
  }

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({})
    setSearchQuery('')
    setStartDate(undefined)
    setEndDate(undefined)
    setTagInput('')
  }

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0
    if (filters.category) count++
    if (filters.mimeType) count++
    if (filters.sizeMin !== undefined || filters.sizeMax !== undefined) count++
    if (startDate || endDate) count++
    if (filters.tags && filters.tags.length > 0) count++
    if (filters.folderId) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("Rechercher des fichiers...", "Search files...")}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Button
          variant={showAdvanced ? "default" : "outline"}
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="relative"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {t("Filtres", "Filters")}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">{t("Filtres actifs:", "Active filters:")}</span>
          
          {filters.category && (
            <FilterChip
              label={t("Catégorie", "Category")}
              value={categories.find(c => c.value === filters.category)?.label || filters.category}
              onRemove={() => updateFilter('category', undefined)}
            />
          )}
          
          {filters.mimeType && (
            <FilterChip
              label={t("Type", "Type")}
              value={fileTypes.find(t => t.value === filters.mimeType)?.label || filters.mimeType}
              onRemove={() => updateFilter('mimeType', undefined)}
            />
          )}
          
          {(filters.sizeMin !== undefined || filters.sizeMax !== undefined) && (
            <FilterChip
              label={t("Taille", "Size")}
              value={t("Personnalisé", "Custom")}
              onRemove={() => {
                updateFilter('sizeMin', undefined)
                updateFilter('sizeMax', undefined)
              }}
            />
          )}
          
          {(startDate || endDate) && (
            <FilterChip
              label={t("Date", "Date")}
              value={t("Personnalisé", "Custom")}
              onRemove={() => {
                setStartDate(undefined)
                setEndDate(undefined)
              }}
            />
          )}
          
          {filters.tags && filters.tags.map(tag => (
            <FilterChip
              key={tag}
              label={t("Tag", "Tag")}
              value={tag}
              onRemove={() => removeTag(tag)}
            />
          ))}
          
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            {t("Effacer tout", "Clear all")}
          </Button>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("Filtres avancés", "Advanced Filters")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileType className="h-4 w-4" />
                  {t("Catégorie", "Category")}
                </Label>
                <Select value={filters.category || ''} onValueChange={(value) => updateFilter('category', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Toutes les catégories", "All categories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("Toutes les catégories", "All categories")}</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Type Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileType className="h-4 w-4" />
                  {t("Type de fichier", "File Type")}
                </Label>
                <Select value={filters.mimeType || ''} onValueChange={(value) => updateFilter('mimeType', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Tous les types", "All types")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("Tous les types", "All types")}</SelectItem>
                    {fileTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Size Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  {t("Taille", "Size")}
                </Label>
                <Select onValueChange={handleSizeRangeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Toutes les tailles", "All sizes")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("Toutes les tailles", "All sizes")}</SelectItem>
                    {sizeRanges.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon2 className="h-4 w-4" />
                  {t("Période", "Date Range")}
                </Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : t("Date de début", "Start date")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy") : t("Date de fin", "End date")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {t("Tags", "Tags")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("Ajouter un tag...", "Add tag...")}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1"
                  />
                  <Button onClick={addTag} disabled={!tagInput.trim()}>
                    {t("Ajouter", "Add")}
                  </Button>
                </div>
                {filters.tags && filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {filters.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex justify-between">
              <Button variant="outline" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-2" />
                {t("Effacer tous les filtres", "Clear all filters")}
              </Button>
              
              <Button onClick={() => setShowAdvanced(false)}>
                {t("Appliquer les filtres", "Apply filters")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

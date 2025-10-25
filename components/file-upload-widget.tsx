"use client"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Upload,
  X,
  File,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import { fileService, type FileItem, type FileUploadProgress } from "@/lib/services/fileService"

interface FileUploadWidgetProps {
  category: FileItem['category']
  maxFiles?: number
  maxFileSize?: number // in bytes
  allowedTypes?: string[]
  onUploadComplete?: (files: FileItem[]) => void
  onUploadProgress?: (progress: FileUploadProgress[]) => void
  onError?: (error: string) => void
  className?: string
  compact?: boolean
}

interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  result?: FileItem
}

export default function FileUploadWidget({
  category,
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  allowedTypes,
  onUploadComplete,
  onUploadProgress,
  onError,
  className = "",
  compact = false
}: FileUploadWidgetProps) {
  const { lang } = useLang()
  
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    // Validate file count
    if (uploadFiles.length + fileArray.length > maxFiles) {
      onError?.(t(
        `Vous ne pouvez téléverser que ${maxFiles} fichiers maximum`,
        `You can only upload a maximum of ${maxFiles} files`
      ))
      return
    }

    // Validate and process files
    const validFiles: UploadFile[] = []
    
    for (const file of fileArray) {
      // Check file size
      if (file.size > maxFileSize) {
        onError?.(t(
          `Le fichier "${file.name}" est trop volumineux (max: ${fileService.formatFileSize(maxFileSize)})`,
          `File "${file.name}" is too large (max: ${fileService.formatFileSize(maxFileSize)})`
        ))
        continue
      }

      // Check file type
      if (allowedTypes && !allowedTypes.some(type => file.type.includes(type))) {
        onError?.(t(
          `Le type de fichier "${file.name}" n'est pas autorisé`,
          `File type "${file.name}" is not allowed`
        ))
        continue
      }

      validFiles.push({
        id: `upload-${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: 'pending'
      })
    }

    if (validFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...validFiles])
    }
  }, [uploadFiles.length, maxFiles, maxFileSize, allowedTypes, onError, t])

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }, [handleFileSelect])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }, [handleFileSelect])

  // Remove file from upload queue
  const removeFile = useCallback((fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  // Start upload process
  const startUpload = useCallback(async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    try {
      // Update all pending files to uploading status
      setUploadFiles(prev => prev.map(f => 
        f.status === 'pending' ? { ...f, status: 'uploading' as const } : f
      ))

      const uploadPromises = pendingFiles.map(async (uploadFile) => {
        try {
          const result = await fileService.uploadFile(
            uploadFile.file,
            category,
            undefined,
            (progress) => {
              setUploadFiles(prev => prev.map(f => 
                f.id === uploadFile.id 
                  ? { ...f, progress: progress.progress }
                  : f
              ))
            }
          )

          if (result.success && result.data) {
            setUploadFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'completed', progress: 100, result: result.data }
                : f
            ))
            return result.data
          } else {
            throw new Error(result.message || t('Échec du téléversement', 'Upload failed'))
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : t('Erreur inconnue', 'Unknown error')
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'error', error: errorMessage }
              : f
          ))
          throw error
        }
      })

      const results = await Promise.allSettled(uploadPromises)
      const successfulUploads = results
        .filter((result): result is PromiseFulfilledResult<FileItem> => result.status === 'fulfilled')
        .map(result => result.value)

      if (successfulUploads.length > 0) {
        onUploadComplete?.(successfulUploads)
      }

      const failures = results.filter(result => result.status === 'rejected')
      if (failures.length > 0) {
        onError?.(t(
          `${failures.length} fichier(s) n'ont pas pu être téléversés`,
          `${failures.length} file(s) failed to upload`
        ))
      }

    } catch (error) {
      onError?.(error instanceof Error ? error.message : t('Erreur de téléversement', 'Upload error'))
    } finally {
      setIsUploading(false)
    }
  }, [uploadFiles, category, onUploadComplete, onError, t])

  // Clear completed uploads
  const clearCompleted = useCallback(() => {
    setUploadFiles(prev => prev.filter(f => f.status !== 'completed'))
  }, [])

  // Clear all uploads
  const clearAll = useCallback(() => {
    setUploadFiles([])
  }, [])

  // Get file type icon
  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4 text-red-500" />
    if (file.type.startsWith('audio/')) return <Music className="h-4 w-4 text-green-500" />
    if (file.type.includes('zip') || file.type.includes('rar')) return <Archive className="h-4 w-4 text-yellow-500" />
    return <FileText className="h-4 w-4 text-gray-500" />
  }

  // Get status icon
  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <File className="h-4 w-4 text-muted-foreground" />
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const pendingCount = uploadFiles.filter(f => f.status === 'pending').length
  const completedCount = uploadFiles.filter(f => f.status === 'completed').length
  const errorCount = uploadFiles.filter(f => f.status === 'error').length

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("Cliquez ou glissez des fichiers ici", "Click or drag files here")}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes?.join(',') || '*/*'}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {uploadFiles.length > 0 && (
          <div className="space-y-1">
            {uploadFiles.slice(0, 3).map((uploadFile) => (
              <div key={uploadFile.id} className="flex items-center gap-2 text-sm">
                {getStatusIcon(uploadFile.status)}
                <span className="flex-1 truncate">{uploadFile.file.name}</span>
                {uploadFile.status === 'uploading' && (
                  <span className="text-xs text-muted-foreground">{uploadFile.progress}%</span>
                )}
              </div>
            ))}
            {uploadFiles.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{uploadFiles.length - 3} {t("autres fichiers", "more files")}
              </p>
            )}
          </div>
        )}

        {pendingCount > 0 && (
          <Button onClick={startUpload} disabled={isUploading} size="sm" className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("Téléversement...", "Uploading...")}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {t(`Téléverser ${pendingCount} fichier(s)`, `Upload ${pendingCount} file(s)`)}
              </>
            )}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <Card>
        <CardContent className="p-0">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {t("Glissez-déposez vos fichiers ici", "Drag and drop your files here")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("Ou cliquez pour sélectionner des fichiers", "Or click to select files")}
            </p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              {t("Sélectionner des fichiers", "Select Files")}
            </Button>
            
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <p>{t("Maximum", "Maximum")}: {maxFiles} {t("fichiers", "files")}</p>
              <p>{t("Taille max", "Max size")}: {fileService.formatFileSize(maxFileSize)}</p>
              {allowedTypes && (
                <p>{t("Types autorisés", "Allowed types")}: {allowedTypes.join(', ')}</p>
              )}
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes?.join(',') || '*/*'}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">
                {t("Files à téléverser", "Files to Upload")} ({uploadFiles.length})
              </h4>
              <div className="flex gap-2">
                {completedCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCompleted}>
                    {t("Effacer terminés", "Clear Completed")}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={clearAll}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("Tout effacer", "Clear All")}
                </Button>
              </div>
            </div>

            {/* Status Summary */}
            <div className="flex gap-4 mb-4">
              {pendingCount > 0 && (
                <Badge variant="secondary">
                  {pendingCount} {t("en attente", "pending")}
                </Badge>
              )}
              {completedCount > 0 && (
                <Badge variant="default" className="bg-green-500">
                  {completedCount} {t("terminés", "completed")}
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive">
                  {errorCount} {t("erreurs", "errors")}
                </Badge>
              )}
            </div>

            {/* File List */}
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {uploadFiles.map((uploadFile) => (
                  <div key={uploadFile.id} className="flex items-center gap-3 p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getFileTypeIcon(uploadFile.file)}
                      {getStatusIcon(uploadFile.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{uploadFile.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {fileService.formatFileSize(uploadFile.file.size)}
                      </p>
                      
                      {uploadFile.status === 'uploading' && (
                        <Progress value={uploadFile.progress} className="h-1 mt-1" />
                      )}
                      
                      {uploadFile.error && (
                        <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {uploadFile.status === 'uploading' && (
                        <span className="text-sm text-muted-foreground">
                          {uploadFile.progress}%
                        </span>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                        disabled={uploadFile.status === 'uploading'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Upload Button */}
            {pendingCount > 0 && (
              <div className="mt-4 flex justify-center">
                <Button onClick={startUpload} disabled={isUploading} className="w-full">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("Téléversement en cours...", "Uploading...")}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {t(`Téléverser ${pendingCount} fichier(s)`, `Upload ${pendingCount} file(s)`)}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

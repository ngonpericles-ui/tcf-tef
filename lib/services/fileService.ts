import { apiClient, ApiResponse } from '@/lib/api-client'

export interface FileItem {
  id: string
  originalName: string
  filename: string
  mimeType: string
  size: number
  url: string
  cloudinaryPublicId?: string
  userId: string
  category: 'PROFILE_IMAGE' | 'COURSE_MATERIAL' | 'POST_MEDIA' | 'DOCUMENT' | 'OTHER'
  metadata?: any
  createdAt: string
  updatedAt: string
  folderId?: string
  tags?: string[]
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface FolderItem {
  id: string
  name: string
  description?: string
  parentId?: string
  userId: string
  color?: string
  isShared: boolean
  createdAt: string
  updatedAt: string
  fileCount: number
  subfolderCount: number
  totalSize: number
  path: string[]
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface FileUploadProgress {
  fileId: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}

export interface FileFilters {
  category?: string
  mimeType?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  sizeMin?: number
  sizeMax?: number
  search?: string
  folderId?: string
  tags?: string[]
  hasNoFolder?: boolean
}

export interface FolderFilters {
  search?: string
  parentId?: string
  userId?: string
  isShared?: boolean
}

export interface FilePagination {
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'originalName' | 'size' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface FileStats {
  totalFiles: number
  totalSize: number
  filesByCategory: Record<string, number>
  filesByType: Record<string, number>
  storageUsed: number
  storageLimit: number
}

export interface FileShare {
  id: string
  fileId: string
  sharedWith: string
  permissions: 'read' | 'write' | 'admin'
  expiresAt?: string
  createdAt: string
}



class FileService {
  /**
   * Get user files with filters and pagination
   */
  async getFiles(
    filters: FileFilters = {},
    pagination: FilePagination = {}
  ): Promise<ApiResponse<{ files: FileItem[]; total: number; stats: FileStats }>> {
    const params = new URLSearchParams()
    
    // Add filters
    if (filters.category) params.append('category', filters.category)
    if (filters.mimeType) params.append('mimeType', filters.mimeType)
    if (filters.userId) params.append('userId', filters.userId)
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)
    if (filters.sizeMin) params.append('sizeMin', filters.sizeMin.toString())
    if (filters.sizeMax) params.append('sizeMax', filters.sizeMax.toString())
    if (filters.search) params.append('search', filters.search)
    
    // Add pagination
    if (pagination.page) params.append('page', pagination.page.toString())
    if (pagination.limit) params.append('limit', pagination.limit.toString())
    if (pagination.sortBy) params.append('sortBy', pagination.sortBy)
    if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder)
    
    const queryString = params.toString()
    const url = queryString ? `/files?${queryString}` : '/files'
    
    return apiClient.get(url)
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string): Promise<ApiResponse<FileItem>> {
    return apiClient.getFileById(fileId)
  }

  /**
   * Upload single file
   */
  async uploadFile(
    file: File,
    category: FileItem['category'],
    metadata?: any,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<ApiResponse<FileItem>> {
    try {
      // Simulate progress updates
      if (onProgress) {
        onProgress({
          fileId: 'temp-' + Date.now(),
          progress: 0,
          status: 'uploading'
        })
      }

      const result = await apiClient.uploadFile(file, category, metadata)

      if (onProgress) {
        onProgress({
          fileId: result.data?.id || 'temp',
          progress: 100,
          status: result.success ? 'completed' : 'error',
          error: result.success ? undefined : result.message
        })
      }

      return result
    } catch (error) {
      if (onProgress) {
        onProgress({
          fileId: 'temp',
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        })
      }
      throw error
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    category: FileItem['category'],
    metadata?: any,
    onProgress?: (progress: FileUploadProgress[]) => void
  ): Promise<ApiResponse<FileItem[]>> {
    try {
      const progressArray: FileUploadProgress[] = files.map((file, index) => ({
        fileId: `temp-${Date.now()}-${index}`,
        progress: 0,
        status: 'uploading'
      }))

      if (onProgress) {
        onProgress(progressArray)
      }

      const result = await apiClient.uploadMultipleFiles(files, category, metadata)

      // Update progress to completed
      const completedProgress = progressArray.map((p, index) => ({
        ...p,
        fileId: result.data?.[index]?.id || p.fileId,
        progress: 100,
        status: result.success ? 'completed' as const : 'error' as const,
        error: result.success ? undefined : result.message
      }))

      if (onProgress) {
        onProgress(completedProgress)
      }

      return result
    } catch (error) {
      const errorProgress = files.map((_, index) => ({
        fileId: `temp-${Date.now()}-${index}`,
        progress: 0,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Upload failed'
      }))

      if (onProgress) {
        onProgress(errorProgress)
      }
      throw error
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<ApiResponse<void>> {
    return apiClient.deleteFile(fileId)
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(fileIds: string[]): Promise<ApiResponse<void>> {
    const results = await Promise.allSettled(
      fileIds.map(id => this.deleteFile(id))
    )
    
    const failures = results.filter(r => r.status === 'rejected')
    if (failures.length > 0) {
      return {
        success: false,
        message: `Failed to delete ${failures.length} files`
      }
    }
    
    return { success: true }
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(fileId: string, metadata: any): Promise<ApiResponse<FileItem>> {
    return apiClient.updateFileMetadata(fileId, metadata)
  }

  /**
   * Get file download URL
   */
  async getDownloadUrl(fileId: string): Promise<ApiResponse<{ url: string }>> {
    return apiClient.getFileDownloadUrl(fileId)
  }

  /**
   * Get file preview URL
   */
  async getPreviewUrl(fileId: string): Promise<ApiResponse<{ url: string }>> {
    return apiClient.getFilePreview(fileId)
  }

  /**
   * Share file with user
   */
  async shareFile(
    fileId: string,
    shareData: {
      sharedWith: string
      permissions: 'read' | 'write' | 'admin'
      expiresAt?: string
    }
  ): Promise<ApiResponse<FileShare>> {
    return apiClient.shareFile(fileId, shareData)
  }

  /**
   * Get file shares
   */
  async getFileShares(fileId: string): Promise<ApiResponse<FileShare[]>> {
    return apiClient.getFileShares(fileId)
  }

  /**
   * Revoke file share
   */
  async revokeFileShare(fileId: string, shareId: string): Promise<ApiResponse<void>> {
    return apiClient.revokeFileShare(fileId, shareId)
  }

  /**
   * Get file storage statistics
   */
  async getStorageStats(): Promise<ApiResponse<FileStats>> {
    return apiClient.getFileStorageStats()
  }

  /**
   * Get file categories
   */
  async getCategories(): Promise<ApiResponse<{ id: string; name: string; description?: string }[]>> {
    return apiClient.getFileCategories()
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get file type icon
   */
  getFileTypeIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📋'
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️'
    return '📁'
  }

  /**
   * Check if file type is previewable
   */
  isPreviewable(mimeType: string): boolean {
    return (
      mimeType.startsWith('image/') ||
      mimeType.includes('pdf') ||
      mimeType.startsWith('text/') ||
      mimeType.includes('json')
    )
  }

  // FOLDER MANAGEMENT METHODS

  /**
   * Get folders with filtering and pagination
   */
  async getFolders(filters: FolderFilters = {}, pagination: FilePagination = {}): Promise<ApiResponse<{ folders: FolderItem[]; total: number }>> {
    const params = new URLSearchParams()

    // Add filters
    if (filters.search) params.append('search', filters.search)
    if (filters.parentId) params.append('parentId', filters.parentId)
    if (filters.userId) params.append('userId', filters.userId)
    if (filters.isShared !== undefined) params.append('isShared', filters.isShared.toString())

    // Add pagination
    if (pagination.page) params.append('page', pagination.page.toString())
    if (pagination.limit) params.append('limit', pagination.limit.toString())
    if (pagination.sortBy) params.append('sortBy', pagination.sortBy)
    if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder)

    const queryString = params.toString()
    const url = queryString ? `/folders?${queryString}` : '/folders'

    return apiClient.get(url) as Promise<ApiResponse<{ folders: FolderItem[]; total: number }>>
  }

  /**
   * Create new folder
   */
  async createFolder(name: string, parentId?: string, description?: string, color?: string): Promise<ApiResponse<FolderItem>> {
    return apiClient.post('/folders', {
      name,
      parentId,
      description,
      color
    }) as Promise<ApiResponse<FolderItem>>
  }

  /**
   * Update folder
   */
  async updateFolder(folderId: string, updates: Partial<Pick<FolderItem, 'name' | 'description' | 'color'>>): Promise<ApiResponse<FolderItem>> {
    return apiClient.put(`/folders/${folderId}`, updates) as Promise<ApiResponse<FolderItem>>
  }

  /**
   * Delete folder
   */
  async deleteFolder(folderId: string, moveFilesToParent: boolean = false): Promise<ApiResponse<void>> {
    return apiClient.delete(`/folders/${folderId}?moveFiles=${moveFilesToParent}`) as Promise<ApiResponse<void>>
  }

  /**
   * Move file to folder
   */
  async moveFileToFolder(fileId: string, folderId?: string): Promise<ApiResponse<FileItem>> {
    return apiClient.put(`/files/${fileId}/move`, { folderId }) as Promise<ApiResponse<FileItem>>
  }

  /**
   * Move folder to another folder
   */
  async moveFolder(folderId: string, parentId?: string): Promise<ApiResponse<FolderItem>> {
    return apiClient.put(`/folders/${folderId}/move`, { parentId }) as Promise<ApiResponse<FolderItem>>
  }

  /**
   * Get folder breadcrumb path
   */
  async getFolderPath(folderId: string): Promise<ApiResponse<FolderItem[]>> {
    return apiClient.get(`/folders/${folderId}/path`) as Promise<ApiResponse<FolderItem[]>>
  }

  /**
   * Generate folder color options
   */
  getFolderColors(): { name: string; value: string; class: string }[] {
    return [
      { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500' },
      { name: 'Green', value: '#10b981', class: 'bg-green-500' },
      { name: 'Purple', value: '#8b5cf6', class: 'bg-purple-500' },
      { name: 'Red', value: '#ef4444', class: 'bg-red-500' },
      { name: 'Yellow', value: '#f59e0b', class: 'bg-yellow-500' },
      { name: 'Pink', value: '#ec4899', class: 'bg-pink-500' },
      { name: 'Indigo', value: '#6366f1', class: 'bg-indigo-500' },
      { name: 'Gray', value: '#6b7280', class: 'bg-gray-500' }
    ]
  }
}

export const fileService = new FileService()
export default fileService

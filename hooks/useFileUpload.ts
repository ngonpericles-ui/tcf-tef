import { useState, useCallback, useRef } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

export interface UploadProgress {
  fileId: string
  progress: number // 0-100
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error' | 'removed'
  error?: string
  result?: any
  contentId?: string
}

export interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
}

interface UseFileUploadOptions {
  onSuccess?: (fileId: string, result: any) => void
  onError?: (fileId: string, error: any) => void
  maxFiles?: number
  apiUrl?: string
  endpoint?: string
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    onSuccess,
    onError,
    maxFiles = 20,
    apiUrl,
    endpoint = '/content-management/upload'
  } = options

  const [uploadProgresses, setUploadProgresses] = useState<Map<string, UploadProgress>>(new Map())
  const [uploadControllers, setUploadControllers] = useState<Map<string, AbortController>>(new Map())
  const lastProgressUpdate = useRef<Map<string, number>>(new Map())

  // Upload single file with progress tracking
  const uploadFileWithProgress = useCallback(async (
    file: UploadFile,
    formData: FormData,
    fileId: string,
    signal?: AbortSignal
  ): Promise<any> => {
    // Initialize last progress update for this file
    lastProgressUpdate.current.set(fileId, 0)

    const finalApiUrl = apiUrl || 
      (typeof window !== 'undefined'
        ? (window as any).__NEXT_PUBLIC_API_URL__ || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')

    const token = typeof window !== 'undefined' 
      ? (localStorage.getItem('access_token') || 
         localStorage.getItem('tcf_tef_admin_session') ||
         localStorage.getItem('tcf_tef_session'))
      : null

    const response = await axios.post(`${finalApiUrl}${endpoint}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      timeout: 0, // No timeout for large files
      signal,
      onUploadProgress: (progressEvent) => {
        const now = Date.now()
        const lastUpdate = lastProgressUpdate.current.get(fileId) || 0
        const timeSinceLastUpdate = now - lastUpdate

        // Throttle updates to at most once every 100ms for smooth progress
        if (timeSinceLastUpdate < 100 && progressEvent.total && progressEvent.loaded < progressEvent.total) {
          return
        }

        if (progressEvent.total && progressEvent.total > 0) {
          // Calculate real progress
          const loaded = progressEvent.loaded || 0
          const total = progressEvent.total || 1
          const calculatedProgress = Math.min(Math.round((loaded * 100) / total), 99) // Cap at 99% until complete

          // Update progress
          setUploadProgresses((prev) => {
            const newMap = new Map(prev)
            const current = newMap.get(fileId) || { fileId, progress: 0, status: 'uploading' as const }
            newMap.set(fileId, { ...current, progress: calculatedProgress, status: 'uploading' })
            return newMap
          })

          lastProgressUpdate.current.set(fileId, now)
        } else if (progressEvent.loaded && progressEvent.loaded > 0) {
          // If we have loaded bytes but no total, estimate progress
          const estimatedProgress = Math.min(progressEvent.loaded / 1024 / 1024 * 2, 50)
          
          setUploadProgresses((prev) => {
            const newMap = new Map(prev)
            const current = newMap.get(fileId) || { fileId, progress: 0, status: 'uploading' as const }
            newMap.set(fileId, { ...current, progress: Math.round(estimatedProgress), status: 'uploading' })
            return newMap
          })

          lastProgressUpdate.current.set(fileId, now)
        }
      }
    })

    return response.data
  }, [apiUrl, endpoint])

  // Upload file
  const uploadFile = useCallback(async (
    file: UploadFile,
    formDataBuilder: (file: UploadFile) => FormData
  ): Promise<any> => {
    const controller = new AbortController()
    setUploadControllers((prev) => {
      const newMap = new Map(prev)
      newMap.set(file.id, controller)
      return newMap
    })

    // Initialize progress
    setUploadProgresses((prev) => {
      const newMap = new Map(prev)
      newMap.set(file.id, {
        fileId: file.id,
        progress: 0,
        status: 'pending'
      })
      return newMap
    })

    // Update status to uploading
    setUploadProgresses((prev) => {
      const newMap = new Map(prev)
      const current = newMap.get(file.id) || { fileId: file.id, progress: 0, status: 'pending' as const }
      newMap.set(file.id, { ...current, status: 'uploading', progress: 0 })
      return newMap
    })

    try {
      const formData = formDataBuilder(file)
      const result = await uploadFileWithProgress(file, formData, file.id, controller.signal)

      // Update to completed
      setUploadProgresses((prev) => {
        const newMap = new Map(prev)
        newMap.set(file.id, {
          fileId: file.id,
          progress: 100,
          status: 'completed',
          result: result.data || result,
          contentId: result.data?.id || result.data?.content?.id || result.id
        })
        return newMap
      })

      onSuccess?.(file.id, result)
      return result
    } catch (error: any) {
      // Handle abort
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        setUploadProgresses((prev) => {
          const newMap = new Map(prev)
          const current = newMap.get(file.id) || { fileId: file.id, progress: 0, status: 'paused' as const }
          newMap.set(file.id, { ...current, status: 'paused' })
          return newMap
        })
        return null
      }

      // Handle error
      const errorMessage = error.response?.data?.error?.message || error.message || 'Upload error'
      setUploadProgresses((prev) => {
        const newMap = new Map(prev)
        newMap.set(file.id, {
          fileId: file.id,
          progress: 0,
          status: 'error',
          error: errorMessage
        })
        return newMap
      })

      onError?.(file.id, error)
      throw error
    } finally {
      // Remove controller
      setUploadControllers((prev) => {
        const newMap = new Map(prev)
        newMap.delete(file.id)
        return newMap
      })
    }
  }, [uploadFileWithProgress, onSuccess, onError])

  // Pause upload
  const pauseUpload = useCallback((fileId: string) => {
    const controller = uploadControllers.get(fileId)
    if (controller) {
      controller.abort()
    }
    setUploadProgresses((prev) => {
      const newMap = new Map(prev)
      const current = newMap.get(fileId) || { fileId, progress: 0, status: 'paused' as const }
      newMap.set(fileId, { ...current, status: 'paused' })
      return newMap
    })
  }, [uploadControllers])

  // Resume upload (restart from beginning)
  const resumeUpload = useCallback(async (
    file: UploadFile,
    formDataBuilder: (file: UploadFile) => FormData
  ) => {
    return uploadFile(file, formDataBuilder)
  }, [uploadFile])

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    const controller = uploadControllers.get(fileId)
    if (controller) {
      controller.abort()
    }
    setUploadControllers((prev) => {
      const newMap = new Map(prev)
      newMap.delete(fileId)
      return newMap
    })
    setUploadProgresses((prev) => {
      const newMap = new Map(prev)
      newMap.delete(fileId)
      return newMap
    })
    lastProgressUpdate.current.delete(fileId)
  }, [uploadControllers])

  return {
    uploadProgresses,
    uploadFile,
    pauseUpload,
    resumeUpload,
    removeFile
  }
}


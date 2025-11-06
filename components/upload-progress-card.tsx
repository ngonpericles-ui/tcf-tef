"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, Pause, Play, CheckCircle2, AlertCircle, File } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
}

export interface UploadProgress {
  fileId: string
  progress: number // 0-100
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error' | 'removed'
  error?: string
  result?: any
  contentId?: string
}

interface UploadProgressCardProps {
  upload: UploadProgress
  file: UploadFile
  onRemove: (fileId: string) => void
  onPause: (fileId: string) => void
  onResume: (fileId: string) => void
  onView?: (contentId: string) => void
}

export function UploadProgressCard({
  upload,
  file,
  onRemove,
  onPause,
  onResume,
  onView
}: UploadProgressCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = () => {
    if (file.type.startsWith('video/')) return '🎬'
    if (file.type.startsWith('audio/')) return '🎵'
    if (file.type === 'application/pdf') return '📄'
    if (file.type.startsWith('image/')) return '🖼️'
    return '📄'
  }

  const getStatusColor = () => {
    switch (upload.status) {
      case 'completed':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      case 'uploading':
        return 'text-blue-500'
      case 'paused':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusText = () => {
    switch (upload.status) {
      case 'completed':
        return 'Completed'
      case 'error':
        return 'Error'
      case 'uploading':
        return 'Uploading...'
      case 'paused':
        return 'Paused'
      case 'pending':
        return 'Pending'
      case 'removed':
        return 'Removed'
      default:
        return 'Unknown'
    }
  }

  return (
    <Card className={cn(
      "mb-3 transition-all duration-200",
      upload.status === 'completed' && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
      upload.status === 'error' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
      upload.status === 'uploading' && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
      upload.status === 'paused' && "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getFileIcon()}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate text-foreground">
                  {file.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} • {getStatusText()}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {upload.status === 'uploading' || upload.status === 'paused' ? (
              <div className="space-y-1">
                <Progress value={upload.progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {Math.round(upload.progress)}%
                </p>
              </div>
            ) : upload.status === 'completed' ? (
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400">
                  Upload completed successfully
                </span>
              </div>
            ) : upload.status === 'error' ? (
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-600 dark:text-red-400 truncate">
                  {upload.error || 'Upload failed'}
                </span>
              </div>
            ) : null}

            {/* Completed Actions */}
            {upload.status === 'completed' && upload.contentId && onView && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 text-xs"
                onClick={() => onView(upload.contentId!)}
              >
                View Content
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {upload.status === 'uploading' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPause(upload.fileId)}
                title="Pause upload"
              >
                <Pause className="w-4 h-4" />
              </Button>
            )}
            {upload.status === 'paused' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onResume(upload.fileId)}
                title="Resume upload"
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
            {(upload.status !== 'completed' || upload.status === 'error') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => onRemove(upload.fileId)}
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            {upload.status === 'completed' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onRemove(upload.fileId)}
                title="Remove from list"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


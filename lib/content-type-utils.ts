/**
 * Content Type Detection and Handling Utilities
 * Determines how to display different content types (video, audio, PDF, text, etc.)
 */

export type ContentType = 'video' | 'audio' | 'pdf' | 'text' | 'image' | 'document' | 'unknown';

export interface ContentInfo {
  type: ContentType;
  mimeType: string;
  displayName: string;
  icon: string;
  canPreview: boolean;
  requiresDownload: boolean;
}

/**
 * Detect content type from URL or MIME type
 */
export function detectContentType(url: string, mimeType?: string): ContentInfo {
  const urlLower = url.toLowerCase();
  const mime = mimeType?.toLowerCase() || '';

  // Video types
  if (
    urlLower.includes('.mp4') ||
    urlLower.includes('.webm') ||
    urlLower.includes('.mov') ||
    urlLower.includes('.avi') ||
    mime.startsWith('video/')
  ) {
    return {
      type: 'video',
      mimeType: mime || 'video/mp4',
      displayName: 'Video',
      icon: '🎬',
      canPreview: true,
      requiresDownload: false
    };
  }

  // Audio types
  if (
    urlLower.includes('.mp3') ||
    urlLower.includes('.wav') ||
    urlLower.includes('.m4a') ||
    urlLower.includes('.aac') ||
    mime.startsWith('audio/')
  ) {
    return {
      type: 'audio',
      mimeType: mime || 'audio/mpeg',
      displayName: 'Audio',
      icon: '🎵',
      canPreview: true,
      requiresDownload: false
    };
  }

  // PDF types
  if (
    urlLower.includes('.pdf') ||
    mime.includes('pdf')
  ) {
    return {
      type: 'pdf',
      mimeType: 'application/pdf',
      displayName: 'PDF Document',
      icon: '📄',
      canPreview: true,
      requiresDownload: false
    };
  }

  // Text types
  if (
    urlLower.includes('.txt') ||
    urlLower.includes('.md') ||
    mime.startsWith('text/')
  ) {
    return {
      type: 'text',
      mimeType: mime || 'text/plain',
      displayName: 'Text Document',
      icon: '📝',
      canPreview: true,
      requiresDownload: false
    };
  }

  // Image types
  if (
    urlLower.includes('.jpg') ||
    urlLower.includes('.jpeg') ||
    urlLower.includes('.png') ||
    urlLower.includes('.gif') ||
    urlLower.includes('.webp') ||
    mime.startsWith('image/')
  ) {
    return {
      type: 'image',
      mimeType: mime || 'image/jpeg',
      displayName: 'Image',
      icon: '🖼️',
      canPreview: true,
      requiresDownload: false
    };
  }

  // Document types (Word, Excel, etc.)
  if (
    urlLower.includes('.doc') ||
    urlLower.includes('.docx') ||
    urlLower.includes('.xls') ||
    urlLower.includes('.xlsx') ||
    urlLower.includes('.ppt') ||
    urlLower.includes('.pptx') ||
    mime.includes('word') ||
    mime.includes('excel') ||
    mime.includes('powerpoint')
  ) {
    return {
      type: 'document',
      mimeType: mime || 'application/msword',
      displayName: 'Document',
      icon: '📋',
      canPreview: false,
      requiresDownload: true
    };
  }

  // Unknown type
  return {
    type: 'unknown',
    mimeType: mime || 'application/octet-stream',
    displayName: 'File',
    icon: '📦',
    canPreview: false,
    requiresDownload: true
  };
}

/**
 * Get appropriate viewer component for content type
 */
export function getViewerComponent(contentType: ContentType): string {
  switch (contentType) {
    case 'video':
      return 'VideoPlayer';
    case 'audio':
      return 'AudioPlayer';
    case 'pdf':
      return 'PDFViewer';
    case 'text':
      return 'TextViewer';
    case 'image':
      return 'ImageViewer';
    case 'document':
      return 'DocumentDownload';
    default:
      return 'FileDownload';
  }
}

/**
 * Check if content can be displayed inline
 */
export function canDisplayInline(contentType: ContentType): boolean {
  return ['video', 'audio', 'pdf', 'text', 'image'].includes(contentType);
}

/**
 * Get file extension from URL
 */
export function getFileExtension(url: string): string {
  const match = url.match(/\.([^./?#]+)(?:[?#]|$)/i);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}


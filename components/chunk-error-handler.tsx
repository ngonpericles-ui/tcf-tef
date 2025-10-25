"use client"

import { useEffect } from 'react'
import { setupChunkErrorHandling } from '@/lib/chunkErrorHandler'

/**
 * Client-side component to setup chunk error handling
 * This must be a client component to access window object
 */
export default function ChunkErrorHandler() {
  useEffect(() => {
    // Setup chunk error handling on mount
    setupChunkErrorHandling()
    
    // Cleanup on unmount
    return () => {
      // Remove event listeners if needed
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', () => {})
        window.removeEventListener('unhandledrejection', () => {})
      }
    }
  }, [])

  return null // This component doesn't render anything
}

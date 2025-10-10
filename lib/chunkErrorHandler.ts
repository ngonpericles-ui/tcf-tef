/**
 * Chunk Loading Error Handler
 * Handles ChunkLoadError and provides retry mechanisms
 */

interface ChunkErrorHandlerOptions {
  maxRetries?: number
  retryDelay?: number
  onRetry?: (attempt: number) => void
  onMaxRetriesReached?: () => void
}

class ChunkErrorHandler {
  private retryCount = 0
  private maxRetries: number
  private retryDelay: number
  private onRetry?: (attempt: number) => void
  private onMaxRetriesReached?: () => void

  constructor(options: ChunkErrorHandlerOptions = {}) {
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 1000
    this.onRetry = options.onRetry
    this.onMaxRetriesReached = options.onMaxRetriesReached
  }

  /**
   * Handle chunk loading errors with retry mechanism
   */
  handleChunkError = (error: Error): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (this.retryCount >= this.maxRetries) {
        console.error('Max retries reached for chunk loading')
        this.onMaxRetriesReached?.()
        reject(error)
        return
      }

      this.retryCount++
      console.warn(`Chunk loading error, retrying... (${this.retryCount}/${this.maxRetries})`)
      
      this.onRetry?.(this.retryCount)

      setTimeout(() => {
        // Force page reload to retry chunk loading
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
        resolve()
      }, this.retryDelay)
    })
  }

  /**
   * Reset retry count
   */
  reset = () => {
    this.retryCount = 0
  }

  /**
   * Check if error is a chunk loading error
   */
  isChunkError = (error: Error): boolean => {
    return (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Loading CSS chunk') ||
      error.message.includes('ChunkLoadError')
    )
  }
}

// Global chunk error handler instance
export const chunkErrorHandler = new ChunkErrorHandler({
  maxRetries: 3,
  retryDelay: 1000,
  onRetry: (attempt) => {
    console.log(`Retrying chunk load (attempt ${attempt})`)
  },
  onMaxRetriesReached: () => {
    console.error('Failed to load chunks after multiple retries')
    // Show user-friendly error message
    if (typeof window !== 'undefined') {
      alert('Failed to load application resources. Please refresh the page.')
    }
  }
})

/**
 * Enhanced error handler for chunk loading issues
 */
export const handleChunkLoadError = (error: Error): Promise<void> => {
  if (chunkErrorHandler.isChunkError(error)) {
    return chunkErrorHandler.handleChunkError(error)
  }
  
  // Re-throw non-chunk errors
  throw error
}

/**
 * Setup global chunk error handling
 */
export const setupChunkErrorHandling = () => {
  if (typeof window === 'undefined') return

  // Handle unhandled chunk load errors
  window.addEventListener('error', (event) => {
    if (event.error && chunkErrorHandler.isChunkError(event.error)) {
      event.preventDefault()
      handleChunkLoadError(event.error)
    }
  })

  // Handle unhandled promise rejections (chunk load errors)
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && chunkErrorHandler.isChunkError(event.reason)) {
      event.preventDefault()
      handleChunkLoadError(event.reason)
    }
  })
}

export default chunkErrorHandler

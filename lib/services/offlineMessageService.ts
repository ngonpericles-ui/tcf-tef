/**
 * Offline Message Storage Service
 * Handles storing messages locally when offline and syncing when online
 */

export interface OfflineMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  type: 'text' | 'image' | 'file' | 'audio' | 'video'
  timestamp: string
  isLocal: boolean
  retryCount?: number
}

class OfflineMessageService {
  private readonly STORAGE_KEY = 'offlineMessages'
  private readonly MAX_RETRY_COUNT = 3

  /**
   * Store message locally when offline
   */
  storeMessage(message: Omit<OfflineMessage, 'id' | 'timestamp' | 'isLocal'>): OfflineMessage {
    const offlineMessage: OfflineMessage = {
      ...message,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      isLocal: true,
      retryCount: 0
    }

    const messages = this.getStoredMessages()
    messages.push(offlineMessage)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages))
    
    console.log('📱 Message stored offline:', offlineMessage)
    return offlineMessage
  }

  /**
   * Get all stored offline messages
   */
  getStoredMessages(): OfflineMessage[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading offline messages:', error)
      return []
    }
  }

  /**
   * Remove message from local storage
   */
  removeMessage(messageId: string): void {
    const messages = this.getStoredMessages()
    const filtered = messages.filter(msg => msg.id !== messageId)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  /**
   * Sync offline messages with server
   */
  async syncOfflineMessages(): Promise<void> {
    const messages = this.getStoredMessages()
    if (messages.length === 0) return

    console.log(`🔄 Syncing ${messages.length} offline messages...`)

    for (const message of messages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            receiverId: message.receiverId,
            content: message.content,
            type: message.type
          })
        })

        if (response.ok) {
          // Message synced successfully, remove from local storage
          this.removeMessage(message.id)
          console.log('✅ Message synced:', message.id)
        } else {
          // Increment retry count
          message.retryCount = (message.retryCount || 0) + 1
          
          if (message.retryCount >= this.MAX_RETRY_COUNT) {
            console.log('❌ Message failed after max retries:', message.id)
            this.removeMessage(message.id)
          } else {
            // Update retry count in storage
            const messages = this.getStoredMessages()
            const updated = messages.map(msg => 
              msg.id === message.id ? { ...msg, retryCount: message.retryCount } : msg
            )
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated))
          }
        }
      } catch (error) {
        console.error('Error syncing message:', message.id, error)
        message.retryCount = (message.retryCount || 0) + 1
        
        if (message.retryCount >= this.MAX_RETRY_COUNT) {
          this.removeMessage(message.id)
        }
      }
    }
  }

  /**
   * Check if there are unsynced messages
   */
  hasUnsyncedMessages(): boolean {
    return this.getStoredMessages().length > 0
  }

  /**
   * Get count of unsynced messages
   */
  getUnsyncedCount(): number {
    return this.getStoredMessages().length
  }

  /**
   * Clear all offline messages
   */
  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }
}

export const offlineMessageService = new OfflineMessageService()

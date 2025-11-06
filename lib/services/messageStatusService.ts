import { messageService } from './messageService'
import { socketService } from './socketService'

export interface MessageStatusUpdate {
  messageId: string
  status: 'sent' | 'delivered' | 'read'
  timestamp: string
  userId?: string
}

export class MessageStatusService {
  private static instance: MessageStatusService
  private statusCallbacks: Map<string, (update: MessageStatusUpdate) => void> = new Map()

  public static getInstance(): MessageStatusService {
    if (!MessageStatusService.instance) {
      MessageStatusService.instance = new MessageStatusService()
    }
    return MessageStatusService.instance
  }

  /**
   * Mark a message as delivered
   */
  public async markAsDelivered(messageId: string): Promise<void> {
    try {
      // Send via Socket.IO if connected
      if (socketService.getConnectionStatus()) {
        socketService.markAsDelivered(messageId)
      } else {
        // Fallback to REST API
        await messageService.markAsDelivered(messageId)
      }

      // Notify callbacks
      this.notifyStatusUpdate({
        messageId,
        status: 'delivered',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to mark message as delivered:', error)
    }
  }

  /**
   * Mark a message as read
   */
  public async markAsRead(messageId: string, conversationId: string): Promise<void> {
    try {
      // Send via Socket.IO if connected
      if (socketService.getConnectionStatus()) {
        socketService.markAsRead(messageId, conversationId)
      } else {
        // Fallback to REST API
        await messageService.markAsRead(messageId)
      }

      // Notify callbacks
      this.notifyStatusUpdate({
        messageId,
        status: 'read',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to mark message as read:', error)
    }
  }

  /**
   * Mark all messages in a conversation as read
   */
  public async markConversationAsRead(conversationId: string): Promise<void> {
    try {
      // Send via Socket.IO if connected
      if (socketService.getConnectionStatus()) {
        socketService.markConversationAsRead(conversationId)
      } else {
        // Fallback to REST API
        await messageService.markConversationAsRead(conversationId)
      }
    } catch (error) {
      console.error('Failed to mark conversation as read:', error)
    }
  }

  /**
   * Get message status
   */
  public async getMessageStatus(messageId: string) {
    try {
      return await messageService.getMessageStatus(messageId)
    } catch (error) {
      console.error('Failed to get message status:', error)
      return null
    }
  }

  /**
   * Subscribe to status updates for a specific message
   */
  public subscribeToStatusUpdates(messageId: string, callback: (update: MessageStatusUpdate) => void): () => void {
    this.statusCallbacks.set(messageId, callback)
    
    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(messageId)
    }
  }

  /**
   * Subscribe to status updates for multiple messages
   */
  public subscribeToMultipleStatusUpdates(messageIds: string[], callback: (update: MessageStatusUpdate) => void): () => void {
    const unsubscribers = messageIds.map(id => this.subscribeToStatusUpdates(id, callback))
    
    // Return unsubscribe function for all
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }

  /**
   * Notify all callbacks about status updates
   */
  private notifyStatusUpdate(update: MessageStatusUpdate): void {
    const callback = this.statusCallbacks.get(update.messageId)
    if (callback) {
      callback(update)
    }
  }

  /**
   * Handle incoming status updates from Socket.IO
   */
  public handleIncomingStatusUpdate(update: MessageStatusUpdate): void {
    this.notifyStatusUpdate(update)
  }
}

// Export singleton instance
export const messageStatusService = MessageStatusService.getInstance()
export default messageStatusService

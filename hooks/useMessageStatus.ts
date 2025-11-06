import { useEffect, useCallback, useState } from 'react'
import { messageStatusService, MessageStatusUpdate } from '@/lib/services/messageStatusService'
import { useSocket } from './useSocket'

export interface MessageStatusState {
  [messageId: string]: {
    isRead: boolean
    deliveredAt?: string
    readAt?: string
    sentAt?: string
  }
}

export const useMessageStatus = (messageIds: string[] = []) => {
  const { isConnected } = useSocket()
  const [statuses, setStatuses] = useState<MessageStatusState>({})

  // Update status when Socket.IO events are received
  useEffect(() => {
    if (!isConnected) return

    const handleStatusUpdate = (update: MessageStatusUpdate) => {
      setStatuses(prev => ({
        ...prev,
        [update.messageId]: {
          ...prev[update.messageId],
          isRead: update.status === 'read' || prev[update.messageId]?.isRead || false,
          deliveredAt: update.status === 'delivered' ? update.timestamp : prev[update.messageId]?.deliveredAt,
          readAt: update.status === 'read' ? update.timestamp : prev[update.messageId]?.readAt,
          sentAt: update.status === 'sent' ? update.timestamp : prev[update.messageId]?.sentAt
        }
      }))
    }

    // Subscribe to status updates for all message IDs
    const unsubscribers = messageIds.map(id => 
      messageStatusService.subscribeToStatusUpdates(id, handleStatusUpdate)
    )

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [isConnected, messageIds])

  // Mark message as delivered
  const markAsDelivered = useCallback(async (messageId: string) => {
    await messageStatusService.markAsDelivered(messageId)
  }, [])

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string, conversationId: string) => {
    await messageStatusService.markAsRead(messageId, conversationId)
  }, [])

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    await messageStatusService.markConversationAsRead(conversationId)
  }, [])

  // Get status for a specific message
  const getMessageStatus = useCallback((messageId: string) => {
    return statuses[messageId] || {
      isRead: false,
      deliveredAt: undefined,
      readAt: undefined,
      sentAt: undefined
    }
  }, [statuses])

  // Update status locally (for optimistic updates)
  const updateStatus = useCallback((messageId: string, status: Partial<MessageStatusState[string]>) => {
    setStatuses(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        ...status
      }
    }))
  }, [])

  return {
    statuses,
    markAsDelivered,
    markAsRead,
    markConversationAsRead,
    getMessageStatus,
    updateStatus
  }
}

export default useMessageStatus

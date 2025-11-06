import { apiClient, type ApiResponse } from '@/lib/api-client'

// Types for Messages - Enhanced for WhatsApp-level messaging
export interface Message {
  id: string
  senderId: string
  receiverId: string
  subject?: string
  content: string
  type?: 'text' | 'image' | 'file' | 'audio' | 'video'
  parentId?: string
  replyToId?: string
  replyTo?: {
    id: string
    content: string
    sender: {
      firstName: string
      lastName: string
    }
  }
  attachments?: string[]
  fileUrl?: string
  fileName?: string
  fileSize?: number
  isRead: boolean
  read: boolean
  readAt?: string | null
  delivered: boolean
  deliveredAt?: string
  sentAt?: string
  timestamp: string
  createdAt: string
  updatedAt: string
  metadata?: any
  roomId?: string
  conversationId: string
  isGroupMessage?: boolean
  sender: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    avatar?: string
    profileImage?: string
  }
  receiver: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    avatar?: string
    profileImage?: string
  }
}

export interface CreateMessageRequest {
  receiverId: string
  subject?: string
  content: string
  type?: 'text' | 'image' | 'file' | 'audio' | 'video'
  parentId?: string
  replyToId?: string // Added for reply functionality
  attachments?: string[]
  metadata?: any
}

export interface CreateGroupMessageRequest {
  roomId: string
  content: string
  type?: 'text' | 'image' | 'file' | 'audio' | 'video'
  parentId?: string
  attachments?: string[]
  metadata?: any
}

export interface MessageStatus {
  delivered: boolean
  read: boolean
  deliveredAt?: string
  readAt?: string
  deliveredTo?: string
  readBy?: string
}

export interface MessageFilters {
  search?: string
  isRead?: boolean
  senderId?: string
  receiverId?: string
  dateFrom?: string
  dateTo?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface MessagesResponse {
  messages: Message[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  unreadCount: number
}

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  avatar?: string
  profileImage?: string
  isOnline: boolean
  lastSeen?: string
  status?: 'ONLINE' | 'OFFLINE' | 'ACTIVE' | 'INACTIVE' // Added status for online/offline detection
  lastMessageTime?: string
  lastMessageContent?: string
  unreadCount: number
  // WhatsApp-style conversation metadata
  isGroup?: boolean
  lastMessageSender?: string
  lastMessageType?: string
}

class MessageService {
  /**
   * Get all messages with pagination and filtering
   */
  async getMessages(
    contactId: string,
    pagination: PaginationParams = {},
    filters: MessageFilters = {}
  ): Promise<ApiResponse<Message[]>> {
    const params = new URLSearchParams()
    
    // Add contact ID for private conversation
    params.append('contactId', contactId)
    
    // Add pagination params
    if (pagination.page) params.append('page', pagination.page.toString())
    if (pagination.limit) params.append('limit', pagination.limit.toString())
    if (pagination.sortBy) params.append('sortBy', pagination.sortBy)
    if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder)
    
    // Add filter params
    if (filters.search) params.append('search', filters.search)
    if (filters.isRead !== undefined) params.append('isRead', filters.isRead.toString())
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)

    const queryString = params.toString()
    const url = queryString ? `/messages?${queryString}` : '/messages'
    
    return apiClient.get(url)
  }

  /**
   * Get a specific message by ID
   */
  async getMessageById(messageId: string): Promise<ApiResponse<Message>> {
    return apiClient.get(`/messages/${messageId}`)
  }

  /**
   * Send a new message
   */
  async sendMessage(messageData: CreateMessageRequest): Promise<ApiResponse<Message>> {
    return apiClient.post('/messages', messageData)
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<ApiResponse<void>> {
    return apiClient.put(`/messages/${messageId}/read`)
  }

  /**
   * Mark message as delivered
   */
  async markAsDelivered(messageId: string): Promise<ApiResponse<void>> {
    return apiClient.put(`/messages/${messageId}/delivered`)
  }

  /**
   * Get message delivery status
   */
  async getMessageStatus(messageId: string): Promise<ApiResponse<MessageStatus>> {
    return apiClient.get(`/messages/${messageId}/status`)
  }

  /**
   * Mark multiple messages as read
   */
  async markMessagesAsRead(messageIds: string[]): Promise<ApiResponse<void>> {
    return apiClient.put('/messages/read', { messageIds })
  }

  /**
   * Mark all messages in conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<ApiResponse<void>> {
    return apiClient.put(`/conversations/${conversationId}/read`)
  }

  /**
   * Mark message as unread
   */
  async markAsUnread(messageId: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/messages/${messageId}/unread`)
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/messages/${messageId}`)
  }

  /**
   * Get conversation between two users
   */
  async getConversation(
    otherUserId: string,
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<MessagesResponse>> {
    const params = new URLSearchParams()
    
    if (pagination.page) params.append('page', pagination.page.toString())
    if (pagination.limit) params.append('limit', pagination.limit.toString())

    const queryString = params.toString()
    const url = queryString 
      ? `/messages/conversation/${otherUserId}?${queryString}` 
      : `/messages/conversation/${otherUserId}`
    
    return apiClient.get(url)
  }

  /**
   * Get user's contacts
   */
  async getContacts(): Promise<ApiResponse<Contact[]>> {
    try {
      return await apiClient.get('/messages/contacts')
    } catch (error: any) {
      // If the main endpoint fails, try the fallback
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.log('🔄 Trying fallback contacts endpoint...')
        return await apiClient.get('/fallback/contacts')
      }
      throw error
    }
  }

  /**
   * Get all messages for building conversations (for students)
   */
  async getAllMessages(): Promise<ApiResponse<Message[]>> {
    try {
      const response = await apiClient.get('/messages')
      
      // The backend returns different structures depending on parameters
      // Without contactId: { success: true, data: { messages: [...], pagination: {...} } }
      // With contactId: { success: true, data: [...] }
      
      if (response.success && response.data) {
        // Check if data is an array (with contactId) or object with messages property (without contactId)
        if (Array.isArray(response.data)) {
          // Direct array response
          return {
            success: true,
            data: response.data
          }
        } else if (response.data && typeof response.data === 'object' && 'messages' in response.data && Array.isArray((response.data as any).messages)) {
          // Object with messages property
          return {
            success: true,
            data: (response.data as any).messages
          }
        } else {
          console.error('Unexpected data structure:', response.data)
          return {
            success: false,
            error: { message: 'Invalid data structure received from server' },
            data: []
          }
        }
      }
      
      return {
        success: false,
        error: { message: 'No data received from server' },
        data: []
      }
    } catch (error: any) {
      console.error('Failed to fetch all messages:', error)
      throw error
    }
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      return await apiClient.get('/messages/unread-count')
    } catch (error: any) {
      // If the main endpoint fails, try the fallback
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.log('🔄 Trying fallback unread-count endpoint...')
        return await apiClient.get('/fallback/unread-count')
      }
      throw error
    }
  }

  /**
   * Search messages
   */
  async searchMessages(
    query: string,
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<MessagesResponse>> {
    const params = new URLSearchParams()
    params.append('search', query)
    
    if (pagination.page) params.append('page', pagination.page.toString())
    if (pagination.limit) params.append('limit', pagination.limit.toString())

    return apiClient.get(`/messages/search?${params.toString()}`)
  }

  /**
   * Send bulk message (Admin/Manager only)
   */
  async sendBulkMessage(data: {
    userIds: string[]
    subject: string
    content: string
    roles?: string[]
    subscriptionTiers?: string[]
  }): Promise<ApiResponse<void>> {
    return apiClient.post('/messages/bulk', data)
  }

  /**
   * Get message thread
   */
  async getMessageThread(messageId: string): Promise<ApiResponse<Message[]>> {
    return apiClient.get(`/messages/${messageId}/thread`)
  }

  /**
   * Reply to a message
   */
  async replyToMessage(
    messageId: string, 
    content: string
  ): Promise<ApiResponse<Message>> {
    return apiClient.post(`/messages/${messageId}/reply`, { content })
  }

  // ===== ENHANCED WHATSAPP-LEVEL MESSAGING METHODS =====

  /**
   * Send group message
   */
  async sendGroupMessage(data: CreateGroupMessageRequest): Promise<ApiResponse<Message>> {
    return apiClient.post('/messages/group', data)
  }


  /**
   * Get offline message count
   */
  async getOfflineMessageCount(): Promise<ApiResponse<{ count: number }>> {
    return apiClient.get('/messages/offline-count')
  }

  /**
   * Create or get room for 1:1 chat
   */
  async createOrGetRoom(userId1: string, userId2: string): Promise<ApiResponse<{ roomId: string }>> {
    return apiClient.post('/messages/room', { userId1, userId2 })
  }

  /**
   * Create group room
   */
  async createGroupRoom(data: {
    name: string
    participants: string[]
  }): Promise<ApiResponse<{ roomId: string }>> {
    return apiClient.post('/messages/group-room', data)
  }

  /**
   * Get room participants
   */
  async getRoomParticipants(roomId: string): Promise<ApiResponse<{ participants: string[] }>> {
    return apiClient.get(`/messages/room/${roomId}/participants`)
  }

  /**
   * Add user to room
   */
  async addUserToRoom(roomId: string, userId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/messages/room/${roomId}/participants`, { userId })
  }

  /**
   * Remove user from room
   */
  async removeUserFromRoom(roomId: string, userId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/messages/room/${roomId}/participants/${userId}`)
  }

  /**
   * Get user rooms
   */
  async getUserRooms(): Promise<ApiResponse<{ rooms: string[] }>> {
    return apiClient.get('/messages/rooms')
  }

  /**
   * Get messaging statistics
   */
  async getMessagingStats(): Promise<ApiResponse<{
    onlineUsers: number
    activeRooms: number
    typingUsers: number
    uptime: number
  }>> {
    return apiClient.get('/messages/stats')
  }

  /**
   * Forward a message
   */
  async forwardMessage(
    messageId: string,
    receiverIds: string[]
  ): Promise<ApiResponse<void>> {
    return apiClient.post(`/messages/${messageId}/forward`, { receiverIds })
  }

  /**
   * Archive a message
   */
  async archiveMessage(messageId: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/messages/${messageId}/archive`)
  }

  /**
   * Unarchive a message
   */
  async unarchiveMessage(messageId: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/messages/${messageId}/unarchive`)
  }

  /**
   * Get archived messages
   */
  async getArchivedMessages(
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<MessagesResponse>> {
    const params = new URLSearchParams()
    
    if (pagination.page) params.append('page', pagination.page.toString())
    if (pagination.limit) params.append('limit', pagination.limit.toString())

    const queryString = params.toString()
    const url = queryString ? `/messages/archived?${queryString}` : '/messages/archived'
    
    return apiClient.get(url)
  }
}

// Export singleton instance
export const messageService = new MessageService()
export default messageService

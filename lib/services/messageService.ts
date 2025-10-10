import { apiClient, type ApiResponse } from '@/lib/api-client'

// Types for Messages
export interface Message {
  id: string
  senderId: string
  receiverId: string
  subject?: string
  content: string
  parentId?: string
  attachments?: string[]
  isRead: boolean
  createdAt: string
  updatedAt: string
  sender: {
    id: string
    firstName: string
    lastName: string
    role: string
    avatar?: string
  }
  receiver: {
    id: string
    firstName: string
    lastName: string
    role: string
    avatar?: string
  }
}

export interface CreateMessageRequest {
  receiverId: string
  subject?: string
  content: string
  parentId?: string
  attachments?: string[]
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
  isOnline: boolean
  lastSeen?: string
  unreadCount: number
}

class MessageService {
  /**
   * Get all messages with pagination and filtering
   */
  async getMessages(
    pagination: PaginationParams = {},
    filters: MessageFilters = {}
  ): Promise<ApiResponse<MessagesResponse>> {
    const params = new URLSearchParams()
    
    // Add pagination params
    if (pagination.page) params.append('page', pagination.page.toString())
    if (pagination.limit) params.append('limit', pagination.limit.toString())
    if (pagination.sortBy) params.append('sortBy', pagination.sortBy)
    if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder)
    
    // Add filter params
    if (filters.search) params.append('search', filters.search)
    if (filters.isRead !== undefined) params.append('isRead', filters.isRead.toString())
    if (filters.senderId) params.append('senderId', filters.senderId)
    if (filters.receiverId) params.append('receiverId', filters.receiverId)
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
    return apiClient.patch(`/messages/${messageId}/read`)
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
    return apiClient.get('/messages/contacts')
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return apiClient.get('/messages/unread-count')
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

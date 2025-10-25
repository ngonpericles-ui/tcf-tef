import { apiClient, type ApiResponse } from '@/lib/api-client'

// Types for Notifications
export interface Notification {
  id: string
  title: string
  titleEn?: string
  message: string
  messageEn?: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'MESSAGE' | 'LIVE_SESSION' | 'COURSE' | 'TEST'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category?: string
  actionUrl?: string
  imageUrl?: string
  data?: any
  scheduledAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
  status: 'UNREAD' | 'READ' | 'ARCHIVED'
  readAt?: string
}

export interface CreateNotificationRequest {
  title: string
  titleEn?: string
  message: string
  messageEn?: string
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'MESSAGE' | 'LIVE_SESSION' | 'COURSE' | 'TEST'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  category?: string
  actionUrl?: string
  imageUrl?: string
  data?: any
  scheduledAt?: string
  expiresAt?: string
  userIds?: string[]
  roles?: string[]
  subscriptionTiers?: string[]
}

export interface NotificationFilters {
  search?: string
  type?: string
  priority?: string
  category?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface NotificationsResponse {
  notifications: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  unreadCount: number
}

export interface NotificationStats {
  total: number
  unread: number
  byType: Record<string, number>
  byPriority: Record<string, number>
}

class NotificationService {
  /**
   * Get all notifications with pagination and filtering
   */
  async getNotifications(
    pagination: PaginationParams = {},
    filters: NotificationFilters = {}
  ): Promise<ApiResponse<NotificationsResponse>> {
    const params = new URLSearchParams()
    
    // Add pagination params
    if (pagination.page) params.append('page', pagination.page.toString())
    if (pagination.limit) params.append('limit', pagination.limit.toString())
    if (pagination.sortBy) params.append('sortBy', pagination.sortBy)
    if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder)
    
    // Add filter params
    if (filters.search) params.append('search', filters.search)
    if (filters.type) params.append('type', filters.type)
    if (filters.priority) params.append('priority', filters.priority)
    if (filters.category) params.append('category', filters.category)
    if (filters.status) params.append('status', filters.status)
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)

    const queryString = params.toString()
    const url = queryString ? `/notifications?${queryString}` : '/notifications'
    
    return apiClient.get(url)
  }

  /**
   * Get a specific notification by ID
   */
  async getNotificationById(notificationId: string): Promise<ApiResponse<Notification>> {
    return apiClient.get(`/notifications/${notificationId}`)
  }

  /**
   * Create a new notification (Admin/Manager only)
   */
  async createNotification(notificationData: CreateNotificationRequest): Promise<ApiResponse<Notification>> {
    return apiClient.post('/notifications', notificationData)
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/notifications/${notificationId}/read`)
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(notificationId: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/notifications/${notificationId}/unread`)
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<void>> {
    return apiClient.patch('/notifications/mark-all-read')
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/notifications/${notificationId}`)
  }

  /**
   * Archive a notification
   */
  async archiveNotification(notificationId: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/notifications/${notificationId}/archive`)
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return apiClient.get('/notifications/unread-count')
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<ApiResponse<NotificationStats>> {
    return apiClient.get('/notifications/stats')
  }

  /**
   * Send system notification (Admin/Manager only)
   */
  async sendSystemNotification(data: {
    userId: string
    title: string
    message: string
    type?: string
    data?: any
  }): Promise<ApiResponse<void>> {
    return apiClient.post('/notifications/system', data)
  }

  /**
   * Send bulk notification (Admin/Manager only)
   */
  async sendBulkNotification(data: {
    userIds: string[]
    title: string
    message: string
    type?: string
    data?: any
  }): Promise<ApiResponse<void>> {
    return apiClient.post('/notifications/bulk', data)
  }

  /**
   * Get recent notifications (last 24 hours)
   */
  async getRecentNotifications(limit: number = 10): Promise<ApiResponse<Notification[]>> {
    return apiClient.get(`/notifications/recent?limit=${limit}`)
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<ApiResponse<void>> {
    return apiClient.delete('/notifications/clear-all')
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<ApiResponse<any>> {
    return apiClient.get('/notifications/preferences')
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: any): Promise<ApiResponse<void>> {
    return apiClient.put('/notifications/preferences', preferences)
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(subscription: any): Promise<ApiResponse<void>> {
    return apiClient.post('/notifications/push/subscribe', subscription)
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<ApiResponse<void>> {
    return apiClient.post('/notifications/push/unsubscribe')
  }

  /**
   * Test notification delivery
   */
  async testNotification(): Promise<ApiResponse<void>> {
    return apiClient.post('/notifications/test')
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
export default notificationService

import { apiClient, type ApiResponse } from '@/lib/api-client'

// Types for Live Sessions
export interface LiveSession {
  id: string
  title: string
  description: string
  date: string
  duration: number
  maxParticipants: number
  requiredTier: 'FREE' | 'ESSENTIAL' | 'PREMIUM' | 'PRO'
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  category: 'CONVERSATION' | 'GRAMMAR' | 'TCF_PREP' | 'TEF_PREP' | 'WORKSHOP'
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  image?: string
  tags: string[]
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
  participants: Array<{
    id: string
    userId: string
    joinedAt: string
  }>
  participantCount: number
  isRegistered: boolean
  isFavorited: boolean
}

export interface CreateLiveSessionRequest {
  title: string
  description: string
  instructor: string
  date: string
  duration: number
  maxParticipants: number
  requiredTier: 'FREE' | 'ESSENTIAL' | 'PREMIUM' | 'PRO'
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  category: 'CONVERSATION' | 'GRAMMAR' | 'TCF_PREP' | 'TEF_PREP' | 'WORKSHOP'
  tags: string[]
  image?: string
  notifyFollowers?: boolean
}

export interface LiveSessionFilters {
  search?: string
  level?: string
  category?: string
  tier?: string
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

export interface LiveSessionsResponse {
  sessions: LiveSession[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class LiveSessionService {
  /**
   * Get all live sessions with pagination and filtering
   */
  async getAllSessions(
    pagination: PaginationParams = {},
    filters: LiveSessionFilters = {}
  ): Promise<ApiResponse<LiveSessionsResponse>> {
    const params = new URLSearchParams()
    
    // Add pagination params
    if (pagination.page) params.append('page', pagination.page.toString())
    if (pagination.limit) params.append('limit', pagination.limit.toString())
    if (pagination.sortBy) params.append('sortBy', pagination.sortBy)
    if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder)
    
    // Add filter params
    if (filters.search) params.append('search', filters.search)
    if (filters.level) params.append('level', filters.level)
    if (filters.category) params.append('category', filters.category)
    if (filters.tier) params.append('tier', filters.tier)
    if (filters.status) params.append('status', filters.status)
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)

    const queryString = params.toString()
    const url = queryString ? `/live-sessions?${queryString}` : '/live-sessions'
    
    return apiClient.get(url)
  }

  /**
   * Get upcoming live sessions
   */
  async getUpcomingSessions(
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<LiveSessionsResponse>> {
    const params = new URLSearchParams()
    
    if (pagination.page) params.append('page', pagination.page.toString())
    if (pagination.limit) params.append('limit', pagination.limit.toString())

    const queryString = params.toString()
    const url = queryString ? `/live-sessions/upcoming?${queryString}` : '/live-sessions/upcoming'
    
    return apiClient.get(url)
  }

  /**
   * Get user's registered sessions
   */
  async getUserRegisteredSessions(
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<LiveSessionsResponse>> {
    const params = new URLSearchParams()
    
    if (pagination.page) params.append('page', pagination.page.toString())
    if (pagination.limit) params.append('limit', pagination.limit.toString())

    const queryString = params.toString()
    const url = queryString ? `/live-sessions/registered?${queryString}` : '/live-sessions/registered'
    
    return apiClient.get(url)
  }

  /**
   * Get a specific live session by ID
   */
  async getSessionById(sessionId: string): Promise<ApiResponse<LiveSession>> {
    return apiClient.get(`/live-sessions/${sessionId}`)
  }

  /**
   * Create a new live session (Manager/Admin only)
   */
  async createSession(sessionData: CreateLiveSessionRequest): Promise<ApiResponse<LiveSession>> {
    return apiClient.post('/live-sessions', sessionData)
  }

  /**
   * Update a live session
   */
  async updateSession(sessionId: string, sessionData: Partial<CreateLiveSessionRequest>): Promise<ApiResponse<LiveSession>> {
    return apiClient.put(`/live-sessions/${sessionId}`, sessionData)
  }

  /**
   * Delete a live session
   */
  async deleteSession(sessionId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/live-sessions/${sessionId}`)
  }

  /**
   * Join a live session
   */
  async joinSession(sessionId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/live-sessions/${sessionId}/join`)
  }

  /**
   * Leave a live session
   */
  async leaveSession(sessionId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/live-sessions/${sessionId}/leave`)
  }

  /**
   * Get session participants
   */
  async getSessionParticipants(sessionId: string): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/live-sessions/${sessionId}/participants`)
  }

  /**
   * Update session status (Manager/Admin only)
   */
  async updateSessionStatus(
    sessionId: string, 
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  ): Promise<ApiResponse<LiveSession>> {
    return apiClient.patch(`/live-sessions/${sessionId}/status`, { status })
  }

  /**
   * Get session analytics (Manager/Admin only)
   */
  async getSessionAnalytics(sessionId: string): Promise<ApiResponse<any>> {
    return apiClient.get(`/live-sessions/${sessionId}/analytics`)
  }

  /**
   * Start session recording
   */
  async startRecording(sessionId: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/live-sessions/${sessionId}/recording/start`)
  }

  /**
   * Stop session recording
   */
  async stopRecording(sessionId: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/live-sessions/${sessionId}/recording/stop`)
  }

  /**
   * Get session recordings
   */
  async getRecordings(sessionId: string): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/live-sessions/${sessionId}/recordings`)
  }

  /**
   * Send chat message in session
   */
  async sendChatMessage(sessionId: string, message: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/live-sessions/${sessionId}/chat`, { message })
  }

  /**
   * Get session chat history
   */
  async getChatHistory(sessionId: string): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/live-sessions/${sessionId}/chat`)
  }
}

// Export singleton instance
export const liveSessionService = new LiveSessionService()
export default liveSessionService

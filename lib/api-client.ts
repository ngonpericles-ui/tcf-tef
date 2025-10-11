import axios from 'axios'

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    message: string
    code?: string
    details?: any
  }
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'USER' | 'JUNIOR_MANAGER' | 'SENIOR_MANAGER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  createdAt: string
  updatedAt: string
}

class ApiClient {
  private client: ReturnType<typeof axios.create>
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') 
        ? 'https://aura-ca-backend-amqz7no0a-ngonpericles-educms-projects.vercel.app/api'
        : 'http://localhost:3001/api',
      timeout: 30000, // 30 seconds - increased for better reliability
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Load tokens from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token')
      this.refreshToken = localStorage.getItem('refresh_token')
      
      if (this.accessToken) {
        this.setAuthHeader(this.accessToken)
      }
    }

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config: any) => {
        if (this.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.accessToken}`
        }
        return config
      },
      (error: any) => Promise.reject(error)
    )

    // Response interceptor for token refresh with enhanced retry logic
    this.client.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        const originalRequest = error.config

        // Handle 401 errors with token refresh (but not for login/register requests)
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Don't try to refresh tokens for login/register/auth requests
          const isAuthRequest = originalRequest.url?.includes('/auth/login') || 
                               originalRequest.url?.includes('/auth/register') ||
                               originalRequest.url?.includes('/auth/refresh') ||
                               originalRequest.url?.includes('/auth/social')
          
          if (isAuthRequest) {
            return Promise.reject(error)
          }

          originalRequest._retry = true

          try {
            console.log('🔄 Attempting token refresh...')
            await this.refreshAccessToken()
            
            // Retry the original request with new token
            console.log('🔄 Retrying original request...')
            return this.client(originalRequest)
          } catch (refreshError) {
            console.error('❌ Token refresh failed')
            this.clearTokens()
            
            // Clear session storage
            if (typeof window !== 'undefined') {
              localStorage.removeItem('user')
              sessionStorage.removeItem('session')
              document.cookie = 'auth=; Max-Age=0; path=/'
              document.cookie = 'role=; Max-Age=0; path=/'
              
              // Get current user role to determine redirect
              const storedUser = localStorage.getItem('user')
              let redirectUrl = '/connexion'
              
              try {
                if (storedUser) {
                  const userData = JSON.parse(storedUser)
                  if (userData.role === 'ADMIN') {
                    redirectUrl = '/admin/login'
                  } else if (userData.role === 'SENIOR_MANAGER' || userData.role === 'JUNIOR_MANAGER') {
                    redirectUrl = '/manager'
                  }
                }
              } catch (e) {
                // Use default redirect
              }
              
              // Only redirect if not already on a login page
              if (!window.location.pathname.includes('/login') && 
                  !window.location.pathname.includes('/connexion') &&
                  !window.location.pathname.includes('/manager')) {
                console.log('🔒 Session expired, redirecting to:', redirectUrl)
                setTimeout(() => {
                  window.location.href = redirectUrl
                }, 100)
              }
            }
            
            return Promise.reject(refreshError)
          }
        }

        // Handle other errors
        if (error.response?.status >= 500) {
          console.error('🚨 Server error:', error.response.status, error.response.data)
        } else if (error.response?.status === 403) {
          console.error('🚫 Access forbidden:', error.response.data?.message)
        } else if (error.response?.status === 404) {
          console.error('🔍 Resource not found:', error.response.config?.url)
        }

        return Promise.reject(error)
      }
    )
  }

  private setAuthHeader(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  private clearAuthHeader() {
    delete this.client.defaults.headers.common['Authorization']
  }

  public setTokens(tokens: AuthTokens) {
    this.accessToken = tokens.accessToken
    this.refreshToken = tokens.refreshToken
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', tokens.accessToken)
      localStorage.setItem('refresh_token', tokens.refreshToken)
    }
    
    this.setAuthHeader(tokens.accessToken)
  }

  public clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
    
    this.clearAuthHeader()
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      // Use the same API client/baseURL to avoid env mismatches
      const response = await this.client.post(
        '/auth/refresh',
        { refreshToken: this.refreshToken }
      )

      const responseData = response.data as any
      if (responseData.success && responseData.data.tokens) {
        this.setTokens(responseData.data.tokens)
        console.log('✅ Token refreshed successfully')
      } else {
        throw new Error(responseData.message || 'Failed to refresh token')
      }
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error?.message || 'unknown error')

      // Clear tokens on refresh failure but do NOT force redirect here.
      // Let route guards handle navigation to avoid jarring redirects on refresh/tab switch.
      this.clearTokens()

      throw new Error('Token refresh failed')
    }
  }

  // Generic API methods
  async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(url, config)
      return response.data as ApiResponse<T>
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as ApiResponse<T>
      }
      throw error
    }
  }

  async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {

      const response = await this.client.post(url, data, config)
      return response.data as ApiResponse<T>
    } catch (error: any) {

      // If it's an Axios error with a response, return the error data
      if (error.response?.data) {
        return error.response.data as ApiResponse<T>
      }

      // Handle network errors specifically
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        return {
          success: false,
          error: {
            message: 'NETWORK_ERROR',
            code: 'NETWORK_ERROR'
          }
        } as ApiResponse<T>
      }

      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        return {
          success: false,
          error: {
            message: 'CONNECTION_FAILED',
            code: 'CONNECTION_FAILED'
          }
        } as ApiResponse<T>
      }

      // Otherwise, re-throw the error
      throw error
    }
  }

  async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(url, data, config)
      return response.data as ApiResponse<T>
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as ApiResponse<T>
      }
      throw error
    }
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch(url, data, config)
      return response.data as ApiResponse<T>
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as ApiResponse<T>
      }
      throw error
    }
  }

  async delete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(url, config)
      return response.data as ApiResponse<T>
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as ApiResponse<T>
      }
      throw error
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.post<{ user: User; tokens: AuthTokens }>('/auth/login', {
      email,
      password,
    })
    
    if (response.success && response.data?.tokens) {
      this.setTokens(response.data.tokens)
    }
    
    return response
  }

  async register(userData: {
    firstName: string
    lastName: string
    email: string
    password: string
    country?: string
  }): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.post<{ user: User; tokens: AuthTokens }>('/auth/register', userData)
    
    if (response.success && response.data?.tokens) {
      this.setTokens(response.data.tokens)
    }
    
    return response
  }

  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        await this.post('/auth/logout', { refreshToken: this.refreshToken })
      }
    } finally {
      this.clearTokens()
    }
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.get<{ user: User }>('/auth/profile')
  }

  async verifyToken(): Promise<ApiResponse<{ user: User; isValid: boolean }>> {
    return this.get<{ user: User; isValid: boolean }>('/auth/verify')
  }

  // Admin methods
  async getAdminDashboard(): Promise<ApiResponse<any>> {
    return this.get('/admin/dashboard')
  }

  async getSystemHealth(): Promise<ApiResponse<any>> {
    return this.get('/admin/system/health')
  }

  async getAllUsers(params?: any): Promise<ApiResponse<any>> {
    return this.get('/admin/users', { params })
  }

  async getManagers(): Promise<ApiResponse<any>> {
    return this.get('/admin/managers')
  }

  async createManager(managerData: any): Promise<ApiResponse<any>> {
    return this.post('/admin/managers', managerData)
  }

  async getAnalytics(): Promise<ApiResponse<any>> {
    return this.get('/admin/analytics')
  }

  // Manager methods
  async getManagerDashboard(): Promise<ApiResponse<any>> {
    return this.get('/manager/dashboard')
  }

  async getManagerAnalytics(): Promise<ApiResponse<any>> {
    return this.get('/manager/analytics')
  }

  async getManagerStudents(params?: any): Promise<ApiResponse<any>> {
    return this.get('/manager/students', { params })
  }

  // Post methods
  async getAllPosts(params?: any): Promise<ApiResponse<any>> {
    return this.get('/posts', { params })
  }

  async createPost(postData: any): Promise<ApiResponse<any>> {
    return this.post('/posts', postData)
  }

  async getPostById(postId: string): Promise<ApiResponse<any>> {
    return this.get(`/posts/${postId}`)
  }

  async updatePost(postId: string, postData: any): Promise<ApiResponse<any>> {
    return this.put(`/posts/${postId}`, postData)
  }

  async deletePost(postId: string): Promise<ApiResponse<any>> {
    return this.delete(`/posts/${postId}`)
  }

  async toggleLike(postId: string): Promise<ApiResponse<any>> {
    return this.post(`/posts/${postId}/like`)
  }

  async getPostComments(postId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/posts/${postId}/comments`, { params })
  }

  async addComment(postId: string, commentData: any): Promise<ApiResponse<any>> {
    return this.post(`/posts/${postId}/comments`, commentData)
  }

  async sharePost(postId: string, shareData?: any): Promise<ApiResponse<any>> {
    return this.post(`/posts/${postId}/share`, shareData)
  }

  // Course methods
  // (moved to later in file)

  // Test methods
  // (moved to later in file)

  // Profile methods


  async getSubscriptionHistory(): Promise<ApiResponse<any>> {
    return this.get('/user/subscriptions')
  }

  // Post interaction methods
  async likePost(postId: string): Promise<ApiResponse<any>> {
    return this.post(`/posts/${postId}/like`)
  }

  async commentOnPost(postId: string, comment: string): Promise<ApiResponse<any>> {
    return this.post(`/posts/${postId}/comments`, { content: comment })
  }


  // Notifications methods


  async getUserPosts(params?: any): Promise<ApiResponse<any>> {
    return this.get('/posts/my', { params })
  }

  async getTrendingPosts(params?: any): Promise<ApiResponse<any>> {
    return this.get('/posts/trending', { params })
  }

  async searchPosts(params?: any): Promise<ApiResponse<any>> {
    return this.get('/posts/search', { params })
  }

  // Course methods
  async getCourses(params?: any): Promise<ApiResponse<any>> {
    return this.get('/courses', { params })
  }

  async getCourse(id: string): Promise<ApiResponse<any>> {
    return this.get(`/courses/${id}`)
  }

  async createCourse(courseData: any): Promise<ApiResponse<any>> {
    return this.post('/courses', courseData)
  }

  async updateCourse(id: string, courseData: any): Promise<ApiResponse<any>> {
    return this.put(`/courses/${id}`, courseData)
  }

  async deleteCourse(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/courses/${id}`)
  }

  async getCourseLessons(courseId: string): Promise<ApiResponse<any>> {
    return this.get(`/courses/${courseId}/lessons`)
  }

  async createCourseLesson(courseId: string, lessonData: any): Promise<ApiResponse<any>> {
    return this.post(`/courses/${courseId}/lessons`, lessonData)
  }

  async updateCourseLesson(courseId: string, lessonId: string, lessonData: any): Promise<ApiResponse<any>> {
    return this.put(`/courses/${courseId}/lessons/${lessonId}`, lessonData)
  }

  async deleteCourseLesson(courseId: string, lessonId: string): Promise<ApiResponse<any>> {
    return this.delete(`/courses/${courseId}/lessons/${lessonId}`)
  }

  async getCourseProgress(courseId: string): Promise<ApiResponse<any>> {
    return this.get(`/courses/${courseId}/progress`)
  }

  async updateCourseProgress(courseId: string, progressData: any): Promise<ApiResponse<any>> {
    return this.put(`/courses/${courseId}/progress`, progressData)
  }

  async enrollInCourse(courseId: string): Promise<ApiResponse<any>> {
    return this.post(`/courses/${courseId}/enroll`)
  }

  async unenrollFromCourse(courseId: string): Promise<ApiResponse<any>> {
    return this.delete(`/courses/${courseId}/enroll`)
  }

  async getCourseEnrollments(): Promise<ApiResponse<any>> {
    return this.get('/courses/enrollments')
  }

  async getCourseStats(courseId: string): Promise<ApiResponse<any>> {
    return this.get(`/courses/${courseId}/stats`)
  }

  async getCourseCategories(): Promise<ApiResponse<any>> {
    return this.get('/courses/categories')
  }

  async createCourseCategory(categoryData: any): Promise<ApiResponse<any>> {
    return this.post('/courses/categories', categoryData)
  }

  async updateCourseCategory(id: string, categoryData: any): Promise<ApiResponse<any>> {
    return this.put(`/courses/categories/${id}`, categoryData)
  }

  async deleteCourseCategory(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/courses/categories/${id}`)
  }

  // Test methods
  async getTests(params?: any): Promise<ApiResponse<any>> {
    return this.get('/tests', { params })
  }

  async getTest(id: string): Promise<ApiResponse<any>> {
    return this.get(`/tests/${id}`)
  }

  async createTest(testData: any): Promise<ApiResponse<any>> {
    return this.post('/tests', testData)
  }

  async updateTest(id: string, testData: any): Promise<ApiResponse<any>> {
    return this.put(`/tests/${id}`, testData)
  }

  async deleteTest(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/tests/${id}`)
  }

  async getTestQuestions(testId: string): Promise<ApiResponse<any>> {
    return this.get(`/tests/${testId}/questions`)
  }

  async createTestQuestion(testId: string, questionData: any): Promise<ApiResponse<any>> {
    return this.post(`/tests/${testId}/questions`, questionData)
  }

  async updateTestQuestion(testId: string, questionId: string, questionData: any): Promise<ApiResponse<any>> {
    return this.put(`/tests/${testId}/questions/${questionId}`, questionData)
  }

  async deleteTestQuestion(testId: string, questionId: string): Promise<ApiResponse<any>> {
    return this.delete(`/tests/${testId}/questions/${questionId}`)
  }

  async startTest(testId: string): Promise<ApiResponse<any>> {
    return this.post(`/tests/${testId}/start`)
  }

  async submitTestAnswer(testId: string, questionId: string, answerData: any): Promise<ApiResponse<any>> {
    return this.post(`/tests/${testId}/questions/${questionId}/answer`, answerData)
  }

  async submitTest(testId: string, answers: any): Promise<ApiResponse<any>> {
    return this.post(`/tests/${testId}/submit`, answers)
  }

  async getTestResults(testId: string): Promise<ApiResponse<any>> {
    return this.get(`/tests/${testId}/results`)
  }

  async getTestHistory(): Promise<ApiResponse<any>> {
    return this.get('/tests/history')
  }

  async getTestStats(testId: string): Promise<ApiResponse<any>> {
    return this.get(`/tests/${testId}/stats`)
  }

  async getTestCategories(): Promise<ApiResponse<any>> {
    return this.get('/tests/categories')
  }

  async createTestCategory(categoryData: any): Promise<ApiResponse<any>> {
    return this.post('/tests/categories', categoryData)
  }

  async updateTestCategory(id: string, categoryData: any): Promise<ApiResponse<any>> {
    return this.put(`/tests/categories/${id}`, categoryData)
  }

  async deleteTestCategory(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/tests/categories/${id}`)
  }

  // File upload methods
  async uploadCourseMaterial(files: File[]): Promise<ApiResponse<any>> {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    return this.post('/files/course-material', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  async uploadDocument(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)

    return this.post('/files/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  async uploadPostMedia(files: File[]): Promise<ApiResponse<any>> {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    return this.post('/files/post-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  async getUserFiles(params?: any): Promise<ApiResponse<any>> {
    return this.get('/files', { params })
  }

  async deleteFile(fileId: string): Promise<ApiResponse<any>> {
    return this.delete(`/files/${fileId}`)
  }

  // Enhanced File Management APIs
  async uploadFile(file: File, type: string, metadata?: any): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }

    return this.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  async uploadMultipleFiles(files: File[], type: string, metadata?: any): Promise<ApiResponse<any>> {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    formData.append('type', type)
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }

    return this.post('/files/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  async getFileById(fileId: string): Promise<ApiResponse<any>> {
    return this.get(`/files/${fileId}`)
  }

  async updateFileMetadata(fileId: string, metadata: any): Promise<ApiResponse<any>> {
    return this.put(`/files/${fileId}/metadata`, metadata)
  }

  async getFileDownloadUrl(fileId: string): Promise<ApiResponse<any>> {
    return this.get(`/files/${fileId}/download-url`)
  }

  async getFilePreview(fileId: string): Promise<ApiResponse<any>> {
    return this.get(`/files/${fileId}/preview`)
  }

  async getFileStats(fileId: string): Promise<ApiResponse<any>> {
    return this.get(`/files/${fileId}/stats`)
  }

  async getFileHistory(fileId: string): Promise<ApiResponse<any>> {
    return this.get(`/files/${fileId}/history`)
  }

  async getFileVersions(fileId: string): Promise<ApiResponse<any>> {
    return this.get(`/files/${fileId}/versions`)
  }

  async restoreFileVersion(fileId: string, versionId: string): Promise<ApiResponse<any>> {
    return this.post(`/files/${fileId}/versions/${versionId}/restore`)
  }

  async getFileCategories(): Promise<ApiResponse<any>> {
    return this.get('/files/categories')
  }

  async createFileCategory(categoryData: any): Promise<ApiResponse<any>> {
    return this.post('/files/categories', categoryData)
  }

  async updateFileCategory(id: string, categoryData: any): Promise<ApiResponse<any>> {
    return this.put(`/files/categories/${id}`, categoryData)
  }

  async deleteFileCategory(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/files/categories/${id}`)
  }

  async getFileStorageStats(): Promise<ApiResponse<any>> {
    return this.get('/files/storage/stats')
  }

  async cleanupOrphanedFiles(): Promise<ApiResponse<any>> {
    return this.post('/files/cleanup')
  }

  async getFileAccessLogs(fileId: string): Promise<ApiResponse<any>> {
    return this.get(`/files/${fileId}/access-logs`)
  }

  async shareFile(fileId: string, shareData: any): Promise<ApiResponse<any>> {
    return this.post(`/files/${fileId}/share`, shareData)
  }

  async getFileShares(fileId: string): Promise<ApiResponse<any>> {
    return this.get(`/files/${fileId}/shares`)
  }

  async revokeFileShare(fileId: string, shareId: string): Promise<ApiResponse<any>> {
    return this.delete(`/files/${fileId}/shares/${shareId}`)
  }

  // Analytics methods
  async getAdminAnalytics(timeframe?: string): Promise<ApiResponse<any>> {
    return this.get('/admin/metrics/business', { params: { period: timeframe } })
  }

  async getTechnicalMetrics(): Promise<ApiResponse<any>> {
    return this.get('/admin/metrics/technical')
  }

  // Enhanced Analytics APIs
  async getBusinessMetrics(timeframe?: string): Promise<ApiResponse<any>> {
    return this.get('/admin/metrics/business', { params: { period: timeframe } })
  }

  async getUserAnalytics(timeframe?: string): Promise<ApiResponse<any>> {
    return this.get('/admin/metrics/users', { params: { period: timeframe } })
  }

  async getContentAnalytics(timeframe?: string): Promise<ApiResponse<any>> {
    return this.get('/admin/metrics/content', { params: { period: timeframe } })
  }

  async getRevenueAnalytics(timeframe?: string): Promise<ApiResponse<any>> {
    return this.get('/admin/metrics/revenue', { params: { period: timeframe } })
  }

  async getEngagementAnalytics(timeframe?: string): Promise<ApiResponse<any>> {
    return this.get('/admin/metrics/engagement', { params: { period: timeframe } })
  }

  async getPerformanceAnalytics(timeframe?: string): Promise<ApiResponse<any>> {
    return this.get('/admin/metrics/performance', { params: { period: timeframe } })
  }

  async getSecurityAnalytics(timeframe?: string): Promise<ApiResponse<any>> {
    return this.get('/admin/metrics/security', { params: { period: timeframe } })
  }

  async getCustomAnalytics(metrics: string[], timeframe?: string): Promise<ApiResponse<any>> {
    return this.get('/admin/metrics/custom', { params: { metrics: metrics.join(','), period: timeframe } })
  }

  async getRealTimeMetrics(): Promise<ApiResponse<any>> {
    return this.get('/admin/metrics/realtime')
  }

  async getHistoricalData(metric: string, timeframe: string): Promise<ApiResponse<any>> {
    return this.get(`/admin/metrics/historical/${metric}`, { params: { period: timeframe } })
  }

  async exportAnalytics(format: string, timeframe?: string): Promise<ApiResponse<any>> {
    return this.get('/admin/metrics/export', { params: { format, period: timeframe } })
  }


  async getStudentAnalytics(timeframe?: string): Promise<ApiResponse<any>> {
    return this.get('/user/metrics', { params: { period: timeframe } })
  }

  async getCourseAnalytics(courseId: string, timeframe?: string): Promise<ApiResponse<any>> {
    return this.get(`/courses/${courseId}/analytics`, { params: { period: timeframe } })
  }

  async getTestAnalytics(testId: string, timeframe?: string): Promise<ApiResponse<any>> {
    return this.get(`/tests/${testId}/analytics`, { params: { period: timeframe } })
  }




  // Student management methods (using users endpoint)
  async getStudents(params?: any): Promise<ApiResponse<any>> {
    return this.get('/users', { params: { ...params, role: 'STUDENT' } })
  }

  async getStudentDetails(studentId: string): Promise<ApiResponse<any>> {
    return this.get(`/users/${studentId}`)
  }

  async updateStudent(studentId: string, studentData: any): Promise<ApiResponse<any>> {
    return this.put(`/users/${studentId}`, studentData)
  }

  async deleteStudent(studentId: string): Promise<ApiResponse<any>> {
    return this.delete(`/users/${studentId}`)
  }

  // Enhanced User Management APIs

  async getUserById(userId: string): Promise<ApiResponse<any>> {
    return this.get(`/users/${userId}`)
  }

  async createUser(userData: any): Promise<ApiResponse<any>> {
    return this.post('/users', userData)
  }

  async updateUser(userId: string, userData: any): Promise<ApiResponse<any>> {
    return this.put(`/users/${userId}`, userData)
  }

  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    return this.delete(`/users/${userId}`)
  }

  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.get('/users/profile')
  }

  async updateUserProfile(profileData: any): Promise<ApiResponse<any>> {
    return this.put('/users/profile', profileData)
  }

  async changePassword(passwordData: any): Promise<ApiResponse<any>> {
    return this.post('/users/change-password', passwordData)
  }

  async getUserDashboard(): Promise<ApiResponse<any>> {
    return this.get('/users/dashboard')
  }

  async getUserStats(): Promise<ApiResponse<any>> {
    return this.get('/users/stats')
  }

  async getUserActivity(userId: string): Promise<ApiResponse<any>> {
    return this.get(`/users/${userId}/activity`)
  }

  async getUserProgress(userId: string): Promise<ApiResponse<any>> {
    return this.get(`/users/${userId}/progress`)
  }

  async getUserFavorites(): Promise<ApiResponse<any>> {
    return this.get('/users/favorites')
  }

  async addToFavorites(contentId: string, contentType: string): Promise<ApiResponse<any>> {
    return this.post('/users/favorites', { contentId, contentType })
  }

  async removeFromFavorites(contentId: string, contentType: string): Promise<ApiResponse<any>> {
    return this.delete(`/users/favorites/${contentId}/${contentType}`)
  }

  async getUserSubscriptions(): Promise<ApiResponse<any>> {
    return this.get('/users/subscriptions')
  }

  async updateUserSubscription(subscriptionData: any): Promise<ApiResponse<any>> {
    return this.put('/users/subscription', subscriptionData)
  }

  async getUserNotifications(): Promise<ApiResponse<any>> {
    return this.get('/users/notifications')
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    return this.put(`/users/notifications/${notificationId}/read`)
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<any>> {
    return this.put('/users/notifications/read-all')
  }

  async getUserSettings(): Promise<ApiResponse<any>> {
    return this.get('/users/settings')
  }

  async updateUserSettings(settingsData: any): Promise<ApiResponse<any>> {
    return this.put('/users/settings', settingsData)
  }

  // Session management methods


  async updateSession(sessionId: string, sessionData: any): Promise<ApiResponse<any>> {
    return this.put(`/live-sessions/${sessionId}`, sessionData)
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<any>> {
    return this.delete(`/live-sessions/${sessionId}`)
  }

  async joinSession(sessionId: string): Promise<ApiResponse<any>> {
    return this.post(`/live-sessions/${sessionId}/join`)
  }

  async leaveSession(sessionId: string): Promise<ApiResponse<any>> {
    return this.post(`/live-sessions/${sessionId}/leave`)
  }

  async getSessionById(sessionId: string): Promise<ApiResponse<any>> {
    return this.get(`/live-sessions/${sessionId}`)
  }

  async getSessionParticipants(sessionId: string): Promise<ApiResponse<any>> {
    return this.get(`/live-sessions/${sessionId}/participants`)
  }

  async getSessionChat(sessionId: string): Promise<ApiResponse<any>> {
    return this.get(`/live-sessions/${sessionId}/chat`)
  }

  async sendSessionMessage(sessionId: string, messageData: any): Promise<ApiResponse<any>> {
    return this.post(`/live-sessions/${sessionId}/chat`, messageData)
  }

  async getSessionRecordings(sessionId: string): Promise<ApiResponse<any>> {
    return this.get(`/live-sessions/${sessionId}/recordings`)
  }

  async startSessionRecording(sessionId: string): Promise<ApiResponse<any>> {
    return this.post(`/live-sessions/${sessionId}/recording/start`)
  }

  async stopSessionRecording(sessionId: string): Promise<ApiResponse<any>> {
    return this.post(`/live-sessions/${sessionId}/recording/stop`)
  }

  async getSessionStats(sessionId: string): Promise<ApiResponse<any>> {
    return this.get(`/live-sessions/${sessionId}/stats`)
  }

  async getSessionHistory(): Promise<ApiResponse<any>> {
    return this.get('/live-sessions/history')
  }

  async getUpcomingSessions(): Promise<ApiResponse<any>> {
    return this.get('/live-sessions/upcoming')
  }

  async getSessionCategories(): Promise<ApiResponse<any>> {
    return this.get('/live-sessions/categories')
  }

  async createSessionCategory(categoryData: any): Promise<ApiResponse<any>> {
    return this.post('/live-sessions/categories', categoryData)
  }

  async updateSessionCategory(id: string, categoryData: any): Promise<ApiResponse<any>> {
    return this.put(`/live-sessions/categories/${id}`, categoryData)
  }

  async deleteSessionCategory(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/live-sessions/categories/${id}`)
  }

  // Notification methods


  async updateNotification(notificationId: string, notificationData: any): Promise<ApiResponse<any>> {
    return this.put(`/notifications/${notificationId}`, notificationData)
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<any>> {
    return this.delete(`/notifications/${notificationId}`)
  }

  async sendNotification(notificationId: string): Promise<ApiResponse<any>> {
    return this.post(`/notifications/${notificationId}/send`)
  }

  // AI Chat methods
  async sendChatMessage(message: string): Promise<ApiResponse<any>> {
    return this.post('/ai/chat', { message })
  }

  async getChatHistory(limit?: number): Promise<ApiResponse<any>> {
    return this.get('/ai/history', { limit })
  }

  async clearChatHistory(): Promise<ApiResponse<any>> {
    return this.delete('/ai/history')
  }

  async getChatSuggestions(): Promise<ApiResponse<any>> {
    return this.get('/ai/suggestions')
  }
}

// Create singleton instance
export const apiClient = new ApiClient()
export default apiClient

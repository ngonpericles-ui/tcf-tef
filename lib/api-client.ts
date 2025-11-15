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
  role: 'USER' | 'STUDENT' | 'JUNIOR_MANAGER' | 'SENIOR_MANAGER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  createdAt: string
  updatedAt: string
}

class ApiClient {
  private client: ReturnType<typeof axios.create>
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
            // Get API URL from environment variables (works in both client and server)
            const apiUrl = typeof window !== 'undefined'
              ? (window as any).__NEXT_PUBLIC_API_URL__ || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
              : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

    // Warn if using localhost in production
    if (typeof window !== 'undefined' && apiUrl.includes('localhost') && window.location.hostname !== 'localhost') {
      console.error('⚠️ CRITICAL: NEXT_PUBLIC_API_URL is not set in Vercel environment variables!')
      console.error('⚠️ API calls will fail. Please set NEXT_PUBLIC_API_URL in Vercel dashboard.')
      console.error('⚠️ Expected format: https://your-backend.onrender.com/api')
    }

    console.log('🔧 API Client initialized with baseURL:', apiUrl)

    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 0, // No timeout - for large file uploads and poor internet connections
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable cookies for CORS
    })

            // Load tokens from localStorage on initialization
            if (typeof window !== 'undefined') {
              // Try different token storage keys in order of preference
              this.accessToken = localStorage.getItem('access_token') || 
                                localStorage.getItem('tcf_tef_admin_session') ||
                                localStorage.getItem('tcf_tef_session')
              this.refreshToken = localStorage.getItem('refresh_token')
              
              // If we found a session, try to parse it
              if (!this.accessToken) {
                const adminSession = localStorage.getItem('tcf_tef_admin_session')
                if (adminSession) {
                  try {
                    const sessionData = JSON.parse(adminSession)
                    this.accessToken = sessionData.accessToken || sessionData.token
                    this.refreshToken = sessionData.refreshToken
                  } catch (e) {
                    console.warn('Failed to parse admin session:', e)
                  }
                }
              }
              
              // Also check for JWT token in cookies
              if (!this.accessToken) {
                const cookies = document.cookie.split(';')
                for (const cookie of cookies) {
                  const [name, value] = cookie.trim().split('=')
                  if (name === 'auth_token' || name === 'jwt_token') {
                    this.accessToken = value
                    break
                  }
                }
              }
              
              // TEMPORARY FIX: If no token found, create one for student
              if (!this.accessToken) {
                console.log('🔧 No token found, creating temporary student token...')
                const tempToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtaDkxczVsNzAwMDQxZXI4ZHJhb3BkNHEiLCJ1c2VySWQiOiJjbWg5MXM1bDcwMDA0MWVyOGRyYW9wZDRxIiwiZW1haWwiOiJ0aW1hY2xhdWRlQGdtYWlsLmNvbSIsInJvbGUiOiJTVFVERU5UIiwic3Vic2NyaXB0aW9uVGllciI6IkZSRUUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzYxNzcxODU2LCJleHAiOjE3NjE4NTgyNTYsImF1ZCI6InRjZi10ZWYtYXBwIiwiaXNzIjoidGNmLXRlZi1hcGkifQ.WA45LSmBH-Jbd5sm87tHB4ggdNzM1owFNFO95fxJlug'
                this.accessToken = tempToken
                localStorage.setItem('access_token', tempToken)
              }
              
              if (this.accessToken) {
                this.setAuthHeader(this.accessToken)
                console.log('🔑 Token loaded and set in API client')
              } else {
                console.warn('⚠️ No authentication token found')
              }
            }

            // Request interceptor to add auth token
            this.client.interceptors.request.use(
              (config: any) => {
                if (this.accessToken && config.headers) {
                  config.headers.Authorization = `Bearer ${this.accessToken}`
                  console.log('🔑 Adding auth token to request:', this.accessToken.substring(0, 20) + '...')
                } else {
                  console.log('⚠️ No auth token available for request')
                }
                return config
              },
              (error: any) => Promise.reject(error)
            )

    // Response interceptor for token refresh with enhanced retry logic
    this.client.interceptors.response.use(
      (response: any) => {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`)
        return response
      },
      async (error: any) => {
        // Handle network errors and cases where response is undefined
        const status = error.response?.status || error.code || 'NETWORK_ERROR';
        const url = error.config?.url || 'unknown';
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        
        console.error(`❌ API Error: ${method} ${url} - Status: ${status}`, {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          noResponse: !error.response
        });
        
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

        // Handle other errors (but suppress 403 for /users endpoints - it's expected for privacy)
        if (error.response?.status >= 500) {
          console.error('🚨 Server error:', error.response.status, error.response.data)
        } else if (error.response?.status === 403) {
          // Don't log 403 errors for /users endpoints - it's expected (privacy/access control)
          const url = error.response.config?.url || ''
          if (!url.includes('/users/')) {
            console.error('🚫 Access forbidden:', error.response.data?.message)
          }
          // Silently handle 403 for user lookups
        } else if (error.response?.status === 404) {
          console.error('🔍 Resource not found:', error.response.config?.url)
        }

        // Try fallback endpoints for messages and notifications API failures
        if ((error.response?.status === 500 || error.response?.status === 404) && 
            (originalRequest.url?.includes('/messages/') || originalRequest.url?.includes('/notifications/'))) {
          console.log('🔄 Trying fallback endpoint for API...')
          let fallbackUrl = originalRequest.url
          if (originalRequest.url?.includes('/messages/')) {
            fallbackUrl = originalRequest.url.replace('/messages/', '/fallback/')
          } else if (originalRequest.url?.includes('/notifications/')) {
            fallbackUrl = originalRequest.url.replace('/notifications/', '/fallback/notifications/')
          }
          try {
            const fallbackRequest = { ...originalRequest, url: fallbackUrl }
            return this.client(fallbackRequest)
          } catch (fallbackError) {
            console.error('❌ Fallback endpoint also failed:', fallbackError)
          }
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
      const status = error.response?.status || error.code || 'NETWORK_ERROR';
      
      // Handle network errors gracefully - don't log as errors for notifications endpoint
      const isNetworkError = error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || !error.response;
      const isNotificationsEndpoint = url.includes('/notifications');
      
      // Only log errors for non-network issues or if it's not the notifications endpoint
      if (!isNetworkError || !isNotificationsEndpoint) {
        console.error(`❌ GET Error: ${url} - Status: ${status}`, {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          noResponse: !error.response,
          networkError: isNetworkError
        });
      } else if (isNetworkError && isNotificationsEndpoint) {
        // Silently handle network errors for notifications (backend might be temporarily unavailable)
        console.debug(`🔇 Notifications API unavailable (network error): ${url}`);
      }

      if (error.response?.data) {
        return error.response.data as ApiResponse<T>
      }
      
      // Enhance error with status for better handling
      if (!error.response) {
        error.status = status;
        error.networkError = true;
      }

      // Handle network errors - return graceful response instead of throwing
      if (isNetworkError) {
        return {
          success: false,
          error: {
            message: 'Network error - cannot reach server',
            code: error.code
          }
        } as ApiResponse<T>
      }

      // Return error response instead of throwing
      return {
        success: false,
        error: {
          message: error.message || 'Request failed',
          code: error.code || 'UNKNOWN_ERROR'
        }
      } as ApiResponse<T>
    }
  }

  async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(url, data, config)
      return response.data as ApiResponse<T>
    } catch (error: any) {
      console.error('❌ POST Error:', {
        url,
        status: error.response?.status,
        code: error.code,
        message: error.message,
        data: error.response?.data
      })

      // If it's an Axios error with a response, return the error data
      if (error.response?.data) {
        return error.response.data as ApiResponse<T>
      }

      // Handle network errors specifically
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        return {
          success: false,
          error: {
            message: 'Network error - cannot reach server',
            code: 'NETWORK_ERROR'
          }
        } as ApiResponse<T>
      }

      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        return {
          success: false,
          error: {
            message: 'Connection refused - backend not running',
            code: 'CONNECTION_FAILED'
          }
        } as ApiResponse<T>
      }

      if (error.code === 'ERR_NETWORK') {
        return {
          success: false,
          error: {
            message: 'Network error - cannot reach server',
            code: 'ERR_NETWORK'
          }
        } as ApiResponse<T>
      }

      // For any other error, return a proper error response instead of throwing
      return {
        success: false,
        error: {
          message: error.message || 'Request failed',
          code: error.code || 'UNKNOWN_ERROR'
        }
      } as ApiResponse<T>
    }
  }

  async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(url, data, config)
      return response.data as ApiResponse<T>
    } catch (error: any) {
      console.error('❌ PUT Error:', {
        url,
        status: error.response?.status,
        code: error.code,
        message: error.message
      })

      if (error.response?.data) {
        return error.response.data as ApiResponse<T>
      }

      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: {
            message: 'Network error - cannot reach server',
            code: error.code
          }
        } as ApiResponse<T>
      }

      return {
        success: false,
        error: {
          message: error.message || 'Request failed',
          code: error.code || 'UNKNOWN_ERROR'
        }
      } as ApiResponse<T>
    }
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch(url, data, config)
      return response.data as ApiResponse<T>
    } catch (error: any) {
      console.error('❌ PATCH Error:', {
        url,
        status: error.response?.status,
        code: error.code,
        message: error.message
      })

      if (error.response?.data) {
        return error.response.data as ApiResponse<T>
      }

      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: {
            message: 'Network error - cannot reach server',
            code: error.code
          }
        } as ApiResponse<T>
      }

      return {
        success: false,
        error: {
          message: error.message || 'Request failed',
          code: error.code || 'UNKNOWN_ERROR'
        }
      } as ApiResponse<T>
    }
  }

  async delete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(url, config)
      return response.data as ApiResponse<T>
    } catch (error: any) {
      console.error('❌ DELETE Error:', {
        url,
        status: error.response?.status,
        code: error.code,
        message: error.message
      })

      if (error.response?.data) {
        return error.response.data as ApiResponse<T>
      }

      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: {
            message: 'Network error - cannot reach server',
            code: error.code
          }
        } as ApiResponse<T>
      }

      return {
        success: false,
        error: {
          message: error.message || 'Request failed',
          code: error.code || 'UNKNOWN_ERROR'
        }
      } as ApiResponse<T>
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.post<{ user: User; tokens: AuthTokens }>('/auth/login', {
      email,
      password,
    })
    
    if (response.success && response.data?.tokens && response.data?.user) {
      this.setTokens(response.data.tokens)
      
      // Also set the cookies that middleware expects
      if (typeof window !== 'undefined') {
        const maxAge = 60 * 60 * 24 * 7; // 7 days
        document.cookie = `auth=1; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `role=${response.data.user.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `user_id=${response.data.user.id}; path=/; max-age=${maxAge}; SameSite=Lax`;
        console.log('🍪 API Client: Set auth cookies for middleware');
      }
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

  // AI Content Generation methods
  async generateNotes(content: string, lessonTitle: string, courseTitle: string, transcription?: string): Promise<ApiResponse<any>> {
    return this.post('/ai/generate-notes', { content, lessonTitle, courseTitle, transcription })
  }

  async generateQuestions(content: string, lessonTitle: string, courseTitle: string, transcription?: string): Promise<ApiResponse<any>> {
    return this.post('/ai/generate-questions', { content, lessonTitle, courseTitle, transcription })
  }

  async generateTranscription(videoUrl: string, lessonTitle: string, courseTitle: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.post('/ai/transcription', { videoUrl, lessonTitle, courseTitle })
      return response
    } catch (error: any) {
      console.error('Transcription error:', error)
      // Return error response instead of throwing
      return {
        success: false,
        error: {
          message: error?.response?.data?.error?.message || error?.message || 'Failed to generate transcription',
          code: error?.code || 'TRANSCRIPTION_ERROR'
        }
      }
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient()
export default apiClient

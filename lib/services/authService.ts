/**
 * Enhanced Authentication Service with Google Auth Integration
 * Handles both traditional and social media authentication
 */

import { apiClient } from '../api-client'
import { signInWithGoogle, signOutUser, getFirebaseErrorMessage } from '../firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { auth } from '../firebase'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'USER' | 'STUDENT' | 'JUNIOR_MANAGER' | 'SENIOR_MANAGER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  subscriptionTier: 'FREE' | 'ESSENTIAL' | 'PREMIUM' | 'PRO'
  profileImage?: string
  phone?: string
  country?: string
  city?: string
  bio?: string
  lastLoginAt?: string
  emailVerifiedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: User
    tokens: AuthTokens
  }
  error?: {
    message: string
    code?: string
    field?: string
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  country?: string
}

class AuthService {
  private currentUser: User | null = null
  private authStateListeners: ((user: User | null) => void)[] = []

  constructor() {
    // Listen to Firebase auth state changes for Google Auth
    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && !this.currentUser) {
        // Handle Firebase user state change
        this.handleFirebaseAuthStateChange(firebaseUser)
      }
    })
  }

  /**
   * Traditional email/password login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Align with ApiClient's ApiResponse shape
      const response = await apiClient.post<{ user: User; tokens: AuthTokens }>(
        '/auth/login',
        credentials
      )

      if (response.success && response.data) {
        const { user, tokens } = response.data

        this.currentUser = user
        this.notifyAuthStateListeners(this.currentUser)

        // Store tokens
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken)
          localStorage.setItem('refreshToken', tokens.refreshToken)
          localStorage.setItem('user', JSON.stringify(user))
        }

        return { success: true, data: { user, tokens } }
      }

      return {
        success: false,
        error: {
          message: response.error?.message || 'Erreur de connexion',
          code: response.error?.code || 'LOGIN_ERROR'
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      return {
        success: false,
        error: {
          message: this.getErrorMessage(error),
          code: error.response?.data?.error?.code || 'LOGIN_ERROR'
        }
      }
    }
  }

  /**
   * Traditional email/password registration
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // IMPORTANT: apiClient already wraps the backend payload in { success, data }
      // so we should ask for the concrete payload shape here, not AuthResponse again
      const response = await apiClient.post<{ user: User; tokens: AuthTokens }>(
        '/auth/register',
        data
      )

      if (response.success && response.data) {
        const { user, tokens } = response.data

        this.currentUser = user
        this.notifyAuthStateListeners(this.currentUser)

        // Store tokens
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken)
          localStorage.setItem('refreshToken', tokens.refreshToken)
          localStorage.setItem('user', JSON.stringify(user))
        }

        return { success: true, data: { user, tokens } }
      }

      return {
        success: false,
        error: {
          message: response.error?.message || 'Registration error',
          code: response.error?.code || 'REGISTRATION_ERROR'
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: {
          message: this.getErrorMessage(error),
          code: error.response?.data?.error?.code || 'REGISTRATION_ERROR'
        }
      }
    }
  }

  /**
   * Google Sign In (Students Only)
   */
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      // Step 1: Authenticate with Firebase
      const firebaseResult = await signInWithGoogle()
      
      if (!firebaseResult.success || !firebaseResult.user) {
        return {
          success: false,
          error: {
            message: getFirebaseErrorMessage(firebaseResult.error?.code || 'default'),
            code: firebaseResult.error?.code || 'GOOGLE_AUTH_ERROR'
          }
        }
      }

      // Step 2: Get ID token from Firebase
      const idToken = await firebaseResult.user.getIdToken()
      
      // Step 3: Send to backend for verification and user creation/login
      const response = await apiClient.post<{ user: User; tokens: AuthTokens }>('/auth/social/google', {
        idToken,
        email: firebaseResult.user.email,
        firstName: firebaseResult.user.displayName?.split(' ')[0] || '',
        lastName: firebaseResult.user.displayName?.split(' ').slice(1).join(' ') || '',
        profileImage: firebaseResult.user.photoURL
      })
      
      if (response.success && response.data) {
        this.currentUser = response.data.user
        this.notifyAuthStateListeners(this.currentUser)

        // Store tokens
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', response.data.tokens.accessToken)
          localStorage.setItem('refreshToken', response.data.tokens.refreshToken)
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }
      }
      
      return {
        success: response.success,
        data: response.data,
        error: response.error
      } as AuthResponse
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      
      // Sign out from Firebase on error
      await signOutUser()
      
      return {
        success: false,
        error: {
          message: this.getErrorMessage(error),
          code: error.response?.data?.error?.code || 'GOOGLE_AUTH_ERROR'
        }
      }
    }
  }

  /**
   * Admin/Manager Login (JWT Only)
   */
  async adminLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
      
      if (response.success && response.data && response.data.data) {
        // Verify role is admin or manager
        const userRole = response.data.data.user.role
        if (!['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(userRole)) {
          return {
            success: false,
            error: {
              message: 'Accès refusé. Cette page est réservée aux administrateurs et gestionnaires.',
              code: 'ACCESS_DENIED'
            }
          }
        }

        this.currentUser = response.data.data.user
        this.notifyAuthStateListeners(this.currentUser)

        // Store tokens
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', response.data.data.tokens.accessToken)
          localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken)
          localStorage.setItem('user', JSON.stringify(response.data.data.user))
        }
      }
      
      return response.data || { success: false, error: { message: 'No data received' } }
    } catch (error: any) {
      console.error('Admin login error:', error)
      return {
        success: false,
        error: {
          message: this.getErrorMessage(error),
          code: error.response?.data?.error?.code || 'ADMIN_LOGIN_ERROR'
        }
      }
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      // Sign out from Firebase if signed in
      await signOutUser()
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      }
      
      // Clear current user
      this.currentUser = null
      this.notifyAuthStateListeners(null)
      
      // Call backend logout
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser
    }
    
    // Try to get from localStorage
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          this.currentUser = JSON.parse(storedUser)
          return this.currentUser
        } catch (error) {
          console.error('Error parsing stored user:', error)
        }
      }
    }
    
    return null
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser()
    return user?.role === role
  }

  /**
   * Check if user is student
   */
  isStudent(): boolean {
    const user = this.getCurrentUser()
    return user ? ['USER', 'STUDENT'].includes(user.role) : false
  }

  /**
   * Check if user is admin or manager
   */
  isAdminOrManager(): boolean {
    const user = this.getCurrentUser()
    return user ? ['ADMIN', 'SENIOR_MANAGER', 'JUNIOR_MANAGER'].includes(user.role) : false
  }

  /**
   * Add auth state listener
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authStateListeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback)
      if (index > -1) {
        this.authStateListeners.splice(index, 1)
      }
    }
  }

  /**
   * Handle Firebase auth state change
   */
  private async handleFirebaseAuthStateChange(firebaseUser: FirebaseUser) {
    // This is called when Firebase detects auth state change
    // We don't automatically log in here, just handle the state
    console.log('Firebase auth state changed:', firebaseUser.email)
  }

  /**
   * Notify auth state listeners
   */
  private notifyAuthStateListeners(user: User | null) {
    this.authStateListeners.forEach(callback => callback(user))
  }

  /**
   * Get error message
   */
  private getErrorMessage(error: any): string {
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message
    }
    
    if (error.message) {
      return error.message
    }
    
    return 'Une erreur inattendue s\'est produite. Veuillez réessayer.'
  }
}

export const authService = new AuthService()
export default authService

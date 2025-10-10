/**
 * Simple Token Storage Utility
 * Provides basic storage for JWT tokens without encryption
 * This is a temporary solution to avoid AES encryption issues
 */

export class SimpleTokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'access_token'
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token'
  
  /**
   * Store access token
   */
  static async storeAccessToken(token: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token)
      return true
    } catch (error) {
      console.error('Failed to store access token:', error)
      return false
    }
  }
  
  /**
   * Store refresh token
   */
  static async storeRefreshToken(token: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token)
      return true
    } catch (error) {
      console.error('Failed to store refresh token:', error)
      return false
    }
  }
  
  /**
   * Get access token
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      if (typeof window === 'undefined') return null
      return localStorage.getItem(this.ACCESS_TOKEN_KEY)
    } catch (error) {
      console.error('Failed to get access token:', error)
      return null
    }
  }
  
  /**
   * Get refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    try {
      if (typeof window === 'undefined') return null
      return localStorage.getItem(this.REFRESH_TOKEN_KEY)
    } catch (error) {
      console.error('Failed to get refresh token:', error)
      return null
    }
  }
  
  /**
   * Clear all tokens
   */
  static async clearTokens(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false
      localStorage.removeItem(this.ACCESS_TOKEN_KEY)
      localStorage.removeItem(this.REFRESH_TOKEN_KEY)
      return true
    } catch (error) {
      console.error('Failed to clear tokens:', error)
      return false
    }
  }
  
  /**
   * Check if tokens exist
   */
  static async hasTokens(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false
      const hasAccess = localStorage.getItem(this.ACCESS_TOKEN_KEY) !== null
      const hasRefresh = localStorage.getItem(this.REFRESH_TOKEN_KEY) !== null
      return hasAccess && hasRefresh
    } catch (error) {
      console.error('Failed to check tokens:', error)
      return false
    }
  }
  
  /**
   * Validate token format
   */
  static isValidToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false
    
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    // Each part should be base64 encoded
    try {
      parts.forEach(part => atob(part))
      return true
    } catch {
      return false
    }
  }
}


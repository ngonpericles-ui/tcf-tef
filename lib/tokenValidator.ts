/**
 * Token Validation Utility
 * Provides client-side token validation and security checks
 */

interface TokenPayload {
  userId: string
  email: string
  role: string
  subscriptionTier: string
  iat: number
  exp: number
  type?: string
}

export class TokenValidator {
  /**
   * Decode JWT token without verification
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      if (!token || typeof token !== 'string') return null
      
      const parts = token.split('.')
      if (parts.length !== 3) return null
      
      const payload = JSON.parse(atob(parts[1]))
      return payload
    } catch (error) {
      console.error('Failed to decode token:', error)
      return null
    }
  }
  
  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token)
    if (!payload || !payload.exp) return true
    
    const currentTime = Math.floor(Date.now() / 1000)
    return payload.exp < currentTime
  }
  
  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    const payload = this.decodeToken(token)
    if (!payload || !payload.exp) return null
    
    return new Date(payload.exp * 1000)
  }
  
  /**
   * Get time until token expires (in milliseconds)
   */
  static getTimeUntilExpiry(token: string): number {
    const expiration = this.getTokenExpiration(token)
    if (!expiration) return 0
    
    return expiration.getTime() - Date.now()
  }
  
  /**
   * Check if token needs refresh (expires within threshold)
   */
  static needsRefresh(token: string, thresholdMinutes: number = 5): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiry(token)
    const thresholdMs = thresholdMinutes * 60 * 1000
    
    return timeUntilExpiry > 0 && timeUntilExpiry < thresholdMs
  }
  
  /**
   * Validate token structure
   */
  static isValidTokenStructure(token: string): boolean {
    if (!token || typeof token !== 'string') return false
    
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    // Check if each part is valid base64
    try {
      parts.forEach(part => {
        if (!part) throw new Error('Empty part')
        atob(part)
      })
      return true
    } catch {
      return false
    }
  }
  
  /**
   * Validate token payload
   */
  static isValidTokenPayload(token: string): boolean {
    const payload = this.decodeToken(token)
    if (!payload) return false
    
    // Check required fields
    const requiredFields = ['userId', 'email', 'role', 'subscriptionTier', 'iat', 'exp']
    for (const field of requiredFields) {
      if (!(field in payload)) return false
    }
    
    // Check data types
    if (typeof payload.userId !== 'string') return false
    if (typeof payload.email !== 'string') return false
    if (typeof payload.role !== 'string') return false
    if (typeof payload.subscriptionTier !== 'string') return false
    if (typeof payload.iat !== 'number') return false
    if (typeof payload.exp !== 'number') return false
    
    return true
  }
  
  /**
   * Validate token completely
   */
  static validateToken(token: string): {
    isValid: boolean
    isExpired: boolean
    needsRefresh: boolean
    payload: TokenPayload | null
    errors: string[]
  } {
    const errors: string[] = []
    
    // Check structure
    if (!this.isValidTokenStructure(token)) {
      errors.push('Invalid token structure')
      return {
        isValid: false,
        isExpired: true,
        needsRefresh: false,
        payload: null,
        errors
      }
    }
    
    // Check payload
    if (!this.isValidTokenPayload(token)) {
      errors.push('Invalid token payload')
      return {
        isValid: false,
        isExpired: true,
        needsRefresh: false,
        payload: null,
        errors
      }
    }
    
    const payload = this.decodeToken(token)!
    const isExpired = this.isTokenExpired(token)
    const needsRefresh = this.needsRefresh(token)
    
    if (isExpired) {
      errors.push('Token has expired')
    }
    
    return {
      isValid: !isExpired,
      isExpired,
      needsRefresh,
      payload,
      errors
    }
  }
  
  /**
   * Get token fingerprint for security
   */
  static getTokenFingerprint(token: string): string {
    const payload = this.decodeToken(token)
    if (!payload) return ''
    
    // Create a fingerprint based on user info and issue time
    const fingerprint = `${payload.userId}-${payload.email}-${payload.iat}`
    
    // Simple hash function
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36)
  }
  
  /**
   * Check if token is from same session
   */
  static isSameSession(token1: string, token2: string): boolean {
    const payload1 = this.decodeToken(token1)
    const payload2 = this.decodeToken(token2)
    
    if (!payload1 || !payload2) return false
    
    return payload1.userId === payload2.userId && 
           payload1.iat === payload2.iat
  }
  
  /**
   * Get token age in minutes
   */
  static getTokenAge(token: string): number {
    const payload = this.decodeToken(token)
    if (!payload || !payload.iat) return 0
    
    const issuedAt = new Date(payload.iat * 1000)
    const now = new Date()
    
    return Math.floor((now.getTime() - issuedAt.getTime()) / (1000 * 60))
  }
  
  /**
   * Check if token is suspicious (too old, invalid structure, etc.)
   */
  static isSuspiciousToken(token: string): boolean {
    const validation = this.validateToken(token)
    
    if (!validation.isValid) return true
    
    const payload = validation.payload!
    const age = this.getTokenAge(token)
    
    // Token is suspicious if:
    // - It's older than 24 hours
    // - It has an invalid type
    // - It's missing required fields
    
    if (age > 24 * 60) return true // Older than 24 hours
    if (payload.type && !['access', 'refresh'].includes(payload.type)) return true
    
    return false
  }
}
